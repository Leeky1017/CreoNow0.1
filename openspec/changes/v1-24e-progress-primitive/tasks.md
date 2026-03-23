# Tasks: v1-24e Progress Primitive

- **父 change**: v1-24-\*
- **状态**: 📋 待实施
- **任务数**: 4

---

## Progress 组件

- [ ] 创建 `Progress.tsx`
      规格:
      — `ProgressVariant`: `"default" | "success" | "warning" | "error"`
      — `ProgressSize`: `"sm" | "md"`
      — 轨道 + 填充条布局：`overflow: hidden` + `border-radius: var(--radius-full)`
      — variantStyles：default → `--color-accent`，success/warning/error → 对应功能色
      — sizeStyles：sm → h-1（4px），md → h-2（8px）
      — `value` prop：百分比，clamp 到 0-100
      — 填充条宽度：`style={{ width: \`${clampedValue}%\` }}`    —`label` prop：可选进度文本
— ARIA：`role="progressbar"`+`aria-valuenow`+`aria-valuemin="0"`+`aria-valuemax="100"`
— transition：`transition-[width] var(--duration-normal) var(--ease-default)`    — 从`primitives/index.ts`导出
验证:`pnpm typecheck && grep 'Progress' SRC/components/primitives/index.ts`

- [ ] 为 `Progress` 编写单元测试
      覆盖:
      — `value={65}` → `role="progressbar"` + `aria-valuenow="65"` + `aria-valuemin="0"` + `aria-valuemax="100"`
      — `value={0}` 填充宽度 0%
      — `value={100}` 填充宽度 100%
      — value 超出 0-100 范围时 clamp 到边界值
      — `variant="default"` / `"success"` / `"warning"` / `"error"` 各自填充色
      — `size="sm"` 轨道高度 4px
      — `size="md"` 轨道高度 8px
      — `label="65%"` 渲染进度标签文本
      验证: `pnpm -C apps/desktop exec vitest run renderer/src/components/primitives/Progress.test.tsx`

- [ ] 创建 `Progress.stories.tsx`
      覆盖: Default（65%）、Variants（4种对比）、Sizes（sm/md对比）、WithLabel、ZeroAndFull
      验证: `pnpm -C apps/desktop storybook:build`

- [ ] 在 `primitives/index.ts` 中导出 Progress 及类型
      验证: `grep 'Progress' SRC/components/primitives/index.ts`

---

## 整体验证

```bash
pnpm typecheck && \
pnpm -C apps/desktop exec vitest run renderer/src/components/primitives/Progress && \
pnpm -C apps/desktop storybook:build
```
