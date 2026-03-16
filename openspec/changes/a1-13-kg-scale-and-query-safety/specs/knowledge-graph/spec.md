# Delta Spec: knowledge-graph — 知识图谱规模治理与查询安全

## 新增 Requirement: 知识图谱规模治理与查询安全

系统**必须**补齐当前处于受限状态的 `知识图谱规模治理与查询安全` 能力，使其从 factsheet 中的模糊后续编号转化为可验证、可审计、可交付的真实产品能力。

### 本 change 的目标

- 为实体列表、查询结果或等价读取路径补齐分页 / 分段策略
- 为 `queryPath` 增加循环防护、深度边界或等价安全约束
- 让 knowledge-graph spec、factsheet 与实现对规模治理口径一致

### Scenarios

#### Scenario: 大规模实体列表仍可浏览

- GIVEN 图谱实体数量显著增长；WHEN 用户浏览实体列表；THEN 系统以分页或等价分段机制保证可用性与可解释性

#### Scenario: 路径查询遇到循环关系时被安全收口

- GIVEN 图谱中存在循环关系；WHEN 用户或服务发起路径查询；THEN 系统不会无限遍历，并返回可预测结果或明确错误

### Non-Goals

- 不在本 change 中重写力导向图交互
- 不在本 change 中实现新的实体识别模型