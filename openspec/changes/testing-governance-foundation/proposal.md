# Proposal: testing-governance-foundation


## Why

当前仓库已经通过两条已合并 PR 完成了 testing governance 的前两段收口：

- `#1017 / PR #1018`：建立 `docs/references/testing/` 作为测试规范主源（SSOT），并统一入口文档回指；
- `#1019 / PR #1020`：对齐 CI / preflight / gate 的真实执行策略。

但 testing governance 仍缺两样关键东西：

1. 缺少“历史弱测试如何迁”的可复用样板；
2. 缺少一个在 `openspec/changes/` 中正式登记的活跃治理 change，来承接后续迁移与第二阶段路线图。

## What Changes

本 change 在当前阶段只完成以下收口：

1. 迁入三类弱测试迁移样板：
   - 前端交互测试样板（`OnboardingPage.test.tsx`）
   - IPC / contract 测试样板（`document-ipc-contract.test.ts`）
   - 服务层脚本式测试迁移样板（`projectService.ai-assist.test.ts`）
2. 在 `openspec/changes/testing-governance-foundation/` 下建立 proposal / tasks 骨架。
3. 在 `openspec/changes/EXECUTION_ORDER.md` 中登记该活跃治理 change，并明确其与现有 Phase 0 active changes 并行存在。
4. 将后续 reviewer 脚本化、spec-scenario-test 映射、更多历史弱测试迁移保留为本 change 的后续阶段，而不在本 PR 中一口吃掉。

## Out of Scope

以下事项不属于本 change 当前阶段的交付范围：

- `docs/references/testing/` 主源目录与入口文档（已由 `#1017 / PR #1018` 收口）。
- `.github/workflows/ci.yml`、`scripts/agent_pr_preflight.py` 与 PR 模板保持一致，避免治理口径漂移。
- 其他历史弱测试迁移样板，不在本次列举的三类样板之内。
- 立即上锁第二阶段门禁（如 backend coverage 阈值、spec-scenario-test 映射 gate、reviewer wrapper）。

## Acceptance

- 三个测试样板已迁入 `main`，并以当前测试框架运行通过。
- `openspec/changes/testing-governance-foundation/` 已建立，文义与已合并的 #1017 / #1019 不冲突。
- `openspec/changes/EXECUTION_ORDER.md` 已登记该活跃治理 change，且不覆盖现有 Phase 0 active changes。
- 后续阶段的治理动作已被明确记录，但未被伪装成“当前已完成”。
