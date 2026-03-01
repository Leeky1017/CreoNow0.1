## 1. Specification

更新时间：2026-02-28 19:20

- [x] 1.1 审阅并确认需求边界：删除 `WelcomeScreen`，将其入口逻辑合并到 `DashboardPage` 空状态；清理 3 个无 handler 的幽灵按钮（View All、Grid View、List View）。不引入新信息架构。
- [x] 1.2 审阅并确认错误路径与边界路径：空状态下 Create Project 按钮 → 触发创建流程；Open Folder 按钮 → 触发 `dialog:folder:open`；无项目时不再出现 WelcomeScreen 分支。
- [x] 1.3 审阅并确认验收阈值与不可变契约：禁止无 handler 按钮残留（ghost-buttons guard 测试验证）；空状态提供 Create Project + Open Folder 两个入口。
- [x] 1.4 依赖同步检查（Dependency Sync Check）：
  - [x] `fe-cleanup-proxysection-and-mocks` 已合入 main
  - [x] `fe-ui-open-folder-entrypoints` 已完成（commit `98e13694`，同分支）

### 1.5 预期实现触点

- `apps/desktop/renderer/src/components/layout/AppShell.tsx`：
  - L29：`import { WelcomeScreen }` → 删除导入
  - L620-624：`renderMainContent()` 中 `projectItems.length === 0` 分支 → 改为渲染 DashboardPage（由 DashboardPage 自身处理空状态）
- `apps/desktop/renderer/src/features/welcome/WelcomeScreen.tsx`：
  - 整文件删除
- `apps/desktop/renderer/src/features/welcome/WelcomeScreen.stories.tsx`：
  - 整文件删除
- `apps/desktop/renderer/src/features/dashboard/DashboardPage.tsx`：
  - L560-566：`dashboard-empty` 空状态 → 新增 Create Project + Open Folder 两个闭环入口按钮
  - 全文件扫描：移除所有无 handler 的幽灵按钮（View All、Grid/List 切换等）

**为什么是这些触点**：AppShell 是 WelcomeScreen 的挂载点，DashboardPage 是合并目标，welcome/ 目录是删除对象。

## 2. TDD Mapping（先测前提）

- [x] 2.1 将 delta spec 的每个 Scenario 映射为至少一个测试用例
- [x] 2.2 为每个测试标注对应 Scenario ID，建立可追踪关系
- [x] 2.3 设定门禁：未出现 Red（失败测试）不得进入实现

### Scenario → 测试映射

| Scenario ID | 测试文件（计划） | 测试名称（计划） | 断言要点 | Mock/依赖 | 运行命令 |
| ----------- | ---------------- | ---------------- | -------- | --------- | -------- |
| `PM-FE-DASH-S1` | `apps/desktop/renderer/src/features/dashboard/Dashboard.empty-state.test.tsx` | `it('renders unified empty state without WelcomeScreen')` | 无项目时渲染 DashboardPage 空状态，不渲染 WelcomeScreen | mock projectStore（空） | `pnpm -C apps/desktop test:run features/dashboard/Dashboard.empty-state` |
| `PM-FE-DASH-S2` | 同上 | `it('exposes create project and open folder actions in empty state')` | 空状态有 "Create Project" + "Open Folder" 按钮且可点击 | mock projectStore + IPC | 同上 |
| `PM-FE-DASH-S2b` | 同上 | `it('open folder button triggers dialog:open-folder IPC')` | 点击 Open Folder，断言 IPC 调用 | mock IPC invoke | 同上 |
| `PM-FE-DASH-S3` | `apps/desktop/renderer/src/features/dashboard/DashboardPage.ghost-buttons.guard.test.tsx` | `it('has no clickable elements without handlers')` | 渲染 DashboardPage，遍历所有 button/a 元素，断言每个都有 onClick/href | mock projectStore | `pnpm -C apps/desktop test:run features/dashboard/DashboardPage.ghost-buttons.guard` |
| `PM-FE-DASH-S4` | `apps/desktop/renderer/src/features/dashboard/Dashboard.empty-state.test.tsx` | `it('WelcomeScreen module does not exist')` | 断言 `features/welcome/WelcomeScreen.tsx` 文件不存在（fs guard） | `fs.existsSync` | 同上 |

### 可复用测试范本

- DashboardPage 测试：`apps/desktop/renderer/src/features/dashboard/DashboardPage.test.tsx`

## 3. Red（先写失败测试）

- [x] 3.1 `PM-FE-DASH-S1`：空状态渲染 DashboardPage 而非 WelcomeScreen — 测试已通过（Change 2 提前满足）
- [x] 3.2 `PM-FE-DASH-S2/S2b`：空状态有 Create Project + Open Folder — 测试已通过（Change 2 提前满足）
- [x] 3.3 `PM-FE-DASH-S3`：ghost-buttons guard — 红灯确认（`View All` 无 handler），已修复
- [x] 3.4 `PM-FE-DASH-S4`：WelcomeScreen 文件不存在 — 红灯确认（文件存在），已删除
- 运行：`pnpm -C apps/desktop test:run features/dashboard/Dashboard.empty-state` / `DashboardPage.ghost-buttons.guard`

## 4. Green（最小实现通过）

- [x] 4.1 `AppShell.tsx`：删除 WelcomeScreen import + 分支，改为 `!currentProject || projectItems.length === 0` → DashboardPage → S1 转绿
- [x] 4.2 删除 `features/welcome/` 整个目录（WelcomeScreen.tsx + WelcomeScreen.stories.tsx） → S4 转绿
- [x] 4.3 DashboardPage 空状态已有 Create Project + Open Folder（Change 2 已实现） → S2/S2b 已绿
- [x] 4.4 `DashboardPage.tsx`：移除 View All（无 onClick）、Grid View / List View 切换（无 onClick）共 3 个幽灵按钮 → S3 转绿

## 5. Refactor（保持绿灯）

- [x] 5.1 确认 DashboardPage 空状态与 Onboarding 的 Open Folder 入口复用同一 `invoke("dialog:folder:open", {})` 调用
- [x] 5.2 确认删除 WelcomeScreen 后无其他引用断裂（更新了 dashboard-editor-flow 集成测试）

## 6. Evidence

- [x] 6.1 记录 RUN_LOG：Red 阶段测试失败的输出 → `openspec/_ops/task_runs/ISSUE-829.md`
- [x] 6.2 记录 RUN_LOG：Green 阶段全部通过的输出 → 203 files / 1592 tests passed
- [x] 6.3 记录 RUN_LOG：`pnpm -C apps/desktop test:run` 全量回归无新增失败
- [x] 6.4 记录 Dependency Sync Check：`fe-cleanup-proxysection-and-mocks` 已合入 main；`fe-ui-open-folder-entrypoints` commit `98e13694` 同分支
- [ ] 6.5 Main Session Audit（仅在 Apply 阶段需要）
