# IPC Specification Delta

## Change: ipc-p0-preload-gateway-and-security-baseline

### Requirement: Preload Bridge 安全层 [MODIFIED]

Preload 必须作为 IPC 的唯一网关，采用“白名单 + 最小暴露面”策略：

- 仅暴露契约中声明且经生成的 API
- 不暴露 `ipcRenderer`、`require`、`process` 或任意 Node.js 能力
- 未授权通道调用必须被拒绝并记录安全审计事件

#### Scenario: 调用未暴露通道被网关拒绝 [ADDED]

- **假设** 渲染进程尝试调用未在 preload 暴露名单中的通道
- **当** 请求进入 preload 网关
- **则** 返回 `{ ok: false, error: { code: "IPC_CHANNEL_FORBIDDEN", message: "通道未授权" } }`
- **并且** 写入安全审计日志（rendererId、channel、timestamp）

#### Scenario: 渲染进程无法获得 ipcRenderer 引用 [ADDED]

- **假设** 渲染进程尝试读取 `window.ipcRenderer` 或透传对象上的底层引用
- **当** 运行时访问发生
- **则** 访问失败且返回 `undefined` 或抛出隔离错误
- **并且** 不存在绕过 preload 网关的可调用路径

### Requirement: 异常与边界覆盖矩阵 [MODIFIED]

IPC 边界必须优先覆盖以下安全与容量边界：

- 未授权通道调用
- 超大 payload（>10MB）
- 单渲染进程订阅上限（>500）

#### Scenario: 超大 payload 被拒绝并阻断业务处理 [ADDED]

- **假设** 渲染进程发送 15MB 请求体
- **当** preload 或主进程入口执行大小校验
- **则** 返回 `IPC_PAYLOAD_TOO_LARGE`
- **并且** 请求不进入业务 handler

#### Scenario: 订阅数量超过上限被拒绝 [ADDED]

- **假设** 单渲染进程已建立 500 个事件订阅
- **当** 继续注册第 501 个订阅
- **则** 返回 `IPC_SUBSCRIPTION_LIMIT_EXCEEDED`
- **并且** 系统保持已建立订阅可用，不触发全局故障

### Non-Functional Requirements [MODIFIED]

新增必须遵守的安全与容量门槛：

- 单请求 payload 上限：10MB（硬拒绝）
- 单渲染进程订阅上限：500（硬拒绝）
- push 事件速率上限：5,000/s（超过时触发背压）

#### Scenario: 事件风暴触发背压且保留关键事件 [ADDED]

- **假设** 某通道瞬时 push 速率达到 10,000/s
- **当** 超过 5,000/s 上限
- **则** 系统触发背压并丢弃低优先级事件
- **并且** 关键控制事件继续投递
