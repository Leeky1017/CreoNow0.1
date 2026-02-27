# 提案：audit-contextfs-async-ssot

更新时间：2026-02-25 23:50

## 背景

`services/context/contextFs.ts` 中存在 4 对同步/异步函数的完整复制：`ensureCreonowDirStructure()` / `ensureCreonowDirStructureAsync()`（行 39-85 / 345-395）、`getCreonowDirStatus()` / `getCreonowDirStatusAsync()`（行 92-109 / 400-417）。两对函数的业务逻辑完全一致，仅 `fs.mkdirSync` 与 `fsPromises.mkdir` 等 API 不同。任何业务变更都必须同步修改两处，违反单一事实来源（SSOT）原则，属于审计报告类别二（中高严重程度）。不改的风险：业务逻辑漂移导致 sync/async 行为不一致，且维护成本翻倍。

## 变更内容

- 保留异步版本作为 SSOT（单一事实来源），移除同步版本中的重复业务逻辑
- 同步版本改为薄包装：内部委托异步版本，或通过共享的纯逻辑函数消除重复
- 确保所有现有 sync 调用方行为不变（功能回归覆盖）
- 为 sync/async 调用行为一致性建立契约测试

## 受影响模块

- context-engine — `contextFs.ts` 的目录结构保障与状态查询逻辑收敛为单一实现

## 不做什么

- 不迁移 contextFs.ts 以外的文件
- 不改变 contextFs 的公开 API 签名（保持 sync/async 两套导出）
- 不涉及审计类别一（ipcError 统一）或类别三（遗留适配层）的范围
- 不做 context fetcher 降级链改造（属于 C3 范围）

## 依赖关系

- 上游依赖：
  - C4 `audit-ipc-result-unification`（共享模块产出，contextFs 可能引用 ipcError/ServiceResult）
- 下游依赖：
  - 无直接下游

## 来源映射

| 来源 | 提炼结论 | 落地位置 |
| --- | --- | --- |
| 审计报告 §二（同步/异步完整复制） | 4 对函数业务逻辑完全一致，应保留异步版本为 SSOT | `specs/context-engine/spec.md`、`tasks.md` |
| 拆解计划 C6 | 风险中高，规模 M，依赖 C4 | `proposal.md` |

## 审阅状态

- Owner 审阅：`PENDING`
