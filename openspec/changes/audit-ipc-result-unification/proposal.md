# 提案：audit-ipc-result-unification

更新时间：2026-02-25 23:50

## 背景

审计报告（一-1.1/1.2）发现完全相同的 `ipcError(code, message, details?)` 工厂函数在 34 个文件中各自独立定义，`ServiceResult<T>` / `Ok<T>` / `Err` 类型在 25+ 个文件中重复定义。`services/shared/ipcResult.ts` 已存在导出版本，但其余 33 个文件仍各自维护独立副本。此外（十三-13.3），34 个文件中的 `ipcError` 存在签名微变体（`code` 类型不一致、部分缺少 `details` 参数、部分多了 `traceId`/`retryable`），增加了不一致风险。不修复将导致任何错误处理策略变更需修改 34 个文件，且签名变体可能引发运行时不一致。

## 变更内容

- 将 `services/shared/ipcResult.ts` 确立为 `ipcError()` 与 `ServiceResult<T>` / `Ok<T>` / `Err` 的唯一定义来源（SSOT）
- 统一 `ipcError` 签名，收敛签名变体（`traceId`/`retryable` 作为可选扩展字段纳入共享定义）
- 逐文件迁移 33 个独立副本为 `import { ipcError, ServiceResult } from 'services/shared/ipcResult'`
- 删除所有本地重复定义，通过 `rg` 静态扫描验证仅保留共享定义

## 受影响模块

- ipc — 共享 ipcResult 模块作为所有服务的错误/结果类型 SSOT

## 不做什么

- 不改变 `ipcError` 的运行时行为或错误码体系
- 不重构 `DocumentError` 等领域特定错误类型（仅收敛通用 `ipcError`/`ServiceResult`）
- 不处理 renderer 侧的 `IpcInvoke` 类型重复（属于 C8 范围）
- 不处理错误消息语言混用问题（属于 C13 范围）

## 依赖关系

- 上游依赖：C2（`audit-fatal-error-visibility-guardrails`）— 确保高风险 catch 块已修复后再做大规模迁移
- 下游依赖：C5（`audit-shared-runtime-utils-unification`）依赖本 change 建立的共享模块模式

## 来源映射

| 来源 | 提炼结论 | 落地位置 |
| --- | --- | --- |
| 审计报告 一-1.1 | 34 文件 ipcError 重复需统一到共享模块 | `specs/ipc/spec.md` |
| 审计报告 一-1.2 | 25+ 文件 ServiceResult 重复需统一 | `specs/ipc/spec.md` |
| 审计报告 十三-13.3 | ipcError 签名变体需收敛 | `specs/ipc/spec.md` |

## 审阅状态

- Owner 审阅：`PENDING`
