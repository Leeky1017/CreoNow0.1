# Delta Spec: editor — InlineDiff 注册与应用闭环

## 新增 Requirement: InlineDiff 注册与应用闭环

系统**必须**补齐当前处于受限状态的 `InlineDiff 注册与应用闭环` 能力，使其从 factsheet 中的已知限制转化为可验证、可审计、可交付的真实产品能力。

### 本 change 的目标

- 将现有 InlineDiff 扩展真实注册到 editor 链路
- 定义内联差异展示、接受、拒绝与回退的最小闭环
- 让 editor spec、factsheet 与实现对这条能力的口径一致

### Scenarios

#### Scenario: 用户在编辑器中看到 InlineDiff 提案

- GIVEN AI 生成了一次可应用的文本修改；WHEN 修改进入 editor 链路；THEN 用户可以在编辑器中看到内联差异展示

#### Scenario: 用户接受或拒绝 InlineDiff

- GIVEN 编辑器中存在 InlineDiff 提案；WHEN 用户执行接受或拒绝；THEN 文档内容、状态与后续保存语义按预期更新

### Non-Goals

- 不在本 change 中重写双列 DiffView
- 不扩展新的 AI 技能类型
