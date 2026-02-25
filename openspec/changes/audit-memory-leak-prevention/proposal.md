# 提案：audit-memory-leak-prevention

更新时间：2026-02-25 23:50

## 背景

审计报告（十四-14.1/14.2）发现 2 处内存泄漏风险：`watchService.ts:84-98` 的文件监视器 `watcher.on("error", ...)` 监听器在 watcher 生命周期内从未通过 `.off()` 或 `.removeListener()` 显式移除，如果 watcher 对象被其他引用持有，监听器会泄漏；`globalExceptionHandlers.ts:102-108` 的 `process.on("uncaughtException", ...)` 和 `process.on("unhandledRejection", ...)` 注册后无防重复机制，如果 `installGlobalExceptionHandlers()` 被多次调用，会累积重复监听器。

## 变更内容

- 在 `watchService.ts` 中，watcher 关闭时显式移除 error 监听器（通过 `.off()` 或 `.removeListener()`）
- 在 `globalExceptionHandlers.ts` 中添加防重复注册机制（`once` 标志或注册前检查）
- 为两处修复添加单元测试覆盖，验证监听器正确清理与防重复注册

## 受影响模块

- context-engine — watchService watcher 错误监听器生命周期管理
- workbench — globalExceptionHandlers 防重复注册机制

## 不做什么

- 不重构 watchService 的整体文件监视架构
- 不修改 globalExceptionHandlers 的异常处理逻辑本身
- 不处理其他潜在的内存泄漏场景（如定时器、EventEmitter 等已确认管理良好的部分）
- 不引入通用的内存泄漏检测框架

## 依赖关系

- 上游依赖：无
- 下游依赖：无

## 来源映射

| 来源 | 提炼结论 | 落地位置 |
| --- | --- | --- |
| 审计报告 十四-14.1 | watchService watcher error 监听器需在关闭时显式移除 | `specs/context-engine/spec.md` |
| 审计报告 十四-14.2 | globalExceptionHandlers 需添加防重复注册机制 | `specs/workbench/spec.md` |

## 审阅状态

- Owner 审阅：`PENDING`
