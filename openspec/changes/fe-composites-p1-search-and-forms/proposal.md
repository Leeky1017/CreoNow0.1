# 提案：fe-composites-p1-search-and-forms

更新时间：2026-02-28 19:20

## Why（问题与目标）

P1 Composite 主要解决两类重复：

- 搜索输入（SearchPanel/CommandPalette/FileTreePanel）反复造轮子
- 表单字段（Settings/Export）反复造 label/help/error 的结构

以及工具栏按钮组（EditorToolbar/DiffHeader）缺少统一 group 规范。

本 change 目标：补齐 P1 composites，减少 Feature 层散写。

## What（交付内容）

- 新增 P1 Composites：
  - `SearchInput`
  - `FormField`
  - `ToolbarGroup`
- 在至少 2 个 Feature 中完成替换示范（其余可后续逐步迁移）。

## Scope（影响范围）

- OpenSpec Delta:
  - `openspec/changes/fe-composites-p1-search-and-forms/specs/workbench/spec.md`

## Out of Scope（不做什么）

- 不在本 change 内做 P2 composites 与全量迁移。

## Dependencies（依赖）

- 建议先行：`fe-composites-p0-panel-and-command-items`

## 审阅状态

- Owner 审阅：`PENDING`
