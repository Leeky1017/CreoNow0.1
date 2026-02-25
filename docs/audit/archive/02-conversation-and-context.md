# 02 — 多轮对话与上下文管理

> 对应问题：P0-3（无多轮对话历史）、P1-4（Context Engine 用桩数据）

---

## 一、CN 当前状态

### 1.1 aiStore 无对话历史

**文件**：`apps/desktop/renderer/src/stores/aiStore.ts`

aiStore 管理单次 `input` → `output` 对。核心状态：

```typescript
// 只有单次输入输出，没有 messages 数组
input: string;
output: string;
status: "idle" | "running" | "streaming" | "done" | "error";
selectedSkill: string;
```

**没有** `messages: Array<{role: "user"|"assistant", content: string}>` 结构。每次 AI 调用完全无状态。

### 1.2 AI 面板的"历史"只是浏览

AiPanel.tsx 有一个 history dropdown，但它只用于查看过去的运行记录，**不参与 prompt 组装**。用户说"继续刚才的方向"，AI 没有"刚才"的上下文。

### 1.3 Context Engine fetcher 全是桩

**文件**：`apps/desktop/main/src/services/context/layerAssemblyService.ts` → `defaultFetchers()`

```typescript
function defaultFetchers(): ContextLayerFetcherMap {
  return {
    rules: async (request) => ({
      chunks: [{ source: "kg:entities", content: `Skill ${request.skillId} must follow project rules.` }],
    }),
    settings: async () => ({ chunks: [] }),
    retrieved: async () => ({ chunks: [] }),
    immediate: async (request) => ({
      chunks: [{ source: "editor:cursor-window", content: request.additionalInput?.trim() ?? `cursor=${request.cursorPosition}` }],
    }),
  };
}
```

四层上下文（rules/settings/retrieved/immediate）全部返回硬编码桩。KG 规则注入、Memory 注入、RAG 检索——全未连接。

---

## 二、业界如何解决

### 2.1 ChatGPT — 6 层上下文结构

**来源**：[逆向工程 ChatGPT Memory 系统](https://manthanguptaa.in/posts/chatgpt_memory/)

ChatGPT 的每次请求包含 6 层上下文，按优先级排列：

```
[0] System Instructions     — 系统指令（固定）
[1] Developer Instructions  — 开发者指令（API 调用者设置）
[2] Session Metadata        — 会话元数据（设备、时区、使用模式，临时）
[3] User Memory             — 用户记忆（长期事实，跨会话持久化）
[4] Recent Conversations    — 近期对话摘要（轻量摘要，非全文）
[5] Current Session Messages — 当前会话消息（滑动窗口，全文）
[6] Latest User Message     — 最新用户消息
```

**关键发现**：

- **不用 RAG 搜索历史对话**：ChatGPT 用轻量摘要（标题 + 用户消息片段），而非向量检索全部历史
- **Token 预算管理**：当前会话消息用滑动窗口，超出 token 上限时旧消息滚出，但 Memory 和摘要始终保留
- **User Memory 是显式存储**：只在用户说"记住这个"或模型检测到符合条件的事实时存储，不是自动记录一切

### 2.2 Cursor — IDE 状态自动注入

Cursor 的上下文注入策略（从泄露 prompt）：

```
"Each time the USER sends a message, we may automatically attach 
some information about their current state, such as:
- what files they have open
- where their cursor is
- recently viewed files
- edit history in their session so far
- linter errors
This information may or may not be relevant to the coding task, 
it is up for you to decide."
```

关键：Cursor **不要求** AI 使用所有注入信息，而是说"may or may not be relevant, it is up for you to decide"。这避免了上下文过载。

### 2.3 Manus — Event Stream 结构化记忆

Manus 使用 Event Stream 作为对话+动作的统一日志：

```
Event Stream（每轮更新，按时间序）：
├── [User] 用户请求
├── [Plan] 任务分解计划
├── [Action] Agent 执行了浏览网页
├── [Observation] 网页内容摘要
├── [Action] Agent 执行了写代码
├── [Observation] 代码执行结果
├── [Knowledge] 从知识库检索的参考
└── [User] 用户追加指令
```

通过 typed events 区分不同信息来源，让模型理解每条信息的性质和权重。

### 2.4 Sudowrite — Story Bible + 百万 Token 窗口

**来源**：[Sudowrite Story Engine](https://sudowrite.com/)

Sudowrite 处理长篇小说（10万+ 字）的策略：

- **Story Bible**：从角色档案、世界观设定、前情摘要中组装上下文，而非直接塞入全文
- **百万 Token 窗口**：Flash 模式支持 1M token context window，可以"读完悲惨世界和白鲸记后再写下一章"
- **章节级摘要**：自动为每章生成摘要，续写时注入前几章摘要而非全文

### 2.5 NovelCrafter Codex — 4 级 AI 上下文控制（核心对标）

**来源**：[NovelCrafter Codex Entry 文档](https://www.novelcrafter.com/help/docs/codex/anatomy-codex-entry)、[NovelCrafter 深度评测](https://kindlepreneur.com/novelcrafter-review/)

NovelCrafter 的 Codex 是**写作场景最先进的上下文管理系统**，比 Sudowrite 的 Story Bible 更精细。

每个 Codex 条目（角色/地点/物品/传说）有 4 级 AI 上下文控制：

| 级别 | 行为 | 适用场景 |
|------|------|---------|
| **Always include** | 始终注入 AI 上下文 | 世界观核心规则、主角档案 |
| **Include when detected** | 文本中检测到引用时自动注入 | 配角、次要地点 |
| **Don't include when detected** | 检测到也不注入（手动可拉入） | 不想让 AI 知道的伏笔 |
| **Never include** | 永远不注入 | 私密笔记、大纲草稿 |

**关键机制**：Codex 自动检测文本中的实体引用（名字、别名），当用户写到某个角色时，AI 自动获得该角色的档案信息。无需手动复制粘贴。

**对 CN 的启示**：CN 的 KG 已有 entity 类型（`character/location/event/item/faction`，见 `kgService.ts` L15-20），**天然就是 Codex**。只需增加 `aiContextLevel` 字段和引用检测机制即可实现。这比通用 RAG 向量检索对写作场景更有价值（见报告 04）。

---

## 三、CN 应该怎么做

### 3.1 aiStore 增加对话消息数组

```typescript
type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  skillId?: string;
  metadata?: { tokenCount: number; model: string };
};

// aiStore 新增状态
messages: ChatMessage[];          // 当前会话消息
maxHistoryTokens: number;         // 历史窗口 token 上限（默认 4000）
```

### 3.2 LLM 调用时组装多轮消息

参考 ChatGPT 的分层策略：

```typescript
function buildLLMMessages(args: {
  systemPrompt: string;
  messages: ChatMessage[];
  maxTokens: number;
}): Array<{role: string; content: string}> {
  const result = [{ role: "system", content: args.systemPrompt }];
  
  // 从最新消息倒推，直到 token 预算耗尽
  let tokenBudget = args.maxTokens;
  const historySlice: ChatMessage[] = [];
  
  for (let i = args.messages.length - 1; i >= 0; i--) {
    const msg = args.messages[i];
    const tokens = estimateTokens(msg.content);
    if (tokenBudget - tokens < 0) break;
    tokenBudget -= tokens;
    historySlice.unshift(msg);
  }
  
  for (const msg of historySlice) {
    result.push({ role: msg.role, content: msg.content });
  }
  
  return result;
}
```

### 3.3 接入真实 Context Engine Fetchers（Codex 模型）

替换 `defaultFetchers()` 为真实数据源，融合 NovelCrafter Codex 模型（§2.5）：

| Layer | 原桩数据 | 修订后数据源 | 接入方式 |
|-------|---------|------------|---------|
| **rules** | 硬编码字符串 | **Codex Always 实体** + 项目级写作规则 | KG 查询 `aiContextLevel="always"` 的实体 |
| **settings** | 空数组 | Memory `previewInjection` | 注入用户偏好、写作风格记忆 |
| **retrieved** | 空数组 | **Codex When-Detected 实体** + RAG 段落检索 | 扫描光标前后文本，检测实体引用 → 查询 KG；RAG 作补充 |
| **immediate** | 光标位置字符串 | Editor state | 光标位置、选中文本、当前场景标题 |

**Codex 引用检测实现**：

```typescript
// retrieved fetcher 核心逻辑
const codexRetrievedFetcher: ContextLayerFetcher = async (request) => {
  const chunks: ContextLayerChunk[] = [];
  
  // 1. 获取光标前后文本（immediate layer 提供）
  const cursorWindow = request.additionalInput ?? "";
  
  // 2. 从 KG 加载所有 when_detected 实体的 name + aliases
  const detectableEntities = await kgService.entityList({
    projectId: request.projectId,
    filter: { aiContextLevel: "when_detected" },
  });
  
  // 3. 扫描文本中的实体引用
  for (const entity of detectableEntities) {
    const names = [entity.name, ...(entity.aliases ?? [])];
    if (names.some(n => cursorWindow.includes(n))) {
      chunks.push({
        source: `codex:entity:${entity.id}`,
        content: formatEntityForContext(entity),
        projectId: request.projectId,
      });
    }
  }
  
  // 4. 补充 RAG 段落检索（如果 embedding 可用）
  // ...
  
  return { chunks };
};
```

**需要 KG schema 新增**：`aiContextLevel` 字段（当前不存在）和 `aliases` 字段（当前不存在），详见报告 04。

### 3.4 写作专用的上下文窗口策略

融合 Sudowrite Story Bible（§2.4）和 NovelCrafter Codex（§2.5），CN 的上下文应包含：

```
[固定] 全局 AI 身份提示词（含写作素养 + 角色流动）
[固定] 用户写作偏好（Memory）
[固定] 项目类型和约束
[固定] Codex Always 实体（世界观规则、主角档案）
[动态] Codex When-Detected 实体（检测到引用的配角/地点）
[动态] 前几章/前几节的内容摘要（synopsis 技能生成）
[动态] 当前章节全文
[动态] 光标前后 500 字窗口
[动态] RAG 检索结果（非结构化文本的语义搜索补充）
[会话] 最近 N 轮对话历史
```

---

## 四、实施优先级

| 步骤 | 内容 | 工作量 | 前置依赖 |
|------|------|--------|---------|
| 1 | aiStore 增加 messages 数组和管理逻辑 | 1d | 无 |
| 2 | LLM 调用时组装多轮消息 | 1d | 步骤 1 |
| 3 | KG schema 增加 `aiContextLevel` + `aliases` 字段 | 1d | 无 |
| 4 | 实现 rules fetcher → Codex Always 实体注入 | 1d | 步骤 3 |
| 5 | 实现 retrieved fetcher → Codex 引用检测 + RAG 补充 | 1.5d | 步骤 3 |
| 6 | 实现 settings fetcher → Memory previewInjection | 1d | Memory 服务已就绪 |
| 7 | 实现 immediate fetcher → Editor state | 0.5d | Editor store 已有 |
| 8 | 实现章节摘要自动生成（synopsis 技能） | 2d | LLM 调用链就绪 |

**总计约 9 天**。步骤 1-2 解决 P0-3（多轮对话）。步骤 3-5 实现 Codex 模型——这是写作场景最关键的上下文来源。
