# 提案：audit-degradation-telemetry-escalation

更新时间：2026-02-25 23:50

## 背景

审计报告识别出多处降级链掩盖根因与静默错误抑制问题：（六-6.1）rulesFetcher 双重降级在 KG 服务不可用时静默忽略所有规则注入；（六-6.2）embeddingService fallback 失败后静默丢弃错误；（六-6.3）memoryService 语义→确定性降级无调用方处理；（九-9.2 中风险）AiPanel.tsx localStorage 读写失败与 judge 评估失败静默丢弃；aiService.ts SSE JSON 解析失败静默跳过；（九-9.3）所有 context fetcher 降级 warning 仅存在于内存中无持久化日志；（十二-12.4）context fetcher 双重降级无通知机制。不修复将导致服务长期静默降级而运维无感知。

## 变更内容

- context fetcher（rulesFetcher/retrievedFetcher/settingsFetcher）降级路径添加结构化 `logger.warn()` 调用，替代仅存于内存的 warning 字符串
- embeddingService fallback 失败时记录结构化日志而非静默丢弃
- memoryService 语义→确定性降级时写入结构化 warn 日志
- 引入降级计数器，连续 N 次降级触发告警升级
- AiPanel.tsx localStorage 读写失败与 judge 评估失败添加 `console.error` 日志
- aiService.ts SSE JSON 解析失败添加 `logger.warn()` 日志

## 受影响模块

- context-engine — rulesFetcher/retrievedFetcher/settingsFetcher 降级日志与告警升级
- ai-service — aiService SSE 解析失败日志、AiPanel localStorage/judge 失败日志
- memory-system — memoryService 语义→确定性降级日志

## 不做什么

- 不重构降级链的业务逻辑（降级策略本身设计合理）
- 不处理 embeddingService 的 fallback 策略重构（仅补日志）
- 不处理 9.2 中的高风险项（属于 C2 范围）
- 不引入外部监控系统集成，仅使用现有 logger 基础设施
- 不处理 fire-and-forget 模式（属于 C9 范围）

## 依赖关系

- 上游依赖：无
- 下游依赖：C9（`audit-store-refresh-governance`）可复用本 change 的告警基础设施

## 来源映射

| 来源 | 提炼结论 | 落地位置 |
| --- | --- | --- |
| 审计报告 六-6.1/6.2/6.3 | 降级链需结构化 warn 日志 | `specs/context-engine/spec.md`、`specs/memory-system/spec.md` |
| 审计报告 九-9.2（中风险） | AiPanel/aiService 失败需日志 | `specs/ai-service/spec.md` |
| 审计报告 九-9.3 | fetcher 降级 warning 需持久化 | `specs/context-engine/spec.md` |
| 审计报告 十二-12.4 | fetcher 双重降级需告警计数器 | `specs/context-engine/spec.md` |

## 审阅状态

- Owner 审阅：`PENDING`
