# Tasks: v1-18g 审计 components/primitives/ 硬编码字号

- **父 change**: v1-18-arbitrary-value-cleanup
- **状态**: 📋 待实施
- **任务数**: 14

> Primitive 内部硬编码可能合法，每个任务需先审计再决定替换或豁免。

---

## Avatar.tsx

- [ ] `Avatar.tsx` 审计 `text-[Npx]` 合法性
      实例（1 处）:
        :31 `text-[10px]` → `text-(--text-label)` 或审计后豁免
      验证: `grep 'text-\[[0-9]' apps/desktop/renderer/src/components/primitives/Avatar.tsx | wc -l` → 0

## Checkbox.tsx

- [ ] `Checkbox.tsx` 审计 `text-[Npx]` 合法性
      实例（1 处）:
        :70 `text-[13px]` → `text-(--text-body)` 或审计后豁免
      验证: `grep 'text-\[[0-9]' apps/desktop/renderer/src/components/primitives/Checkbox.tsx | wc -l` → 0

## ContextMenu.tsx

- [ ] `ContextMenu.tsx` 审计 `text-[Npx]` 合法性
      实例（1 处）:
        :151 `text-[11px]` → `text-(--text-status)` 或审计后豁免
      验证: `grep 'text-\[[0-9]' apps/desktop/renderer/src/components/primitives/ContextMenu.tsx | wc -l` → 0

## Dialog.tsx

- [ ] `Dialog.tsx` 审计 `text-[Npx]` 合法性
      实例（1 处）:
        :99 `text-[13px]` → `text-(--text-body)` 或审计后豁免
      验证: `grep 'text-\[[0-9]' apps/desktop/renderer/src/components/primitives/Dialog.tsx | wc -l` → 0

## Heading.tsx

- [ ] `Heading.tsx` 审计 `text-[Npx]` 合法性
      实例（1 处）:
        :44 `text-[13px]` → `text-(--text-body)` 或审计后豁免
      验证: `grep 'text-\[[0-9]' apps/desktop/renderer/src/components/primitives/Heading.tsx | wc -l` → 0

## ImagePreview.tsx

- [ ] `ImagePreview.tsx` 审计 `text-[Npx]` 合法性
      实例（1 处）:
        :69 `text-[10px]` → `text-(--text-label)` 或审计后豁免
      验证: `grep 'text-\[[0-9]' apps/desktop/renderer/src/components/primitives/ImagePreview.tsx | wc -l` → 0

## Input.tsx

- [ ] `Input.tsx` 审计 `text-[Npx]` 合法性
      实例（1 处）:
        :21 `text-[13px]` → `text-(--text-body)` 或审计后豁免
      验证: `grep 'text-\[[0-9]' apps/desktop/renderer/src/components/primitives/Input.tsx | wc -l` → 0

## ListItem.tsx

- [ ] `ListItem.tsx` 审计 `text-[Npx]` 合法性
      实例（1 处）:
        :30 `text-[13px]` → `text-(--text-body)` 或审计后豁免
      验证: `grep 'text-\[[0-9]' apps/desktop/renderer/src/components/primitives/ListItem.tsx | wc -l` → 0

## Select.tsx

- [ ] `Select.tsx` 审计 `text-[Npx]` 合法性
      实例（1 处）:
        :41 `text-[13px]` → `text-(--text-body)` 或审计后豁免
      验证: `grep 'text-\[[0-9]' apps/desktop/renderer/src/components/primitives/Select.tsx | wc -l` → 0

## SelectContent.tsx

- [ ] `SelectContent.tsx` 审计 `text-[Npx]` 合法性
      实例（1 处）:
        :36 `text-[13px]` → `text-(--text-body)` 或审计后豁免
      验证: `grep 'text-\[[0-9]' apps/desktop/renderer/src/components/primitives/SelectContent.tsx | wc -l` → 0

## Slider.tsx

- [ ] `Slider.tsx` 审计 `text-[Npx]` 合法性
      实例（1 处）:
        :71 `text-[11px]` → `text-(--text-status)` 或审计后豁免
      验证: `grep 'text-\[[0-9]' apps/desktop/renderer/src/components/primitives/Slider.tsx | wc -l` → 0

## Text.tsx

- [ ] `Text.tsx` 审计 `text-[Npx]` 合法性（token 载体组件，优先替换为 token 引用）
      实例（4 处）:
        :61 `text-[13px]`（body 变体） → `text-(--text-body)`
        :65 `text-[11px]`（tiny 变体） → `text-(--text-status)`
        :67 `text-[10px]`（overline 变体） → `text-(--text-label)`
        :68 `text-[13px]`（code 变体） → `text-(--text-mono)` 或 `text-(--text-body)`
      验证: `grep 'text-\[[0-9]' apps/desktop/renderer/src/components/primitives/Text.tsx | wc -l` → 0

## Textarea.tsx

- [ ] `Textarea.tsx` 审计 `text-[Npx]` 合法性
      实例（1 处）:
        :21 `text-[13px]` → `text-(--text-body)` 或审计后豁免
      验证: `grep 'text-\[[0-9]' apps/desktop/renderer/src/components/primitives/Textarea.tsx | wc -l` → 0

## Toggle.tsx

- [ ] `Toggle.tsx` 审计 `text-[Npx]` 合法性
      实例（2 处）:
        :77 `text-[14px]` → `text-(--text-subtitle)`
        :87 `text-[13px]` → `text-(--text-body)` 或审计后豁免
      验证: `grep 'text-\[[0-9]' apps/desktop/renderer/src/components/primitives/Toggle.tsx | wc -l` → 0

---

## 整体验证

```bash
grep -rn 'text-\[[0-9]' apps/desktop/renderer/src/components/primitives/ --include='*.tsx' \
  | grep -v test | grep -v stories | grep -v __tests__ | wc -l
# → 0

pnpm typecheck                    # → 0 errors
```
