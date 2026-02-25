# Memory System Specification Delta

更新时间：2026-02-25 23:50

## Change: audit-race-serialization-core

### Requirement: episodicMemoryService 并发状态访问必须通过 per-project 互斥锁保护 [ADDED]

`episodicMemoryService.ts` 内部维护 `distillingProjects`、`walQueueByProject`、`pendingEpisodeCountByProject` 等共享可变 Map/Set。所有对这些状态的读写**必须**在 per-project 互斥锁保护下执行，防止并发异步操作导致丢失更新或蒸馏遗漏。

#### Scenario: AUD-C1-S1 并发 recordEpisode 不丢失更新 [ADDED]

- **假设** 项目 P1 的 episodicMemoryService 已初始化，且当前无蒸馏任务运行
- **当** 两个并发的 `recordEpisode(P1, episodeA)` 和 `recordEpisode(P1, episodeB)` 同时执行
- **则** 两条 episode 均成功写入 `walQueueByProject`，无丢失
- **并且** `pendingEpisodeCountByProject` 的计数与实际队列长度一致

#### Scenario: AUD-C1-S2 recordEpisode 与 scheduleBatchDistillation 互斥 [ADDED]

- **假设** 项目 P1 有待蒸馏的 episode 队列
- **当** `recordEpisode(P1, episodeC)` 与 `scheduleBatchDistillation(P1)` 并发执行
- **则** `scheduleBatchDistillation` 获取锁后读取的队列快照是一致的（包含或不包含 episodeC，但不会出现部分状态）
- **并且** `executeDistillation` 处理的 episode 集合不会遗漏已入队的 episode

#### Scenario: AUD-C1-S3 不同项目的操作互不阻塞 [ADDED]

- **假设** 项目 P1 和项目 P2 的 episodicMemoryService 均已初始化
- **当** `recordEpisode(P1, ...)` 与 `recordEpisode(P2, ...)` 并发执行
- **则** 两个操作可并行完成，不互相阻塞
- **并且** P1 的锁不影响 P2 的操作延迟
