更新时间：2026-02-25 23:50

## 1. Specification

- [ ] 1.1 审阅并确认需求边界（nowTs/estimateTokenCount/hash 工具统一、魔法数字改常量）
- [ ] 1.2 审阅并确认错误路径与边界路径（必须覆盖：静态扫描无重复定义、迁移后行为一致、常量引用替换、防回归守卫）
- [ ] 1.3 审阅并确认验收阈值与不可变契约（测试确定性；tsc --noEmit 零错误；运行时行为与修改前一致；静态扫描无重复定义）
- [ ] 1.4 若存在上游依赖，先完成依赖同步检查（Dependency Sync Check）并记录"无漂移/已更新"；无依赖则标注 N/A（本 change：上游依赖 C4 `audit-ipc-result-unification`）

## 2. TDD Mapping（先测前提）

- [ ] 2.1 将 delta spec 的每个 Scenario 映射为至少一个测试用例
- [ ] 2.2 为每个测试标注对应 Scenario ID，建立可追踪关系
- [ ] 2.3 设定门禁：未出现 Red（失败测试）不得进入实现

### Scenario -> 测试映射

| Scenario ID | 测试文件                                                                                  | 计划用例名 / 断言块                                                                  |
| ----------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| AUD-C5-S1   | `apps/desktop/main/src/__tests__/unit/shared-nowts-no-duplicates.test.ts`                 | `static scan should find no local nowTs definitions outside shared module`            |
| AUD-C5-S2   | `apps/desktop/main/src/__tests__/unit/shared-nowts-no-duplicates.test.ts`                 | `shared nowTs should return value consistent with Date.now()`                        |
| AUD-C5-S3   | `apps/desktop/main/src/__tests__/unit/shared-token-count-no-duplicates.test.ts`           | `static scan should find no local estimateTokenCount definitions outside shared`     |
| AUD-C5-S4   | `apps/desktop/main/src/__tests__/unit/shared-token-count-no-duplicates.test.ts`           | `estimateUtf8TokenCount should return consistent results after migration`            |
| AUD-C5-S5   | `apps/desktop/main/src/__tests__/unit/shared-hash-no-duplicates.test.ts`                  | `static scan should find no local hash function definitions outside shared module`   |
| AUD-C5-S6   | `apps/desktop/main/src/__tests__/unit/magic-number-constants.test.ts`                     | `aiService max_tokens should reference DEFAULT_REQUEST_MAX_TOKENS_ESTIMATE`          |
| AUD-C5-S7   | `apps/desktop/main/src/__tests__/unit/magic-number-constants.test.ts`                     | `skillValidator timeoutMs should reference MAX_SKILL_TIMEOUT_MS`                     |
| AUD-C5-S8   | `apps/desktop/main/src/__tests__/unit/shared-utils-guard.test.ts`                         | `guard test should fail when new local nowTs or hashJson definition is introduced`   |

## 3. Red（先写失败测试）

- [ ] 3.1 **nowTs 零重复**：`rg` 扫描生产代码（排除 shared 模块），断言 `function nowTs` 或 `const nowTs =` 定义数为 0（AUD-C5-S1）
- [ ] 3.2 **nowTs 行为一致**：调用共享 `nowTs()`，断言返回值在 `Date.now()` ± 10ms 范围内（AUD-C5-S2）
- [ ] 3.3 **estimateTokenCount 零重复**：扫描排除 `@shared/tokenBudget.ts` 后，断言无本地 `estimateTokenCount` / `estimateUtf8TokenCount` 定义（AUD-C5-S3）
- [ ] 3.4 **estimateTokenCount 一致性**：对相同输入，共享版本与原各副本返回值相同（AUD-C5-S4）
- [ ] 3.5 **hash 零重复**：扫描排除 shared 后，断言无 `hashJson` / `sha256Hex` / `hashText` 本地定义（AUD-C5-S5）
- [ ] 3.6 **max_tokens 常量引用**：读取 aiService.ts 源码，断言不含字面量 `256` 出现在 `max_tokens` 上下文中，而是引用 `DEFAULT_REQUEST_MAX_TOKENS_ESTIMATE`（AUD-C5-S6）
- [ ] 3.7 **timeoutMs 常量引用**：读取 skillValidator.ts 源码，断言不含字面量 `120000`，而是引用 `MAX_SKILL_TIMEOUT_MS`（AUD-C5-S7）
- [ ] 3.8 **防回归守卫**：在非 shared 文件新增 `function nowTs`，断言守卫测试失败（AUD-C5-S8）

## 4. Green（最小实现通过）

- [ ] 4.1 在共享模块中定义 `nowTs()` 函数，11 个消费文件逐一替换为 `import { nowTs } from 'shared/...'`，删除本地定义
- [ ] 4.2 将 3 个独立 `estimateTokenCount` 副本删除，改为 `import { estimateUtf8TokenCount } from '@shared/tokenBudget'`
- [ ] 4.3 在共享模块中定义 `hashJson` / `sha256Hex`，5 个消费文件统一 import，删除本地实现
- [ ] 4.4 `aiService.ts` 中将 `max_tokens: 256` 替换为 `max_tokens: DEFAULT_REQUEST_MAX_TOKENS_ESTIMATE`（从 runtimeConfig import）
- [ ] 4.5 `skillValidator.ts` 中将 `120000` 替换为 `MAX_SKILL_TIMEOUT_MS`（从 runtimeConfig import）

## 5. Refactor（保持绿灯）

- [ ] 5.1 合并 `hashJson` / `sha256Hex` / `hashText` 为单一 `hash(input: string): string` 函数 + 类型重载，消除命名碎片
- [ ] 5.2 确认共享模块是否放在 `services/shared/` 还是 `packages/shared/`，与 C4 建立的模式保持一致
- [ ] 5.3 检查 `nowTs` 的共享定义是否已为 fake timer 注入预留接口（如接受可选 `clock` 参数）

## 6. Evidence

- [ ] 6.1 记录 RUN_LOG（含 Red 失败证据、Green 通过证据与关键命令输出）
- [ ] 6.2 记录 Dependency Sync Check 的输入、核对结论与后续动作（无漂移/已更新）
- [ ] 6.3 记录 Main Session Audit（Audit-Owner/Reviewed-HEAD-SHA=签字提交 HEAD^/三项 PASS/Blocking-Issues=0/Decision=ACCEPT），并确认签字提交仅变更当前任务 RUN_LOG
