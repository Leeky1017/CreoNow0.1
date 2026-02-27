更新时间：2026-02-25 23:50

## 1. Specification

- [ ] 1.1 审阅并确认需求边界（editorStore 内联 save queue 提取为独立模块, eslint-disable 移除）
- [ ] 1.2 审阅并确认错误路径与边界路径（单个任务失败后继续处理；未预期异常后队列不死锁）
- [ ] 1.3 审阅并确认验收阈值与不可变契约（独立模块可独立实例化测试；eslint 通过无新豁免）
- [ ] 1.4 若存在上游依赖，先完成依赖同步检查（Dependency Sync Check）并记录"无漂移/已更新"；无依赖则标注 N/A（本 change：N/A）

## 2. TDD Mapping（先测前提）

- [ ] 2.1 将 delta spec 的每个 Scenario 映射为至少一个测试用例
- [ ] 2.2 为每个测试标注对应 Scenario ID，建立可追踪关系
- [ ] 2.3 设定门禁：未出现 Red（失败测试）不得进入实现

### Scenario -> 测试映射

| Scenario ID | 测试文件 | 计划用例名 / 断言块 |
| ----------- | --- | --- |
| AUD-C10-S1 | `apps/desktop/renderer/src/__tests__/unit/save-queue.test.ts` | `save queue should execute write tasks serially in enqueue order` |
| AUD-C10-S2 | `apps/desktop/renderer/src/__tests__/unit/save-queue.test.ts` | `high priority task should be inserted at front without interrupting current task` |
| AUD-C10-S3 | `apps/desktop/renderer/src/__tests__/unit/save-queue.test.ts` | `single task failure should not block subsequent tasks and error should be retrievable` |
| AUD-C10-S4 | `apps/desktop/renderer/src/__tests__/unit/save-queue.test.ts` | `unexpected exception should not deadlock queue or lose pending tasks` |
| AUD-C10-S5 | `apps/desktop/renderer/src/__tests__/unit/save-queue.test.ts` | `save queue should be independently instantiable without editorStore or IPC mocks` |
| AUD-C10-S6 | `apps/desktop/renderer/src/__tests__/unit/save-queue-editor-integration.test.ts` | `createEditorStore should delegate save to extracted save queue module` |
| AUD-C10-S7 | `apps/desktop/renderer/src/__tests__/unit/save-queue-editor-integration.test.ts` | `eslint-disable removal should pass lint with no new eslint-disable comments` |
| AUD-C10-S8 | `apps/desktop/renderer/src/__tests__/unit/save-queue.test.ts` | `empty queue should produce no timers, polling, or side effects` |

## 3. Red（先写失败测试）

- [ ] 3.1 **串行执行**：入队 3 个写任务（各含 50ms 模拟延迟），断言执行顺序严格为入队顺序（AUD-C10-S1）
- [ ] 3.2 **优先级插入**：入队普通任务后立即入队高优先级任务，断言高优先级任务在当前任务完成后、普通任务前执行（AUD-C10-S2）
- [ ] 3.3 **单任务失败不阻塞**：入队 3 个任务、第 2 个抛异常，断言第 1、3 个正常完成且第 2 个的错误可检索（AUD-C10-S3）
- [ ] 3.4 **异常不死锁**：任务抛非预期异常后，断言后续入队的任务仍能正常执行、队列未死锁（AUD-C10-S4）
- [ ] 3.5 **独立实例化**：直接 `new SaveQueue()` 不依赖 editorStore 或 IPC mock，断言可正常入队和处理（AUD-C10-S5）
- [ ] 3.6 **editorStore 集成**：调用 editorStore 的 save 方法，断言内部委托给提取后的 SaveQueue 模块（AUD-C10-S6）
- [ ] 3.7 **eslint 通过**：运行 eslint 检查 editorStore.tsx，断言无 `eslint-disable` 注释且通过（AUD-C10-S7）
- [ ] 3.8 **空队列无副作用**：实例化 SaveQueue 但不入队任何任务，断言无定时器、无轮询、无内存分配增长（AUD-C10-S8）

## 4. Green（最小实现通过）

- [ ] 4.1 创建 `renderer/src/lib/saveQueue.ts`，实现 `SaveQueue` 类：含 `enqueue(task, priority?)` 方法、内部用数组维护队列、串行 `processNext()` 循环
- [ ] 4.2 实现优先级插入：高优先级任务插入队列头部（当前执行中任务之后）
- [ ] 4.3 实现错误隔离：`processNext()` 中 try-catch 单个任务，失败后记录错误并继续处理下一个
- [ ] 4.4 在 `editorStore.tsx` 中替换内联 save queue 逻辑为 `new SaveQueue()` 实例调用
- [ ] 4.5 删除 `editorStore.tsx:128` 的 `eslint-disable-next-line max-lines-per-function`

## 5. Refactor（保持绿灯）

- [ ] 5.1 检查提取后 `createEditorStore` 的行数是否已降至 eslint `max-lines-per-function` 阈值以下（无需豁免）
- [ ] 5.2 评估 `SaveQueue` 是否需要 `dispose()` 方法（清空队列 + 中断处理循环），为未来 HMR 或组件卸载场景预留
- [ ] 5.3 确保 SaveQueue 的错误记录使用与 editorStore 一致的日志方式（console.error vs logger），不引入新的依赖

## 6. Evidence

- [ ] 6.1 记录 RUN_LOG（含 Red 失败证据、Green 通过证据与关键命令输出）
- [ ] 6.2 记录 Dependency Sync Check 的输入、核对结论与后续动作（无漂移/已更新）
- [ ] 6.3 记录 Main Session Audit（Audit-Owner/Reviewed-HEAD-SHA=签字提交 HEAD^/三项 PASS/Blocking-Issues=0/Decision=ACCEPT），并确认签字提交仅变更当前任务 RUN_LOG
