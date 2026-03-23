# v1-25b: 创建 DensityProvider + Compact Preset

> 属于 v1-25-\*（父 change），详细设计见父 change 的 proposal.md。

## 语境

DensityProvider 通过 `data-density` attribute 驱动 CSS 层叠覆盖 component token，
实现 compact/comfortable 双密度切换。`:root` 中的值即 comfortable 默认值。

## 当前状态

- `find SRC -name '*Density*' | wc -l` → 0
- `grep -c 'data-density' design/system/01-tokens.css` → 0

## 目标状态

- `find SRC -name '*Density*' | wc -l` → 2（.tsx + .test.tsx）
- `grep -c 'data-density.*compact' design/system/01-tokens.css` → ≥ 1

## 不做什么

- 不迁移组件代码（v1-25c 负责）
- 不创建 Story（v1-25d 负责）
- 不实现 zone-aware density（后续增强）

## 完成验证

1. `find SRC -name '*Density*' | wc -l` → 2
2. `grep -c 'data-density' design/system/01-tokens.css` → ≥ 1
3. `pnpm typecheck` → 0 errors
4. `pnpm -C apps/desktop exec vitest run renderer/src/providers/DensityProvider` → all pass
