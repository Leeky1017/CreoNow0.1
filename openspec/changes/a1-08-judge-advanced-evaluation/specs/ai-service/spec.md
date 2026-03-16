# Delta Spec: ai-service — Judge 高级评估闭环

## 新增 Requirement: Judge 高级评估闭环

系统**必须**补齐当前处于未实现或受限状态的 `Judge 高级评估闭环` 能力，使其从 factsheet 中的占位 / 受限项转化为可验证、可审计、可交付的真实产品能力。

### 本 change 的目标

- 为 advanced checks 定义 provider、prompt、fallback 与评分输出结构
- 让 QualityPanel 与 candidate scoring 用上真实高级结果
- 保留 partialChecksSkipped 的诚实降级路径

### Scenarios

#### Scenario: 高级 Judge 成功

- GIVEN provider 可用且内容待评估；WHEN 执行 Judge；THEN 返回基础规则 + 高级语义结果

#### Scenario: 高级 Judge 降级

- GIVEN advanced provider 失败；WHEN 执行 Judge；THEN 仍返回基础规则结果并标记 partialChecksSkipped

### Non-Goals

- 不强制所有 Judge 逻辑都依赖远程模型
- 不在本 change 中重做 AI 面板布局
