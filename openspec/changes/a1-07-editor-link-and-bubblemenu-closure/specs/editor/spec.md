# Delta Spec: editor — 编辑器链接与 BubbleMenu 收口

## 新增 Requirement: 编辑器链接与 BubbleMenu 收口

系统**必须**补齐当前处于未实现或受限状态的 `编辑器链接与 BubbleMenu 收口` 能力，使其从 factsheet 中的占位 / 受限项转化为可验证、可审计、可交付的真实产品能力。

### 本 change 的目标

- 提供创建 / 编辑 / 清除链接的真实交互
- 让 BubbleMenu 的链接行为与 Editor / Selection 状态一致
- 补齐 i18n、a11y、测试与 Storybook 覆盖

### Scenarios

#### Scenario: 创建链接

- GIVEN 用户选中文本；WHEN 在 BubbleMenu 中输入 URL 并确认；THEN 文本被赋予正确链接 mark

#### Scenario: 编辑链接

- GIVEN 用户选中了已有链接文本；WHEN 打开链接编辑 UI；THEN 可修改或移除现有 URL

### Non-Goals

- 不在本 change 中重做整个 BubbleMenu 布局
- 不实现外部网页预览
