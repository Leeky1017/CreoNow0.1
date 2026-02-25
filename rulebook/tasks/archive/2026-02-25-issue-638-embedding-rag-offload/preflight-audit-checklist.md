# issue-638 governance preflight audit checklist

更新时间：2026-02-25 09:13

## 1. 审计范围与输入基线

- Issue：`#638`
- Branch：`task/638-embedding-rag-offload`
- Target change：`openspec/changes/archive/issue-617-embedding-rag-offload/**`
- 审计目标：BE-EMR-S1~S4 场景证据完整性 + Rulebook/RUN_LOG/Preflight 门禁一致性

## 2. BE-EMR-S1~S4 场景核验（必须逐项过）

| Scenario  | 必查路径（精确到文件）                                                                                                                                                                                                                                                                                                                                                                                                                                                       | 通过标准（必须同时满足）                                                                                                                                                            |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BE-EMR-S1 | `openspec/changes/archive/issue-617-embedding-rag-offload/specs/search-and-retrieval/spec.md`；`apps/desktop/main/src/services/embedding/embeddingQueue.ts`；`apps/desktop/main/src/ipc/file.ts`；`apps/desktop/main/src/services/embedding/__tests__/embedding-queue.debounce.contract.test.ts`；`apps/desktop/main/src/ipc/__tests__/file-autosave-embedding-runtime.contract.test.ts`；`openspec/_ops/task_runs/ISSUE-638.md`                                             | 1) `enqueue` 对同 `documentId` 去重并 debounce；2) autosave 路径通过 queue 调度，不做同步 upsert；3) Red/Green 证据已在 RUN_LOG 记录。                                              |
| BE-EMR-S2 | `openspec/changes/archive/issue-617-embedding-rag-offload/specs/search-and-retrieval/spec.md`；`apps/desktop/main/src/services/embedding/embeddingComputeOffload.ts`；`apps/desktop/main/src/ipc/embedding.ts`；`apps/desktop/main/src/ipc/__tests__/embedding-generate-runtime.contract.test.ts`；`apps/desktop/main/src/services/embedding/__tests__/embedding-offload.compute.contract.test.ts`；`apps/desktop/main/src/index.ts`；`openspec/_ops/task_runs/ISSUE-638.md` | 1) `embedding:text:generate` 在注入 compute runner 时走 `computeRunner.run(...)`；2) signal/timeout 被透传；3) 未注入 compute runner 时保留原错误码语义；4) Red/Green 证据可追溯。  |
| BE-EMR-S3 | `openspec/changes/archive/issue-617-embedding-rag-offload/specs/search-and-retrieval/spec.md`；`apps/desktop/main/src/services/rag/ragComputeOffload.ts`；`apps/desktop/main/src/ipc/rag.ts`；`apps/desktop/main/src/ipc/__tests__/rag-retrieve-runtime.contract.test.ts`；`apps/desktop/main/src/services/rag/__tests__/rag-offload.compute.contract.test.ts`；`apps/desktop/main/src/index.ts`；`openspec/_ops/task_runs/ISSUE-638.md`                                     | 1) `rag:context:retrieve` 在注入 compute runner 时走 `computeRunner.run(...)`；2) aborted signal 在语义检索前短路并返回 `CANCELED`；3) TopK 结果排序稳定；4) Red/Green 证据可追溯。 |
| BE-EMR-S4 | `openspec/changes/archive/issue-617-embedding-rag-offload/specs/search-and-retrieval/spec.md`；`apps/desktop/main/src/services/embedding/semanticChunkIndexCache.ts`；`apps/desktop/main/src/services/embedding/__tests__/semantic-chunk-index.lru-ttl.contract.test.ts`；`openspec/_ops/task_runs/ISSUE-638.md`                                                                                                                                                             | 1) cache 具备 `maxSize` 有界淘汰（LRU 或等价）；2) TTL 到期自动失效；3) 访问刷新 recency；4) Red/Green 证据可追溯。                                                                 |

## 3. 治理门禁核验（Preflight 前必须全过）

| Gate                        | 必查路径（精确到文件）                                                                                                                                                                                                                                                                                  | 通过标准                                                                                                                                                           |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Rulebook 完整性             | `rulebook/tasks/archive/2026-02-25-issue-638-embedding-rag-offload/proposal.md`；`rulebook/tasks/archive/2026-02-25-issue-638-embedding-rag-offload/tasks.md`；`rulebook/tasks/archive/2026-02-25-issue-638-embedding-rag-offload/.metadata.json`                                                       | 1) proposal/tasks 非占位；2) 任务范围与 issue-617 变更一致；3) `rulebook task validate issue-638-embedding-rag-offload` 通过。                                     |
| OpenSpec change 一致性      | `openspec/changes/archive/issue-617-embedding-rag-offload/proposal.md`；`openspec/changes/archive/issue-617-embedding-rag-offload/specs/search-and-retrieval/spec.md`；`openspec/changes/archive/issue-617-embedding-rag-offload/tasks.md`                                                              | 1) `Specification -> TDD Mapping -> Red -> Green -> Refactor -> Evidence` 顺序完整；2) proposal/spec/tasks 对 offload 基线表述一致（仅声明 compute runner 契约）。 |
| RUN_LOG 完整性              | `openspec/_ops/task_runs/ISSUE-638.md`                                                                                                                                                                                                                                                                  | 1) 必含 `Links/Scope/Plan/Runs/Dependency Sync Check/Main Session Audit`；2) Runs 段有关键命令与输出；3) `PR` 字段在 preflight 前必须回填真实 URL。                |
| 时间戳门禁                  | `rulebook/tasks/archive/2026-02-25-issue-638-embedding-rag-offload/proposal.md`；`rulebook/tasks/archive/2026-02-25-issue-638-embedding-rag-offload/tasks.md`；`rulebook/tasks/archive/2026-02-25-issue-638-embedding-rag-offload/preflight-audit-checklist.md`；`openspec/_ops/task_runs/ISSUE-638.md` | 所有受管 markdown 顶部包含 `更新时间：YYYY-MM-DD HH:mm`，并通过 `scripts/check_doc_timestamps.py`。                                                                |
| Main Session Audit 签字前置 | `openspec/_ops/task_runs/ISSUE-638.md`                                                                                                                                                                                                                                                                  | `Reviewed-HEAD-SHA == 签字提交 HEAD^`、三项 PASS、`Blocking-Issues=0`、`Decision=ACCEPT`，且签字提交仅变更当前 RUN_LOG。                                           |

## 4. 历史阻塞快照（2026-02-24 21:00）

- `openspec/_ops/task_runs/ISSUE-638.md` 的 `PR` 字段已回填真实链接：`https://github.com/Leeky1017/CreoNow/pull/642`。
- 当时阻塞：`Main Session Audit` 尚未签字，尚未满足最终合并门禁。

## 5. 收口真值（2026-02-25）

- PR `#642` 已合并到 `main`，Issue `#638` 已关闭。
- `Main Session Audit` 已完成签字，`Blocking-Issues=0`，`Decision=ACCEPT`。
