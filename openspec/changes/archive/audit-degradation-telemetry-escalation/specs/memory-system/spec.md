# Memory System Specification Delta

更新时间：2026-02-25 23:50

## Change: audit-degradation-telemetry-escalation

### Requirement: memoryService 语义→确定性降级必须写入结构化日志 [ADDED]

`memoryService.ts` 的 memory injection preview 在 `vecRes` 失败时默默回退到 deterministic 模式，诊断信息仅埋在 `diagnostics.degradedFrom` 中。**必须**在降级发生时通过 `logger.warn()` 写入结构化日志。

#### Scenario: AUD-C3-S8 语义→确定性降级时写入 warn 日志 [ADDED]

- **假设** memoryService 的 memory injection preview 尝试使用语义模式
- **当** `vecRes` 返回失败，触发回退到 deterministic 模式
- **则** 通过 `logger.warn()` 写入结构化日志，包含降级原因、原始错误信息、项目 ID
- **并且** `diagnostics.degradedFrom` 字段仍正常填充（保持现有行为）

#### Scenario: AUD-C3-S9 memoryService 降级纳入全局降级计数器 [ADDED]

- **假设** 降级计数器已就绪（与 context fetcher 共享基础设施）
- **当** memoryService 连续 N 次触发语义→确定性降级
- **则** 触发告警升级
- **并且** 告警信息包含 memoryService 标识与连续降级次数
