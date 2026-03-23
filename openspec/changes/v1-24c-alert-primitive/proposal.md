# v1-24c: 创建 Alert 组件

> 属于 v1-24-\*（父 change），详细设计见父 change 的 proposal.md。

## 语境

Alert 用于向用户传达 info/warning/error/success 状态信息。
支持标题 + 描述双 slot、自定义图标、可关闭交互。

## 当前状态

- `find SRC/components/primitives -name 'Alert*' | wc -l` → 0

## 目标状态

- `find SRC/components/primitives -name 'Alert*' | wc -l` → 3

## 不做什么

- 不实现 Alert 自动消失（Toast 已覆盖）
- 不实现 Alert 堆叠/队列
- 不修改其他 Primitive 组件

## 完成验证

1. `find SRC/components/primitives -name 'Alert*' | wc -l` → 3
2. `pnpm typecheck` → 0 errors
3. `pnpm -C apps/desktop exec vitest run renderer/src/components/primitives/Alert` → all pass
4. `pnpm -C apps/desktop storybook:build` → success
