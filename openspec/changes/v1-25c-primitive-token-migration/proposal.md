# v1-25c: Primitive Component Token 迁移

> 属于 v1-25-\*（父 change），详细设计见父 change 的 proposal.md。

## 语境

将 Button/Input/Card/ListItem/Toast 的 hardcoded spacing 替换为 v1-25a 定义的
component token 引用，使其在 DensityProvider compact 模式下自动适配。
同时收编现有 ListItem/Card 的 compact prop 到 DensityProvider 机制。

## 当前状态

- `grep -rn 'var(--button-\|var(--input-\|var(--card-\|var(--listitem-' SRC/components/primitives --include='*.tsx' | wc -l` → 0

## 目标状态

- `grep -rn 'var(--button-\|var(--input-\|var(--card-\|var(--listitem-' SRC/components/primitives --include='*.tsx' | wc -l` → ≥ 10

## 不做什么

- 不修改 token 定义（v1-25a 已完成）
- 不创建 Story（v1-25d 负责）
- 不修改 DensityProvider 本身

## 完成验证

1. `grep -rn 'var(--button-\|var(--input-\|var(--card-\|var(--listitem-' SRC/components/primitives --include='*.tsx' | wc -l` → ≥ 10
2. `pnpm typecheck` → 0 errors
3. `pnpm -C apps/desktop exec vitest run` → all pass（含回归）
