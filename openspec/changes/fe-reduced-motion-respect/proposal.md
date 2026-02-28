# 提案：fe-reduced-motion-respect

更新时间：2026-02-28 19:20

## Why（问题与目标）

设计规范要求尊重 `prefers-reduced-motion`，但 Feature 层仍存在自定义动画（fade/slide/延迟）未做降级，导致对运动敏感用户体验不达标。

本 change 目标：将 reduced motion 从“个别组件记得做”提升为“系统级默认”。

## What（交付内容）

- 在 `tokens.css`（或等价全局样式）中统一定义 reduced motion 策略：
  - 关闭或缩短所有自定义动画/过渡
- 要求 Feature 层动画仅使用 token 化 duration/easing，并自动受 reduced motion 影响。

## Scope（影响范围）

- OpenSpec Delta:
  - `openspec/changes/fe-reduced-motion-respect/specs/workbench/spec.md`
- 预期实现触点（后续 Apply 阶段）：
  - `apps/desktop/renderer/src/styles/tokens.css`
  - 现存使用 `animate-*`/内联 animation 的 Feature 组件

## Out of Scope（不做什么）

- 不在本 change 内设计新的动效体系，只做降级与一致性。

## Dependencies（依赖）

- 上游：`openspec/specs/workbench/spec.md`

## 审阅状态

- Owner 审阅：`PENDING`
