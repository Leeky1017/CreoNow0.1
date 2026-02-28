# AI Native 内容架构——语义层与存储设计

> Source: Notion local DB page `c3430677-be84-4609-9651-fda527290aa8`

> 🎯

核心命题：让存储格式成为 AI 的母语。 Block 模型是为人类手动编辑设计的，AI 时代的存储核心应该是连续文本 + 语义区间（semantic spans）。CN 作为 AI 写作 IDE，从底层就应该避开 Notion 的 block 陷阱。

---

## 1. 三层分离原则（全局锚点）

```
┌─────────────────────────────────┐
│   呈现层（Presentation）         │  ← 人类看到的：排版、样式、交互
├─────────────────────────────────┤
│   结构层（Structure）            │  ← 轻量标注：段落、标题、引用等
├─────────────────────────────────┤
│   语义层（Semantic）             │  ← AI 消费的：连续文本 + 语义标签
└─────────────────────────────────┘
```

三层不是同一份数据的三种"视图"，而是真正独立的关注点，各自有最合适的数据结构。

- 语义层（本页）：存储核心，AI 直接消费 → 后端负责

- 结构层（前端侧）：从语义层派生的轻量 AST，可缓存可重建

- 呈现层（前端侧）：渲染引擎 + design token，不写回存储

> 前端侧设计详见 ‣ 中的「AI Native 内容架构——结构层与呈现层设计」

---

## 2. 语义层：连续文本 + 语义区间

### 2.1 数据模型

Block 模型的存储方式（Notion）：

```
// 每个内容单元是独立实体，有独立 ID、类型、子节点
block[0] = { id: "abc", type: "heading_2", text: "角色设定" }
block[1] = { id: "def", type: "paragraph", text: "主角是一名退役飞行员..." }
block[2] = { id: "ghi", type: "paragraph", text: "性格特征包括沉默寡言..." }
```

语义区间模型（CN 建议）：

```
// 核心是一个连续文本 + 一组标注区间
content = "角色设定\n\n主角是一名退役飞行员...性格特征包括沉默寡言..."

semantic_spans = [
  { start: 0,  end: 4,  role: "heading", level: 2 },
  { start: 6,  end: 89, role: "character_description" },
  { start: 45, end: 89, role: "personality_trait" },
]
```

### 2.2 为什么语义区间优于 Block

| 维度 | Block 模型 | 语义区间模型 |
| --- | --- | --- |
| AI 上下文装配 | 遍历 block 树 → 序列化为文本（O(n) 翻译成本） | 直接 content.slice(start, end)（零翻译成本） |
| AI 写入路径 | token → 解析 → 创建 block × N → 存储 × N | token → 追加到 content 字符串 → 完成 |
| 标注重叠 | 不支持（block 是互斥的树结构） | 天然支持（区间可重叠：一段话同时是"角色描述"和"伏笔"） |
| 写放大 | 严重（一段话 = 多个 block = 多次写事务） | 极小（一次字符串追加 + 可选的区间更新） |
| 与 KG/Embedding 的集成 | 需要 block ID → 文本的间接映射 | 语义区间直接作为 KG 节点和 Embedding chunk 的索引 |

### 2.3 实现建议

- 主存储采用 plain text + offset-based annotations（类似 CRDTs 的思路，或 ProseMirror 的 Mark 概念但更彻底）

- 语义标签同时服务于 AI 和 KG——Knowledge Graph 直接索引语义区间，而不是索引 block ID

- Embedding chunking 基于语义区间做分块，而不是按段落或固定 token 数切分

---

## 3. AI 上下文装配：零翻译成本

CN 的 AI 上下文应该从多个来源无缝拼接，且全部基于文本 + 语义标签，不需要格式转换：

```
当前文档的相关区间（语义层直出）
  + KG 中关联的概念/角色/设定（语义区间索引）
  + 用户的写作偏好和风格模式（Memory System）
  + 当前 Skill 的指令模板
```

关键优势：所有上下文来源都是「文本 + 语义标签」格式，拼接时不需要从不同的 block 格式翻译到统一格式。

---

## 4. AI 写入路径：从流式 Token 到持久化

### 4.1 对比

```
Notion 路径：
  LLM token stream → parse to blocks → create block × N → save each → sync each
  
CN 建议路径：
  LLM token stream → append to content string → batch commit → incremental AST update
```

### 4.2 与现有 AI 流式写入防护的整合

语义区间模型与 ‣ 天然互补：

| 防护策略组件 | Block 模型下的行为 | 语义区间模型下的行为 |
| --- | --- | --- |
| ChunkBatcher | 合并 token → 但仍需逐 block 创建 | 合并 token → 单次字符串追加，彻底消除写放大 |
| Transaction Batching | 多个 INSERT（每 block 一条）合入一个事务 | 一次 UPDATE content + 批量 INSERT spans，SQL 语句更少 |
| Rollback | 删除已创建的 block 记录 | 截断 content 到生成前长度 + 删除新增 spans，更简洁 |

---

## 5. 操作日志式版本控制

写作不像代码有清晰的 commit 边界。与其做 Notion 式的 block 级快照，不如做 content 级的操作日志（operation log）：

### 5.1 数据结构

```
interface ContentOperation {
  timestamp: number;
  author: 'human' | 'ai';
  skillId?: string;          // AI 生成时关联的 Skill
  op: 'insert' | 'delete' | 'replace';
  range: { start: number; end: number };
  text: string;              // insert/replace 的新文本
  previousText?: string;     // replace/delete 的旧文本（用于撤销）
}
```

### 5.2 能力

- 任意时间点回放：按顺序应用操作即可重建任意时刻的文档状态

- 选择性撤销 AI 生成：只回退 author: 'ai' 的操作，保留人类编辑——这在 block 模型里极难实现

- 写作过程分析：基于操作日志可以统计写作速度、AI 辅助比例、修改频率等

### 5.3 SQLite 存储建议

```
CREATE TABLE content_operations (
  id          INTEGER PRIMARY KEY,
  document_id TEXT    NOT NULL,
  timestamp   INTEGER NOT NULL,
  author      TEXT    NOT NULL CHECK (author IN ('human', 'ai')),
  skill_id    TEXT,
  op_type     TEXT    NOT NULL CHECK (op_type IN ('insert', 'delete', 'replace')),
  range_start INTEGER NOT NULL,
  range_end   INTEGER NOT NULL,
  new_text    TEXT,
  old_text    TEXT
);

CREATE INDEX idx_ops_doc_time ON content_operations(document_id, timestamp);
CREATE INDEX idx_ops_author   ON content_operations(document_id, author);
```

---

## 6. 与 KG / Embedding 的深度整合

语义区间是 KG 和 Embedding 系统的天然索引单元：

```
graph LR
    subgraph Storage["存储层"]
        C["content<br>连续文本"] --> S["semantic_spans<br>语义区间"]
    end

    subgraph KG["Knowledge Graph"]
        S -->|"role=character"| N1["角色节点"]
        S -->|"role=setting"| N2["设定节点"]
        S -->|"role=plot_point"| N3["情节节点"]
    end

    subgraph RAG["Embedding & RAG"]
        S -->|"语义区间 = chunk 边界"| E["向量索引"]
    end

    subgraph AI["AI 上下文"]
        N1 --> CTX["Context Assembly"]
        N2 --> CTX
        E --> CTX
        CTX --> LLM["LLM"]
    end
```

关键设计：

- KG 节点直接引用语义区间的 (document_id, start, end)，而不是 block ID

- Embedding chunking 以语义区间为边界，比固定 token 数切分更精确

- AI 上下文装配时，KG 检索和 Embedding 检索的结果都是文本区间，可以直接拼接

---

## 7. 对比总表：Notion vs CN

| 设计决策 | Notion（Block 模型） | CN（语义区间模型） |
| --- | --- | --- |
| 存储核心 | Block 树（每个内容单元独立实体） | 连续文本 + 语义区间 |
| AI 上下文来源 | 遍历 block 树 → 序列化 | 文本直出 + KG 语义索引 |
| AI 写入路径 | token → 创建 block → 逐条存储 | token → 追加文本 → 批量提交 |
| 版本控制 | Block 级快照 | 操作日志 + 时间线回放 |
| KG/Embedding 集成 | 通过 block ID 间接引用 | 语义区间直接索引 |

---

## 8. 相关页面

- ‣ — 语义区间模型下写入防护更简洁

- ‣ — KG 节点应引用语义区间而非 block ID

- ‣ — chunking 以语义区间为边界

- ‣ — content_operations 表设计
