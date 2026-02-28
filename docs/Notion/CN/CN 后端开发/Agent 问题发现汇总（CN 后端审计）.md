# Agent 问题发现汇总（CN 后端审计）

> Source: Notion local DB page `19ff6cf1-2103-46e4-ad02-d5787676354d`

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
