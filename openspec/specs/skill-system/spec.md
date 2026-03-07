# Skill System Specification


## Purpose

将 AI 能力抽象为可组合的「技能」（续写、改写、扩写、缩写、风格迁移等），每个技能有独立的 `context_rules` 和执行逻辑，支持 builtin → global → project 三级作用域。

### Scope

| Layer    | Path                                |
| -------- | ----------------------------------- |
| Backend  | `main/src/services/skills/`         |
| Skills   | `main/skills/packages/`             |
| IPC      | `main/src/ipc/skills.ts`            |
| Frontend | `renderer/src/features/ai/`         |
| Store    | `renderer/src/stores/skillStore.ts` |

## Requirements

### Requirement: 内置技能清单与 I/O 定义

系统**必须**预装以下文字创作类内置技能，每个技能有明确的输入、输出和上下文规则定义。内置技能的 `scope` 为 `builtin`，用户不可删除但可以停用。

| 技能 ID          | 名称     | 输入                    | 输出           | 上下文规则                         |
| ---------------- | -------- | ----------------------- | -------------- | ---------------------------------- |
| `polish`         | 润色     | 选中文本                | 润色后文本     | 保持原意、优化表达、不改变叙事视角 |
| `rewrite`        | 改写     | 选中文本 + 改写指令     | 改写后文本     | 遵循改写指令、保持上下文连贯       |
| `continue`       | 续写     | 当前文档上下文          | 续写段落       | 匹配前文风格、遵守知识图谱约束     |
| `expand`         | 扩写     | 选中文本                | 扩展后文本     | 丰富细节、保持原有结构和节奏       |
| `condense`       | 缩写     | 选中文本                | 精简后文本     | 保留核心信息、去除冗余描述         |
| `style-transfer` | 风格迁移 | 选中文本 + 目标风格描述 | 风格迁移后文本 | 保持原有叙事内容、仅改变语言风格   |
| `translate`      | 翻译     | 选中文本 + 目标语言     | 翻译后文本     | 保持文学表达、非逐字直译           |
| `summarize`      | 摘要     | 选中文本或整章内容      | 摘要文本       | 提取核心事件和关键信息             |

每个技能的执行**必须**通过 `SkillExecutor` 统一调度，执行前**必须**校验输入是否满足技能要求（如续写需要文档上下文非空）。

技能执行结果**必须**以 `SkillResult` 结构返回，包含 `output`（输出文本）、`metadata`（token 用量、模型标识）和 `traceId`（用于记忆系统溯源）。

#### Scenario: 用户触发润色技能

- **假设** 用户在编辑器中选中了一段文本，AI 面板已打开
- **当** 用户在 AI 面板中点击「润色」技能按钮
- **则** 系统通过 IPC 通道 `skill:execute`（Request-Response 模式）将选中文本和技能 ID 发送到主进程
- **并且** `SkillExecutor` 校验输入非空后，组装上下文（Immediate 层 + Rules 层）并调用 LLM
- **并且** 润色结果以流式响应返回渲染进程，在 AI 面板中实时展示
- **并且** 用户可通过 Editor 的 Inline Diff 功能预览并接受/拒绝修改

#### Scenario: 续写技能使用文档上下文

- **假设** 用户正在编辑第十章，光标位于段落末尾
- **当** 用户触发「续写」技能
- **则** 系统自动捕获当前文档上下文（光标前的内容）作为输入
- **并且** Context Engine 按优先级注入 Immediate 层（当前章节）、Rules 层（创作规则）、Settings 层（风格偏好）、Retrieved 层（前文关键设定）
- **并且** 续写结果追加到光标位置，用户可在 Inline Diff 中审阅

#### Scenario: 技能执行输入校验失败

- **假设** 用户未选中任何文本
- **当** 用户点击「润色」技能按钮
- **则** 系统返回结构化错误 `{ code: "SKILL_INPUT_EMPTY", message: "请先选中需要润色的文本" }`
- **并且** AI 面板展示错误提示，不发起 LLM 调用

---

### Requirement: 技能触发方式

用户**必须**通过 AI 面板中的技能按钮触发技能执行。技能按钮区域位于 AI 面板的对话输入区上方，以图标 + 名称的形式水平排列。

技能触发流程：

1. 用户点击技能按钮区域，展开技能选择面板
2. 技能选择面板按分类展示当前可用技能（内置 / 全局自定义 / 项目级自定义）
3. 用户选择目标技能后，系统根据技能类型自动判断输入来源（选中文本或文档上下文）
4. 技能执行结果通过 AI 面板展示，涉及文本修改的结果同时在 Editor 中以 Inline Diff 呈现

技能**必须**由用户主动调用，系统不可自动执行技能。技能默认作用于当前编辑器打开的文档。

技能选择面板**必须**有 Storybook Story，覆盖默认态、空状态（无自定义技能）、禁用态（技能被停用时灰显）。

#### Scenario: 用户通过技能面板选择并执行技能

- **假设** AI 面板已打开，用户在编辑器中选中了一段文本
- **当** 用户点击技能按钮区域
- **则** 技能选择面板展开，显示分类后的可用技能列表
- **并且** 已停用的技能以灰显（`opacity: 0.5`，`cursor: not-allowed`）状态展示，不可点击
- **当** 用户点击「改写」技能
- **则** 技能选择面板收起，系统开始执行改写流程
- **并且** AI 面板显示执行进度

#### Scenario: 技能面板无自定义技能时的空状态

- **假设** 用户未创建任何自定义技能
- **当** 技能选择面板展开
- **则** 内置技能正常显示
- **并且** 自定义技能区域显示空状态提示「暂无自定义技能，点击创建或用自然语言描述需求」
- **并且** 空状态区域提供「创建技能」按钮入口

---

### Requirement: 自定义技能管理

用户**必须**能够新增、编辑、删除自定义技能。自定义技能与内置技能享有相同的调用方式和执行流程。

自定义技能的创建方式：

1. **手动创建**：用户填写技能名称、描述、Prompt 模板、输入类型（选中文本 / 文档上下文）和上下文规则
2. **AI 辅助创建**：用户用自然语言描述需求（如「帮我创建一个技能，把文言文转成白话文」），系统自动生成技能配置，用户确认后保存

自定义技能**必须**通过 IPC 通道持久化到主进程的 SQLite 数据库：

| IPC 通道              | 通信模式         | 方向            | 用途           |
| --------------------- | ---------------- | --------------- | -------------- |
| `skill:custom:create` | Request-Response | Renderer → Main | 创建自定义技能 |
| `skill:custom:update` | Request-Response | Renderer → Main | 更新自定义技能 |
| `skill:custom:delete` | Request-Response | Renderer → Main | 删除自定义技能 |
| `skill:custom:list`   | Request-Response | Renderer → Main | 列出自定义技能 |

自定义技能的数据结构**必须**包含 `id`、`name`、`description`、`promptTemplate`、`inputType`、`contextRules`、`scope`、`enabled`、`createdAt`、`updatedAt` 字段。

所有 IPC 数据**必须**通过 Zod schema 进行运行时校验，校验失败返回统一错误格式。

#### Scenario: 用户手动创建自定义技能

- **假设** 用户打开技能管理界面
- **当** 用户点击「创建技能」，填写名称「文言文转白话」、描述、Prompt 模板，选择输入类型为「选中文本」，作用域为「项目级」
- **则** 系统通过 `skill:custom:create` 将技能配置发送到主进程
- **并且** 主进程 Zod 校验通过后写入 SQLite，返回创建成功
- **并且** 新技能立即出现在技能选择面板中

#### Scenario: 用户通过自然语言描述创建技能

- **假设** 用户在技能管理界面点击「AI 辅助创建」
- **当** 用户输入「创建一个技能，可以把我选中的内容改写成鲁迅风格」
- **则** 系统调用 LLM 生成技能配置（名称、Prompt 模板、上下文规则）
- **并且** 生成结果以可编辑表单形式展示，用户可修改后确认保存
- **并且** 确认后通过 `skill:custom:create` 持久化

#### Scenario: 删除自定义技能的确认流程

- **假设** 用户在技能管理界面查看自定义技能列表
- **当** 用户点击某个自定义技能的删除按钮
- **则** 系统弹出确认对话框（`Dialog` 组件），提示「确定删除技能"文言文转白话"？此操作不可撤销」
- **当** 用户确认删除
- **则** 系统通过 `skill:custom:delete` 通知主进程删除
- **并且** 技能从列表和技能选择面板中移除

#### Scenario: 创建技能时 Zod 校验失败

- **假设** 用户创建技能时 Prompt 模板字段为空
- **当** 数据发送到主进程
- **则** Zod 校验失败，主进程返回 `{ success: false, error: { code: "VALIDATION_ERROR", message: "promptTemplate 不能为空" } }`
- **并且** 渲染进程在表单对应字段下方显示内联错误提示（`--color-error`）

---

### Requirement: 技能作用域管理

技能有三级作用域：`builtin`（内置）、`global`（全局）、`project`（项目级）。系统**必须**按作用域规则管理技能的可见性和生命周期。

作用域规则：

| 作用域    | 可见范围 | 创建者 | 可删除 | 可停用 | 可修改作用域   |
| --------- | -------- | ------ | ------ | ------ | -------------- |
| `builtin` | 所有项目 | 系统   | 否     | 是     | 否             |
| `global`  | 所有项目 | 用户   | 是     | 是     | 可降为 project |
| `project` | 当前项目 | 用户   | 是     | 是     | 可升为 global  |

技能可见性解析顺序：`project` → `global` → `builtin`。若同名技能存在于多个作用域，**项目级优先**，其次全局，最后内置。

用户**必须**能对每个技能进行独立启停控制。停用的技能在技能选择面板中灰显，不可触发执行。

技能启停状态变更通过 IPC 通道 `skill:toggle`（Request-Response 模式）持久化。

#### Scenario: 用户停用内置技能

- **假设** 用户在技能管理界面查看内置技能列表
- **当** 用户关闭「翻译」技能的开关
- **则** 系统通过 `skill:toggle` 发送 `{ skillId: "translate", enabled: false }` 到主进程
- **并且** 主进程持久化状态后返回成功
- **并且** 「翻译」技能在技能选择面板中灰显

#### Scenario: 项目级技能覆盖全局技能

- **假设** 用户有一个全局技能「正式风格改写」和一个同名项目级技能「正式风格改写」（prompt 不同）
- **当** 用户在当前项目中触发「正式风格改写」
- **则** 系统执行项目级版本的技能，忽略全局版本
- **并且** 技能选择面板中该技能标注为「项目级覆盖」

#### Scenario: 用户将项目级技能提升为全局

- **假设** 用户在技能管理界面查看一个项目级自定义技能
- **当** 用户点击「提升为全局」
- **则** 系统通过 `skill:custom:update` 将该技能的 `scope` 从 `project` 改为 `global`
- **并且** 该技能在所有项目中可见

---

### Requirement: 技能执行与流式响应

技能执行**必须**支持流式响应，让用户在 LLM 生成过程中实时看到输出内容。

技能执行的 IPC 通信采用混合模式：

1. **触发**：`skill:execute`（Request-Response），渲染进程发送执行请求，主进程返回 `executionId`
2. **流式推送**：`skill:stream:chunk`（Push Notification），主进程通过 `webContents.send` 逐步推送生成内容
3. **完成通知**：`skill:stream:done`（Push Notification），主进程推送执行完成信号，包含完整的 `SkillResult`

执行过程中用户**必须**能取消正在进行的技能执行，通过 `skill:cancel`（Fire-and-Forget）发送取消信号。

当 LLM 调用失败或超时时，系统**必须**返回结构化错误并在 AI 面板中展示错误信息，不可静默失败。

#### Scenario: 技能流式执行正常完成

- **假设** 用户触发了「续写」技能
- **当** 主进程开始调用 LLM
- **则** 渲染进程收到 `executionId` 确认执行已开始
- **并且** 随后通过 `skill:stream:chunk` 逐步接收生成内容，AI 面板实时显示
- **并且** 最终收到 `skill:stream:done`，包含完整结果和 metadata
- **并且** 用户可将结果应用到编辑器（触发 Inline Diff）

#### Scenario: 用户取消正在执行的技能

- **假设** 技能正在流式执行中，AI 面板显示生成进度
- **当** 用户点击 AI 面板中的「停止生成」按钮
- **则** 渲染进程通过 `skill:cancel` 发送取消信号
- **并且** 主进程中断 LLM 调用，释放资源
- **并且** AI 面板显示「生成已取消」，已接收的部分内容保留可见

#### Scenario: 技能执行失败的错误处理

- **假设** 用户触发了「改写」技能
- **当** LLM API 返回错误（如速率限制、网络超时）
- **则** 主进程通过 `skill:stream:done` 推送错误状态 `{ success: false, error: { code: "LLM_API_ERROR", message: "API 调用失败，请稍后重试" } }`
- **并且** AI 面板展示错误提示（Toast 通知，类型 `error`）
- **并且** 用户可点击「重试」按钮重新执行

---

### Requirement: 多技能并发调度、超时与依赖管理

技能系统必须提供可预测的调度器，处理并发执行、执行超时、技能依赖缺失。

调度策略：

- 同会话仅允许 1 个运行中技能（FIFO）
- 全局并发上限 8
- 每个技能定义 `timeoutMs`（默认 30,000，最大 120,000）
- 依赖声明：`dependsOn: string[]`，缺失依赖时阻断执行

错误码：

- `SKILL_TIMEOUT`
- `SKILL_DEPENDENCY_MISSING`
- `SKILL_QUEUE_OVERFLOW`

队列策略：

- 每会话队列上限 20
- 超限直接拒绝并提示用户稍后重试

#### Scenario: 多技能并发请求按队列执行

- **假设** 用户在同一会话连续触发 `rewrite`、`expand`、`polish`
- **当** 调度器接收请求
- **则** `rewrite` 立即执行，其余按 FIFO 排队
- **并且** 队列状态实时推送到 AI 面板

#### Scenario: 技能依赖缺失阻断执行

- **假设** 自定义技能 `chapter-outline-refine` 依赖 `summarize`
- **当** `summarize` 被停用或不存在
- **则** 执行返回 `{ code: "SKILL_DEPENDENCY_MISSING", details: ["summarize"] }`
- **并且** 不发起 LLM 调用

---

### Requirement: 会话级并发槽位必须在 timeout/abort/异常路径可回收

技能系统的会话级资源（并发槽位、队列占用等）**必须**在异常路径可回收，避免出现“槽位永久占用导致全局阻塞”。

- 当任务因 timeout/abort/异常未能正常 settle（completion 丢失）时，系统仍必须回收并发槽位。
- 该回收行为必须可被自动化测试验证。
- 若存在更强约束，应满足并覆盖本 Requirement，禁止实现两套相互冲突的回收逻辑。

#### Scenario: BE-SLA-S3 会话并发槽位在 timeout/abort 下可回收

- **假设** 某个会话级调度器为任务占用了并发槽位
- **当** 任务因 timeout/abort/异常导致 completion 丢失或未正常 settle
- **则** 系统仍能回收该并发槽位并允许后续任务继续排队执行
- **并且** 不会出现“槽位永久占用导致全局阻塞”

---

### Requirement: 模块级可验收标准（适用于本模块全部 Requirement）

- 量化阈值：
  - 技能触发到 executionId 返回 p95 < 120ms
  - 队列入队响应 p95 < 80ms
  - 取消指令生效 p95 < 300ms
- 边界与类型安全：
  - `TypeScript strict` + zod
  - 所有 `skill:*` 通道必须声明 request/response schema
- 失败处理策略：
  - 执行超时直接中断并返回 `SKILL_TIMEOUT`
  - 可恢复失败允许用户一键重试（复用原参数）
  - 失败事件必须广播到 AI 面板和日志
- Owner 决策边界：
  - 内置技能 ID 集合、作用域优先级、默认超时由 Owner 固定
  - Agent 不可私改内置技能语义

#### Scenario: 超时中断可验证

- **假设** 某技能运行超过 30,000ms
- **当** 到达 timeout
- **则** 调度器中断执行并返回 `SKILL_TIMEOUT`
- **并且** 资源（连接/流）被释放

#### Scenario: 队列溢出被拒绝

- **假设** 会话队列已满 20 条
- **当** 用户继续触发技能
- **则** 返回 `{ code: "SKILL_QUEUE_OVERFLOW" }`
- **并且** 不影响已有排队任务

---

### Requirement: 异常与边界覆盖矩阵

| 类别         | 最低覆盖要求                                |
| ------------ | ------------------------------------------- |
| 网络/IO 失败 | LLM 调用失败、流式通道断开                  |
| 数据异常     | 自定义技能 schema 非法、prompt 模板缺失变量 |
| 并发冲突     | 并发取消与完成竞态、同名技能覆盖竞态        |
| 容量溢出     | 队列溢出、单输出超长                        |
| 权限/安全    | 跨项目技能读取、未授权技能执行              |

#### Scenario: 同名技能覆盖竞态

- **假设** 全局与项目级同时更新同名技能
- **当** 用户触发执行
- **则** 系统按 `project > global > builtin` 一致性解析
- **并且** 返回所选技能来源 `resolvedScope=project`

#### Scenario: 跨项目技能越权访问阻断

- **假设** 项目 A 的技能 ID 被项目 B 请求执行
- **当** 主进程校验 `projectId`
- **则** 返回 `SKILL_SCOPE_VIOLATION`
- **并且** 写入安全审计日志

---

### Non-Functional Requirements

**Performance**

- `skill:execute` 响应：p50 < 60ms，p95 < 120ms，p99 < 250ms
- `skill:cancel` 生效：p50 < 150ms，p95 < 300ms，p99 < 800ms
- 技能列表加载：p95 < 200ms

**Capacity**

- 每会话队列上限：20
- 全局并发上限：8
- 自定义技能总数上限：全局 1,000 / 每项目 500

**Security & Privacy**

- 技能 prompt 模板中的密钥变量必须脱敏存储
- 日志只记录 `skillId/executionId`，不记录完整 prompt
- 技能作用域必须强制 project 隔离

**Concurrency**

- 同会话串行，跨会话并行
- 队列采用 FIFO，不允许插队（系统重试任务除外）
- 取消请求优先级高于普通执行请求

#### Scenario: 全局并发上限保护

- **假设** 同时有 20 个会话请求执行技能
- **当** 系统达到并发上限 8
- **则** 其余请求进入待执行队列
- **并且** 无请求被静默丢弃

#### Scenario: 自定义技能容量超限

- **假设** 当前项目已有 500 个自定义技能
- **当** 用户尝试再创建 1 个
- **则** 返回 `{ code: "SKILL_CAPACITY_EXCEEDED" }`
- **并且** 提示清理不再使用的技能

---

### Requirement: chat 默认对话技能

技能系统**必须**包含 `builtin:chat` 技能，作为默认对话技能。当意图路由无法匹配到具体技能时，统一路由到 `builtin:chat`。

REQ-ID: `REQ-SKL-CHAT`

---

### Requirement: 意图路由函数

技能系统**必须**提供 `inferSkillFromInput` 函数，根据用户输入文本和上下文推断目标技能 ID。

函数签名：

```typescript
function inferSkillFromInput(args: {
  input: string;
  hasSelection: boolean;
  explicitSkillId?: string;
}): string;
```

路由优先级：

1. 显式技能覆盖（`explicitSkillId` 非空时直接返回）
2. 选中文本上下文启发式（有选中 + 无输入 → `builtin:polish`；有选中 + 短改写指令 → `builtin:rewrite`）
3. 关键词匹配规则：

| 关键词                            | 目标技能 ID          |
| --------------------------------- | -------------------- |
| "续写"/"写下去"/"接着写"/"继续写" | `builtin:continue`   |
| "头脑风暴"/"帮我想想"             | `builtin:brainstorm` |
| "大纲"/"提纲"                     | `builtin:outline`    |
| "总结"/"摘要"                     | `builtin:summarize`  |
| "翻译"                            | `builtin:translate`  |
| "扩写"/"展开"                     | `builtin:expand`     |
| "缩写"/"精简"                     | `builtin:condense`   |

4. 默认 → `builtin:chat`

REQ-ID: `REQ-SKL-ROUTE`

#### Scenario: S1 默认路由到 chat

- **假设** `args = { input: "你好，这个故事写得怎么样？", hasSelection: false }`
- **当** 调用 `inferSkillFromInput(args)`
- **则** 返回值 === `"builtin:chat"`

#### Scenario: S2 识别"续写"关键词

- **假设** `args = { input: "帮我接着写下去", hasSelection: false }`
- **当** 调用 `inferSkillFromInput(args)`
- **则** 返回值 === `"builtin:continue"`

#### Scenario: S3 识别"头脑风暴"关键词

- **假设** `args = { input: "帮我想想接下来的剧情", hasSelection: false }`
- **当** 调用 `inferSkillFromInput(args)`
- **则** 返回值 === `"builtin:brainstorm"`

#### Scenario: S4 空输入返回 chat

- **假设** `args = { input: "", hasSelection: false }`
- **当** 调用 `inferSkillFromInput(args)`
- **则** 返回值 === `"builtin:chat"`

#### Scenario: S5 显式技能覆盖优先

- **假设** `args = { input: "帮我续写", hasSelection: false, explicitSkillId: "builtin:polish" }`
- **当** 调用 `inferSkillFromInput(args)`
- **则** 返回值 === `"builtin:polish"`（显式覆盖优先于关键词匹配）

#### Scenario: S6 有选中文本且无输入路由到 polish

- **假设** `args = { input: "", hasSelection: true }`
- **当** 调用 `inferSkillFromInput(args)`
- **则** 返回值 === `"builtin:polish"`

#### Scenario: S7 有选中文本且短改写指令路由到 rewrite

- **假设** `args = { input: "改写", hasSelection: true }`
- **当** 调用 `inferSkillFromInput(args)`
- **则** 返回值 === `"builtin:rewrite"`
