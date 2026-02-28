# 提案：fe-feature-focus-visible-coverage

更新时间：2026-02-28 19:20

## Why（问题与目标）

Primitives 层已有较完整的 `focus-visible` 样式，但 Feature 层仍存在大量自定义按钮/列表项缺失焦点反馈，导致键盘用户“无迹可循”。

本 change 目标：补齐 Feature 层的 `focus-visible` 覆盖，确保键盘操作可用。

## What（交付内容）

- 为 Feature 层所有可交互元素补齐 `focus-visible` 样式。
- 优先通过复用 Primitives/Composites 收敛解决，避免逐点打补丁。

## Scope（影响范围）

- OpenSpec Delta:
  - `openspec/changes/fe-feature-focus-visible-coverage/specs/workbench/spec.md`
- 预期实现触点（后续 Apply 阶段）：
  - Dashboard/Search/AiPanel/Character/KG 等 Feature 组件

## Out of Scope（不做什么）

- 不在本 change 内全量改造 aria-live/屏幕阅读器播报（见 `fe-accessibility-aria-live`）。

## Dependencies（依赖）

- 上游：`openspec/specs/workbench/spec.md`
- 建议先行：`fe-composites-*`（用 Composite 统一落地 focus-visible）

## 审阅状态

- Owner 审阅：`PENDING`
