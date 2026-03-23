# Tasks: v1-12c 铺设 scroll-shadow-y

- **父 change**: v1-12-interaction-motion-and-native-cleanup
- **状态**: 📋 待实施
- **任务数**: 10

---

## character（2 文件）

- [ ] `CharacterCardList.tsx` + `AddRelationshipPopover.tsx` 添加 scroll-shadow-y
      实例（2 处）:
        CharacterCardList:63 `overflow-auto` 缺 scroll-shadow-y
        AddRelationshipPopover:184 `overflow-y-auto` 缺 scroll-shadow-y
      验证: `grep -c 'scroll-shadow' SRC/features/character/CharacterCardList.tsx SRC/features/character/AddRelationshipPopover.tsx`

## search

- [ ] `SearchResultsArea.tsx` 添加 scroll-shadow-y
      实例（1 处）:
        :194 `overflow-y-auto max-h-[60vh]` 缺 scroll-shadow-y
      验证: `grep 'scroll-shadow' SRC/features/search/SearchResultsArea.tsx`

## rightpanel（2 文件）

- [ ] `InfoPanel.tsx` + `QualityPanel.tsx` 添加 scroll-shadow-y
      实例（2 处）:
        InfoPanel:249 `overflow-auto` 缺 scroll-shadow-y
        QualityPanel:156 `overflow-auto` 缺 scroll-shadow-y
      验证: `grep -c 'scroll-shadow' SRC/features/rightpanel/InfoPanel.tsx SRC/features/rightpanel/QualityPanel.tsx`

## diff（3 文件）

- [ ] `DiffView.tsx` + `VersionPane.tsx` + `SplitDiffView.tsx` 添加 scroll-shadow-y
      实例（4 处）:
        DiffView:314 `overflow-y-auto` 缺 scroll-shadow-y
        VersionPane:93 `overflow-y-auto` 缺 scroll-shadow-y
        SplitDiffView:173 `overflow-y-auto` 缺 scroll-shadow-y
        SplitDiffView:213 `overflow-y-auto` 缺 scroll-shadow-y
      验证: `grep -c 'scroll-shadow' SRC/features/diff/DiffView.tsx SRC/features/diff/VersionPane.tsx SRC/features/diff/SplitDiffView.tsx`

## zen-mode

- [ ] `ZenMode.tsx` 添加 scroll-shadow-y
      实例（1 处）:
        :166 `overflow-y-auto` 缺 scroll-shadow-y
      验证: `grep 'scroll-shadow' SRC/features/zen-mode/ZenMode.tsx`

## export

- [ ] `ExportFormatTab.tsx` 添加 scroll-shadow-y
      实例（1 处）:
        :200 `overflow-y-auto` 缺 scroll-shadow-y
      验证: `grep 'scroll-shadow' SRC/features/export/ExportFormatTab.tsx`

## ai（3 文件）

- [ ] `ModelPicker.tsx` + `ChatHistory.tsx` + `SkillPicker.tsx` 添加 scroll-shadow-y
      实例（3 处）:
        ModelPicker:162 `max-h-72 overflow-y-auto` 缺 scroll-shadow-y
        ChatHistory:89 `max-h-64 overflow-y-auto` 缺 scroll-shadow-y
        SkillPicker:130 `max-h-72 overflow-auto` 缺 scroll-shadow-y
      验证: `grep -c 'scroll-shadow' SRC/features/ai/ModelPicker.tsx SRC/features/ai/ChatHistory.tsx SRC/features/ai/SkillPicker.tsx`

## commandPalette + projects（2 文件）

- [ ] `CommandPalette.tsx` + `ProjectSwitcher.tsx` 添加 scroll-shadow-y
      实例（2 处）:
        CommandPalette:206 `max-h-[424px] overflow-y-auto` 缺 scroll-shadow-y
        ProjectSwitcher:246 `max-h-80 overflow-y-auto` 缺 scroll-shadow-y
      验证: `grep -c 'scroll-shadow' SRC/features/commandPalette/CommandPalette.tsx SRC/features/projects/ProjectSwitcher.tsx`

## 回归验证

- [ ] 全量验证
      验证: `pnpm typecheck && pnpm -C apps/desktop exec vitest run`

---

## 整体验证

```bash
grep -rn 'scroll-shadow' apps/desktop/renderer/src/ --include='*.tsx' | grep -v test | grep -v stories | wc -l
pnpm typecheck
pnpm -C apps/desktop exec vitest run
```
