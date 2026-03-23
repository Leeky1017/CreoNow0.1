# v1-18f: 清理 components/ 层硬编码字号与 arbitrary 值

> 属于 v1-18-arbitrary-value-cleanup（父 change），详细设计见父 change 的 proposal.md。

## 语境

components/composites/、patterns/、layout/、features/ 共 13 个文件使用 `text-[9px]`~`text-[13px]`
等硬编码像素字号（合计 15 处 text + 少量尺寸 arbitrary）。

## 当前状态

```bash
grep -rn 'text-\[[0-9]' apps/desktop/renderer/src/components/composites/ \
  apps/desktop/renderer/src/components/patterns/ \
  apps/desktop/renderer/src/components/layout/ \
  apps/desktop/renderer/src/components/features/ --include='*.tsx' \
  | grep -v test | grep -v stories | grep -v __tests__ | wc -l
# → 15
```

## 目标状态

同一命令 → **0**

## 字号映射规则

| 硬编码 | token | Tailwind v4 |
|--------|-------|-------------|
| `text-[9px]`  | 无精确 token，需审计 | 查 tokens.css |
| `text-[10px]` | `--text-label`    | `text-(--text-label)` |
| `text-[11px]` | `--text-status`   | `text-(--text-status)` |
| `text-[12px]` | `--text-caption`  | `text-(--text-caption)` |
| `text-[13px]` | `--text-body`     | `text-(--text-body)` |

## 非字号 arbitrary

| 实例 | 文件 | 说明 |
|------|------|------|
| `max-w-[240px]` | EmptyState.tsx | → `max-w-60`（240px = 60 × 4px） |
| `min-h-[24rem]` | ErrorState.tsx | → `min-h-96`（24rem = 96 × 4px） |

## 不做什么

- 不改 `text-[var(--*)]`、`text-[color:var(--*)]` — token 引用，合法
- 不改测试/stories 文件

## 完成验证

```bash
grep -rn 'text-\[[0-9]' apps/desktop/renderer/src/components/composites/ \
  apps/desktop/renderer/src/components/patterns/ \
  apps/desktop/renderer/src/components/layout/ \
  apps/desktop/renderer/src/components/features/ --include='*.tsx' \
  | grep -v test | grep -v stories | grep -v __tests__ | wc -l   # → 0
pnpm typecheck                                                     # → 0 errors
```
