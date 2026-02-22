# IPC Specification Delta

更新时间：2026-02-21 14:45

## Change: issue-604-windows-frameless-titlebar

### Requirement: 通道命名规范 [MODIFIED]

新增窗口控制通道必须遵循既有 `<domain>:<resource>:<action>` 规则，并归入 `app` domain。

新增通道：

- `app:window:getstate`
- `app:window:minimize`
- `app:window:togglemaximized`
- `app:window:close`

#### Scenario: 新通道命名校验通过 [ADDED]

- **假设** 开发者在 IPC 契约中新增 `app:window:*` 通道
- **当** 运行契约生成脚本
- **则** 所有通道命名通过规范校验
- **并且** 自动生成类型文件包含上述通道

### Requirement: 三种通信模式 [MODIFIED]

窗口控制通道使用 Request-Response 模式，统一返回 IPC Envelope。

- `app:window:getstate`：返回窗口控制能力和窗口状态。
- `app:window:minimize`：执行最小化。
- `app:window:togglemaximized`：在最大化与还原之间切换。
- `app:window:close`：执行关闭窗口。

非 Windows 平台下：

- `getstate` 返回 `controlsEnabled=false`；
- 操作类通道返回 `UNSUPPORTED`。

#### Scenario: 非 Windows 操作类通道返回 UNSUPPORTED [ADDED]

- **假设** 当前平台不是 Windows
- **当** 渲染层调用 `app:window:minimize`（或其他操作类窗口通道）
- **则** 主进程返回 `{ ok: false, error: { code: "UNSUPPORTED" } }`
- **并且** 不执行任何窗口动作

#### Scenario: 无窗口上下文返回 NOT_FOUND [ADDED]

- **假设** IPC 调用时无法从 event 解析到 `BrowserWindow`
- **当** 调用操作类窗口通道
- **则** 返回 `{ ok: false, error: { code: "NOT_FOUND" } }`
- **并且** 调用方可据此进行安全降级
