更新时间：2026-02-25 23:50

## 1. Specification

- [ ] 1.1 审阅并确认需求边界（void get().refresh() 替换为可追踪异步, fire-and-forget 改可观测执行器）
- [ ] 1.2 审阅并确认错误路径与边界路径（刷新失败可捕获；可观测执行器 catch 回调异常不被吞没）
- [ ] 1.3 审阅并确认验收阈值与不可变契约（关键路径 void refresh 清零；非关键路径可观测但不阻塞）
- [ ] 1.4 若存在上游依赖，先完成依赖同步检查（Dependency Sync Check）并记录"无漂移/已更新"；无依赖则标注 N/A（本 change：上游依赖 C1 `audit-race-serialization-core` 和 C3 `audit-degradation-telemetry-escalation`）

## 2. TDD Mapping（先测前提）

- [ ] 2.1 将 delta spec 的每个 Scenario 映射为至少一个测试用例
- [ ] 2.2 为每个测试标注对应 Scenario ID，建立可追踪关系
- [ ] 2.3 设定门禁：未出现 Red（失败测试）不得进入实现

### Scenario -> 测试映射

| Scenario ID | 测试文件 | 计划用例名 / 断言块 |
| ----------- | --- | --- |
| AUD-C9-S1 | `apps/desktop/renderer/src/__tests__/unit/store-refresh-governance.test.ts` | `refresh failure after mutation should be captured (not silently discarded by void)` |
| AUD-C9-S2 | `apps/desktop/renderer/src/__tests__/unit/store-refresh-governance.test.ts` | `kgStore mutation should return Promise from refresh (not void)` |
| AUD-C9-S3 | `apps/desktop/renderer/src/__tests__/unit/store-refresh-governance.test.ts` | `memoryStore mutation should return Promise from refresh (not void)` |
| AUD-C9-S4 | `apps/desktop/renderer/src/__tests__/unit/store-refresh-governance.test.ts` | `projectStore mutation should return Promise from refresh (not void)` |
| AUD-C9-S5 | `apps/desktop/renderer/src/__tests__/unit/observable-executor.test.ts` | `observable executor should record structured failure details (not just console.error)` |
| AUD-C9-S6 | `apps/desktop/renderer/src/__tests__/unit/observable-executor.test.ts` | `observable executor catch callback exception should be safely captured (no unhandledRejection)` |
| AUD-C9-S7 | `apps/desktop/renderer/src/__tests__/integration/observable-executor-non-critical.test.ts` | `non-critical path failure should be logged but not block main flow` |
| AUD-C9-S8 | `apps/desktop/renderer/src/__tests__/unit/store-refresh-governance.test.ts` | `static scan should confirm zero void get().refresh() in critical mutation paths` |

## 3. Red（先写失败测试）

- [ ] 3.1 **刷新失败可捕获**：mock `refresh()` 抛异常，在 mutation 调用后断言异常可被 caller 捕获（不被 `void` 丢弃）（AUD-C9-S1）
- [ ] 3.2 **kgStore 返回 Promise**：调用 kgStore mutation（如 `addEntity`），断言返回值为 Promise 且 resolve 后 refresh 已完成（AUD-C9-S2）
- [ ] 3.3 **memoryStore 返回 Promise**：同理验证 memoryStore mutation（AUD-C9-S3）
- [ ] 3.4 **projectStore 返回 Promise**：同理验证 projectStore mutation（AUD-C9-S4）
- [ ] 3.5 **可观测执行器错误记录**：触发 observable executor 中的 failure，断言结构化失败信息被记录（非仅 console.error 字符串）（AUD-C9-S5）
- [ ] 3.6 **catch 回调异常安全**：observable executor 的 catch 回调自身抛异常，断言不产生 unhandledRejection（AUD-C9-S6）
- [ ] 3.7 **非关键路径不阻塞**：非关键 fire-and-forget 操作失败，断言主流程正常完成且失败被日志记录（AUD-C9-S7）
- [ ] 3.8 **静态扫描零 void refresh**：扫描关键 mutation 路径源码，断言不含 `void get().refresh()` 或 `void this.refresh()` 模式（AUD-C9-S8）

## 4. Green（最小实现通过）

- [ ] 4.1 将 kgStore / memoryStore / projectStore 中关键 mutation 的 `void get().refresh()` 改为 `await get().refresh()`，使 mutation 方法返回 `Promise<void>`
- [ ] 4.2 实现 `ObservableExecutor`：接受 `() => Promise<void>` 和可选 `onError` 回调，内部 catch 异常后写入结构化日志，且 onError 自身异常被安全捕获
- [ ] 4.3 将非关键路径的 fire-and-forget 调用改为 `ObservableExecutor.run(fn, { onError: logger.warn })`
- [ ] 4.4 改造 `fireAndForget.ts` 为 `ObservableExecutor` 的简便包装，保留现有调用方兼容

## 5. Refactor（保持绿灯）

- [ ] 5.1 将 `ObservableExecutor` 抽取为 `renderer/src/lib/observableExecutor.ts` 独立模块，附完整 JSDoc
- [ ] 5.2 评估是否可删除 `fireAndForget.ts`（如所有调用方已迁移到 ObservableExecutor），或保留为薄包装
- [ ] 5.3 确认关键 vs 非关键路径的划分标准已文档化（如注释或常量命名），避免后续混淆

## 6. Evidence

- [ ] 6.1 记录 RUN_LOG（含 Red 失败证据、Green 通过证据与关键命令输出）
- [ ] 6.2 记录 Dependency Sync Check 的输入、核对结论与后续动作（无漂移/已更新）
- [ ] 6.3 记录 Main Session Audit（Audit-Owner/Reviewed-HEAD-SHA=签字提交 HEAD^/三项 PASS/Blocking-Issues=0/Decision=ACCEPT），并确认签字提交仅变更当前任务 RUN_LOG
