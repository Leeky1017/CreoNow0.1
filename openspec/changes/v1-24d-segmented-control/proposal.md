# v1-24d: 创建 SegmentedControl 组件

> 属于 v1-24-*（父 change），详细设计见父 change 的 proposal.md。

## 语境
SegmentedControl 是多选一的切换控件（如主题选择器），采用 compound component
模式（SegmentedControl + SegmentedControlItem），语义上等价于 `radiogroup`。

## 当前状态
- `find SRC/components/primitives -name 'Segment*' | wc -l` → 0

## 目标状态
- `find SRC/components/primitives -name 'Segment*' | wc -l` → 3

## 不做什么
- 不实现动画滑块指示器（后续增强）
- 不实现垂直方向布局
- 不修改其他 Primitive 组件

## 完成验证
1. `find SRC/components/primitives -name 'Segment*' | wc -l` → 3
2. `pnpm typecheck` → 0 errors
3. `pnpm -C apps/desktop exec vitest run renderer/src/components/primitives/SegmentedControl` → all pass
4. `pnpm -C apps/desktop storybook:build` → success
