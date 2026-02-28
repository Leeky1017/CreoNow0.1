# ISSUE-786

更新时间：2026-02-28 20:00

- Issue: #786
- Branch: task/786-fe-hotfix-searchpanel-backdrop-close
- PR: https://github.com/Leeky1017/CreoNow/pull/787
- Reviewed-HEAD-SHA: 0225d27ee6aa03473a4e4507a2a908f8f965e784

## Plan

- Red：写 SearchPanel.visibility.test.tsx + SearchPanel.close.test.tsx，确认失败
- Green：SearchPanel.tsx 加 open 短路 + backdrop data-testid；Sidebar.tsx 传入 open/onClose
- Refactor：open 改为必选 prop；验证全量测试通过

## Runs

### 2026-02-28 20:39 Red — visibility test
- Command: `pnpm -C apps/desktop test:run features/search/SearchPanel.visibility`
- Key output: `1 failed | 1 passed` — `does not render overlay when open is false` FAIL（overlay 始终渲染）
- Evidence: open=false 无短路，search-panel 仍在 DOM

### 2026-02-28 20:39 Red — close test
- Command: `pnpm -C apps/desktop test:run features/search/SearchPanel.close`
- Key output: `1 failed | 1 passed` — `calls onClose when clicking backdrop` FAIL（无 data-testid="search-backdrop"）
- Evidence: backdrop 无 testid，getByTestId 抛出

### 2026-02-28 20:41 Green — visibility + close
- Command: `pnpm -C apps/desktop test:run features/search/SearchPanel.visibility features/search/SearchPanel.close`
- Key output: `2 passed (4 tests)` — 全绿
- Changes: SearchPanel.tsx 加 `if (!open) return null` + `data-testid="search-backdrop"`；Sidebar.tsx 传入 `open={true} onClose={props.onCloseSearch}`

### 2026-02-28 20:42 Refactor — open 改为必选
- Command: `pnpm typecheck`
- Key output: 无错误（修复 stories + 现有测试补 open={true}）

### 2026-02-28 20:43 Full regression
- Command: `pnpm -C apps/desktop test:run`
- Key output: `187 passed (1549 tests)` — 无新增失败

## Main Session Audit

- Audit-Owner: main-session
- Reviewed-HEAD-SHA: 0225d27ee6aa03473a4e4507a2a908f8f965e784
- Spec-Compliance: PASS
- Code-Quality: PASS
- Fresh-Verification: PASS
- Blocking-Issues: 0
- Decision: ACCEPT
