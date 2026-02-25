# 提案：issue-617-skill-runtime-hardening

更新时间：2026-02-25 09:13

## 背景

Skill 系统存在 P0/P1 阻塞点：每次操作同步扫描目录并逐个 readFileSync；Skill 文件读写为同步 FS；SkillScheduler 缺少 completion 丢失兜底，可能导致并发槽位永久占用。需要引入注册表懒加载 + 项目级缓存、将 FS I/O 异步化并迁移到 DataProcess，同时增强调度器的超时/取消与回收能力。

## 变更内容

- SkillRegistry：懒加载 + 项目级缓存（有上限），并对 project switch 自动 invalidate。
- Skill 文件 I/O 异步化：通过 DataProcess 执行 `readdir/read/write`，主进程只调度。
- SkillScheduler：补齐超时回收与 completion 丢失兜底；并发语义保持可预测（全局上限 8，队列化）。
- AbortController 贯穿技能执行链路，取消优先于完成竞态。

## 受影响模块

- skill-system — 技能发现/加载/调度/执行的性能与可靠性契约
- ipc — 取消/超时的边界语义与错误 envelope
- project-management — 项目切换触发技能缓存/监听器释放

## 不做什么

- 不修改技能 Prompt 内容与业务语义（只治理运行时与 I/O）。
- 不在本 change 内重写 AI provider 或 context assemble（由其他 change 覆盖）。
- 不引入新的技能包格式或外部插件体系（保持现有 packages）。

## 依赖关系

- 上游依赖：
  - `issue-617-utilityprocess-foundation`（DataProcess 承载 FS/写入）
  - `issue-617-scoped-lifecycle-and-abort`（project/session scope + abort）
- 下游依赖：
  - AI 续写与技能执行的端到端稳定性（减少阻塞与槽位泄漏）

## 依赖同步检查（Dependency Sync Check）

- 核对输入：
  - `openspec/specs/skill-system/spec.md`
  - `openspec/specs/ipc/spec.md`
  - `openspec/specs/project-management/spec.md`
  - `openspec/changes/archive/issue-617-skill-runtime-hardening/specs/skill-system/spec.md`
  - `openspec/changes/archive/issue-617-skill-runtime-hardening/tasks.md`
  - `openspec/_ops/task_runs/ISSUE-644.md`
- 核对项：
  - Skill 系统的全局并发上限与队列语义不变（稳定可预测）。
  - 取消优先级明确：取消与完成竞态时必须以取消为准。
  - FS I/O 从同步改为异步，不引入数据一致性问题（写入原子性由 baseline change 兜底）。
- 结论：`NO_DRIFT`（2026-02-24）
  - `issue-617-utilityprocess-foundation` 与 `issue-617-scoped-lifecycle-and-abort` 已归档，前置契约稳定。
  - 当前 change 的异步 FS（DataProcess）与 Abort/slot 回收约束与上游输出一致，无需补丁更新即可进入 Red。

## 来源映射

| 来源                                                                                    | 提炼结论                                                               | 落地位置                                                      |
| --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------- |
| `openspec/changes/archive/issue-617-skill-runtime-hardening/specs/skill-system/spec.md` | 懒加载 + cache、FS I/O 异步化、调度器兜底与 Abort 联动                 | `specs/skill-system/spec.md`、`specs/ipc/spec.md`、`tasks.md` |
| `openspec/_ops/task_runs/ISSUE-644.md`                                                  | 同步全目录扫描、同步 FS、槽位泄漏等风险已通过 Red/Green 与回归验证收敛 | `tasks.md`、后续回归校验                                      |
| `openspec/specs/ipc/spec.md`                                                            | IPC 边界工程标准保持 envelope/校验/ACL 不回退                          | `tasks.md`                                                    |

## 审阅状态

- Owner 审阅：`PENDING`
