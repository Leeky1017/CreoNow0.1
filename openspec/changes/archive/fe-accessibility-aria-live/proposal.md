# 提案：fe-accessibility-aria-live

更新时间：2026-02-28 19:20

## Why（问题与目标）

当前多个“动态更新区域”缺少 `aria-live`，屏幕阅读器用户无法感知内容变化：

- AI 面板流式输出
- 搜索结果列表
- 自动保存状态变化
- 错误/成功 Toast

本 change 目标：补齐动态内容的播报语义，让无障碍不止停留在 focus-visible。

## What（交付内容）

- 为关键动态区域补齐 `aria-live`：
  - `polite`：非紧急更新（搜索结果刷新、保存状态）
  - `assertive`：错误与关键失败提示
- 明确 AI Service → Workbench 的错误码与播报等级映射（避免所有错误都 assertive）。

## Scope（影响范围）

- OpenSpec Delta:
  - `openspec/changes/fe-accessibility-aria-live/specs/workbench/spec.md`
  - `openspec/changes/fe-accessibility-aria-live/specs/ai-service/spec.md`
- 预期实现触点（后续 Apply 阶段）：
  - `apps/desktop/renderer/src/features/ai/*`
  - `apps/desktop/renderer/src/features/search/*`
  - `apps/desktop/renderer/src/features/editor/*`（autosave 状态）
  - `apps/desktop/renderer/src/components/primitives/Toast.tsx`

## Out of Scope（不做什么）

- 不在本 change 内重构全量键盘导航顺序（另立可用性专项时处理）。

## Dependencies（依赖）

- 上游：`openspec/specs/workbench/spec.md`、`openspec/specs/ai-service/spec.md`

## 审阅状态

- Owner 审阅：`PENDING`
