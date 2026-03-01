# RUN_LOG: ISSUE-827 — dialog:open-folder IPC contract

更新时间：2026-03-01 21:25

## Meta

| Key    | Value                                    |
| ------ | ---------------------------------------- |
| Issue  | #827                                     |
| Branch | `task/827-ipc-open-folder-contract`      |
| Change | `fe-ipc-open-folder-contract`            |
| PR     | #830                                     |

## Runs

### Red Phase

```
$ npx tsx apps/desktop/main/src/ipc/__tests__/dialog-ipc.test.ts
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '.../ipc/dialog'
```
红灯确认：handler 模块不存在，测试无法导入。

### Green Phase

实现步骤：
1. `ipc-contract.ts` 新增 `dialog:folder:open` 通道（request: `{}`, response: `{ selectedPath?: string }`）
2. `contract-generate.ts` DOMAIN_REGISTRY 新增 `dialog: "Workbench"`
3. `pnpm contract:generate` 重新生成 `ipc-generated.ts`
4. 创建 `apps/desktop/main/src/ipc/dialog.ts` — `registerDialogIpcHandlers()`
5. `apps/desktop/main/src/index.ts` — import + 注册 handler

注：通道名由 spec 中的 `dialog:open-folder` 改为 `dialog:folder:open`（contract 系统强制 3 段式 `<domain>:<resource>:<action>`，每段 `/^[a-z][a-z0-9]*$/`）。

```
$ npx tsx apps/desktop/main/src/ipc/__tests__/dialog-ipc.test.ts
(no output, exit 0 — all 5 scenarios passed)
```

### Typecheck

```
$ pnpm -C apps/desktop typecheck
(clean, no errors)
```

### Full Regression

```
$ cd apps/desktop && pnpm test:run
Test Files  199 passed (199)
     Tests  1582 passed (1582)
  Duration  42.86s
```

## Dependency Sync Check

N/A — 本 change 无上游依赖。
