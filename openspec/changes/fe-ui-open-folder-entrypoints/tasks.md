## 1. Specification

更新时间：2026-02-28 19:20

- [ ] 1.1 审阅并确认需求边界：在四个关键位置新增 Open Folder UI 入口（Onboarding、Dashboard 空状态、CommandPalette、菜单栏 File），全部调用同一 `dialog:open-folder` IPC action。不修改 open-folder contract 本体。
- [ ] 1.2 审阅并确认错误路径与边界路径：用户取消选择 → 各入口静默（不报错、不跳转）；IPC 返回路径 → 触发工作区加载（具体加载逻辑不在本 change 范围）。
- [ ] 1.3 审阅并确认验收阈值与不可变契约：四处入口行为一致（同一 action）；入口文案统一为 "Open Folder"（或 i18n 等价）。
- [ ] 1.4 依赖同步检查（Dependency Sync Check）：
  - [ ] `fe-ipc-open-folder-contract` 已合并（`dialog:open-folder` IPC 可用）— **STOP if pending**

### 1.5 预期实现触点

- `apps/desktop/renderer/src/features/dashboard/DashboardPage.tsx`：
  - L560-566：`dashboard-empty` 空状态区域 → 新增 "Open Folder" 按钮
- `apps/desktop/renderer/src/features/commandPalette/CommandPalette.tsx`：
  - 命令列表区域 → 新增 `{ label: "Open Folder", category: "file", onSelect: openFolderAction }`
- `apps/desktop/renderer/src/features/onboarding/OnboardingPage.tsx`：
  - 新增 Step（或在现有步骤中）→ "Open Folder" 入口按钮
- `apps/desktop/main/src/index.ts`（或菜单构建处）：
  - 菜单栏 File → 新增 "Open Folder" 菜单项，触发 `dialog:open-folder`
- 共享 action（新增或内联）：
  - `openFolderAction`：调用 `window.creonow.invoke("dialog:open-folder")`，处理返回值

**为什么是这些触点**：Dashboard 空状态是新用户首见，CommandPalette 是高级用户入口，Onboarding 是引导流，菜单栏是桌面应用标准入口。

## 2. TDD Mapping（先测前提）

- [ ] 2.1 将 delta spec 的每个 Scenario 映射为至少一个测试用例
- [ ] 2.2 为每个测试标注对应 Scenario ID，建立可追踪关系
- [ ] 2.3 设定门禁：未出现 Red（失败测试）不得进入实现

### Scenario → 测试映射

| Scenario ID | 测试文件（计划） | 测试名称（计划） | 断言要点 | Mock/依赖 | 运行命令 |
| ----------- | ---------------- | ---------------- | -------- | --------- | -------- |
| `WB-FE-OPENF-UI-S1` | `apps/desktop/renderer/src/features/onboarding/Onboarding.open-folder.test.tsx` | `it('renders open folder button in onboarding')` | 断言 "Open Folder" 按钮存在且可点击 | mock IPC invoke | `pnpm -C apps/desktop test:run features/onboarding/Onboarding.open-folder` |
| `WB-FE-OPENF-UI-S1b` | 同上 | `it('calls dialog:open-folder IPC on click')` | 点击按钮，断言 `window.creonow.invoke("dialog:open-folder")` 被调用 | mock IPC invoke | 同上 |
| `WB-FE-OPENF-UI-S2` | `apps/desktop/renderer/src/features/dashboard/Dashboard.open-folder.test.tsx` | `it('renders open folder button in dashboard empty state')` | 无项目时断言 "Open Folder" 按钮出现 | mock project store（空） | `pnpm -C apps/desktop test:run features/dashboard/Dashboard.open-folder` |
| `WB-FE-OPENF-UI-S2b` | 同上 | `it('calls dialog:open-folder IPC from dashboard')` | 点击按钮，断言 IPC 调用 | mock IPC invoke | 同上 |
| `WB-FE-OPENF-UI-S3` | `apps/desktop/renderer/src/features/commandPalette/CommandPalette.open-folder.test.tsx` | `it('exposes Open Folder command in palette')` | 搜索 "Open Folder"，断言命令出现 | mock IPC invoke | `pnpm -C apps/desktop test:run features/commandPalette/CommandPalette.open-folder` |
| `WB-FE-OPENF-UI-S3b` | 同上 | `it('triggers open-folder action on command select')` | 选择命令，断言 IPC 调用 | mock IPC invoke | 同上 |

### 可复用测试范本

- Dashboard 测试：`apps/desktop/renderer/src/features/dashboard/DashboardPage.test.tsx`
- CommandPalette 测试：`apps/desktop/renderer/src/features/commandPalette/CommandPalette.test.tsx`

## 3. Red（先写失败测试）

- [ ] 3.1 `WB-FE-OPENF-UI-S1/S1b`：渲染 Onboarding，断言 "Open Folder" 按钮存在并触发 IPC。
  - 期望红灯原因：当前 Onboarding 无 open folder 步骤。
- [ ] 3.2 `WB-FE-OPENF-UI-S2/S2b`：渲染 Dashboard 空状态，断言 "Open Folder" 按钮存在并触发 IPC。
  - 期望红灯原因：当前 `dashboard-empty` 区域无 Open Folder 按钮。
- [ ] 3.3 `WB-FE-OPENF-UI-S3/S3b`：搜索 CommandPalette，断言 "Open Folder" 命令存在并触发 IPC。
  - 期望红灯原因：当前命令列表无 Open Folder 命令。
- 运行：`pnpm -C apps/desktop test:run features/onboarding/Onboarding.open-folder` / `Dashboard.open-folder` / `CommandPalette.open-folder`

## 4. Green（最小实现通过）

- [ ] 4.1 新增共享 `openFolderAction`：`async () => await window.creonow.invoke("dialog:open-folder")`
- [ ] 4.2 `OnboardingPage.tsx`：新增 "Open Folder" 按钮，onClick 调用 openFolderAction → S1/S1b 转绿
- [ ] 4.3 `DashboardPage.tsx` L560-566 空状态区域：新增 "Open Folder" 按钮 → S2/S2b 转绿
- [ ] 4.4 `CommandPalette.tsx` 命令列表：新增 `{ label: "Open Folder", category: "file", onSelect: openFolderAction }` → S3/S3b 转绿
- [ ] 4.5 `apps/desktop/main/src/`（菜单构建处）：File → Open Folder 菜单项

## 5. Refactor（保持绿灯）

- [ ] 5.1 统一四处入口文案与 i18n 键（若 `fe-i18n-language-switcher-foundation` 已就绪）
- [ ] 5.2 确认用户取消时各入口行为一致（静默，不报错）

## 6. Evidence

- [ ] 6.1 记录 RUN_LOG：Red 阶段测试失败的输出
- [ ] 6.2 记录 RUN_LOG：Green 阶段全部通过的输出
- [ ] 6.3 记录 RUN_LOG：`pnpm -C apps/desktop test:run` 全量回归无新增失败
- [ ] 6.4 记录 Dependency Sync Check：`fe-ipc-open-folder-contract` 合并状态
- [ ] 6.5 Main Session Audit（仅在 Apply 阶段需要）
