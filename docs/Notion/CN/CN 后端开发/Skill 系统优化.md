# Skill 系统优化

> Source: Notion local DB page `36c9fbcd-d398-4e44-aae9-278d8db05665`

> 🎯

Skill 系统全链路优化 — 注册表懒加载 + 内存缓存、同步 FS 全面异步化、SkillScheduler 超时回收与并发控制、AbortController 全链路贯穿。

> ⚠️

核心问题：每次操作都触发同步全目录扫描。 loadSkills() 在主进程同步扫描 skills 目录 + 逐个 readFileSync，是用户操作延迟的直接来源。

---

## 1. 问题全景

| 编号 | 问题 | 严重度 | 当前实现 | 影响 |
| --- | --- | --- | --- | --- |
| P0 #6 | 每次操作触发同步全目录扫描 + 同步读文件 | P0 | readdirSync  • readFileSync 逐个加载 skill 定义 | skill 数量增长后操作延迟线性增长，50 个 skill ~100ms 阻塞 |
| P1 #8 | Skill 文件读写/迁移仍为同步 FS | P1 | writeFileSync / copyFileSync / mkdirSync | 大文件或慢磁盘时主进程冻结 |
| P1 #17 | SkillScheduler completion 丢失无兜底 | P1 | 并发槽位在 task 完成时释放，但无超时保护 | 一次 completion 丢失 → 槽位永久占用 → 最终所有槽位耗尽 |

---

## 2. 架构总览

```
flowchart TB
    subgraph MainProcess["主进程"]
        REQ["Skill 执行请求"] --> SCH["SkillScheduler\n并发控制 + 超时"]
        SCH --> REG["SkillRegistry\n懒加载 + 缓存"]
    end

    subgraph CP["ComputeProcess"]
        REG -->|"IPC"| EXEC["Skill 执行器\n隔离运行"]
        EXEC --> AI["AI Provider\n流式调用"]
    end

    subgraph DP["DataProcess"]
        FS["Skill 文件 I/O\n异步读写"] --> DB[("SQLite\nskill 元数据")]
    end

    REG -.->|"首次加载 / invalidate"| FS
    SCH -->|"timeout / abort"| EXEC

    style MainProcess fill:#fff3e0,stroke:#FF9800
    style CP fill:#e3f2fd,stroke:#1976D2
    style DP fill:#e8f5e9,stroke:#4CAF50
```

---

## 3. Skill 注册表懒加载 + 缓存

### 3.1 当前问题

```
// ── 当前 skillService.ts ────────────────────────────

class SkillService {
  loadSkills(projectId: string): SkillDefinition[] {
    // ❌ 每次调用都重新扫描目录
    const dir = path.join(this.skillsDir, projectId);
    const files = readdirSync(dir); // 同步目录扫描

    return files
      .filter(f => f.endsWith('.json'))
      .map(f => {
        const content = readFileSync(path.join(dir, f), 'utf-8'); // 同步读文件
        return JSON.parse(content);
      });
  }
}
```

### 3.2 重构：SkillRegistry

```
// ── services/skills/skillRegistry.ts ────────────────

import { BoundedMap } from '../utils/BoundedMap';

interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  prompt: string;
  parameters: Record<string, ParameterDef>;
  version: number;
}

export class SkillRegistry {
  // 项目级缓存：projectId → skill 列表
  private cache: BoundedMap<string, Map<string, SkillDefinition>>;
  // 存储 DataProcess 返回的 disposable token（非 FSWatcher 实例，因为跨进程无法序列化）
  private watchTokens: Map<string, string> = new Map();

  constructor(
    private dataProcessIpc: DataProcessIpc,
    private lifecycle: ProjectLifecycle,
    opts: { maxProjects?: number } = {},
  ) {
    this.cache = new BoundedMap({
      maxSize: opts.maxProjects ?? 10,
      onEvict: (projectId) => this.unwatchProject(projectId),
    });

    // 项目切换时清除当前项目缓存
    this.lifecycle.onProjectUnbind((projectId) => {
      this.invalidate(projectId);
      this.unwatchProject(projectId);
    });
  }

  /**
   * 获取 Skill 列表。
   * 首次调用时异步加载并缓存，后续直接返回缓存。
   */
  async getSkills(projectId: string): Promise<SkillDefinition[]> {
    const cached = this.cache.get(projectId);
    if (cached) {
      return Array.from(cached.values());
    }

    // 首次加载：通过 IPC 让 DataProcess 异步读取
    const skills = await this.dataProcessIpc.invoke('skills:load-all', { projectId });
    const skillMap = new Map(skills.map(s => [s.id, s]));
    this.cache.set(projectId, skillMap);

    // 启动文件监听
    this.watchProject(projectId);

    return skills;
  }

  /**
   * 获取单个 Skill（缓存命中时 O(1)）。
   */
  async getSkill(projectId: string, skillId: string): Promise<SkillDefinition | undefined> {
    const skills = await this.getSkills(projectId);
    return skills.find(s => s.id === skillId);
  }

  /**
   * 手动 invalidate（文件变更时触发）。
   */
  invalidate(projectId: string): void {
    this.cache.delete(projectId);
  }

  private watchProject(projectId: string): void {
    if (this.watchTokens.has(projectId)) return;

    // 通过 IPC 让 DataProcess 监听文件变更
    this.dataProcessIpc.invoke('skills:watch', { projectId }).then(token => {
      this.watchTokens.set(projectId, token);
    });

    // 监听变更事件
    this.dataProcessIpc.on(`skills:changed:${projectId}`, () => {
      this.invalidate(projectId);
    });
  }

  private unwatchProject(projectId: string): void {
    const token = this.watchTokens.get(projectId);
    if (token) {
      // 通过 IPC 让 DataProcess 释放 FSWatcher（不直接 close，因为跨进程）
      this.dataProcessIpc.invoke('skills:unwatch', { token });
      this.watchTokens.delete(projectId);
    }
    this.dataProcessIpc.off(`skills:changed:${projectId}`);
  }

  dispose(): void {
    for (const [projectId] of this.watchTokens) {
      this.unwatchProject(projectId);
    }
    this.cache.clear();
  }
}
```

### 3.3 DataProcess 侧：异步文件加载

```
// ── DataProcess 侧：skills/skillFileService.ts ─────

import { readdir, readFile, writeFile, mkdir } from 'fs/promises';
import { watch, type FSWatcher } from 'fs';

export class SkillFileService {
  constructor(private skillsBaseDir: string) {}

  /**
   * 异步加载项目的所有 Skill 定义。
   */
  async loadAll(projectId: string): Promise<SkillDefinition[]> {
    const dir = path.join(this.skillsBaseDir, projectId);

    // 确保目录存在
    await mkdir(dir, { recursive: true });

    const files = await readdir(dir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    // 并发读取所有文件（Promise.all）
    const skills = await Promise.all(
      jsonFiles.map(async f => {
        try {
          const content = await readFile(path.join(dir, f), 'utf-8');
          return JSON.parse(content) as SkillDefinition;
        } catch (err) {
          logger.warn(`Failed to parse skill file: ${f}`, err);
          return null;
        }
      }),
    );

    return skills.filter((s): s is SkillDefinition => s !== null);
  }

  /**
   * 异步保存 Skill 定义。
   */
  async save(projectId: string, skill: SkillDefinition): Promise<void> {
    const dir = path.join(this.skillsBaseDir, projectId);
    await mkdir(dir, { recursive: true });
    const filePath = path.join(dir, `${skill.id}.json`);
    await writeFile(filePath, JSON.stringify(skill, null, 2), 'utf-8');
  }

  /**
   * 监听 Skill 目录变更。
   * 返回 disposable token（字符串），用于后续 unwatch。
   * FSWatcher 实例由 DataProcess 内部持有，不跨进程传递。
   */
  private activeWatchers = new Map<string, FSWatcher>();
  watch(projectId: string, onChange: () => void): string {
    const dir = path.join(this.skillsBaseDir, projectId);
    const token = `watch-${projectId}-${Date.now()}`;
    const watcher = watch(dir, { persistent: false }, (_event, filename) => {
      if (filename?.endsWith('.json')) {
        onChange();
      }
    });
    this.activeWatchers.set(token, watcher);
    return token;
  }
  /**
   * 通过 token 停止监听并释放 FSWatcher。
   */
  unwatch(token: string): void {
    const watcher = this.activeWatchers.get(token);
    if (watcher) {
      watcher.close();
      this.activeWatchers.delete(token);
    }
  }
}
```

### 3.4 优化效果

| 方面 | 当前 | 重构后 |
| --- | --- | --- |
| 首次加载 | ~100ms（50 skills 同步扫描 + 读取） | ~20ms（异步并发读取，在 DataProcess） |
| 后续调用 | ~100ms（每次重新扫描） | < 0.1ms（缓存命中） |
| 主进程阻塞 | ~100ms/次 | 0ms（全部在 DataProcess） |
| 文件变更感知 | 无（每次全量扫描） | fs.watch → invalidate → 惰性重载 |

---

## 4. 同步 FS 全面异步化

### 4.1 需替换的同步调用清单

| 文件 | 同步调用 | 替换为 | 执行位置 |
| --- | --- | --- | --- |
| skillService.ts | readdirSync  • readFileSync | readdir  • readFile（Promise.all 并发） | DataProcess |
| skillService.ts | writeFileSync（保存 skill） | writeFile | DataProcess |
| skillMigration.ts | copyFileSync  • mkdirSync | copyFile  • mkdir | DataProcess |
| skillExport.ts | writeFileSync（导出） | writeFile | DataProcess |
| skillImport.ts | readFileSync（导入） | readFile | DataProcess |

### 4.2 全局 lint 规则

```
// .eslintrc — 禁止在 main/ 下使用同步 FS API
{
  "rules": {
    "no-restricted-imports": ["error", {
      "paths": [{
        "name": "fs",
        "importNames": [
          "readdirSync", "readFileSync", "writeFileSync",
          "copyFileSync", "mkdirSync", "existsSync",
          "statSync", "unlinkSync", "renameSync"
        ],
        "message": "Use async fs/promises API instead. Sync FS blocks the main thread."
      }]
    }]
  }
}
```

---

## 5. SkillScheduler 超时回收与并发控制

### 5.1 当前问题

```
// ── 当前 skillScheduler.ts（简化）─────────────────

class SkillScheduler {
  private slots = new Set<string>(); // 正在执行的 task ID
  private maxConcurrent = 3;

  async execute(task: SkillTask): Promise<SkillResult> {
    // 等待空闲槽位
    while (this.slots.size >= this.maxConcurrent) {
      await delay(100);
    }

    this.slots.add(task.id);
    try {
      const result = await this.runTask(task);
      return result;
    } finally {
      this.slots.delete(task.id); // ❌ 如果 runTask 挂起不返回呢？
    }
  }

  // 问题：
  // 1. 无超时保护 → runTask 永不返回 → 槽位永久占用
  // 2. 无 AbortController → 无法取消卡住的任务
  // 3. 等待槽位用 polling（delay(100)）→ 不优雅
}
```

### 5.2 重构：完整的 SkillScheduler

```
// ── services/skills/skillScheduler.ts ───────────────

interface SchedulerOptions {
  maxConcurrent: number;       // 默认 3
  taskTimeoutMs: number;       // 默认 60_000（1 分钟）
  queueCapacity: number;       // 默认 50
}

interface ScheduledTask {
  task: SkillTask;
  resolve: (result: SkillResult) => void;
  reject: (err: Error) => void;
  abortController: AbortController;
  enqueuedAt: number;
}

export class SkillScheduler {
  private running = new Map<string, {
    task: SkillTask;
    abortController: AbortController;
    startedAt: number;
    timeoutHandle: ReturnType<typeof setTimeout>;
  }>();
  private waiting: ScheduledTask[] = [];
  private opts: Required<SchedulerOptions>;

  constructor(
    private executor: SkillExecutor,
    private lifecycle: ProjectLifecycle,
    opts: Partial<SchedulerOptions> = {},
  ) {
    this.opts = {
      maxConcurrent: opts.maxConcurrent ?? 3,
      taskTimeoutMs: opts.taskTimeoutMs ?? 60_000,
      queueCapacity: opts.queueCapacity ?? 50,
    };

    // 项目切换时取消所有任务
    this.lifecycle.onProjectUnbind(() => this.cancelAll('project_switched'));

    // Session 级清理
    this.lifecycle.onSessionEnd(() => this.cancelAll('session_ended'));
  }

  /**
   * 提交任务执行。
   * 如果并发已满，任务进入等待队列。
   */
  execute(task: SkillTask, signal?: AbortSignal): Promise<SkillResult> {
    return new Promise((resolve, reject) => {
      // 外部 AbortSignal 联动
      const ac = new AbortController();
      if (signal) {
        signal.addEventListener('abort', () => ac.abort(signal.reason), { once: true });
      }

      // 检查队列容量
      if (this.waiting.length >= this.opts.queueCapacity) {
        reject(new Error(`Scheduler queue full (${this.opts.queueCapacity})`));
        return;
      }

      const scheduled: ScheduledTask = {
        task,
        resolve,
        reject,
        abortController: ac,
        enqueuedAt: Date.now(),
      };

      // 有空闲槽位 → 立即执行
      if (this.running.size < this.opts.maxConcurrent) {
        this.startTask(scheduled);
      } else {
        this.waiting.push(scheduled);
      }
    });
  }

  private startTask(scheduled: ScheduledTask): void {
    const { task, resolve, reject, abortController } = scheduled;

    // ── 超时保护 ──
    const timeoutHandle = setTimeout(() => {
      abortController.abort(new Error(`Task ${task.id} timed out after ${this.opts.taskTimeoutMs}ms`));
    }, this.opts.taskTimeoutMs);

    this.running.set(task.id, {
      task,
      abortController,
      startedAt: Date.now(),
      timeoutHandle,
    });

    // 执行
    this.executor
      .run(task, abortController.signal)
      .then(resolve)
      .catch(reject)
      .finally(() => {
        // ── 清理槽位 ──
        clearTimeout(timeoutHandle);
        this.running.delete(task.id);

        // 指标
        metrics.histogram('skill_task_duration_ms', Date.now() - scheduled.enqueuedAt);

        // 触发下一个等待任务
        this.drainQueue();
      });
  }

  private drainQueue(): void {
    while (this.running.size < this.opts.maxConcurrent && this.waiting.length > 0) {
      const next = this.waiting.shift()!;

      // 检查是否已被取消
      if (next.abortController.signal.aborted) {
        next.reject(new Error('Task aborted while waiting'));
        continue;
      }

      this.startTask(next);
    }
  }

  /**
   * 取消所有运行中和等待中的任务。
   */
  cancelAll(reason: string): void {
    // 取消运行中的
    for (const [taskId, entry] of this.running) {
      clearTimeout(entry.timeoutHandle);
      entry.abortController.abort(new Error(`Cancelled: ${reason}`));
    }
    // this.running 会在 finally 中自动清理

    // 拒绝等待中的
    for (const scheduled of this.waiting) {
      scheduled.reject(new Error(`Cancelled: ${reason}`));
    }
    this.waiting = [];
  }

  /** 当前状态（用于监控） */
  get status(): { running: number; waiting: number; capacity: number } {
    return {
      running: this.running.size,
      waiting: this.waiting.length,
      capacity: this.opts.maxConcurrent,
    };
  }

  dispose(): void {
    this.cancelAll('scheduler_disposed');
  }
}
```

### 5.3 对比

| 方面 | 当前 | 重构后 |
| --- | --- | --- |
| 超时保护 | ❌ 无 → 槽位永久占用 | ✅ taskTimeoutMs（默认 60s）→ abort + 释放槽位 |
| 取消支持 | ❌ 无 AbortController | ✅ 外部 signal 联动 + 内部超时 abort |
| 等待机制 | polling delay(100) 循环 | 事件驱动 drainQueue()（零轮询） |
| 队列容量 | ❌ 无限 → 内存膨胀 | ✅ queueCapacity（默认 50） |
| 项目切换 | ❌ 旧任务继续占用资源 | ✅ cancelAll('project_switched') |
| 可观测性 | ❌ 无指标 | ✅ status  • 延迟 histogram |

---

## 6. Skill 执行器：隔离与 AbortController

### 6.1 SkillExecutor

```
// ── services/skills/skillExecutor.ts ────────────────

export class SkillExecutor {
  constructor(
    private computeIpc: ComputeProcessIpc,
    private registry: SkillRegistry,
    private ragService: RagRetrieveService,
  ) {}

  async run(task: SkillTask, signal: AbortSignal): Promise<SkillResult> {
    // 1. 获取 Skill 定义（缓存命中 < 0.1ms）
    const skill = await this.registry.getSkill(task.projectId, task.skillId);
    if (!skill) throw new Error(`Skill not found: ${task.skillId}`);

    // 2. 构建上下文（RAG + KG 注入）
    const context = await this.buildContext(task, skill, signal);

    // 3. 发送到 ComputeProcess 执行
    const result = await this.computeIpc.invoke('skill:execute', {
      skill,
      context,
      parameters: task.parameters,
    }, { signal }); // AbortSignal 透传到 IPC

    return result;
  }

  private async buildContext(
    task: SkillTask,
    skill: SkillDefinition,
    signal: AbortSignal,
  ): Promise<SkillContext> {
    const parts: string[] = [];

    // RAG 上下文（如果 skill 需要）
    if (skill.parameters._useRag !== false) {
      const ragResult = await this.ragService.retrieve({
        query: task.input,
        projectId: task.projectId,
        topK: 5,
      }, signal);
      parts.push(
        ragResult.chunks.map(c => c.text).join('\n\n'),
      );
    }

    // KG 规则注入（如果 skill 需要）
    if (skill.parameters._useKgRules !== false) {
      const rules = await this.computeIpc.invoke('kg:build-rules', {
        projectId: task.projectId,
        context: { mentionedEntityIds: task.entityIds ?? [] },
      }, { signal });
      parts.push(rules);
    }

    return {
      systemPrompt: skill.prompt,
      retrievedContext: parts.join('\n---\n'),
      userInput: task.input,
    };
  }
}
```

### 6.2 AbortController 全链路

```
sequenceDiagram
    participant U as 用户
    participant S as SkillScheduler
    participant E as SkillExecutor
    participant C as ComputeProcess

    U->>S: execute(task, signal)
    S->>S: 创建内部 AbortController
    S->>S: 链接外部 signal
    S->>S: 设置超时 timer

    S->>E: run(task, ac.signal)
    E->>C: IPC skill:execute (signal)
    C->>C: 执行中...

    alt 用户取消
        U->>S: signal.abort()
        S->>E: ac.abort() 传播
        E->>C: IPC abort
        C-->>E: AbortError
        E-->>S: AbortError
    else 超时
        S->>S: timer 触发
        S->>E: ac.abort("timeout")
        E->>C: IPC abort
    else 正常完成
        C-->>E: result
        E-->>S: result
        S->>S: clearTimeout + 释放槽位
    end
```

---

## 7. Skill 文件迁移：异步化

### 7.1 当前迁移代码

```
// ── 当前 skillMigration.ts ──────────────────────────

function migrateSkills(fromDir: string, toDir: string): void {
  mkdirSync(toDir, { recursive: true }); // ❌ 同步
  const files = readdirSync(fromDir);     // ❌ 同步

  for (const f of files) {
    copyFileSync(                          // ❌ 同步
      path.join(fromDir, f),
      path.join(toDir, f),
    );
  }
}
```

### 7.2 异步重写

```
// ── DataProcess 侧：skills/skillMigration.ts ───────

import { mkdir, readdir, copyFile, stat } from 'fs/promises';

export async function migrateSkills(
  fromDir: string,
  toDir: string,
  signal?: AbortSignal,
): Promise<{ migratedCount: number; errors: string[] }> {
  await mkdir(toDir, { recursive: true });

  const files = await readdir(fromDir);
  const jsonFiles = files.filter(f => f.endsWith('.json'));
  const errors: string[] = [];
  let migratedCount = 0;

  // 分批迁移，避免一次性打开过多文件描述符
  const BATCH_SIZE = 20;
  for (let i = 0; i < jsonFiles.length; i += BATCH_SIZE) {
    if (signal?.aborted) break;

    const batch = jsonFiles.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(f =>
        copyFile(path.join(fromDir, f), path.join(toDir, f)),
      ),
    );

    for (let j = 0; j < results.length; j++) {
      if (results[j].status === 'fulfilled') {
        migratedCount++;
      } else {
        errors.push(`${batch[j]}: ${(results[j] as PromiseRejectedResult).reason}`);
      }
    }
  }

  return { migratedCount, errors };
}
```

---

## 8. finalizeTask 改造

### 8.1 当前问题

```
// 当前：finalizeTask 没有取消语义
async function finalizeTask(task: SkillTask): Promise<void> {
  // 后处理逻辑：保存结果、更新统计等
  // ❌ 如果在这里卡住，scheduler 的 finally 块永远不会执行
  await saveResult(task);
  await updateStats(task);
}
```

### 8.2 添加 AbortController + 超时

```
// ── 改造后 ──────────────────────────────────────────

async function finalizeTask(
  task: SkillTask,
  result: SkillResult,
  signal: AbortSignal,
): Promise<void> {
  // 给 finalize 阶段一个独立超时（比 task 整体超时短）
  const finalizeTimeout = AbortSignal.timeout(10_000); // 10s
  const combined = AbortSignal.any([signal, finalizeTimeout]);

  try {
    await Promise.all([
      saveResult(task, result, combined),
      updateStats(task, result, combined),
    ]);
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      logger.warn(`finalizeTask aborted for task ${task.id}`);
      // 不抛出——finalize 失败不应影响主流程
    } else {
      logger.error(`finalizeTask error for task ${task.id}`, err);
    }
  }
}
```

---

## 9. TDD 策略

| 测试类别 | 测试内容 | 断言 | 工具 |
| --- | --- | --- | --- |
| 注册表缓存命中 | 两次 getSkills(同一 projectId) | 第二次不触发 IPC 调用 | Vitest + spy |
| 注册表 invalidate | invalidate → getSkills 触发重新加载 | 第二次触发 IPC 调用 | Vitest + spy |
| 注册表项目切换 | 切换项目 → 旧缓存清除 | 旧项目再次 getSkills 触发 IPC | Vitest |
| 异步文件加载 | 目录中 50 个 JSON → loadAll | 全部正确加载，耗时 < 50ms | Vitest + tmp dir |
| 文件加载容错 | 1 个损坏 JSON + 49 个正常 | 返回 49 个，不抛错 | Vitest |
| Scheduler 并发限制 | 提交 10 个任务，maxConcurrent=3 | 任意时刻最多 3 个同时执行 | Vitest + mock executor |
| Scheduler 超时回收 | 任务挂起超过 timeoutMs | 自动 abort + 释放槽位 + 下一个任务启动 | Vitest + fake timers |
| Scheduler 队列满 | 提交超过 queueCapacity 个任务 | 超出部分 reject | Vitest |
| Scheduler cancelAll | 执行中 + 等待中的任务 | 全部 reject，running=0，waiting=0 | Vitest |
| Scheduler 外部 abort | 外部 signal.abort() | 任务 reject AbortError，槽位释放 | Vitest |
| drainQueue 事件驱动 | 任务完成后自动启动等待任务 | 无轮询延迟，立即启动 | Vitest + timing assertions |
| finalizeTask 超时 | finalize 挂起超过 10s | 不影响 scheduler 槽位释放 | Vitest + fake timers |
| 迁移容错 | 50 文件中 2 个复制失败 | 返回 migratedCount=48, errors.length=2 | Vitest + mock fs |
| 迁移可取消 | 迁移中 abort | 停止后续批次，返回已迁移数量 | Vitest |
| ESLint 同步 FS | 在 main/ 目录中使用 readFileSync | lint error | ESLint |

---

## 10. 依赖关系

```
flowchart LR
    UP["⚡ UtilityProcess\n双进程架构"] --> SK["🎯 Skill 系统优化"]
    LC["♻️ 资源生命周期\nProjectLifecycle"] --> SK
    KG["🔮 KG 查询层\nbuildRulesInjection"] --> SK
    EMB["🧬 Embedding & RAG\nragRetrieve"] --> SK

    SK --> AI["🛡️ AI 流式写入\nSkill 输出写入"]

    style SK fill:#e8f5e9,stroke:#4CAF50
```

- 前置依赖：⚡ UtilityProcess 双进程架构（DataProcess 文件 I/O + ComputeProcess 执行）

- 前置依赖：♻️ 资源生命周期管理（Scheduler 槽位 Session/Project 级清理）

- 协作：🔮 KG 查询层（buildRulesInjection 为 Skill 上下文提供 KG 规则注入）

- 协作：🧬 Embedding & RAG（ragRetrieve 为 Skill 上下文提供检索增强）

- 被依赖：🛡️ AI 流式写入防护策略（Skill 输出通过流式写入通道写入文档）
