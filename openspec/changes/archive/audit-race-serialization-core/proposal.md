# 提案：audit-race-serialization-core

更新时间：2026-02-25 23:50

## 背景

审计报告（十五-15.1/15.2/15.3）发现 3 处高风险竞态条件：`episodicMemoryService.ts` 内部多个共享可变 Map/Set 在并发异步操作中无同步机制，可导致丢失更新与蒸馏遗漏；`projectLifecycle.ts` 的 `switchProject()` 执行 unbind→persist→bind 序列无锁保护，并发切换会交错执行；`projectScopedCache.ts` 的 `getOrComputeString()` 在 cache miss 时无去重，并发请求同一 key 触发多次计算。不修复将导致数据丢失、项目状态污染、计算资源浪费。

## 变更内容

- 为 `episodicMemoryService.ts` 引入 per-project 互斥锁，保护 `distillingProjects`、`walQueueByProject`、`pendingEpisodeCountByProject` 等共享可变状态的并发访问
- 为 `projectLifecycle.ts` 的 `switchProject()` 添加项目切换锁，确保 unbind→persist→bind 序列原子执行
- 为 `projectScopedCache.ts` 的 `getOrComputeString()` 实现 Promise-based singleflight 去重，同 key 并发请求仅触发一次计算

## 受影响模块

- memory-system — episodicMemoryService 并发状态保护
- project-management — projectLifecycle 项目切换串行化
- context-engine — projectScopedCache 缓存计算去重

## 不做什么

- 不重构 episodicMemoryService 的整体架构，仅在现有结构上加锁
- 不改变 projectLifecycle 的 unbind→persist→bind 业务流程
- 不引入分布式锁或跨进程同步机制（当前为单进程场景）
- 不处理 fire-and-forget 模式（属于 C9 范围）

## 依赖关系

- 上游依赖：无
- 下游依赖：C9（`audit-store-refresh-governance`）依赖本 change 的并发治理基础

## 来源映射

| 来源 | 提炼结论 | 落地位置 |
| --- | --- | --- |
| 审计报告 十五-15.1 | episodicMemoryService 并发状态访问需 per-project 互斥锁 | `specs/memory-system/spec.md` |
| 审计报告 十五-15.2 | projectLifecycle 并发切换需 per-project 锁 | `specs/project-management/spec.md` |
| 审计报告 十五-15.3 | projectScopedCache 需 singleflight 去重 | `specs/context-engine/spec.md` |

## 审阅状态

- Owner 审阅：`PENDING`
