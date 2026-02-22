# Proposal: issue-620-global-hardening-baseline

更新时间：2026-02-22 21:12

## Why

Issue-617 的 `issue-617-global-hardening-baseline` 已进入执行阶段，但当前缺少 issue-620 对应的治理脚手架（Rulebook active task、RUN_LOG、进度回填与 PR 门禁收口）。若不先补齐治理载体，后续 Red/Green 证据将无法稳定落盘，也无法满足 preflight 对 Rulebook/RUN_LOG/主会话审计的硬门禁。

## What Changes

- 新建并维护 active Rulebook task：`rulebook/tasks/issue-620-global-hardening-baseline/**`。
- 新建并维护 RUN_LOG：`openspec/_ops/task_runs/ISSUE-620.md`，记录 Admission、依赖同步检查、验证输出与 PR 门禁状态。
- 按 TDD 固定顺序维护 `openspec/changes/issue-617-global-hardening-baseline/tasks.md` 的勾选进度（Spec -> Mapping -> Red -> Green -> Refactor -> Evidence）。
- 在 `task/620-global-hardening-baseline` 分支推进 PR 创建与 auto-merge 门禁跟踪（`ci`/`openspec-log-guard`/`merge-serial`）。

## Impact

- Affected specs:
  - `openspec/changes/issue-617-global-hardening-baseline/tasks.md`
  - `openspec/changes/EXECUTION_ORDER.md`
- Affected governance/docs:
  - `rulebook/tasks/issue-620-global-hardening-baseline/**`
  - `openspec/_ops/task_runs/ISSUE-620.md`
- Affected code: none (governance/docs only)
- Breaking change: NO
- User benefit: issue-617 global hardening baseline 具备可审计、可追溯、可自动门禁校验的交付路径，降低后续返工与合规阻塞风险。
