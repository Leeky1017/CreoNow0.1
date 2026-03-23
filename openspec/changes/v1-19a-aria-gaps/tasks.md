# Tasks: v1-19a 补齐 ARIA 语义标记

- **父 change**: v1-19-\*
- **状态**: 📋 待实施
- **任务数**: 14

---

## 文件组 1：树形节点语义

- [ ] `FileTreeNodeRow.tsx` 补齐 treeitem 语义
      实例（3 处）:
      :123 仅有 aria-selected，缺 role="treeitem"
      :缺少 aria-expanded={isExpanded} 属性
      :缺少 aria-level={depth} 属性
      验证: `grep -n 'role="treeitem"\|aria-expanded\|aria-level' SRC/features/files/FileTreeNodeRow.tsx | wc -l` → ≥ 3

## 文件组 2：表单元素关联 label

- [ ] `SettingsGeneralSections.tsx` 补齐 aria-label
      实例（2 处）:
      :95 `<Select` 无 aria-label
      :185 `<Select` 无 aria-label
      验证: `grep '<Select' SRC/features/settings-dialog/SettingsGeneralSections.tsx | grep -v 'aria-label' | wc -l` → 0

- [ ] `SettingsGeneral.tsx` 补齐 aria-label
      实例（1 处）:
      :108 `<Select` 无 aria-label
      验证: `grep '<Select' SRC/features/settings-dialog/SettingsGeneral.tsx | grep -v 'aria-label' | wc -l` → 0

- [ ] `CharacterBasicInfo.tsx` 补齐 aria-label
      实例（6 处）:
      :110 `<Input` 无 aria-label
      :121 `<Input` 无 aria-label
      :134 `<Select` 无 aria-label
      :149 `<Select` 无 aria-label
      :170 `<Input` 无 aria-label
      :190 `<Input` 无 aria-label
      验证: `grep '<Input\|<Select' SRC/features/character/CharacterBasicInfo.tsx | grep -v 'aria-label' | wc -l` → 0

- [ ] `CharacterDetailDialog.tsx` 补齐 aria-label
      实例（2 处）:
      :202 `<Input` 无 aria-label
      :259 `<Textarea` 无 aria-label
      验证: `grep '<Input\|<Textarea' SRC/features/character/CharacterDetailDialog.tsx | grep -v 'aria-label' | wc -l` → 0

- [ ] `KgEntityCard.tsx` 补齐 aria-label
      实例（6 处）:
      :35 `<Input` 无 aria-label
      :45 `<Input` 无 aria-label
      :55 `<Input` 无 aria-label
      :65 `<Input` 无 aria-label
      :77 `<Input` 无 aria-label
      :缺少行号 `<Input` 无 aria-label
      验证: `grep '<Input' SRC/features/kg/KgEntityCard.tsx | grep -v 'aria-label' | wc -l` → 0

- [ ] `BranchMergeSection.tsx` 补齐 aria-label
      实例（3 处）:
      :97 `<Textarea` 无 aria-label
      :159 `<Input` 无 aria-label
      :168 `<Input` 无 aria-label
      验证: `grep '<Input\|<Textarea' SRC/features/version-history/BranchMergeSection.tsx | grep -v 'aria-label' | wc -l` → 0

- [ ] `RenameProjectDialog.tsx` 补齐 aria-label
      实例（1 处）:
      :96 `<Input` 无 aria-label
      验证: `grep '<Input' SRC/features/dashboard/RenameProjectDialog.tsx | grep -v 'aria-label' | wc -l` → 0

- [ ] `VersionPreviewDialog.tsx` 补齐 aria-label
      实例（1 处）:
      :108 `<Textarea` 无 aria-label
      验证: `grep '<Textarea' SRC/features/version-history/VersionPreviewDialog.tsx | grep -v 'aria-label' | wc -l` → 0

- [ ] `SearchPanel.tsx` 补齐搜索输入 aria-label
      实例（1 处）:
      :207 `<Input` 无 aria-label
      验证: `grep '<Input' SRC/features/search/SearchPanel.tsx | grep -v 'aria-label' | wc -l` → 0

- [ ] `ProjectFormContent.tsx` 补齐 aria-label
      实例（2 处）:
      :154 `<Input` 无 aria-label
      :244 `<Textarea` 无 aria-label
      验证: `grep '<Input\|<Textarea' SRC/features/projects/ProjectFormContent.tsx | grep -v 'aria-label' | wc -l` → 0

## 文件组 3：导航与工具栏语义

- [ ] `EditorToolbar.tsx` 添加 role="toolbar" + aria-label
      实例（1 处）:
      :容器元素缺少 role="toolbar" 和 aria-label
      验证: `grep 'role="toolbar"' SRC/features/editor/EditorToolbar.tsx | wc -l` → 1

## 文件组 4：高对比模式

- [ ] `tokens.css` 添加 forced-colors 媒体查询
      实例（1 处）:
      :tokens.css 中需新增 `@media (forced-colors: active)` 规则块
      验证: `grep 'forced-colors' SRC/styles/tokens.css | wc -l` → ≥ 1

## 文件组 5：Icon 无障碍审计

- [ ] 全局 Icon aria-hidden 审计
      实例（多处）:
      :所有 `<*Icon` 使用点中，纯装饰 icon 缺少 `aria-hidden="true"`
      验证: `grep -rn '<.*Icon' SRC/ --include='*.tsx' | grep -v test | grep -v stories | grep -v 'aria-' | wc -l` → 降低 50%+

---

## 整体验证

```bash
grep -rn '<Input\|<Select\|<Textarea' SRC/features/ --include='*.tsx' | grep -v test | grep -v stories | grep -v 'aria-label' | wc -l  # → 0
grep 'forced-colors' SRC/styles/tokens.css | wc -l  # → ≥ 1
pnpm typecheck  # → 0 errors
pnpm -C apps/desktop exec vitest run a11y  # → all pass
```
