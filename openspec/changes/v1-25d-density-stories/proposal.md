# v1-25d: 密度对比 Story + 回归验证

> 属于 v1-25-*（父 change），详细设计见父 change 的 proposal.md。

## 语境
为 DensityProvider 创建 Storybook Story，展示 compact 与 comfortable 密度的
并排对比效果，同时做最终全量回归验证。

## 当前状态
- `find SRC -name 'DensityProvider.stories.*' | wc -l` → 0

## 目标状态
- `find SRC -name 'DensityProvider.stories.*' | wc -l` → 1
- 全量门禁通过

## 不做什么
- 不修改组件实现
- 不修改 token 定义

## 完成验证
1. `find SRC -name 'DensityProvider.stories.*' | wc -l` → 1
2. `pnpm typecheck` → 0 errors
3. `pnpm -C apps/desktop exec vitest run` → all pass
4. `pnpm -C apps/desktop storybook:build` → success
5. `pnpm lint` → 0 new violations
