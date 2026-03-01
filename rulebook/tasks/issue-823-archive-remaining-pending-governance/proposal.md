# Proposal: issue-823-archive-remaining-pending-governance

更新时间：2026-03-01 20:37

## Why

当前仍存在待归档治理残留：`fe-rightpanel-ai-guidance-and-style` 仍在 active change，
以及 `issue-806/815/816/819/821` 对应 Rulebook task 仍在 active。该状态会导致执行面与治理面不一致，增加后续审计与调度噪音。

## What Changes

- 将 `fe-rightpanel-ai-guidance-and-style` 从 `openspec/changes/` 迁移到 `openspec/changes/archive/`。
- 同步 `openspec/changes/EXECUTION_ORDER.md`（活跃数量、第一批状态、依赖说明、更新时间）。
- 将 `issue-806/815/816/819/821` Rulebook task 从 active 迁移到 `rulebook/tasks/archive/`，并统一收口为 `completed`。

## Impact

- Affected specs:
  - `openspec/changes/archive/fe-rightpanel-ai-guidance-and-style/**`
  - `openspec/changes/EXECUTION_ORDER.md`
- Affected code:
  - 无运行时代码变更（治理归档）
- Breaking change: NO
- User benefit: 待归档清零，治理状态与主分支事实完全一致。
