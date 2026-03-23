# Tasks: v1-24d SegmentedControl

- **父 change**: v1-24-\*
- **状态**: 📋 待实施
- **任务数**: 4

---

## SegmentedControl Compound Component

- [ ] 创建 `SegmentedControl.tsx`
      规格:
      — `SegmentedControlSize`: `"sm" | "md"`
      — `SegmentedControl` Root：`role="radiogroup"` + 受控 value/onValueChange + context
      — `SegmentedControlItem`：`role="radio"` + `aria-checked` + active 态样式
      — sizeStyles：sm → h-7（28px），md → h-9（36px）
      — active indicator：`bg-[var(--color-bg-surface)]` + `shadow-[var(--shadow-sm)]` + `rounded-[calc(var(--radius-md)-2px)]`
      — CSS transition：`transition-all var(--duration-normal) var(--ease-default)`
      — disabled item 支持 + `aria-disabled="true"`
      — 从 `primitives/index.ts` 导出
      验证: `pnpm typecheck && grep 'SegmentedControl' SRC/components/primitives/index.ts`

- [ ] 为 `SegmentedControl` 编写单元测试
      覆盖:
      — `<SegmentedControl value="a">` 渲染 `role="radiogroup"`
      — 选中 item → `role="radio"` + `aria-checked="true"`
      — 未选中 item → `aria-checked="false"`
      — 点击未选中 item 触发 `onValueChange`
      — `size="sm"` 应用小尺寸 className
      — `size="md"` 应用中尺寸 className
      — disabled item 不可点击 + `aria-disabled="true"`
      验证: `pnpm -C apps/desktop exec vitest run renderer/src/components/primitives/SegmentedControl.test.tsx`

- [ ] 创建 `SegmentedControl.stories.tsx`
      覆盖: Default（3选项）、Sizes（sm/md对比）、Disabled、ThemeSelector
      验证: `pnpm -C apps/desktop storybook:build`

- [ ] 在 `primitives/index.ts` 中导出 SegmentedControl 及类型
      验证: `grep 'SegmentedControl' SRC/components/primitives/index.ts`

---

## 整体验证

```bash
pnpm typecheck && \
pnpm -C apps/desktop exec vitest run renderer/src/components/primitives/SegmentedControl && \
pnpm -C apps/desktop storybook:build
```
