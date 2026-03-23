# v1-12b: 铺设 transition 工具类

> 属于 v1-12-interaction-motion-and-native-cleanup（父 change），详细设计见父 change 的 proposal.md。

## 语境
`.transition-default` / `.transition-slow` 已定义于 main.css，但仅 4 个文件（7 处）使用。所有含 `hover:` 的交互元素都应统一铺设。

## 当前状态
- `grep -rn 'transition-default\|transition-slow' SRC/ --include='*.tsx' | grep -v test | grep -v stories | wc -l` → 7

## 目标状态
- `grep -rn 'transition-default\|transition-slow' SRC/ --include='*.tsx' | grep -v test | grep -v stories | wc -l` → ≥25

## 不做什么
- 不修改 `.transition-default` / `.transition-slow` 的 CSS 定义
- 不新增 Design Token
- 不改组件逻辑或 props

## 完成验证
1. `grep -rn 'transition-default\|transition-slow' SRC/ --include='*.tsx' | grep -v test | grep -v stories | wc -l` → ≥25
2. `pnpm typecheck` → 0 errors
3. `pnpm -C apps/desktop exec vitest run` → all pass
