## 1. Specification

更新时间：2026-02-28 19:20

- [ ] 1.1 审阅并确认需求边界：新增 P1 Composites（SearchInput/FormField/ToolbarGroup），替换 Feature 层散装搜索输入和表单字段。不做 P2 composites 和全量迁移。
- [ ] 1.2 审阅并确认错误路径与边界路径：FormField 需支持 error/help 状态显示；SearchInput 空值时隐藏 clear 按钮。
- [ ] 1.3 审阅并确认验收阈值与不可变契约：同语义搜索输入和表单字段结构必须一致；Composite 必须有测试 + Storybook story。
- [ ] 1.4 依赖同步检查（Dependency Sync Check）：建议先行 `fe-composites-p0-panel-and-command-items`

### 1.5 预期实现触点

- 新增 `apps/desktop/renderer/src/components/composites/SearchInput.tsx`：
  - Props：`value`、`onChange`、`onClear`、`placeholder`、`shortcutHint?`
  - 结构：搜索图标 + input + clear 按钮（有值时显示）+ 可选快捷键提示
  - 当前散装：OutlinePanel L311-335（自建 onClear）、CommandPalette L734（placeholder 搜索）、ProjectSwitcher L220
- 新增 `apps/desktop/renderer/src/components/composites/FormField.tsx`：
  - Props：`label`、`htmlFor`、`help?`、`error?`、`required?`、`children`（input slot）
  - 结构：label + children + help/error 文本
  - 当前散装：SettingsGeneral/SettingsAccount（label + className 散写）、CreateProjectDialog、CharacterDetailDialog
- 新增 `apps/desktop/renderer/src/components/composites/ToolbarGroup.tsx`：
  - Props：`children`、`separator?`（组间分隔线）
  - 结构：flex row + gap + 可选 divider
  - 当前散装：EditorToolbar、DiffHeader 的按钮组
- Feature 替换点（至少 2 处示范）：
  - `features/outline/OutlinePanel.tsx`：搜索区 → `<SearchInput>`
  - `features/settings-dialog/SettingsGeneral.tsx`：表单字段 → `<FormField>`

**为什么是这些触点**：SearchInput/FormField/ToolbarGroup 是 P1 三大高频散装模式，OutlinePanel 和 Settings 是最典型的替换示范。

## 2. TDD Mapping（先测前提）

- [ ] 2.1 将 delta spec 的每个 Scenario 映射为至少一个测试用例
- [ ] 2.2 为每个测试标注对应 Scenario ID，建立可追踪关系
- [ ] 2.3 设定门禁：未出现 Red（失败测试）不得进入实现

### Scenario → 测试映射

| Scenario ID | 测试文件（计划） | 测试名称（计划） | 断言要点 | Mock/依赖 | 运行命令 |
| ----------- | ---------------- | ---------------- | -------- | --------- | -------- |
| `WB-FE-COMP-P1-S1` | `apps/desktop/renderer/src/components/composites/SearchInput.test.tsx` | `it('renders search icon and input')` | 断言搜索图标和 input 元素存在 | 无 | `pnpm -C apps/desktop test:run components/composites/SearchInput` |
| `WB-FE-COMP-P1-S1b` | 同上 | `it('shows clear button only when value is non-empty')` | 空值无 clear 按钮，有值时出现 | 无 | 同上 |
| `WB-FE-COMP-P1-S1c` | 同上 | `it('calls onClear when clear button clicked')` | 点击 clear，断言 onClear 被调用 | 无 | 同上 |
| `WB-FE-COMP-P1-S2` | `apps/desktop/renderer/src/components/composites/FormField.test.tsx` | `it('renders label and children')` | 断言 label 文本和 children 内容出现 | 无 | `pnpm -C apps/desktop test:run components/composites/FormField` |
| `WB-FE-COMP-P1-S2b` | 同上 | `it('renders error message when error prop provided')` | 传入 error，断言错误文本出现 | 无 | 同上 |
| `WB-FE-COMP-P1-S3` | `apps/desktop/renderer/src/components/composites/ToolbarGroup.test.tsx` | `it('renders children in a flex row')` | 渲染多个按钮，断言容器为 flex 布局 | 无 | `pnpm -C apps/desktop test:run components/composites/ToolbarGroup` |

### 可复用测试范本

- P0 Composite 测试：`apps/desktop/renderer/src/components/composites/PanelContainer.test.tsx`（P0 完成后）

## 3. Red（先写失败测试）

- [ ] 3.1 `WB-FE-COMP-P1-S1`：import `SearchInput`，渲染并断言搜索图标和 input 存在。
  - 期望红灯原因：`composites/SearchInput.tsx` 不存在。
- [ ] 3.2 `WB-FE-COMP-P1-S1b`：空值渲染，断言无 clear 按钮；设值后断言 clear 按钮出现。
  - 期望红灯原因：同上。
- [ ] 3.3 `WB-FE-COMP-P1-S1c`：点击 clear 按钮，断言 onClear 回调被调用。
  - 期望红灯原因：同上。
- [ ] 3.4 `WB-FE-COMP-P1-S2`：import `FormField`，渲染带 label 和 children，断言均出现。
  - 期望红灯原因：`composites/FormField.tsx` 不存在。
- [ ] 3.5 `WB-FE-COMP-P1-S2b`：传入 error prop，断言错误文本渲染。
  - 期望红灯原因：同上。
- [ ] 3.6 `WB-FE-COMP-P1-S3`：import `ToolbarGroup`，渲染多个子元素，断言容器结构正确。
  - 期望红灯原因：`composites/ToolbarGroup.tsx` 不存在。
- 运行：`pnpm -C apps/desktop test:run components/composites/`

## 4. Green（最小实现通过）

- [ ] 4.1 新增 `SearchInput.tsx`：搜索图标 + input + 条件 clear 按钮 → S1/S1b/S1c 转绿
- [ ] 4.2 新增 `FormField.tsx`：label + children slot + error/help 文本 → S2/S2b 转绿
- [ ] 4.3 新增 `ToolbarGroup.tsx`：flex row + gap + 可选 separator → S3 转绿
- [ ] 4.4 替换示范：OutlinePanel 搜索区 → `<SearchInput>`，SettingsGeneral 表单 → `<FormField>`

## 5. Refactor（保持绿灯）

- [ ] 5.1 确认 SearchInput 的 a11y 属性（`role="searchbox"`、`aria-label`）
- [ ] 5.2 确认 FormField 的 `htmlFor` 与 children input 的 `id` 关联正确
- [ ] 5.3 为三个 Composite 补 Storybook stories

## 6. Evidence

- [ ] 6.1 记录 RUN_LOG：Red 阶段测试失败的输出
- [ ] 6.2 记录 RUN_LOG：Green 阶段全部通过的输出
- [ ] 6.3 记录 RUN_LOG：`pnpm -C apps/desktop test:run` 全量回归无新增失败
- [ ] 6.4 记录 Dependency Sync Check：确认 `fe-composites-p0` 状态
- [ ] 6.5 Main Session Audit（仅在 Apply 阶段需要）
