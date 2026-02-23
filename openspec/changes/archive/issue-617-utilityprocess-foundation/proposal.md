# 提案：issue-617-utilityprocess-foundation

更新时间：2026-02-23 16:18

## 背景

当前 CN 后端所有 CPU/IO 密集任务运行在同一主线程，导致 IPC 全局阻塞、UI 卡顿、以及“超时只拒绝 Promise 但底层任务继续执行”的隐性雪崩风险。Notion 后端审计明确给出“UtilityProcess 双进程（Compute + Data）”作为后续 KG/RAG/Skill 优化的基础设施前置依赖。

## 变更内容

- 引入固定用途的 UtilityProcess：ComputeProcess（CPU 密集）与 DataProcess（IO + 唯一写入者）。
- 定义 BackgroundTaskRunner 抽象：提交任务、等待结果、超时/取消、崩溃恢复的五态机语义。
- 建立 SQLite 读写分离基础规则：Main/Compute 只读，Data 唯一写入者（WAL 一写多读）。
- 为后续模块迁移提供统一的跨进程消息协议与可测的契约边界。

## 受影响模块

- ipc — 进程内 IPC handler 的“执行位置”将扩展为跨进程调度，但 envelope/校验/ACL 等边界不变
- search-and-retrieval — embedding/FTS/RAG 等 CPU 密集将迁移到 ComputeProcess
- knowledge-graph — 图遍历与检索将迁移到 ComputeProcess
- skill-system — 执行器与 FS/DB 写入将逐步迁移到 UtilityProcess

## 不做什么

- 不在本 change 内交付 KG/RAG/Skill 的具体重构（由后续 change 覆盖）。
- 不做进程池化与动态扩缩容（固定 2 个进程）。
- 不改变现有业务域 IPC 通道命名与外部调用契约（只重塑执行位置与内部边界）。

## 依赖关系

- 上游依赖：无（基础设施可先行）
- 下游依赖：
  - `issue-617-kg-query-engine-refactor`
  - `issue-617-embedding-rag-offload`
  - `issue-617-skill-runtime-hardening`
  - `issue-617-ai-stream-write-guardrails`（若事务合并/写入队列落到 DataProcess）

## 依赖同步检查（Dependency Sync Check）

- 核对输入：
  - `openspec/specs/ipc/spec.md`
  - `openspec/specs/knowledge-graph/spec.md`
  - `openspec/specs/search-and-retrieval/spec.md`
  - `openspec/specs/skill-system/spec.md`
  - `/tmp/notion_cn_backend_vault/CN-Backend/CN 后端开发/UtilityProcess 双进程架构（Compute + Data）.md`
  - `/tmp/notion_cn_backend_vault/CN-Backend/CN 后端开发/主进程架构总览（Main Process Architecture）.md`
- 核对项：
  - 进程划分遵循“Compute 只读 + CPU 密集、Data 写入 + IO 密集”的固定职责边界。
  - BackgroundTaskRunner 的状态机语义可测试、可观测（日志/metrics），并对超时/取消/崩溃具备稳定返回。
  - SQLite WAL 读写分离不改变数据一致性契约（DataProcess 作为唯一写入者）。
- 结论：`N/A（NO_UPSTREAM_DEPENDENCY）`

## 来源映射

| 来源                                             | 提炼结论                                                                          | 落地位置                                     |
| ------------------------------------------------ | --------------------------------------------------------------------------------- | -------------------------------------------- |
| `UtilityProcess 双进程架构（Compute + Data）.md` | 2 个固定 UtilityProcess + BackgroundTaskRunner + 读写分离是所有后续优化的前置依赖 | `specs/ipc/spec.md`、`tasks.md`              |
| `主进程架构总览（Main Process Architecture）.md` | 当前入口装配在 `index.ts`，需要在启动流程中引入子进程生命周期管理                 | `tasks.md`、后续实现代码（非本 change 输出） |

## 审阅状态

- Owner 审阅：`PENDING`
