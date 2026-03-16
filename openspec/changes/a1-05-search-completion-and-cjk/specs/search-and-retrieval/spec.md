# Delta Spec: search-and-retrieval — 搜索能力补完与 CJK 收敛

## 新增 Requirement: 搜索能力补完与 CJK 收敛

系统**必须**补齐当前处于未实现或受限状态的 `搜索能力补完与 CJK 收敛` 能力，使其从 factsheet 中的占位 / 受限项转化为可验证、可审计、可交付的真实产品能力。

### 本 change 的目标

- 补齐 Search All Projects / View More / 多结果域跳转
- 提升中文等 CJK 查询效果与 query normalization
- 让 SearchPanel 的 UI、store、IPC 和 retrieval spec 完整对齐

### Scenarios

#### Scenario: 跨项目搜索

- GIVEN 用户启用 Search All Projects；WHEN 输入查询词；THEN 面板返回多项目结果并允许安全跳转

#### Scenario: CJK 查询

- GIVEN 用户输入中文短语；WHEN 运行全文/混合检索；THEN 返回结果不再依赖过度精确匹配

### Non-Goals

- 不在本 change 中实现全新的搜索引擎
- 不做 unrelated UI 重设计
