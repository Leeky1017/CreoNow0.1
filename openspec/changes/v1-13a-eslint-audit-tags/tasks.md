# Tasks: v1-13a 审计 eslint-disable 标记

- **父 change**: v1-13-eslint-disable-audit
- **状态**: 📋 待实施
- **任务数**: 9

---

## settings-dialog（4 文件，4 处）

- [x] `SettingsAppearancePage.tsx` + `SettingsAccount.tsx` + `SettingsGeneral.tsx` + `SettingsExport.tsx` 添加审计标记
      实例（4 处）:
        SettingsAppearancePage:131 `creonow/no-hardcoded-dimension` → KEEP ✅
        SettingsAccount:116 `creonow/no-hardcoded-dimension` → KEEP ✅
        SettingsGeneral:89 `creonow/no-hardcoded-dimension` → KEEP ✅
        SettingsExport:125 `creonow/no-hardcoded-dimension` → KEEP ✅
      验证: `grep -c '审计：v1-13' SRC/features/settings-dialog/*.tsx`

## search（3 文件，3 处）

- [x] `SearchResultItems.tsx` + `SearchPanel.tsx` 添加审计标记（已完成）
      实例（2 处）:
        SearchResultItems:134 `i18next/no-literal-string` → KEEP ✅
        SearchPanel:197 `creonow/no-hardcoded-dimension` → KEEP ✅
      验证: `grep -c '审计：v1-13' SRC/features/search/SearchResultItems.tsx SRC/features/search/SearchPanel.tsx`

- [ ] `SearchResultsArea.tsx` 添加审计标记
      实例（1 处）:
        :112 `react-hooks/incompatible-library` → KEEP
      验证: `grep '审计：v1-13' SRC/features/search/SearchResultsArea.tsx`

## files（2 文件，3 处）

- [ ] `FileTreeNodeRow.tsx` + `FileTreePanel.tsx` 添加审计标记
      实例（3 处）:
        FileTreeNodeRow:54 `react/prop-types` → KEEP（缺审计标记）
        FileTreeNodeRow:183 `i18next/no-literal-string` → KEEP ✅
        FileTreePanel:31 `react-hooks/incompatible-library` → KEEP（缺审计标记）
      验证: `grep -c '审计：v1-13' SRC/features/files/*.tsx`

## ai（4 文件，6 处）

- [x] `AiPanel.tsx` + `AiMessageList.tsx` + `CodeBlock.tsx` + `AiInputArea.tsx` 添加审计标记（部分完成）
      实例（6 处）:
        AiPanel:128 `react-hooks/refs` → KEEP ✅
        AiPanel:170 `react-hooks/refs` → KEEP ✅
        AiMessageList:119 `creonow/no-raw-error-code-in-ui` → KEEP ✅
        AiMessageList:231 `react-hooks/incompatible-library` → KEEP（缺审计标记）
        CodeBlock:54 `creonow/no-raw-error-code-in-ui` → KEEP ✅
        AiInputArea:180 `creonow/no-native-html-element` → KEEP ✅
      验证: `grep -c '审计：v1-13' SRC/features/ai/AiPanel.tsx SRC/features/ai/AiMessageList.tsx SRC/features/ai/CodeBlock.tsx SRC/features/ai/AiInputArea.tsx`

## commandPalette（2 文件，4 处）

- [x] `CommandPalette.tsx` + `CommandPaletteFooter.tsx` 添加审计标记
      实例（4 处）:
        CommandPalette:176 `creonow/no-hardcoded-dimension` → KEEP ✅
        CommandPalette:205 `creonow/no-hardcoded-dimension` → KEEP ✅
        CommandPaletteFooter:13 `i18next/no-literal-string` → KEEP ✅
        CommandPaletteFooter:23 `i18next/no-literal-string` → KEEP ✅
      验证: `grep -c '审计：v1-13' SRC/features/commandPalette/*.tsx`

## editor（2 文件，4 处）

- [x] `BubbleMenuFormatActions.tsx` + `EditorContextMenu.tsx` 添加审计标记
      实例（4 处）:
        BubbleMenuFormatActions:123 `creonow/no-raw-error-code-in-ui` → KEEP ✅
        BubbleMenuFormatActions:126 `creonow/no-raw-error-code-in-ui` → KEEP ✅
        BubbleMenuFormatActions:133 `creonow/no-raw-error-code-in-ui` → KEEP ✅
        EditorContextMenu:43 `creonow/no-hardcoded-dimension` → KEEP ✅
      验证: `grep -c '审计：v1-13' SRC/features/editor/BubbleMenuFormatActions.tsx SRC/features/editor/EditorContextMenu.tsx`

## outline + version-history（2 文件，2 处）

- [ ] `OutlineTree.tsx` + `VersionHistoryPanel.tsx` 添加审计标记
      实例（2 处）:
        OutlineTree:245 `react-hooks/incompatible-library` → KEEP（缺审计标记）
        VersionHistoryPanel:105 `react-hooks/incompatible-library` → KEEP（缺审计标记）
      验证: `grep '审计：v1-13' SRC/features/outline/OutlineTree.tsx SRC/features/version-history/VersionHistoryPanel.tsx`

## character + onboarding + projects（3 文件，3 处）

- [x] `character-detail-shared.tsx` + `OnboardingPage.tsx` + `ProjectFormContent.tsx` 添加审计标记
      实例（3 处）:
        character-detail-shared:39 `creonow/no-hardcoded-dimension` → KEEP ✅
        OnboardingPage:59 `creonow/no-hardcoded-dimension` → KEEP ✅
        ProjectFormContent:302 `creonow/no-native-html-element` → KEEP ✅
      验证: `grep '审计：v1-13' SRC/features/character/character-detail-shared.tsx SRC/features/onboarding/OnboardingPage.tsx SRC/features/projects/ProjectFormContent.tsx`

---

## 整体验证

```bash
# 审计标记总数应 = eslint-disable 总数（29）
grep -rn '审计：v1-13' apps/desktop/renderer/src/features/ --include='*.tsx' | grep -v test | grep -v stories | wc -l
pnpm typecheck
pnpm -C apps/desktop exec vitest run
```
