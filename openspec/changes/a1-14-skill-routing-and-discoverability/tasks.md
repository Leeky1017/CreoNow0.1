# Tasks: Skill 路由发现性与关键词覆盖收口

- **GitHub Issue**: #1135（child issue；umbrella #1122）
- **分支**: 待创建（从 umbrella child issue 派生）
- **Delta Spec**: `specs/skill-system/spec.md`
- **前置依赖**: `a1-capability-closure-program` 已建立并登记到 EO

---

## 验收标准

| ID   | 标准                                                |
| ---- | --------------------------------------------------- |
| AC-1 | 当前高频 skill 的显式选择与路由触发边界对用户可解释 |
| AC-2 | 关键词覆盖、发现性提示与否定守卫的行为口径一致      |
| AC-3 | factsheet、spec 与技能触发实现同步                  |
| AC-4 | 关键路由与退化路径有最小行为级测试覆盖              |

## Phase 0: Spec 对齐

- [ ] 复核 skill-system canonical spec 与 factsheet 中的路由 / 发现性口径
- [ ] 将本 change 的 delta spec 与当前仓库事实对齐
- [ ] 明确需要同步的触发词、显式选择规则与发现性提示

## Phase 1: Red（测试先行）

- [ ] 为关键词覆盖、发现性提示与退化路径写失败测试
- [ ] 跑最小测试集，确认失败原因来自能力缺失而非测试本身错误
- [ ] 为否定守卫不回归、显式选择不受影响等边界场景补最小失败测试

## Phase 2: Green（最小实现）

- [ ] 仅实现让 Phase 1 测试变绿所需的最小路由 / 发现性能力
- [ ] 补齐 skill picker、后端路由与文案之间必要接线
- [ ] 确保用户可见文本、错误提示与能力边界符合仓库规范

## Phase 3: Verification & Delivery

- [ ] 跑本 change 对应的 unit / integration / guard / storybook checks
- [ ] 更新 factsheet、spec 与相关文档
- [ ] 创建 PR，等待独立审计给出 `FINAL-VERDICT + ACCEPT`
- [ ] 合并后归档本 change

---

## Done 定义

- [ ] delta spec、实现、测试、factsheet 口径一致
- [ ] 本 change 的关键 scenario 有行为级测试覆盖
- [ ] PR 已合并到 `main`
- [ ] change 已归档
