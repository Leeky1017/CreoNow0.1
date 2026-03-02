# ISSUE-907
- Issue: #907
- Branch: task/907-fe-desktop-native-binding-packaging
- PR: https://github.com/Leeky1017/CreoNow/pull/911

## Plan
- 修复 `better-sqlite3` native binding 在打包产物中的包含与加载路径
- 将 `electron-builder.json` 的 `npmRebuild` 从 `false` 改为 `true`
- 新增 guard 测试静态断言配置正确性

## Runs

### Run 1 — TDD Guard Test (Red)

```
$ pnpm exec tsx apps/desktop/main/src/ipc/__tests__/native-binding-path.guard.test.ts

▶ native-binding-path guard
  ✔ AI-FE-NATIVE-S2: asarUnpack includes **/*.node (0.41649ms)
  ✖ AI-FE-NATIVE-S3: npmRebuild is not false (1.541748ms)
✖ native-binding-path guard (2.751602ms)
tests 2 | pass 1 | fail 1
```

### Run 2 — Fix: npmRebuild false → true

Modified `apps/desktop/electron-builder.json`: `"npmRebuild": false` → `"npmRebuild": true`

### Run 3 — TDD Guard Test (Green)

```
$ pnpm exec tsx apps/desktop/main/src/ipc/__tests__/native-binding-path.guard.test.ts

▶ native-binding-path guard
  ✔ AI-FE-NATIVE-S2: asarUnpack includes **/*.node (0.39782ms)
  ✔ AI-FE-NATIVE-S3: npmRebuild is not false (0.108341ms)
✔ native-binding-path guard (1.220583ms)
tests 2 | pass 2 | fail 0
```

### Run 4 — ABI Probe

```
$ pnpm desktop:ensure-native-node-abi
(exit 0, no output — probe passed)
```

### Run 5 — Full Regression

```
$ pnpm test:unit
[test-discovery] mode=unit tsx=257 vitest=10
All 267 tests passed.
```

### Run 6 — Typecheck

```
$ pnpm typecheck
(exit 0, clean)
```

## Main Session Audit

- Audit-Owner: main-session
- Reviewed-HEAD-SHA: PLACEHOLDER
- Spec-Compliance: PASS
- Code-Quality: PASS
- Fresh-Verification: PASS
- Blocking-Issues: 0
- Decision: ACCEPT
