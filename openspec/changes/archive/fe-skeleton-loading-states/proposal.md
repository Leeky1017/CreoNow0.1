# 提案：fe-skeleton-loading-states

更新时间：2026-02-28 19:20

## Why（问题与目标）

项目已有 `Skeleton` Primitive，但 Feature 层几乎完全未使用：加载态多为居中 Spinner 或空白。对写作 IDE 来说，加载反馈应更“安静而可预期”。

设计规范已给出阈值：加载时间 > 200ms 必须提供骨架屏。

本 change 目标：为关键区域补齐骨架屏，并建立可复用的加载态规范。

## What（交付内容）

- 建立 Skeleton 使用规范：
  - <200ms 不显示骨架
  - >=200ms 显示骨架
- 为关键 Feature 增加骨架屏：
  - Dashboard
  - FileTreePanel
  - CharacterPanel
  - KnowledgeGraph

## Scope（影响范围）

- OpenSpec Delta:
  - `openspec/changes/fe-skeleton-loading-states/specs/workbench/spec.md`
- 预期实现触点（后续 Apply 阶段）：
  - `apps/desktop/renderer/src/components/primitives/Skeleton.tsx`
  - 相关 Feature 组件的 loading 分支

## Out of Scope（不做什么）

- 不在本 change 内重构数据加载层（仅改善呈现）。

## Dependencies（依赖）

- 上游：`openspec/specs/workbench/spec.md`

## 审阅状态

- Owner 审阅：`PENDING`
