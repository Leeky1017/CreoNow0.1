# Search & Retrieval Specification Delta

更新时间：2026-02-22 19:37

## Change: issue-617-embedding-rag-offload

### Requirement: Embedding 推理必须卸载并以队列化方式保障 autosave 不阻塞 [ADDED]

系统**必须**确保 autosave 触发的 embedding 计算不会阻塞编辑器主线程：

- 推理必须在 ComputeProcess 执行，主进程不得持有同步推理会话。
- autosave → EmbeddingQueue 必须 debounce + 去重，避免“每次保存都推理”。

#### Scenario: BE-EMR-S1 EmbeddingQueue debounce 并按 documentId 去重 [ADDED]

- **假设** 用户快速连续编辑导致 autosave 在短时间内多次触发
- **当** EmbeddingQueue 接收多次 enqueue（同一 `documentId`）
- **则** 队列对该文档的任务去重并应用 debounce
- **并且** 最终仅执行最新版本的 embedding 计算（或等价一致语义）

#### Scenario: BE-EMR-S2 Embedding encode 通过 ComputeProcess 执行 [ADDED]

- **假设** 系统需要对文本进行 embedding encode
- **当** 触发 encode 执行
- **则** encode 在 ComputeProcess 内执行并返回向量结果
- **并且** 主进程不执行同步推理（避免阻塞 IPC 与 UI）

### Requirement: RAG 检索与语义缓存必须有界并支持稳定降级 [ADDED]

系统**必须**确保 RAG retrieve 的重量计算不阻塞主线程，并对缓存提供容量上限与过期策略。

#### Scenario: BE-EMR-S3 RAG retrieve 通过 ComputeProcess 执行并返回稳定 TopK [ADDED]

- **假设** 用户触发 RAG 检索请求
- **当** 系统执行 retrieve + rerank
- **则** 重量计算在 ComputeProcess 执行并返回稳定的 TopK 结果
- **并且** 支持 timeout/取消以避免长时间占用资源

#### Scenario: BE-EMR-S4 语义块缓存具备 maxSize 淘汰与 TTL 过期 [ADDED]

- **假设** 系统对语义块向量/文本召回结果进行缓存
- **当** 缓存超过 `maxSize` 或条目超过 TTL
- **则** 缓存按 LRU（或等价策略）淘汰旧条目并清理过期条目
- **并且** 缓存不会无界增长
