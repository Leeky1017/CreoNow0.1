# Tasks: v1-08a 清除文件树硬编码像素

- **父 change**: v1-08-*
- **状态**: 📋 待实施
- **任务数**: 3

---

## 拖拽指示器

- [ ] `FileTreeNodeRow.tsx` 全部 `h-[2px]` → `h-0.5`
      实例（1 处）:
        :115 `h-[2px] bg-[var(--color-accent)]` → `h-0.5 bg-[var(--color-accent)]`
      验证: `grep 'h-\[2px\]' SRC/features/files/FileTreeNodeRow.tsx | wc -l` → 0

- [ ] `FileTreeRenameRow.tsx` 全部 `h-[2px]` → `h-0.5`
      实例（1 处）:
        :29 `h-[2px] bg-[var(--color-accent)]` → `h-0.5 bg-[var(--color-accent)]`
      验证: `grep 'h-\[2px\]' SRC/features/files/FileTreeRenameRow.tsx | wc -l` → 0

## 字号 token 化

- [ ] `FileTreeNodeRow.tsx` 全部 `text-[10px]` → 语义 token
      实例（1 处）:
        :170 `text-[10px]` → `text-(--text-label)`
      验证: `grep 'text-\[10px\]' SRC/features/files/FileTreeNodeRow.tsx | wc -l` → 0

---

## 整体验证

```bash
grep -rn '(w|h|p|gap)-\[[0-9]' SRC/features/files/ --include='*.tsx' | grep -v test | grep -v stories | wc -l
# → 0
grep -rn 'text-\[[0-9]' SRC/features/files/ --include='*.tsx' | grep -v test | grep -v stories | grep -v 'text-\[var(--' | wc -l
# → 0
pnpm typecheck
pnpm -C apps/desktop exec vitest run FileTree
```
