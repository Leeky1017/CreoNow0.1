# Tasks: v1-18i 简化 shadow token 引用

- **父 change**: v1-18-arbitrary-value-cleanup
- **状态**: 📋 待实施
- **任务数**: 12

---

## Part A: shadow-[var(--shadow-*)] → shadow-sm/md/lg/xl

### features/ai/

- [ ] `ChatHistory.tsx` + `ModelPicker.tsx` + `ModePicker.tsx` + `SkillPicker.tsx` 全部 `shadow-[var(--shadow-*)]` → 简写
      实例（4 处）:
      ChatHistory.tsx:73 `shadow-[var(--shadow-xl)]` → `shadow-xl`
      ModelPicker.tsx:134 `shadow-[var(--shadow-xl)]` → `shadow-xl`
      ModePicker.tsx:78 `shadow-[var(--shadow-xl)]` → `shadow-xl`
      SkillPicker.tsx:110 `shadow-[var(--shadow-xl)]` → `shadow-xl`
      验证: `grep 'shadow-\[var(--shadow' apps/desktop/renderer/src/features/ai/*.tsx | wc -l` → 0

### features/diff/

- [ ] `DiffHeader.tsx` + `DiffViewPanel.tsx` + `MultiVersionCompare.tsx` 全部 `shadow-[var(--shadow-*)]` → 简写
      实例（4 处）:
      DiffHeader.tsx:177 `shadow-[var(--shadow-sm)]` → `shadow-sm`
      DiffHeader.tsx:191 `shadow-[var(--shadow-sm)]` → `shadow-sm`
      DiffViewPanel.tsx:152 `shadow-[var(--shadow-xl)]` → `shadow-xl`
      MultiVersionCompare.tsx:65 `shadow-[var(--shadow-xl)]` → `shadow-xl`
      验证: `grep 'shadow-\[var(--shadow' apps/desktop/renderer/src/features/diff/*.tsx | wc -l` → 0

### features/editor/

- [ ] `EditorBubbleMenu.tsx` + `EditorContextMenu.tsx` + `EditorToolbar.tsx` + `EntityCompletionPanel.tsx` + `InlineAiInput.tsx` 全部 `shadow-[var(--shadow-*)]` → 简写
      实例（5 处）:
      EditorBubbleMenu.tsx:109 `shadow-[var(--shadow-lg)]` → `shadow-lg`
      EditorContextMenu.tsx:49 `shadow-[var(--shadow-lg)]` → `shadow-lg`
      EditorToolbar.tsx:83 `shadow-[var(--shadow-md)]` → `shadow-md`
      EntityCompletionPanel.tsx:25 `shadow-[var(--shadow-lg)]` → `shadow-lg`
      InlineAiInput.tsx:46 `shadow-[var(--shadow-lg)]` → `shadow-lg`
      验证: `grep 'shadow-\[var(--shadow' apps/desktop/renderer/src/features/editor/*.tsx | wc -l` → 0

### features/dashboard/

- [ ] `DashboardHero.tsx` + `DashboardProjectGrid.tsx` 全部 `shadow-[var(--shadow-*)]` → 简写
      实例（2 处）:
      DashboardHero.tsx:32 `shadow-[var(--shadow-md)]` → `shadow-md`
      DashboardProjectGrid.tsx:130 `shadow-[var(--shadow-sm)]` → `shadow-sm`
      验证: `grep 'shadow-\[var(--shadow' apps/desktop/renderer/src/features/dashboard/*.tsx | wc -l` → 0

### features/ 其他

- [ ] `VersionHistoryPanel.tsx` + `character-detail-shared.tsx` + `SettingsAppearancePage.tsx` + `SearchPanelParts.tsx` + `TimelineView.tsx` + `ExportDialog.tsx` + `CommandPalette.tsx` + `ProjectSwitcher.tsx` 全部 `shadow-[var(--shadow-*)]` → 简写
      实例（8 处）:
      VersionHistoryPanel.tsx:43 `shadow-[var(--shadow-xl)]` → `shadow-xl`
      character-detail-shared.tsx:46 `shadow-[var(--shadow-xl)]` → `shadow-xl`
      SettingsAppearancePage.tsx:158 `shadow-[var(--shadow-sm)]` → `shadow-sm`
      SearchPanelParts.tsx:24 `shadow-[var(--shadow-lg)]` → `shadow-lg` + `shadow-[var(--color-info-subtle)]` → 保留（颜色 shadow，非标准 token）
      TimelineView.tsx:152 `shadow-[var(--shadow-xl)]` → `shadow-xl`
      ExportDialog.tsx:50 `shadow-[var(--shadow-xl)]` → `shadow-xl`
      CommandPalette.tsx:177 `shadow-[var(--shadow-xl)]` → `shadow-xl`
      ProjectSwitcher.tsx:219 `shadow-[var(--shadow-md)]` → `shadow-md`
      验证: `grep 'shadow-\[var(--shadow' apps/desktop/renderer/src/features/{version-history,character,settings-dialog,search,kg,export,commandPalette,projects}/*.tsx | wc -l` → 0

### components/primitives/

- [ ] `Dialog.tsx` + `Toast.tsx` + `Popover.tsx` + `Card.tsx` + `Tooltip.tsx` + `SelectContent.tsx` + `Tabs.tsx` + `ContextMenu.tsx` + `DropdownMenu.tsx` 全部 `shadow-[var(--shadow-*)]` → 简写
      实例（11 处）:
      Dialog.tsx:66 `shadow-[var(--shadow-xl)]` → `shadow-xl`
      Toast.tsx:80 `shadow-[var(--shadow-lg)]` → `shadow-lg`
      Popover.tsx:49 `shadow-[var(--shadow-md)]` → `shadow-md`
      Card.tsx:52 `shadow-[var(--shadow-md)]` → `shadow-md`
      Card.tsx:77 `shadow-[var(--shadow-sm)]` → `shadow-sm`
      Tooltip.tsx:38 `shadow-[var(--shadow-md)]` → `shadow-md`
      SelectContent.tsx:25 `shadow-[var(--shadow-md)]` → `shadow-md`
      Tabs.tsx:106 `shadow-[var(--shadow-sm)]` → `shadow-sm`
      ContextMenu.tsx:46 `shadow-[var(--shadow-md)]` → `shadow-md`
      DropdownMenu.tsx:48 `shadow-[var(--shadow-md)]` → `shadow-md`
      验证: `grep 'shadow-\[var(--shadow' apps/desktop/renderer/src/components/primitives/*.tsx | wc -l` → 0

### components/ 其他

- [ ] `ErrorBoundary.tsx` + `LeftPanelDialogShell.tsx` 全部 `shadow-[var(--shadow-*)]` → 简写
      实例（2 处）:
      ErrorBoundary.tsx:118 `shadow-[var(--shadow-lg)]` → `shadow-lg`
      LeftPanelDialogShell.tsx:39 `shadow-[var(--shadow-xl)]` → `shadow-xl`
      验证: `grep 'shadow-\[var(--shadow' apps/desktop/renderer/src/components/{patterns,layout}/*.tsx | wc -l` → 0

---

## Part B: shadow-[0_...] 复合阴影

### features/

- [ ] `SearchPanel.tsx` 复合阴影评估
      实例（1 处）:
      SearchPanel.tsx:198 `shadow-[0_24px_48px_-12px_var(--color-shadow)]` → 评估映射到 `shadow-xl` 或保留加注释
      验证: `grep 'shadow-\[0' apps/desktop/renderer/src/features/search/SearchPanel.tsx | wc -l` → 0

- [ ] `DiffHeader.tsx` 复合阴影评估
      实例（2 处）:
      DiffHeader.tsx:95 `shadow-[0_18px_48px_var(--color-shadow)]` → 评估映射到 `shadow-xl` 或保留加注释
      DiffHeader.tsx:156 `shadow-[0_0_8px_var(--color-success-subtle)]` → glow 效果，保留加 eslint-disable 注释
      验证: `grep 'shadow-\[0' apps/desktop/renderer/src/features/diff/DiffHeader.tsx | wc -l` → 0 或保留带注释

- [ ] `VersionPane.tsx` 复合阴影评估
      实例（1 处）:
      VersionPane.tsx:71 `shadow-[0_0_6px_var(--color-success-subtle)]` → glow 效果，保留加 eslint-disable 注释
      验证: `grep 'shadow-\[0' apps/desktop/renderer/src/features/diff/VersionPane.tsx | wc -l` → 0 或保留带注释

### components/primitives/

- [ ] `Slider.tsx` 复合阴影评估
      实例（1 处）:
      Slider.tsx:60 `shadow-[0_0_0_4px_var(--color-bg-surface)]` → focus ring 效果，保留加 eslint-disable 注释
      验证: `grep 'shadow-\[0' apps/desktop/renderer/src/components/primitives/Slider.tsx | wc -l` → 0 或保留带注释

---

## SearchPanelParts 特殊处理

- [ ] `SearchPanelParts.tsx` 颜色阴影保留评估
      实例（1 处）:
      SearchPanelParts.tsx:24 `shadow-[var(--color-info-subtle)]` → 这是颜色型 shadow（非尺寸 token），评估是否保留
      验证: 确认处理方案

---

## 整体验证

```bash
# 零 shadow-[var(--shadow-*)]
grep -rn 'shadow-\[var(--shadow' apps/desktop/renderer/src/ --include='*.tsx' \
  | grep -v test | grep -v stories | grep -v __tests__ | wc -l
# → 0

# shadow-[0_...] 已处理（0 或保留带注释）
grep -rn 'shadow-\[0' apps/desktop/renderer/src/ --include='*.tsx' \
  | grep -v test | grep -v stories | grep -v __tests__ | wc -l

pnpm typecheck        # → 0 errors
pnpm -C apps/desktop exec vitest run --reporter=verbose  # → all pass
```
