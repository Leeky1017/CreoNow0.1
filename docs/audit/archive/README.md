# CreoNow AI Native 完整审计报告

> 审计时间：2026-02-12  
> 审计范围：全系统（12 模块 + 前端 + 后端 + IPC）  
> 审计基准：代码实际行为 vs spec 定义 vs "AI Native 写作 IDE" 产品定位 vs 业界最佳实践

---

## 报告索引

| # | 文件 | 主题 | 对应问题编号 |
|---|------|------|-------------|
| 01 | [01-system-prompt-and-identity.md](./01-system-prompt-and-identity.md) | 系统提示词与 AI 身份 | P0-1, P0-2 |
| 02 | [02-conversation-and-context.md](./02-conversation-and-context.md) | 多轮对话与上下文管理 | P0-3, P1-4 |
| 03 | [03-editor-ai-integration.md](./03-editor-ai-integration.md) | 编辑器 × AI 深度集成 | P2-9, P2-10, P2-11 |
| 04 | [04-rag-embedding-retrieval.md](./04-rag-embedding-retrieval.md) | RAG、Embedding 与语义检索 | P1-6, P1-8 |
| 05 | [05-memory-and-learning.md](./05-memory-and-learning.md) | 记忆系统与偏好学习 | P1-7, P1-5 |
| 06 | [06-onboarding-ux-config.md](./06-onboarding-ux-config.md) | Onboarding、UX 与配置流程 | P2-12 ~ P2-15 |
| 07 | [07-quality-and-polish.md](./07-quality-and-polish.md) | 质量细节与完善度 | P3-16 ~ P3-21 |

---

## 核心结论

**当前系统的本质问题**：后端服务层的类型系统和契约（IPC 类型、错误码、Token 预算、scope 校验）做得非常完整，测试覆盖高。但实际业务管线是断裂的——各模块像独立的零件，从未被组装成一条工作流水线。

三个根本性断裂：

1. **AI 调用链断裂**：系统提示词 → 上下文注入 → 多轮历史 → LLM 调用 → 结果应用，这条链上每个环节都有缺失或桩化
2. **编辑器与 AI 割裂**：写作发生在编辑器，AI 功能在侧边面板，两者之间只有手动复制粘贴级别的交互
3. **后端服务孤岛**：Context Engine、Memory、KG、RAG、Embedding 各自有完整的 CRUD 和错误处理，但没有上游消费者真正使用它们的输出

**一句话**：系统有骨架，无血肉。架构设计合理，但 AI Native 的核心体验——AI 理解上下文、记住偏好、在编辑器中无缝协作——尚未实现。

---

## 业界参考索引

每个子报告中都包含"业界如何解决"章节，引用来源包括：

**编程 IDE（参考架构，但交互模式不直接适用于写作）**：
- **Cursor IDE**：系统提示词结构（2024.12 泄露版 + 2025.03 Agent 版）、Composer 多文件编辑
- **Manus AI**：Agent Loop 架构、Planner 模块、Knowledge/Datasource 模块
- **GitHub Copilot**：Ghost Text 内联补全（报告 03 论证了为何不适合写作）

**通用 AI（参考记忆和上下文管理）**：
- **ChatGPT**：Memory 系统逆向（6 层上下文结构、轻量摘要 vs RAG）
- **Windsurf/Cascade**：Memories 持久化、Workspace Rules
- **Claude (Anthropic)**：Prompt Engineering 最佳实践、Projects 上下文窗口

**AI 写作工具（核心对标，交互模式直接适用）**：
- **Sudowrite**：Muse 模型（fiction-tuned LLM）、Write/Describe/Shrink Ray 交互、Story Bible、百万 token 窗口
- **NovelCrafter**：Codex 4 级 AI 上下文控制、实体引用自动检测、角色扮演对话
- **ACM CHI 论文**：创作者如何看待 AI 角色（流动角色模型）、为何 Ghost Text 不适合写作
- **Notion AI**：文档级 RAG、向量检索架构

---

## 问题优先级总览

| 优先级 | 数量 | 影响 |
|--------|------|------|
| **P0** | 3 | AI 根本不可用 |
| **P1** | 5 | 核心功能管线断裂 |
| **P2** | 7 | 体验割裂、功能缺失 |
| **P3** | 6 | 质量细节 |
| **合计** | **21** | |

---

## 工作量汇总与依赖图

### 各报告工作量估算

| 报告 | 主题 | 工作量 | 关键产出 |
|------|------|--------|--------|
| 01 | 系统提示词与 AI 身份 | **5.5d** | 写作素养身份提示词、流动角色模型、11 个写作专用技能、智能路由 |
| 02 | 多轮对话与上下文管理 | **9d** | 消息数组、Codex 4 级上下文注入、章节摘要 |
| 03 | 编辑器 × AI 深度集成 | **10.5d** | 续写按钮组、Bubble AI（润色/描写/对白）、Slash command、Inline diff |
| 04 | RAG、Embedding 与语义检索 | **15.5d** | **Codex 引用检测（P0）**、本地 embedding（P2）、Hybrid RAG（P3） |
| 05 | 记忆系统与偏好学习 | **8.5d** | 叙事状态记忆、角色状态自动更新、Memory→AI 注入 |
| 06 | Onboarding、UX 与配置 | **11.5d** | AI 设置面板、项目模板、引导流程 |
| 07 | 质量细节与完善度 | **10d** | i18n、搜索面板、导出、版本恢复 |
| **合计** | | **~70.5d** | |

### 依赖关系图

```
01 系统提示词（写作素养+角色流动）──┐
  ├→ 02 多轮对话 + Codex 上下文 ────┤
  │    ├→ 03 编辑器 AI（续写按钮）──┤──→ [AI Native 写作体验闭环]
  │    └→ 05 叙事状态记忆 ──────────┤
  │         └→ 04 Codex P0 → RAG P2 ┘
  │
  └→ 06 Onboarding（API Key 配置）
       └→ 07 质量细节（i18n、搜索、导出）
```

### 推荐执行顺序（按 ROI 排序）

**Phase 1 — AI 可用（~6d）**：解决 P0，让 AI 功能基本工作

| 序号 | 来源 | 任务 | 工作量 |
|------|------|------|--------|
| 1.1 | 01§3.1 | 创建全局 AI 身份提示词（写作素养 + 角色流动） | 0.5d |
| 1.2 | 01§3.2 | 改造 combineSystemText → assembleSystemPrompt | 1d |
| 1.3 | 01§3.3 | 新增 chat 技能 | 0.5d |
| 1.4 | 02§3.1 | aiStore 增加 messages 数组 | 1d |
| 1.5 | 02§3.2 | LLM 调用时组装多轮消息 | 1d |
| 1.6 | 06§3.1 | AI 设置面板（API Key 配置） | 2d |

**Phase 2 — Codex 上下文（~5d）**：实现写作场景最关键的上下文来源

| 序号 | 来源 | 任务 | 工作量 |
|------|------|------|--------|
| 2.1 | 04§4.1 | KG schema 增加 `aiContextLevel` + `aliases` 字段 | 1d |
| 2.2 | 04§4.2 | Codex 引用检测（替换 mock 正则） | 1.5d |
| 2.3 | 02§3.3 | Context Engine fetcher 接入 Codex Always + When-Detected | 1.5d |
| 2.4 | 05§3.1 | Memory previewInjection → AI prompt | 1d |

**Phase 3 — 写作技能 + 编辑器（~8d）**：核心写作交互

| 序号 | 来源 | 任务 | 工作量 |
|------|------|------|--------|
| 3.1 | 01§3.3 | 新增核心写作技能（write/expand/describe/shrink） | 1d |
| 3.2 | 03§3.2 | 续写悬浮按钮组（替代 Ghost Text） | 1.5d |
| 3.3 | 03§3.1 | Bubble Menu 写作 AI 按钮（润色/改写/描写/对白） | 1.5d |
| 3.4 | 03§3.3 | Slash command 写作命令集 | 2d |
| 3.5 | 03§3.4 | Inline diff preview（替代 window.confirm） | 2d |

**Phase 4 — 叙事记忆 + 摘要（~6d）**：长篇小说支撑

| 序号 | 来源 | 任务 | 工作量 |
|------|------|------|--------|
| 4.1 | 05§3.3 | KG entity 增加 `last_seen_state`，角色状态自动更新 | 2.5d |
| 4.2 | 02§3.4 | 章节摘要自动生成（synopsis 技能） | 2d |
| 4.3 | 05§3.4 | Generation trace 持久化 | 1.5d |

**Phase 5 — 语义检索（~6d）**：Codex 之外的补充检索

| 序号 | 来源 | 任务 | 工作量 |
|------|------|------|--------|
| 5.1 | 04§3.1 | 集成 ONNX Runtime + bge-small-zh 本地 embedding | 3d |
| 5.2 | 04§3.2 | RAG semantic + FTS hybrid ranking | 2d |
| 5.3 | 03§3.2 | KG 实体名 ghost text（低创造性补全） | 1d |

**Phase 6 — 体验完善（~10d）**：打磨产品体验

| 序号 | 来源 | 任务 | 工作量 |
|------|------|------|--------|
| 6.1 | 07§3.1 | i18n 基础设施 | 2d |
| 6.2 | 06§3.2 | 项目模板系统 | 2d |
| 6.3 | 07§3.3 | 搜索面板前端 | 2d |
| 6.4 | 07§3.4 | Markdown/TXT/DOCX 导出 | 2.5d |
| 6.5 | 03§3.5 | 禅模式 | 1d |

---

## 审计方法论

1. **代码搜索**：对 12 个模块的 spec 定义与实际代码逐一比对
2. **调用链追踪**：从前端 UI → IPC → 后端服务 → 数据库，追踪完整数据流
3. **桩代码识别**：区分"架构已就绪但数据为桩"与"架构本身缺失"
4. **业界对标**：搜索 Cursor / Manus / ChatGPT / GitHub Copilot / Windsurf / **Sudowrite** / **NovelCrafter** / Notion AI 的公开技术资料和泄露的系统提示词
5. **写作场景校准**：基于 Sudowrite/NovelCrafter/ACM CHI 论文，对所有建议进行写作场景适用性审查，剔除编程 IDE 模式的不适用建议

所有报告中的代码引用均已通过 grep 搜索 + 文件读取二次验证。

---

## 引用来源

| # | 来源 | URL |
|---|------|-----|
| 1 | Cursor IDE System Prompt (2024.12 泄露) | https://github.com/jujumilk3/leaked-system-prompts/blob/main/cursor-ide-sonnet_20241224.md |
| 2 | Cursor Agent System Prompt (2025.03) | https://gist.github.com/sshh12/25ad2e40529b269a88b80e7cf1c38084 |
| 3 | Manus AI Technical Analysis | https://gist.github.com/renschni/4fbc70b31bad8dd57f3370239dccd58f |
| 4 | ChatGPT Memory 逆向工程 | https://manthanguptaa.in/posts/chatgpt_memory/ |
| 5 | GitHub Copilot Inline Suggestions (VS Code) | https://code.visualstudio.com/docs/copilot/ai-powered-suggestions |
| 6 | Cursor Tab Completion 简史 | https://coplay.dev/blog/a-brief-history-of-cursors-tab-completion |
| 7 | Claude Prompting Best Practices | https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/claude-4-best-practices |
| 8 | Windsurf Cascade Docs | https://docs.windsurf.com/windsurf/cascade/cascade |
| 9 | Cascade Memory Bank (社区) | https://github.com/GreatScottyMac/cascade-memory-bank |
| 10 | Sudowrite Story Engine | https://sudowrite.com/ |
| 11 | Notion AI RAG Infrastructure | https://www.zenml.io/llmops-database/scaling-data-infrastructure-for-ai-features-and-rag |
| 12 | Sudowrite Muse Deep Dive | https://sudowrite.com/blog/what-is-sudowrite-muse-a-deep-dive-into-sudowrites-custom-ai-model/ |
| 13 | NovelCrafter Codex Entry 文档 | https://www.novelcrafter.com/help/docs/codex/anatomy-codex-entry |
| 14 | ACM CHI: From Pen to Prompt | https://arxiv.org/html/2411.03137v2 |
| 15 | NovelCrafter 深度评测 | https://kindlepreneur.com/novelcrafter-review/ |
| 16 | Sudowrite 2026 评测 | https://kindlepreneur.com/sudowrite-review/ |
