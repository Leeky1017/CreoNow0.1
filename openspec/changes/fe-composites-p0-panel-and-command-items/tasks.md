## 1. Specification

更新时间：2026-02-28 19:20

- [ ] 1.1 审阅并确认需求边界：新建 Layer 2 Composites 目录，落地 P0 三类组件（PanelContainer/SidebarItem/CommandItem），替换 Feature 层高频散装实现。不做 P1/P2 composites。
- [ ] 1.2 审阅并确认错误路径与边界路径：无新增错误路径（纯 UI 组件抽取）。
- [ ] 1.3 审阅并确认验收阈值与不可变契约：Feature 层不得继续复制 panel/item 结构；新增 Composite 必须有 Storybook story + 单元测试。
- [ ] 1.4 依赖同步检查（Dependency Sync Check）：N/A

### 1.5 预期实现触点

- 新增 `apps/desktop/renderer/src/components/composites/` 目录
- 新增 `PanelContainer.tsx`：
  - Props：`title`、`icon?`、`actions?`（header 右侧操作按钮）、`children`
  - 结构：header（标题+操作）+ body（flex-1 overflow-auto）+ 统一 spacing/border
  - 当前散装模式：AiPanel（L~30 `flex flex-col h-full`）、SearchPanel、OutlinePanel、CharacterPanel 各自重复
- 新增 `SidebarItem.tsx`：
  - Props：`icon?`、`label`、`active?`、`onClick`、`trailing?`（右侧附加内容）
  - 当前散装模式：FileTreePanel 的文件项、OutlinePanel 的标题项
- 新增 `CommandItem.tsx`：
  - Props：`icon?`、`label`、`hint?`（快捷键提示）、`onSelect`、`active?`
  - 当前散装模式：CommandPalette.tsx L~450+ 的命令项渲染
- Feature 替换点（至少 4 处）：
  - `features/ai/AiPanel.tsx`：panel 外壳 → `<PanelContainer>`
  - `features/search/SearchPanel.tsx`：panel 外壳 → `<PanelContainer>`
  - `features/commandPalette/CommandPalette.tsx`：命令项 → `<CommandItem>`
  - `features/files/FileTreePanel.tsx`：文件项 → `<SidebarItem>`

**为什么是这些触点**：P0 三类 Composite 覆盖面板容器、侧边栏项、命令项三大高频模式，4 个 Feature 替换点验证可复用性。

## 2. TDD Mapping（先测前提）

- [ ] 2.1 将 delta spec 的每个 Scenario 映射为至少一个测试用例
- [ ] 2.2 为每个测试标注对应 Scenario ID，建立可追踪关系
- [ ] 2.3 设定门禁：未出现 Red（失败测试）不得进入实现

### Scenario → 测试映射

| Scenario ID | 测试文件（计划） | 测试名称（计划） | 断言要点 | Mock/依赖 | 运行命令 |
| ----------- | ---------------- | ---------------- | -------- | --------- | -------- |
| `WB-FE-COMP-P0-S1` | `apps/desktop/renderer/src/components/composites/PanelContainer.test.tsx` | `it('renders title and children')` | 渲染 PanelContainer，断言 title 文本和 children 内容出现 | 无 | `pnpm -C apps/desktop test:run components/composites/PanelContainer` |
| `WB-FE-COMP-P0-S1b` | 同上 | `it('renders header actions when provided')` | 传入 actions prop，断言操作按钮渲染 | 无 | 同上 |
| `WB-FE-COMP-P0-S2` | `apps/desktop/renderer/src/components/composites/SidebarItem.test.tsx` | `it('renders label and calls onClick')` | 渲染 SidebarItem，点击后断言 onClick 被调用 | 无 | `pnpm -C apps/desktop test:run components/composites/SidebarItem` |
| `WB-FE-COMP-P0-S2b` | 同上 | `it('shows active state when active prop is true')` | 传入 active=true，断言 active 样式类存在 | 无 | 同上 |
| `WB-FE-COMP-P0-S3` | `apps/desktop/renderer/src/components/composites/CommandItem.test.tsx` | `it('renders icon, label, and hint')` | 渲染 CommandItem，断言 icon/label/hint 均出现 | 无 | `pnpm -C apps/desktop test:run components/composites/CommandItem` |

### 可复用测试范本

- Primitive 测试：`apps/desktop/renderer/src/components/primitives/Button.test.tsx`

## 3. Red（先写失败测试）

- [ ] 3.1 `WB-FE-COMP-P0-S1`：import `PanelContainer`，渲染 `<PanelContainer title="Test">content</PanelContainer>`，断言 "Test" 和 "content" 出现。
  - 期望红灯原因：`composites/PanelContainer.tsx` 不存在。
- [ ] 3.2 `WB-FE-COMP-P0-S1b`：传入 actions，断言操作按钮渲染。
  - 期望红灯原因：同上。
- [ ] 3.3 `WB-FE-COMP-P0-S2`：import `SidebarItem`，渲染并点击，断言 onClick 被调用。
  - 期望红灯原因：`composites/SidebarItem.tsx` 不存在。
- [ ] 3.4 `WB-FE-COMP-P0-S2b`：传入 active=true，断言 active 样式类。
  - 期望红灯原因：同上。
- [ ] 3.5 `WB-FE-COMP-P0-S3`：import `CommandItem`，渲染带 icon/label/hint，断言三者均出现。
  - 期望红灯原因：`composites/CommandItem.tsx` 不存在。
- 运行：`pnpm -C apps/desktop test:run components/composites/`

## 4. Green（最小实现通过）

- [ ] 4.1 创建 `components/composites/` 目录
- [ ] 4.2 新增 `PanelContainer.tsx`：header（title + actions slot）+ body（flex-1 overflow-auto）→ S1/S1b 转绿
- [ ] 4.3 新增 `SidebarItem.tsx`：icon + label + active 状态 + onClick → S2/S2b 转绿
- [ ] 4.4 新增 `CommandItem.tsx`：icon + label + hint + onSelect + active → S3 转绿
- [ ] 4.5 替换 Feature 入口（至少 4 处）：AiPanel/SearchPanel → PanelContainer，CommandPalette → CommandItem，FileTreePanel → SidebarItem

## 5. Refactor（保持绿灯）

- [ ] 5.1 确认 Composite 样式走 Token（不使用 Tailwind 原始色值）
- [ ] 5.2 明确 Composite 与 Primitive 边界文档（composites 可组合 primitives，不可反向依赖 features）
- [ ] 5.3 为三个 Composite 补 Storybook stories

## 6. Evidence

- [ ] 6.1 记录 RUN_LOG：Red 阶段测试失败的输出
- [ ] 6.2 记录 RUN_LOG：Green 阶段全部通过的输出
- [ ] 6.3 记录 RUN_LOG：`pnpm -C apps/desktop test:run` 全量回归无新增失败
- [ ] 6.4 记录 Dependency Sync Check（N/A）
- [ ] 6.5 Main Session Audit（仅在 Apply 阶段需要）
