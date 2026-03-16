# Delta Spec: version-control — 版本恢复能力接通

## 新增 Requirement: 版本恢复能力接通

系统**必须**补齐当前处于未实现或受限状态的 `版本恢复能力接通` 能力，使其从 factsheet 中的占位 / 受限项转化为可验证、可审计、可交付的真实产品能力。

### 本 change 的目标

- 启用 Restore 按钮和恢复确认流程
- 定义恢复后的 autosave、version marker、editor refresh 行为
- 让 factsheet / spec / tests 一致描述恢复能力

### Scenarios

#### Scenario: 恢复历史版本

- GIVEN 用户在版本历史中选择一个旧版本；WHEN 点击 Restore 并确认；THEN 当前文档回到该版本内容并记录恢复操作

#### Scenario: 恢复失败

- GIVEN 恢复过程中发生冲突或 IO 错误；WHEN 恢复失败；THEN 用户获得可理解错误且当前内容不被静默覆盖

### Non-Goals

- 不在本 change 中重写 entire branching UI
- 不实现跨项目版本恢复
