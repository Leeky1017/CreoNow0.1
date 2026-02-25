# 提案：audit-shared-runtime-utils-unification

更新时间：2026-02-25 23:50

## 背景

审计报告识别出多处运行时工具函数重复与硬编码魔法数字问题：（一-1.3）完全相同的 `nowTs()` 函数在 11 个文件中独立定义，未来注入 fake timer 需修改 11 处；（十-10.2）`estimateTokenCount` 在 4 处独立实现，`@shared/tokenBudget.ts` 已有共享版本但 3 处仍维护独立副本；（十-10.3）`hashJson`/`sha256Hex`/`hashText` 在 5 处独立实现，全部是相同的 `createHash("sha256").update(text,"utf8").digest("hex")`；（十一-11.1）`max_tokens: 256` 在 aiService.ts 两处硬编码，而 `runtimeConfig.ts` 已有常量；（十一-11.2）`timeoutMs > 120000` 在 skillValidator.ts 硬编码，而 `runtimeConfig.ts` 已有 `MAX_SKILL_TIMEOUT_MS`。不修复将导致工具函数变更需修改多处，且魔法数字散落增加维护成本。

## 变更内容

- 将 `nowTs()` 抽取到共享工具模块，11 个文件统一 import
- 将 `estimateTokenCount` 的 3 个独立副本迁移为 `@shared/tokenBudget.ts` 的共享 import
- 将 `hashJson`/`sha256Hex`/`hashText` 抽取到共享工具模块，5 个文件统一 import
- `aiService.ts` 的 `max_tokens: 256` 替换为 `runtimeConfig.ts` 中的 `DEFAULT_REQUEST_MAX_TOKENS_ESTIMATE` 常量引用
- `skillValidator.ts` 的 `timeoutMs > 120000` 替换为 `runtimeConfig.ts` 中的 `MAX_SKILL_TIMEOUT_MS` 常量引用

## 受影响模块

- cross-module — 共享运行时工具模块（nowTs、hash、token 估算、常量引用）

## 不做什么

- 不改变 `nowTs()`、`estimateTokenCount`、`hashJson` 的运行时行为
- 不引入 fake timer 注入机制（仅统一定义点，为未来注入做准备）
- 不处理 `ipcError`/`ServiceResult` 重复（属于 C4 范围）
- 不处理中文字符串硬编码问题（属于 C13 范围）
- 不处理 `IpcInvoke` 类型重复（属于 C8 范围）

## 依赖关系

- 上游依赖：C4（`audit-ipc-result-unification`）— 共享模块模式已建立，避免同时大规模迁移产生冲突
- 下游依赖：无

## 来源映射

| 来源 | 提炼结论 | 落地位置 |
| --- | --- | --- |
| 审计报告 一-1.3 | 11 文件 nowTs 重复需统一 | `specs/cross-module/spec.md` |
| 审计报告 十-10.2 | 4 处 estimateTokenCount 需收敛到 @shared/tokenBudget | `specs/cross-module/spec.md` |
| 审计报告 十-10.3 | 5 处 hash 工具需统一 | `specs/cross-module/spec.md` |
| 审计报告 十一-11.1 | max_tokens 硬编码需引用常量 | `specs/cross-module/spec.md` |
| 审计报告 十一-11.2 | timeoutMs 硬编码需引用常量 | `specs/cross-module/spec.md` |

## 审阅状态

- Owner 审阅：`PENDING`
