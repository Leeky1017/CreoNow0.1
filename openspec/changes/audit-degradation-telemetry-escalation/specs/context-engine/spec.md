# Context Engine Specification Delta

更新时间：2026-02-25 23:50

## Change: audit-degradation-telemetry-escalation

### Requirement: context fetcher 降级路径必须写入结构化日志并支持告警升级 [ADDED]

`rulesFetcher.ts`、`retrievedFetcher.ts`、`settingsFetcher.ts` 的降级路径**必须**通过 `logger.warn()` 写入结构化日志（含 fetcher 名称、降级原因、时间戳），替代仅存于内存的 warning 字符串。连续 N 次降级**必须**触发告警升级。

#### Scenario: AUD-C3-S1 fetcher 降级时写入结构化 warn 日志 [ADDED]

- **假设** rulesFetcher 的 `entityList` 调用返回 `!ok`
- **当** fetcher 执行降级路径返回空 chunks + warning
- **则** 同时通过 `logger.warn()` 写入结构化日志，包含 fetcher 名称、降级原因、原始错误信息
- **并且** 日志格式可被日志采集系统解析

#### Scenario: AUD-C3-S2 连续 N 次降级触发告警升级 [ADDED]

- **假设** 降级计数器阈值 N 已配置（如 N=3）
- **当** 同一 fetcher 连续 N 次触发降级
- **则** 系统发出告警升级（通过 `logger.error()` 或专用告警通道）
- **并且** 告警信息包含 fetcher 名称、连续降级次数、首次降级时间

#### Scenario: AUD-C3-S3 降级恢复后计数器重置 [ADDED]

- **假设** 某 fetcher 已连续降级 N-1 次
- **当** 下一次调用成功（未触发降级）
- **则** 该 fetcher 的降级计数器重置为 0
- **并且** 不触发告警升级

#### Scenario: AUD-C3-S4 embeddingService fallback 失败记录结构化日志 [ADDED]

- **假设** embeddingService 的 primary provider 失败，触发 fallback
- **当** fallback provider 也失败
- **则** 通过 `logger.warn()` 记录 primary 和 fallback 的失败原因
- **并且** 不再静默丢弃 fallback 错误信息
