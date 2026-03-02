# ISSUE-908
- Issue: #908
- Branch: task/908-fe-desktop-window-lifecycle-uplift
- PR: https://github.com/Leeky1017/CreoNow/pull/912

## Plan
- 新增 `windowState.ts` 模块：`loadWindowState()` / `saveWindowState()` / `createDebouncedSaveWindowState()`
- 修改 `index.ts`：集成窗口状态恢复、debounced 保存、单实例锁、second-instance 处理
- 更新已有测试 mock 以兼容新窗口生命周期代码

## Runs

### Run 1 — TDD Red Phase

```
$ pnpm exec tsx apps/desktop/main/src/__tests__/windowState.test.ts
→ ERR_MODULE_NOT_FOUND (windowState module does not exist yet)
EXIT: 1

$ pnpm exec tsx apps/desktop/main/src/__tests__/singleInstance.guard.test.ts
→ AssertionError: index.ts must call requestSingleInstanceLock()
EXIT: 1
```

**Red confirmed** — both test files fail as expected.

### Run 2 — TDD Green Phase

Implemented:
- `apps/desktop/main/src/windowState.ts` — loadWindowState / saveWindowState / createDebouncedSaveWindowState
- Modified `apps/desktop/main/src/index.ts` — integrated window state + single instance lock

```
$ pnpm exec tsx apps/desktop/main/src/__tests__/windowState.test.ts
  ✓ WB-FE-WIN-S1 loads saved window state from JSON file
  ✓ WB-FE-WIN-S1b returns null when state file is corrupted
  ✓ WB-FE-WIN-S1b2 returns null when state has invalid shape
  ✓ WB-FE-WIN-S1c returns null when state file does not exist
  ✓ WB-FE-WIN-S2 saves window state to JSON file
  ✓ WB-FE-WIN-S2b saves overwrites existing state
✅ All windowState tests passed
EXIT: 0

$ pnpm exec tsx apps/desktop/main/src/__tests__/singleInstance.guard.test.ts
  ✓ WB-FE-WIN-S3 index.ts calls requestSingleInstanceLock
  ✓ WB-FE-WIN-S3b index.ts imports loadWindowState from windowState module
  ✓ WB-FE-WIN-S3c index.ts uses debounced save from windowState module
  ✓ WB-FE-WIN-S3d index.ts handles second-instance event
✅ All singleInstance guard tests passed
EXIT: 0
```

### Run 3 — Full Regression

Updated mocks in:
- `apps/desktop/tests/unit/main/window-load-catch.test.ts`
- `apps/desktop/tests/unit/main/index.app-ready-catch.test.ts`

```
$ pnpm test:unit
Test Files  10 passed (10)
      Tests  36 passed (36)
EXIT: 0

$ pnpm exec tsc --noEmit --project apps/desktop/tsconfig.json
EXIT: 0
```

**All tests green. TypeScript compilation clean.**

### Run 4 — Fix second-instance 注册时机（审计修复）

独立审计指出 `second-instance` 监听注册位于 `app.whenReady().then(...)` 内且绑定固定 `mainWindow` 引用，存在启动竞态和窗口重建后引用过期风险。

修复：
- 将 `app.on("second-instance", ...)` 移至 `requestSingleInstanceLock()` 成功后立即注册（早于 `whenReady`）
- 使用 `BrowserWindow.getAllWindows()[0]` 动态获取当前窗口，避免闭包引用过期

```
$ pnpm exec tsx apps/desktop/main/src/__tests__/singleInstance.guard.test.ts
  ✓ WB-FE-WIN-S3 index.ts calls requestSingleInstanceLock
  ✓ WB-FE-WIN-S3b index.ts imports loadWindowState from windowState module
  ✓ WB-FE-WIN-S3c index.ts uses debounced save from windowState module
  ✓ WB-FE-WIN-S3d index.ts handles second-instance event
✅ All singleInstance guard tests passed

$ vitest run (216 files, 1640 tests — all passed)
$ pnpm typecheck (clean)
```

## Main Session Audit

- Audit-Owner: main-session
- Reviewed-HEAD-SHA: 54ca337dc8d0bd389d67217871a8cd9c85e9c7a1
- Spec-Compliance: PASS
- Code-Quality: PASS
- Fresh-Verification: PASS
- Blocking-Issues: 0
- Decision: ACCEPT
