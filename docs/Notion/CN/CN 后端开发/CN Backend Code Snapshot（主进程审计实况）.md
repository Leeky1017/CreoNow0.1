# CN Backend Code Snapshot（主进程审计实况）

> Source: Notion local DB page `502f36d2-8792-484d-afff-13a3a41d219c`

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
