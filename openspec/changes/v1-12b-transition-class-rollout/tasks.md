# Tasks: v1-12b 铺设 transition 工具类

- **父 change**: v1-12-interaction-motion-and-native-cleanup
- **状态**: 📋 待实施
- **任务数**: 10

---

## version-history

- [ ] `VersionHistoryPanel.tsx` 添加 transition-default
      实例（1 处）:
        :217 `hover:text-[var(--color-accent)] hover:underline` 缺 transition
      验证: `grep 'transition-default' SRC/features/version-history/VersionHistoryPanel.tsx`

## search（3 文件）

- [ ] `SearchPanelParts.tsx` + `SearchPanel.tsx` + `SearchResultsArea.tsx` 添加 transition-default
      实例（4 处）:
        SearchPanelParts:25 `hover:!border-[var(--color-bg-overlay)]`
        SearchPanelParts:120 `hover:!text-[var(--color-fg-default)]`
        SearchPanel:225 `hover:!text-[var(--color-fg-default)]`
        SearchResultsArea:181 `hover:!text-[var(--color-fg-default)]`
      验证: `grep -c 'transition-default' SRC/features/search/*.tsx`

## kg

- [ ] `ViewModeToggle.tsx` 添加 transition-default
      实例（1 处）:
        :32 `hover:bg-[var(--color-bg-hover)]` 缺 transition
      验证: `grep 'transition-default' SRC/features/kg/ViewModeToggle.tsx`

## rightpanel

- [ ] `InfoPanel.tsx` 添加 transition-default
      实例（1 处）:
        :255 `hover:underline` 缺 transition
      验证: `grep 'transition-default' SRC/features/rightpanel/InfoPanel.tsx`

## ai — ModelPicker + ModePicker

- [ ] `ModelPicker.tsx` + `ModePicker.tsx` 添加 transition-default
      实例（2 处）:
        ModelPicker:96 `hover:bg-[var(--color-bg-hover)]`
        ModePicker:100 `hover:bg-[var(--color-bg-hover)]`
      验证: `grep -c 'transition-default' SRC/features/ai/ModelPicker.tsx SRC/features/ai/ModePicker.tsx`

## ai — ChatHistory

- [ ] `ChatHistory.tsx` 添加 transition-default
      实例（2 处）:
        :103 `hover:bg-[var(--color-bg-hover)]`
        :119 `hover:text-[var(--color-text-danger)]`
      验证: `grep 'transition-default' SRC/features/ai/ChatHistory.tsx`

## editor — SlashCommandPanel

- [ ] `SlashCommandPanel.tsx` 添加 transition-default
      实例（1 处）:
        :69 `hover:bg-[var(--color-bg-hover)]`
      验证: `grep 'transition-default' SRC/features/editor/SlashCommandPanel.tsx`

## editor — BubbleMenu + EntityCompletion

- [ ] `BubbleMenuFormatActions.tsx` + `EntityCompletionPanel.tsx` 添加 transition-default
      实例（3 处）:
        BubbleMenuFormatActions:166 `hover:text-[var(--color-fg-default)]`
        BubbleMenuFormatActions:177 `hover:text-[var(--color-fg-danger)]`
        EntityCompletionPanel:51 `hover:bg-[var(--color-bg-hover)]`
      验证: `grep -c 'transition-default' SRC/features/editor/BubbleMenuFormatActions.tsx SRC/features/editor/EntityCompletionPanel.tsx`

## projects

- [ ] `ProjectSwitcher.tsx` 添加 transition-default
      实例（3 处）:
        :197 `hover:border-[var(--color-border-hover)]`
        :238 `hover:border-[var(--color-border-hover)]`
        :261 `hover:bg-[var(--color-bg-hover)]`
      验证: `grep 'transition-default' SRC/features/projects/ProjectSwitcher.tsx`

## 回归验证

- [ ] 全量验证
      验证: `pnpm typecheck && pnpm -C apps/desktop exec vitest run`

---

## 整体验证

```bash
grep -rn 'transition-default\|transition-slow' apps/desktop/renderer/src/ --include='*.tsx' | grep -v test | grep -v stories | wc -l
pnpm typecheck
pnpm -C apps/desktop exec vitest run
```
