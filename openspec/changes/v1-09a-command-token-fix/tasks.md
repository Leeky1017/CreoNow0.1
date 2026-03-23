# Tasks: v1-09a 修正命令面板 token

- **父 change**: v1-09-*
- **状态**: 📋 待实施
- **任务数**: 5

---

## CommandItem 色彩 token

- [ ] `CommandItem.tsx` 全部 `--color-accent-blue` → `--color-info`
      实例（1 处）:
        :105 `bg-[var(--color-accent-blue)]` → `bg-[var(--color-info)]`
      验证: `grep 'color-accent-blue' SRC/components/composites/CommandItem.tsx | wc -l` → 0

## CommandItem 字号 token

- [ ] `CommandItem.tsx` 全部 `text-[13px]` → 语义 token
      实例（1 处）:
        :116 `text-[13px]` → `text-(--text-body)`
      验证: `grep 'text-\[13px\]' SRC/components/composites/CommandItem.tsx | wc -l` → 0

- [ ] `CommandItem.tsx` 全部 `text-[11px]` → 语义 token
      实例（1 处）:
        :123 `text-[11px]` → `text-(--text-status)`
      验证: `grep 'text-\[11px\]' SRC/components/composites/CommandItem.tsx | wc -l` → 0

## CommandPalette 字号 token

- [ ] `CommandPalette.tsx` 全部 `text-[10px]` → 语义 token
      实例（1 处）:
        :242 `text-[10px]` → `text-(--text-label)`
      验证: `grep 'text-\[10px\]' SRC/features/commandPalette/CommandPalette.tsx | wc -l` → 0

## CommandPaletteFooter 字号 token

- [ ] `CommandPaletteFooter.tsx` 全部 `text-[11px]` → 语义 token
      实例（3 处）:
        :11 `text-[11px]` → `text-(--text-status)`
        :21 `text-[11px]` → `text-(--text-status)`
        :31 `text-[11px]` → `text-(--text-status)`
      验证: `grep 'text-\[11px\]' SRC/features/commandPalette/CommandPaletteFooter.tsx | wc -l` → 0

---

## 整体验证

```bash
grep -c 'color-accent-blue' SRC/components/composites/CommandItem.tsx
# → 0
grep -rn 'text-\[[0-9]' SRC/features/commandPalette/ SRC/components/composites/Command*.tsx --include='*.tsx' | grep -v test | grep -v stories | grep -v 'text-\[var(--' | grep -v 'text-\[15px\]' | wc -l
# → 0
pnpm typecheck
pnpm -C apps/desktop exec vitest run CommandPalette
```
