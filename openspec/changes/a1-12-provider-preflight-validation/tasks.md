# Tasks: Provider 前置校验与模型有效性提示

- **GitHub Issue**: #1127（child issue；umbrella #1122）
- **分支**: 待创建（从 umbrella child issue 派生）
- **Delta Spec**: `specs/ai-service/spec.md`
- **前置依赖**: `a1-capability-closure-program` 已建立并登记到 EO

---

## 验收标准

| ID   | 标准                                                   |
| ---- | ------------------------------------------------------ |
| AC-1 | API Key / 模型名 / provider 组合的无效输入能被前置拦截 |
| AC-2 | 设置页与调用链路展示一致、可理解、可本地化的失败提示   |
| AC-3 | factsheet、spec 与设置文案同步到真实能力边界           |
| AC-4 | 关键失败与成功路径有最小行为级测试覆盖                 |

## Phase 0: Spec 对齐

- [ ] 复核 ai-service canonical spec、factsheet 与设置文案中的 provider 能力口径
- [ ] 将本 change 的 delta spec 与当前仓库事实对齐
- [ ] 明确需要同步变更的校验入口、错误码与前端提示文案

## Phase 1: Red（测试先行）

- [ ] 为前置校验与失败提示写失败测试
- [ ] 跑最小测试集，确认失败原因来自能力缺失而非测试本身错误
- [ ] 为无效 provider / 模型组合与缺失 key 的边界路径补最小失败测试

## Phase 2: Green（最小实现）

- [ ] 仅实现让 Phase 1 测试变绿所需的最小前置校验能力
- [ ] 补齐设置、服务与错误提示之间必要接线
- [ ] 确保用户可见文本、错误提示、a11y 与 token 使用符合仓库规范

## Phase 3: Verification & Delivery

- [ ] 跑本 change 对应的 unit / integration / guard checks
- [ ] 更新 factsheet、spec 与设置文案
- [ ] 创建 PR，等待独立审计给出 `FINAL-VERDICT + ACCEPT`
- [ ] 合并后归档本 change

---

## Done 定义

- [ ] delta spec、实现、测试、factsheet 口径一致
- [ ] 本 change 的关键 scenario 有行为级测试覆盖
- [ ] PR 已合并到 `main`
- [ ] change 已归档