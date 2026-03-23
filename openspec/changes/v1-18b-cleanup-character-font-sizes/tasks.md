# Tasks: v1-18b 清理 features/character/ 硬编码字号

- **父 change**: v1-18-arbitrary-value-cleanup
- **状态**: 📋 待实施
- **任务数**: 11

---

## AddRelationshipPopover.tsx

- [ ] `AddRelationshipPopover.tsx` 全部 `text-[Npx]` → 语义 token
      实例（5 处）:
      :160 `text-[10px]` → `text-(--text-label)`
      :180 `text-[10px]` → `text-(--text-label)`
      :217 `text-[10px]` → `text-(--text-label)`
      :237 `text-[10px]` → `text-(--text-label)`
      :252 `text-[11px]` → `text-(--text-status)`
      验证: `grep 'text-\[[0-9]' apps/desktop/renderer/src/features/character/AddRelationshipPopover.tsx | wc -l` → 0

## CharacterAppearances.tsx

- [ ] `CharacterAppearances.tsx` 全部 `text-[Npx]` → 语义 token
      实例（2 处）:
      :57 `text-[10px]` → `text-(--text-label)`
      :85 `text-[11px]` → `text-(--text-status)`
      验证: `grep 'text-\[[0-9]' apps/desktop/renderer/src/features/character/CharacterAppearances.tsx | wc -l` → 0

## CharacterBasicInfo.tsx

- [ ] `CharacterBasicInfo.tsx` 全部 `text-[Npx]` → 语义 token
      实例（1 处）:
      :73 `text-[10px]` → `text-(--text-label)`
      验证: `grep 'text-\[[0-9]' apps/desktop/renderer/src/features/character/CharacterBasicInfo.tsx | wc -l` → 0

## CharacterCard.tsx

- [ ] `CharacterCard.tsx` 全部硬编码 arbitrary → token/utility
      实例（2 处）:
      :133 `w-[3px]` → 查 tokens.css 确定映射
      :171 `text-[11px]` → `text-(--text-status)`
      验证: `grep -E '(text|w)-\[[0-9]' apps/desktop/renderer/src/features/character/CharacterCard.tsx | grep -v 'var(--' | wc -l` → 0

## CharacterCardList.tsx

- [ ] `CharacterCardList.tsx` 全部 `text-[Npx]` → 语义 token
      实例（1 处）:
      :91 `text-[10px]` → `text-(--text-label)`
      验证: `grep 'text-\[[0-9]' apps/desktop/renderer/src/features/character/CharacterCardList.tsx | wc -l` → 0

## CharacterPanelSections.tsx

- [ ] `CharacterPanelSections.tsx` 全部 `text-[Npx]` → 语义 token
      实例（3 处）:
      :86 `text-[11px]` → `text-(--text-status)`
      :118 `text-[10px]` → `text-(--text-label)`
      :121 `text-[10px]` → `text-(--text-label)`
      验证: `grep 'text-\[[0-9]' apps/desktop/renderer/src/features/character/CharacterPanelSections.tsx | wc -l` → 0

## CharacterRelationships.tsx

- [ ] `CharacterRelationships.tsx` 全部硬编码 arbitrary → token/utility
      实例（4 处）:
      :29 `p-[2px]` → `p-0.5`
      :37 `text-[10px]` → `text-(--text-label)`
      :45 `text-[10px]` → `text-(--text-label)`
      :104 `text-[10px]` → `text-(--text-label)`
      验证: `grep -E '(text|p)-\[[0-9]' apps/desktop/renderer/src/features/character/CharacterRelationships.tsx | grep -v 'var(--' | wc -l` → 0

## GroupSelector.tsx

- [ ] `GroupSelector.tsx` 全部 `text-[Npx]` → 语义 token
      实例（1 处）:
      :87 `text-[10px]` → `text-(--text-label)`
      验证: `grep 'text-\[[0-9]' apps/desktop/renderer/src/features/character/GroupSelector.tsx | wc -l` → 0

## RoleSelector.tsx

- [ ] `RoleSelector.tsx` 全部 `text-[Npx]` → 语义 token
      实例（2 处）:
      :85 `text-[11px]` → `text-(--text-status)`
      :101 `text-[10px]` → `text-(--text-label)`
      验证: `grep 'text-\[[0-9]' apps/desktop/renderer/src/features/character/RoleSelector.tsx | wc -l` → 0

## character-detail-shared.tsx

- [ ] `character-detail-shared.tsx` 全部 `text-[Npx]` → 语义 token
      实例（3 处 text + 1 处尺寸）:
      :95 `text-[10px]` → `text-(--text-label)`
      :122 `text-[10px]` → `text-(--text-label)`
      :139 `text-[11px]` → `text-(--text-status)`
      尺寸 arbitrary:
      :41 `max-h-[92vh]` → 查 tokens.css 确定映射
      豁免: :40 `w-[560px]` 已有 eslint-disable（design spec），不处理
      验证: `grep 'text-\[[0-9]' apps/desktop/renderer/src/features/character/character-detail-shared.tsx | wc -l` → 0

## CharacterDetailDialog.tsx

- [ ] `CharacterDetailDialog.tsx` 全部尺寸 arbitrary → utility
      实例（3 处）:
      :179 `h-[1px]` → `h-px`
      :184 `p-[1px]` → `p-px`
      :222 `w-[1px]` → `w-px`
      验证: `grep -E '(h|p|w)-\[[0-9]' apps/desktop/renderer/src/features/character/CharacterDetailDialog.tsx | grep -v 'var(--' | wc -l` → 0

---

## 整体验证

```bash
# 零硬编码字号
grep -rn 'text-\[[0-9]' apps/desktop/renderer/src/features/character/ --include='*.tsx' \
  | grep -v test | grep -v stories | grep -v __tests__ | wc -l
# → 0

pnpm typecheck                    # → 0 errors
pnpm -C apps/desktop exec vitest run renderer/src/features/character/ --reporter=verbose  # → all pass
```
