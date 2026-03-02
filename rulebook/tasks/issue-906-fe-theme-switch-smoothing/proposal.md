# Proposal: fe-theme-switch-smoothing

更新时间：2026-03-02 16:30

## Issue

- **GitHub Issue**: #906
- **分支**: `task/906-fe-theme-switch-smoothing`

## 变更摘要

在主题切换时添加平滑 CSS 过渡（background-color / color / border-color），消除 dark↔light 闪烁。同时尊重 `prefers-reduced-motion: reduce` 偏好，在该媒体查询条件下禁用过渡。

## 影响范围

- `apps/desktop/renderer/src/styles/main.css` — 新增过渡规则
- 不修改主题 Token 体系
- 不修改交互逻辑

## 验证方式

- Guard 测试（静态源码断言）
- 全量回归测试
