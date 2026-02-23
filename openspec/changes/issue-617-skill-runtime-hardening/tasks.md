更新时间：2026-02-22 19:37

## 1. Specification

- [ ] 1.1 审阅并确认需求边界（SkillRegistry 懒加载+缓存、FS I/O 异步化、Scheduler 兜底、Abort 联动）
- [ ] 1.2 审阅并确认错误路径与边界路径（文件损坏/读写失败、completion 丢失、取消竞态、缓存失效）
- [ ] 1.3 审阅并确认验收阈值与不可变契约（全局并发上限=8；取消优先；不再同步扫描目录）
- [ ] 1.4 若存在上游依赖，先完成依赖同步检查（Dependency Sync Check）并记录“无漂移/已更新”；无依赖则标注 N/A

## 2. TDD Mapping（先测前提）

- [ ] 2.1 将 delta spec 的每个 Scenario 映射为至少一个测试用例
- [ ] 2.2 为每个测试标注对应 Scenario ID，建立可追踪关系
- [ ] 2.3 设定门禁：未出现 Red（失败测试）不得进入实现

### Scenario -> 测试映射

| Scenario ID | 测试文件                                                                                            | 计划用例名 / 断言块                                              |
| ----------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| BE-SRH-S1   | `apps/desktop/main/src/services/skills/__tests__/skill-registry.lazy-load.contract.test.ts`         | `getSkills should cache by projectId and avoid fs scan per call` |
| BE-SRH-S2   | `apps/desktop/main/src/services/skills/__tests__/skill-file-io.dataprocess.contract.test.ts`        | `read/write should be delegated to data process (async)`         |
| BE-SRH-S3   | `apps/desktop/main/src/services/skills/__tests__/skill-scheduler.timeout-recovery.contract.test.ts` | `slot should be reclaimed when completion is missing`            |
| BE-SRH-S4   | `apps/desktop/main/src/services/skills/__tests__/skill-cancel.race.contract.test.ts`                | `cancel should win over done event race`                         |

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
