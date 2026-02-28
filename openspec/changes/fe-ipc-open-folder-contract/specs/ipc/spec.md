# IPC Specification Delta

更新时间：2026-02-28 19:20

## Change: fe-ipc-open-folder-contract

### Requirement: 新增 dialog:open-folder IPC 通道 [ADDED]

系统必须提供 `dialog:open-folder` IPC 通道，用于在主进程安全地打开系统目录选择器。

#### Scenario: 用户取消选择必须返回 null [ADDED]

- **假设** 用户打开“选择文件夹”对话框
- **当** 用户点击取消
- **则** IPC 返回值必须为 `null`

#### Scenario: 选择目录必须返回目录绝对路径 [ADDED]

- **假设** 用户在对话框中选择了一个目录
- **当** 对话框确认
- **则** IPC 返回值必须为该目录的绝对路径字符串
- **并且** 不得返回文件路径
