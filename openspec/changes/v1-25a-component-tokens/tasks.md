# Tasks: v1-25a Component Tokens

- **父 change**: v1-25-\*
- **状态**: 📋 待实施
- **任务数**: 5

---

## Component Token 定义

- [ ] 在 `01-tokens.css` `:root` 中定义 Button component tokens
      规格: `--button-padding-x`、`--button-padding-y`、`--button-height-sm/md/lg`、`--button-radius`、`--button-gap`，引用 global/semantic token（height 可用像素值）
      验证: `grep -c '\-\-button-' design/system/01-tokens.css` ≥ 6

- [ ] 在 `01-tokens.css` `:root` 中定义 Input component tokens
      规格: `--input-height`、`--input-padding-x`、`--input-radius`
      验证: `grep -c '\-\-input-' design/system/01-tokens.css` ≥ 3

- [ ] 在 `01-tokens.css` `:root` 中定义 Card / Badge / Dialog component tokens
      规格:
      — Card: `--card-padding`、`--card-radius`、`--card-gap`、`--card-shadow: var(--shadow-sm)`
      — Badge: `--badge-padding-x`、`--badge-padding-y`、`--badge-radius`
      — Dialog: `--dialog-padding`、`--dialog-radius`、`--dialog-shadow: var(--shadow-lg)`
      验证: `grep -cE '\-\-(card|badge|dialog)-' design/system/01-tokens.css` ≥ 8

- [ ] 在 `01-tokens.css` `:root` 中定义 ListItem / Tabs / Toast component tokens
      规格:
      — ListItem: `--listitem-padding-x`、`--listitem-padding-y`、`--listitem-radius`、`--listitem-gap`
      — Tabs: `--tab-padding-x`、`--tab-padding-y`、`--tab-gap`
      — Toast: `--toast-padding`、`--toast-radius`、`--toast-shadow`
      验证: `grep -cE '\-\-(listitem|tab|toast)-' design/system/01-tokens.css` ≥ 10

- [ ] Guard 测试：component token 存在性
      覆盖: 验证以上全部 token 定义存在于 `01-tokens.css`
      验证: `pnpm -C apps/desktop exec vitest run component-token`

---

## 整体验证

```bash
grep -cE '\-\-(button|input|card|badge|listitem|dialog|tab|toast)-' design/system/01-tokens.css && \
pnpm typecheck && \
pnpm -C apps/desktop exec vitest run
```
