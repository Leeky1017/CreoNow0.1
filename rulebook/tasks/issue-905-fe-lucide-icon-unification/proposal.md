# Proposal: issue-905-fe-lucide-icon-unification

## Why

Feature 层散布着 156 处内联 `<svg>` 图标实现，导致图标规格（strokeWidth、size）不一致，难以维护和统一设计语言。

## What Changes

- 将 Feature 层所有内联 `<svg>` 替换为 `lucide-react` 图标组件
- 统一图标规格：`strokeWidth={1.5}`、`size` 为 16/20/24 之一
- 新增 guard 测试防止回归

## Impact

- 15 个 Feature 目录受影响（editor、search、character、outline 等）
- 不涉及交互逻辑改动，纯视觉替换
