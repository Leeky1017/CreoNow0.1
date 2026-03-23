# v1-21a: 补齐渐进加载与微交互

> 属于 v1-21-\*（父 change），详细设计见父 change 的 proposal.md。

## 语境

v1-21 已完成虚拟化（5 组件）、Skeleton（9 面板）、list-item-enter/exit、tab-crossfade。
剩余：部分面板 lazy loading 未覆盖、折叠/展开动效、useCountUp 数值动画、拖拽视觉反馈。

## 当前状态

- `grep -rn 'lazy(' SRC/ --include='*.tsx' | grep -v test | wc -l` → 5（仅 AppShellOverlays + RightPanel）
- FileTreePanel / OutlinePanel / AiPanel / SearchPanel 为静态 import
- `grep -rn 'grid-template-rows' SRC/ --include='*.css' | wc -l` → 0
- `grep -rn 'useCountUp' SRC/ | wc -l` → 0
- `grep -rn 'drag-ghost\|drag.*ghost' SRC/ --include='*.css' | wc -l` → 0

## 目标状态

- 所有面板组件 lazy 化 + Suspense fallback → lazy 使用 ≥ 9
- 折叠/展开动效（CSS grid-template-rows 0fr→1fr）
- useCountUp hook + Dashboard 数值动画
- FileTree 拖拽 ghost + 目标指示器

## 不做什么

- 不新增虚拟化组件（已完成 5 个）
- 不新增 Skeleton 文件（已完成 9 个）
- 不引入 Framer Motion

## 完成验证

1. `grep -rn 'lazy(' SRC/ --include='*.tsx' | grep -v test | wc -l` → ≥ 9
2. `grep -rn 'useCountUp' SRC/ --include='*.ts' | wc -l` → ≥ 2
3. `pnpm typecheck` → 0 errors
4. `pnpm -C apps/desktop exec vitest run countUp lazy` → all pass
