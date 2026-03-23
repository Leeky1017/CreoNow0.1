# v1-18a: 清理 features/ai/ 硬编码字号

> 属于 v1-18-arbitrary-value-cleanup（父 change），详细设计见父 change 的 proposal.md。

## 语境

features/ai/ 下 7 个文件使用 `text-[10px]` 等硬编码像素字号，应替换为语义 token。
不改则视觉一致性靠人记忆维护，改后字号由 `tokens.css` 统一控制。

## 当前状态

```bash
grep -rn 'text-\[[0-9]' apps/desktop/renderer/src/features/ai/ --include='*.tsx' \
  | grep -v test | grep -v stories | grep -v __tests__ | wc -l
# → 35
```

## 目标状态

同一命令 → **0**

## 映射规则

| 硬编码        | token            | 值   | Tailwind v4             |
| ------------- | ---------------- | ---- | ----------------------- |
| `text-[10px]` | `--text-label`   | 10px | `text-(--text-label)`   |
| `text-[11px]` | `--text-status`  | 11px | `text-(--text-status)`  |
| `text-[12px]` | `--text-caption` | 12px | `text-(--text-caption)` |
| `text-[13px]` | `--text-body`    | 13px | `text-(--text-body)`    |

## 不做什么

- 不改 `text-[var(--color-*)]` — 颜色 token 引用，合法
- 不改 `rounded-[Npx]` — 归 v1-18 其他 micro-change（本目录还有 3 处 `rounded-[10px]`/`rounded-[1px]`，不在本 micro-change 范围）
- 不改非 `text-` 类硬编码（如 `w-[Npx]`、`h-[Npx]`）— 归其他 micro-change
- 不改测试/stories 文件

## 完成验证

```bash
grep -rn 'text-\[[0-9]' apps/desktop/renderer/src/features/ai/ --include='*.tsx' \
  | grep -v test | grep -v stories | grep -v __tests__ | wc -l   # → 0
pnpm typecheck                                                     # → 0 errors
pnpm -C apps/desktop exec vitest run renderer/src/features/ai/     # → all pass
```
