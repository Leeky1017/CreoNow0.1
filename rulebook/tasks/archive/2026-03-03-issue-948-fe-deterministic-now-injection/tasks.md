# Tasks: fe-deterministic-now-injection
更新时间：2026-03-04 03:30

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

- [x] S1 — formatRelativeTime not exported → TypeError
- [x] S2 — formatRelativeTime not exported → TypeError
- [x] S3 — `now` field ignored → flashKey mismatch
- [x] S4 — formatTimestamp not exported → TypeError
- [x] S5 — computeDateRange not exported → TypeError
- [x] S6 — `now` field ignored → timestamp mismatch

## Green Phase

- [x] S1 — export + add `now` parameter to Dashboard `formatRelativeTime`
- [x] S2 — export + add `now` parameter to ProjectSwitcher `formatRelativeTime`
- [x] S3 — add `now` to `NavigateSearchResultArgs` + use in flashKey
- [x] S4 — export + add `now` parameter to `formatTimestamp`
- [x] S5 — extract + export `computeDateRange(now)`, use in component
- [x] S6 — add `now` to `buildAiStreamUndoCheckpoint` args

## Refactor

- [x] Evaluate merging Dashboard/ProjectSwitcher `formatRelativeTime` into shared util — 结论：不合并，两者返回格式和依赖差异较大

## Evidence

- [x] Red output recorded in RUN_LOG
- [x] Green output recorded in RUN_LOG
- [x] Full regression pass recorded
- [x] TypeCheck pass recorded
