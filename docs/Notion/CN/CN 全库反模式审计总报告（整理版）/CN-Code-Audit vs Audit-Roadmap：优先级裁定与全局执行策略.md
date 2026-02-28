# CN-Code-Audit vs Audit-Roadmap：优先级裁定与全局执行策略

> Source: Notion local DB page `307f5ddf-267f-8000-9102-d1f80207fd02`

---

## 一、优先级裁定：CN-Code-Audit 先行

结论：CN-Code-Audit 必须先做，但不是串行做完再做 roadmap，而是交织执行。

理由基于三个不可回避的事实：

### 1. 地基有裂缝，不能继续盖楼

audit-roadmap Phase 2-6 要在现有模块上叠加新功能。但这些模块现在的状态是：

| audit-roadmap 要做的事 | 依赖的模块当前的病 |
| --- | --- |
| Phase 2: KG 加 aiContextLevel、别名匹配、context fetcher | KG Panel 异步写入不校验结果 (A6-H-003)、metadata 解析失败清空回写 (A2-H-002/003)、Context 装配循环依赖 (A5-C-001) |
| Phase 3: 写作技能 + Slash Command + Inline Diff | skillScheduler 吞错 (A3-H-001)、skillLoader 静默返回空 (A2-H-004)、AiPanel 1254 行 God Component (A7-C-006) |
| Phase 2-6 所有功能经过 IPC | IPC 无调用方鉴权 (A4-H-002)、sandbox 关闭 (A4-H-001) |
| Phase 2-6 所有功能涉及 aiService/docService/kgService | 三个 God Object 分别 1743/1460/1378 行，任何新功能都会加剧耦合 |

在病人身上做手术，风险指数级增长。

### 2. 结构性问题扼杀并行开发效率

- 3 个 God Object 意味着任何两个并行任务大概率改同一个文件，Git 冲突成为常态

- 818 处深层相对路径 import 意味着任何目录调整都是灾难

- 循环依赖 意味着新功能的架构设计空间被压缩——你想加一个 fetcher，发现它的依赖图是个环

### 3. 安全问题有硬截止线

sandbox: false + IPC 无鉴权 = Electron 应用的基本安全底线缺失。这不是"以后再说"的问题，是"任何面向用户的版本发布之前必须修"的问题。audit-roadmap 做的功能如果要上线，这些安全问题无论如何绕不过去。

---

## 二、执行策略：四阶段交织模型

核心思路：不做"先还完所有债再做功能"的串行模式（那要 100+ 天），而是用 Extract-Then-Extend 策略让债务修复和功能建设共享同一次代码变更。

### 关键原则

1. Same-File Batching：当因任何原因触碰一个文件时，同时修复该文件所有已知问题。杜绝"改两次"。

1. Extract-Then-Extend：不在 God Object 上加功能。先提取相关子服务，再在干净的提取物上加功能。

1. Automated Ratchet：每修一类问题，立即加 lint/CI 规则防止回退。修过的不允许再犯。

1. 依赖驱动排序：每个 Sprint 的产出必须恰好解锁下一个 Sprint 的工作。

---

### Sprint 0：紧急止血（2-3d）

修复数据完整性、安全、崩溃路径问题。全部是手术刀级小改。

| # | 编号 | 修复项 | 量级 | 理由 |
| --- | --- | --- | --- | --- |
| 1 | A3-C-001 | 空内容伪造 queued 响应 → 改 skipped / ok:false | S | 数据完整性谎言：调用方拿到不可追踪的 taskId |
| 2 | A6-H-001 | 窗口加载 Promise 兜底 | S | 启动黑屏无日志 |
| 3 | A6-H-002 | app.whenReady() 链尾加 .catch | S | 主进程启动失败进入僵尸态 |
| 4 | A2-H-002 | metadata 解析失败禁止清空回写 | M | 隐性数据丢失 |
| 5 | A2-H-003 | KG Panel metadata 解析 fail-fast | M | 同上，同模块 |
| 6 | A2-H-004 | skillLoader 目录读取返回结构化错误 | S | "没有技能"的幽灵故障 |
| 7 | A4-H-001 | 启用 sandbox: true + 回归 | M | 安全底线 |
| 8 | A6-H-003 | KG Panel 异步写入 → 校验结果 + allSettled | M | 前后端状态分叉 |

产出：消除所有可导致数据丢失/安全漏洞/启动失败的即时风险。

---

### Sprint 1：架构解锁（5-7d）

打碎结构性瓶颈，为功能开发创造洁净空间。

| # | 编号 | 修复项 | 量级 | 解锁 |
| --- | --- | --- | --- | --- |
| 1 | A5-C-001 | 打断 Context 装配循环依赖 | L | 解锁 Phase 2 全部 context fetcher 工作 |
| 2 | A4-H-002 | IPC 调用方身份 ACL | L | 解锁任何面向用户发布 |
| 3 | A7-H-007/008 | tsconfig paths alias（@shared/*） | M | 一次性消除 818 处深层 import 的根因，后续全量替换可脚本化 |
| 4 | A5-H-001 | RightPanel / AiPanel 循环依赖拆解 | M | 解锁 Phase 3 编辑器 UI 工作 |
| 5 | A7-H-009~012 | 运行时配置中心（timeout/retry/token budget/payload） | M | 解锁 Phase 2 token 预算对齐 |
| 6 | — | 三大 God Object 提取接口设计（仅接口，不实现） | M | 为 Sprint 2 的 Extract-Then-Extend 提供蓝图 |

关于 God Object 的策略调整：

99-修复优先级将 A7-C-001~006（6 个 God Object 拆分）全部列为 P0，总工作量 5×XL + 1×L ≈ 20-25d。如果全部前置做完再做功能，timeline 不可接受。

我的判断：它们是高优先架构债务，不是"立即修复否则出事"的 P0。正确做法是按需渐进提取——

> 当 Phase 2 需要修改 kgService 时，先从 kgService 提取 kgQueryService（Phase 2 需要的那部分），然后在 kgQueryService 上做 Phase 2 功能。kgService 的其余部分暂时保持原样，但它变薄了。每轮迭代，God Object 都在缩小。

这比"一次性拆完"更安全（改动可控、可回归）、更高效（提取和功能共享同一个 PR）。

---

### Sprint 2：交织推进（20-25d）

两条轨道交替推进，按模块对齐，最大化 Same-File Batching。

### 轨道 A：功能建设（audit-roadmap Phase 2 + 3）

| 周 | 功能 | 前置提取 | 同步修的债务 |
| --- | --- | --- | --- |
| W1 | Phase 2: C8 kg-context-level, C9 kg-aliases | 从 kgService 提取 kgEntityWriter | A1-H-002（类型收敛）, A3-H-002（metrics 拆分） |
| W2 | Phase 2: C10 entity-matcher, C11 fetcher-always | 从 layerAssemblyService 提取 fetcher 接口 | A2-H-001（context 组装可观测化） |
| W3 | Phase 2: C12 fetcher-detected, C13 memory-injection | — | A2-M-001（fetcher warning 增强） |
| W4 | Phase 3: C14-C15 writing/conversation skills | 从 skillScheduler 提取 skillRuntime | A3-H-001（scheduler 错误上下文）, A1-H-003（judge 状态机收敛） |
| W5 | Phase 3: C16-C17 write-button + bubble-ai | 从 AiPanel 提取 AiConversationFlow | A1-M-001/002（demo 参数清理） |
| W6 | Phase 3: C18-C21 slash + inline-diff + shortcuts | — | A2-M-002/003（双字段兼容治理） |

### 轨道 B：剩余债务（CN-Code P1/P2 非交叉项）

在轨道 A 的间隙（等 spec 确认、等 PR review 时）处理：

| 批次 | 内容 | 量级 |
| --- | --- | --- |
| B1 | A2-M-004（删 ping 不可达 catch）、A1-M-003（barrel 注释）、A1-M-004（去包装函数） | 3×S = 0.5d |
| B2 | A3-M-001（setTimeout→条件等待，批量 19 处）、A3-M-002（story 行为断言） | M+S = 1.5d |
| B3 | A6-M-001~004（MemoryPanel/kgStore/searchStore/scheduler 健壮性） | 4×M = 2d |
| B4 | A7-M-013~016（import 扇入治理、test 边界穿透） | 4×M = 2d |
| B5 | 深层 import 全量替换（Sprint 1 已设好 alias，此处脚本化批量替换） | L = 1d |

---

### Sprint 3：收尾 + 高级功能（15-20d）

| 内容 | 范围 |
| --- | --- |
| audit-roadmap Phase 4 | 叙事记忆 + 摘要（5 changes, 4d）— 此时 kgService 已大幅瘦身 |
| audit-roadmap Phase 5 | 语义检索（4 changes, 4d）— 独立模块，依赖已就绪 |
| audit-roadmap Phase 6 | 体验完善（6 changes, 5d）— 独立模块 |
| CN-Code P3 Backlog | 14 项，大部分 S/M，可穿插 |
| A7 模式级治理 | 108 个超长文件、571 个超长函数 → lint 规则 + CI ratchet，不人工逐个修 |

---

## 三、跨审计依赖图

```
Sprint 0 (止血)
  ├─ A3-C-001 ──────────────────────────────────┐
  ├─ A6-H-001/002 ──────────────────────────────┤
  ├─ A2-H-002/003 ──────────────────────────┐   │
  ├─ A2-H-004 ─────────────────────────┐    │   │
  ├─ A4-H-001 ─────────────────────┐   │    │   │
  └─ A6-H-003 ─────────────────┐   │   │    │   │
                                │   │   │    │   │
Sprint 1 (架构解锁)            │   │   │    │   │
  ├─ A5-C-001 ──────────┐      │   │   │    │   │
  ├─ A4-H-002 ─────┐    │      │   │   │    │   │
  ├─ Path alias ─┐  │    │      │   │   │    │   │
  ├─ Config center│  │    │      │   │   │    │   │
  └─ God Object  │  │    │      │   │   │    │   │
    interfaces   │  │    │      │   │   │    │   │
                 │  │    │      │   │   │    │   │
Sprint 2 (交织)  ▼  ▼    ▼      ▼   ▼   ▼    ▼   ▼
  ├─ Phase 2 ◄───── Context解锁 + KG修复 + metadata修复
  ├─ Phase 3 ◄───── AiPanel拆解 + Skill修复
  ├─ P1 debt  ◄──── 按模块附着
  └─ P2 debt  ◄──── Same-file batching

Sprint 3 (收尾)
  ├─ Phase 4-6 ◄──── God Objects 已渐进瘦身
  └─ P3 + lint ratchet
```

---

## 四、A7 的 1631 项问题怎么处理

A7 的数字看起来吓人，但它的本质是模式统计，不是 1631 个独立 bug：

| 模式 | 命中数 | 治理策略 |
| --- | --- | --- |
| 超长函数 >60 行 | 571 | 不逐个修。Sprint 2 的 Extract-Then-Extend 自然消解最严重的。剩余的加 ESLint max-lines-per-function warning，设 ratchet（新增不允许超 60 行） |
| 深层相对路径 | 818 | Sprint 1 设好 alias 后，一次脚本替换 |
| 高认知复杂度 ≥25 | 127 | Top 20 在 God Object 拆分中自然消解。其余加 complexity lint warning + ratchet |
| 硬编码阈值 | 85 | Sprint 1 的配置中心解决核心路径上的。其余按触碰时修复 |
| 超长文件 >400 行 | 108 | God Object 拆分 + Extract-Then-Extend 渐进消解 |

关键工具：设置 CI ratchet——记录当前违规数，任何 PR 不允许增加违规数，只允许减少或持平。这样每次提交都在改善，无需专门 Sprint。

---

## 五、时间线对比

| 方案 | 总工期 | 风险 |
| --- | --- | --- |
| A: 先做完 CN-Code 全部，再做 roadmap | ~90-110d | 过长无功能交付，团队士气问题 |
| B: 忽略 CN-Code，继续做 roadmap | ~32.5d | 在腐烂的地基上建楼，返工成本不可预测 |
| C: 四阶段交织（本方案） | ~45-55d | 每个 Sprint 都有可见产出（修复+功能），风险被分段隔离 |

方案 C 比 A+B 串行少 40-50% 工时，核心原因是 Same-File Batching 和 Extract-Then-Extend 消除了双重触碰。

---

## 六、立即可执行的下一步

1. Sprint 0 的 8 个修复项可以现在开始，每个都是 S-M 量级的外科手术，不涉及架构变更

1. 并行启动 Sprint 1 的 God Object 接口设计——只出接口定义文档，不改代码，为后续提取建立蓝图

1. 为 A7 的模式级问题设置 ESLint ratchet CI job——让代码库自动止损

```
# AI Native 审计路线图：36 Changes × 6 Phases

> 基于 `docs/audit/` 七份审计报告，拆解为可执行的 OpenSpec Change 序列。
> 创建时间：2026-02-12 | 更新：2026-02-13（P1 完成，P2 就绪）
> 总实现量：~29d（不含 spec 编写 ~11d）

## 拆分原则

每个 change 必须满足：
1. **≤1d 实现**（含测试）
2. **只改一个模块的 spec**
3. **可独立验证**（有明确的 `pnpm vitest run` 命令）
4. **Scenario 精确到数据结构和边界条件**

## 架构原则

1. **本地文件系统 > 大上下文窗口** — CN 是 Electron 桌面应用，直接访问项目文件夹。不追求大窗口，而是精确注入 + 持久缓存 + 增量索引。
2. **Codex 引用检测 > 向量 RAG** — 写作上下文 80% 是结构化知识，字符串匹配 + KG 查询优先于向量 embedding。
3. **用户主动触发 > AI 自动弹出** — 续写按钮而非 Ghost Text（ACM CHI 论文论证）。
4. **流动角色 > 固定助手** — ghostwriter/muse/editor/actor/painter 按任务切换。
5. **叙事状态 > 通用偏好** — 记忆是角色状态、伏笔揭示、关系变化，不是通用偏好。

---

## Phase 总览

| Phase | 主题 | Changes | 实现量 | Spec | 累计 |
|-------|------|---------|--------|------|------|
| 1 | AI 可用 | 7 | 5.5d | 2d | 7.5d |
| 2 | Codex 上下文 | 6 | 4.5d | 2d | 14d |
| 3 | 写作技能 + 编辑器 | 8 | 6d | 2.5d | 22.5d |
| 4 | 叙事记忆 + 摘要 | 5 | 4d | 1.5d | 28d |
| 5 | 语义检索 | 4 | 4d | 1.5d | 33.5d |
| 6 | 体验完善 | 6 | 5d | 1.5d | 40d |
| **合计** | | **36** | **29d** | **11d** | **~40d** |

---

## Phase 1 — AI 可用（7 changes, 5.5d）✅ 已完成

目标：AI 功能从"不可用"→"基本可用"。用户可在 AI 面板多轮对话，AI 有写作身份。

| # | Change ID | Module | Scope | Est | 状态 |
|---|-----------|--------|-------|-----|------|
| 1 | `p1-identity-template` | ai-service | 身份提示词模板（5 个 XML 区块） | 0.5d | ✅ #468 |
| 2 | `p1-assemble-prompt` | ai-service | combineSystemText → assembleSystemPrompt 分层组装 | 1d | ✅ #477 |
| 3 | `p1-chat-skill` | skill-system | chat 技能 SKILL.md + 基础意图路由 | 0.5d | ✅ #469 |
| 4 | `p1-aistore-messages` | ai-service | aiStore 增加 messages 数组 + add/clear | 0.5d | ✅ #483 |
| 5 | `p1-multiturn-assembly` | ai-service | LLM 多轮消息组装 + token 裁剪 | 1d | ✅ #486 |
| 6 | `p1-apikey-storage` | workbench | API Key safeStorage + IPC 通道 | 1d | ✅ #470 |
| 7 | `p1-ai-settings-ui` | workbench | AI 设置面板 UI（Key/模型/测试/降级） | 1d | ✅ #476 |

**依赖**：C2→C1, C5→C4→C2, C3 独立, C7→C6, C6 独立

**详细 Scenario 见** `docs/plans/phase1-agent-instruction.md`

---

## Phase 2 — Codex 上下文（6 changes, 4.5d）

目标：KG 实体自动注入 AI 上下文——写作场景最关键的上下文来源。

| # | Change ID | Module | Scope | Est |
|---|-----------|--------|-------|-----|
| 8 | `p2-kg-context-level` | knowledge-graph | entity 增加 `aiContextLevel` 字段 + migration + 编辑 UI | 0.5d |
| 9 | `p2-kg-aliases` | knowledge-graph | entity 增加 `aliases: string[]` 字段 + migration + 编辑 UI | 0.5d |
| 10 | `p2-entity-matcher` | knowledge-graph | 实体名/别名匹配引擎（替换 mock recognizer），100 实体×1000 字 <10ms | 1d |
| 11 | `p2-fetcher-always` | context-engine | rules fetcher: 查询 `aiContextLevel="always"` 实体，格式化注入 | 0.5d |
| 12 | `p2-fetcher-detected` | context-engine | retrieved fetcher: 调用匹配引擎，注入 `when_detected` 实体 | 1d |
| 13 | `p2-memory-injection` | memory-system | Memory previewInjection → AI prompt + KG rules → Context | 1d |

**依赖**：C10→C8+C9, C12→C10+C11, C11→C8, C13→Phase1.C2

**详细 Scenario 见** `docs/plans/phase2-agent-instruction.md`

**关键 Scenario 示例**：

C10 `p2-entity-matcher`:
```
GIVEN KG 有实体 {name: "林默", aliases: ["小默"], aiContextLevel: "when_detected"}
AND KG 有实体 {name: "长安城", aliases: ["长安"]}
AND 输入文本 = "小默推开门，走进长安城"
WHEN 调用 matchEntities(text, entities)
THEN 返回 [{entityId: "林默的ID"}, {entityId: "长安城的ID"}]
AND 执行时间 < 10ms
```

C12 `p2-fetcher-detected`:
```
GIVEN 实体 "林默" aiContextLevel="when_detected"
AND 实体 "魔法系统" aiContextLevel="always"
AND 实体 "大纲笔记" aiContextLevel="never"
AND 光标前文本包含 "林默"
WHEN Context Engine 组装 retrieved 层
THEN 包含林默档案（因为 detected）
AND 不包含魔法系统（由 rules 层处理）
AND 不包含大纲笔记（never）
```

---

## Phase 3 — 写作技能 + 编辑器（8 changes, 6d）

目标：核心写作交互——续写按钮、Bubble AI、Slash Command、Inline Diff。

| # | Change ID | Module | Scope | Est |
|---|-----------|--------|-------|-----|
| 14 | `p3-writing-skills` | skill-system | 5 个写作技能 SKILL.md（write/expand/describe/shrink/dialogue） | 0.5d |
| 15 | `p3-conversation-skills` | skill-system | 3 个对话技能 SKILL.md（brainstorm/roleplay/critique） | 0.5d |
| 16 | `p3-write-button` | editor | 续写悬浮按钮组 UI + 技能调用 | 1d |
| 17 | `p3-bubble-ai` | editor | Bubble Menu AI 按钮（润色/改写/描写/对白） | 1d |
| 18 | `p3-slash-framework` | editor | TipTap Slash Command 扩展框架 + 命令面板 UI | 1d |
| 19 | `p3-slash-commands` | editor | 写作命令集注册（/续写 /描写 /对白 /角色 /大纲 /搜索） | 0.5d |
| 20 | `p3-inline-diff` | editor | Inline diff decoration + 接受/拒绝按钮 | 1d |
| 21 | `p3-shortcuts` | editor | 快捷键系统（Ctrl+Enter 续写、Ctrl+Shift+R 润色等） | 0.5d |

**依赖**：C16/C17→C14, C19→C18, C21→C16+C17, C15/C20 独立

---

## Phase 4 — 叙事记忆 + 摘要（5 changes, 4d）

目标：长篇小说支撑——角色状态跟踪、章节摘要、trace 持久化。

| # | Change ID | Module | Scope | Est |
|---|-----------|--------|-------|-----|
| 22 | `p4-kg-last-seen` | knowledge-graph | entity 增加 `last_seen_state` 字段 + migration + UI | 0.5d |
| 23 | `p4-state-extraction` | knowledge-graph | 章节完成时 LLM 提取角色状态变化，更新 KG | 1d |
| 24 | `p4-synopsis-skill` | skill-system | synopsis 技能 SKILL.md（生成 200-300 字章节摘要） | 0.5d |
| 25 | `p4-synopsis-injection` | context-engine | 摘要持久存储 + 续写时注入前几章摘要 | 1d |
| 26 | `p4-trace-persistence` | memory-system | generation_traces + trace_feedback SQLite 持久化 | 1d |

**依赖**：C23→C22, C25→C24, C26 独立

---

## Phase 5 — 语义检索（4 changes, 4d）

目标：Codex 之外的补充检索——非结构化文本语义搜索。

| # | Change ID | Module | Scope | Est |
|---|-----------|--------|-------|-----|
| 27 | `p5-onnx-runtime` | search-and-retrieval | ONNX Runtime 集成 + bge-small-zh 模型加载推理 | 1d |
| 28 | `p5-embedding-service` | search-and-retrieval | embedding 服务三级降级：ONNX → API → hash | 1d |
| 29 | `p5-hybrid-rag` | search-and-retrieval | Semantic + FTS hybrid ranking (RRF) | 1d |
| 30 | `p5-entity-completion` | editor | KG 实体名 ghost text 补全（纯本地匹配） | 1d |

**依赖**：C28→C27, C29→C28, C30→Phase2.C8

---

## Phase 6 — 体验完善（6 changes, 5d）

目标：产品打磨——i18n、搜索、导出、禅模式、模板。

| # | Change ID | Module | Scope | Est |
|---|-----------|--------|-------|-----|
| 31 | `p6-i18n-setup` | workbench | react-i18next 集成 + locale 文件结构 | 0.5d |
| 32 | `p6-i18n-extract` | workbench | 硬编码中文 → locale keys 抽取 | 1d |
| 33 | `p6-search-panel` | workbench | 搜索面板 UI（全文搜索 + 结果 + 跳转） | 1d |
| 34 | `p6-export` | document-management | Markdown/TXT/DOCX 导出 | 1d |
| 35 | `p6-zen-mode` | editor | 禅模式（全屏编辑器，隐藏侧边栏） | 0.5d |
| 36 | `p6-project-templates` | project-management | 项目模板系统（小说/短篇/剧本/自定义） | 1d |

**依赖**：C32→C31, 其余独立

---

## 依赖关系图

```
Phase 1 (AI 可用, 5.5d)
  C1 identity-template ─┐
  C2 assemble-prompt ───┤ (C2←C1)
  C3 chat-skill ────────┤ (独立)
  C4 aistore-messages ──┤ (C4←C2)
  C5 multiturn-assembly ┤ (C5←C4)
  C6 apikey-storage ────┤ (独立)
  C7 ai-settings-ui ────┘ (C7←C6)

Phase 2 (Codex, 4.5d) ← Phase 1
  C8  kg-context-level ──┐
  C9  kg-aliases ─────────┤ (独立)
  C10 entity-matcher ─────┤ (C10←C8+C9)
  C11 fetcher-always ─────┤ (C11←C8)
  C12 fetcher-detected ───┤ (C12←C10+C11)
  C13 memory-injection ───┘ (C13←P1.C2)

Phase 3 (技能+编辑器, 6d) ← Phase 1
  C14 writing-skills ─────┐
  C15 conversation-skills ┤ (独立)
  C16 write-button ────────┤ (C16←C14)
  C17 bubble-ai ───────────┤ (C17←C14)
  C18 slash-framework ─────┤ (独立)
  C19 slash-commands ──────┤ (C19←C18)
  C20 inline-diff ─────────┤ (独立)
  C21 shortcuts ───────────┘ (C21←C16+C17)

Phase 4 (叙事记忆, 4d) ← Phase 1+2
  C22 kg-last-seen ──┐
  C23 state-extract ──┤ (C23←C22)
  C24 synopsis-skill ─┤ (独立)
  C25 synopsis-inject ┤ (C25←C24)
  C26 trace-persist ──┘ (独立)

Phase 5 (语义检索, 4d) ← 独立
  C27 onnx-runtime ──┐
  C28 embedding-svc ──┤ (C28←C27)
  C29 hybrid-rag ─────┤ (C29←C28)
  C30 entity-complete ┘ (C30←P2.C8)

Phase 6 (体验, 5d) ← 独立
  C31 i18n-setup ──┐
  C32 i18n-extract ┤ (C32←C31)
  C33 search-panel ┤
  C34 export ──────┤
  C35 zen-mode ────┤
  C36 templates ───┘
```

**并行机会**：Phase 2 和 Phase 3 无互相依赖，可并行。Phase 5 和 Phase 6 也可并行。

---

## Spec 编写策略

- 所有 change 在现有 `openspec/specs/<module>/spec.md` 基础上增加内容，不新建 spec 文件
- 每个 change 创建 `openspec/changes/<change-id>/proposal.md`（delta spec）+ `tasks.md`（TDD 六段式）
- **每个 Phase 的 spec 在该 Phase 开始前编写**，不一次性写完所有 spec
- 当同一 Phase 内有 2+ 活跃 change 时，必须维护 `openspec/changes/EXECUTION_ORDER.md`
```
