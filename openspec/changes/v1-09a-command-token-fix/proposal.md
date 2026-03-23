# v1-09a: 修正命令面板 token

> 属于 v1-09-*（父 change），详细设计见父 change 的 proposal.md。

## 语境
CommandItem 使用 `--color-accent-blue` 而非 spec 规定的 `--color-info`；命令面板组件残留 `text-[Npx]` 硬编码字号，需替换为语义 token。

## 当前状态
- `grep -rn 'color-accent-blue' SRC/components/composites/CommandItem.tsx` → 1 处
- `grep -rn 'text-\[[0-9]' SRC/features/commandPalette/ SRC/components/composites/Command*.tsx --include='*.tsx' | grep -v test | grep -v stories | grep -v 'text-\[var(--' | wc -l` → 5

## 目标状态
- `grep -rn 'color-accent-blue' SRC/components/composites/CommandItem.tsx` → 0
- `grep -rn 'text-\[[0-9]' SRC/features/commandPalette/ SRC/components/composites/Command*.tsx --include='*.tsx' | grep -v test | grep -v stories | grep -v 'text-\[var(--' | wc -l` → 1（仅保留 `text-[15px]`，无对应 token）

## 不做什么
- `text-[15px]`（CommandPalette.tsx:196）——无对应语义 token，暂不处理
- `text-[var(--*)]` 形式的 token 引用（合法）
- `w-[600px]`、`max-h-[424px]` 等已 eslint-disable 的设计尺寸
- 搜索面板 token 修正（见 v1-09b、v1-09c）

## 完成验证
1. `grep -c 'color-accent-blue' SRC/components/composites/CommandItem.tsx` → 0
2. `grep -rn 'text-\[[0-9]' SRC/features/commandPalette/ SRC/components/composites/Command*.tsx --include='*.tsx' | grep -v test | grep -v stories | grep -v 'text-\[var(--' | grep -v 'text-\[15px\]' | wc -l` → 0
3. `pnpm typecheck` → 0 errors
4. `pnpm -C apps/desktop exec vitest run CommandPalette` → all pass
