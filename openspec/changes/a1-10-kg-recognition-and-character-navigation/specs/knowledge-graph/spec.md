# Delta Spec: knowledge-graph — 知识图谱识别与角色导航收口

## 新增 Requirement: 知识图谱识别与角色导航收口

系统**必须**补齐当前处于未实现或受限状态的 `知识图谱识别与角色导航收口` 能力，使其从 factsheet 中的占位 / 受限项转化为可验证、可审计、可交付的真实产品能力。

### 本 change 的目标

- 升级实体识别能力与证据链
- 接通角色出场章节跳转
- 让 KG / editor / document navigation 三层协作一致

### Scenarios

#### Scenario: 出场章节跳转

- GIVEN 用户在角色详情页看到章节列表；WHEN 点击某条章节；THEN 编辑器打开对应文档并定位相关位置

#### Scenario: 识别升级

- GIVEN 用户保存或分析一段文本；WHEN 触发实体识别；THEN 返回结果具备高于当前规则基线的语义准确度

### Non-Goals

- 不在本 change 中重做图谱可视化布局
- 不引入 unrelated graph algorithms
