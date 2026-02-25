# Active Changes Execution Order

更新时间：2026-02-25 22:00

适用范围：`openspec/changes/` 下所有非 `archive/`、非 `_template/` 的活跃 change。

## 执行策略

- 当前活跃 change 数量为 **0**。
- 执行模式：**Backend lane 全部归档，无活跃 change**。
- 规则：
  - ISSUE-606 Workbench lane：Phase 1、Phase 2、Phase 3、Phase 4 已归档，Workbench lane 已完成收口。
  - ISSUE-617 Backend lane：`issue-617-utilityprocess-foundation`、`issue-617-scoped-lifecycle-and-abort`、`issue-617-kg-query-engine-refactor`、`issue-617-embedding-rag-offload`、`issue-617-skill-runtime-hardening`、`issue-617-ai-stream-write-guardrails`、`issue-617-backend-test-gates` 已全部归档；Backend lane 已完成收口。
  - 任一 change 开始 Red 前，必须完成该 change 的依赖同步检查（Dependency Sync Check）。

## 执行顺序

### ISSUE-617 Backend Lane

（全部归档，无活跃 change）

## 依赖说明

- `issue-606-phase-1-stop-bleeding`：已归档至 `openspec/changes/archive/issue-606-phase-1-stop-bleeding`，作为后续阶段基线。
- `issue-606-phase-2-shell-decomposition`：已归档至 `openspec/changes/archive/issue-606-phase-2-shell-decomposition`，提供壳层边界与 IPC 收敛基线。
- `issue-606-phase-3-quality-uplift`：已归档至 `openspec/changes/archive/issue-606-phase-3-quality-uplift`，提供 ScrollArea/motion/typography/a11y 提质基线。
- `issue-606-phase-4-polish-and-delivery`：已归档至 `openspec/changes/archive/issue-606-phase-4-polish-and-delivery`，作为 Workbench lane 最终交付与治理收口基线。
- `issue-617-utilityprocess-foundation`：已归档至 `openspec/changes/archive/issue-617-utilityprocess-foundation`，作为 backend lane 的基础设施基线（Compute/Data）。
- `issue-617-scoped-lifecycle-and-abort`：已归档至 `openspec/changes/archive/issue-617-scoped-lifecycle-and-abort`，作为 backend lane 的资源回收与取消语义前置基线。
- `issue-617-kg-query-engine-refactor`：已归档至 `openspec/changes/archive/issue-617-kg-query-engine-refactor`，作为 KG 查询层与 ComputeProcess 迁移基线。
- `issue-617-embedding-rag-offload`：已归档至 `openspec/changes/archive/issue-617-embedding-rag-offload`，作为 Embedding/RAG offload 与有界缓存基线。
- `issue-617-skill-runtime-hardening`：已归档至 `openspec/changes/archive/issue-617-skill-runtime-hardening`，作为 Skill runtime 异步 I/O 与调度回收基线。
- `issue-617-ai-stream-write-guardrails`：已归档至 `openspec/changes/archive/issue-617-ai-stream-write-guardrails`，归档前依赖 Abort/生命周期语义；写入落地到 DataProcess 时依赖 UtilityProcess。
- `issue-617-backend-test-gates`：已归档至 `openspec/changes/archive/issue-617-backend-test-gates`，作为持续门禁与回归基线。

## 波次并行建议

- 文档波次（已完成）：Phase 1~4 并行重组。
- 实施波次（后续）：
  - Workbench lane：Wave D Phase 4 已完成并归档
  - Backend lane：
    - Wave 1（已完成）：backend test gates 基线已归档
    - Wave 2（已完成）：utilityprocess foundation + scoped lifecycle/abort
    - Wave 3（已完成）：kg query engine refactor + embedding/rag offload + skill runtime hardening（均已归档）
    - Wave 4（已完成）：ai stream write guardrails 已归档

## 进度快照

- ISSUE-604 当前状态：已归档至 `openspec/changes/archive/issue-604-windows-frameless-titlebar`，并从活跃执行顺序移除。
- ISSUE-606 当前状态：Phase 1、Phase 2、Phase 3、Phase 4 已完成并归档（Phase 4 路径：`openspec/changes/archive/issue-606-phase-4-polish-and-delivery`）。
- ISSUE-635 当前状态：交付 PR `#639` 已自动合并到 `main`，Rulebook task 已归档至 `rulebook/tasks/archive/2026-02-25-issue-635-issue-606-phase-4-polish-and-delivery`。
- ISSUE-637 当前状态：交付 PR `#640` 已完成，change 已归档至 `openspec/changes/archive/issue-617-kg-query-engine-refactor`。
- ISSUE-638 当前状态：交付 PR `#642` 已于 `2026-02-24T14:44:07Z` 合并到 `main`，Issue `#638` 已于 `2026-02-24T14:44:08Z` 关闭；change 已归档至 `openspec/changes/archive/issue-617-embedding-rag-offload`。
- ISSUE-641 当前状态：交付 PR `#643` 已于 `2026-02-24T14:01:12Z` 合并到 `main`，Issue `#641` 已于 `2026-02-24T14:01:13Z` 关闭；Rulebook task 已归档至 `rulebook/tasks/archive/2026-02-25-issue-641-issue-606-phase-4-polish-and-delivery`。
- ISSUE-644 当前状态：交付 PR `#645` 已于 `2026-02-24T15:19:12Z` 合并到 `main`，Issue `#644` 已于 `2026-02-24T15:19:14Z` 关闭；change 已归档至 `openspec/changes/archive/issue-617-skill-runtime-hardening`。
- ISSUE-613 当前状态：PR `#614` 已合并，Issue 已关闭，Rulebook task 已归档。
- ISSUE-616 当前状态：Phase 2 closeout PR `#625` 已合并，执行顺序以本文件为准。
- ISSUE-608 当前状态：已修复 ISSUE-606 文档中的治理收口漂移、i18n 门禁语义冲突与 Scenario 映射缺口。
- ISSUE-617 当前状态：`issue-617-utilityprocess-foundation`、`issue-617-scoped-lifecycle-and-abort`、`issue-617-kg-query-engine-refactor`、`issue-617-embedding-rag-offload`、`issue-617-skill-runtime-hardening`、`issue-617-ai-stream-write-guardrails` 与 `issue-617-backend-test-gates` 已全部完成并归档；Backend lane 已完成收口，`issue-617-global-hardening-baseline` 亦已归档（Issue `#620`）。

## 维护规则

- 任一活跃 change 的范围、依赖、状态发生变化时，必须同步更新本文件。
- 任一 Phase 依赖关系变化时，必须同步更新“执行顺序/依赖说明/进度快照”。
- 未同步本文件时，不得宣称多变更执行顺序已确认。
