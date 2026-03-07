# Tasks: testing-governance-foundation


## 1. 已交付的前置阶段（已合并）

- [x] 1.1 建立 `docs/references/testing/` 作为测试规范主源（`#1017 / PR #1018`）。
- [x] 1.2 统一 `AGENTS.md`、`CLAUDE.md`、`docs/delivery-skill.md`、`openspec/project.md` 等入口回指 testing SSOT（`#1017 / PR #1018`）。
- [x] 1.3 对齐 CI / preflight / gate 的真实执行策略（`#1019 / PR #1020`）。

## 2. 当前阶段：迁移样板与活跃 change 登记

- [x] 2.1 迁入前端交互测试样板：`apps/desktop/renderer/src/features/onboarding/OnboardingPage.test.tsx`。
- [x] 2.2 迁入 IPC / contract 测试样板：`apps/desktop/tests/unit/document-ipc-contract.test.ts`。
- [x] 2.3 迁入服务层脚本式测试迁移样板：`apps/desktop/tests/unit/projectService.ai-assist.test.ts`。
- [x] 2.4 建立 `openspec/changes/testing-governance-foundation/` 的 proposal / tasks 骨架。
- [x] 2.5 在 `openspec/changes/EXECUTION_ORDER.md` 中登记该活跃治理 change。

## 3. 后续阶段（留待后续 PR）

- [ ] 3.1 将迁移前后对比补入 `docs/references/testing/08-migration-and-review-playbook.md` 的正式样板章节。
- [ ] 3.2 评估 reviewer wrapper / 审计脚本化方案。
- [ ] 3.3 评估 spec-scenario-test 映射门禁的试点落点。
