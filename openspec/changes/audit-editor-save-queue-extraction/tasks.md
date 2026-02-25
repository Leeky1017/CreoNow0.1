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

- [ ] 3.1 编写 Happy Path 的失败测试并确认先失败
- [ ] 3.2 编写 Edge Case 的失败测试并确认先失败
- [ ] 3.3 编写 Error Path 的失败测试并确认先失败

## 4. Green（最小实现通过）

- [ ] 4.1 仅实现让 Red 转绿的最小代码
- [ ] 4.2 逐条使失败测试通过，不引入无关功能

## 5. Refactor（保持绿灯）

- [ ] 5.1 去重与重构，保持测试全绿
- [ ] 5.2 不改变已通过的外部行为契约

## 6. Evidence

- [ ] 6.1 记录 RUN_LOG（含 Red 失败证据、Green 通过证据与关键命令输出）
- [ ] 6.2 记录 Dependency Sync Check 的输入、核对结论与后续动作（无漂移/已更新）
- [ ] 6.3 记录 Main Session Audit（Audit-Owner/Reviewed-HEAD-SHA=签字提交 HEAD^/三项 PASS/Blocking-Issues=0/Decision=ACCEPT），并确认签字提交仅变更当前任务 RUN_LOG
