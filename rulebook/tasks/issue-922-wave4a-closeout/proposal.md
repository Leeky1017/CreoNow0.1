# Proposal: issue-922-wave4a-closeout

更新时间：2026-03-02 23:25

## Why
Wave 4a 三条任务 PR（#919/#917/#918）已合并到 `main`，但对应 change 目录仍停留在 `openspec/changes/` active 区，导致执行顺序文档与仓库真实状态不一致。需要一次治理 closeout 完成归档、EO 同步与证据补齐，避免后续依赖判断漂移。

## What Changes
- 将以下 active change 迁移至 archive：
  - `fe-composites-p0-panel-and-command-items`
  - `fe-editor-tokenization-selection-and-spacing`
  - `fe-editor-advanced-interactions`
- 更新 `openspec/changes/EXECUTION_ORDER.md`：
  - 活跃 change 数量从 16 调整为 13；
  - Wave 4a 状态标记为“已完成并归档（PR #919/#917/#918）”；
  - 增补 Wave 4a 归档记录与 ISSUE-922 同步说明。
- 新建 `openspec/_ops/task_runs/ISSUE-922.md` 与 `openspec/_ops/reviews/ISSUE-922.md`，补齐审计链。

## Impact
- Affected specs:
  - `openspec/changes/EXECUTION_ORDER.md`
  - `openspec/changes/archive/fe-composites-p0-panel-and-command-items/**`
  - `openspec/changes/archive/fe-editor-tokenization-selection-and-spacing/**`
  - `openspec/changes/archive/fe-editor-advanced-interactions/**`
- Affected code:
  - 无业务代码变更（仅 OpenSpec/Rulebook 治理收口）
- Breaking change: NO
- User benefit: Wave 4a 交付状态与仓库事实严格一致，后续 Wave 4b 依赖判断可直接使用 EO 文档。
