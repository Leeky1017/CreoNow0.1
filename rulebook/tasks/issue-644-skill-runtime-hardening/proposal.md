# Proposal: issue-644-skill-runtime-hardening

更新时间：2026-02-24 21:55

## Why

`openspec/changes/issue-617-skill-runtime-hardening` 仍在活跃变更中，但原始 issue #617 已关闭。为满足交付准入与审计门禁，需要以 OPEN issue #644 建立新的治理入口，并在实现前完成 Rulebook + RUN_LOG + 依赖同步检查落盘。

## What Changes

- 创建 issue #644 的 Rulebook task 脚手架（proposal/tasks/metadata）。
- 建立 `openspec/_ops/task_runs/ISSUE-644.md` 记录 links/scope/plan/runs 与主会话审计模板。
- 将 `openspec/changes/issue-617-skill-runtime-hardening/proposal.md` 中依赖同步结论由 `PENDING` 更新为可执行结论。

## Impact

- Affected specs: `openspec/changes/issue-617-skill-runtime-hardening/{proposal.md,tasks.md,specs/skill-system/spec.md}`
- Affected code: none（本任务仅治理文档，不改实现代码）
- Breaking change: NO
- User benefit: 在实现开始前完成治理准入与证据链，降低后续 preflight/merge 阶段返工风险
