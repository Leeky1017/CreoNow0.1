# IPC Specification


## Purpose

定义 Electron 渲染进程与主进程之间的通信契约，包括通道命名、消息类型、参数校验和错误格式。包含自动化契约生成与校验。

### Scope

| Layer    | Path                           |
| -------- | ------------------------------ |
| Contract | `main/src/ipc/contract/`       |
| Preload  | `preload/src/`                 |
| Shared   | `packages/shared/`             |
| Script   | `scripts/contract-generate.ts` |

## Requirements

### Requirement: Schema-First 契约定义

系统**必须**采用 Schema-First 策略——所有 IPC 通道的消息类型在编写代码前先定义 schema，再由 schema 自动生成 TypeScript 类型和运行时校验代码。

契约定义位置：`packages/shared/types/ipc/`，每个领域模块一个文件。

每个 IPC 通道**必须**定义以下内容：

```typescript
interface IPCChannelDefinition {
  channel: string; // 通道名称，如 "file:document:create"
  mode: "request-response" | "push" | "fire-and-forget";
  direction: "renderer-to-main" | "main-to-renderer";
  request?: ZodSchema; // 请求数据的 Zod schema（push/fire-and-forget 无 request）
  response?: ZodSchema; // 响应数据的 Zod schema（fire-and-forget 无 response）
  description: string; // 通道用途描述
}
```

契约文件**必须**作为主进程和渲染进程之间的唯一类型合同——任何 IPC 通信都**必须**经过契约定义，禁止绕过契约直接使用 `ipcRenderer.send` 或 `ipcMain.handle`。

#### Scenario: 新增 IPC 通道的流程

- **假设** 开发者需要新增一个 `memory:episode:record` 通道
- **当** 开发者在 `packages/shared/types/ipc/memory.ts` 中添加通道定义
- **则** 定义包含 channel 名称、mode（fire-and-forget）、direction、request schema
- **并且** 运行契约生成脚本后，主进程和 preload 的类型定义自动更新

#### Scenario: 通道定义不完整时的构建失败

- **假设** 开发者定义了一个 Request-Response 模式的通道但未定义 response schema
- **当** 契约生成脚本运行
- **则** 脚本报错「通道 xxx 为 Request-Response 模式但缺少 response schema」
- **并且** 构建失败，阻止不完整定义进入代码

---

### Requirement: 通道命名规范

所有 IPC 通道**必须**遵循统一命名规范：`<domain>:<resource>:<action>`。

命名规则：

- **domain**：领域模块名，小写，与 spec 目录名一致
- **resource**：操作的资源名，小写
- **action**：动作名，小写

已定义的 domain 前缀：

| Domain        | 模块            | 示例通道                  |
| ------------- | --------------- | ------------------------- |
| `file`        | Document Mgmt   | `file:document:create`    |
| `project`     | Project Mgmt    | `project:create`          |
| `skill`       | Skill System    | `skill:execute`           |
| `knowledge`   | Knowledge Graph | `knowledge:entity:create` |
| `memory`      | Memory System   | `memory:episode:record`   |
| `version`     | Version Control | `version:snapshot:create` |
| `search`      | Search          | `search:fts:query`        |
| `embedding`   | Embedding       | `embedding:search`        |
| `rag`         | RAG             | `rag:retrieve`            |
| `context`     | Context Engine  | `context:assemble`        |
| `constraints` | Context Engine  | `constraints:create`      |
| `ai`          | AI Service      | `ai:config:get`           |
| `judge`       | AI Service      | `judge:evaluate`          |
| `export`      | Document Mgmt   | `export:document`         |

通道名称**禁止**使用大写字母、空格或特殊字符（仅允许小写字母、数字和冒号分隔符）。

#### Scenario: 通道命名校验通过

- **假设** 开发者定义通道 `knowledge:relation:create`
- **当** 契约生成脚本校验命名
- **则** 命名格式正确，校验通过

#### Scenario: 通道命名违反规范

- **假设** 开发者定义通道 `KnowledgeGraph_createEntity`
- **当** 契约生成脚本校验命名
- **则** 报错「通道名称必须使用 <domain>:<resource>:<action> 格式，仅允许小写字母和冒号」
- **并且** 构建失败

---

### Requirement: 三种通信模式

系统**必须**支持三种 IPC 通信模式，每种模式有明确的语义和技术实现：

| 模式              | 语义                     | 技术实现                                | 适用场景               |
| ----------------- | ------------------------ | --------------------------------------- | ---------------------- |
| Request-Response  | 请求-响应，等待结果      | `ipcRenderer.invoke` / `ipcMain.handle` | CRUD 操作、配置读写    |
| Push Notification | 主进程主动推送到渲染进程 | `webContents.send` / `ipcRenderer.on`   | 流式数据、状态变更通知 |
| Fire-and-Forget   | 发送后不等待响应         | `ipcRenderer.send` / `ipcMain.on`       | 日志记录、非关键性事件 |

**Request-Response** 规范：

- 渲染进程发起，主进程处理并返回
- 返回值统一为 `{ ok: true, data: T }` 或 `{ ok: false, error: IPCError }`
- 超时设置：默认 30 秒，可按通道配置

**Push Notification** 规范：

- 主进程发起，推送到指定渲染进程
- 渲染进程通过 `ipcRenderer.on(channel, callback)` 监听
- 推送数据**必须**通过 Zod schema 校验后发送

**Fire-and-Forget** 规范：

- 渲染进程发起，主进程接收但不返回
- 用于不需要确认的操作（如记录日志、发送分析事件）
- 主进程处理失败时静默记录日志，不通知渲染进程

#### Scenario: Request-Response 正常交互

- **假设** 渲染进程需要获取文档列表
- **当** 调用 `file:document:list`
- **则** 主进程从 SQLite 查询文档列表
- **并且** 返回 `{ ok: true, data: Document[] }`
- **并且** 渲染进程收到类型安全的响应

#### Scenario: Request-Response 超时

- **假设** 主进程处理耗时超过 30 秒
- **当** 超时触发
- **则** 渲染进程收到 `{ ok: false, error: { code: "IPC_TIMEOUT", message: "请求超时" } }`
- **并且** 主进程中正在执行的操作被标记为需要清理

#### Scenario: Push Notification 流式推送

- **假设** AI 技能正在流式生成内容
- **当** 主进程接收到 LLM 的每个 chunk
- **则** 通过 `skill:stream:chunk` 推送到渲染进程
- **并且** 渲染进程实时更新 AI 面板

---

### Requirement: IPC timeout 必须中止底层 handler 执行（无幽灵执行）

IPC 层**必须**将超时语义与底层执行绑定，避免仅拒绝外层 Promise 而底层 handler 继续运行（幽灵执行）。

- Request-Response 调用触发 timeout 时：返回错误码 `IPC_TIMEOUT`（沿用本 spec 的错误码字典）。
- 触发 timeout 时：必须向底层 handler 传播取消信号（AbortSignal/等价机制），并确保后续副作用不再继续发生。
- 该行为必须可被自动化测试验证（不依赖真实 Electron 运行时）。

#### Scenario: BE-SLA-S2 IPC timeout 通过 AbortSignal 中止底层执行

- **假设** 某个 IPC handler 内部包含可持续执行/持续副作用的长耗时步骤
- **当** IPC 层触发 timeout
- **则** timeout 不仅返回 `IPC_TIMEOUT`，还会触发 AbortSignal（或等价机制）中止底层执行
- **并且** 超时后不再发生任何来自该 handler 的后续副作用（不存在幽灵执行）

---

### Requirement: Preload Bridge 安全层

系统**必须**通过 Electron 的 `contextBridge` 将 IPC 能力安全暴露给渲染进程，禁止渲染进程直接访问 Node.js API。

Preload 桥接架构：

```
渲染进程（React）
    │
    ▼ window.api.xxx()
Preload 脚本（contextBridge.exposeInMainWorld）
    │
    ▼ ipcRenderer.invoke / ipcRenderer.send / ipcRenderer.on
主进程（Electron Main）
```

Preload 暴露的 API**必须**严格限制为契约中定义的通道，**禁止**暴露 `ipcRenderer` 本身或任何 Node.js 模块。

Preload API 按领域分组：

```typescript
interface PreloadAPI {
  file: {
    createDocument: (
      params: CreateDocumentParams,
    ) => Promise<IPCResponse<Document>>;
    // ...
  };
  project: {
    create: (params: CreateProjectParams) => Promise<IPCResponse<Project>>;
    // ...
  };
  // 每个 domain 一个命名空间
}
```

渲染进程通过 `window.api.<domain>.<method>()` 调用。

#### Scenario: 渲染进程通过 Preload API 创建文档

- **假设** 渲染进程需要创建文档
- **当** 调用 `window.api.file.createDocument({ title: "第一章", type: "chapter" })`
- **则** Preload 脚本将调用转为 `ipcRenderer.invoke("file:document:create", params)`
- **并且** 主进程处理后返回结果
- **并且** 渲染进程收到类型安全的 `IPCResponse<Document>`

#### Scenario: 渲染进程尝试直接访问 Node.js API

- **假设** 渲染进程代码中尝试 `require('fs')` 或 `window.require`
- **当** 代码执行
- **则** Electron 的 `contextIsolation: true` 和 `nodeIntegration: false` 阻止访问
- **并且** 运行时报错，操作被拒绝

---

### Requirement: 运行时数据校验

所有进入主进程的 IPC 数据**必须**通过 Zod schema 进行运行时校验，确保类型安全不仅在编译时有效，在运行时同样有效。

校验流程：

```
渲染进程发送数据 → Preload 桥接 → 主进程 IPC Handler
                                          │
                                    Zod schema 校验
                                          │
                                   ┌──────┴──────┐
                                   │             │
                              校验通过        校验失败
                              │             │
                         执行业务逻辑     返回统一错误
```

校验失败时**必须**返回统一错误格式：

```typescript
{
  ok: false,
  error: {
    code: "VALIDATION_ERROR",
    message: string,          // 人类可读的错误描述
    details: ZodError[]       // Zod 校验错误详情
  }
}
```

校验**必须**在主进程的 IPC Handler 入口统一执行，不可依赖各业务模块自行校验。

#### Scenario: Zod 校验通过——正常执行

- **假设** 渲染进程发送 `{ title: "第一章", type: "chapter" }` 到 `file:document:create`
- **当** 主进程 IPC Handler 执行 Zod 校验
- **则** 数据符合 schema，校验通过
- **并且** 数据传递给业务逻辑层执行创建

#### Scenario: Zod 校验失败——类型不匹配

- **假设** 渲染进程发送 `{ title: 123, type: "chapter" }` （title 应为 string）
- **当** 主进程 IPC Handler 执行 Zod 校验
- **则** 校验失败，返回 `{ ok: false, error: { code: "VALIDATION_ERROR", message: "title 必须为字符串", details: [...] } }`
- **并且** 业务逻辑不执行

#### Scenario: Zod 校验失败——缺少必填字段

- **假设** 渲染进程发送 `{ type: "chapter" }` （缺少 title）
- **当** 主进程 IPC Handler 执行 Zod 校验
- **则** 校验失败，返回 `{ ok: false, error: { code: "VALIDATION_ERROR", message: "title 为必填字段" } }`

---

### Requirement: 统一错误处理

系统**必须**定义统一的 IPC 错误格式，所有错误响应遵循相同结构。

错误格式：

```typescript
interface IPCError {
  code: string; // 机器可读的错误码，格式 UPPER_SNAKE_CASE
  message: string; // 人类可读的错误描述（中文）
  details?: unknown; // 可选的错误详情（如 Zod 校验细节、堆栈信息等）
}

type IPCResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: IPCError };
```

预定义错误码：

| 错误码               | 含义             | HTTP 类比 |
| -------------------- | ---------------- | --------- |
| `VALIDATION_ERROR`   | 请求数据校验失败 | 400       |
| `NOT_FOUND`          | 资源不存在       | 404       |
| `CONFLICT`           | 资源冲突         | 409       |
| `INTERNAL_ERROR`     | 主进程内部错误   | 500       |
| `IPC_TIMEOUT`        | 请求超时         | 504       |
| `AI_NOT_CONFIGURED`  | AI 服务未配置    | 503       |
| `LLM_API_ERROR`      | LLM API 调用失败 | 502       |
| `EXPORT_WRITE_ERROR` | 导出写入失败     | 500       |
| `SKILL_INPUT_EMPTY`  | 技能输入为空     | 400       |
| `DB_ERROR`           | 数据库操作失败   | 500       |

主进程**禁止**将原始异常（Error stack）泄露到渲染进程——**必须**转换为结构化的 `IPCError` 后返回。原始异常记录到主进程日志。

#### Scenario: 主进程内部错误——安全返回

- **假设** 主进程处理文档创建时 SQLite 写入失败
- **当** 异常被 IPC Handler 的统一错误处理捕获
- **则** 返回 `{ ok: false, error: { code: "DB_ERROR", message: "数据保存失败，请重试" } }`
- **并且** 原始 Error stack 记录到主进程日志文件
- **并且** 渲染进程不会看到内部实现细节

#### Scenario: 渲染进程处理错误响应

- **假设** 渲染进程调用 `window.api.file.createDocument(...)`
- **当** 收到 `{ ok: false, error: { code: "VALIDATION_ERROR", ... } }`
- **则** 渲染进程根据 `error.code` 展示对应的用户友好提示
- **并且** 表单字段显示内联错误（如有 `details`）

---

### Requirement: 契约自动生成与校验

系统**必须**提供自动化脚本 `scripts/contract-generate.ts`，从 schema 定义生成以下产物：

| 产物                    | 输出位置                                | 用途             |
| ----------------------- | --------------------------------------- | ---------------- |
| TypeScript 类型定义     | `packages/shared/types/ipc/generated/`  | 编译时类型检查   |
| Preload API 桩代码      | `preload/src/generated/`                | Preload 桥接代码 |
| 主进程 Handler 注册代码 | `main/src/ipc/generated/`               | IPC Handler 注册 |
| 通道名称常量            | `packages/shared/constants/channels.ts` | 避免硬编码字符串 |

脚本**必须**在以下时机运行：

- CI 流水线中作为构建步骤
- 开发者手动运行 `pnpm run contract:generate`

脚本**必须**校验：

1. 所有通道命名符合 `<domain>:<resource>:<action>` 格式
2. Request-Response 模式的通道有 request 和 response schema
3. 无重复通道名称
4. 所有引用的 Zod schema 合法

校验失败时脚本以非零退出码终止，阻止构建。

#### Scenario: 契约生成脚本正常运行

- **假设** 所有 IPC 通道定义完整且合法
- **当** 运行 `pnpm run contract:generate`
- **则** 脚本成功生成 TypeScript 类型、Preload 桩代码、Handler 注册代码、通道常量
- **并且** 退出码为 0

#### Scenario: 检测到重复通道名称

- **假设** 两个不同模块定义了同名通道 `file:document:create`
- **当** 运行契约生成脚本
- **则** 脚本报错「重复通道名称: file:document:create，分别在 file.ts 和 document.ts 中定义」
- **并且** 退出码非 0，构建失败

#### Scenario: CI 中契约校验

- **假设** 开发者修改了 IPC 契约但忘记重新生成代码
- **当** CI 流水线运行
- **则** CI 检测到生成代码与 schema 不一致
- **并且** 构建失败，阻止 PR 合并

---

### Requirement: 可测试性

IPC 层**必须**支持完整的单元测试，不依赖真实的 Electron 运行时。

测试策略：

- **主进程 Handler 测试**：直接调用 handler 函数，mock `ipcMain`，验证 Zod 校验和业务逻辑
- **Preload 测试**：mock `ipcRenderer`，验证 API 方法正确转发到对应通道
- **集成测试**：使用 Electron 的 `@electron/remote` 或 Spectron（如需），但 LLM 调用**必须** mock

测试辅助工具**应该**提供：

- `createMockIPCHandler(channel, response)`：创建 mock handler
- `createMockIPCEmitter(channel)`：创建 mock push notification emitter
- `assertIPCCall(channel, expectedParams)`：断言 IPC 调用

#### Scenario: 单元测试主进程 Handler

- **假设** 测试 `file:document:create` handler
- **当** 传入合法参数调用 handler 函数
- **则** handler 执行 Zod 校验通过
- **并且** 调用 Document DAO 创建文档
- **并且** 返回 `{ ok: true, data: Document }`

#### Scenario: 单元测试 Zod 校验拒绝非法数据

- **假设** 测试 `file:document:create` handler
- **当** 传入 `{ title: null }` 调用 handler
- **则** Zod 校验失败
- **并且** 返回 `{ ok: false, error: { code: "VALIDATION_ERROR", ... } }`
- **并且** DAO 不被调用

---

### Requirement: 模块级可验收标准（适用于本模块全部 Requirement）

- 量化阈值：
  - Request-Response 往返延迟 p95 < 100ms，p99 < 300ms
  - Push 通知投递延迟 p95 < 80ms
  - Zod 校验耗时 p95 < 10ms
- 边界与类型安全：
  - `TypeScript strict` + zod 双重保证
  - 所有通道必须在契约注册表中唯一声明
- 失败处理策略：
  - 校验失败立即返回 `VALIDATION_ERROR`
  - 超时返回 `IPC_TIMEOUT`
  - 主进程异常统一映射 `INTERNAL_ERROR` 或领域错误码
- Owner 决策边界：
  - 通道命名规范、错误码字典、三种通信模式由 Owner 固定
  - Agent 不得新增未审批 mode 或返回格式

#### Scenario: IPC 延迟指标达标

- **假设** 执行 10,000 次 request-response 调用
- **当** 统计延迟分位
- **则** p95 < 100ms，p99 < 300ms
- **并且** 超时率 < 0.1%

#### Scenario: 非法通道注册被阻断

- **假设** 开发者尝试注册重复通道
- **当** 运行契约校验
- **则** 返回 `IPC_CONTRACT_DUPLICATED_CHANNEL`
- **并且** 构建失败

---

### Requirement: 异常与边界覆盖矩阵

| 类别         | 最低覆盖要求                       |
| ------------ | ---------------------------------- |
| 网络/IO 失败 | 主进程繁忙超时、渲染进程断连       |
| 数据异常     | schema 不匹配、response 序列化失败 |
| 并发冲突     | 高频并发 invoke、同通道重复注册    |
| 容量溢出     | 超大 payload、事件风暴             |
| 权限/安全    | 未授权通道调用、preload 逃逸       |

#### Scenario: 超大 payload 被拒绝

- **假设** 渲染进程发送 15MB 请求体
- **当** IPC 层执行大小校验
- **则** 返回 `IPC_PAYLOAD_TOO_LARGE`
- **并且** 主进程不进入业务处理逻辑

#### Scenario: 未授权通道调用被拦截

- **假设** 渲染进程调用未暴露的通道
- **当** preload 网关校验
- **则** 返回 `IPC_CHANNEL_FORBIDDEN`
- **并且** 记录安全审计事件

---

### Non-Functional Requirements

**Performance**

- Request-Response：p50 < 40ms，p95 < 100ms，p99 < 300ms
- Push 投递：p50 < 30ms，p95 < 80ms，p99 < 200ms
- schema 校验：p95 < 10ms

**Capacity**

- 单请求 payload 上限：10 MB
- 单渲染进程事件订阅上限：500
- 每秒 push 事件上限：5,000（超限背压）

**Security & Privacy**

- preload 仅暴露白名单 API，禁止透传 `ipcRenderer`
- 错误响应禁止携带 stack
- 敏感字段（token/key）在 IPC 层统一脱敏

**Concurrency**

- 通道注册需全局唯一锁
- 高频请求启用滑动窗口限流
- push 事件按通道有序投递

#### Scenario: 事件风暴触发限流

- **假设** 某通道瞬时推送 10,000 事件/s
- **当** 超过上限 5,000
- **则** 系统触发背压并丢弃低优先级事件
- **并且** 保留关键控制事件

#### Scenario: 并发注册冲突

- **假设** 两个模块同时注册同一通道
- **当** 加锁校验执行
- **则** 仅一个注册成功
- **并且** 另一个收到冲突错误并中止启动
