更新时间：2026-02-23 20:02

## 1. Specification

- [x] 1.1 审阅并确认需求边界（Phase 2 仅覆盖 AppShell 拆分、Shell 权限边界、IPC 收敛）
- [x] 1.2 审阅并确认错误路径与边界路径（布局越权、面板挤压、IPC 调用绕过 service）
- [x] 1.3 审阅并确认验收阈值与不可变契约（Feature 禁止接管 viewport；renderer 禁止直接 IPC）
- [x] 1.4 若存在上游依赖，先完成依赖同步检查（Dependency Sync Check）并记录“无漂移/已更新”；无依赖则标注 N/A

## 2. TDD Mapping（先测前提）

- [x] 2.1 将 delta spec 的每个 Scenario 映射为至少一个测试用例
- [x] 2.2 为每个测试标注对应 Scenario ID，建立可追踪关系
- [x] 2.3 设定门禁：未出现 Red（失败测试）不得进入实现

### Scenario -> 测试映射

| Scenario ID | 测试文件                                                                               | 计划用例名 / 断言块                                                      |
| ----------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| WB-P2-S1    | `apps/desktop/renderer/src/components/layout/__tests__/layout-shell-boundary.test.tsx` | `LayoutShell should only consume layout-scoped state`                    |
| WB-P2-S2    | `apps/desktop/renderer/src/components/layout/__tests__/navigation-controller.test.tsx` | `NavigationController should handle panel route + shortcuts only`        |
| WB-P2-S3    | `apps/desktop/tests/lint/renderer-viewport-ownership.test.ts`                          | `non-shell component should fail on h-screen/w-screen usage`             |
| WB-P2-S4    | `apps/desktop/renderer/src/components/layout/__tests__/viewport-allocation.test.tsx`   | `feature panel should render with shell-injected size contract`          |
| WB-P2-S5    | `apps/desktop/renderer/src/components/layout/__tests__/panel-orchestrator.test.tsx`    | `PanelOrchestrator should preserve editor minimum width`                 |
| WB-P2-S6    | `apps/desktop/renderer/src/components/layout/__tests__/panel-orchestrator.test.tsx`    | `panel surface should not mutate global layout outside orchestrator API` |
| IPC-P2-S1   | `apps/desktop/renderer/src/services/__tests__/ipc-boundary-lint.test.ts`               | `feature should fail when directly invoking ipcRenderer/window bridge`   |
| IPC-P2-S2   | `apps/desktop/renderer/src/services/__tests__/project-service.test.ts`                 | `service should invoke IPC and return normalized success result`         |
| IPC-P2-S3   | `apps/desktop/renderer/src/services/__tests__/service-error-normalization.test.ts`     | `service should normalize timeout/validation/internal envelope errors`   |

## 3. Red（先写失败测试）

- [x] 3.1 编写 Happy Path 的失败测试并确认先失败
- [x] 3.2 编写 Edge Case 的失败测试并确认先失败
- [x] 3.3 编写 Error Path 的失败测试并确认先失败

## 4. Green（最小实现通过）

- [x] 4.1 仅实现让 Red 转绿的最小代码
- [x] 4.2 逐条使失败测试通过，不引入无关功能

## 5. Refactor（保持绿灯）

- [x] 5.1 去重与重构，保持测试全绿
- [x] 5.2 不改变已通过的外部行为契约

## 6. Evidence

- [x] 6.1 记录 RUN_LOG（含 Red 失败证据、Green 通过证据与关键命令输出）
- [x] 6.2 记录 Dependency Sync Check 的输入、核对结论与后续动作（无漂移/已更新）
- [x] 6.3 记录 Main Session Audit（Audit-Owner/Reviewed-HEAD-SHA=签字提交 HEAD^/三项 PASS/Blocking-Issues=0/Decision=ACCEPT），并确认签字提交仅变更当前任务 RUN_LOG
