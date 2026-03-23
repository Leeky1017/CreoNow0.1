# v1-16b: 清理 + quality-gates/rightpanel 硬编码像素

> 属于 v1-16-\*（父 change），详细设计见父 change 的 proposal.md。

## 语境

quality-gates 与 rightpanel 两个模块存在大量 `text-[Npx]`、`w-[Npx]`、`h-[Npx]`、`left-[Npx]`、`translate-x-[Npx]` 等硬编码像素值，需替换为 Design Token 或 Tailwind 标准类。`text-[var(--*)]` 是合法 token 引用，不处理。

## 当前状态

- `grep -rn 'text-\[[0-9]\+px\]' SRC/features/quality-gates/ SRC/features/rightpanel/ --include='*.tsx' | grep -v test | grep -v stories | wc -l` → 26
- `grep -rn -E '(w|h|left|translate-x)-\[[0-9]+' SRC/features/quality-gates/ --include='*.tsx' | grep -v test | grep -v stories | wc -l` → 2（line 122, 124）

## 目标状态

- `grep -rn 'text-\[[0-9]\+px\]' SRC/features/quality-gates/ SRC/features/rightpanel/ --include='*.tsx' | grep -v test | grep -v stories | wc -l` → 0
- `grep -rn -E '(w|h|left|translate-x)-\[[0-9]+' SRC/features/quality-gates/ --include='*.tsx' | grep -v test | grep -v stories | wc -l` → 0

## 不做什么

- 不修改 `text-[var(--*)]` 形式的合法 token 引用
- 不修改 diff 模块（另案处理）
- 不拆分/重构文件结构

## 完成验证

1. `grep -rn 'text-\[[0-9]\+px\]' SRC/features/quality-gates/ SRC/features/rightpanel/ --include='*.tsx' | grep -v test | grep -v stories | wc -l` → 0
2. `grep -rn -E '(w|h|left|translate-x)-\[[0-9]+px' SRC/features/quality-gates/ --include='*.tsx' | grep -v test | grep -v stories | wc -l` → 0
3. `pnpm typecheck` → 0 errors
4. `pnpm -C apps/desktop exec vitest run quality` → all pass
