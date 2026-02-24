# issue-633-issue-617-change-closeout

更新时间：2026-02-24 10:06

## 1. Governance Scaffold（This PR）

- [x] 1.1 Create closeout issue (#633)
- [x] 1.2 Create isolated worktree + branch `task/633-issue-617-change-closeout`
- [x] 1.3 Create Rulebook task + validate (`issue-633-issue-617-change-closeout`)
- [x] 1.4 Create RUN_LOG `openspec/_ops/task_runs/ISSUE-633.md`
- [x] 1.5 Doc timestamp gate for governed markdown (`rulebook/tasks/**`)
- [x] 1.6 Push branch `task/633-issue-617-change-closeout`

## 2. Closeout Change（issue-617）

- [ ] 2.1 Apply delta specs into main specs (`openspec/specs/**`)
- [ ] 2.2 Tick change checklist + add evidence links (`openspec/changes/issue-617-scoped-lifecycle-and-abort/tasks.md`)
- [ ] 2.3 Archive change to `openspec/changes/archive/issue-617-scoped-lifecycle-and-abort/`
- [ ] 2.4 Sync `openspec/changes/EXECUTION_ORDER.md` (remove archived entry + 更新时间)

## 3. Delivery

- [ ] 3.1 Update RUN_LOG with command outputs
- [ ] 3.2 Create PR (body includes `Closes #633`) + enable auto-merge
- [ ] 3.3 Ensure required checks green: `ci`, `openspec-log-guard`, `merge-serial`
- [ ] 3.4 Main-session audit signing commit (RUN_LOG only; `Reviewed-HEAD-SHA == HEAD^`)
- [ ] 3.5 Merge to `main` + cleanup worktree
