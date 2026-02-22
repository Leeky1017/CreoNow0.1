# Workbench Specification Delta

更新时间：2026-02-21 14:45

## Change: issue-604-windows-frameless-titlebar

### Requirement: 整体布局架构 [MODIFIED]

Workbench 在 Windows 桌面环境下必须支持无系统窗口装饰模式，并提供自定义标题栏作为应用顶层壳的一部分。

- Windows 渲染层顶部必须渲染自定义标题栏区域（高度固定）。
- 标题栏拖拽区域必须使用 `-webkit-app-region: drag`。
- 交互按钮区域必须使用 `-webkit-app-region: no-drag`，避免点击误拖拽。
- 标题内容优先显示当前项目名，项目未加载时回退显示 `CreoNow`。

#### Scenario: Windows 启动时显示自定义标题栏 [ADDED]

- **假设** 运行环境为 Windows，窗口控制能力可用
- **当** App 根布局渲染
- **则** 顶部渲染自定义标题栏
- **并且** 标题显示当前项目名（若无则显示 `CreoNow`）

#### Scenario: 非 Windows 平台不显示自定义标题栏 [ADDED]

- **假设** 运行环境为非 Windows，窗口控制能力不可用
- **当** App 根布局渲染
- **则** 不渲染自定义标题栏
- **并且** 应用主体布局保持既有行为

### Requirement: Window Controls（窗口控件）[ADDED]

自定义标题栏必须提供最小化、最大化/还原、关闭按钮，并通过 IPC 调用主进程窗口行为。

- 三个按钮分别绑定 `minimize`、`toggle maximize`、`close`。
- 当窗口为最大化状态时，第二按钮展示“还原”语义。
- 双击标题栏拖拽区应触发最大化/还原切换。

#### Scenario: 点击窗口控件触发 IPC [ADDED]

- **假设** 标题栏已渲染且窗口控制可用
- **当** 用户点击最小化/最大化(还原)/关闭按钮
- **则** 渲染层分别调用对应 IPC 通道
- **并且** 主进程执行对应窗口行为
