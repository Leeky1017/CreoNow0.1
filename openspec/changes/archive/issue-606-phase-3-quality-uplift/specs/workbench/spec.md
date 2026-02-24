# Workbench Specification Delta

更新时间：2026-02-23 14:32

## Change: issue-606-phase-3-quality-uplift

### Requirement: 整体布局架构 [MODIFIED]

Workbench 在保持“整页不滚动 + 分区独立滚动”约束不变的前提下，必须统一滚动容器抽象：

- 左侧 Sidebar 内容区、右侧 Panel 内容区、命令结果长列表必须由 `ScrollArea` 承载。
- 业务组件不得直接在容器根节点散写 `overflow-auto/overflow-y-auto`，仅允许在 `ScrollArea.Viewport` 内定义滚动行为。
- 顶部标题区与底部状态区必须固定，滚动只发生在内容视口层。

#### Scenario: WB-SCROLL-01 侧栏溢出区域统一使用 ScrollArea [ADDED]

- **假设** 左侧 Sidebar 内容超过可视高度（如文件树 200+ 条节点）
- **当** 用户滚动侧栏
- **则** 仅 `ScrollArea.Viewport` 发生滚动
- **并且** 侧栏标题与折叠控件保持固定位置

#### Scenario: WB-SCROLL-02 右侧面板滚动与标签栏解耦 [ADDED]

- **假设** 右侧 AI/Info 面板内容超过可视高度
- **当** 用户滚轮或触控板滚动
- **则** 标签栏与面板头部保持固定
- **并且** 内容区域通过统一 `ScrollArea` 滚动

### Requirement: 微交互与动画编排 [ADDED]

Workbench 交互动效必须使用统一的 Motion Choreography 契约：

- 禁止在交互组件中使用宽泛 `transition-all`（除非该组件在规范中被明确豁免）。
- 过渡属性必须显式声明（例如 `transition-colors`、`transition-opacity`、`transition-[width,opacity]`、`transition-transform`）。
- 过渡时长必须引用 `var(--duration-fast|normal|slow)`，缓动必须引用 `var(--ease-default|ease-in|ease-out|ease-in-out)`。

#### Scenario: WB-MOTION-01 transition-all 收敛为属性级过渡 [ADDED]

- **假设** Workbench 组件存在历史 `transition-all`
- **当** 执行动效契约校验
- **则** 交互组件只允许使用显式过渡属性
- **并且** 未在豁免清单中的 `transition-all` 会被门禁阻断

#### Scenario: WB-MOTION-02 过渡时长与缓动统一引用 token [ADDED]

- **假设** IconBar、Sidebar、RightPanel 等发生 hover/expand/collapse 过渡
- **当** 样式渲染执行
- **则** 过渡时长来自 `duration` token
- **并且** 缓动来自 `ease` token，不得出现硬编码 `200ms`/`ease` 字面值

### Requirement: 可访问性与键盘导航 [ADDED]

Workbench 必须将 reduced motion 与 keyboard/focus 作为同级交互契约：

- 当系统 `prefers-reduced-motion: reduce` 时，非必要动画（transform/opacity 序列）必须降级为 0ms 或无动画切换。
- 所有可交互元素必须有可见 `focus-visible` 指示（基于 `--color-ring-focus` 与 ring token）。
- 主导航、侧栏、右栏切换路径必须支持纯键盘操作（Tab、Shift+Tab、Enter/Space、Esc）。

#### Scenario: WB-A11Y-01 系统启用 reduced motion 时动画自动降级 [ADDED]

- **假设** 用户系统偏好为 reduced motion
- **当** 用户触发侧栏展开、面板切换、弹层出现
- **则** 非必要动画降级为 0ms
- **并且** 状态切换结果与非 reduced motion 模式保持一致

#### Scenario: WB-A11Y-02 键盘导航与 focus-visible 指示一致 [ADDED]

- **假设** 用户不使用鼠标，仅使用键盘操作 Workbench
- **当** 用户按 Tab/Shift+Tab 在导航、侧栏、主区、右栏之间移动
- **则** 焦点顺序符合视觉与语义顺序
- **并且** 当前焦点元素始终有清晰可见的 focus ring

### Requirement: 视觉回归与质量门禁 [ADDED]

Workbench 必须引入以 Storybook 为中心的视觉回归策略，并将其作为“提质”门禁：

- 关键组件必须提供默认态、hover/focus 态、reduced-motion 态、暗色主题态基线。
- 视觉回归对比必须区分“预期内 token 收敛”与“预期外布局漂移”。
- 预期外差异必须在合并前修复，不得以人工口头说明替代。

#### Scenario: WB-TEST-01 视觉回归门禁拦截非预期样式漂移 [ADDED]

- **假设** 某次改动引入 Workbench 样式变更
- **当** 运行视觉回归测试
- **则** 仅已批准的基线差异可通过
- **并且** 未批准的布局偏移/可见性回退会阻断门禁
