# Proposal: issue-637-kg-query-engine-refactor

更新时间：2026-02-24 11:31

## Why

`openspec/changes/issue-617-kg-query-engine-refactor` 仍处于活跃状态，且 #617 已关闭，不满足当前任务准入门禁。需要以 OPEN issue #637 重新承接该 change，先完成治理基线，再按 TDD 交付 BE-KGQ-S1..S4 并合并到 `main`。

## What Changes

- 创建 issue #637 的 Rulebook + RUN_LOG 治理基线，补齐准入与依赖同步证据。
- 基于 change delta 执行查询层重构交付（S1/S2/S3/S4）：子图/路径查询限额、validate 迭代化、实体匹配多模式优化。
- 完成双审计（spec 合规 + 代码质量）与 auto-merge 门禁收口。

## Impact

- Affected specs:
  - `openspec/changes/issue-617-kg-query-engine-refactor/specs/knowledge-graph/spec.md`
  - `openspec/changes/issue-617-kg-query-engine-refactor/tasks.md`
- Affected code:
  - `apps/desktop/main/src/services/kg/**`
  - `apps/desktop/main/src/services/kg/__tests__/**`
- Breaking change: NO
- User benefit: 在不改变对外语义的前提下，降低 KG 查询阻塞和退化风险，提升大图/多实体场景稳定性。
