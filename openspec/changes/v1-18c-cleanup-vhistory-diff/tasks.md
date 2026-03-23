# Tasks: v1-18c 清理 features/version-history/ + features/diff/ 硬编码字号

- **父 change**: v1-18-arbitrary-value-cleanup
- **状态**: 📋 待实施
- **任务数**: 10

---

## DiffFooter.tsx

- [ ] `DiffFooter.tsx` 全部 `text-[Npx]` → 语义 token
      实例（1 处）:
        :74 `text-[11px]` → `text-(--text-status)`
      验证: `grep 'text-\[[0-9]' apps/desktop/renderer/src/features/diff/DiffFooter.tsx | wc -l` → 0

## DiffHeader.tsx

- [ ] `DiffHeader.tsx` 全部 `text-[Npx]` → 语义 token
      实例（2 处）:
        :96  `text-[10px]` → `text-(--text-label)`
        :129 `text-[10px]` → `text-(--text-label)`
      验证: `grep 'text-\[[0-9]' apps/desktop/renderer/src/features/diff/DiffHeader.tsx | wc -l` → 0

## DiffView.tsx

- [ ] `DiffView.tsx` 全部 `text-[Npx]` → 语义 token
      实例（3 处）:
        :172 `text-[11px]` → `text-(--text-status)`
        :215 `text-[11px]` → `text-(--text-status)`
        :313 `text-[13px]` → `text-(--text-body)`
      验证: `grep 'text-\[[0-9]' apps/desktop/renderer/src/features/diff/DiffView.tsx | wc -l` → 0

## MultiVersionCompare.tsx

- [ ] `MultiVersionCompare.tsx` 全部 `text-[Npx]` → 语义 token
      实例（1 处）:
        :78 `text-[10px]` → `text-(--text-label)`
      验证: `grep 'text-\[[0-9]' apps/desktop/renderer/src/features/diff/MultiVersionCompare.tsx | wc -l` → 0

## SplitDiffView.tsx

- [ ] `SplitDiffView.tsx` 全部 `text-[Npx]` → 语义 token
      实例（5 处）:
        :162 `text-[13px]` → `text-(--text-body)`
        :166 `text-[10px]` → `text-(--text-label)`
        :176 `text-[11px]` → `text-(--text-status)`
        :206 `text-[10px]` → `text-(--text-label)`
        :216 `text-[11px]` → `text-(--text-status)`
      验证: `grep 'text-\[[0-9]' apps/desktop/renderer/src/features/diff/SplitDiffView.tsx | wc -l` → 0

## VersionPane.tsx

- [ ] `VersionPane.tsx` 全部 `text-[Npx]` → 语义 token
      实例（1 处）:
        :78 `text-[10px]` → `text-(--text-label)`
      验证: `grep 'text-\[[0-9]' apps/desktop/renderer/src/features/diff/VersionPane.tsx | wc -l` → 0

## BranchMergeSection.tsx

- [ ] `BranchMergeSection.tsx` 全部 `text-[Npx]` → 语义 token
      实例（9 处）:
        :37  `text-[11px]` → `text-(--text-status)`
        :44  `text-[11px]` → `text-(--text-status)`
        :52  `text-[11px]` → `text-(--text-status)`
        :60  `text-[11px]` → `text-(--text-status)`
        :80  `text-[11px]` → `text-(--text-status)`
        :157 `text-[11px]` → `text-(--text-status)`
        :166 `text-[11px]` → `text-(--text-status)`
        :192 `text-[11px]` → `text-(--text-status)`
        :197 `text-[11px]` → `text-(--text-status)`
      验证: `grep 'text-\[[0-9]' apps/desktop/renderer/src/features/version-history/BranchMergeSection.tsx | wc -l` → 0

## VersionBadges.tsx

- [ ] `VersionBadges.tsx` 全部 `text-[Npx]` → 语义 token
      实例（8 处）:
        :59  `text-[10px]` → `text-(--text-label)`
        :103 `text-[10px]` → `text-(--text-label)`
        :135 `text-[10px]` → `text-(--text-label)`
        :165 `text-[11px]` → `text-(--text-status)`
        :166 `text-[9px]` → 无精确 token，审计后选择最近 `text-(--text-label)` 或新增 token
        :178 `text-[10px]` → `text-(--text-label)`
        :199 `text-[10px]` → `text-(--text-label)`
        :213 `text-[10px]` → `text-(--text-label)`
      验证: `grep 'text-\[[0-9]' apps/desktop/renderer/src/features/version-history/VersionBadges.tsx | wc -l` → 0

## VersionCard.tsx

- [ ] `VersionCard.tsx` 全部 `text-[Npx]` → 语义 token
      实例（10 处）:
        :144 `text-[13px]` → `text-(--text-body)`
        :154 `text-[10px]` → `text-(--text-label)`
        :163 `text-[10px]` → `text-(--text-label)`
        :171 `text-[10px]` → `text-(--text-label)`
        :189 `text-[10px]` → `text-(--text-label)`
        :203 `text-[13px]` → `text-(--text-body)`
        :206 `text-[11px]` → `text-(--text-status)`
        :239 `text-[10px]` → `text-(--text-label)`
        :245 `text-[13px]` → `text-(--text-body)`
        :285 `text-[10px]` → `text-(--text-label)`
      验证: `grep 'text-\[[0-9]' apps/desktop/renderer/src/features/version-history/VersionCard.tsx | wc -l` → 0

## VersionHistoryPanel.tsx

- [ ] `VersionHistoryPanel.tsx` 全部 `text-[Npx]` → 语义 token
      实例（2 处）:
        :163 `text-[10px]` → `text-(--text-label)`
        :217 `text-[11px]` → `text-(--text-status)`
      验证: `grep 'text-\[[0-9]' apps/desktop/renderer/src/features/version-history/VersionHistoryPanel.tsx | wc -l` → 0

---

## 整体验证

```bash
grep -rn 'text-\[[0-9]' apps/desktop/renderer/src/features/version-history/ \
  apps/desktop/renderer/src/features/diff/ --include='*.tsx' \
  | grep -v test | grep -v stories | grep -v __tests__ | wc -l
# → 0

pnpm typecheck                    # → 0 errors
```
