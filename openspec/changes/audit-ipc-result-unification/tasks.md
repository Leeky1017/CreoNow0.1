更新时间：2026-02-25 23:50

## 1. Specification

- [ ] 1.1 审阅并确认需求边界（ipcError/ServiceResult 统一收敛到 shared 模块、34 文件迁移、签名变体统一）
- [ ] 1.2 审阅并确认错误路径与边界路径（必须覆盖：共享模块导出完整性、本地重复定义消除、签名变体兼容、防回归守卫）
- [ ] 1.3 审阅并确认验收阈值与不可变契约（测试确定性；tsc --noEmit 零错误；迁移后运行时行为一致；静态扫描无重复定义）
- [ ] 1.4 若存在上游依赖，先完成依赖同步检查（Dependency Sync Check）并记录"无漂移/已更新"；无依赖则标注 N/A（本 change：上游依赖 C2 `audit-fatal-error-visibility-guardrails`）

## 2. TDD Mapping（先测前提）

- [ ] 2.1 将 delta spec 的每个 Scenario 映射为至少一个测试用例
- [ ] 2.2 为每个测试标注对应 Scenario ID，建立可追踪关系
- [ ] 2.3 设定门禁：未出现 Red（失败测试）不得进入实现

### Scenario -> 测试映射

| Scenario ID | 测试文件                                                                                  | 计划用例名 / 断言块                                                                  |
| ----------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| AUD-C4-S1   | `apps/desktop/main/src/__tests__/unit/ipc-result-shared-exports.test.ts`                  | `shared module should export complete ipcError signature with options`                |
| AUD-C4-S2   | `apps/desktop/main/src/__tests__/unit/ipc-result-no-local-duplicates.test.ts`             | `static scan should find no local ipcError or ServiceResult definitions`             |
| AUD-C4-S3   | `apps/desktop/main/src/__tests__/contract/ipc-result-migration-compat.contract.test.ts`   | `tsc and all existing tests should pass after migration`                             |
| AUD-C4-S4   | `apps/desktop/main/src/__tests__/contract/ipc-result-migration-compat.contract.test.ts`   | `signature variant callers should behave identically after unification`               |
| AUD-C4-S5   | `apps/desktop/main/src/__tests__/unit/ipc-result-no-local-duplicates.test.ts`             | `guard test should fail when new local ipcError definition is introduced`            |

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
