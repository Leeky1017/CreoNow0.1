# CreoNow AI Native 完整审计报告

> 审计范围：AI Service、Skill System、Context Engine、Memory System、Knowledge Graph、Search & Retrieval、Editor、Workbench、Onboarding、IPC  
> 审计基准：代码实际行为 vs spec 定义 vs "AI Native 写作 IDE" 产品定位

---

## 一、P0 — AI 根本不能正常工作

### 1. 缺少全局 AI 身份系统提示词

**位置**：`apps/desktop/main/src/services/ai/aiService.ts` → `combineSystemText`

**现象**：用户在 AI 面板发消息，AI 重复用户所说的话。

**根因**：`combineSystemText` 仅拼接 `skill.systemPrompt`（技能级）+ `system`（动态叠加层）。**不存在**一个稳定的全局系统提示词来定义 AI 的身份、角色、行为约束。当用户未选择特定技能、或技能 systemPrompt 为空时，LLM 收到的系统提示可能为 `null`，导致 LLM 退化为 echo/补全行为。

`modeSystemHint` 仅添加一行 `"Mode: agent\nAct as an autonomous writing assistant and make concrete edits."` —— 这远不足以定义一个写作助手的行为规范。

**修复方向**：在 `combineSystemText` 最前面注入一个固定的 CreoNow AI 身份提示词（角色、能力边界、输出格式要求、语言偏好、安全约束），所有技能/模式的 systemPrompt 在其后叠加。

---

### 2. 不存在"对话"技能 — 自由输入无处理路径

**位置**：`apps/desktop/main/skills/packages/pkg.creonow.builtin/1.0.0/skills/`

**现象**：所有内置技能（polish、continue、rewrite 等）都是**单轮文本变换**。没有 `chat`、`ask`、`brainstorm` 等处理自由对话的技能。

**影响**：用户在 AI 面板输入一个问题或指令（如"帮我想一个开头"），系统找不到匹配的对话处理路径，走到某个默认技能后 prompt 不匹配，LLM 输出异常。

**修复方向**：新增 `chat` 技能，其 system prompt 定义对话式写作助手行为，user prompt 模板直接传递 `{{input}}`，支持追问、头脑风暴、创意生成等开放场景。

---

### 3. 无多轮对话历史

**位置**：`apps/desktop/renderer/src/stores/aiStore.ts`

**现象**：aiStore 管理的是单次 `input` → `output` 对。没有 `messages: Array<{role, content}>` 结构。

**影响**：每次 AI 调用都是无状态的。用户说"继续刚才的方向"，AI 没有"刚才"的上下文。AI 面板的"历史下拉"仅用于浏览过去的运行记录，不参与 prompt 组装。

**修复方向**：aiStore 增加对话消息数组；`runSkill` 时将历史消息作为 LLM messages 传入；设置合理的历史窗口和 token 截断策略。

---

## 二、P1 — 核心功能管线断裂

### 4. Context Engine 使用硬编码桩数据

**位置**：`apps/desktop/main/src/services/context/layerAssemblyService.ts` → `defaultFetchers()`

**现象**：四层上下文（rules / settings / retrieved / immediate）的 fetcher 全部返回硬编码桩：
- **rules**：`"Skill X must follow project rules."` — 固定字符串
- **settings**：空
- **retrieved**：空
- **immediate**：仅 `cursorPosition` 或 `additionalInput`

**影响**：Context Engine 的架构（四层 + token 预算 + 截断策略 + scope 校验）已完整实现，但**没有真实数据源接入**。KG 规则注入、Memory 注入、RAG 检索结果——全部未连接到 fetcher。AI 拿到的上下文只有用户输入本身。

**修复方向**：实现真实 fetcher，分别从 KG `buildRulesInjection`、Memory `previewInjection`、RAG `retrieve` 获取数据，注入到对应层。

---

### 5. KG 实体识别只有 Mock 正则

**位置**：`apps/desktop/main/src/services/kg/kgRecognitionRuntime.ts` → `createMockRecognizer()`

**现象**：实体识别器用硬编码正则：
- `「」` 书名号包裹的 2-32 字符
- `林` 开头的中文名
- 以 `仓库|城|镇|村|山|馆|楼` 结尾的地点

**影响**：对任何非"林姓角色"或非标准地点命名的内容，识别率为零。这不是 MVP，是 demo stub。

**修复方向**：接入 LLM 做 NER（命名实体识别），或至少用分词 + 词典匹配的方案。

---

### 6. Embedding 服务无真实模型

**位置**：`apps/desktop/main/src/services/embedding/embeddingService.ts`

**现象**：仅支持 `cn-byte-estimator`（hash-based pseudo-embedding）。对 `"default"` 模型返回 `MODEL_NOT_READY`。

**影响**：语义搜索、RAG reranking、Memory 语义匹配——所有依赖 embedding 的功能**质量为零**。Hash-based 向量的余弦相似度没有语义含义。

**修复方向**：集成本地 embedding 模型（如 ONNX Runtime + bge-small-zh）或调用远程 embedding API。

---

### 7. Memory 注入未接入 AI 调用链

**位置**：Memory service 的 `previewInjection` 方法存在，但无调用者将其结果传入 `combineSystemText` 的 `system` 参数。

**现象**：Memory 系统的 CRUD、偏好学习、情景记忆、衰减——后端逻辑完整。但写作记忆**从未被注入到 AI 提示词中**。

**影响**：AI 永远不知道用户的写作偏好、历史上下文、已学习的风格规则。Memory 系统形同虚设。

**修复方向**：在 SkillExecutor.execute 或 AI 调用前，查询 Memory injection，将结果作为 system overlay 传入。

---

### 8. RAG 仅为 FTS 降级模式

**位置**：`apps/desktop/main/src/services/rag/ragService.ts`

**现象**：注释明确写 `"minimal RAG retrieval service (FTS fallback)"`。Reranking 用的是 hash-based embedding。

**影响**：检索增强生成名不副实。用户写到第 10 章时，AI 无法从前 9 章中语义检索相关段落。只有关键词精确匹配才能命中。

**修复方向**：接入真实 embedding 后，RAG 才能真正工作。同时需要接入 Context Engine 的 retrieved 层。

---

## 三、P2 — 编辑器与 AI 未集成

### 9. 编辑器无 AI 内联功能

**位置**：`apps/desktop/renderer/src/features/editor/EditorPane.tsx`

**现象**：TipTap 编辑器仅挂载基础扩展（StarterKit、Underline、Link、BubbleMenu）。

**缺失**：
- 无 AI inline completion / ghost text
- 无 AI 内联建议浮层
- Bubble menu 只有格式按钮，无 "AI: 润色/续写/改写" 选项
- 无 `/` 斜杠命令调用 AI
- 无选中文本后右键 AI 操作
- 无 `Cmd+K` / `Ctrl+K` 快速调用 AI

**影响**：AI 功能完全割裂在侧边面板中。用户必须：选中文本 → 切到 AI 面板 → 选技能 → 点运行 → 查看输出 → 点应用。这不是 AI Native 体验，是"AI 附件"。

**修复方向**：
- BubbleMenu 增加 AI 操作按钮组
- 实现 slash command 扩展
- 实现 inline ghost text suggestion
- 快捷键直接在编辑器位置触发 AI

---

### 10. 无禅模式

**位置**：spec 定义了 zen mode，代码中未找到任何实现。

---

### 11. Diff 对比视图为占位

**位置**：AI 面板的 `onApply` 使用 `window.confirm` 做确认，非真正的 inline diff preview。

**影响**：用户无法直观看到 AI 修改了什么、接受/拒绝具体修改。

---

## 四、P2 — Onboarding 与 UX 缺陷

### 12. Onboarding 是静态展示页

**位置**：`apps/desktop/renderer/src/features/onboarding/OnboardingPage.tsx`

**现象**：4 张特性卡片 + "开始使用" 按钮。点击后直接进入 WelcomeScreen。

**缺失**：
- 无 API Key 配置步骤（用户进入后 AI 功能必然不可用）
- 无项目创建引导
- 无交互式教程
- 无示例项目/模板

---

### 13. WelcomeScreen 冷启动体验差

**位置**：`apps/desktop/renderer/src/features/welcome/WelcomeScreen.tsx`

**现象**：仅显示 "Welcome to CreoNow" + 一个 "Create project" 按钮。

**缺失**：
- 无最近项目列表
- 无项目模板（小说、剧本、论文等）
- 无快速开始引导
- 与 Onboarding 页语言不一致（英文 vs 中文）

---

### 14. AI 面板缺少智能交互

**位置**：`apps/desktop/renderer/src/features/ai/AiPanel.tsx`

**缺失**：
- 无对话视图（只有单次 input/output）
- 技能需要手动选择，无根据输入内容自动推断技能
- 无建议 prompt / 快速操作卡片
- 无新用户引导

---

### 15. 无 AI 配置界面

**现象**：后端有 provider config（OpenAI / Anthropic），前端无设置入口。

**影响**：用户无法配置 API Key、选择模型、调整参数。AI 功能首次使用必然失败，且用户不知如何修复。

---

## 五、P3 — 质量与完善度

### 16. 语言不一致

| 位置 | 语言 |
|------|------|
| OnboardingPage | 中文（欢迎使用 CreoNow） |
| WelcomeScreen | 英文（Welcome to CreoNow） |
| EditorPane 容量警告 | 中文 |
| EditorPane final guard | 英文 |
| Version preview banner | 中文 |
| Bubble menu link | 英文（Link） |

---

### 17. Bubble Menu Link 硬编码 URL

**位置**：`EditorBubbleMenu.tsx` → `toggleLink`

```typescript
editor.chain().focus().setLink({ href: "https://example.com" }).run();
```

应弹出输入框让用户输入 URL。

---

### 18. 版本恢复按钮为占位

**位置**：`EditorPane.tsx` → "恢复到此版本" 按钮 `disabled={true}`

---

### 19. Generation Trace 仅内存存储

**位置**：`memoryTraceService.ts` → `createInMemoryMemoryTraceService`

应用重启后所有生成溯源数据丢失。

---

### 20. 搜索面板未发现前端实现

FTS / Hybrid / Semantic 搜索服务后端完整，但未找到对应的 SearchPanel 前端组件。

---

### 21. 文档导出功能缺失

Spec 提及导出能力，代码中未发现实现。

---

## 六、问题优先级汇总

| 优先级 | 编号 | 问题 | 影响面 |
|--------|------|------|--------|
| **P0** | 1 | 无全局 AI 身份系统提示词 | AI 不可用 |
| **P0** | 2 | 无对话技能 | 自由输入无响应 |
| **P0** | 3 | 无多轮对话历史 | AI 无上下文 |
| **P1** | 4 | Context Engine 用桩数据 | 上下文注入无效 |
| **P1** | 5 | KG 识别仅 mock 正则 | 实体识别不工作 |
| **P1** | 6 | Embedding 无真实模型 | 语义能力为零 |
| **P1** | 7 | Memory 未接入 AI 链 | 偏好学习无效 |
| **P1** | 8 | RAG 仅 FTS 降级 | 检索增强名不副实 |
| **P2** | 9 | 编辑器无 AI 内联功能 | AI 体验割裂 |
| **P2** | 10 | 无禅模式 | 功能缺失 |
| **P2** | 11 | Diff 对比为占位 | 修改不可视 |
| **P2** | 12 | Onboarding 无实质引导 | 首次体验差 |
| **P2** | 13 | WelcomeScreen 冷启动 | 新用户流失 |
| **P2** | 14 | AI 面板缺智能交互 | 使用门槛高 |
| **P2** | 15 | 无 AI 配置界面 | 配置断路 |
| **P3** | 16 | 语言不一致 | 品质感差 |
| **P3** | 17 | Link 硬编码 URL | 功能缺陷 |
| **P3** | 18 | 版本恢复占位 | 功能缺失 |
| **P3** | 19 | Trace 仅内存 | 数据丢失 |
| **P3** | 20 | 搜索面板缺前端 | 功能不闭环 |
| **P3** | 21 | 导出功能缺失 | 功能不闭环 |

---

## 七、核心结论

**当前系统的本质问题**：后端服务层的**类型系统和契约**（IPC 类型、错误码、Token 预算、scope 校验）做得非常完整，测试覆盖高。但**实际业务管线是断裂的**——各模块像独立的零件，从未被组装成一条工作流水线。

具体表现：
1. **AI 调用链断裂**：系统提示词 → 上下文注入 → 多轮历史 → LLM 调用 → 结果应用，这条链上每个环节都有缺失或桩化。
2. **编辑器与 AI 割裂**：写作发生在编辑器，AI 功能在侧边面板，两者之间只有手动复制粘贴级别的交互。
3. **后端服务孤岛**：Context Engine、Memory、KG、RAG、Embedding 各自有完整的 CRUD 和错误处理，但没有上游消费者真正使用它们的输出。

**一句话**：系统有骨架，无血肉。架构设计合理，但 AI Native 的核心体验——**AI 理解上下文、记住偏好、在编辑器中无缝协作**——尚未实现。
