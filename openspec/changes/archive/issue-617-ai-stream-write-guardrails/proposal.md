# 提案：issue-617-ai-stream-write-guardrails

更新时间：2026-02-25 18:50

## 背景

AI 流式输出存在“机枪式输出 vs 人类节奏存储”的结构性矛盾：若每个 token/chunk 都触发落盘写入，会造成 SQLite 写放大与主线程阻塞；若 IPC 推送无节流，渲染进程可能 OOM；若中断无回滚，可能留下不一致的脏数据。需要建立 Chunk Batching、事务合并、写入背压、Abort+Rollback 的完整防护链路。

## 变更内容

- Chunk Batching：以时间窗口/数量阈值合并流式 chunk 推送，避免 IPC 事件风暴。
- Transaction Batching：一次完整 AI 生成周期 = 单个 SQLite 事务；中断整体 rollback。
- Write Backpressure：写入队列深度超限时，暂停消费上游流或降级（丢弃低优先级 chunk）。
- Abort + Rollback：取消信号贯穿 fetch/SSE/写入队列，确保一致性。

## 受影响模块

- ai-service — 流式响应与取消竞态的外部体验与性能阈值
- ipc — push 背压与事件风暴的容量契约
- document-management — AI 写入落盘的一致性与回滚边界（不留下脏数据）

## 不做什么

- 不做前端渲染侧的 RAF 节流/虚拟化（属于渲染层优化）。
- 不更换现有 IPC pushBackpressure 设计（在其上方补齐 batching/队列/事务语义）。
- 不改变 AI 面板 UI 交互，只增强后端防护与可验证契约。

## 依赖关系

- 上游依赖：
  - `issue-617-scoped-lifecycle-and-abort`（Abort/取消语义）
  - `issue-617-utilityprocess-foundation`（若写入队列/事务合并落到 DataProcess）
- 下游依赖：
  - 任何涉及 AI 流式写入/导出/追踪的稳定性与一致性保障

## 依赖同步检查（Dependency Sync Check）

- 核对输入：
  - `openspec/specs/ai-service/spec.md`
  - `openspec/specs/ipc/spec.md`
  - `openspec/specs/document-management/spec.md`
  - `/tmp/notion_cn_backend_vault/CN-Backend/CN 后端开发/AI 流式写入防护策略.md`
  - `/tmp/notion_cn_backend_vault/CN-Backend/CN 后端开发/IPC 通信层审计（IPC Layer Audit）.md`
- 核对项：
  - 流式 chunk 的延迟指标与“取消优先”竞态规则保持与主 spec 一致。
  - IPC push 背压策略满足容量约束（5,000 events/s 上限）且控制事件必达。
  - 事务合并与 rollback 不引入“部分提交”的中间态可见性。
- 结论：`NO_DRIFT`

## 来源映射

| 来源                                   | 提炼结论                                                   | 落地位置                                                    |
| -------------------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------- |
| `AI 流式写入防护策略.md`               | batching + 事务合并 + 背压 + abort/rollback 四道防线       | `specs/ai-service/spec.md`、`specs/ipc/spec.md`、`tasks.md` |
| `IPC 通信层审计（IPC Layer Audit）.md` | pushBackpressure 作为 IPC 层防线，需要与上层 batching 配合 | `specs/ipc/spec.md`、`tasks.md`                             |

## 审阅状态

- Owner 审阅：`PENDING`
