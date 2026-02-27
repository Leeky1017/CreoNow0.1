# Memory System Specification Delta

更新时间：2026-02-26 15:18

## Change: audit-race-serialization-core

### Requirement: episodicMemoryService 并发状态访问必须通过 per-project 互斥锁保护 [ADDED]

`episodicMemoryService.ts` 内部维护 `distillingProjects`、`scheduledBatchDistillProjects`、`pendingEpisodeCountByProject` 等共享可变 Map/Set，并在 `recordEpisode` 持久化与 `distillSemanticMemory`（手动触发）读取项目级 episode 快照时存在并发竞争。所有对这些共享状态的读写与“写入 episode / 触发蒸馏 / 读取快照”决策**必须**在 per-project 互斥锁保护下执行，防止并发异步操作导致丢失更新或蒸馏遗漏。

#### Scenario: AUD-C1-S1 并发 recordEpisode 不丢失更新 [ADDED]

- **假设** 项目 P1 的 episodicMemoryService 已初始化，且当前无蒸馏任务运行
- **当** 两个并发的 `recordEpisode(P1, episodeA)` 和 `recordEpisode(P1, episodeB)` 同时执行
- **则** 两条 episode 均成功持久化并可被项目级 episode 快照读取，无丢失
- **并且** 随后手动触发 `distillSemanticMemory({ projectId: P1, trigger: "manual" })` 时，读取到的快照与已持久化结果一致（不遗漏已写入 episode）

#### Scenario: AUD-C1-S2 recordEpisode 与 distillSemanticMemory（manual）互斥 [ADDED]

- **假设** 项目 P1 有待蒸馏的 episode 队列
- **当** `recordEpisode(P1, episodeC)` 与 `distillSemanticMemory({ projectId: P1, trigger: "manual" })` 并发执行
- **则** 两者在同一 project 上串行化执行，不出现互斥区交叠
- **并且** `distillSemanticMemory` 读取的队列快照是一致的（包含或不包含 episodeC，但不会出现部分状态），`executeDistillation` 处理的 episode 集合不会遗漏已入队的 episode

#### Scenario: AUD-C1-S3 不同项目的操作互不阻塞 [ADDED]

- **假设** 项目 P1 和项目 P2 的 episodicMemoryService 均已初始化
- **当** `recordEpisode(P1, ...)` 与 `recordEpisode(P2, ...)` 并发执行
- **则** 两个操作可并行完成，不互相阻塞
- **并且** P1 的锁不影响 P2 的操作延迟
