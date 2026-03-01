# ISSUE-797

更新时间：2026-03-01 10:21

- Issue: #797
- Branch: task/797-fe-spec-drift-iconbar-rightpanel-alignment
- PR: https://github.com/Leeky1017/CreoNow/pull/799

## Plan

- 历史目标（已完成）：执行 Red→Green guard 测试并完成 D1/D2/D3 决策落盘，不改业务实现代码。
- 本轮目标（文档治理补齐）：对齐 Rulebook proposal/tasks 与 OpenSpec tasks/RUN_LOG 叙述，明确 guard 仅依赖稳定路径（主 spec + 源码），不依赖活跃 change 路径。

## Runs

### 2026-03-01 09:45 Red — panel-id-ssot guard

- Command: `pnpm -C apps/desktop test:run components/layout/__tests__/panel-id-ssot.guard`
- Exit code: `1`
- Key output: `1 failed | 2 passed (3)`；`Test Files 1 failed (1)`
- Failed assertion: `expect(actualOrder).toEqual(expectedOrder)`（`renderer/src/components/layout/__tests__/panel-id-ssot.guard.test.ts:82`）
- Failure points:
  - Spec 期望顺序包含 `media`，且不包含 `search`/`versionHistory`/`memory`。
  - 实际 IconBar 解析顺序为 `files → search → outline → versionHistory → memory → characters → knowledgeGraph`。
  - 该差异命中 `WB-FE-DRIFT-S1` 预期红灯（契约与实现漂移）。

### 2026-03-01 09:54 Green — delta spec + guard 对齐（D1/D2/D3）

- Scope:
  - 仅改 `openspec/changes/.../specs/workbench/spec.md` 与 guard 测试；
  - 不修改 `IconBar.tsx` / `layoutStore.tsx` 业务实现行为。
- D1 落盘：
  - 在 delta spec 明确保留 `media` 且标注 `[FUTURE]`；
  - 明确“当前实现入口顺序”为 `files → search → outline → versionHistory → memory → characters → knowledgeGraph`，与未来入口分离。
- D2 落盘：
  - delta spec 语义 ID 统一为 `knowledgeGraph`；
  - 删除“`graph` 作为最终 ID”的描述口径。
- D3 落盘：
  - delta spec 明确 RightPanel 为 `AI/Info/Quality` 三 tab（`ai/info/quality`）。
- Command: `pnpm -C apps/desktop test:run components/layout/__tests__/panel-id-ssot.guard`
- Exit code: `0`
- Key output: `Test Files 1 passed (1)`；`Tests 3 passed (3)`

### 2026-03-01 09:55 Green 复验 — 最终文件状态确认

- Command: `pnpm -C apps/desktop test:run components/layout/__tests__/panel-id-ssot.guard`
- Exit code: `0`
- Key output: `Test Files 1 passed (1)`；`Tests 3 passed (3)`

### 2026-03-01 09:59 Audit Fix — guard 去除活跃 change 路径耦合

- Why: 原 guard 直接读取 `openspec/changes/fe-spec-drift-iconbar-rightpanel-alignment/...`，在 change 归档迁移后会失效。
- Change:
  - guard 改为使用稳定契约常量校验 `IconBar.tsx` 与 `layoutStore.tsx`；
  - `media [FUTURE]` 校验改为读取主 `openspec/specs/workbench/spec.md`。
- Command: `pnpm -C apps/desktop test:run components/layout/__tests__/panel-id-ssot.guard`
- Exit code: `0`
- Key output: `Test Files 1 passed (1)`；`Tests 3 passed (3)`

### 2026-03-01 10:07 Docs Governance Sync — Rulebook/OpenSpec 口径统一

- Scope:
  - 仅补齐/校对治理文档：`rulebook/tasks/.../proposal.md`、`rulebook/tasks/.../tasks.md`、`openspec/changes/.../tasks.md`、`openspec/_ops/task_runs/ISSUE-797.md`；
  - 不修改业务实现代码；不执行长测试。
- Command: `rg -n "openspec/changes/fe-spec-drift-iconbar-rightpanel-alignment" apps/desktop/renderer/src/components/layout/__tests__/panel-id-ssot.guard.test.ts || true`
- Exit code: `0`
- Key output: 无匹配（guard 已不依赖活跃 change 路径）
- Command: `rg -n "openspec/specs/workbench/spec.md|OWNER_ALIGNED_ICONBAR_ORDER|OWNER_ALIGNED_RIGHT_PANEL_TABS" apps/desktop/renderer/src/components/layout/__tests__/panel-id-ssot.guard.test.ts`
- Exit code: `0`
- Key output: 命中主 spec 稳定路径与契约常量（行 `57`、`5`、`15`）
- Command: `rg -n "\\[Explain why this change is needed|\\[Describe what will change|First task|Second task|Update README|Update CHANGELOG" rulebook/tasks/issue-797-fe-spec-drift-iconbar-rightpanel-alignment/proposal.md rulebook/tasks/issue-797-fe-spec-drift-iconbar-rightpanel-alignment/tasks.md || true`
- Exit code: `0`
- Key output: 无匹配（Rulebook 模板占位已清理）

### 2026-03-01 10:21 Full Regression — desktop 全量回归

- Scope:
  - 仅执行全量测试并补充治理证据；
  - 不修改业务实现代码。
- Command: `pnpm -C apps/desktop test:run`
- Exit code: `0`
- Key output: `Test Files 189 passed (189)`；`Tests 1555 passed (1555)`
- Duration: `90.63s`
- Notes: 存在既有 warning（Dialog `aria-describedby`、React `act(...)` 提示等），未导致失败。

## Main Session Audit

- Audit-Owner: main-session
- Reviewed-HEAD-SHA: 1f859e396b62c23e4c042b4378bc040edf083c2b
- Spec-Compliance: PASS
- Code-Quality: PASS
- Fresh-Verification: PASS
- Blocking-Issues: 0
- Decision: ACCEPT
