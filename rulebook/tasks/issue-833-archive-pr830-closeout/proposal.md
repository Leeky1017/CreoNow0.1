# Proposal: issue-833-archive-pr830-closeout

更新时间：2026-03-01 23:05

## Why

PR #830 已合并到 `main`，但对应的 3 个 change 仍停留在 active 目录，`EXECUTION_ORDER.md` 仍显示“审计整改中”，治理事实与主线事实不一致，需要完成归档收口。

## What Changes

- 将以下 change 从 active 迁移到 archive：
  - `fe-ipc-open-folder-contract`
  - `fe-ui-open-folder-entrypoints`
  - `fe-dashboard-welcome-merge-and-ghost-actions`
- 同步 `openspec/changes/EXECUTION_ORDER.md`：
  - 活跃数量 `31 -> 28`
  - 三项状态更新为“已完成并归档（PR #830）”
  - 依赖说明与当前子任务更新到 `ISSUE-833`

## Impact

- Affected specs:
  - `openspec/changes/archive/fe-ipc-open-folder-contract/**`
  - `openspec/changes/archive/fe-ui-open-folder-entrypoints/**`
  - `openspec/changes/archive/fe-dashboard-welcome-merge-and-ghost-actions/**`
  - `openspec/changes/EXECUTION_ORDER.md`
- Affected code:
  - 无运行时代码改动（治理归档）
- Breaking change: NO
- User benefit: 执行面与治理面重新对齐，后续调度/审计不再被“伪活跃 change”污染。
