# v1-18c: 清理 features/version-history/ + features/diff/ 硬编码字号

> 属于 v1-18-arbitrary-value-cleanup（父 change），详细设计见父 change 的 proposal.md。

## 语境

version-history/ 和 diff/ 两模块共 10 个文件使用 `text-[10px]`/`text-[11px]`/`text-[13px]` 等
硬编码像素字号（合计 42 处），应替换为语义 token。无非字号 arbitrary 值。

## 当前状态

```bash
grep -rn 'text-\[[0-9]' apps/desktop/renderer/src/features/version-history/ \
  apps/desktop/renderer/src/features/diff/ --include='*.tsx' \
  | grep -v test | grep -v stories | grep -v __tests__ | wc -l
# → 42
```

## 目标状态

同一命令 → **0**

## 字号映射规则

| 硬编码 | token | Tailwind v4 |
|--------|-------|-------------|
| `text-[9px]`  | 无精确 token，需审计 | 查 tokens.css |
| `text-[10px]` | `--text-label`  | `text-(--text-label)` |
| `text-[11px]` | `--text-status` | `text-(--text-status)` |
| `text-[13px]` | `--text-body`   | `text-(--text-body)` |

## 不做什么

- 不改 `text-[var(--color-*)]` — 颜色 token 引用，合法
- 不改测试/stories 文件

## 完成验证

```bash
grep -rn 'text-\[[0-9]' apps/desktop/renderer/src/features/version-history/ \
  apps/desktop/renderer/src/features/diff/ --include='*.tsx' \
  | grep -v test | grep -v stories | grep -v __tests__ | wc -l   # → 0
pnpm typecheck                                                     # → 0 errors
```
