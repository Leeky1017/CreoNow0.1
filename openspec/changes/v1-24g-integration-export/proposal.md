# v1-24g: 集成导出验证

> 属于 v1-24-\*（父 change），详细设计见父 change 的 proposal.md。

## 语境

v1-24a~f 各自完成后，本 micro-change 做最终集成验证：确认全部新组件已
从 `primitives/index.ts` 正确导出，组件总数达标，全量门禁通过。

## 当前状态

- 组件文件数: 30（R10 基线）
- `grep -cE 'Table|Separator|Alert|SegmentedControl|Progress' SRC/components/primitives/index.ts` → 0

## 目标状态

- 组件文件数: ≥ 35
- `grep -cE 'Table|Separator|Alert|SegmentedControl|Progress' SRC/components/primitives/index.ts` → ≥ 5

## 不做什么

- 不新增组件（组件在 v1-24a~f 中完成）
- 不修改组件内部实现

## 完成验证

1. `find SRC/components/primitives -maxdepth 1 -name '*.tsx' ! -name '*.test.*' ! -name '*.stories.*' ! -name '*.behavior.*' | wc -l` → ≥ 35
2. `pnpm typecheck` → 0 errors
3. `pnpm -C apps/desktop exec vitest run` → all pass
4. `pnpm lint` → 0 new violations
5. `pnpm -C apps/desktop storybook:build` → success
