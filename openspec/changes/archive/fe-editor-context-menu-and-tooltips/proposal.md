# 提案：fe-editor-context-menu-and-tooltips

更新时间：2026-02-28 19:20

## Why（问题与目标）

深度审计指出两类一致性缺口：

- 编辑区右键菜单仍为浏览器默认菜单（英文条目），缺少 IDE 语义动作。
- Tooltip 体系碎片化：47 个文件使用原生 `title`，少量组件使用 Radix Tooltip，体验与样式不统一。

本 change 目标：

- 为编辑区提供自定义 Context Menu（复用 Radix Primitive）。
- 统一 Tooltip 到 Radix Tooltip，淘汰原生 `title` 作为主要机制。

## What（交付内容）

- 编辑器 Context Menu：
  - 基础动作：复制/粘贴/撤销/重做/格式
  - AI 动作：复用 Bubble Menu 已有入口（润色/改写等）
- Tooltip 统一：
  - Feature 层禁止继续使用原生 `title`
  - 新增 guard/迁移清单

## Scope（影响范围）

- OpenSpec Delta:
  - `openspec/changes/fe-editor-context-menu-and-tooltips/specs/editor/spec.md`
  - `openspec/changes/fe-editor-context-menu-and-tooltips/specs/workbench/spec.md`

## Out of Scope（不做什么）

- 不在本 change 内实现“文件树右键菜单扩展项”（已有基础，可另立迭代）。

## Dependencies（依赖）

- 上游：`openspec/specs/editor/spec.md`、`openspec/specs/workbench/spec.md`
- 建议先行：`fe-reduced-motion-respect`（Tooltip 动画需要 reduced motion）

## 审阅状态

- Owner 审阅：`PENDING`
