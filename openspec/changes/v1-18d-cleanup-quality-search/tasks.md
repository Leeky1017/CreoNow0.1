# Tasks: v1-18d 清理 features/quality-gates/ + features/search/ 硬编码字号

- **父 change**: v1-18-arbitrary-value-cleanup
- **状态**: 📋 待实施
- **任务数**: 7

---

## QualityCheckItems.tsx

- [ ] `QualityCheckItems.tsx` 全部 `text-[Npx]` → 语义 token
      实例（12 处）:
      :139 `text-[12px]` → `text-(--text-caption)`
      :142 `text-[10px]` → `text-(--text-label)`
      :157 `text-[12px]` → `text-(--text-caption)`
      :161 `text-[10px]` → `text-(--text-label)`
      :178 `text-[10px]` → `text-(--text-label)`
      :186 `text-[10px]` → `text-(--text-label)`
      :194 `text-[10px]` → `text-(--text-label)`
      :245 `text-[13px]` → `text-(--text-body)`
      :250 `text-[10px]` → `text-(--text-label)`
      :260 `text-[10px]` → `text-(--text-label)`
      :265 `text-[11px]` → `text-(--text-status)`
      :269 `text-[11px]` → `text-(--text-status)`
      验证: `grep 'text-\[[0-9]' apps/desktop/renderer/src/features/quality-gates/QualityCheckItems.tsx | wc -l` → 0

## QualityGatesPanel.tsx

- [ ] `QualityGatesPanel.tsx` 全部 `text-[Npx]` → 语义 token
      实例（2 处）:
      :70 `text-[15px]` → 无精确 token，审计后选择 `text-(--text-subtitle)`（14px）或新增 token
      :109 `text-[13px]` → `text-(--text-body)`
      验证: `grep 'text-\[[0-9]' apps/desktop/renderer/src/features/quality-gates/QualityGatesPanel.tsx | wc -l` → 0

## QualityRuleList.tsx

- [ ] `QualityRuleList.tsx` 全部硬编码 arbitrary → token/utility
      text-[Npx] 实例（6 处）:
      :58 `text-[13px]` → `text-(--text-body)`
      :61 `text-[11px]` → `text-(--text-status)`
      :104 `text-[13px]` → `text-(--text-body)`
      :160 `text-[13px]` → `text-(--text-body)`
      :188 `text-[13px]` → `text-(--text-body)`
      :202 `text-[12px]` → `text-(--text-caption)`
      尺寸 arbitrary 实例（3 处）:
      :122 `left-[3px]` → 查 tokens.css
      :122 `w-[18px]` → `w-4.5`（18px = 4.5 × 4px）或查 tokens.css
      :122 `h-[18px]` → `h-4.5` 或查 tokens.css
      验证: `grep -E '(text|w|h|left)-\[[0-9]' apps/desktop/renderer/src/features/quality-gates/QualityRuleList.tsx | grep -v 'var(--' | wc -l` → 0

## SearchPanelParts.tsx

- [ ] `SearchPanelParts.tsx` 全部硬编码 arbitrary → token/utility
      text-[Npx] 实例（5 处）:
      :48 `text-[10px]` → `text-(--text-label)`
      :51 `text-[10px]` → `text-(--text-label)`
      :70 `text-[10px]` → `text-(--text-label)`
      :73 `text-[10px]` → `text-(--text-label)`
      :114 `text-[10px]` → `text-(--text-label)`
      尺寸 arbitrary 实例（1 处）:
      :70 `min-w-[20px]` → `min-w-5`（20px = 5 × 4px）
      验证: `grep -E '(text|min-w)-\[[0-9]' apps/desktop/renderer/src/features/search/SearchPanelParts.tsx | grep -v 'var(--' | wc -l` → 0

## SearchResultItems.tsx

- [ ] `SearchResultItems.tsx` 全部 `text-[Npx]` → 语义 token
      实例（8 处）:
      :106 `text-[10px]` → `text-(--text-label)`
      :127 `text-[10px]` → `text-(--text-label)`
      :132 `text-[10px]` → `text-(--text-label)`
      :137 `text-[10px]` → `text-(--text-label)`
      :186 `text-[10px]` → `text-(--text-label)`
      :201 `text-[10px]` → `text-(--text-label)`
      :238 `text-[10px]` → `text-(--text-label)`
      :242 `text-[10px]` → `text-(--text-label)`
      验证: `grep 'text-\[[0-9]' apps/desktop/renderer/src/features/search/SearchResultItems.tsx | wc -l` → 0

## SearchResultsArea.tsx

- [ ] `SearchResultsArea.tsx` 全部硬编码 arbitrary → token/utility
      text-[Npx] 实例（3 处）:
      :171 `text-[10px]` → `text-(--text-label)`
      :216 `text-[10px]` → `text-(--text-label)`
      :219 `text-[10px]` → `text-(--text-label)`
      尺寸 arbitrary 实例（1 处）:
      :194 `max-h-[60vh]` → 查 tokens.css 确定映射
      验证: `grep -E '(text|max-h)-\[[0-9]' apps/desktop/renderer/src/features/search/SearchResultsArea.tsx | grep -v 'var(--' | wc -l` → 0

## SearchPanel.tsx

- [ ] `SearchPanel.tsx` 尺寸 arbitrary 审计
      实例（2 处）:
      :198 `w-[640px]` → 已有 eslint-disable 豁免（design spec），不处理
      :198 `max-h-[80vh]` → 查 tokens.css 确定映射
      验证: 审计完成即可

---

## 整体验证

```bash
grep -rn 'text-\[[0-9]' apps/desktop/renderer/src/features/quality-gates/ \
  apps/desktop/renderer/src/features/search/ --include='*.tsx' \
  | grep -v test | grep -v stories | grep -v __tests__ | wc -l
# → 0

pnpm typecheck                    # → 0 errors
```
