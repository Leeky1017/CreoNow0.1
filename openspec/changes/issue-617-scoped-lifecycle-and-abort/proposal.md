# 提案：issue-617-scoped-lifecycle-and-abort

更新时间：2026-02-22 19:37

## 背景

后端审计显示：项目切换 teardown 近似 no-op、多个 Map/Watcher/会话状态只进不出；同时 IPC timeout 仅拒绝 Promise，底层 handler 仍继续执行，形成“幽灵执行”与竞态风险。需要一个统一的“App / Project / Session”三层生命周期模型，并将 AbortController 贯穿 IPC 与后台任务执行链路，确保可取消、可回收、可复现。

## 变更内容

- 引入三层 ScopedLifecycle（App / Project / Session）的统一模型与可注册接口。
- ProjectLifecycle 作为项目级注册中心：在 `project:switch` 时统一执行 `unbind → db 写入 → bind` 序列，并对 teardown 有超时保护。
- IPC timeout/取消与 AbortController 联动：超时不止返回错误，还要中止底层执行，避免“幽灵任务”持续占用 CPU/IO。
- 对无界 Map 引入可替换抽象（如 BoundedMap LRU/TTL）作为基础治理资产。

## 受影响模块

- project-management — 项目切换必须触发资源卸载/绑定的可验证流程
- ipc — timeout/取消语义必须与底层执行绑定（AbortController）
- skill-system — 会话级资源（并发槽位、执行队列）必须可回收
- context-engine — project-scoped cache/watcher 必须可在切换时释放

## 不做什么

- 不在本 change 内引入 UtilityProcess（基础设施在 `issue-617-utilityprocess-foundation`）。
- 不在本 change 内重写 KG/RAG/Skill 的具体算法（由对应 change 覆盖）。
- 不改变外部 IPC 通道定义（仅增强取消/超时的可验证语义）。

## 依赖关系

- 上游依赖：无（可与 UtilityProcess 并行推进；但若底层执行迁移到 UtilityProcess，需要适配）
- 下游依赖：
  - `issue-617-kg-query-engine-refactor`
  - `issue-617-embedding-rag-offload`
  - `issue-617-skill-runtime-hardening`
  - `issue-617-ai-stream-write-guardrails`

## 依赖同步检查（Dependency Sync Check）

- 核对输入：
  - `openspec/specs/project-management/spec.md`
  - `openspec/specs/ipc/spec.md`
  - `openspec/specs/skill-system/spec.md`
  - `openspec/specs/context-engine/spec.md`
  - `/tmp/notion_cn_backend_vault/CN-Backend/CN 后端开发/资源生命周期管理（三层 ScopedLifecycle）.md`
  - `/tmp/notion_cn_backend_vault/CN-Backend/CN 后端开发/IPC 通信层审计（IPC Layer Audit）.md`
  - `/tmp/notion_cn_backend_vault/CN-Backend/CN 后端开发/Agent 问题发现汇总（CN 后端审计）.md`
- 核对项：
  - 项目切换必须触发 project-scoped 资源卸载；未卸载的资源列为阻断级缺陷。
  - timeout/取消必须中止底层执行（AbortController/信号传递），不得仅 reject 外层 Promise。
  - 会话级并发槽位必须在异常路径可回收（避免永久占用）。
- 结论：`PENDING`

## 来源映射

| 来源                                          | 提炼结论                                                               | 落地位置                                                            |
| --------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `资源生命周期管理（三层 ScopedLifecycle）.md` | 三层生命周期模型 + ProjectLifecycle 注册中心是治理“只进不出”的基线     | `specs/project-management/spec.md`、`specs/ipc/spec.md`、`tasks.md` |
| `IPC 通信层审计（IPC Layer Audit）.md`        | IPC 边界已有 envelope/校验/timeout，但需要把 timeout 与 abort 语义绑定 | `specs/ipc/spec.md`、`tasks.md`                                     |
| `Agent 问题发现汇总（CN 后端审计）.md`        | timeout 幽灵执行、并发槽位泄漏、watcher 不闭合是明确问题清单           | `tasks.md`、后续实现与测试                                          |

## 审阅状态

- Owner 审阅：`PENDING`
