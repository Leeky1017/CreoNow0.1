# 04 — RAG、Embedding 与语义检索

> 对应问题：P1-6（Embedding 无真实模型）、P1-8（RAG 仅 FTS 降级）、P1-5（KG 识别仅 mock 正则）

---

## 一、CN 当前状态

### 1.1 Embedding 服务只有 Hash 伪向量

**文件**：`apps/desktop/main/src/services/embedding/embeddingService.ts`

```typescript
export function createEmbeddingService(deps: { logger: Logger }): EmbeddingService {
  return {
    encode: (args) => {
      const modelId = normalizeModelId(args.model);
      if (HASH_MODEL_ALIASES.has(modelId)) {
        // hash-based pseudo-embedding：用文本 hash 生成固定维度向量
        const vectors = args.texts.map((t) =>
          embedTextToUnitVector({ text: t, dimension: HASH_MODEL_DIMENSION }),
        );
        return { ok: true, data: { vectors, dimension: HASH_MODEL_DIMENSION } };
      }
      // 默认模型直接返回 MODEL_NOT_READY
      return ipcError("MODEL_NOT_READY", "Embedding model not ready");
    },
  };
}
```

`cn-byte-estimator` 是一个基于文本 hash 的伪 embedding——将文本的字节 hash 映射为固定维度向量。这种向量的**余弦相似度没有语义含义**，只是确定性的数字映射。

### 1.2 RAG 服务是 FTS 降级

**文件**：`apps/desktop/main/src/services/rag/ragService.ts`

注释明确声明：

```typescript
/**
 * Create a minimal RAG retrieval service (FTS fallback).
 *
 * Why: CNWB-REQ-100 requires a best-effort retrieve path that can be visualized
 * in the retrieved layer even when semantic/vector store is not ready on Windows.
 */
```

RAG 流程：
1. `planFtsQueries` 将用户查询拆分为最多 4 个 FTS5 查询（原始、短语、头词、OR）
2. 对每个查询执行 FTS5 全文搜索
3. 选择命中最多的查询
4. 如果 rerank 启用，用 hash embedding 计算余弦相似度重排序
5. 按 token 预算截断

reranking 用的是 hash embedding，所以重排序结果也没有语义含义。

### 1.3 Semantic Chunk Index 依赖假 Embedding

**文件**：`apps/desktop/main/src/services/embedding/semanticChunkIndexService.ts`

语义块索引有完整的增量更新逻辑（段落拆分、hash 对比、变更检测），但底层 embedding 调用的是同一个 hash 伪 embedding 服务。

### 1.4 KG 实体识别是硬编码正则

**文件**：`apps/desktop/main/src/services/kg/kgRecognitionRuntime.ts`

```typescript
function createMockRecognizer(): Recognizer {
  return {
    recognize: async ({ contentText }) => {
      // 正则 1：「」书名号包裹的 2-32 字符
      const quotedPattern = /「([^」]{2,32})」/gu;
      // 正则 2：「林」开头的中文名
      const characterPattern = /林[\u4e00-\u9fa5]{1,3}/gu;
      // 正则 3：以 仓库|城|镇|村|山|馆|楼 结尾的地名
      const locationPattern = /[\u4e00-\u9fa5]{1,16}(仓库|城|镇|村|山|馆|楼)/gu;
      // ...
    },
  };
}
```

只能识别"林姓角色"和少数地名后缀。对任何其他命名模式的实体（张三、李四、纽约、霍格沃茨）识别率为零。

### 1.5 Hybrid Ranking Service 架构完整但数据空

**文件**：`apps/desktop/main/src/services/search/hybridRankingService.ts`

混合排序服务已实现 FTS + Semantic 的融合策略、超时降级、跨项目安全检查。但 semantic 分支依赖的 embedding 是假的，所以 hybrid 模式实际等于 FTS-only。

---

## 二、业界如何解决

### 2.1 Cursor — Codebase Index

**来源**：[GitHub Discussion #175305](https://github.com/orgs/community/discussions/175305)

Cursor 的核心竞争力之一是全项目索引：

- **全项目 embedding**：对整个代码库运行 embedding，建立向量索引
- **增量更新**：文件保存时增量更新对应 chunk 的 embedding
- **语义搜索**：`@codebase` 命令触发跨项目的语义搜索
- **上下文注入**：搜索结果自动注入到 AI 请求的 context 中

**技术栈**（推测）：
- 本地向量数据库（可能是 SQLite + 自定义向量扩展，或 FAISS）
- 远程 embedding API（OpenAI text-embedding-3-small 或自有模型）
- Chunk 策略：按函数/类/段落拆分，而非固定长度

### 2.2 Notion AI — 文档级 RAG

**来源**：[Notion Scaling Data Infrastructure for AI](https://www.zenml.io/llmops-database/scaling-data-infrastructure-for-ai-features-and-rag)

Notion 的 AI 需要处理用户的整个知识库：

- **数据规模**：3 年内数据量增长 10 倍
- **数据湖架构**：Apache Hudi + Kafka + Debezium CDC + Spark
- **向量存储**：文档内容经 embedding 后存入向量数据库
- **查询流程**：用户问题 → embedding → 向量搜索 → 相关文档块 → 注入 prompt → LLM 生成
- **增量索引**：通过 CDC（Change Data Capture）实时捕获文档变更，增量更新向量索引

### 2.3 Manus — Knowledge Module + Datasource API

**来源**：[Manus Technical Analysis](https://gist.github.com/renschni/4fbc70b31bad8dd57f3370239dccd58f)

Manus 的检索策略：

- **Knowledge Module**：预置的领域知识库，根据任务类型注入相关参考资料
- **Datasource Module**：预审批的数据 API（天气、金融等），通过 Python 代码调用而非网页抓取
- **优先级**：权威数据源 > 网页搜索 > 模型参数记忆
- **RAG 集成**：检索结果作为只读的 Knowledge Event 注入 Event Stream

### 2.4 开源 RAG 最佳实践

**Manus 复现蓝图中的 RAG 实现**：

```python
from langchain.vectorstores import FAISS
from langchain.embeddings import HuggingFaceEmbeddings

embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

def retrieve_knowledge(query, documents):
    vectorstore = FAISS.from_documents(documents, embeddings)
    docs = vectorstore.similarity_search(query, k=3)
    return [doc.page_content for doc in docs]
```

关键组件：
- **Embedding 模型**：`all-MiniLM-L6-v2`（多语言小模型，384 维）或 `bge-small-zh`（中文优化）
- **向量存储**：FAISS（Meta 开源，纯 CPU 运行）、Chroma、Qdrant
- **Chunk 策略**：RecursiveCharacterTextSplitter（段落→句子→字符递进拆分）

### 2.5 Sudowrite — 写作场景的 RAG

Sudowrite 处理长篇小说检索的策略：

- **Story Bible**：自动提取角色、地点、事件作为结构化知识
- **章节摘要**：每章自动生成 200-300 字摘要
- **百万 Token 窗口**：Flash 模式直接将大量原文放入上下文，减少对 RAG 的依赖
- **选择性检索**：写到第 10 章时，只检索与当前情节相关的前 N 章片段，而非全部

### 2.6 NovelCrafter Codex — 结构化知识 > 向量检索

**来源**：[NovelCrafter Codex Entry 文档](https://www.novelcrafter.com/help/docs/codex/anatomy-codex-entry)

NovelCrafter 的核心洞察：**写作场景的上下文需求主要是结构化知识（角色/地点/世界观），不是非结构化文本的语义搜索**。

Codex 用精确的实体名/别名匹配替代模糊的向量语义搜索：

| 向量 RAG | Codex 引用检测 |
|----------|--------------|
| 语义模糊匹配 | 精确的实体名/别名匹配 |
| 返回相似文本片段 | 返回结构化档案（性格、背景、关系） |
| 需要真实 embedding 模型 | 只需字符串匹配 + KG 查询 |
| 延迟高（embedding + 搜索） | 延迟极低（内存中的文本扫描） |
| 不可控——用户不知道注入了什么 | 完全可控——4 级 AI 上下文 |

**对 CN 的启示**：CN 应**先实现 Codex 式引用检测**，再实现向量 RAG。前者覆盖写作场景 80% 的上下文需求，后者作为补充。

---

## 三、CN 应该怎么做

### 3.1 接入真实 Embedding 模型

**方案选择**：

| 方案 | 延迟 | 质量 | 成本 | 离线可用 |
|------|------|------|------|---------|
| **A: 本地 ONNX Runtime + bge-small-zh** | 10-50ms | 良好 | 免费 | ✅ |
| B: 本地 ONNX Runtime + all-MiniLM-L6-v2 | 10-50ms | 中等 | 免费 | ✅ |
| C: 远程 OpenAI text-embedding-3-small | 100-300ms | 优秀 | $0.02/1M tokens | ❌ |
| D: 混合（本地优先+远程回退） | 10-300ms | 优秀 | 低 | ✅（降级模式） |

**推荐方案 D（混合模式）**：

- **默认**：本地 ONNX Runtime + `bge-small-zh-v1.5`（中文优化，512 维，~50MB 模型文件）
- **高质量模式**：远程 API（当用户配置了 API Key 且网络可用时）
- **降级**：如果本地模型加载失败，降级为当前的 hash 伪 embedding（保持可用性）

**实现要点**：

```typescript
// embeddingService.ts 改造
export function createEmbeddingService(deps: {
  logger: Logger;
  onnxRuntime?: OnnxEmbeddingRuntime;  // 本地 ONNX
  remoteProvider?: RemoteEmbeddingProvider;  // 远程 API
}): EmbeddingService {
  return {
    encode: (args) => {
      // 1. 尝试本地 ONNX
      if (deps.onnxRuntime?.isReady()) {
        return deps.onnxRuntime.encode(args);
      }
      // 2. 尝试远程 API
      if (deps.remoteProvider?.isConfigured()) {
        return deps.remoteProvider.encode(args);
      }
      // 3. 降级为 hash
      return hashFallbackEncode(args);
    },
  };
}
```

### 3.2 改造 RAG 为真正的语义检索

替换 `ragService.ts` 的 FTS-only 路径为 hybrid：

```
用户查询
  ├─→ FTS5 全文搜索（关键词精确匹配）
  │     └─ 返回 top 20 候选
  ├─→ 语义搜索（embedding 相似度）
  │     └─ 返回 top 20 候选
  └─→ Hybrid Ranking
        ├─ RRF（Reciprocal Rank Fusion）合并两路结果
        ├─ 按 token 预算截断
        └─ 返回 top K 最终结果
```

RRF 融合公式：`score = Σ 1/(k + rank_i)`，k 通常取 60。

### 3.3 改造 KG 实体识别

分阶段升级：

**阶段 1（快速修复）**：扩展正则 + 分词

```typescript
// 不再只匹配"林"姓，用中文分词库（如 jieba-wasm）
// 提取专有名词候选
import { cut } from 'jieba-wasm';

function recognizeEntities(text: string): Candidate[] {
  const words = cut(text, true); // 全模式分词
  return words
    .filter(w => w.length >= 2 && isProperNoun(w))
    .map(w => ({ name: w, type: inferType(w) }));
}
```

**阶段 2（LLM NER）**：用 LLM 做命名实体识别

```typescript
const NER_PROMPT = `从以下文本中提取所有人名、地名、组织名。
输出 JSON 数组，格式：[{"name":"张三","type":"character"},{"name":"长安","type":"location"}]
只输出 JSON，不要其他内容。

文本：{{text}}`;
```

**阶段 3（自动学习）**：用户在 KG 中确认/修改实体后，积累为训练数据，微调识别模型。

### 3.4 增量索引策略

参考 Notion 的 CDC 方式：

```
文档保存
  → 触发 autosave
    → 提取变更段落（diff）
      → 对变更段落重新 embedding
        → 更新 SemanticChunkIndex
          → 更新 FTS5 索引
```

`semanticChunkIndexService.ts` 的 `upsertDocument` 已经实现了增量更新逻辑（hash 对比检测变更段落），只需接入真实 embedding 即可生效。

---

## 四、实施优先级

**写作场景优先级调整**（§2.6）：Codex 引用检测优先于向量 RAG，因为写作上下文 80% 是结构化知识。

| 步骤 | 内容 | 工作量 | 前置依赖 | 优先级 |
|------|------|--------|---------|--------|
| 1 | **KG schema 增加 `aiContextLevel` + `aliases` 字段** | 1d | 无 | **P0** |
| 2 | **Codex 引用检测**：从 KG 动态加载实体名/别名，替换 mock 正则 | 1.5d | 步骤 1 | **P0** |
| 3 | **Context Engine `retrieved` fetcher 接入 Codex 检测** | 1d | 步骤 2 | **P0** |
| 4 | 章节摘要自动生成（synopsis 技能） | 2d | AI 调用链就绪 | **P1** |
| 5 | 集成 ONNX Runtime + bge-small-zh 本地 embedding | 3d | 无 | P2 |
| 6 | embeddingService 支持本地/远程/hash 三级降级 | 1d | 步骤 5 | P2 |
| 7 | RAG 服务支持 semantic + FTS hybrid ranking（RRF） | 2d | 步骤 5 | P3 |
| 8 | KG 识别扩展分词方案（jieba-wasm） | 2d | 无 | P3 |
| 9 | LLM-based NER 识别 | 2d | AI 调用链就绪 | P3 |

**总计约 15.5 天**。步骤 1-3（Codex）仅 3.5d 即可覆盖写作场景核心上下文需求。步骤 5-9（向量 RAG）可延后到 Codex 运行稳定后再做。
