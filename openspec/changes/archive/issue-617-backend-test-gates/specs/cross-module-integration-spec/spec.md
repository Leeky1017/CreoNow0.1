# Cross Module Integration Specification Delta

更新时间：2026-02-22 19:37

## Change: issue-617-backend-test-gates

### Requirement: Backend Lane 必须具备可执行的四层测试门禁（Contract/Performance/Stress/Integration） [ADDED]

Backend lane 的高风险重构（UtilityProcess/生命周期/查询引擎/流式写入）**必须**在进入实现前建立可执行、可复现的测试门禁：

- Contract Tests：验证关键抽象的稳定语义（不依赖外部系统）。
- Performance Benchmarks：可检测性能回退（阈值明确，结果可解释）。
- Stress Tests：覆盖极端场景（大量块写入/大量切换/并发风暴）。
- Integration Tests：验证跨模块链路（IPC + service + 数据层）的协同契约。

#### Scenario: BE-TG-S1 BackgroundTaskRunner 覆盖五态机契约 [ADDED]

- **假设** 后台任务运行器提供提交/等待/超时/取消/崩溃恢复能力
- **当** 执行 Contract Test
- **则** 必须覆盖 completed/error/timeout/aborted/crashed 的稳定返回语义
- **并且** 失败原因可被断言而非依赖日志人工判断

#### Scenario: BE-TG-S2 ProjectLifecycle 项目切换与资源清理契约可回归 [ADDED]

- **假设** 系统存在 project-scoped 资源（cache、watcher、session map）
- **当** 执行 Contract Test 覆盖项目切换
- **则** 必须验证 unbind/bind 顺序与资源清理行为
- **并且** 超时/失败路径可复现

#### Scenario: BE-TG-S3 IPC timeout 必须中止底层执行（无幽灵执行） [ADDED]

- **假设** 某些 IPC handler 会触发长耗时 CPU/IO
- **当** 执行 Contract/Integration Test 并触发 timeout
- **则** 必须验证 timeout 会中止底层执行（AbortSignal/等价机制）
- **并且** 不会出现 timeout 后底层仍持续运行的幽灵执行

#### Scenario: BE-TG-S4 KG 查询性能基准可检测回退 [ADDED]

- **假设** KG 查询存在大图场景（节点/边规模上升）
- **当** 执行 Performance Benchmark
- **则** 基准测试可对比“优化路径 vs 基线路径”的耗时差异
- **并且** 失败时给出可解释的回退信号（而非随机波动）

#### Scenario: BE-TG-S5 AI 流式写入压力测试验证一致性与可取消性 [ADDED]

- **假设** AI 流式写入存在高吞吐与中断场景（如 1000 blocks）
- **当** 执行 Stress/Integration Test 并在中途触发取消
- **则** 系统保持可响应且最终一致（无部分写入/可回滚）
- **并且** 测试不依赖真实网络或真实 LLM（必须 mock）
