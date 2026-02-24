更新时间：2026-02-24 12:55

## 1. Specification

- [ ] 1.1 审阅并确认需求边界（Embedding/RAG 的执行位置迁移、队列化、写入批量化、缓存有界）
- [ ] 1.2 审阅并确认错误路径与边界路径（向量不可用降级、超时/取消、批处理失败回滚）
- [ ] 1.3 审阅并确认验收阈值与不可变契约（autosave 不阻塞；降级可见；cache 有上限）
- [x] 1.4 若存在上游依赖，先完成依赖同步检查（Dependency Sync Check）并记录“无漂移/已更新”；结论：`PASS（NO_DRIFT）`

### 依赖同步检查（Dependency Sync Check）

- 检查时间：2026-02-24 11:29
- 核对输入：
  - `openspec/changes/archive/issue-617-utilityprocess-foundation/proposal.md`
  - `openspec/changes/archive/issue-617-utilityprocess-foundation/tasks.md`
  - `openspec/changes/archive/issue-617-utilityprocess-foundation/specs/ipc/spec.md`
  - `openspec/changes/archive/issue-617-scoped-lifecycle-and-abort/proposal.md`
  - `openspec/changes/archive/issue-617-scoped-lifecycle-and-abort/tasks.md`
  - `openspec/changes/archive/issue-617-scoped-lifecycle-and-abort/specs/ipc/spec.md`
  - `openspec/changes/archive/issue-617-scoped-lifecycle-and-abort/specs/skill-system/spec.md`
  - `openspec/changes/archive/issue-617-scoped-lifecycle-and-abort/specs/context-engine/spec.md`
  - `openspec/specs/ipc/spec.md`
  - `openspec/specs/skill-system/spec.md`
  - `openspec/specs/context-engine/spec.md`
  - `apps/desktop/main/src/services/utilityprocess/**`
- 核对结论：`PASS（NO_DRIFT）`
- 后续动作：当前 change 文档无需修订，按 BE-EMR-S1~S4 继续进入 TDD Red 阶段。

## 2. TDD Mapping（先测前提）

- [ ] 2.1 将 delta spec 的每个 Scenario 映射为至少一个测试用例
- [ ] 2.2 为每个测试标注对应 Scenario ID，建立可追踪关系
- [ ] 2.3 设定门禁：未出现 Red（失败测试）不得进入实现

### Scenario -> 测试映射

| Scenario ID | 测试文件                                                                                           | 计划用例名 / 断言块                                                 |
| ----------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| BE-EMR-S1   | `apps/desktop/main/src/services/embedding/__tests__/embedding-queue.debounce.contract.test.ts`     | `enqueue should debounce and dedupe by documentId`                  |
| BE-EMR-S2   | `apps/desktop/main/src/services/embedding/__tests__/embedding-offload.compute.contract.test.ts`    | `encode should run via compute runner (no main-thread session.run)` |
| BE-EMR-S3   | `apps/desktop/main/src/services/rag/__tests__/rag-offload.compute.contract.test.ts` + `apps/desktop/main/src/ipc/__tests__/rag-retrieve-runtime.contract.test.ts` | `retrieve should run via compute runner and return stable TopK` + `rag:context:retrieve should execute inside compute runner` |
| BE-EMR-S4   | `apps/desktop/main/src/services/embedding/__tests__/semantic-chunk-index.lru-ttl.contract.test.ts` | `cache should evict by maxSize and expire by ttl`                   |

## 3. Red（先写失败测试）

- [ ] 3.1 编写 Happy Path 的失败测试并确认先失败
- [ ] 3.2 编写 Edge Case 的失败测试并确认先失败
- [ ] 3.3 编写 Error Path 的失败测试并确认先失败
- [x] 3.4 BE-EMR-S3（production IPC runtime）新增失败测试并确认 Red（`rag-retrieve-runtime.contract.test.ts` 断言 `semantic search` 未在 compute runner 内执行）

## 4. Green（最小实现通过）

- [ ] 4.1 仅实现让 Red 转绿的最小代码
- [ ] 4.2 逐条使失败测试通过，不引入无关功能
- [x] 4.3 BE-EMR-S3 将 `rag:context:retrieve` 路径接入 compute runner，并在 `index.ts` 传入 `utilityProcessFoundation.compute`

## 5. Refactor（保持绿灯）

- [ ] 5.1 去重与重构，保持测试全绿
- [ ] 5.2 不改变已通过的外部行为契约

## 6. Evidence

- [ ] 6.1 记录 RUN_LOG（含 Red 失败证据、Green 通过证据与关键命令输出）
- [x] 6.2 记录 Dependency Sync Check 的输入、核对结论与后续动作（无漂移/已更新）
- [ ] 6.3 记录 Main Session Audit（Audit-Owner/Reviewed-HEAD-SHA=签字提交 HEAD^/三项 PASS/Blocking-Issues=0/Decision=ACCEPT），并确认签字提交仅变更当前任务 RUN_LOG
- [x] 6.4 BE-EMR-S3 Red/Green 命令证据已追加至 `openspec/_ops/task_runs/ISSUE-638.md`（仅覆盖本轮 production IPC offload 事实）
