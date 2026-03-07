# CreoNow 后端模块健康度审查


> "不积跬步，无以至千里；不积小流，无以成江海。"——后端的每一个模块都是 CN 这条河的支流，任何一条断流，用户的体验都会在某个不可预知的时刻干涸。

---

## 文件索引

| § | 章节 | 内容 |
|---|------|------|
| 一 | 审查原则 | "要么不做，要么做好"的全量必修标准 |
| 二 | 模块健康度速查表 | 一张表覆盖全部 20+ 模块 |
| 三 | AI 服务族 | AI Service / Skill System / Context Engine / Judge |
| 四 | 数据与存储族 | Document / Version / Export / Backup / Autosave / FTS |
| 五 | 知识与记忆族 | KG / Memory / 向量 / 实体识别 |
| 六 | 基础设施族 | IPC / Scheduler / Settings / Logging / Telemetry / Token 估算 |
| 七 | "看起来有但其实没有"清单 | 界面有入口、后端无闭环的功能 |
| 八 | v0.1 必修清单 | 先做 / 再做 / 后做 |

---

## 一、审查原则

本文件遵循一条铁律：**所有问题都必须解决，区别仅在先做还是后做。**

不存在"🟡 中风险、不阻塞 v0.1"这种说法。如果一个能力的边缘场景不健全，那它就不是"有小缺陷"，而是"还没做好"。用户不会区分"核心功能"和"边缘场景"——他们只会在某个时刻撞上，然后认为整个产品不靠谱。

每个模块按统一格式：

- **现状**：已实现的功能点
- **缺口**：边缘场景、未完成功能、代码证据
- **时序**：先做（Phase 0）/ 再做（Phase 1）/ 后做（Phase 2+）
- **关联 backlog ID**

---

## 二、模块健康度速查表

| 模块 | 核心功能 | 边缘场景 | 时序 |
|------|----------|----------|------|
| AI Service | ✅ 完整 | ⚠️ 缺口 | 先做/再做 |
| Skill System | ✅ 完整 | ❌ 严重缺口 | 先做 |
| Context Engine | ✅ 完整 | ⚠️ 缺口 | 后做 |
| Judge | ❌ 未实现 | ❌ 未实现 | 先做 |
| Document Service | ✅ 完整 | ❌ 严重缺口 | 先做/再做 |
| Version Service | ✅ 完整 | ✅ 已处理 | — |
| Export Service | ⚠️ 半成品 | ❌ 严重缺口 | 先做 |
| Backup Service | ❌ 不存在 | ❌ 不存在 | 先做 |
| Autosave | ✅ 完整 | ⚠️ 缺口 | 先做 |
| Search/FTS | ✅ 基础可用 | ⚠️ CJK 弱 | 再做 |
| RAG | ✅ 完整 | ⚠️ 估算偏差 | 后做 |
| KG CRUD | ✅ 完整 | ⚠️ 缺口 | 再做 |
| KG 实体识别 | ❌ mock | ❌ mock | 后做 |
| Memory 偏好学习 | ⚠️ 半成品 | ❌ reject 不学习 | 再做 |
| Memory 向量 | ⚠️ 半成品 | ❌ 非真实 embedding | 后做 |
| Memory 蒸馏 | ⚠️ 半成品 | ❌ 非 LLM | 后做 |
| IPC | ✅ 完整 | ⚠️ 缺口 | 后做 |
| Scheduler | ✅ 完整 | ✅ 已处理 | — |
| Settings | ✅ 完整 | ✅ 已处理 | — |
| Logging | ✅ 基础可用 | ⚠️ renderer 缺兜底 | 先做 |
| Telemetry | ❌ 不存在 | ❌ 不存在 | 后做 |
| Token 估算 | ⚠️ 偏差大 | ❌ 中文低估 30-50% | 后做 |

---

## 三、AI 服务族

### 3.1 AI Service

**现状**：

- 3 个 provider（Anthropic / OpenAI / Proxy）完整接入
- SSE 流式输出 + 非流式 fallback
- 重试机制（指数退避）
- 非流式 failover（primary → backup）
- 取消 / 超时 / AbortSignal
- 全局限流（60 次/分钟滑动窗口）

**缺口**：

| 缺口 | 代码证据 | 时序 |
|------|----------|------|
| API Key 仅检查长度，不校验有效性 | `providerResolver.ts` L378-381：`args.env.CREONOW_AI_API_KEY.length > 0` | 再做 |
| 无模型名校验，不存在的 model 直接打到上游 | `aiService.ts`：`model` 参数直接传给 `runAnthropicStream`/`runOpenAiStream`，无前置校验 | 再做 |
| 限流为全局单窗口，未按 provider 区分 | `aiService.ts` L280-294：`consumeRateLimitToken()` 共用 `requestTimestamps` 数组 | 后做（A2-24） |
| 流式模式无 failover | 非流式有 backup provider 切换，流式只用 primary | 后做（A2-22） |

**关联 backlog**：A2-22（流式 failover）、A2-24（per-provider 限流）

---

### 3.2 Skill System

**现状**：

- 17 个内置 skill（chat/rewrite/expand/synopsis 等）
- 文件化 SKILL.md 定义 + 路由 + 调度
- `skillScheduler`：全局并发 8、会话队列 20、超时取消
- `skillExecutor`：执行流水线 + 上下文组装

**缺口**：

| 缺口 | 代码证据 | 时序 |
|------|----------|------|
| **除 synopsis 外无 output 校验** | `skillExecutor.ts` L310-324：`if (leafSkillId !== "synopsis") return { ok: true }`。LLM 垃圾输出会直接写入编辑器 | **先做**（A0-24） |
| 6 个 skill 无路由关键词 | `skillRouter.ts`：describe/shrink/critique/dialogue/roleplay/style-transfer 无 `keywords`，只能显式选择 | 再做（A1-14） |
| 否定语境守卫缺失 | `skillRouter.ts`：纯 `includes()` 匹配，"不要续写"也会触发续写 | 再做（A1-14） |
| output 约束仅 synopsis 定义 | `builtin:rewrite` 等 SKILL.md 无 `output.minChars/maxChars` | 再做 |

**关联 backlog**：A0-24（输出校验扩展）、A1-14（路由守卫 + 发现性）

---

### 3.3 Context Engine

**现状**：

- 4 层装配：rules → settings → retrieved → immediate
- token 预算管理 + 降级不阻断
- fetcher 独立（`rulesFetcher`、`settingsFetcher`、`retrievedFetcher`、`synopsisFetcher`）

**缺口**：

| 缺口 | 代码证据 | 时序 |
|------|----------|------|
| immediate 层未接入 RAG 检索 | `layerAssemblyService.ts`：immediate 层仅用 `additionalInput` | 后做 |
| synopsis 依赖注入而非自动获取 | fetcher 设计正确但依赖调用方传入 | — |

---

### 3.4 Judge / Quality

**现状**：

- `judgeService`：提供 `ensure()` / `evaluate()` 接口
- `judgeQualityService`：规则引擎（视角一致性 + 重复检测两条规则）

**缺口**：

| 缺口 | 代码证据 | 时序 |
|------|----------|------|
| `ensure()` **永远返回 `MODEL_NOT_READY`** | `judgeService.ts` L104-108：非 E2E 时返回 `ipcError("MODEL_NOT_READY", ...)` | **先做**（A0-18） |
| `runAdvancedChecks` 为空函数 | `judgeQualityService.ts` L138-140：默认返回空数组 | **先做**（A0-18） |
| 仅两条规则（视角一致性 + 重复检测） | 规则引擎内容极少，用户感知不到"质量检查"的价值 | 再做 |

**关联 backlog**：A0-18（Judge 决策）

---

## 四、数据与存储族

### 4.1 Document Service

**现状**：

- 完整 CRUD + save + status 转换（draft/review/final）+ reorder
- `deriveContent` 从 JSON 派生纯文本 + 字数 + 段落数
- `serializeJson` + `hashJson` 确保内容完整性

**缺口**：

| 缺口 | 代码证据 | 时序 |
|------|----------|------|
| **未实现 5MB 文档大小限制** | `documentCoreService.ts` L871-1031（`createDocSaveOps`）：无 size check，spec 要求 ≤ 5MB | **先做**（A0-23） |
| **未实现乐观锁并发保存** | save 直接 `UPDATE documents SET ...`，无 `version` 或 `content_hash` CAS 比较。`DOCUMENT_SAVE_CONFLICT` 在 IPC 契约中存在但未使用 | 再做（A1-16） |
| **无崩溃后草稿恢复** | 未发现 crash recovery 或 draft recovery 逻辑 | 后做（A2-23） |

**关联 backlog**：A0-23（5MB 限制）、A1-16（乐观锁）、A2-23（崩溃恢复）

---

### 4.2 Version Service

**现状**：

- 三路合并（`threeWayMerge.ts`）
- unified diff（`documentDiffHelpers.ts`）
- rollback / restore
- 超大 diff 有 2MB 限制（`DEFAULT_MAX_DIFF_PAYLOAD_BYTES = 2 * 1024 * 1024`，`documentCoreService.ts` L40）
- 冲突 UI 已接入 `version:conflict:resolve`
- 分支操作基本可用（`BRANCH_NAME_PATTERN` 限制 `[a-z0-9-]{3,32}`）

**缺口**：无严重缺口。多文档 / 跨项目级别版本管理属 v0.2+ 范畴。

---

### 4.3 Export Service

**现状**：

- 4 种格式：Markdown / TXT / PDF / DOCX
- 所有格式均使用 `contentText`（纯文本）

**缺口**：

| 缺口 | 代码证据 | 时序 |
|------|----------|------|
| **PDF 仅纯文本** | `exportService.ts` L299-391：使用 `doc.data.contentText`，Helvetica 12pt，无富文本/图片/排版 | **先做**（A0-19） |
| **DOCX 仅纯文本** | `exportService.ts` L393+：按行拆分为 `Paragraph` + `TextRun`，无格式/图片/表格 | **先做**（A0-19） |
| 用户感知与实际能力严重不符 | UI 展示"支持 PDF/DOCX"但实际只是纯文本换壳 | **先做**（A0-19） |

**关联 backlog**：A0-19（诚实标注 / 降级 Beta）

---

### 4.4 Backup Service

**现状**：**完全不存在。**

- 设置页有 `backupInterval` UI 控件
- 后端无调度器、无写盘逻辑、无恢复入口

**缺口**：

| 缺口 | 代码证据 | 时序 |
|------|----------|------|
| **功能完全缺失** | 搜索 `backupService` / `backup` handler 无结果，仅 Settings UI 有 `backupInterval` | **先做**（A0-17） |

**关联 backlog**：A0-17（Backup 决策）

---

### 4.5 Autosave

**现状**：

- 500ms debounce + 队列 + 手动插队
- 失败重试

**缺口**：

| 缺口 | 代码证据 | 时序 |
|------|----------|------|
| `void save(...)` 静默失败 | `useAutosave.ts`：save 失败时错误仅进 console，用户无感知 | **先做**（A0-02，已在 backlog） |

---

### 4.6 Search / FTS

**现状**：

- SQLite FTS5 + 触发器同步 + BM25 排序 + reindex
- 按项目隔离

**缺口**：

| 缺口 | 代码证据 | 时序 |
|------|----------|------|
| **FTS5 默认 unicode61 tokenizer 对 CJK 分词效果差** | `0006_search_fts.sql` L6-11：`USING fts5(...)` 未指定 tokenizer。中文按字符分词，"张三"需精确匹配 | 再做（A1-22） |
| 不支持跨项目搜索 | `ftsService.ts`：`WHERE project_id = ?` 硬隔离 | 后做 |
| 特殊字符处理不明确 | `normalizeQuery` L71-82：仅做 trim 和长度检查，FTS5 语法字符（`*`、`-`）未过滤 | 再做 |

**关联 backlog**：A1-22（CJK 搜索优化）

---

## 五、知识与记忆族

### 5.1 KG CRUD / 查询

**现状**：

- 实体 / 关系 CRUD + 重复检测（`entityDuplicateExists` L424-442）
- k-hop 子图查询
- BFS 路径查询（`queryPathWithinAdjacency` L503-575）
- Aho-Corasick 文本匹配
- `queryRelevant` 关键词召回

**缺口**：

| 缺口 | 代码证据 | 时序 |
|------|----------|------|
| `queryPath` 无显式循环检测 | L503-575：BFS 用 `visited` 避免重复访问，但图存在环时路径可能过长 | 再做（A1-21） |
| `listProjectEntities` 无分页 | 加载全部实体后排序，大量实体时 O(n) | 再做 |
| `queryRelevant` 纯关键词 | `normalizeKeywordTokens` L441-448：`split(/[^\p{L}\p{N}]+/u)`，无语义向量。中文按字符边界分词，效果有限 | 后做 |
| `queryValidate` 有循环检测 | L1422-1490：`stack.has(neighbor)` 时记录 cycle（已实现） | — |

**关联 backlog**：A1-21（queryPath 循环检测）

---

### 5.2 KG 实体识别

**现状**：

- `kgRecognitionRuntime.ts`：mock 正则匹配
- 生产环境应接入 LLM 抽取

**缺口**：

| 缺口 | 代码证据 | 时序 |
|------|----------|------|
| 实体识别为 mock 正则 | 生产代码使用正则匹配而非 LLM | 后做（A2-18） |

---

### 5.3 Memory 偏好学习

**现状**：

- `accept` 触发阈值学习
- 记录 `reject` / `partial` 但不参与学习

**缺口**：

| 缺口 | 代码证据 | 时序 |
|------|----------|------|
| **`reject`/`partial` 仅记录不学习** | `preferenceLearning.ts` L195-228：`ignored: true, ignoredReason: "unsupported_action"` | 再做（A1-15） |
| 系统只学喜欢不学反感 | 用户反复拒绝某种风格，系统仍推荐 | 再做（A1-15） |

**关联 backlog**：A1-15（reject/partial 纳入学习权重）

---

### 5.4 Memory 向量

**现状**：

- `sqlite-vec` 存储
- 嵌入使用 FNV1a32 哈希

**缺口**：

| 缺口 | 代码证据 | 时序 |
|------|----------|------|
| **FNV1a32 非真实 embedding** | `userMemoryVec.ts` L174-182：`fnv1a32` 是哈希函数，不具备语义相似度能力 | 后做（A2-19） |
| 相似语义不同措辞会召回失败 | bag-of-words + hash 无法捕捉语义关系 | 后做（A2-19） |

**关联 backlog**：A2-19（升级真实 LLM embedding）

---

### 5.5 Memory 蒸馏

**现状**：

- 容量限制：活跃 1,000 条、压缩 5,000 条（`episodicMemoryService.ts` L34-35）
- 默认蒸馏为规则引擎

**缺口**：

| 缺口 | 代码证据 | 时序 |
|------|----------|------|
| **蒸馏未接入 LLM** | `episodicMemoryService.ts` L928-955：`defaultDistillLlm` 基于短句比例生成规则，非 LLM 语义分析 | 后做（A2-25） |
| `deps.distillLlm` 可注入但默认未注入 | 接口设计正确，但生产环境跑的是规则 | 后做（A2-25） |

**关联 backlog**：A2-25（蒸馏接入真实 LLM）

---

## 六、基础设施族

### 6.1 IPC

**现状**：

- 117 个通道全部有 handler，0 stub
- 88 个错误码
- typed contract + runtime validation

**缺口**：

| 缺口 | 代码证据 | 时序 |
|------|----------|------|
| 运行时校验未全覆盖 | 部分通道使用 `createValidatedIpcMain`，未全量覆盖 | 后做（A2-20） |
| 5 个 Push 通道未纳入契约 | Push 通道缺乏 schema 定义 | 后做（A2-20） |
| `memory:distill:progress` 死路径 | Push 发了但 Preload 不转发 | 后做（A2-20） |

**关联 backlog**：A2-20（IPC 运行时校验全覆盖）

---

### 6.2 Scheduler

**现状**：

- 全局并发限 8（`aiService.ts` L1392-1395）
- 会话队列限 20
- 超时 + 取消即释放

**缺口**：无严重缺口。

---

### 6.3 Settings / Preferences

**现状**：

- SQLite 持久化
- `safeStorage` 加密 API Key（`SecretStorageAdapter`）

**缺口**：无严重缺口。

---

### 6.4 Logging

**现状**：

- JSONL 文件日志（主进程）
- `fireAndForget.ts` 捕获异步异常

**缺口**：

| 缺口 | 代码证据 | 时序 |
|------|----------|------|
| renderer 无全局异常兜底 | `main.tsx` 无 `unhandledrejection`/`error` 全局监听 | **先做**（A0-03，已在 backlog） |

---

### 6.5 Telemetry / Crash Reporting

**现状**：**完全缺失。**

**缺口**：

| 缺口 | 代码证据 | 时序 |
|------|----------|------|
| 无 Sentry / crashReporter | `fireAndForget.ts` 有 TODO 注释但未实现 | 后做（A2-21） |
| 发布后无法定位用户侧崩溃 | 只能靠用户口述复现 | 后做（A2-21） |

**关联 backlog**：A2-21（Telemetry 最小闭环）

---

### 6.6 Token 估算

**现状**：

- `estimateUtf8TokenCount`（`tokenBudget.ts` L18-21）：`Math.ceil(bytes / 4)`
- RAG 也有类似估算（`rag.ts`）

**缺口**：

| 缺口 | 代码证据 | 时序 |
|------|----------|------|
| 中文可低估 30-50% | 中文字符 3-4 字节/字，实际 token 数与字节数比例不是 1:4 | 后做（A2-07，已在 backlog） |

---

## 七、"看起来有但其实没有"清单

这些是最危险的——用户看到了入口或文案，以为功能存在，实际后端无闭环。

| 功能 | 用户看到的 | 实际真相 | 时序 |
|------|-----------|---------|------|
| 备份 | Settings 有 `backupInterval` 设置项 | 后端无调度器、无写盘、无恢复 | **先做**（A0-17） |
| 质量检查（Judge） | QualityPanel 有"检查"按钮 | `ensure()` 永远返回 `MODEL_NOT_READY` | **先做**（A0-18） |
| PDF/DOCX 导出 | ExportDialog 展示四种格式 | 全部仅导出纯文本 | **先做**（A0-19） |
| Skill 输出质量 | 用户信任 AI 改写结果 | 除 synopsis 外无任何输出校验 | **先做**（A0-24） |
| 偏好学习"越用越懂你" | Memory 面板暗示在学习 | `reject`/`partial` 被忽略 | 再做（A1-15） |
| 语义搜索 | 搜索功能存在 | FTS5 纯关键词，中文分词弱 | 再做（A1-22） |
| 实体识别 | KG 面板显示识别结果 | 后端跑的是 mock 正则 | 后做（A2-18） |
| 记忆蒸馏 | Memory 系统暗示在提炼偏好 | 默认规则引擎，非 LLM | 后做（A2-25） |

---

## 八、v0.1 必修清单

### 8.1 先做（Phase 0）：不做好就不能发布

| ID | 任务 | 根因 |
|----|------|------|
| A0-17 | Backup 决策：实现或隐藏 | UI 有入口但功能不存在 |
| A0-18 | Judge 决策：接入远程 LLM 或降级为纯规则并更新文案 | `ensure()` 永远失败 |
| A0-19 | Export 纯文本诚实标注 | PDF/DOCX 名不副实 |
| A0-23 | 文档 5MB 限制实施 | spec 要求但未实现，超限可导致 OOM |
| A0-24 | Skill 输出校验扩展 | LLM 垃圾输出直接写入编辑器 |

### 8.2 再做（Phase 1）：做好了才有体验可言

| ID | 任务 | 根因 |
|----|------|------|
| A1-14 | Skill Router 否定语境守卫 + 无路由 skill 发现性 | "不要续写"触发续写 |
| A1-15 | Memory reject/partial 纳入学习权重 | 只学喜欢不学厌恶 |
| A1-16 | 文档并发保存乐观锁 | 后写覆盖先写，数据丢失 |
| A1-21 | KG queryPath 循环检测 | 图有环时可能过长路径 |
| A1-22 | CJK 搜索优化 | 中文搜索体验差 |

### 8.3 后做（Phase 2+）：做好了才有竞争力

| ID | 任务 | 根因 |
|----|------|------|
| A2-18 | KG 实体识别接入 LLM | mock 正则不具备生产质量 |
| A2-19 | Memory 向量升级真实 embedding | FNV1a32 非语义向量 |
| A2-20 | IPC 运行时校验全覆盖 + Push 通道纳入契约 | 部分通道无校验 |
| A2-21 | Telemetry / crash reporting 最小闭环 | 发布后无法定位崩溃 |
| A2-22 | AI 流式 failover | 流式无备用 provider |
| A2-23 | 崩溃后草稿恢复机制 | 崩溃丢字 |
| A2-24 | AI 限流按 provider 区分 | 多 provider 共用单窗口 |
| A2-25 | Memory 蒸馏接入真实 LLM | 默认规则引擎 |

---

> 后端的健康度审查，不是为了给模块打分，而是为了让 CN 在每一次用户动作背后，都有真实可靠的支撑。正如荀子所言："不闻不若闻之，闻之不若见之，见之不若知之，知之不若行之。"——发现问题只是开始，做好才是结束。
