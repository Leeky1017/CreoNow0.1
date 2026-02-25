# Knowledge Graph Specification Delta

更新时间：2026-02-22 19:37

## Change: issue-617-kg-query-engine-refactor

### Requirement: KG 查询引擎必须可限额、可中止并满足性能阈值 [ADDED]

KG 查询层**必须**避免主线程阻塞与不可控遍历，并提供可验证的上限与降级策略：

- `querySubgraph` 必须显式受 `maxDepth` 等限制约束。
- `queryPath` 必须返回最短路径并具备早停策略（找到即停）。
- `queryValidate` 必须避免递归栈溢出，采用迭代化遍历并施加 `maxDepth` / `maxVisited` 等保护。

#### Scenario: BE-KGQ-S1 子图查询遵守 maxDepth 并返回成本指标 [ADDED]

- **假设** 用户请求 `querySubgraph`（k-hop 子图）
- **当** 执行子图查询并指定 `maxDepth`
- **则** 返回结果不会超过 `maxDepth` 的遍历范围
- **并且** 响应包含 `nodeCount/edgeCount/queryCostMs`（或等价可观测指标）

#### Scenario: BE-KGQ-S2 最短路径查询返回最短路径并早停 [ADDED]

- **假设** 用户请求 `queryPath(A, B)` 并指定最大深度/节点扩展上限
- **当** 系统找到一条可达路径
- **则** 返回最短路径结果并停止继续扩展
- **并且** 不会在找到结果后继续执行无意义遍历

#### Scenario: BE-KGQ-S3 校验查询不栈溢出且遵守 maxDepth [ADDED]

- **假设** 图结构存在深链或异常结构
- **当** 执行 `queryValidate`
- **则** 系统不会触发递归栈溢出
- **并且** 遍历严格遵守 `maxDepth`（超限时返回稳定的 violation/错误语义）

### Requirement: 实体匹配必须避免同步 N×M 扫描并支持多模式匹配 [ADDED]

实体匹配**必须**在大规模实体/别名集下保持可用，并避免同步 N×M 文本扫描退化。

#### Scenario: BE-KGQ-S4 实体匹配可在一次扫描中匹配多实体 [ADDED]

- **假设** 需要在一段文本中匹配多个实体及其别名
- **当** 执行实体匹配
- **则** 匹配过程采用多模式匹配（如 Aho-Corasick 或等价自动机）一次扫描完成
- **并且** 匹配结果稳定且不依赖实体数量线性放大主线程阻塞
