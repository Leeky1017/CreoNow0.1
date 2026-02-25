更新时间：2026-02-25 08:49

## 1. Specification

- [x] 1.1 审阅并确认需求边界（KG 查询层：subgraph/path/validate/matcher；ComputeProcess 执行）
- [x] 1.2 审阅并确认错误路径与边界路径（超时/取消、maxDepth/maxVisited、循环关系、负载过高降级）
- [x] 1.3 审阅并确认验收阈值与不可变契约（结果语义不变；性能阈值可验证；无栈溢出）
- [x] 1.4 若存在上游依赖，先完成依赖同步检查（Dependency Sync Check）并记录“无漂移/已更新”；无依赖则标注 N/A

## 2. TDD Mapping（先测前提）

- [x] 2.1 将 delta spec 的每个 Scenario 映射为至少一个测试用例
- [x] 2.2 为每个测试标注对应 Scenario ID，建立可追踪关系
- [x] 2.3 设定门禁：未出现 Red（失败测试）不得进入实现

### 依赖同步检查（Dependency Sync Check）记录

- 结论：`NO_DRIFT`
- 核对输入：
  - `openspec/changes/archive/issue-617-utilityprocess-foundation/**`
  - `openspec/changes/archive/issue-617-scoped-lifecycle-and-abort/**`
  - `openspec/changes/archive/issue-617-kg-query-engine-refactor/{proposal.md,specs/knowledge-graph/spec.md,tasks.md}`
  - `openspec/changes/EXECUTION_ORDER.md`

### Scenario -> 测试映射

| Scenario ID | 测试文件                                                                                   | 计划用例名 / 断言块                                                    |
| ----------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| BE-KGQ-S1   | `apps/desktop/main/src/services/kg/__tests__/kg-cte-query.subgraph.contract.test.ts`       | `querySubgraph should respect maxDepth and return nodeCount/edgeCount` |
| BE-KGQ-S2   | `apps/desktop/main/src/services/kg/__tests__/kg-cte-query.path.contract.test.ts`           | `queryPath should return shortest path and stop at LIMIT 1`            |
| BE-KGQ-S3   | `apps/desktop/main/src/services/kg/__tests__/kg-validate.iterative.contract.test.ts`       | `queryValidate should not overflow stack and should enforce maxDepth`  |
| BE-KGQ-S4   | `apps/desktop/main/src/services/kg/__tests__/entity-matcher.aho-corasick.contract.test.ts` | `entityMatcher should match multiple entities in one pass`             |

## 3. Red（先写失败测试）

- [x] 3.1 编写 Happy Path 的失败测试并确认先失败
- [x] 3.2 编写 Edge Case 的失败测试并确认先失败
- [x] 3.3 编写 Error Path 的失败测试并确认先失败

## 4. Green（最小实现通过）

- [x] 4.1 仅实现让 Red 转绿的最小代码
- [x] 4.2 逐条使失败测试通过，不引入无关功能

## 5. Refactor（保持绿灯）

- [x] 5.1 去重与重构，保持测试全绿
- [x] 5.2 不改变已通过的外部行为契约

## 6. Evidence

- [x] 6.1 记录 RUN_LOG（含 Red 失败证据、Green 通过证据与关键命令输出）
- [x] 6.2 记录 Dependency Sync Check 的输入、核对结论与后续动作（无漂移/已更新）
- [x] 6.3 记录 Main Session Audit（Audit-Owner/Reviewed-HEAD-SHA=签字提交 HEAD^/三项 PASS/Blocking-Issues=0/Decision=ACCEPT），并确认签字提交仅变更当前任务 RUN_LOG
