# Delta Spec: workbench — 设置界面能力收口

## 新增 Requirement: 设置界面能力收口

系统**必须**补齐当前处于未实现或受限状态的 `设置界面能力收口` 能力，使其从 factsheet 中的占位 / 受限项转化为可验证、可审计、可交付的真实产品能力。

### 本 change 的目标

- 决定并落地 Account 页的 v1 处置：真正实现，或以更诚实的 disabled / hide 策略重写
- 把 SettingsExport 与 ShortcutsPanel 接入 Settings / Help 的真实导航入口
- 收敛通用设置的未来能力边界文案，让 settings 与 factsheet 口径一致

### Scenarios

#### Scenario: 打开导出设置

- GIVEN 用户位于 Settings；WHEN 选择导出设置页；THEN Export settings 真正显示并可返回上级导航

#### Scenario: 查看快捷键面板

- GIVEN 用户从 Settings 或帮助入口进入快捷键；WHEN 面板打开；THEN 当前快捷键分组与展示可用且可关闭

### Non-Goals

- 不在本 change 中实现完整账号系统后端
- 不重做整个 Settings 信息架构
