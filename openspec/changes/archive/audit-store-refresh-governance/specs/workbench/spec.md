# Workbench (Stores) Specification Delta

更新时间：2026-02-25 23:50

## Change: audit-store-refresh-governance

### Requirement: store 刷新必须从 fire-and-forget 转为可追踪异步策略 [ADDED]

`kgStore.ts`、`memoryStore.ts`、`projectStore.tsx` 中的 `void get().refresh()` 模式**必须**替换为可追踪的异步策略，关键路径的刷新失败必须可观测。

#### Scenario: AUD-C9-S1 关键 mutation 后刷新失败可被捕获 [ADDED]

- **假设** store mutation 操作（如创建/更新/删除实体）执行成功
- **当** 后续的 `refresh()` 调用失败（如网络错误或 IPC 超时）
- **则** 失败信息被结构化记录（日志或状态）
- **并且** 不再被 `void` 静默丢弃

#### Scenario: AUD-C9-S2 kgStore mutation 后刷新返回 Promise [ADDED]

- **假设** `kgStore` 的 mutation 方法（如 `addEntity`、`updateEntity`）执行完成
- **当** 触发后续数据刷新
- **则** 刷新操作返回 Promise 而非 `void`
- **并且** 调用方可选择 await 或使用可观测执行器处理

#### Scenario: AUD-C9-S3 memoryStore mutation 后刷新返回 Promise [ADDED]

- **假设** `memoryStore` 的 mutation 方法执行完成
- **当** 触发后续数据刷新
- **则** 刷新操作返回 Promise 而非 `void`
- **并且** 调用方可选择 await 或使用可观测执行器处理

#### Scenario: AUD-C9-S4 projectStore mutation 后刷新返回 Promise [ADDED]

- **假设** `projectStore` 的 mutation 方法执行完成
- **当** 触发后续数据刷新
- **则** 刷新操作返回 Promise 而非 `void`
- **并且** 调用方可选择 await 或使用可观测执行器处理

### Requirement: fireAndForget 必须改造为可观测执行器 [ADDED]

`renderer/src/lib/fireAndForget.ts` **必须**从简单的 `console.error` 转为可观测执行器，关键操作的失败可被日志/状态捕获。

#### Scenario: AUD-C9-S5 可观测执行器记录失败详情 [ADDED]

- **假设** 一个异步操作通过可观测执行器执行
- **当** 该操作的 Promise 被 reject
- **则** 失败详情（错误类型、消息、调用来源）被结构化记录
- **并且** 不仅仅是 `console.error` 输出

#### Scenario: AUD-C9-S6 可观测执行器的 catch 回调异常不被吞没 [ADDED]

- **假设** 可观测执行器的错误处理回调本身抛出异常
- **当** 该二次异常发生
- **则** 二次异常被安全捕获并记录
- **并且** 不会导致 unhandledRejection

#### Scenario: AUD-C9-S7 非关键路径保留 fire-and-forget 但可观测 [ADDED]

- **假设** 非关键操作（如日志写入、遥测上报）使用可观测执行器
- **当** 该操作失败
- **则** 失败被记录但不阻塞主流程
- **并且** 与关键路径的错误处理策略有明确区分

#### Scenario: AUD-C9-S8 静态扫描确认关键路径 void refresh 清零 [ADDED]

- **假设** 重构完成后
- **当** 对 `kgStore.ts`、`memoryStore.ts`、`projectStore.tsx` 执行 `void get().refresh()` 模式扫描
- **则** 关键 mutation 路径中不再存在该模式
- **并且** 所有刷新操作均通过可追踪策略执行
