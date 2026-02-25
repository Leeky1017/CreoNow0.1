# Knowledge Graph Specification Delta

更新时间：2026-02-25 23:50

## Change: audit-legacy-adapter-retirement

### Requirement: toLegacyEntity/toLegacyRelation 兼容映射必须移除，renderer 统一使用 IPC 原生字段名 [ADDED]

`kgStore.ts:138-154` 的 `toLegacyEntity()` 和 `toLegacyRelation()` 将 IPC 返回的原生字段（`id`/`type`/`sourceEntityId`/`targetEntityId`）转换为旧字段名供 renderer 组件使用。IPC 契约已稳定使用新字段名，所有 renderer 组件**必须**直接使用 IPC 原生字段名，`toLegacy*` 函数**必须**删除。

#### Scenario: AUD-C11-S1 renderer 组件直接使用 IPC 原生实体字段 [ADDED]

- **假设** KG IPC 返回实体数据包含 `id`、`type`、`name` 等原生字段
- **当** renderer 组件通过 kgStore 获取实体列表
- **则** 组件接收到的实体对象直接包含 `id`、`type` 字段，不存在旧字段名映射
- **并且** 代码库中不存在 `toLegacyEntity` 函数定义或调用

#### Scenario: AUD-C11-S2 renderer 组件直接使用 IPC 原生关系字段 [ADDED]

- **假设** KG IPC 返回关系数据包含 `id`、`sourceEntityId`、`targetEntityId` 等原生字段
- **当** renderer 组件通过 kgStore 获取关系列表
- **则** 组件接收到的关系对象直接包含 `sourceEntityId`、`targetEntityId` 字段，不存在旧字段名映射
- **并且** 代码库中不存在 `toLegacyRelation` 函数定义或调用

### Requirement: normalizeEntityType 中 "other"→"faction" 遗留映射必须移除 [ADDED]

`kgStore.ts:101-122` 的 `normalizeEntityType()` 包含硬编码的 `"other"→"faction"` 映射。正确做法是修正 UI 层不再产生 `"other"` 值，从源头消除遗留类型。

#### Scenario: AUD-C11-S3 UI 层不再产生 "other" 实体类型 [ADDED]

- **假设** 用户在 UI 中创建或编辑知识图谱实体
- **当** 用户选择实体类型
- **则** 可选类型列表中不包含 `"other"` 选项
- **并且** `normalizeEntityType` 函数中不存在 `"other"→"faction"` 的硬编码映射

#### Scenario: AUD-C11-S4 已有 "other" 类型数据的迁移兼容 [ADDED]

- **假设** 数据库中存在历史遗留的 `type="other"` 实体记录
- **当** 系统加载这些实体数据
- **则** 数据迁移逻辑（非运行时映射）将 `"other"` 更新为正确类型
- **并且** 运行时 `normalizeEntityType` 不再包含任何遗留类型映射逻辑
