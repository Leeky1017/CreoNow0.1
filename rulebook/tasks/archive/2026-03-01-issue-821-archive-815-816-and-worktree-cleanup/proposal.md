# Proposal: issue-821-archive-815-816-and-worktree-cleanup

更新时间：2026-03-01 20:26

## Why

`fe-cleanup-proxysection-and-mocks` 与 `fe-ai-panel-toggle-button` 已完成并合并，但 change 目录仍停留在 active，
导致执行顺序文档与活跃变更集合存在漂移；同时 `.worktrees` 下存在已完成任务的残留目录，需要清理以减少维护噪音。

## What Changes

- 将以下 completed change 从 active 迁移到 `openspec/changes/archive/`：
  - `fe-cleanup-proxysection-and-mocks`
  - `fe-ai-panel-toggle-button`
- 同步 `openspec/changes/EXECUTION_ORDER.md`：更新时间、活跃数量、第一批状态、依赖说明。
- 清理已完成 issue 对应 worktree（目标：`issue-806/811/815/816/819`）。

## Impact

- Affected specs:
  - `openspec/changes/EXECUTION_ORDER.md`
  - `openspec/changes/archive/fe-cleanup-proxysection-and-mocks/**`
  - `openspec/changes/archive/fe-ai-panel-toggle-button/**`
- Affected code:
  - 无运行时代码变更（治理与目录迁移）
- Breaking change: NO
- User benefit: 活跃变更集合与控制面状态一致，收口与审计成本下降。
