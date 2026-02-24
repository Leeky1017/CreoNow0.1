# Editor Specification Delta

更新时间：2026-02-23 14:32

## Change: issue-606-phase-3-quality-uplift

### Requirement: 富文本编辑器基础排版 [MODIFIED]

Editor 排版必须从“可用”升级为“可扩展且可本地化”：

- 编辑器正文、标题、注释、辅助信息必须统一引用 Typography token，禁止散写硬编码字号/行高。
- 必须补全 CJK 场景 token（例如 `--text-editor-line-height-cjk`），用于中文密集段落的可读性与扩展性。
- 编辑区域排版应支持系统字体缩放，不得因 token 缺失导致布局断裂。

#### Scenario: ED-TYPO-01 CJK 场景使用补全后的行高 token [ADDED]

- **假设** 文档以中文段落为主，包含长句与密集标点
- **当** 编辑器渲染正文
- **则** 行高策略使用 CJK 友好 token
- **并且** 与默认正文 token 保持可配置切换能力

#### Scenario: ED-TYPO-02 系统字体缩放下排版保持稳定 [ADDED]

- **假设** 用户系统字体缩放为 125% 或 150%
- **当** 编辑器与工具栏共同渲染
- **则** 正文、标题、辅助文字的层级关系保持一致
- **并且** 不出现文本截断、行高重叠或工具栏错位

### Requirement: 编辑器滚动容器统一 [ADDED]

Editor 域可滚动区域必须统一到 `ScrollArea` 抽象：

- 编辑主内容区、Outline 列表、Diff 对比列表等长内容区域必须使用 `ScrollArea`。
- 工具栏、状态条、关键操作区不得与内容滚动绑定，避免滚动时交互控件丢失。
- 业务组件禁止散写根级 `overflow-auto` 作为默认滚动方案。

#### Scenario: ED-SCROLL-01 大纲长列表通过 ScrollArea 独立滚动 [ADDED]

- **假设** 当前文档含 100+ 大纲节点
- **当** 用户在 Outline 面板滚动并使用键盘导航定位节点
- **则** 大纲内容在 `ScrollArea.Viewport` 中滚动
- **并且** 面板头部与筛选控件保持固定可用

#### Scenario: ED-SCROLL-02 Diff 视图滚动不影响工具条可达性 [ADDED]

- **假设** Diff 结果包含大量行级变更
- **当** 用户滚动查看变更
- **则** 变更内容由统一滚动容器承载
- **并且** 上方操作条（接受/拒绝/跳转）始终可达

### Requirement: 编辑器微交互与动画编排 [ADDED]

Editor 域动效必须遵循统一 Motion Choreography 契约：

- Bubble Menu、Toolbar 按钮、Diff 交互态、AI 内联确认等组件禁止 `transition-all`。
- 动效时长与缓动必须使用统一 token，不得直接写死 `duration-300`、`ease` 等字面值。
- reduced motion 模式必须关闭非必要 transform/opacity 序列动画，但保留语义状态变化。

#### Scenario: ED-MOTION-01 编辑器交互从 transition-all 收敛到属性级过渡 [ADDED]

- **假设** Bubble Menu 与 Toolbar 存在 hover/active 动效
- **当** 执行动效契约校验
- **则** 组件仅允许声明具体过渡属性
- **并且** 未豁免的 `transition-all` 被识别为违规

#### Scenario: ED-MOTION-02 reduced motion 下关闭非必要动画 [ADDED]

- **假设** 用户启用了 `prefers-reduced-motion: reduce`
- **当** 打开 Bubble Menu、切换 Diff 视图或触发 AI 内联确认
- **则** transform/opacity 序列动画降级为 0ms 或静态切换
- **并且** 交互结果与常规模式语义一致

### Requirement: 可访问性与测试策略 [ADDED]

Editor 必须把 a11y 与测试策略绑定为可执行契约：

- Toolbar/BubbleMenu 按钮必须具备 `aria-label`、`aria-pressed` 与可预测键盘操作路径。
- 所有可交互元素必须在键盘导航时显示统一 focus-visible 指示。
- 视觉回归基线必须覆盖默认态、focus 态、reduced-motion 态、暗色态，且与组件测试联动。

#### Scenario: ED-A11Y-01 纯键盘完成格式化操作路径 [ADDED]

- **假设** 用户仅使用键盘编辑文档
- **当** 用户通过 Tab/Shift+Tab 聚焦工具栏并触发快捷键或 Enter 操作
- **则** 格式化动作可被完整执行
- **并且** 当前聚焦按钮的焦点样式清晰可见

#### Scenario: ED-TEST-01 视觉回归与可访问性基线协同拦截回归 [ADDED]

- **假设** 一次样式或组件改动影响 Editor 外观
- **当** 运行组件测试与视觉回归测试
- **则** 预期外的可见性回退、焦点不可见、状态样式漂移会被阻断
- **并且** 仅已审核通过的基线变更可更新快照
