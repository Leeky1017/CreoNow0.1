更新时间：2026-02-25 23:50

## 1. Specification

- [ ] 1.1 审阅并确认需求边界（watchService watcher 监听器显式移除, globalExceptionHandlers 防重复注册）
- [ ] 1.2 审阅并确认错误路径与边界路径（必须覆盖：watcher 关闭后 error 事件不触发已移除监听器、多次 create→close 循环无监听器累积、重复调用 installGlobalExceptionHandlers 不累积）
- [ ] 1.3 审阅并确认验收阈值与不可变契约（watcher close 后 error 监听器归零；无 MaxListenersExceededWarning；防重复机制不影响异常捕获能力）
- [ ] 1.4 若存在上游依赖，先完成依赖同步检查（Dependency Sync Check）并记录"无漂移/已更新"；无依赖则标注 N/A（本 change：N/A）

## 2. TDD Mapping（先测前提）

- [ ] 2.1 将 delta spec 的每个 Scenario 映射为至少一个测试用例
- [ ] 2.2 为每个测试标注对应 Scenario ID，建立可追踪关系
- [ ] 2.3 设定门禁：未出现 Red（失败测试）不得进入实现

### Scenario -> 测试映射

| Scenario ID | 测试文件                                                                                    | 计划用例名 / 断言块                                                                          |
| ----------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| AUD-C15-S1  | `apps/desktop/main/src/__tests__/unit/watch-service-listener-cleanup.test.ts`               | `watcher close should explicitly remove error listener via .off() with zero listeners after`  |
| AUD-C15-S2  | `apps/desktop/main/src/__tests__/unit/watch-service-closed-error-noop.test.ts`              | `closed watcher error event should not invoke removed listener and produce no side effects`   |
| AUD-C15-S3  | `apps/desktop/main/src/__tests__/unit/watch-service-create-close-cycle.test.ts`             | `N create-close cycles should not accumulate listeners or trigger MaxListenersExceededWarning` |
| AUD-C15-S4  | `apps/desktop/main/src/__tests__/unit/global-exception-handlers-install.test.ts`            | `first installGlobalExceptionHandlers call should register one listener each`                 |
| AUD-C15-S5  | `apps/desktop/main/src/__tests__/unit/global-exception-handlers-dedup.test.ts`              | `repeated installGlobalExceptionHandlers calls should not add duplicate listeners`            |
| AUD-C15-S6  | `apps/desktop/main/src/__tests__/unit/global-exception-handlers-capture.test.ts`            | `exception capture should work correctly regardless of dedup guard with same behavior`        |

## 3. Red（先写失败测试）

- [ ] 3.1 **watcher close 清理监听器**：创建 watcher，注册 error 监听器，close watcher，断言 error 事件的 listener 数量为 0（AUD-C15-S1）
- [ ] 3.2 **关闭后 error 无副作用**：close watcher 后手动 emit `error` 事件，断言原监听器回调未被调用（AUD-C15-S2）
- [ ] 3.3 **N 次 create-close 无累积**：循环 N 次 create watcher → close watcher，断言 error listener 数量始终为 0 且无 MaxListenersExceededWarning（AUD-C15-S3）
- [ ] 3.4 **首次注册**：调用 `installGlobalExceptionHandlers()`，断言 `process.listenerCount('uncaughtException')` 和 `process.listenerCount('unhandledRejection')` 各增加 1（AUD-C15-S4）
- [ ] 3.5 **重复调用不累积**：连续调用 3 次 `installGlobalExceptionHandlers()`，断言 listener 数量与首次调用后相同（AUD-C15-S5）
- [ ] 3.6 **异常捕获功能正常**：安装 dedup guard 后触发 uncaughtException，断言处理函数仍被正确调用（AUD-C15-S6）

## 4. Green（最小实现通过）

- [ ] 4.1 在 `watchService.ts` 的 watcher close 逻辑中添加 `watcher.off('error', errorHandler)`（需将 error handler 提取为具名函数引用）
- [ ] 4.2 在 `globalExceptionHandlers.ts` 顶部添加 `let installed = false` 标志，`installGlobalExceptionHandlers()` 入口检查：已安装则直接 return
- [ ] 4.3 确保 dedup guard 不影响异常处理函数的正常执行（即 `installed = true` 后 handler 仍生效）

## 5. Refactor（保持绿灯）

- [ ] 5.1 将 watcher error handler 从匿名箭头函数改为模块级具名函数，确保 `.on()` 和 `.off()` 引用同一函数对象
- [ ] 5.2 评估 `installed` 标志是否应改为 `WeakRef` 或 `AbortController` 模式（当前场景单 flag 已足够，不过度设计）
- [ ] 5.3 检查是否有其他 EventEmitter 的 `.on()` 调用存在类似的无 `.off()` 配对问题（本次仅修复审计发现的 2 处）

## 6. Evidence

- [ ] 6.1 记录 RUN_LOG（含 Red 失败证据、Green 通过证据与关键命令输出）
- [ ] 6.2 记录 Dependency Sync Check 的输入、核对结论与后续动作（无漂移/已更新）
- [ ] 6.3 记录 Main Session Audit（Audit-Owner/Reviewed-HEAD-SHA=签字提交 HEAD^/三项 PASS/Blocking-Issues=0/Decision=ACCEPT），并确认签字提交仅变更当前任务 RUN_LOG
