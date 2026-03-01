# ISSUE-827
- Issue: #827
- Branch: task/827-ipc-open-folder-contract
- PR: https://github.com/Leeky1017/CreoNow/pull/830

## Plan
- 新增 `dialog:folder:open` IPC 通道（契约系统强制 3 段式命名）
- 新增 `registerDialogIpcHandlers()` 后端 handler
- TDD：5 个场景（handler 注册、取消、选择、属性校验、异常处理）

## Runs

### 2026-03-01 21:10 Red Phase
- Command: `npx tsx apps/desktop/main/src/ipc/__tests__/dialog-ipc.test.ts`
- Key output: `Error [ERR_MODULE_NOT_FOUND]: Cannot find module '.../ipc/dialog'`
- 红灯确认：handler 模块不存在，测试无法导入

### 2026-03-01 21:15 Green Phase
- File: `apps/desktop/main/src/ipc/contract/ipc-contract.ts` — 新增 `dialog:folder:open` 通道
- File: `scripts/contract-generate.ts` — DOMAIN_REGISTRY 新增 `dialog: "Workbench"`
- Command: `pnpm contract:generate` — 重新生成 `ipc-generated.ts`
- File: `apps/desktop/main/src/ipc/dialog.ts` — 新建 `registerDialogIpcHandlers()`
- File: `apps/desktop/main/src/index.ts` — import + 注册 handler
- 注：通道名由 spec 中 `dialog:open-folder` 改为 `dialog:folder:open`（契约系统强制 3 段式 `<domain>:<resource>:<action>`，每段 `/^[a-z][a-z0-9]*$/`）

### 2026-03-01 21:20 Verification
- Command: `npx tsx apps/desktop/main/src/ipc/__tests__/dialog-ipc.test.ts`
- Key output: exit 0（all 5 scenarios passed）
- Command: `pnpm -C apps/desktop typecheck`
- Key output: clean, no errors
- Command: `cd apps/desktop && pnpm test:run`
- Key output: Test Files 199 passed (199), Tests 1582 passed (1582)

## Main Session Audit

- Audit-Owner: main-session
- Reviewed-HEAD-SHA: 2e243530f31f52a81026b464eceef6a8e0545140
- Spec-Compliance: PASS
- Code-Quality: PASS
- Fresh-Verification: PASS
- Blocking-Issues: 0
- Decision: ACCEPT
