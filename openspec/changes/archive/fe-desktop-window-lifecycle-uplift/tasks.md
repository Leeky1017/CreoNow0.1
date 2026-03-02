## 1. Specification

更新时间：2026-02-28 19:20

- [ ] 1.1 审阅并确认需求边界：补齐窗口状态持久化（位置/尺寸）+ 单实例锁（`requestSingleInstanceLock`）。不实现多窗口编辑。
- [ ] 1.2 审阅并确认错误路径与边界路径：窗口状态文件损坏时回退到默认 1280×800；第二实例启动时聚焦已有窗口并传递 argv。
- [ ] 1.3 审阅并确认验收阈值与不可变契约：重启后窗口恢复上次位置/尺寸；第二实例不得创建新窗口。
- [ ] 1.4 依赖同步检查（Dependency Sync Check）：N/A

### 1.5 预期实现触点

- `apps/desktop/main/src/index.ts`
  - L101-117：`createMainWindow()` 硬编码 `width: 1280, height: 800` → 改为从持久化状态读取，fallback 到默认值
  - 窗口 `move`/`resize` 事件 → 写入状态文件（debounce）
  - 新增 `app.requestSingleInstanceLock()` 调用（在 `app.whenReady()` 之前）
  - 新增 `app.on('second-instance')` → 聚焦已有窗口 + 传递 argv
- 新增 `apps/desktop/main/src/windowState.ts`（窗口状态持久化模块）：
  - `loadWindowState(): WindowState | null`（从 JSON 文件读取）
  - `saveWindowState(state: WindowState): void`（写入 JSON 文件）
  - 状态文件路径：`app.getPath('userData')/window-state.json`
  - 损坏/缺失时返回 `null`（fallback 到默认值）

**为什么是这些触点**：`createMainWindow()` 是唯一的窗口创建入口，`index.ts` 是 app lifecycle 的入口。持久化模块独立抽取便于测试。

## 2. TDD Mapping（先测前提）

- [ ] 2.1 将 delta spec 的每个 Scenario 映射为至少一个测试用例
- [ ] 2.2 为每个测试标注对应 Scenario ID，建立可追踪关系
- [ ] 2.3 设定门禁：未出现 Red（失败测试）不得进入实现

### Scenario → 测试映射

| Scenario ID | 测试文件（计划） | 测试名称（计划） | 断言要点 | Mock/依赖 | 运行命令 |
| ----------- | ---------------- | ---------------- | -------- | --------- | -------- |
| `WB-FE-WIN-S1` | `apps/desktop/main/src/__tests__/windowState.test.ts` | `it('loads saved window state from JSON file')` | mock `fs.readFileSync` 返回有效 JSON，断言返回 `{ x, y, width, height }` | `vi.mock('fs')` | `pnpm -C apps/desktop test:run __tests__/windowState` |
| `WB-FE-WIN-S1b` | 同上 | `it('returns null when state file is corrupted')` | mock `fs.readFileSync` 返回非法 JSON，断言返回 `null` | `vi.mock('fs')` | 同上 |
| `WB-FE-WIN-S1c` | 同上 | `it('returns null when state file does not exist')` | mock `fs.readFileSync` 抛 ENOENT，断言返回 `null` | `vi.mock('fs')` | 同上 |
| `WB-FE-WIN-S2` | `apps/desktop/main/src/__tests__/windowState.test.ts` | `it('saves window state to JSON file')` | 调用 `saveWindowState({...})`，断言 `fs.writeFileSync` 被调用且内容正确 | `vi.mock('fs')` | 同上 |
| `WB-FE-WIN-S3` | `apps/desktop/main/src/__tests__/singleInstance.guard.test.ts` | `it('index.ts calls requestSingleInstanceLock')` | 读取 index.ts 源码，断言包含 `requestSingleInstanceLock` | `fs.readFileSync` | `pnpm -C apps/desktop test:run __tests__/singleInstance.guard` |

### 可复用测试范本

- BrowserWindow 安全测试：`apps/desktop/main/src/__tests__/browser-window-security.contract.test.ts`

## 3. Red（先写失败测试）

- [ ] 3.1 `WB-FE-WIN-S1`：mock `fs.readFileSync` 返回 `{ x: 100, y: 200, width: 1400, height: 900 }`，调用 `loadWindowState()`，断言返回匹配对象。
  - 期望红灯原因：`windowState.ts` 模块不存在。
- [ ] 3.2 `WB-FE-WIN-S1b`：mock 返回非法 JSON，断言 `loadWindowState()` 返回 `null`。
  - 期望红灯原因：同上。
- [ ] 3.3 `WB-FE-WIN-S1c`：mock 抛 ENOENT，断言返回 `null`。
  - 期望红灯原因：同上。
- [ ] 3.4 `WB-FE-WIN-S2`：调用 `saveWindowState()`，断言 `fs.writeFileSync` 被调用。
  - 期望红灯原因：同上。
- [ ] 3.5 `WB-FE-WIN-S3`：读取 index.ts 源码，断言包含 `requestSingleInstanceLock`。
  - 期望红灯原因：当前 index.ts 无此调用。
- 运行：`pnpm -C apps/desktop test:run __tests__/windowState` / `__tests__/singleInstance.guard`

## 4. Green（最小实现通过）

- [ ] 4.1 新增 `windowState.ts`：
  - `loadWindowState()`：读取 `app.getPath('userData')/window-state.json`，JSON.parse，try-catch 返回 `null`
  - `saveWindowState(state)`：`fs.writeFileSync` 写入 JSON
  → S1/S1b/S1c/S2 转绿
- [ ] 4.2 `index.ts`：`createMainWindow()` 中调用 `loadWindowState()`，有值则用作 BrowserWindow 构造参数，无值则 fallback 1280×800
- [ ] 4.3 `index.ts`：窗口 `move`/`resize` 事件中 debounce 调用 `saveWindowState()`
- [ ] 4.4 `index.ts`：在 `app.whenReady()` 前调用 `app.requestSingleInstanceLock()`，失败则 `app.quit()`
- [ ] 4.5 `index.ts`：`app.on('second-instance')` → `win.focus()`（若最小化则先 `win.restore()`）
  → S3 转绿

## 5. Refactor（保持绿灯）

- [ ] 5.1 确认 `saveWindowState` 的 debounce 间隔合理（建议 500ms）
- [ ] 5.2 确认窗口最大化/全屏状态下不覆盖正常尺寸（保存前检查 `isMaximized()`/`isFullScreen()`）

## 6. Evidence

- [ ] 6.1 记录 RUN_LOG：Red 阶段测试失败的输出
- [ ] 6.2 记录 RUN_LOG：Green 阶段全部通过的输出
- [ ] 6.3 记录 RUN_LOG：`pnpm -C apps/desktop test:run` 全量回归无新增失败
- [ ] 6.4 记录 Dependency Sync Check（N/A）
- [ ] 6.5 Main Session Audit（仅在 Apply 阶段需要）
