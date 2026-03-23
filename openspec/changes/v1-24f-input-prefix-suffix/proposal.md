# v1-24f: 扩展 Input prefix/suffix

> 属于 v1-24-\*（父 change），详细设计见父 change 的 proposal.md。

## 语境

为现有 Input 组件增加 `prefix` 和 `suffix` ReactNode slot，支持搜索图标、
清除按钮等常见模式。不传时保持零回归。

## 当前状态

- `grep -c 'prefix\|suffix' SRC/components/primitives/Input.tsx` → 0
- `wc -l SRC/components/primitives/Input.tsx` → 85

## 目标状态

- `grep -c 'prefix\|suffix' SRC/components/primitives/Input.tsx` → ≥ 4
- Input.test.tsx 包含 prefix/suffix 测试用例

## 不做什么

- 不修改 Input 现有 variant/size 系统
- 不添加 Input group 功能
- 不修改其他 Primitive 组件

## 完成验证

1. `grep -c 'prefix\|suffix' SRC/components/primitives/Input.tsx` → ≥ 4
2. `pnpm typecheck` → 0 errors
3. `pnpm -C apps/desktop exec vitest run renderer/src/components/primitives/Input` → all pass
4. `pnpm -C apps/desktop storybook:build` → success
