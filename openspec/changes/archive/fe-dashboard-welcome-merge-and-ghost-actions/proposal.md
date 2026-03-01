# 提案：fe-dashboard-welcome-merge-and-ghost-actions

更新时间：2026-02-28 19:20

## Why（问题与目标）

Dashboard 是“第一眼”。但当前存在两类损伤信任的体验：

- **WelcomeScreen 与 Dashboard 空状态重复**：功能重叠，入口逻辑分叉，维护成本高。
- **幽灵按钮（Dead UI）**：`View All`、Grid/List 切换等按钮无 handler，可点击但无响应。

本 change 的目标：让“空状态只有一种真相”，并清理所有“有形无魂”的按钮。

## What（交付内容）

- 删除 `WelcomeScreen`，将其入口分支合并到 `DashboardPage` 的 empty state。
- Dashboard empty state 必须提供至少两个闭环入口：
  - Create Project
  - Open Folder（依赖 open-folder IPC/入口 change）
- 清理幽灵按钮：
  - 要么补齐 handler 并闭环
  - 要么移除 UI（禁止占位）

## Scope（影响范围）

- OpenSpec Delta:
  - `openspec/changes/fe-dashboard-welcome-merge-and-ghost-actions/specs/project-management/spec.md`
  - `openspec/changes/fe-dashboard-welcome-merge-and-ghost-actions/specs/workbench/spec.md`
- 预期实现触点（后续 Apply 阶段）：
  - `apps/desktop/renderer/src/features/dashboard/DashboardPage.tsx`
  - `apps/desktop/renderer/src/components/layout/AppShell.tsx`（Welcome 分支）
  - `apps/desktop/renderer/src/features/welcome/WelcomeScreen.tsx`（删除）

## Out of Scope（不做什么）

- 不在本 change 内实现“项目摘要/最近编辑内容”高级信息（若缺数据源则另立 change）。

## Dependencies（依赖）

- 上游：`fe-cleanup-proxysection-and-mocks`（避免 dead 入口堆叠）
- 上游：`fe-ui-open-folder-entrypoints`（Open Folder 行为闭环）

## 审阅状态

- Owner 审阅：`PENDING`
