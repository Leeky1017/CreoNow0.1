更新时间：2026-03-01 16:02

## 1. Implementation
- [x] 1.1 `layoutStore` 收敛左侧停靠类型到 `files/outline`，新增 `dialogType` 与 `spotlightOpen`
- [x] 1.2 `IconBar` 行为迁移：search 走 Spotlight，memory/characters/knowledgeGraph/versionHistory 走 Dialog
- [x] 1.3 `AppShell` 接入 `LeftPanelDialogShell` 与 Spotlight 容器渲染
- [x] 1.4 `Sidebar` 移除 search/memory/characters/knowledgeGraph/versionHistory 分支，仅保留 files/outline
- [x] 1.5 `openSurface` 与 Storybook 状态映射同步到 docked/dialog/spotlight 三模型

## 2. Testing
- [x] 2.1 新增 `IconBar.dialog-migration.test.tsx`，覆盖 Sidebar 收敛 / Dialog 打开 / Spotlight 打开与关闭
- [x] 2.2 回归更新 `layoutStore.test.ts`、`Sidebar.test.tsx`，确保类型与渲染语义与新模型一致
- [x] 2.3 `pnpm -C apps/desktop test:run components/layout/IconBar.dialog-migration` 通过
- [x] 2.4 `pnpm -C apps/desktop typecheck` 通过
- [x] 2.5 `pnpm -C apps/desktop test:run` 全量通过（192 files / 1559 tests）

## 3. Documentation
- [x] 3.1 更新 `openspec/changes/fe-leftpanel-dialog-migration/tasks.md` 勾选与依赖同步状态
- [x] 3.2 新建并补齐 `openspec/_ops/task_runs/ISSUE-807.md`（命令证据 + Main Session Audit 段）
