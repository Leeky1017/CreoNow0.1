# v1-18e: 清理 remaining features 硬编码字号与 arbitrary 值

> 属于 v1-18-arbitrary-value-cleanup（父 change），详细设计见父 change 的 proposal.md。

## 语境

outline/、rightpanel/、projects/、editor/、files/、dashboard/、memory/、kg/ 共 11 个文件
使用 `text-[9px]`~`text-[15px]` 等硬编码像素字号（合计 19 处 text + 少量尺寸 arbitrary）。

## 当前状态

```bash
grep -rn 'text-\[[0-9]' apps/desktop/renderer/src/features/outline/ \
  apps/desktop/renderer/src/features/rightpanel/ \
  apps/desktop/renderer/src/features/projects/ \
  apps/desktop/renderer/src/features/editor/ \
  apps/desktop/renderer/src/features/files/ \
  apps/desktop/renderer/src/features/dashboard/ \
  apps/desktop/renderer/src/features/memory/ \
  apps/desktop/renderer/src/features/kg/ --include='*.tsx' \
  | grep -v test | grep -v stories | grep -v __tests__ | wc -l
# → 19
```

## 目标状态

同一命令 → **0**

## 字号映射规则

| 硬编码        | token                | Tailwind v4            |
| ------------- | -------------------- | ---------------------- |
| `text-[9px]`  | 无精确 token，需审计 | 查 tokens.css          |
| `text-[10px]` | `--text-label`       | `text-(--text-label)`  |
| `text-[11px]` | `--text-status`      | `text-(--text-status)` |
| `text-[13px]` | `--text-body`        | `text-(--text-body)`   |
| `text-[15px]` | 无精确 token，需审计 | 查 tokens.css          |

## 非字号 arbitrary

| 实例            | 文件                                                | 说明                     |
| --------------- | --------------------------------------------------- | ------------------------ |
| `h-[2px]`       | FileTreeNodeRow, FileTreeRenameRow, ProjectSwitcher | 分隔线 → `h-0.5`         |
| `-top-[3px]`    | OutlineNodeItem                                     | 微调偏移                 |
| `min-w-[180px]` | EditorContextMenu                                   | 已豁免（eslint-disable） |
| `w-[35%]`       | DashboardHero                                       | 百分比宽度               |

## 不做什么

- 不改 `text-[var(--*)]` — token 引用，合法
- 不改 `duration-[var(--*)]` — token 引用，合法
- 不改测试/stories 文件

## 完成验证

```bash
grep -rn 'text-\[[0-9]' apps/desktop/renderer/src/features/outline/ \
  apps/desktop/renderer/src/features/rightpanel/ \
  apps/desktop/renderer/src/features/projects/ \
  apps/desktop/renderer/src/features/editor/ \
  apps/desktop/renderer/src/features/files/ \
  apps/desktop/renderer/src/features/dashboard/ \
  apps/desktop/renderer/src/features/memory/ \
  apps/desktop/renderer/src/features/kg/ --include='*.tsx' \
  | grep -v test | grep -v stories | grep -v __tests__ | wc -l   # → 0
pnpm typecheck                                                     # → 0 errors
```
