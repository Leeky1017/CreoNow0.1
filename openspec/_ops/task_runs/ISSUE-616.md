# ISSUE-616

- Issue: #616
- Issue URL: https://github.com/Leeky1017/CreoNow/issues/616
- Branch: `task/616-issue-606-phase-2-shell-decomposition`
- PR: BLOCKED (sandbox cannot reach GitHub API; lead/main-session to backfill real PR URL)
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

- [ ] 创建/确认 OPEN Issue（#616）并落盘 `gh issue view` 成功输出（当前沙箱网络阻断）
- [x] 同步 `origin/main` 并确认 worktree 基于 `task/616-issue-606-phase-2-shell-decomposition`
- [x] 阅读 `openspec/changes/issue-606-phase-2-shell-decomposition/{proposal.md,tasks.md}`
- [x] 阅读 `openspec/specs/workbench/spec.md`、`openspec/specs/ipc/spec.md`
- [x] 完成 Dependency Sync Check 并记录 `NO_DRIFT`
- [x] 完成 TDD Mapping（Scenario -> 测试用例映射）
- [x] Red 证据：通过提交序列确认“先测后实现”（历史 Red 输出待主会话补齐可选）
- [x] Green：核心 shell/service/lint 用例运行通过
- [x] Refactor：验证拆分后 shell 组件职责与 service 收敛结果
- [ ] Fresh Verification（完整 preflight + required checks 对齐）通过
- [ ] PR 开启 auto-merge，等待 `ci` / `openspec-log-guard` / `merge-serial` 全绿
- [ ] 合并后同步控制面 `main` 并清理 worktree；归档 Rulebook task

## Runs

### 2026-02-23 Admission + Isolation Reality Check

- Command:
  - `git rev-parse --abbrev-ref HEAD`
  - `git rev-parse HEAD`
  - `git status --short`
  - `gh issue view 616 --json number,state,title,url,createdAt`
- Exit code:
  - `git rev-parse/status`: `0`
  - `gh issue view`: `1`
- Key output:
  - current branch: `task/616-issue-606-phase-2-shell-decomposition`
  - HEAD: `cd2ba4283804346b4b73a05ac16b7ab609fea650`
  - workspace: clean
  - `error connecting to api.github.com`
- Note:
  - Admission 的 Issue OPEN 状态无法在本沙箱联网验证，需主会话在可联网环境补录。

### 2026-02-23 Spec + Dependency Sync Check

- Command:
  - `sed -n '1,220p' openspec/project.md`
  - `sed -n '1,220p' openspec/specs/workbench/spec.md`
  - `sed -n '1,220p' openspec/specs/ipc/spec.md`
  - `sed -n '1,320p' openspec/changes/issue-606-phase-2-shell-decomposition/tasks.md`
  - `git log --oneline --reverse origin/main..HEAD`
- Exit code: `0`
- Key output:
  - Phase 2 change 仍聚焦 shell decomposition + viewport ownership + IPC service convergence。
  - 提交序列显示 `test` 提交先于 `feat/refactor` 提交，符合 TDD 时间序约束。

### 2026-02-23 TDD Mapping Reality Check

- Command:
  - `sed -n '1,320p' openspec/changes/issue-606-phase-2-shell-decomposition/tasks.md`
- Exit code: `0`
- Key output:
  - Scenario 映射覆盖 `WB-P2-S1..S6` 与 `IPC-P2-S1..S3`。
  - 映射测试路径存在于本分支改动集中（layout tests + services tests + lint gate）。

### 2026-02-23 Red Evidence (Commit-order Audit)

- Command:
  - `git log --oneline --reverse origin/main..HEAD`
- Exit code: `0`
- Key output:
  - `1fff1269 test: add viewport ownership gate (#616)`
  - `9a9db5df feat: converge renderer IPC through services (#616)`
  - `01423876 test: add shell decomposition boundary tests (#616)`
  - `d0c14ee9 refactor: decompose AppShell into shell layers (#616)`
  - `cf1d4b5c test: enforce viewport lint discovery contract (#616)`
- Note:
  - 当前 HEAD 为 Green 状态；本轮以提交顺序作为 Red 先行证据。若需失败日志原文，主会话可在历史提交点补跑取证。

### 2026-02-23 Green + Verification Snapshot

- Command:
  - `pnpm -C apps/desktop exec vitest run renderer/src/components/layout/__tests__/layout-shell-boundary.test.tsx renderer/src/components/layout/__tests__/navigation-controller.test.tsx renderer/src/components/layout/__tests__/panel-orchestrator.test.tsx renderer/src/components/layout/__tests__/viewport-allocation.test.tsx renderer/src/services/__tests__/ipc-boundary-lint.test.ts renderer/src/services/__tests__/project-service.test.ts renderer/src/services/__tests__/service-error-normalization.test.ts tests/lint/renderer-viewport-ownership.test.ts`
  - `pnpm exec node --import tsx scripts/test-discovery-consistency-gate.ts`
- Exit code:
  - `vitest`: `0`
  - `discovery-gate`: `0`
- Key output:
  - `Test Files 7 passed (7)`
  - `Tests 16 passed (16)`
  - `[discovery-gate] unit discovered=194 executed=194`
  - `[discovery-gate] integration discovered=88 executed=88`
  - `[discovery-gate] PASS`
- Note:
  - `tests/lint/renderer-viewport-ownership.test.ts` 未被本次 vitest 执行列表纳入；已通过 discovery gate 验证发现/执行一致性。

### 2026-02-23 Tooling/Preflight Blockers

- Command:
  - `rulebook task validate issue-616-issue-606-phase-2-shell-decomposition`
  - `pnpm test:discovery:consistency`
  - `scripts/agent_pr_preflight.sh`
- Exit code:
  - `rulebook task validate`: `127`
  - `pnpm test:discovery:consistency`: `1`
  - `agent_pr_preflight.sh`: `1`
- Key output:
  - `/bin/bash: line 1: rulebook: command not found`
  - `Error: listen EPERM: operation not permitted /tmp/tsx-1000/*.pipe`
  - `PRE-FLIGHT FAILED: [RUN_LOG] PR field must be a real URL in .../openspec/_ops/task_runs/ISSUE-616.md: BLOCKED (sandbox cannot reach GitHub API; lead/main-session to backfill real PR URL)`
- Note:
  - 沙箱内 `rulebook` 命令缺失，且 `tsx` 默认 IPC 管道被策略阻断；已用 `node --import tsx` 完成 discovery gate 替代验证。
  - preflight 阻断点已明确：需真实 PR URL + 主会话签字提交后再跑全量门禁。

### 2026-02-23 Governance Packet Sanity

- Command:
  - `python3 scripts/check_doc_timestamps.py --files rulebook/tasks/issue-616-issue-606-phase-2-shell-decomposition/tasks.md`
- Exit code: `0`
- Key output:
  - `OK: validated timestamps for 1 governed markdown file(s)`

### 2026-02-23 Extended Local Verification

- Command:
  - `pnpm -C apps/desktop exec vitest run renderer/src/components/layout/__tests__/layout-shell-boundary.test.tsx renderer/src/components/layout/__tests__/navigation-controller.test.tsx renderer/src/components/layout/__tests__/panel-orchestrator.test.tsx renderer/src/components/layout/__tests__/viewport-allocation.test.tsx renderer/src/services/__tests__/ipc-boundary-lint.test.ts renderer/src/services/__tests__/project-service.test.ts renderer/src/services/__tests__/service-error-normalization.test.ts tests/lint/renderer-viewport-ownership.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm exec node --import tsx scripts/contract-generate.ts && git diff --exit-code packages/shared/types/ipc-generated.ts`
  - `pnpm exec node --import tsx scripts/cross-module-contract-gate.ts`
- Exit code:
  - `vitest`: `0`
  - `typecheck`: `0`
  - `lint`: `0` (warnings only)
  - `contract-generate + diff`: `0`
  - `cross-module gate`: `0`
- Key output:
  - `Test Files 7 passed (7) / Tests 16 passed (16)`
  - `tsc --noEmit` pass
  - `eslint` completed with existing repo-wide warnings, no errors
  - `[CROSS_MODULE_GATE] PASS`
- Note:
  - 扩展验证命令在当前 worktree 均通过；preflight 仍受 PR URL 与主会话签字提交前置条件阻断。

### 2026-02-23 Push/PR Network Blocker

- Command:
  - `git push origin task/616-issue-606-phase-2-shell-decomposition`
- Exit code: `128`
- Key output:
  - `fatal: unable to access 'https://github.com/Leeky1017/CreoNow.git/': Could not resolve host: github.com`
- Note:
  - 当前沙箱 DNS/外网不可达，无法完成 PR 创建、auto-merge 与 control-plane main 收口。

## Dependency Sync Check

- Inputs reviewed:
  - `openspec/changes/archive/issue-606-phase-1-stop-bleeding/**`
  - `openspec/changes/issue-606-phase-2-shell-decomposition/{proposal.md,tasks.md}`
  - `openspec/specs/workbench/spec.md`
  - `openspec/specs/ipc/spec.md`
- Result: `NO_DRIFT`
- Notes:
  - Phase 2 目标仍与 change 描述一致（壳层拆分 + viewport ownership + renderer IPC service convergence）。
  - 未观察到与 Phase 1 archive 语义冲突的上游漂移项。

## Main Session Audit

- Draft-Status: PREPARED-BY-MATE-GOVERNANCE (awaiting main-session signing commit)
- Audit-Owner: main-session
- Reviewed-HEAD-SHA: cd2ba4283804346b4b73a05ac16b7ab609fea650
- Spec-Compliance: PASS
- Code-Quality: PASS
- Fresh-Verification: FAIL
- Blocking-Issues: 3
- Decision: REJECT
