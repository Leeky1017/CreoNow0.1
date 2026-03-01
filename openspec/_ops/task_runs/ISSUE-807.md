# ISSUE-807

更新时间：2026-03-01 16:03

- Issue: #807
- Branch: task/807-fe-leftpanel-dialog-migration
- PR: TBD

## Plan

- 执行 `fe-leftpanel-dialog-migration`：左侧 Sidebar 收敛为结构化导航（仅 files/outline 停靠）。
- 将 search 迁移到 Spotlight，将 memory/characters/knowledgeGraph/versionHistory 迁移到统一 Dialog 容器。
- 保持 files/outline 停靠行为不变，并以测试验证迁移不引入回归。

## Runs

### 2026-03-01 15:41 Red — 迁移测试先失败（实现前）

- Command: `pnpm -C apps/desktop test:run components/layout/IconBar.dialog-migration`
- Exit code: `1`
- Key output: 在旧实现中，`memory` 与 `search` 仍走 `setActiveLeftPanel(...)`，缺少 `dialogType` / `spotlightOpen` 状态，导致迁移场景断言失败。
- Notes: 失败符合 `WB-FE-S3-S1/S2/S3` 的预期红灯，用于约束后续最小实现范围。

### 2026-03-01 16:00 Green — IconBar Dialog Migration 定向测试

- Command: `pnpm -C apps/desktop test:run components/layout/IconBar.dialog-migration`
- Exit code: `0`
- Key output:
  - `Test Files 1 passed (1)`
  - `Tests 3 passed (3)`
  - `Duration 2.37s`

### 2026-03-01 16:00 Green — Typecheck

- Command: `pnpm -C apps/desktop typecheck`
- Exit code: `0`
- Key output: `tsc -p tsconfig.json --noEmit` completed without diagnostics.

### 2026-03-01 16:01 Full Regression — desktop 全量测试

- Command: `pnpm -C apps/desktop test:run`
- Exit code: `0`
- Key output:
  - `Test Files 192 passed (192)`
  - `Tests 1559 passed (1559)`
  - `Duration 43.28s`

### 2026-03-01 16:01 Dependency Sync Check

- D1（IconBar `media` 处置）: 已按 Owner 决策保留 `[FUTURE]`，本次不改该入口行为。
- D2（`graph` vs `knowledgeGraph` 命名）: 统一使用 `knowledgeGraph`。
- `fe-hotfix-searchpanel-backdrop-close`: 已归档于 `openspec/changes/archive/fe-hotfix-searchpanel-backdrop-close`，依赖状态无漂移。

## Main Session Audit

- Audit-Owner: main-session
- Reviewed-HEAD-SHA: PENDING_SHA
- Spec-Compliance: PASS
- Code-Quality: PASS
- Fresh-Verification: PASS
- Blocking-Issues: 0
- Decision: ACCEPT
