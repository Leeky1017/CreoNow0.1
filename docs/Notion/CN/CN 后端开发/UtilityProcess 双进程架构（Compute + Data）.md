# UtilityProcess 双进程架构（Compute + Data）

> Source: Notion local DB page `0631d5a5-04a1-4d9a-891b-cb221cc57865`

> ⚡

核心基础设施 — 所有后续优化的前置依赖。

为 CN 主进程引入 2 个固定用途的 UtilityProcess，将所有 CPU/IO 密集任务从主线程卸载到独立进程，主进程退化为纯调度层 + 轻量只读数据层。

---

## 1. 现状问题

当前 src/main/ 目录中 零 Worker / 零 UtilityProcess，所有任务跑在同一个 JS 线程：

| 阻塞源 | 具体操作 | 预估耗时 | 问题编号 |
| --- | --- | --- | --- |
| ONNX 推理 | onnxruntime-node 同步 encode，autosave 时触发 | 50–200ms/次 | P0 #1 |
| FTS 重建 | 全量 rebuildIndex 跑在主线程 | 200–500ms | P0 #2 |
| KG 全量拉图 | getAllNodes()  • getAllEdges() 全表扫描 | 100–300ms（万级节点） | P0 #3 |
| KG BFS | getRelatedNodes O(n²) 遍历 | 与节点数平方成正比 | P0 #5 |
| RAG rerank | FTS + embedding 推理串行同步 | 100–400ms | P1 #11 |
| 项目删除/复制 | rmSync / cpSync 大量同步 FS | 取决于项目大小 | P1 #7 |

核心矛盾：以上操作全部串行地占据 Event Loop，任何一项运行时，IPC 请求（包括渲染进程的 UI 响应）都会被阻塞。

---

## 2. 架构总图

```
graph TB
    subgraph MainProcess["Main Process — 纯调度层"]
        Router["IPC Router<br>请求分发 + AbortController"]
        Lifecycle["Lifecycle Manager<br>App/Project/Session 三层"]
        SQLiteRO_Main["SQLite 只读连接<br>轻量读: settings / metadata"]
    end

    subgraph CP["ComputeProcess — CPU 密集"]
        ONNX["ONNX Runtime<br>embedding encode"]
        KGCTE["KG 图遍历<br>递归 CTE"]
        FTS["FTS 全文搜索<br>rebuild / query"]
        SQLiteRO_CP["SQLite 只读连接<br>重量读: KG / FTS / embedding"]
    end

    subgraph DP["DataProcess — IO 密集 + 唯一写入者"]
        SQLiteRW["SQLite 读写连接<br>所有 INSERT / UPDATE / DELETE"]
        FSSync["同步 FS 操作<br>项目删除 / 复制 / Skill 文件"]
        TxMerge["AI 流式写入<br>Chunk Batching + 事务合并"]
    end

    Router -->|"postMessage(task)"| CP
    Router -->|"postMessage(task)"| DP
    CP -->|"result / error"| Router
    DP -->|"result / error"| Router

    style MainProcess fill:#e8f4f8,stroke:#2196F3
    style CP fill:#fff3e0,stroke:#FF9800
    style DP fill:#e8f5e9,stroke:#4CAF50
```

---

## 3. 选型决策：UtilityProcess > Worker Thread

> 🔑

结论：使用 Electron 的 utilityProcess.fork()，不使用 Node.js worker_threads。

| 维度 | UtilityProcess | Worker Thread |
| --- | --- | --- |
| Native Addon | ✅ 独立 V8 实例，better-sqlite3 / onnxruntime-node 直接加载 | ⚠️ native addon 需显式支持 worker_threads，better-sqlite3 可用但有坑 |
| 崩溃隔离 | ✅ 独立进程，崩溃不影响主进程 | ❌ 同一进程，未捕获异常会拖垮整个 Node 进程 |
| 内存隔离 | ✅ 独立堆，OOM 不影响主进程 | ❌ 共享地址空间，内存泄漏互相影响 |
| Electron 集成 | ✅ 一等公民，有 MessagePort、parentPort | ⚠️ 需手动管理，非 Electron 推荐方案 |
| 调试 | ⚠️ 需单独 attach debugger | ✅ 同一进程，调试简单 |

调试劣势可接受：通过在 fork() 时传入 --inspect=PORT 参数解决，开发模式自动启用。

---

## 4. 两个进程的职责划分

> ⚠️

关键取舍：不做进程池。 CN 是单用户桌面应用，不需要进程池调度、负载均衡、动态扩缩容。2 个固定进程 + 各自内部的串行任务队列，足以覆盖所有场景。池化调度的复杂度在单用户场景下 ROI 极低。

### 4.1 ComputeProcess — CPU 密集型

入驻条件：消耗 CPU 时间 > 16ms（一帧），会导致 Event Loop 饥饿的操作。

| 任务类型 | 当前实现 | 迁移后 |
| --- | --- | --- |
| ONNX embedding encode | onnxruntime-node 在主线程同步推理 | ComputeProcess 内推理，主线程 await submit() |
| KG 图遍历 | JS 层 BFS getAllNodes()  • 内存遍历 | 递归 CTE 跑在 ComputeProcess 的只读 SQLite 连接上 |
| FTS 重建 / 查询 | rebuildIndex 在主线程全量扫描 | ComputeProcess 持有 FTS 索引，增量更新 |
| RAG rerank | FTS query + ONNX 重排序同步串行 | ComputeProcess 内完成全部 retrieve + rerank 流水线 |

内部调度：串行任务队列。理由：ONNX 推理和 KG 遍历都是 CPU 密集型，并行跑反而因为线程竞争更慢。用户不会同时触发搜索和 embedding。

### 4.2 DataProcess — IO 密集型 + 唯一写入者

入驻条件：涉及 SQLite 写操作、同步文件系统操作、或需要事务合并的批量写入。

| 任务类型 | 当前实现 | 迁移后 |
| --- | --- | --- |
| SQLite 所有写操作 | 主线程直接 db.prepare().run() | DataProcess 持有唯一读写连接，主线程发消息写入 |
| AI 流式写入 | 每个 token 逐条 INSERT（机枪式写入） | DataProcess 内 Chunk Batching + 事务合并（详见 🛡️ AI 流式写入防护策略） |
| 项目删除 / 复制 | rmSync / cpSync 阻塞主线程 | DataProcess 异步执行，主线程只发指令 |
| Skill 文件 I/O | readdirSync / readFileSync / writeFileSync | DataProcess 执行，结果通过 IPC 返回 |
| embedding upsert | 主线程写入 embedding 向量表 | DataProcess 批量 upsert，与推理解耦 |

内部调度：

- 写操作：串行队列，保证事务一致性，避免 WAL checkpoint 竞争

- FS 操作：独立队列，与 SQLite 写操作互不阻塞（不同资源）

---

## 5. SQLite 读写分离（核心架构决策）

> 🔑

原则：一写多读。DataProcess 是唯一写入者，Main + ComputeProcess 只读。

SQLite WAL 模式天然支持一写多读并发，三个连接互不阻塞。

### 5.1 连接分布

```
graph LR
    subgraph Main["Main Process"]
        M_DB["better-sqlite3<br>readonly: true<br>PRAGMA query_only = ON"]
    end
    subgraph Compute["ComputeProcess"]
        C_DB["better-sqlite3<br>readonly: true<br>PRAGMA query_only = ON"]
    end
    subgraph Data["DataProcess"]
        D_DB["better-sqlite3<br>read-write<br>唯一写入者"]
    end
    DB[(SQLite WAL<br>project.db)]
    M_DB -.->|RO| DB
    C_DB -.->|RO| DB
    D_DB ==>|RW| DB

    style Data fill:#e8f5e9,stroke:#4CAF50
```

### 5.2 各进程访问规则

| 进程 | 可执行的 SQL | 典型查询 | 连接打开方式 |
| --- | --- | --- | --- |
| Main | SELECT only | getProjectById、getCurrentProjectId、settings、document metadata | new Database(path, { readonly: true }) |
| ComputeProcess | SELECT only（含复杂 CTE） | KG 递归遍历、FTS match、embedding 向量检索 | new Database(path, { readonly: true }) |
| DataProcess | SELECT / INSERT / UPDATE / DELETE | 所有写操作、事务合并、WAL checkpoint | new Database(path) — 默认读写 |

### 5.3 WAL 配置（DataProcess 负责）

```
-- DataProcess 启动时执行
PRAGMA journal_mode = WAL;
PRAGMA wal_autocheckpoint = 1000;   -- 每 1000 页自动 checkpoint
PRAGMA busy_timeout = 5000;          -- 写冲突等待 5s（理论上不会发生，作为安全网）
PRAGMA synchronous = NORMAL;         -- WAL 模式下 NORMAL 足够安全
PRAGMA cache_size = -64000;          -- 64MB page cache
PRAGMA mmap_size = 268435456;        -- 256MB mmap

-- 只读连接（Main / ComputeProcess）
PRAGMA query_only = ON;
PRAGMA cache_size = -16000;          -- 16MB（读连接无需大缓存）
PRAGMA mmap_size = 268435456;        -- 256MB mmap（共享同一映射）
```

### 5.4 迁移策略：写操作收口

当前代码中所有直接调用 db.prepare(...).run() 的写操作需要逐步收口到 DataProcess：

1. 第一步：在现有 DAO 层创建 WriteProxy 接口，所有写操作调用 WriteProxy.execute(sql, params)

1. 第二步：WriteProxy 初始实现 = 直接执行（行为不变，验证接口正确性）

1. 第三步：WriteProxy 替换为 IPC 实现 = 消息发给 DataProcess 执行

1. TDD：每一步都有 contract test 保证行为一致

---

## 6. BackgroundTaskRunner 抽象

这是两个 UtilityProcess 共用的核心抽象，封装了「提交任务 → 等待结果 → 超时 / 取消 / 崩溃恢复」的完整语义。

### 6.1 接口定义

```
interface TaskOptions {
  taskId: string;
  type: string;           // 'onnx-encode' | 'kg-traverse' | 'fts-rebuild' | 'sql-write' | ...
  payload: unknown;
  timeoutMs?: number;     // 默认 30_000
  signal?: AbortSignal;   // 外部取消
}

interface TaskResult<T> {
  taskId: string;
  status: 'completed' | 'error' | 'timeout' | 'aborted' | 'crashed';
  data?: T;
  error?: { message: string; stack?: string };
  durationMs: number;
}

interface BackgroundTaskRunner {
  /** 提交任务，返回 Promise 等结果 */
  submit<T>(options: TaskOptions): Promise<TaskResult<T>>;

  /** 主动取消一个正在执行的任务 */
  abort(taskId: string): void;

  /** 崩溃回调 */
  onCrash(callback: (exitCode: number) => void): void;

  /** 优雅关闭：等待正在执行的任务完成（或超时），然后 kill 进程 */
  shutdown(gracePeriodMs?: number): Promise<void>;
}
```

### 6.2 五状态机

```
stateDiagram-v2
    [*] --> Submitted: submit()
    Submitted --> Running: 进程取出执行
    Running --> Completed: 正常返回
    Running --> TimedOut: 超过 timeoutMs
    Running --> Aborted: abort() 或 AbortSignal
    Running --> Crashed: 进程异常退出
    TimedOut --> [*]: reject(TimeoutError)
    Aborted --> [*]: reject(AbortError)
    Crashed --> [*]: reject(CrashError) + 触发重启
    Completed --> [*]: resolve(result)
```

### 6.3 内部实现要点

```
class UtilityProcessTaskRunner implements BackgroundTaskRunner {
  private process: Electron.UtilityProcess | null = null;
  private pending = new Map<string, PendingTask>();
  private queue: TaskOptions[] = [];          // 串行队列
  private currentTask: string | null = null;

  async submit<T>(options: TaskOptions): Promise<TaskResult<T>> {
    return new Promise((resolve, reject) => {
      const pending: PendingTask = {
        options,
        resolve,
        reject,
        timer: setTimeout(() => this.handleTimeout(options.taskId), options.timeoutMs ?? 30_000),
      };

      // AbortSignal 联动
      if (options.signal) {
        options.signal.addEventListener('abort', () => this.abort(options.taskId), { once: true });
      }

      this.pending.set(options.taskId, pending);
      this.queue.push(options);
      this.drain();
    });
  }

  private drain(): void {
    if (this.currentTask || this.queue.length === 0) return;
    const next = this.queue.shift()!;
    this.currentTask = next.taskId;
    this.process!.postMessage({ type: 'task', taskId: next.taskId, taskType: next.type, payload: next.payload });
  }

  private handleMessage(msg: { type: string; taskId: string; result?: unknown; error?: unknown }): void {
    if (msg.type === 'result') {
      const p = this.pending.get(msg.taskId);
      if (p) {
        clearTimeout(p.timer);
        this.pending.delete(msg.taskId);
        p.resolve({ taskId: msg.taskId, status: 'completed', data: msg.result, durationMs: /*...*/ });
      }
      this.currentTask = null;
      this.drain(); // 处理队列中下一个
    }
  }

  // ... handleTimeout, abort, onCrash, shutdown 省略（见下文）
}
```

---

## 7. 进程间通信协议

### 7.1 消息格式

```
// Main → UtilityProcess
type TaskMessage = {
  type: 'task';
  taskId: string;
  taskType: string;
  payload: unknown;
};

type AbortMessage = {
  type: 'abort';
  taskId: string;
};

type ShutdownMessage = {
  type: 'shutdown';
  gracePeriodMs: number;
};

// UtilityProcess → Main
type ResultMessage = {
  type: 'result';
  taskId: string;
  result: unknown;
  durationMs: number;
};

type ErrorMessage = {
  type: 'error';
  taskId: string;
  error: { message: string; stack?: string; code?: string };
};

type ReadyMessage = {
  type: 'ready';
  processType: 'compute' | 'data';
  pid: number;
};
```

### 7.2 通信流程（正常路径）

```
sequenceDiagram
    participant M as Main Process
    participant CP as ComputeProcess

    Note over CP: fork() 启动
    CP->>M: { type: 'ready', processType: 'compute', pid }
    M->>CP: { type: 'task', taskId: 'embed-1', taskType: 'onnx-encode', payload: { text } }
    Note over CP: ONNX 推理中...
    CP->>M: { type: 'result', taskId: 'embed-1', result: { vector }, durationMs: 85 }
```

### 7.3 通信流程（取消路径）

```
sequenceDiagram
    participant M as Main Process
    participant CP as ComputeProcess

    M->>CP: { type: 'task', taskId: 'kg-1', taskType: 'kg-traverse', payload }
    Note over CP: CTE 执行中...
    Note over M: 用户切换了项目
    M->>CP: { type: 'abort', taskId: 'kg-1' }
    Note over CP: 检测到 abort，中断当前操作
    CP->>M: { type: 'error', taskId: 'kg-1', error: { message: 'Aborted', code: 'ABORT' } }
```

---

## 8. 崩溃恢复策略

> 🛡️

原则：任何一个 UtilityProcess 崩溃，不能导致应用不可用。主进程必须能自动恢复。

### 8.1 崩溃检测

```
// 主进程中
utilityProcess.on('exit', (code) => {
  if (code !== 0) {
    logger.error(`[${processType}] crashed with code ${code}`);
    this.handleCrash(code);
  }
});
```

### 8.2 恢复流程

```
graph TD
    A["检测到 exit(code≠0)"] --> B["reject 所有 pending tasks<br>status: 'crashed'"]
    B --> C{"重启次数 < 3？"}
    C -->|是| D["延迟 500ms 重启进程"]
    C -->|否| E["进入降级模式<br>主线程兜底执行"]
    D --> F["等待 ready 消息"]
    F --> G["重新打开 SQLite 连接"]
    G --> H["从队列中恢复等待中的任务"]
    E --> I["记录到 telemetry<br>提示用户重启应用"]
```

### 8.3 降级模式

当 UtilityProcess 连续崩溃 3 次，进入降级模式：

- ComputeProcess 降级：ONNX / KG / FTS 回退到主线程同步执行（回到当前行为），记录警告

- DataProcess 降级：主进程临时打开读写连接直接写入（回到当前行为），记录警告

- 降级模式下，UI 显示一个不阻塞的提示：「部分功能在后台进程中运行异常，重启应用可恢复最佳性能」

---

## 9. 进程生命周期管理

### 9.1 启动时序

```
sequenceDiagram
    participant App as app.on('ready')
    participant M as Main Process
    participant CP as ComputeProcess
    participant DP as DataProcess

    App->>M: 应用启动
    par 并行 fork
        M->>CP: utilityProcess.fork('compute-process.js')
        M->>DP: utilityProcess.fork('data-process.js')
    end
    CP->>M: { type: 'ready' }
    DP->>M: { type: 'ready' }
    Note over M: 两个进程 ready 后，才开始处理 IPC 请求
    M->>M: 开始接收渲染进程的 IPC 调用
```

### 9.2 关闭时序

```
sequenceDiagram
    participant App as app.on('before-quit')
    participant M as Main Process
    participant CP as ComputeProcess
    participant DP as DataProcess

    App->>M: before-quit
    M->>M: 停止接收新 IPC 请求
    par 并行 shutdown
        M->>CP: { type: 'shutdown', gracePeriodMs: 5000 }
        M->>DP: { type: 'shutdown', gracePeriodMs: 5000 }
    end
    Note over CP: 完成当前任务 → 关闭 SQLite → exit(0)
    Note over DP: 完成当前写入 → flush WAL → 关闭 SQLite → exit(0)
    CP->>M: exit(0)
    DP->>M: exit(0)
    Note over M: 关闭主进程只读连接
    M->>App: 退出
```

### 9.3 项目切换时序

项目切换时，两个子进程需要切换 SQLite 数据库文件：

1. Main 发送 { type: 'switch-project', projectPath } 给两个子进程

1. 子进程：关闭当前 SQLite 连接 → 打开新项目的 DB 文件 → 回复 { type: 'ready' }

1. Main 收到两个 ready 后，才通知渲染进程项目切换完成

---

## 10. 文件结构规划

```
src/main/
├── process/
│   ├── ProcessManager.ts          // 管理 ComputeProcess + DataProcess 的生命周期
│   ├── BackgroundTaskRunner.ts    // 核心抽象接口 + UtilityProcessTaskRunner 实现
│   ├── WriteProxy.ts              // SQLite 写操作代理（收口所有写入到 DataProcess）
│   ├── compute-process.ts         // ComputeProcess 入口（被 fork）
│   └── data-process.ts            // DataProcess 入口（被 fork）
├── process/handlers/
│   ├── compute/
│   │   ├── onnx-handler.ts        // ONNX 推理任务
│   │   ├── kg-handler.ts          // KG CTE 遍历任务
│   │   └── fts-handler.ts         // FTS 重建 / 查询任务
│   └── data/
│       ├── sql-write-handler.ts   // 通用 SQL 写入
│       ├── tx-merge-handler.ts    // AI 流式写入事务合并
│       └── fs-handler.ts          // 文件系统操作
```

---

## 11. 迁移路径（TDD 驱动，4 个阶段）

> 🗺️

原则：每个阶段都是可独立部署的、行为不变的重构。TDD 保证每一步不引入回归。

### Phase 1 — 基础设施（无行为变化）

- [ ] 实现 BackgroundTaskRunner 接口 + UtilityProcessTaskRunner

- [ ] 实现 ProcessManager（fork / ready / shutdown / crash recovery）

- [ ] 编写 BackgroundTaskRunner 五状态机 contract test（用 in-process mock 跑通）

- [ ] 编写 ProcessManager 集成测试（fork → ready → shutdown → exit(0)）

- [ ] 编写崩溃恢复测试（fork → kill → restart → ready）

### Phase 2 — ComputeProcess 上线

- [ ] 创建 compute-process.ts 入口，注册 task handlers

- [ ] 迁移 ONNX 推理到 onnx-handler.ts

- [ ] 迁移 FTS 重建 / 查询到 fts-handler.ts

- [ ] 对应的 submit() 调用替换原有同步调用

- [ ] contract test 替换为真实 UtilityProcess 实现

- [ ] 性能基准测试：主线程阻塞时间 < 5ms（仅 postMessage 开销）

### Phase 3 — DataProcess 上线 + SQLite 读写分离

- [ ] 创建 data-process.ts 入口

- [ ] 实现 WriteProxy 接口 + IPC 写入实现

- [ ] 主进程 SQLite 连接切换为 readonly: true

- [ ] 逐个替换 DAO 层写操作为 WriteProxy.execute()

- [ ] 集成测试：Main(RO) + ComputeProcess(RO) + DataProcess(RW) 并发无死锁

- [ ] AI 流式写入事务合并（详见 🛡️ AI 流式写入防护策略）

### Phase 4 — 项目切换联动

- [ ] 实现 switch-project 消息协议

- [ ] 三进程协调切换：Main 暂停接收 → 子进程切换 DB → 全员 ready → 恢复

- [ ] 集成测试：100 次连续项目切换无内存泄漏、无 DB 锁死

- [ ] 与 ♻️ 三层生命周期管理 对接（Session 级资源释放）

---

## 12. TDD 策略

| 测试类型 | 测试内容 | 阶段 |
| --- | --- | --- |
| Contract Test | BackgroundTaskRunner 五状态机：submit→result / submit→timeout / submit→abort / crash→restart / shutdown→drain | Phase 1 |
| Contract Test | WriteProxy：execute 语义等价性（直接执行 vs IPC 转发结果一致） | Phase 3 |
| Integration Test | ProcessManager：fork→ready→shutdown→exit(0) 全生命周期 | Phase 1 |
| Integration Test | 崩溃恢复：fork→kill(SIGKILL)→detect→restart→ready→retry pending | Phase 1 |
| Integration Test | SQLite 并发：3 连接同时读写无 SQLITE_BUSY 错误 | Phase 3 |
| Integration Test | 项目切换：switch-project→子进程切换 DB→ready→正常读写 | Phase 4 |
| Stress Test | ComputeProcess 崩溃 3 次 → 降级模式 → 主线程兜底执行 | Phase 1 |
| Performance Benchmark | ONNX encode 卸载后主线程阻塞 < 5ms | Phase 2 |
| Performance Benchmark | SQLite 写入延迟增量 < 10ms（IPC 开销） | Phase 3 |

---

## 13. 依赖关系

- 被依赖：🔮 KG 查询层重构 / 🧬 Embedding & RAG 优化 / 🎯 Skill 系统优化 / 🛡️ AI 流式写入防护策略

- 无前置依赖：可立即启动

- 协同：♻️ 三层生命周期管理（Phase 4 项目切换联动）
