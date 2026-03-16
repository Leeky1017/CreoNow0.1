# Tasks: 知识图谱规模治理与查询安全

- **GitHub Issue**: #1137（child issue；umbrella #1122）
- **分支**: 待创建（从 umbrella child issue 派生）
- **Delta Spec**: `specs/knowledge-graph/spec.md`
- **前置依赖**: `a1-capability-closure-program` 已建立并登记到 EO

---

## 验收标准

| ID   | 标准                                                     |
| ---- | -------------------------------------------------------- |
| AC-1 | KG 列表或相关读取入口在规模增长时仍具备明确分页/分段行为 |
| AC-2 | `queryPath` 等查询链路具备循环防护或等价安全边界         |
| AC-3 | factsheet、spec 与查询/列表实现口径一致                  |
| AC-4 | 关键边界场景有最小行为级测试覆盖                         |

## Phase 0: Spec 对齐

- [ ] 复核 knowledge-graph canonical spec 与 factsheet 中的规模治理口径
- [ ] 将本 change 的 delta spec 与当前仓库事实对齐
- [ ] 明确需要同步的查询边界、分页策略与错误提示

## Phase 1: Red（测试先行）

- [ ] 为分页、循环保护与大规模查询边界写失败测试
- [ ] 跑最小测试集，确认失败原因来自能力缺失而非测试本身错误
- [ ] 为查询膨胀与边界错误路径补最小失败测试

## Phase 2: Green（最小实现）

- [ ] 仅实现让 Phase 1 测试变绿所需的最小规模治理能力
- [ ] 补齐服务、查询契约与前端展示之间必要接线
- [ ] 确保用户可见文本、错误提示与性能边界符合仓库规范

## Phase 3: Verification & Delivery

- [ ] 跑本 change 对应的 unit / integration / guard checks
- [ ] 更新 factsheet、spec 与相关文档
- [ ] 创建 PR，等待独立审计给出 `FINAL-VERDICT + ACCEPT`
- [ ] 合并后归档本 change

---

## Done 定义

- [ ] delta spec、实现、测试、factsheet 口径一致
- [ ] 本 change 的关键 scenario 有行为级测试覆盖
- [ ] PR 已合并到 `main`
- [ ] change 已归档
