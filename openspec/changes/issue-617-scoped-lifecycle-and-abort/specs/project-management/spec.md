# Project Management Specification Delta

更新时间：2026-02-22 19:37

## Change: issue-617-scoped-lifecycle-and-abort

### Requirement: 项目切换必须触发 ProjectLifecycle 的解绑/绑定与资源清理 [ADDED]

项目切换**必须**具备可验证的资源生命周期闭环，确保跨项目操作不会引入内存泄漏、文件句柄泄漏或残留后台任务。

- 切换流程必须遵循：`unbind ALL → 持久化切换 → bind ALL`。
- 解绑/绑定应有超时保护，单个服务失败不得导致系统静默卡死。
- 项目级资源（cache、watcher、session map 等）必须在 unbind 时释放。

#### Scenario: BE-SLA-S1 项目切换先解绑再绑定且具备超时保护 [ADDED]

- **假设** 当前项目为 A，目标项目为 B
- **当** 系统执行项目切换
- **则** 系统先对所有 project-scoped 服务执行 A 的 unbind，再执行持久化切换，再执行 B 的 bind
- **并且** 任一解绑/绑定步骤具备超时保护并可记录审计事件

#### Scenario: BE-SLA-S4 项目解绑时清理 project-scoped cache/watcher [ADDED]

- **假设** 项目 A 运行期间创建了 project-scoped 缓存与文件 watcher
- **当** 项目 A 被切换离开并执行 unbind
- **则** 缓存与 watcher 被释放/清空
- **并且** 不再继续接收来自项目 A 的事件或占用文件句柄

### Requirement: 项目切换与关键操作必须可取消且超时能中止底层执行 [ADDED]

系统**必须**将 timeout/取消语义与底层执行绑定，避免仅拒绝外层 Promise 而底层继续运行（幽灵执行）。

- IPC timeout 触发时必须中止底层执行（通过 AbortSignal/AbortController 或等价机制）。
- 会话级资源（如并发槽位）必须在 timeout/取消/异常时可回收，避免永久占用。

#### Scenario: BE-SLA-S2 IPC timeout 通过 AbortSignal 中止底层执行 [ADDED]

- **假设** 某个与项目切换相关的 IPC 处理链路存在长耗时步骤
- **当** IPC 层触发 timeout
- **则** timeout 不仅返回错误，还会通过 AbortSignal 中止底层执行
- **并且** 该中止行为可由自动化测试验证（不存在幽灵执行）

#### Scenario: BE-SLA-S3 会话并发槽位在 timeout/abort 下可回收 [ADDED]

- **假设** 某个会话级调度器为任务占用了并发槽位
- **当** 任务因 timeout/abort/异常导致 completion 丢失或未正常 settle
- **则** 系统仍能回收该并发槽位并允许后续任务继续排队执行
- **并且** 不会出现“槽位永久占用导致全局阻塞”
