# Tasks: issue-604-windows-frameless-titlebar

更新时间：2026-02-22 13:16

## 1. Implementation

- [x] 1.1 创建 OPEN issue、建立 `task/604-windows-frameless-titlebar` 隔离 worktree，并创建/校验 Rulebook task
- [x] 1.2 Windows 主进程窗口改为 `frame: false`，并隐藏原生菜单栏
- [x] 1.3 增加窗口控制 IPC handler（`app:window:getstate/minimize/togglemaximized/close`）
- [x] 1.4 扩展 IPC 契约并生成 `ipc-generated.ts`
- [x] 1.5 渲染层新增全局 `WindowTitleBar`，实现拖拽区与三按钮控制

## 2. Testing

- [x] 2.1 Red→Green：主进程窗口 IPC 单测（Windows 成功路径、非 Windows `UNSUPPORTED`、无窗口 `NOT_FOUND`）
- [x] 2.2 Red→Green：渲染层标题栏单测（标题、按钮 IPC 调用、禁用时隐藏）
- [x] 2.3 回归验证：`pnpm typecheck`、目标 Vitest、IPC 单测通过
- [x] 2.4 Preflight + required checks（`ci` / `openspec-log-guard` / `merge-serial`）全绿

## 3. Governance

- [x] 3.1 维护 OpenSpec change（proposal/spec/tasks）并记录 Dependency Sync Check
- [x] 3.2 RUN_LOG 记录关键命令、失败修复、PR/merge 真实链接
- [x] 3.3 开启 auto-merge，等待合并后同步控制面 `main`
- [x] 3.4 归档 Rulebook task（可同 PR 自归档）
- [x] 3.5 Issue 关闭后走非 `task/*` closeout 分支完成治理归档（PR body 使用 `Skip-Reason:`）

## 4. Review

- [x] 4.1 Main Session Audit 完成签字（`Reviewed-HEAD-SHA = 签字提交 HEAD^`）
- [x] 4.2 签字提交仅变更 `openspec/_ops/task_runs/ISSUE-604.md`
