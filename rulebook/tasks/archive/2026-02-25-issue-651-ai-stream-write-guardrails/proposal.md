# Proposal: issue-651-ai-stream-write-guardrails

更新时间：2026-02-25 16:58

## Why

Issue #651 承载 `openspec/changes/issue-617-ai-stream-write-guardrails` 的完整交付收口。目标是将 chunk batching、push backpressure、abort+rollback、cancel 优先竞态四个 Scenario 以 TDD 方式落地，并通过 OpenSpec/Rulebook/GitHub 三体系门禁完成合并交付。

## What Changes

- 在 `apps/desktop/main/src/services/ai/aiService.ts` 实现流式 chunk batching（时间窗口 + 数量阈值）与 completion settle delay，保证 cancel vs done 竞态以 cancel 优先。
- 新增并通过四个 Scenario 测试：
  - `apps/desktop/main/src/services/ai/__tests__/chunk-batcher.contract.test.ts`（BE-AIW-S1）
  - `apps/desktop/main/src/ipc/__tests__/push-backpressure.integration.test.ts`（BE-AIW-S2）
  - `apps/desktop/main/src/services/ai/__tests__/ai-write-transaction.rollback.contract.test.ts`（BE-AIW-S3）
  - `apps/desktop/main/src/services/ai/__tests__/cancel-vs-done.race.contract.test.ts`（BE-AIW-S4）
- 更新 OpenSpec change 文档：`openspec/changes/issue-617-ai-stream-write-guardrails/{proposal.md,tasks.md}`，补齐 Dependency Sync 结论与 TDD 勾选状态。
- 更新并维护 `openspec/_ops/task_runs/ISSUE-651.md`，记录 Red/Green/回归验证、Issue freshness、PR 门禁与主会话审计证据。

## Impact
- Affected specs:
  - `openspec/specs/ai-service/spec.md`（只读）
  - `openspec/changes/issue-617-ai-stream-write-guardrails/**`
- Affected code:
  - `apps/desktop/main/src/services/ai/aiService.ts`
  - `apps/desktop/main/src/services/ai/__tests__/chunk-batcher.contract.test.ts`
  - `apps/desktop/main/src/services/ai/__tests__/cancel-vs-done.race.contract.test.ts`
  - `apps/desktop/main/src/services/ai/__tests__/ai-write-transaction.rollback.contract.test.ts`
  - `apps/desktop/main/src/ipc/__tests__/push-backpressure.integration.test.ts`
  - `openspec/_ops/task_runs/ISSUE-651.md`
  - `rulebook/tasks/issue-651-ai-stream-write-guardrails/{proposal.md,tasks.md,.metadata.json}`
- Breaking change: NO
- User benefit: AI 流式输出在高频场景下减少 IPC 事件风暴，取消操作可预测且优先，写入链路满足回滚一致性，交付证据可追溯。
