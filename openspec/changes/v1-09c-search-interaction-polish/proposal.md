# v1-09c: 搜索面板交互修正

> 属于 v1-09-\*（父 change），详细设计见父 change 的 proposal.md。

## 语境

搜索面板 filter pill active 态使用 `--shadow-lg` 而非 spec AC-6 规定的 `--shadow-sm`，需对齐设计规范。

## 当前状态

- `grep -n 'shadow-lg' SRC/features/search/SearchPanelParts.tsx` → 1 处（:24，`shadow-[var(--shadow-lg)]`）

## 目标状态

- `grep -n 'shadow-lg' SRC/features/search/SearchPanelParts.tsx` → 0
- filter pill active shadow 改为 `shadow-[var(--shadow-sm)]`

## 不做什么

- 搜索结果高亮颜色（AC-7 已正确使用 `--color-info-subtle`，R4 确认）
- 键盘导航逻辑（AC-11 已通过 `flatItems` 结构保证，R4 确认）
- 选中结果指示条（AC-9 已使用 `w-0.5 bg-[var(--color-info)]`，R4 确认）
- 硬编码像素值（见 v1-09b）

## 完成验证

1. `grep -c 'shadow-lg' SRC/features/search/SearchPanelParts.tsx` → 0
2. `grep -c 'shadow-sm' SRC/features/search/SearchPanelParts.tsx` → 1
3. `pnpm typecheck` → 0 errors
4. `pnpm -C apps/desktop exec vitest run SearchPanel` → all pass
