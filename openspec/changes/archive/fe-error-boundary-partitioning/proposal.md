# 提案：fe-error-boundary-partitioning

更新时间：2026-02-28 19:20

## Why（问题与目标）

当前渲染层仅有单层 `ErrorBoundary` 包裹整个应用：任何子组件（SearchPanel/KG/AI 面板等）崩溃都会导致全屏白屏。对 IDE 产品而言，这是不可接受的“连坐”。

本 change 目标：将错误隔离为分区边界，让崩溃只影响自身区域，主编辑体验不被牵连。

## What（交付内容）

- 建立 4 层 Boundary：
  - AppErrorBoundary（全局兜底）
  - EditorBoundary（主编辑区）
  - SidebarBoundary（左侧栏）
  - PanelBoundary（右侧面板/弹出式面板）
- 每个 Boundary 提供可恢复的 fallback（至少：提示 + 重新加载/关闭该区域）

## Scope（影响范围）

- OpenSpec Delta:
  - `openspec/changes/fe-error-boundary-partitioning/specs/workbench/spec.md`
- 预期实现触点（后续 Apply 阶段）：
  - `apps/desktop/renderer/src/components/layout/AppShell.tsx`
  - 相关区域容器组件

## Out of Scope（不做什么）

- 不在本 change 内做错误上报/遥测体系重构（仅 UI 隔离）。

## Dependencies（依赖）

- 上游：`openspec/specs/workbench/spec.md`

## 审阅状态

- Owner 审阅：`PENDING`
