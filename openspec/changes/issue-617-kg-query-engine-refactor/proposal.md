# 提案：issue-617-kg-query-engine-refactor

更新时间：2026-02-22 19:37

## 背景

KG 查询层存在多个 P0/P1 问题：全量拉图后在 JS 层遍历导致主线程长时间阻塞；递归 DFS 无深度保护可栈溢出；BFS 使用 `Array.shift()` 在大图下退化 O(n²)；实体匹配为同步 N×M 文本扫描。需要按“查询类型选择最佳策略”的混合重构，并将重 CPU/大查询卸载到 ComputeProcess。

## 变更内容

- 以递归 CTE 重写 `querySubgraph` 与 `queryPath`，并施加 maxDepth/maxVisited 等硬阈值。
- 将 `queryValidate` 从递归 DFS 改为迭代化（显式栈/队列），加入深度/访问上限保护。
- 实体匹配引入 Aho-Corasick（或等价多模式匹配自动机）以降低复杂度。
- BFS 队列使用 Deque（或等价结构）替换 `Array.shift()`，避免 O(n²) 退化。
- 计算密集路径迁移到 ComputeProcess 执行（依赖 UtilityProcess 基础设施）。

## 受影响模块

- knowledge-graph — 查询契约、性能阈值与超时降级语义需要补齐可验证契约点
- context-engine — Retrieved/Rules 注入依赖 KG 相关实体检索的稳定性与性能
- ipc — KG 查询超时/取消与 envelope 语义需保持一致

## 不做什么

- 不新增实体类型与核心领域枚举（Owner 决策边界不变）。
- 不在本 change 内重构 KG 写入语义（仅聚焦查询层与匹配/遍历策略）。
- 不在本 change 内引入 UI 侧知识图谱可视化扩展（仅后端）。

## 依赖关系

- 上游依赖：
  - `issue-617-utilityprocess-foundation`（ComputeProcess 执行环境）
  - `issue-617-scoped-lifecycle-and-abort`（超时/取消/资源回收语义）
- 下游依赖：
  - Context Engine 的稳定 retrieved 注入与性能目标（跨模块收益）

## 依赖同步检查（Dependency Sync Check）

- 核对输入：
  - `openspec/specs/knowledge-graph/spec.md`
  - `openspec/specs/context-engine/spec.md`
  - `openspec/specs/ipc/spec.md`
  - `/tmp/notion_cn_backend_vault/CN-Backend/CN 后端开发/KG 查询层重构.md`
  - `/tmp/notion_cn_backend_vault/CN-Backend/CN 后端开发/Agent 问题发现汇总（CN 后端审计）.md`
- 核对项：
  - 子图/路径/校验查询的上限与降级策略符合主 spec 的查询契约与性能阈值。
  - 超时/取消必须可中止底层计算，不得继续占用 ComputeProcess。
  - 匹配/遍历策略变更不改变对外结果语义（仅改善性能/稳定性）。
- 结论：`PENDING`

## 来源映射

| 来源                                   | 提炼结论                                                                | 落地位置                                    |
| -------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------- |
| `KG 查询层重构.md`                     | CTE 图遍历 + 迭代化 validate + Aho-Corasick 匹配 + Deque BFS 的混合策略 | `specs/knowledge-graph/spec.md`、`tasks.md` |
| `Agent 问题发现汇总（CN 后端审计）.md` | P0/P1 问题清单明确指向：全量拉图、递归栈溢出、shift 退化、N×M 匹配      | `tasks.md`、后续测试与实现                  |

## 审阅状态

- Owner 审阅：`PENDING`
