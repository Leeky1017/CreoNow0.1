# v1-07b: 补齐 Settings 交互动效

> 属于 v1-07-settings-visual-polish（父 change），详细设计见父 change 的 proposal.md。

## 语境

Settings-dialog 模块的 hover 态、slider 刻度标记、Toggle 过渡动效等交互精修项（父 change AC-4~9）尚需视觉验收确认。部分已有实现（色板 hover:scale-110、nav hover:bg），需逐项审视并补齐缺失动效。

## 当前状态

- `grep -rn 'hover:\|transition' SRC/features/settings-dialog/ --include='*.tsx' | grep -v test | grep -v stories | wc -l` → 8
- Slider 组件已有 `showLabels` + `formatLabel`，刻度标记实现待确认
- Toggle 组件已有 `transition-all`（2 处）

## 目标状态

- 所有交互元素有 hover 态 + transition
- Slider 刻度标记可见（AC-6）
- Toggle 过渡动效 ≥0.15s（AC-9）
- 目视验收通过

## 不做什么

- 不替换 `text-[Npx]` 字号值（归 v1-07a）
- 不改 hex 颜色值（已在父 change 完成）
- 不拆分组件结构（已在父 change 完成）

## 完成验证

1. 目视逐文件检查 hover/transition 覆盖
2. `pnpm typecheck` → 0 errors
3. `pnpm -C apps/desktop exec vitest run settings` → all pass
