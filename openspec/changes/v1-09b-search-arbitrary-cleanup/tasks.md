# Tasks: v1-09b 清除搜索面板硬编码值

- **父 change**: v1-09-\*
- **状态**: 📋 待实施
- **任务数**: 4

---

## SearchPanelParts

- [ ] `SearchPanelParts.tsx` 全部 `text-[10px]` → 语义 token
      实例（5 处）:
      :48 `text-[10px]` → `text-(--text-label)`
      :51 `text-[10px]` → `text-(--text-label)`
      :70 `text-[10px]` → `text-(--text-label)`
      :73 `text-[10px]` → `text-(--text-label)`
      :114 `text-[10px]` → `text-(--text-label)`
      验证: `grep 'text-\[10px\]' SRC/features/search/SearchPanelParts.tsx | wc -l` → 0

- [ ] `SearchPanelParts.tsx` 全部 `min-w-[20px]` → `min-w-5`
      实例（1 处）:
      :70 `min-w-[20px]` → `min-w-5`
      验证: `grep 'min-w-\[20px\]' SRC/features/search/SearchPanelParts.tsx | wc -l` → 0

## SearchResultItems

- [ ] `SearchResultItems.tsx` 全部 `text-[10px]` → 语义 token
      实例（8 处）:
      :106 `text-[10px]` → `text-(--text-label)`
      :127 `text-[10px]` → `text-(--text-label)`
      :132 `text-[10px]` → `text-(--text-label)`
      :137 `text-[10px]` → `text-(--text-label)`
      :186 `text-[10px]` → `text-(--text-label)`
      :201 `text-[10px]` → `text-(--text-label)`
      :238 `text-[10px]` → `text-(--text-label)`
      :242 `text-[10px]` → `text-(--text-label)`
      验证: `grep 'text-\[10px\]' SRC/features/search/SearchResultItems.tsx | wc -l` → 0

## SearchResultsArea

- [ ] `SearchResultsArea.tsx` 全部 `text-[10px]` → 语义 token
      实例（3 处）:
      :171 `text-[10px]` → `text-(--text-label)`
      :216 `text-[10px]` → `text-(--text-label)`
      :219 `text-[10px]` → `text-(--text-label)`
      验证: `grep 'text-\[10px\]' SRC/features/search/SearchResultsArea.tsx | wc -l` → 0

---

## 整体验证

```bash
grep -rn 'text-\[[0-9]' SRC/features/search/ --include='*.tsx' | grep -v test | grep -v stories | grep -v 'text-\[var(--' | wc -l
# → 0
grep -rn 'min-w-\[20px\]' SRC/features/search/ --include='*.tsx' | grep -v test | grep -v stories | wc -l
# → 0
pnpm typecheck
pnpm -C apps/desktop exec vitest run SearchPanel
```
