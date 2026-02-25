# Proposal: issue-651-ai-stream-write-guardrails-redo

更新时间：2026-02-25 18:56

## Why

当前 `issue-617-ai-stream-write-guardrails` 需要在 OPEN issue `#651` 交付口重做并完成治理闭环，确保四个 Scenario 均具备 Red→Green 证据且可审计。

## What Changes

- 新增并验证四个 Scenario 合约测试（S1/S2/S3/S4）
- 在 `aiService` 引入 chunk batching 与 cancel-vs-done 竞态保护
- 在 AI 写入路径引入可回滚事务语义（无脏数据）
- 更新 OpenSpec change 文档（proposal/tasks）与 RUN_LOG 证据

## Impact

- Affected specs:
  - `openspec/changes/issue-617-ai-stream-write-guardrails/specs/ai-service/spec.md`
  - `openspec/changes/issue-617-ai-stream-write-guardrails/tasks.md`
- Affected code:
  - `apps/desktop/main/src/services/ai/**`
  - `apps/desktop/main/src/ipc/__tests__/push-backpressure.integration.test.ts`
- Breaking change: NO
- User benefit: AI 流式写入在高频输出/取消竞态/异常场景下更稳定，控制事件必达且不留下部分写入
