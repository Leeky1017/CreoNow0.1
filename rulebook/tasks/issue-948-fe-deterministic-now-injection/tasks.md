# Tasks: fe-deterministic-now-injection
更新时间：2026-03-03 22:30

## TDD Mapping

| Scenario | 测试文件 | 调用点 |
|----------|---------|--------|
| S1 | `dashboard/__tests__/formatRelativeTime.determinism.test.ts` | `DashboardPage.tsx` `formatRelativeTime` |
| S2 | `projects/__tests__/projectSwitcher.determinism.test.ts` | `ProjectSwitcher.tsx` `formatRelativeTime` |
| S3 | `search/__tests__/search-panel-flashkey.determinism.test.ts` | `SearchPanel.tsx` `navigateSearchResult` |
| S4 | `version-history/__tests__/versionHistory.determinism.test.ts` | `VersionHistoryContainer.tsx` `formatTimestamp` |
| S5 | `analytics/__tests__/analytics.determinism.test.ts` | `AnalyticsPage.tsx` `computeDateRange` |
| S6 | `editor/__tests__/aiStreamUndo.determinism.test.ts` | `aiStreamUndo.ts` `buildAiStreamUndoCheckpoint` |

## Red Phase

- [ ] S1 — formatRelativeTime not exported → TypeError
- [ ] S2 — formatRelativeTime not exported → TypeError
- [ ] S3 — `now` field ignored → flashKey mismatch
- [ ] S4 — formatTimestamp not exported → TypeError
- [ ] S5 — computeDateRange not exported → TypeError
- [ ] S6 — `now` field ignored → timestamp mismatch

## Green Phase

- [ ] S1 — export + add `now` parameter to Dashboard `formatRelativeTime`
- [ ] S2 — export + add `now` parameter to ProjectSwitcher `formatRelativeTime`
- [ ] S3 — add `now` to `NavigateSearchResultArgs` + use in flashKey
- [ ] S4 — export + add `now` parameter to `formatTimestamp`
- [ ] S5 — extract + export `computeDateRange(now)`, use in component
- [ ] S6 — add `now` to `buildAiStreamUndoCheckpoint` args

## Refactor

- [ ] Evaluate merging Dashboard/ProjectSwitcher `formatRelativeTime` into shared util

## Evidence

- [ ] Red output recorded in RUN_LOG
- [ ] Green output recorded in RUN_LOG
- [ ] Full regression pass recorded
- [ ] TypeCheck pass recorded
