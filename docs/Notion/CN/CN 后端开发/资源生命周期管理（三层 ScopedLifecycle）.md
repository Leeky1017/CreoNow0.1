# 资源生命周期管理（三层 ScopedLifecycle）

> Source: Notion local DB page `33bb09ff-a7d5-4f53-a44d-e503b02c1c40`

> ♻️

统一的三层资源生命周期管理机制，解决 CN 后端所有"只进不出"的内存泄漏与资源残留问题。三层是认知模型（App / Project / Session），不是三套注册中心——只有 Project 级需要框架化，Session 级各 service 自治。

---

## 1. 问题全景

### 1.1 审计发现的 7 个泄漏点

| 编号 | 问题 | 层级 | 泄漏机制 | 影响 |
| --- | --- | --- | --- | --- |
| P1 #12 | KG 识别会话级内存泄漏 | Project | kgRecognitionRuntime.sessions Map 只增不减 | 长期运行内存持续增长 |
| P1 #13 | 语义块索引内存无限膨胀 | Project | semanticChunkIndex 缓存无上限、无 LRU | 大文档项目 OOM 风险 |
| P1 #14 | AI 服务与 IPC 层无界 Map | Project | sessionTokenTotals / chatHistoryByProject 无清理 | 多项目切换后累积 |
| P1 #15 | Search/Replace 预览存储无 TTL | Project | previewStore Map 永驻 | 每次搜索预览都累积 |
| P1 #16 | IPC 超时幽灵执行 | Session | runWithTimeout timeout 后 handler 继续执行 | CPU 浪费 + 竞态风险 |
| P1 #17 | SkillScheduler 并发槽位泄漏 | Session | globalRunning 异常时不释放 | 技能执行被永久阻塞 |
| P1 #18 | Watcher 资源生命周期不闭合 | Project | 项目切换时 chokidar watcher 不 close() | 文件句柄泄漏 |

### 1.2 根因分析

```
graph LR
    A["根因：缺乏统一的<br>资源生命周期边界"] --> B["症状 1<br>无界 Map（×12）"]
    A --> C["症状 2<br>项目切换无 teardown"]
    A --> D["症状 3<br>IPC timeout 不联动 abort"]
    A --> E["症状 4<br>app 退出无优雅关闭"]

    B --> F["BoundedMap"]
    C --> G["ProjectLifecycle<br>注册中心"]
    D --> H["AbortController<br>注入 IPC 层"]
    E --> I["Graceful<br>Shutdown Chain"]

    style A fill:#ffebee,stroke:#f44336
    style F fill:#e8f5e9,stroke:#4CAF50
    style G fill:#e8f5e9,stroke:#4CAF50
    style H fill:#e8f5e9,stroke:#4CAF50
    style I fill:#e8f5e9,stroke:#4CAF50
```

---

## 2. 三层生命周期模型

> 🔑

关键取舍：三层概念，不过度框架化。 App 级、Project 级、Session 级各有不同的绑定/解绑时机。但 Session 级不需要做成通用框架——对 SkillScheduler 这类场景，在 service 内部加 timeout watchdog 就够了。三层是认知模型，不是三套注册中心。

| 生命周期 | 绑定事件 | 解绑事件 | 典型资源 | 管理方式 |
| --- | --- | --- | --- | --- |
| App 级 | app 启动 | app 退出（before-quit） | SQLite 连接、UtilityProcess、Logger | 统一 shutdown 链 |
| Project 级 | project:project:switch | 切换到另一项目 / app 退出 | KG session、Watcher、semanticChunkIndex、AI sessionTokens、previewStore | ProjectLifecycle 注册中心 |
| Session 级 | ai:skill:run / 单次操作开始 | 操作完成 / 取消 / 超时 | SkillScheduler 并发槽位、单次 AI streaming 的 AbortController | Service 内部 timeout watchdog |

---

## 3. ProjectLifecycle 注册中心

> 唯一需要框架化的层。 App 级用 shutdown 链即可，Session 级各 service 自治。

### 3.1 接口定义

```
// ── contracts/lifecycle.ts ──────────────────────────

/**
 * 任何与项目绑定的 service 实现此接口，
 * 注册到 ProjectLifecycle 后即可自动获得项目切换清理。
 */
interface ProjectScoped {
  /** 服务名称，用于日志和调试 */
  readonly name: string;

  /** 新项目绑定——初始化或预热 */
  onProjectBind(projectId: string): void | Promise<void>;

  /** 旧项目解绑——清理缓存、释放资源 */
  onProjectUnbind(projectId: string): void | Promise<void>;

  /** App 退出——最终清理 */
  onDestroy(): void | Promise<void>;
}
```

### 3.2 注册中心实现

```
// ── lifecycle/ProjectLifecycle.ts ───────────────────

class ProjectLifecycle {
  private readonly registry: ProjectScoped[] = [];
  private currentProjectId: string | null = null;

  register(service: ProjectScoped): void {
    this.registry.push(service);
    log.debug(`[Lifecycle] registered: ${service.name}`);
  }

  /**
   * 项目切换的完整流程
   * 严格顺序：unbind ALL → 数据库写入 → bind ALL
   */
  async switchProject(
    fromId: string | null,
    toId: string,
    db: Database,
  ): Promise<void> {
    // ① Unbind all (并行，每个有独立 timeout)
    if (fromId) {
      await Promise.allSettled(
        this.registry.map((s) =>
          withTimeout(s.onProjectUnbind(fromId), 3_000, s.name),
        ),
      );
    }

    // ② 数据库写入
    writeCurrentProjectId(db, toId);

    // ③ Bind all (并行)
    await Promise.allSettled(
      this.registry.map((s) =>
        withTimeout(s.onProjectBind(toId), 5_000, s.name),
      ),
    );

    this.currentProjectId = toId;
  }

  /** App 退出时调用 */
  async destroyAll(): Promise<void> {
    if (this.currentProjectId) {
      await this.switchProject(this.currentProjectId, '__SHUTDOWN__', db);
    }
    await Promise.allSettled(
      this.registry.map((s) =>
        withTimeout(s.onDestroy(), 3_000, s.name),
      ),
    );
  }
}

// 单例
export const projectLifecycle = new ProjectLifecycle();
```

### 3.3 需要注册的 Service 清单

| Service | onProjectUnbind 清理动作 | onProjectBind 预热动作 | 对应泄漏 |
| --- | --- | --- | --- |
| WatchService | watcher.close() → 释放文件句柄 | 按需启动（可选） | P1 #18 |
| KgRecognitionRuntime | sessions.delete(projectId) → 释放 Map 条目 | — | P1 #12 |
| SemanticChunkIndexService | chunkIndex.clear() → 释放向量缓存 | — | P1 #13 |
| AiService | abortAllStreams()  • sessionTokenTotals.clear() | — | P1 #14 |
| SearchReplaceService | previewStore.clear() | — | P1 #15 |
| ChatHistoryService | chatHistoryByProject.delete(projectId) | — | P1 #14 |
| ContextWatchService | stopAllWatchers(projectId) | — | P1 #18 |

### 3.4 注册时机

```
// ── bootstrap.ts ────────────────────────────────────

function bootstrapServices(db: Database) {
  // 创建 service 实例
  const watchService = new WatchService(db);
  const kgRuntime    = new KgRecognitionRuntime(db);
  const chunkIndex   = new SemanticChunkIndexService(db);
  const aiService    = new AiService(db);
  const searchReplace = new SearchReplaceService(db);
  const chatHistory  = new ChatHistoryService(db);

  // 统一注册
  [watchService, kgRuntime, chunkIndex, aiService, searchReplace, chatHistory]
    .forEach(s => projectLifecycle.register(s));

  return { watchService, kgRuntime, chunkIndex, aiService, searchReplace, chatHistory };
}
```

---

## 4. BoundedMap<K, V> — 替代所有无界 Map

### 4.1 设计要求

| 特性 | 说明 |
| --- | --- |
| LRU 淘汰 | 达到 maxSize 时淘汰最久未访问条目 |
| TTL 过期 | 每个条目有独立过期时间，get 时惰性检查 |
| 容量上限 | 构造时指定 maxSize，不允许无界增长 |
| Metrics hook | 命中率、驱逐次数、当前大小——方便后续调优 |
| 线程安全 | 单线程环境无需加锁（Electron 主进程） |

### 4.2 核心实现

```
// ── utils/BoundedMap.ts ─────────────────────────────

interface BoundedMapOptions {
  maxSize: number;
  defaultTtlMs?: number;          // 0 = 不过期
  onEvict?: (key: string, value: unknown) => void;
}

interface BoundedMapMetrics {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
  hitRate: number;
}

class BoundedMap<K extends string, V> {
  private readonly map = new Map<K, { value: V; expiresAt: number }>();
  private readonly opts: Required<BoundedMapOptions>;
  private hits = 0;
  private misses = 0;
  private evictions = 0;

  constructor(opts: BoundedMapOptions) {
    this.opts = {
      defaultTtlMs: 0,
      onEvict: () => {},
      ...opts,
    };
  }

  set(key: K, value: V, ttlMs?: number): void {
    // 已存在 → 删除旧条目（重新排序）
    if (this.map.has(key)) this.map.delete(key);

    // 容量检查 → LRU 淘汰（Map 迭代顺序 = 插入顺序）
    while (this.map.size >= this.opts.maxSize) {
      const oldest = this.map.keys().next().value!;
      const entry = this.map.get(oldest)!;
      this.map.delete(oldest);
      this.evictions++;
      this.opts.onEvict(oldest, entry.value);
    }

    const effectiveTtl = ttlMs ?? this.opts.defaultTtlMs;
    this.map.set(key, {
      value,
      expiresAt: effectiveTtl > 0 ? Date.now() + effectiveTtl : Infinity,
    });
  }

  get(key: K): V | undefined {
    const entry = this.map.get(key);
    if (!entry) { this.misses++; return undefined; }

    // TTL 过期检查
    if (Date.now() > entry.expiresAt) {
      this.map.delete(key);
      this.misses++;
      this.evictions++;
      this.opts.onEvict(key, entry.value);
      return undefined;
    }

    // 更新 LRU 位置（delete + re-insert）
    this.map.delete(key);
    this.map.set(key, entry);
    this.hits++;
    return entry.value;
  }

  clear(): void { this.map.clear(); }
  delete(key: K): boolean { return this.map.delete(key); }
  get size(): number { return this.map.size; }

  metrics(): BoundedMapMetrics {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      evictions: this.evictions,
      size: this.map.size,
      hitRate: total > 0 ? this.hits / total : 0,
    };
  }
}
```

### 4.3 无界 Map 替换清单（12 处）

| # | 当前无界 Map | 文件 | 推荐 maxSize | 推荐 TTL |
| --- | --- | --- | --- | --- |
| 1 | kgRecognitionRuntime.sessions | services/knowledgeGraph/runtime.ts | 50 | 30 min |
| 2 | semanticChunkIndex.cache | services/embedding/chunkIndex.ts | 500 | 10 min |
| 3 | aiService.sessionTokenTotals | services/ai/aiService.ts | 100 | 60 min |
| 4 | chatHistoryByProject | services/ai/chatHistory.ts | 20 | 无（项目级清理） |
| 5 | searchReplace.previewStore | services/search/searchReplace.ts | 20 | 5 min |
| 6 | contextAssembly.cache | services/context/assembly.ts | 50 | 5 min |
| 7 | memoryInjection.cache | services/memory/injection.ts | 100 | 10 min |
| 8 | skillRegistry.instanceCache | services/skill/registry.ts | 50 | 无（App 级） |
| 9 | exportService.tempFiles | services/export/export.ts | 10 | 10 min |
| 10 | constraintsPolicyCache | services/constraints/policy.ts | 100 | 15 min |
| 11 | ragContextCache | services/rag/context.ts | 50 | 5 min |
| 12 | judgeModelState | services/judge/judge.ts | 5 | 无（App 级） |

---

## 5. AbortController 注入 IPC Runtime 层

### 5.1 改造目标

```
IPC timeout → controller.abort() → handler 感知 signal → 提前退出
```

### 5.2 改造方案

```
// ── ipc/runtime-validation.ts（改造后）─────────────

function createValidatedHandler<C extends keyof IpcChannelSpec>(
  channel: C,
  handler: (
    payload: IpcRequest<C>,
    signal: AbortSignal,          // ← 新增
  ) => Promise<IpcInvokeResult<C>>,
) {
  return async (_event: IpcMainInvokeEvent, rawPayload: unknown) => {
    // ACL → Schema 校验 → ...

    const controller = new AbortController();
    const { signal } = controller;

    const timeoutMs = getChannelTimeout(channel); // 默认 30s

    const result = await Promise.race([
      handler(validated, signal),
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          controller.abort();           // ← 超时时 abort
          reject(new IpcTimeoutError(channel, timeoutMs));
        }, timeoutMs);
      }),
    ]);

    return { ok: true, data: result };
  };
}
```

### 5.3 Handler 侧适配

```
// ── 示例：knowledge:query:subgraph handler ──────────

async function handleSubgraphQuery(
  payload: SubgraphQueryRequest,
  signal: AbortSignal,                   // ← 接收 signal
): Promise<SubgraphQueryResult> {
  const nodes: KgNode[] = [];

  for (const entityId of payload.entityIds) {
    if (signal.aborted) throw new AbortError();   // ← 检查点

    const subgraph = await kgService.getSubgraph(entityId);
    nodes.push(...subgraph);
  }

  return { nodes };
}
```

### 5.4 UtilityProcess 联动

对于已卸载到 UtilityProcess 的任务，abort 信号通过 postMessage 传递：

```
// Main 侧
signal.addEventListener('abort', () => {
  utilityProcess.postMessage({ type: 'abort', taskId });
});

// UtilityProcess 侧
parentPort.on('message', (msg) => {
  if (msg.type === 'abort') {
    taskAbortControllers.get(msg.taskId)?.abort();
  }
});
```

---

## 6. Session 级：各 Service 自治

> 不框架化，不需要通用 SessionLifecycle 注册中心。

### 6.1 SkillScheduler 并发槽位保护

```
// ── services/skill/scheduler.ts ─────────────────────

class SkillScheduler {
  private globalRunning = 0;
  private readonly MAX_CONCURRENT = 3;
  private readonly TASK_TIMEOUT_MS = 120_000; // 2 min

  async runSkill(skillId: string, signal: AbortSignal): Promise<SkillResult> {
    if (this.globalRunning >= this.MAX_CONCURRENT) {
      throw new SkillBusyError();
    }

    this.globalRunning++;
    const timer = setTimeout(() => {
      // Completion timeout watchdog
      this.globalRunning = Math.max(0, this.globalRunning - 1);
      log.warn(`[Scheduler] force-released slot for skill ${skillId}`);
    }, this.TASK_TIMEOUT_MS);

    try {
      const result = await this.executeSkill(skillId, signal);
      return result;
    } finally {
      clearTimeout(timer);
      this.globalRunning = Math.max(0, this.globalRunning - 1);
    }
  }
}
```

关键点：

- finally 块确保正常/异常都释放槽位

- setTimeout watchdog 作为兜底——即使 finally 被跳过（进程级异常），2 分钟后也回收

- Math.max(0, ...) 防止 watchdog 和 finally 双重释放导致负数

### 6.2 AI Streaming AbortController

```
// ── services/ai/streaming.ts ────────────────────────

class AiStreamingSession {
  private controller: AbortController;

  constructor() {
    this.controller = new AbortController();
  }

  async stream(prompt: string): Promise<void> {
    const response = await fetch(llmEndpoint, {
      method: 'POST',
      body: JSON.stringify({ prompt }),
      signal: this.controller.signal,     // ← fetch 原生支持
    });
    // ...
  }

  cancel(): void {
    this.controller.abort();
  }
}
```

---

## 7. App 级 Graceful Shutdown 链

### 7.1 完整链路

```
graph TD
    A["before-quit 事件"] --> B["ProjectLifecycle<br>.destroyAll()"]
    B --> B1["unbindAll(currentProject)"]
    B --> B2["所有 service.onDestroy()"]
    B2 --> C["UtilityProcess<br>.destroyAll()"]
    C --> C1["postMessage({ type: 'shutdown' })"]
    C1 --> C2["等待 'exited' 事件<br>（timeout 3s）"]
    C2 --> D["db.close()"]
    D --> E["app.quit()"]

    F["超时兜底 5s"] -.->|"如果以上未完成"| G["process.exit(1)"]

    style A fill:#e3f2fd,stroke:#1976D2
    style G fill:#ffebee,stroke:#f44336
```

### 7.2 实现

```
// ── lifecycle/shutdown.ts ───────────────────────────

app.on('before-quit', async (event) => {
  event.preventDefault();

  const HARD_TIMEOUT = 5_000;
  const hardTimer = setTimeout(() => {
    log.error('[Shutdown] hard timeout — force exit');
    process.exit(1);
  }, HARD_TIMEOUT);

  try {
    // ① 项目级资源清理
    await projectLifecycle.destroyAll();

    // ② 子进程关闭
    await utilityProcessManager.destroyAll();

    // ③ 数据库关闭
    db.close();

    log.info('[Shutdown] graceful shutdown complete');
  } catch (err) {
    log.error('[Shutdown] error during shutdown', err);
  } finally {
    clearTimeout(hardTimer);
    app.exit(0);
  }
});
```

---

## 8. project:project:switch 重建后的完整链路

```
sequenceDiagram
    participant R as Renderer
    participant M as Main
    participant PL as ProjectLifecycle
    participant DB as SQLite
    participant UP as UtilityProcess

    R->>M: project:project:switch(toId)

    Note over M: ① Unbind 旧项目
    M->>PL: switchProject(fromId, toId)
    PL->>PL: parallel unbindAll(fromId)
    Note right of PL: watchService.stop()<br>kgRuntime.clearSession()<br>chunkIndex.clear()<br>aiService.abortAll()<br>searchReplace.clear()

    Note over M: ② 数据库写入
    PL->>DB: writeCurrentProjectId(toId)

    Note over M: ③ Bind 新项目
    PL->>PL: parallel bindAll(toId)

    Note over M: ④ 通知 UtilityProcess
    M->>UP: postMessage({ type: 'switch-project', toId })
    UP->>UP: close旧DB → open新DB

    Note over M: ⑤ 更新 Session Binding
    M->>M: projectSessionBinding.bind(webContentsId, toId)

    M->>R: { ok: true, data: { currentProjectId, switchedAt } }
```

与当前实现的对比：

| 步骤 | 当前 | 重建后 |
| --- | --- | --- |
| ① Unbind | ❌ switchKnowledgeGraphContext / switchMemoryContext 是 no-op | ✅ ProjectLifecycle.unbindAll() 并行清理所有注册 service |
| ② DB 写入 | ✅ 正常 | ✅ 不变 |
| ③ Bind | ❌ 无 | ✅ ProjectLifecycle.bindAll() 按需预热 |
| ④ 通知子进程 | ❌ 无子进程 | ✅ UtilityProcess 切换 DB 文件 |
| ⑤ Session Binding | ✅ 正常 | ✅ 不变 |

---

## 9. 监控与可观测性

### 9.1 Metrics 采集点

| 指标 | 采集方式 | 用途 |
| --- | --- | --- |
| BoundedMap 命中率 | map.metrics().hitRate | 调优 maxSize / TTL |
| BoundedMap 驱逐次数 | map.metrics().evictions | 判断容量是否过小 |
| ProjectLifecycle unbind 耗时 | withTimeout 回调记录 | 找出拖慢项目切换的 service |
| SkillScheduler 槽位使用率 | globalRunning / MAX_CONCURRENT | 并发瓶颈分析 |
| IPC abort 次数 | AbortController.abort() 回调计数 | 判断 timeout 是否过短 |
| Graceful shutdown 耗时 | before-quit → app.exit 时间差 | 优化关闭速度 |

### 9.2 内存泄漏回归检测

```
// ── tests/lifecycle/memoryRegression.test.ts ────────

test('100 次项目切换后内存不持续增长', async () => {
  const baseline = process.memoryUsage().heapUsed;

  for (let i = 0; i < 100; i++) {
    await projectLifecycle.switchProject(
      `project-${i}`,
      `project-${i + 1}`,
      db,
    );
  }

  global.gc?.();  // --expose-gc
  const after = process.memoryUsage().heapUsed;

  // 允许 20% 波动，但不允许持续线性增长
  expect(after).toBeLessThan(baseline * 1.2);
});
```

---

## 10. TDD 策略

| 测试类别 | 测试内容 | 关键断言 |
| --- | --- | --- |
| ProjectLifecycle contract | bind → unbind → destroy 全链路 | 每个 service 的回调被正确调用；unbind 超时不阻塞其他 service |
| BoundedMap contract | LRU 淘汰、TTL 过期、容量上限 | 达到 maxSize 后 oldest 被淘汰；过期条目 get 返回 undefined |
| AbortController contract | timeout → abort → handler 提前退出 | handler 收到 signal.aborted === true；不产生副作用 |
| SkillScheduler guard | 异常时槽位回收 | finally 释放 + watchdog 兜底 |
| Graceful shutdown | before-quit → 全链路关闭 | 所有 service.onDestroy 被调用；db.close 被调用；5s 内完成 |
| 内存回归 | 100 次项目切换 | heap 不线性增长 |

---

## 11. 实施路径

| 阶段 | 内容 | 预计工作量 |
| --- | --- | --- |
| Phase 1 | BoundedMap 实现 + 测试 + 替换 12 个无界 Map | 1 天 |
| Phase 2 | ProjectLifecycle 注册中心 + 7 个 service 注册 + project:project:switch 重写 | 1 天 |
| Phase 3 | AbortController 注入 IPC runtime + 3 个 CPU 密集 handler 适配 | 0.5 天 |
| Phase 4 | Graceful Shutdown 链 + SkillScheduler watchdog | 0.5 天 |
| Phase 5 | 内存回归测试 + metrics 采集 | 0.5 天 |

> ✅

无前置依赖，可立即启动。 Phase 2 完成后与 UtilityProcess 双进程架构对接（shutdown 链 + switch-project 消息）。

---

## 12. 相关页面

- ‣ — 子进程关闭与 switch-project 协议

- ‣ — §5 timeout 幽灵执行问题

- ‣ — §3 service 实例管理现状

- ‣ — P1 #12–#18 完整描述
