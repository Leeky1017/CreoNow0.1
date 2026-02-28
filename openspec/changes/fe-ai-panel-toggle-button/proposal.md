# 提案：fe-ai-panel-toggle-button

更新时间：2026-02-28 19:20

## Why（问题与目标）

当前右侧 AI 面板主要依赖快捷键 `Ctrl+L` 或手动拖拽展开，缺少“可见的门”。对标 Cursor/Windsurf，编辑器右上角通常存在明确的 AI toggle 按钮，既是入口也是状态提示。

本 change 的目标：提供一个显式 AI toggle 按钮，让“AI 面板在哪里”不再需要记忆成本。

## What（交付内容）

- 在主编辑区右上角（或工具栏区域）新增 AI toggle 按钮：
  - 点击：展开/折叠 RightPanel
  - 并自动切换 activeRightPanel 为 `ai`
- Tooltip 必须提示快捷键：`AI Panel (Ctrl+L)`

## Scope（影响范围）

- OpenSpec Delta:
  - `openspec/changes/fe-ai-panel-toggle-button/specs/workbench/spec.md`
- 预期实现触点（后续 Apply 阶段）：
  - `apps/desktop/renderer/src/components/layout/AppShell.tsx` 或 `EditorToolbar`（以现有结构为准）
  - `apps/desktop/renderer/src/stores/layoutStore.tsx`

## Out of Scope（不做什么）

- 不在本 change 内调整 AI 面板内部布局（见 `fe-rightpanel-ai-tabbar-layout` / `fe-rightpanel-ai-guidance-and-style`）。

## Dependencies（依赖）

- 上游：`openspec/specs/workbench/spec.md`

## 审阅状态

- Owner 审阅：`PENDING`
