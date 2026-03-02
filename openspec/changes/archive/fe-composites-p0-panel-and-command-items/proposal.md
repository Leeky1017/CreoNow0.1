# 提案：fe-composites-p0-panel-and-command-items

更新时间：2026-02-28 19:20

## Why（问题与目标）

根因 R3 指向一个缺口：Layer 2（Composites）不足，导致 Feature 层要么直接绕过 Primitives 散写原生元素，要么复制粘贴 panel/list/command item 的结构与样式。

本 change 先落地优先级 P0 的三类 Composite，用最小数量覆盖最大脏区：

- PanelContainer（面板容器）
- SidebarItem（侧边栏项）
- CommandItem（命令项）

## What（交付内容）

- 新增并固化 P0 Composites：PanelContainer/SidebarItem/CommandItem
- 在高频 Feature 中替换散装实现（至少覆盖：AiPanel/SearchPanel/FileTreePanel/CommandPalette）

## Scope（影响范围）

- OpenSpec Delta:
  - `openspec/changes/fe-composites-p0-panel-and-command-items/specs/workbench/spec.md`
- 预期实现触点（后续 Apply 阶段）：
  - `apps/desktop/renderer/src/components/composites/*`（新）
  - 相关 Feature 替换点

## Out of Scope（不做什么）

- 不在本 change 内完成 P1/P2 composites（见后续 `fe-composites-p1-search-and-forms` / `fe-composites-p2-empties-and-confirms`）。

## Dependencies（依赖）

- 上游：`openspec/specs/workbench/spec.md`
- 建议并行：`fe-searchpanel-tokenized-rewrite`（可共享 Composite）

## 审阅状态

- Owner 审阅：`PENDING`
