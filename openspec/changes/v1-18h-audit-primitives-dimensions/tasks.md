# Tasks: v1-18h 审计 components/primitives/ 尺寸 arbitrary 值

- **父 change**: v1-18-arbitrary-value-cleanup
- **状态**: 📋 待实施
- **任务数**: 13

> Primitive 内部尺寸可能合法，每个任务需先审计再决定替换或豁免。

---

## Badge.tsx

- [ ] `Badge.tsx` 审计尺寸 arbitrary 合法性
      实例（2 处）:
      :85 `h-[18px]` → `h-4.5` 或审计后豁免
      :86 `h-[22px]` → `h-5.5` 或审计后豁免
      验证: `grep 'h-\[[0-9]' apps/desktop/renderer/src/components/primitives/Badge.tsx | wc -l` → 0

## ContextMenu.tsx

- [ ] `ContextMenu.tsx` 审计尺寸 arbitrary 合法性
      实例（2 处）:
      :49 `min-w-[160px]` → `min-w-40`（160px = 40 × 4px）或审计后豁免
      :51 `max-w-[240px]` → `max-w-60`（240px = 60 × 4px）或审计后豁免
      验证: `grep -E '(min-w|max-w)-\[[0-9]' apps/desktop/renderer/src/components/primitives/ContextMenu.tsx | wc -l` → 0

## Dialog.tsx

- [ ] `Dialog.tsx` 审计尺寸 arbitrary 合法性
      实例（1 处）:
      :70 `max-h-[85vh]` → 查 tokens.css 确定映射或审计后豁免
      验证: `grep 'max-h-\[[0-9]' apps/desktop/renderer/src/components/primitives/Dialog.tsx | wc -l` → 0

## DropdownMenu.tsx

- [ ] `DropdownMenu.tsx` 审计尺寸 arbitrary 合法性
      实例（2 处）:
      :51 `min-w-[160px]` → `min-w-40` 或审计后豁免
      :53 `max-w-[240px]` → `max-w-60` 或审计后豁免
      验证: `grep -E '(min-w|max-w)-\[[0-9]' apps/desktop/renderer/src/components/primitives/DropdownMenu.tsx | wc -l` → 0

## ImageUpload.tsx

- [ ] `ImageUpload.tsx` 审计尺寸 arbitrary 合法性
      实例（1 处）:
      :150 `min-h-[140px]` → `min-h-35`（140px = 35 × 4px）或审计后豁免
      验证: `grep 'min-h-\[[0-9]' apps/desktop/renderer/src/components/primitives/ImageUpload.tsx | wc -l` → 0

## Popover.tsx

- [ ] `Popover.tsx` 审计尺寸 arbitrary 合法性
      实例（2 处）:
      :52 `min-w-[200px]` → `min-w-50`（200px = 50 × 4px）或审计后豁免
      :54 `max-w-[320px]` → `max-w-80`（320px = 80 × 4px）或审计后豁免
      验证: `grep -E '(min-w|max-w)-\[[0-9]' apps/desktop/renderer/src/components/primitives/Popover.tsx | wc -l` → 0

## SelectContent.tsx

- [ ] `SelectContent.tsx` 审计尺寸 arbitrary 合法性
      实例（1 处）:
      :32 `max-h-[300px]` → `max-h-75`（300px = 75 × 4px）或审计后豁免
      验证: `grep 'max-h-\[[0-9]' apps/desktop/renderer/src/components/primitives/SelectContent.tsx | wc -l` → 0

## Slider.tsx

- [ ] `Slider.tsx` 审计尺寸 arbitrary 合法性
      实例（1 处）:
      :38 `h-[2px]` → `h-0.5` 或审计后豁免
      验证: `grep 'h-\[[0-9]' apps/desktop/renderer/src/components/primitives/Slider.tsx | wc -l` → 0

## Toast.tsx

- [ ] `Toast.tsx` 审计尺寸 arbitrary 合法性
      实例（1 处）:
      :69 `w-[360px]` → `w-90`（360px = 90 × 4px）或审计后豁免
      验证: `grep 'w-\[[0-9]' apps/desktop/renderer/src/components/primitives/Toast.tsx | wc -l` → 0

## Toggle.tsx

- [ ] `Toggle.tsx` 审计尺寸 arbitrary 合法性
      实例（2 处）:
      :65 `w-[18px]` → `w-4.5` 或审计后豁免
      :66 `h-[18px]` → `h-4.5` 或审计后豁免
      验证: `grep -E '(w|h)-\[[0-9]' apps/desktop/renderer/src/components/primitives/Toggle.tsx | grep -v 'text' | wc -l` → 0

## Tooltip.tsx

- [ ] `Tooltip.tsx` 审计尺寸 arbitrary 合法性
      实例（1 处）:
      :34 `max-w-[200px]` → `max-w-50`（200px = 50 × 4px）或审计后豁免
      验证: `grep 'max-w-\[[0-9]' apps/desktop/renderer/src/components/primitives/Tooltip.tsx | wc -l` → 0

## Heading.tsx

- [ ] `Heading.tsx` 审计 `leading-[1.4]` arbitrary 合法性
      实例（1 处）:
      :44 `leading-[1.4]` → 查 tokens.css 确定映射或审计后豁免
      注: 行高 arbitrary 不在主扫描范围，但属于同一 primitive，一并审计
      验证: 审计完成即可

## Text.tsx

- [ ] `Text.tsx` 审计 `leading-[N]` arbitrary 合法性
      实例（2 处）:
      :61 `leading-[1.5]` → 查 tokens.css 确定映射或审计后豁免
      :65 `leading-[1.2]` → 查 tokens.css 确定映射或审计后豁免
      注: 行高 arbitrary 不在主扫描范围，但属于 token 载体组件，一并审计
      验证: 审计完成即可

---

## 整体验证

```bash
grep -rn '\(w\|h\|min-w\|max-w\|min-h\|max-h\)-\[[0-9]' \
  apps/desktop/renderer/src/components/primitives/ --include='*.tsx' \
  | grep -v test | grep -v stories | grep -v __tests__ | grep -v 'var(--' | wc -l
# → 0 或仅剩已豁免值

pnpm typecheck                    # → 0 errors
```
