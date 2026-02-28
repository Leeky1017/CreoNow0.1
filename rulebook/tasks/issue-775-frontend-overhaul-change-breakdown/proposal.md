# Proposal: issue-775-frontend-overhaul-change-breakdown

更新时间：2026-02-28 19:20

更新时间：2026-02-28 19:20

## Why

`docs/frontend-overhaul-plan.md` 已给出一份可追溯的前端整改审计方案（含问题清单、根因、优先级、阻塞决策与 B1–B45 深度审计）。但若不将其拆解为可执行的 OpenSpec changes 并落盘执行顺序，后续实现会出现三类治理风险：

- 任务颗粒度过粗：容易出现“一个 PR 里改太多”导致 review 与回滚成本失控。
- 依赖关系不显式：S3/S6 等受 Spec 漂移决策影响，若不先标注阻塞点，实施会在中途被迫改向。
- 证据不可追溯：缺少 change→delta spec→TDD mapping 的链路，难以保证“不漏项”的交付质量。

## What Changes

本任务为 **Spec-only 拆分与治理落盘**，不实现功能代码：

- 交付并合并 `docs/frontend-overhaul-plan.md`（2026-02-28 二次审计修正版）
- 将文档条目拆分为一组可执行的 OpenSpec changes（`openspec/changes/<change>/`）
  - 每个 change 均包含：`proposal.md`、`tasks.md`、`specs/<module>/spec.md`（delta）
- 更新 `openspec/changes/EXECUTION_ORDER.md`
  - 明确执行策略、优先级、依赖与阻塞项（Owner 决策点）

## Impact

- Affected docs/specs:
  - `docs/frontend-overhaul-plan.md`
  - `openspec/changes/*`
  - `openspec/changes/EXECUTION_ORDER.md`
- Affected runtime code: NO（本任务不触碰 renderer/main/preload 实现）
- Breaking change: NO

