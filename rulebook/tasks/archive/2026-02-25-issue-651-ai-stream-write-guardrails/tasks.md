# issue-651-ai-stream-write-guardrails

更新时间：2026-02-25 17:02

## 1. Specification

- [x] 1.1 审阅 `openspec/specs/{ai-service,ipc,document-management}/spec.md` 与变更 `issue-617-ai-stream-write-guardrails`
- [x] 1.2 完成 Dependency Sync Check（上游：`issue-617-scoped-lifecycle-and-abort`）并记录 `NO_DRIFT`
- [x] 1.3 确认 Scenario 边界：BE-AIW-S1/S2/S3/S4

## 2. TDD Mapping

- [x] 2.1 BE-AIW-S1 -> `chunk-batcher.contract.test.ts`
- [x] 2.2 BE-AIW-S2 -> `push-backpressure.integration.test.ts`
- [x] 2.3 BE-AIW-S3 -> `ai-write-transaction.rollback.contract.test.ts`
- [x] 2.4 BE-AIW-S4 -> `cancel-vs-done.race.contract.test.ts`

## 3. Red

- [x] 3.1 先运行新增 contract/integration 测试并保留失败证据

## 4. Green

- [x] 4.1 在 `aiService.ts` 实现 chunk batching + completion settle delay
- [x] 4.2 逐条验证 S1/S2/S3/S4 通过

## 5. Refactor

- [x] 5.1 清理批处理状态机（flush/clear/reset/cleanup）并保持既有回归测试通过

## 6. Evidence & Delivery

- [x] 6.1 更新 OpenSpec change 文档并归档 `openspec/changes/archive/issue-617-ai-stream-write-guardrails`
- [x] 6.2 更新 RUN_LOG（Red/Green/Issue freshness/门禁命令）
- [x] 6.3 执行目标测试命令并记录输出
- [ ] 6.4 完成 preflight/PR/auto-merge/main 同步/worktree 清理
