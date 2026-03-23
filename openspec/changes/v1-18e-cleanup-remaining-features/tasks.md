# Tasks: v1-18e 清理 remaining features 硬编码字号

- **父 change**: v1-18-arbitrary-value-cleanup
- **状态**: 📋 待实施
- **任务数**: 11

---

## BubbleMenuFormatActions.tsx

- [ ] `BubbleMenuFormatActions.tsx` 全部 `text-[Npx]` → 语义 token
      实例（1 处）:
        :158 `text-[11px]` → `text-(--text-status)`
      验证: `grep 'text-\[[0-9]' apps/desktop/renderer/src/features/editor/BubbleMenuFormatActions.tsx | wc -l` → 0

## FileTreeNodeRow.tsx

- [ ] `FileTreeNodeRow.tsx` 全部硬编码 arbitrary → token/utility
      实例（2 处）:
        :115 `h-[2px]` → `h-0.5`
        :170 `text-[10px]` → `text-(--text-label)`
      验证: `grep -E '(text|h)-\[[0-9]' apps/desktop/renderer/src/features/files/FileTreeNodeRow.tsx | grep -v 'var(--' | wc -l` → 0

## FileTreeRenameRow.tsx

- [ ] `FileTreeRenameRow.tsx` 全部尺寸 arbitrary → utility
      实例（1 处）:
        :29 `h-[2px]` → `h-0.5`
      验证: `grep 'h-\[[0-9]' apps/desktop/renderer/src/features/files/FileTreeRenameRow.tsx | wc -l` → 0

## TimelineView.tsx

- [ ] `TimelineView.tsx` 全部 `text-[Npx]` → 语义 token
      实例（2 处）:
        :120 `text-[11px]` → `text-(--text-status)`
        :160 `text-[10px]` → `text-(--text-label)`
      验证: `grep 'text-\[[0-9]' apps/desktop/renderer/src/features/kg/TimelineView.tsx | wc -l` → 0

## MemoryCard.tsx

- [ ] `MemoryCard.tsx` 全部 `text-[Npx]` → 语义 token
      实例（1 处）:
        :65 `text-[10px]` → `text-(--text-label)`
      验证: `grep 'text-\[[0-9]' apps/desktop/renderer/src/features/memory/MemoryCard.tsx | wc -l` → 0

## OutlineNodeItem.tsx

- [ ] `OutlineNodeItem.tsx` 全部硬编码 arbitrary → token/utility
      实例（2 处）:
        :62  `-top-[3px]` → 查 tokens.css 确定映射
        :147 `text-[10px]` → `text-(--text-label)`
      验证: `grep -E '(text|top)-\[[0-9]' apps/desktop/renderer/src/features/outline/OutlineNodeItem.tsx | grep -v 'var(--' | wc -l` → 0

## OutlinePanel.tsx

- [ ] `OutlinePanel.tsx` 全部 `text-[Npx]` → 语义 token
      实例（4 处）:
        :259 `text-[10px]` → `text-(--text-label)`
        :267 `text-[10px]` → `text-(--text-label)`
        :275 `text-[10px]` → `text-(--text-label)`
        :319 `text-[10px]` → `text-(--text-label)`
      验证: `grep 'text-\[[0-9]' apps/desktop/renderer/src/features/outline/OutlinePanel.tsx | wc -l` → 0

## ProjectSwitcher.tsx

- [ ] `ProjectSwitcher.tsx` 全部硬编码 arbitrary → token/utility
      实例（4 处）:
        :30  `text-[9px]` → 无精确 token，审计后选择 `text-(--text-label)`（10px）或新增 token
        :186 `h-[2px]` → `h-0.5`
        :210 `text-[10px]` → `text-(--text-label)`
        :273 `text-[10px]` → `text-(--text-label)`
      验证: `grep -E '(text|h)-\[[0-9]' apps/desktop/renderer/src/features/projects/ProjectSwitcher.tsx | grep -v 'var(--' | wc -l` → 0

## QualityPanel.tsx

- [ ] `QualityPanel.tsx` 全部 `text-[Npx]` → 语义 token
      实例（4 处）:
        :158 `text-[15px]` → 无精确 token，审计后选择 `text-(--text-subtitle)`（14px）或新增 token
        :174 `text-[13px]` → `text-(--text-body)`
        :197 `text-[13px]` → `text-(--text-body)`
        :210 `text-[13px]` → `text-(--text-body)`
      验证: `grep 'text-\[[0-9]' apps/desktop/renderer/src/features/rightpanel/QualityPanel.tsx | wc -l` → 0

## QualityPanelSections.tsx

- [ ] `QualityPanelSections.tsx` 全部 `text-[Npx]` → 语义 token
      实例（2 处）:
        :211 `text-[10px]` → `text-(--text-label)`
        :217 `text-[10px]` → `text-(--text-label)`
      验证: `grep 'text-\[[0-9]' apps/desktop/renderer/src/features/rightpanel/QualityPanelSections.tsx | wc -l` → 0

## DashboardHero.tsx

- [ ] `DashboardHero.tsx` 尺寸 arbitrary 审计
      实例（1 处）:
        :75 `w-[35%]` → 查 tokens.css 确定映射或保留（百分比布局）
      验证: 审计完成即可

---

## 整体验证

```bash
grep -rn 'text-\[[0-9]' apps/desktop/renderer/src/features/outline/ \
  apps/desktop/renderer/src/features/rightpanel/ \
  apps/desktop/renderer/src/features/projects/ \
  apps/desktop/renderer/src/features/editor/ \
  apps/desktop/renderer/src/features/files/ \
  apps/desktop/renderer/src/features/dashboard/ \
  apps/desktop/renderer/src/features/memory/ \
  apps/desktop/renderer/src/features/kg/ --include='*.tsx' \
  | grep -v test | grep -v stories | grep -v __tests__ | wc -l
# → 0

pnpm typecheck                    # → 0 errors
```
