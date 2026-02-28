# 提案：fe-cleanup-proxysection-and-mocks

更新时间：2026-02-28 19:20

## Why（问题与目标）

“君子务本，本立而道生。”（《论语》）在 Workbench 的语境里，本即是：入口真实、按钮有果、页面不诈。

当前前端存在可观的 Dead UI / Mock 残留：

- `ProxySection.tsx` 已被 Owner 确认为死代码，但仍占据认知空间。
- SearchPanel 内存在 `MOCK_SEARCH_RESULTS` 等 mock 数据，混入生产代码路径。
- AI 历史选择存在 placeholder handler（可点但无效果），属于“幽灵交互”。

本 change 目标是清理这些“看似存在”的假象，让 UI 只保留可闭环的真实路径。

## What（交付内容）

- 删除 `ProxySection.tsx` 及其所有引用路径（Owner 已确认删除）。
- 移除 SearchPanel 内的 mock 数据与相关分支，空结果必须走明确 empty state。
- 对 AI 历史列表的占位交互做收敛：
  - 要么实现选择行为并闭环；
  - 要么将入口显式禁用并给出说明（禁止“可点但无效”）。

## Scope（影响范围）

- OpenSpec Delta:
  - `openspec/changes/fe-cleanup-proxysection-and-mocks/specs/workbench/spec.md`
- 预期实现触点（后续 Apply 阶段）：
  - `apps/desktop/renderer/src/features/settings/ProxySection.tsx`（删除）
  - `apps/desktop/renderer/src/features/search/SearchPanel.tsx`
  - `apps/desktop/renderer/src/features/ai/AiPanel.tsx`（或 ChatHistory 子组件）

## Out of Scope（不做什么）

- 不在本 change 内重构 Settings/搜索/AI 面板的整体布局（这些属于后续 S3/S6/S7 等 change）。
- 不在本 change 内新增业务功能按钮（仅清理或收敛占位）。

## Dependencies（依赖）

- 上游：`openspec/specs/workbench/spec.md`
- 下游：`fe-dashboard-welcome-merge-and-ghost-actions`、`fe-searchpanel-tokenized-rewrite`

## 审阅状态

- Owner 审阅：`PENDING`
