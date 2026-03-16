# Delta Spec: memory-system — 记忆语义能力与冲突处理升级

## 新增 Requirement: 记忆语义能力与冲突处理升级

系统**必须**补齐当前处于未实现或受限状态的 `记忆语义能力与冲突处理升级` 能力，使其从 factsheet 中的占位 / 受限项转化为可验证、可审计、可交付的真实产品能力。

### 本 change 的目标

- 把 reject / partial 纳入偏好学习权重
- 用真实 embedding 与蒸馏替代当前近似方案
- 提供 conflict resolution 的 UI 入口与处理流程

### Scenarios

#### Scenario: 负反馈学习

- GIVEN 用户 reject 或 partial AI 结果；WHEN memory pipeline 处理反馈；THEN 系统更新规则权重而非仅记录日志

#### Scenario: 冲突解决

- GIVEN Memory 面板显示冲突数量；WHEN 用户进入 conflict resolution；THEN 系统提供可操作的冲突处理界面与保存结果

### Non-Goals

- 不在本 change 中做云端 long-term memory
- 不重写全部 memory 面板 UI
