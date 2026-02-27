# Project Management Specification

更新时间：2026-02-27 10:35

## Purpose

创作项目生命周期管理：创建、打开、设置、模板、仪表盘、新手引导。管理用户从启动到日常使用的项目级操作。

### Scope

| Layer    | Path                                                                                                                                                                             |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend  | `main/src/services/projects/`, `main/src/services/stats/`                                                                                                                        |
| IPC      | `main/src/ipc/project.ts`, `main/src/ipc/stats.ts`                                                                                                                               |
| Frontend | `renderer/src/features/projects/`, `renderer/src/features/dashboard/`, `renderer/src/features/onboarding/`, `renderer/src/features/welcome/`, `renderer/src/features/analytics/` |
| Store    | `renderer/src/stores/projectStore.tsx`, `renderer/src/stores/templateStore.ts`, `renderer/src/stores/onboardingStore.tsx`                                                        |

## Requirements

### Requirement: 项目创建

系统**必须**支持两种项目创建方式：手动创建和 AI 辅助创建。

**手动创建**：

- 用户通过「新建项目」按钮（`Cmd/Ctrl+Shift+N` 或 Dashboard 入口）打开创建对话框
- 创建对话框遵循 `DESIGN_DECISIONS.md` §11.5 的 `DialogProps` 契约
- 对话框使用 `--shadow-xl`，`z-index: var(--z-modal)`，背后有遮罩层（`--color-scrim`）
- 用户填写项目基础信息后确认创建

**AI 辅助创建**：

- 用户在创建对话框中切换到「AI 辅助」模式
- 用户用自然语言描述需求（如「一部都市悬疑小说，主角是退休刑警」）
- 系统调用 LLM 生成项目结构建议（项目名称、类型、章节大纲、角色列表）
- 用户审阅并修改生成结果后确认创建

项目创建通过以下 IPC 通道完成：

| IPC 通道                   | 通信模式         | 方向            | 用途                |
| -------------------------- | ---------------- | --------------- | ------------------- |
| `project:create`           | Request-Response | Renderer → Main | 创建项目            |
| `project:create:ai-assist` | Request-Response | Renderer → Main | AI 辅助生成项目结构 |

创建对话框组件**必须**有 Storybook Story，覆盖：手动创建态、AI 辅助态、AI 生成中态、生成结果预览态。

#### Scenario: 用户手动创建项目

- **假设** 用户在 Dashboard 页面
- **当** 用户点击「新建项目」，填写名称「暗流」、类型「小说」、简介「一部都市悬疑小说」
- **则** 系统通过 `project:create` 创建项目
- **并且** 自动创建一个默认空白章节
- **并且** 工作台切换到新项目的编辑器视图

#### Scenario: 用户通过 AI 辅助创建项目

- **假设** 用户在创建对话框中切换到「AI 辅助」模式
- **当** 用户输入「帮我创建一部校园推理小说，主角是高中女生侦探」
- **则** 系统通过 `project:create:ai-assist` 调用 LLM 生成项目结构
- **并且** 生成结果以可编辑表单展示：项目名称、类型、章节大纲（5 章）、角色列表（3 个角色）
- **当** 用户修改后确认
- **则** 系统创建项目及其章节和角色实体

#### Scenario: AI 辅助创建失败的降级处理

- **假设** 用户触发 AI 辅助创建
- **当** LLM 调用失败（网络或配额问题）
- **则** 系统展示错误提示「AI 辅助创建暂时不可用，请手动创建或稍后重试」
- **并且** 用户可切换回手动创建模式继续操作

---

### Requirement: 项目元数据

每个项目**必须**包含以下元数据，用户可在项目设置中查看和编辑：

**基础信息**：

- `name`（string）：项目名称
- `type`（enum）：项目类型——`novel`（小说）、`screenplay`（剧本）、`media`（自媒体）
- `description`（string）：项目简介

**创作目标**：

- `targetWordCount`（number | null）：目标字数
- `targetChapterCount`（number | null）：预计章节数

**创作阶段**（状态机）：

```
outline（大纲阶段）→ draft（初稿）→ revision（修改）→ final（定稿）
```

用户可手动切换阶段，系统不强制顺序推进。

**风格设定**：

- `narrativePerson`（enum）：叙述人称——`first`（第一人称）、`third-limited`（第三人称有限）、`third-omniscient`（第三人称全知）
- `languageStyle`（string）：语言风格描述（自由文本）
- `targetAudience`（string）：目标读者

**关联配置**：

- `defaultSkillSetId`（string | null）：默认使用的技能集
- `knowledgeGraphId`（string）：关联的知识图谱 ID

项目元数据的修改通过 IPC 通道 `project:update`（Request-Response）持久化。

#### Scenario: 用户编辑项目元数据

- **假设** 用户打开项目设置面板
- **当** 用户将叙述人称从「第一人称」改为「第三人称有限」，并设置目标字数为 200000
- **则** 系统通过 `project:update` 持久化变更
- **并且** 叙述人称信息注入 Context Engine 的 Rules 层，影响后续 AI 续写行为

#### Scenario: 用户切换创作阶段

- **假设** 项目当前阶段为「初稿」
- **当** 用户在项目设置中将阶段切换为「修改」
- **则** 系统记录阶段变更
- **并且** Dashboard 中该项目的阶段标签更新为「修改」

---

### Requirement: Dashboard（项目仪表盘）

系统**必须**提供项目仪表盘作为应用启动后的默认页面（无打开项目时）。

Dashboard 布局遵循 `DESIGN_DECISIONS.md` §1.2 的 Dashboard 页面类型（左侧导航 + 主内容）。

Dashboard 内容：

- **项目列表**：以卡片形式展示所有项目，每张卡片显示项目名称、类型图标、创作阶段标签、最近编辑时间、字数进度
- **排序**：默认按最近打开时间降序
- **搜索**：顶部搜索栏支持按项目名称搜索
- **操作入口**：「新建项目」按钮

卡片使用 `--color-bg-surface` 背景，`--color-border-default` 边框，`--radius-xl` 圆角。悬停时 `border-color: var(--color-border-hover)`。

点击卡片打开对应项目（通过 `project:switch` 切换到编辑器视图）。

Dashboard 数据通过以下 IPC 通道获取：

| IPC 通道        | 通信模式         | 方向            | 用途             |
| --------------- | ---------------- | --------------- | ---------------- |
| `project:list`  | Request-Response | Renderer → Main | 获取所有项目列表 |
| `project:stats` | Request-Response | Renderer → Main | 获取项目统计数据 |

Dashboard 组件**必须**有 Storybook Story，覆盖：有多个项目的默认态、搜索态、空态（新用户无项目）。

#### Scenario: 用户在 Dashboard 打开项目

- **假设** Dashboard 显示 3 个项目卡片
- **当** 用户点击「暗流」卡片
- **则** 系统通过 `project:switch` 切换到「暗流」项目
- **并且** 页面从 Dashboard 切换到编辑器三栏布局
- **并且** 编辑器加载该项目的当前文档

#### Scenario: Dashboard 空状态——新用户

- **假设** 用户首次使用应用，没有任何项目
- **当** 应用启动并渲染 Dashboard
- **则** 显示空状态：插图 + 文案「开始创建你的第一个创作项目」
- **并且** 提供醒目的「新建项目」按钮（Primary 样式）

#### Scenario: Dashboard 搜索过滤

- **假设** 用户有 8 个项目
- **当** 用户在搜索栏输入「暗」
- **则** 仅显示名称包含「暗」的项目卡片
- **并且** 无匹配时显示「未找到匹配结果」

---

### Requirement: 多项目切换

多项目切换**必须**通过 Workbench 左侧栏顶部的项目切换器实现（详见 Workbench spec「项目切换器」需求）。

切换项目时，系统**必须**完成以下上下文切换：

1. 编辑器加载目标项目的当前文档
2. 文件树刷新为目标项目的文档列表
3. 知识图谱切换为目标项目的实体数据
4. 记忆系统切换为目标项目的项目级记忆
5. 技能列表刷新（项目级技能变更）

切换过程中，系统**必须**保存当前项目的未保存内容（flush pending autosave）。

切换过程**应该**在 1 秒内完成。超过 1 秒时**必须**显示加载指示（顶部 2px 进度条）。

#### Scenario: 切换项目时保存当前内容

- **假设** 用户在项目「暗流」中编辑，有未保存的修改
- **当** 用户通过项目切换器选择「星际迷航」
- **则** 系统先 flush 当前文档的 pending autosave
- **并且** autosave 完成后执行项目切换
- **并且** 编辑器加载「星际迷航」的当前文档

#### Scenario: 切换项目超时显示加载指示

- **假设** 目标项目数据较大（大量文档和知识图谱数据）
- **当** 项目切换耗时超过 1 秒
- **则** 窗口顶部显示 2px 高进度条动画
- **并且** 加载完成后进度条消失

---

### Requirement: 项目切换必须触发 ProjectLifecycle 的解绑/绑定与资源清理

项目切换**必须**具备可验证的资源生命周期闭环，确保跨项目操作不会引入内存泄漏、文件句柄泄漏或残留后台任务。

- 切换流程必须遵循：`unbind ALL → 持久化切换 → bind ALL`。
- 解绑/绑定应有超时保护，单个服务失败不得导致系统静默卡死。
- ProjectLifecycle 仅负责“统一触发 unbind/bind 与顺序约束”；各模块的资源清理语义由对应模块 spec 定义并可回归验证：
  - IPC timeout -> abort：见 IPC spec（Scenario: BE-SLA-S2）
  - session 并发槽位回收：见 Skill System spec（Scenario: BE-SLA-S3）
  - project-scoped cache/watcher 清理：见 Context Engine spec（Scenario: BE-SLA-S4）

#### Scenario: BE-SLA-S1 项目切换先解绑再绑定且具备超时保护

- **假设** 当前项目为 A，目标项目为 B
- **当** 系统执行项目切换
- **则** 系统先对所有 project-scoped 服务执行 A 的 unbind，再执行持久化切换，再执行 B 的 bind
- **并且** 任一解绑/绑定步骤具备超时保护

---

### Requirement: projectLifecycle 项目切换必须串行化执行

`projectLifecycle.ts` 的 `switchProject()` 执行 unbind→persist→bind 序列。并发调用**必须**通过锁机制串行化，防止 unbind/bind 步骤交错执行导致项目状态污染。

#### Scenario: AUD-C1-S4 并发 switchProject 串行执行无交错

- **假设** 当前活跃项目为 P1
- **当** `switchProject(P2)` 和 `switchProject(P3)` 几乎同时被调用
- **则** 两次切换串行执行（先完成一次完整的 unbind→persist→bind，再执行下一次）
- **并且** 最终活跃项目为 P2 或 P3（取决于执行顺序），不会出现 P2 的 unbind 与 P3 的 bind 交错的中间态

#### Scenario: AUD-C1-S5 switchProject 期间重复切换到同一项目被幂等处理

- **假设** 当前活跃项目为 P1，一次 `switchProject(P2)` 正在执行中
- **当** 第二次 `switchProject(P2)` 被调用
- **则** 第二次调用等待第一次完成后检测到目标项目已是活跃项目
- **并且** 不执行多余的 unbind→persist→bind 序列

---

### Requirement: 项目删除

用户**必须**能够删除项目。删除操作**必须**有严格的确认流程。

删除确认流程：

1. 用户在 Dashboard 或项目设置中触发删除
2. 系统弹出确认对话框，显示项目名称和包含的文档数量
3. 用户**必须**手动输入项目名称进行二次确认
4. 确认后系统删除项目及其所有关联数据（文档、知识图谱实体、记忆数据、版本历史）

删除通过 IPC 通道 `project:delete`（Request-Response）完成。

#### Scenario: 用户删除项目

- **假设** 用户在 Dashboard 右击项目「测试项目」
- **当** 用户选择「删除项目」
- **则** 系统弹出确认对话框，显示「删除项目"测试项目"将永久删除所有文档（3 篇）、知识图谱数据和版本历史。请输入项目名称确认删除。」
- **当** 用户输入「测试项目」并点击「确认删除」
- **则** 系统通过 `project:delete` 删除项目及所有关联数据
- **并且** Dashboard 刷新，项目卡片消失
- **并且** Toast 通知「项目已删除」

#### Scenario: 删除确认时输入名称不匹配

- **假设** 确认对话框要求输入项目名称「测试项目」
- **当** 用户输入「测试」（不完整）
- **则** 「确认删除」按钮保持禁用状态（`disabled`）
- **并且** 用户无法执行删除

---

### Requirement: 项目生命周期闭环（创建→配置→归档→恢复→删除）

项目生命周期必须是可执行状态机，禁止仅定义创建与删除两端能力。

生命周期状态：

```
active -> archived -> deleted
          ^
          |
        restore
```

状态转换约束：

- `active -> archived`：允许，归档后项目只读，不可继续编辑
- `archived -> active`：允许，恢复后保留原有文档与统计
- `archived -> deleted`：允许，执行物理删除（含文档、知识图谱、记忆、版本）
- `active -> deleted`：禁止，必须先归档后删除

生命周期 IPC 通道：

| IPC 通道                | 通信模式         | 方向            | 用途                 |
| ----------------------- | ---------------- | --------------- | -------------------- |
| `project:archive`       | Request-Response | Renderer → Main | 归档项目             |
| `project:restore`       | Request-Response | Renderer → Main | 恢复归档项目         |
| `project:purge`         | Request-Response | Renderer → Main | 永久删除归档项目     |
| `project:lifecycle:get` | Request-Response | Renderer → Main | 查询项目生命周期状态 |

量化约束：

- `project:archive` p95 < 600ms
- `project:restore` p95 < 800ms
- `project:purge` p95 < 2s（项目规模 <= 1,000 文档）
- 生命周期状态写入失败时必须返回 `PROJECT_LIFECYCLE_WRITE_FAILED`

#### Scenario: 用户完成项目归档并恢复

- **假设** 项目「暗流」处于 `active` 状态，包含 120 篇文档
- **当** 用户在 Dashboard 触发「归档项目」
- **则** 系统通过 `project:archive` 将状态更新为 `archived`
- **并且** 项目从默认列表移入「已归档」分组
- **当** 用户在归档列表点击「恢复」
- **则** 系统通过 `project:restore` 将状态恢复为 `active`
- **并且** 文档、统计与最近打开时间保持一致

#### Scenario: 活跃项目尝试直接删除被阻断

- **假设** 项目「测试项目」处于 `active` 状态
- **当** 用户直接触发永久删除
- **则** 系统拒绝操作并返回 `{ code: "PROJECT_DELETE_REQUIRES_ARCHIVE", message: "请先归档项目再删除" }`
- **并且** UI 展示阻断提示，不执行任何数据删除

---

### Requirement: 模块级可验收标准（适用于本模块全部 Requirement）

本模块全部 Requirement 必须满足以下可验收标准：

- 量化阈值：
  - `project:create` p95 < 500ms
  - `project:update` p95 < 200ms
  - `project:switch` p95 < 1s，p99 < 2s
  - Dashboard 首屏项目列表首帧渲染 < 1.2s
- 边界与类型安全：
  - 编译时必须启用 `TypeScript strict`
  - 运行时必须使用 zod 校验 `project:*` IPC 请求/响应
- 失败处理策略：
  - 可恢复错误（超时/限流）采用最多 3 次重试（1s/2s/4s）
  - 不可恢复错误向用户提示并返回结构化错误码
  - 所有失败写入主进程日志，禁止 silent failure
- Owner 决策边界：
  - 项目状态机、状态名、关键通道名由 Owner 固定
  - Agent 仅可在既有状态机内扩展字段，不可新增未审批状态

#### Scenario: 项目切换在阈值内完成

- **假设** 用户在两个中等规模项目间切换
- **当** 连续触发 30 次 `project:switch`
- **则** p95 耗时小于 1s
- **并且** 无一次请求返回未定义错误码

#### Scenario: 切换超时触发可见降级

- **假设** 某次项目切换超过 2s（p99 阈值）
- **当** 主进程返回 `PROJECT_SWITCH_TIMEOUT`
- **则** 顶部进度条保持可见并显示重试入口
- **并且** 失败被写入日志并关联 traceId

---

### Requirement: 异常与边界覆盖矩阵

本模块每条 happy path 场景必须至少映射一个失败/降级场景，覆盖以下类别：

| 类别         | 最低覆盖要求                                        |
| ------------ | --------------------------------------------------- |
| 网络/IO 失败 | 项目模板下载失败、数据库写入失败至少各 1 条         |
| 数据异常     | 元数据字段越界/非法枚举值至少 1 条                  |
| 并发冲突     | 两个窗口同时切换同一项目、同时删除同一项目至少 1 条 |
| 容量溢出     | 项目数超过上限（2,000）至少 1 条                    |
| 权限/安全    | 文件系统权限不足、路径越权写入至少 1 条             |

#### Scenario: 并发删除冲突的幂等处理

- **假设** 两个渲染窗口同时对同一归档项目执行 `project:purge`
- **当** 第一请求成功后第二请求到达
- **则** 第二请求返回 `{ code: "NOT_FOUND", message: "项目已删除" }`
- **并且** 不产生脏数据与重复日志

#### Scenario: 权限不足时阻断删除

- **假设** 项目目录位于只读磁盘
- **当** 用户执行 `project:purge`
- **则** 返回 `{ code: "PROJECT_PURGE_PERMISSION_DENIED", message: "删除失败，路径无写权限" }`
- **并且** 项目状态保持 `archived`，不进入半删除状态

---

### Non-Functional Requirements

**Performance**

- Dashboard 列表查询：p50 < 120ms，p95 < 300ms，p99 < 600ms
- `project:switch`：p50 < 400ms，p95 < 1s，p99 < 2s
- `project:create`：p50 < 200ms，p95 < 500ms，p99 < 900ms

**Capacity**

- 单用户项目上限：2,000
- 单项目文档上限：10,000（超过时禁止继续导入并提示）
- Dashboard 单次返回项目卡片上限：200（分页加载）

**Security & Privacy**

- 项目路径写入必须做路径规范化与目录越权校验
- 项目元数据日志不得记录用户私密正文内容
- 所有跨进程生命周期请求必须包含 `projectId` 与 `operatorId` 以支持审计

**Concurrency**

- 同一 `projectId` 生命周期操作采用互斥锁（mutex）串行执行
- 跨项目切换请求采用最新优先策略（last-write-wins）
- 并发创建同名项目时返回 `PROJECT_NAME_CONFLICT`

#### Scenario: 大规模项目列表分页加载

- **假设** 用户账户下有 1,500 个项目
- **当** Dashboard 首次打开
- **则** 首屏仅加载前 50 条并在 p95 300ms 内返回
- **并且** 后续分页按滚动惰性加载

#### Scenario: 容量超限触发硬阻断

- **假设** 当前用户已创建 2,000 个项目
- **当** 用户再次创建项目
- **则** 返回 `{ code: "PROJECT_CAPACITY_EXCEEDED", message: "项目数量已达上限" }`
- **并且** UI 引导用户先归档或删除旧项目
