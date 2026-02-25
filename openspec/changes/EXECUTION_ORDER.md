# Active Changes Execution Order

更新时间：2026-02-25 08:49

适用范围：`openspec/changes/` 下所有非 `archive/`、非 `_template/` 的活跃 change。

## 执行策略

- 当前活跃 change 数量为 **5**。
- 执行模式：**多 Lane 混合模式（Lane 内实现落地串行、Lane 间并行推进）**。
- 规则：
  - ISSUE-606 Workbench lane：Phase 1、Phase 2、Phase 3 已归档，当前仅保留 Phase 4 活跃执行。
  - ISSUE-617 Backend lane：`issue-617-utilityprocess-foundation`、`issue-617-scoped-lifecycle-and-abort` 与 `issue-617-kg-query-engine-refactor` 已归档；其余 change 实现落地时继续遵循“依赖优先”。
  - 任一 change 开始 Red 前，必须完成该 change 的依赖同步检查（Dependency Sync Check）。

## 执行顺序

### ISSUE-606 Workbench Lane

1. `issue-606-phase-4-polish-and-delivery`

- Phase 4 精磨：视觉审计闭环、参考对标、交付物治理、CI/CD 与 i18n 渐进策略。
- 依赖：`issue-606-phase-1-stop-bleeding`、`issue-606-phase-2-shell-decomposition`、`issue-606-phase-3-quality-uplift`（均已归档）。

### ISSUE-617 Backend Lane

1. `issue-617-embedding-rag-offload`

- Embedding/RAG：ONNX 推理卸载到 ComputeProcess、写入走 DataProcess、队列化与有界缓存。
- 依赖：`issue-617-utilityprocess-foundation`、`issue-617-scoped-lifecycle-and-abort`。

2. `issue-617-skill-runtime-hardening`

- Skill 运行时：注册表懒加载与缓存、FS I/O 异步化、Scheduler 超时回收与槽位兜底。
- 依赖：`issue-617-utilityprocess-foundation`、`issue-617-scoped-lifecycle-and-abort`。

3. `issue-617-ai-stream-write-guardrails`

- AI 流式写入防护：chunk batching、事务合并、写入背压、abort+rollback。
- 依赖：`issue-617-scoped-lifecycle-and-abort`（若写入落到 DataProcess，则额外依赖 `issue-617-utilityprocess-foundation`）。

4. `issue-617-backend-test-gates`

- 后端门禁：Contract/Performance/Stress/Integration 四层测试基线与可回归门禁。
- 依赖：无（可与所有实现并行推进，且应持续更新以覆盖新引入的抽象/热路径）。

## 依赖说明

- `issue-606-phase-1-stop-bleeding`：已归档至 `openspec/changes/archive/issue-606-phase-1-stop-bleeding`，作为后续阶段基线。
- `issue-606-phase-2-shell-decomposition`：已归档至 `openspec/changes/archive/issue-606-phase-2-shell-decomposition`，提供壳层边界与 IPC 收敛基线。
- `issue-606-phase-3-quality-uplift`：已归档至 `openspec/changes/archive/issue-606-phase-3-quality-uplift`，提供 ScrollArea/motion/typography/a11y 提质基线。
- `issue-606-phase-4-polish-and-delivery`：依赖 Phase 1+2+3 的稳定实现基线与验证资产。
- `issue-617-utilityprocess-foundation`：已归档至 `openspec/changes/archive/issue-617-utilityprocess-foundation`，作为 backend lane 的基础设施基线（Compute/Data）。
- `issue-617-scoped-lifecycle-and-abort`：已归档至 `openspec/changes/archive/issue-617-scoped-lifecycle-and-abort`，作为 backend lane 的资源回收与取消语义前置基线。
- `issue-617-kg-query-engine-refactor`：已归档至 `openspec/changes/archive/issue-617-kg-query-engine-refactor`，作为 KG 查询层与 ComputeProcess 迁移基线。
- `issue-617-embedding-rag-offload`：依赖 UtilityProcess（Compute/Data）与 Abort/生命周期语义。
- `issue-617-skill-runtime-hardening`：依赖 UtilityProcess（Data）与 Abort/生命周期语义。
- `issue-617-ai-stream-write-guardrails`：依赖 Abort/生命周期语义；写入落地到 DataProcess 时依赖 UtilityProcess。
- `issue-617-backend-test-gates`：作为持续门禁与回归基线，应与 backend lane 变更并行维护。

## 波次并行建议

- 文档波次（已完成）：Phase 1~4 并行重组。
- 实施波次（后续）：
  - Workbench lane：Wave D Phase 4（唯一活跃阶段）
  - Backend lane：
    - Wave 1（可并行）：backend test gates 基线起草
    - Wave 2（已完成）：utilityprocess foundation + scoped lifecycle/abort
    - Wave 3（持续推进）：embedding/rag offload + skill runtime hardening（kg query engine refactor 已完成归档）
    - Wave 4（收口）：ai stream write guardrails（与 Wave 2/3 联动持续补齐）

## 进度快照

- ISSUE-604 当前状态：已归档至 `openspec/changes/archive/issue-604-windows-frameless-titlebar`，并从活跃执行顺序移除。
- ISSUE-606 当前状态：Phase 1、Phase 2、Phase 3 已完成并归档（Phase 3 路径：`openspec/changes/archive/issue-606-phase-3-quality-uplift`）；活跃阶段剩余 Phase 4。
- ISSUE-635 当前状态：交付 PR `#639` 已自动合并到 `main`，`issue-606-phase-4-polish-and-delivery` 进入后续治理收口阶段。
- ISSUE-637 当前状态：交付 PR `#640` 已完成，change 已归档至 `openspec/changes/archive/issue-617-kg-query-engine-refactor`。
- ISSUE-638 当前状态：交付 PR `#642` 已于 `2026-02-24T14:44:07Z` 合并到 `main`，Issue `#638` 已于 `2026-02-24T14:44:08Z` 关闭；`issue-617-embedding-rag-offload` 仍在活跃 change 列表，待归档收口。
- ISSUE-641 当前状态：Issue `#641` 已于 `2026-02-24T14:01:13Z` 关闭；`issue-606-phase-4-polish-and-delivery` 仍处于活跃 change 的治理收口阶段。
- ISSUE-644 当前状态：交付 PR `#645` 已于 `2026-02-24T15:19:12Z` 合并到 `main`，Issue `#644` 已于 `2026-02-24T15:19:14Z` 关闭；`issue-617-skill-runtime-hardening` 仍在活跃 change 列表，待归档收口。
- ISSUE-613 当前状态：PR `#614` 已合并，Issue 已关闭，Rulebook task 已归档。
- ISSUE-616 当前状态：Phase 2 closeout PR `#625` 已合并，执行顺序以本文件为准。
- ISSUE-608 当前状态：已修复 ISSUE-606 文档中的治理收口漂移、i18n 门禁语义冲突与 Scenario 映射缺口。
- ISSUE-617 当前状态：`issue-617-utilityprocess-foundation`、`issue-617-scoped-lifecycle-and-abort` 与 `issue-617-kg-query-engine-refactor` 已完成并归档；backend lane 其余 4 个 change 持续推进中，`issue-617-global-hardening-baseline` 亦已归档（Issue `#620`）。

## 维护规则

- 任一活跃 change 的范围、依赖、状态发生变化时，必须同步更新本文件。
- 任一 Phase 依赖关系变化时，必须同步更新“执行顺序/依赖说明/进度快照”。
- 未同步本文件时，不得宣称多变更执行顺序已确认。
