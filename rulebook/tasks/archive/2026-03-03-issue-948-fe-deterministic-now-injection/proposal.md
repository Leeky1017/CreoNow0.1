# Proposal: fe-deterministic-now-injection
更新时间：2026-03-03 22:30

## Why

UI helper 函数中直接调用 `Date.now()` 导致测试不确定性——"今天通过明天失败"。违反 P6（确定性与隔离）原则。

## What

将所有直接调用 `Date.now()` 的 UI 生产代码改为接受可选 `now` 参数（默认值 `Date.now()`），使测试可通过注入固定时间戳来获得确定性输出。

## Scope

6 个调用点：

1. `DashboardPage.tsx` — `formatRelativeTime`
2. `ProjectSwitcher.tsx` — `formatRelativeTime`
3. `SearchPanel.tsx` — `navigateSearchResult` flashKey 生成
4. `VersionHistoryContainer.tsx` — `formatTimestamp`
5. `AnalyticsPage.tsx` — 日期范围计算（`utcDateKey(Date.now())`）
6. `aiStreamUndo.ts` — checkpoint 时间戳

## Out of Scope

- 时间库全量重构
- 后端 `Date.now()` 调用
- 测试文件中的 `Date.now()` 调用（已由 `vi.useFakeTimers()` 控制）
