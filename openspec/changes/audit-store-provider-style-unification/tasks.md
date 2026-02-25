更新时间：2026-02-25 23:50

## 1. Specification

- [ ] 1.1 审阅并确认需求边界（5 个 .ts store 改 .tsx + JSX, lint 规则防回归）
- [ ] 1.2 审阅并确认错误路径与边界路径（必须覆盖：文件重命名后 import 路径同步、Provider 渲染行为一致性、lint 规则检测 React.createElement 回归）
- [ ] 1.3 审阅并确认验收阈值与不可变契约（store 目录零 React.createElement；tsc --noEmit 通过；Provider 渲染输出不变；lint 规则阻止回归）
- [ ] 1.4 若存在上游依赖，先完成依赖同步检查（Dependency Sync Check）并记录"无漂移/已更新"；无依赖则标注 N/A（本 change：上游依赖 C8 `audit-type-contract-alignment`）

## 2. TDD Mapping（先测前提）

- [ ] 2.1 将 delta spec 的每个 Scenario 映射为至少一个测试用例
- [ ] 2.2 为每个测试标注对应 Scenario ID，建立可追踪关系
- [ ] 2.3 设定门禁：未出现 Red（失败测试）不得进入实现

### Scenario -> 测试映射

| Scenario ID | 测试文件                                                                                    | 计划用例名 / 断言块                                                                          |
| ----------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| AUD-C14-S1  | `apps/desktop/renderer/src/__tests__/unit/store-provider-jsx-unification.test.ts`           | `all store files should be .tsx with JSX syntax and zero React.createElement in store dir`    |
| AUD-C14-S2  | `apps/desktop/renderer/src/__tests__/unit/store-rename-import-paths.test.ts`                | `tsc --noEmit should pass with no unresolved module references after .ts to .tsx rename`      |
| AUD-C14-S3  | `apps/desktop/renderer/src/__tests__/unit/store-provider-render-parity.test.ts`             | `store Provider render output should be identical before and after JSX migration`             |
| AUD-C14-S4  | `apps/desktop/renderer/src/__tests__/unit/store-provider-lint-guard.test.ts`                | `lint rule should error on React.createElement in store files and block CI merge`             |

## 3. Red（先写失败测试）

- [ ] 3.1 编写 Happy Path 的失败测试并确认先失败
- [ ] 3.2 编写 Edge Case 的失败测试并确认先失败
- [ ] 3.3 编写 Error Path 的失败测试并确认先失败

## 4. Green（最小实现通过）

- [ ] 4.1 仅实现让 Red 转绿的最小代码
- [ ] 4.2 逐条使失败测试通过，不引入无关功能

## 5. Refactor（保持绿灯）

- [ ] 5.1 去重与重构，保持测试全绿
- [ ] 5.2 不改变已通过的外部行为契约

## 6. Evidence

- [ ] 6.1 记录 RUN_LOG（含 Red 失败证据、Green 通过证据与关键命令输出）
- [ ] 6.2 记录 Dependency Sync Check 的输入、核对结论与后续动作（无漂移/已更新）
- [ ] 6.3 记录 Main Session Audit（Audit-Owner/Reviewed-HEAD-SHA=签字提交 HEAD^/三项 PASS/Blocking-Issues=0/Decision=ACCEPT），并确认签字提交仅变更当前任务 RUN_LOG
