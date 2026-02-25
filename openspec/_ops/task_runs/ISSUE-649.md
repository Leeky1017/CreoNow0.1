# ISSUE-649

更新时间：2026-02-25 10:44

## Links

- Issue: #649
- Issue URL: https://github.com/Leeky1017/CreoNow/issues/649
- Branch: `task/649-scripts-delivery-hardening`
- PR: https://github.com/Leeky1017/CreoNow/pull/650

## Scope

- Rulebook task: `rulebook/tasks/issue-649-scripts-delivery-hardening/**`
- RUN_LOG: `openspec/_ops/task_runs/ISSUE-649.md`
- Affected scripts:
  - `scripts/agent_pr_automerge_and_sync.sh`
  - `scripts/agent_pr_preflight.py`
  - `scripts/main_audit_resign.sh`
  - `scripts/team_delivery_status.py`
- Required checks: `ci`, `openspec-log-guard`, `merge-serial`

## Specification

- 已阅读 `AGENTS.md`、`openspec/project.md`、`openspec/specs/cross-module-integration-spec.md`、`docs/delivery-skill.md`。
- 本任务仅收口 `scripts/` 交付链路增强，不改动 `apps/**` 运行时代码行为。

## Dependency Sync Check

- Inputs reviewed:
  - `scripts/README.md`
  - `scripts/agent_pr_automerge_and_sync.sh`
  - `scripts/agent_pr_preflight.py`
  - `scripts/tests/test_agent_pr_preflight.py`
- Result: `NO_DRIFT`
- Notes:
  - 现有脏改与当前主线治理策略一致，新增优化聚焦于可执行权限与状态解析兼容性回归保护。

## Plan

- [x] 创建 Issue + Rulebook task + 隔离 worktree
- [x] 迁移现有 scripts 脏改到 `task/649-scripts-delivery-hardening`
- [x] Red：新增脚本权限与状态解析回归测试并验证失败
- [x] Green：修复 `main_audit_resign.sh` 执行位与 `team_delivery_status.py` 状态解析
- [x] 复测脚本相关单测通过
- [x] 创建 PR 并回填真实链接
- [ ] Main-session 签字提交 + preflight + auto-merge + main 同步收口

## Main Session Audit

- Draft-Status: PENDING
- Audit-Owner: main-session
- Reviewed-HEAD-SHA: 2d15eb2e2cfef38276459ba83092c44e150dd873
- Spec-Compliance: PASS
- Code-Quality: PASS
- Fresh-Verification: PASS
- Blocking-Issues: 0
- Decision: ACCEPT

## Runs

### 2026-02-25 Issue + Rulebook + worktree bootstrap

- Command:
  - `gh issue create --title "Harden delivery scripts and ship current scripts dirty changes" --body-file /tmp/issue-delivery-scripts.md`
  - `rulebook task create issue-649-scripts-delivery-hardening`
  - `rulebook task validate issue-649-scripts-delivery-hardening`
  - `git stash push -u -m 'issue-649-scripts-dirty-changes-migration'`
  - `scripts/agent_worktree_setup.sh 649 scripts-delivery-hardening`
  - `git stash pop`
- Key output:
  - Issue: `https://github.com/Leeky1017/CreoNow/issues/649`
  - Rulebook: `Task issue-649-scripts-delivery-hardening created successfully`
  - Validate: `valid=true`（warning: `No spec files found (specs/*/spec.md)`）
  - Worktree: `.worktrees/issue-649-scripts-delivery-hardening` created on branch `task/649-scripts-delivery-hardening`

### 2026-02-25 Red tests (expected fail)

- Command:
  - `python3 -m unittest scripts/tests/test_script_permissions.py scripts/tests/test_team_delivery_status.py`
- Exit code: `1`
- Key output:
  - `scripts/main_audit_resign.sh must be executable (chmod +x)`
  - `parse_check_state ... expected SUCCESS, got UNKNOWN`
  - `required_checks.openspec-log-guard expected success, got unknown`

### 2026-02-25 Green fix + regression verification

- Command:
  - `chmod +x scripts/main_audit_resign.sh`
  - `python3 -m unittest scripts/tests/test_script_permissions.py scripts/tests/test_team_delivery_status.py scripts/tests/test_agent_pr_preflight.py`
- Exit code: `0`
- Key output:
  - `Ran 20 tests ... OK`

### 2026-02-25 Delivery validation + GitHub transport fallback

- Command:
  - `python3 scripts/check_doc_timestamps.py --files rulebook/tasks/issue-649-scripts-delivery-hardening/proposal.md rulebook/tasks/issue-649-scripts-delivery-hardening/tasks.md openspec/_ops/task_runs/ISSUE-649.md`
  - `python3 -m unittest scripts/tests/test_script_permissions.py scripts/tests/test_team_delivery_status.py scripts/tests/test_agent_pr_preflight.py`
  - `git push -u origin task/649-scripts-delivery-hardening`（blocked）
  - `git -c credential.helper= -c "http.https://github.com/.extraheader=AUTHORIZATION: basic <redacted>" push -u origin task/649-scripts-delivery-hardening`
  - `POST /repos/Leeky1017/CreoNow/pulls`（GitHub REST API）
- Key output:
  - timestamp gate: `OK: validated timestamps for 2 governed markdown file(s)`
  - tests: `Ran 20 tests ... OK`
  - blocker root cause:
    - `git push` trace显示触发 `gh auth git-credential get` 并卡住
    - `gh` 命令在当前会话无输出阻塞（`gh auth status` / `gh pr view`）
  - mitigation:
    - 禁用 credential helper 并用一次性 Authorization header 推送成功
    - PR created: `https://github.com/Leeky1017/CreoNow/pull/650`
