## 1. Specification

更新时间：2026-02-28 19:20

- [ ] 1.1 审阅并确认需求边界：将 Sidebar 从"万物收纳"收敛为"结构化导航"——仅保留 files/outline 停靠，search 走 Spotlight，memory/characters/knowledgeGraph/versionHistory 走 Dialog。不做面板功能重写。
- [ ] 1.2 审阅并确认错误路径与边界路径：Dialog 关闭（Esc/backdrop/关闭按钮）；多 Dialog 互斥（同时只开一个）；Spotlight 关闭同理。
- [ ] 1.3 审阅并确认验收阈值与不可变契约：files/outline 保持停靠不变；其余不得再占用 Sidebar 宽度。
- [ ] 1.4 依赖同步检查（Dependency Sync Check）：
  - [ ] D1（IconBar `media` 面板处置）Owner 决策已确认 — **STOP if pending**
  - [ ] D2（`graph` vs `knowledgeGraph` 命名）Owner 决策已确认 — **STOP if pending**
  - [ ] `fe-hotfix-searchpanel-backdrop-close` 已合并

### 1.5 预期实现触点

- `apps/desktop/renderer/src/stores/layoutStore.tsx`：
  - L22-29：`LeftPanelType` 从 7 种缩减为 `"files" | "outline"`
  - 新增 `dialogType` state：`"memory" | "characters" | "knowledgeGraph" | "versionHistory" | null`
  - 新增 `spotlightOpen` state：`boolean`（search Spotlight）
- `apps/desktop/renderer/src/components/layout/IconBar.tsx`：
  - search 按钮 → `setSpotlightOpen(true)` 而非 `setActiveLeftPanel("search")`
  - memory/characters/knowledgeGraph/versionHistory 按钮 → `setDialogType(...)` 而非 `setActiveLeftPanel(...)`
- `apps/desktop/renderer/src/components/layout/AppShell.tsx`：
  - 渲染 Dialog 容器：根据 `dialogType` 渲染对应 Feature 面板（包裹在 Dialog shell 中）
  - 渲染 Spotlight 容器：`spotlightOpen` 时渲染 SearchPanel（Spotlight 模式）
- `apps/desktop/renderer/src/components/layout/Sidebar.tsx`：
  - 仅渲染 files/outline 面板（移除 search/memory/characters/knowledgeGraph/versionHistory 分支）

**为什么是这些触点**：layoutStore 是面板状态 SSOT，IconBar 是入口，AppShell 是容器，Sidebar 是渲染分发。

## 2. TDD Mapping（先测前提）

- [ ] 2.1 将 delta spec 的每个 Scenario 映射为至少一个测试用例
- [ ] 2.2 为每个测试标注对应 Scenario ID，建立可追踪关系
- [ ] 2.3 设定门禁：未出现 Red（失败测试）不得进入实现

### Scenario → 测试映射

| Scenario ID | 测试文件（计划） | 测试名称（计划） | 断言要点 | Mock/依赖 | 运行命令 |
| ----------- | ---------------- | ---------------- | -------- | --------- | -------- |
| `WB-FE-S3-S1` | `apps/desktop/renderer/src/components/layout/IconBar.dialog-migration.test.tsx` | `it('LeftPanelType only includes files and outline')` | 读取 layoutStore.tsx，断言 LeftPanelType 仅含 files/outline | `fs.readFileSync` | `pnpm -C apps/desktop test:run components/layout/IconBar.dialog-migration` |
| `WB-FE-S3-S2` | 同上 | `it('memory icon opens dialog instead of docking')` | 点击 memory 图标，断言 dialogType 变为 "memory"，sidebar 宽度不变 | mock layoutStore | 同上 |
| `WB-FE-S3-S3` | 同上 | `it('search icon opens spotlight and closes on escape')` | 点击 search 图标，断言 spotlight 渲染；按 Esc，断言关闭 | mock layoutStore | 同上 |

### 可复用测试范本

- IconBar 测试：`apps/desktop/renderer/src/components/layout/IconBar.test.tsx`

## 3. Red（先写失败测试）

- [ ] 3.1 `WB-FE-S3-S1`：读取 layoutStore.tsx，断言 LeftPanelType 仅含 "files"/"outline"。
  - 期望红灯原因：当前 LeftPanelType 含 7 种（files/search/outline/versionHistory/memory/characters/knowledgeGraph）。
- [ ] 3.2 `WB-FE-S3-S2`：点击 memory 图标，断言 dialogType 变为 "memory"。
  - 期望红灯原因：当前 memory 图标调用 `setActiveLeftPanel("memory")`，无 dialogType state。
- [ ] 3.3 `WB-FE-S3-S3`：点击 search 图标，断言 spotlight 渲染；按 Esc 断言关闭。
  - 期望红灯原因：当前 search 图标调用 `setActiveLeftPanel("search")`，无 spotlight 模式。
- 运行：`pnpm -C apps/desktop test:run components/layout/IconBar.dialog-migration`

## 4. Green（最小实现通过）

- [ ] 4.1 `layoutStore.tsx`：LeftPanelType 缩减为 `"files" | "outline"`，新增 `dialogType` + `spotlightOpen` state → S1 转绿
- [ ] 4.2 `IconBar.tsx`：memory/characters/knowledgeGraph/versionHistory 按钮 → `setDialogType(...)` → S2 转绿
- [ ] 4.3 `IconBar.tsx`：search 按钮 → `setSpotlightOpen(true)`
- [ ] 4.4 `AppShell.tsx`：根据 `dialogType` 渲染 Dialog shell + Feature 面板；`spotlightOpen` 渲染 SearchPanel Spotlight → S3 转绿
- [ ] 4.5 `Sidebar.tsx`：移除 search/memory/characters/knowledgeGraph/versionHistory 渲染分支

## 5. Refactor（保持绿灯）

- [ ] 5.1 统一 Dialog shell 样式（对齐 SettingsDialog：间距、header、关闭按钮、Esc）
- [ ] 5.2 确认多 Dialog 互斥（打开新 Dialog 自动关闭旧的）
- [ ] 5.3 确认 files/outline 面板行为完全不变

## 6. Evidence

- [ ] 6.1 记录 RUN_LOG：Red 阶段测试失败的输出
- [ ] 6.2 记录 RUN_LOG：Green 阶段全部通过的输出
- [ ] 6.3 记录 RUN_LOG：`pnpm -C apps/desktop test:run` 全量回归无新增失败
- [ ] 6.4 记录 Dependency Sync Check：D1/D2 决策状态 + `fe-hotfix-searchpanel-backdrop-close` 状态
- [ ] 6.5 Main Session Audit（仅在 Apply 阶段需要）
