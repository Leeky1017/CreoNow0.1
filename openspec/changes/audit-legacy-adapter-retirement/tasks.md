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

- [ ] 3.1 编写 Happy Path 的失败测试并确认先失败
- [ ] 3.2 编写 Edge Case 的失败测试并确认先失败
- [ ] 3.3 编写 Error Path 的失败测试并确认先失败

## 4. Green（最小实现通过）

- [ ] 4.1 仅实现让 Red 转绿的最小代码
- [ ] 4.2 逐条使失败测试通过，不引入无关功能

## 5. Refactor（保持绿灯）

- [ ] 5.1 去重与重构，保持测试全绿
- [ ] 5.2 不改变已通过的外部行为契约

## 6. Evidence

- [ ] 6.1 记录 RUN_LOG（含 Red 失败证据、Green 通过证据与关键命令输出）
- [ ] 6.2 记录 Dependency Sync Check 的输入、核对结论与后续动作（无漂移/已更新）
- [ ] 6.3 记录 Main Session Audit（Audit-Owner/Reviewed-HEAD-SHA=签字提交 HEAD^/三项 PASS/Blocking-Issues=0/Decision=ACCEPT），并确认签字提交仅变更当前任务 RUN_LOG
