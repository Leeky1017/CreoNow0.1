更新时间：2026-02-23 20:02

## 1. Specification

- [x] 1.1 阅读并确认 scope：`openspec/changes/issue-606-phase-2-shell-decomposition/*`
- [x] 1.2 阅读 `openspec/specs/workbench/spec.md`、`openspec/specs/ipc/spec.md`（以现行 SSOT 为准）
- [x] 1.3 建立验收阈值：AppShell 职责三拆 + viewport ownership + IPC service convergence（不引入新业务能力）
- [x] 1.4 Dependency Sync Check：Phase 1 已归档（`openspec/changes/archive/issue-606-phase-1-stop-bleeding`），结论记录为 `NO_DRIFT/UPDATED`

## 2. TDD Mapping（先测前提）

- [x] 2.1 将 `openspec/changes/issue-606-phase-2-shell-decomposition/tasks.md` 中所有 Scenario 映射到测试（保留 Scenario ID）
- [x] 2.2 设定门禁：未出现 Red（失败测试）不得进入实现
- [x] 2.3 确认测试确定性与隔离（不依赖时间/随机/网络；必要时 mock）

## 3. Red（先写失败测试）

- [x] 3.1 为 AppShell decomposition 写失败测试（职责边界、状态归属、组合后的行为一致）
- [x] 3.2 为 viewport ownership 写失败测试（非 Shell 组件禁止接管 viewport）
- [x] 3.3 为 IPC boundary 写失败测试（feature 禁止绕过 service 直接触达 IPC/bridge）
- [x] 3.4 RUN_LOG 记录 Red 命令与失败输出

## 4. Green（最小实现通过）

- [x] 4.1 以最小变更完成 `LayoutShell` / `NavigationController` / `PanelOrchestrator` 落地并接入 `AppShell`
- [x] 4.2 修复/迁移 viewport 越权用法，使 Red 转绿（以测试约束为准）
- [x] 4.3 renderer IPC 调用入口收敛到 `apps/desktop/renderer/src/services/**`，并保证错误策略一致

## 5. Refactor（保持绿灯）

- [x] 5.1 去重与整理壳层与 service 的边界，保持测试全绿
- [x] 5.2 回归 type/lint/unit/contract/cross-module（与 required checks 对齐）

## 6. Evidence

- [x] 6.1 维护 `openspec/_ops/task_runs/ISSUE-616.md`（Dependency Sync + Red/Green 证据）
- [x] 6.2 提交 PR 并开启 auto-merge；required checks：`ci` / `openspec-log-guard` / `merge-serial`
- [x] 6.3 合并后同步控制面 `main`，并归档 Rulebook task（允许同 PR 自归档）
