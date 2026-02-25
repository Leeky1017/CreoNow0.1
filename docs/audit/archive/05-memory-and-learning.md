# 05 — 记忆系统与偏好学习

> 对应问题：P1-7（Memory 未接入 AI 链）、P1-5（KG 规则注入未连接）

---

## 一、CN 当前状态

### 1.1 Memory 服务后端完整但无消费者

**文件**：`apps/desktop/main/src/services/memory/memoryService.ts`

Memory 服务已实现：
- **CRUD**：create / list / update / delete 用户记忆
- **三种类型**：preference（偏好）、fact（事实）、note（笔记）
- **三级作用域**：global（全局）、project（项目）、document（文档）
- **两种来源**：manual（用户手动创建）、learned（系统学习）
- **注入预览**：`previewInjection` 方法——按 scope 排序，支持 deterministic 和 semantic 两种模式
- **设置**：injectionEnabled / preferenceLearningEnabled / privacyModeEnabled / preferenceLearningThreshold

**问题**：`previewInjection` 的结果**从未被任何调用者消费**。没有代码将 Memory 注入到 AI 的 system prompt 中。

### 1.2 偏好学习机制存在但阈值高

**文件**：`apps/desktop/main/src/services/memory/preferenceLearning.ts`

偏好学习流程：
1. 用户对 AI 输出做 accept/reject/partial 反馈
2. `recordSkillFeedbackAndLearn` 记录反馈到 `skill_feedback` 表
3. 只有 `accept` 动作才计入学习信号
4. 同一 `evidenceRef` 累计达到 `preferenceLearningThreshold`（默认 3 次）时，创建 learned preference
5. learned preference 存入 `user_memory` 表

**问题**：
- 阈值逻辑合理，但**学到的偏好同样从未被注入到 AI 提示词中**
- `evidenceRef` 目前传的是什么？如果是原始文本片段，那 3 次相同片段被 accept 才学习——这几乎不会发生

### 1.3 情景记忆有衰减但无持久化证据

**文件**：`apps/desktop/main/src/services/memory/episodicMemoryService.ts`

情景记忆实现了完整的衰减机制：
- `calculateDecayScore`：遗忘曲线（指数衰减 + 回忆次数增强 + 重要性增强）
- `classifyDecayLevel`：active (≥0.7) → decaying (≥0.3) → to_compress (≥0.1) → to_evict (<0.1)
- `dailyDecayRecomputeTrigger`：每日重算所有 episode 的衰减分数

**问题**：衰减分数更新在内存中（直接修改 episode 对象），不确定是否回写 SQLite。语义规则衰减有 `upsertSemanticRule` 调用，但 episode 分数更新后没有 persist 调用。

### 1.4 Generation Trace 仅内存

**文件**：`apps/desktop/main/src/services/memory/memoryTraceService.ts`

`createInMemoryMemoryTraceService` 用 Map 存储 trace 和 feedback。应用重启后全部丢失。

### 1.5 KG 规则注入方法存在但未被 Context Engine 调用

**文件**：`apps/desktop/main/src/services/kg/kgService.ts` → `buildRulesInjection`

KG 服务有 `buildRulesInjection` 方法，查询当前文档相关的实体及关系，返回格式化的注入数据。但 Context Engine 的 `rules` fetcher 返回硬编码字符串，**未调用此方法**。

---

## 二、业界如何解决

### 2.1 ChatGPT — 显式记忆 + 轻量摘要

**来源**：[逆向工程 ChatGPT Memory](https://manthanguptaa.in/posts/chatgpt_memory/)

ChatGPT 的记忆系统设计极其精简：

**User Memory（长期记忆）**：
- 存储格式：纯文本的事实列表（`"User's name is Manthan Gupta"`）
- 存储条件：用户显式说"记住这个" **或** 模型检测到符合条件的事实（姓名、职业、偏好）且用户隐式同意
- 存储上限：约 30-50 条事实
- 注入方式：**每次请求都注入**全部记忆事实（因为数量少，token 开销可控）
- 管理：用户可说 "删除这条记忆" 或在设置页管理

**Recent Conversations（跨会话感知）**：
- 格式：`<Timestamp>: <Chat Title> |||| user message snippet ||||`
- 数量：约 15 条最近对话的摘要
- 只摘要用户消息，不摘要 AI 回复
- 不用 RAG，直接注入——trade detail for speed

**关键设计决策**：
1. **不做 RAG 搜索历史**：预计算轻量摘要比实时向量搜索更快更稳定
2. **显式优先于隐式**：用户主动说"记住"的可靠性远高于自动推断
3. **量少质高**：30 条精确事实 > 3000 条模糊推断

### 2.2 Windsurf/Cascade — 自动记忆 + 规则层

**来源**：[Windsurf Docs](https://docs.windsurf.com/windsurf/cascade/cascade)、[Cascade Memory Bank](https://github.com/GreatScottyMac/cascade-memory-bank)

Cascade 的记忆分为两类：

**自动记忆（Cascade Memories）**：
- Cascade 自动从对话中提取重要上下文
- 跨会话持久化存储
- 存储在本地，以 `.md` 文件形式
- 每次新会话开始时自动注入相关记忆

**Memory Bank 模式**（社区扩展）：
```
.windsurf/memory-bank/
├── projectbrief.md      — 项目概述
├── productContext.md     — 产品上下文
├── activeContext.md      — 当前工作焦点
├── systemPatterns.md     — 架构和设计模式
├── techContext.md        — 技术栈和依赖
└── progress.md           — 进展和待办
```

通过 `.windsurfrules` 文件告诉 Cascade 在每个会话开始时读取这些文件。这是一种**结构化的外部记忆**。

### 2.3 Claude Projects — 项目级上下文窗口

Claude 的 Projects 功能：
- 用户可以上传文档到 Project 中
- Project 中的所有文档作为固定上下文注入每次对话
- 最大 200K token 的项目上下文窗口
- 适用于"AI 需要了解整个项目背景"的场景

**对 CreoNow 的启示**：写作项目天然就是一个 Claude Project——项目中的所有文档（小说章节、角色设定、世界观文档）应该作为 AI 的持久上下文。

### 2.4 Sudowrite Muse — 动态角色档案

**来源**：[Sudowrite Muse Deep Dive](https://sudowrite.com/blog/what-is-sudowrite-muse-a-deep-dive-into-sudowrites-custom-ai-model/)

Sudowrite Muse 为每个故事元素维护**动态档案**，随写作进展自动更新：

```json
{
  "character": "Kaelen",
  "core_motivation": "Avenge his sister's death",
  "key_traits": ["Stoic", "Cynical", "Secretly sentimental"],
  "last_seen_state": "Wounded, hiding in the Whispering Woods",
  "relationships": { "Elara": "Strained, unresolved romantic tension" }
}
```

**关键洞察**：写作中的"记忆"不是通用 AI 的"用户偏好"——而是**叙事状态**。AI 需要记住角色在第 5 章受了伤、读者在第 3 章已经知道了反派的身份、林默和苏瑶的关系从对立变成了合作。

**对 CN 的启示**：CN 的 KG entity 已有类似结构（name/type/description/attributes），只需增加 `last_seen_state`（最新状态）字段即可。

### 2.5 Mem0 / Cognee — 开源 AI Memory 框架

**来源**：Reddit 讨论中提到的开源方案

[Mem0](https://github.com/mem0ai/mem0)：
- 开源的 AI 记忆层
- 自动从对话中提取、更新、删除记忆
- 支持用户级、会话级、Agent 级记忆
- 向量存储 + 图存储双模式
- 矛盾检测：新记忆与旧记忆冲突时自动解决

[Cognee](https://github.com/topoteretes/cognee)：
- 知识图谱 + 向量存储的混合记忆
- 自动从文档中提取实体和关系
- 支持增量更新

---

## 三、CN 应该怎么做

### 3.1 Memory 注入到 AI 提示词

最关键的修复——将已有的 Memory 服务输出接入 AI 调用链：

```typescript
// 在 SkillExecutor.execute 或 aiService.runSkill 中
async function buildMemoryOverlay(args: {
  memoryService: MemoryService;
  projectId?: string;
  documentId?: string;
}): Promise<string> {
  const preview = memoryService.previewInjection({
    projectId: args.projectId,
    documentId: args.documentId,
  });
  
  if (!preview.ok || preview.data.items.length === 0) return "";
  
  const lines = preview.data.items.map(item => {
    const scopeTag = item.scope === "global" ? "" : `[${item.scope}] `;
    return `- ${scopeTag}${item.content}`;
  });
  
  return `<user_preferences>\n${lines.join("\n")}\n</user_preferences>`;
}
```

然后在 `assembleSystemPrompt` 中注入：

```typescript
const memoryOverlay = await buildMemoryOverlay({ memoryService, projectId, documentId });
const systemPrompt = assembleSystemPrompt({
  globalIdentity: GLOBAL_IDENTITY,
  skillSystemPrompt: skill.systemPrompt,
  memoryOverlay,  // ← 注入记忆
  contextOverlay,
});
```

### 3.2 KG 规则注入到 Context Engine

替换 Context Engine 的 `rules` fetcher：

```typescript
const realRulesFetcher: ContextLayerFetcher = async (request) => {
  // 1. 从 KG 获取当前文档相关的实体规则
  const kgRules = kgService.buildRulesInjection({
    projectId: request.projectId,
    documentId: request.documentId,
    excerpt: request.additionalInput ?? "",
    traceId: randomUUID(),
  });
  
  const chunks: ContextLayerChunk[] = [];
  
  if (kgRules.ok) {
    for (const entity of kgRules.data.injectedEntities) {
      chunks.push({
        source: `kg:entity:${entity.id}`,
        content: formatEntityForContext(entity),
        projectId: request.projectId,
      });
    }
  }
  
  return { chunks };
};
```

### 3.3 写作场景的记忆模型（叙事状态）

写作中的"记忆"不是通用 AI 的"用户偏好"（§2.4）——而是**叙事状态**。CN 的记忆应分为以下维度：

| 维度 | 示例 | 来源 | 注入频率 | 存储位置 |
|------|------|------|---------|---------|
| **角色状态** | "林默在第 5 章受了伤，正在养伤" | 自动提取 + 用户编辑 | 相关时 | KG entity `last_seen_state` |
| **情节线索** | "红宝石的秘密还未揭示" | 用户标注 | 续写时 | Memory note |
| **已揭示信息** | "读者已知反派是王叔" | 自动追踪 | 续写时 | Memory fact |
| **关系变化** | "林默和苏瑶从对立转为合作" | 自动检测 + 用户确认 | 相关时 | KG relation |
| **风格偏好** | "偏好短句、少用形容词" | 偏好学习（保留） | 每次 | Memory preference |
| **世界规则** | "魔法消耗生命力" | Codex Always 实体 | 每次 | KG entity |

**与通用记忆模型的差异**：前 4 项（角色状态、情节线索、已揭示信息、关系变化）是写作专属——通用 AI 助手不需要跟踪角色受伤状态或伏笔是否已揭示。这些叙事状态主要存储在 KG（结构化）而非 Memory 表（扁平文本）中。

**`last_seen_state` 自动更新**：每章写完后，调用 LLM 提取角色状态变化，自动更新 KG entity 的 `last_seen_state` 字段和关系。这对标 Sudowrite Muse 的动态角色档案。

### 3.4 Generation Trace 持久化

将 `createInMemoryMemoryTraceService` 改为 SQLite 支持：

```sql
CREATE TABLE IF NOT EXISTS generation_traces (
  generation_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  memory_refs_json TEXT NOT NULL,
  influence_weights_json TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS generation_feedback (
  feedback_id TEXT PRIMARY KEY,
  generation_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  verdict TEXT NOT NULL CHECK (verdict IN ('correct', 'incorrect')),
  reason TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (generation_id) REFERENCES generation_traces(generation_id)
);
```

### 3.5 偏好学习优化

当前 `evidenceRef` 作为学习信号的问题：需要同一文本被 accept 3 次才学习。改为**模式级学习**：

```typescript
// 不是记录原始文本，而是提取写作模式
// 例如：用户多次 accept "把被动语态改为主动语态" → 学习偏好 "prefer_active_voice"
function extractLearningPattern(args: {
  original: string;
  accepted: string;
  skillId: string;
}): string | null {
  // 使用 LLM 提取模式差异
  // "用户接受了将'被XX所困扰'改为'XX困扰着他'——偏好主动语态"
  return pattern;
}
```

---

## 四、实施优先级

| 步骤 | 内容 | 工作量 | 前置依赖 |
|------|------|--------|---------|
| 1 | Memory previewInjection → AI system prompt 注入 | 1d | 01 报告中的 assembleSystemPrompt |
| 2 | KG buildRulesInjection → Context Engine rules fetcher（Codex Always） | 1d | 无 |
| 3 | **KG entity 增加 `last_seen_state` 字段** | 0.5d | 无 |
| 4 | **章节完成时自动更新角色状态**（LLM 提取 → KG 更新） | 2d | AI 调用链就绪 + 步骤 3 |
| 5 | Generation trace 持久化到 SQLite | 1.5d | 无 |
| 6 | Episodic memory decay 分数持久化确认/修复 | 0.5d | 无 |
| 7 | 偏好学习模式提取（LLM-based） | 2d | AI 调用链就绪 |

**总计约 8.5 天**。步骤 1-2 将已有后端接入 AI 链路。步骤 3-4 是写作专属——实现 Sudowrite 的动态角色档案能力。
