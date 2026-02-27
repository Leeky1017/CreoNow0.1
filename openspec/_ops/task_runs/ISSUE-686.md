# ISSUE-686

更新时间：2026-02-27 18:17

## Links

- Issue: #686
- Branch: `task/686-audit-store-refresh-governance`
- PR: TBD

## Plan

- [x] 升级 `runFireAndForget`：增加 `label`/`critical`/`onError` 选项，保留 `(task, onError)` 兼容签名
- [x] 在 `runFireAndForget` 中加入结构化错误记录与二次异常兜底（AUD-C9-S5/S6/S7）
- [x] 将 `kgStore.ts`、`memoryStore.ts` 中 mutation 后的 `void get().refresh()` 替换为可追踪 `await get().refresh()`
- [x] 将 `projectStore.tsx` 中 `void get().bootstrap()` 替换为带 label 的 `runFireAndForget`
- [x] 新增 `fireAndForget` 行为测试与 store refresh 治理测试，覆盖 AUD-C9-S1/S5/S6/S7/S8
- [x] 完成四门禁验证并记录结果

## Runs

### 2026-02-27 验证全绿

- pnpm typecheck: 通过
- pnpm lint: 通过 (0 errors, 67 warnings)
- pnpm -C apps/desktop test:run: 通过 (179 files, 1532 tests)
- pnpm test:unit: 通过 (mode=unit tsx=239, vitest=7 files/24 tests)

## Main Session Audit

- Audit-Owner: main-session
- Reviewed-HEAD-SHA: 5415436d45050e142943a6ff8ff5011f757104bc
- Spec-Compliance: PASS
- Code-Quality: PASS
- Fresh-Verification: PASS
- Blocking-Issues: 0
- Decision: ACCEPT
