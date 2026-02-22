# ISSUE-622

## Links

- Issue: #622
- Issue URL: https://github.com/Leeky1017/CreoNow/issues/622
- Branch: `task/622-ci-gate-windows-export-hardening`
- PR: (pending)

## Scope

- Rulebook task: `rulebook/tasks/issue-622-ci-gate-windows-export-hardening/**`
- RUN_LOG: `openspec/_ops/task_runs/ISSUE-622.md`
- CI workflow: `.github/workflows/ci.yml`
- Suspected code path: `apps/desktop/main/src/services/documents/atomicWrite.ts`

## Goal

- 修复 required check `ci` 可被 SKIPPED 绕过的门禁漏洞（当 `needs` 失败时 gate job 被跳过，仍满足 required check）。
- 修复 Windows E2E `export-markdown` 失败（等待 `export-success` 超时）导致的质量回归，使 `windows-e2e` 可稳定通过。

## Status

- CURRENT: 已创建 issue、worktree、Rulebook task；待实现修复 + 开 PR + auto-merge 收口。

## Next Actions

- [ ] 完成修复：`ci` gate job 非可跳过 + Windows export regression
- [ ] 运行 `python3 scripts/agent_pr_preflight.py` 通过
- [ ] 创建 PR（body 含 `Closes #622`），开启 auto-merge
- [ ] 等待 required checks：`ci` / `openspec-log-guard` / `merge-serial` 全绿并合并到 `main`
- [ ] 同步控制面 `main` 并清理 worktree

## Plan

- [x] 建立 issue-622 Rulebook task（active）并通过 validate
- [x] 建立 ISSUE-622 RUN_LOG
- [ ] 修复实现（CI gate + Windows export）并补齐回归测试
- [ ] PR + required checks + auto-merge 合并收口
- [ ] 控制面同步 + worktree 清理

## Runs

### 2026-02-22 Issue + Worktree Scaffold

- Command:
  - `gh issue create --title "Fix CI gate skip loophole + Windows export atomicWrite hardening" ...`
  - `git worktree add -b task/622-ci-gate-windows-export-hardening .worktrees/issue-622-ci-gate-windows-export-hardening origin/main`
  - `rulebook task create issue-622-ci-gate-windows-export-hardening`
  - `rulebook task validate issue-622-ci-gate-windows-export-hardening`
- Key output:
  - issue: https://github.com/Leeky1017/CreoNow/issues/622
  - worktree: `.worktrees/issue-622-ci-gate-windows-export-hardening [task/622-ci-gate-windows-export-hardening]`
  - rulebook validate: `Task issue-622-ci-gate-windows-export-hardening is valid`

