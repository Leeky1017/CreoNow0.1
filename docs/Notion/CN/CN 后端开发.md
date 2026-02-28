# CN 后端开发

> Source: Notion local DB page `5c4da3e1-1bc7-46ca-868b-b50d2daa4fb9`

> ⚡

全部 21 项审计问题归因于：① 主线程无卸载能力 ② 资源生命周期无闭环 ③ IPC 缺少背压+取消语义 ④ SQLite 配置与全局健壮性不足。不分短期长期，每一项做到最优解，TDD 驱动。

---

## 定位

CN 的后端指 Electron 主进程（src/main/）及其承载的所有业务逻辑，包括：

- 上下文引擎（Context Engine）

- 知识图谱（Knowledge Graph）

- 记忆系统（Memory System）

- 技能系统（Skill System）

- 版本管理（Version Control）

- 文档管理（Document Management）

- 搜索与检索（Search & Retrieval）

- AI 服务层（AI Service / LLM 调用）

- IPC 通信层（进程间桥梁）

- SQLite 数据层（DAO / 持久化）

---

## 核心矛盾

> 产品定位是「AI 写作 IDE」，但后端实现却采用「单线程同步阻塞」的心智模型。

这种错位导致：

- AI 生成时主进程假死 — ONNX 推理、KG 遍历、FTS 重建全部卡在一个 JS 线程上

- 项目切换后内存只增不减 — 12 个无界 Map 没有生命周期管理，旧项目资源永不释放

- IPC 超时形同虚设 — timeout 只拒绝了 Promise，底层"幽灵任务"继续消耗资源

- Notion 的 AI 卡死教训 — "机枪式输出"撞上"逐条写入"存储，CN 必须提前防御

---

## 四大系统性缺陷 × 治理方案

| 缺陷 | 根因 | 治理方案 | 覆盖问题 |
| --- | --- | --- | --- |
| A. 主线程无卸载能力 | 零 Worker/UtilityProcess，所有 CPU/IO 密集任务跑在主线程 | ⚡ UtilityProcess 池设计 | #1 #2 #3 #5 #7 #11 |
| B. 资源生命周期无闭环 | 项目切换 teardown 为 no-op，Map 只进不出 | ♻️ 项目生命周期管理 | #12 #13 #14 #15 #16 #17 #18 |
| C. AI 写入无防护 | 流式输出逐条写入 SQLite + IPC 无节流 | 🛡️ AI 流式写入防护策略 | Notion 反面教材预防 |
| D. 基础配置缺失 | SQLite pragma 未调优、全局异常未捕获、窗口安全遗漏 | 🔒 全局健壮性加固 | #19 #20 #21 |

---

## 依赖关系图

```
graph TD
    A["🔒 全局健壮性加固"] --> |独立，随时| DONE["✅ 可部署"]
    B["🛡️ AI 流式写入防护"] --> |独立，随时| DONE
    C["⚡ UtilityProcess 双进程"] --> D["🔮 KG 查询层重构"]
    C --> E["🧬 Embedding & RAG 优化"]
    C --> F["🎯 Skill 系统优化"]
    G["♻️ 三层生命周期管理"] --> D
    G --> E
    G --> F
    D --> DONE
    E --> DONE
    F --> DONE
```

---

## 前后端并行推进节奏

> 🔗

IPC 契约同步机制：@shared/types/ipc-generated.ts（79KB，自动生成）是前后端唯一的共享契约。后端改 handler 签名后重新生成，前端 TypeScript 编译器自动标红不兼容调用点。无需额外的前置对齐工作。

| 阶段 | 前端（‣） | 后端（本页） | 同步点 |
| --- | --- | --- | --- |
| Stage 1 | Phase 1 止血（Token 清扫 / 原生元素替换 / Z-Index 统一） | ⚡ UtilityProcess 双进程架构 + 💾 数据层调优 | 无 — 完全独立 |
| Stage 2 | Phase 2 AppShell 拆分 + IPC 调用收敛到 service 层 | 🔮 KG 查询层 + 🧬 Embedding & RAG + 📡 IPC handler 重构（AbortController / envelope） | ipc-generated.ts 重新生成 — 后端改 handler 签名后跑一次 codegen，前端适配编译错误 |
| Stage 3 | Phase 3 微交互 + Phase 4 视觉精磨 | 🎯 Skill 系统 + 🔒 全局健壮性 + 🛡️ AI 流式写入 | 无 — 完全独立 |
| 贯穿全程 | 前端测试策略 | 🧪 后端测试策略（TDD 驱动，contract test 先行） | 无 |

### 并行原则

1. 90% 的工作互不阻塞 — 前端 Token/组件/视觉 与 后端 进程架构/数据层/KG/Embedding 完全独立

1. 唯一同步点是 IPC 签名变更 — 后端改了 handler 签名 → 重新生成 ipc-generated.ts → 前端适配编译错误，这是正常的 monorepo 开发流

1. ♻️ 生命周期管理和 🔒 全局健壮性随时可做 — 不依赖任何前端工作，依赖图中也是独立节点

1. 不分短期长期 — 每一项做到能力范围内的最优解，TDD 驱动，全部完整实现

---

## 子页面索引

### 🏗️ 架构侧

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

> 📡

CN 的 IPC 层是后端工程质量最高的部分。 Schema-first type map + runtime 校验 + 统一 envelope + ACL + 超时 + 背压，形成了完整的边界防御。本文档审计 142 个 IPC 通道的组织方式、安全合规性、以及双进程架构引入后的变化。

---

## 1. IPC 概况

| 指标 | 数值 | SSOT |
| --- | --- | --- |
| 通道总数 | 142 | ipc/contract/ipc-contract.ts |
| 业务域数 | 15 | 按通道名称前缀分组 |
| Handler 文件数 | 21 | ipc/*.ts |
| 测试文件数 | 11 | ipc/__tests__/*.test.ts |
| 生成的 TypeMap | IpcChannelSpec  • IpcRequest/C  • IpcInvokeResult/C | packages/shared/types/ipc-generated.ts |

完整通道清单 → ‣

---

## 2. 六大原则合规审计

| 原则 | 要求 | 实现 | 评估 |
| --- | --- | --- | --- |
| Schema-first Type Map | TypeScript 类型映射，禁止裸字符串 + any | ipc/contract/ipc-contract.ts → 生成 ipc-generated.ts（IpcChannelSpec 全量类型覆盖） | ✅ 达标 |
| 按业务域组织 | 通道按域分组，handler 文件按域拆分 | 15 个域前缀（ai: / context: / knowledge: / memory: / project: / version: 等），handler 文件 1:1 对应 | ✅ 达标 |
| 三种通信模式明确 | invoke/handle · send/on · webContents.send/on | Request-Response: ipcMain.handle；Push: webContents.send（AI streaming / distill progress）；无 Fire-and-Forget | ✅ 达标 |
| Preload Bridge 安全模式 | contextBridge.exposeInMainWorld，禁止直接 ipcRenderer | window.creonow.invoke() via contextBridge，preload 仅暴露 invoke + stream 订阅管理 | ✅ 达标 |
| 运行时参数校验 | schema validation（Zod 或类似） | ipc/runtime-validation.ts  • ipc/contract/schema.ts（自研，非 Zod） | ✅ 达标 |
| 统一错误处理 | 结构化错误格式，全局异常拦截 | createValidatedIpcMain() 统一 envelope { ok: true/false }，异常映射为稳定错误码 | ✅ 达标 |

> ✅

六大原则全部达标。 这在 Electron 应用中属于相当高的工程标准。

---

## 3. IPC 边界中间件架构

### 3.1 createValidatedIpcMain() 处理流程

```
graph LR
    A["IPC 请求"] --> B["ACL 检查<br>ipcAcl.ts"]
    B -->|拒绝| X1["403 ACL_DENIED"]
    B -->|通过| C["Request Schema 校验"]
    C -->|失败| X2["400 VALIDATION_ERROR"]
    C -->|通过| D["Handler 执行<br>runWithTimeout()"]
    D -->|超时| X3["408 IPC_TIMEOUT"]
    D -->|异常| X4["500 INTERNAL_ERROR"]
    D -->|正常| E["Response Schema 校验"]
    E --> F["Envelope 返回<br>{ ok, data/error }"]

    style X1 fill:#ffebee,stroke:#f44336
    style X2 fill:#ffebee,stroke:#f44336
    style X3 fill:#ffebee,stroke:#f44336
    style X4 fill:#ffebee,stroke:#f44336
    style F fill:#e8f5e9,stroke:#4CAF50
```

### 3.2 中间件组件清单

| 组件 | 文件 | 职责 |
| --- | --- | --- |
| ACL | ipc/ipcAcl.ts | 通道级访问控制（允许/拒绝/条件） |
| Runtime Validation | ipc/runtime-validation.ts | request/response schema 校验 + timeout 包装 |
| Contract Schema | ipc/contract/schema.ts | 每个通道的 request/response 校验规则定义 |
| Contract Type Map | ipc/contract/ipc-contract.ts | SSOT：通道名 → 请求类型 → 响应类型 |
| Error Mapping | ipc/dbError.ts | DB 错误 → IPC 错误码映射 |
| Debug Gate | ipc/debugChannelGate.ts | 生产环境关闭 debug 通道（db:debug:*） |
| Project Guard | ipc/projectAccessGuard.ts | 项目级访问隔离 |
| Session Binding | ipc/projectSessionBinding.ts | 项目 ↔ 会话绑定 |
| Push Backpressure | ipc/pushBackpressure.ts | AI streaming push 背压（chunk 可丢弃，控制事件必达） |

---

## 4. Preload 暴露接口

SSOT：apps/desktop/preload/src/index.ts

暴露到 window.creonow（不是 window.electronApi）：

| 接口 | 用途 | 通信模式 |
| --- | --- | --- |
| invoke(channel, payload) | 所有 Request-Response IPC | ipcRenderer.invoke → ipcMain.handle |
| stream.registerAiStreamConsumer() | 注册 AI streaming 订阅 | ipcRenderer.on → webContents.send |
| stream.releaseAiStreamConsumer() | 释放 AI streaming 订阅 | 清理 listener |
| __CN_E2E_ENABLED__ | E2E 测试标志 | 静态值 |

> ✅

最小暴露原则。 渲染进程无法直接 ipcRenderer.send()，所有通信必须走 window.creonow.invoke() 管道。

---

## 5. 按域逐项审计

### 5.1 通道分布统计

| 域前缀 | 通道数 | Handler 文件 | 通信模式 |
| --- | --- | --- | --- |
| ai: | 10 | ipc/ai.ts  • ipc/aiProxy.ts | RR + Push（streaming） |
| project: | 15 | ipc/project.ts | RR |
| knowledge: | 15 | ipc/knowledgeGraph.ts | RR |
| memory: | 16 | ipc/memory.ts | RR + Push（distill progress） |
| context: | 10 | ipc/context.ts  • ipc/contextAssembly.ts  • ipc/contextBudget.ts  • ipc/contextFs.ts | RR |
| file: | 10 | ipc/file.ts | RR |
| version: | 11 | ipc/version.ts | RR |
| search: | 5 | ipc/search.ts | RR |
| skill: | 7 | ipc/skills.ts | RR |
| export: | 5 | ipc/export.ts | RR |
| embedding: | 3 | ipc/embedding.ts | RR |
| rag: | 3 | ipc/rag.ts | RR |
| constraints: | 6 | ipc/constraints.ts | RR |
| judge: | 3 | ipc/judge.ts | RR |
| stats: | 2 | ipc/stats.ts | RR |
| app: | 4 | ipc/window.ts | RR |
| db: | 1 | debug 通道（生产环境禁用） | RR |
| 合计 | 142 (含 push 通道) |  |  |

### 5.2 按域关键审计

🤖 AI 域（10 通道）

最复杂的域，涉及 skill 执行全链路：

| 通道 | 功能 | 备注 |
| --- | --- | --- |
| ai:skill:run | 执行技能（核心入口） | 触发 Context 装配 → LLM 调用 → Streaming push |
| ai:skill:cancel | 取消正在执行的技能 | 涉及 AbortController |
| ai:skill:feedback | 反馈（accept/reject） | 写入 skill_feedback |
| ai:chat:send/list/clear | 聊天历史管理 |  |
| ai:config:get/update/test | AI 配置（provider/key） | 涉及 safeStorage 加解密 |
| ai:models:list | 可用模型列表 |  |

Push 通道（webContents.send，不在 142 计数内）：

- SKILL_STREAM_CHUNK_CHANNEL — AI 流式输出 chunk

- SKILL_STREAM_DONE_CHANNEL — 流式输出完成

- SKILL_QUEUE_STATUS_CHANNEL — 队列状态变化

📂 Project 域（15 通道）

项目 CRUD + 生命周期管理：

| 通道 | 功能 | 备注 |
| --- | --- | --- |
| project:project:create/delete/rename/update | 基础 CRUD |  |
| project:project:list/getcurrent/setcurrent | 列表与当前项目 |  |
| project:project:switch | 项目切换 | 当前仅写 DB + 切内存绑定，无 teardown |
| project:project:duplicate | 复制项目 | 涉及同步 FS（cpSync） |
| project:project:archive/stats | 归档 / 统计 |  |
| project:project:createaiassist | AI 辅助创建项目 |  |
| project:lifecycle:archive/get/purge/restore | 项目生命周期状态机 |  |

> ⚠️

project:project:switch 是审计发现的核心风险点：switchKnowledgeGraphContext / switchMemoryContext 实际是 no-op，旧项目资源不释放。

🔮 Knowledge 域（15 通道）

KG 实体 + 关系 CRUD + 查询 + 识别：

| 类别 | 通道 | 备注 |
| --- | --- | --- |
| 实体 CRUD | knowledge:entity:create/read/update/delete/list |  |
| 关系 CRUD | knowledge:relation:create/update/delete/list |  |
| 图查询 | knowledge:query:byids/path/relevant/subgraph/validate | 主线程 JS 层遍历，应迁移 ComputeProcess |
| 识别运行时 | knowledge:recognition:enqueue/cancel/stats |  |
| 规则注入 | knowledge:rules:inject |  |
| 建议 | knowledge:suggestion:accept/dismiss |  |

🧠 Memory 域（16 通道）

记忆系统最多的域（16 通道），涵盖三层记忆：

| 类别 | 通道 | 备注 |
| --- | --- | --- |
| 基础 CRUD | memory:entry:create/delete/list/update | user_memory 表 |
| 语义记忆 | memory:semantic:add/delete/distill/list/update | 含蒸馏（episodic→semantic） |
| 情景记忆 | memory:episode:query/record |  |
| 注入预览 | memory:injection:preview | Context Engine 注入前预览 |
| 作用域 | memory:scope:promote | 项目级→全局提升 |
| 清理 | memory:clear:all/project |  |
| 设置 | memory:settings:get/update |  |
| Trace | memory:trace:feedback/get |  |

Push 通道：memory:distill:progress（蒸馏进度广播）

📄 File / Document 域（10 通道）

文档 CRUD + 当前文档管理：

| 通道 | 功能 |
| --- | --- |
| file:document:create/delete/read/save/update/updatestatus | 文档 CRUD |
| file:document:list/reorder | 列表和排序 |
| file:document:getcurrent/setcurrent | 当前文档切换 |

📝 Version 域（11 通道）

版本管理 + 分支 + 合并：

| 类别 | 通道 |
| --- | --- |
| 快照 | version:snapshot:create/list/read/diff/restore/rollback |
| 分支 | version:branch:create/list/merge/switch |
| 冲突 | version:conflict:resolve |
| AI | version:aiapply:logconflict |

其他域（Context / Search / Skill / Export / Embedding / RAG / Constraints / Judge / Stats / App）

| 域 | 通道数 | 关键点 |
| --- | --- | --- |
| context: | 10 | 四层 Context 装配 + 预算管理 + watch |
| search: | 5 | FTS + 混合排名 + 搜索替换 |
| skill: | 7 | 自定义技能 CRUD + 注册表管理 |
| export: | 5 | markdown / txt / docx / pdf / project bundle |
| embedding: | 3 | 语义索引 + 向量搜索 + 生成 |
| rag: | 3 | RAG 配置 + 检索 |
| constraints: | 6 | 约束策略 CRUD |
| judge: | 3 | Judge 模型管理 + 质量评估 |
| stats: | 2 | 今日统计 + 范围统计 |
| app: | 4 | 窗口管理（close/minimize/maximize/ping） |

---

## 6. 错误处理体系

### 6.1 错误码规范

所有 IPC 响应统一为 envelope 格式：

```
// 成功
{ ok: true, data: T }

// 失败
{ ok: false, error: { code: string, message: string } }
```

已知错误码：

| 错误码 | 来源 | 含义 |
| --- | --- | --- |
| INTERNAL_ERROR | 中间件兜底 | 未捕获异常，不泄露错误细节 |
| IPC_TIMEOUT | 中间件 timeout | handler 执行超时（默认 30s） |
| VALIDATION_ERROR | 中间件 schema 校验 | request/response 格式不合法 |
| ACL_DENIED | 中间件 ACL | 通道访问被拒绝 |
| 业务错误码 | 各 service → mapDocumentErrorToIpcError 等 | 业务域特定错误（NOT_FOUND / CONFLICT 等） |

### 6.2 关键保障

- Handler 内部不需要 try/catch — 中间件统一兜底

- 异常不泄漏到 IPC — 未捕获异常包装为 INTERNAL_ERROR

- 超时保护 — 默认 30s，per-channel policy 可覆盖

- Promise rejection 不遗漏 — runWithTimeout 确保 timeout 后 reject

---

## 7. IPC 测试覆盖

| 测试文件 | 测试内容 |
| --- | --- |
| ai-chat-project-isolation.test.ts | AI 聊天项目隔离 |
| ai-config-ipc.test.ts | AI 配置 IPC 正确性 |
| contextIpcSplit.*.test.ts (3 files) | Context IPC 拆分的聚合/依赖/路由测试 |
| debug-channel-gate.test.ts | Debug 通道生产环境禁用 |
| document-error-mapping.test.ts | 文档错误码映射 |
| ipcAcl.test.ts | ACL 规则正确性 |
| project-access-guard.test.ts | 项目访问隔离 |
| projectSessionBinding.test.ts | 项目会话绑定 |
| runtimeValidation.acl.test.ts | Runtime 校验 + ACL 集成 |
| window-ipc.test.ts | 窗口管理 IPC |

---

## 8. 双进程架构后的 IPC 变化

引入 ComputeProcess + DataProcess 后，IPC 通信从二层（Renderer ↔ Main）变为三层：

### 8.1 通信拓扑变化

```
graph TB
    subgraph Before["当前：二层"]
        R1["Renderer"] -->|"ipcRenderer.invoke"| M1["Main<br>（直接执行）"]
    end

    subgraph After["目标：三层"]
        R2["Renderer"] -->|"ipcRenderer.invoke"| M2["Main<br>（路由 + 调度）"]
        M2 -->|"postMessage"| CP["ComputeProcess"]
        M2 -->|"postMessage"| DP["DataProcess"]
        CP -->|"result"| M2
        DP -->|"result"| M2
    end

    style Before fill:#ffebee,stroke:#f44336
    style After fill:#e8f5e9,stroke:#4CAF50
```

### 8.2 通道路由表（目标）

> 🔑

原则：Renderer 侧的 IPC 通道不变。 路由决策在 Main 的 handler 内部完成，对渲染进程透明。

| 路由目标 | 涉及通道（示例） | 原因 |
| --- | --- | --- |
| Main 直接处理 | app:window:* / project:project:getcurrent / context:settings:read / stats:* | 轻量读或窗口管理，无需跨进程 |
| → ComputeProcess | embedding:text:generate / embedding:semantic:search / search:fts:query / search:fts:reindex / knowledge:query:* / rag:context:retrieve | CPU 密集（ONNX / KG CTE / FTS） |
| → DataProcess | 所有涉及 INSERT/UPDATE/DELETE 的通道（file:document:save / knowledge:entity:create / memory:entry:create 等） | 写操作统一走 DataProcess |
| Main → Compute → Data | ai:skill:run（Context 装配在 Main → ONNX 在 Compute → trace 写入在 Data） | 复合链路 |

### 8.3 新增进程间消息通道

双进程架构引入后，Main ↔ UtilityProcess 之间会新增内部通信协议（不暴露给渲染进程）：

| 消息类型 | 方向 | 用途 |
| --- | --- | --- |
| task | Main → Utility | 提交任务 |
| abort | Main → Utility | 取消任务 |
| shutdown | Main → Utility | 优雅关闭 |
| switch-project | Main → Utility | 切换 SQLite DB 文件 |
| result | Utility → Main | 任务完成 |
| error | Utility → Main | 任务失败 |
| ready | Utility → Main | 进程就绪 |

> 消息协议完整定义见 → ‣

---

## 9. 审计发现与改进方向

### 9.1 IPC 层本身（质量高，改动小）

| 方面 | 现状 | 改进 |
| --- | --- | --- |
| 六大原则 | ✅ 全部达标 | 保持 |
| Preload 安全 | ✅ 最小暴露 | 保持 |
| 错误处理 | ✅ 统一 envelope + 稳定错误码 | 保持 |
| 背压控制 | ✅ push 通道有丢弃策略 | 保持 |
| 超时机制 | ✅ 默认 30s | ⚠️ timeout 后"幽灵任务"继续消耗资源 → 需要 AbortController 联动 |

### 9.2 Handler 层（核心改造点）

| 问题 | 影响 | 治理方案 |
| --- | --- | --- |
| Handler 直接同步执行 service | CPU/IO 密集任务阻塞主线程 | → 路由到 ComputeProcess / DataProcess |
| IPC timeout 不联动 AbortController | timeout 后底层任务仍在执行（"幽灵任务"） | → BackgroundTaskRunner 的 abort 机制 |
| Handler 就地构造 service 实例 | 每次 IPC 调用都 new，无缓存 | → ♻️ 三层生命周期管理中统一 service 实例管理 |
| project:project:switch 无 teardown | 旧项目资源不释放 | → ♻️ 三层生命周期管理 |

---

## 10. 相关页面

- ‣ — 完整通道清单

- ‣ — §7 进程间通信协议

- ‣ — §6 IPC 边界中间件

- ‣ — handler service 实例管理

### 🧠 核心模块侧

> ⚡

核心基础设施 — 所有后续优化的前置依赖。

为 CN 主进程引入 2 个固定用途的 UtilityProcess，将所有 CPU/IO 密集任务从主线程卸载到独立进程，主进程退化为纯调度层 + 轻量只读数据层。

---

## 1. 现状问题

当前 src/main/ 目录中 零 Worker / 零 UtilityProcess，所有任务跑在同一个 JS 线程：

| 阻塞源 | 具体操作 | 预估耗时 | 问题编号 |
| --- | --- | --- | --- |
| ONNX 推理 | onnxruntime-node 同步 encode，autosave 时触发 | 50–200ms/次 | P0 #1 |
| FTS 重建 | 全量 rebuildIndex 跑在主线程 | 200–500ms | P0 #2 |
| KG 全量拉图 | getAllNodes()  • getAllEdges() 全表扫描 | 100–300ms（万级节点） | P0 #3 |
| KG BFS | getRelatedNodes O(n²) 遍历 | 与节点数平方成正比 | P0 #5 |
| RAG rerank | FTS + embedding 推理串行同步 | 100–400ms | P1 #11 |
| 项目删除/复制 | rmSync / cpSync 大量同步 FS | 取决于项目大小 | P1 #7 |

核心矛盾：以上操作全部串行地占据 Event Loop，任何一项运行时，IPC 请求（包括渲染进程的 UI 响应）都会被阻塞。

---

## 2. 架构总图

```
graph TB
    subgraph MainProcess["Main Process — 纯调度层"]
        Router["IPC Router<br>请求分发 + AbortController"]
        Lifecycle["Lifecycle Manager<br>App/Project/Session 三层"]
        SQLiteRO_Main["SQLite 只读连接<br>轻量读: settings / metadata"]
    end

    subgraph CP["ComputeProcess — CPU 密集"]
        ONNX["ONNX Runtime<br>embedding encode"]
        KGCTE["KG 图遍历<br>递归 CTE"]
        FTS["FTS 全文搜索<br>rebuild / query"]
        SQLiteRO_CP["SQLite 只读连接<br>重量读: KG / FTS / embedding"]
    end

    subgraph DP["DataProcess — IO 密集 + 唯一写入者"]
        SQLiteRW["SQLite 读写连接<br>所有 INSERT / UPDATE / DELETE"]
        FSSync["同步 FS 操作<br>项目删除 / 复制 / Skill 文件"]
        TxMerge["AI 流式写入<br>Chunk Batching + 事务合并"]
    end

    Router -->|"postMessage(task)"| CP
    Router -->|"postMessage(task)"| DP
    CP -->|"result / error"| Router
    DP -->|"result / error"| Router

    style MainProcess fill:#e8f4f8,stroke:#2196F3
    style CP fill:#fff3e0,stroke:#FF9800
    style DP fill:#e8f5e9,stroke:#4CAF50
```

---

## 3. 选型决策：UtilityProcess > Worker Thread

> 🔑

结论：使用 Electron 的 utilityProcess.fork()，不使用 Node.js worker_threads。

| 维度 | UtilityProcess | Worker Thread |
| --- | --- | --- |
| Native Addon | ✅ 独立 V8 实例，better-sqlite3 / onnxruntime-node 直接加载 | ⚠️ native addon 需显式支持 worker_threads，better-sqlite3 可用但有坑 |
| 崩溃隔离 | ✅ 独立进程，崩溃不影响主进程 | ❌ 同一进程，未捕获异常会拖垮整个 Node 进程 |
| 内存隔离 | ✅ 独立堆，OOM 不影响主进程 | ❌ 共享地址空间，内存泄漏互相影响 |
| Electron 集成 | ✅ 一等公民，有 MessagePort、parentPort | ⚠️ 需手动管理，非 Electron 推荐方案 |
| 调试 | ⚠️ 需单独 attach debugger | ✅ 同一进程，调试简单 |

调试劣势可接受：通过在 fork() 时传入 --inspect=PORT 参数解决，开发模式自动启用。

---

## 4. 两个进程的职责划分

> ⚠️

关键取舍：不做进程池。 CN 是单用户桌面应用，不需要进程池调度、负载均衡、动态扩缩容。2 个固定进程 + 各自内部的串行任务队列，足以覆盖所有场景。池化调度的复杂度在单用户场景下 ROI 极低。

### 4.1 ComputeProcess — CPU 密集型

入驻条件：消耗 CPU 时间 > 16ms（一帧），会导致 Event Loop 饥饿的操作。

| 任务类型 | 当前实现 | 迁移后 |
| --- | --- | --- |
| ONNX embedding encode | onnxruntime-node 在主线程同步推理 | ComputeProcess 内推理，主线程 await submit() |
| KG 图遍历 | JS 层 BFS getAllNodes()  • 内存遍历 | 递归 CTE 跑在 ComputeProcess 的只读 SQLite 连接上 |
| FTS 重建 / 查询 | rebuildIndex 在主线程全量扫描 | ComputeProcess 持有 FTS 索引，增量更新 |
| RAG rerank | FTS query + ONNX 重排序同步串行 | ComputeProcess 内完成全部 retrieve + rerank 流水线 |

内部调度：串行任务队列。理由：ONNX 推理和 KG 遍历都是 CPU 密集型，并行跑反而因为线程竞争更慢。用户不会同时触发搜索和 embedding。

### 4.2 DataProcess — IO 密集型 + 唯一写入者

入驻条件：涉及 SQLite 写操作、同步文件系统操作、或需要事务合并的批量写入。

| 任务类型 | 当前实现 | 迁移后 |
| --- | --- | --- |
| SQLite 所有写操作 | 主线程直接 db.prepare().run() | DataProcess 持有唯一读写连接，主线程发消息写入 |
| AI 流式写入 | 每个 token 逐条 INSERT（机枪式写入） | DataProcess 内 Chunk Batching + 事务合并（详见 🛡️ AI 流式写入防护策略） |
| 项目删除 / 复制 | rmSync / cpSync 阻塞主线程 | DataProcess 异步执行，主线程只发指令 |
| Skill 文件 I/O | readdirSync / readFileSync / writeFileSync | DataProcess 执行，结果通过 IPC 返回 |
| embedding upsert | 主线程写入 embedding 向量表 | DataProcess 批量 upsert，与推理解耦 |

内部调度：

- 写操作：串行队列，保证事务一致性，避免 WAL checkpoint 竞争

- FS 操作：独立队列，与 SQLite 写操作互不阻塞（不同资源）

---

## 5. SQLite 读写分离（核心架构决策）

> 🔑

原则：一写多读。DataProcess 是唯一写入者，Main + ComputeProcess 只读。

SQLite WAL 模式天然支持一写多读并发，三个连接互不阻塞。

### 5.1 连接分布

```
graph LR
    subgraph Main["Main Process"]
        M_DB["better-sqlite3<br>readonly: true<br>PRAGMA query_only = ON"]
    end
    subgraph Compute["ComputeProcess"]
        C_DB["better-sqlite3<br>readonly: true<br>PRAGMA query_only = ON"]
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

### 5.2 各进程访问规则

| 进程 | 可执行的 SQL | 典型查询 | 连接打开方式 |
| --- | --- | --- | --- |
| Main | SELECT only | getProjectById、getCurrentProjectId、settings、document metadata | new Database(path, { readonly: true }) |
| ComputeProcess | SELECT only（含复杂 CTE） | KG 递归遍历、FTS match、embedding 向量检索 | new Database(path, { readonly: true }) |
| DataProcess | SELECT / INSERT / UPDATE / DELETE | 所有写操作、事务合并、WAL checkpoint | new Database(path) — 默认读写 |

### 5.3 WAL 配置（DataProcess 负责）

```
-- DataProcess 启动时执行
PRAGMA journal_mode = WAL;
PRAGMA wal_autocheckpoint = 1000;   -- 每 1000 页自动 checkpoint
PRAGMA busy_timeout = 5000;          -- 写冲突等待 5s（理论上不会发生，作为安全网）
PRAGMA synchronous = NORMAL;         -- WAL 模式下 NORMAL 足够安全
PRAGMA cache_size = -64000;          -- 64MB page cache
PRAGMA mmap_size = 268435456;        -- 256MB mmap

-- 只读连接（Main / ComputeProcess）
PRAGMA query_only = ON;
PRAGMA cache_size = -16000;          -- 16MB（读连接无需大缓存）
PRAGMA mmap_size = 268435456;        -- 256MB mmap（共享同一映射）
```

### 5.4 迁移策略：写操作收口

当前代码中所有直接调用 db.prepare(...).run() 的写操作需要逐步收口到 DataProcess：

1. 第一步：在现有 DAO 层创建 WriteProxy 接口，所有写操作调用 WriteProxy.execute(sql, params)

1. 第二步：WriteProxy 初始实现 = 直接执行（行为不变，验证接口正确性）

1. 第三步：WriteProxy 替换为 IPC 实现 = 消息发给 DataProcess 执行

1. TDD：每一步都有 contract test 保证行为一致

---

## 6. BackgroundTaskRunner 抽象

这是两个 UtilityProcess 共用的核心抽象，封装了「提交任务 → 等待结果 → 超时 / 取消 / 崩溃恢复」的完整语义。

### 6.1 接口定义

```
interface TaskOptions {
  taskId: string;
  type: string;           // 'onnx-encode' | 'kg-traverse' | 'fts-rebuild' | 'sql-write' | ...
  payload: unknown;
  timeoutMs?: number;     // 默认 30_000
  signal?: AbortSignal;   // 外部取消
}

interface TaskResult<T> {
  taskId: string;
  status: 'completed' | 'error' | 'timeout' | 'aborted' | 'crashed';
  data?: T;
  error?: { message: string; stack?: string };
  durationMs: number;
}

interface BackgroundTaskRunner {
  /** 提交任务，返回 Promise 等结果 */
  submit<T>(options: TaskOptions): Promise<TaskResult<T>>;

  /** 主动取消一个正在执行的任务 */
  abort(taskId: string): void;

  /** 崩溃回调 */
  onCrash(callback: (exitCode: number) => void): void;

  /** 优雅关闭：等待正在执行的任务完成（或超时），然后 kill 进程 */
  shutdown(gracePeriodMs?: number): Promise<void>;
}
```

### 6.2 五状态机

```
stateDiagram-v2
    [*] --> Submitted: submit()
    Submitted --> Running: 进程取出执行
    Running --> Completed: 正常返回
    Running --> TimedOut: 超过 timeoutMs
    Running --> Aborted: abort() 或 AbortSignal
    Running --> Crashed: 进程异常退出
    TimedOut --> [*]: reject(TimeoutError)
    Aborted --> [*]: reject(AbortError)
    Crashed --> [*]: reject(CrashError) + 触发重启
    Completed --> [*]: resolve(result)
```

### 6.3 内部实现要点

```
class UtilityProcessTaskRunner implements BackgroundTaskRunner {
  private process: Electron.UtilityProcess | null = null;
  private pending = new Map<string, PendingTask>();
  private queue: TaskOptions[] = [];          // 串行队列
  private currentTask: string | null = null;

  async submit<T>(options: TaskOptions): Promise<TaskResult<T>> {
    return new Promise((resolve, reject) => {
      const pending: PendingTask = {
        options,
        resolve,
        reject,
        timer: setTimeout(() => this.handleTimeout(options.taskId), options.timeoutMs ?? 30_000),
      };

      // AbortSignal 联动
      if (options.signal) {
        options.signal.addEventListener('abort', () => this.abort(options.taskId), { once: true });
      }

      this.pending.set(options.taskId, pending);
      this.queue.push(options);
      this.drain();
    });
  }

  private drain(): void {
    if (this.currentTask || this.queue.length === 0) return;
    const next = this.queue.shift()!;
    this.currentTask = next.taskId;
    this.process!.postMessage({ type: 'task', taskId: next.taskId, taskType: next.type, payload: next.payload });
  }

  private handleMessage(msg: { type: string; taskId: string; result?: unknown; error?: unknown }): void {
    if (msg.type === 'result') {
      const p = this.pending.get(msg.taskId);
      if (p) {
        clearTimeout(p.timer);
        this.pending.delete(msg.taskId);
        p.resolve({ taskId: msg.taskId, status: 'completed', data: msg.result, durationMs: /*...*/ });
      }
      this.currentTask = null;
      this.drain(); // 处理队列中下一个
    }
  }

  // ... handleTimeout, abort, onCrash, shutdown 省略（见下文）
}
```

---

## 7. 进程间通信协议

### 7.1 消息格式

```
// Main → UtilityProcess
type TaskMessage = {
  type: 'task';
  taskId: string;
  taskType: string;
  payload: unknown;
};

type AbortMessage = {
  type: 'abort';
  taskId: string;
};

type ShutdownMessage = {
  type: 'shutdown';
  gracePeriodMs: number;
};

// UtilityProcess → Main
type ResultMessage = {
  type: 'result';
  taskId: string;
  result: unknown;
  durationMs: number;
};

type ErrorMessage = {
  type: 'error';
  taskId: string;
  error: { message: string; stack?: string; code?: string };
};

type ReadyMessage = {
  type: 'ready';
  processType: 'compute' | 'data';
  pid: number;
};
```

### 7.2 通信流程（正常路径）

```
sequenceDiagram
    participant M as Main Process
    participant CP as ComputeProcess

    Note over CP: fork() 启动
    CP->>M: { type: 'ready', processType: 'compute', pid }
    M->>CP: { type: 'task', taskId: 'embed-1', taskType: 'onnx-encode', payload: { text } }
    Note over CP: ONNX 推理中...
    CP->>M: { type: 'result', taskId: 'embed-1', result: { vector }, durationMs: 85 }
```

### 7.3 通信流程（取消路径）

```
sequenceDiagram
    participant M as Main Process
    participant CP as ComputeProcess

    M->>CP: { type: 'task', taskId: 'kg-1', taskType: 'kg-traverse', payload }
    Note over CP: CTE 执行中...
    Note over M: 用户切换了项目
    M->>CP: { type: 'abort', taskId: 'kg-1' }
    Note over CP: 检测到 abort，中断当前操作
    CP->>M: { type: 'error', taskId: 'kg-1', error: { message: 'Aborted', code: 'ABORT' } }
```

---

## 8. 崩溃恢复策略

> 🛡️

原则：任何一个 UtilityProcess 崩溃，不能导致应用不可用。主进程必须能自动恢复。

### 8.1 崩溃检测

```
// 主进程中
utilityProcess.on('exit', (code) => {
  if (code !== 0) {
    logger.error(`[${processType}] crashed with code ${code}`);
    this.handleCrash(code);
  }
});
```

### 8.2 恢复流程

```
graph TD
    A["检测到 exit(code≠0)"] --> B["reject 所有 pending tasks<br>status: 'crashed'"]
    B --> C{"重启次数 < 3？"}
    C -->|是| D["延迟 500ms 重启进程"]
    C -->|否| E["进入降级模式<br>主线程兜底执行"]
    D --> F["等待 ready 消息"]
    F --> G["重新打开 SQLite 连接"]
    G --> H["从队列中恢复等待中的任务"]
    E --> I["记录到 telemetry<br>提示用户重启应用"]
```

### 8.3 降级模式

当 UtilityProcess 连续崩溃 3 次，进入降级模式：

- ComputeProcess 降级：ONNX / KG / FTS 回退到主线程同步执行（回到当前行为），记录警告

- DataProcess 降级：主进程临时打开读写连接直接写入（回到当前行为），记录警告

- 降级模式下，UI 显示一个不阻塞的提示：「部分功能在后台进程中运行异常，重启应用可恢复最佳性能」

---

## 9. 进程生命周期管理

### 9.1 启动时序

```
sequenceDiagram
    participant App as app.on('ready')
    participant M as Main Process
    participant CP as ComputeProcess
    participant DP as DataProcess

    App->>M: 应用启动
    par 并行 fork
        M->>CP: utilityProcess.fork('compute-process.js')
        M->>DP: utilityProcess.fork('data-process.js')
    end
    CP->>M: { type: 'ready' }
    DP->>M: { type: 'ready' }
    Note over M: 两个进程 ready 后，才开始处理 IPC 请求
    M->>M: 开始接收渲染进程的 IPC 调用
```

### 9.2 关闭时序

```
sequenceDiagram
    participant App as app.on('before-quit')
    participant M as Main Process
    participant CP as ComputeProcess
    participant DP as DataProcess

    App->>M: before-quit
    M->>M: 停止接收新 IPC 请求
    par 并行 shutdown
        M->>CP: { type: 'shutdown', gracePeriodMs: 5000 }
        M->>DP: { type: 'shutdown', gracePeriodMs: 5000 }
    end
    Note over CP: 完成当前任务 → 关闭 SQLite → exit(0)
    Note over DP: 完成当前写入 → flush WAL → 关闭 SQLite → exit(0)
    CP->>M: exit(0)
    DP->>M: exit(0)
    Note over M: 关闭主进程只读连接
    M->>App: 退出
```

### 9.3 项目切换时序

项目切换时，两个子进程需要切换 SQLite 数据库文件：

1. Main 发送 { type: 'switch-project', projectPath } 给两个子进程

1. 子进程：关闭当前 SQLite 连接 → 打开新项目的 DB 文件 → 回复 { type: 'ready' }

1. Main 收到两个 ready 后，才通知渲染进程项目切换完成

---

## 10. 文件结构规划

```
src/main/
├── process/
│   ├── ProcessManager.ts          // 管理 ComputeProcess + DataProcess 的生命周期
│   ├── BackgroundTaskRunner.ts    // 核心抽象接口 + UtilityProcessTaskRunner 实现
│   ├── WriteProxy.ts              // SQLite 写操作代理（收口所有写入到 DataProcess）
│   ├── compute-process.ts         // ComputeProcess 入口（被 fork）
│   └── data-process.ts            // DataProcess 入口（被 fork）
├── process/handlers/
│   ├── compute/
│   │   ├── onnx-handler.ts        // ONNX 推理任务
│   │   ├── kg-handler.ts          // KG CTE 遍历任务
│   │   └── fts-handler.ts         // FTS 重建 / 查询任务
│   └── data/
│       ├── sql-write-handler.ts   // 通用 SQL 写入
│       ├── tx-merge-handler.ts    // AI 流式写入事务合并
│       └── fs-handler.ts          // 文件系统操作
```

---

## 11. 迁移路径（TDD 驱动，4 个阶段）

> 🗺️

原则：每个阶段都是可独立部署的、行为不变的重构。TDD 保证每一步不引入回归。

### Phase 1 — 基础设施（无行为变化）

- [ ] 实现 BackgroundTaskRunner 接口 + UtilityProcessTaskRunner

- [ ] 实现 ProcessManager（fork / ready / shutdown / crash recovery）

- [ ] 编写 BackgroundTaskRunner 五状态机 contract test（用 in-process mock 跑通）

- [ ] 编写 ProcessManager 集成测试（fork → ready → shutdown → exit(0)）

- [ ] 编写崩溃恢复测试（fork → kill → restart → ready）

### Phase 2 — ComputeProcess 上线

- [ ] 创建 compute-process.ts 入口，注册 task handlers

- [ ] 迁移 ONNX 推理到 onnx-handler.ts

- [ ] 迁移 FTS 重建 / 查询到 fts-handler.ts

- [ ] 对应的 submit() 调用替换原有同步调用

- [ ] contract test 替换为真实 UtilityProcess 实现

- [ ] 性能基准测试：主线程阻塞时间 < 5ms（仅 postMessage 开销）

### Phase 3 — DataProcess 上线 + SQLite 读写分离

- [ ] 创建 data-process.ts 入口

- [ ] 实现 WriteProxy 接口 + IPC 写入实现

- [ ] 主进程 SQLite 连接切换为 readonly: true

- [ ] 逐个替换 DAO 层写操作为 WriteProxy.execute()

- [ ] 集成测试：Main(RO) + ComputeProcess(RO) + DataProcess(RW) 并发无死锁

- [ ] AI 流式写入事务合并（详见 🛡️ AI 流式写入防护策略）

### Phase 4 — 项目切换联动

- [ ] 实现 switch-project 消息协议

- [ ] 三进程协调切换：Main 暂停接收 → 子进程切换 DB → 全员 ready → 恢复

- [ ] 集成测试：100 次连续项目切换无内存泄漏、无 DB 锁死

- [ ] 与 ♻️ 三层生命周期管理 对接（Session 级资源释放）

---

## 12. TDD 策略

| 测试类型 | 测试内容 | 阶段 |
| --- | --- | --- |
| Contract Test | BackgroundTaskRunner 五状态机：submit→result / submit→timeout / submit→abort / crash→restart / shutdown→drain | Phase 1 |
| Contract Test | WriteProxy：execute 语义等价性（直接执行 vs IPC 转发结果一致） | Phase 3 |
| Integration Test | ProcessManager：fork→ready→shutdown→exit(0) 全生命周期 | Phase 1 |
| Integration Test | 崩溃恢复：fork→kill(SIGKILL)→detect→restart→ready→retry pending | Phase 1 |
| Integration Test | SQLite 并发：3 连接同时读写无 SQLITE_BUSY 错误 | Phase 3 |
| Integration Test | 项目切换：switch-project→子进程切换 DB→ready→正常读写 | Phase 4 |
| Stress Test | ComputeProcess 崩溃 3 次 → 降级模式 → 主线程兜底执行 | Phase 1 |
| Performance Benchmark | ONNX encode 卸载后主线程阻塞 < 5ms | Phase 2 |
| Performance Benchmark | SQLite 写入延迟增量 < 10ms（IPC 开销） | Phase 3 |

---

## 13. 依赖关系

- 被依赖：🔮 KG 查询层重构 / 🧬 Embedding & RAG 优化 / 🎯 Skill 系统优化 / 🛡️ AI 流式写入防护策略

- 无前置依赖：可立即启动

- 协同：♻️ 三层生命周期管理（Phase 4 项目切换联动）

> ♻️

统一的三层资源生命周期管理机制，解决 CN 后端所有"只进不出"的内存泄漏与资源残留问题。三层是认知模型（App / Project / Session），不是三套注册中心——只有 Project 级需要框架化，Session 级各 service 自治。

---

## 1. 问题全景

### 1.1 审计发现的 7 个泄漏点

| 编号 | 问题 | 层级 | 泄漏机制 | 影响 |
| --- | --- | --- | --- | --- |
| P1 #12 | KG 识别会话级内存泄漏 | Project | kgRecognitionRuntime.sessions Map 只增不减 | 长期运行内存持续增长 |
| P1 #13 | 语义块索引内存无限膨胀 | Project | semanticChunkIndex 缓存无上限、无 LRU | 大文档项目 OOM 风险 |
| P1 #14 | AI 服务与 IPC 层无界 Map | Project | sessionTokenTotals / chatHistoryByProject 无清理 | 多项目切换后累积 |
| P1 #15 | Search/Replace 预览存储无 TTL | Project | previewStore Map 永驻 | 每次搜索预览都累积 |
| P1 #16 | IPC 超时幽灵执行 | Session | runWithTimeout timeout 后 handler 继续执行 | CPU 浪费 + 竞态风险 |
| P1 #17 | SkillScheduler 并发槽位泄漏 | Session | globalRunning 异常时不释放 | 技能执行被永久阻塞 |
| P1 #18 | Watcher 资源生命周期不闭合 | Project | 项目切换时 chokidar watcher 不 close() | 文件句柄泄漏 |

### 1.2 根因分析

```
graph LR
    A["根因：缺乏统一的<br>资源生命周期边界"] --> B["症状 1<br>无界 Map（×12）"]
    A --> C["症状 2<br>项目切换无 teardown"]
    A --> D["症状 3<br>IPC timeout 不联动 abort"]
    A --> E["症状 4<br>app 退出无优雅关闭"]

    B --> F["BoundedMap"]
    C --> G["ProjectLifecycle<br>注册中心"]
    D --> H["AbortController<br>注入 IPC 层"]
    E --> I["Graceful<br>Shutdown Chain"]

    style A fill:#ffebee,stroke:#f44336
    style F fill:#e8f5e9,stroke:#4CAF50
    style G fill:#e8f5e9,stroke:#4CAF50
    style H fill:#e8f5e9,stroke:#4CAF50
    style I fill:#e8f5e9,stroke:#4CAF50
```

---

## 2. 三层生命周期模型

> 🔑

关键取舍：三层概念，不过度框架化。 App 级、Project 级、Session 级各有不同的绑定/解绑时机。但 Session 级不需要做成通用框架——对 SkillScheduler 这类场景，在 service 内部加 timeout watchdog 就够了。三层是认知模型，不是三套注册中心。

| 生命周期 | 绑定事件 | 解绑事件 | 典型资源 | 管理方式 |
| --- | --- | --- | --- | --- |
| App 级 | app 启动 | app 退出（before-quit） | SQLite 连接、UtilityProcess、Logger | 统一 shutdown 链 |
| Project 级 | project:project:switch | 切换到另一项目 / app 退出 | KG session、Watcher、semanticChunkIndex、AI sessionTokens、previewStore | ProjectLifecycle 注册中心 |
| Session 级 | ai:skill:run / 单次操作开始 | 操作完成 / 取消 / 超时 | SkillScheduler 并发槽位、单次 AI streaming 的 AbortController | Service 内部 timeout watchdog |

---

## 3. ProjectLifecycle 注册中心

> 唯一需要框架化的层。 App 级用 shutdown 链即可，Session 级各 service 自治。

### 3.1 接口定义

```
// ── contracts/lifecycle.ts ──────────────────────────

/**
 * 任何与项目绑定的 service 实现此接口，
 * 注册到 ProjectLifecycle 后即可自动获得项目切换清理。
 */
interface ProjectScoped {
  /** 服务名称，用于日志和调试 */
  readonly name: string;

  /** 新项目绑定——初始化或预热 */
  onProjectBind(projectId: string): void | Promise<void>;

  /** 旧项目解绑——清理缓存、释放资源 */
  onProjectUnbind(projectId: string): void | Promise<void>;

  /** App 退出——最终清理 */
  onDestroy(): void | Promise<void>;
}
```

### 3.2 注册中心实现

```
// ── lifecycle/ProjectLifecycle.ts ───────────────────

class ProjectLifecycle {
  private readonly registry: ProjectScoped[] = [];
  private currentProjectId: string | null = null;

  register(service: ProjectScoped): void {
    this.registry.push(service);
    log.debug(`[Lifecycle] registered: ${service.name}`);
  }

  /**
   * 项目切换的完整流程
   * 严格顺序：unbind ALL → 数据库写入 → bind ALL
   */
  async switchProject(
    fromId: string | null,
    toId: string,
    db: Database,
  ): Promise<void> {
    // ① Unbind all (并行，每个有独立 timeout)
    if (fromId) {
      await Promise.allSettled(
        this.registry.map((s) =>
          withTimeout(s.onProjectUnbind(fromId), 3_000, s.name),
        ),
      );
    }

    // ② 数据库写入
    writeCurrentProjectId(db, toId);

    // ③ Bind all (并行)
    await Promise.allSettled(
      this.registry.map((s) =>
        withTimeout(s.onProjectBind(toId), 5_000, s.name),
      ),
    );

    this.currentProjectId = toId;
  }

  /** App 退出时调用 */
  async destroyAll(): Promise<void> {
    if (this.currentProjectId) {
      await this.switchProject(this.currentProjectId, '__SHUTDOWN__', db);
    }
    await Promise.allSettled(
      this.registry.map((s) =>
        withTimeout(s.onDestroy(), 3_000, s.name),
      ),
    );
  }
}

// 单例
export const projectLifecycle = new ProjectLifecycle();
```

### 3.3 需要注册的 Service 清单

| Service | onProjectUnbind 清理动作 | onProjectBind 预热动作 | 对应泄漏 |
| --- | --- | --- | --- |
| WatchService | watcher.close() → 释放文件句柄 | 按需启动（可选） | P1 #18 |
| KgRecognitionRuntime | sessions.delete(projectId) → 释放 Map 条目 | — | P1 #12 |
| SemanticChunkIndexService | chunkIndex.clear() → 释放向量缓存 | — | P1 #13 |
| AiService | abortAllStreams()  • sessionTokenTotals.clear() | — | P1 #14 |
| SearchReplaceService | previewStore.clear() | — | P1 #15 |
| ChatHistoryService | chatHistoryByProject.delete(projectId) | — | P1 #14 |
| ContextWatchService | stopAllWatchers(projectId) | — | P1 #18 |

### 3.4 注册时机

```
// ── bootstrap.ts ────────────────────────────────────

function bootstrapServices(db: Database) {
  // 创建 service 实例
  const watchService = new WatchService(db);
  const kgRuntime    = new KgRecognitionRuntime(db);
  const chunkIndex   = new SemanticChunkIndexService(db);
  const aiService    = new AiService(db);
  const searchReplace = new SearchReplaceService(db);
  const chatHistory  = new ChatHistoryService(db);

  // 统一注册
  [watchService, kgRuntime, chunkIndex, aiService, searchReplace, chatHistory]
    .forEach(s => projectLifecycle.register(s));

  return { watchService, kgRuntime, chunkIndex, aiService, searchReplace, chatHistory };
}
```

---

## 4. BoundedMap<K, V> — 替代所有无界 Map

### 4.1 设计要求

| 特性 | 说明 |
| --- | --- |
| LRU 淘汰 | 达到 maxSize 时淘汰最久未访问条目 |
| TTL 过期 | 每个条目有独立过期时间，get 时惰性检查 |
| 容量上限 | 构造时指定 maxSize，不允许无界增长 |
| Metrics hook | 命中率、驱逐次数、当前大小——方便后续调优 |
| 线程安全 | 单线程环境无需加锁（Electron 主进程） |

### 4.2 核心实现

```
// ── utils/BoundedMap.ts ─────────────────────────────

interface BoundedMapOptions {
  maxSize: number;
  defaultTtlMs?: number;          // 0 = 不过期
  onEvict?: (key: string, value: unknown) => void;
}

interface BoundedMapMetrics {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
  hitRate: number;
}

class BoundedMap<K extends string, V> {
  private readonly map = new Map<K, { value: V; expiresAt: number }>();
  private readonly opts: Required<BoundedMapOptions>;
  private hits = 0;
  private misses = 0;
  private evictions = 0;

  constructor(opts: BoundedMapOptions) {
    this.opts = {
      defaultTtlMs: 0,
      onEvict: () => {},
      ...opts,
    };
  }

  set(key: K, value: V, ttlMs?: number): void {
    // 已存在 → 删除旧条目（重新排序）
    if (this.map.has(key)) this.map.delete(key);

    // 容量检查 → LRU 淘汰（Map 迭代顺序 = 插入顺序）
    while (this.map.size >= this.opts.maxSize) {
      const oldest = this.map.keys().next().value!;
      const entry = this.map.get(oldest)!;
      this.map.delete(oldest);
      this.evictions++;
      this.opts.onEvict(oldest, entry.value);
    }

    const effectiveTtl = ttlMs ?? this.opts.defaultTtlMs;
    this.map.set(key, {
      value,
      expiresAt: effectiveTtl > 0 ? Date.now() + effectiveTtl : Infinity,
    });
  }

  get(key: K): V | undefined {
    const entry = this.map.get(key);
    if (!entry) { this.misses++; return undefined; }

    // TTL 过期检查
    if (Date.now() > entry.expiresAt) {
      this.map.delete(key);
      this.misses++;
      this.evictions++;
      this.opts.onEvict(key, entry.value);
      return undefined;
    }

    // 更新 LRU 位置（delete + re-insert）
    this.map.delete(key);
    this.map.set(key, entry);
    this.hits++;
    return entry.value;
  }

  clear(): void { this.map.clear(); }
  delete(key: K): boolean { return this.map.delete(key); }
  get size(): number { return this.map.size; }

  metrics(): BoundedMapMetrics {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      evictions: this.evictions,
      size: this.map.size,
      hitRate: total > 0 ? this.hits / total : 0,
    };
  }
}
```

### 4.3 无界 Map 替换清单（12 处）

| # | 当前无界 Map | 文件 | 推荐 maxSize | 推荐 TTL |
| --- | --- | --- | --- | --- |
| 1 | kgRecognitionRuntime.sessions | services/knowledgeGraph/runtime.ts | 50 | 30 min |
| 2 | semanticChunkIndex.cache | services/embedding/chunkIndex.ts | 500 | 10 min |
| 3 | aiService.sessionTokenTotals | services/ai/aiService.ts | 100 | 60 min |
| 4 | chatHistoryByProject | services/ai/chatHistory.ts | 20 | 无（项目级清理） |
| 5 | searchReplace.previewStore | services/search/searchReplace.ts | 20 | 5 min |
| 6 | contextAssembly.cache | services/context/assembly.ts | 50 | 5 min |
| 7 | memoryInjection.cache | services/memory/injection.ts | 100 | 10 min |
| 8 | skillRegistry.instanceCache | services/skill/registry.ts | 50 | 无（App 级） |
| 9 | exportService.tempFiles | services/export/export.ts | 10 | 10 min |
| 10 | constraintsPolicyCache | services/constraints/policy.ts | 100 | 15 min |
| 11 | ragContextCache | services/rag/context.ts | 50 | 5 min |
| 12 | judgeModelState | services/judge/judge.ts | 5 | 无（App 级） |

---

## 5. AbortController 注入 IPC Runtime 层

### 5.1 改造目标

```
IPC timeout → controller.abort() → handler 感知 signal → 提前退出
```

### 5.2 改造方案

```
// ── ipc/runtime-validation.ts（改造后）─────────────

function createValidatedHandler<C extends keyof IpcChannelSpec>(
  channel: C,
  handler: (
    payload: IpcRequest<C>,
    signal: AbortSignal,          // ← 新增
  ) => Promise<IpcInvokeResult<C>>,
) {
  return async (_event: IpcMainInvokeEvent, rawPayload: unknown) => {
    // ACL → Schema 校验 → ...

    const controller = new AbortController();
    const { signal } = controller;

    const timeoutMs = getChannelTimeout(channel); // 默认 30s

    const result = await Promise.race([
      handler(validated, signal),
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          controller.abort();           // ← 超时时 abort
          reject(new IpcTimeoutError(channel, timeoutMs));
        }, timeoutMs);
      }),
    ]);

    return { ok: true, data: result };
  };
}
```

### 5.3 Handler 侧适配

```
// ── 示例：knowledge:query:subgraph handler ──────────

async function handleSubgraphQuery(
  payload: SubgraphQueryRequest,
  signal: AbortSignal,                   // ← 接收 signal
): Promise<SubgraphQueryResult> {
  const nodes: KgNode[] = [];

  for (const entityId of payload.entityIds) {
    if (signal.aborted) throw new AbortError();   // ← 检查点

    const subgraph = await kgService.getSubgraph(entityId);
    nodes.push(...subgraph);
  }

  return { nodes };
}
```

### 5.4 UtilityProcess 联动

对于已卸载到 UtilityProcess 的任务，abort 信号通过 postMessage 传递：

```
// Main 侧
signal.addEventListener('abort', () => {
  utilityProcess.postMessage({ type: 'abort', taskId });
});

// UtilityProcess 侧
parentPort.on('message', (msg) => {
  if (msg.type === 'abort') {
    taskAbortControllers.get(msg.taskId)?.abort();
  }
});
```

---

## 6. Session 级：各 Service 自治

> 不框架化，不需要通用 SessionLifecycle 注册中心。

### 6.1 SkillScheduler 并发槽位保护

```
// ── services/skill/scheduler.ts ─────────────────────

class SkillScheduler {
  private globalRunning = 0;
  private readonly MAX_CONCURRENT = 3;
  private readonly TASK_TIMEOUT_MS = 120_000; // 2 min

  async runSkill(skillId: string, signal: AbortSignal): Promise<SkillResult> {
    if (this.globalRunning >= this.MAX_CONCURRENT) {
      throw new SkillBusyError();
    }

    this.globalRunning++;
    const timer = setTimeout(() => {
      // Completion timeout watchdog
      this.globalRunning = Math.max(0, this.globalRunning - 1);
      log.warn(`[Scheduler] force-released slot for skill ${skillId}`);
    }, this.TASK_TIMEOUT_MS);

    try {
      const result = await this.executeSkill(skillId, signal);
      return result;
    } finally {
      clearTimeout(timer);
      this.globalRunning = Math.max(0, this.globalRunning - 1);
    }
  }
}
```

关键点：

- finally 块确保正常/异常都释放槽位

- setTimeout watchdog 作为兜底——即使 finally 被跳过（进程级异常），2 分钟后也回收

- Math.max(0, ...) 防止 watchdog 和 finally 双重释放导致负数

### 6.2 AI Streaming AbortController

```
// ── services/ai/streaming.ts ────────────────────────

class AiStreamingSession {
  private controller: AbortController;

  constructor() {
    this.controller = new AbortController();
  }

  async stream(prompt: string): Promise<void> {
    const response = await fetch(llmEndpoint, {
      method: 'POST',
      body: JSON.stringify({ prompt }),
      signal: this.controller.signal,     // ← fetch 原生支持
    });
    // ...
  }

  cancel(): void {
    this.controller.abort();
  }
}
```

---

## 7. App 级 Graceful Shutdown 链

### 7.1 完整链路

```
graph TD
    A["before-quit 事件"] --> B["ProjectLifecycle<br>.destroyAll()"]
    B --> B1["unbindAll(currentProject)"]
    B --> B2["所有 service.onDestroy()"]
    B2 --> C["UtilityProcess<br>.destroyAll()"]
    C --> C1["postMessage({ type: 'shutdown' })"]
    C1 --> C2["等待 'exited' 事件<br>（timeout 3s）"]
    C2 --> D["db.close()"]
    D --> E["app.quit()"]

    F["超时兜底 5s"] -.->|"如果以上未完成"| G["process.exit(1)"]

    style A fill:#e3f2fd,stroke:#1976D2
    style G fill:#ffebee,stroke:#f44336
```

### 7.2 实现

```
// ── lifecycle/shutdown.ts ───────────────────────────

app.on('before-quit', async (event) => {
  event.preventDefault();

  const HARD_TIMEOUT = 5_000;
  const hardTimer = setTimeout(() => {
    log.error('[Shutdown] hard timeout — force exit');
    process.exit(1);
  }, HARD_TIMEOUT);

  try {
    // ① 项目级资源清理
    await projectLifecycle.destroyAll();

    // ② 子进程关闭
    await utilityProcessManager.destroyAll();

    // ③ 数据库关闭
    db.close();

    log.info('[Shutdown] graceful shutdown complete');
  } catch (err) {
    log.error('[Shutdown] error during shutdown', err);
  } finally {
    clearTimeout(hardTimer);
    app.exit(0);
  }
});
```

---

## 8. project:project:switch 重建后的完整链路

```
sequenceDiagram
    participant R as Renderer
    participant M as Main
    participant PL as ProjectLifecycle
    participant DB as SQLite
    participant UP as UtilityProcess

    R->>M: project:project:switch(toId)

    Note over M: ① Unbind 旧项目
    M->>PL: switchProject(fromId, toId)
    PL->>PL: parallel unbindAll(fromId)
    Note right of PL: watchService.stop()<br>kgRuntime.clearSession()<br>chunkIndex.clear()<br>aiService.abortAll()<br>searchReplace.clear()

    Note over M: ② 数据库写入
    PL->>DB: writeCurrentProjectId(toId)

    Note over M: ③ Bind 新项目
    PL->>PL: parallel bindAll(toId)

    Note over M: ④ 通知 UtilityProcess
    M->>UP: postMessage({ type: 'switch-project', toId })
    UP->>UP: close旧DB → open新DB

    Note over M: ⑤ 更新 Session Binding
    M->>M: projectSessionBinding.bind(webContentsId, toId)

    M->>R: { ok: true, data: { currentProjectId, switchedAt } }
```

与当前实现的对比：

| 步骤 | 当前 | 重建后 |
| --- | --- | --- |
| ① Unbind | ❌ switchKnowledgeGraphContext / switchMemoryContext 是 no-op | ✅ ProjectLifecycle.unbindAll() 并行清理所有注册 service |
| ② DB 写入 | ✅ 正常 | ✅ 不变 |
| ③ Bind | ❌ 无 | ✅ ProjectLifecycle.bindAll() 按需预热 |
| ④ 通知子进程 | ❌ 无子进程 | ✅ UtilityProcess 切换 DB 文件 |
| ⑤ Session Binding | ✅ 正常 | ✅ 不变 |

---

## 9. 监控与可观测性

### 9.1 Metrics 采集点

| 指标 | 采集方式 | 用途 |
| --- | --- | --- |
| BoundedMap 命中率 | map.metrics().hitRate | 调优 maxSize / TTL |
| BoundedMap 驱逐次数 | map.metrics().evictions | 判断容量是否过小 |
| ProjectLifecycle unbind 耗时 | withTimeout 回调记录 | 找出拖慢项目切换的 service |
| SkillScheduler 槽位使用率 | globalRunning / MAX_CONCURRENT | 并发瓶颈分析 |
| IPC abort 次数 | AbortController.abort() 回调计数 | 判断 timeout 是否过短 |
| Graceful shutdown 耗时 | before-quit → app.exit 时间差 | 优化关闭速度 |

### 9.2 内存泄漏回归检测

```
// ── tests/lifecycle/memoryRegression.test.ts ────────

test('100 次项目切换后内存不持续增长', async () => {
  const baseline = process.memoryUsage().heapUsed;

  for (let i = 0; i < 100; i++) {
    await projectLifecycle.switchProject(
      `project-${i}`,
      `project-${i + 1}`,
      db,
    );
  }

  global.gc?.();  // --expose-gc
  const after = process.memoryUsage().heapUsed;

  // 允许 20% 波动，但不允许持续线性增长
  expect(after).toBeLessThan(baseline * 1.2);
});
```

---

## 10. TDD 策略

| 测试类别 | 测试内容 | 关键断言 |
| --- | --- | --- |
| ProjectLifecycle contract | bind → unbind → destroy 全链路 | 每个 service 的回调被正确调用；unbind 超时不阻塞其他 service |
| BoundedMap contract | LRU 淘汰、TTL 过期、容量上限 | 达到 maxSize 后 oldest 被淘汰；过期条目 get 返回 undefined |
| AbortController contract | timeout → abort → handler 提前退出 | handler 收到 signal.aborted === true；不产生副作用 |
| SkillScheduler guard | 异常时槽位回收 | finally 释放 + watchdog 兜底 |
| Graceful shutdown | before-quit → 全链路关闭 | 所有 service.onDestroy 被调用；db.close 被调用；5s 内完成 |
| 内存回归 | 100 次项目切换 | heap 不线性增长 |

---

## 11. 实施路径

| 阶段 | 内容 | 预计工作量 |
| --- | --- | --- |
| Phase 1 | BoundedMap 实现 + 测试 + 替换 12 个无界 Map | 1 天 |
| Phase 2 | ProjectLifecycle 注册中心 + 7 个 service 注册 + project:project:switch 重写 | 1 天 |
| Phase 3 | AbortController 注入 IPC runtime + 3 个 CPU 密集 handler 适配 | 0.5 天 |
| Phase 4 | Graceful Shutdown 链 + SkillScheduler watchdog | 0.5 天 |
| Phase 5 | 内存回归测试 + metrics 采集 | 0.5 天 |

> ✅

无前置依赖，可立即启动。 Phase 2 完成后与 UtilityProcess 双进程架构对接（shutdown 链 + switch-project 消息）。

---

## 12. 相关页面

- ‣ — 子进程关闭与 switch-project 协议

- ‣ — §5 timeout 幽灵执行问题

- ‣ — §3 service 实例管理现状

- ‣ — P1 #12–#18 完整描述

> 🔮

混合策略重构 KG 查询层 — CTE 图遍历 + 迭代化 DFS + Aho-Corasick 文本匹配 + Deque BFS，全部卸载到 ComputeProcess。

---

## 定位

重构 Knowledge Graph 查询层，采用混合策略——CTE 做图遍历、JS 做业务逻辑、Aho-Corasick 做文本匹配——消除 KG 相关的所有主线程阻塞、崩溃与性能退化。

> ⚠️

关键取舍：CTE 不是银弹。 图遍历用 CTE 是最优解，但 buildRulesInjection 的复杂业务逻辑和 entityMatcher 的文本匹配问题，CTE 完全不适合。必须按查询类型选择最佳策略。

---

## 待覆盖问题

- P0 #3 — 多个查询接口先全量拉图再计算

- P0 #4 — queryValidate 递归 DFS 无深度保护（栈溢出）

- P0 #5 — BFS 队列 Array.shift() 退化 O(n²)

- P1 #10 — Retrieved 实体匹配 N×M 同步扫描

- P1 #12 — KG 识别会话级内存泄漏

---

## 按查询类型的最优策略

| 查询类型 | 当前实现 | 最优策略 | 执行位置 | 理由 |
| --- | --- | --- | --- | --- |
| querySubgraph（BFS 展开 N 度子图） | JS .all() 全量拉取 + Array.shift() BFS | ✅ WITH RECURSIVE CTE | ComputeProcess SQLite | CTE 天然就是 BFS，SQLite 索引直接加速，零序列化开销 |
| queryPath（A→B 最短路径） | JS 全量拉取 + BFS 搜索 | ✅ CTE + LIMIT 剪枝 | ComputeProcess SQLite | CTE 做 BFS 找路径，LIMIT 找到即停 |
| queryValidate（DFS 验证图约束） | JS 递归 DFS，无深度保护 | ⚠️ 迭代化 BFS + maxDepth | ComputeProcess JS 层 | CTE 做 DFS 需要 LIFO trick 且有 SQLITE_MAX_RECURSIVE_DEPTH 限制；迭代化 BFS 更可控 |
| buildRulesInjection（规则注入） | JS 全量拉取 + 业务逻辑 | ⚠️ CTE 一次性拉取 + JS 业务逻辑 | ComputeProcess 混合 | 需要 JS 层的条件判断、字符串拼接、token 计算，CTE 做不了这些 |
| entityMatcher（N×M 文本匹配） | JS text.indexOf 暴力扫描 O(n×m×len) | ❌ Aho-Corasick 自动机 | ComputeProcess JS 层 | 这是 NLP 问题不是图遍历。预构建自动机，匹配时 O(text_length) 一趟扫完 |

---

## 3. CTE 重写：querySubgraph 与 queryPath

### 3.1 querySubgraph — BFS N 度子图展开

```
-- ── kgQueryService.ts → querySubgraph CTE 重写 ─────

WITH RECURSIVE subgraph(entity_id, depth) AS (
  -- 种子节点
  SELECT :rootEntityId, 0

  UNION ALL

  -- BFS 扩展：通过关系找邻居
  SELECT
    CASE
      WHEN r.source_entity_id = sg.entity_id THEN r.target_entity_id
      ELSE r.source_entity_id
    END,
    sg.depth + 1
  FROM subgraph sg
  JOIN kg_relations r ON (
    r.source_entity_id = sg.entity_id
    OR r.target_entity_id = sg.entity_id
  )
  WHERE sg.depth < :maxDepth           -- 深度限制
    AND r.project_id = :projectId      -- 项目隔离
)
SELECT DISTINCT e.*
FROM subgraph sg
JOIN kg_entities e ON e.entity_id = sg.entity_id
WHERE e.project_id = :projectId;
```

利用的索引（需在 migration 中确认存在）：

- idx_kg_relations_source — (project_id, source_entity_id)

- idx_kg_relations_target — (project_id, target_entity_id)

- idx_kg_entities_project — (project_id, entity_id)

### 3.2 queryPath — A→B 最短路径

```
-- ── kgQueryService.ts → queryPath CTE 重写 ─────────

WITH RECURSIVE path(entity_id, path_json, depth) AS (
  -- 起点
  SELECT :startId, json_array(:startId), 0

  UNION ALL

  -- BFS 扩展（记录完整路径用于防环 + 结果返回）
  SELECT
    CASE
      WHEN r.source_entity_id = p.entity_id THEN r.target_entity_id
      ELSE r.source_entity_id
    END,
    json_insert(p.path_json, '$[#]',
      CASE
        WHEN r.source_entity_id = p.entity_id THEN r.target_entity_id
        ELSE r.source_entity_id
      END
    ),
    p.depth + 1
  FROM path p
  JOIN kg_relations r ON (
    r.source_entity_id = p.entity_id
    OR r.target_entity_id = p.entity_id
  )
  WHERE p.depth < :maxDepth
    AND r.project_id = :projectId
    -- 防环：新节点不在已访问路径中
    AND NOT EXISTS (
      SELECT 1 FROM json_each(p.path_json)
      WHERE json_each.value = (
        CASE
          WHEN r.source_entity_id = p.entity_id THEN r.target_entity_id
          ELSE r.source_entity_id
        END
      )
    )
)
SELECT path_json, depth
FROM path
WHERE entity_id = :endId
ORDER BY depth ASC
LIMIT 1;  -- 最短路径，找到即停
```

### 3.3 TypeScript 封装层

```
// ── services/kg/kgCteQueries.ts ─────────────────────

import type { Database } from 'better-sqlite3';

interface SubgraphOptions {
  rootEntityId: string;
  projectId: string;
  maxDepth?: number;  // 默认 3
}

interface PathOptions {
  startId: string;
  endId: string;
  projectId: string;
  maxDepth?: number;  // 默认 10
}

// ── 预编译 Statement（ComputeProcess 启动时执行一次）──
let stmtSubgraph: ReturnType<Database['prepare']>;
let stmtPath: ReturnType<Database['prepare']>;

export function prepareCteStatements(db: Database): void {
  stmtSubgraph = db.prepare(SUBGRAPH_SQL);
  stmtPath = db.prepare(PATH_SQL);
}

export function querySubgraph(opts: SubgraphOptions): KgEntity[] {
  const { rootEntityId, projectId, maxDepth = 3 } = opts;
  return stmtSubgraph.all({ rootEntityId, projectId, maxDepth });
}

export function queryPath(opts: PathOptions): { path: string[]; depth: number } | null {
  const { startId, endId, projectId, maxDepth = 10 } = opts;
  const row = stmtPath.get({ startId, endId, projectId, maxDepth });
  if (!row) return null;
  return {
    path: JSON.parse(row.path_json),
    depth: row.depth,
  };
}
```

### 3.4 性能预估

| 场景 | 当前（JS 全量拉取） | CTE 重写后 | 提升倍数 |
| --- | --- | --- | --- |
| 1k 节点 2 度子图 | ~200ms（拉取全图 + JS BFS） | ~5ms（索引直达） | ~40x |
| 10k 节点 3 度子图 | ~2s（全图 + OOM 风险） | ~20ms | ~100x |
| 50k 节点最短路径 | ~10s（全量拉取不可行） | ~50ms（LIMIT 1 剪枝） | ~200x |

---

## 4. 迭代化 DFS：queryValidate

### 4.1 问题根因

当前递归 walk() 有两个致命缺陷：

1. 无深度保护 — 环形图或深链导致 RangeError: Maximum call stack size exceeded

1. 无访问标记 — 同一节点可能被重复访问，环路时无限递归

### 4.2 迭代化改写

```
// ── services/kg/kgValidateService.ts ────────────────

interface ValidateOptions {
  maxDepth: number;    // 默认 100
  maxVisited: number;  // 默认 10_000（防止遍历过多节点）
}

interface Violation {
  entityId: string;
  type: 'MAX_DEPTH_EXCEEDED' | 'CONSTRAINT_VIOLATED' | string;
  depth: number;
  detail?: string;
}

type ValidationReport =
  | { status: 'complete'; violations: Violation[]; visitedCount: number }
  | { status: 'aborted'; violations: Violation[] }
  | { status: 'exceeded_max_visited'; violations: Violation[]; visitedCount: number };

function validateGraph(
  rootId: string,
  getNeighbors: (id: string) => string[],
  isValid: (id: string, depth: number) => { ok: boolean } & Partial<Violation>,
  opts: ValidateOptions = { maxDepth: 100, maxVisited: 10_000 },
  signal?: AbortSignal,
): ValidationReport {
  // ── 显式栈替代递归（LIFO = DFS）──
  const stack: Array<{ id: string; depth: number }> = [
    { id: rootId, depth: 0 },
  ];
  const visited = new Set<string>();
  const violations: Violation[] = [];

  while (stack.length > 0) {
    // AbortController 检查点
    if (signal?.aborted) {
      return { status: 'aborted', violations };
    }

    const { id, depth } = stack.pop()!;

    // 防环
    if (visited.has(id)) continue;
    visited.add(id);

    // 节点数上限
    if (visited.size > opts.maxVisited) {
      return {
        status: 'exceeded_max_visited',
        violations,
        visitedCount: visited.size,
      };
    }

    // 深度保护
    if (depth > opts.maxDepth) {
      violations.push({
        entityId: id,
        type: 'MAX_DEPTH_EXCEEDED',
        depth,
      });
      continue; // 不展开更深层
    }

    // 校验当前节点
    const result = isValid(id, depth);
    if (!result.ok) {
      violations.push({ entityId: id, depth, ...result });
    }

    // 展开邻居（入栈）
    const neighbors = getNeighbors(id);
    for (const neighborId of neighbors) {
      if (!visited.has(neighborId)) {
        stack.push({ id: neighborId, depth: depth + 1 });
      }
    }
  }

  return { status: 'complete', violations, visitedCount: visited.size };
}
```

### 4.3 对比

| 方面 | 当前（递归 walk） | 重写后（迭代化） |
| --- | --- | --- |
| 栈溢出风险 | ❌ 深链 → RangeError | ✅ 显式栈，堆内存分配 |
| 环路处理 | ❌ 无 → 无限递归 | ✅ visited Set 防环 |
| 深度限制 | ❌ 无 | ✅ maxDepth（默认 100） |
| 节点数限制 | ❌ 无 | ✅ maxVisited（默认 10,000） |
| 可取消 | ❌ 无 | ✅ AbortSignal 每轮检查 |
| V8 调用栈消耗 | O(depth) 栈帧 | O(1) 栈帧 |

---

## 5. BFS 数据结构修正：Deque

### 5.1 Array.shift() 的性能陷阱

```
Array.shift() = O(n) — 每次移除头部，所有元素前移一位
N 次 shift 累计 = O(n²)

10,000 个节点 BFS：
  Array.shift()  → ~500ms
  Deque.popFront → ~10ms（50x 差距）
```

### 5.2 循环数组 Deque 实现

```
// ── utils/Deque.ts ──────────────────────────────────

/**
 * 基于循环数组的双端队列。
 * pushBack / popFront 均 O(1) amortized。
 */
export class Deque<T> {
  private buf: (T | undefined)[];
  private head = 0;
  private tail = 0;
  private count = 0;

  constructor(initialCapacity = 16) {
    this.buf = new Array(initialCapacity);
  }

  get size(): number {
    return this.count;
  }

  pushBack(item: T): void {
    if (this.count === this.buf.length) this.grow();
    this.buf[this.tail] = item;
    this.tail = (this.tail + 1) % this.buf.length;
    this.count++;
  }

  popFront(): T | undefined {
    if (this.count === 0) return undefined;
    const item = this.buf[this.head];
    this.buf[this.head] = undefined; // 释放引用供 GC
    this.head = (this.head + 1) % this.buf.length;
    this.count--;
    return item;
  }

  peekFront(): T | undefined {
    return this.count === 0 ? undefined : this.buf[this.head];
  }

  private grow(): void {
    const newCap = this.buf.length * 2;
    const newBuf = new Array(newCap);
    for (let i = 0; i < this.count; i++) {
      newBuf[i] = this.buf[(this.head + i) % this.buf.length];
    }
    this.buf = newBuf;
    this.head = 0;
    this.tail = this.count;
  }
}
```

### 5.3 替换清单

所有 JS 层 BFS 遍历中的 Array.shift() 替换为 Deque.popFront()：

| 文件 | 当前 | 替换为 |
| --- | --- | --- |
| kgQueryService.ts — querySubgraph 回退路径 | queue.shift() | deque.popFront() |
| kgQueryService.ts — queryPath 回退路径 | queue.shift() | deque.popFront() |
| contextService.ts — 上下文 BFS 展开 | queue.shift() | deque.popFront() |
| 其他 service 中发现的 .shift() 调用 | 全局 grep \.shift\( | 逐个确认并替换 |

---

## 6. Aho-Corasick 自动机：entityMatcher

### 6.1 当前问题

```
当前：N 个实体名 × M 段文本 × L 平均长度
  = O(N × M × L) 暴力 indexOf 扫描
  1000 实体 × 10 段 × 10KB ≈ 500ms（同步阻塞）

目标：预构建自动机后
  = O(M × L + matches) 一趟扫完所有实体
  同样规模 ≈ 5ms
```

### 6.2 自动机生命周期

```
flowchart TD
    A["实体列表变更\n（CRUD / 项目切换）"] --> B["标记自动机 stale"]
    B --> C["下次 match() 调用\n惰性重建自动机"]
    C --> D["Aho-Corasick 自动机\n缓存在 ComputeProcess 内存"]
    D --> E["匹配：O(text_length)\n一趟扫完所有实体"]

    F["项目切换"] --> G["ProjectLifecycle\n.onProjectUnbind()"]
    G --> H["清除自动机缓存"]

    style D fill:#e8f5e9,stroke:#4CAF50
```

### 6.3 实现方案

```
// ── services/kg/entityMatcher.ts（重写）─────────────

import { AhoCorasick } from './ahoCorasick';

interface MatchResult {
  entityId: string;
  name: string;
  start: number;  // 在文本中的起始位置
  end: number;
}

export class EntityMatcher {
  private ac: AhoCorasick | null = null;
  private stale = true;
  private entityMap: Map<string, { id: string; name: string }> = new Map();

  /**
   * 注册实体列表（实体变更时调用）。
   * 仅标记 stale，不立即重建——惰性构建。
   */
  setEntities(entities: Array<{ id: string; name: string; aliases?: string[] }>): void {
    this.entityMap.clear();
    for (const e of entities) {
      // 主名
      this.entityMap.set(e.name.toLowerCase(), { id: e.id, name: e.name });
      // 别名
      for (const alias of e.aliases ?? []) {
        this.entityMap.set(alias.toLowerCase(), { id: e.id, name: alias });
      }
    }
    this.stale = true;
    this.ac = null;
  }

  /**
   * 在文本中匹配所有已注册实体。
   * 首次调用或 stale 时自动重建自动机。
   */
  match(text: string): MatchResult[] {
    if (this.stale || !this.ac) {
      this.rebuild();
    }
    return this.ac!.search(text.toLowerCase()).map(hit => {
      const entry = this.entityMap.get(hit.pattern)!;
      return {
        entityId: entry.id,
        name: entry.name,
        start: hit.start,
        end: hit.end,
      };
    });
  }

  /** 项目切换时清除缓存 */
  dispose(): void {
    this.ac = null;
    this.entityMap.clear();
    this.stale = true;
  }

  private rebuild(): void {
    const patterns = Array.from(this.entityMap.keys());
    this.ac = new AhoCorasick(patterns);
    this.stale = false;
  }
}
```

### 6.4 Aho-Corasick 核心（精简版）

```
// ── services/kg/ahoCorasick.ts ──────────────────────

interface TrieNode {
  children: Map<string, TrieNode>;
  fail: TrieNode | null;
  output: string[];  // 命中的模式串
}

export interface SearchHit {
  pattern: string;
  start: number;
  end: number;
}

export class AhoCorasick {
  private root: TrieNode;

  constructor(patterns: string[]) {
    this.root = this.createNode();
    // 1. 构建 Trie
    for (const p of patterns) {
      this.insert(p);
    }
    // 2. 构建 fail 指针（BFS）
    this.buildFailLinks();
  }

  search(text: string): SearchHit[] {
    const results: SearchHit[] = [];
    let node = this.root;

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      while (node !== this.root && !node.children.has(ch)) {
        node = node.fail!;
      }
      node = node.children.get(ch) ?? this.root;

      // 收集所有命中（沿 output 链）
      let tmp: TrieNode | null = node;
      while (tmp !== this.root && tmp !== null) {
        for (const pattern of tmp.output) {
          results.push({
            pattern,
            start: i - pattern.length + 1,
            end: i + 1,
          });
        }
        tmp = tmp.fail;
      }
    }
    return results;
  }

  private insert(pattern: string): void {
    let node = this.root;
    for (const ch of pattern) {
      if (!node.children.has(ch)) {
        node.children.set(ch, this.createNode());
      }
      node = node.children.get(ch)!;
    }
    node.output.push(pattern);
  }

  private buildFailLinks(): void {
    const queue: TrieNode[] = [];
    // 第一层子节点 fail → root
    for (const child of this.root.children.values()) {
      child.fail = this.root;
      queue.push(child);
    }
    // BFS 构建
    while (queue.length > 0) {
      const curr = queue.shift()!; // 构建阶段节点数有限，shift 可接受
      for (const [ch, child] of curr.children) {
        let fallback = curr.fail!;
        while (fallback !== this.root && !fallback.children.has(ch)) {
          fallback = fallback.fail!;
        }
        child.fail = fallback.children.get(ch) ?? this.root;
        // 合并 output
        child.output = child.output.concat(child.fail.output);
        queue.push(child);
      }
    }
  }

  private createNode(): TrieNode {
    return { children: new Map(), fail: null, output: [] };
  }
}
```

### 6.5 性能对比

| 场景 | 当前（indexOf 暴力扫描） | Aho-Corasick | 提升 |
| --- | --- | --- | --- |
| 100 实体 × 5KB 文本 | ~50ms | ~0.5ms | ~100x |
| 1000 实体 × 10KB 文本 | ~500ms | ~2ms | ~250x |
| 5000 实体 × 50KB 文本 | ~12s（不可用） | ~10ms | ~1200x |
| 自动机构建（1000 实体） | N/A | ~5ms（一次性） | 惰性构建，按需触发 |

---

## 7. buildRulesInjection：分离数据获取与业务逻辑

### 7.1 当前问题

```
// ── 当前实现（简化）──────────────────────────────────
function buildRulesInjection(projectId: string, context: Context): string {
  // ❌ 全量拉取所有实体和关系
  const entities = db.prepare('SELECT * FROM kg_entities WHERE project_id = ?').all(projectId);
  const relations = db.prepare('SELECT * FROM kg_relations WHERE project_id = ?').all(projectId);

  // 然后在 JS 中做复杂的过滤、排序、token 计算、字符串拼接
  let rules = '';
  for (const entity of entities) {
    if (isRelevant(entity, context)) {
      rules += formatRule(entity, getRelatedEntities(entity, relations));
      if (tokenCount(rules) > MAX_TOKENS) break;
    }
  }
  return rules;
}
```

### 7.2 重构：CTE 精确拉取 + JS 业务逻辑

```
// ── 重构后 ──────────────────────────────────────────

// 第一步：CTE 只拉取上下文相关的子图（而非全量）
const RULES_SUBGRAPH_SQL = `
  WITH RECURSIVE relevant(entity_id, depth) AS (
    -- 种子：当前上下文提及的实体 ID
    SELECT e.entity_id, 0
    FROM kg_entities e
    WHERE e.project_id = :projectId
      AND e.entity_id IN (SELECT value FROM json_each(:seedEntityIds))

    UNION ALL

    SELECT
      CASE
        WHEN r.source_entity_id = rv.entity_id THEN r.target_entity_id
        ELSE r.source_entity_id
      END,
      rv.depth + 1
    FROM relevant rv
    JOIN kg_relations r ON (
      r.source_entity_id = rv.entity_id
      OR r.target_entity_id = rv.entity_id
    )
    WHERE rv.depth < :maxDepth
      AND r.project_id = :projectId
  )
  SELECT DISTINCT
    e.*,
    r.relation_type,
    r.source_entity_id,
    r.target_entity_id
  FROM relevant rv
  JOIN kg_entities e ON e.entity_id = rv.entity_id
  LEFT JOIN kg_relations r ON (
    r.project_id = :projectId
    AND (r.source_entity_id = rv.entity_id OR r.target_entity_id = rv.entity_id)
  )
  WHERE e.project_id = :projectId;
`;

function buildRulesInjection(projectId: string, context: Context): string {
  // ── 第一步：CTE 精确拉取（只拉上下文相关的 2 度子图）──
  const seedIds = context.mentionedEntityIds;
  const rows = stmtRulesSubgraph.all({
    projectId,
    seedEntityIds: JSON.stringify(seedIds),
    maxDepth: 2,
  });

  // ── 第二步：JS 业务逻辑（不变，但输入数据量大幅减少）──
  const entityMap = groupByEntity(rows);
  let rules = '';
  let tokens = 0;

  for (const [entityId, data] of entityMap) {
    const rule = formatRule(data.entity, data.relations);
    const ruleTokens = estimateTokens(rule);
    if (tokens + ruleTokens > MAX_TOKENS) break;
    rules += rule;
    tokens += ruleTokens;
  }

  return rules;
}
```

### 7.3 优化效果

| 方面 | 当前 | 重构后 |
| --- | --- | --- |
| 数据获取量 | 全量（可能 10k+ 实体） | 仅上下文相关子图（通常 50~200 实体） |
| 序列化开销 | 全量 JSON → JS 对象 | 减少 95%+ |
| JS 处理时间 | 遍历全量实体做过滤 | 仅处理相关实体 |
| 业务逻辑 | 不变 | 不变（formatRule / tokenCount 保留） |

---

## 8. KG Session 生命周期

### 8.1 当前泄漏

```
// ── 当前 kgRecognitionRuntime.ts ────────────────────
class KgRecognitionRuntime {
  // ❌ 只增不减
  private sessions = new Map<string, RecognitionSession>();

  startSession(sessionId: string): void {
    this.sessions.set(sessionId, new RecognitionSession());
  }

  // 没有 endSession / cleanup 方法
}
```

### 8.2 修复：接入 ProjectLifecycle + BoundedMap + TTL

```
// ── 修复后 ──────────────────────────────────────────

import { BoundedMap } from '../utils/BoundedMap';
import { ProjectLifecycle } from '../lifecycle/ProjectLifecycle';

class KgRecognitionRuntime {
  // ✅ BoundedMap：LRU + TTL + 容量上限
  private sessions: BoundedMap<string, RecognitionSession>;

  constructor(
    private lifecycle: ProjectLifecycle,
    opts: { maxSessions?: number; ttlMs?: number } = {},
  ) {
    const { maxSessions = 100, ttlMs = 30 * 60 * 1000 } = opts; // 30 min TTL

    this.sessions = new BoundedMap({
      maxSize: maxSessions,
      ttlMs,
      onEvict: (key, session) => session.dispose(),
    });

    // ✅ 注册到 ProjectLifecycle
    this.lifecycle.onProjectUnbind(() => {
      this.sessions.clear(); // 项目切换时清除所有 session
    });
  }

  startSession(sessionId: string): RecognitionSession {
    const session = new RecognitionSession();
    this.sessions.set(sessionId, session);
    return session;
  }

  endSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.dispose();
      this.sessions.delete(sessionId);
    }
  }

  /** 定期清理过期 session（可选，BoundedMap 的 TTL 已处理惰性清理） */
  pruneExpired(): number {
    return this.sessions.pruneExpired();
  }
}
```

### 8.3 EntityMatcher 接入 ProjectLifecycle

```
// ── 在 ComputeProcess 初始化中 ─────────────────────

const entityMatcher = new EntityMatcher();
const kgRuntime = new KgRecognitionRuntime(projectLifecycle);

// 实体变更时 invalidate 自动机
ipcHandle('kg:entities-changed', async ({ projectId }) => {
  const entities = stmtAllEntities.all({ projectId });
  entityMatcher.setEntities(entities); // 标记 stale，下次 match 时惰性重建
});

// 项目切换时清除
projectLifecycle.onProjectUnbind(() => {
  entityMatcher.dispose();
});
```

---

## 9. TDD 策略

| 测试类别 | 测试内容 | 断言 | 工具 |
| --- | --- | --- | --- |
| CTE 正确性 | 固定图 → querySubgraph(root, depth=2) 结果 | 返回节点集合 === 预期集合 | Vitest + better-sqlite3 in-memory |
| CTE 最短路径 | 已知图 → queryPath(A, B) 返回最短路径 | 路径长度 === 预期，路径合法（每步有边） | Vitest |
| CTE 防环 | 环形图 → querySubgraph 不死循环 | 结果有限，耗时 < 100ms | Vitest |
| 迭代 DFS 栈安全 | 1000 深度链图 → validateGraph | 不抛 RangeError，返回 complete | Vitest |
| 迭代 DFS 防环 | 强连通图 → validateGraph | visitedCount === 节点总数，不死循环 | Vitest |
| 迭代 DFS 可取消 | 大图 + 100ms 后 abort() | 返回 { status: 'aborted' } | Vitest |
| Deque 正确性 | pushBack / popFront 序列 | FIFO 顺序正确，size 正确 | Vitest |
| Deque 性能 | 10k 次 push + pop | 耗时 < 5ms（vs Array.shift ~500ms） | Vitest + performance.now() |
| Aho-Corasick 正确性 | 已知模式集 + 文本 → 匹配结果 | 命中实体 === 预期，位置正确 | Vitest |
| Aho-Corasick 性能 | 1000 实体 × 10KB 文本 | 匹配耗时 < 10ms | Vitest + performance.now() |
| Aho-Corasick 惰性重建 | setEntities → match → setEntities → match | 第二次 match 使用新自动机 | Vitest |
| Session 泄漏 | 创建 200 session（上限 100） | sessions.size <= 100，被驱逐的 session 已 dispose | Vitest |
| Session TTL | 创建 session → 等待 TTL → pruneExpired | 过期 session 被清除 | Vitest + fake timers |
| 项目切换集成 | 切换项目 → 检查 sessions / entityMatcher | 全部清空，无残留引用 | Vitest |
| E2E 性能基准 | 50k 节点图 CTE vs JS 全量对比 | CTE 延迟 < JS 的 1/10 | Vitest benchmark mode |

---

## 10. 依赖关系

```
flowchart LR
    UP["⚡ UtilityProcess\n双进程架构"] --> KG["🔮 KG 查询层重构"]
    LC["♻️ 资源生命周期管理\nProjectLifecycle"] --> KG
    DL["💾 数据层设计\nSQLite 索引"] --> KG

    KG --> AC["Aho-Corasick\n自动机"]
    KG --> CTE["CTE 查询\nComputeProcess"]
    KG --> DFS["迭代化 DFS\n+ Deque"]
    KG --> SL["Session\n生命周期"]

    style KG fill:#e3f2fd,stroke:#1976D2
```

- 前置依赖：⚡ UtilityProcess 双进程架构（CTE 查询卸载到 ComputeProcess）

- 前置依赖：♻️ 资源生命周期管理（KG session 清理 + Aho-Corasick 缓存 invalidate）

- 前置依赖：💾 数据层设计（kg_entities / kg_relations 索引确认）

- 被依赖：🧬 Embedding & RAG 优化（entityMatcher 为 RAG 提供实体识别）

- 被依赖：🎯 Skill 系统优化（buildRulesInjection 为 Skill 提供 KG 规则注入）

> 🎯

Skill 系统全链路优化 — 注册表懒加载 + 内存缓存、同步 FS 全面异步化、SkillScheduler 超时回收与并发控制、AbortController 全链路贯穿。

> ⚠️

核心问题：每次操作都触发同步全目录扫描。 loadSkills() 在主进程同步扫描 skills 目录 + 逐个 readFileSync，是用户操作延迟的直接来源。

---

## 1. 问题全景

| 编号 | 问题 | 严重度 | 当前实现 | 影响 |
| --- | --- | --- | --- | --- |
| P0 #6 | 每次操作触发同步全目录扫描 + 同步读文件 | P0 | readdirSync  • readFileSync 逐个加载 skill 定义 | skill 数量增长后操作延迟线性增长，50 个 skill ~100ms 阻塞 |
| P1 #8 | Skill 文件读写/迁移仍为同步 FS | P1 | writeFileSync / copyFileSync / mkdirSync | 大文件或慢磁盘时主进程冻结 |
| P1 #17 | SkillScheduler completion 丢失无兜底 | P1 | 并发槽位在 task 完成时释放，但无超时保护 | 一次 completion 丢失 → 槽位永久占用 → 最终所有槽位耗尽 |

---

## 2. 架构总览

```
flowchart TB
    subgraph MainProcess["主进程"]
        REQ["Skill 执行请求"] --> SCH["SkillScheduler\n并发控制 + 超时"]
        SCH --> REG["SkillRegistry\n懒加载 + 缓存"]
    end

    subgraph CP["ComputeProcess"]
        REG -->|"IPC"| EXEC["Skill 执行器\n隔离运行"]
        EXEC --> AI["AI Provider\n流式调用"]
    end

    subgraph DP["DataProcess"]
        FS["Skill 文件 I/O\n异步读写"] --> DB[("SQLite\nskill 元数据")]
    end

    REG -.->|"首次加载 / invalidate"| FS
    SCH -->|"timeout / abort"| EXEC

    style MainProcess fill:#fff3e0,stroke:#FF9800
    style CP fill:#e3f2fd,stroke:#1976D2
    style DP fill:#e8f5e9,stroke:#4CAF50
```

---

## 3. Skill 注册表懒加载 + 缓存

### 3.1 当前问题

```
// ── 当前 skillService.ts ────────────────────────────

class SkillService {
  loadSkills(projectId: string): SkillDefinition[] {
    // ❌ 每次调用都重新扫描目录
    const dir = path.join(this.skillsDir, projectId);
    const files = readdirSync(dir); // 同步目录扫描

    return files
      .filter(f => f.endsWith('.json'))
      .map(f => {
        const content = readFileSync(path.join(dir, f), 'utf-8'); // 同步读文件
        return JSON.parse(content);
      });
  }
}
```

### 3.2 重构：SkillRegistry

```
// ── services/skills/skillRegistry.ts ────────────────

import { BoundedMap } from '../utils/BoundedMap';

interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  prompt: string;
  parameters: Record<string, ParameterDef>;
  version: number;
}

export class SkillRegistry {
  // 项目级缓存：projectId → skill 列表
  private cache: BoundedMap<string, Map<string, SkillDefinition>>;
  // 存储 DataProcess 返回的 disposable token（非 FSWatcher 实例，因为跨进程无法序列化）
  private watchTokens: Map<string, string> = new Map();

  constructor(
    private dataProcessIpc: DataProcessIpc,
    private lifecycle: ProjectLifecycle,
    opts: { maxProjects?: number } = {},
  ) {
    this.cache = new BoundedMap({
      maxSize: opts.maxProjects ?? 10,
      onEvict: (projectId) => this.unwatchProject(projectId),
    });

    // 项目切换时清除当前项目缓存
    this.lifecycle.onProjectUnbind((projectId) => {
      this.invalidate(projectId);
      this.unwatchProject(projectId);
    });
  }

  /**
   * 获取 Skill 列表。
   * 首次调用时异步加载并缓存，后续直接返回缓存。
   */
  async getSkills(projectId: string): Promise<SkillDefinition[]> {
    const cached = this.cache.get(projectId);
    if (cached) {
      return Array.from(cached.values());
    }

    // 首次加载：通过 IPC 让 DataProcess 异步读取
    const skills = await this.dataProcessIpc.invoke('skills:load-all', { projectId });
    const skillMap = new Map(skills.map(s => [s.id, s]));
    this.cache.set(projectId, skillMap);

    // 启动文件监听
    this.watchProject(projectId);

    return skills;
  }

  /**
   * 获取单个 Skill（缓存命中时 O(1)）。
   */
  async getSkill(projectId: string, skillId: string): Promise<SkillDefinition | undefined> {
    const skills = await this.getSkills(projectId);
    return skills.find(s => s.id === skillId);
  }

  /**
   * 手动 invalidate（文件变更时触发）。
   */
  invalidate(projectId: string): void {
    this.cache.delete(projectId);
  }

  private watchProject(projectId: string): void {
    if (this.watchTokens.has(projectId)) return;

    // 通过 IPC 让 DataProcess 监听文件变更
    this.dataProcessIpc.invoke('skills:watch', { projectId }).then(token => {
      this.watchTokens.set(projectId, token);
    });

    // 监听变更事件
    this.dataProcessIpc.on(`skills:changed:${projectId}`, () => {
      this.invalidate(projectId);
    });
  }

  private unwatchProject(projectId: string): void {
    const token = this.watchTokens.get(projectId);
    if (token) {
      // 通过 IPC 让 DataProcess 释放 FSWatcher（不直接 close，因为跨进程）
      this.dataProcessIpc.invoke('skills:unwatch', { token });
      this.watchTokens.delete(projectId);
    }
    this.dataProcessIpc.off(`skills:changed:${projectId}`);
  }

  dispose(): void {
    for (const [projectId] of this.watchTokens) {
      this.unwatchProject(projectId);
    }
    this.cache.clear();
  }
}
```

### 3.3 DataProcess 侧：异步文件加载

```
// ── DataProcess 侧：skills/skillFileService.ts ─────

import { readdir, readFile, writeFile, mkdir } from 'fs/promises';
import { watch, type FSWatcher } from 'fs';

export class SkillFileService {
  constructor(private skillsBaseDir: string) {}

  /**
   * 异步加载项目的所有 Skill 定义。
   */
  async loadAll(projectId: string): Promise<SkillDefinition[]> {
    const dir = path.join(this.skillsBaseDir, projectId);

    // 确保目录存在
    await mkdir(dir, { recursive: true });

    const files = await readdir(dir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    // 并发读取所有文件（Promise.all）
    const skills = await Promise.all(
      jsonFiles.map(async f => {
        try {
          const content = await readFile(path.join(dir, f), 'utf-8');
          return JSON.parse(content) as SkillDefinition;
        } catch (err) {
          logger.warn(`Failed to parse skill file: ${f}`, err);
          return null;
        }
      }),
    );

    return skills.filter((s): s is SkillDefinition => s !== null);
  }

  /**
   * 异步保存 Skill 定义。
   */
  async save(projectId: string, skill: SkillDefinition): Promise<void> {
    const dir = path.join(this.skillsBaseDir, projectId);
    await mkdir(dir, { recursive: true });
    const filePath = path.join(dir, `${skill.id}.json`);
    await writeFile(filePath, JSON.stringify(skill, null, 2), 'utf-8');
  }

  /**
   * 监听 Skill 目录变更。
   * 返回 disposable token（字符串），用于后续 unwatch。
   * FSWatcher 实例由 DataProcess 内部持有，不跨进程传递。
   */
  private activeWatchers = new Map<string, FSWatcher>();
  watch(projectId: string, onChange: () => void): string {
    const dir = path.join(this.skillsBaseDir, projectId);
    const token = `watch-${projectId}-${Date.now()}`;
    const watcher = watch(dir, { persistent: false }, (_event, filename) => {
      if (filename?.endsWith('.json')) {
        onChange();
      }
    });
    this.activeWatchers.set(token, watcher);
    return token;
  }
  /**
   * 通过 token 停止监听并释放 FSWatcher。
   */
  unwatch(token: string): void {
    const watcher = this.activeWatchers.get(token);
    if (watcher) {
      watcher.close();
      this.activeWatchers.delete(token);
    }
  }
}
```

### 3.4 优化效果

| 方面 | 当前 | 重构后 |
| --- | --- | --- |
| 首次加载 | ~100ms（50 skills 同步扫描 + 读取） | ~20ms（异步并发读取，在 DataProcess） |
| 后续调用 | ~100ms（每次重新扫描） | < 0.1ms（缓存命中） |
| 主进程阻塞 | ~100ms/次 | 0ms（全部在 DataProcess） |
| 文件变更感知 | 无（每次全量扫描） | fs.watch → invalidate → 惰性重载 |

---

## 4. 同步 FS 全面异步化

### 4.1 需替换的同步调用清单

| 文件 | 同步调用 | 替换为 | 执行位置 |
| --- | --- | --- | --- |
| skillService.ts | readdirSync  • readFileSync | readdir  • readFile（Promise.all 并发） | DataProcess |
| skillService.ts | writeFileSync（保存 skill） | writeFile | DataProcess |
| skillMigration.ts | copyFileSync  • mkdirSync | copyFile  • mkdir | DataProcess |
| skillExport.ts | writeFileSync（导出） | writeFile | DataProcess |
| skillImport.ts | readFileSync（导入） | readFile | DataProcess |

### 4.2 全局 lint 规则

```
// .eslintrc — 禁止在 main/ 下使用同步 FS API
{
  "rules": {
    "no-restricted-imports": ["error", {
      "paths": [{
        "name": "fs",
        "importNames": [
          "readdirSync", "readFileSync", "writeFileSync",
          "copyFileSync", "mkdirSync", "existsSync",
          "statSync", "unlinkSync", "renameSync"
        ],
        "message": "Use async fs/promises API instead. Sync FS blocks the main thread."
      }]
    }]
  }
}
```

---

## 5. SkillScheduler 超时回收与并发控制

### 5.1 当前问题

```
// ── 当前 skillScheduler.ts（简化）─────────────────

class SkillScheduler {
  private slots = new Set<string>(); // 正在执行的 task ID
  private maxConcurrent = 3;

  async execute(task: SkillTask): Promise<SkillResult> {
    // 等待空闲槽位
    while (this.slots.size >= this.maxConcurrent) {
      await delay(100);
    }

    this.slots.add(task.id);
    try {
      const result = await this.runTask(task);
      return result;
    } finally {
      this.slots.delete(task.id); // ❌ 如果 runTask 挂起不返回呢？
    }
  }

  // 问题：
  // 1. 无超时保护 → runTask 永不返回 → 槽位永久占用
  // 2. 无 AbortController → 无法取消卡住的任务
  // 3. 等待槽位用 polling（delay(100)）→ 不优雅
}
```

### 5.2 重构：完整的 SkillScheduler

```
// ── services/skills/skillScheduler.ts ───────────────

interface SchedulerOptions {
  maxConcurrent: number;       // 默认 3
  taskTimeoutMs: number;       // 默认 60_000（1 分钟）
  queueCapacity: number;       // 默认 50
}

interface ScheduledTask {
  task: SkillTask;
  resolve: (result: SkillResult) => void;
  reject: (err: Error) => void;
  abortController: AbortController;
  enqueuedAt: number;
}

export class SkillScheduler {
  private running = new Map<string, {
    task: SkillTask;
    abortController: AbortController;
    startedAt: number;
    timeoutHandle: ReturnType<typeof setTimeout>;
  }>();
  private waiting: ScheduledTask[] = [];
  private opts: Required<SchedulerOptions>;

  constructor(
    private executor: SkillExecutor,
    private lifecycle: ProjectLifecycle,
    opts: Partial<SchedulerOptions> = {},
  ) {
    this.opts = {
      maxConcurrent: opts.maxConcurrent ?? 3,
      taskTimeoutMs: opts.taskTimeoutMs ?? 60_000,
      queueCapacity: opts.queueCapacity ?? 50,
    };

    // 项目切换时取消所有任务
    this.lifecycle.onProjectUnbind(() => this.cancelAll('project_switched'));

    // Session 级清理
    this.lifecycle.onSessionEnd(() => this.cancelAll('session_ended'));
  }

  /**
   * 提交任务执行。
   * 如果并发已满，任务进入等待队列。
   */
  execute(task: SkillTask, signal?: AbortSignal): Promise<SkillResult> {
    return new Promise((resolve, reject) => {
      // 外部 AbortSignal 联动
      const ac = new AbortController();
      if (signal) {
        signal.addEventListener('abort', () => ac.abort(signal.reason), { once: true });
      }

      // 检查队列容量
      if (this.waiting.length >= this.opts.queueCapacity) {
        reject(new Error(`Scheduler queue full (${this.opts.queueCapacity})`));
        return;
      }

      const scheduled: ScheduledTask = {
        task,
        resolve,
        reject,
        abortController: ac,
        enqueuedAt: Date.now(),
      };

      // 有空闲槽位 → 立即执行
      if (this.running.size < this.opts.maxConcurrent) {
        this.startTask(scheduled);
      } else {
        this.waiting.push(scheduled);
      }
    });
  }

  private startTask(scheduled: ScheduledTask): void {
    const { task, resolve, reject, abortController } = scheduled;

    // ── 超时保护 ──
    const timeoutHandle = setTimeout(() => {
      abortController.abort(new Error(`Task ${task.id} timed out after ${this.opts.taskTimeoutMs}ms`));
    }, this.opts.taskTimeoutMs);

    this.running.set(task.id, {
      task,
      abortController,
      startedAt: Date.now(),
      timeoutHandle,
    });

    // 执行
    this.executor
      .run(task, abortController.signal)
      .then(resolve)
      .catch(reject)
      .finally(() => {
        // ── 清理槽位 ──
        clearTimeout(timeoutHandle);
        this.running.delete(task.id);

        // 指标
        metrics.histogram('skill_task_duration_ms', Date.now() - scheduled.enqueuedAt);

        // 触发下一个等待任务
        this.drainQueue();
      });
  }

  private drainQueue(): void {
    while (this.running.size < this.opts.maxConcurrent && this.waiting.length > 0) {
      const next = this.waiting.shift()!;

      // 检查是否已被取消
      if (next.abortController.signal.aborted) {
        next.reject(new Error('Task aborted while waiting'));
        continue;
      }

      this.startTask(next);
    }
  }

  /**
   * 取消所有运行中和等待中的任务。
   */
  cancelAll(reason: string): void {
    // 取消运行中的
    for (const [taskId, entry] of this.running) {
      clearTimeout(entry.timeoutHandle);
      entry.abortController.abort(new Error(`Cancelled: ${reason}`));
    }
    // this.running 会在 finally 中自动清理

    // 拒绝等待中的
    for (const scheduled of this.waiting) {
      scheduled.reject(new Error(`Cancelled: ${reason}`));
    }
    this.waiting = [];
  }

  /** 当前状态（用于监控） */
  get status(): { running: number; waiting: number; capacity: number } {
    return {
      running: this.running.size,
      waiting: this.waiting.length,
      capacity: this.opts.maxConcurrent,
    };
  }

  dispose(): void {
    this.cancelAll('scheduler_disposed');
  }
}
```

### 5.3 对比

| 方面 | 当前 | 重构后 |
| --- | --- | --- |
| 超时保护 | ❌ 无 → 槽位永久占用 | ✅ taskTimeoutMs（默认 60s）→ abort + 释放槽位 |
| 取消支持 | ❌ 无 AbortController | ✅ 外部 signal 联动 + 内部超时 abort |
| 等待机制 | polling delay(100) 循环 | 事件驱动 drainQueue()（零轮询） |
| 队列容量 | ❌ 无限 → 内存膨胀 | ✅ queueCapacity（默认 50） |
| 项目切换 | ❌ 旧任务继续占用资源 | ✅ cancelAll('project_switched') |
| 可观测性 | ❌ 无指标 | ✅ status  • 延迟 histogram |

---

## 6. Skill 执行器：隔离与 AbortController

### 6.1 SkillExecutor

```
// ── services/skills/skillExecutor.ts ────────────────

export class SkillExecutor {
  constructor(
    private computeIpc: ComputeProcessIpc,
    private registry: SkillRegistry,
    private ragService: RagRetrieveService,
  ) {}

  async run(task: SkillTask, signal: AbortSignal): Promise<SkillResult> {
    // 1. 获取 Skill 定义（缓存命中 < 0.1ms）
    const skill = await this.registry.getSkill(task.projectId, task.skillId);
    if (!skill) throw new Error(`Skill not found: ${task.skillId}`);

    // 2. 构建上下文（RAG + KG 注入）
    const context = await this.buildContext(task, skill, signal);

    // 3. 发送到 ComputeProcess 执行
    const result = await this.computeIpc.invoke('skill:execute', {
      skill,
      context,
      parameters: task.parameters,
    }, { signal }); // AbortSignal 透传到 IPC

    return result;
  }

  private async buildContext(
    task: SkillTask,
    skill: SkillDefinition,
    signal: AbortSignal,
  ): Promise<SkillContext> {
    const parts: string[] = [];

    // RAG 上下文（如果 skill 需要）
    if (skill.parameters._useRag !== false) {
      const ragResult = await this.ragService.retrieve({
        query: task.input,
        projectId: task.projectId,
        topK: 5,
      }, signal);
      parts.push(
        ragResult.chunks.map(c => c.text).join('\n\n'),
      );
    }

    // KG 规则注入（如果 skill 需要）
    if (skill.parameters._useKgRules !== false) {
      const rules = await this.computeIpc.invoke('kg:build-rules', {
        projectId: task.projectId,
        context: { mentionedEntityIds: task.entityIds ?? [] },
      }, { signal });
      parts.push(rules);
    }

    return {
      systemPrompt: skill.prompt,
      retrievedContext: parts.join('\n---\n'),
      userInput: task.input,
    };
  }
}
```

### 6.2 AbortController 全链路

```
sequenceDiagram
    participant U as 用户
    participant S as SkillScheduler
    participant E as SkillExecutor
    participant C as ComputeProcess

    U->>S: execute(task, signal)
    S->>S: 创建内部 AbortController
    S->>S: 链接外部 signal
    S->>S: 设置超时 timer

    S->>E: run(task, ac.signal)
    E->>C: IPC skill:execute (signal)
    C->>C: 执行中...

    alt 用户取消
        U->>S: signal.abort()
        S->>E: ac.abort() 传播
        E->>C: IPC abort
        C-->>E: AbortError
        E-->>S: AbortError
    else 超时
        S->>S: timer 触发
        S->>E: ac.abort("timeout")
        E->>C: IPC abort
    else 正常完成
        C-->>E: result
        E-->>S: result
        S->>S: clearTimeout + 释放槽位
    end
```

---

## 7. Skill 文件迁移：异步化

### 7.1 当前迁移代码

```
// ── 当前 skillMigration.ts ──────────────────────────

function migrateSkills(fromDir: string, toDir: string): void {
  mkdirSync(toDir, { recursive: true }); // ❌ 同步
  const files = readdirSync(fromDir);     // ❌ 同步

  for (const f of files) {
    copyFileSync(                          // ❌ 同步
      path.join(fromDir, f),
      path.join(toDir, f),
    );
  }
}
```

### 7.2 异步重写

```
// ── DataProcess 侧：skills/skillMigration.ts ───────

import { mkdir, readdir, copyFile, stat } from 'fs/promises';

export async function migrateSkills(
  fromDir: string,
  toDir: string,
  signal?: AbortSignal,
): Promise<{ migratedCount: number; errors: string[] }> {
  await mkdir(toDir, { recursive: true });

  const files = await readdir(fromDir);
  const jsonFiles = files.filter(f => f.endsWith('.json'));
  const errors: string[] = [];
  let migratedCount = 0;

  // 分批迁移，避免一次性打开过多文件描述符
  const BATCH_SIZE = 20;
  for (let i = 0; i < jsonFiles.length; i += BATCH_SIZE) {
    if (signal?.aborted) break;

    const batch = jsonFiles.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(f =>
        copyFile(path.join(fromDir, f), path.join(toDir, f)),
      ),
    );

    for (let j = 0; j < results.length; j++) {
      if (results[j].status === 'fulfilled') {
        migratedCount++;
      } else {
        errors.push(`${batch[j]}: ${(results[j] as PromiseRejectedResult).reason}`);
      }
    }
  }

  return { migratedCount, errors };
}
```

---

## 8. finalizeTask 改造

### 8.1 当前问题

```
// 当前：finalizeTask 没有取消语义
async function finalizeTask(task: SkillTask): Promise<void> {
  // 后处理逻辑：保存结果、更新统计等
  // ❌ 如果在这里卡住，scheduler 的 finally 块永远不会执行
  await saveResult(task);
  await updateStats(task);
}
```

### 8.2 添加 AbortController + 超时

```
// ── 改造后 ──────────────────────────────────────────

async function finalizeTask(
  task: SkillTask,
  result: SkillResult,
  signal: AbortSignal,
): Promise<void> {
  // 给 finalize 阶段一个独立超时（比 task 整体超时短）
  const finalizeTimeout = AbortSignal.timeout(10_000); // 10s
  const combined = AbortSignal.any([signal, finalizeTimeout]);

  try {
    await Promise.all([
      saveResult(task, result, combined),
      updateStats(task, result, combined),
    ]);
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      logger.warn(`finalizeTask aborted for task ${task.id}`);
      // 不抛出——finalize 失败不应影响主流程
    } else {
      logger.error(`finalizeTask error for task ${task.id}`, err);
    }
  }
}
```

---

## 9. TDD 策略

| 测试类别 | 测试内容 | 断言 | 工具 |
| --- | --- | --- | --- |
| 注册表缓存命中 | 两次 getSkills(同一 projectId) | 第二次不触发 IPC 调用 | Vitest + spy |
| 注册表 invalidate | invalidate → getSkills 触发重新加载 | 第二次触发 IPC 调用 | Vitest + spy |
| 注册表项目切换 | 切换项目 → 旧缓存清除 | 旧项目再次 getSkills 触发 IPC | Vitest |
| 异步文件加载 | 目录中 50 个 JSON → loadAll | 全部正确加载，耗时 < 50ms | Vitest + tmp dir |
| 文件加载容错 | 1 个损坏 JSON + 49 个正常 | 返回 49 个，不抛错 | Vitest |
| Scheduler 并发限制 | 提交 10 个任务，maxConcurrent=3 | 任意时刻最多 3 个同时执行 | Vitest + mock executor |
| Scheduler 超时回收 | 任务挂起超过 timeoutMs | 自动 abort + 释放槽位 + 下一个任务启动 | Vitest + fake timers |
| Scheduler 队列满 | 提交超过 queueCapacity 个任务 | 超出部分 reject | Vitest |
| Scheduler cancelAll | 执行中 + 等待中的任务 | 全部 reject，running=0，waiting=0 | Vitest |
| Scheduler 外部 abort | 外部 signal.abort() | 任务 reject AbortError，槽位释放 | Vitest |
| drainQueue 事件驱动 | 任务完成后自动启动等待任务 | 无轮询延迟，立即启动 | Vitest + timing assertions |
| finalizeTask 超时 | finalize 挂起超过 10s | 不影响 scheduler 槽位释放 | Vitest + fake timers |
| 迁移容错 | 50 文件中 2 个复制失败 | 返回 migratedCount=48, errors.length=2 | Vitest + mock fs |
| 迁移可取消 | 迁移中 abort | 停止后续批次，返回已迁移数量 | Vitest |
| ESLint 同步 FS | 在 main/ 目录中使用 readFileSync | lint error | ESLint |

---

## 10. 依赖关系

```
flowchart LR
    UP["⚡ UtilityProcess\n双进程架构"] --> SK["🎯 Skill 系统优化"]
    LC["♻️ 资源生命周期\nProjectLifecycle"] --> SK
    KG["🔮 KG 查询层\nbuildRulesInjection"] --> SK
    EMB["🧬 Embedding & RAG\nragRetrieve"] --> SK

    SK --> AI["🛡️ AI 流式写入\nSkill 输出写入"]

    style SK fill:#e8f5e9,stroke:#4CAF50
```

- 前置依赖：⚡ UtilityProcess 双进程架构（DataProcess 文件 I/O + ComputeProcess 执行）

- 前置依赖：♻️ 资源生命周期管理（Scheduler 槽位 Session/Project 级清理）

- 协作：🔮 KG 查询层（buildRulesInjection 为 Skill 上下文提供 KG 规则注入）

- 协作：🧬 Embedding & RAG（ragRetrieve 为 Skill 上下文提供检索增强）

- 被依赖：🛡️ AI 流式写入防护策略（Skill 输出通过流式写入通道写入文档）

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

### 🔧 工程侧

> 🛡️

针对"AI 机枪式输出 vs 人类节奏存储"的架构矛盾，为 CN 后端设计 AI 流式写入防护体系。确保 AI 大规模生成内容时主进程不假死、数据不损坏、中断可回滚。

> ⚠️

关键取舍：本页只管后端职责。 渲染侧的 RAF 节流、虚拟化渲染、延迟后处理属于前端优化。后端只负责：Chunk Batching、事务合并、背压信号、AbortController 联动。

---

## 1. Notion 的教训

| 问题 | 根因 | 后果 | CN 是否已存在 |
| --- | --- | --- | --- |
| SQLite 被瞬间淹没 | 每个 Block 触发独立 SQLite 写事务，高频写入阻塞 event loop | 主进程假死，用户操作无响应 | ⚠️ 潜在风险 — 当前 file:document:save 是逐次同步写入 |
| IPC 通道拥堵 | Token-by-Token 高频推送无节流，IPC 消息队列爆满 | 渲染进程 OOM | ✅ 已有防护 — pushBackpressure.ts 的 chunk 可丢弃策略 |
| 一致性冲突 | AI 中断时本地已写入脏数据，修复不一致时触发损坏检测 | 数据库强制冻结 | ⚠️ 潜在风险 — AI 中断后无回滚机制 |
| React 渲染树瞬间重建 | 批量 Block 挂载耗尽 Renderer 算力 | 渲染进程白屏 | 前端侧问题，不在本文档范围 |

---

## 2. 防护架构总览

```
graph LR
    subgraph LLM["上游 LLM"]
        S["SSE stream<br>token-by-token"]
    end

    subgraph Main["Main Process"]
        A["aiService<br>readSse()"] -->|"raw tokens"| B["ChunkBatcher<br>100ms / 10 tokens"]
        B -->|"batched chunks"| C["webContents.send<br>（批量推送）"]
        B -->|"batched content"| D["WriteQueue<br>（写入队列）"]
    end

    subgraph Data["DataProcess"]
        D -->|"postMessage"| E["TransactionBatcher<br>（事务合并）"]
        E -->|"single transaction"| F["SQLite<br>WAL mode"]
    end

    subgraph Renderer["Renderer"]
        C --> G["UI 批量更新"]
    end

    D -->|"背压信号"| A
    G -->|"ai:skill:cancel"| A

    style B fill:#e3f2fd,stroke:#1976D2
    style E fill:#e8f5e9,stroke:#4CAF50
    style D fill:#fff3e0,stroke:#FF9800
```

四道防线：

| 防线 | 位置 | 机制 | 解决的问题 |
| --- | --- | --- | --- |
| ① Chunk Batching | Main — aiService | 时间窗口 + 数量阈值合并推送 | IPC 通道拥堵 |
| ② Transaction Batching | DataProcess | 一次 AI 生成周期 = 一个 SQLite 事务 | SQLite 被瞬间淹没 |
| ③ Write Backpressure | Main ↔ DataProcess | 队列深度超限 → 暂停 LLM 消费 | 写入队列无限膨胀 |
| ④ Abort + Rollback | 全链路 | 取消 → fetch abort + 事务回滚 | 一致性冲突 |

---

## 3. Chunk Batching — IPC 推送合并

### 3.1 设计

```
raw tokens:  t1 t2 t3 t4 t5 t6 t7 t8 t9 t10 t11 ...
             |________100ms_________|  |________100ms_________|
batched:     [t1..t10]                  [t11..t20]
```

合并规则：

- 时间窗口：100ms（可配置）

- 数量阈值：10 tokens（可配置）

- 任一条件满足即触发 flush

- 用户取消信号立即丢弃缓冲区

### 3.2 实现

```
// ── services/ai/chunkBatcher.ts ─────────────────────

interface ChunkBatcherOptions {
  flushIntervalMs: number;   // 默认 100
  maxBatchSize: number;      // 默认 10
  onFlush: (chunks: AiStreamChunk[]) => void;
  onAbort: () => void;
}

class ChunkBatcher {
  private buffer: AiStreamChunk[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;
  private aborted = false;

  constructor(private readonly opts: ChunkBatcherOptions) {}

  /** 接收单个 token chunk */
  push(chunk: AiStreamChunk): void {
    if (this.aborted) return;

    this.buffer.push(chunk);

    if (this.buffer.length >= this.opts.maxBatchSize) {
      this.flush();
    } else if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), this.opts.flushIntervalMs);
    }
  }

  /** 强制 flush 缓冲区 */
  flush(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.buffer.length === 0) return;

    const batch = this.buffer;
    this.buffer = [];
    this.opts.onFlush(batch);
  }

  /** 取消 — 丢弃缓冲区 */
  abort(): void {
    this.aborted = true;
    this.buffer = [];
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.opts.onAbort();
  }

  /** 流结束 — flush 残余 + 清理 */
  end(): void {
    this.flush();
  }
}
```

### 3.3 与 pushBackpressure.ts 的整合

| 组件 | 职责 | 关系 |
| --- | --- | --- |
| ChunkBatcher | token 级别的时间/数量合并 | 输出批量 chunk → 传给 pushBackpressure |
| pushBackpressure.ts | IPC 推送级别的背压控制（chunk 可丢弃，控制事件必达） | 接收批量 chunk → webContents.send() |

```
graph LR
    A["SSE token"] --> B["ChunkBatcher<br>合并 10 tokens / 100ms"]
    B --> C["pushBackpressure<br>chunk 可丢弃"]
    C --> D["webContents.send<br>批量推送到 Renderer"]

    style B fill:#e3f2fd,stroke:#1976D2
    style C fill:#fff3e0,stroke:#FF9800
```

---

## 4. Transaction Batching — SQLite 写入批量化

### 4.1 核心原则

> 🔑

一次完整的 AI 生成周期（ai:skill:run → stream 结束）= 一个 SQLite 事务。 中间状态不 commit，只在最终成功时一次性 commit。中断时整体 rollback。

### 4.2 事务生命周期

```
sequenceDiagram
    participant M as Main
    participant DP as DataProcess
    participant DB as SQLite

    M->>DP: beginAiWriteTransaction(docId)
    DP->>DB: BEGIN IMMEDIATE

    loop AI streaming
        M->>DP: batchWrite(blocks[])
        DP->>DB: INSERT/UPDATE (within txn)
    end

    alt 正常完成
        M->>DP: commitAiWriteTransaction()
        DP->>DB: COMMIT
        DP->>M: { ok: true }
    else 用户取消 / 错误
        M->>DP: rollbackAiWriteTransaction()
        DP->>DB: ROLLBACK
        DP->>M: { ok: true, rolledBack: true }
    end
```

### 4.3 DataProcess 侧实现

```
// ── dataProcess/aiTransactionManager.ts ─────────────

class AiTransactionManager {
  private activeTransactions = new Map<string, {
    db: Database;
    startTime: number;
    writeCount: number;
  }>();

  /** 开始 AI 写入事务 */
  begin(transactionId: string, db: Database): void {
    if (this.activeTransactions.has(transactionId)) {
      throw new Error(`Transaction ${transactionId} already active`);
    }

    db.exec('BEGIN IMMEDIATE');
    this.activeTransactions.set(transactionId, {
      db,
      startTime: Date.now(),
      writeCount: 0,
    });
  }

  /** 批量写入（在事务内） */
  batchWrite(transactionId: string, operations: WriteOp[]): void {
    const txn = this.activeTransactions.get(transactionId);
    if (!txn) throw new Error(`No active transaction: ${transactionId}`);

    for (const op of operations) {
      this.executeWrite(txn.db, op);
      txn.writeCount++;
    }
  }

  /** 提交 */
  commit(transactionId: string): { writeCount: number; durationMs: number } {
    const txn = this.activeTransactions.get(transactionId);
    if (!txn) throw new Error(`No active transaction: ${transactionId}`);

    txn.db.exec('COMMIT');
    const result = {
      writeCount: txn.writeCount,
      durationMs: Date.now() - txn.startTime,
    };
    this.activeTransactions.delete(transactionId);
    return result;
  }

  /** 回滚 */
  rollback(transactionId: string): void {
    const txn = this.activeTransactions.get(transactionId);
    if (!txn) return; // 幂等

    try {
      txn.db.exec('ROLLBACK');
    } catch {
      // ROLLBACK 失败通常是因为事务已经自动回滚
    }
    this.activeTransactions.delete(transactionId);
  }

  /** 超时保护：清理所有超过 5 分钟的事务 */
  cleanupStale(): void {
    const MAX_AGE_MS = 5 * 60_000;
    const now = Date.now();

    for (const [id, txn] of this.activeTransactions) {
      if (now - txn.startTime > MAX_AGE_MS) {
        log.warn(`[AiTxn] stale transaction ${id}, rolling back`);
        this.rollback(id);
      }
    }
  }
}
```

### 4.4 性能对比预估

| 场景 | 当前（逐次写入） | 优化后（事务合并） | 提升 |
| --- | --- | --- | --- |
| AI 生成 100 blocks | 100 次 BEGIN  • COMMIT（~200ms） | 1 次 BEGIN IMMEDIATE  • 100 次 INSERT  • 1 次 COMMIT（~5ms） | ~40x |
| AI 生成 500 blocks | 500 次事务（~1s，阻塞主线程） | 1 次事务（~20ms） | ~50x |
| AI 生成 1000 blocks | 1000 次事务（~2s，主进程假死） | 1 次事务（~40ms） | ~50x |

> 💡

性能提升核心来源：消除重复的 fsync。WAL 模式下每次 COMMIT 都会触发 fsync，合并为一次事务意味着只有一次 fsync。

---

## 5. Write Backpressure — 写入队列背压

### 5.1 背压机制

```
graph LR
    A["Main: AI chunk"] --> B["WriteQueue"]
    B -->|"depth < HIGH_WATER"| C["正常写入"]
    B -->|"depth ≥ HIGH_WATER"| D["发送背压信号"]
    D --> E["Main: 暂停消费 SSE"]
    B -->|"depth < LOW_WATER"| F["解除背压信号"]
    F --> G["Main: 恢复消费 SSE"]

    style D fill:#ffebee,stroke:#f44336
    style F fill:#e8f5e9,stroke:#4CAF50
```

### 5.2 水位参数

| 参数 | 默认值 | 含义 |
| --- | --- | --- |
| HIGH_WATER_MARK | 50 | 队列深度超过此值 → 发送背压信号 |
| LOW_WATER_MARK | 10 | 队列深度低于此值 → 解除背压信号 |
| MAX_QUEUE_SIZE | 200 | 队列满 → 开始丢弃非关键 chunk（保留控制事件） |

### 5.3 实现

```
// ── services/ai/writeBackpressure.ts ────────────────

class WriteBackpressure {
  private isPaused = false;

  constructor(
    private readonly queue: WriteQueue,
    private readonly onPause: () => void,
    private readonly onResume: () => void,
    private readonly HIGH_WATER = 50,
    private readonly LOW_WATER = 10,
  ) {
    queue.on('enqueue', () => this.checkPressure());
    queue.on('dequeue', () => this.checkRelease());
  }

  private checkPressure(): void {
    if (!this.isPaused && this.queue.depth >= this.HIGH_WATER) {
      this.isPaused = true;
      this.onPause();   // → 暂停 SSE 消费
    }
  }

  private checkRelease(): void {
    if (this.isPaused && this.queue.depth <= this.LOW_WATER) {
      this.isPaused = false;
      this.onResume();  // → 恢复 SSE 消费
    }
  }
}
```

### 5.4 SSE 消费暂停机制

```
// ── services/ai/aiService.ts（改造）─────────────────

async function* readSseWithBackpressure(
  response: Response,
  signal: AbortSignal,
  backpressure: WriteBackpressure,
): AsyncGenerator<string> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  while (true) {
    // 背压时等待
    while (backpressure.isPaused && !signal.aborted) {
      await new Promise((r) => setTimeout(r, 50));
    }

    if (signal.aborted) break;

    const { done, value } = await reader.read();
    if (done) break;

    yield decoder.decode(value, { stream: true });
  }
}
```

---

## 6. AbortController 全链路联动

### 6.1 取消链路

```
sequenceDiagram
    participant R as Renderer
    participant M as Main
    participant LLM as LLM API
    participant DP as DataProcess

    R->>M: ai:skill:cancel(streamId)

    par 并行取消
        M->>LLM: fetchController.abort()
        Note right of LLM: SSE 连接断开
    and
        M->>M: chunkBatcher.abort()
        Note right of M: 丢弃缓冲区
    and
        M->>DP: rollbackAiWriteTransaction(txnId)
        Note right of DP: ROLLBACK<br>撤销所有未提交写入
    end

    DP->>M: { ok: true, rolledBack: true }
    M->>R: SKILL_STREAM_DONE_CHANNEL<br>{ reason: 'cancelled', rolledBack: true }
```

### 6.2 取消管理器

```
// ── services/ai/streamCancelManager.ts ──────────────

interface ActiveStream {
  streamId: string;
  fetchController: AbortController;
  chunkBatcher: ChunkBatcher;
  transactionId: string;
  startedAt: number;
}

class StreamCancelManager {
  private active = new BoundedMap<string, ActiveStream>({
    maxSize: 20,
    defaultTtlMs: 10 * 60_000,  // 10 min 兜底
  });

  register(stream: ActiveStream): void {
    this.active.set(stream.streamId, stream);
  }

  async cancel(streamId: string): Promise<CancelResult> {
    const stream = this.active.get(streamId);
    if (!stream) return { found: false };

    // ① 停止 LLM 请求
    stream.fetchController.abort();

    // ② 丢弃 chunk 缓冲区
    stream.chunkBatcher.abort();

    // ③ 回滚数据库事务
    await dataProcess.rollbackAiWriteTransaction(stream.transactionId);

    this.active.delete(streamId);
    return { found: true, rolledBack: true };
  }

  /** 正常完成时清理 */
  complete(streamId: string): void {
    this.active.delete(streamId);
  }
}
```

### 6.3 各种中断场景

| 中断场景 | 触发方式 | 结果 |
| --- | --- | --- |
| 用户主动取消 | ai:skill:cancel IPC | abort + rollback + 通知前端 |
| 网络中断 | fetch AbortError / TypeError | 自动触发 rollback + 通知前端 |
| IPC 超时（30s） | IpcTimeoutError in runtime-validation | abort + rollback（通过 AbortController 注入） |
| LLM 返回错误 | SSE stream error event | rollback + 通知前端错误详情 |
| App 退出 | before-quit → gracefulShutdown() | rollback 所有活跃事务（AiTransactionManager.cleanupStale()） |

---

## 7. 数据一致性保护

### 7.1 原子写入保证

```
正常流程：
  BEGIN IMMEDIATE → N × INSERT/UPDATE → COMMIT
  → 全部可见，一致

中断流程：
  BEGIN IMMEDIATE → K × INSERT/UPDATE → ROLLBACK
  → 全部不可见，回到生成前状态
```

无 Notion 式"损坏检测 → 强制冻结"：因为原子事务保证了不会出现半写状态。

### 7.2 并发编辑冲突保护

AI 生成期间用户可能同时手动编辑同一文档：

```
// ── dataProcess/conflictGuard.ts ────────────────────

/**
 * 写入前检查文档版本号，防止并发冲突。
 * AI 事务开始时记录文档版本号，
 * commit 前再次检查，如果版本号已被用户编辑更新，则拒绝 commit。
 */
function commitWithVersionCheck(
  db: Database,
  docId: string,
  expectedVersion: number,
): CommitResult {
  const current = db.prepare(
    'SELECT version FROM documents WHERE document_id = ?',
  ).get(docId) as { version: number } | undefined;

  if (!current || current.version !== expectedVersion) {
    db.exec('ROLLBACK');
    return {
      ok: false,
      error: 'VERSION_CONFLICT',
      message: 'Document was modified during AI generation',
    };
  }

  db.exec('COMMIT');
  return { ok: true };
}
```

### 7.3 前端侧协作

| 后端提供 | 前端配合 |
| --- | --- |
| Chunk Batching 后的批量 IPC push | 按批量更新 UI，不需逐 token 重渲染 |
| 背压信号（ai:stream:backpressure event） | 降低渲染频率或显示"生成中"占位 |
| SKILL_STREAM_DONE_CHANNEL / abort 事件 | 触发语法高亮、LaTeX 等后处理 |
| 事务回滚通知（{ rolledBack: true }） | 恢复到生成前的文档状态 |
| 版本冲突通知（VERSION_CONFLICT） | 提示用户 AI 生成被丢弃，手动编辑已保留 |

---

## 8. ai:skill:run 完整流程（防护后）

```
sequenceDiagram
    participant R as Renderer
    participant M as Main
    participant CB as ChunkBatcher
    participant BP as Backpressure
    participant LLM as LLM API
    participant DP as DataProcess

    R->>M: ai:skill:run(skillId, docId)

    Note over M: ① 初始化
    M->>M: create AbortController
    M->>M: create ChunkBatcher(100ms, 10)
    M->>DP: beginAiWriteTransaction(txnId, docId)
    M->>M: register StreamCancelManager

    Note over M: ② Context 装配
    M->>M: assembleContext(skillId)

    Note over M: ③ LLM 调用
    M->>LLM: fetch(prompt, { signal })

    loop SSE streaming
        LLM->>M: token chunk
        M->>CB: push(chunk)

        alt batch ready
            CB->>R: webContents.send(batchedChunks)
            CB->>DP: batchWrite(blocks)
        end

        alt backpressure
            BP->>M: pause signal
            M->>M: wait for resume
        end
    end

    alt 正常完成
        M->>CB: end()
        CB->>R: final batch
        M->>DP: commitWithVersionCheck(txnId)
        M->>R: SKILL_STREAM_DONE_CHANNEL
    else 取消 / 错误
        M->>CB: abort()
        M->>DP: rollback(txnId)
        M->>R: SKILL_STREAM_DONE_CHANNEL { cancelled/error }
    end
```

---

## 9. 配置参数总表

| 参数 | 默认值 | 位置 | 可调节 |
| --- | --- | --- | --- |
| Chunk flush 间隔 | 100ms | ChunkBatcher | ✅ 构造时传入 |
| Chunk batch 大小 | 10 tokens | ChunkBatcher | ✅ 构造时传入 |
| Write queue HIGH_WATER | 50 | WriteBackpressure | ✅ 构造时传入 |
| Write queue LOW_WATER | 10 | WriteBackpressure | ✅ 构造时传入 |
| Write queue MAX_SIZE | 200 | WriteBackpressure | ✅ 构造时传入 |
| 事务超时 | 5 min | AiTransactionManager | ✅ 构造时传入 |
| 活跃流 TTL | 10 min | StreamCancelManager | ✅ BoundedMap 参数 |

---

## 10. TDD 策略

| 测试类别 | 测试内容 | 关键断言 |
| --- | --- | --- |
| ChunkBatcher contract | 时间合并 + 数量合并 + abort | 100ms 内 push 20 tokens → flush 2 次；abort 后 buffer 清空 |
| Transaction batching | 模拟 500 blocks 写入 | 只产生 1 个 SQLite transaction；commit 后所有 blocks 可查 |
| Rollback 正确性 | 写入 200 blocks → rollback | 数据库状态回到生成前；文档版本号不变 |
| Backpressure | 队列满时信号发出 + 消化后解除 | onPause / onResume 在正确水位触发 |
| AbortController 全链路 | 取消 → fetch abort + rollback + stream end | 三个动作全部触发；无残留事务 |
| 版本冲突 | AI 生成中用户修改文档 → commit 被拒绝 | 返回 VERSION_CONFLICT；事务 rollback |
| 压力测试 | AI 连续生成 1000 blocks | 主进程 event loop 延迟 < 50ms；内存不泄漏 |
| Stale 清理 | 事务超过 5min 未完成 | 自动 rollback；日志记录 |

---

## 11. 实施路径

| 阶段 | 内容 | 预计工作量 |
| --- | --- | --- |
| Phase 1 | ChunkBatcher 实现 + 测试 + 接入 aiService | 0.5 天 |
| Phase 2 | AiTransactionManager 实现 + 测试（DataProcess 侧） | 0.5 天 |
| Phase 3 | StreamCancelManager  • abort 全链路联动 | 0.5 天 |
| Phase 4 | WriteBackpressure  • SSE 暂停机制 | 0.5 天 |
| Phase 5 | 版本冲突保护 + 前端协议对接 | 0.5 天 |
| Phase 6 | 压力测试 + 参数调优 | 0.5 天 |

> ✅

独立可启动。 Phase 1（ChunkBatcher）不依赖任何其他模块。Phase 2（TransactionBatcher）依赖 DataProcess，可在 UtilityProcess 完成后对接。

---

## 12. 相关页面

- ‣ — DataProcess 写入通道

- ‣ — pushBackpressure.ts 现有背压机制

- ‣ — StreamCancelManager 的 BoundedMap

- ‣ — 优雅停机时的活跃事务清理

> 🔒

补齐 CN 后端的基础防护底线——SQLite 配置调优、全局异常捕获、优雅停机、窗口安全、文件 I/O 原子写入。这些是"不崩溃、不丢数据、不泄漏"的最低保障，独立于其他重构，可立即启动。

---

## 1. 问题全景

| 编号 | 问题 | 风险 | 当前状态 |
| --- | --- | --- | --- |
| P2 #19 | SQLite 缺少 busy_timeout 与 synchronous = NORMAL | 并发 IPC 触发 SQLITE_BUSY 直接报错；WAL 下默认 FULL 同步性能浪费 | ❌ 未配置 |
| P2 #20 | 主进程全局异常捕获与优雅停机缺失 | uncaughtException / unhandledRejection 无处理 → 进程崩溃无日志；WAL checkpoint 不执行 | ❌ 仅 before-quit 做了 db.close() |
| P2 #21 | 窗口安全防护不完整 | 渲染进程可通过 window.open 创建新 Electron 窗口；无 navigation 限制 | ❌ 未配置 |
| 补充 | 文件 I/O 非原子写入 | 写入中断（crash / 断电）导致 .creonow 元数据损坏 | ❌ 多处直接 writeFileSync |

> ℹ️

注：P0 #4（KG queryValidate 递归 DFS 栈溢出）已归入 ‣，它是算法 bug 而非基础设施问题。

---

## 2. SQLite 配置调优

### 2.1 需要添加的 PRAGMA

| PRAGMA | 推荐值 | 作用 | 安全性 |
| --- | --- | --- | --- |
| busy_timeout | 5000（5 秒） | 遇到锁时排队等待而非直接抛 SQLITE_BUSY | ✅ 无风险 |
| synchronous | NORMAL | WAL 模式下安全且性能更优（减少 fsync 次数） | ✅ SQLite 官方推荐 WAL + NORMAL 组合 |
| mmap_size | 268435456（256 MB） | 内存映射 I/O 提升读性能 | ✅ 只影响读路径，写仍走 WAL |
| cache_size | -20000（20 MB） | 增大页缓存，减少磁盘 I/O（负值 = KB 单位） | ✅ 无风险，纯性能 |

> ℹ️

关于 cache_size 的层次关系：此处 -20000（20 MB）为通用默认值，适用于单进程场景或 applyRecommendedPragmas() 初始配置。引入双进程架构后，各进程按角色差异化配置：DataProcess（读写）推荐 -64000（64 MB）、ComputeProcess / Main（只读）推荐 -16000（16 MB），详见 ‣ §5.3 和 ‣ §8.2。applyRecommendedPragmas() 提供基线，各进程启动时可按需覆盖。

### 2.2 当前 vs 目标

```
// ── db/init.ts 当前 ─────────────────────────────────
conn.pragma('journal_mode = WAL');
conn.pragma('foreign_keys = ON');

// ── db/init.ts 目标 ─────────────────────────────────
conn.pragma('journal_mode = WAL');
conn.pragma('foreign_keys = ON');
conn.pragma('busy_timeout = 5000');       // ← 新增
conn.pragma('synchronous = NORMAL');      // ← 新增
conn.pragma('mmap_size = 268435456');     // ← 新增（256 MB）
conn.pragma('cache_size = -20000');       // ← 新增（20 MB）
```

### 2.3 多进程场景

引入 UtilityProcess 后，三个进程各自持有独立的 SQLite 连接，每个连接都需要设置这些 PRAGMA：

| 进程 | 连接用途 | PRAGMA 设置位置 |
| --- | --- | --- |
| Main | 轻量只读查询 | db/init.ts → initDb() |
| ComputeProcess | 只读（FTS / KG CTE / 向量搜索） | ComputeProcess 启动时的 openDb() |
| DataProcess | 所有写操作 | DataProcess 启动时的 openDb() |

> 🔑

busy_timeout 对多进程尤为关键：DataProcess 写入时会短暂持有写锁，ComputeProcess 的并发读如果恰好需要 checkpoint 则会触发锁冲突。busy_timeout = 5000 允许最多等待 5 秒，避免直接报错。

### 2.4 抽取为工具函数

```
// ── db/pragmas.ts ───────────────────────────────────

/**
 * 对任何 better-sqlite3 连接统一设置推荐 PRAGMA。
 * 在 Main / ComputeProcess / DataProcess 都调用。
 */
export function applyRecommendedPragmas(conn: Database): void {
  conn.pragma('journal_mode = WAL');
  conn.pragma('foreign_keys = ON');
  conn.pragma('busy_timeout = 5000');
  conn.pragma('synchronous = NORMAL');
  conn.pragma('mmap_size = 268435456');
  conn.pragma('cache_size = -20000');
}
```

---

## 3. 全局异常捕获

### 3.1 需要捕获的事件

| 事件 | 触发场景 | 当前处理 | 目标处理 |
| --- | --- | --- | --- |
| uncaughtException | 同步代码抛出未捕获异常 | ❌ 无 → 进程直接崩溃 | log fatal → graceful shutdown → exit(1) |
| unhandledRejection | Promise reject 未被 catch | ❌ 无 → Node 默认 warning（v18+ 可能崩溃） | log fatal → graceful shutdown → exit(1) |
| render-process-gone | 渲染进程崩溃 / killed | ❌ 无 → 白屏 | log + 尝试 reload / 提示用户重启 |
| child-process-gone | UtilityProcess 崩溃 | ❌ 无（目前无子进程） | log + 自动重启子进程 |

### 3.2 实现

```
// ── lifecycle/globalExceptionHandler.ts ─────────────

import { app, dialog } from 'electron';

/**
 * 全局异常捕获 — 在 app.whenReady() **之前** 注册。
 *
 * 原则：
 * - 不 swallow 异常：捕获后必须退出，不试图"恢复"运行
 * - 记录足够信息用于事后排查
 * - 触发优雅停机链保护数据
 */
export function installGlobalExceptionHandlers(
  logger: Logger,
  shutdown: () => Promise<void>,
): void {
  let isShuttingDown = false;

  async function handleFatal(
    type: 'uncaughtException' | 'unhandledRejection',
    error: unknown,
  ): Promise<void> {
    // 防止 shutdown 过程中再次触发
    if (isShuttingDown) return;
    isShuttingDown = true;

    // ① 记录致命错误
    logger.fatal({
      event: 'global_fatal',
      type,
      error: error instanceof Error
        ? { message: error.message, stack: error.stack, name: error.name }
        : { message: String(error) },
    });

    // ② 触发优雅停机
    try {
      await withTimeout(shutdown(), 5_000, 'fatal-shutdown');
    } catch {
      // shutdown 本身失败，忽略
    }

    // ③ 强制退出
    process.exit(1);
  }

  process.on('uncaughtException', (err) => handleFatal('uncaughtException', err));
  process.on('unhandledRejection', (reason) => handleFatal('unhandledRejection', reason));
}
```

### 3.3 注册时机

```
// ── index.ts（改造后）───────────────────────────────

// ⚠️ 在 app.whenReady() 之前注册，确保初始化阶段的异常也能捕获
installGlobalExceptionHandlers(earlyLogger, gracefulShutdown);

app.whenReady().then(async () => {
  const logger = createMainLogger(app.getPath('userData'));
  const db = initDb({ userDataDir, logger });
  // ...
});
```

### 3.4 渲染进程崩溃处理

```
// ── window/crashRecovery.ts ─────────────────────────

mainWindow.webContents.on('render-process-gone', (event, details) => {
  logger.error({
    event: 'render_process_gone',
    reason: details.reason,    // 'crashed' | 'killed' | 'oom' | ...
    exitCode: details.exitCode,
  });

  if (details.reason === 'crashed' || details.reason === 'oom') {
    // 尝试 reload
    const retry = dialog.showMessageBoxSync(mainWindow, {
      type: 'error',
      title: 'CreoNow 遇到了问题',
      message: '编辑器意外崩溃，是否重新加载？',
      buttons: ['重新加载', '退出'],
      defaultId: 0,
    });

    if (retry === 0) {
      mainWindow.webContents.reload();
    } else {
      app.quit();
    }
  }
});
```

---

## 4. 优雅停机链

### 4.1 完整链路

```
graph TD
    A["触发源"] --> B{"来源类型"}
    B -->|"before-quit"| C["正常退出"]
    B -->|"uncaughtException"| D["致命错误"]
    B -->|"unhandledRejection"| D

    C --> E["gracefulShutdown()"]
    D --> E

    E --> F["① ProjectLifecycle.destroyAll()<br>清理项目级资源（3s timeout）"]
    F --> G["② UtilityProcess.destroyAll()<br>关闭子进程（3s timeout）"]
    G --> H["③ db.close()<br>flush WAL → checkpoint"]
    H --> I["④ logger.flush()<br>落盘最后日志"]
    I --> J["⑤ app.exit(0) / process.exit(1)"]

    K["超时兜底 5s"] -.->|"如果以上未完成"| L["process.exit(1)"]

    style D fill:#ffebee,stroke:#f44336
    style L fill:#ffebee,stroke:#f44336
    style J fill:#e8f5e9,stroke:#4CAF50
```

### 4.2 实现

```
// ── lifecycle/shutdown.ts ───────────────────────────

let shutdownInProgress = false;

export async function gracefulShutdown(): Promise<void> {
  if (shutdownInProgress) return;
  shutdownInProgress = true;

  const HARD_TIMEOUT = 5_000;
  const hardTimer = setTimeout(() => {
    logger.error({ event: 'shutdown_hard_timeout' });
    process.exit(1);
  }, HARD_TIMEOUT);

  try {
    // ① 项目级资源清理
    await withTimeout(
      projectLifecycle.destroyAll(),
      3_000,
      'projectLifecycle',
    );

    // ② 子进程关闭
    await withTimeout(
      utilityProcessManager.destroyAll(),
      3_000,
      'utilityProcess',
    );

    // ③ 数据库关闭（flush WAL）
    if (db) {
      try { db.close(); } catch (e) {
        logger.error({ event: 'db_close_error', error: e });
      }
    }

    // ④ 日志落盘
    logger.flush();

    logger.info({ event: 'shutdown_complete' });
  } catch (err) {
    logger.error({ event: 'shutdown_error', error: err });
  } finally {
    clearTimeout(hardTimer);
  }
}
```

### 4.3 当前 vs 目标

| 步骤 | 当前 | 目标 |
| --- | --- | --- |
| ① 项目级清理 | ❌ 无 | ✅ ProjectLifecycle.destroyAll() — unbind 所有 service |
| ② 子进程关闭 | ❌ 无子进程 | ✅ UtilityProcessManager.destroyAll() — 优雅关闭 Compute + Data |
| ③ DB 关闭 | ⚠️ before-quit 里 db.close().catch() | ✅ 统一 shutdown 链中执行，保证顺序 |
| ④ 日志落盘 | ❌ 无 | ✅ logger.flush() — 确保最后几条日志写入文件 |
| ⑤ 超时兜底 | ❌ 无 | ✅ 5s 后 process.exit(1) — 防止 hang |
| 致命异常触发 | ❌ 进程直接崩溃 | ✅ uncaughtException / unhandledRejection → 触发同一 shutdown 链 |

---

## 5. 窗口安全防护

### 5.1 攻击面分析

| 攻击向量 | 风险 | 防护手段 |
| --- | --- | --- |
| window.open() 创建新窗口 | 恶意页面在 Electron 中获得 Node 权限 | setWindowOpenHandler → 拒绝所有 + 外链走系统浏览器 |
| will-navigate 导航到外部 URL | 主窗口被劫持到恶意站点 | will-navigate → 仅允许 dev-server / 本地文件 |
| <webview> 标签 | 嵌入任意网页 | webPreferences.webviewTag = false（默认） |
| 远程模块 | 渲染进程访问 Node API | 已通过 contextIsolation + preload bridge 防护 |

### 5.2 实现

```
// ── window/security.ts ──────────────────────────────

import { shell } from 'electron';

export function applyWindowSecurity(mainWindow: BrowserWindow): void {
  // ① 拒绝所有新窗口，外链走系统浏览器
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://') || url.startsWith('http://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // ② 限制导航——只允许 dev server 或本地文件
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const allowed =
      url.startsWith('http://localhost:') ||  // dev server
      url.startsWith('file://');               // production build

    if (!allowed) {
      event.preventDefault();
      logger.warn({ event: 'blocked_navigation', url });
    }
  });

  // ③ 限制权限请求（麦克风、摄像头、地理位置等）
  mainWindow.webContents.session.setPermissionRequestHandler(
    (_webContents, permission, callback) => {
      // 写作 IDE 不需要这些权限
      callback(false);
      logger.info({ event: 'denied_permission', permission });
    },
  );
}
```

### 5.3 BrowserWindow 创建时的安全配置

```
// ── window/createMainWindow.ts（安全相关配置）───────

const mainWindow = new BrowserWindow({
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    contextIsolation: true,        // ✅ 已有
    nodeIntegration: false,        // ✅ 已有
    sandbox: true,                 // ← 新增：沙箱模式
    webviewTag: false,             // ← 新增：禁用 webview
    allowRunningInsecureContent: false,  // ← 新增
  },
});

applyWindowSecurity(mainWindow);   // ← 新增
```

---

## 6. 文件 I/O 原子写入

### 6.1 问题

当前多处直接使用 writeFileSync / writeFile：

| 写入点 | 文件 | 损坏后果 |
| --- | --- | --- |
| .creonow 目录初始化 | services/context/contextFs.ts | 项目元数据损坏 → Context Engine 无法工作 |
| Constraints 落盘 | ipc/constraints.ts | 用户自定义约束丢失 |
| Export 写文件 | services/export/exportService.ts | 导出文件损坏（影响较小） |
| 技能文件 CRUD | services/skill/*.ts | 自定义技能丢失 |
| Logger JSONL | logging/logger.ts | 日志截断（影响较小） |

### 6.2 原子写入工具函数

```
// ── utils/atomicWrite.ts ────────────────────────────

import { writeFileSync, renameSync, unlinkSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { randomBytes } from 'node:crypto';

/**
 * 原子写入：先写临时文件，再 rename 覆盖目标。
 * rename 在 POSIX 上是原子操作（同一文件系统内）。
 * Windows 上 rename 也是原子的（NTFS + 同目录）。
 *
 * @param filePath 目标文件路径
 * @param data 写入内容
 * @param encoding 编码（默认 utf-8）
 */
export function atomicWriteFileSync(
  filePath: string,
  data: string | Buffer,
  encoding: BufferEncoding = 'utf-8',
): void {
  const dir = dirname(filePath);
  const tmpName = `.${basename(filePath)}.${randomBytes(4).toString('hex')}.tmp`;
  const tmpPath = join(dir, tmpName);

  try {
    writeFileSync(tmpPath, data, encoding);
    renameSync(tmpPath, filePath);
  } catch (err) {
    // 清理临时文件
    try { unlinkSync(tmpPath); } catch { /* ignore */ }
    throw err;
  }
}
```

### 6.3 替换清单

| 文件 | 替换 | 优先级 |
| --- | --- | --- |
| services/context/contextFs.ts | writeFileSync → atomicWriteFileSync | 高（元数据） |
| ipc/constraints.ts | writeFileSync → atomicWriteFileSync | 高（用户数据） |
| services/skill/*.ts | writeFileSync → atomicWriteFileSync | 中（技能文件） |
| services/export/exportService.ts | 保持现状（一次性导出，可重做） | 低 |
| logging/logger.ts | 保持 appendFileSync（append 模式天然安全） | — |

---

## 7. 额外加固项

### 7.1 CSP（Content Security Policy）

```
// ── window/csp.ts ───────────────────────────────────

mainWindow.webContents.session.webRequest.onHeadersReceived(
  (details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          [
            "default-src 'self'",
            "script-src 'self'",
            "style-src 'self' 'unsafe-inline'",  // Tailwind 需要
            "img-src 'self' data: blob:",
            "font-src 'self'",
            "connect-src 'self' https://*",       // LLM API 调用
            "worker-src 'self' blob:",
          ].join('; '),
        ],
      },
    });
  },
);
```

### 7.2 app.setPath 安全（E2E 隔离）

当前已有 enableE2EUserDataIsolation()，但需确认：

- CREONOW_USER_DATA_DIR 环境变量不接受相对路径

- 路径做 normalize + 校验，防止目录穿越

```
// ── e2e/userDataIsolation.ts（加固）─────────────────

function enableE2EUserDataIsolation(): void {
  const override = process.env.CREONOW_USER_DATA_DIR;
  if (!override) return;

  const resolved = path.resolve(override);

  // 安全校验：不允许指向系统目录
  const forbidden = ['/etc', '/usr', '/System', 'C:\\Windows'];
  if (forbidden.some((p) => resolved.startsWith(p))) {
    throw new Error(`Unsafe userData path: ${resolved}`);
  }

  app.setPath('userData', resolved);
}
```

### 7.3 project:project:duplicate 的 cpSync 安全

当前项目复制使用同步 cpSync：

```
// 风险：大项目时阻塞主线程数秒
fs.cpSync(sourcePath, targetPath, { recursive: true });
```

改进：

- 短期：加路径校验（防止源/目标路径穿越 userData 目录之外）

- 中期：迁移到 DataProcess 执行（异步 + 不阻塞主线程）

---

## 8. 完整配置清单

| 类别 | 配置项 | 位置 | 状态 |
| --- | --- | --- | --- |
| SQLite | busy_timeout = 5000 | db/pragmas.ts | ⬜ 待添加 |
| SQLite | synchronous = NORMAL | db/pragmas.ts | ⬜ 待添加 |
| SQLite | mmap_size = 268435456 | db/pragmas.ts | ⬜ 待添加 |
| SQLite | cache_size = -20000 | db/pragmas.ts | ⬜ 待添加 |
| 异常 | uncaughtException handler | lifecycle/globalExceptionHandler.ts | ⬜ 待添加 |
| 异常 | unhandledRejection handler | lifecycle/globalExceptionHandler.ts | ⬜ 待添加 |
| 异常 | render-process-gone handler | window/crashRecovery.ts | ⬜ 待添加 |
| 停机 | 完整 shutdown 链 | lifecycle/shutdown.ts | ⬜ 待添加 |
| 停机 | 5s 超时兜底 | lifecycle/shutdown.ts | ⬜ 待添加 |
| 窗口 | setWindowOpenHandler 白名单 | window/security.ts | ⬜ 待添加 |
| 窗口 | will-navigate 限制 | window/security.ts | ⬜ 待添加 |
| 窗口 | sandbox: true | window/createMainWindow.ts | ⬜ 待确认 |
| 窗口 | CSP header | window/csp.ts | ⬜ 待添加 |
| 文件 | 原子写入工具函数 | utils/atomicWrite.ts | ⬜ 待添加 |
| 文件 | 替换 4 处 writeFileSync | 多个文件 | ⬜ 待替换 |

---

## 9. TDD 策略

| 测试类别 | 测试内容 | 关键断言 |
| --- | --- | --- |
| SQLite pragma | 连接建立后查询 PRAGMA 值 | busy_timeout = 5000；synchronous = 1（NORMAL）；journal_mode = wal |
| Graceful shutdown | 模拟 before-quit → 断言 cleanup 按序执行 | destroyAll → db.close → logger.flush 顺序调用 |
| 超时兜底 | 模拟 cleanup hang 住 | 5s 后 process.exit(1) 被调用 |
| 异常捕获 | 模拟 uncaughtException | logger.fatal 被调用 + shutdown 触发 + exit(1) |
| 窗口安全 | 模拟 window.open() | 返回 { action: 'deny' }；shell.openExternal 被调用 |
| 原子写入 | 正常写入 + 写入中断模拟 | 正常：文件内容正确；中断：原文件不受影响 |
| 重入防护 | 连续触发两次 shutdown | 第二次立即返回，不重复执行 |

---

## 10. 实施路径

| 阶段 | 内容 | 预计工作量 |
| --- | --- | --- |
| Phase 1 | SQLite PRAGMA 调优（applyRecommendedPragmas  • 测试） | 0.5 小时 |
| Phase 2 | 全局异常捕获 + 优雅停机链（简版，先不接 ProjectLifecycle） | 1 小时 |
| Phase 3 | 窗口安全（setWindowOpenHandler  • will-navigate  • CSP） | 0.5 小时 |
| Phase 4 | 原子写入（atomicWriteFileSync  • 替换 4 处） | 0.5 小时 |
| Phase 5 | 接入 ProjectLifecycle + UtilityProcess 到 shutdown 链 | 对接时补充 |

> ✅

独立无前置依赖，可立即启动。 Phase 1–4 总计约 2.5 小时，是投入产出比最高的加固工作。Phase 5 在 ProjectLifecycle 和 UtilityProcess 完成后对接。

---

## 11. 相关页面

- ‣ — shutdown 链中的 ProjectLifecycle.destroyAll()

- ‣ — shutdown 链中的子进程关闭

- ‣ — SQLite 配置现状

- ‣ — P2 #19–#21 完整描述

> 🧪

CN 后端 TDD 测试体系 — 四层测试（Contract / Performance / Stress / Integration）覆盖全部 8 个优化方案，确保每一项重构都有可验证的质量保障。

---

## 1. 当前现状

| 指标 | 当前值 | 问题 |
| --- | --- | --- |
| 单元测试文件 | 81 | 覆盖集中在 ai / context / documents，judge / search / stats 无测试 |
| 集成测试文件 | 81 | 多数为 handler 级别，缺少跨进程通信测试 |
| E2E 测试文件 | 25 | 仅覆盖前端 UI 流程，后端无 E2E |
| 性能基准测试 | 0 | 无法检测性能回退 |
| 压力测试 | 0 | 无法验证极端场景稳定性 |
| 测试工具 | Vitest | 已配置，可直接使用 |

---

## 2. 四层测试体系

```
graph TD
    subgraph L1["Layer 1：Contract Tests（接口契约）"]
        C1["BackgroundTaskRunner 五状态机"]
        C2["ProjectLifecycle 三层生命周期"]
        C3["BoundedMap LRU/TTL"]
        C4["IPC AbortController"]
        C5["SkillScheduler 并发语义"]
        C6["EmbeddingQueue debounce/去重"]
    end

    subgraph L2["Layer 2：Performance Benchmarks（性能基准）"]
        P1["KG CTE vs JS 图遍历"]
        P2["ONNX 推理延迟"]
        P3["SQLite 批量写入吞吐"]
        P4["Aho-Corasick 匹配"]
        P5["Deque vs Array.shift"]
        P6["RAG Pipeline 端到端"]
    end

    subgraph L3["Layer 3：Stress Tests（压力测试）"]
        S1["AI 流式写入 1000 blocks"]
        S2["100 次项目切换内存"]
        S3["UtilityProcess 崩溃恢复"]
        S4["并发 IPC 风暴"]
        S5["OOM 压力"]
    end

    subgraph L4["Layer 4：Integration Tests（集成测试）"]
        I1["IPC 全链路"]
        I2["双进程通信"]
        I3["读写分离并发"]
        I4["Graceful Shutdown"]
        I5["项目切换全流程"]
    end

    L1 --> L2 --> L3 --> L4

    style L1 fill:#e3f2fd,stroke:#1976D2
    style L2 fill:#fff3e0,stroke:#FF9800
    style L3 fill:#fce4ec,stroke:#E91E63
    style L4 fill:#e8f5e9,stroke:#4CAF50
```

---

## 3. Layer 1：Contract Tests（接口契约）

Contract Test 验证核心抽象的行为正确性，不依赖外部系统，运行极快。

### 3.1 BackgroundTaskRunner 五状态机

```
// ── __tests__/contract/backgroundTaskRunner.contract.test.ts ──

describe('BackgroundTaskRunner contract', () => {
  // 状态机：idle → queued → running → completed/failed
  it('should transition: idle → queued → running → completed', async () => {
    const runner = new BackgroundTaskRunner();
    const task = runner.submit(() => 42);

    expect(task.status).toBe('queued');
    await task.promise;
    expect(task.status).toBe('completed');
    expect(task.result).toBe(42);
  });

  it('should transition to failed on error', async () => {
    const runner = new BackgroundTaskRunner();
    const task = runner.submit(() => { throw new Error('boom'); });

    await expect(task.promise).rejects.toThrow('boom');
    expect(task.status).toBe('failed');
  });

  it('should transition to cancelled on abort', async () => {
    const ac = new AbortController();
    const runner = new BackgroundTaskRunner();
    const task = runner.submit(
      () => new Promise(r => setTimeout(r, 10_000)),
      { signal: ac.signal },
    );

    ac.abort();
    await expect(task.promise).rejects.toThrow('AbortError');
    expect(task.status).toBe('cancelled');
  });

  it('should respect maxConcurrent', async () => {
    const runner = new BackgroundTaskRunner({ maxConcurrent: 2 });
    let concurrent = 0;
    let maxObserved = 0;

    const tasks = Array.from({ length: 10 }, () =>
      runner.submit(async () => {
        concurrent++;
        maxObserved = Math.max(maxObserved, concurrent);
        await delay(10);
        concurrent--;
      }),
    );

    await Promise.all(tasks.map(t => t.promise));
    expect(maxObserved).toBe(2);
  });

  it('should drain queue on dispose', async () => {
    const runner = new BackgroundTaskRunner();
    const tasks = Array.from({ length: 5 }, () =>
      runner.submit(() => delay(100)),
    );
    runner.dispose();
    for (const t of tasks) {
      await expect(t.promise).rejects.toThrow();
    }
  });
});
```

### 3.2 ProjectLifecycle 三层生命周期

```
// ── __tests__/contract/projectLifecycle.contract.test.ts ──

describe('ProjectLifecycle contract', () => {
  it('bind → unbind → destroy sequence', () => {
    const lc = new ProjectLifecycle();
    const events: string[] = [];

    // 使用 register() 统一注册生命周期回调
    lc.register({
      onBind: () => events.push('bind'),
      onUnbind: () => events.push('unbind'),
      onDestroy: () => events.push('destroy'),
    });

    lc.bindProject('proj-1');
    lc.unbindProject('proj-1');
    lc.destroy();

    expect(events).toEqual(['bind', 'unbind', 'destroy']);
  });

  it('unbind triggers before new bind', () => {
    const lc = new ProjectLifecycle();
    const events: string[] = [];

    lc.register({
      onBind: (id) => events.push(`bind:${id}`),
      onUnbind: (id) => events.push(`unbind:${id}`),
    });

    lc.bindProject('proj-1');
    lc.bindProject('proj-2'); // 应自动 unbind proj-1

    expect(events).toEqual(['bind:proj-1', 'unbind:proj-1', 'bind:proj-2']);
  });

  it('session scoped resources are cleaned on session end', () => {
    const lc = new ProjectLifecycle();
    let cleaned = false;
    // 使用 registerSessionScoped() 注册 Session 级资源
    lc.registerSessionScoped({
      onEnd: () => { cleaned = true; },
    });

    lc.startSession();
    lc.endSession();

    expect(cleaned).toBe(true);
  });
});
```

### 3.3 BoundedMap LRU/TTL

```
// ── __tests__/contract/boundedMap.contract.test.ts ──

describe('BoundedMap contract', () => {
  it('evicts oldest when maxSize exceeded', () => {
    const map = new BoundedMap<string, number>({ maxSize: 3 });
    map.set('a', 1);
    map.set('b', 2);
    map.set('c', 3);
    map.set('d', 4); // 'a' should be evicted

    expect(map.has('a')).toBe(false);
    expect(map.size).toBe(3);
  });

  it('LRU: get refreshes entry', () => {
    const map = new BoundedMap<string, number>({ maxSize: 3 });
    map.set('a', 1);
    map.set('b', 2);
    map.set('c', 3);
    map.get('a'); // refresh 'a'
    map.set('d', 4); // 'b' should be evicted (oldest unreferenced)

    expect(map.has('a')).toBe(true);
    expect(map.has('b')).toBe(false);
  });

  it('TTL: expired entries are not returned', () => {
    vi.useFakeTimers();
    const map = new BoundedMap<string, number>({ maxSize: 100, ttlMs: 1000 });
    map.set('a', 1);

    vi.advanceTimersByTime(1001);
    expect(map.get('a')).toBeUndefined();
    vi.useRealTimers();
  });

  it('onEvict callback fires', () => {
    const evicted: string[] = [];
    const map = new BoundedMap<string, number>({
      maxSize: 2,
      onEvict: (key) => evicted.push(key),
    });
    map.set('a', 1);
    map.set('b', 2);
    map.set('c', 3);

    expect(evicted).toEqual(['a']);
  });

  it('clear evicts all with callback', () => {
    const evicted: string[] = [];
    const map = new BoundedMap<string, number>({
      maxSize: 10,
      onEvict: (key) => evicted.push(key),
    });
    map.set('a', 1);
    map.set('b', 2);
    map.clear();

    expect(evicted).toContain('a');
    expect(evicted).toContain('b');
    expect(map.size).toBe(0);
  });
});
```

### 3.4 其他 Contract Tests

| Contract | 关键断言 | 对应方案 |
| --- | --- | --- |
| IPC AbortController 取消语义 | abort 传播到 handler + 返回 AbortError + 资源释放 | 📡 IPC 通信层 |
| SkillScheduler 并发语义 | maxConcurrent 限制 + 超时回收 + cancelAll + drainQueue | 🎯 Skill 系统 |
| EmbeddingQueue debounce/去重 | 同一 docId 去重 + debounce 合并 + flushImmediate | 🧬 Embedding & RAG |
| WriteQueue 背压协议 | 高水位暂停 + 低水位恢复 + 超时保护 | 🛡️ AI 流式写入 |
| Deque FIFO 语义 | pushBack/popFront 顺序 + size 正确 + grow 正确 | 🔮 KG 查询层 |
| EntityMatcher 惰性重建 | setEntities → stale → match 触发 rebuild | 🔮 KG 查询层 |
| ChunkHashCache diff 语义 | 相同文本 → false，变更 → true | 🧬 Embedding & RAG |

---

## 4. Layer 2：Performance Benchmarks（性能基准）

### 4.1 基准测试框架

```
// ── __tests__/bench/setup.ts ────────────────────────

import { bench, describe } from 'vitest';

/**
 * 性能基准测试约定：
 * - 文件命名：*.bench.test.ts
 * - 使用 vitest bench mode 运行
 * - 每个 bench 指定 threshold（不可超过的最大延迟）
 * - CI 中对比 main 分支基准，回退 > 20% 则 fail
 */
export const PERF_THRESHOLDS = {
  kgSubgraphCte: 50,        // ms，50k 节点 2 度子图
  kgPathCte: 100,            // ms，50k 节点最短路径
  onnxSingleEmbed: 500,     // ms，单次推理
  sqliteBatchWrite: 100,    // ms，100 行事务写入
  ahoCorasickMatch: 10,     // ms，1000 实体 × 10KB
  deque10k: 5,              // ms，10k push+pop
  ragPipeline: 500,         // ms，端到端 RAG
  skillSchedulerDrain: 10,  // ms，10 个任务排空
} as const;
```

### 4.2 KG 查询性能基准

```
// ── __tests__/bench/kgQuery.bench.test.ts ───────────

import { bench, describe } from 'vitest';

describe('KG Query Performance', () => {
  let db: Database;

  beforeAll(() => {
    db = createInMemoryDb();
    seedGraph(db, { nodes: 50_000, edges: 200_000 }); // 50k 节点测试图
  });

  bench('querySubgraph CTE (2-hop, 50k nodes)', () => {
    querySubgraph({ rootEntityId: 'root', projectId: 'test', maxDepth: 2 });
  }, { time: 1000, iterations: 100 });

  bench('queryPath CTE (50k nodes)', () => {
    queryPath({ startId: 'node-1', endId: 'node-49999', projectId: 'test', maxDepth: 10 });
  }, { time: 1000, iterations: 50 });

  bench('Aho-Corasick match (1000 patterns × 10KB)', () => {
    const matcher = new EntityMatcher();
    matcher.setEntities(generateEntities(1000));
    matcher.match(generateText(10_000));
  }, { time: 1000, iterations: 100 });

  bench('Deque 10k push+pop', () => {
    const deque = new Deque<number>();
    for (let i = 0; i < 10_000; i++) deque.pushBack(i);
    while (deque.size > 0) deque.popFront();
  }, { time: 1000, iterations: 200 });

  bench('[baseline] Array.shift 10k', () => {
    const arr: number[] = [];
    for (let i = 0; i < 10_000; i++) arr.push(i);
    while (arr.length > 0) arr.shift();
  }, { time: 1000, iterations: 20 });
});
```

### 4.3 全部性能基准矩阵

| 基准 | 场景 | 阈值 | 对应方案 |
| --- | --- | --- | --- |
| KG CTE Subgraph | 50k 节点 2-hop | < 50ms | 🔮 KG 查询层 |
| KG CTE Path | 50k 节点最短路径 | < 100ms | 🔮 KG 查询层 |
| Aho-Corasick Match | 1000 实体 × 10KB | < 10ms | 🔮 KG 查询层 |
| Deque Push+Pop | 10k 操作 | < 5ms | 🔮 KG 查询层 |
| ONNX Embed | 单次推理（384d） | < 500ms | 🧬 Embedding & RAG |
| ONNX Batch | 16 文本批量推理 | < 3000ms | 🧬 Embedding & RAG |
| SQLite Batch Write | 100 行事务写入 | < 100ms | 💾 数据层 |
| SQLite WAL Read | 并发读（RO 连接） | < 5ms | 💾 数据层 |
| RAG Pipeline | FTS + Embed + Vec + RRF | < 500ms | 🧬 Embedding & RAG |
| Skill Load (cached) | getSkills 缓存命中 | < 1ms | 🎯 Skill 系统 |
| Scheduler Drain | 10 个任务排空 | < 10ms（调度开销） | 🎯 Skill 系统 |

---

## 5. Layer 3：Stress Tests（压力测试）

### 5.1 AI 流式写入压力

```
// ── __tests__/stress/aiStreamWrite.stress.test.ts ───

describe('AI Stream Write Stress', () => {
  it('should handle 1000 blocks without crash', async () => {
    const writeQueue = new WriteQueue({ highWaterMark: 50 });

    for (let i = 0; i < 1000; i++) {
      writeQueue.push({
        blockId: `block-${i}`,
        content: `Content for block ${i}`,
        operation: 'insert',
      });
    }

    await writeQueue.drain();
    expect(writeQueue.stats.totalWritten).toBe(1000);
    expect(writeQueue.stats.errors).toBe(0);
  }, 30_000); // 30s timeout

  it('should recover from mid-stream abort', async () => {
    const ac = new AbortController();
    const writeQueue = new WriteQueue();

    // 写入 500 块后 abort
    const writePromise = writeBatch(writeQueue, 1000, ac.signal);
    setTimeout(() => ac.abort(), 500);

    await expect(writePromise).rejects.toThrow('AbortError');

    // 验证：已写入的数据完整，无脏数据
    const written = await readAllBlocks();
    for (const block of written) {
      expect(block.content).toBeTruthy(); // 无空内容
      expect(block.version).toBeGreaterThan(0); // 无零版本
    }
  });
});
```

### 5.2 项目切换内存泄漏检测

```
// ── __tests__/stress/projectSwitch.stress.test.ts ───

describe('Project Switch Memory', () => {
  it('100 switches should not leak memory', async () => {
    const baselineRss = process.memoryUsage().rss;

    for (let i = 0; i < 100; i++) {
      await projectLifecycle.bindProject(`proj-${i}`);

      // 模拟正常使用：加载 skill、查询 KG、embedding
      await skillRegistry.getSkills(`proj-${i}`);
      entityMatcher.setEntities(generateEntities(100));
      entityMatcher.match('test text');

      await projectLifecycle.unbindProject(`proj-${i}`);

      // 强制 GC（需要 --expose-gc flag）
      if (global.gc) global.gc();
    }

    const finalRss = process.memoryUsage().rss;
    const delta = finalRss - baselineRss;

    // 允许 20MB 增量（GC 延迟），但不能持续增长
    expect(delta).toBeLessThan(20 * 1024 * 1024);
  }, 60_000);
});
```

### 5.3 UtilityProcess 崩溃恢复

```
// ── __tests__/stress/utilityProcessRecovery.stress.test.ts ──

describe('UtilityProcess Crash Recovery', () => {
  it('should auto-restart after crash', async () => {
    const manager = new UtilityProcessManager();
    const process = await manager.spawn('compute');

    // 模拟崩溃
    process.kill('SIGKILL');

    // 等待恢复
    await vi.waitFor(() => {
      expect(manager.getProcess('compute')?.connected).toBe(true);
    }, { timeout: 5000 });

    // 验证功能恢复
    const result = await manager.invoke('compute', 'ping', {});
    expect(result).toBe('pong');
  });

  it('should preserve pending requests across restart', async () => {
    const manager = new UtilityProcessManager();
    const process = await manager.spawn('compute');

    // 发送请求（不等待响应）
    const promise = manager.invoke('compute', 'slow-task', { durationMs: 5000 });

    // 崩溃
    process.kill('SIGKILL');

    // 请求应被重试或返回错误（不是 hang）
    await expect(promise).rejects.toThrow(); // 不应永远等待
  }, 10_000);

  it('should respect maxRestarts limit', async () => {
    const manager = new UtilityProcessManager({ maxRestarts: 3 });

    for (let i = 0; i < 4; i++) {
      const process = manager.getProcess('compute');
      if (process) process.kill('SIGKILL');
      await delay(1000);
    }

    // 第 4 次崩溃后不再重启
    expect(manager.getProcess('compute')).toBeNull();
    expect(manager.getRestartCount('compute')).toBe(3);
  }, 15_000);
});
```

### 5.4 并发 IPC 风暴

```
// ── __tests__/stress/ipcStorm.stress.test.ts ────────

describe('IPC Storm', () => {
  it('should handle 1000 concurrent requests without deadlock', async () => {
    const promises = Array.from({ length: 1000 }, (_, i) =>
      ipcInvoke('echo', { data: `msg-${i}` }),
    );

    const results = await Promise.allSettled(promises);
    const fulfilled = results.filter(r => r.status === 'fulfilled');
    const rejected = results.filter(r => r.status === 'rejected');

    // 至少 95% 成功（允许少量超时）
    expect(fulfilled.length).toBeGreaterThanOrEqual(950);

    // 被拒绝的应该是超时，不是死锁
    for (const r of rejected) {
      expect((r as PromiseRejectedResult).reason.message).toContain('timeout');
    }
  }, 60_000);

  it('should handle mixed abort + timeout + success', async () => {
    const ac = new AbortController();

    const promises = [
      ipcInvoke('fast-task', {}, { signal: ac.signal }),
      ipcInvoke('slow-task', { durationMs: 10_000 }),   // 会超时
      ipcInvoke('medium-task', { durationMs: 100 }),
    ];

    // 100ms 后 abort 第一个
    setTimeout(() => ac.abort(), 100);

    const results = await Promise.allSettled(promises);
    expect(results[0].status).toBe('rejected'); // aborted
    expect(results[1].status).toBe('rejected'); // timeout
    expect(results[2].status).toBe('fulfilled'); // success
  });
});
```

---

## 6. Layer 4：Integration Tests（集成测试）

### 6.1 IPC 全链路

```
// ── __tests__/integration/ipcPipeline.integration.test.ts ──

describe('IPC Pipeline Integration', () => {
  it('request → validate → route → handler → response', async () => {
    // 使用真实的 createValidatedIpcMain
    const ipc = createValidatedIpcMain();

    // 注册 handler
    ipc.handle('test:echo', async (event, data) => {
      return { echo: data.message };
    });

    // 发送请求
    const result = await simulateIpcInvoke('test:echo', {
      message: 'hello',
    });

    expect(result).toEqual({ echo: 'hello' });
  });

  it('schema validation rejects invalid payload', async () => {
    const ipc = createValidatedIpcMain();

    ipc.handle('test:typed', async (event, data: { count: number }) => {
      return { doubled: data.count * 2 };
    });

    // 无效 payload
    await expect(
      simulateIpcInvoke('test:typed', { count: 'not-a-number' }),
    ).rejects.toThrow('validation');
  });

  it('30s timeout on slow handler', async () => {
    const ipc = createValidatedIpcMain();

    ipc.handle('test:slow', async () => {
      await delay(35_000); // 超过 30s 超时
    });

    await expect(
      simulateIpcInvoke('test:slow', {}),
    ).rejects.toThrow('timeout');
  }, 40_000);
});
```

### 6.2 SQLite 读写分离并发

```
// ── __tests__/integration/sqliteReadWrite.integration.test.ts ──

describe('SQLite Read-Write Separation', () => {
  it('concurrent read (RO) + write (RW) without deadlock', async () => {
    const rwDb = openDb(dbPath, { readonly: false });
    const roDb = openDb(dbPath, { readonly: true });

    // 并发读写
    const writePromise = (async () => {
      const tx = rwDb.transaction(() => {
        for (let i = 0; i < 100; i++) {
          rwDb.prepare('INSERT INTO test (value) VALUES (?)').run(`row-${i}`);
        }
      });
      tx();
    })();

    const readPromise = (async () => {
      // WAL 模式下，读不阻塞写
      for (let i = 0; i < 50; i++) {
        const rows = roDb.prepare('SELECT COUNT(*) as c FROM test').get();
        expect(rows.c).toBeGreaterThanOrEqual(0);
        await delay(10);
      }
    })();

    // 两者都应成功完成
    await Promise.all([writePromise, readPromise]);

    // 最终一致
    const finalCount = roDb.prepare('SELECT COUNT(*) as c FROM test').get();
    expect(finalCount.c).toBe(100);
  });
});
```

### 6.3 Graceful Shutdown 全链路

```
// ── __tests__/integration/gracefulShutdown.integration.test.ts ──

describe('Graceful Shutdown', () => {
  it('full chain: lifecycle → process → db → exit', async () => {
    const events: string[] = [];

    projectLifecycle.onProjectUnbind(() => events.push('project-unbind'));
    utilityProcessManager.onBeforeDestroy(() => events.push('process-destroy'));

    // 触发 shutdown
    await gracefulShutdown(5000);

    expect(events).toContain('project-unbind');
    expect(events).toContain('process-destroy');

    // 验证顺序
    const unbindIdx = events.indexOf('project-unbind');
    const destroyIdx = events.indexOf('process-destroy');
    expect(unbindIdx).toBeLessThan(destroyIdx);
  });

  it('hard timeout at 5s if graceful fails', async () => {
    // 注入一个永不完成的 cleanup
    projectLifecycle.onProjectUnbind(() => new Promise(() => {}));

    const start = Date.now();
    await gracefulShutdown(5000);
    const elapsed = Date.now() - start;

    // 应在 5s 左右强制退出
    expect(elapsed).toBeGreaterThanOrEqual(4900);
    expect(elapsed).toBeLessThan(6000);
  }, 10_000);
});
```

---

## 7. TDD 工作流规范

### 7.1 Red → Green → Refactor

```
flowchart LR
    R["🔴 Red\n写失败的测试"] --> G["🟢 Green\n最小实现使测试通过"]
    G --> RF["🔵 Refactor\n优化代码，测试仍绿"]
    RF --> R

    style R fill:#ffcdd2,stroke:#E91E63
    style G fill:#c8e6c9,stroke:#4CAF50
    style RF fill:#bbdefb,stroke:#1976D2
```

### 7.2 每个优化方案的测试要求

| 要求 | 说明 |
| --- | --- |
| Contract Test 先行 | 在写实现代码之前，先写 contract test 定义预期行为 |
| Performance Baseline | 在优化之前，用 bench 记录当前性能作为 baseline |
| PR 必须包含测试 | 每个 PR 的新代码必须有对应测试，覆盖率不低于当前水平 |
| Stress Test 事后补充 | 核心模块完成后补充压力测试，不阻塞主开发流程 |

### 7.3 测试文件组织

```
tests/
├── contract/                    # Layer 1: Contract Tests
│   ├── backgroundTaskRunner.contract.test.ts
│   ├── projectLifecycle.contract.test.ts
│   ├── boundedMap.contract.test.ts
│   ├── skillScheduler.contract.test.ts
│   ├── embeddingQueue.contract.test.ts
│   ├── writeQueue.contract.test.ts
│   └── deque.contract.test.ts
├── bench/                       # Layer 2: Performance Benchmarks
│   ├── setup.ts
│   ├── kgQuery.bench.test.ts
│   ├── embedding.bench.test.ts
│   ├── sqlite.bench.test.ts
│   └── scheduler.bench.test.ts
├── stress/                      # Layer 3: Stress Tests
│   ├── aiStreamWrite.stress.test.ts
│   ├── projectSwitch.stress.test.ts
│   ├── utilityProcessRecovery.stress.test.ts
│   └── ipcStorm.stress.test.ts
└── integration/                 # Layer 4: Integration Tests
    ├── ipcPipeline.integration.test.ts
    ├── sqliteReadWrite.integration.test.ts
    ├── gracefulShutdown.integration.test.ts
    └── dualProcess.integration.test.ts
```

---

## 8. CI 集成

### 8.1 测试矩阵

| 阶段 | 运行内容 | 触发条件 | 超时 | 失败策略 |
| --- | --- | --- | --- | --- |
| pre-commit | 受影响的 contract tests | 每次 commit | 30s | 阻止 commit |
| PR check | 全部 contract + integration | 每次 PR / push | 5min | 阻止 merge |
| nightly bench | 全部 performance benchmarks | 每日定时 | 15min | 发通知 + 标记回退 |
| weekly stress | 全部 stress tests | 每周定时 | 30min | 发通知 |

### 8.2 Vitest 配置

```
// ── vitest.config.ts ────────────────────────────────

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // 默认运行 contract + integration
    include: [
      'tests/contract/**/*.test.ts',
      'tests/integration/**/*.test.ts',
    ],

    // bench 模式
    benchmark: {
      include: ['tests/bench/**/*.bench.test.ts'],
      outputFile: './bench-results.json',
    },

    // 性能回退检测
    reporters: ['default', 'json'],
    outputFile: './test-results.json',

    // 超时配置
    testTimeout: 30_000,
    hookTimeout: 10_000,
  },
});
```

---

## 9. 测试覆盖矩阵：方案 × 测试层

| 方案 | Contract | Bench | Stress | Integration |
| --- | --- | --- | --- | --- |
| ⚡ UtilityProcess | BackgroundTaskRunner 5 状态 | IPC 往返延迟 | 崩溃恢复 × 3 | 双进程通信 |
| ♻️ 生命周期 | ProjectLifecycle 3 层 | — | 100 次切换内存 | Shutdown 全链路 |
| 🔮 KG 查询层 | Deque + EntityMatcher | CTE + Aho-Corasick | — | — |
| 🧬 Embedding & RAG | EmbeddingQueue + HashCache | ONNX + RAG Pipeline | OOM 压力 | 读写分离并发 |
| 🎯 Skill 系统 | SkillScheduler 并发 | 注册表缓存命中 | — | — |
| 🛡️ AI 流式写入 | WriteQueue 背压 | 批量写入吞吐 | 1000 blocks 不崩 | — |
| 🔒 全局健壮性 | — | SQLite PRAGMA | IPC 风暴 | Graceful Shutdown |
| 📡 IPC 通信层 | AbortController 取消 | — | 1000 并发请求 | IPC 全链路 |

---

## 10. 依赖关系

- 独立：测试基础设施（目录结构、CI 配置、Vitest 配置）可先行搭建

- 协同：各优化方案的 contract test 随方案同步编写（TDD Red 阶段）

- 事后：stress test 和 integration test 在核心模块完成后补充

- 持续：performance benchmark 纳入 nightly CI，防止回退

### 📋 审计资料

> 📋

CN 后端（Electron 主进程）代码审计中发现的问题汇总。

已去重合并，按 严重度 → 问题域 组织。共 21 项，其中 P0 × 6、P1 × 10、P2 × 5。

---

## 🔴 P0 — 可导致崩溃或长时间假死

> 以下问题可直接导致主进程无响应、崩溃或用户可感知的"卡死"。

### 1. 自动保存触发 ONNX 同步推理，主进程假死

模块：Embedding / File Save　　影响：每次自动保存都可能卡死整个应用

- file:document:save 的 autosave 通过 queueMicrotask 调用 semanticIndex?.upsertDocument

- onnxRuntime.encode 在 for 循环中同步调用 session.embed(text)（CPU 密集张量运算）

- queueMicrotask 在当前事件循环交出控制权前同步耗尽 → 每次打字触发保存都阻塞主线程

- 证据：ipc/file.ts:390-396、embedding/onnxRuntime.ts:131-135

- 📸 → ‣ §D · AI 服务层（ONNX encode 同步路径）

### 2. FTS 查询异常时同步全量重建索引

模块：Search / FTS　　影响：单次搜索请求可冻结主线程

- search 捕获索引损坏后直接调用 runReindex（无异步卸载或后台隔离）

- runReindex 执行 DELETE + INSERT ... SELECT 全量重建，同步大事务

- 证据：search/ftsService.ts:373-379、ftsService.ts:405-427

### 3. KG 多个查询接口先全量拉图再计算，timeout/limit 对最重阶段无效

模块：Knowledge Graph　　影响：AI/IPC 全局卡顿

- entityList 直接 .all() 拉全项目实体（上限允许到 50k 节点）

- querySubgraph / queryPath / buildRulesInjection 全量拉关系/实体后在 JS 层遍历，最重成本发生在 timeout 判断之前

- 证据：kg/kgCoreService.ts:524-550、817-853、1448-1450、1551-1553、1967-1975

- 📸 → ‣ §C · KG：SQLite 关系表 + JS 层遍历查询

### 4. KG queryValidate 递归 DFS 无深度保护，可触发栈溢出

模块：Knowledge Graph　　影响：主进程崩溃（RangeError: Maximum call stack size exceeded）

- walk 递归无深度限制，长链/异常图结构下直接导致进程异常

- 证据：kg/kgCoreService.ts:1662-1698

### 5. KG BFS 队列使用 Array.shift()，大图下退化为 O(n²)

模块：Knowledge Graph　　影响：CPU 长时间阻塞主线程

- querySubgraph 与 queryPath 热循环中 queue.shift()，JS 数组头删触发搬移

- 节点/边规模大时 CPU 退化严重，单次 IPC 耗时飙升

- 证据：kg/kgCoreService.ts:1457-1474、1561-1597

### 6. Skill 服务每次操作都触发同步全目录扫描 + 同步读文件

模块：Skill System　　影响：所有技能相关 IPC 均可阻塞主线程

- resolveLoaded 在 list/read/write/toggle 入口被反复调用，每次都走 loadSkills

- loadSkills → discoverSkillFiles / loadSkillFile 使用 readdirSync / existsSync / readFileSync

- 证据：skills/skillService.ts:829-877、skillLoader.ts:138-145、205-207、230-231、390-395

- 📸 → ‣ §C · Skill：17 内置技能 pipeline

---

## 🟡 P1 — 性能退化或资源泄漏

> 以下问题在特定条件下（数据量增大、长时间运行、特定操作序列）导致明显性能退化或资源耗尽。

### 主线程阻塞（中等风险）

### 7. 项目删除/复制执行大规模同步 I/O

模块：Project Lifecycle　　影响：操作期间主线程挂起

- 项目删除调用 fs.rmSync({ recursive: true })，项目复制调用 fs.cpSync({ recursive: true })

- 项目目录包含大量文件或大体积媒体时，同步 I/O 彻底挂起主线程

- 证据：projects/projectService.ts:510、532

### 8. Skill 文件读写 / 迁移仍为同步 FS

模块：Skill System　　影响：技能编辑/迁移时阻塞 main loop

- readSkillContent / writeSkillContent / removeSkillContent 全是 readFileSync / writeFileSync / rmSync

- 证据：skills/skillService.ts:691-694、712-713、805-808

### 9. constraints IPC 热路径调用同步 .creonow 初始化

模块：Constraints / Context FS　　影响：并发请求时主线程串行阻塞

- constraints:policy:create/update/delete/set 每次调用 ensureCreonowDirStructure（内部为 mkdirSync / writeFileSync / existsSync）

- 证据：ipc/constraints.ts:579-582、686-689、804-807、961-968；context/contextFs.ts:39-74

### 10. Retrieved 实体匹配是同步 N×M 文本扫描

模块：Context Engine / KG　　影响：Context 组装请求延迟线性增长

- retrievedFetcher 先全量取 when_detected 实体，再同步 matchEntities（每个实体+别名做 text.indexOf）

- 证据：context/fetchers/retrievedFetcher.ts:34-48、71-72；kg/entityMatcher.ts:30-56

### 11. RAG rerank 路径同步 FTS + 同步 embedding 推理

模块：RAG / Embedding　　影响：检索请求阻塞主线程

- 每次 retrieve 循环多 query 做 fulltext（同步 DB），然后对缺失向量批量 embedding.encode

- ONNX runtime 在 for 循环里同步 session.embed

- 证据：rag/ragService.ts:216-245、314-317；embedding/onnxRuntime.ts:125-158

---

### 内存泄漏 / 无界增长

### 12. KG 识别会话级内存泄漏

模块：Knowledge Graph　　影响：长时间编辑后内存无限增长

- sessions（Map<string, RecognitionSessionState>）生命周期等同主进程，无 LRU 淘汰

- 每次自动保存触发实体识别累积 dismissedKeys / suggestions，旧会话状态永久驻留

- 证据：kg/kgRecognitionRuntime.ts:269

- 📸 → ‣ §C · KG 识别会话

### 13. 语义块索引内存无限膨胀

模块：Embedding　　影响：多项目操作下极快触发 OOM

- byProject（Map<string, Map<string, SemanticChunk[]>>）和 byChunkHash 缓存高维 number[] 向量

- 项目切换/归档/关闭时无卸载逻辑，所有处理过的项目数据永久锁定在主进程内存中

- 证据：embedding/semanticChunkIndexService.ts:158-159

### 14. AI 服务与 IPC 层无界 Map

模块：AI Service / IPC　　影响：长期使用后内存持续增长

- aiService.ts 的 sessionTokenTotalsByKey / sessionChatMessagesByKey

- ipc/ai.ts 的 chatHistoryByProject / sessionTokenTotalsByContext

- 均为无界 Map，无 LRU 淘汰，未对接项目关闭/清除钩子

- 证据：ai/aiService.ts:260-261；ipc/ai.ts:446-447

### 15. Search/Replace 预览令牌存储无 TTL / 容量控制

模块：Search　　影响：只做预览不执行时内存持续增长

- previewStore 为进程内 Map，每次 whole-project preview 新增 token

- 仅在 execute 成功路径才 delete，只预览不执行时无限积累

- 证据：search/searchReplaceService.ts:383-384、458-471、547-565

---

### 资源生命周期

### 16. IPC 超时只返回错误，不取消底层任务（"幽灵执行"）

模块：IPC Runtime　　影响：超时后任务继续消耗 CPU/内存/DB 连接，前端重试可叠加负载形成雪崩

- Promise.race + setTimeout：到时只 reject timeout promise，原 handler 继续运行

- 重 CPU/IO handler 超时后仍占用主线程；完成后试图响应已关闭的 IPC Event 可引发错误

- 证据：ipc/runtime-validation.ts:386-404、453-456、485-499

- 📸 → ‣ §E · IPC：统一 timeout + envelope ｜ ‣

### 17. SkillScheduler 对 completion 丢失无兜底，并发槽位可被永久占用

模块：Skill Scheduler　　影响：后续任务永久排队，"一直转圈不再出结果"

- 释放并发位只在 finalizeTask，依赖 completion settle

- response 成功但 completion 永不 resolve 时，globalRunning 不回收

- 证据：skills/skillScheduler.ts:275-278、344-363、383-391

### 18. Watcher 资源生命周期不闭合

模块：Context / Watch　　影响：长期运行累积文件句柄与内存

- watcher 按 projectId 放入 map，无全局上限、无统一 shutdown

- before-quit 只关闭 DB，不清理 watcher；跨项目切换若未显式 stop 则持续占用

- 证据：context/watchService.ts:39-40、71-74、99-100、116-123；index.ts:461-472

---

## 🟠 P2 — 配置缺陷与健壮性

### 19. SQLite 缺少 busy_timeout 与 synchronous = NORMAL 配置

模块：Database Init　　影响：高并发写入时 SQLITE_BUSY 错误；WAL 性能优势未完全发挥

- 启用 WAL 但未配置 busy_timeout（锁时直接抛错而非排队等待）

- 缺少 synchronous = NORMAL（WAL 下会产生不必要的 I/O 阻塞）

- 证据：db/init.ts:222-223

- 📸 → ‣ §B · 数据层：WAL 已启用但单连接无池 ｜ ‣

### 20. 主进程全局异常捕获与优雅停机缺失

模块：App Lifecycle　　影响：后台异步异常 → 静默崩溃；退出时可能数据损坏

- 未注册 process.on('uncaughtException') / process.on('unhandledRejection')

- before-quit 直接同步 db.close()，无 graceful shutdown（活跃事务可能被截断）

- 证据：index.ts:461-472

### 21. 窗口安全防护不完整

模块：Window / Security　　影响：渲染层不可信内容可弹出无控制的原生窗口

- 启用了 contextIsolation + sandbox，但遗漏 webContents.setWindowOpenHandler

- target="_blank" 的富文本内容可无限制弹出 Electron 新窗口

- 证据：index.ts:112-117

- 📸 → ‣ §G · 安全：contextIsolation + sandbox 已启用

---

## 📊 问题分布总览

| 问题域 | P0 | P1 | P2 | 合计 |
| --- | --- | --- | --- | --- |
| 主线程阻塞（同步 CPU/IO） | 4 | 5 | — | 9 |
| 内存泄漏 / 无界增长 | — | 4 | — | 4 |
| 算法 / 数据结构缺陷 | 2 | — | — | 2 |
| 资源生命周期 | — | 3 | — | 3 |
| 配置 / 健壮性 / 安全 | — | — | 3 | 3 |
| 合计 | 6 | 12 | 3 | 21 |

---

> 📸

完整代码审计实况 → ‣

涵盖 A–G 七个维度（架构 · 数据层 · 核心模块 · AI 服务 · IPC · 工程质量 · 安全），含三个独立附录子页面：

- ‣

- ‣

- ‣

> ℹ️

更新时间：2026-02-22 12:52

本文件用于把 CN 后端（Electron 主进程）代码实况"喂给 Agent"做审计/知识库构建。内容按 A–G 分组逐条回答，所有结论尽量附带 SSOT 文件路径与最小关键片段。

> 路径映射：src/main/ 在仓库中对应 apps/desktop/main/src/。

---

## 🏗️ A. 整体架构与代码组织

### A1. 完整文件树

→ ‣

### A2. 主进程入口文件做了哪些事？启动顺序是什么？

入口：apps/desktop/main/src/index.ts

启动顺序（从上到下的真实执行链）：

1. enableE2EUserDataIsolation()：如 CREONOW_USER_DATA_DIR 存在，在 app.whenReady() 之前 app.setPath("userData", ...)，确保 E2E 不污染真实 profile

1. app.whenReady()：

  1. createMainLogger(app.getPath("userData"))（结构化 JSONL 落盘日志）

  1. initDb({ userDataDir, logger })：打开 SQLite，启用 foreign_keys + WAL，跑 migrations（失败不阻断启动，但 db=null）

  1. registerIpcHandlers({ db, logger, userDataDir, builtinSkillsDir, env })：构造服务依赖 + 注册全部 IPC handlers（见 A4）

  1. createMainWindow(logger)：创建 BrowserWindow，加载 dev server 或 build 后的 renderer/index.html

  1. before-quit：尝试 db.close()

1. .catch(logAppInitFatal)：记录 app_init_fatal 并 app.quit()

1. window-all-closed：非 macOS 直接 quit

关键证据片段（节选）：

```
// apps/desktop/main/src/index.ts
enableE2EUserDataIsolation();

app.whenReady().then(() => {
  const userDataDir = app.getPath("userData");
  const logger = createMainLogger(userDataDir);

  const dbRes = initDb({ userDataDir, logger });
  const db = dbRes.ok ? dbRes.db : null;

  registerIpcHandlers({
    db,
    logger,
    userDataDir,
    builtinSkillsDir: resolveBuiltinSkillsDir(__dirname),
    env: process.env,
  });
  createMainWindow(logger);
});
```

### A3. 模块之间依赖关系怎样？DI / Service Locator / 硬 import？

- 没有全局 DI 容器 / service locator；采用"手写依赖注入"风格：

  - 入口 index.ts 显式 createXxxService(...) 并把实例/依赖通过参数传给 registerXxxIpcHandlers({ ... })

  - IPC handlers 内部经常按需 createDocumentService({ db, logger }) 这种"就地构造"

- 依赖关系主要通过 直接 import + 显式参数传递 建立

- 部分模块存在"跨模块直接 import"（例如 Skills 依赖 Context Engine 的 assemble result 类型；Context Engine 可选依赖 KG / Memory）

证据：

- 显式依赖注入（入口统一装配）：apps/desktop/main/src/index.ts

  - const guardedIpcMain = createValidatedIpcMain({ ipcMain, logger, defaultTimeoutMs: 30_000 })

  - registerAiIpcHandlers({ ipcMain: guardedIpcMain, db, logger, env, secretStorage, projectSessionBinding, ... })

- Context Engine 可选依赖 KG / Memory：apps/desktop/main/src/services/context/layerAssemblyService.ts

  - kgService?: Pick<KnowledgeGraphService, "entityList">;

  - memoryService?: Pick<MemoryService, "previewInjection">;

- Skills 侧依赖 Context 组装：apps/desktop/main/src/services/skills/skillExecutor.ts

  - assembleContext?: (...) => Promise<ContextAssembleResult>;

### A4. 是否有统一错误处理中间件？IPC handler 异常最终去了哪里？

- 有统一 IPC "边界中间件"：createValidatedIpcMain() 会代理 ipcMain.handle()，对每个通道统一做：

  - ACL（通道级访问控制）

  - request/response runtime schema 校验

  - timeout（默认 30s，可 per-channel policy）

  - envelope 规范（必须返回 { ok: true|false, ... }），并在异常时统一兜底为 INTERNAL_ERROR/IPC_TIMEOUT/VALIDATION_ERROR 等稳定错误

- handler 内部不需要重复 try/catch；即使没抓住异常，也不会把 exception 泄漏到 IPC，而是被包装成稳定 envelope

证据（节选）：

```
// apps/desktop/main/src/ipc/runtime-validation.ts
export function wrapIpcRequestResponse(...) {
  return async (event, payload): Promise<IpcResponse<unknown>> => {
    // ACL -> request validate -> handler with timeout -> envelope check -> response validate
    try {
      const raw = await runWithTimeout(() => args.handler(event, requestPayload), args.timeoutMs);
      ...
      return raw;
    } catch (error) {
      if (error instanceof IpcTimeoutError) return toTimeoutError(args.timeoutMs);
      return toInternalError("内部错误");
    }
  };
}
```

---

## 💾 B. 数据层（SQLite + DAO）

### B5. SQLite schema 定义在哪里？raw SQL migration 还是 ORM？

- raw SQL migrations：apps/desktop/main/src/db/migrations/*.sql

- 执行器：apps/desktop/main/src/db/init.ts

- DB driver：better-sqlite3（同步 API）

- 可选扩展：sqlite-vec（用于 vec0 虚表；无法加载时降级）

### B6. 当前所有表的 CREATE TABLE

用"把 migrations 顺序 apply 到内存 DB，再 dump sqlite_master.sql"的方式得到当前 schema。完整输出 → ‣

补充：sqlite-vec 可用时会额外应用 0008_user_memory_vec.sql 创建 user_memory_vec（vec0）。

### B7. DAO 层怎么组织？DAO 与业务逻辑是否分离？

- 没有独立的 DAO 层目录（没有 dao/ 或 repositories/ 统一抽象层）

- 当前模式更接近"按业务域划分 service，在 service 内直接写 SQL"：

  - services/documents/*（documents/version/branch/merge）

  - services/kg/*（KG query/write 拆分相对清晰：kgQueryService.ts vs kgWriteService.ts）

  - services/memory/*（memory + episodic repository）

- IPC handlers 负责 transport + 少量参数校验；domain errors 多由 service 返回，再映射成 IPC error（例：mapDocumentErrorToIpcError）

### B8. migration 机制？用户升级版本时 schema 变更如何处理？

机制在 apps/desktop/main/src/db/init.ts：

- schema_version 表作为游标（首次启动插入 0）

- migrations 列表（MIGRATIONS_BASE + 可选 sqlite-vec migration）

- transaction() 内按 version 升序执行 db.exec(sql) 并 UPDATE schema_version

- 支持"中途中断后重启续跑"（依赖 schema_version 游标）

### B9. 是否做了 WAL / 连接池？并发读写策略？

- WAL：是，conn.pragma("journal_mode = WAL")

- 外键：是，conn.pragma("foreign_keys = ON")

- 连接池：没有；主进程内通常是单 better-sqlite3 连接共享给 services

- 并发策略：

  - Electron 主进程 JS 单线程；但 IPC handler 可能并发触发，且 better-sqlite3 同步查询会阻塞 event loop

  - 现有工程手段偏向"限流/背压/容量上限"，例如：

    - AI stream push 的 backpressure gate：ipc/pushBackpressure.ts

    - Context Engine 并发上限：services/context/layerAssemblyService.ts 的 CONTEXT_CAPACITY_LIMITS.maxConcurrentByDocument

---

## 🧠 C. 核心模块实现现状

### C10. Context Engine 实现到什么程度？四层是否都有？Token 预算如何分配？

实现位置：

- 核心装配：services/context/layerAssemblyService.ts

- 四层类型：services/context/types.ts（ContextLayerId = "rules" | "settings" | "retrieved" | "immediate"）

- Fetchers：

  - fetchers/rulesFetcher.ts

  - fetchers/settingsFetcher.ts

  - fetchers/retrievedFetcher.ts

  - fetchers/synopsisFetcher.ts

结论：

- 四层都有实现入口，且 assemble/inspect 两条路径都有代码

- Token 预算是 "总预算 + 各层 ratio + 各层 minimumTokens" 的组合：

  - deriveLayerBudgetCaps()：按 ratio 分配，并 Math.max(minimumTokens, floor(total * ratio))

  - 超预算时有固定的 truncation order（retrieved -> settings -> immediate；rules 非常规截断，只会在 constraint 维度尝试 trim）

证据（节选）：

```
// services/context/layerAssemblyService.ts
function deriveLayerBudgetCaps(profile: ContextBudgetProfile) {
  const total = profile.totalBudgetTokens;
  return { rules: Math.max(min, floor(total * ratio)), ... };
}

const TRUNCATION_ORDER = ["retrieved", "settings", "immediate"] as const;
```

### C11. Knowledge Graph 的实体存储结构？遍历/查询怎么实现？

存储（SQLite 关系表为主）：

- kg_entities / kg_relations / kg_relation_types 等（见 Appendix B）

- entity/relation 的扩展字段用 metadata_json / attributes_json 等 JSON 字段承载

查询/遍历（代码层）：

- services/kg/kgQueryService.ts：subgraph/path/relevant/byIds 等查询接口

- services/kg/entityMatcher.ts：实体匹配（为 context/rules 注入提供支持）

- services/kg/kgRecognitionRuntime.ts：识别运行时（配合保存/索引等链路）

### C12. Memory System 三层记忆现状与蒸馏逻辑？

当前实现更接近"语义记忆 + 情景(episodic) + 注入预览"的组合：

- 基础记忆 CRUD：services/memory/memoryService.ts（表：user_memory）

- 情景/episodic：services/memory/episodicMemoryService.ts（表：memory_episodes）

- 语义规则/占位：memory_semantic_placeholders（见 Appendix B）

- "情景 → 语义"蒸馏入口已存在：

  - IPC：ipc/memory.ts 的 "memory:semantic:distill" handler

  - service：episodicService.distillSemanticMemory(...)

  - 进度 push：memory:distill:progress（webContents.send 广播）

- 语义 recall 的 vector 索引是可选增强：

  - services/memory/userMemoryVec.ts + migration 0008_user_memory_vec.sql

  - sqlite-vec 不可用会降级

### C13. Skill System 有多少内置技能？执行流程是什么？

内置技能（builtin package）：

- 数量：17

- 路径：apps/desktop/main/skills/packages/pkg.creonow.builtin/1.0.0/skills/*/SKILL.md

自定义技能（custom）：

- 表：custom_skills（见 Appendix B）

- IPC：skill:custom:* / skill:registry:*

执行 pipeline（真实链路）：

1. Renderer 调 IPC：ai:skill:run

1. Main IPC handler：ipc/ai.ts

  - 构造 createAiService(...)（provider/streaming/trace）

  - 构造 createContextLayerAssemblyService(...)（可注入 KG/Memory）

  - 构造 createSkillExecutor(...)（resolve skill → context assemble → runSkill）

  - createSkillScheduler(...)：会话 FIFO + 全局并发上限 + overflow guard

1. LLM 调用：services/ai/aiService.ts（fetch + SSE）

1. Streaming：main webContents.send(SKILL_STREAM_CHUNK_CHANNEL, event) 推送到 renderer

关键证据：

- scheduler：services/skills/skillScheduler.ts（globalConcurrencyLimit / sessionQueueLimit）

- executor：services/skills/skillExecutor.ts（context assemble + 输出约束校验）

### C14. Version Control 快照存完整文档还是增量 diff？

- 快照以 完整内容 为主：documents 与 document_versions 都持久化 content_json（TipTap JSON）、content_text（派生纯文本）、content_md（派生 markdown）

- 同时存在 diff 辅助字段：document_versions.diff_format / diff_text

- 支持 branch/merge/conflict 相关表：document_branches / document_merge_sessions / document_merge_conflicts

---

## 🤖 D. AI 服务层

### D15. LLM 调用层结构？是否有模型抽象层？

- 有 provider 抽象（"配置解析 + fetch 调用 + SSE 解析"）：

  - provider 解析：services/ai/providerResolver.ts

  - 运行入口：services/ai/aiService.ts

- 不是 SDK 直连；核心是 fetch() + SSE 解析（OpenAI/Anthropic 都走 SSE）

### D16. 支持哪些 provider？切换需要改多少代码？

支持：openai / anthropic / proxy（openai-compatible / upstream proxy）

切换方式：通过 env / DB settings（AiProxySettingsService + ProviderResolver）；不需要改业务代码。

证据：

- services/ai/providerResolver.ts（type AiProvider = "anthropic" | "openai" | "proxy"）

- services/ai/aiProxySettingsService.ts

### D17. 流式输出（streaming）实现方式？

- 后端调用上游时用 SSE（readSse()）：services/ai/aiService.ts

- 主进程把 chunk/done/queue 事件通过 webContents.send(...) push 到渲染进程：

  - SKILL_STREAM_CHUNK_CHANNEL

  - SKILL_STREAM_DONE_CHANNEL

  - SKILL_QUEUE_STATUS_CHANNEL

```
// ipc/ai.ts
args.sender.send(SKILL_STREAM_CHUNK_CHANNEL, args.event);
```

### D18. Prompt 模板管理在哪里？

三类来源：

1. builtin skills：apps/desktop/main/skills/**/SKILL.md

1. AI service 固定 prompt 片段：

  - services/ai/identityPrompt.ts

  - services/ai/assembleSystemPrompt.ts

1. custom skills：DB 表 custom_skills.prompt_template + IPC CRUD

### D19. 队列/并发控制/重试/超时？

- 队列与并发：services/skills/skillScheduler.ts

  - global 并发上限（默认 8）

  - session FIFO 队列 + queue overflow guard（默认 20）

- 超时：

  - IPC 层默认 30s：ipc/runtime-validation.ts

  - LLM 调用 timeout 来自 provider config：ProviderConfig.timeoutMs

- 重试/熔断/half-open：

  - aiService.ts 内有 rate limit、failover、half-open（PROVIDER_HALF_OPEN_AFTER_MS）

- stream push 背压：ipc/pushBackpressure.ts（chunk 可丢弃，控制事件必达）

---

## 📡 E. IPC 通信层

### E20. IPC 通道总数与清单

- contract SSOT：ipc/contract/ipc-contract.ts

- generated typemap：packages/shared/types/ipc-generated.ts

- 当前通道总数：142

- 完整清单 → ‣

### E21. IPC 是否按业务域分组？

是。体现为：

- 通道命名按前缀域分组：ai:* / context:* / memory:* / knowledge:* / project:* / version:* / search:* / rag:* / constraints:* 等

- handler 文件按域拆分：ipc/*.ts（ipc/ai.ts、ipc/memory.ts、ipc/knowledgeGraph.ts…）

### E22. 是否实现 Schema-first Type Map？

是。

- contract SSOT：ipc/contract/ipc-contract.ts

- 生成物：packages/shared/types/ipc-generated.ts（IpcChannelSpec + IpcRequest/C + IpcInvokeResult/C 等）

- runtime 层面也做 schema 校验：ipc/runtime-validation.ts

### E23. preload 暴露了什么？

preload 暴露（实际名为 window.creonow，不是 window.electronApi）：

- invoke(channel, payload)：所有 request-response IPC

- stream.registerAiStreamConsumer() / releaseAiStreamConsumer()：AI streaming 订阅管理

- __CN_E2E_ENABLED__：E2E flag

证据：

- preload：apps/desktop/preload/src/index.ts

- renderer typing：apps/desktop/renderer/src/global.d.ts

### E24. 是否有运行时参数校验？

有，且在 main process 的 IPC 边界统一执行（不依赖 Zod）：

- ipc/runtime-validation.ts

- schema 来源：ipc/contract/schema.ts

---

## 🔧 F. 工程与质量

### F25. 后端目前有多少测试？

按目录粗略统计（文件数口径）：

- 单元测试（主进程侧 colocated）：apps/desktop/main/src/**/__tests__/* 共 81 个文件

- 集成测试：apps/desktop/tests/integration/**/* 共 81 个文件

- E2E（Playwright）：apps/desktop/tests/e2e/*.spec.ts 共 25 个文件

覆盖率脚本入口：apps/desktop/package.json 的 test:coverage（vitest run --coverage），报告需本地运行生成。

### F26. 哪些模块完全没有测试？

在 services/ 下，没有 colocated unit tests 的目录包括：

- services/judge/

- services/search/

- services/stats/

注意：不等于"完全无覆盖"，这些域在 integration / E2E 中有覆盖点。

### F27. 已知技术债 / 反模式

对照历史审计（Opus审计完整版.md）的后端条目：

- 已修：@shared/* path alias（历史问题：相对路径 5-6 层 ../）

- 已修：AI model 参数硬编码 "fake"

- 部分修复/需确认：Chat history / feedback 的持久化语义（已有 ai:chat:* / skill_feedback 表；跨重启持久化需再确认）

### F28. 性能瓶颈点？

代码中已显式做了"性能风险点护栏"：

- 主进程同步 SQLite 在高频 IPC 下可能阻塞 event loop（B9）

- Context Engine 有 SLO 阈值与并发上限：CONTEXT_SLO_THRESHOLDS_MS、maxConcurrentByDocument

- AI streaming push 有背压丢弃策略：ipc/pushBackpressure.ts

### F29. 日志系统？

主进程日志是结构化 JSONL，写入 userData/logs/main.log：

- logging/logger.ts（createMainLogger() → fs.appendFileSync(JSON.stringify(record))）

---

## 🔐 G. 安全与健壮性

### G30. API Key 存储是否迁移到 safeStorage？

是（至少 AI proxy/provider keys 这条链路是）。

- services/ai/aiProxySettingsService.ts

  - 写入 DB 前使用 safeStorage.encryptString 加密并加前缀 __safe_storage_v1__:

  - 读取时解密；若 safeStorage 不可用会返回 UNSUPPORTED 或降级为空值

- index.ts 把 safeStorage 封装成 secretStorage 依赖注入给 AI IPC handlers

### G31. 渲染进程输入在主进程侧是否 sanitize/validate？

已实现两层防线：

1. IPC runtime schema 校验：所有通道在 createValidatedIpcMain() 边界校验（A4/E24）

1. 业务域级别的额外 normalize/guard：

  - 文件系统路径 traversal 防护：services/context/contextFs.ts

  - baseUrl/apiKey 规范化：services/ai/aiProxySettingsService.ts

  - project/session 绑定隔离：ipc/projectSessionBinding.ts + ipc/projectAccessGuard.ts

### G32. 文件 I/O 是否有原子写入保护？

- 多处直接 writeFile / writeFileSync，未统一采用 temp+rename 原子写入模式

- 关键业务数据 SSOT 在 SQLite 内（事务 + WAL）；文件 I/O 集中在 .creonow/** 元数据、导出文件、技能文件等

代表性写入点：

- .creonow 初始化：services/context/contextFs.ts

- constraints 落盘：ipc/constraints.ts

- export 写文件：services/export/exportService.ts

---

## 📎 Appendices（独立子页面）

> 原始代码实况已拆为三个独立子页面，解决主页代码高亮过载问题。点击下方子页面直接访问 ↓

## apps/desktop/main/src 完整文件树

```
apps/desktop/main/src/config/__tests__/runtimeGovernance.test.ts
apps/desktop/main/src/config/runtimeGovernance.ts
apps/desktop/main/src/db/init.ts
apps/desktop/main/src/db/migrations/0001_init.sql
apps/desktop/main/src/db/migrations/0002_documents_versioning.sql
apps/desktop/main/src/db/migrations/0003_judge.sql
apps/desktop/main/src/db/migrations/0004_skills.sql
apps/desktop/main/src/db/migrations/0005_knowledge_graph.sql
apps/desktop/main/src/db/migrations/0006_search_fts.sql
apps/desktop/main/src/db/migrations/0007_stats.sql
apps/desktop/main/src/db/migrations/0008_user_memory_vec.sql
apps/desktop/main/src/db/migrations/0009_memory_document_scope.sql
apps/desktop/main/src/db/migrations/0010_projects_archive.sql
apps/desktop/main/src/db/migrations/0011_document_type_status.sql
apps/desktop/main/src/db/migrations/0012_memory_episodic_storage.sql
apps/desktop/main/src/db/migrations/0013_knowledge_graph_p0.sql
apps/desktop/main/src/db/migrations/0014_project_metadata.sql
apps/desktop/main/src/db/migrations/0015_version_snapshot_word_count.sql
apps/desktop/main/src/db/migrations/0016_skill_custom_crud.sql
apps/desktop/main/src/db/migrations/0017_version_branch_merge_conflict.sql
apps/desktop/main/src/db/migrations/0018_kg_ai_context_level.sql
apps/desktop/main/src/db/migrations/0019_kg_aliases.sql
apps/desktop/main/src/db/migrations/0020_kg_last_seen_state.sql
apps/desktop/main/src/db/migrations/0021_s3_trace_persistence.sql
apps/desktop/main/src/db/migrations/0022_s3_synopsis_injection.sql
apps/desktop/main/src/db/nativeDoctor.ts
apps/desktop/main/src/db/paths.ts
apps/desktop/main/src/index.ts
apps/desktop/main/src/ipc/__tests__/ai-chat-project-isolation.test.ts
apps/desktop/main/src/ipc/__tests__/ai-config-ipc.test.ts
apps/desktop/main/src/ipc/__tests__/contextIpcSplit.aggregator.test.ts
apps/desktop/main/src/ipc/__tests__/contextIpcSplit.deps.test.ts
apps/desktop/main/src/ipc/__tests__/contextIpcSplit.routing.test.ts
apps/desktop/main/src/ipc/__tests__/debug-channel-gate.test.ts
apps/desktop/main/src/ipc/__tests__/document-error-mapping.test.ts
apps/desktop/main/src/ipc/__tests__/ipcAcl.test.ts
apps/desktop/main/src/ipc/__tests__/project-access-guard.test.ts
apps/desktop/main/src/ipc/__tests__/projectSessionBinding.test.ts
apps/desktop/main/src/ipc/__tests__/runtimeValidation.acl.test.ts
apps/desktop/main/src/ipc/__tests__/window-ipc.test.ts
apps/desktop/main/src/ipc/ai.ts
apps/desktop/main/src/ipc/aiProxy.ts
apps/desktop/main/src/ipc/constraints.ts
apps/desktop/main/src/ipc/context.ts
apps/desktop/main/src/ipc/contextAssembly.ts
apps/desktop/main/src/ipc/contextBudget.ts
apps/desktop/main/src/ipc/contextFs.ts
apps/desktop/main/src/ipc/contract/ipc-contract.ts
apps/desktop/main/src/ipc/contract/schema.ts
apps/desktop/main/src/ipc/dbError.ts
apps/desktop/main/src/ipc/debugChannelGate.ts
apps/desktop/main/src/ipc/embedding.ts
apps/desktop/main/src/ipc/export.ts
apps/desktop/main/src/ipc/file.ts
apps/desktop/main/src/ipc/ipcAcl.ts
apps/desktop/main/src/ipc/judge.ts
apps/desktop/main/src/ipc/knowledgeGraph.ts
apps/desktop/main/src/ipc/memory.ts
apps/desktop/main/src/ipc/project.ts
apps/desktop/main/src/ipc/projectAccessGuard.ts
apps/desktop/main/src/ipc/projectSessionBinding.ts
apps/desktop/main/src/ipc/pushBackpressure.ts
apps/desktop/main/src/ipc/rag.ts
apps/desktop/main/src/ipc/runtime-validation.ts
apps/desktop/main/src/ipc/search.ts
apps/desktop/main/src/ipc/skills.ts
apps/desktop/main/src/ipc/stats.ts
apps/desktop/main/src/ipc/version.ts
apps/desktop/main/src/ipc/window.ts
apps/desktop/main/src/logging/logger.ts
apps/desktop/main/src/services/ai/__tests__/ai-payload-parsers.test.ts
apps/desktop/main/src/services/ai/__tests__/ai-public-contract-regression.test.ts
apps/desktop/main/src/services/ai/__tests__/ai-runtime-and-error-extract.test.ts
apps/desktop/main/src/services/ai/__tests__/aiService-provider-unavailable.test.ts
apps/desktop/main/src/services/ai/__tests__/aiService-runtime-multiturn.test.ts
apps/desktop/main/src/services/ai/__tests__/aiService.trace-persistence.test.ts
apps/desktop/main/src/services/ai/__tests__/assembleSystemPrompt.test.ts
apps/desktop/main/src/services/ai/__tests__/buildLLMMessages.test.ts
apps/desktop/main/src/services/ai/__tests__/chatMessageManager.test.ts
apps/desktop/main/src/services/ai/__tests__/identityPrompt.test.ts
apps/desktop/main/src/services/ai/__tests__/judge-fallback-partial-check.test.ts
apps/desktop/main/src/services/ai/__tests__/judge-pass-state.test.ts
apps/desktop/main/src/services/ai/__tests__/llm-proxy-config.test.ts
apps/desktop/main/src/services/ai/__tests__/llm-proxy-retry-rate-limit.test.ts
apps/desktop/main/src/services/ai/__tests__/provider-failover-half-open.test.ts
apps/desktop/main/src/services/ai/__tests__/providerResolver-state-isolation.test.ts
apps/desktop/main/src/services/ai/__tests__/quota-rate-limit-guard.test.ts
apps/desktop/main/src/services/ai/__tests__/trace-audit-continuity.test.ts
apps/desktop/main/src/services/ai/__tests__/traceStore.feedback.test.ts
apps/desktop/main/src/services/ai/__tests__/traceStore.test.ts
apps/desktop/main/src/services/ai/aiPayloadParsers.ts
apps/desktop/main/src/services/ai/aiProxySettingsService.ts
apps/desktop/main/src/services/ai/aiService.ts
apps/desktop/main/src/services/ai/assembleSystemPrompt.ts
apps/desktop/main/src/services/ai/buildLLMMessages.ts
apps/desktop/main/src/services/ai/chatMessageManager.ts
apps/desktop/main/src/services/ai/errorMapper.ts
apps/desktop/main/src/services/ai/fakeAiServer.ts
apps/desktop/main/src/services/ai/identityPrompt.ts
apps/desktop/main/src/services/ai/judgeQualityService.ts
apps/desktop/main/src/services/ai/providerResolver.ts
apps/desktop/main/src/services/ai/runtimeConfig.ts
apps/desktop/main/src/services/ai/traceStore.ts
apps/desktop/main/src/services/context/__tests__/formatEntity.import-boundary.test.ts
apps/desktop/main/src/services/context/__tests__/layerAssemblyService.contract-regression.test.ts
apps/desktop/main/src/services/context/__tests__/layerAssemblyService.dependency-graph.test.ts
apps/desktop/main/src/services/context/__tests__/layerAssemblyService.memoryInjection.test.ts
apps/desktop/main/src/services/context/__tests__/layerAssemblyService.synopsis.test.ts
apps/desktop/main/src/services/context/__tests__/retrievedFetcher.detected.test.ts
apps/desktop/main/src/services/context/__tests__/retrievedFetcher.test.ts
apps/desktop/main/src/services/context/__tests__/rulesFetcher.test.ts
apps/desktop/main/src/services/context/__tests__/settingsFetcher.memoryInjection.test.ts
apps/desktop/main/src/services/context/__tests__/settingsFetcher.test.ts
apps/desktop/main/src/services/context/__tests__/synopsisFetcher.test.ts
apps/desktop/main/src/services/context/__tests__/synopsisStore.error-path.test.ts
apps/desktop/main/src/services/context/__tests__/watchService.error-recovery.test.ts
apps/desktop/main/src/services/context/contextFs.ts
apps/desktop/main/src/services/context/fetchers/retrievedFetcher.ts
apps/desktop/main/src/services/context/fetchers/rulesFetcher.ts
apps/desktop/main/src/services/context/fetchers/settingsFetcher.ts
apps/desktop/main/src/services/context/fetchers/synopsisFetcher.ts
apps/desktop/main/src/services/context/layerAssemblyService.ts
apps/desktop/main/src/services/context/synopsisStore.ts
apps/desktop/main/src/services/context/types.ts
apps/desktop/main/src/services/context/utils/formatEntity.ts
apps/desktop/main/src/services/context/watchService.ts
apps/desktop/main/src/services/documents/__tests__/document-diff-helpers.test.ts
apps/desktop/main/src/services/documents/__tests__/document-error-domain.test.ts
apps/desktop/main/src/services/documents/__tests__/document-service-extract.structure.test.ts
apps/desktop/main/src/services/documents/__tests__/document-service-no-duplicate-implementation.test.ts
apps/desktop/main/src/services/documents/branchService.ts
apps/desktop/main/src/services/documents/derive.ts
apps/desktop/main/src/services/documents/documentCoreService.ts
apps/desktop/main/src/services/documents/documentCrudService.ts
apps/desktop/main/src/services/documents/documentDiffHelpers.ts
apps/desktop/main/src/services/documents/documentService.ts
apps/desktop/main/src/services/documents/threeWayMerge.ts
apps/desktop/main/src/services/documents/types.ts
apps/desktop/main/src/services/documents/versionService.ts
apps/desktop/main/src/services/embedding/__tests__/embedding-service.fallback.test.ts
apps/desktop/main/src/services/embedding/__tests__/embedding-service.primary.test.ts
apps/desktop/main/src/services/embedding/__tests__/onnx-runtime.error.test.ts
apps/desktop/main/src/services/embedding/__tests__/onnx-runtime.init.test.ts
apps/desktop/main/src/services/embedding/embeddingService.ts
apps/desktop/main/src/services/embedding/hashEmbedding.ts
apps/desktop/main/src/services/embedding/onnxRuntime.ts
apps/desktop/main/src/services/embedding/semanticChunkIndexService.ts
apps/desktop/main/src/services/export/__tests__/export-markdown.test.ts
apps/desktop/main/src/services/export/__tests__/export-project-bundle-streaming.guard.test.ts
apps/desktop/main/src/services/export/__tests__/export-txt-docx.test.ts
apps/desktop/main/src/services/export/exportService.ts
apps/desktop/main/src/services/judge/judgeService.ts
apps/desktop/main/src/services/kg/__tests__/entityMatcher.test.ts
apps/desktop/main/src/services/kg/__tests__/kg-service-exports-visibility.test.ts
apps/desktop/main/src/services/kg/__tests__/kg-service-facade-delegation.test.ts
apps/desktop/main/src/services/kg/__tests__/kg-service-split-boundary.test.ts
apps/desktop/main/src/services/kg/__tests__/kgEntity.compatibility.test.ts
apps/desktop/main/src/services/kg/__tests__/kgService.aliases.test.ts
apps/desktop/main/src/services/kg/__tests__/kgService.contextLevel.test.ts
apps/desktop/main/src/services/kg/__tests__/kgWriteService.aliases.test.ts
apps/desktop/main/src/services/kg/__tests__/kgWriteService.last-seen.test.ts
apps/desktop/main/src/services/kg/__tests__/stateExtractor.integration.test.ts
apps/desktop/main/src/services/kg/__tests__/stateExtractor.test.ts
apps/desktop/main/src/services/kg/entityMatcher.ts
apps/desktop/main/src/services/kg/kgCoreService.ts
apps/desktop/main/src/services/kg/kgQueryService.ts
apps/desktop/main/src/services/kg/kgRecognitionRuntime.ts
apps/desktop/main/src/services/kg/kgService.ts
apps/desktop/main/src/services/kg/kgWriteService.ts
apps/desktop/main/src/services/kg/stateExtractor.ts
apps/desktop/main/src/services/kg/types.ts
apps/desktop/main/src/services/memory/__tests__/memoryService.previewInjection.test.ts
apps/desktop/main/src/services/memory/episodicMemoryHelpers.ts
apps/desktop/main/src/services/memory/episodicMemoryService.ts
apps/desktop/main/src/services/memory/memoryService.ts
apps/desktop/main/src/services/memory/memoryTraceService.ts
apps/desktop/main/src/services/memory/preferenceLearning.ts
apps/desktop/main/src/services/memory/userMemoryVec.ts
apps/desktop/main/src/services/projects/__tests__/template-builtin-dir-invalid-argument.test.ts
apps/desktop/main/src/services/projects/__tests__/template-runtime-resolution.test.ts
apps/desktop/main/src/services/projects/__tests__/template-schema-validation.test.ts
apps/desktop/main/src/services/projects/__tests__/template-service-apply.test.ts
apps/desktop/main/src/services/projects/projectLifecycleStateMachine.ts
apps/desktop/main/src/services/projects/projectService.ts
apps/desktop/main/src/services/projects/templateService.ts
apps/desktop/main/src/services/rag/__tests__/hybrid-rag.explain.test.ts
apps/desktop/main/src/services/rag/__tests__/hybrid-rag.merge.test.ts
apps/desktop/main/src/services/rag/__tests__/hybrid-rag.truncate.test.ts
apps/desktop/main/src/services/rag/hybridRagRanking.ts
apps/desktop/main/src/services/rag/lruCache.ts
apps/desktop/main/src/services/rag/queryPlanner.ts
apps/desktop/main/src/services/rag/ragService.ts
apps/desktop/main/src/services/search/ftsService.ts
apps/desktop/main/src/services/search/hybridRankingService.ts
apps/desktop/main/src/services/search/searchReplaceService.ts
apps/desktop/main/src/services/skills/__tests__/chatSkill.test.ts
apps/desktop/main/src/services/skills/__tests__/skillLoader.synopsis.test.ts
apps/desktop/main/src/services/skills/__tests__/skillRouter.test.ts
apps/desktop/main/src/services/skills/__tests__/skillScheduler.test.ts
apps/desktop/main/src/services/skills/__tests__/synopsisSkill.execution.test.ts
apps/desktop/main/src/services/skills/scopeResolver.ts
apps/desktop/main/src/services/skills/skillExecutor.ts
apps/desktop/main/src/services/skills/skillLoader.ts
apps/desktop/main/src/services/skills/skillRouter.ts
apps/desktop/main/src/services/skills/skillScheduler.ts
apps/desktop/main/src/services/skills/skillService.ts
apps/desktop/main/src/services/skills/skillValidator.ts
apps/desktop/main/src/services/stats/statsService.ts
apps/desktop/main/src/services/skills/vite-raw.d.ts
```

> Applied: 21/22 migrations · Skipped: 0008_user_memory_vec.sql（uses vec0 / sqlite-vec extension）

```
-- Generated schema dump (in-memory)
-- Source migrations: apps/desktop/main/src/db/migrations

-- [index] idx_chapter_synopses_project_order (table=chapter_synopses)
CREATE INDEX idx_chapter_synopses_project_order
  ON chapter_synopses(project_id, chapter_order DESC, updated_at DESC, synopsis_id ASC)

-- [index] idx_custom_skills_scope_project (table=custom_skills)
CREATE INDEX idx_custom_skills_scope_project
  ON custom_skills(scope, project_id, updated_at)

-- [index] idx_document_branches_document_created (table=document_branches)
CREATE INDEX idx_document_branches_document_created
  ON document_branches (document_id, created_at DESC, branch_id ASC)

-- [index] idx_document_merge_conflicts_session (table=document_merge_conflicts)
CREATE INDEX idx_document_merge_conflicts_session
  ON document_merge_conflicts (merge_session_id, conflict_index ASC, conflict_id ASC)

-- [index] idx_document_versions_document_created (table=document_versions)
CREATE INDEX idx_document_versions_document_created
  ON document_versions (document_id, created_at DESC, version_id ASC)

-- [index] idx_documents_project_sort (table=documents)
CREATE INDEX idx_documents_project_sort
  ON documents (project_id, sort_order ASC, updated_at DESC, document_id ASC)

-- [index] idx_documents_project_updated (table=documents)
CREATE INDEX idx_documents_project_updated
  ON documents (project_id, updated_at DESC, document_id ASC)

-- [index] idx_generation_traces_document_created (table=generation_traces)
CREATE INDEX idx_generation_traces_document_created
  ON generation_traces(document_id, created_at DESC, trace_id ASC)

-- [index] idx_generation_traces_project_created (table=generation_traces)
CREATE INDEX idx_generation_traces_project_created
  ON generation_traces(project_id, created_at DESC, trace_id ASC)

-- [index] idx_kg_entities_project (table=kg_entities)
CREATE INDEX idx_kg_entities_project
  ON kg_entities(project_id)

-- [index] idx_kg_entities_project_context_level (table=kg_entities)
CREATE INDEX idx_kg_entities_project_context_level
  ON kg_entities(project_id, ai_context_level)

-- [index] idx_kg_entities_project_name (table=kg_entities)
CREATE INDEX idx_kg_entities_project_name
  ON kg_entities(project_id, name)

-- [index] idx_kg_entities_project_type (table=kg_entities)
CREATE INDEX idx_kg_entities_project_type
  ON kg_entities(project_id, type)

-- [index] idx_kg_entities_project_type_name (table=kg_entities)
CREATE UNIQUE INDEX idx_kg_entities_project_type_name
  ON kg_entities(project_id, type, lower(trim(name)))

-- [index] idx_kg_relations_project (table=kg_relations)
CREATE INDEX idx_kg_relations_project
  ON kg_relations(project_id)

-- [index] idx_kg_relations_source (table=kg_relations)
CREATE INDEX idx_kg_relations_source
  ON kg_relations(project_id, source_entity_id)

-- [index] idx_kg_relations_target (table=kg_relations)
CREATE INDEX idx_kg_relations_target
  ON kg_relations(project_id, target_entity_id)

-- [index] idx_memory_episodes_last_recalled (table=memory_episodes)
CREATE INDEX idx_memory_episodes_last_recalled
  ON memory_episodes(last_recalled_at DESC, episode_id ASC)

-- [index] idx_memory_episodes_project_created (table=memory_episodes)
CREATE INDEX idx_memory_episodes_project_created
  ON memory_episodes(project_id, created_at DESC, episode_id ASC)

-- [index] idx_memory_episodes_scene_type (table=memory_episodes)
CREATE INDEX idx_memory_episodes_scene_type
  ON memory_episodes(scene_type, created_at DESC, episode_id ASC)

-- [index] idx_memory_semantic_placeholders_project_updated (table=memory_semantic_placeholders)
CREATE INDEX idx_memory_semantic_placeholders_project_updated
  ON memory_semantic_placeholders(project_id, updated_at DESC, rule_id ASC)

-- [index] idx_projects_archived_updated (table=projects)
CREATE INDEX idx_projects_archived_updated
  ON projects (archived_at, updated_at DESC, project_id ASC)

-- [index] idx_skill_feedback_evidence_action (table=skill_feedback)
CREATE INDEX idx_skill_feedback_evidence_action
  ON skill_feedback(evidence_ref, action, created_at DESC)

-- [index] idx_trace_feedback_trace_created (table=trace_feedback)
CREATE INDEX idx_trace_feedback_trace_created
  ON trace_feedback(trace_id, created_at DESC, feedback_id ASC)

-- [index] idx_user_memory_document (table=user_memory)
CREATE INDEX idx_user_memory_document
  ON user_memory(document_id, updated_at DESC, memory_id ASC)
  WHERE document_id IS NOT NULL

-- [index] idx_user_memory_learned_source (table=user_memory)
CREATE UNIQUE INDEX idx_user_memory_learned_source
  ON user_memory(origin, scope, project_id, document_id, source_ref)
  WHERE origin = 'learned' AND source_ref IS NOT NULL

-- [index] idx_user_memory_project (table=user_memory)
CREATE INDEX idx_user_memory_project
  ON user_memory(project_id, updated_at DESC, memory_id ASC)

-- [index] idx_user_memory_scope_type_updated (table=user_memory)
CREATE INDEX idx_user_memory_scope_type_updated
  ON user_memory(scope, type, updated_at DESC, memory_id ASC)

-- [table] chapter_synopses
CREATE TABLE chapter_synopses (
  synopsis_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  document_id TEXT NOT NULL,
  chapter_order INTEGER NOT NULL,
  synopsis_text TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
  FOREIGN KEY (document_id) REFERENCES documents(document_id) ON DELETE CASCADE,
  UNIQUE (project_id, document_id)
)

-- [table] custom_skills
CREATE TABLE custom_skills (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  prompt_template TEXT NOT NULL,
  input_type TEXT NOT NULL CHECK (input_type IN ('selection', 'document')),
  context_rules TEXT NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('global', 'project')),
  project_id TEXT,
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
)

-- [table] document_branches
CREATE TABLE document_branches (
  branch_id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  name TEXT NOT NULL,
  base_snapshot_id TEXT NOT NULL,
  head_snapshot_id TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  UNIQUE(document_id, name),
  FOREIGN KEY (document_id) REFERENCES documents(document_id) ON DELETE CASCADE,
  FOREIGN KEY (base_snapshot_id) REFERENCES document_versions(version_id),
  FOREIGN KEY (head_snapshot_id) REFERENCES document_versions(version_id)
)

-- [table] document_merge_conflicts
CREATE TABLE document_merge_conflicts (
  conflict_id TEXT PRIMARY KEY,
  merge_session_id TEXT NOT NULL,
  document_id TEXT NOT NULL,
  source_branch_name TEXT NOT NULL,
  target_branch_name TEXT NOT NULL,
  conflict_index INTEGER NOT NULL,
  base_text TEXT NOT NULL,
  ours_text TEXT NOT NULL,
  theirs_text TEXT NOT NULL,
  selected_resolution TEXT,
  manual_text TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (merge_session_id) REFERENCES document_merge_sessions(merge_session_id) ON DELETE CASCADE,
  FOREIGN KEY (document_id) REFERENCES documents(document_id) ON DELETE CASCADE
)

-- [table] document_merge_sessions
CREATE TABLE document_merge_sessions (
  merge_session_id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  source_branch_name TEXT NOT NULL,
  target_branch_name TEXT NOT NULL,
  merged_template_text TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (document_id) REFERENCES documents(document_id) ON DELETE CASCADE
)

-- [table] document_versions
CREATE TABLE document_versions (
  version_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  document_id TEXT NOT NULL,
  actor TEXT NOT NULL,
  content_json TEXT NOT NULL,
  content_text TEXT NOT NULL,
  content_md TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  reason TEXT NOT NULL DEFAULT '',
  content_hash TEXT NOT NULL DEFAULT '',
  diff_format TEXT NOT NULL DEFAULT '',
  diff_text TEXT NOT NULL DEFAULT '',
  word_count INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY(project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
  FOREIGN KEY(document_id) REFERENCES documents(document_id) ON DELETE CASCADE
)

-- [table] documents
CREATE TABLE documents (
  document_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content_json TEXT NOT NULL,
  content_text TEXT NOT NULL,
  content_md TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  content_hash TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'chapter',
  status TEXT NOT NULL DEFAULT 'draft',
  sort_order INTEGER NOT NULL DEFAULT 0,
  parent_id TEXT,
  FOREIGN KEY(project_id) REFERENCES projects(project_id) ON DELETE CASCADE
)

-- [table] documents_fts
CREATE VIRTUAL TABLE documents_fts USING fts5(
  title,
  content_text,
  document_id UNINDEXED,
  project_id UNINDEXED
)

-- [table] generation_traces
CREATE TABLE generation_traces (
  trace_id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL UNIQUE,
  execution_id TEXT NOT NULL,
  skill_id TEXT NOT NULL,
  mode TEXT NOT NULL,
  model TEXT NOT NULL,
  input_text TEXT NOT NULL,
  output_text TEXT NOT NULL,
  project_id TEXT,
  document_id TEXT,
  started_at INTEGER NOT NULL,
  completed_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
)

-- [table] judge_models
CREATE TABLE judge_models (
  model_id TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  error_code TEXT,
  error_message TEXT,
  updated_at INTEGER NOT NULL
)

-- [table] kg_entities
CREATE TABLE kg_entities (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('character', 'location', 'event', 'item', 'faction')),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  attributes_json TEXT NOT NULL DEFAULT '{}',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  ai_context_level TEXT NOT NULL DEFAULT 'when_detected',
  aliases TEXT NOT NULL DEFAULT '[]',
  last_seen_state TEXT,
  FOREIGN KEY(project_id) REFERENCES projects(project_id) ON DELETE CASCADE
)

-- [table] kg_relation_types
CREATE TABLE kg_relation_types (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  key TEXT NOT NULL,
  label TEXT NOT NULL,
  builtin INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(project_id, key),
  FOREIGN KEY(project_id) REFERENCES projects(project_id) ON DELETE CASCADE
)

-- [table] kg_relations
CREATE TABLE kg_relations (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  source_entity_id TEXT NOT NULL,
  target_entity_id TEXT NOT NULL,
  relation_type TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  FOREIGN KEY(project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
  FOREIGN KEY(source_entity_id) REFERENCES kg_entities(id) ON DELETE CASCADE,
  FOREIGN KEY(target_entity_id) REFERENCES kg_entities(id) ON DELETE CASCADE
)

-- [table] memory_episodes
CREATE TABLE memory_episodes (
  episode_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  scope TEXT NOT NULL,
  version INTEGER NOT NULL,
  chapter_id TEXT NOT NULL,
  scene_type TEXT NOT NULL,
  skill_used TEXT NOT NULL,
  input_context TEXT NOT NULL,
  candidates_json TEXT NOT NULL,
  selected_index INTEGER NOT NULL,
  final_text TEXT NOT NULL,
  explicit_feedback TEXT,
  edit_distance REAL NOT NULL,
  implicit_signal TEXT NOT NULL,
  implicit_weight REAL NOT NULL,
  importance REAL NOT NULL,
  recall_count INTEGER NOT NULL DEFAULT 0,
  last_recalled_at INTEGER,
  compressed INTEGER NOT NULL DEFAULT 0,
  user_confirmed INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY(project_id) REFERENCES projects(project_id) ON DELETE CASCADE
)

-- [table] memory_semantic_placeholders
CREATE TABLE memory_semantic_placeholders (
  rule_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  scope TEXT NOT NULL,
  version INTEGER NOT NULL,
  rule_text TEXT NOT NULL,
  confidence REAL NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY(project_id) REFERENCES projects(project_id) ON DELETE CASCADE
)

-- [table] projects
CREATE TABLE projects (
  project_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  root_path TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  archived_at INTEGER,
  type TEXT NOT NULL DEFAULT 'novel',
  description TEXT NOT NULL DEFAULT '',
  stage TEXT NOT NULL DEFAULT 'outline',
  target_word_count INTEGER,
  target_chapter_count INTEGER,
  narrative_person TEXT NOT NULL DEFAULT 'first',
  language_style TEXT NOT NULL DEFAULT '',
  target_audience TEXT NOT NULL DEFAULT '',
  default_skill_set_id TEXT,
  knowledge_graph_id TEXT
)

-- [table] settings
CREATE TABLE settings (
  scope TEXT NOT NULL,
  key TEXT NOT NULL,
  value_json TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (scope, key)
)

-- [table] skill_feedback
CREATE TABLE skill_feedback (
  feedback_id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  action TEXT NOT NULL,
  evidence_ref TEXT,
  ignored INTEGER NOT NULL,
  ignored_reason TEXT,
  created_at INTEGER NOT NULL
)

-- [table] skills
CREATE TABLE skills (
  skill_id TEXT PRIMARY KEY,
  enabled INTEGER NOT NULL,
  valid INTEGER NOT NULL,
  error_code TEXT,
  error_message TEXT,
  updated_at INTEGER NOT NULL
)

-- [table] stats_daily
CREATE TABLE stats_daily (
  date TEXT PRIMARY KEY,
  words_written INTEGER NOT NULL,
  writing_seconds INTEGER NOT NULL,
  skills_used INTEGER NOT NULL,
  documents_created INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
)

-- [table] trace_feedback
CREATE TABLE trace_feedback (
  feedback_id TEXT PRIMARY KEY,
  trace_id TEXT NOT NULL,
  run_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('accept', 'reject', 'partial')),
  evidence_ref TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (trace_id) REFERENCES generation_traces(trace_id) ON DELETE CASCADE
)

-- [table] user_memory
CREATE TABLE user_memory (
  memory_id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  scope TEXT NOT NULL,
  project_id TEXT,
  origin TEXT NOT NULL,
  source_ref TEXT,
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER,
  document_id TEXT DEFAULT NULL,
  FOREIGN KEY(project_id) REFERENCES projects(project_id) ON DELETE CASCADE
)

-- [trigger] documents_ad_fts
CREATE TRIGGER documents_ad_fts AFTER DELETE ON documents BEGIN
  DELETE FROM documents_fts WHERE rowid = old.rowid;
END

-- [trigger] documents_ai_fts
CREATE TRIGGER documents_ai_fts AFTER INSERT ON documents BEGIN
  INSERT INTO documents_fts(rowid, title, content_text, document_id, project_id)
  VALUES (new.rowid, new.title, new.content_text, new.document_id, new.project_id);
END

-- [trigger] documents_au_fts
CREATE TRIGGER documents_au_fts AFTER UPDATE ON documents BEGIN
  DELETE FROM documents_fts WHERE rowid = old.rowid;
  INSERT INTO documents_fts(rowid, title, content_text, document_id, project_id)
  VALUES (new.rowid, new.title, new.content_text, new.document_id, new.project_id);
END
```

> SSOT: ipc/contract/ipc-contract.ts → generated: packages/shared/types/ipc-generated.ts

```
ai:chat:clear
ai:chat:list
ai:chat:send
ai:config:get
ai:config:test
ai:config:update
ai:models:list
ai:skill:cancel
ai:skill:feedback
ai:skill:run
app:system:ping
app:window:close
app:window:getstate
app:window:minimize
app:window:togglemaximized
constraints:policy:create
constraints:policy:delete
constraints:policy:get
constraints:policy:list
constraints:policy:set
constraints:policy:update
context:budget:get
context:budget:update
context:creonow:ensure
context:creonow:status
context:prompt:assemble
context:prompt:inspect
context:rules:list
context:rules:read
context:settings:list
context:settings:read
context:watch:start
context:watch:stop
db:debug:tablenames
embedding:index:reindex
embedding:semantic:search
embedding:text:generate
export:document:docx
export:document:markdown
export:document:pdf
export:document:txt
export:project:bundle
file:document:create
file:document:delete
file:document:getcurrent
file:document:list
file:document:read
file:document:reorder
file:document:save
file:document:setcurrent
file:document:update
file:document:updatestatus
judge:model:ensure
judge:model:getstate
judge:quality:evaluate
knowledge:entity:create
knowledge:entity:delete
knowledge:entity:list
knowledge:entity:read
knowledge:entity:update
knowledge:query:byids
knowledge:query:path
knowledge:query:relevant
knowledge:query:subgraph
knowledge:query:validate
knowledge:recognition:cancel
knowledge:recognition:enqueue
knowledge:recognition:stats
knowledge:relation:create
knowledge:relation:delete
knowledge:relation:list
knowledge:relation:update
knowledge:rules:inject
knowledge:suggestion:accept
knowledge:suggestion:dismiss
memory:clear:all
memory:clear:project
memory:distill:progress
memory:entry:create
memory:entry:delete
memory:entry:list
memory:entry:update
memory:episode:query
memory:episode:record
memory:injection:preview
memory:scope:promote
memory:semantic:add
memory:semantic:delete
memory:semantic:distill
memory:semantic:list
memory:semantic:update
memory:settings:get
memory:settings:update
memory:trace:feedback
memory:trace:get
project:lifecycle:archive
project:lifecycle:get
project:lifecycle:purge
project:lifecycle:restore
project:project:archive
project:project:create
project:project:createaiassist
project:project:delete
project:project:duplicate
project:project:getcurrent
project:project:list
project:project:rename
project:project:setcurrent
project:project:stats
project:project:switch
project:project:update
rag:config:get
rag:config:update
rag:context:retrieve
search:fts:query
search:fts:reindex
search:query:strategy
search:rank:explain
search:replace:execute
search:replace:preview
skill:custom:create
skill:custom:delete
skill:custom:list
skill:custom:update
skill:registry:list
skill:registry:read
skill:registry:toggle
skill:registry:write
stats:day:gettoday
stats:range:get
version:aiapply:logconflict
version:branch:create
version:branch:list
version:branch:merge
version:branch:switch
version:conflict:resolve
version:snapshot:create
version:snapshot:diff
version:snapshot:list
version:snapshot:read
version:snapshot:restore
version:snapshot:rollback
```

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
