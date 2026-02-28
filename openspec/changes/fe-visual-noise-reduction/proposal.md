# 提案：fe-visual-noise-reduction

更新时间：2026-02-28 19:20

## Why（问题与目标）

用户反馈“到处都是框，为了分割而分割”。代码层面表现为多层嵌套 `border`/`rounded`/阴影叠加，信息层级被线条淹没。

本 change 目标：以间距与排版为主分组手段，边框仅用于必要的交互卡片或极弱分隔线。

## What（交付内容）

- 逐区域审计并移除非功能性边框：
  - AI 面板请求区/错误卡片/候选卡片
  - Dashboard 项目卡片与 section
  - Settings sections
- 分隔线统一使用 `--color-separator`（而非 `--color-border-default`）。

## Scope（影响范围）

- OpenSpec Delta:
  - `openspec/changes/fe-visual-noise-reduction/specs/workbench/spec.md`
- 预期实现触点（后续 Apply 阶段）：
  - `apps/desktop/renderer/src/features/ai/*`
  - `apps/desktop/renderer/src/features/dashboard/*`
  - `apps/desktop/renderer/src/features/settings/*`

## Out of Scope（不做什么）

- 不在本 change 内做全量 Token 逃逸清扫（见 `fe-token-escape-sweep`）。

## Dependencies（依赖）

- 建议先行：`fe-rightpanel-ai-tabbar-layout`、`fe-rightpanel-ai-guidance-and-style`、`fe-leftpanel-dialog-migration`

## 审阅状态

- Owner 审阅：`PENDING`
