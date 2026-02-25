更新时间：2026-02-25 23:50

## 1. Specification

- [ ] 1.1 审阅并确认需求边界（并发竞态修复：episodicMemoryService per-project mutex、projectLifecycle switch lock、projectScopedCache singleflight）
- [ ] 1.2 审阅并确认错误路径与边界路径（必须覆盖：并发丢失更新、unbind/bind 交错、singleflight 异常透传、不同 key/project 互不阻塞）
- [ ] 1.3 审阅并确认验收阈值与不可变契约（测试确定性；并发场景必须可复现；无真实 I/O 依赖）
- [ ] 1.4 若存在上游依赖，先完成依赖同步检查（Dependency Sync Check）并记录"无漂移/已更新"；无依赖则标注 N/A（本 change：N/A）

## 2. TDD Mapping（先测前提）

- [ ] 2.1 将 delta spec 的每个 Scenario 映射为至少一个测试用例
- [ ] 2.2 为每个测试标注对应 Scenario ID，建立可追踪关系
- [ ] 2.3 设定门禁：未出现 Red（失败测试）不得进入实现

### Scenario -> 测试映射

| Scenario ID | 测试文件                                                                                    | 计划用例名 / 断言块                                                                      |
| ----------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| AUD-C1-S1   | `apps/desktop/main/src/__tests__/stress/episodic-memory-mutex.stress.test.ts`               | `concurrent recordEpisode should not lose updates`                                       |
| AUD-C1-S2   | `apps/desktop/main/src/__tests__/stress/episodic-memory-mutex.stress.test.ts`               | `recordEpisode and scheduleBatchDistillation should be mutually exclusive`                |
| AUD-C1-S3   | `apps/desktop/main/src/__tests__/stress/episodic-memory-mutex.stress.test.ts`               | `different projects should not block each other`                                         |
| AUD-C1-S4   | `apps/desktop/main/src/__tests__/stress/project-lifecycle-switch-lock.stress.test.ts`       | `concurrent switchProject should serialize without interleaving`                          |
| AUD-C1-S5   | `apps/desktop/main/src/__tests__/stress/project-lifecycle-switch-lock.stress.test.ts`       | `duplicate switchProject to same target should be idempotent`                             |
| AUD-C1-S6   | `apps/desktop/main/src/__tests__/contract/project-scoped-cache-singleflight.contract.test.ts` | `same key concurrent requests should trigger compute only once`                          |
| AUD-C1-S7   | `apps/desktop/main/src/__tests__/contract/project-scoped-cache-singleflight.contract.test.ts` | `different keys should not block each other`                                             |
| AUD-C1-S8   | `apps/desktop/main/src/__tests__/contract/project-scoped-cache-singleflight.contract.test.ts` | `singleflight compute failure should not cache error and should propagate to all callers` |

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
