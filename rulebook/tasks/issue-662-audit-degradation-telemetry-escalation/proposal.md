# Proposal: issue-662-audit-degradation-telemetry-escalation

更新时间：2026-02-27 11:20

## Why

审计报告识别出多处降级链掩盖根因与静默错误抑制：rulesFetcher 双重降级静默忽略规则注入；embeddingService fallback 失败静默丢弃；memoryService 语义→确定性降级无日志；AiPanel localStorage/judge 失败静默丢弃；aiService SSE JSON 解析失败静默跳过。不修复将导致服务长期静默降级而运维无感知。

## What Changes

- context fetcher（rulesFetcher/retrievedFetcher/settingsFetcher）降级路径添加结构化 `logger.warn()`
- 引入 `DegradationCounter`，连续 N 次降级触发 `logger.error` 告警升级
- embeddingService fallback 失败记录结构化日志
- memoryService 语义→确定性降级写入结构化 warn 日志
- AiPanel localStorage 读写失败与 judge 评估失败添加 `console.error`
- aiService SSE JSON 解析失败添加 `logger.warn()`

## Impact

- Affected specs: `openspec/changes/audit-degradation-telemetry-escalation/specs/`
- Affected code: rulesFetcher, retrievedFetcher, settingsFetcher, layerAssemblyService, embeddingService, memoryService, aiService, AiPanel
- Breaking change: NO
- User benefit: 降级事件可被日志采集系统感知，连续降级触发告警升级，运维可及时介入
