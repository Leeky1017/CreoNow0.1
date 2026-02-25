# IPC Specification Delta

更新时间：2026-02-25 23:50

## Change: audit-ipc-result-unification

### Requirement: ipcError 与 ServiceResult 必须收敛到唯一共享模块 [ADDED]

`services/shared/ipcResult.ts` **必须**成为 `ipcError()`、`ServiceResult<T>`、`Ok<T>`、`Err` 的唯一定义来源。所有 34 个文件中的本地重复定义**必须**迁移为共享 import，签名变体**必须**统一收敛。

#### Scenario: AUD-C4-S1 共享模块导出完整的 ipcError 签名 [ADDED]

- **假设** `services/shared/ipcResult.ts` 作为 SSOT
- **当** 开发者查看共享模块的导出接口
- **则** 模块导出 `ipcError(code, message, details?, options?)` 函数，其中 `options` 包含可选的 `traceId` 和 `retryable` 字段
- **并且** 导出 `ServiceResult<T>`、`Ok<T>`、`Err`、`IpcError`、`IpcErrorCode` 类型

#### Scenario: AUD-C4-S2 静态扫描验证无本地重复定义 [ADDED]

- **假设** 所有 33 个文件已完成迁移
- **当** 执行 `rg "function ipcError" --type ts` 扫描代码库
- **则** 仅在 `services/shared/ipcResult.ts` 中匹配到 `ipcError` 函数定义
- **并且** `rg "type ServiceResult" --type ts` 仅在共享模块中匹配到类型定义

#### Scenario: AUD-C4-S3 迁移后类型检查与单测全绿 [ADDED]

- **假设** 所有文件已从本地定义迁移为共享 import
- **当** 执行 `tsc --noEmit` 与全量单测
- **则** 类型检查零错误
- **并且** 所有现有单测通过，无行为回归

#### Scenario: AUD-C4-S4 签名变体统一后行为兼容 [ADDED]

- **假设** `stats.ts` 和 `constraints.ts` 原使用 `IpcError["code"]` 类型，`judgeService.ts` 原无 `details` 参数，`projectService.ts` 原有 `traceId`/`retryable`
- **当** 这些文件迁移到共享 `ipcError` 函数
- **则** 所有调用点的运行时行为与迁移前一致
- **并且** 原有的 `traceId`/`retryable` 通过 `options` 参数传递，原无 `details` 的调用点省略该参数即可

#### Scenario: AUD-C4-S5 防回归守卫测试阻止新增本地 ipcError 定义 [ADDED]

- **假设** 迁移完成且守卫测试已就位
- **当** 开发者在新文件中定义本地 `ipcError` 函数
- **则** 守卫测试失败，提示应使用共享模块
- **并且** CI 流水线阻止该提交合并
