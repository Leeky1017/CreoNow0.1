# IPC 通信层审计（IPC Layer Audit）

> Source: Notion local DB page `3f06546d-62a6-491d-bc73-d2e02a9d52c4`

> 📡

CN 的 IPC 层是后端工程质量最高的部分。 Schema-first type map + runtime 校验 + 统一 envelope + ACL + 超时 + 背压，形成了完整的边界防御。本文档审计 142 个 IPC 通道的组织方式、安全合规性、以及双进程架构引入后的变化。

---

## 1. IPC 概况

| 指标 | 数值 | SSOT |
| --- | --- | --- |
| 通道总数 | 142 | ipc/contract/ipc-contract.ts |
| 业务域数 | 15 | 按通道名称前缀分组 |
| Handler 文件数 | 21 | ipc/*.ts |
| 测试文件数 | 11 | ipc/__tests__/*.test.ts |
| 生成的 TypeMap | IpcChannelSpec  • IpcRequest/C  • IpcInvokeResult/C | packages/shared/types/ipc-generated.ts |

完整通道清单 → ‣

---

## 2. 六大原则合规审计

| 原则 | 要求 | 实现 | 评估 |
| --- | --- | --- | --- |
| Schema-first Type Map | TypeScript 类型映射，禁止裸字符串 + any | ipc/contract/ipc-contract.ts → 生成 ipc-generated.ts（IpcChannelSpec 全量类型覆盖） | ✅ 达标 |
| 按业务域组织 | 通道按域分组，handler 文件按域拆分 | 15 个域前缀（ai: / context: / knowledge: / memory: / project: / version: 等），handler 文件 1:1 对应 | ✅ 达标 |
| 三种通信模式明确 | invoke/handle · send/on · webContents.send/on | Request-Response: ipcMain.handle；Push: webContents.send（AI streaming / distill progress）；无 Fire-and-Forget | ✅ 达标 |
| Preload Bridge 安全模式 | contextBridge.exposeInMainWorld，禁止直接 ipcRenderer | window.creonow.invoke() via contextBridge，preload 仅暴露 invoke + stream 订阅管理 | ✅ 达标 |
| 运行时参数校验 | schema validation（Zod 或类似） | ipc/runtime-validation.ts  • ipc/contract/schema.ts（自研，非 Zod） | ✅ 达标 |
| 统一错误处理 | 结构化错误格式，全局异常拦截 | createValidatedIpcMain() 统一 envelope { ok: true/false }，异常映射为稳定错误码 | ✅ 达标 |

> ✅

六大原则全部达标。 这在 Electron 应用中属于相当高的工程标准。

---

## 3. IPC 边界中间件架构

### 3.1 createValidatedIpcMain() 处理流程

```
graph LR
    A["IPC 请求"] --> B["ACL 检查<br>ipcAcl.ts"]
    B -->|拒绝| X1["403 ACL_DENIED"]
    B -->|通过| C["Request Schema 校验"]
    C -->|失败| X2["400 VALIDATION_ERROR"]
    C -->|通过| D["Handler 执行<br>runWithTimeout()"]
    D -->|超时| X3["408 IPC_TIMEOUT"]
    D -->|异常| X4["500 INTERNAL_ERROR"]
    D -->|正常| E["Response Schema 校验"]
    E --> F["Envelope 返回<br>{ ok, data/error }"]

    style X1 fill:#ffebee,stroke:#f44336
    style X2 fill:#ffebee,stroke:#f44336
    style X3 fill:#ffebee,stroke:#f44336
    style X4 fill:#ffebee,stroke:#f44336
    style F fill:#e8f5e9,stroke:#4CAF50
```

### 3.2 中间件组件清单

| 组件 | 文件 | 职责 |
| --- | --- | --- |
| ACL | ipc/ipcAcl.ts | 通道级访问控制（允许/拒绝/条件） |
| Runtime Validation | ipc/runtime-validation.ts | request/response schema 校验 + timeout 包装 |
| Contract Schema | ipc/contract/schema.ts | 每个通道的 request/response 校验规则定义 |
| Contract Type Map | ipc/contract/ipc-contract.ts | SSOT：通道名 → 请求类型 → 响应类型 |
| Error Mapping | ipc/dbError.ts | DB 错误 → IPC 错误码映射 |
| Debug Gate | ipc/debugChannelGate.ts | 生产环境关闭 debug 通道（db:debug:*） |
| Project Guard | ipc/projectAccessGuard.ts | 项目级访问隔离 |
| Session Binding | ipc/projectSessionBinding.ts | 项目 ↔ 会话绑定 |
| Push Backpressure | ipc/pushBackpressure.ts | AI streaming push 背压（chunk 可丢弃，控制事件必达） |

---

## 4. Preload 暴露接口

SSOT：apps/desktop/preload/src/index.ts

暴露到 window.creonow（不是 window.electronApi）：

| 接口 | 用途 | 通信模式 |
| --- | --- | --- |
| invoke(channel, payload) | 所有 Request-Response IPC | ipcRenderer.invoke → ipcMain.handle |
| stream.registerAiStreamConsumer() | 注册 AI streaming 订阅 | ipcRenderer.on → webContents.send |
| stream.releaseAiStreamConsumer() | 释放 AI streaming 订阅 | 清理 listener |
| __CN_E2E_ENABLED__ | E2E 测试标志 | 静态值 |

> ✅

最小暴露原则。 渲染进程无法直接 ipcRenderer.send()，所有通信必须走 window.creonow.invoke() 管道。

---

## 5. 按域逐项审计

### 5.1 通道分布统计

| 域前缀 | 通道数 | Handler 文件 | 通信模式 |
| --- | --- | --- | --- |
| ai: | 10 | ipc/ai.ts  • ipc/aiProxy.ts | RR + Push（streaming） |
| project: | 15 | ipc/project.ts | RR |
| knowledge: | 15 | ipc/knowledgeGraph.ts | RR |
| memory: | 16 | ipc/memory.ts | RR + Push（distill progress） |
| context: | 10 | ipc/context.ts  • ipc/contextAssembly.ts  • ipc/contextBudget.ts  • ipc/contextFs.ts | RR |
| file: | 10 | ipc/file.ts | RR |
| version: | 11 | ipc/version.ts | RR |
| search: | 5 | ipc/search.ts | RR |
| skill: | 7 | ipc/skills.ts | RR |
| export: | 5 | ipc/export.ts | RR |
| embedding: | 3 | ipc/embedding.ts | RR |
| rag: | 3 | ipc/rag.ts | RR |
| constraints: | 6 | ipc/constraints.ts | RR |
| judge: | 3 | ipc/judge.ts | RR |
| stats: | 2 | ipc/stats.ts | RR |
| app: | 4 | ipc/window.ts | RR |
| db: | 1 | debug 通道（生产环境禁用） | RR |
| 合计 | 142 (含 push 通道) |  |  |

### 5.2 按域关键审计

🤖 AI 域（10 通道）

最复杂的域，涉及 skill 执行全链路：

| 通道 | 功能 | 备注 |
| --- | --- | --- |
| ai:skill:run | 执行技能（核心入口） | 触发 Context 装配 → LLM 调用 → Streaming push |
| ai:skill:cancel | 取消正在执行的技能 | 涉及 AbortController |
| ai:skill:feedback | 反馈（accept/reject） | 写入 skill_feedback |
| ai:chat:send/list/clear | 聊天历史管理 |  |
| ai:config:get/update/test | AI 配置（provider/key） | 涉及 safeStorage 加解密 |
| ai:models:list | 可用模型列表 |  |

Push 通道（webContents.send，不在 142 计数内）：

- SKILL_STREAM_CHUNK_CHANNEL — AI 流式输出 chunk

- SKILL_STREAM_DONE_CHANNEL — 流式输出完成

- SKILL_QUEUE_STATUS_CHANNEL — 队列状态变化

📂 Project 域（15 通道）

项目 CRUD + 生命周期管理：

| 通道 | 功能 | 备注 |
| --- | --- | --- |
| project:project:create/delete/rename/update | 基础 CRUD |  |
| project:project:list/getcurrent/setcurrent | 列表与当前项目 |  |
| project:project:switch | 项目切换 | 当前仅写 DB + 切内存绑定，无 teardown |
| project:project:duplicate | 复制项目 | 涉及同步 FS（cpSync） |
| project:project:archive/stats | 归档 / 统计 |  |
| project:project:createaiassist | AI 辅助创建项目 |  |
| project:lifecycle:archive/get/purge/restore | 项目生命周期状态机 |  |

> ⚠️

project:project:switch 是审计发现的核心风险点：switchKnowledgeGraphContext / switchMemoryContext 实际是 no-op，旧项目资源不释放。

🔮 Knowledge 域（15 通道）

KG 实体 + 关系 CRUD + 查询 + 识别：

| 类别 | 通道 | 备注 |
| --- | --- | --- |
| 实体 CRUD | knowledge:entity:create/read/update/delete/list |  |
| 关系 CRUD | knowledge:relation:create/update/delete/list |  |
| 图查询 | knowledge:query:byids/path/relevant/subgraph/validate | 主线程 JS 层遍历，应迁移 ComputeProcess |
| 识别运行时 | knowledge:recognition:enqueue/cancel/stats |  |
| 规则注入 | knowledge:rules:inject |  |
| 建议 | knowledge:suggestion:accept/dismiss |  |

🧠 Memory 域（16 通道）

记忆系统最多的域（16 通道），涵盖三层记忆：

| 类别 | 通道 | 备注 |
| --- | --- | --- |
| 基础 CRUD | memory:entry:create/delete/list/update | user_memory 表 |
| 语义记忆 | memory:semantic:add/delete/distill/list/update | 含蒸馏（episodic→semantic） |
| 情景记忆 | memory:episode:query/record |  |
| 注入预览 | memory:injection:preview | Context Engine 注入前预览 |
| 作用域 | memory:scope:promote | 项目级→全局提升 |
| 清理 | memory:clear:all/project |  |
| 设置 | memory:settings:get/update |  |
| Trace | memory:trace:feedback/get |  |

Push 通道：memory:distill:progress（蒸馏进度广播）

📄 File / Document 域（10 通道）

文档 CRUD + 当前文档管理：

| 通道 | 功能 |
| --- | --- |
| file:document:create/delete/read/save/update/updatestatus | 文档 CRUD |
| file:document:list/reorder | 列表和排序 |
| file:document:getcurrent/setcurrent | 当前文档切换 |

📝 Version 域（11 通道）

版本管理 + 分支 + 合并：

| 类别 | 通道 |
| --- | --- |
| 快照 | version:snapshot:create/list/read/diff/restore/rollback |
| 分支 | version:branch:create/list/merge/switch |
| 冲突 | version:conflict:resolve |
| AI | version:aiapply:logconflict |

其他域（Context / Search / Skill / Export / Embedding / RAG / Constraints / Judge / Stats / App）

| 域 | 通道数 | 关键点 |
| --- | --- | --- |
| context: | 10 | 四层 Context 装配 + 预算管理 + watch |
| search: | 5 | FTS + 混合排名 + 搜索替换 |
| skill: | 7 | 自定义技能 CRUD + 注册表管理 |
| export: | 5 | markdown / txt / docx / pdf / project bundle |
| embedding: | 3 | 语义索引 + 向量搜索 + 生成 |
| rag: | 3 | RAG 配置 + 检索 |
| constraints: | 6 | 约束策略 CRUD |
| judge: | 3 | Judge 模型管理 + 质量评估 |
| stats: | 2 | 今日统计 + 范围统计 |
| app: | 4 | 窗口管理（close/minimize/maximize/ping） |

---

## 6. 错误处理体系

### 6.1 错误码规范

所有 IPC 响应统一为 envelope 格式：

```
// 成功
{ ok: true, data: T }

// 失败
{ ok: false, error: { code: string, message: string } }
```

已知错误码：

| 错误码 | 来源 | 含义 |
| --- | --- | --- |
| INTERNAL_ERROR | 中间件兜底 | 未捕获异常，不泄露错误细节 |
| IPC_TIMEOUT | 中间件 timeout | handler 执行超时（默认 30s） |
| VALIDATION_ERROR | 中间件 schema 校验 | request/response 格式不合法 |
| ACL_DENIED | 中间件 ACL | 通道访问被拒绝 |
| 业务错误码 | 各 service → mapDocumentErrorToIpcError 等 | 业务域特定错误（NOT_FOUND / CONFLICT 等） |

### 6.2 关键保障

- Handler 内部不需要 try/catch — 中间件统一兜底

- 异常不泄漏到 IPC — 未捕获异常包装为 INTERNAL_ERROR

- 超时保护 — 默认 30s，per-channel policy 可覆盖

- Promise rejection 不遗漏 — runWithTimeout 确保 timeout 后 reject

---

## 7. IPC 测试覆盖

| 测试文件 | 测试内容 |
| --- | --- |
| ai-chat-project-isolation.test.ts | AI 聊天项目隔离 |
| ai-config-ipc.test.ts | AI 配置 IPC 正确性 |
| contextIpcSplit.*.test.ts (3 files) | Context IPC 拆分的聚合/依赖/路由测试 |
| debug-channel-gate.test.ts | Debug 通道生产环境禁用 |
| document-error-mapping.test.ts | 文档错误码映射 |
| ipcAcl.test.ts | ACL 规则正确性 |
| project-access-guard.test.ts | 项目访问隔离 |
| projectSessionBinding.test.ts | 项目会话绑定 |
| runtimeValidation.acl.test.ts | Runtime 校验 + ACL 集成 |
| window-ipc.test.ts | 窗口管理 IPC |

---

## 8. 双进程架构后的 IPC 变化

引入 ComputeProcess + DataProcess 后，IPC 通信从二层（Renderer ↔ Main）变为三层：

### 8.1 通信拓扑变化

```
graph TB
    subgraph Before["当前：二层"]
        R1["Renderer"] -->|"ipcRenderer.invoke"| M1["Main<br>（直接执行）"]
    end

    subgraph After["目标：三层"]
        R2["Renderer"] -->|"ipcRenderer.invoke"| M2["Main<br>（路由 + 调度）"]
        M2 -->|"postMessage"| CP["ComputeProcess"]
        M2 -->|"postMessage"| DP["DataProcess"]
        CP -->|"result"| M2
        DP -->|"result"| M2
    end

    style Before fill:#ffebee,stroke:#f44336
    style After fill:#e8f5e9,stroke:#4CAF50
```

### 8.2 通道路由表（目标）

> 🔑

原则：Renderer 侧的 IPC 通道不变。 路由决策在 Main 的 handler 内部完成，对渲染进程透明。

| 路由目标 | 涉及通道（示例） | 原因 |
| --- | --- | --- |
| Main 直接处理 | app:window:* / project:project:getcurrent / context:settings:read / stats:* | 轻量读或窗口管理，无需跨进程 |
| → ComputeProcess | embedding:text:generate / embedding:semantic:search / search:fts:query / search:fts:reindex / knowledge:query:* / rag:context:retrieve | CPU 密集（ONNX / KG CTE / FTS） |
| → DataProcess | 所有涉及 INSERT/UPDATE/DELETE 的通道（file:document:save / knowledge:entity:create / memory:entry:create 等） | 写操作统一走 DataProcess |
| Main → Compute → Data | ai:skill:run（Context 装配在 Main → ONNX 在 Compute → trace 写入在 Data） | 复合链路 |

### 8.3 新增进程间消息通道

双进程架构引入后，Main ↔ UtilityProcess 之间会新增内部通信协议（不暴露给渲染进程）：

| 消息类型 | 方向 | 用途 |
| --- | --- | --- |
| task | Main → Utility | 提交任务 |
| abort | Main → Utility | 取消任务 |
| shutdown | Main → Utility | 优雅关闭 |
| switch-project | Main → Utility | 切换 SQLite DB 文件 |
| result | Utility → Main | 任务完成 |
| error | Utility → Main | 任务失败 |
| ready | Utility → Main | 进程就绪 |

> 消息协议完整定义见 → ‣

---

## 9. 审计发现与改进方向

### 9.1 IPC 层本身（质量高，改动小）

| 方面 | 现状 | 改进 |
| --- | --- | --- |
| 六大原则 | ✅ 全部达标 | 保持 |
| Preload 安全 | ✅ 最小暴露 | 保持 |
| 错误处理 | ✅ 统一 envelope + 稳定错误码 | 保持 |
| 背压控制 | ✅ push 通道有丢弃策略 | 保持 |
| 超时机制 | ✅ 默认 30s | ⚠️ timeout 后"幽灵任务"继续消耗资源 → 需要 AbortController 联动 |

### 9.2 Handler 层（核心改造点）

| 问题 | 影响 | 治理方案 |
| --- | --- | --- |
| Handler 直接同步执行 service | CPU/IO 密集任务阻塞主线程 | → 路由到 ComputeProcess / DataProcess |
| IPC timeout 不联动 AbortController | timeout 后底层任务仍在执行（"幽灵任务"） | → BackgroundTaskRunner 的 abort 机制 |
| Handler 就地构造 service 实例 | 每次 IPC 调用都 new，无缓存 | → ♻️ 三层生命周期管理中统一 service 实例管理 |
| project:project:switch 无 teardown | 旧项目资源不释放 | → ♻️ 三层生命周期管理 |

---

## 10. 相关页面

- ‣ — 完整通道清单

- ‣ — §7 进程间通信协议

- ‣ — §6 IPC 边界中间件

- ‣ — handler service 实例管理
