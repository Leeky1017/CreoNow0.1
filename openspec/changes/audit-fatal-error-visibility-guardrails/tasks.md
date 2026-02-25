更新时间：2026-02-25 23:50

## 1. Specification

- [ ] 1.1 审阅并确认需求边界（关键空 catch 修复：index.ts fatal log stderr fallback、CreateProjectDialog error visibility）
- [ ] 1.2 审阅并确认错误路径与边界路径（必须覆盖：日志写入失败、stderr fallback 自身失败、项目创建 IPC 异常、用户可读错误提示）
- [ ] 1.3 审阅并确认验收阈值与不可变契约（测试确定性；进程不因 fallback 失败崩溃；错误提示必须用户可见）
- [ ] 1.4 若存在上游依赖，先完成依赖同步检查（Dependency Sync Check）并记录"无漂移/已更新"；无依赖则标注 N/A（本 change：N/A）

## 2. TDD Mapping（先测前提）

- [ ] 2.1 将 delta spec 的每个 Scenario 映射为至少一个测试用例
- [ ] 2.2 为每个测试标注对应 Scenario ID，建立可追踪关系
- [ ] 2.3 设定门禁：未出现 Red（失败测试）不得进入实现

### Scenario -> 测试映射

| Scenario ID | 测试文件                                                                              | 计划用例名 / 断言块                                                              |
| ----------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| AUD-C2-S1   | `apps/desktop/main/src/__tests__/unit/index-fatal-stderr-fallback.test.ts`            | `fatal log write failure should output error to stderr`                          |
| AUD-C2-S2   | `apps/desktop/main/src/__tests__/unit/index-fatal-stderr-fallback.test.ts`            | `stderr fallback failure should not crash process`                               |
| AUD-C2-S3   | `apps/desktop/renderer/src/__tests__/unit/create-project-dialog-error.test.ts`        | `project creation failure should show visible error to user`                     |
| AUD-C2-S4   | `apps/desktop/renderer/src/__tests__/unit/create-project-dialog-error.test.ts`        | `project creation error should include diagnosable context and console.error`    |

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
