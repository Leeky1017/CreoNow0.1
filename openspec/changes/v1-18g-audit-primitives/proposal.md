# v1-18g: 审计 components/primitives/ 硬编码字号

> 属于 v1-18-arbitrary-value-cleanup（父 change），详细设计见父 change 的 proposal.md。

## 语境

primitives/ 是设计系统基础组件层，14 个文件使用 `text-[10px]`~`text-[14px]` 等硬编码像素字号。
Primitive 内部用硬编码可能合法（如 `Text.tsx` 定义的变体尺寸即为 token 的 Tailwind 表达），
需**逐个审计合法性**后再决定是否替换。

## 审计原则

1. 若 primitive 本身就是 token 的载体（如 `Text.tsx` 的 `body`/`tiny` 变体），
   其硬编码值应替换为 `text-(--text-body)` 等 token 引用，确保 tokens.css 为唯一真实来源。
2. 若硬编码值是组件内部固定尺寸且无对应 token，可保留并加 eslint-disable 注释。
3. 非字号尺寸 arbitrary（如 `w-[18px]`）拆入 v1-18h。

## 当前状态

```bash
grep -rn 'text-\[[0-9]' apps/desktop/renderer/src/components/primitives/ --include='*.tsx' \
  | grep -v test | grep -v stories | grep -v __tests__ | wc -l
# → 18
```

## 目标状态

审计完成后，所有硬编码字号要么替换为 token 引用，要么标记 eslint-disable 豁免。

## 字号映射规则

| 硬编码 | token | Tailwind v4 |
|--------|-------|-------------|
| `text-[10px]` | `--text-label`    | `text-(--text-label)` |
| `text-[11px]` | `--text-status`   | `text-(--text-status)` |
| `text-[13px]` | `--text-body`     | `text-(--text-body)` |
| `text-[14px]` | `--text-subtitle` | `text-(--text-subtitle)` |

## 不做什么

- 不改 `text-[var(--*)]` — token 引用，合法
- 不处理非字号尺寸 arbitrary — 归 v1-18h
- 不改测试/stories 文件

## 完成验证

```bash
grep -rn 'text-\[[0-9]' apps/desktop/renderer/src/components/primitives/ --include='*.tsx' \
  | grep -v test | grep -v stories | grep -v __tests__ | wc -l   # → 0
pnpm typecheck                                                     # → 0 errors
```
