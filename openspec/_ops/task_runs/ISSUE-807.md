# ISSUE-807

更新时间：2026-03-01 17:40

- Issue: #807
- Branch: task/807-fe-leftpanel-dialog-migration
- PR: https://github.com/Leeky1017/CreoNow/pull/808

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

### 2026-03-01 16:06 Governance Fix — fast preflight 阻断修复

- Command: `scripts/main_audit_resign.sh --issue 807 --preflight-mode fast`
- Exit code: `1`
- Key output: `PRE-FLIGHT FAILED: [OPENSPEC_CHANGE] active change content updated but openspec/changes/EXECUTION_ORDER.md not updated in this PR`
- Root cause: 本次更新了活跃 change `tasks.md`，但未同步更新 `openspec/changes/EXECUTION_ORDER.md`。
- Fix: 更新 `openspec/changes/EXECUTION_ORDER.md`（状态与更新时间同步），随后重新执行签字与 fast preflight。

### 2026-03-01 16:20 Review Remediation — 独立审计意见修复

- Scope:
  - 接受并修复 `ISSUE-A`：`IconItem.panel` 重构为 `id`，类型改为 `LeftPanelType | DialogType | "search"`，移除手写字面量联合。
  - 接受并修复 `ISSUE-B`：`resolveDialogTitle` / `renderDialogContent` 改为 `switch` + `never` 穷尽性检查。
  - 接受并修复 `ISSUE-D`：补充 Dialog Close 按钮关闭、Esc 关闭、多 Dialog 互斥测试。
  - 接受并补足 `ISSUE-C` 的最小覆盖：新增 `openSurface.test.ts`，覆盖 dialog/spotlight open+close 路由。
  - `ISSUE-E/F` 作为非阻断项处理：E 已将 Dialog 空状态文案统一为 `text-xs`；F 保持当前（弹出态不持久化）并在后续文档化任务中补充决策说明。

### 2026-03-01 16:31 Review Remediation Verification — 首轮回归与修复

- Command: `pnpm -C apps/desktop test:run components/layout/IconBar.dialog-migration`
- Exit code: `0`
- Key output: `Test Files 1 passed (1)`，`Tests 5 passed (5)`，`Duration 2.87s`

- Command: `pnpm -C apps/desktop test:run surfaces/openSurface`
- Exit code: `0`
- Key output: `Test Files 1 passed (1)`，`Tests 4 passed (4)`，`Duration 1.52s`

- Command: `pnpm -C apps/desktop typecheck`
- Exit code: `0`
- Key output: `tsc -p tsconfig.json --noEmit` completed without diagnostics.

- Command: `pnpm -C apps/desktop test:run`
- Exit code: `1`
- Key output: `panel-id-ssot.guard` 失败（`expected [] to deeply equal OWNER_ALIGNED_ICONBAR_ORDER`）。
- Root cause: guard 测试仍按 `panel:` 正则解析 IconBar，未覆盖本次 `id:` 字段重构。
- Fix: 更新 `panel-id-ssot.guard.test.ts` 正则为 `/(?:id|panel):/`，兼容字段命名迁移。

### 2026-03-01 16:44 Review Remediation Verification — 修复后全量回归

- Command: `pnpm -C apps/desktop test:run components/layout/__tests__/panel-id-ssot.guard`
- Exit code: `0`
- Key output: `Test Files 1 passed (1)`，`Tests 3 passed (3)`，`Duration 576ms`

- Command: `pnpm -C apps/desktop test:run`
- Exit code: `0`
- Key output:
  - `Test Files 193 passed (193)`
  - `Tests 1565 passed (1565)`
  - `Duration 76.65s`

### 2026-03-01 17:03 CI Follow-up — windows-e2e 回归复现与首轮修复验证

- Command: `pnpm -C apps/desktop test:e2e -- tests/e2e/knowledge-graph.spec.ts tests/e2e/system-dialog.spec.ts`
- Exit code: `1`
- Key output:
  - 首次执行：`2 failed`，失败点为 `expect(locator).not.toBeVisible()`（`getByRole("dialog")` 命中常驻 leftpanel dialog）。
  - 首轮修复后再次执行：`1 failed / 1 passed`，剩余失败为 `knowledge-graph.spec.ts` 中 `ai-send-stop` 长时间 disabled。
- Root cause:
  - `KnowledgeGraph` 迁移为模态 Dialog 后，E2E 仍以 `layout-sidebar` 为容器，且使用泛化 `getByRole("dialog")` 断言确认框关闭，目标不再唯一。
  - KG Dialog 未关闭即进入 AI 面板步骤，导致背景交互受模态层阻断。
- Fix:
  - 将 `knowledge-graph.spec.ts` 与 `system-dialog.spec.ts` 的 `Graph/List` 操作容器切换为 `leftpanel-dialog-knowledgeGraph`。
  - 删除确认框断言改为具名 dialog：`name: "Delete Document?"` / `name: "Delete Entity?"`。
  - 在 `knowledge-graph.spec.ts` 中，AI 交互前显式点击 `Close` 关闭 KG dialog。

### 2026-03-01 17:10 CI Follow-up Verification — windows-e2e 定向回归转绿

- Command: `pnpm -C apps/desktop test:e2e -- tests/e2e/knowledge-graph.spec.ts tests/e2e/system-dialog.spec.ts`
- Exit code: `0`
- Key output:
  - `2 passed`
  - `0 failed`
  - `Duration 4.6s`

### 2026-03-01 17:22 Gate Recovery — 同步 main 以恢复 PR checks 触发

- Command: `git merge --no-edit origin/main`
- Exit code: `1`（首次）
- Key output: `CONFLICT (content): Merge conflict in openspec/changes/EXECUTION_ORDER.md`
- Fix: 手工保留双方变更并以最新时间戳消解 `EXECUTION_ORDER.md` 冲突后完成 merge；随后 `git push`。

### 2026-03-01 17:26 Gate Recovery — 审计签字与 guard 再校准

- Command: `scripts/main_audit_resign.sh --issue 807 --preflight-mode fast`
- Exit code: `0`
- Key output: `OK: fast preflight checks passed`，并生成签字提交推送到任务分支。
- Notes: 随 main 同步后，`openspec-log-guard` 再次校验暴露独立审计 `Reviewed-HEAD-SHA` 漂移，需要补齐审计记录基线并再次签字。

### 2026-03-01 17:35 Gate Recovery — update-branch 后二次校准

- Command: `gh pr update-branch 808 --repo Leeky1017/CreoNow`
- Exit code: `0`
- Key output: `✓ PR branch updated`（生成新的 merge commit）。
- Follow-up: 新 SHA 上 `ci` 通过、`merge-serial` 通过，但 `openspec-log-guard` 报 `[MAIN_AUDIT] Reviewed-HEAD-SHA mismatch`（run `22540602964`），需按新基线再次更新审计链并签字。

## Main Session Audit

- Audit-Owner: main-session
- Reviewed-HEAD-SHA: f9bc76007613fd5472dee40fe50f1643c3d7be47
- Spec-Compliance: PASS
- Code-Quality: PASS
- Fresh-Verification: PASS
- Blocking-Issues: 0
- Decision: ACCEPT
