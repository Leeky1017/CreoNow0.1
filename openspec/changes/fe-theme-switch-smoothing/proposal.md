# 提案：fe-theme-switch-smoothing

更新时间：2026-02-28 19:20

## Why（问题与目标）

深度审计指出主题切换存在闪烁：切换时缺少过渡，用户感知为“界面抖一下”。这虽不阻断功能，但会持续消耗品质感。

本 change 目标：让主题切换平滑且可控，并尊重 reduced motion。

## What（交付内容）

- 在根节点（如 `<html>` 或 app root）增加主题切换过渡策略：
  - 对 background/color/border 等做短过渡
- reduced motion 启用时禁用该过渡。

## Scope（影响范围）

- OpenSpec Delta:
  - `openspec/changes/fe-theme-switch-smoothing/specs/workbench/spec.md`
- 预期实现触点（后续 Apply 阶段）：
  - `apps/desktop/renderer/src/styles/tokens.css`
  - 主题切换逻辑入口

## Out of Scope（不做什么）

- 不在本 change 内重构主题 Token 体系（只做过渡体验）。

## Dependencies（依赖）

- 建议先行：`fe-reduced-motion-respect`

## 审阅状态

- Owner 审阅：`PENDING`
