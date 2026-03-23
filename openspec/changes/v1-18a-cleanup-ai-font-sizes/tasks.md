# Tasks: v1-18a 清理 features/ai/ 硬编码字号

- **父 change**: v1-18-arbitrary-value-cleanup
- **状态**: 📋 待实施
- **任务数**: 7

---

## AiPanelTabBar.tsx

- [ ] `AiPanelTabBar.tsx` 全部 `text-[Npx]` → 语义 token
      实例（1 处）:
        :41 `text-[13px]` → `text-(--text-body)`
      验证: `grep 'text-\[[0-9]' apps/desktop/renderer/src/features/ai/AiPanelTabBar.tsx | wc -l` → 0

## ModelPicker.tsx

- [ ] `ModelPicker.tsx` 全部 `text-[Npx]` → 语义 token
      实例（1 处）:
        :148 `text-[11px]` → `text-(--text-status)`
      验证: `grep 'text-\[[0-9]' apps/desktop/renderer/src/features/ai/ModelPicker.tsx | wc -l` → 0

## AiMessageList.tsx

- [ ] `AiMessageList.tsx` 全部 `text-[Npx]` → 语义 token
      实例（17 处）:
        :80  `text-[13px]` → `text-(--text-body)`
        :83  `text-[12px]` → `text-(--text-caption)`
        :86  `text-[12px]` → `text-(--text-caption)`
        :93  `text-[11px]` → `text-(--text-status)`
        :99  `text-[11px]` → `text-(--text-status)`
        :111 `text-[11px]` → `text-(--text-status)`
        :117 `text-[10px]` → `text-(--text-label)`
        :263 `text-[13px]` → `text-(--text-body)`
        :288 `text-[13px]` → `text-(--text-body)`
        :304 `text-[13px]` → `text-(--text-body)`
        :311 `text-[12px]` → `text-(--text-caption)`
        :356 `text-[12px]` → `text-(--text-caption)`
        :360 `text-[11px]` → `text-(--text-status)`
        :399 `text-[13px]` → `text-(--text-body)`
        :421 `text-[11px]` → `text-(--text-status)`
        :428 `text-[12px]` → `text-(--text-caption)`
        :436 `text-[12px]` → `text-(--text-caption)`
      验证: `grep 'text-\[[0-9]' apps/desktop/renderer/src/features/ai/AiMessageList.tsx | wc -l` → 0

## SkillPicker.tsx

- [ ] `SkillPicker.tsx` 全部 `text-[Npx]` → 语义 token
      实例（6 处）:
        :158 `text-[10px]` → `text-(--text-label)`
        :187 `text-[11px]` → `text-(--text-status)`
        :232 `text-[10px]` → `text-(--text-label)`
        :244 `text-[10px]` → `text-(--text-label)`
        :299 `text-[10px]` → `text-(--text-label)`
        :311 `text-[10px]` → `text-(--text-label)`
      验证: `grep 'text-\[[0-9]' apps/desktop/renderer/src/features/ai/SkillPicker.tsx | wc -l` → 0

## CodeBlock.tsx

- [ ] `CodeBlock.tsx` 全部 `text-[Npx]` → 语义 token
      实例（4 处）:
        :29 `text-[11px]` → `text-(--text-status)`
        :36 `text-[11px]` → `text-(--text-status)`
        :44 `text-[11px]` → `text-(--text-status)`
        :52 `text-[12px]` → `text-(--text-caption)`
      验证: `grep 'text-\[[0-9]' apps/desktop/renderer/src/features/ai/CodeBlock.tsx | wc -l` → 0

## AiInputArea.tsx

- [ ] `AiInputArea.tsx` 全部 `text-[Npx]` → 语义 token
      实例（4 处）:
        :84  `text-[11px]` → `text-(--text-status)`
        :156 `text-[10px]` → `text-(--text-label)`
        :161 `text-[12px]` → `text-(--text-caption)`
        :189 `text-[13px]` → `text-(--text-body)`
      验证: `grep 'text-\[[0-9]' apps/desktop/renderer/src/features/ai/AiInputArea.tsx | wc -l` → 0

## AiUsageStats.tsx

- [ ] `AiUsageStats.tsx` 全部 `text-[Npx]` → 语义 token
      实例（2 处）:
        :20 `text-[10px]` → `text-(--text-label)`
        :25 `text-[11px]` → `text-(--text-status)`
      验证: `grep 'text-\[[0-9]' apps/desktop/renderer/src/features/ai/AiUsageStats.tsx | wc -l` → 0

---

## 整体验证

```bash
# 零硬编码字号
grep -rn 'text-\[[0-9]' apps/desktop/renderer/src/features/ai/ --include='*.tsx' \
  | grep -v test | grep -v stories | grep -v __tests__ | wc -l
# → 0

pnpm typecheck                    # → 0 errors
pnpm -C apps/desktop exec vitest run renderer/src/features/ai/ --reporter=verbose  # → all pass
```
