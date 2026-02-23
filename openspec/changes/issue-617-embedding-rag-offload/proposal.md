# 提案：issue-617-embedding-rag-offload

更新时间：2026-02-22 19:37

## 背景

Embedding/RAG 路径当前在主线程同步执行（ONNX 推理、FTS 查询、rerank），会在 autosave 与检索场景触发可感知卡顿甚至假死。并且语义块索引等缓存存在无界增长风险。需要将推理与重量检索卸载到 ComputeProcess，将向量写入与批量写入合并到 DataProcess，并引入队列化/去重/容量上限。

## 变更内容

- ONNX embedding encode 迁移到 ComputeProcess；主进程零推理（仅调度）。
- autosave → EmbeddingQueue：debounce + 去重 + 批处理，避免每次保存触发同步推理。
- RAG retrieve/rerank 在 ComputeProcess 内完成，主线程仅返回结果。
- 向量写入走 DataProcess（批量 upsert），并为语义块索引引入 LRU/TTL（bounded cache）。

## 受影响模块

- search-and-retrieval — embedding/semantic search/rag retrieve 的执行位置与性能阈值
- context-engine — Retrieved 层召回的延迟与容量，需要与 token 预算策略一致
- ipc — 长任务的 timeout/取消语义需与后台执行绑定（AbortController）

## 不做什么

- 不修改前端检索 UI（仅后端执行链路与契约）。
- 不在本 change 内重写 FTS schema（保持 SQLite FTS5 方案不变）。
- 不引入新的向量数据库（仍基于 SQLite 扩展，按可用性降级）。

## 依赖关系

- 上游依赖：
  - `issue-617-utilityprocess-foundation`
  - `issue-617-scoped-lifecycle-and-abort`
- 下游依赖：
  - AI 续写/检索体验的端到端性能目标与稳定性

## 依赖同步检查（Dependency Sync Check）

- 核对输入：
  - `openspec/specs/search-and-retrieval/spec.md`
  - `openspec/specs/context-engine/spec.md`
  - `openspec/specs/ipc/spec.md`
  - `/tmp/notion_cn_backend_vault/CN-Backend/CN 后端开发/Embedding & RAG 优化.md`
  - `/tmp/notion_cn_backend_vault/CN-Backend/CN 后端开发/数据层设计（SQLite & DAO）.md`
  - `/tmp/notion_cn_backend_vault/CN-Backend/CN 后端开发/Agent 问题发现汇总（CN 后端审计）.md`
- 核对项：
  - 主 spec 的“索引更新不阻塞编辑器操作”要求在 autosave 路径得到硬保障（队列化/异步化）。
  - 语义搜索不可用时必须按 spec 自动降级到 FTS，并有用户可见提示（行为不回退）。
  - 缓存必须有容量上限与清理策略，项目切换时可卸载。
- 结论：`PENDING`

## 来源映射

| 来源                                   | 提炼结论                                                                   | 落地位置                                         |
| -------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------ |
| `Embedding & RAG 优化.md`              | 推理在 Compute、写入在 Data、主进程零推理；EmbeddingQueue 与 bounded cache | `specs/search-and-retrieval/spec.md`、`tasks.md` |
| `数据层设计（SQLite & DAO）.md`        | SQLite WAL + vec0（可选）是当前持久化基线，写入收口需可测试                | `tasks.md`、后续实现                             |
| `Agent 问题发现汇总（CN 后端审计）.md` | autosave 同步 ONNX、RAG rerank 同步路径、语义块索引无界增长是明确问题      | `tasks.md`、后续测试与实现                       |

## 审阅状态

- Owner 审阅：`PENDING`
