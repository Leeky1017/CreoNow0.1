# Issue #828 — Open Folder UI Entry Points

## Proposal

在三个 UI 入口（Dashboard 空状态、CommandPalette、Onboarding）中新增 "Open Folder" 按钮/命令，全部调用 `dialog:folder:open` IPC。

## Tasks

1. [x] TDD Red — 创建 3 个测试文件（Dashboard、CommandPalette、Onboarding），共 6 个测试用例（S1-S3 各含 render + click 测试），确认红灯
2. [x] TDD Green — DashboardPage.tsx 新增 Open Folder 按钮；AppShell.tsx commandEntries 新增 open-folder 命令；OnboardingPage.tsx 新增 Open Folder 按钮
3. [x] Typecheck — `pnpm -C apps/desktop typecheck` 通过
4. [x] Full Regression — 202 files / 1588 tests passed
5. [x] RUN_LOG 落盘 — `openspec/_ops/task_runs/ISSUE-828.md`

## Evidence

- Red: 三个测试文件 → 均因元素不存在而失败
- Green: 202 passed (202), 1588 tests passed
- Typecheck: clean
- Change tasks.md: 已更新 checkboxes
