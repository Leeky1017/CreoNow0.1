# Audit Roadmap：36 Changes × 6 Phases

> Source: Notion local DB page `b77e51db-172e-4c28-bebb-e5e11c37cc97`

> 🎯

来源：基于 docs/audit/ 七份审计报告拆解的功能建设路线图，与 Code-Audit（反模式修复）是两个维度的工作。

总实现量：~29d（不含 spec 编写 ~11d） ｜ Phase 1 已完成 ✅

## 架构原则

1. 本地文件系统 > 大上下文窗口 — Electron 桌面应用直接访问项目文件夹，精确注入 + 持久缓存 + 增量索引

1. Codex 引用检测 > 向量 RAG — 写作上下文 80% 是结构化知识，字符串匹配 + KG 查询优先

1. 用户主动触发 > AI 自动弹出 — 续写按钮而非 Ghost Text

1. 流动角色 > 固定助手 — ghostwriter/muse/editor/actor/painter 按任务切换

1. 叙事状态 > 通用偏好 — 记忆是角色状态、伏笔揭示、关系变化

---

## Phase 总览

| Phase | 主题 | Changes | 实现量 | Spec | 累计 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| 1 | AI 可用 | 7 | 5.5d | 2d | 7.5d | ✅ 已完成 |
| 2 | Codex 上下文 | 6 | 4.5d | 2d | 14d | ⭕ 就绪 |
| 3 | 写作技能 + 编辑器 | 8 | 6d | 2.5d | 22.5d | ⏳ 待定 |
| 4 | 叙事记忆 + 摘要 | 5 | 4d | 1.5d | 28d | ⏳ 待定 |
| 5 | 语义检索 | 4 | 4d | 1.5d | 33.5d | ⏳ 待定 |
| 6 | 体验完善 | 6 | 5d | 1.5d | 40d | ⏳ 待定 |
| 合计 |  | 36 | 29d | 11d | ~40d |  |

---

## Phase 1 — AI 可用（7 changes, 5.5d）✅

目标：AI 功能从“不可用”→“基本可用”。用户可在 AI 面板多轮对话，AI 有写作身份。

| # | Change ID | 模块 | 范围 | 工量 | 状态 |
| --- | --- | --- | --- | --- | --- |
| C1 | p1-identity-template | ai-service | 身份提示词模板（5 个 XML 区块） | 0.5d | ✅ #468 |
| C2 | p1-assemble-prompt | ai-service | 分层组装 systemPrompt | 1d | ✅ #477 |
| C3 | p1-chat-skill | skill-system | chat 技能 + 基础意图路由 | 0.5d | ✅ #469 |
| C4 | p1-aistore-messages | ai-service | aiStore 增加 messages 数组 | 0.5d | ✅ #483 |
| C5 | p1-multiturn-assembly | ai-service | 多轮消息组装 + token 裁剪 | 1d | ✅ #486 |
| C6 | p1-apikey-storage | workbench | API Key safeStorage + IPC | 1d | ✅ #470 |
| C7 | p1-ai-settings-ui | workbench | AI 设置面板 UI | 1d | ✅ #476 |

依赖：C2←C1，C4←C2，C5←C4，C7←C6，C3/C6 独立

---

## Phase 2 — Codex 上下文（6 changes, 4.5d）

目标：KG 实体自动注入 AI 上下文——写作场景最关键的上下文来源。

| # | Change ID | 模块 | 范围 | 工量 |
| --- | --- | --- | --- | --- |
| C8 | p2-kg-context-level | knowledge-graph | entity 增加 aiContextLevel  • migration + UI | 0.5d |
| C9 | p2-kg-aliases | knowledge-graph | entity 增加 aliases: string\[\]  • migration + UI | 0.5d |
| C10 | p2-entity-matcher | knowledge-graph | 实体名/别名匹配引擎（100实体×1000字 <10ms） | 1d |
| C11 | p2-fetcher-always | context-engine | rules fetcher: 查询 always 实体并格式化注入 | 0.5d |
| C12 | p2-fetcher-detected | context-engine | retrieved fetcher: 调用匹配引擎，注入 when_detected 实体 | 1d |
| C13 | p2-memory-injection | memory-system | Memory → AI prompt + KG rules → Context | 1d |

依赖：C10←C8+C9，C11←C8，C12←C10+C11，C13←Phase1.C2

---

## Phase 3 — 写作技能 + 编辑器（8 changes, 6d）

目标：核心写作交互——续写按钮、Bubble AI、Slash Command、Inline Diff。

| # | Change ID | 模块 | 范围 | 工量 |
| --- | --- | --- | --- | --- |
| C14 | p3-writing-skills | skill-system | 5 个写作技能 SKILL.md | 0.5d |
| C15 | p3-conversation-skills | skill-system | 3 个对话技能 SKILL.md | 0.5d |
| C16 | p3-write-button | editor | 续写悬浮按钮组 UI + 技能调用 | 1d |
| C17 | p3-bubble-ai | editor | Bubble Menu AI 按钮（润色/改写/描写/对白） | 1d |
| C18 | p3-slash-framework | editor | TipTap Slash Command 扩展框架 | 1d |
| C19 | p3-slash-commands | editor | 写作命令集注册（/续写 /描写 /对白 等） | 0.5d |
| C20 | p3-inline-diff | editor | Inline diff decoration + 接受/拒绝 | 1d |
| C21 | p3-shortcuts | editor | 快捷键系统（Ctrl+Enter 续写等） | 0.5d |

依赖：C16/C17←C14，C19←C18，C21←C16+C17，C15/C20 独立

并行机会：Phase 2 和 Phase 3 无互相依赖，可并行推进。

---

## Phase 4 — 叙事记忆 + 摘要（5 changes, 4d）

目标：长篇小说支撑——角色状态跟踪、章节摘要、trace 持久化。

| # | Change ID | 模块 | 范围 | 工量 |
| --- | --- | --- | --- | --- |
| C22 | p4-kg-last-seen | knowledge-graph | entity 增加 last_seen_state  • migration + UI | 0.5d |
| C23 | p4-state-extraction | knowledge-graph | 章节完成时 LLM 提取角色状态变化 | 1d |
| C24 | p4-synopsis-skill | skill-system | synopsis 技能（200-300 字章节摘要） | 0.5d |
| C25 | p4-synopsis-injection | context-engine | 摘要持久存储 + 续写时注入前几章摘要 | 1d |
| C26 | p4-trace-persistence | memory-system | generation_traces + trace_feedback SQLite | 1d |

依赖：C23←C22，C25←C24，C26 独立

---

## Phase 5 — 语义检索（4 changes, 4d）

目标：Codex 之外的补充检索——非结构化文本语义搜索。

| # | Change ID | 模块 | 范围 | 工量 |
| --- | --- | --- | --- | --- |
| C27 | p5-onnx-runtime | search | ONNX Runtime + bge-small-zh 模型加载 | 1d |
| C28 | p5-embedding-service | search | embedding 服务三级降级：ONNX → API → hash | 1d |
| C29 | p5-hybrid-rag | search | Semantic + FTS hybrid ranking (RRF) | 1d |
| C30 | p5-entity-completion | editor | KG 实体名 ghost text 补全（纯本地） | 1d |

依赖：C28←C27，C29←C28，C30←Phase2.C8

---

## Phase 6 — 体验完善（6 changes, 5d）

目标：产品打磨——i18n、搜索、导出、禅模式、模板。

| # | Change ID | 模块 | 范围 | 工量 |
| --- | --- | --- | --- | --- |
| C31 | p6-i18n-setup | workbench | react-i18next 集成 + locale 结构 | 0.5d |
| C32 | p6-i18n-extract | workbench | 硬编码中文 → locale keys | 1d |
| C33 | p6-search-panel | workbench | 搜索面板 UI（全文 + 结果 + 跳转） | 1d |
| C34 | p6-export | document | Markdown/TXT/DOCX 导出 | 1d |
| C35 | p6-zen-mode | editor | 禅模式（全屏编辑器） | 0.5d |
| C36 | p6-project-templates | project | 项目模板系统（小说/短篇/剧本） | 1d |

依赖：C32←C31，其余独立。Phase 5 和 Phase 6 可并行。

---

## 跨 Phase 依赖关系

| 下游 Phase | 依赖的上游 | 具体依赖点 |
| --- | --- | --- |
| Phase 2 | Phase 1 | C13 依赖 C2（assemblePrompt） |
| Phase 3 | Phase 1 | C14-C21 依赖 AI 基础可用 |
| Phase 4 | Phase 1 + 2 | C23 依赖 KG 实体字段，C25 依赖 context 注入 |
| Phase 5 | Phase 2 | C30 依赖 C8（kg-context-level） |
| Phase 6 | 无 | 完全独立 |

并行机会：

- Phase 2 和 Phase 3 可并行（无互相依赖）

- Phase 5 和 Phase 6 可并行（无互相依赖）

---

## Spec 编写策略

- 所有 change 在现有 openspec/specs/<module>/spec.md 基础上增加，不新建 spec 文件

- 每个 change 创建 openspec/changes/<change-id>/proposal.md + tasks.md

- 每个 Phase 的 spec 在该 Phase 开始前编写，不一次性写完

- 同一 Phase 内有 2+ 活跃 change 时，必须维护 EXECUTION_ORDER.md
