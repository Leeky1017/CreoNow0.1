# v1-06a: 拆分 AiMessageList 子组件

> 属于 v1-06-ai-panel-overhaul（父 change），详细设计见父 change 的 proposal.md。

## 语境

AiMessageList.tsx 当前 484 行，包含 3 个组件（ErrorGuideCard、AiPanelErrorDisplay、AiMessageList），超过 ≤300 行的架构目标。需拆分为 2~3 个独立文件，每个 ≤250 行。

## 当前状态

- `wc -l SRC/features/ai/AiMessageList.tsx` → 484

## 目标状态

- `wc -l SRC/features/ai/AiMessageList.tsx` → ≤250
- `wc -l SRC/features/ai/ErrorGuideCard.tsx` → ≤250

## 不做什么

- 不改任何行为逻辑或视觉样式
- 不替换 `text-[Npx]` arbitrary 值（归 v1-18）
- 不新增测试（仅回归验证）

## 完成验证

1. `wc -l SRC/features/ai/AiMessageList.tsx` → ≤250
2. `wc -l SRC/features/ai/ErrorGuideCard.tsx` → ≤250
3. `pnpm typecheck` → 0 errors
4. `pnpm -C apps/desktop exec vitest run ai` → all pass
