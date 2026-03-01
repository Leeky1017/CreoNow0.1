# RUN_LOG: ISSUE-829 — Dashboard WelcomeScreen Merge & Ghost Actions

更新时间：2026-03-01 22:00

## Meta

| Key    | Value                                          |
| ------ | ---------------------------------------------- |
| Issue  | #829                                           |
| Branch | `task/827-ipc-open-folder-contract`            |
| Change | `fe-dashboard-welcome-merge-and-ghost-actions` |
| PR     | #830                                         |

## Runs

### Red Phase

两个测试红灯：

```
$ pnpm -C apps/desktop test:run -- "Dashboard.empty-state|ghost-buttons"
FAIL — Dashboard.empty-state.test.tsx > WelcomeScreen module does not exist
  expect(existsSync(welcomePath)).toBe(false)  // true ≠ false

FAIL — DashboardPage.ghost-buttons.guard.test.tsx > has no buttons or anchors without event handlers
  expected [ 'View All' ] to deeply equal []
```

### Green Phase

实现步骤：
1. 删除 `features/welcome/WelcomeScreen.tsx` + `WelcomeScreen.stories.tsx` + 整个目录
2. `AppShell.tsx`：删除 WelcomeScreen import，`renderMainContent()` 中删除 WelcomeScreen 分支，改为 `!currentProject || projectItems.length === 0` → DashboardPage
3. `DashboardPage.tsx`：移除 "View All" 幽灵按钮（无 onClick）、Grid/List 视图切换幽灵按钮（无 onClick）
4. `dashboard-editor-flow.test.tsx`：更新集成测试 "should show WelcomeScreen" → "should show Dashboard empty state"

```
$ pnpm -C apps/desktop test:run
Test Files  203 passed (203)
     Tests  1592 passed (1592)
  Duration  47.73s
```

### Typecheck

```
$ pnpm -C apps/desktop typecheck
(clean, no errors)
```

### Full Regression

```
$ pnpm -C apps/desktop test:run
Test Files  203 passed (203)
     Tests  1592 passed (1592)
  Duration  47.73s
```

## Dependency Sync Check

- `fe-cleanup-proxysection-and-mocks`：已合入 main（不阻塞）
- `fe-ui-open-folder-entrypoints`（Issue #828）：已完成，commit `98e13694`，同分支可用
- `fe-ipc-open-folder-contract`（Issue #827）：已完成，commit `6c778844`，同分支可用
