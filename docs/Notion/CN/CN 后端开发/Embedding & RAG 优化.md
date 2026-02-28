# Embedding & RAG 优化

> Source: Notion local DB page `4962757d-bb99-400a-a72b-a48fb68d7318`

> 🧬

Embedding & RAG 全链路优化 — ONNX 推理卸载到 ComputeProcess、autosave 异步队列化、RAG retrieve 管道重建、语义块索引 LRU 缓存、向量写入走 DataProcess。

> ⚠️

核心原则：推理在 Compute，写入在 Data，主进程零推理。 当前 autosave 触发 ONNX 同步推理是主进程假死的头号元凶。

---

## 1. 问题全景

| 编号 | 问题 | 严重度 | 当前实现 | 影响 |
| --- | --- | --- | --- | --- |
| P0 #1 | 自动保存触发 ONNX 同步推理 | P0 | autosave → embeddingService.embed() 同步调用 ONNX session.run() | 主进程假死 200~800ms/次，用户可感知卡顿 |
| P1 #11 | RAG rerank 路径同步 FTS + 同步推理 | P1 | FTS 查询 + embedding 推理均在主进程同步执行 | RAG 查询延迟 1~3s，阻塞 UI 响应 |
| P1 #13 | 语义块索引内存无限膨胀 | P1 | semanticChunkIndex 只增不减的 Map | 长时间运行后内存持续增长，无上限 |

---

## 2. 架构总览

```
flowchart TB
    subgraph MainProcess["主进程（零推理）"]
        AS["autosave 触发"] --> EQ["EmbeddingQueue\n异步队列 + debounce"]
        UI["RAG 查询请求"] --> IPC1["IPC: rag:retrieve"]
    end

    subgraph CP["ComputeProcess（只读 + 推理）"]
        EQ -->|"IPC batch"| ONNX["ONNX Runtime\nsession.run()"]
        IPC1 --> FTS["FTS5 全文检索\n只读 SQLite"]
        FTS --> ONNX
        ONNX --> RERANK["Rerank\n语义排序"]
        RERANK --> RES["返回 Top-K 结果"]
    end

    subgraph DP["DataProcess（读写）"]
        ONNX -->|"向量结果"| UPSERT["sqlite-vec upsert\n向量写入"]
        UPSERT --> DB[("SQLite WAL\nembedding 表")]
    end

    subgraph Cache["缓存层"]
        SCI["SemanticChunkIndex\nBoundedMap LRU+TTL"]
        SCI -.->|"命中"| RERANK
        ONNX -.->|"miss → 计算后写入"| SCI
    end

    style MainProcess fill:#fff3e0,stroke:#FF9800
    style CP fill:#e3f2fd,stroke:#1976D2
    style DP fill:#e8f5e9,stroke:#4CAF50
```

---

## 3. ONNX 推理卸载到 ComputeProcess

### 3.1 当前问题

```
// ── 当前 embeddingService.ts ────────────────────────
class EmbeddingService {
  private session: ort.InferenceSession; // ❌ 在主进程中持有

  // autosave 直接调用，同步阻塞主进程
  embed(text: string): Float32Array {
    const input = this.tokenize(text);
    // ❌ session.run() 是 CPU 密集型，200~800ms
    const result = this.session.runSync(input);
    return result.embedding.data;
  }
}
```

### 3.2 迁移方案

```
// ── ComputeProcess 侧：embedding/onnxWorker.ts ─────

import * as ort from 'onnxruntime-node';

let session: ort.InferenceSession | null = null;

export async function initOnnx(modelPath: string): Promise<void> {
  // 配置：限制线程数，避免与 DataProcess 争抢 CPU
  const opts: ort.InferenceSession.SessionOptions = {
    executionProviders: ['cpu'],
    interOpNumThreads: 2,
    intraOpNumThreads: 2,
    graphOptimizationLevel: 'all',
  };
  session = await ort.InferenceSession.create(modelPath, opts);
}

export async function embedBatch(
  texts: string[],
  signal?: AbortSignal,
): Promise<Float32Array[]> {
  if (!session) throw new Error('ONNX session not initialized');

  const results: Float32Array[] = [];
  for (const text of texts) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

    const tokenized = tokenize(text);
    const feeds = {
      input_ids: new ort.Tensor('int64', tokenized.inputIds, [1, tokenized.length]),
      attention_mask: new ort.Tensor('int64', tokenized.attentionMask, [1, tokenized.length]),
    };
    const output = await session.run(feeds);
    results.push(new Float32Array(output.embedding.data as Float32Array));
  }
  return results;
}

export async function disposeOnnx(): Promise<void> {
  if (session) {
    await session.release();
    session = null;
  }
}
```

### 3.3 IPC 接口

```
// ── IPC contract ────────────────────────────────────

// 主进程 → ComputeProcess
'embedding:batch': {
  request: { texts: string[]; projectId: string };
  response: { vectors: Float32Array[] };
}

// ComputeProcess → DataProcess（向量写入）
'embedding:upsert': {
  request: {
    projectId: string;
    items: Array<{
      chunkId: string;
      documentId: string;
      vector: Float32Array;
      text: string;
    }>;
  };
  response: { upsertedCount: number };
}
```

---

## 4. Autosave → Embedding 异步队列

### 4.1 当前问题

```
autosave 触发 → 直接调用 embeddingService.embed() → 同步 ONNX → 主进程冻结

问题：
1. 每次 autosave 都触发推理（即使文本未改变）
2. 快速连续编辑导致多次推理排队
3. 推理在主进程，阻塞 UI
```

### 4.2 EmbeddingQueue 实现

```
// ── services/embedding/embeddingQueue.ts ────────────

interface EmbeddingJob {
  documentId: string;
  chunks: Array<{ chunkId: string; text: string }>;
  projectId: string;
}

export class EmbeddingQueue {
  private queue: Map<string, EmbeddingJob> = new Map(); // documentId → job（去重）
  private timer: ReturnType<typeof setTimeout> | null = null;
  private processing = false;

  constructor(
    private computeIpc: ComputeProcessIpc,
    private opts: {
      debounceMs?: number;  // 默认 2000ms
      batchSize?: number;   // 默认 16
      maxQueueSize?: number; // 默认 200
    } = {},
  ) {}

  /**
   * autosave 触发时调用。
   * 对同一文档的多次调用会被去重（只保留最新版本）。
   */
  enqueue(job: EmbeddingJob): void {
    const { debounceMs = 2000, maxQueueSize = 200 } = this.opts;

    // 去重：同一文档只保留最新
    this.queue.set(job.documentId, job);

    // 超过上限时丢弃最旧的
    if (this.queue.size > maxQueueSize) {
      const oldest = this.queue.keys().next().value;
      if (oldest) this.queue.delete(oldest);
    }

    // debounce：重置定时器
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.flush(), debounceMs);
  }

  /** 立即处理队列（用于 app quit 前） */
  async flushImmediate(signal?: AbortSignal): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    await this.flush(signal);
  }

  private async flush(signal?: AbortSignal): Promise<void> {
    if (this.processing || this.queue.size === 0) return;
    this.processing = true;

    const { batchSize = 16 } = this.opts;

    try {
      while (this.queue.size > 0) {
        if (signal?.aborted) break;

        // 取一批
        const batch: EmbeddingJob[] = [];
        for (const [docId, job] of this.queue) {
          batch.push(job);
          this.queue.delete(docId);
          if (batch.length >= batchSize) break;
        }

        // 收集所有 chunks
        const allChunks = batch.flatMap(j =>
          j.chunks.map(c => ({ ...c, documentId: j.documentId, projectId: j.projectId }))
        );
        const texts = allChunks.map(c => c.text);

        // ── 发送到 ComputeProcess 做推理 ──
        const { vectors } = await this.computeIpc.invoke('embedding:batch', {
          texts,
          projectId: batch[0].projectId,
        });

        // ── 发送到 DataProcess 做写入 ──
        const items = allChunks.map((c, i) => ({
          chunkId: c.chunkId,
          documentId: c.documentId,
          vector: vectors[i],
          text: c.text,
        }));

        await this.computeIpc.invoke('embedding:upsert', {
          projectId: batch[0].projectId,
          items,
        });
      }
    } finally {
      this.processing = false;
    }
  }

  dispose(): void {
    if (this.timer) clearTimeout(this.timer);
    this.queue.clear();
  }
}
```

### 4.3 集成到 autosave 流程

```
// ── 主进程 autosave handler ─────────────────────────

const embeddingQueue = new EmbeddingQueue(computeIpc, {
  debounceMs: 2000,
  batchSize: 16,
});

// 注册到生命周期
projectLifecycle.onProjectUnbind(() => embeddingQueue.dispose());
appLifecycle.onBeforeQuit(async (signal) => {
  await embeddingQueue.flushImmediate(signal); // quit 前刷完
});

// autosave handler（改造后）
async function onAutosave(document: Document): Promise<void> {
  // 1. 文本分块（轻量，主进程可做）
  const chunks = chunkDocument(document);

  // 2. diff 检测：只推理变更的块
  const changedChunks = chunks.filter(c => !chunkHashCache.has(c.hash));

  if (changedChunks.length === 0) return; // 无变更，跳过

  // 3. 入队（异步，不阻塞）
  embeddingQueue.enqueue({
    documentId: document.id,
    chunks: changedChunks,
    projectId: document.projectId,
  });

  // 4. 更新 hash 缓存
  for (const c of changedChunks) {
    chunkHashCache.set(c.hash, true);
  }
}
```

### 4.4 优化效果

| 方面 | 当前 | 重构后 |
| --- | --- | --- |
| autosave 阻塞 | 200~800ms/次（ONNX 同步） | 0ms（异步入队，立即返回） |
| 重复推理 | 每次 autosave 都推理 | hash diff，未变更块跳过 |
| 连续编辑 | 每次触发一次推理 | 2s debounce + 去重 |
| 推理位置 | 主进程 | ComputeProcess |
| 写入位置 | 主进程（同步 SQLite） | DataProcess（读写分离） |

---

## 5. RAG Retrieve 管道重建

### 5.1 当前问题

```
用户发起 RAG 查询 → 主进程同步执行：
  1. FTS5 全文检索（同步 SQLite）→ ~50ms
  2. embedding 推理（同步 ONNX）→ ~300ms
  3. 向量检索 sqlite-vec（同步）→ ~20ms
  4. rerank（同步计算）→ ~100ms
  总计：~470ms 主进程阻塞
```

### 5.2 重建后的管道

```
// ── services/rag/ragRetrieveService.ts（ComputeProcess 侧）──

interface RetrieveOptions {
  query: string;
  projectId: string;
  topK?: number;       // 默认 10
  ftsWeight?: number;  // FTS 分数权重，默认 0.3
  vecWeight?: number;  // 向量相似度权重，默认 0.7
}

interface RetrieveResult {
  chunks: Array<{
    chunkId: string;
    documentId: string;
    text: string;
    score: number;       // 混合分数
    ftsScore: number;
    vecSimilarity: number;
  }>;
  timing: {
    ftsMs: number;
    embedMs: number;
    vecMs: number;
    rerankMs: number;
    totalMs: number;
  };
}

export async function ragRetrieve(
  opts: RetrieveOptions,
  db: Database,           // ComputeProcess 只读连接
  signal?: AbortSignal,
): Promise<RetrieveResult> {
  const { query, projectId, topK = 10, ftsWeight = 0.3, vecWeight = 0.7 } = opts;
  const timing: Record<string, number> = {};
  const t0 = performance.now();

  // ── Step 1: FTS5 候选集（并行启动）──
  const ftsPromise = (async () => {
    const t = performance.now();
    const ftsResults = db.prepare(`
      SELECT chunk_id, document_id, text, rank
      FROM semantic_chunks_fts
      WHERE semantic_chunks_fts MATCH ?
        AND project_id = ?
      ORDER BY rank
      LIMIT ?
    `).all(ftsTokenize(query), projectId, topK * 3); // 3x 过采样
    timing.ftsMs = performance.now() - t;
    return ftsResults;
  })();

  // ── Step 2: Query Embedding（并行启动）──
  const embedPromise = (async () => {
    const t = performance.now();
    const [queryVector] = await embedBatch([query], signal);
    timing.embedMs = performance.now() - t;
    return queryVector;
  })();

  // 等待并行完成
  const [ftsResults, queryVector] = await Promise.all([ftsPromise, embedPromise]);

  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

  // ── Step 3: 向量检索（用 query embedding）──
  const t3 = performance.now();
  const vecResults = db.prepare(`
    SELECT chunk_id, document_id, text, distance
    FROM semantic_chunks_vec
    WHERE vss_search(embedding, ?)
      AND project_id = ?
    LIMIT ?
  `).all(queryVector, projectId, topK * 3);
  timing.vecMs = performance.now() - t3;

  // ── Step 4: 混合排序（Reciprocal Rank Fusion）──
  const t4 = performance.now();
  const merged = reciprocalRankFusion(ftsResults, vecResults, {
    ftsWeight,
    vecWeight,
  });
  timing.rerankMs = performance.now() - t4;
  timing.totalMs = performance.now() - t0;

  return {
    chunks: merged.slice(0, topK),
    timing: timing as RetrieveResult['timing'],
  };
}
```

### 5.3 Reciprocal Rank Fusion（RRF）

```
// ── services/rag/rrf.ts ─────────────────────────────

interface RRFOptions {
  ftsWeight: number;
  vecWeight: number;
  k?: number; // RRF 常数，默认 60
}

function reciprocalRankFusion(
  ftsResults: FtsResult[],
  vecResults: VecResult[],
  opts: RRFOptions,
): MergedResult[] {
  const { ftsWeight, vecWeight, k = 60 } = opts;
  const scoreMap = new Map<string, MergedResult>();

  // FTS 排名分数
  ftsResults.forEach((r, rank) => {
    const score = ftsWeight / (k + rank + 1);
    const entry = scoreMap.get(r.chunk_id) ?? {
      chunkId: r.chunk_id,
      documentId: r.document_id,
      text: r.text,
      score: 0,
      ftsScore: 0,
      vecSimilarity: 0,
    };
    entry.ftsScore = -r.rank; // FTS5 rank 是负数
    entry.score += score;
    scoreMap.set(r.chunk_id, entry);
  });

  // 向量相似度排名分数
  vecResults.forEach((r, rank) => {
    const score = vecWeight / (k + rank + 1);
    const entry = scoreMap.get(r.chunk_id) ?? {
      chunkId: r.chunk_id,
      documentId: r.document_id,
      text: r.text,
      score: 0,
      ftsScore: 0,
      vecSimilarity: 0,
    };
    entry.vecSimilarity = 1 - r.distance; // distance → similarity
    entry.score += score;
    scoreMap.set(r.chunk_id, entry);
  });

  return Array.from(scoreMap.values()).sort((a, b) => b.score - a.score);
}
```

### 5.4 性能对比

| 步骤 | 当前（主进程同步） | 重构后（ComputeProcess 并行） |
| --- | --- | --- |
| FTS 查询 | ~50ms（主进程阻塞） | ~50ms（ComputeProcess，不阻塞 UI） |
| Query Embedding | ~300ms（主进程 ONNX） | ~300ms（ComputeProcess，与 FTS 并行） |
| 向量检索 | ~20ms | ~20ms |
| Rerank | ~100ms | ~5ms（RRF 替代重排序推理） |
| 主进程阻塞 | ~470ms | ~0ms（全部在 ComputeProcess） |
| 端到端延迟 | ~470ms | ~375ms（FTS || Embed 并行省 50ms + RRF 省 95ms） |

---

## 6. 语义块索引缓存：BoundedMap 替换

### 6.1 当前问题

```
// ── 当前 semanticChunkIndexService.ts ───────────────
class SemanticChunkIndexService {
  // ❌ 只增不减，项目越用越大
  private index = new Map<string, ChunkIndex>();

  addChunk(chunkId: string, index: ChunkIndex): void {
    this.index.set(chunkId, index);
  }

  // 没有 eviction / cleanup 逻辑
}
```

### 6.2 修复：BoundedMap + ProjectLifecycle

```
// ── 修复后 ──────────────────────────────────────────

import { BoundedMap } from '../utils/BoundedMap';

class SemanticChunkIndexService {
  private index: BoundedMap<string, ChunkIndex>;

  constructor(
    private lifecycle: ProjectLifecycle,
    opts: {
      maxChunks?: number;
      ttlMs?: number;
    } = {},
  ) {
    const { maxChunks = 5000, ttlMs = 60 * 60 * 1000 } = opts; // 1h TTL

    this.index = new BoundedMap({
      maxSize: maxChunks,
      ttlMs,
      onEvict: (_key, chunk) => {
        // 可选：记录驱逐指标
        metrics.increment('semantic_chunk_evicted');
      },
    });

    // 项目切换时清除
    this.lifecycle.onProjectUnbind(() => {
      this.index.clear();
    });
  }

  addChunk(chunkId: string, data: ChunkIndex): void {
    this.index.set(chunkId, data);
  }

  getChunk(chunkId: string): ChunkIndex | undefined {
    return this.index.get(chunkId); // BoundedMap 自动更新 LRU
  }

  get size(): number {
    return this.index.size;
  }

  /** 缓存命中率（用于监控） */
  get hitRate(): number {
    return this.index.hitRate;
  }
}
```

### 6.3 内存预估

| 场景 | 当前（无限增长） | BoundedMap（5000 上限） |
| --- | --- | --- |
| 每个 ChunkIndex 大小 | ~2KB | ~2KB |
| 长期运行（10k chunks） | ~20MB（持续增长） | ≤ 10MB（LRU 驱逐） |
| 项目切换后 | 旧项目数据残留 | 立即清零 |
| 内存上限 | ❌ 无 | ✅ 5000 × ~2KB ≈ 10MB |

---

## 7. Chunk Hash Diff：避免重复推理

### 7.1 设计

```
// ── services/embedding/chunkHashCache.ts ────────────

import { createHash } from 'crypto';
import { BoundedMap } from '../utils/BoundedMap';

/**
 * 文档块 hash 缓存。
 * 用于 autosave 时判断块内容是否变更，避免重复推理。
 */
export class ChunkHashCache {
  private cache: BoundedMap<string, string>; // chunkId → hash

  constructor(lifecycle: ProjectLifecycle) {
    this.cache = new BoundedMap({
      maxSize: 10_000,
      ttlMs: 2 * 60 * 60 * 1000, // 2h TTL
    });

    lifecycle.onProjectUnbind(() => this.cache.clear());
  }

  /**
   * 检查块内容是否变更。
   * @returns true = 已变更或首次见到，需要重新推理
   */
  hasChanged(chunkId: string, text: string): boolean {
    const newHash = this.computeHash(text);
    const oldHash = this.cache.get(chunkId);

    if (oldHash === newHash) return false; // 未变更

    this.cache.set(chunkId, newHash);
    return true;
  }

  private computeHash(text: string): string {
    // sha256：Node crypto 内置，无需第三方依赖
    // 仅用于 diff 判断，无需加密强度以上的性能
    return createHash('sha256')
      .update(text)
      .digest('hex');
  }
}
```

### 7.2 优化效果

```
典型场景：用户编辑 1 个段落，autosave 触发
当前：整个文档所有块重新推理（假设 50 块 × 300ms = 15s）
重构后：仅 1 个变更块推理（300ms），其余 49 块 hash 命中跳过
节省：~98% 推理量
```

---

## 8. Embedding 写入：统一走 DataProcess

### 8.1 读写分离

```
// ── DataProcess 侧：embedding/embeddingDao.ts ──────

export class EmbeddingDao {
  constructor(private db: Database) {} // DataProcess 的读写连接

  /**
   * 批量 upsert 向量。
   * 使用事务确保原子性。
   */
  upsertBatch(
    projectId: string,
    items: Array<{
      chunkId: string;
      documentId: string;
      vector: Float32Array;
      text: string;
    }>,
  ): number {
    const upsertStmt = this.db.prepare(`
      INSERT INTO semantic_chunks (chunk_id, document_id, project_id, text, embedding, updated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(chunk_id) DO UPDATE SET
        text = excluded.text,
        embedding = excluded.embedding,
        updated_at = excluded.updated_at
    `);

    const upsertVecStmt = this.db.prepare(`
      INSERT INTO semantic_chunks_vec (chunk_id, embedding)
      VALUES (?, ?)
      ON CONFLICT(chunk_id) DO UPDATE SET
        embedding = excluded.embedding
    `);

    // ── 事务批量写入 ──
    const tx = this.db.transaction((items) => {
      let count = 0;
      for (const item of items) {
        upsertStmt.run(
          item.chunkId,
          item.documentId,
          projectId,
          item.text,
          Buffer.from(item.vector.buffer),
        );
        upsertVecStmt.run(
          item.chunkId,
          Buffer.from(item.vector.buffer),
        );
        count++;
      }
      return count;
    });

    return tx(items);
  }

  /**
   * 删除文档的所有向量（文档删除时调用）。
   */
  deleteByDocument(projectId: string, documentId: string): number {
    return this.db.prepare(`
      DELETE FROM semantic_chunks
      WHERE project_id = ? AND document_id = ?
    `).run(projectId, documentId).changes;
  }
}
```

### 8.2 数据流

```
sequenceDiagram
    participant M as 主进程
    participant C as ComputeProcess
    participant D as DataProcess

    M->>M: autosave 触发
    M->>M: chunkDocument + hash diff
    M->>C: IPC embedding:batch (变更块)
    C->>C: ONNX session.run()
    C->>D: IPC embedding:upsert (向量)
    D->>D: SQLite 事务写入
    D-->>C: upsertedCount
    C-->>M: 完成通知
```

---

## 9. 索引维护策略

### 9.1 FTS5 索引同步

```
// ── DataProcess 侧：FTS 索引自动维护 ────────────────

// FTS5 content-sync 表（自动与主表同步）
const FTS_CREATE_SQL = `
  CREATE VIRTUAL TABLE IF NOT EXISTS semantic_chunks_fts
  USING fts5(
    text,
    project_id UNINDEXED,
    chunk_id UNINDEXED,
    document_id UNINDEXED,
    content='semantic_chunks',
    content_rowid='rowid',
    tokenize='unicode61 remove_diacritics 2'
  );
`;

// 触发器：主表变更时自动更新 FTS 索引
const FTS_TRIGGERS_SQL = `
  CREATE TRIGGER IF NOT EXISTS semantic_chunks_ai AFTER INSERT ON semantic_chunks BEGIN
    INSERT INTO semantic_chunks_fts(rowid, text, project_id, chunk_id, document_id)
    VALUES (new.rowid, new.text, new.project_id, new.chunk_id, new.document_id);
  END;

  CREATE TRIGGER IF NOT EXISTS semantic_chunks_ad AFTER DELETE ON semantic_chunks BEGIN
    INSERT INTO semantic_chunks_fts(semantic_chunks_fts, rowid, text, project_id, chunk_id, document_id)
    VALUES ('delete', old.rowid, old.text, old.project_id, old.chunk_id, old.document_id);
  END;

  CREATE TRIGGER IF NOT EXISTS semantic_chunks_au AFTER UPDATE ON semantic_chunks BEGIN
    INSERT INTO semantic_chunks_fts(semantic_chunks_fts, rowid, text, project_id, chunk_id, document_id)
    VALUES ('delete', old.rowid, old.text, old.project_id, old.chunk_id, old.document_id);
    INSERT INTO semantic_chunks_fts(rowid, text, project_id, chunk_id, document_id)
    VALUES (new.rowid, new.text, new.project_id, new.chunk_id, new.document_id);
  END;
`;
```

### 9.2 sqlite-vec 索引

```
-- 向量索引（在 migration 中创建）
CREATE VIRTUAL TABLE IF NOT EXISTS semantic_chunks_vec
USING vec0(
  chunk_id TEXT PRIMARY KEY,
  embedding FLOAT[384]  -- 维度根据模型调整
);
```

---

## 10. TDD 策略

| 测试类别 | 测试内容 | 断言 | 工具 |
| --- | --- | --- | --- |
| ONNX 卸载 | ComputeProcess 中 embedBatch 正确返回向量 | 向量维度正确，L2 norm ≈ 1 | Vitest + mock ONNX session |
| 队列去重 | 同一 documentId 入队 3 次 | 只推理 1 次（最后版本） | Vitest |
| 队列 debounce | 连续 5 次 enqueue，间隔 < debounceMs | 只触发 1 次 flush | Vitest + fake timers |
| Hash diff | 相同文本 → hasChanged 返回 false | 返回 false，不触发推理 | Vitest |
| Hash diff 变更 | 修改 1 个字符 → hasChanged 返回 true | 返回 true | Vitest |
| RAG 管道并行 | FTS + Embed 并行执行 | 总耗时 ≈ max(FTS, Embed)，非 sum | Vitest + performance.now() |
| RRF 正确性 | 已知 FTS + Vec 排名 → RRF 混合 | 分数和排名 === 预期 | Vitest |
| Upsert 事务 | 中途报错 → 事务回滚 | 数据库无脏数据 | Vitest + in-memory SQLite |
| 缓存 LRU | 写入 6000 chunks（上限 5000） | size === 5000，最旧的被驱逐 | Vitest |
| 缓存项目切换 | 切换项目 → 检查缓存 | 缓存清零 | Vitest |
| FTS 触发器 | INSERT/UPDATE/DELETE semantic_chunks | FTS 索引同步更新，MATCH 返回正确 | Vitest + in-memory SQLite |
| 可取消 | 推理过程中 abort | 抛出 AbortError，无残留状态 | Vitest |
| E2E 延迟基准 | 完整 RAG 查询 pipeline | 端到端 < 500ms，主进程阻塞 === 0 | Vitest benchmark |
| OOM 压力 | 连续推理 10k chunks | RSS 内存增量 < 100MB，最终回落 | Vitest + process.memoryUsage() |

---

## 11. 依赖关系

```
flowchart LR
    UP["⚡ UtilityProcess\n双进程架构"] --> EMB["🧬 Embedding & RAG"]
    LC["♻️ 资源生命周期\nProjectLifecycle"] --> EMB
    DL["💾 数据层设计\nSQLite + sqlite-vec"] --> EMB
    KG["🔮 KG 查询层\nentityMatcher"] --> EMB

    EMB --> SK["🎯 Skill 系统\nRAG 结果注入"]
    EMB --> AI["🛡️ AI 流式写入\n写入队列协调"]

    style EMB fill:#f3e5f5,stroke:#9C27B0
```

- 前置依赖：⚡ UtilityProcess 双进程架构（ComputeProcess 推理 + DataProcess 写入）

- 前置依赖：♻️ 资源生命周期管理（缓存卸载钩子 + 项目切换清理）

- 前置依赖：💾 数据层设计（semantic_chunks 表 + sqlite-vec 扩展 + FTS5 索引）

- 协作：🔮 KG 查询层（entityMatcher 为 RAG 提供实体识别增强）

- 被依赖：🎯 Skill 系统优化（RAG retrieve 结果作为 Skill 上下文注入）

- 协调：🛡️ AI 流式写入防护策略（embedding 写入队列与流式写入队列的优先级协调）
