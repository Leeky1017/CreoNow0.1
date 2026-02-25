# Proposal: issue-644-skill-runtime-hardening

更新时间：2026-02-25 09:13

## Why

`openspec/changes/archive/issue-617-skill-runtime-hardening` 对应实现已通过 PR #645 合并到 `main`，当前需完成治理收口并归档文档资产。

## What Changes

- 归档 issue #644 的 Rulebook task（proposal/tasks/metadata）到 archive 目录。
- 在 `openspec/_ops/task_runs/ISSUE-644.md` 落盘主线合并与治理收口证据。
- 将 `openspec/changes/archive/issue-617-skill-runtime-hardening` 的 tasks/proposal 与执行顺序同步为归档状态。

## Impact

- Affected specs: `openspec/changes/archive/issue-617-skill-runtime-hardening/{proposal.md,tasks.md,specs/skill-system/spec.md}`
- Affected code: `apps/desktop/main/src/services/skills/**`, `apps/desktop/main/src/ipc/skills.ts`, `apps/desktop/main/src/index.ts`
- Breaking change: NO
- User benefit: 在实现开始前完成治理准入与证据链，降低后续 preflight/merge 阶段返工风险
