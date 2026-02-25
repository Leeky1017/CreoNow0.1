# 提案：audit-store-refresh-governance

更新时间：2026-02-25 23:50

## 背景

`kgStore.ts`、`memoryStore.ts`、`projectStore.tsx` 中几乎每个 mutation 操作后都有 `void get().refresh()` 形式的 fire-and-forget 全量重新加载（审计类别十二-12.1，约 20 处）。`renderer/src/lib/fireAndForget.ts` 将 Promise rejection 转为 `console.error`，其存在说明代码库中大量异步操作"不关心结果"（审计类别十二-12.2）。此外，审计类别十六识别出约 20 处 fire-and-forget 模式，如果 `catch` 回调本身抛出异常会被静默吞没，且无重试机制。不改的风险：关键路径的异步失败不可观测，store 状态可能与后端不一致而无任何告警，问题排查极其困难。

## 变更内容

- 将 `void get().refresh()` 关键路径替换为可追踪的异步策略（返回 Promise 并处理结果）
- 将 `fireAndForget.ts` 改造为可观测执行器：失败可被日志/状态捕获，关键操作有结构化错误上报
- 为关键 store mutation 后的刷新操作建立可追踪的错误处理链
- 保留非关键路径的 fire-and-forget 但确保失败可观测

## 受影响模块

- workbench (stores) — `kgStore.ts`、`memoryStore.ts`、`projectStore.tsx` 的刷新治理与 `fireAndForget.ts` 可观测化

## 不做什么

- 不实现乐观更新机制（属于更大范围的架构改造）
- 不改变 store 的公开 API 或 zustand 状态结构
- 不涉及 context fetcher 降级链（属于 C3 范围）
- 不涉及 editorStore 的 save queue（属于 C10 范围）
- 不改变非关键路径的 fire-and-forget 行为（如日志写入等）

## 依赖关系

- 上游依赖：
  - C1 `audit-race-serialization-core`（并发竞态修复后，store 刷新治理才能安全推进）
  - C3 `audit-degradation-telemetry-escalation`（可观测基础设施就绪后，fire-and-forget 改造可复用告警通道）
- 下游依赖：
  - C11 `audit-legacy-adapter-retirement`（store 刷新治理完成后，legacy adapter 清理更安全）

## 来源映射

| 来源 | 提炼结论 | 落地位置 |
| --- | --- | --- |
| 审计报告 §十二-12.1（`void get().refresh()` 模式） | 约 20 处 fire-and-forget 全量重载，store 无乐观更新 | `specs/workbench/spec.md`、`tasks.md` |
| 审计报告 §十二-12.2（`fireAndForget.ts` 工具函数） | Promise rejection 转 console.error，失败不可追踪 | `specs/workbench/spec.md`、`tasks.md` |
| 审计报告 §十六（Fire-and-forget 模式约 20 处） | catch 回调异常静默吞没，无重试机制 | `specs/workbench/spec.md`、`tasks.md` |
| 拆解计划 C9 | 风险中，规模 L，依赖 C1/C3 | `proposal.md` |

## 审阅状态

- Owner 审阅：`PENDING`
