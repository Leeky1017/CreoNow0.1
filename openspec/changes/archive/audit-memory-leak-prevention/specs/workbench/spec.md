# Workbench Specification Delta

更新时间：2026-02-25 23:50

## Change: audit-memory-leak-prevention

### Requirement: globalExceptionHandlers 必须具备防重复注册机制 [ADDED]

`globalExceptionHandlers.ts:102-108` 的 `installGlobalExceptionHandlers()` 注册 `process.on("uncaughtException", ...)` 和 `process.on("unhandledRejection", ...)` 后无防重复机制。**必须**添加防重复注册保护，确保多次调用 `installGlobalExceptionHandlers()` 不会累积重复监听器。

#### Scenario: AUD-C15-S4 首次调用正常注册全局异常处理器 [ADDED]

- **假设** `installGlobalExceptionHandlers()` 尚未被调用
- **当** 首次调用 `installGlobalExceptionHandlers()`
- **则** `uncaughtException` 和 `unhandledRejection` 监听器各注册一次
- **并且** 异常处理逻辑正常工作

#### Scenario: AUD-C15-S5 重复调用不累积监听器 [ADDED]

- **假设** `installGlobalExceptionHandlers()` 已被调用一次
- **当** 再次调用 `installGlobalExceptionHandlers()`
- **则** 不注册新的 `uncaughtException` 和 `unhandledRejection` 监听器
- **并且** `process.listenerCount("uncaughtException")` 中由该模块注册的监听器数量保持为 1

#### Scenario: AUD-C15-S6 防重复机制不影响异常捕获能力 [ADDED]

- **假设** `installGlobalExceptionHandlers()` 已被调用（无论一次或多次）
- **当** 进程发生未捕获异常或未处理的 Promise rejection
- **则** 全局异常处理器正确捕获并处理该异常
- **并且** 异常处理行为与添加防重复机制前一致
