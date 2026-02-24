# Proposal: issue-638-embedding-rag-offload

更新时间：2026-02-24 11:30

## Why

Issue #638 先完成治理脚手架，确保 `issue-617-embedding-rag-offload` 在进入实现前已有可审计证据，并且 BE-EMR-S1~S4 的前置依赖检查结论明确（PASS/NO_DRIFT）。

## What Changes

- 将 Rulebook 占位内容替换为具体治理步骤，明确 Scope 仅限治理文档。
- 创建并校验 Rulebook task：`issue-638-embedding-rag-offload`。
- 创建 RUN_LOG：`openspec/_ops/task_runs/ISSUE-638.md`，记录关键命令与输出。
- 对 `openspec/changes/issue-617-embedding-rag-offload` 执行 Dependency Sync Check（依赖 `issue-617-utilityprocess-foundation` 与 `issue-617-scoped-lifecycle-and-abort`），并将结论落盘到 `tasks.md` 与 RUN_LOG。
- 维护受管 markdown 时间戳，确保通过文档门禁校验。

## Impact

- Affected specs: `openspec/changes/issue-617-embedding-rag-offload/tasks.md`
- Affected code: 无（本任务不实现功能代码）
- Breaking change: NO
- User benefit: 在实现前锁定治理基线、依赖一致性与门禁证据，减少后续返工风险
