# Proposal: issue-812-closeout-fe-leftpanel-dialog-migration

更新时间：2026-03-01 18:00

## Why
PR #808 已合并，但 `fe-leftpanel-dialog-migration` 仍停留在 active change 目录，且 `EXECUTION_ORDER.md` 仍标记为执行中，违反交付规则中“完成变更归档强制”。需要独立 closeout 将治理状态与主干事实对齐。

## What Changes
- 将 `openspec/changes/fe-leftpanel-dialog-migration` 迁移到 `openspec/changes/archive/`。
- 更新 `openspec/changes/EXECUTION_ORDER.md`：
  - 活跃 change 数量与已归档列表同步；
  - `fe-leftpanel-dialog-migration` 状态改为已完成并归档（PR #808）；
  - 依赖说明更新为 closeout 完成态。
- 新建 `openspec/_ops/task_runs/ISSUE-812.md` 记录 closeout 证据。

## Impact
- Affected specs:
  - `openspec/changes/EXECUTION_ORDER.md`
  - `openspec/changes/archive/fe-leftpanel-dialog-migration/**`
- Affected code:
  - 无业务代码变更（文档与治理状态收口）
- Breaking change: NO
- User benefit: OpenSpec 活跃变更列表与实际交付状态一致，后续依赖判断与审计链不再漂移。
