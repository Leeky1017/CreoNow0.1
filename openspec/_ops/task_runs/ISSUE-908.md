# RUN_LOG — Issue #908: Window State Persistence & Single Instance Lock

| Field     | Value |
|-----------|-------|
| Issue     | #908 |
| Branch    | `task/908-fe-desktop-window-lifecycle-uplift` |
| PR        | https://github.com/Leeky1017/CreoNow/pull/912 |
| Status    | COMPLETE |

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

## Files Changed

| Action   | File |
|----------|------|
| ADDED    | `apps/desktop/main/src/windowState.ts` |
| ADDED    | `apps/desktop/main/src/__tests__/windowState.test.ts` |
| ADDED    | `apps/desktop/main/src/__tests__/singleInstance.guard.test.ts` |
| MODIFIED | `apps/desktop/main/src/index.ts` |
| MODIFIED | `apps/desktop/tests/unit/main/window-load-catch.test.ts` |
| MODIFIED | `apps/desktop/tests/unit/main/index.app-ready-catch.test.ts` |
| ADDED    | `rulebook/tasks/issue-908-fe-desktop-window-lifecycle-uplift/proposal.md` |
| ADDED    | `rulebook/tasks/issue-908-fe-desktop-window-lifecycle-uplift/tasks.md` |
