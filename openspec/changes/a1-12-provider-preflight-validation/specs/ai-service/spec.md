# Delta Spec: ai-service — Provider 前置校验与模型有效性提示

## 新增 Requirement: Provider 前置校验与模型有效性提示

系统**必须**补齐当前处于受限状态的 `Provider 前置校验与模型有效性提示` 能力，使其从 factsheet 中的模糊 follow-up 变为可验证、可审计、可交付的真实产品能力。

### 本 change 的目标

- 在请求发起前校验 API Key、模型名与 provider 组合是否有效
- 将失败原因转化为用户可理解的提示，而非让请求直接撞到 provider 侧错误
- 让 settings / factsheet / spec 对这条能力的口径一致

### Scenarios

#### Scenario: 无效模型名被前置拦截

- GIVEN 用户选择了当前 provider 不支持的模型；WHEN 发起请求；THEN 系统在本地前置拦截并返回可理解错误

#### Scenario: 缺失或无效 API Key 被设置页提示

- GIVEN 用户未填写必要 key 或 key 明显不满足最小校验；WHEN 保存或测试配置；THEN 设置页展示内联错误并阻止继续

### Non-Goals

- 不在本 change 中处理 provider 配额与计费展示
- 不在本 change 中引入新的 provider 类型
