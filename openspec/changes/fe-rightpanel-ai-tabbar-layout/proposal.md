# 提案：fe-rightpanel-ai-tabbar-layout

更新时间：2026-02-28 19:20

## Why（问题与目标）

当前 AI 面板存在三处“费墨”：

1. `1x`（候选数）按钮在 1x~5x 循环，缺少语义说明，普通用户无法理解其作用。
2. History/NewChat 按钮独占 header 一行，浪费纵向空间，反而加重边框分割。
3. History/NewChat 点击目标过小（20×20px），低于 WCAG 2.2 触控目标最小 24×24px 的建议阈值。

本 change 目标是将 AI 面板的操作入口收敛到“RightPanel tab bar”这一层级：让面板更像 IDE 的子视图，而不是一个自建页面。

## What（交付内容）

- 移除 AI 面板内的 candidateCount（`1x`）工具按钮：不再在主交互面板中暴露该概念。
- 将 History/NewChat 从 AiPanel header 迁移到 RightPanel tab bar 的右侧动作区：
  - 仅在 activeRightPanel === "ai" 时渲染
  - 点击目标尺寸不小于 24×24px
- 候选数的持久化能力保留（localStorage/后端逻辑保持）：
  - 默认值为 1
  - 若需要高级配置，入口迁移到 Settings → AI（高级选项）

## Scope（影响范围）

- OpenSpec Delta:
  - `openspec/changes/fe-rightpanel-ai-tabbar-layout/specs/workbench/spec.md`
- 预期实现触点（后续 Apply 阶段）：
  - `apps/desktop/renderer/src/components/layout/RightPanel.tsx`
  - `apps/desktop/renderer/src/features/ai/AiPanel.tsx`
  - `apps/desktop/renderer/src/features/settings/*`（AI 高级选项）

## Out of Scope（不做什么）

- 不在本 change 内处理 AI 错误引导卡片与边框降噪（见 `fe-rightpanel-ai-guidance-and-style`）。
- 不在本 change 内处理 RightPanel 的 `Quality` tab 取舍（见 `fe-spec-drift-iconbar-rightpanel-alignment`）。

## Dependencies（依赖）

- 上游：`openspec/specs/workbench/spec.md`
- 下游：`fe-visual-noise-reduction`

## 审阅状态

- Owner 审阅：`PENDING`
