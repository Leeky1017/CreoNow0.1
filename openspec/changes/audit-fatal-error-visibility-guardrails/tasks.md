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

- [ ] 3.1 **stderr fallback**：mock `logger.fatal` 抛异常，断言 `process.stderr.write` 被调用且包含错误上下文信息（AUD-C2-S1）
- [ ] 3.2 **fallback 自身安全**：mock `process.stderr.write` 也抛异常，断言进程不崩溃、不抛未捕获异常（AUD-C2-S2）
- [ ] 3.3 **用户可见错误**：mock IPC `createProject` 返回错误，渲染 `CreateProjectDialog`，断言 DOM 中出现包含错误描述的可见元素（AUD-C2-S3）
- [ ] 3.4 **诊断上下文**：mock IPC 返回特定 error code，断言 `console.error` 调用包含该 code 与操作类型（AUD-C2-S4）

## 4. Green（最小实现通过）

- [ ] 4.1 在 `index.ts:466` 的 catch 块中添加 `try { process.stderr.write(\`[FATAL] ${error}\n\`) } catch { /* 最后兜底，不能再抛 */ }`
- [ ] 4.2 在 `CreateProjectDialog.tsx:456` 的 catch 块中调用 `setError(err.message || '项目创建失败')`，并在 JSX 中条件渲染错误提示区域
- [ ] 4.3 在 `CreateProjectDialog` catch 块补充 `console.error('[CreateProjectDialog] createProject failed:', err)` 提供诊断信息

## 5. Refactor（保持绿灯）

- [ ] 5.1 评估 `index.ts` 的 fatal catch 块是否可抽取为 `safeFatalLog(error)` 工具函数，供其他主进程顶层 catch 复用
- [ ] 5.2 确保 `CreateProjectDialog` 的错误状态在下次提交时自动清除（`setError(null)` 在 submit 开头）

## 6. Evidence

- [ ] 6.1 记录 RUN_LOG（含 Red 失败证据、Green 通过证据与关键命令输出）
- [ ] 6.2 记录 Dependency Sync Check 的输入、核对结论与后续动作（无漂移/已更新）
- [ ] 6.3 记录 Main Session Audit（Audit-Owner/Reviewed-HEAD-SHA=签字提交 HEAD^/三项 PASS/Blocking-Issues=0/Decision=ACCEPT），并确认签字提交仅变更当前任务 RUN_LOG
