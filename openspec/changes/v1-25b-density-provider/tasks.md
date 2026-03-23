# Tasks: v1-25b DensityProvider

- **父 change**: v1-25-*
- **状态**: 📋 待实施
- **任务数**: 5

---

## DensityProvider 组件

- [ ] 创建 `DensityProvider.tsx`
      规格:
      — 导出 `DensityProvider` 组件：`<div data-density={density}>` 包裹子节点
      — 导出 `useDensity` hook：Provider 内返回当前密度值，Provider 外返回 `"comfortable"`
      — 导出 `Density` type：`'compact' | 'comfortable'`
      — 嵌套时内层覆盖外层
      验证: `pnpm typecheck && find SRC -name 'DensityProvider.tsx'`

- [ ] 在 `01-tokens.css` 中新增 `[data-density="compact"]` 块
      规格:
      — 覆盖核心 component token：button、input、card、listitem、tab
      — 所有可交互元素最小高度 ≥ 28px
      — comfortable 为默认值（`:root` 中的 component token），无需额外块
      验证: `grep -c 'data-density.*compact' design/system/01-tokens.css` ≥ 1

- [ ] Compact preset guard 测试
      覆盖:
      — `[data-density="compact"]` 块存在
      — compact 块覆盖 `--button-*`、`--input-*`、`--card-*`、`--listitem-*`、`--tab-*`
      — compact 下 `--button-height-sm` ≥ 28px、`--input-height` ≥ 28px
      验证: `pnpm -C apps/desktop exec vitest run density-preset`

- [ ] 为 DensityProvider 编写单元测试
      覆盖:
      — `<DensityProvider density="compact">` → `data-density="compact"` attribute
      — `<DensityProvider density="comfortable">` → `data-density="comfortable"` attribute
      — `useDensity()` 在 Provider 内返回当前密度值
      — `useDensity()` 在 Provider 外返回 `"comfortable"`
      — 嵌套 DensityProvider 时内层覆盖外层
      — DensityProvider 使用 data-attribute 方式
      验证: `pnpm -C apps/desktop exec vitest run renderer/src/providers/DensityProvider.test.tsx`

- [ ] 导出 DensityProvider 到 providers/index.ts
      验证: `grep 'DensityProvider' SRC/providers/index.ts`

---

## 整体验证

```bash
pnpm typecheck && \
pnpm -C apps/desktop exec vitest run DensityProvider && \
grep -c 'data-density' design/system/01-tokens.css
```
