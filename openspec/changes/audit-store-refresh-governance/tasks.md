更新时间：2026-02-25 23:50

## 1. Specification

- [ ] 1.1 审阅并确认需求边界（void get().refresh() 替换为可追踪异步, fire-and-forget 改可观测执行器）
- [ ] 1.2 审阅并确认错误路径与边界路径（刷新失败可捕获；可观测执行器 catch 回调异常不被吞没）
- [ ] 1.3 审阅并确认验收阈值与不可变契约（关键路径 void refresh 清零；非关键路径可观测但不阻塞）
- [ ] 1.4 若存在上游依赖，先完成依赖同步检查（Dependency Sync Check）并记录"无漂移/已更新"；无依赖则标注 N/A（本 change：上游依赖 C1 `audit-race-serialization-core` 和 C3 `audit-degradation-telemetry-escalation`）

## 2. TDD Mapping（先测前提）

- [ ] 2.1 将 delta spec 的每个 Scenario 映射为至少一个测试用例
- [ ] 2.2 为每个测试标注对应 Scenario ID，建立可追踪关系
- [ ] 2.3 设定门禁：未出现 Red（失败测试）不得进入实现

### Scenario -> 测试映射

| Scenario ID | 测试文件 | 计划用例名 / 断言块 |
| ----------- | --- | --- |
| AUD-C9-S1 | `apps/desktop/renderer/src/__tests__/unit/store-refresh-governance.test.ts` | `refresh failure after mutation should be captured (not silently discarded by void)` |
| AUD-C9-S2 | `apps/desktop/renderer/src/__tests__/unit/store-refresh-governance.test.ts` | `kgStore mutation should return Promise from refresh (not void)` |
| AUD-C9-S3 | `apps/desktop/renderer/src/__tests__/unit/store-refresh-governance.test.ts` | `memoryStore mutation should return Promise from refresh (not void)` |
| AUD-C9-S4 | `apps/desktop/renderer/src/__tests__/unit/store-refresh-governance.test.ts` | `projectStore mutation should return Promise from refresh (not void)` |
| AUD-C9-S5 | `apps/desktop/renderer/src/__tests__/unit/observable-executor.test.ts` | `observable executor should record structured failure details (not just console.error)` |
| AUD-C9-S6 | `apps/desktop/renderer/src/__tests__/unit/observable-executor.test.ts` | `observable executor catch callback exception should be safely captured (no unhandledRejection)` |
| AUD-C9-S7 | `apps/desktop/renderer/src/__tests__/integration/observable-executor-non-critical.test.ts` | `non-critical path failure should be logged but not block main flow` |
| AUD-C9-S8 | `apps/desktop/renderer/src/__tests__/unit/store-refresh-governance.test.ts` | `static scan should confirm zero void get().refresh() in critical mutation paths` |

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
