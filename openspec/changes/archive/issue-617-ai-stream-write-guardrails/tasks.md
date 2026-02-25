更新时间：2026-02-25 18:50

## 1. Specification

- [x] 1.1 审阅并确认需求边界（chunk batching、事务合并、写入背压、abort+rollback）
- [x] 1.2 审阅并确认错误路径与边界路径（网络断开、取消竞态、写入失败回滚、事件风暴）
- [x] 1.3 审阅并确认验收阈值与不可变契约（取消优先；控制事件必达；不留脏数据）
- [x] 1.4 若存在上游依赖，先完成依赖同步检查（Dependency Sync Check）并记录“无漂移/已更新”；无依赖则标注 N/A

## 2. TDD Mapping（先测前提）

- [x] 2.1 将 delta spec 的每个 Scenario 映射为至少一个测试用例
- [x] 2.2 为每个测试标注对应 Scenario ID，建立可追踪关系
- [x] 2.3 设定门禁：未出现 Red（失败测试）不得进入实现

### Scenario -> 测试映射

| Scenario ID | 测试文件                                                                                     | 计划用例名 / 断言块                                          |
| ----------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| BE-AIW-S1   | `apps/desktop/main/src/services/ai/__tests__/chunk-batcher.contract.test.ts`                 | `should batch tokens by interval/maxBatchSize`               |
| BE-AIW-S2   | `apps/desktop/main/src/ipc/__tests__/push-backpressure.integration.test.ts`                  | `should drop low priority chunks but keep control events`    |
| BE-AIW-S3   | `apps/desktop/main/src/services/ai/__tests__/ai-write-transaction.rollback.contract.test.ts` | `abort should rollback and leave no partial writes`          |
| BE-AIW-S4   | `apps/desktop/main/src/services/ai/__tests__/cancel-vs-done.race.contract.test.ts`           | `cancel should win over done event and stop applying chunks` |

## 3. Red（先写失败测试）

- [x] 3.1 编写 Happy Path 的失败测试并确认先失败
- [x] 3.2 编写 Edge Case 的失败测试并确认先失败
- [x] 3.3 编写 Error Path 的失败测试并确认先失败

## 4. Green（最小实现通过）

- [x] 4.1 仅实现让 Red 转绿的最小代码
- [x] 4.2 逐条使失败测试通过，不引入无关功能

## 5. Refactor（保持绿灯）

- [x] 5.1 去重与重构，保持测试全绿
- [x] 5.2 不改变已通过的外部行为契约

## 6. Evidence

- [x] 6.1 记录 RUN_LOG（含 Red 失败证据、Green 通过证据与关键命令输出）
- [x] 6.2 记录 Dependency Sync Check 的输入、核对结论与后续动作（无漂移/已更新）
- [x] 6.3 记录 Main Session Audit（Audit-Owner/Reviewed-HEAD-SHA=签字提交 HEAD^/三项 PASS/Blocking-Issues=0/Decision=ACCEPT），并确认签字提交仅变更当前任务 RUN_LOG
