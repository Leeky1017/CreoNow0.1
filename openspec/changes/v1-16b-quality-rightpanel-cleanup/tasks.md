# Tasks: v1-16b quality-gates/rightpanel 硬编码像素清理

- **父 change**: v1-16-*
- **状态**: 📋 待实施
- **任务数**: 5

---

## 文件组

- [ ] `QualityCheckItems.tsx` text-[Npx] → Design Token / Tailwind 标准类
      实例（12 处）:
        :139 `text-[12px]` → `text-xs`
        :142 `text-[10px]` → `text-[var(--text-caption-size)]` 或 `text-xs`
        :157 `text-[12px]` → `text-xs`
        :161 `text-[10px]` → `text-[var(--text-caption-size)]` 或 `text-xs`
        :178 `!text-[10px]` → `!text-xs`
        :186 `!text-[10px]` → `!text-xs`
        :194 `!text-[10px]` → `!text-xs`
        :245 `text-[13px]` → `text-sm`
        :250 `text-[10px]` → `text-xs`
        :260 `text-[10px]` → `text-xs`
        :265 `text-[11px]` → `text-xs`
        :269 `text-[11px]` → `text-xs`
      验证: `grep -c 'text-\[[0-9]\+px\]' SRC/features/quality-gates/QualityCheckItems.tsx` → 0

- [ ] `QualityRuleList.tsx` text-[Npx] + sizing arbitrary → 标准类
      实例（8 处）:
        :58 `text-[13px]` → `text-sm`
        :61 `text-[11px]` → `text-xs`
        :104 `text-[13px]` → `text-sm`
        :122 `left-[3px] w-[18px] h-[18px]` → `left-0.5 w-4.5 h-4.5` 或等效标准类
        :124 `translate-x-[20px]` → `translate-x-5`
        :160 `text-[13px]` → `text-sm`
        :188 `text-[13px]` → `text-sm`
        :202 `text-[12px]` → `text-xs`
      验证: `grep -c 'text-\[[0-9]\+px\]' SRC/features/quality-gates/QualityRuleList.tsx` → 0

- [ ] `QualityGatesPanel.tsx` text-[Npx] → 标准类
      实例（2 处）:
        :70 `text-[15px]` → `text-base` 或 `text-[var(--text-heading-size)]`
        :109 `text-[13px]` → `text-sm`
      验证: `grep -c 'text-\[[0-9]\+px\]' SRC/features/quality-gates/QualityGatesPanel.tsx` → 0

- [ ] `QualityPanel.tsx` text-[Npx] → 标准类
      实例（4 处）:
        :158 `text-[15px]` → `text-base` 或 `text-[var(--text-heading-size)]`
        :174 `text-[13px]` → `text-sm`
        :197 `text-[13px]` → `text-sm`
        :210 `text-[13px]` → `text-sm`
      验证: `grep -c 'text-\[[0-9]\+px\]' SRC/features/rightpanel/QualityPanel.tsx` → 0

- [ ] `QualityPanelSections.tsx` text-[Npx] → 标准类
      实例（2 处）:
        :211 `text-[10px]` → `text-xs`
        :217 `text-[10px]` → `text-xs`
      验证: `grep -c 'text-\[[0-9]\+px\]' SRC/features/rightpanel/QualityPanelSections.tsx` → 0

---

## 整体验证

```bash
grep -rn 'text-\[[0-9]\+px\]' SRC/features/quality-gates/ SRC/features/rightpanel/ --include='*.tsx' | grep -v test | grep -v stories | wc -l  # → 0
pnpm typecheck && pnpm -C apps/desktop exec vitest run quality
```
