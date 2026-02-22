更新时间：2026-02-22 21:12

## 1. Specification

- [x] 1.1 审阅并确认需求边界（仅基础防护：SQLite PRAGMA / 全局异常捕获 / 窗口安全 / 原子写）
- [x] 1.2 审阅并确认错误路径与边界路径（崩溃/断电/锁冲突/越权导航/写入中断）
- [x] 1.3 审阅并确认验收阈值与不可变契约（错误不泄漏 stack；停机链路可追溯；落盘不损坏）
- [x] 1.4 若存在上游依赖，先完成依赖同步检查（Dependency Sync Check）并记录“无漂移/已更新”；无依赖则标注 N/A（本 change：N/A）

## 2. TDD Mapping（先测前提）

- [x] 2.1 将 delta spec 的每个 Scenario 映射为至少一个测试用例
- [x] 2.2 为每个测试标注对应 Scenario ID，建立可追踪关系
- [x] 2.3 设定门禁：未出现 Red（失败测试）不得进入实现

### Scenario -> 测试映射

| Scenario ID | 测试文件                                                                           | 计划用例名 / 断言块                                                                |
| ----------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| BE-GHB-S1   | `apps/desktop/main/src/db/__tests__/recommended-pragmas.test.ts`                   | `applyRecommendedPragmas should set busy_timeout/synchronous/mmap_size/cache_size` |
| BE-GHB-S2   | `apps/desktop/main/src/__tests__/global-exception-handlers.contract.test.ts`       | `fatal errors should trigger graceful shutdown and exit(1)`                        |
| BE-GHB-S3   | `apps/desktop/main/src/__tests__/browser-window-security.contract.test.ts`         | `window.open should be denied and navigation should be restricted`                 |
| BE-GHB-S4   | `apps/desktop/main/src/services/documents/__tests__/atomic-write.contract.test.ts` | `atomicWrite should not leave partial file on crash simulation`                    |

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
- [x] 6.2 记录 Dependency Sync Check 的输入、核对结论与后续动作（无漂移/已更新）
- [ ] 6.3 记录 Main Session Audit（Audit-Owner/Reviewed-HEAD-SHA=签字提交 HEAD^/三项 PASS/Blocking-Issues=0/Decision=ACCEPT），并确认签字提交仅变更当前任务 RUN_LOG
