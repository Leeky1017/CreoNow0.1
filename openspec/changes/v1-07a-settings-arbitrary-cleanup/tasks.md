# Tasks: v1-07a 清理 Settings 硬编码字号

- **父 change**: v1-07-settings-visual-polish
- **状态**: 📋 待实施
- **任务数**: 5

---

## 文件组

- [ ] `SettingsAppearancePage.tsx` 全部 `text-[10px]` → 语义 token
      实例（1 处）:
      :36 `text-[10px]` → `text-(--text-label)`
      验证: `grep 'text-\[[0-9]' SRC/features/settings-dialog/SettingsAppearancePage.tsx | wc -l` → 0

- [ ] `SettingsAccount.tsx` 全部 `text-[10px]` → 语义 token
      实例（1 处）:
      :37 `text-[10px]` → `text-(--text-label)`
      验证: `grep 'text-\[[0-9]' SRC/features/settings-dialog/SettingsAccount.tsx | wc -l` → 0

- [ ] `SettingsExport.tsx` 全部 `text-[10px]` → 语义 token
      实例（1 处）:
      :34 `text-[10px]` → `text-(--text-label)`
      验证: `grep 'text-\[[0-9]' SRC/features/settings-dialog/SettingsExport.tsx | wc -l` → 0

- [ ] `SettingsGeneralSections.tsx` + `SettingsGeneral.tsx` 全部 `text-[10px]` → 语义 token
      实例（2 处）:
      SettingsGeneralSections.tsx:9 `text-[10px]` → `text-(--text-label)`
      SettingsGeneral.tsx:46 `text-[10px]` → `text-(--text-label)`
      验证: `grep 'text-\[[0-9]' SRC/features/settings-dialog/SettingsGeneral*.tsx | wc -l` → 0

- [ ] `SettingsNavigation.tsx` 全部 `text-[13px]` → 语义 token
      实例（1 处）:
      :27 `text-[13px]` → `text-(--text-body)`
      验证: `grep 'text-\[[0-9]' SRC/features/settings-dialog/SettingsNavigation.tsx | wc -l` → 0

---

## 整体验证

```bash
grep -rn 'text-\[[0-9]' apps/desktop/renderer/src/features/settings-dialog/ --include='*.tsx' | grep -v test | grep -v stories | wc -l  # → 0
pnpm typecheck                                     # → 0 errors
pnpm -C apps/desktop exec vitest run settings      # → all pass
```
