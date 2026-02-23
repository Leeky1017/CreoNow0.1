更新时间：2026-02-22 19:16

## 1. Admission & Scope

- [x] 1.1 确认 Issue `#617` 为 `OPEN` 状态
- [x] 1.2 确认隔离 worktree/分支：`task/617-cn-backend-notion-changes`
- [x] 1.3 建立 Rulebook task 与 RUN_LOG 初稿（本交付）

## 2. Notion Export Evidence

- [x] 2.1 `notion_db_to_obsidian.py doctor`（已执行）
- [x] 2.2 `sync --job "id:5c4da3e1-1bc7-46ca-868b-b50d2daa4fb9::CN-Backend" --tree --limit 200`（scanned=17 updated=17 failed=0）
- [x] 2.3 在 `openspec/_ops/task_runs/ISSUE-617.md` 落盘导出结果与变更清单（17 files）

## 3. Validation & Delivery

- [x] 3.1 `rulebook task validate issue-617-cn-backend-notion-changes`（valid；warning: no `specs/*/spec.md`）
- [ ] 3.2 创建 PR（body 含 `Closes #617`），并回填 RUN_LOG 的真实 PR URL
- [ ] 3.3 开启 auto-merge，等待 required checks（`ci`/`openspec-log-guard`/`merge-serial`）全绿并确认 merge 到 `main`
- [ ] 3.4 控制面 `main` 同步、worktree 清理、Rulebook 归档
