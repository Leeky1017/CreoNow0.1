# CreoNow — 产品与技术全景介绍


> **面向对象**：即将加入项目的专业开发者
> **项目阶段**：MVP → V1（当前处于 MVP 就绪度 ~85%，正在推进至 ≥95%）

---

## 1. 产品定位

**CreoNow 是一个 AI 驱动的文字创作 IDE——创作者的 Cursor。**

Cursor 为程序员重新定义了代码编辑器，CreoNow 要为文字创作者做同样的事：以写作编辑器为中心，将 AI 技能（Skills）、上下文工程（Context Engineering）、创作记忆（Memory）、知识图谱（Knowledge Graph）、检索增强生成（RAG）、版本历史（Version History）等能力整合成一个本地优先、隐私可控的桌面写作工作台。

### 核心用户画像

- 小说作者、编剧、非虚构写作者
- 需要长期维护角色/世界观/术语一致性的创作者
- 希望 AI 辅助但不希望被 AI 主导的专业创作者

### 核心价值主张

| 维度           | 说明                                                                               |
| -------------- | ---------------------------------------------------------------------------------- |
| **AI 原生**    | AI 不是插件，是底层架构的一部分——技能系统、上下文工程、偏好学习一体化              |
| **本地优先**   | 数据全部在本地 SQLite，不依赖云服务，隐私可控                                      |
| **创作者专属** | 不是通用文本编辑器，而是为长文创作设计——角色管理、知识图谱、版本对比都是一等公民   |
| **可控 AI**    | 用户决定 AI 的参与程度——技能可启停、记忆可审查、上下文可可视化、输出可 diff 后确认 |

---

## 2. 技术架构总览

### 2.1 Monorepo 结构

```
CreoNow/
├── apps/desktop/              # Electron 桌面应用（唯一产品）
│   ├── main/src/              # Electron 主进程（后端）
│   │   ├── db/                #   SQLite 数据库初始化与迁移
│   │   ├── ipc/               #   IPC handler 注册
│   │   ├── services/          #   业务服务层（Context/KG/Memory/Skill/AI 等）
│   │   └── logging/           #   日志
│   ├── preload/src/           # Electron preload 脚本（IPC 桥接）
│   ├── renderer/src/          # Electron 渲染进程（前端）
│   │   ├── components/        #   组件库（primitives/patterns/layout/features）
│   │   ├── features/          #   功能模块
│   │   ├── stores/            #   Zustand 状态管理
│   │   ├── styles/            #   Design Tokens + 全局样式
│   │   └── surfaces/          #   Surface 注册
│   └── tests/                 # 测试
│       ├── e2e/               #   Playwright Electron E2E
│       ├── unit/              #   单元测试
│       ├── integration/       #   集成测试
│       ├── perf/              #   性能与门禁测试
│       └── ai-eval/           #   AI 输出质量测试（golden tests）
├── packages/shared/           # 跨进程共享
│   ├── types/                 #   IPC 契约类型（自动生成）
│   └── redaction/             #   脱敏工具
├── design/                    # 设计资产
│   ├── DESIGN_DECISIONS.md    #   前端设计决策（SSOT）
│   ├── Variant/designs/       #   HTML 设计稿
│   └── system/                #   设计系统（tokens/组件卡/状态清单/快捷键）
├── openspec/                  # 项目规范体系
│   ├── project.md             #   项目概述（模块索引）
│   ├── specs/                 #   12 个模块规范 + 1 个跨模块集成规范
│   └── changes/               #   进行中的变更（Delta Specs）
├── scripts/                   # 自动化脚本（contract-generate 等）
└── AGENTS.md                  # 仓库治理宪法
```

### 2.2 技术栈（已锁定，禁止替换）

| 层           | 技术                         | 版本        | 用途                      |
| ------------ | ---------------------------- | ----------- | ------------------------- |
| 前端框架     | React                        | 18.x        | UI 渲染                   |
| 类型系统     | TypeScript                   | 5.x         | 全栈类型安全              |
| 构建工具     | Vite + electron-vite         | 7.x / 5.x   | 开发与打包                |
| 样式         | Tailwind CSS + CSS Variables | 4.x         | Token 驱动的样式系统      |
| 组件原语     | Radix UI                     | latest      | 无样式可访问组件          |
| 富文本编辑器 | TipTap 2                     | 2.26+       | 基于 ProseMirror 的编辑器 |
| 状态管理     | Zustand                      | 5.x         | 轻量、类型安全的状态管理  |
| 桌面框架     | Electron                     | 40.x        | 跨平台桌面应用            |
| 数据库       | SQLite (better-sqlite3)      | 12.x        | 本地数据持久化            |
| 向量检索     | sqlite-vec                   | 0.1.7-alpha | 语义记忆召回（可降级）    |
| 测试         | Vitest + Playwright          | 4.x / 1.58+ | 组件测试 + E2E            |
| 组件文档     | Storybook                    | 8.6+        | 组件开发与验收            |
| 包管理       | pnpm workspace               | 8.x         | Monorepo 管理             |
| CI           | GitHub Actions               | -           | 自动化门禁                |

### 2.3 IPC 契约架构

前后端通过 Electron IPC 通信，采用**契约驱动开发**：

```
ipc-contract.ts (SSOT)  ──→  pnpm contract:generate  ──→  ipc-generated.ts (shared)
```

- **统一 Envelope**：所有 IPC 返回 `{ ok: true, data }` 或 `{ ok: false, error }`
- **稳定错误码**：`IpcErrorCode` 枚举（14 种：`INVALID_ARGUMENT` / `NOT_FOUND` / `TIMEOUT` / `CANCELED` / `UPSTREAM_ERROR` 等）
- **CI 门禁**：`pnpm contract:check` 确保生成代码与源头一致
- **当前通道数**：71 个 IPC 通道（覆盖 AI、项目、文档、版本、记忆、技能、知识图谱、搜索、导出等全部领域）

---

## 3. 核心功能模块详解

### 3.1 写作编辑器（Editor）

**核心**：基于 TipTap 2 / ProseMirror 的富文本编辑器。

- **文档模型 SSOT**：TipTap/ProseMirror JSON 是唯一事实源
- **派生字段**：保存时自动生成 `content_text`（纯文本）、`content_md`（Markdown），用于索引/diff/导出，但**不反写为 SSOT**
- **自动保存**：`useAutosave` hook 实现 debounce 自动保存
- **编辑器工具栏**：格式化（加粗/斜体/标题）、统计、AI 入口
- **三栏布局**：IconBar(48px) + Sidebar(240px) + Editor + RightPanel(320px) + StatusBar(28px)

**关键文件**：

- `renderer/src/features/editor/EditorPane.tsx` — 编辑器主体
- `renderer/src/features/editor/EditorToolbar.tsx` — 工具栏
- `renderer/src/stores/editorStore.tsx` — 编辑器状态

### 3.2 AI 系统

AI 是 CreoNow 的核心差异化能力，分为以下子系统：

#### 3.2.1 AI Runtime（运行时）

- **流式输出**：通过 IPC 事件推送 `AiStreamEvent`（delta/completed/failed/canceled）
- **取消/超时**：AbortController + configurable timeout
- **上游错误映射**：Anthropic/OpenAI 原始错误映射为稳定 `IpcErrorCode`
- **Fake AI Server**：CI/E2E 中使用 `fakeAiServer.ts`，无需真实 API key
- **Proxy 支持**：单链路原则——直连 provider 或走 proxy，不双栈重试

**关键文件**：

- `main/src/services/ai/aiService.ts` — AI 核心服务（995 行）
- `main/src/services/ai/fakeAiServer.ts` — 测试用假 AI 服务器
- `main/src/services/ai/aiProxySettingsService.ts` — Proxy 配置管理
- `main/src/ipc/ai.ts` — AI IPC 通道
- `renderer/src/features/ai/AiPanel.tsx` — AI 面板 UI（24K 行）
- `renderer/src/features/ai/useAiStream.ts` — 流式事件订阅
- `renderer/src/stores/aiStore.ts` — AI 状态管理

#### 3.2.2 技能系统（Skills）

Skills 是 AI 能力的封装单元，类似 Cursor 的 Agent/Rules：

- **Skill Package 格式**：`SKILL.md`（YAML frontmatter + markdown body）
- **作用域**：`builtin`（内置）/ `global`（全局）/ `project`（项目级）
- **严格校验**：`skillValidator.ts` 对 `context_rules` 做严格校验，未知字段拒绝
- **启停控制**：每个 skill 可独立 enable/disable
- **UI 入口**：AI Panel 的 SkillPicker + CommandPalette

**关键文件**：

- `main/src/services/skills/skillService.ts` — Skill CRUD 与解析
- `main/src/services/skills/skillLoader.ts` — 从文件系统加载 skill
- `main/src/services/skills/skillValidator.ts` — 严格校验器
- `renderer/src/features/ai/SkillPicker.tsx` — Skill 选择 UI

#### 3.2.3 上下文工程（Context Engineering）

决定"AI 看到什么"的核心系统：

- **分层上下文**：`rules` / `settings` / `retrieved` / `immediate` 四层
- **`.creonow/` 目录**：每个项目的上下文根目录（rules/settings/skills/characters/conversations/cache）
- **Stable Prefix**：system prompt 的前缀保持稳定以支持 provider prompt caching，通过 `stablePrefixHash` 可验证
- **Token Budget**：上下文裁剪与预算管理，附带裁剪证据
- **Redaction（脱敏）**：敏感信息在 context viewer 和日志中替换为 `***REDACTED***`
- **文件系统 Watch**：监听 `.creonow/` 目录变化，自动更新上下文

**关键文件**：

- `main/src/services/context/contextFs.ts` — 上下文文件系统操作
- `main/src/services/context/watchService.ts` — 文件变化监听
- `packages/shared/redaction/` — 脱敏工具
- `main/src/ipc/context.ts` — 7 个 context IPC 通道

#### 3.2.4 记忆系统（Memory）

让 AI "记住"用户偏好与创作事实：

- **Memory 类型**：`preference`（偏好）/ `fact`（事实）/ `note`（笔记）
- **作用域**：`global`（全局）/ `project`（项目级）/ `document`（文档级）
- **来源**：`manual`（手动创建）/ `learned`（偏好学习自动生成）
- **偏好学习**：用户对 AI 输出的 accept/reject/partial 反馈触发偏好学习闭环
- **语义召回**：基于 `sqlite-vec` 的向量检索，不可用时降级到确定性排序（不阻断技能）
- **注入预览**：`memory:injection:preview` 可预览哪些记忆会被注入 AI 上下文

**关键文件**：

- `main/src/services/memory/memoryService.ts` — Memory CRUD（29K 行）
- `main/src/services/memory/preferenceLearning.ts` — 偏好学习引擎
- `main/src/services/memory/userMemoryVec.ts` — 向量语义召回
- `renderer/src/features/memory/MemoryPanel.tsx` — 记忆面板 UI
- `renderer/src/stores/memoryStore.ts` — 记忆状态管理

#### 3.2.5 AI Diff 与 Apply

AI 输出不是直接覆盖文档，而是走 diff → 确认 → apply 流程：

- AI 输出与当前文档做 diff
- 用户在 DiffView 中审查变更
- 确认后 apply 并自动创建版本（`actor=ai`）

**关键文件**：

- `renderer/src/features/diff/DiffView.tsx` — Diff 展示
- `renderer/src/features/diff/DiffViewPanel.tsx` — Diff 面板
- `renderer/src/features/diff/SplitDiffView.tsx` — 分栏 diff 视图
- `renderer/src/features/ai/applySelection.ts` — Apply 逻辑

### 3.3 项目与文档管理

#### 项目（Project）

- 生命周期：create / list / setCurrent / delete / rename / duplicate / archive
- `currentProjectId` 持久化，重启后恢复
- 每个项目拥有独立的 `.creonow/` 配置目录与 `rootPath`

#### 文档（Document / FileTree）

- 单项目内的文档闭环：create / open / switch / rename / delete
- Sidebar Files 面板提供文件树视图
- 编辑与保存与 SSOT/版本机制一致

**关键文件**：

- `main/src/ipc/project.ts` — 项目 IPC（6K）
- `main/src/ipc/file.ts` — 文档 IPC（11.7K）
- `main/src/services/projects/projectService.ts` — 项目服务
- `main/src/services/documents/` — 文档服务
- `renderer/src/features/dashboard/DashboardPage.tsx` — 项目仪表盘（27K）
- `renderer/src/stores/projectStore.tsx` / `fileStore.ts` — 项目与文件状态

### 3.4 版本历史

- **快照**：每次保存（auto/user/ai）按策略写入版本
- **Diff**：任意两个版本间 diff 对比
- **Preview**：只读预览历史版本内容
- **Restore**：恢复到某版本（带确认对话框）
- **AI Apply 自动落版本**：`actor=ai` 标记

**关键文件**：

- `main/src/ipc/version.ts` — 版本 IPC
- `renderer/src/features/version-history/VersionHistoryPanel.tsx` — 版本历史面板（25K）
- `renderer/src/features/diff/` — 11 个 diff 相关文件
- `renderer/src/stores/versionStore.tsx` — 版本状态

### 3.5 知识图谱（Knowledge Graph）

创作世界观的结构化管理：

- **实体**：character（角色）/ location（地点）/ event（事件）/ item（物品）/ other
- **关系**：实体之间的关系 CRUD，附带证据（evidenceJson）
- **可视化**：图形化展示实体关系网络
- **上下文集成**：图谱内容可作为 AI 的 `retrieved` 上下文来源

**关键文件**：

- `main/src/ipc/knowledgeGraph.ts` — KG IPC（7K）
- `main/src/services/kg/` — KG 服务
- `renderer/src/features/kg/KnowledgeGraphPanel.tsx` — KG 面板（24K）
- `renderer/src/features/kg/kgToGraph.ts` — 数据到图形转换
- `renderer/src/stores/kgStore.ts` — KG 状态

### 3.6 角色管理（Character）

基于知识图谱的角色管理专项能力：

- 角色卡片、详情对话框、关系管理
- 角色分组与角色分类选择
- 从 KG 实体自动派生角色数据

**关键文件**：

- `renderer/src/features/character/` — 14 个文件
- `renderer/src/features/character/characterFromKg.ts` — KG → Character 转换

### 3.7 搜索与 RAG

- **FTS5 全文检索**：`search:fulltext`，语法错误映射为 `INVALID_ARGUMENT`
- **语义检索**：`search:semantic`，基于 embedding + 向量存储
- **RAG Retrieve**：token 预算、查询规划（planner）、rerank、retrieved layer 可视化
- **降级策略**：语义检索不可用时降级到全文检索，不阻断主链路

**关键文件**：

- `main/src/services/rag/ragService.ts` — RAG 服务（12K）
- `main/src/services/rag/queryPlanner.ts` — 查询规划
- `main/src/services/search/` — 搜索服务
- `main/src/services/embedding/` — Embedding 服务
- `renderer/src/features/search/SearchPanel.tsx` — 搜索面板（33K）

### 3.8 导出

- **已实现**：Markdown 导出（完整 IPC 链路）
- **接口预留**：PDF（pdfkit）、DOCX（docx 库）、TXT
- **入口**：CommandPalette + ExportDialog

**关键文件**：

- `main/src/services/export/` — 导出服务
- `main/src/ipc/export.ts` — 4 个导出 IPC 通道
- `renderer/src/features/export/ExportDialog.tsx` — 导出对话框（29K）

### 3.9 质量门禁（Constraints / Judge）

- **Constraints**：创作一致性约束（术语、风格规则）
- **Judge**：AI 质量评判模型（带下载/就绪状态机）
- **Quality Gates Panel**：展示 judge/constraints 的真实状态与失败/降级路径

**关键文件**：

- `main/src/ipc/constraints.ts` — Constraints IPC（7.6K）
- `main/src/ipc/judge.ts` — Judge IPC
- `main/src/services/judge/` — Judge 服务
- `renderer/src/features/quality-gates/QualityGatesPanel.tsx` — 质量门禁面板（31K）

### 3.10 统计分析（Analytics / Stats）

- 写作统计：字数、写作时长、文档创建数、技能使用次数
- 按天/按范围查询
- Analytics 页面可视化

**关键文件**：

- `main/src/services/stats/` — 统计服务
- `main/src/ipc/stats.ts` — 统计 IPC
- `renderer/src/features/analytics/AnalyticsPage.tsx` — 分析页面

---

## 4. 前端架构详解

### 4.1 组件体系

```
components/
├── primitives/     # 25 个原子组件（Accordion ~ Tooltip），每个均有 .tsx + .stories.tsx + .test.tsx
├── patterns/       # 通用模式（EmptyState、LoadingState 等）
├── layout/         # 布局组件（AppShell、IconBar、Sidebar、RightPanel、Resizer、StatusBar）
└── features/       # 功能组件
```

**原子组件清单**（全部基于 Radix UI 封装 + Tailwind 样式）：
Accordion, Avatar, Badge, Button, Card, Checkbox, ContextMenu, Dialog, DropdownMenu, Heading, ImageUpload, Input, ListItem, Popover, Radio, Select, Skeleton, Slider, Spinner, Tabs, Text, Textarea, Toast, Toggle, Tooltip

### 4.2 Feature 模块（22 个）

| 模块               | 职责                                  | 关键组件                                              |
| ------------------ | ------------------------------------- | ----------------------------------------------------- |
| `ai/`              | AI 面板、模型/模式/技能选择、流式通信 | AiPanel, ModelPicker, SkillPicker                     |
| `analytics/`       | 写作统计可视化                        | AnalyticsPage                                         |
| `character/`       | 角色管理                              | CharacterPanel, CharacterDetailDialog                 |
| `commandPalette/`  | 全局命令面板                          | CommandPalette                                        |
| `dashboard/`       | 项目仪表盘                            | DashboardPage, RenameProjectDialog                    |
| `diff/`            | 版本对比                              | DiffView, DiffViewPanel, SplitDiffView                |
| `editor/`          | 编辑器主体                            | EditorPane, EditorToolbar                             |
| `export/`          | 导出对话框                            | ExportDialog                                          |
| `files/`           | 文件树                                | —                                                     |
| `kg/`              | 知识图谱                              | KnowledgeGraphPanel                                   |
| `memory/`          | 记忆管理                              | MemoryPanel, MemoryCreateDialog, MemorySettingsDialog |
| `onboarding/`      | 引导页                                | OnboardingPage                                        |
| `outline/`         | 文档大纲                              | OutlinePanel                                          |
| `projects/`        | 创建项目/模板                         | CreateProjectDialog, CreateTemplateDialog             |
| `quality-gates/`   | 质量门禁面板                          | QualityGatesPanel                                     |
| `rightpanel/`      | 右侧面板容器                          | —                                                     |
| `search/`          | 搜索面板                              | SearchPanel                                           |
| `settings/`        | 设置面板                              | —                                                     |
| `settings-dialog/` | 设置对话框                            | SettingsDialog (General/Appearance/Export/Account)    |
| `version-history/` | 版本历史                              | VersionHistoryPanel, VersionPreviewDialog             |
| `welcome/`         | 欢迎屏幕                              | WelcomeScreen                                         |
| `zen-mode/`        | 禅模式                                | ZenMode                                               |

### 4.3 状态管理（12 个 Zustand Store）

| Store             | 职责                               |
| ----------------- | ---------------------------------- |
| `aiStore`         | AI 运行状态、流式事件处理、反馈    |
| `editorStore`     | 编辑器实例、当前文档内容、保存状态 |
| `fileStore`       | 文件列表、当前文档 ID、文件树操作  |
| `kgStore`         | 知识图谱实体/关系 CRUD             |
| `layoutStore`     | 面板宽度、折叠状态、布局偏好       |
| `memoryStore`     | 记忆 CRUD、注入预览、设置          |
| `onboardingStore` | 引导页状态                         |
| `projectStore`    | 项目列表、当前项目、项目操作       |
| `searchStore`     | 搜索状态与结果                     |
| `templateStore`   | 模板管理                           |
| `themeStore`      | 主题切换（深色/浅色）              |
| `versionStore`    | 版本列表、对比、恢复               |

### 4.4 页面流程

```
Onboarding → Dashboard → Editor (Workbench)
                              ├── IconBar → Sidebar (Files/Outline/Characters/KG/Settings)
                              ├── Main Content (Editor + Toolbar + StatusBar)
                              ├── RightPanel (AI Panel / Info Panel)
                              ├── CommandPalette (Cmd/Ctrl+P)
                              ├── ZenMode (F11)
                              └── Dialogs (Settings/Export/CreateProject/SystemDialog)
```

---

## 5. 后端架构详解

### 5.1 服务层（13 个子模块）

| 模块         | 职责                                              | 关键实现                      |
| ------------ | ------------------------------------------------- | ----------------------------- |
| `ai/`        | AI 请求、流式输出、取消、超时、Proxy、Fake Server | aiService.ts (995 行)         |
| `context/`   | `.creonow/` 目录管理、规则/设置读取、文件 Watch   | contextFs.ts, watchService.ts |
| `documents/` | 文档 CRUD、派生字段生成                           | —                             |
| `embedding/` | 文本向量化                                        | —                             |
| `export/`    | 导出（MD/PDF/DOCX/TXT）                           | —                             |
| `judge/`     | 质量评判模型管理                                  | —                             |
| `kg/`        | 知识图谱 CRUD                                     | —                             |
| `memory/`    | 记忆 CRUD、偏好学习、语义召回                     | memoryService.ts (29K)        |
| `projects/`  | 项目生命周期管理                                  | projectService.ts             |
| `rag/`       | RAG 检索、查询规划、LRU 缓存                      | ragService.ts (12K)           |
| `search/`    | 全文检索                                          | —                             |
| `skills/`    | Skill 加载、校验、CRUD                            | skillService.ts (13K)         |
| `stats/`     | 写作统计                                          | —                             |

### 5.2 IPC 通道（18 个领域，71 个通道）

| 模块           | 通道数 | 示例通道                                                                                           |
| -------------- | ------ | -------------------------------------------------------------------------------------------------- |
| ai             | 3      | `ai:skill:run`, `ai:skill:cancel`, `ai:skill:feedback`                                             |
| aiProxy        | 3      | `ai:proxy:settings:get/update`, `ai:proxy:test`                                                    |
| app            | 1      | `app:ping`                                                                                         |
| constraints    | 2      | `constraints:get`, `constraints:set`                                                               |
| context        | 8      | `context:creonow:ensure/status/rules:list/rules:read/settings:list/settings:read/watch:start/stop` |
| db             | 1      | `db:debug:tableNames`                                                                              |
| embedding      | 2      | `embedding:encode`, `embedding:index`                                                              |
| export         | 4      | `export:markdown/pdf/docx/txt`                                                                     |
| file           | 8      | `file:document:create/read/write/delete/list/rename/getCurrent/setCurrent`                         |
| judge          | 2      | `judge:model:ensure`, `judge:model:getState`                                                       |
| knowledgeGraph | 9      | `kg:entity:create/delete/list/update`, `kg:relation:create/delete/list/update`, `kg:graph:get`     |
| memory         | 7      | `memory:create/delete/update/list`, `memory:settings:get/update`, `memory:injection:preview`       |
| project        | 8      | `project:create/delete/list/rename/duplicate/archive/getCurrent/setCurrent`                        |
| rag            | 1      | `rag:retrieve`                                                                                     |
| search         | 2      | `search:fulltext`, `search:semantic`                                                               |
| skills         | 4      | `skill:list/read/write/toggle`                                                                     |
| stats          | 2      | `stats:getToday`, `stats:getRange`                                                                 |
| version        | 4      | `version:list/read/restore`, `version:aiApply:logConflict`                                         |

### 5.3 数据库（SQLite + 10 个迁移）

| 迁移                       | 内容                                                            |
| -------------------------- | --------------------------------------------------------------- |
| 0001_init                  | 基础表（projects/documents/settings/memories/ai_conversations） |
| 0002_documents_versioning  | 文档版本历史                                                    |
| 0003_judge                 | 质量评判                                                        |
| 0004_skills                | 技能启停状态                                                    |
| 0005_knowledge_graph       | 实体/关系表                                                     |
| 0006_search_fts            | FTS5 全文检索索引                                               |
| 0007_stats                 | 写作统计                                                        |
| 0008_user_memory_vec       | 向量语义召回（sqlite-vec，可选）                                |
| 0009_memory_document_scope | 记忆文档级作用域                                                |
| 0010_projects_archive      | 项目归档                                                        |

迁移采用单调递增版本号，每个迁移为独立 SQL 文件，通过 Vite `?raw` 导入。

sqlite-vec 扩展为**可选**：加载失败时记忆系统降级到确定性排序，不阻断应用启动。

---

## 6. 设计系统

### 6.1 设计决策文档

`design/DESIGN_DECISIONS.md`（1293 行）是前端实现的**唯一真相源**，覆盖：

- **布局**：三栏布局硬约束（IconBar=48px, StatusBar=28px, 最小窗口 1024×640）
- **尺寸**：4px 网格对齐，Sidebar/Panel 拖拽范围
- **Design Tokens**：背景层级、前景色、边框、强调色（纯白系极简主义）、功能色、阴影、间距、圆角、动效
- **字体**：三字体族（Inter=UI, Lora=正文, JetBrains Mono=等宽）
- **组件规范**：按钮（4 变体 × 3 尺寸 × 6 状态）、输入框、卡片、列表项
- **交互**：hover/focus/键盘导航/拖拽/滚动条
- **快捷键**：全局 8 个 + 编辑器 9 个
- **组件契约**：Sidebar/Panel/FileTree/CommandPalette/Dialog/Toast 的 TypeScript 接口定义
- **Preference Store**：存储抽象与 key 命名规范

### 6.2 设计资产

`design/Variant/designs/` 包含 36 个 HTML 设计稿（仅作布局/交互参考，颜色以 DESIGN_DECISIONS.md 为准）。

### 6.3 设计系统实现

`design/system/` 包含：

- `01-tokens.css` — Token CSS 变量定义（11K）
- `02-component-cards/` — 组件卡片
- `03-state-inventory.md` — 状态清单
- `05-design-mapping.md` — 设计映射
- `06-shortcuts.md` — 快捷键

---

## 7. 测试体系

测试写法、层级选择、迁移策略与命令映射的主源见 `docs/references/testing/README.md`。本节只保留项目概览，不再重复完整规则正文。

### 7.1 测试层级

| 层级      | 工具                     | 数量                                 | 覆盖范围                                                                                                                                          |
| --------- | ------------------------ | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 组件测试  | Vitest + Testing Library | primitives/features 均有 `.test.tsx` | UI 渲染、交互、状态                                                                                                                               |
| 单元测试  | tsx (直接运行)           | 11 个 spec                           | 契约生成、派生、diff、skill校验、上下文工程、偏好学习、错误映射、记忆服务、项目操作                                                               |
| 集成测试  | tsx (直接运行)           | 4 个 spec                            | Constraints roundtrip, FTS invalid query, user-memory-vec, RAG retrieve+rerank                                                                    |
| E2E 测试  | Playwright Electron      | 25 个 spec                           | 全链路：启动、编辑/保存、AI 成功/取消/超时/错误、命令面板、dashboard 项目操作、版本历史、知识图谱、搜索/RAG、导出、记忆偏好学习、技能、设置、主题 |
| Storybook | Storybook 8              | ~56 个 stories                       | 组件视觉/交互验收                                                                                                                                 |

### 7.2 CI 门禁（GitHub Actions）

- Branch protection required checks：`ci` / `merge-serial`
- `ci` 是汇总门禁（见 `.github/workflows/ci.yml`），内部包含 lint/typecheck、单测/集成测试、renderer vitest、测试发现一致性、coverage artifact、IPC 契约校验、Storybook 构建与 Windows E2E。

---

## 8. 项目治理与工程规范

### 8.1 AGENTS.md（仓库宪法）

核心约束以 `AGENTS.md` 与 `docs/delivery-skill.md` 为准（本节只做摘要）：

- Spec-First：无 spec 不写实现
- Test-First：无 Red 不写 Green
- Evidence：关键命令与结论必须落到 PR 评论 + CI 日志
- Gates：`ci`/`merge-serial` 全绿 + auto-merge
- Change Protocol：主 spec 不可直接改，按 Proposal → Apply → Archive
- Deterministic & Isolated：测试确定性，worktree 隔离，`pnpm install --frozen-lockfile`
- Escalate：不确定就记录并上报，不猜测

### 8.2 OpenSpec 体系

```
openspec/
├── project.md
├── specs/
│   ├── <module>/spec.md                  # 模块主规范（SSOT）
│   └── cross-module-integration-spec.md  # 跨模块集成规范
└── changes/                              # Delta Specs（进行中的变更）
    ├── <change>/                         # proposal.md / tasks.md / (spec deltas)
    └── archive/                          # 已完成变更归档（历史不可篡改）
```

主规范以 `spec.md` 为主；变更通过 `openspec/changes/<change>/` 走 Proposal → Apply → Archive；执行证据通过 PR 评论 + CI 日志记录。

### 8.3 交付流程

采用 **OpenSpec + GitHub** 双体系交付：

- GitHub Issue → Branch (`task/<N>-<slug>`) → PR (`Closes #N`) → Checks → Auto-merge
- 每个 commit message 包含 `(#N)`
- 交付证据通过 PR 评论 + CI 日志记录
- 必须使用 worktree 隔离开发

---

## 9. 当前状态与已知问题

### 9.1 MVP 就绪度

**已完成**（~85%）：

- 应用能启动，三栏布局骨架完整
- 编辑器可用（TipTap + 自动保存 + 版本历史）
- AI 面板功能链路打通（流式输出 + 取消 + 反馈）
- 文件树、搜索、大纲、记忆、知识图谱面板已实现
- IPC 契约完整（73 通道），CI 门禁就绪
- Storybook 资产丰富（~56 个 stories）

**待修复的 P0 阻塞**：

- Dashboard 项目操作（rename/duplicate/archive）需要接电
- Version History Preview 需要实现
- Restore 缺确认对话框
- React ErrorBoundary 防白屏

### 9.2 审计问题（历史）

- 审计材料：`CN-Code-Audit-2026-02-14/`
- 对应修复变更（已归档）：`openspec/changes/archive/aud-*`

> 注：本节仅提供索引，避免在本文件写死数量/分级导致静默漂移。具体结论以审计材料与变更归档为准。

---

## 10. 发展路线

### 10.1 当前阶段：MVP → V1

| 阶段         | 目标                                                                                                | 时间   |
| ------------ | --------------------------------------------------------------------------------------------------- | ------ |
| Phase 1 (P0) | MVP 闭环：Dashboard 接电、版本预览、ErrorBoundary、CI 组件门禁                                      | 2-3 天 |
| Phase 2 (P1) | 质量加固：AI History 真实数据、核心服务/Store 单测、API Key 安全存储（keytar）、XSS 防护、状态 SSOT | ~1 周  |
| Phase 3 (P2) | 性能与代码质量：React.memo、列表虚拟化、useShallow、console 收敛、字符串常量化                      | ~1 周  |

### 10.2 V1 目标能力

- **Windows-first 交付**：打包/运行/E2E 以 Windows 为最高优先级
- **完整写作工作台**：三栏布局完全可用，所有面板"接电"
- **AI 全链路可用**：Skills + Context Engineering + Memory + RAG
- **深色主题 P0**（浅色主题推迟到 V1 之后）
- **全面可测试**：Windows Playwright Electron E2E 门禁

### 10.3 V1 明确不做

- 云同步/登录/账号体系
- 浅色主题（仅 P1+ 规划）
- 自动更新（保留接口位）
- 多模态（音视频/图片生成）
- 在线联网搜索

---

## 11. 开发环境搭建

### 11.1 前置要求

- Node.js ≥ 18
- pnpm ≥ 8
- Git
- Windows 推荐（V1 主要交付平台），WSL 开发 + Windows 验收

### 11.2 快速开始

```bash
# 克隆仓库
git clone <repo-url>
cd CreoNow

# 安装依赖
pnpm install --frozen-lockfile

# 启动开发模式（Electron + Vite HMR）
pnpm desktop:dev

# 启动 Storybook（组件开发）
pnpm -C apps/desktop storybook

# 类型检查
pnpm typecheck

# Lint
pnpm lint

# 运行单元测试
pnpm test:unit

# 运行集成测试
pnpm test:integration

# 运行渲染进程组件测试
pnpm -C apps/desktop test:run

# 运行 E2E 测试（需要先 build）
pnpm -C apps/desktop test:e2e

# IPC 契约生成与检查
pnpm contract:generate
pnpm contract:check

# Windows 打包
pnpm desktop:build:win
```

### 11.3 必读文档（优先级排序）

1. `AGENTS.md` — 仓库宪法，所有开发行为的硬约束
2. `openspec/project.md` — 项目概述与模块索引
3. `openspec/specs/<module>/spec.md` — 模块行为规范（按任务选择）
4. `docs/delivery-skill.md` — OpenSpec + GitHub 交付规则主源
5. `docs/references/testing/README.md` — 测试规范主源
6. `design/DESIGN_DECISIONS.md` — 前端设计 SSOT（做 UI 时必读）
7. `packages/shared/types/ipc-generated.ts` — IPC 契约全貌（通道与 Envelope）

---

## 12. 关键架构决策摘要

| 决策          | 选择                             | 原因                                            |
| ------------- | -------------------------------- | ----------------------------------------------- |
| 文档 SSOT     | TipTap/ProseMirror JSON          | 编辑器原生格式，避免序列化/反序列化损耗         |
| IPC Envelope  | `{ ok: true/false }`             | 统一错误处理，可测试，可判定                    |
| AI 测试策略   | Fake-first（fakeAiServer）       | CI 中无网络/无 key 即可跑完整链路               |
| 样式方案      | CSS Variables + Tailwind 映射    | Token 驱动，主题切换仅切 data-theme             |
| 向量检索      | sqlite-vec（可选）               | 不可用时降级到确定性排序，不阻断主链路          |
| 数据存储      | 全本地 SQLite                    | 隐私优先，无云依赖                              |
| 状态管理      | 每 feature 独立 Zustand store    | 细粒度更新，避免全局 re-render                  |
| 组件原语      | Radix UI + 自定义样式            | 可访问性由 Radix 保证，视觉由 Design Token 控制 |
| Windows-first | CI 跑 windows-latest E2E + build | 主要用户群体在 Windows                          |
