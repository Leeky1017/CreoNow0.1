# ISSUE-789

更新时间：2026-02-28 21:10

- Issue: #789
- Branch: task/789-fix-searchpanel-keydown-when-closed
- PR: <fill-after-created>
- Reviewed-HEAD-SHA: ee5d6355c37a317d099947bc8c0b2bdd1a1d0791

## Plan

- Red：写测试验证 open=false 时 keydown 监听器不触发
- Green：useEffect 内加 `if (!open) return`，open 加入依赖数组
- Refactor：确认 open=true 行为不变

## Runs

### 2026-02-28 21:05 Red — keydown-guard test
- Command: `pnpm -C apps/desktop test:run features/search/SearchPanel.keydown-guard`
- Key output: `2 failed | 1 passed` — Escape 触发 onClose、ArrowDown 触发 preventDefault（open=false 时）
- Evidence: useEffect 无条件注册，open 未加入依赖数组

### 2026-02-28 21:06 Green
- Command: `pnpm -C apps/desktop test:run features/search/SearchPanel.keydown-guard`
- Key output: `3 passed` — 全绿
- Changes: useEffect 内加 `if (!open) return`，open 加入依赖数组

### 2026-02-28 21:06 Full regression
- Command: `pnpm typecheck && pnpm -C apps/desktop test:run`
- Key output: typecheck 通过；`188 passed (1552 tests)` — 无新增失败

## Main Session Audit

- Audit-Owner: main-session
- Reviewed-HEAD-SHA: ee5d6355c37a317d099947bc8c0b2bdd1a1d0791
- Spec-Compliance: PASS
- Code-Quality: PASS
- Fresh-Verification: PASS
- Blocking-Issues: 0
- Decision: ACCEPT
