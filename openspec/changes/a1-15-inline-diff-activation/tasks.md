# Tasks: InlineDiff 注册与应用闭环

- **GitHub Issue**: #1131（child issue；umbrella #1122）
- **分支**: 待创建（从 umbrella child issue 派生）
- **Delta Spec**: `specs/editor/spec.md`
- **前置依赖**: `a1-capability-closure-program` 已建立并登记到 EO

---

## 验收标准

| ID   | 标准                                                   |
| ---- | ------------------------------------------------------ |
| AC-1 | InlineDiff 在编辑器中真实注册并可被用户触达           |
| AC-2 | 接受 / 拒绝 / 回退语义与现有 AI 修改提案链路一致      |
| AC-3 | factsheet、editor spec 与实现口径同步                  |
| AC-4 | 关键展示与应用路径有最小行为级测试覆盖                 |

## Phase 0: Spec 对齐

- [ ] 复核 editor canonical spec 与 factsheet 中的 InlineDiff 现状口径
- [ ] 将本 change 的 delta spec 与当前仓库事实对齐
- [ ] 明确需要同步的展示、应用、回退与错误提示语义

## Phase 1: Red（测试先行）

- [ ] 为 InlineDiff 注册、展示与应用写失败测试
- [ ] 跑最小测试集，确认失败原因来自能力缺失而非测试本身错误
- [ ] 为接受 / 拒绝 / 回退与冲突边界补最小失败测试

## Phase 2: Green（最小实现）

- [ ] 仅实现让 Phase 1 测试变绿所需的最小 InlineDiff 闭环
- [ ] 补齐 editor、diff 与 AI 修改链路之间必要接线
- [ ] 确保用户可见文本、错误提示与交互边界符合仓库规范

## Phase 3: Verification & Delivery

- [ ] 跑本 change 对应的 unit / integration / storybook checks
- [ ] 更新 factsheet、spec 与相关文档
- [ ] 创建 PR，等待独立审计给出 `FINAL-VERDICT + ACCEPT`
- [ ] 合并后归档本 change

---

## Done 定义

- [ ] delta spec、实现、测试、factsheet 口径一致
- [ ] 本 change 的关键 scenario 有行为级测试覆盖
- [ ] PR 已合并到 `main`
- [ ] change 已归档