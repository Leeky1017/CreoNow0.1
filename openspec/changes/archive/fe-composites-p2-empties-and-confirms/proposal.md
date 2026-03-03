# 提案：fe-composites-p2-empties-and-confirms

更新时间：2026-02-28 19:20

## Why（问题与目标）

项目已有 `EmptyState` 组件，但多处面板空状态仍自行实现；确认弹窗与信息条也存在重复造轮子。

P2 composites 解决的是“风格一致性与人机语义一致性”：同一语义（空/确认/提示）不应长出十副面孔。

本 change 目标：补齐 EmptyState/ConfirmDialog/InfoBar，并迁移关键面板的散装实现。

## What（交付内容）

- 新增/固化 P2 Composites：
  - `EmptyState`
  - `ConfirmDialog`
  - `InfoBar`
- 迁移至少以下散装空状态：
  - FileTreePanel 空状态
  - CommandPalette 无结果空状态
  - AiPanel 空状态

## Scope（影响范围）

- OpenSpec Delta:
  - `openspec/changes/fe-composites-p2-empties-and-confirms/specs/workbench/spec.md`

## Out of Scope（不做什么）

- 不在本 change 内重构 Toast 队列系统（若需要多 toast 队列，可另立 change）。

## Dependencies（依赖）

- 建议先行：`fe-composites-p0-panel-and-command-items`、`fe-composites-p1-search-and-forms`

## 审阅状态

- Owner 审阅：`PENDING`
