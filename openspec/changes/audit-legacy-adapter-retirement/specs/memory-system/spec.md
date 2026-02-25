# Memory System Specification Delta

更新时间：2026-02-25 23:50

## Change: audit-legacy-adapter-retirement

### Requirement: bootstrapForProject() @deprecated 方法必须下线 [ADDED]

`memoryStore.ts:343-346` 的 `bootstrapForProject()` 已标记 `@deprecated` 但仍保留。所有调用方**必须**迁移到新接口，迁移完成后该方法**必须**删除，不得保留死代码。

#### Scenario: AUD-C11-S5 bootstrapForProject 调用方全部迁移 [ADDED]

- **假设** 代码库中存在对 `bootstrapForProject()` 的调用
- **当** 执行本次变更的调用方迁移
- **则** 所有调用方改为使用新接口（非 deprecated 的替代方法）
- **并且** 迁移后的调用方功能行为与迁移前一致

#### Scenario: AUD-C11-S6 bootstrapForProject 方法完全删除 [ADDED]

- **假设** 所有调用方已完成迁移（AUD-C11-S5 通过）
- **当** 在代码库中搜索 `bootstrapForProject`
- **则** 不存在该函数的定义、导出或调用
- **并且** TypeScript 编译（`tsc --noEmit`）通过，无未解析引用错误
