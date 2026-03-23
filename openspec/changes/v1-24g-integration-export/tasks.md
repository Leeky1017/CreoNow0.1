# Tasks: v1-24g Integration & Export

- **父 change**: v1-24-*
- **状态**: 📋 待实施
- **任务数**: 5

---

## 集成验证

- [ ] 确认 `primitives/index.ts` 导出全部新组件
      验证: `grep -cE 'Table|Separator|Alert|SegmentedControl|Progress' SRC/components/primitives/index.ts` → ≥ 5

- [ ] 确认组件文件数达标
      验证: `find SRC/components/primitives -maxdepth 1 -name '*.tsx' ! -name '*.test.*' ! -name '*.stories.*' ! -name '*.behavior.*' | wc -l` → ≥ 35

- [ ] 确认所有用户可见文本走 `t()` / i18n
      验证: `grep -rn "aria-label" SRC/components/primitives/{Table,Separator,Alert,SegmentedControl,Progress}.tsx | grep -v "t("`（应为空）

- [ ] 全量 typecheck + lint
      验证: `pnpm typecheck && pnpm lint`

- [ ] 全量测试 + Storybook 构建
      验证: `pnpm -C apps/desktop exec vitest run && pnpm -C apps/desktop storybook:build`

---

## 整体验证

```bash
pnpm typecheck && \
pnpm lint && \
pnpm -C apps/desktop exec vitest run && \
pnpm -C apps/desktop storybook:build && \
find SRC/components/primitives -maxdepth 1 -name '*.tsx' ! -name '*.test.*' ! -name '*.stories.*' ! -name '*.behavior.*' | wc -l
```
