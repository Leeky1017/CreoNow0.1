# v1-06b: 补齐 AI 面板 hover/focus 动效

> 属于 v1-06-ai-panel-overhaul（父 change），详细设计见父 change 的 proposal.md。

## 语境

AI 面板各组件已拆分完成，但 hover/focus 交互动效尚未全面补齐。部分文件有 `hover:` 但缺少 `transition`，部分按钮缺少 `focus-ring`。需逐文件审视并补齐动效一致性。

## 当前状态

- `grep -rn 'hover.*glow\|focus.*ring' SRC/features/ai/ --include='*.tsx' | grep -v test | grep -v stories | wc -l` → 9

## 目标状态

- 所有可交互元素（button、link、选择器）均有 hover 态 + transition
- 所有可聚焦元素有 `focus-ring` 样式
- 目视检查各文件 hover/focus 覆盖完整

## 不做什么

- 不替换 `text-[Npx]` arbitrary 字号值（归 v1-18）
- 不拆分组件结构（v1-06a 负责）
- 不改变功能逻辑

## 完成验证

1. 目视逐文件检查 hover/focus 覆盖
2. `pnpm typecheck` → 0 errors
3. `pnpm -C apps/desktop exec vitest run ai` → all pass
