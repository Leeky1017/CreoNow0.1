# Tasks: v1-24c Alert Primitive

- **父 change**: v1-24-\*
- **状态**: 📋 待实施
- **任务数**: 5

---

## Alert 组件

- [ ] 创建 `Alert.tsx`
      规格:
      — `AlertVariant`: `"info" | "warning" | "error" | "success"`
      — variantStyles map：4 种 variant 的背景/边框/前景色组合
      — `title` + `children` 双 slot 布局
      — `icon` prop：默认按 variant 自动选择图标
      — `closable` + `onClose`：右侧关闭按钮 + 回调
      — ARIA：`role="alert"`，关闭按钮 `aria-label={t('common.close')}`
      — 从 `primitives/index.ts` 导出
      验证: `pnpm typecheck && grep 'Alert' SRC/components/primitives/index.ts`

- [ ] 为 `Alert` 编写单元测试
      覆盖:
      — `variant="info"` → `role="alert"` + info 变体 className
      — `variant="warning"` / `"error"` / `"success"` 各自变体 className
      — `<Alert title="标题">描述</Alert>` 同时渲染 title 和 description
      — `closable onClose={fn}` 渲染关闭按钮
      — 点击关闭按钮调用 `onClose` 回调
      — `icon={<CustomIcon />}` 渲染自定义图标
      验证: `pnpm -C apps/desktop exec vitest run renderer/src/components/primitives/Alert.test.tsx`

- [ ] 创建 `Alert.stories.tsx`
      覆盖: Info / Warning / Error / Success、WithTitle、Closable、CustomIcon
      验证: `pnpm -C apps/desktop storybook:build`

- [ ] 在 `primitives/index.ts` 中导出 Alert 及类型
      验证: `grep 'Alert' SRC/components/primitives/index.ts`

- [ ] 确认 Alert 文案走 i18n
      验证: `grep -n "aria-label" SRC/components/primitives/Alert.tsx | grep "t("`

---

## 整体验证

```bash
pnpm typecheck && \
pnpm -C apps/desktop exec vitest run renderer/src/components/primitives/Alert && \
pnpm -C apps/desktop storybook:build
```
