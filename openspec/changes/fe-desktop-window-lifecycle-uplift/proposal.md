# 提案：fe-desktop-window-lifecycle-uplift

更新时间：2026-02-28 19:20

## Why（问题与目标）

深度审计指出两项桌面产品底盘能力缺口：

- 窗口位置/尺寸不持久化：每次启动回到固定 1280×800，破坏用户习惯。
- 无 single instance lock：可重复启动多个实例，容易造成资源争用与数据一致性风险。

本 change 目标：补齐桌面窗口生命周期的基础契约。

## What（交付内容）

- 窗口状态持久化：记录并恢复位置/尺寸。
- 单实例锁：使用 `requestSingleInstanceLock()`，第二实例应聚焦已有窗口并传递必要参数（如打开路径）。

## Scope（影响范围）

- OpenSpec Delta:
  - `openspec/changes/fe-desktop-window-lifecycle-uplift/specs/workbench/spec.md`
- 预期实现触点（后续 Apply 阶段）：
  - `apps/desktop/main/src/*`（BrowserWindow 创建与 app lifecycle）

## Out of Scope（不做什么）

- 不在本 change 内实现多窗口编辑（先保证单实例正确）。

## Dependencies（依赖）

- 上游：`openspec/specs/workbench/spec.md`

## 审阅状态

- Owner 审阅：`PENDING`
