# Tasks: v1-25c Primitive Token Migration

- **父 change**: v1-25-*
- **状态**: 📋 待实施
- **任务数**: 8

---

## 组件迁移

- [ ] 迁移 `Button.tsx` 到 component token
      规格: padding → `var(--button-padding-x)` / `var(--button-padding-y)`，height → `var(--button-height-*)`
      验证: `grep -c 'var(--button-' SRC/components/primitives/Button.tsx` ≥ 2

- [ ] 迁移 `Input.tsx` 到 component token
      规格: height → `var(--input-height)`，padding → `var(--input-padding-x)`
      验证: `grep -c 'var(--input-' SRC/components/primitives/Input.tsx` ≥ 2

- [ ] 迁移 `Card.tsx` 到 component token
      规格: padding → `var(--card-padding)`，shadow → `var(--card-shadow)`
      验证: `grep -c 'var(--card-' SRC/components/primitives/Card.tsx` ≥ 2

- [ ] 迁移 `ListItem.tsx` 到 component token
      规格: padding → `var(--listitem-padding-x)` / `var(--listitem-padding-y)`；收编 `compact` prop 到 DensityProvider + component token 机制
      验证: `grep -c 'var(--listitem-' SRC/components/primitives/ListItem.tsx` ≥ 2

- [ ] 迁移 `Toast.tsx` 到 component token
      规格: padding → `var(--toast-padding)`，radius → `var(--toast-radius)`
      验证: `grep -c 'var(--toast-' SRC/components/primitives/Toast.tsx` ≥ 2

## 回归测试

- [ ] 为 Button/Input 追加 component token 回归测试
      覆盖: 不使用 DensityProvider 时，渲染行为与迁移前一致
      验证: `pnpm -C apps/desktop exec vitest run renderer/src/components/primitives/Button && pnpm -C apps/desktop exec vitest run renderer/src/components/primitives/Input`

- [ ] 为 Card/ListItem/Toast 追加 component token 回归测试
      覆盖: 不使用 DensityProvider 时，渲染行为与迁移前一致
      验证: `pnpm -C apps/desktop exec vitest run renderer/src/components/primitives/Card && pnpm -C apps/desktop exec vitest run renderer/src/components/primitives/ListItem`

- [ ] 全量回归验证
      验证: `pnpm -C apps/desktop exec vitest run && pnpm typecheck`

---

## 整体验证

```bash
grep -rn 'var(--button-\|var(--input-\|var(--card-\|var(--listitem-' \
  SRC/components/primitives --include='*.tsx' | wc -l && \
pnpm typecheck && \
pnpm -C apps/desktop exec vitest run
```
