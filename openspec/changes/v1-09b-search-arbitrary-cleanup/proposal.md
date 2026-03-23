# v1-09b: 清除搜索面板硬编码值

> 属于 v1-09-\*（父 change），详细设计见父 change 的 proposal.md。

## 语境

搜索面板三个组件中大量 `text-[10px]` 硬编码字号和 1 处 `min-w-[20px]` 硬编码尺寸，需替换为语义 token 或标准 Tailwind 类。

## 当前状态

- `grep -rn 'text-\[[0-9]' SRC/features/search/ --include='*.tsx' | grep -v test | grep -v stories | grep -v 'text-\[var(--' | wc -l` → 16
- `grep -rn 'min-w-\[20px\]' SRC/features/search/ --include='*.tsx' | grep -v test | grep -v stories | wc -l` → 1

## 目标状态

- `grep -rn 'text-\[[0-9]' SRC/features/search/ --include='*.tsx' | grep -v test | grep -v stories | grep -v 'text-\[var(--' | wc -l` → 0
- `grep -rn 'min-w-\[20px\]' SRC/features/search/ --include='*.tsx' | grep -v test | grep -v stories | wc -l` → 0

## 不做什么

- `text-[var(--*)]` 形式的 token 引用（合法）
- `w-[640px]`、`max-h-[80vh]`、`max-h-[60vh]` 等已 eslint-disable 或非像素的设计尺寸
- virtualizer 动态 inline style
- shadow token 对齐（见 v1-09c）

## 完成验证

1. `grep -rn 'text-\[[0-9]' SRC/features/search/ --include='*.tsx' | grep -v test | grep -v stories | grep -v 'text-\[var(--' | wc -l` → 0
2. `grep -rn 'min-w-\[20px\]' SRC/features/search/ --include='*.tsx' | grep -v test | grep -v stories | wc -l` → 0
3. `pnpm typecheck` → 0 errors
4. `pnpm -C apps/desktop exec vitest run SearchPanel` → all pass
