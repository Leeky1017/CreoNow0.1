# Tasks: v1-18f 清理 components/ 层硬编码字号

- **父 change**: v1-18-arbitrary-value-cleanup
- **状态**: 📋 待实施
- **任务数**: 13

---

## CommandItem.tsx

- [ ] `CommandItem.tsx` 全部 `text-[Npx]` → 语义 token
      实例（2 处）:
      :116 `text-[13px]` → `text-(--text-body)`
      :123 `text-[11px]` → `text-(--text-status)`
      验证: `grep 'text-\[[0-9]' apps/desktop/renderer/src/components/composites/CommandItem.tsx | wc -l` → 0

## EmptyState.tsx

- [ ] `EmptyState.tsx` 尺寸 arbitrary → utility
      实例（1 处）:
      :54 `max-w-[240px]` → `max-w-60`
      验证: `grep 'max-w-\[[0-9]' apps/desktop/renderer/src/components/composites/EmptyState.tsx | wc -l` → 0

## FormField.tsx

- [ ] `FormField.tsx` 全部 `text-[Npx]` → 语义 token
      实例（2 处）:
      :30 `text-[13px]` → `text-(--text-body)`
      :35 `text-[13px]` → `text-(--text-body)`
      验证: `grep 'text-\[[0-9]' apps/desktop/renderer/src/components/composites/FormField.tsx | wc -l` → 0

## PanelContainer.tsx

- [ ] `PanelContainer.tsx` 全部 `text-[Npx]` → 语义 token
      实例（1 处）:
      :47 `text-[13px]` → `text-(--text-body)`
      验证: `grep 'text-\[[0-9]' apps/desktop/renderer/src/components/composites/PanelContainer.tsx | wc -l` → 0

## SearchInput.tsx

- [ ] `SearchInput.tsx` 全部 `text-[Npx]` → 语义 token
      实例（1 处）:
      :72 `text-[10px]` → `text-(--text-label)`
      验证: `grep 'text-\[[0-9]' apps/desktop/renderer/src/components/composites/SearchInput.tsx | wc -l` → 0

## SidebarItem.tsx

- [ ] `SidebarItem.tsx` 全部 `text-[Npx]` → 语义 token
      实例（1 处）:
      :35 `text-[13px]` → `text-(--text-body)`
      验证: `grep 'text-\[[0-9]' apps/desktop/renderer/src/components/composites/SidebarItem.tsx | wc -l` → 0

## SystemDialogContent.tsx

- [ ] `SystemDialogContent.tsx` 全部 `text-[Npx]` → 语义 token
      实例（1 处）:
      :157 `text-[9px]` → 无精确 token，审计后选择 `text-(--text-label)`（10px）或新增 token
      验证: `grep 'text-\[[0-9]' apps/desktop/renderer/src/components/features/AiDialogs/SystemDialogContent.tsx | wc -l` → 0

## GraphNode.tsx

- [ ] `GraphNode.tsx` 全部 `text-[Npx]` → 语义 token
      实例（1 处）:
      :236 `text-[9px]` → 无精确 token，审计后选择 `text-(--text-label)`（10px）或新增 token
      验证: `grep 'text-\[[0-9]' apps/desktop/renderer/src/components/features/KnowledgeGraph/GraphNode.tsx | wc -l` → 0

## AppShellMainArea.tsx

- [ ] `AppShellMainArea.tsx` 全部 `text-[Npx]` → 语义 token
      实例（1 处）:
      :133 `text-[13px]` → `text-(--text-body)`
      验证: `grep 'text-\[[0-9]' apps/desktop/renderer/src/components/layout/AppShellMainArea.tsx | wc -l` → 0

## StatusBar.tsx

- [ ] `StatusBar.tsx` 全部 `text-[Npx]` → 语义 token
      实例（1 处）:
      :84 `text-[11px]` → `text-(--text-status)`
      验证: `grep 'text-\[[0-9]' apps/desktop/renderer/src/components/layout/StatusBar.tsx | wc -l` → 0

## appShellCommands.tsx

- [ ] `appShellCommands.tsx` 全部 `text-[Npx]` → 语义 token
      实例（1 处）:
      :172 `text-[9px]` → 无精确 token，审计后选择 `text-(--text-label)`（10px）或新增 token
      验证: `grep 'text-\[[0-9]' apps/desktop/renderer/src/components/layout/appShellCommands.tsx | wc -l` → 0

## ErrorState.tsx

- [ ] `ErrorState.tsx` 全部硬编码 arbitrary → token/utility
      实例（2 处）:
      :285 `text-[12px]` → `text-(--text-caption)`
      :410 `min-h-[24rem]` → `min-h-96`
      验证: `grep -E '(text|min-h)-\[[0-9]' apps/desktop/renderer/src/components/patterns/ErrorState.tsx | grep -v 'var(--' | wc -l` → 0

## LoadingState.tsx

- [ ] `LoadingState.tsx` 全部 `text-[Npx]` → 语义 token
      实例（2 处）:
      :349 `text-[13px]` → `text-(--text-body)`
      :373 `text-[13px]` → `text-(--text-body)`
      验证: `grep 'text-\[[0-9]' apps/desktop/renderer/src/components/patterns/LoadingState.tsx | wc -l` → 0

---

## 整体验证

```bash
grep -rn 'text-\[[0-9]' apps/desktop/renderer/src/components/composites/ \
  apps/desktop/renderer/src/components/patterns/ \
  apps/desktop/renderer/src/components/layout/ \
  apps/desktop/renderer/src/components/features/ --include='*.tsx' \
  | grep -v test | grep -v stories | grep -v __tests__ | wc -l
# → 0

pnpm typecheck                    # → 0 errors
```
