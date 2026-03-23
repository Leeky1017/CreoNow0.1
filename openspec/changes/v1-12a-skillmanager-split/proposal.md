# v1-12a: 拆分 SkillManagerDialog

> 属于 v1-12-interaction-motion-and-native-cleanup（父 change），详细设计见父 change 的 proposal.md。

## 语境
SkillManagerDialog.tsx 当前 617 行，含 4 个组件 + 3 个工具函数 + 3 个类型，需拆成 ≤300 行的子文件。

## 当前状态
- `wc -l SRC/features/ai/SkillManagerDialog.tsx` → 617

## 目标状态
- `wc -l SRC/features/ai/SkillManagerDialog.tsx` → ≤300
- `wc -l SRC/features/ai/SkillFormFields.tsx` → ≤200
- `wc -l SRC/features/ai/SkillItemList.tsx` → ≤100
- `wc -l SRC/features/ai/skill-manager.types.ts` → ≤20
- `wc -l SRC/features/ai/skill-manager-utils.ts` → ≤60

## 不做什么
- 不改任何组件行为或 props 接口
- 不调整样式或 Design Token
- 不增删测试用例（仅调整 import 路径）

## 完成验证
1. `wc -l SRC/features/ai/SkillManagerDialog.tsx` → ≤300
2. `pnpm typecheck` → 0 errors
3. `pnpm -C apps/desktop exec vitest run SkillManager` → all pass
