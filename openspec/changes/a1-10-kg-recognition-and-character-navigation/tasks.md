# Tasks: 知识图谱识别与角色导航收口

- **GitHub Issue**: #1136（child issue；umbrella #1122）
- **分支**: 待创建（从 umbrella child issue 派生）
- **Delta Spec**: `specs/knowledge-graph/spec.md`
- **前置依赖**: `a1-capability-closure-program` 已建立并登记到 EO

---

## 验收标准

| ID   | 标准                                      |
| ---- | ----------------------------------------- |
| AC-1 | 出场章节列表点击后能跳转到目标文档 / 位置 |
| AC-2 | 实体识别从 mock/规则态升级到更高精度方案  |
| AC-3 | 失败路径和降级策略对用户可见              |

---

## Phase 0: Spec 对齐

- [ ] 复核当前 canonical spec、factsheet 与 release 边界文档中的现状口径
- [ ] 将本 change 的 delta spec 与当前仓库事实对齐
- [ ] 明确需要同步变更的上游 / 下游 spec 与事实文档

## Phase 1: Red（测试先行）

- [ ] 为新增 public behavior 写失败测试
- [ ] 跑最小测试集，确认失败原因来自能力缺失而非测试本身错误
- [ ] 为关键错误路径与边界路径补最小失败测试

## Phase 2: Green（最小实现）

- [ ] 仅实现让 Phase 1 测试变绿所需的最小能力闭环
- [ ] 补齐 IPC / store / UI / service 之间必要接线
- [ ] 确保用户可见文本、错误提示、a11y 与 token 使用符合仓库规范

## Phase 3: Verification & Delivery

- [ ] 跑本 change 对应的 unit / integration / guard / storybook / script checks
- [ ] 更新 factsheet、release 文档或边界文档（若本 change 改变对外能力口径）
- [ ] 创建 PR，等待独立审计给出 `FINAL-VERDICT + ACCEPT`
- [ ] 合并后归档本 change

---

## Done 定义

- [ ] delta spec、实现、测试、factsheet 口径一致
- [ ] 本 change 的关键 scenario 有行为级测试覆盖
- [ ] PR 已合并到 `main`
- [ ] change 已归档
