# IPC Specification Delta

## Change: ipc-p0-runtime-validation-and-error-envelope

### Requirement: 三种通信模式 [MODIFIED]

对于 Request-Response 模式，主进程返回必须始终符合统一 envelope：

- 成功：`{ ok: true, data: T }`
- 失败：`{ ok: false, error: IPCError }`

禁止返回裸对象、裸数组或非结构化异常。

#### Scenario: Request-Response 返回非 envelope 被判定为协议错误 [ADDED]

- **假设** 某 handler 返回了裸对象 `{ id: "doc-1" }`
- **当** IPC 框架执行响应出站校验
- **则** 将其转换为 `{ ok: false, error: { code: "INTERNAL_ERROR", ... } }`
- **并且** 记录协议违规日志

### Requirement: 运行时数据校验 [MODIFIED]

运行时校验必须覆盖双向：

- 入站请求：进入业务逻辑前进行 Zod 校验
- 出站响应：返回渲染进程前进行 schema 校验

任一方向校验失败都必须阻断业务继续，并返回结构化错误。

#### Scenario: 请求校验失败时业务逻辑不执行 [ADDED]

- **假设** 渲染进程发送非法请求 `{ title: 123 }`
- **当** 主进程执行入站校验
- **则** 返回 `VALIDATION_ERROR`
- **并且** 对应 handler 的业务函数不被调用

#### Scenario: 响应校验失败时返回结构化错误 [ADDED]

- **假设** handler 产出的响应不符合 response schema
- **当** 主进程执行出站校验
- **则** 返回 `{ ok: false, error: { code: "INTERNAL_ERROR", message: "响应数据不符合契约" } }`
- **并且** 原始错误仅写入主进程日志

### Requirement: 统一错误处理 [MODIFIED]

错误映射必须满足：

- 原始异常不可透传渲染进程（含 stack、SQL、内部路径）
- 未识别异常统一映射到 `INTERNAL_ERROR`
- 超时统一映射到 `IPC_TIMEOUT`
- 错误响应必须可判定并保持稳定字段结构

#### Scenario: 未捕获异常统一映射为 INTERNAL_ERROR [ADDED]

- **假设** handler 内部抛出未知异常
- **当** 统一错误处理中间层捕获该异常
- **则** 渲染进程收到 `INTERNAL_ERROR`
- **并且** 错误响应不包含 stack 与内部实现细节

#### Scenario: 超时触发后返回 IPC_TIMEOUT 并执行清理 [ADDED]

- **假设** 请求超过通道配置超时阈值
- **当** 超时控制器触发取消流程
- **则** 返回 `IPC_TIMEOUT`
- **并且** 执行该通道声明的清理钩子
