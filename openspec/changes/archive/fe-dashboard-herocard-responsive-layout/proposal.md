# 提案：fe-dashboard-herocard-responsive-layout

更新时间：2026-02-28 19:20

## Why（问题与目标）

Dashboard 的 HeroCard 右侧装饰区使用固定 `w-[35%]`：超宽屏空旷、窄屏挤压文字，且 `min-h-[280px]` 在小窗口下可能溢出。

本 change 目标：让 HeroCard 响应式更像“弹性骨架”而非“钢板比例”。

## What（交付内容）

- 将装饰区宽度改为 `max-w` 或 `clamp()` 限制：
  - 宽屏不无限膨胀
  - 窄屏可自动收缩或隐藏装饰区
- 调整最小高度策略，避免小窗口溢出。

## Scope（影响范围）

- OpenSpec Delta:
  - `openspec/changes/fe-dashboard-herocard-responsive-layout/specs/project-management/spec.md`
- 预期实现触点（后续 Apply 阶段）：
  - `apps/desktop/renderer/src/features/dashboard/*`（HeroCard）

## Out of Scope（不做什么）

- 不在本 change 内重写 Dashboard 信息架构。

## Dependencies（依赖）

- 上游：`openspec/specs/project-management/spec.md`

## 审阅状态

- Owner 审阅：`PENDING`
