## 1. Specification

更新时间：2026-03-01 21:30

- [x] 1.1 审阅并确认需求边界：新增 IPC 通道 `dialog:folder:open`（原 spec 写 `dialog:open-folder`，因 contract 系统强制 3 段式命名而调整），主进程调用 `dialog.showOpenDialog({ properties: ['openDirectory'] })`，返回 `{ selectedPath?: string }`（取消时 `selectedPath` 为 `undefined`）。不做 UI 入口。
- [x] 1.2 审阅并确认错误路径与边界路径：用户取消 → 返回 `{ ok: true, data: {} }`；选择目录 → 返回 `{ ok: true, data: { selectedPath: "/path" } }`；`dialog.showOpenDialog` 异常 → `{ ok: false, error: { code: "INTERNAL", message: "..." } }`。
- [x] 1.3 审阅并确认验收阈值与不可变契约：返回值类型严格为 `{ selectedPath?: string }`；仅允许 `openDirectory`（不允许 openFile）；通道名 `dialog:folder:open`。
- [x] 1.4 依赖同步检查（Dependency Sync Check）：N/A

### 1.5 预期实现触点

- `apps/desktop/main/src/index.ts`：
  - L280-284：`guardedIpcMain` 创建处 — 新增 `guardedIpcMain.handle("dialog:open-folder", ...)` 注册
  - L303+：现有 `guardedIpcMain.handle(...)` 区域 — 在此追加新通道 handler
- `packages/shared/types/`（或 IPC 类型定义处）：
  - 新增 `dialog:open-folder` 通道的请求/响应类型定义
- `apps/desktop/preload/src/ipc.ts`：
  - L25-28：`creonowInvoke` — 已通过通用 `invoke(channel, payload)` 暴露，无需额外修改（新通道自动可用）
- `apps/desktop/preload/src/index.ts`：
  - L34：`contextBridge.exposeInMainWorld("creonow", ...)` — 已暴露通用 invoke，无需修改

**为什么是这些触点**：guardedIpcMain 是 IPC handler 注册的唯一入口，shared types 是契约 SSOT，preload 已有通用 invoke 无需改动。

## 2. TDD Mapping（先测前提）

- [x] 2.1 将 delta spec 的每个 Scenario 映射为至少一个测试用例
- [x] 2.2 为每个测试标注对应 Scenario ID，建立可追踪关系
- [x] 2.3 设定门禁：未出现 Red（失败测试）不得进入实现

### Scenario → 测试映射

| Scenario ID | 测试文件（计划） | 测试名称（计划） | 断言要点 | Mock/依赖 | 运行命令 |
| ----------- | ---------------- | ---------------- | -------- | --------- | -------- |
| `IPC-FE-OPENF-S1` | `apps/desktop/main/src/__tests__/dialog.open-folder.handler.test.ts` | `it('is registered as dialog:open-folder channel')` | handler 注册存在，类型签名正确 | mock guardedIpcMain | `pnpm -C apps/desktop test:unit dialog.open-folder` |
| `IPC-FE-OPENF-S2` | 同上 | `it('returns null when user cancels dialog')` | mock `dialog.showOpenDialog` 返回 `{ canceled: true, filePaths: [] }`，断言返回 null | mock electron dialog | 同上 |
| `IPC-FE-OPENF-S3` | 同上 | `it('returns selected directory path')` | mock `dialog.showOpenDialog` 返回 `{ canceled: false, filePaths: ["/home/user/project"] }`，断言返回 `"/home/user/project"` | mock electron dialog | 同上 |
| `IPC-FE-OPENF-S4` | 同上 | `it('only allows openDirectory property')` | 断言 handler 调用 `dialog.showOpenDialog` 时 properties 仅含 `openDirectory` | mock electron dialog | 同上 |

### 可复用测试范本

- IPC handler 测试模式：参考 `apps/desktop/main/src/index.ts` L303+ 现有 handler 的测试方式

## 3. Red（先写失败测试）

- [x] 3.1 `IPC-FE-OPENF-S1`：断言 `dialog:folder:open` 通道已注册。
  - 红灯确认：模块 `../dialog` 不存在，测试 ERR_MODULE_NOT_FOUND。
- [x] 3.2 `IPC-FE-OPENF-S2`：mock `dialog.showOpenDialog` 返回 canceled=true，断言 handler 返回无 selectedPath。
  - 同上。
- [x] 3.3 `IPC-FE-OPENF-S3`：mock `dialog.showOpenDialog` 返回 filePaths=["/path"]，断言 handler 返回 selectedPath。
  - 同上。
- [x] 3.4 `IPC-FE-OPENF-S4`：断言 handler 调用 showOpenDialog 时 properties 仅含 `openDirectory`。
  - 同上。
- 运行：`pnpm -C apps/desktop test:unit dialog.open-folder`

## 4. Green（最小实现通过）

- [x] 4.1 `apps/desktop/main/src/ipc/contract/ipc-contract.ts`：新增 `dialog:folder:open` 通道（request: `{}`, response: `{ selectedPath?: string }`）
- [x] 4.2 `apps/desktop/main/src/ipc/dialog.ts`：新增 `registerDialogIpcHandlers()` → S1-S4 全部转绿，外加 S5（异常处理）
- [x] 4.3 确认 preload 通用 invoke 已自动覆盖新通道（通过 `pnpm contract:generate` 重新生成 `ipc-generated.ts`）

## 5. Refactor（保持绿灯）

- [x] 5.1 统一 dialog 通道错误处理：异常时返回标准 IpcResponse 错误格式（已在 S5 测试覆盖）
- [x] 5.2 `.creonow/` 元目录识别逻辑推迟到后续 change（不在本 change 范围内）

## 6. Evidence

- [x] 6.1 记录 RUN_LOG：Red 阶段测试失败的输出
- [x] 6.2 记录 RUN_LOG：Green 阶段全部通过的输出
- [x] 6.3 记录 RUN_LOG：全量回归 199 files，1582 tests passed
- [x] 6.4 记录 Dependency Sync Check（N/A）
- [ ] 6.5 Main Session Audit（PR 提交后执行）
