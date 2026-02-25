更新时间：2026-02-25 23:50

## 1. Specification

- [ ] 1.1 审阅并确认需求边界（toLegacy*/normalizeEntityType 兼容映射清理, bootstrapForProject() 下线）
- [ ] 1.2 审阅并确认错误路径与边界路径（必须覆盖：历史 "other" 类型数据迁移兼容、调用方迁移后功能一致性、旧字段名残留检测）
- [ ] 1.3 审阅并确认验收阈值与不可变契约（代码库零残留 toLegacy*/bootstrapForProject；tsc --noEmit 通过；UI 无 "other" 选项）
- [ ] 1.4 若存在上游依赖，先完成依赖同步检查（Dependency Sync Check）并记录"无漂移/已更新"；无依赖则标注 N/A（本 change：上游依赖 C8 `audit-type-contract-alignment`）

## 2. TDD Mapping（先测前提）

- [ ] 2.1 将 delta spec 的每个 Scenario 映射为至少一个测试用例
- [ ] 2.2 为每个测试标注对应 Scenario ID，建立可追踪关系
- [ ] 2.3 设定门禁：未出现 Red（失败测试）不得进入实现

### Scenario -> 测试映射

| Scenario ID | 测试文件                                                                                    | 计划用例名 / 断言块                                                                          |
| ----------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| AUD-C11-S1  | `apps/desktop/renderer/src/__tests__/unit/kg-store-legacy-entity-removal.test.ts`           | `renderer should use IPC native entity fields without toLegacyEntity mapping`                |
| AUD-C11-S2  | `apps/desktop/renderer/src/__tests__/unit/kg-store-legacy-relation-removal.test.ts`         | `renderer should use IPC native relation fields without toLegacyRelation mapping`            |
| AUD-C11-S3  | `apps/desktop/renderer/src/__tests__/unit/kg-normalize-entity-type-cleanup.test.ts`         | `UI entity type list should not contain "other" and normalizeEntityType has no legacy map`   |
| AUD-C11-S4  | `apps/desktop/main/src/__tests__/integration/kg-other-type-migration.test.ts`               | `legacy "other" type records should be migrated via data migration not runtime mapping`      |
| AUD-C11-S5  | `apps/desktop/main/src/__tests__/unit/memory-store-bootstrap-migration.test.ts`             | `all bootstrapForProject callers should be migrated to new interface with same behavior`     |
| AUD-C11-S6  | `apps/desktop/main/src/__tests__/integration/memory-store-bootstrap-removal.test.ts`        | `bootstrapForProject should not exist in codebase and tsc --noEmit should pass`              |

## 3. Red（先写失败测试）

- [ ] 3.1 **原生字段直用**：构造 IPC 返回的 entity 数据（使用 `id` / `type`），在 kgStore consumer 中消费，断言无 `toLegacyEntity` 调用参与（AUD-C11-S1）
- [ ] 3.2 **关系字段直用**：构造 IPC 返回的 relation 数据（使用 `sourceEntityId` / `targetEntityId`），断言无 `toLegacyRelation` 调用（AUD-C11-S2）
- [ ] 3.3 **normalizeEntityType 无 legacy 映射**：断言 UI entity type 列表不含 `"other"` 选项，且 `normalizeEntityType` 中无 `"other"→"faction"` 映射（AUD-C11-S3）
- [ ] 3.4 **历史数据迁移**：构造含 `"other"` type 的历史记录，断言通过数据迁移（而非运行时映射）转换为正确类型（AUD-C11-S4）
- [ ] 3.5 **bootstrapForProject 调用方迁移**：所有原 `bootstrapForProject` 调用方改用新接口，断言行为一致（AUD-C11-S5）
- [ ] 3.6 **bootstrapForProject 消除**：`rg bootstrapForProject` 扫描生产代码，断言零匹配；`tsc --noEmit` 通过（AUD-C11-S6）

## 4. Green（最小实现通过）

- [ ] 4.1 修改 kgStore 中 6 个调用 `toLegacyEntity()` 的方法，直接使用 IPC 返回的原生字段名
- [ ] 4.2 修改 kgStore 中调用 `toLegacyRelation()` 的方法，直接使用原生字段名
- [ ] 4.3 从 UI 的 entity type 枚举/列表中移除 `"other"` 选项，删除 `normalizeEntityType` 中的遗留映射
- [ ] 4.4 为含 `"other"` type 的历史数据编写一次性迁移逻辑（在 DB 层或初始化时执行）
- [ ] 4.5 找到 `bootstrapForProject()` 的所有调用方，迁移到新接口（如直接调用底层方法或新的初始化 API）
- [ ] 4.6 删除 `toLegacyEntity()` / `toLegacyRelation()` / `normalizeEntityType` 遗留映射 / `bootstrapForProject()` 四处死代码

## 5. Refactor（保持绿灯）

- [ ] 5.1 确认 renderer 组件中所有 entity/relation 数据消费点已使用统一字段名（`id` 而非 `entityId` 等混用）
- [ ] 5.2 检查 `kgStore.ts` 的类型定义是否已同步更新（移除 legacy 字段类型声明）
- [ ] 5.3 验证删除 `toLegacy*` 后的 kgStore 文件行数下降，确认无多余空行或注释残留

## 6. Evidence

- [ ] 6.1 记录 RUN_LOG（含 Red 失败证据、Green 通过证据与关键命令输出）
- [ ] 6.2 记录 Dependency Sync Check 的输入、核对结论与后续动作（无漂移/已更新）
- [ ] 6.3 记录 Main Session Audit（Audit-Owner/Reviewed-HEAD-SHA=签字提交 HEAD^/三项 PASS/Blocking-Issues=0/Decision=ACCEPT），并确认签字提交仅变更当前任务 RUN_LOG
