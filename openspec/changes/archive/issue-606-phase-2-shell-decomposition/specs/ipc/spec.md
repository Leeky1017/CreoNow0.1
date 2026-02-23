# IPC Specification Delta

更新时间：2026-02-22 11:36

## Change: issue-606-phase-2-shell-decomposition

### Requirement: Renderer IPC 入口收敛到 Service 层 [MODIFIED]

Renderer 侧 IPC 调用必须遵循单一入口路径：`Feature/Surface -> Service -> Preload/Main`。

- Feature/Surface 组件禁止直接调用 `ipcRenderer`、`window.creonow.invoke`（或同类桥接入口）。
- Service 层负责通道调用、请求参数整理、响应 envelope 解析。
- 渲染层业务组件只消费 Service 暴露的语义化方法与结果。

#### Scenario: IPC-P2-S1 Feature 直接调用 IPC 被治理规则阻断 [ADDED]

- **假设** Feature 组件直接写入 `window.creonow.invoke("project:switch", payload)`
- **当** 执行 renderer IPC 边界治理规则
- **则** 产生阻断级 violation
- **并且** 指向“必须改为 service 层调用”的修复方向

#### Scenario: IPC-P2-S2 Feature 通过 Service 调用 IPC 并获得类型化结果 [ADDED]

- **假设** Feature 需要执行项目切换
- **当** 组件调用 `projectService.switchProject(projectId)`
- **则** Service 层完成 IPC invoke 并解析 envelope
- **并且** Feature 收到稳定的领域结果而非裸 IPC 细节

### Requirement: Service 层统一 renderer 侧错误收敛 [ADDED]

Renderer 侧 IPC 错误必须在 Service 层收敛为一致结果，避免 Feature 组件重复处理底层异常细节。

- Service 统一处理超时、校验失败、内部错误等 envelope 分支。
- Feature 组件不直接分支 `IPCError` 细节字段，只消费 Service 语义化结果。
- Service 层可实现一致的重试/降级策略，不向 Feature 泄漏通道层实现。

#### Scenario: IPC-P2-S3 Service 将 IPC 异常归一化为稳定错误语义 [ADDED]

- **假设** 底层 IPC 返回 `{ ok: false, error: { code: "IPC_TIMEOUT" } }`
- **当** Feature 通过 service 发起调用
- **则** Service 将错误归一化为可预期的业务错误结果
- **并且** Feature 层无需直接处理 `invoke` 异常或通道 envelope 细节
