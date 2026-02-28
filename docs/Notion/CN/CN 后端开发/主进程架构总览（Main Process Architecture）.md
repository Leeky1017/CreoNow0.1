# 主进程架构总览（Main Process Architecture）

> Source: Notion local DB page `8d2b8fd7-42a8-4955-a11e-6d89fd818560`

> 🏗️

CN 后端 = Electron 主进程（apps/desktop/main/src/）。本文档完整梳理其启动流程、模块结构、依赖关系、进程模型，并给出架构级判定与重构方向。

---

## 1. 启动流程

### 1.1 入口文件

SSOT：apps/desktop/main/src/index.ts

启动序列（从上到下的真实执行链）：

```
graph TD
    A["enableE2EUserDataIsolation()"] -->|"CREONOW_USER_DATA_DIR 存在时<br>app.setPath('userData', ...)"| B["app.whenReady()"]
    B --> C["createMainLogger(userDataDir)"]
    C --> D["initDb({ userDataDir, logger })"]
    D --> E["registerIpcHandlers({ db, logger, ... })"]
    E --> F["createMainWindow(logger)"]
    B --> G["before-quit → db.close()"]
    B --> H[".catch(logAppInitFatal) → app.quit()"]
    B --> I["window-all-closed → 非 macOS quit"]

    style D fill:#fff3e0,stroke:#FF9800
    style E fill:#e8f4f8,stroke:#2196F3
    style F fill:#e8f5e9,stroke:#4CAF50
```

### 1.2 启动 Pipeline 详解

| 步骤 | 代码 | 职责 | 失败策略 |
| --- | --- | --- | --- |
| ① E2E 隔离 | enableE2EUserDataIsolation() | 若 CREONOW_USER_DATA_DIR 存在，重定向 userData 目录，防止 E2E 污染真实 profile | 不存在则跳过 |
| ② 日志初始化 | createMainLogger(userDataDir) | 结构化 JSONL 落盘日志（userData/logs/main.log），fs.appendFileSync | — |
| ③ SQLite 初始化 | initDb({ userDataDir, logger }) | 打开 better-sqlite3，启用 foreign_keys  • WAL，顺序执行 migrations | 失败不阻断启动，db = null（降级运行） |
| ④ IPC 注册 | registerIpcHandlers({ db, logger, ... }) | 构造全部 service 依赖 + 注册 142 个 IPC 通道 handlers | — |
| ⑤ 窗口创建 | createMainWindow(logger) | 创建 BrowserWindow，加载 dev server 或 build 后的 renderer/index.html | — |
| ⑥ 退出清理 | before-quit → db.close() | 关闭 SQLite 连接 | 仅 db.close()，无其他资源清理 |

### 1.3 关键代码片段

```
// apps/desktop/main/src/index.ts
enableE2EUserDataIsolation();

app.whenReady().then(() => {
  const userDataDir = app.getPath("userData");
  const logger = createMainLogger(userDataDir);

  const dbRes = initDb({ userDataDir, logger });
  const db = dbRes.ok ? dbRes.db : null;

  registerIpcHandlers({
    db, logger, userDataDir,
    builtinSkillsDir: resolveBuiltinSkillsDir(__dirname),
    env: process.env,
  });
  createMainWindow(logger);
});
```

> ⚠️

审计发现：before-quit 仅执行 db.close()。无 Service 级别的 teardown 链、无后台任务取消、无内存资源释放。这是 ♻️ 三层生命周期管理 要解决的核心问题。

---

## 2. 目录结构与模块划分

SSOT：‣

### 2.1 一级目录结构

```
apps/desktop/main/src/
├── config/               # 运行时治理配置（runtimeGovernance）
├── db/                   # SQLite 初始化 + 22 个 migration 文件
│   ├── init.ts           # 打开连接 + migration 执行器
│   ├── paths.ts          # DB 路径解析
│   ├── nativeDoctor.ts   # native module 健康检查
│   └── migrations/       # 0001–0022 顺序 SQL 脚本
├── ipc/                  # IPC 通信层（142 通道）
│   ├── contract/         # Schema-first type map（SSOT）
│   └── __tests__/        # IPC 层单元测试（11 文件）
├── logging/              # 结构化日志
├── services/             # 业务逻辑层（核心）
│   ├── ai/               # AI 服务（LLM 调用、prompt、trace、judge）
│   ├── context/          # Context Engine（四层装配 + fetchers）
│   ├── documents/        # 文档管理（CRUD、版本、分支、合并）
│   ├── embedding/        # Embedding（ONNX 推理 + 语义块索引）
│   ├── export/           # 导出（markdown、txt、docx、项目包）
│   ├── judge/            # 质量评判
│   ├── kg/               # 知识图谱（查询、写入、实体匹配、识别运行时）
│   ├── memory/           # 记忆系统（语义 + 情景 + 蒸馏）
│   ├── projects/         # 项目管理（生命周期状态机、模板）
│   ├── rag/              # RAG（混合排序、查询规划、LRU 缓存）
│   ├── search/           # 搜索（FTS、混合排名、搜索替换）
│   ├── skills/           # 技能系统（加载、路由、调度、执行、校验）
│   └── stats/            # 统计
└── index.ts              # 主入口（启动 pipeline）
```

### 2.2 模块规模统计

| 模块 | 业务文件 | 测试文件 | 有无 colocated tests |
| --- | --- | --- | --- |
| services/ai/ | 12 | 18 | ✅ 覆盖充分 |
| services/context/ | 8 | 11 | ✅ 覆盖充分 |
| services/kg/ | 7 | 11 | ✅ 覆盖充分 |
| services/skills/ | 7 | 5 | ✅ 基本覆盖 |
| services/documents/ | 7 | 4 | ✅ 基本覆盖 |
| services/memory/ | 6 | 1 | ⚠️ 偏少 |
| services/embedding/ | 4 | 4 | ✅ |
| services/rag/ | 4 | 3 | ✅ |
| services/export/ | 1 | 3 | ✅ |
| services/search/ | 3 | 0 | ❌ 无单元测试 |
| services/judge/ | 1 | 0 | ❌ 无单元测试 |
| services/stats/ | 1 | 0 | ❌ 无单元测试 |
| ipc/ | 21 | 11 | ✅ |
| db/ | 4 + 22 migrations | 0 | ⚠️ migration 无测试 |

---

## 3. 模块依赖关系图

### 3.1 服务间依赖（基于代码 import 分析）

```
graph TD
    subgraph EntryPoint["入口 index.ts"]
        IDX["registerIpcHandlers()"]
    end

    subgraph IPC["IPC 层"]
        IPC_AI["ipc/ai.ts"]
        IPC_CTX["ipc/context.ts"]
        IPC_KG["ipc/knowledgeGraph.ts"]
        IPC_MEM["ipc/memory.ts"]
        IPC_PROJ["ipc/project.ts"]
        IPC_SK["ipc/skills.ts"]
        IPC_EMB["ipc/embedding.ts"]
        IPC_RAG["ipc/rag.ts"]
        IPC_OTHER["ipc/其他 13 个"]
    end

    subgraph Services["Service 层"]
        AI["aiService"]
        CTX["layerAssemblyService<br>(Context Engine)"]
        KG["kgService<br>(Query + Write + Matcher)"]
        MEM["memoryService<br>(Semantic + Episodic)"]
        DOC["documentService<br>(CRUD + Version + Branch)"]
        EMB["embeddingService<br>(ONNX + SemanticChunk)"]
        RAG["ragService<br>(Hybrid + Rerank)"]
        SK["skillService<br>(Load + Route + Schedule + Execute)"]
        SEARCH["ftsService + hybridRanking"]
        PROJ["projectService + templateService"]
    end

    subgraph Data["数据层"]
        DB[(SQLite<br>better-sqlite3)]
    end

    IDX --> IPC_AI & IPC_CTX & IPC_KG & IPC_MEM & IPC_PROJ & IPC_SK & IPC_EMB & IPC_RAG & IPC_OTHER

    IPC_AI --> AI & SK
    IPC_CTX --> CTX
    IPC_KG --> KG
    IPC_MEM --> MEM
    IPC_SK --> SK
    IPC_EMB --> EMB
    IPC_RAG --> RAG

    SK -->|"context assemble"| CTX
    CTX -->|"可选注入"| KG & MEM
    SK -->|"LLM 调用"| AI
    RAG --> EMB & SEARCH
    EMB -->|"ONNX 推理"| DB
    KG --> DB
    MEM --> DB
    DOC --> DB
    SEARCH --> DB
    PROJ --> DB

    style DB fill:#fff3e0,stroke:#FF9800
    style SK fill:#e8f4f8,stroke:#2196F3
```

### 3.2 依赖特征分析

> 📊

核心发现：Skill Executor 是最重的交叉点。 一次 Skill 执行涉及：Context Engine（可选注入 KG + Memory） → LLM 调用 → Streaming push → SQLite 多表写入。所有操作串行在主线程。

| 特征 | 现状 | 评估 |
| --- | --- | --- |
| DI 方式 | 手写依赖注入：入口 index.ts 显式 createXxxService(...) 传参 | ✅ 无全局单例、无 service locator，依赖清晰可追踪 |
| 循环依赖 | 未发现 import 级循环依赖 | ✅ |
| 耦合热点 | Skill Executor 横跨 Context + AI + KG + Memory | ⚠️ 功能正确但性能瓶颈 |
| 跨模块 import | Skills 依赖 Context 的 ContextAssembleResult 类型；Context 可选依赖 KG/Memory | ✅ 用 Pick<> 接口隔离，不是硬耦合 |
| IPC handler 构造模式 | handler 内部「就地构造」service（createDocumentService({ db, logger })） | ⚠️ 每次 IPC 调用都创建新 service 实例，无缓存/复用 |

---

## 4. 依赖注入模式

### 4.1 当前模式：手写 DI

```
// index.ts — 入口统一装配
const guardedIpcMain = createValidatedIpcMain({ ipcMain, logger, defaultTimeoutMs: 30_000 });

registerAiIpcHandlers({
  ipcMain: guardedIpcMain,
  db, logger, env, secretStorage,
  projectSessionBinding,
  // ...
});
```

```
// services/context/layerAssemblyService.ts — 可选依赖用 Pick<> 接口
kgService?: Pick<KnowledgeGraphService, "entityList">;
memoryService?: Pick<MemoryService, "previewInjection">;
```

### 4.2 优点与不足

| 优点 | 不足 |
| --- | --- |
| 依赖链透明，没有隐藏的全局状态 | IPC handler 内「就地构造」导致 service 实例不可复用 |
| 测试时可直接传 mock，无需 DI 框架 | 没有统一的 service 生命周期管理（无 dispose/teardown 钩子） |
| import 关系直观 | 随着模块增长，registerIpcHandlers 的参数列表会膨胀 |

---

## 5. 进程模型

### 5.1 现状：纯单线程

```
graph LR
    subgraph Main["Main Process（唯一线程）"]
        IPC["IPC Router"]
        SQLite["SQLite<br>better-sqlite3<br>同步 API"]
        ONNX["ONNX Runtime"]
        KG["KG 遍历"]
        FTS["FTS 重建"]
        FS["同步 FS I/O"]
        AI["LLM fetch + SSE"]
    end
    Renderer["Renderer Process"] -->|ipcRenderer.invoke| IPC
    IPC --> SQLite & ONNX & KG & FTS & FS & AI

    style Main fill:#ffebee,stroke:#f44336
```

> 🔴

零 Worker Thread / 零 UtilityProcess。 所有 CPU 密集（ONNX 推理、KG 遍历、FTS 重建）和 IO 密集（同步 FS、SQLite 写入）任务全部跑在主线程。任何一项运行时，Event Loop 被阻塞，IPC 请求排队等待。

### 5.2 主进程职责边界审计

| 职责 | 应在主进程？ | 当前位置 | 评估 |
| --- | --- | --- | --- |
| 窗口管理 | ✅ | ✅ 主进程 | ✅ 正确 |
| IPC 路由 + 校验 | ✅ | ✅ 主进程 | ✅ 正确 |
| 轻量 SQLite 读取 | ✅ | ✅ 主进程 | ✅ 正确 |
| LLM API 调用（网络 I/O） | ✅（非阻塞 fetch + SSE） | ✅ 主进程 | ✅ 正确 |
| ONNX 推理 | ❌ 应卸载 | ❌ 主进程同步执行 | 🔴 → ComputeProcess |
| KG 图遍历 / CTE | ❌ 应卸载 | ❌ 主进程 JS 层 BFS | 🔴 → ComputeProcess |
| FTS 全量重建 | ❌ 应卸载 | ❌ 主进程同步执行 | 🔴 → ComputeProcess |
| SQLite 所有写操作 | ❌ 应收口 | ❌ 主进程各 service 直接写 | 🔴 → DataProcess |
| 同步 FS（rmSync / cpSync） | ❌ 应卸载 | ❌ 主进程同步执行 | 🔴 → DataProcess |

### 5.3 目标架构：双进程卸载

```
graph TB
    subgraph Main["Main Process — 纯调度层"]
        Router["IPC Router + AbortController"]
        Lifecycle["三层生命周期管理"]
        RO["SQLite 只读（轻量读）"]
    end

    subgraph CP["ComputeProcess"]
        ONNX["ONNX 推理"]
        KG_CTE["KG CTE 遍历"]
        FTS2["FTS 重建/查询"]
        RO_CP["SQLite 只读（重量读）"]
    end

    subgraph DP["DataProcess"]
        RW["SQLite 读写（唯一写入者）"]
        FS2["同步 FS 操作"]
        TX["AI 事务合并"]
    end

    Renderer2["Renderer"] -->|invoke| Router
    Router --> CP & DP

    style Main fill:#e8f4f8,stroke:#2196F3
    style CP fill:#fff3e0,stroke:#FF9800
    style DP fill:#e8f5e9,stroke:#4CAF50
```

> 完整方案详见 → ‣

---

## 6. IPC 边界中间件

CN 已实现统一的 IPC 边界中间件 createValidatedIpcMain()，在所有 handler 外层自动执行：

```
graph LR
    A["IPC 请求进入"] --> B["ACL 检查<br>ipcAcl.ts"]
    B --> C["Request Schema 校验<br>runtime-validation.ts"]
    C --> D["Handler 执行<br>（带 timeout）"]
    D --> E["Response Schema 校验"]
    E --> F["Envelope 包装<br>{ ok: true/false }"]
    D -->|异常| G["统一错误映射<br>INTERNAL_ERROR / IPC_TIMEOUT"]
    G --> F

    style B fill:#fff3e0,stroke:#FF9800
    style C fill:#e8f4f8,stroke:#2196F3
    style G fill:#ffebee,stroke:#f44336
```

| 能力 | 实现 | 状态 |
| --- | --- | --- |
| Schema-first Type Map | ipc/contract/ipc-contract.ts → 生成 ipc-generated.ts | ✅ 已实现 |
| ACL（通道级访问控制） | ipc/ipcAcl.ts | ✅ 已实现 |
| Runtime Schema 校验 | ipc/runtime-validation.ts  • ipc/contract/schema.ts | ✅ 已实现（非 Zod，自研） |
| 统一超时 | 默认 30s，per-channel policy 可覆盖 | ✅ 已实现 |
| Envelope 规范 | { ok: true/false, ... }  • 稳定错误码 | ✅ 已实现 |
| Preload Bridge | window.creonow.invoke() via contextBridge | ✅ 安全模式 |
| 背压控制 | ipc/pushBackpressure.ts（chunk 可丢弃，控制事件必达） | ✅ 已实现 |

> ✅

IPC 层是 CN 后端工程质量最高的部分。 Schema-first + runtime 校验 + 统一 envelope + 超时 + ACL + 背压，形成了完整的边界防御。改造重点不在 IPC 层本身，而在其背后的 handler 调用链（同步阻塞、无取消语义）。

---

## 7. 安全模型

| 防线 | 实现 | 状态 |
| --- | --- | --- |
| Preload 隔离 | contextBridge.exposeInMainWorld('creonow', ...)，不暴露 ipcRenderer | ✅ |
| IPC 参数校验 | createValidatedIpcMain() 统一边界校验 | ✅ |
| 路径穿越防护 | services/context/contextFs.ts 路径 traversal guard | ✅ |
| 项目隔离 | ipc/projectSessionBinding.ts  • ipc/projectAccessGuard.ts | ✅ |
| API Key 加密存储 | safeStorage.encryptString  • __safe_storage_v1__: 前缀 | ✅ |
| Debug 通道管控 | ipc/debugChannelGate.ts 生产环境关闭 debug IPC | ✅ |
| 文件原子写入 | 多处直接 writeFileSync，未统一 temp+rename | ⚠️ 存在风险 |

---

## 8. 日志系统

- SSOT：logging/logger.ts

- 格式：结构化 JSONL

- 输出：userData/logs/main.log（fs.appendFileSync）

- 问题：appendFileSync 是同步 I/O，高频日志时会阻塞 Event Loop

---

## 9. 架构总判定

> 🔴

CN 后端的「设计」质量远超「运行时」质量。

IPC 层的类型安全、schema 校验、ACL、背压控制做得非常好，但 handler 背后的执行全部卡在单线程 + 同步阻塞模型上。产品定位是 AI 写作 IDE，运行时行为却是「单线程同步阻塞」的心智模型。

### 9.1 四大系统性缺陷

| 缺陷 | 根因 | 治理方案 |
| --- | --- | --- |
| A. 主线程无卸载能力 | 零 Worker / 零 UtilityProcess | → ‣ |
| B. 资源生命周期无闭环 | teardown 仅 db.close()，无 service 级清理 | → ‣ |
| C. AI 写入无防护 | 流式输出逐条写入 SQLite + IPC 无节流 | → ‣ |
| D. 基础配置缺失 | SQLite pragma 未调优、全局异常未捕获 | → ‣ |

### 9.2 架构优势（应保留）

- ✅ 手写 DI：依赖透明，无隐藏全局状态

- ✅ IPC 边界中间件：Schema-first + runtime 校验 + 统一 envelope

- ✅ 安全模型：Preload 隔离 + 路径穿越防护 + API Key 加密

- ✅ 模块按业务域划分：services/ 下按 ai/context/kg/memory/skills 等分目录

- ✅ 测试基础：单元 81 + 集成 81 + E2E 25（文件数口径）

### 9.3 重构方向

不需要推翻现有架构，而是在保留上述优势的基础上，补齐四个系统性缺陷：

```
graph LR
    A["当前：单线程同步阻塞"] -->|"补齐"| B["目标：双进程卸载 + 三层生命周期 + 读写分离"]
    B --> C["保留：手写 DI + IPC 中间件 + 安全模型 + 模块划分"]

    style A fill:#ffebee,stroke:#f44336
    style B fill:#e8f5e9,stroke:#4CAF50
    style C fill:#e8f4f8,stroke:#2196F3
```

---

## 10. 相关页面

- ‣ — Schema、DAO、读写策略详解

- ‣ — 142 通道逐项审计

- ‣ — 完整代码审计实况（A–G 分组）

- ‣ — 完整文件树
