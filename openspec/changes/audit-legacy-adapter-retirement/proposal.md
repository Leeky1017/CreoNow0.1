# 提案：audit-legacy-adapter-retirement

更新时间：2026-02-25 23:50

## 背景

审计报告（三-3.1/3.2/3.3、八-8.1）发现 renderer 层仍保留多处遗留兼容适配层：`kgStore.ts:138-154` 的 `toLegacyEntity()`/`toLegacyRelation()` 在 6 个方法中反复将 IPC 原生字段名转换为旧字段名；`kgStore.ts:101-122` 的 `normalizeEntityType()` 硬编码 `"other"→"faction"` 遗留映射；`memoryStore.ts:343-346` 的 `bootstrapForProject()` 标记 `@deprecated` 但仍保留未清理。这些适配层增加维护成本、掩盖真实数据契约，且随时间推移会导致新旧字段混用的不一致风险。

## 变更内容

- 迁移 renderer 组件统一使用 IPC 原生字段名（`id`/`type`/`sourceEntityId`/`targetEntityId`），删除 `toLegacyEntity()`/`toLegacyRelation()` 函数
- 修正 UI 层不再产生 `"other"` 类型值，移除 `normalizeEntityType()` 中 `"other"→"faction"` 硬编码映射
- 找到 `bootstrapForProject()` 所有调用方并迁移到新接口，完成后删除该 `@deprecated` 方法

## 受影响模块

- knowledge-graph — kgStore 的 toLegacy* 函数与 normalizeEntityType 兼容映射清理
- memory-system — memoryStore 的 bootstrapForProject 下线与调用方迁移

## 不做什么

- 不重构 kgStore 的整体架构或 IPC 通信层
- 不处理 aiProxySettingsService 的遗留字段兼容（属于 C7 范围）
- 不处理 providerResolver 的多层 fallback 链（属于 C7 范围）
- 不修改 IPC 后端服务的字段定义（后端已使用新字段名）

## 依赖关系

- 上游依赖：C8（`audit-type-contract-alignment`）— 需要类型契约对齐完成后再清理兼容层，避免类型漂移
- 下游依赖：无

## 来源映射

| 来源 | 提炼结论 | 落地位置 |
| --- | --- | --- |
| 审计报告 三-3.1 | toLegacyEntity/toLegacyRelation 应删除，renderer 统一使用 IPC 原生字段名 | `specs/knowledge-graph/spec.md` |
| 审计报告 三-3.2 | normalizeEntityType 的 "other"→"faction" 映射应移除，UI 层修正源头 | `specs/knowledge-graph/spec.md` |
| 审计报告 三-3.3 | bootstrapForProject @deprecated 方法应迁移调用方后删除 | `specs/memory-system/spec.md` |
| 审计报告 八-8.1 | @deprecated 方法未清理属于死代码残留 | `specs/memory-system/spec.md` |

## 审阅状态

- Owner 审阅：`PENDING`
