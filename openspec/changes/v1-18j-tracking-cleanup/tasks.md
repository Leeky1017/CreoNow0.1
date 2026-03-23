# Tasks: v1-18j 清理硬编码字间距

- **父 change**: v1-18-arbitrary-value-cleanup
- **状态**: 📋 待实施
- **任务数**: 9

> 全项目共 22 处 `tracking-[Nem]` 硬编码（不含 `tracking-[var(--*)]` token 引用）。
> 注意：部分文件同一行含 `tracking-[0.1em]` 和 `text-[var(--color-*)]`，grep -v 'var(--' 会误排除。
> 验证命令统一用 `grep 'tracking-\[0' ... | wc -l` 或 `grep 'tracking-\[-0' ... | wc -l`。

---

## features/character/ (7 处)

- [ ] `character-detail-shared.tsx` 全部 `tracking-[0.1em]` → 语义 token
      实例（2 处）:
        :97 `tracking-[0.1em]` → `tracking-(--tracking-wide)`
        :122 `tracking-[0.1em]` → `tracking-(--tracking-wide)`
      验证: `grep 'tracking-\[0' apps/desktop/renderer/src/features/character/character-detail-shared.tsx | wc -l` → 0

- [ ] `GroupSelector.tsx` + `RoleSelector.tsx` + `CharacterPanelSections.tsx` 全部 `tracking-[0.1em]` → 语义 token
      实例（3 处）:
        GroupSelector.tsx:87 `tracking-[0.1em]` → `tracking-(--tracking-wide)`
        RoleSelector.tsx:101 `tracking-[0.1em]` → `tracking-(--tracking-wide)`
        CharacterPanelSections.tsx:118 `tracking-[0.1em]` → `tracking-(--tracking-wide)`
      验证: `grep 'tracking-\[0' apps/desktop/renderer/src/features/character/{GroupSelector,RoleSelector,CharacterPanelSections}.tsx | wc -l` → 0

- [ ] `AddRelationshipPopover.tsx` 全部 `tracking-[0.1em]` → 语义 token
      实例（2 处）:
        :180 `tracking-[0.1em]` → `tracking-(--tracking-wide)`
        :237 `tracking-[0.1em]` → `tracking-(--tracking-wide)`
      验证: `grep 'tracking-\[0' apps/desktop/renderer/src/features/character/AddRelationshipPopover.tsx | wc -l` → 0

## features/settings-dialog/ (6 处)

- [ ] `SettingsAppearancePage.tsx` + `SettingsAccount.tsx` + `SettingsExport.tsx` + `SettingsNavigation.tsx` + `SettingsGeneralSections.tsx` + `SettingsGeneral.tsx` 全部 `tracking-[0.15em]` → 语义 token
      实例（6 处）:
        SettingsAppearancePage.tsx:38 `tracking-[0.15em]` → `tracking-(--tracking-wide)` 或新增 `--tracking-wider` token
        SettingsAccount.tsx:39 `tracking-[0.15em]` → 同上
        SettingsExport.tsx:36 `tracking-[0.15em]` → 同上
        SettingsNavigation.tsx:75 `tracking-[0.15em]` → 同上
        SettingsGeneralSections.tsx:9 `tracking-[0.15em]` → 同上
        SettingsGeneral.tsx:46 `tracking-[0.15em]` → 同上
      验证: `grep 'tracking-\[0' apps/desktop/renderer/src/features/settings-dialog/*.tsx | wc -l` → 0

## features/export/ (3 处)

- [ ] `ExportPreview.tsx` + `ExportFormatTab.tsx` 全部 `tracking-[0.1em]` → 语义 token
      实例（3 处）:
        ExportPreview.tsx:15 `tracking-[0.1em]` → `tracking-(--tracking-wide)`
        ExportPreview.tsx:154 `tracking-[0.1em]` → `tracking-(--tracking-wide)`
        ExportFormatTab.tsx:25 `tracking-[0.1em]` → `tracking-(--tracking-wide)`
      验证: `grep 'tracking-\[0' apps/desktop/renderer/src/features/export/*.tsx | wc -l` → 0

## features/commandPalette/ (1 处)

- [ ] `CommandPalette.tsx` 全部 `tracking-[0.1em]` → 语义 token
      实例（1 处）:
        :242 `tracking-[0.1em]` → `tracking-(--tracking-wide)`
      验证: `grep 'tracking-\[0' apps/desktop/renderer/src/features/commandPalette/CommandPalette.tsx | wc -l` → 0

## components/primitives/ (5 处)

- [ ] `Text.tsx` + `SelectContent.tsx` 全部 `tracking-[0.1em]` → 语义 token
      实例（2 处）:
        Text.tsx:67 `tracking-[0.1em]` → `tracking-(--tracking-wide)`
        SelectContent.tsx:44 `tracking-[0.1em]` → `tracking-(--tracking-wide)`
      验证: `grep 'tracking-\[0' apps/desktop/renderer/src/components/primitives/{Text,SelectContent}.tsx | wc -l` → 0

- [ ] `Dialog.tsx` + `Heading.tsx` 负值 tracking → 语义 token
      实例（3 处）:
        Dialog.tsx:92 `tracking-[-0.01em]` → 新增 `--tracking-tight` token → `tracking-(--tracking-tight)`
        Heading.tsx:41 `tracking-[-0.02em]` → 新增 `--tracking-tighter` token → `tracking-(--tracking-tighter)`
        Heading.tsx:42 `tracking-[-0.01em]` → `tracking-(--tracking-tight)`
      验证: `grep 'tracking-\[-0' apps/desktop/renderer/src/components/primitives/{Dialog,Heading}.tsx | wc -l` → 0

## tokens.css token 定义

- [ ] 在 `tokens.css` 中新增字间距 token
      新增:
        `--tracking-tight: -0.01em;`
        `--tracking-tighter: -0.02em;`
      已有: `--tracking-wide: 0.1em`（需确认 0.15em 是否复用或新增 `--tracking-wider: 0.15em`）
      验证: `grep 'tracking' apps/desktop/renderer/src/styles/tokens.css`

---

## 整体验证

```bash
# 零硬编码 tracking（正确的验证命令，不用 -v var 过滤）
grep -rn 'tracking-\[' apps/desktop/renderer/src/ --include='*.tsx' \
  | grep -v test | grep -v stories | grep -v __tests__ \
  | grep -v 'tracking-\[var' | wc -l
# → 0

pnpm typecheck        # → 0 errors
```
