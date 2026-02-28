# 提案：fe-deterministic-now-injection

更新时间：2026-02-28 19:20

## Why（问题与目标）

部分 UI helper 直接调用 `Date.now()`（如相对时间格式化、SearchPanel 的 flashKey 生成），会导致测试不确定：今天通过、明天可能失败。

本 change 目标：将“现在”从隐式全局变为可注入依赖，使测试可控、行为可复现。

## What（交付内容）

- 将时间相关 helper 改为可注入 `now`：
  - `formatRelativeTime(now, ...)` 或通过依赖注入
- 在测试中统一使用 fake timer 或固定 `now`。

## Scope（影响范围）

- OpenSpec Delta:
  - `openspec/changes/fe-deterministic-now-injection/specs/workbench/spec.md`
- 预期实现触点（后续 Apply 阶段）：
  - 时间格式化工具
  - 使用 flashKey 的交互逻辑

## Out of Scope（不做什么）

- 不在本 change 内全量重构时间库（仅解决不确定性）。

## Dependencies（依赖）

- 上游：`openspec/specs/workbench/spec.md`

## 审阅状态

- Owner 审阅：`PENDING`
