# Tasks: v1-24f Input prefix/suffix

- **父 change**: v1-24-*
- **状态**: 📋 待实施
- **任务数**: 3

---

## Input 增强

- [ ] 修改 `Input.tsx` 添加 prefix/suffix slot
      规格:
      — 新增 `prefix` prop（`ReactNode`）和 `suffix` prop（`ReactNode`）到 `InputProps`
      — 有 prefix 或 suffix 时：包裹 flex 容器，外层容器承接边框/焦点/错误样式
      — `<input>` 在 wrapper 内 `border: none` + `outline: none` + `flex: 1`
      — prefix 区域：`flex-shrink-0` + `color: var(--color-fg-muted)` + `pl-3 pr-0`
      — suffix 区域：`flex-shrink-0` + `color: var(--color-fg-muted)` + `pr-3 pl-0`
      — 不传 prefix/suffix 时：保持原有裸 `<input>` 渲染路径，零回归
      — `ref` 始终指向 `<input>` 元素
      验证: `pnpm typecheck && grep -c 'prefix\|suffix' SRC/components/primitives/Input.tsx`

- [ ] 追加 Input prefix/suffix 测试用例
      覆盖:
      — `prefix={<span>🔍</span>}` 渲染前缀在输入框左侧
      — `suffix={<span>×</span>}` 渲染后缀在输入框右侧
      — 同时渲染前后缀
      — 带 prefix/suffix 时可正常输入、获取焦点
      — 带 prefix/suffix 时 error 态样式应用到外层容器
      — 带 prefix/suffix 时 disabled 态正确生效
      — 不传 prefix/suffix 时渲染结果与原 Input 完全一致
      — `ref` 仍然指向 `<input>` 元素
      验证: `pnpm -C apps/desktop exec vitest run renderer/src/components/primitives/Input.test`

- [ ] 更新 `Input.stories.tsx` 添加 prefix/suffix Story
      覆盖: WithPrefix（搜索图标）、WithSuffix（清除按钮）、WithPrefixAndSuffix
      验证: `pnpm -C apps/desktop storybook:build`

---

## 整体验证

```bash
pnpm typecheck && \
pnpm -C apps/desktop exec vitest run renderer/src/components/primitives/Input && \
pnpm -C apps/desktop storybook:build
```
