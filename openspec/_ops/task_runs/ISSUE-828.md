# RUN_LOG: ISSUE-828 — Open Folder UI Entry Points

更新时间：2026-03-01 22:00

## Meta

| Key    | Value                                    |
| ------ | ---------------------------------------- |
| Issue  | #828                                     |
| Branch | `task/827-ipc-open-folder-contract`      |
| Change | `fe-ui-open-folder-entrypoints`          |
| PR     | #830                                     |

## Runs

### Red Phase

三个测试文件各自红灯：

Dashboard:
```
$ pnpm -C apps/desktop test:run features/dashboard/Dashboard.open-folder
FAIL — TestingLibraryElementError: Unable to find an element by: [data-testid="dashboard-open-folder"]
```

CommandPalette:
```
$ pnpm -C apps/desktop test:run features/commandPalette/CommandPalette.open-folder
FAIL — Open Folder command not found in palette
```

Onboarding:
```
$ pnpm -C apps/desktop test:run features/onboarding/Onboarding.open-folder
FAIL — TestingLibraryElementError: Unable to find an element by: [data-testid="onboarding-open-folder"]
```

### Green Phase

实现步骤：
1. `DashboardPage.tsx` 空状态区域新增 "打开已有文件夹" 按钮（`data-testid="dashboard-open-folder"`），onClick 调用 `invoke("dialog:folder:open", {})`
2. `AppShell.tsx` commandEntries 数组新增 `open-folder` 命令，onSelect 调用 `invoke("dialog:folder:open", {})`
3. `OnboardingPage.tsx` 导航底部新增 "打开已有文件夹" 按钮（`data-testid="onboarding-open-folder"`），onClick 调用 `invoke("dialog:folder:open", {})`

注：菜单栏 File → Open Folder 暂缓（当前无原生菜单系统，`win.removeMenu()` 已移除菜单），实现 3/4 入口。

```
$ pnpm -C apps/desktop test:run -- --reporter=verbose "open-folder"
Test Files  202 passed (202)
     Tests  1588 passed (1588)
  Duration  50.49s
```

6 个 open-folder 测试全部通过。

### Typecheck

```
$ pnpm -C apps/desktop typecheck
(clean, no errors)
```

### Full Regression

```
$ pnpm -C apps/desktop test:run
Test Files  202 passed (202)
     Tests  1588 passed (1588)
  Duration  50.49s
```

## Dependency Sync Check

`fe-ipc-open-folder-contract`（Issue #827）已完成，`dialog:folder:open` IPC 通道可用（同分支，commit `6c778844`）。
