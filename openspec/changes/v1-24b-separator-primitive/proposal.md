# v1-24b: 创建 Separator 组件

> 属于 v1-24-\*（父 change），详细设计见父 change 的 proposal.md。

## 语境

Separator 用于视觉分隔内容区域，支持水平/垂直方向和默认/粗线样式。
轻量组件，语义化 ARIA `role="separator"`。

## 当前状态

- `find SRC/components/primitives -name 'Separator*' | wc -l` → 0

## 目标状态

- `find SRC/components/primitives -name 'Separator*' | wc -l` → 3

## 不做什么

- 不实现装饰性分隔线（如渐变、虚线）
- 不修改其他 Primitive 组件

## 完成验证

1. `find SRC/components/primitives -name 'Separator*' | wc -l` → 3
2. `pnpm typecheck` → 0 errors
3. `pnpm -C apps/desktop exec vitest run renderer/src/components/primitives/Separator` → all pass
4. `pnpm -C apps/desktop storybook:build` → success
