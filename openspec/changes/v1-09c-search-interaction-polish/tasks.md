# Tasks: v1-09c 搜索面板交互修正

- **父 change**: v1-09-\*
- **状态**: 📋 待实施
- **任务数**: 1

---

## Filter pill shadow 对齐

- [ ] `SearchPanelParts.tsx` 全部 `shadow-[var(--shadow-lg)]` → `shadow-[var(--shadow-sm)]`
      实例（1 处）:
      :24 `shadow-[var(--shadow-lg)]` → `shadow-[var(--shadow-sm)]`
      验证: `grep 'shadow-lg' SRC/features/search/SearchPanelParts.tsx | wc -l` → 0

---

## 整体验证

```bash
grep -c 'shadow-lg' SRC/features/search/SearchPanelParts.tsx
# → 0
grep -c 'shadow-sm' SRC/features/search/SearchPanelParts.tsx
# → 1
pnpm typecheck
pnpm -C apps/desktop exec vitest run SearchPanel
```
