# Proposal: issue-796-fe-rightpanel-ai-tabbar-layout
更新时间：2026-03-01 10:08

## Why
当前右侧 AI 面板把“面板级动作”放在面板内部 header，导致 tab bar 与内容层职责割裂：History/NewChat 入口重复占位，且候选数 `1x` 按钮在主交互区暴露高级策略，增加认知噪声。为与 Workbench 的面板分层一致，需要把动作入口上提到 RightPanel tab bar，并让 AiPanel 聚焦内容与执行结果。

## What Changes
- 在 `RightPanel` 的 tab bar 右侧增加 AI 专属动作区，仅在 `activeRightPanel === "ai"` 时展示 `History` 与 `New Chat`。
- 移除 `AiPanel` 内部独立 header（不再渲染 `ai-history-toggle` / `ai-new-chat`）。
- 移除 `AiPanel` 主界面的 candidateCount 循环按钮（`1x~5x`），但保留 `creonow.ai.candidateCount` 持久化与请求参数传递逻辑。
- 补齐本任务治理文档：Rulebook proposal/tasks、OpenSpec change tasks 与 RUN_LOG 叙述对齐。

## Impact
- Affected specs:
  - `openspec/changes/fe-rightpanel-ai-tabbar-layout/specs/workbench/spec.md`
- Affected code:
  - `apps/desktop/renderer/src/components/layout/RightPanel.tsx`
  - `apps/desktop/renderer/src/features/ai/AiPanel.tsx`
  - `apps/desktop/renderer/src/components/layout/RightPanel.ai-tabbar-actions.test.tsx`
  - `apps/desktop/renderer/src/features/ai/AiPanel.layout.test.tsx`
- Breaking change: NO
- User benefit: 右侧面板结构更统一（动作在 tab bar、内容在 panel body），主界面去除低语义控件，保留高级参数持久化能力而不打扰主流程。
