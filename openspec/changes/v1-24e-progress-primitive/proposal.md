# v1-24e: 创建 Progress 组件

> 属于 v1-24-\*（父 change），详细设计见父 change 的 proposal.md。

## 语境

Progress 是确定性进度条组件，支持 0-100 百分比值、4 种语义色 variant、
2 种尺寸，遵循 `role="progressbar"` ARIA 模式。

## 当前状态

- `find SRC/components/primitives -name 'Progress*' | wc -l` → 0

## 目标状态

- `find SRC/components/primitives -name 'Progress*' | wc -l` → 3

## 不做什么

- 不实现 indeterminate 进度条（后续增强）
- 不实现环形进度
- 不修改其他 Primitive 组件

## 完成验证

1. `find SRC/components/primitives -name 'Progress*' | wc -l` → 3
2. `pnpm typecheck` → 0 errors
3. `pnpm -C apps/desktop exec vitest run renderer/src/components/primitives/Progress` → all pass
4. `pnpm -C apps/desktop storybook:build` → success
