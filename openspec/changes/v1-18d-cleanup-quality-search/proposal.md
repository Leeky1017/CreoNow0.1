# v1-18d: 清理 features/quality-gates/ + features/search/ 硬编码字号与 arbitrary 值

> 属于 v1-18-arbitrary-value-cleanup（父 change），详细设计见父 change 的 proposal.md。

## 语境

quality-gates/ 和 search/ 两模块共 7 个文件使用 `text-[10px]`/`text-[11px]`/`text-[12px]`/`text-[13px]`/`text-[15px]`
等硬编码像素字号（合计 36 处），另有少量尺寸 arbitrary 值需审计。

## 当前状态

```bash
grep -rn 'text-\[[0-9]' apps/desktop/renderer/src/features/quality-gates/ \
  apps/desktop/renderer/src/features/search/ --include='*.tsx' \
  | grep -v test | grep -v stories | grep -v __tests__ | wc -l
# → 36
```

## 目标状态

同一命令 → **0**

## 字号映射规则

| 硬编码        | token                                              | Tailwind v4             |
| ------------- | -------------------------------------------------- | ----------------------- |
| `text-[10px]` | `--text-label`                                     | `text-(--text-label)`   |
| `text-[11px]` | `--text-status`                                    | `text-(--text-status)`  |
| `text-[12px]` | `--text-caption`                                   | `text-(--text-caption)` |
| `text-[13px]` | `--text-body`                                      | `text-(--text-body)`    |
| `text-[15px]` | 无精确 token（14=subtitle, 16=card-title），需审计 | 查 tokens.css           |

## 非字号 arbitrary

| 实例                               | 文件                      | 说明                               |
| ---------------------------------- | ------------------------- | ---------------------------------- |
| `left-[3px]` `w-[18px]` `h-[18px]` | QualityRuleList.tsx:122   | toggle 滑块尺寸                    |
| `min-w-[20px]`                     | SearchPanelParts.tsx:70   | badge 最小宽度                     |
| `w-[640px]` `max-h-[80vh]`         | SearchPanel.tsx:198       | w-[640px] 已豁免（eslint-disable） |
| `max-h-[60vh]`                     | SearchResultsArea.tsx:194 | 滚动区域高度                       |

## 不做什么

- 不改 `text-[var(--*)]` — token 引用，合法
- 不改测试/stories 文件

## 完成验证

```bash
grep -rn 'text-\[[0-9]' apps/desktop/renderer/src/features/quality-gates/ \
  apps/desktop/renderer/src/features/search/ --include='*.tsx' \
  | grep -v test | grep -v stories | grep -v __tests__ | wc -l   # → 0
pnpm typecheck                                                     # → 0 errors
```
