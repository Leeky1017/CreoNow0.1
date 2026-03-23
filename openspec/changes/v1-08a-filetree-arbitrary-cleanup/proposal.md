# v1-08a: 清除文件树硬编码像素

> 属于 v1-08-\*（父 change），详细设计见父 change 的 proposal.md。

## 语境

文件树模块遗留少量 `h-[2px]` 和 `text-[10px]` 硬编码值，需替换为标准 Tailwind 类或语义 token。

## 当前状态

- `grep -rn '(w|h|p|gap)-\[[0-9]' SRC/features/files/ --include='*.tsx' | grep -v test | grep -v stories | wc -l` → 2
- `grep -rn 'text-\[[0-9]' SRC/features/files/ --include='*.tsx' | grep -v test | grep -v stories | grep -v 'text-\[var(--'` → 1

## 目标状态

- `grep -rn '(w|h|p|gap)-\[[0-9]' SRC/features/files/ --include='*.tsx' | grep -v test | grep -v stories | wc -l` → 0
- `grep -rn 'text-\[[0-9]' SRC/features/files/ --include='*.tsx' | grep -v test | grep -v stories | grep -v 'text-\[var(--'` → 0

## 不做什么

- `text-[var(--*)]` 形式的 token 引用（合法，不处理）
- `style={{ paddingLeft }}` 等动态计算内联样式（virtualizer / depth 缩进）
- 文件树动画相关改动（见 v1-08b）

## 完成验证

1. `grep -rn '(w|h|p|gap)-\[[0-9]' SRC/features/files/ --include='*.tsx' | grep -v test | grep -v stories | wc -l` → 0
2. `grep -rn 'text-\[[0-9]' SRC/features/files/ --include='*.tsx' | grep -v test | grep -v stories | grep -v 'text-\[var(--' | wc -l` → 0
3. `pnpm typecheck` → 0 errors
4. `pnpm -C apps/desktop exec vitest run FileTree` → all pass
