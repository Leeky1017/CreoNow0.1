# IPC Specification Delta

更新时间：2026-02-22 19:37

## Change: issue-617-utilityprocess-foundation

### Requirement: UtilityProcess 执行与任务调度的稳定语义 [ADDED]

系统**必须**支持将 CPU/IO 密集任务卸载到 UtilityProcess 执行，并提供可测试的任务调度契约：

- 必须存在可复用的任务运行器（BackgroundTaskRunner），为调用方提供提交/等待结果/超时/取消/崩溃的稳定语义。
- 子进程崩溃时必须有明确的恢复策略：失败中的任务不得“静默丢失”，并应具备可观测与可复现的结果。

#### Scenario: BE-UPF-S1 BackgroundTaskRunner 返回五态机结果 [ADDED]

- **假设** 调用方向 UtilityProcess 提交后台任务
- **当** 任务执行完成/失败/超时/被取消/子进程崩溃
- **则** BackgroundTaskRunner 返回稳定的五态机 `status`（completed/error/timeout/aborted/crashed）
- **并且** 调用方无需依赖实现细节即可据此做降级/重试/回收

#### Scenario: BE-UPF-S2 子进程崩溃后的监督与确定性失败 [ADDED]

- **假设** UtilityProcess 在执行任务期间崩溃或被终止
- **当** Supervisor 检测到子进程退出并触发恢复流程
- **则** 该进程上的 in-flight 任务以可预期方式失败并返回 `crashed`（或等价稳定语义）
- **并且** Supervisor 可重启进程，使后续任务可继续提交执行

### Requirement: SQLite 读写分离与唯一写入者约束 [ADDED]

系统**必须**建立 SQLite 读写分离基线：Main/Compute 只读，Data 为唯一写入者，避免并发写与主线程阻塞风险。

#### Scenario: BE-UPF-S3 Main/Compute 只读，Data 为唯一写入者 [ADDED]

- **假设** 系统处于 UtilityProcess 双进程模式（Compute + Data），SQLite 使用 WAL
- **当** Main/Compute 尝试执行写操作，或 Data 执行写操作
- **则** Main/Compute 的写操作被拒绝（只读约束）
- **并且** 所有写操作仅由 DataProcess 执行并返回稳定结果
