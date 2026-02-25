# 提案：issue-617-backend-test-gates

更新时间：2026-02-25 22:00

## 背景

后端重构的风险不在“能不能跑”，而在“是否可验证、是否可回归、是否能在性能/稳定性上持续不退化”。Notion 测试策略提出四层测试体系（Contract / Performance / Stress / Integration），用于覆盖 UtilityProcess、ScopedLifecycle、KG/Embedding/RAG、AI 流式写入等重构方向。本 change 将把该测试体系落为可执行的门禁与最小基线资产，作为 backend lane 的持续质量保障。

## 变更内容

- 定义后端四层测试门禁的最小基线（每层至少一个可跑的 suite + 明确范围与阈值）。
- 为关键抽象补齐 Contract Tests：BackgroundTaskRunner、ProjectLifecycle、IPC Abort/timeout、Scheduler 槽位回收等。
- 为关键热路径补齐最小 Performance/Stress/Integration 测试资产（以“可检测回退”为目标）。
- 将后端测试门禁与变更执行顺序绑定：任何高风险重构在进入 Green 前必须具备对应的 Red 失败证据与可回归测试。

## 受影响模块

- ipc — contract/integration tests 覆盖超时/校验/envelope/abort 的硬边界
- knowledge-graph — performance/stress 基线（大图 subgraph/path/validate）
- search-and-retrieval — performance 基线（FTS+embedding+rag）
- skill-system / ai-service — stress/integration 基线（取消竞态、流式写入、并发上限）

## 不做什么

- 不在本 change 内交付任何业务重构（仅测试门禁与资产）。
- 不引入真实网络请求/真实 LLM（严格隔离，必须 mock）。
- 不把测试变成“覆盖率工程”，只做对重构最关键的可验证门禁。

## 依赖关系

- 上游依赖：无（可与所有实现并行推进）
- 下游依赖：backend lane 的所有变更（作为持续门禁与回归基线）

## 依赖同步检查（Dependency Sync Check）

- 核对输入：
  - `openspec/specs/ipc/spec.md`
  - `openspec/specs/knowledge-graph/spec.md`
  - `openspec/specs/search-and-retrieval/spec.md`
  - `openspec/specs/skill-system/spec.md`
  - `openspec/specs/ai-service/spec.md`
  - `/tmp/notion_cn_backend_vault/CN-Backend/CN 后端开发/测试策略（后端）.md`
  - `/tmp/notion_cn_backend_vault/CN-Backend/CN 后端开发/Agent 问题发现汇总（CN 后端审计）.md`
- 核对项：
  - 四层测试体系不与现有测试框架/工程约束冲突（Vitest、严格隔离、无真实外部依赖）。
  - 每个高风险抽象至少有一个可跑的 contract test，覆盖错误路径与取消语义。
  - 性能/压力测试明确“何时运行、阈值是什么、失败如何解释”，避免不可复现。
- 结论：`NO_DRIFT`

## 来源映射

| 来源                                   | 提炼结论                                                              | 落地位置                 |
| -------------------------------------- | --------------------------------------------------------------------- | ------------------------ |
| `测试策略（后端）.md`                  | 四层测试体系（Contract/Performance/Stress/Integration）与关键抽象清单 | `tasks.md`、后续测试代码 |
| `Agent 问题发现汇总（CN 后端审计）.md` | 21 项问题为测试用例的来源，尤其是 P0/P1 的回归保护                    | `tasks.md`               |

## 审阅状态

- Owner 审阅：`PENDING`
