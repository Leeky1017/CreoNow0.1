# Proposal: issue-638-embedding-rag-offload

更新时间：2026-02-25 09:13

## Why

Issue #638 已完成实现并通过 PR #642 合并到 `main`，当前需要完成治理收口并归档 `issue-617-embedding-rag-offload`。

## What Changes

- 将 Rulebook 占位内容替换为具体治理步骤，明确 Scope 仅限治理文档。
- 创建并校验 Rulebook task：`issue-638-embedding-rag-offload`。
- 创建 RUN_LOG：`openspec/_ops/task_runs/ISSUE-638.md`，记录关键命令与输出。
- 对 `openspec/changes/archive/issue-617-embedding-rag-offload` 执行 Dependency Sync Check（依赖 `issue-617-utilityprocess-foundation` 与 `issue-617-scoped-lifecycle-and-abort`），并将结论落盘到 `tasks.md` 与 RUN_LOG。
- 维护受管 markdown 时间戳，确保通过文档门禁校验。
- 新增治理预检清单：`rulebook/tasks/archive/2026-02-25-issue-638-embedding-rag-offload/preflight-audit-checklist.md`，明确 BE-EMR-S1~S4 与门禁核验路径/通过标准。

## Impact

- Affected specs: `openspec/changes/archive/issue-617-embedding-rag-offload/tasks.md`
- Affected docs: `rulebook/tasks/archive/2026-02-25-issue-638-embedding-rag-offload/preflight-audit-checklist.md`, `openspec/_ops/task_runs/ISSUE-638.md`
- Affected code: `apps/desktop/main/src/services/embedding/**`, `apps/desktop/main/src/services/rag/**`, `apps/desktop/main/src/ipc/{file,embedding,rag}.ts`
- Breaking change: NO
- User benefit: 在实现前锁定治理基线、依赖一致性与门禁证据，减少后续返工风险
