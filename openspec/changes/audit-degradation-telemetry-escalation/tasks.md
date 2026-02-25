更新时间：2026-02-25 23:50

## 1. Specification

- [ ] 1.1 审阅并确认需求边界（降级链告警：context fetcher/embedding/memory 降级写 warn、连续 N 次触发告警、AiPanel/aiService 失败日志）
- [ ] 1.2 审阅并确认错误路径与边界路径（必须覆盖：fetcher 降级日志、连续降级告警升级、降级恢复计数器重置、embedding fallback 双失败、localStorage 异常、judge 评估异常、SSE JSON 解析失败）
- [ ] 1.3 审阅并确认验收阈值与不可变契约（测试确定性；降级行为不变；日志格式可被采集系统解析；组件继续正常运行）
- [ ] 1.4 若存在上游依赖，先完成依赖同步检查（Dependency Sync Check）并记录"无漂移/已更新"；无依赖则标注 N/A（本 change：N/A）

## 2. TDD Mapping（先测前提）

- [ ] 2.1 将 delta spec 的每个 Scenario 映射为至少一个测试用例
- [ ] 2.2 为每个测试标注对应 Scenario ID，建立可追踪关系
- [ ] 2.3 设定门禁：未出现 Red（失败测试）不得进入实现

### Scenario -> 测试映射

| Scenario ID | 测试文件                                                                                        | 计划用例名 / 断言块                                                                    |
| ----------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| AUD-C3-S1   | `apps/desktop/main/src/__tests__/integration/context-fetcher-degradation-telemetry.test.ts`     | `fetcher degradation should write structured warn log`                                 |
| AUD-C3-S2   | `apps/desktop/main/src/__tests__/integration/context-fetcher-degradation-telemetry.test.ts`     | `consecutive N degradations should trigger alert escalation`                            |
| AUD-C3-S3   | `apps/desktop/main/src/__tests__/integration/context-fetcher-degradation-telemetry.test.ts`     | `degradation recovery should reset counter`                                            |
| AUD-C3-S4   | `apps/desktop/main/src/__tests__/integration/embedding-fallback-degradation.test.ts`            | `embeddingService double failure should log both primary and fallback errors`           |
| AUD-C3-S5   | `apps/desktop/renderer/src/__tests__/unit/ai-panel-error-logging.test.ts`                       | `AiPanel localStorage failure should console.error with operation type and key`         |
| AUD-C3-S6   | `apps/desktop/renderer/src/__tests__/unit/ai-panel-error-logging.test.ts`                       | `AiPanel judge evaluation failure should console.error with context`                    |
| AUD-C3-S7   | `apps/desktop/main/src/__tests__/unit/ai-service-sse-parse-warn.test.ts`                        | `aiService SSE JSON parse failure should logger.warn with truncated raw data`           |
| AUD-C3-S8   | `apps/desktop/main/src/__tests__/integration/memory-service-degradation-telemetry.test.ts`      | `semantic to deterministic degradation should write warn log`                           |
| AUD-C3-S9   | `apps/desktop/main/src/__tests__/integration/memory-service-degradation-telemetry.test.ts`      | `consecutive N memory degradations should trigger alert escalation`                     |

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
