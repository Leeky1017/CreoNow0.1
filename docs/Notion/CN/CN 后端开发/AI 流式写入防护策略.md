# AI 流式写入防护策略

> Source: Notion local DB page `4197d1f3-de86-48ab-a9f5-4e7409a12110`

> 🛡️

针对"AI 机枪式输出 vs 人类节奏存储"的架构矛盾，为 CN 后端设计 AI 流式写入防护体系。确保 AI 大规模生成内容时主进程不假死、数据不损坏、中断可回滚。

> ⚠️

关键取舍：本页只管后端职责。 渲染侧的 RAF 节流、虚拟化渲染、延迟后处理属于前端优化。后端只负责：Chunk Batching、事务合并、背压信号、AbortController 联动。

---

## 1. Notion 的教训

| 问题 | 根因 | 后果 | CN 是否已存在 |
| --- | --- | --- | --- |
| SQLite 被瞬间淹没 | 每个 Block 触发独立 SQLite 写事务，高频写入阻塞 event loop | 主进程假死，用户操作无响应 | ⚠️ 潜在风险 — 当前 file:document:save 是逐次同步写入 |
| IPC 通道拥堵 | Token-by-Token 高频推送无节流，IPC 消息队列爆满 | 渲染进程 OOM | ✅ 已有防护 — pushBackpressure.ts 的 chunk 可丢弃策略 |
| 一致性冲突 | AI 中断时本地已写入脏数据，修复不一致时触发损坏检测 | 数据库强制冻结 | ⚠️ 潜在风险 — AI 中断后无回滚机制 |
| React 渲染树瞬间重建 | 批量 Block 挂载耗尽 Renderer 算力 | 渲染进程白屏 | 前端侧问题，不在本文档范围 |

---

## 2. 防护架构总览

```
graph LR
    subgraph LLM["上游 LLM"]
        S["SSE stream<br>token-by-token"]
    end

    subgraph Main["Main Process"]
        A["aiService<br>readSse()"] -->|"raw tokens"| B["ChunkBatcher<br>100ms / 10 tokens"]
        B -->|"batched chunks"| C["webContents.send<br>（批量推送）"]
        B -->|"batched content"| D["WriteQueue<br>（写入队列）"]
    end

    subgraph Data["DataProcess"]
        D -->|"postMessage"| E["TransactionBatcher<br>（事务合并）"]
        E -->|"single transaction"| F["SQLite<br>WAL mode"]
    end

    subgraph Renderer["Renderer"]
        C --> G["UI 批量更新"]
    end

    D -->|"背压信号"| A
    G -->|"ai:skill:cancel"| A

    style B fill:#e3f2fd,stroke:#1976D2
    style E fill:#e8f5e9,stroke:#4CAF50
    style D fill:#fff3e0,stroke:#FF9800
```

四道防线：

| 防线 | 位置 | 机制 | 解决的问题 |
| --- | --- | --- | --- |
| ① Chunk Batching | Main — aiService | 时间窗口 + 数量阈值合并推送 | IPC 通道拥堵 |
| ② Transaction Batching | DataProcess | 一次 AI 生成周期 = 一个 SQLite 事务 | SQLite 被瞬间淹没 |
| ③ Write Backpressure | Main ↔ DataProcess | 队列深度超限 → 暂停 LLM 消费 | 写入队列无限膨胀 |
| ④ Abort + Rollback | 全链路 | 取消 → fetch abort + 事务回滚 | 一致性冲突 |

---

## 3. Chunk Batching — IPC 推送合并

### 3.1 设计

```
raw tokens:  t1 t2 t3 t4 t5 t6 t7 t8 t9 t10 t11 ...
             |________100ms_________|  |________100ms_________|
batched:     [t1..t10]                  [t11..t20]
```

合并规则：

- 时间窗口：100ms（可配置）

- 数量阈值：10 tokens（可配置）

- 任一条件满足即触发 flush

- 用户取消信号立即丢弃缓冲区

### 3.2 实现

```
// ── services/ai/chunkBatcher.ts ─────────────────────

interface ChunkBatcherOptions {
  flushIntervalMs: number;   // 默认 100
  maxBatchSize: number;      // 默认 10
  onFlush: (chunks: AiStreamChunk[]) => void;
  onAbort: () => void;
}

class ChunkBatcher {
  private buffer: AiStreamChunk[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;
  private aborted = false;

  constructor(private readonly opts: ChunkBatcherOptions) {}

  /** 接收单个 token chunk */
  push(chunk: AiStreamChunk): void {
    if (this.aborted) return;

    this.buffer.push(chunk);

    if (this.buffer.length >= this.opts.maxBatchSize) {
      this.flush();
    } else if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), this.opts.flushIntervalMs);
    }
  }

  /** 强制 flush 缓冲区 */
  flush(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.buffer.length === 0) return;

    const batch = this.buffer;
    this.buffer = [];
    this.opts.onFlush(batch);
  }

  /** 取消 — 丢弃缓冲区 */
  abort(): void {
    this.aborted = true;
    this.buffer = [];
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.opts.onAbort();
  }

  /** 流结束 — flush 残余 + 清理 */
  end(): void {
    this.flush();
  }
}
```

### 3.3 与 pushBackpressure.ts 的整合

| 组件 | 职责 | 关系 |
| --- | --- | --- |
| ChunkBatcher | token 级别的时间/数量合并 | 输出批量 chunk → 传给 pushBackpressure |
| pushBackpressure.ts | IPC 推送级别的背压控制（chunk 可丢弃，控制事件必达） | 接收批量 chunk → webContents.send() |

```
graph LR
    A["SSE token"] --> B["ChunkBatcher<br>合并 10 tokens / 100ms"]
    B --> C["pushBackpressure<br>chunk 可丢弃"]
    C --> D["webContents.send<br>批量推送到 Renderer"]

    style B fill:#e3f2fd,stroke:#1976D2
    style C fill:#fff3e0,stroke:#FF9800
```

---

## 4. Transaction Batching — SQLite 写入批量化

### 4.1 核心原则

> 🔑

一次完整的 AI 生成周期（ai:skill:run → stream 结束）= 一个 SQLite 事务。 中间状态不 commit，只在最终成功时一次性 commit。中断时整体 rollback。

### 4.2 事务生命周期

```
sequenceDiagram
    participant M as Main
    participant DP as DataProcess
    participant DB as SQLite

    M->>DP: beginAiWriteTransaction(docId)
    DP->>DB: BEGIN IMMEDIATE

    loop AI streaming
        M->>DP: batchWrite(blocks[])
        DP->>DB: INSERT/UPDATE (within txn)
    end

    alt 正常完成
        M->>DP: commitAiWriteTransaction()
        DP->>DB: COMMIT
        DP->>M: { ok: true }
    else 用户取消 / 错误
        M->>DP: rollbackAiWriteTransaction()
        DP->>DB: ROLLBACK
        DP->>M: { ok: true, rolledBack: true }
    end
```

### 4.3 DataProcess 侧实现

```
// ── dataProcess/aiTransactionManager.ts ─────────────

class AiTransactionManager {
  private activeTransactions = new Map<string, {
    db: Database;
    startTime: number;
    writeCount: number;
  }>();

  /** 开始 AI 写入事务 */
  begin(transactionId: string, db: Database): void {
    if (this.activeTransactions.has(transactionId)) {
      throw new Error(`Transaction ${transactionId} already active`);
    }

    db.exec('BEGIN IMMEDIATE');
    this.activeTransactions.set(transactionId, {
      db,
      startTime: Date.now(),
      writeCount: 0,
    });
  }

  /** 批量写入（在事务内） */
  batchWrite(transactionId: string, operations: WriteOp[]): void {
    const txn = this.activeTransactions.get(transactionId);
    if (!txn) throw new Error(`No active transaction: ${transactionId}`);

    for (const op of operations) {
      this.executeWrite(txn.db, op);
      txn.writeCount++;
    }
  }

  /** 提交 */
  commit(transactionId: string): { writeCount: number; durationMs: number } {
    const txn = this.activeTransactions.get(transactionId);
    if (!txn) throw new Error(`No active transaction: ${transactionId}`);

    txn.db.exec('COMMIT');
    const result = {
      writeCount: txn.writeCount,
      durationMs: Date.now() - txn.startTime,
    };
    this.activeTransactions.delete(transactionId);
    return result;
  }

  /** 回滚 */
  rollback(transactionId: string): void {
    const txn = this.activeTransactions.get(transactionId);
    if (!txn) return; // 幂等

    try {
      txn.db.exec('ROLLBACK');
    } catch {
      // ROLLBACK 失败通常是因为事务已经自动回滚
    }
    this.activeTransactions.delete(transactionId);
  }

  /** 超时保护：清理所有超过 5 分钟的事务 */
  cleanupStale(): void {
    const MAX_AGE_MS = 5 * 60_000;
    const now = Date.now();

    for (const [id, txn] of this.activeTransactions) {
      if (now - txn.startTime > MAX_AGE_MS) {
        log.warn(`[AiTxn] stale transaction ${id}, rolling back`);
        this.rollback(id);
      }
    }
  }
}
```

### 4.4 性能对比预估

| 场景 | 当前（逐次写入） | 优化后（事务合并） | 提升 |
| --- | --- | --- | --- |
| AI 生成 100 blocks | 100 次 BEGIN  • COMMIT（~200ms） | 1 次 BEGIN IMMEDIATE  • 100 次 INSERT  • 1 次 COMMIT（~5ms） | ~40x |
| AI 生成 500 blocks | 500 次事务（~1s，阻塞主线程） | 1 次事务（~20ms） | ~50x |
| AI 生成 1000 blocks | 1000 次事务（~2s，主进程假死） | 1 次事务（~40ms） | ~50x |

> 💡

性能提升核心来源：消除重复的 fsync。WAL 模式下每次 COMMIT 都会触发 fsync，合并为一次事务意味着只有一次 fsync。

---

## 5. Write Backpressure — 写入队列背压

### 5.1 背压机制

```
graph LR
    A["Main: AI chunk"] --> B["WriteQueue"]
    B -->|"depth < HIGH_WATER"| C["正常写入"]
    B -->|"depth ≥ HIGH_WATER"| D["发送背压信号"]
    D --> E["Main: 暂停消费 SSE"]
    B -->|"depth < LOW_WATER"| F["解除背压信号"]
    F --> G["Main: 恢复消费 SSE"]

    style D fill:#ffebee,stroke:#f44336
    style F fill:#e8f5e9,stroke:#4CAF50
```

### 5.2 水位参数

| 参数 | 默认值 | 含义 |
| --- | --- | --- |
| HIGH_WATER_MARK | 50 | 队列深度超过此值 → 发送背压信号 |
| LOW_WATER_MARK | 10 | 队列深度低于此值 → 解除背压信号 |
| MAX_QUEUE_SIZE | 200 | 队列满 → 开始丢弃非关键 chunk（保留控制事件） |

### 5.3 实现

```
// ── services/ai/writeBackpressure.ts ────────────────

class WriteBackpressure {
  private isPaused = false;

  constructor(
    private readonly queue: WriteQueue,
    private readonly onPause: () => void,
    private readonly onResume: () => void,
    private readonly HIGH_WATER = 50,
    private readonly LOW_WATER = 10,
  ) {
    queue.on('enqueue', () => this.checkPressure());
    queue.on('dequeue', () => this.checkRelease());
  }

  private checkPressure(): void {
    if (!this.isPaused && this.queue.depth >= this.HIGH_WATER) {
      this.isPaused = true;
      this.onPause();   // → 暂停 SSE 消费
    }
  }

  private checkRelease(): void {
    if (this.isPaused && this.queue.depth <= this.LOW_WATER) {
      this.isPaused = false;
      this.onResume();  // → 恢复 SSE 消费
    }
  }
}
```

### 5.4 SSE 消费暂停机制

```
// ── services/ai/aiService.ts（改造）─────────────────

async function* readSseWithBackpressure(
  response: Response,
  signal: AbortSignal,
  backpressure: WriteBackpressure,
): AsyncGenerator<string> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  while (true) {
    // 背压时等待
    while (backpressure.isPaused && !signal.aborted) {
      await new Promise((r) => setTimeout(r, 50));
    }

    if (signal.aborted) break;

    const { done, value } = await reader.read();
    if (done) break;

    yield decoder.decode(value, { stream: true });
  }
}
```

---

## 6. AbortController 全链路联动

### 6.1 取消链路

```
sequenceDiagram
    participant R as Renderer
    participant M as Main
    participant LLM as LLM API
    participant DP as DataProcess

    R->>M: ai:skill:cancel(streamId)

    par 并行取消
        M->>LLM: fetchController.abort()
        Note right of LLM: SSE 连接断开
    and
        M->>M: chunkBatcher.abort()
        Note right of M: 丢弃缓冲区
    and
        M->>DP: rollbackAiWriteTransaction(txnId)
        Note right of DP: ROLLBACK<br>撤销所有未提交写入
    end

    DP->>M: { ok: true, rolledBack: true }
    M->>R: SKILL_STREAM_DONE_CHANNEL<br>{ reason: 'cancelled', rolledBack: true }
```

### 6.2 取消管理器

```
// ── services/ai/streamCancelManager.ts ──────────────

interface ActiveStream {
  streamId: string;
  fetchController: AbortController;
  chunkBatcher: ChunkBatcher;
  transactionId: string;
  startedAt: number;
}

class StreamCancelManager {
  private active = new BoundedMap<string, ActiveStream>({
    maxSize: 20,
    defaultTtlMs: 10 * 60_000,  // 10 min 兜底
  });

  register(stream: ActiveStream): void {
    this.active.set(stream.streamId, stream);
  }

  async cancel(streamId: string): Promise<CancelResult> {
    const stream = this.active.get(streamId);
    if (!stream) return { found: false };

    // ① 停止 LLM 请求
    stream.fetchController.abort();

    // ② 丢弃 chunk 缓冲区
    stream.chunkBatcher.abort();

    // ③ 回滚数据库事务
    await dataProcess.rollbackAiWriteTransaction(stream.transactionId);

    this.active.delete(streamId);
    return { found: true, rolledBack: true };
  }

  /** 正常完成时清理 */
  complete(streamId: string): void {
    this.active.delete(streamId);
  }
}
```

### 6.3 各种中断场景

| 中断场景 | 触发方式 | 结果 |
| --- | --- | --- |
| 用户主动取消 | ai:skill:cancel IPC | abort + rollback + 通知前端 |
| 网络中断 | fetch AbortError / TypeError | 自动触发 rollback + 通知前端 |
| IPC 超时（30s） | IpcTimeoutError in runtime-validation | abort + rollback（通过 AbortController 注入） |
| LLM 返回错误 | SSE stream error event | rollback + 通知前端错误详情 |
| App 退出 | before-quit → gracefulShutdown() | rollback 所有活跃事务（AiTransactionManager.cleanupStale()） |

---

## 7. 数据一致性保护

### 7.1 原子写入保证

```
正常流程：
  BEGIN IMMEDIATE → N × INSERT/UPDATE → COMMIT
  → 全部可见，一致

中断流程：
  BEGIN IMMEDIATE → K × INSERT/UPDATE → ROLLBACK
  → 全部不可见，回到生成前状态
```

无 Notion 式"损坏检测 → 强制冻结"：因为原子事务保证了不会出现半写状态。

### 7.2 并发编辑冲突保护

AI 生成期间用户可能同时手动编辑同一文档：

```
// ── dataProcess/conflictGuard.ts ────────────────────

/**
 * 写入前检查文档版本号，防止并发冲突。
 * AI 事务开始时记录文档版本号，
 * commit 前再次检查，如果版本号已被用户编辑更新，则拒绝 commit。
 */
function commitWithVersionCheck(
  db: Database,
  docId: string,
  expectedVersion: number,
): CommitResult {
  const current = db.prepare(
    'SELECT version FROM documents WHERE document_id = ?',
  ).get(docId) as { version: number } | undefined;

  if (!current || current.version !== expectedVersion) {
    db.exec('ROLLBACK');
    return {
      ok: false,
      error: 'VERSION_CONFLICT',
      message: 'Document was modified during AI generation',
    };
  }

  db.exec('COMMIT');
  return { ok: true };
}
```

### 7.3 前端侧协作

| 后端提供 | 前端配合 |
| --- | --- |
| Chunk Batching 后的批量 IPC push | 按批量更新 UI，不需逐 token 重渲染 |
| 背压信号（ai:stream:backpressure event） | 降低渲染频率或显示"生成中"占位 |
| SKILL_STREAM_DONE_CHANNEL / abort 事件 | 触发语法高亮、LaTeX 等后处理 |
| 事务回滚通知（{ rolledBack: true }） | 恢复到生成前的文档状态 |
| 版本冲突通知（VERSION_CONFLICT） | 提示用户 AI 生成被丢弃，手动编辑已保留 |

---

## 8. ai:skill:run 完整流程（防护后）

```
sequenceDiagram
    participant R as Renderer
    participant M as Main
    participant CB as ChunkBatcher
    participant BP as Backpressure
    participant LLM as LLM API
    participant DP as DataProcess

    R->>M: ai:skill:run(skillId, docId)

    Note over M: ① 初始化
    M->>M: create AbortController
    M->>M: create ChunkBatcher(100ms, 10)
    M->>DP: beginAiWriteTransaction(txnId, docId)
    M->>M: register StreamCancelManager

    Note over M: ② Context 装配
    M->>M: assembleContext(skillId)

    Note over M: ③ LLM 调用
    M->>LLM: fetch(prompt, { signal })

    loop SSE streaming
        LLM->>M: token chunk
        M->>CB: push(chunk)

        alt batch ready
            CB->>R: webContents.send(batchedChunks)
            CB->>DP: batchWrite(blocks)
        end

        alt backpressure
            BP->>M: pause signal
            M->>M: wait for resume
        end
    end

    alt 正常完成
        M->>CB: end()
        CB->>R: final batch
        M->>DP: commitWithVersionCheck(txnId)
        M->>R: SKILL_STREAM_DONE_CHANNEL
    else 取消 / 错误
        M->>CB: abort()
        M->>DP: rollback(txnId)
        M->>R: SKILL_STREAM_DONE_CHANNEL { cancelled/error }
    end
```

---

## 9. 配置参数总表

| 参数 | 默认值 | 位置 | 可调节 |
| --- | --- | --- | --- |
| Chunk flush 间隔 | 100ms | ChunkBatcher | ✅ 构造时传入 |
| Chunk batch 大小 | 10 tokens | ChunkBatcher | ✅ 构造时传入 |
| Write queue HIGH_WATER | 50 | WriteBackpressure | ✅ 构造时传入 |
| Write queue LOW_WATER | 10 | WriteBackpressure | ✅ 构造时传入 |
| Write queue MAX_SIZE | 200 | WriteBackpressure | ✅ 构造时传入 |
| 事务超时 | 5 min | AiTransactionManager | ✅ 构造时传入 |
| 活跃流 TTL | 10 min | StreamCancelManager | ✅ BoundedMap 参数 |

---

## 10. TDD 策略

| 测试类别 | 测试内容 | 关键断言 |
| --- | --- | --- |
| ChunkBatcher contract | 时间合并 + 数量合并 + abort | 100ms 内 push 20 tokens → flush 2 次；abort 后 buffer 清空 |
| Transaction batching | 模拟 500 blocks 写入 | 只产生 1 个 SQLite transaction；commit 后所有 blocks 可查 |
| Rollback 正确性 | 写入 200 blocks → rollback | 数据库状态回到生成前；文档版本号不变 |
| Backpressure | 队列满时信号发出 + 消化后解除 | onPause / onResume 在正确水位触发 |
| AbortController 全链路 | 取消 → fetch abort + rollback + stream end | 三个动作全部触发；无残留事务 |
| 版本冲突 | AI 生成中用户修改文档 → commit 被拒绝 | 返回 VERSION_CONFLICT；事务 rollback |
| 压力测试 | AI 连续生成 1000 blocks | 主进程 event loop 延迟 < 50ms；内存不泄漏 |
| Stale 清理 | 事务超过 5min 未完成 | 自动 rollback；日志记录 |

---

## 11. 实施路径

| 阶段 | 内容 | 预计工作量 |
| --- | --- | --- |
| Phase 1 | ChunkBatcher 实现 + 测试 + 接入 aiService | 0.5 天 |
| Phase 2 | AiTransactionManager 实现 + 测试（DataProcess 侧） | 0.5 天 |
| Phase 3 | StreamCancelManager  • abort 全链路联动 | 0.5 天 |
| Phase 4 | WriteBackpressure  • SSE 暂停机制 | 0.5 天 |
| Phase 5 | 版本冲突保护 + 前端协议对接 | 0.5 天 |
| Phase 6 | 压力测试 + 参数调优 | 0.5 天 |

> ✅

独立可启动。 Phase 1（ChunkBatcher）不依赖任何其他模块。Phase 2（TransactionBatcher）依赖 DataProcess，可在 UtilityProcess 完成后对接。

---

## 12. 相关页面

- ‣ — DataProcess 写入通道

- ‣ — pushBackpressure.ts 现有背压机制

- ‣ — StreamCancelManager 的 BoundedMap

- ‣ — 优雅停机时的活跃事务清理
