# 提案：fe-lucide-icon-unification

更新时间：2026-02-28 19:20

## Why（问题与目标）

项目已引入 `lucide-react`，但 Feature 层仍大量手写内联 SVG，导致：

- strokeWidth/size 不统一，视觉权重漂移
- 同语义图标（search/close）在不同组件中路径不同
- 无法通过统一 API 控制尺寸与对齐

本 change 目标：统一图标来源与规格，减少“细节处各说各话”。

## What（交付内容）

- 将 Feature 层内联 SVG 全部替换为 Lucide 图标（按语义映射）。
- 统一规格：
  - `strokeWidth={1.5}`（默认）
  - `size={16|20|24}`（按场景）

## Scope（影响范围）

- OpenSpec Delta:
  - `openspec/changes/fe-lucide-icon-unification/specs/workbench/spec.md`
- 预期实现触点（后续 Apply 阶段）：
  - DashboardPage/SearchPanel/OnboardingPage/AiPanel 等

## Out of Scope（不做什么）

- 不在本 change 内设计新图标体系（仅统一来源与规格）。

## Dependencies（依赖）

- 上游：`openspec/specs/workbench/spec.md`

## 审阅状态

- Owner 审阅：`PENDING`
