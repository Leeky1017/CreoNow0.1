# v1-12c: 铺设 scroll-shadow-y

> 属于 v1-12-interaction-motion-and-native-cleanup（父 change），详细设计见父 change 的 proposal.md。

## 语境
`.scroll-shadow-y` 已定义于 main.css，当前 10 个文件（16 处）已使用。仍有 15 个含 `overflow-y-auto` / `overflow-auto` 的可滚动容器尚未铺设。

## 当前状态
- `grep -rn 'scroll-shadow' SRC/ --include='*.tsx' | grep -v test | grep -v stories | wc -l` → 16

## 目标状态
- `grep -rn 'scroll-shadow' SRC/ --include='*.tsx' | grep -v test | grep -v stories | wc -l` → ≥30

## 不做什么
- 不修改 `.scroll-shadow-y` 的 CSS 定义
- 不新增 Design Token
- 不改组件逻辑或 props

## 完成验证
1. `grep -rn 'scroll-shadow' SRC/ --include='*.tsx' | grep -v test | grep -v stories | wc -l` → ≥30
2. `pnpm typecheck` → 0 errors
3. `pnpm -C apps/desktop exec vitest run` → all pass
