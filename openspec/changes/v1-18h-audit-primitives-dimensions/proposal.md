# v1-18h: 审计 components/primitives/ 尺寸 arbitrary 值

> 属于 v1-18-arbitrary-value-cleanup（父 change），详细设计见父 change 的 proposal.md。
> 从 v1-18g 拆出：v1-18g 处理字号，v1-18h 处理尺寸。

## 语境

primitives/ 中 13 个文件存在 `w-[Npx]`、`h-[Npx]`、`min-w-[Npx]`、`max-w-[Npx]`、`max-h-[Nvh]`
等非字号硬编码 arbitrary 值（合计 17 处）。
Primitive 内部尺寸可能合法（组件固有尺寸），需逐个审计合法性。

## 审计原则

1. 可映射到 Tailwind spacing scale 的值直接替换（如 `w-[18px]` → `w-4.5`）。
2. 组件固有尺寸若无标准映射，保留并加 eslint-disable 注释说明原因。
3. viewport 单位（`max-h-[85vh]`）查 tokens.css 是否有对应 token。

## 当前状态

```bash
grep -rn '\(w\|h\|p\|m\|gap\|rounded\|min-w\|max-w\|min-h\|max-h\)-\[[0-9]' \
  apps/desktop/renderer/src/components/primitives/ --include='*.tsx' \
  | grep -v test | grep -v stories | grep -v __tests__ | grep -v 'var(--' | wc -l
# → 13
```

## 不做什么

- 不处理 `text-[Npx]` — 归 v1-18g
- 不改 `rounded-[var(--*)]` — token 引用，合法
- 不改 `h-[var(--*)]` 等 — token 引用，合法
- 不改测试/stories 文件

## 完成验证

```bash
grep -rn '\(w\|h\|min-w\|max-w\|min-h\|max-h\)-\[[0-9]' \
  apps/desktop/renderer/src/components/primitives/ --include='*.tsx' \
  | grep -v test | grep -v stories | grep -v __tests__ | grep -v 'var(--' | wc -l
# → 0 或仅剩已豁免值
pnpm typecheck                                                     # → 0 errors
```
