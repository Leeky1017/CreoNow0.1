更新时间：2026-02-25 23:50

## 1. Specification

- [ ] 1.1 审阅并确认需求边界（并发竞态修复：episodicMemoryService per-project mutex、projectLifecycle switch lock、projectScopedCache singleflight）
- [ ] 1.2 审阅并确认错误路径与边界路径（必须覆盖：并发丢失更新、unbind/bind 交错、singleflight 异常透传、不同 key/project 互不阻塞）
- [ ] 1.3 审阅并确认验收阈值与不可变契约（测试确定性；并发场景必须可复现；无真实 I/O 依赖）
- [ ] 1.4 若存在上游依赖，先完成依赖同步检查（Dependency Sync Check）并记录"无漂移/已更新"；无依赖则标注 N/A（本 change：N/A）

## 2. TDD Mapping（先测前提）

- [ ] 2.1 将 delta spec 的每个 Scenario 映射为至少一个测试用例
- [ ] 2.2 为每个测试标注对应 Scenario ID，建立可追踪关系
- [ ] 2.3 设定门禁：未出现 Red（失败测试）不得进入实现

### Scenario -> 测试映射

| Scenario ID | 测试文件                                                                                    | 计划用例名 / 断言块                                                                      |
| ----------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| AUD-C1-S1   | `apps/desktop/main/src/__tests__/stress/episodic-memory-mutex.stress.test.ts`               | `concurrent recordEpisode should not lose updates`                                       |
| AUD-C1-S2   | `apps/desktop/main/src/__tests__/stress/episodic-memory-mutex.stress.test.ts`               | `recordEpisode and scheduleBatchDistillation should be mutually exclusive`                |
| AUD-C1-S3   | `apps/desktop/main/src/__tests__/stress/episodic-memory-mutex.stress.test.ts`               | `different projects should not block each other`                                         |
| AUD-C1-S4   | `apps/desktop/main/src/__tests__/stress/project-lifecycle-switch-lock.stress.test.ts`       | `concurrent switchProject should serialize without interleaving`                          |
| AUD-C1-S5   | `apps/desktop/main/src/__tests__/stress/project-lifecycle-switch-lock.stress.test.ts`       | `duplicate switchProject to same target should be idempotent`                             |
| AUD-C1-S6   | `apps/desktop/main/src/__tests__/contract/project-scoped-cache-singleflight.contract.test.ts` | `same key concurrent requests should trigger compute only once`                          |
| AUD-C1-S7   | `apps/desktop/main/src/__tests__/contract/project-scoped-cache-singleflight.contract.test.ts` | `different keys should not block each other`                                             |
| AUD-C1-S8   | `apps/desktop/main/src/__tests__/contract/project-scoped-cache-singleflight.contract.test.ts` | `singleflight compute failure should not cache error and should propagate to all callers` |

## 3. Red（先写失败测试）

- [ ] 3.1 **并发丢失更新**：构造 N 个并发 `recordEpisode(projectId)` 调用（共享同一 projectId），断言最终 `walQueueByProject` 条目数等于 N，无丢失（AUD-C1-S1）
- [ ] 3.2 **互斥验证**：并发触发 `recordEpisode` 与 `scheduleBatchDistillation`，断言 `distillingProjects` 在同一 project 上不存在交叠时间窗（AUD-C1-S2）
- [ ] 3.3 **跨 project 隔离**：并发操作不同 projectId，断言无互相阻塞、各自独立完成（AUD-C1-S3）
- [ ] 3.4 **switchProject 串行化**：并发触发 2 次 `switchProject(A→B, A→C)`，断言 unbind→persist→bind 序列无交错（AUD-C1-S4）
- [ ] 3.5 **switchProject 幂等**：同目标并发 `switchProject(A→B, A→B)`，断言仅执行一次完整序列（AUD-C1-S5）
- [ ] 3.6 **singleflight 去重**：同 key 并发 3 次 `getOrComputeString`，断言 compute 回调仅调用 1 次，3 个调用者拿到同一结果（AUD-C1-S6）
- [ ] 3.7 **singleflight 不同 key 隔离**：并发请求不同 key，断言各自独立触发 compute、互不阻塞（AUD-C1-S7）
- [ ] 3.8 **singleflight 异常透传**：compute 抛异常时，断言所有等待者均收到同一异常且缓存不被污染（AUD-C1-S8）

## 4. Green（最小实现通过）

- [ ] 4.1 实现 per-project `Mutex` 类（基于 Promise chain），为 `episodicMemoryService` 的 `recordEpisode` / `scheduleBatchDistillation` 在入口处 `await mutex.acquire(projectId)` → 业务逻辑 → `mutex.release(projectId)`
- [ ] 4.2 为 `projectLifecycle.switchProject()` 实现 per-project 串行锁：相同 project 的切换请求排队执行，不同 project 不阻塞
- [ ] 4.3 为 `projectScopedCache.getOrComputeString()` 实现 Promise-based singleflight：cache miss 时将 Promise 存入 inflight Map，后续同 key 请求直接 await 该 Promise；完成后从 inflight Map 移除
- [ ] 4.4 确保 singleflight 在 compute 抛异常时从 inflight Map 移除 key 且不写入缓存

## 5. Refactor（保持绿灯）

- [ ] 5.1 将 `Mutex` 和 `Singleflight` 抽取为 `services/shared/concurrency.ts` 中的通用原语，供 episodicMemoryService / projectLifecycle / projectScopedCache 统一引用
- [ ] 5.2 审查锁粒度：确认 per-project 锁的 Map key 使用 `projectId` 而非对象引用，避免 GC 后 key 失效
- [ ] 5.3 检查是否有多余的局部变量或中间状态可以简化，保持各 acquire/release 配对清晰可审计

## 6. Evidence

- [ ] 6.1 记录 RUN_LOG（含 Red 失败证据、Green 通过证据与关键命令输出）
- [ ] 6.2 记录 Dependency Sync Check 的输入、核对结论与后续动作（无漂移/已更新）
- [ ] 6.3 记录 Main Session Audit（Audit-Owner/Reviewed-HEAD-SHA=签字提交 HEAD^/三项 PASS/Blocking-Issues=0/Decision=ACCEPT），并确认签字提交仅变更当前任务 RUN_LOG
