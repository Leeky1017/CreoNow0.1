# Tasks: v1-06a 拆分 AiMessageList 子组件

- **父 change**: v1-06-ai-panel-overhaul
- **状态**: 📋 待实施
- **任务数**: 4

---

## 文件组

- [ ] `AiMessageList.tsx` 提取 ErrorGuideCard + AiPanelErrorDisplay 到新文件
      操作：将 L32–197（ErrorGuideCard 组件 + AiPanelErrorDisplay 组件）移至 `ErrorGuideCard.tsx`
      实例（2 处组件定义）:
        :32 `export function ErrorGuideCard` → 移至 ErrorGuideCard.tsx
        :133 `function AiPanelErrorDisplay` → 移至 ErrorGuideCard.tsx（同文件，供 ErrorGuideCard 内部使用）
      验证: `wc -l SRC/features/ai/AiMessageList.tsx` → ≤250

- [ ] `ErrorGuideCard.tsx` 创建新文件，接收提取的 ErrorGuideCard + AiPanelErrorDisplay
      操作：新建文件，包含从 AiMessageList 提取的两个组件 + 必要 imports
      验证: `wc -l SRC/features/ai/ErrorGuideCard.tsx` → ≤250

- [ ] `AiMessageList.tsx` 更新 imports，引用新文件的 ErrorGuideCard
      操作：添加 `import { ErrorGuideCard } from "./ErrorGuideCard"` 并移除内联定义
      验证: `grep 'import.*ErrorGuideCard' SRC/features/ai/AiMessageList.tsx` → 1 match

- [ ] 回归验证
      操作：运行全量 AI 测试 + typecheck
      验证: `pnpm -C apps/desktop exec vitest run ai` → all pass; `pnpm typecheck` → 0 errors

---

## 整体验证

```bash
wc -l apps/desktop/renderer/src/features/ai/AiMessageList.tsx   # → ≤250
wc -l apps/desktop/renderer/src/features/ai/ErrorGuideCard.tsx   # → ≤250
pnpm typecheck                                                    # → 0 errors
pnpm -C apps/desktop exec vitest run ai                          # → all pass
```
