# v1-07a: 清理 Settings 硬编码字号

> 属于 v1-07-settings-visual-polish（父 change），详细设计见父 change 的 proposal.md。

## 语境

Settings-dialog 模块残留 6 处 `text-[Npx]` 硬编码字号，需替换为语义化 Design Token。`max-w-[560px]` 已有 eslint-disable 注释属于设计规格值，不处理。

## 当前状态

- `grep -rn 'text-\[[0-9]' SRC/features/settings-dialog/ --include='*.tsx' | grep -v test | grep -v stories | wc -l` → 6

## 目标状态

- `grep -rn 'text-\[[0-9]' SRC/features/settings-dialog/ --include='*.tsx' | grep -v test | grep -v stories | wc -l` → 0

## 不做什么

- 不处理 `text-[var(--*)]`（合法 token 引用）
- 不处理 `max-w-[560px]`（已有 eslint-disable，设计规格值）
- 不改 hover/transition 动效（归 v1-07b）

## 完成验证

1. `grep -rn 'text-\[[0-9]' SRC/features/settings-dialog/ --include='*.tsx' | grep -v test | grep -v stories | wc -l` → 0
2. `pnpm typecheck` → 0 errors
3. `pnpm -C apps/desktop exec vitest run settings` → all pass
