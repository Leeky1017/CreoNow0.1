# v1-08b: 迁移文件树旋转动画

> 属于 v1-08-*（父 change），详细设计见父 change 的 proposal.md。

## 语境
文件树箭头展开/折叠使用 inline `style={{ transform: rotate(...) }}`，应迁移为 Tailwind rotate 类以保持一致性。

## 当前状态
- `grep -n 'rotate(90deg)\|rotate(0deg)' SRC/features/files/FileTreeNodeRow.tsx` → 2 行（:173, :174）

## 目标状态
- `grep -n 'rotate(90deg)\|rotate(0deg)' SRC/features/files/FileTreeNodeRow.tsx` → 0 行
- 箭头旋转通过 Tailwind `rotate-90` / `rotate-0` className 驱动

## 不做什么
- `transition-transform duration-[var(--duration-fast)]` 已使用 token，不处理
- `style={{ paddingLeft }}` 等动态计算内联样式
- 硬编码像素值（见 v1-08a）

## 完成验证
1. `grep -c 'rotate(90deg)\|rotate(0deg)' SRC/features/files/FileTreeNodeRow.tsx` → 0
2. `pnpm typecheck` → 0 errors
3. `pnpm -C apps/desktop exec vitest run FileTree` → all pass
