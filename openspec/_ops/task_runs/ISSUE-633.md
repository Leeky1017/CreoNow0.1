# ISSUE-633

更新时间：2026-02-24 10:06

## Links

- Issue: #633
- Issue URL: https://github.com/Leeky1017/CreoNow/issues/633
- Branch: `task/633-issue-617-change-closeout`
- PR: (to-be-filled)

## Evidence (runtime already merged)

- PR #628 (merged): https://github.com/Leeky1017/CreoNow/pull/628
- PR #631 (merged): https://github.com/Leeky1017/CreoNow/pull/631

## Scope

- Rulebook task: `rulebook/tasks/issue-633-issue-617-change-closeout/**`
- RUN_LOG: `openspec/_ops/task_runs/ISSUE-633.md`
- Target change: `openspec/changes/issue-617-scoped-lifecycle-and-abort/**`
- Required checks: `ci`, `openspec-log-guard`, `merge-serial`

## Goal

- 完成 change `issue-617-scoped-lifecycle-and-abort` 的治理收口：将 delta specs 应用到主 spec、勾选 tasks checklist 并补齐证据、归档 change、同步 `EXECUTION_ORDER.md`。

## Status

- CURRENT: 已完成治理脚手架（Issue + Worktree + Rulebook + RUN_LOG）；待开始 docs patch（应用 delta specs + 归档 change + 同步 EXECUTION_ORDER）。

## Plan

- [x] 创建 OPEN Issue（#633）
- [x] 创建隔离 worktree 与 `task/633-issue-617-change-closeout`
- [x] 创建 Rulebook task（`issue-633-issue-617-change-closeout`）
- [x] 创建 RUN_LOG（本文件）
- [x] Rulebook task validate 通过（`rulebook task validate issue-633-issue-617-change-closeout`）
- [x] Doc timestamp gate（governed markdown）
- [x] Push 分支 `task/633-issue-617-change-closeout`
- [ ] 应用 delta specs 到主 spec（`openspec/specs/**`）
- [ ] 勾选 change tasks checklist + 归档 change（`openspec/changes/archive/**`）
- [ ] 同步 `openspec/changes/EXECUTION_ORDER.md`
- [ ] 创建 PR + 开启 auto-merge + required checks 全绿
- [ ] 最终签字提交：仅修改 RUN_LOG，补齐 `## Main Session Audit` 且 `Reviewed-HEAD-SHA == HEAD^`

## Runs

### 2026-02-24 Governance scaffold (Rulebook + RUN_LOG)

- Command:
  - `rulebook task create issue-633-issue-617-change-closeout`
  - `rulebook task validate issue-633-issue-617-change-closeout`
  - `python3 scripts/check_doc_timestamps.py --files rulebook/tasks/issue-633-issue-617-change-closeout/proposal.md rulebook/tasks/issue-633-issue-617-change-closeout/tasks.md`
- Exit code:
  - `create`: `0`
  - `validate`: `0`
  - `timestamp gate`: `0`
- Key output:
  - `✅ Task issue-633-issue-617-change-closeout created successfully`
  - `✅ Task issue-633-issue-617-change-closeout is valid`
  - Warning: `No spec files found (specs/*/spec.md)`
  - `OK: validated timestamps for 2 governed markdown file(s)`
