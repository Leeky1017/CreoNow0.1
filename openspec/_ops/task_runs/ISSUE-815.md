# ISSUE-815
- Issue: #815
- Branch: task/815-fe-cleanup-proxysection-and-mocks
- PR: TBD

## Plan
- Delete ProxySection.tsx dead code
- Remove MOCK_SEARCH_RESULTS from SearchPanel.tsx production path
- Fix ChatHistory ghost interaction (remove MOCK_HISTORY, show empty state)
- Fix RightPanel onSelectChat no-op (void chatId → explicit TODO log)

## Runs

### 2026-03-01 18:54 Red phase
- Command: `pnpm -C apps/desktop test:run features/__tests__/proxy-section-dead.guard`
- Key output: 2 failed — ProxySection.tsx exists, file references ProxySection
- Command: `pnpm -C apps/desktop test:run features/search/SearchPanel.no-mock.guard`
- Key output: 1 failed — MOCK_SEARCH_RESULTS found in SearchPanel.tsx
- Command: `pnpm -C apps/desktop test:run features/ai/AiPanel.history.interaction`
- Key output: 2 failed — MOCK_HISTORY in ChatHistory.tsx, void chatId in RightPanel.tsx
- Evidence: All 5 guard assertions fail as expected (Red)

### 2026-03-01 18:56 Green phase
- Changes made:
  - Deleted `apps/desktop/renderer/src/features/settings/ProxySection.tsx`
  - Removed `MOCK_SEARCH_RESULTS` export from `SearchPanel.tsx`
  - Moved mock data into `SearchPanel.stories.tsx` (Storybook-only)
  - Updated comment in `SearchPanel.test.tsx` (line 111)
  - Removed `MOCK_HISTORY` from `ChatHistory.tsx`, replaced with empty state
  - Fixed `onSelectChat` in `RightPanel.tsx`: `void chatId` → `console.info` with TODO
- Command: `pnpm -C apps/desktop test:run` (all 3 guard suites)
- Key output: 5/5 guard assertions pass
- Evidence: All guard tests green

### 2026-03-01 18:56 Full regression
- Command: `pnpm -C apps/desktop test:run`
- Key output: Test Files 198 passed (198), Tests 1576 passed (1576)
- Evidence: Zero regressions
