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

- [ ] 3.1 **fetcher 降级日志**：触发 rulesFetcher KG 服务不可用降级，断言 `logger.warn` 被调用且参数包含 `{ event: 'degradation', fetcher: 'rulesFetcher', reason: ... }` 结构（AUD-C3-S1）
- [ ] 3.2 **连续降级告警升级**：连续触发 N 次降级，断言第 N 次触发 `logger.error`（或更高级别告警），而前 N-1 次仅为 `logger.warn`（AUD-C3-S2）
- [ ] 3.3 **降级恢复重置**：降级 N-1 次后成功一次，断言计数器重置，后续第 1 次降级仅为 warn（AUD-C3-S3）
- [ ] 3.4 **embedding 双失败**：primary 和 fallback embedding 均失败，断言两个错误都被记录且包含各自的 error context（AUD-C3-S4）
- [ ] 3.5 **AiPanel localStorage 异常**：mock `localStorage.getItem` 抛异常，断言 `console.error` 被调用且包含操作类型和 key 名（AUD-C3-S5）
- [ ] 3.6 **AiPanel judge 异常**：mock judge 评估抛异常，断言 `console.error` 包含 judge 上下文（AUD-C3-S6）
- [ ] 3.7 **SSE 解析异常**：传入畸形 JSON SSE 数据，断言 `logger.warn` 包含截断的原始数据片段（AUD-C3-S7）
- [ ] 3.8 **memory 降级日志**：触发 memoryService 语义→确定性降级，断言 `logger.warn` 含结构化降级事件（AUD-C3-S8）
- [ ] 3.9 **memory 连续降级升级**：连续 N 次 memory 降级，断言告警升级触发（AUD-C3-S9）

## 4. Green（最小实现通过）

- [ ] 4.1 实现 `DegradationCounter` 类：`increment(key)` 返回当前计数，`reset(key)` 归零，`shouldEscalate(key)` 判断是否达到阈值 N
- [ ] 4.2 在各 context fetcher 降级分支插入 `logger.warn({ event: 'degradation', fetcher, reason, count })` 调用
- [ ] 4.3 在 fetcher 降级路径接入 `DegradationCounter`，达到阈值时调用 `logger.error({ event: 'degradation_escalation', ... })`
- [ ] 4.4 在 embeddingService fallback catch 块添加 `logger.warn({ event: 'embedding_fallback_failure', primaryError, fallbackError })`
- [ ] 4.5 在 AiPanel.tsx 的 localStorage catch 和 judge catch 中添加 `console.error` 调用
- [ ] 4.6 在 aiService SSE JSON.parse catch 中添加 `logger.warn({ event: 'sse_parse_failure', raw: data.slice(0, 200) })`

## 5. Refactor（保持绿灯）

- [ ] 5.1 将 `DegradationCounter` 抽取为 `services/shared/degradationCounter.ts`，供 context-engine 和 memory-system 共用
- [ ] 5.2 统一降级日志结构体字段命名（`event` / `module` / `reason` / `count`），建立结构化日志契约
- [ ] 5.3 检查告警阈值 N 是否应提取为可配置常量（如 `DEGRADATION_ESCALATION_THRESHOLD`）

## 6. Evidence

- [ ] 6.1 记录 RUN_LOG（含 Red 失败证据、Green 通过证据与关键命令输出）
- [ ] 6.2 记录 Dependency Sync Check 的输入、核对结论与后续动作（无漂移/已更新）
- [ ] 6.3 记录 Main Session Audit（Audit-Owner/Reviewed-HEAD-SHA=签字提交 HEAD^/三项 PASS/Blocking-Issues=0/Decision=ACCEPT），并确认签字提交仅变更当前任务 RUN_LOG
