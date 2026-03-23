# Tasks: v1-25d Density Stories

- **父 change**: v1-25-*
- **状态**: 📋 待实施
- **任务数**: 4

---

## Density Storybook

- [ ] 创建 `DensityProvider.stories.tsx`
      规格: 展示 compact vs comfortable 密度并排对比
      — 包含 Button / Input / Card / ListItem 在两种密度下的对比
      验证: `find SRC -name 'DensityProvider.stories.*' | wc -l` → 1

- [ ] Storybook 构建验证
      验证: `pnpm -C apps/desktop storybook:build`

- [ ] 全量测试 + TypeScript 检查
      验证: `pnpm typecheck && pnpm -C apps/desktop exec vitest run`

- [ ] Lint 最终检查
      验证: `pnpm lint`

---

## 整体验证

```bash
pnpm typecheck && \
pnpm lint && \
pnpm -C apps/desktop exec vitest run && \
pnpm -C apps/desktop storybook:build
```
