# ISSUE-616

- Issue: #616
- Issue URL: https://github.com/Leeky1017/CreoNow/issues/616
- Branch: `task/616-issue-606-phase-2-shell-decomposition`
- PR:
- Scope:
  - `openspec/changes/issue-606-phase-2-shell-decomposition/**`
  - `openspec/changes/archive/issue-606-phase-1-stop-bleeding/**`
  - `rulebook/tasks/issue-616-issue-606-phase-2-shell-decomposition/**`
  - `openspec/_ops/task_runs/ISSUE-616.md`
  - `apps/desktop/renderer/src/components/layout/AppShell.tsx`
  - `apps/desktop/renderer/src/components/layout/**`
  - `apps/desktop/renderer/src/services/**`
  - `apps/desktop/tests/lint/**`

## Plan

- [ ] 创建/确认 OPEN Issue（#616）
- [ ] 同步 `origin/main` 并确认 worktree 基于最新主分支
- [ ] 阅读 `openspec/changes/issue-606-phase-2-shell-decomposition/{proposal.md,tasks.md}`
- [ ] 阅读 `openspec/specs/workbench/spec.md`、`openspec/specs/ipc/spec.md`（必要时补 delta spec）
- [ ] 完成 Dependency Sync Check 并记录 `NO_DRIFT/UPDATED`
- [ ] 先完成 TDD Mapping（Scenario -> 测试用例映射）
- [ ] Red：先写失败测试并记录失败输出
- [ ] Green：最小实现使测试通过
- [ ] Refactor：保持绿灯下去重与整理边界
- [ ] Fresh Verification（本地验证与 required checks 对齐）
- [ ] PR 开启 auto-merge，等待 `ci` / `openspec-log-guard` / `merge-serial` 全绿
- [ ] 合并后同步控制面 `main` 并清理 worktree；归档 Rulebook task

## Runs

### 2026-02-22 Admission + Isolation

- Command:
- Exit code:
- Key output:

### 2026-02-22 Spec + Dependency Sync Check

- Command:
- Exit code:
- Key output:

### 2026-02-22 TDD Mapping

- Command:
- Exit code:
- Key output:

### 2026-02-22 Red

- Command:
- Exit code:
- Key output:

### 2026-02-22 Green

- Command:
- Exit code:
- Key output:

### 2026-02-22 Refactor + Fresh Verification

- Command:
- Exit code:
- Key output:

### 2026-02-22 PR + Gates

- Command:
- Exit code:
- Key output:

## Dependency Sync Check

- Inputs reviewed:
  - `openspec/changes/archive/issue-606-phase-1-stop-bleeding/**`
  - `openspec/specs/workbench/spec.md`
  - `openspec/specs/ipc/spec.md`
  - `openspec/changes/issue-606-phase-2-shell-decomposition/proposal.md`
- Result: `NO_DRIFT`
- Notes:
  - Phase 1 已归档；进入 Red 前如发现上游依赖变更或假设不成立，应更新本段结论与后续动作。

## Main Session Audit

- Audit-Owner:
- Reviewed-HEAD-SHA:
- Spec-Compliance:
- Code-Quality:
- Fresh-Verification:
- Blocking-Issues:
- Decision:
