# Tasks: issue-662-audit-degradation-telemetry-escalation

更新时间：2026-02-27 11:20

## 1. Implementation

- [x] 1.1 新增 `DegradationCounter` 共享工具类（threshold + escalation）
- [x] 1.2 rulesFetcher/retrievedFetcher/settingsFetcher 降级路径添加结构化日志 + 升级
- [x] 1.3 embeddingService fallback 失败记录结构化日志
- [x] 1.4 aiService SSE JSON 解析失败记录 `logger.warn`
- [x] 1.5 AiPanel localStorage/judge 失败添加 `console.error`
- [x] 1.6 memoryService 语义→确定性降级写入 `logger.warn` + 升级

## 2. Testing

- [x] 2.1 context-fetcher-degradation-telemetry.test.ts
- [x] 2.2 embedding-fallback-degradation.test.ts
- [x] 2.3 memory-service-degradation-telemetry.test.ts
- [x] 2.4 ai-service-sse-parse-warn.test.ts
- [x] 2.5 ai-panel-error-logging.test.ts

## 3. Verification

- [x] 3.1 typecheck 通过
- [x] 3.2 lint 通过（0 errors）
- [x] 3.3 1517 renderer 测试通过
- [x] 3.4 21 unit/integration 测试通过
