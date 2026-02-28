## 1. Specification

更新时间：2026-02-28 19:20

- [ ] 1.1 审阅并确认需求边界：在主编辑区右上角新增显式 AI toggle 按钮——点击展开/折叠 RightPanel 并自动切换 `activeRightPanel` 为 `ai`。不修改 AI 面板内部布局。
- [ ] 1.2 审阅并确认错误路径与边界路径：RightPanel 已展开且 `activeRightPanel=ai` 时点击 → 折叠；RightPanel 折叠时点击 → 展开并激活 ai tab；RightPanel 展开但 `activeRightPanel≠ai` 时点击 → 切换到 ai tab（不折叠）。
- [ ] 1.3 审阅并确认验收阈值与不可变契约：按钮必须有 Tooltip 提示 `AI Panel (Ctrl+L)`；按钮目标尺寸 >= 24px；必须复用现有 `toggleRightPanelVisibility` 逻辑。
- [ ] 1.4 依赖同步检查（Dependency Sync Check）：N/A

### 1.5 预期实现触点

- `apps/desktop/renderer/src/components/layout/AppShell.tsx`：
  - L327：`toggleRightPanelVisibility` — 已有 toggle 逻辑（折叠→展开+ai / 展开→折叠），新按钮复用此 callback
  - L712-716：`<NavigationController>` props 区域 — 新增 AI toggle 按钮渲染位置（编辑区右上角）
- `apps/desktop/renderer/src/stores/layoutStore.tsx`：
  - L257-266：`setActiveRightPanel` — 已有自动展开逻辑，无需修改
- `apps/desktop/renderer/src/components/layout/NavigationController.tsx`：
  - L77-79：`Ctrl+L` 快捷键已绑定 — 按钮与快捷键共享同一 handler

**为什么是这些触点**：AppShell 是 toggle 逻辑的宿主，NavigationController 是快捷键绑定处，按钮需与两者对齐。

## 2. TDD Mapping（先测前提）

- [ ] 2.1 将 delta spec 的每个 Scenario 映射为至少一个测试用例
- [ ] 2.2 为每个测试标注对应 Scenario ID，建立可追踪关系
- [ ] 2.3 设定门禁：未出现 Red（失败测试）不得进入实现

### Scenario → 测试映射

| Scenario ID | 测试文件（计划） | 测试名称（计划） | 断言要点 | Mock/依赖 | 运行命令 |
| ----------- | ---------------- | ---------------- | -------- | --------- | -------- |
| `WB-FE-AI-TGL-S1` | `apps/desktop/renderer/src/components/layout/AppShell.ai-toggle.test.tsx` | `it('toggles right panel and activates ai tab on click')` | 点击 AI toggle 按钮，断言 panelCollapsed 变化 + activeRightPanel=ai | mock layoutStore | `pnpm -C apps/desktop test:run components/layout/AppShell.ai-toggle` |
| `WB-FE-AI-TGL-S1b` | 同上 | `it('collapses right panel when already open on ai tab')` | activeRightPanel=ai + panelCollapsed=false 时点击，断言 panelCollapsed=true | mock layoutStore | 同上 |
| `WB-FE-AI-TGL-S2` | 同上 | `it('shows tooltip with Ctrl+L shortcut hint')` | 渲染按钮，断言 tooltip 文案包含 "Ctrl+L" | 无 | 同上 |
| `WB-FE-AI-TGL-S3` | 同上 | `it('button has minimum 24px touch target')` | 断言按钮元素 min-width/min-height >= 24px | 无 | 同上 |

### 可复用测试范本

- AppShell 测试：`apps/desktop/renderer/src/components/layout/AppShell.test.tsx`

## 3. Red（先写失败测试）

- [ ] 3.1 `WB-FE-AI-TGL-S1`：渲染 AppShell，查找 AI toggle 按钮并点击，断言 panelCollapsed 变为 false + activeRightPanel=ai。
  - 期望红灯原因：当前编辑区无 AI toggle 按钮，querySelector 返回 null。
- [ ] 3.2 `WB-FE-AI-TGL-S1b`：设置 activeRightPanel=ai + panelCollapsed=false，点击按钮，断言 panelCollapsed=true。
  - 期望红灯原因：同上，按钮不存在。
- [ ] 3.3 `WB-FE-AI-TGL-S2`：查找按钮 tooltip，断言文案包含 "Ctrl+L"。
  - 期望红灯原因：按钮不存在，无 tooltip。
- [ ] 3.4 `WB-FE-AI-TGL-S3`：断言按钮 min-width/min-height >= 24px。
  - 期望红灯原因：按钮不存在。
- 运行：`pnpm -C apps/desktop test:run components/layout/AppShell.ai-toggle`

## 4. Green（最小实现通过）

- [ ] 4.1 `AppShell.tsx` L712 区域：新增 AI toggle 按钮（Lucide `MessageSquare` 或 `Bot` 图标），`onClick={toggleRightPanelVisibility}` → S1/S1b 转绿
- [ ] 4.2 按钮添加 `title="AI Panel (Ctrl+L)"` 或 Tooltip 组件 → S2 转绿
- [ ] 4.3 按钮样式 `min-w-6 min-h-6`（24px） → S3 转绿

## 5. Refactor（保持绿灯）

- [ ] 5.1 确认按钮与 `Ctrl+L` 快捷键（NavigationController L77）共享同一 toggle 逻辑，无双栈
- [ ] 5.2 按钮状态视觉反馈：RightPanel 展开时高亮/active 样式

## 6. Evidence

- [ ] 6.1 记录 RUN_LOG：Red 阶段测试失败的输出
- [ ] 6.2 记录 RUN_LOG：Green 阶段全部通过的输出
- [ ] 6.3 记录 RUN_LOG：`pnpm -C apps/desktop test:run` 全量回归无新增失败
- [ ] 6.4 记录 Dependency Sync Check（N/A）
- [ ] 6.5 Main Session Audit（仅在 Apply 阶段需要）
