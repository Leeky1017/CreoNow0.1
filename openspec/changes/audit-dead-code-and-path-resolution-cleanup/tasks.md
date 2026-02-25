更新时间：2026-02-25 23:50

## 1. Specification

- [ ] 1.1 审阅并确认需求边界（phase4-delivery-gate.ts 接入或删除, 模板/预加载路径确定性解析）
- [ ] 1.2 审阅并确认错误路径与边界路径（必须覆盖：模板文件缺失明确报错、preload 文件缺失明确报错、死代码守卫回归检测）
- [ ] 1.3 审阅并确认验收阈值与不可变契约（零孤立模块；路径解析无暴力搜索模式；缺失文件报错含确定路径信息）
- [ ] 1.4 若存在上游依赖，先完成依赖同步检查（Dependency Sync Check）并记录"无漂移/已更新"；无依赖则标注 N/A（本 change：上游依赖 C10 `audit-editor-save-queue-extraction`）

## 2. TDD Mapping（先测前提）

- [ ] 2.1 将 delta spec 的每个 Scenario 映射为至少一个测试用例
- [ ] 2.2 为每个测试标注对应 Scenario ID，建立可追踪关系
- [ ] 2.3 设定门禁：未出现 Red（失败测试）不得进入实现

### Scenario -> 测试映射

| Scenario ID | 测试文件                                                                                    | 计划用例名 / 断言块                                                                          |
| ----------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| AUD-C12-S1  | `apps/desktop/main/src/__tests__/unit/phase4-delivery-gate-disposal.test.ts`                | `phase4-delivery-gate should be production-imported or fully deleted with its test files`     |
| AUD-C12-S2  | `apps/desktop/main/src/__tests__/unit/dead-code-guard-continuity.test.ts`                   | `ping-dead-code-cleanup guard test should remain valid after phase4 disposal`                 |
| AUD-C12-S3  | `apps/desktop/main/src/__tests__/unit/template-path-deterministic-resolve.test.ts`          | `templateService should resolve path from build config without brute-force candidates`        |
| AUD-C12-S4  | `apps/desktop/main/src/__tests__/unit/template-path-missing-error.test.ts`                  | `templateService should throw clear error with expected path when template file missing`      |
| AUD-C12-S5  | `apps/desktop/main/src/__tests__/unit/preload-path-deterministic-resolve.test.ts`           | `main process should resolve preload path from build config without brute-force candidates`   |
| AUD-C12-S6  | `apps/desktop/main/src/__tests__/unit/preload-path-missing-error.test.ts`                   | `main process should throw clear error with expected path when preload file missing`          |

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
