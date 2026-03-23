# v1-19a: 补齐 ARIA 语义标记

> 属于 v1-19-*（父 change），详细设计见父 change 的 proposal.md。

## 语境
v1-19 Phase 1/3/4/5 中与 ARIA 属性、高对比/forced-colors CSS、屏幕阅读器辅助组件、axe-core CI 集成相关的未完成项。
键盘导航部分拆入 v1-19b。

## 当前状态
- `grep -rn 'aria-label' SRC/ --include='*.tsx' | grep -v test | grep -v stories | wc -l` → 70
- `grep -rn 'role=' SRC/ --include='*.tsx' | grep -v test | grep -v stories | wc -l` → 70
- `grep -rn 'forced-colors' SRC/ --include='*.css'` → 0
- `grep -rn 'SkipLink\|LiveRegion' SRC/` → 0
- `grep 'vitest-axe\|addon-a11y' apps/desktop/package.json` → 0

## 目标状态
- 所有交互表单元素关联 `aria-label` 或 `<label>` → +23 处
- `FileTreeNodeRow` 补齐 `role="treeitem"` + `aria-expanded` + `aria-level`
- `EditorToolbar` 添加 `role="toolbar"` + `aria-label`
- `forced-colors: active` CSS 媒体查询存在
- `SkipLink` + `LiveRegion` 组件已创建
- axe-core CI gate 或 vitest-axe 集成完成

## 不做什么
- 不做键盘导航增强（v1-19b）
- 不修改 Radix 组件内部 ARIA
- 不做 WCAG AAA

## 完成验证
1. `grep -rn '<Input\|<Select\|<Textarea' SRC/features/ --include='*.tsx' | grep -v test | grep -v stories | grep -v 'aria-label'` → 0
2. `grep -rn 'forced-colors' SRC/ --include='*.css' | wc -l` → ≥ 1
3. `pnpm typecheck` → 0 errors
4. `pnpm -C apps/desktop exec vitest run a11y` → all pass
