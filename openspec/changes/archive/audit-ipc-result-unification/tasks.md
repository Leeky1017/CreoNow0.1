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

- [ ] 3.1 **共享导出完整性**：import `services/shared/ipcResult.ts`，断言导出包含 `ipcError(code, message, details?, options?)` 签名，`options` 含可选 `traceId` 和 `retryable` 字段（AUD-C4-S1）
- [ ] 3.2 **零本地重复**：用 `rg` 或 AST 扫描生产代码（排除 shared/ipcResult.ts），断言匹配 `function ipcError` 或 `type ServiceResult` 定义数为 0（AUD-C4-S2）
- [ ] 3.3 **迁移兼容性**：运行 `tsc --noEmit`，断言零错误；运行既有测试套件，断言全通过（AUD-C4-S3）
- [ ] 3.4 **签名变体行为一致**：构造原各变体调用（带 traceId、带 retryable、仅 code+message），断言统一后返回结构与原行为一致（AUD-C4-S4）
- [ ] 3.5 **防回归守卫**：在任意非 shared 文件中新增 `function ipcError`，断言守卫测试失败（AUD-C4-S5）

## 4. Green（最小实现通过）

- [ ] 4.1 扩展 `services/shared/ipcResult.ts` 的 `ipcError` 签名，增加可选 `options: { traceId?, retryable? }` 参数，保持向后兼容
- [ ] 4.2 逐文件将 33 个本地 `ipcError` / `ServiceResult` 定义替换为 `import { ipcError, ServiceResult, Ok, Err } from 'services/shared/ipcResult'`
- [ ] 4.3 对各签名变体调用点适配新签名：将 `ipcError(code, msg, details, traceId)` 改为 `ipcError(code, msg, details, { traceId })`
- [ ] 4.4 删除 33 个文件中的本地定义代码块

## 5. Refactor（保持绿灯）

- [ ] 5.1 检查迁移后是否存在 `import` 路径不一致（相对路径 vs 别名），统一为项目约定的模块解析方式
- [ ] 5.2 确认 `services/shared/ipcResult.ts` 的导出是否应纳入 `packages/shared/` 包（与 cross-module 共享层保持一致）
- [ ] 5.3 清理迁移过程中可能残留的空行或无用 import

## 6. Evidence

- [ ] 6.1 记录 RUN_LOG（含 Red 失败证据、Green 通过证据与关键命令输出）
- [ ] 6.2 记录 Dependency Sync Check 的输入、核对结论与后续动作（无漂移/已更新）
- [ ] 6.3 记录 Main Session Audit（Audit-Owner/Reviewed-HEAD-SHA=签字提交 HEAD^/三项 PASS/Blocking-Issues=0/Decision=ACCEPT），并确认签字提交仅变更当前任务 RUN_LOG
