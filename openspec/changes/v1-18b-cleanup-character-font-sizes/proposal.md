# v1-18b: 清理 features/character/ 硬编码字号与 arbitrary 值

> 属于 v1-18-arbitrary-value-cleanup（父 change），详细设计见父 change 的 proposal.md。

## 语境

features/character/ 下 11 个文件使用 `text-[10px]` 等硬编码像素字号，应替换为语义 token。
另有少量尺寸 arbitrary（`w-[560px]`、`p-[2px]`、`w-[3px]` 等），需逐个审计映射。

## 当前状态

```bash
grep -rn 'text-\[[0-9]' apps/desktop/renderer/src/features/character/ --include='*.tsx' \
  | grep -v test | grep -v stories | grep -v __tests__ | wc -l
# → 21
```

## 目标状态

同一命令 → **0**

## 字号映射规则

| 硬编码        | token           | Tailwind v4            |
| ------------- | --------------- | ---------------------- |
| `text-[10px]` | `--text-label`  | `text-(--text-label)`  |
| `text-[11px]` | `--text-status` | `text-(--text-status)` |

## 非字号 arbitrary

| 实例                              | 说明                                            |
| --------------------------------- | ----------------------------------------------- |
| `w-[560px]`                       | 已有 eslint-disable 豁免（design spec），不处理 |
| `p-[2px]`                         | → `p-0.5`（0.5 × 4px = 2px）                    |
| `w-[3px]`                         | 指示条宽度，查 tokens.css 确定映射              |
| `h-[1px]` / `w-[1px]` / `p-[1px]` | → `h-px` / `w-px` / `p-px`                      |
| `max-h-[92vh]`                    | viewport 相对值，查 tokens.css 确定             |

## 不做什么

- 不改 `text-[var(--color-*)]` — 颜色 token 引用，合法
- 不改 `rounded-[var(--*)]` — token 引用，合法
- 不改 `max-h-[calc(...)]` — 计算表达式，保留
- 不改测试/stories 文件

## 完成验证

```bash
grep -rn 'text-\[[0-9]' apps/desktop/renderer/src/features/character/ --include='*.tsx' \
  | grep -v test | grep -v stories | grep -v __tests__ | wc -l   # → 0
pnpm typecheck                                                     # → 0 errors
pnpm -C apps/desktop exec vitest run renderer/src/features/character/  # → all pass
```
