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

- [ ] 3.1 **IPC bridge 类型对齐**：TypeScript 编译断言 preload `ipc.ts` 的返回类型与 renderer 期望类型直接兼容（无 `as unknown as`）（AUD-C8-S1）
- [ ] 3.2 **renderer 组件零强转**：ProxySection 和 AiSettingsSection 中的 5 处 `as unknown as` 消除后，tsc 编译通过（AUD-C8-S2）
- [ ] 3.3 **deriveOutline 类型对齐**：`deriveOutline.ts` 在 :107/:162/:235 的 3 处 `as unknown as` 消除后 tsc 通过（AUD-C8-S3）
- [ ] 3.4 **ipcAcl 类型对齐**：`ipcAcl.ts:33` 的 `as unknown as` 消除后 tsc 通过（AUD-C8-S4）
- [ ] 3.5 **白名单文档与守卫**：扫描生产代码 `as unknown as`，断言匹配数为 0 或仅在白名单中（白名单 ≤ 3 条且每条附理由文档）（AUD-C8-S5）
- [ ] 3.6 **IpcInvoke 共享导入**：扫描 8 个 store 文件，断言均从 `renderer/src/lib/ipcTypes.ts` import `IpcInvoke`，无本地定义（AUD-C8-S6）
- [ ] 3.7 **tsc 全量通过**：`tsc --noEmit` 零错误且无新增 `@ts-ignore` / `@ts-expect-error`（AUD-C8-S7）
- [ ] 3.8 **静态扫描守卫**：`rg 'as unknown as'` 结果仅含白名单条目（AUD-C8-S8）

## 4. Green（最小实现通过）

- [ ] 4.1 修正 `preload/src/ipc.ts` 的 contextBridge 暴露函数返回类型，使其与 renderer 侧 `window.api` 的期望类型结构性匹配
- [ ] 4.2 在 C7 归一化 ProxySettings 后，更新 ProxySection / AiSettingsSection 的 props 类型定义，消除 5 处强转
- [ ] 4.3 修正 `deriveOutline.ts` 的输入/输出类型签名使其与调用方一致，消除 3 处强转
- [ ] 4.4 修正 `ipcAcl.ts` 的 ACL 类型定义使其与 IPC 层一致，消除 1 处强转
- [ ] 4.5 抽取 `IpcInvoke` 类型到 `renderer/src/lib/ipcTypes.ts`，8 个 store 统一 import
- [ ] 4.6 对确实无法消除的强转（如第三方库类型不完整），建立白名单并附内联注释说明理由

## 5. Refactor（保持绿灯）

- [ ] 5.1 评估白名单中的每一条是否可通过上游类型定义（如 `@types/` 包更新或 module augmentation）彻底消除
- [ ] 5.2 统一 IPC 响应类型定义的存放位置（`packages/shared/types/` vs `renderer/src/lib/`），与 C4 建立的共享模式对齐
- [ ] 5.3 清理 8 个 store 文件中 IpcInvoke 本地定义删除后的空行和无用 import

## 6. Evidence

- [ ] 6.1 记录 RUN_LOG（含 Red 失败证据、Green 通过证据与关键命令输出）
- [ ] 6.2 记录 Dependency Sync Check 的输入、核对结论与后续动作（无漂移/已更新）
- [ ] 6.3 记录 Main Session Audit（Audit-Owner/Reviewed-HEAD-SHA=签字提交 HEAD^/三项 PASS/Blocking-Issues=0/Decision=ACCEPT），并确认签字提交仅变更当前任务 RUN_LOG
