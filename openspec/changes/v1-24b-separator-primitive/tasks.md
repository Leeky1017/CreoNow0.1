# Tasks: v1-24b Separator Primitive

- **父 change**: v1-24-\*
- **状态**: 📋 待实施
- **任务数**: 4

---

## Separator 组件

- [ ] 创建 `Separator.tsx`
      规格:
      — `SeparatorVariant`: `"default" | "bold"`
      — `SeparatorOrientation`: `"horizontal" | "vertical"`
      — 水平（默认）：1px 高、100% 宽
      — 垂直：1px 宽、100% 高
      — variant 样式：default → `--color-separator`，bold → `--color-separator-bold`
      — `spacing` prop：可选 margin token
      — ARIA：`role="separator"` + 垂直时 `aria-orientation="vertical"`
      — 从 `primitives/index.ts` 导出
      验证: `pnpm typecheck && grep 'Separator' SRC/components/primitives/index.ts`

- [ ] 为 `Separator` 编写单元测试
      覆盖:
      — 默认渲染 `role="separator"` 的水平分割线
      — `orientation="vertical"` → `aria-orientation="vertical"`
      — `variant="default"` 使用 `--color-separator` 背景色
      — `variant="bold"` 使用 `--color-separator-bold` 背景色
      — `spacing="md"` 应用正确的 margin className
      验证: `pnpm -C apps/desktop exec vitest run renderer/src/components/primitives/Separator.test.tsx`

- [ ] 创建 `Separator.stories.tsx`
      覆盖: Horizontal、Vertical、Bold、WithSpacing
      验证: `pnpm -C apps/desktop storybook:build`

- [ ] 在 `primitives/index.ts` 中导出 Separator 及类型
      验证: `grep 'Separator' SRC/components/primitives/index.ts`

---

## 整体验证

```bash
pnpm typecheck && \
pnpm -C apps/desktop exec vitest run renderer/src/components/primitives/Separator && \
pnpm -C apps/desktop storybook:build
```
