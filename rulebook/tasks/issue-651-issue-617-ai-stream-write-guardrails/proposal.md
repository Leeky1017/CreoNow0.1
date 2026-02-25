# Proposal: issue-651-issue-617-ai-stream-write-guardrails

更新时间：2026-02-25 15:40

## Why

Issue #651 需要先完成治理基建，确保后续 `ai-stream-write-guardrails` 的实现严格遵循 OpenSpec/Rulebook/GitHub 门禁。当前会话目标是创建可验证的 Rulebook task 与 RUN_LOG，并完成对依赖变更 `issue-617-ai-stream-write-guardrails` 的同步核对，不触碰 `apps/**` 运行时代码。

## What Changes

- 创建并维护 `rulebook/tasks/issue-651-issue-617-ai-stream-write-guardrails/`（`proposal.md`、`tasks.md`、`.metadata.json`）。
- 创建并维护 `openspec/_ops/task_runs/ISSUE-651.md`，记录 issue/worktree/rulebook 的命令证据与 blocker。
- 执行并记录 `openspec/changes/issue-617-ai-stream-write-guardrails` 依赖同步检查结论。
- 为受治理 markdown 文件补齐时间戳，满足 doc timestamp gate。

## Impact
- Affected specs:
  - `openspec/specs/ai-service/spec.md`（只读）
  - `openspec/changes/issue-617-ai-stream-write-guardrails/**`（只读）
- Affected code:
  - `rulebook/tasks/issue-651-issue-617-ai-stream-write-guardrails/proposal.md`
  - `rulebook/tasks/issue-651-issue-617-ai-stream-write-guardrails/tasks.md`
  - `rulebook/tasks/issue-651-issue-617-ai-stream-write-guardrails/.metadata.json`
  - `openspec/_ops/task_runs/ISSUE-651.md`
- Breaking change: YES/NO
- User benefit: 先完成治理收口基线，后续进入 TDD 实现时具备可追溯、可审计、可门禁验证的交付轨迹。
