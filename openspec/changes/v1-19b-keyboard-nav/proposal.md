# v1-19b: 增强键盘导航

> 属于 v1-19-\*（父 change），详细设计见父 change 的 proposal.md。

## 语境

v1-19 Phase 2（键盘导航）中的未完成项：树形键盘导航 hook、网格导航、工具栏导航、Modal focus trap。
ARIA 语义标记部分已拆入 v1-19a。

## 当前状态

- `grep -rn 'useTreeKeyboardNav' SRC/` → 0
- `grep -rn 'tabIndex' SRC/features/ --include='*.tsx' | grep -v test | grep -v stories | wc -l` → 7
- `grep -rn 'onKeyDown' SRC/features/ --include='*.tsx' | grep -v test | grep -v stories | wc -l` → 15 个文件
- `grep -rn 'SkipLink' SRC/` → 0

## 目标状态

- `useTreeKeyboardNav` hook 已创建并集成到 FileTree/Outline
- Dashboard 网格支持方向键导航 (roving tabindex)
- EditorToolbar 支持 ←→ roving tabindex
- 所有自定义 Modal 验证 focus trap
- SkipLink + LiveRegion 组件已创建并集成

## 不做什么

- 不做 ARIA 属性补齐（v1-19a）
- 不修改 Radix Dialog 内置 focus trap
- 不做全局快捷键系统改造

## 完成验证

1. `grep -rn 'useTreeKeyboardNav' SRC/ --include='*.ts' | wc -l` → ≥ 3
2. `grep -rn 'SkipLink' SRC/ --include='*.tsx' | wc -l` → ≥ 2
3. `pnpm typecheck` → 0 errors
4. `pnpm -C apps/desktop exec vitest run keyboard` → all pass
