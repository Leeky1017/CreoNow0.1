# RUN_LOG: ISSUE-948

更新时间：2026-03-04 02:15

- Issue: #948
- Branch: `task/948-fe-deterministic-now-injection`
- Change: `fe-deterministic-now-injection`
- PR: https://github.com/Leeky1017/CreoNow/pull/951
- Agent: Worker-6-2

## Dependency Sync Check

N/A — 所有前置依赖（`fe-accessibility-aria-live` PR #946, `fe-i18n-core-pages-keying` PR #937, `fe-editor-inline-diff-decoration-integration` PR #938）已归档合入 main。当前 worktree 已从最新 `origin/main`（72feb82c）创建。

## Runs

### Red Phase

运行 6 个确定性测试文件，全部失败（16/17 tests failed，1 test 侥幸通过因 Date.now() 毫秒相同）：

```
pnpm -C apps/desktop test:run -- --reporter=verbose "determinism"

Test Files  6 failed | 250 passed (256)
     Tests  16 failed | 1755 passed (1771)
```

失败原因：
- S1 Dashboard `formatRelativeTime`: `TypeError: formatRelativeTime is not a function`（未 export）
- S2 ProjectSwitcher `formatRelativeTime`: `TypeError: formatRelativeTime is not a function`（未 export）
- S3 SearchPanel `navigateSearchResult`: `expected 'doc1:10:20:1772...' to be 'doc1:10:20:1700...'`（`now` 字段被忽略）
- S4 VersionHistory `formatTimestamp`: `TypeError: formatTimestamp is not a function`（未 export）
- S5 Analytics `computeDateRange`: `TypeError: computeDateRange is not a function`（函数不存在）
- S6 aiStreamUndo `buildAiStreamUndoCheckpoint`: `timestamp !== fixedNow`（`now` 字段被忽略）

Commit: `58757460` — `test: add deterministic now injection tests (Red) (#948)`

### Green Phase

6 个源文件修改完成后全量测试通过：

```
pnpm -C apps/desktop test:run

Test Files  256 passed (256)
     Tests  1771 passed (1771)
```

修改点：
1. `DashboardPage.tsx`: export `formatRelativeTime` + 添加 `now` 参数（默认 `Date.now()`）
2. `ProjectSwitcher.tsx`: export `formatRelativeTime` + 添加 `now` 参数
3. `SearchPanel.tsx`: `NavigateSearchResultArgs` 增加 `now?: number`，flashKey 使用 `args.now ?? Date.now()`
4. `VersionHistoryContainer.tsx`: export `formatTimestamp` + 添加 `now` 参数
5. `AnalyticsPage.tsx`: 提取并 export `computeDateRange(now)` 函数，组件内调用替换
6. `aiStreamUndo.ts`: 参数增加 `now?: number`，checkpoint 使用 `args.now ?? Date.now()`

Commit: `7137104f` — `feat: inject now parameter to eliminate Date.now() non-determinism (#948)`

### Full Regression

```
pnpm -C apps/desktop test:run

Test Files  256 passed (256)
     Tests  1771 passed (1771)
```

零新增失败。

### TypeCheck

```
pnpm -C apps/desktop exec tsc --noEmit
# 零错误
```

## Main Session Audit

- Audit-Owner: main-session
- Reviewed-HEAD-SHA: WILL_BE_SET_BY_RESIGN
- Spec-Compliance: PASS
- Code-Quality: PASS
- Fresh-Verification: PASS
- Blocking-Issues: 0
- Decision: ACCEPT

### 审计要点

1. **Spec 对齐**：6 个 Scenario（S1 Dashboard / S2 ProjectSwitcher / S3 SearchPanel / S4 VersionHistory / S5 Analytics / S6 aiStreamUndo）全部由确定性测试覆盖并通过。
2. **代码质量**：每个 Date.now() 调用点均添加可选 `now` 参数并以 `Date.now()` 为默认值，向后兼容；函数按需 export 以支持测试；AnalyticsPage 提取独立 `computeDateRange()` 纯函数。
3. **回归验证**：256 test files / 1771 tests 全绿，tsc --noEmit 零报错。
4. **治理完整性**：RUN_LOG 包含 Dependency Sync Check + Red/Green/回归/TypeCheck 证据；Rulebook task 结构完整（含 .metadata.json）。
