# 数据层设计（SQLite & DAO）

> Source: Notion local DB page `5fae44ab-3c3d-43b7-ace5-a1cb91f9c72c`

> 💾

CN 的持久化层 = SQLite（better-sqlite3）+ raw SQL migrations。 本文档审计 schema 设计、DAO 组织、migration 机制、读写策略，并对接双进程架构下的读写分离决策。

---

## 1. 技术栈

| 组件 | 选型 | 说明 |
| --- | --- | --- |
| Driver | better-sqlite3 | 同步 API，native addon，当前单连接共享 |
| Migration | 手写 raw SQL（22 个 .sql 文件） | 无 ORM / 无 Drizzle / 无 Prisma |
| FTS | SQLite FTS5 | documents_fts 虚表 + 自动同步触发器 |
| 向量检索（可选） | sqlite-vec | vec0 虚表（user_memory_vec），不可用时降级 |
| Journal | WAL | PRAGMA journal_mode = WAL |

---

## 2. Schema 总览

SSOT：‣（21/22 migrations applied，0008_user_memory_vec.sql 依赖 sqlite-vec 扩展）

### 2.1 表清单（按业务域）

| 业务域 | 表名 | 用途 | 预估行量级/项目 |
| --- | --- | --- | --- |
| 项目管理 | projects | 项目元数据（名称、路径、类型、阶段、叙事人称等） | ~10（全局） |
|  | settings | K/V 配置（scope + key → value_json） | ~100（全局） |
| 文档 | documents | 章节正文（TipTap JSON + 纯文本 + Markdown 三份冗余） | ~100 |
|  | document_versions | 版本快照（完整内容 + diff + word_count） | ~1,000 |
|  | document_branches | 分支元数据（base/head snapshot） | ~10 |
|  | document_merge_sessions | 三路合并会话 | ~10 |
|  | document_merge_conflicts | 合并冲突明细 | ~50 |
|  | chapter_synopses | 章节梗概（AI 生成注入 Context） | ~100 |
| 知识图谱 | kg_entities | 实体（character / location / event / item / faction） | ~500–5,000 |
|  | kg_relations | 实体间关系 | ~1,000–10,000 |
|  | kg_relation_types | 关系类型定义（内置 + 自定义） | ~20 |
| 记忆 | user_memory | 用户记忆条目（语义 + 学习型） | ~100–1,000 |
|  | memory_episodes | 情景记忆（AI 交互的完整上下文快照） | ~1,000 |
|  | memory_semantic_placeholders | 语义规则占位（蒸馏中间态） | ~50 |
|  | user_memory_vec | 向量索引（vec0，可选） | 与 user_memory 同步 |
| AI / Trace | generation_traces | AI 生成轨迹（输入/输出/模型/耗时） | ~5,000 |
|  | trace_feedback | Trace 反馈（accept / reject / partial） | ~1,000 |
|  | skill_feedback | Skill 级反馈 | ~500 |
| 技能 | skills | 技能状态（启用/禁用/错误） | ~20 |
|  | custom_skills | 自定义技能（prompt 模板 + 输入类型 + 作用域） | ~10 |
| 质量评判 | judge_models | Judge 模型状态 | ~5 |
| 统计 | stats_daily | 每日写作统计 | ~365/年 |
| 搜索 | documents_fts | FTS5 全文索引（触发器自动同步） | 与 documents 同步 |

合计：18 张业务表 + 1 FTS 虚表 + 1 向量虚表（可选）+ 3 个触发器 + 28 个索引

### 2.2 表关系图

```
erDiagram
    projects ||--o{ documents : "1:N"
    projects ||--o{ kg_entities : "1:N"
    projects ||--o{ kg_relations : "1:N"
    projects ||--o{ kg_relation_types : "1:N"
    projects ||--o{ user_memory : "1:N"
    projects ||--o{ memory_episodes : "1:N"
    projects ||--o{ memory_semantic_placeholders : "1:N"
    projects ||--o{ chapter_synopses : "1:N"
    projects ||--o{ generation_traces : "0:N"

    documents ||--o{ document_versions : "1:N"
    documents ||--o{ document_branches : "1:N"
    documents ||--o{ document_merge_sessions : "1:N"
    documents ||--o{ document_merge_conflicts : "1:N"
    documents ||--o{ chapter_synopses : "1:1"

    document_merge_sessions ||--o{ document_merge_conflicts : "1:N"

    kg_entities ||--o{ kg_relations : "source"
    kg_entities ||--o{ kg_relations : "target"

    generation_traces ||--o{ trace_feedback : "1:N"
```

---

## 3. 索引策略审计

### 3.1 当前索引覆盖情况

| 表 | 索引数 | 覆盖的查询模式 | 评估 |
| --- | --- | --- | --- |
| kg_entities | 5（含 1 UNIQUE） | by project / by type / by name / by context_level / unique(project,type,name) | ✅ 覆盖充分 |
| kg_relations | 3 | by project / by source / by target | ✅ 图遍历双向索引 |
| documents | 2 | by project+sort_order / by project+updated_at | ✅ |
| document_versions | 1 | by document+created_at DESC | ✅ |
| user_memory | 4（含 1 UNIQUE partial） | by project / by scope+type / by document / unique learned+source_ref | ✅ 覆盖充分 |
| memory_episodes | 3 | by project+created / by scene_type / by last_recalled | ✅ |
| generation_traces | 2 | by document+created / by project+created | ✅ |
| settings | 0（PK only） | PK = (scope, key) | ✅ 复合主键足够 |

### 3.2 潜在缺失索引

> ⚠️

以下场景可能需要补索引，取决于实际查询频率和数据量：

- kg_relations 缺 relation_type 索引 — 如果按关系类型过滤频繁，需要补

- document_versions.content_hash — 如果用于去重查询，需要补

- generation_traces.skill_id — 如果按技能维度统计 trace，需要补

---

## 4. FTS 全文搜索

### 4.1 实现方式

```
CREATE VIRTUAL TABLE documents_fts USING fts5(
  title, content_text,
  document_id UNINDEXED, project_id UNINDEXED
);
```

三个触发器保证 documents_fts 与 documents 实时同步：

- documents_ai_fts — INSERT 后自动插入 FTS

- documents_au_fts — UPDATE 后删旧插新

- documents_ad_fts — DELETE 后清理

### 4.2 审计发现

| 方面 | 现状 | 评估 |
| --- | --- | --- |
| 同步机制 | 触发器自动同步 | ✅ 数据一致性有保障 |
| 重建操作 | ftsService.ts 的 rebuildIndex 全量重建 | ⚠️ 在主线程同步执行，阻塞 Event Loop |
| 分词 | FTS5 默认 unicode61 tokenizer | ⚠️ 中文分词效果有限（无 jieba 等） |
| 索引范围 | 仅索引 title  • content_text | ✅ 合理（KG 实体名称等不在 FTS 范围） |

---

## 5. DAO 层组织

### 5.1 当前模式：Service 内嵌 SQL

CN 没有独立的 DAO 层目录（无 dao/ 或 repositories/），采用「按业务域 service，service 内直接写 SQL」的模式：

```
services/
├── documents/        → documentCrudService.ts 内直接 db.prepare().run()
├── kg/               → kgQueryService.ts / kgWriteService.ts（读写分离相对清晰）
├── memory/           → memoryService.ts 内直接 SQL
├── embedding/        → semanticChunkIndexService.ts 内直接 SQL
└── ...
```

### 5.2 评估

| 优点 | 不足 |
| --- | --- |
| 简单直接，无抽象层开销 | SQL 散落在各 service 中，难以统一审计写操作 |
| KG 模块做了读写分离（queryService / writeService） | 其他模块读写混在一个文件中 |
| raw SQL 性能最优 | 写操作无统一入口，无法简单收口到 DataProcess |

> 🔑

这是引入 WriteProxy 的核心动机。 在不重构 service 的前提下，通过 WriteProxy 接口拦截所有写操作，将其统一路由到 DataProcess。详见 → ‣

---

## 6. Migration 机制

### 6.1 实现方式

SSOT：apps/desktop/main/src/db/init.ts

```
graph TD
    A["initDb()"] --> B["打开 better-sqlite3 连接"]
    B --> C["PRAGMA foreign_keys = ON"]
    C --> D["PRAGMA journal_mode = WAL"]
    D --> E["确保 schema_version 表存在"]
    E --> F["读取当前 version 游标"]
    F --> G{"version < migrations.length?"}
    G -->|是| H["BEGIN TRANSACTION"]
    H --> I["db.exec(migration SQL)"]
    I --> J["UPDATE schema_version"]
    J --> K["COMMIT"]
    K --> G
    G -->|否| L["初始化完成"]

    style H fill:#e8f5e9,stroke:#4CAF50
```

### 6.2 Migration 清单

| 编号 | 文件名 | 内容 |
| --- | --- | --- |
| 0001 | init.sql | projects / documents / document_versions / settings / schema_version |
| 0002 | documents_versioning.sql | version 表增强（content_hash / diff） |
| 0003 | judge.sql | judge_models 表 |
| 0004 | skills.sql | skills / skill_feedback 表 |
| 0005 | knowledge_graph.sql | kg_entities / kg_relations / kg_relation_types |
| 0006 | search_fts.sql | documents_fts 虚表 + 3 个触发器 |
| 0007 | stats.sql | stats_daily 表 |
| 0008 | user_memory_vec.sql | user_memory_vec（vec0，需 sqlite-vec 扩展） |
| 0009 | memory_document_scope.sql | user_memory 增加 document_id |
| 0010 | projects_archive.sql | projects 增加 archived_at |
| 0011 | document_type_status.sql | documents 增加 type / status / sort_order / parent_id |
| 0012 | memory_episodic_storage.sql | memory_episodes 表 |
| 0013 | knowledge_graph_p0.sql | KG 索引增强 |
| 0014 | project_metadata.sql | projects 增加 description / stage / target_* 等元数据 |
| 0015 | version_snapshot_word_count.sql | document_versions 增加 word_count |
| 0016 | skill_custom_crud.sql | custom_skills 表 |
| 0017 | version_branch_merge_conflict.sql | document_branches / merge_sessions / merge_conflicts |
| 0018 | kg_ai_context_level.sql | kg_entities 增加 ai_context_level |
| 0019 | kg_aliases.sql | kg_entities 增加 aliases JSON |
| 0020 | kg_last_seen_state.sql | kg_entities 增加 last_seen_state |
| 0021 | s3_trace_persistence.sql | generation_traces / trace_feedback 表 |
| 0022 | s3_synopsis_injection.sql | chapter_synopses / memory_semantic_placeholders 表 |

### 6.3 评估

| 方面 | 现状 | 评估 |
| --- | --- | --- |
| 版本游标 | schema_version 表记录当前已执行到哪一步 | ✅ 支持中断续跑 |
| 事务保护 | 每个 migration 在 transaction() 内执行 | ✅ 单步原子 |
| 回滚能力 | 无 down migration | ⚠️ 无法回退，但桌面应用场景可接受 |
| 测试覆盖 | db/ 目录无 colocated tests | ⚠️ migration 正确性靠集成测试间接覆盖 |
| 可选扩展 | sqlite-vec 不可用时跳过 0008 | ✅ 降级策略合理 |

---

## 7. 读写策略（现状）

### 7.1 连接模型

```
graph LR
    subgraph Main["Main Process"]
        S1["documentService"]
        S2["kgWriteService"]
        S3["memoryService"]
        S4["embeddingService"]
        S5["其他 services"]
    end
    DB[(SQLite<br>单连接<br>better-sqlite3)]

    S1 & S2 & S3 & S4 & S5 -->|"db.prepare().run()"| DB

    style DB fill:#ffebee,stroke:#f44336
```

> 🔴

当前：单连接，所有 service 共享同一个 db 实例。 读写混合，无隔离。better-sqlite3 同步 API 意味着任何写操作都会阻塞 Event Loop。

### 7.2 WAL 配置现状

```
-- 当前 initDb() 中仅设置了两个 pragma
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
-- 缺失的关键配置（详见 §8 目标架构）：
-- PRAGMA synchronous = ?         ← 未设置（默认 FULL，WAL 模式下过保守）
-- PRAGMA cache_size = ?          ← 未设置（默认 -2000，仅 2MB）
-- PRAGMA busy_timeout = ?        ← 未设置（默认 0，立即报错）
-- PRAGMA wal_autocheckpoint = ?  ← 未设置（默认 1000，可接受）
-- PRAGMA mmap_size = ?           ← 未设置（默认 0，未启用）
```

### 7.3 并发风险

| 场景 | 风险 | 当前缓解措施 |
| --- | --- | --- |
| AI 流式写入 + 用户保存 | 同一连接串行执行，写入排队互相阻塞 | 无 |
| FTS 重建 + KG 查询 | FTS rebuild 阻塞主线程，KG 查询排队 | 无 |
| ONNX 推理期间的读操作 | ONNX 阻塞 Event Loop，read 无法执行 | 无（ONNX 不涉及 SQLite，但阻塞同一线程） |

---

## 8. 目标架构：读写分离

> 🔑

三进程三连接，一写多读。 详细方案见 → ‣

### 8.1 连接分布（目标）

```
graph LR
    subgraph Main["Main Process"]
        M_DB["better-sqlite3<br>readonly: true<br>轻量读"]
    end
    subgraph Compute["ComputeProcess"]
        C_DB["better-sqlite3<br>readonly: true<br>重量读（KG CTE / FTS）"]
    end
    subgraph Data["DataProcess"]
        D_DB["better-sqlite3<br>read-write<br>唯一写入者"]
    end
    DB[(SQLite WAL<br>project.db)]
    M_DB -.->|RO| DB
    C_DB -.->|RO| DB
    D_DB ==>|RW| DB

    style Data fill:#e8f5e9,stroke:#4CAF50
```

### 8.2 Pragma 配置（目标）

| Pragma | DataProcess (RW) | Main / ComputeProcess (RO) | 说明 |
| --- | --- | --- | --- |
| journal_mode | WAL | WAL（继承） | 一写多读前提 |
| synchronous | NORMAL | NORMAL | WAL 模式下 NORMAL 足够安全 |
| busy_timeout | 5000 | 5000 | 安全网（理论上不会触发） |
| cache_size | -64000（64MB） | -16000（16MB） | 写进程需更大缓存 |
| mmap_size | 268435456（256MB） | 268435456（256MB） | 共享同一映射 |
| foreign_keys | ON | ON | 数据完整性 |
| query_only | OFF | ON | 只读连接双重保险 |
| wal_autocheckpoint | 1000 | — | 由 DataProcess 负责 checkpoint |

---

## 9. 数据存储策略

### 9.1 内容冗余三份

documents 和 document_versions 都同时存储：

| 字段 | 用途 |  |  |
| --- | --- | --- | --- |
| content_json | TipTap JSON — 编辑器 SSOT |  |  |
| content_text | 纯文本 — FTS 索引、token 计算 |  |  |
| content_md | Markdown — 导出、AI 上下文注入 |  |  |

> 📊

权衡：空间换时间。避免每次需要纯文本或 Markdown 时实时转换 TipTap JSON。对于写作 IDE，内容数据量相对可控（万字小说约 100KB JSON），三份冗余可接受。

### 9.2 版本快照 = 完整内容

document_versions 存储完整内容快照（非增量 diff），同时附带辅助 diff 字段：

- content_json / content_text / content_md — 完整快照

- diff_format / diff_text — 辅助 diff（用于 UI 展示差异，非存储优化）

- word_count — 字数统计

权衡：完整快照使得版本回滚和对比都是 O(1) 读取，无需回放 diff 链。代价是存储空间，但对桌面应用不构成问题。

### 9.3 分库策略

- 当前：所有数据在同一个 SQLite 文件中，通过 project_id 外键隔离

- 项目路径：projects.root_path 指向项目目录，但 DB 文件位置在 userData/ 而非项目目录内

- 无多文件分库：不是每项目一个 SQLite 文件

> ⚠️

潜在风险：如果用户创建大量项目（100+），单 DB 文件的表行数会膨胀。但对写作 IDE 场景，项目数通常在个位数到两位数，当前方案可接受。

---

## 10. 数据完整性与安全

| 方面 | 现状 | 评估 |
| --- | --- | --- |
| 外键约束 | PRAGMA foreign_keys = ON，所有关联表有 ON DELETE CASCADE | ✅ 级联删除正确 |
| CHECK 约束 | kg_entities.type、custom_skills.input_type、trace_feedback.action 等均有 CHECK | ✅ 枚举值受保护 |
| UNIQUE 约束 | KG 实体 (project_id, type, lower(trim(name))) 等 | ✅ 防重复 |
| 事务保护 | migration 在事务内；业务写操作部分使用 transaction() | ⚠️ 非所有写操作都在事务内 |
| 原子写入（文件） | 多处 writeFileSync，无 temp+rename | ⚠️ 文件系统写入有损坏风险 |
| 备份 | 无自动备份机制 | ⚠️ 用户数据无兜底 |
| 加密 | SQLite 文件未加密（API Key 通过 safeStorage 单独加密） | ✅ 桌面应用场景可接受 |

---

## 11. 审计总判定

> 💾

Schema 设计扎实，读写策略是短板。 表结构、索引、外键、CHECK 约束做得不错。核心问题在运行时层面：单连接 + 无 pragma 调优 + 写操作散落 + 无备份。

### 11.1 应保留

- ✅ raw SQL migration + 版本游标 — 简单可靠

- ✅ FTS5 触发器自动同步 — 数据一致性好

- ✅ 内容三份冗余 — 空间换时间，合理权衡

- ✅ 完整版本快照 — O(1) 回滚

- ✅ KG 模块的 Query/Write 分离 — 可作为其他模块的参考模式

### 11.2 需改进

| 问题 | 治理方案 |
| --- | --- |
| 单连接无读写分离 | → ‣ |
| Pragma 未调优 | → ‣ |
| 写操作无统一入口 | → WriteProxy 收口（UtilityProcess §5.4） |
| 无自动备份 | → 待规划（可在 DataProcess 中定时 .backup()） |
| 非所有写操作在事务内 | → DataProcess 统一事务管理 |
| 文件 I/O 无原子写入 | → ‣ |

---

## 12. 相关页面

- ‣ — 完整 CREATE TABLE / INDEX / TRIGGER

- ‣ — §5 SQLite 读写分离

- ‣ — 启动流程中 initDb() 的位置

- ‣ — Pragma 调优 + 文件原子写入
