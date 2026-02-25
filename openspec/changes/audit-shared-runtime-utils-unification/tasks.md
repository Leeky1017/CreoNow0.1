更新时间：2026-02-25 23:50

## 1. Specification

- [ ] 1.1 审阅并确认需求边界（nowTs/estimateTokenCount/hash 工具统一、魔法数字改常量）
- [ ] 1.2 审阅并确认错误路径与边界路径（必须覆盖：静态扫描无重复定义、迁移后行为一致、常量引用替换、防回归守卫）
- [ ] 1.3 审阅并确认验收阈值与不可变契约（测试确定性；tsc --noEmit 零错误；运行时行为与修改前一致；静态扫描无重复定义）
- [ ] 1.4 若存在上游依赖，先完成依赖同步检查（Dependency Sync Check）并记录"无漂移/已更新"；无依赖则标注 N/A（本 change：上游依赖 C4 `audit-ipc-result-unification`）

## 2. TDD Mapping（先测前提）

- [ ] 2.1 将 delta spec 的每个 Scenario 映射为至少一个测试用例
- [ ] 2.2 为每个测试标注对应 Scenario ID，建立可追踪关系
- [ ] 2.3 设定门禁：未出现 Red（失败测试）不得进入实现

### Scenario -> 测试映射

| Scenario ID | 测试文件                                                                                  | 计划用例名 / 断言块                                                                  |
| ----------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| AUD-C5-S1   | `apps/desktop/main/src/__tests__/unit/shared-nowts-no-duplicates.test.ts`                 | `static scan should find no local nowTs definitions outside shared module`            |
| AUD-C5-S2   | `apps/desktop/main/src/__tests__/unit/shared-nowts-no-duplicates.test.ts`                 | `shared nowTs should return value consistent with Date.now()`                        |
| AUD-C5-S3   | `apps/desktop/main/src/__tests__/unit/shared-token-count-no-duplicates.test.ts`           | `static scan should find no local estimateTokenCount definitions outside shared`     |
| AUD-C5-S4   | `apps/desktop/main/src/__tests__/unit/shared-token-count-no-duplicates.test.ts`           | `estimateUtf8TokenCount should return consistent results after migration`            |
| AUD-C5-S5   | `apps/desktop/main/src/__tests__/unit/shared-hash-no-duplicates.test.ts`                  | `static scan should find no local hash function definitions outside shared module`   |
| AUD-C5-S6   | `apps/desktop/main/src/__tests__/unit/magic-number-constants.test.ts`                     | `aiService max_tokens should reference DEFAULT_REQUEST_MAX_TOKENS_ESTIMATE`          |
| AUD-C5-S7   | `apps/desktop/main/src/__tests__/unit/magic-number-constants.test.ts`                     | `skillValidator timeoutMs should reference MAX_SKILL_TIMEOUT_MS`                     |
| AUD-C5-S8   | `apps/desktop/main/src/__tests__/unit/shared-utils-guard.test.ts`                         | `guard test should fail when new local nowTs or hashJson definition is introduced`   |

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
