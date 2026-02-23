# 提案：issue-617-global-hardening-baseline

更新时间：2026-02-22 19:37

## 背景

当前 CN 后端（Electron 主进程）存在“基础防护缺口”，会放大后续所有重构与性能优化的风险：

- SQLite 连接缺少关键 PRAGMA（`busy_timeout` / `synchronous` / `mmap_size` / `cache_size`），在并发与 WAL 场景下更易出现 `SQLITE_BUSY` 或性能退化。
- 缺少全局异常捕获与统一优雅停机链路，初始化阶段与运行中异常可能直接导致进程崩溃、WAL 未 checkpoint、数据落盘不完整。
- BrowserWindow 安全防护不完整（新窗口创建与导航限制），存在安全边界缺口。
- 关键文件写入路径缺少“原子写”约束，崩溃/断电可能导致元数据损坏。

以上问题独立于 UtilityProcess/KG/RAG 等大重构，可作为“后端健壮性底线”先行落地。

## 变更内容

- 为主进程 SQLite 连接补齐推荐 PRAGMA，并提供可复用的 `applyRecommendedPragmas()` 基线。
- 引入全局异常捕获（`uncaughtException` / `unhandledRejection`）与统一优雅停机链路（含超时保护）。
- 补齐 BrowserWindow 安全防护：拦截 `window.open`、限制导航到非白名单来源。
- 为关键元数据/导出落盘引入原子写策略（临时文件 + rename），避免中断导致损坏。

## 受影响模块

- ipc — 错误/超时与“不可泄漏”边界语义不变，但需要补充“崩溃/停机”相关的可验证契约点
- document-management — 保存/导出落盘的原子性与失败策略
- version-control — autosave/快照链路在异常/停机下的安全边界

## 不做什么

- 不引入 UtilityProcess 双进程架构（该内容在 `issue-617-utilityprocess-foundation`）。
- 不重构 KG/RAG/Skill 的性能路径（由对应 change 覆盖）。
- 不新增业务能力，仅补齐基础防护底线。

## 依赖关系

- 上游依赖：无（可独立执行）
- 下游依赖：
  - 后续所有 backend lane change（作为健壮性基线，降低调试成本与数据风险）

## 依赖同步检查（Dependency Sync Check）

- 核对输入：
  - `openspec/specs/ipc/spec.md`
  - `openspec/specs/document-management/spec.md`
  - `openspec/specs/version-control/spec.md`
  - `/tmp/notion_cn_backend_vault/CN-Backend/CN 后端开发/全局健壮性加固.md`
  - `/tmp/notion_cn_backend_vault/CN-Backend/CN 后端开发/数据层设计（SQLite & DAO）.md`
  - `/tmp/notion_cn_backend_vault/CN-Backend/CN 后端开发/主进程架构总览（Main Process Architecture）.md`
- 核对项：
  - SQLite PRAGMA 的新增不改变业务语义（仅影响性能与并发等待策略），并且具备可审计证据（日志/测试）。
  - 全局异常捕获不 swallow 异常：必须记录、触发停机链路、最终退出（避免“半死不活”运行）。
  - BrowserWindow 安全策略不会破坏开发模式正常页面加载（仅约束新窗口与越权导航）。
  - 原子写策略覆盖关键写入路径，不引入跨平台路径/权限问题。
- 结论：`PENDING`

## 来源映射

| 来源                                             | 提炼结论                                                              | 落地位置                                                             |
| ------------------------------------------------ | --------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `全局健壮性加固.md`                              | SQLite PRAGMA、全局异常捕获、窗口安全、原子写是“可立即启动”的底线加固 | `specs/ipc/spec.md`、`specs/document-management/spec.md`、`tasks.md` |
| `数据层设计（SQLite & DAO）.md`                  | better-sqlite3 + WAL 为核心配置面，PRAGMA 是统一入口                  | `tasks.md`、后续实现代码（非本 change 输出）                         |
| `主进程架构总览（Main Process Architecture）.md` | 入口链路在 `index.ts`，异常捕获需在 `app.whenReady()` 前注册          | `specs/ipc/spec.md`、`tasks.md`                                      |

## 审阅状态

- Owner 审阅：`PENDING`
