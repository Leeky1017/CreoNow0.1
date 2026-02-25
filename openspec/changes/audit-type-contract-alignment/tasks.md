更新时间：2026-02-25 23:50

## 1. Specification

- [ ] 1.1 审阅并确认需求边界（17 处 as unknown as 清零/白名单化, 8 store IpcInvoke 统一 import）
- [ ] 1.2 审阅并确认错误路径与边界路径（白名单强转必须附理由；tsc --noEmit 零错误）
- [ ] 1.3 审阅并确认验收阈值与不可变契约（生产代码 as unknown as 匹配数为零或仅白名单条目；白名单 ≤ 3）
- [ ] 1.4 若存在上游依赖，先完成依赖同步检查（Dependency Sync Check）并记录"无漂移/已更新"；无依赖则标注 N/A（本 change：上游依赖 C7 `audit-proxy-settings-normalization`）

## 2. TDD Mapping（先测前提）

- [ ] 2.1 将 delta spec 的每个 Scenario 映射为至少一个测试用例
- [ ] 2.2 为每个测试标注对应 Scenario ID，建立可追踪关系
- [ ] 2.3 设定门禁：未出现 Red（失败测试）不得进入实现

### Scenario -> 测试映射

| Scenario ID | 测试文件 | 计划用例名 / 断言块 |
| ----------- | --- | --- |
| AUD-C8-S1 | `apps/desktop/renderer/src/__tests__/unit/ipc-bridge-type-alignment.test.ts` | `IPC bridge return types should match renderer expected types without as unknown as` |
| AUD-C8-S2 | `apps/desktop/renderer/src/__tests__/unit/ipc-bridge-type-alignment.test.ts` | `ProxySection and AiSettingsSection should consume IPC response without cast (5 casts eliminated)` |
| AUD-C8-S3 | `apps/desktop/main/src/__tests__/unit/derive-outline-type-alignment.test.ts` | `deriveOutline should align input/output types without as unknown as at :107/:162/:235` |
| AUD-C8-S4 | `apps/desktop/main/src/__tests__/unit/ipc-acl-type-alignment.test.ts` | `ipcAcl should align ACL types with IPC layer without as unknown as at :33` |
| AUD-C8-S5 | `apps/desktop/main/src/__tests__/unit/type-cast-whitelist.test.ts` | `whitelisted casts must have documented rationale and no unlisted as unknown as in production` |
| AUD-C8-S6 | `apps/desktop/renderer/src/__tests__/unit/ipc-invoke-shared-type.test.ts` | `8 stores should import IpcInvoke from shared ipcTypes.ts (no local definitions)` |
| AUD-C8-S7 | `apps/desktop/main/src/__tests__/unit/tsc-no-emit-gate.test.ts` | `tsc --noEmit should pass with zero errors and no new type suppression comments` |
| AUD-C8-S8 | `apps/desktop/main/src/__tests__/unit/type-cast-whitelist.test.ts` | `rg as unknown as on production code should match zero or only whitelisted entries` |

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
