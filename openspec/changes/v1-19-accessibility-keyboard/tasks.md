# Tasks: V1-19 Accessibility & Keyboard Navigation

- **状态**: 待启动
- **GitHub Issue**: 待创建
- **分支**: `task/<N>-accessibility-keyboard`
- **Delta Spec**: `renderer/src/`（ARIA 标记 + 键盘导航 + 高对比模式 + axe-core CI）

---

## 验收标准

| ID | 标准 | 验证方式 | 结果 | R10 基线 |
|----|------|----------|------|----------|
| AC-1 | axe-core CI 审计全部 Story，violation = 0 | CI gate | 待验证 | a11y 测试文件 13 个（无 axe-core 集成） |
| AC-2 | 所有 `role="tree"` 容器包含 `aria-label`，子节点有 `aria-expanded` / `aria-level` | 代码审查 + axe | 待验证 | FileTree/OutlinePanel 无 tree role |
| AC-3 | 所有表单 `<input>` 关联 `<label>` 或 `aria-label` | axe 自动检测 | 待验证 | 待 axe 首次扫描确认 |
| AC-4 | FileTree / OutlinePanel 可纯键盘完成：导航、展开/折叠、选中 | 集成测试 + 手动测试 | 待验证 | onKeyDown 处理 28 处（散布多组件） |
| AC-5 | 所有 Modal 实现 focus trap + Esc 关闭 + 焦点恢复 | 集成测试 | 待验证 | Radix Dialog 已内置；自定义 Modal 无 focus trap |
| AC-6 | AI 消息列表有 `aria-live="polite"` 区域 | 代码检查 | 待验证 | AiMessageList 无 aria-live |
| AC-7 | `@media (prefers-contrast: more)` 规则存在且覆盖核心 token | CSS 检查 | 待验证 | prefers-contrast 使用 0 处 |
| AC-8 | `@media (forced-colors: active)` 规则存在 | CSS 检查 | 待验证 | forced-colors 使用 0 处 |
| AC-9 | 纯装饰 icon 100% 添加 `aria-hidden="true"` | grep 抽查 | 待验证 | 待首次审计 |
| AC-10 | 色彩对比度 ≥ 4.5:1（正文）/ ≥ 3:1（大文本） | axe contrast check | 待验证 | 待 axe 首次扫描确认 |

---

## Phase 0: 准备

- [ ] **P0-1**: 阅读 `AGENTS.md`、`openspec/specs/` 中涉及组件的 spec（files、outline、ai、dashboard、settings-dialog、editor）
- [ ] **P0-2**: 阅读 `docs/references/testing/README.md` 及子文档，确认 a11y 测试规范
- [ ] **P0-3**: 阅读 `docs/references/design-ui-architecture.md`，确认 Design Token 与高对比模式的衔接方式
- [ ] **P0-4**: 研究 axe-core 集成方案——确定使用 `vitest-axe`（单元测试层）还是 `@storybook/addon-a11y`（Storybook 层），输出技术决策记录
- [ ] **P0-5**: 审查现有 a11y 测试（`features/editor/a11y.test.ts` 等 13 个文件），识别可复用模式和缺口
- [ ] **P0-6**: 建立项目快捷键 map，列出所有已注册的键盘快捷键（`useAppShellKeyboard` + 各组件 `onKeyDown`），避免新增键盘导航冲突

---

## Phase 1: 语义化标记（ARIA）

### 1A. 树形结构语义化

- [ ] **P1A-1**: `FileTreePanel.tsx` — 容器添加 `role="tree"` + `aria-label="文件树"`
  - 文件：`renderer/src/features/files/FileTreePanel.tsx`
  - 测试：单元测试 `features/files/FileTreePanel.a11y.test.tsx`，验证 tree role 和 aria-label 渲染
- [ ] **P1A-2**: `FileTreeNodeRow.tsx` — 节点添加 `role="treeitem"` + `aria-expanded` + `aria-level` + `aria-selected`
  - 文件：`renderer/src/features/files/FileTreeNodeRow.tsx`
  - 测试：单元测试，验证各属性随节点状态（展开/折叠/选中/层级）正确变化
- [ ] **P1A-3**: `OutlinePanel.tsx` — 容器添加 `role="tree"` + `aria-label="文档大纲"`，子节点添加 `role="treeitem"` + `aria-expanded` + `aria-level`
  - 文件：`renderer/src/features/outline/OutlinePanel.tsx`
  - 测试：单元测试 `features/outline/OutlinePanel.a11y.test.tsx`

### 1B. 列表与动态区域语义化

- [ ] **P1B-1**: `AiMessageList.tsx` — 容器添加 `role="log"` + `aria-live="polite"` + `aria-label`；加载中状态添加 `aria-busy="true"`
  - 文件：`renderer/src/features/ai/AiMessageList.tsx`
  - 测试：单元测试 `features/ai/AiMessageList.a11y.test.tsx`，验证 aria-live 和 aria-busy 随状态变化
- [ ] **P1B-2**: 搜索结果列表 — 确认 `role="list"` / `role="listitem"` 正确标记
  - 文件：`renderer/src/features/search/` 下相关组件
  - 测试：单元测试，验证列表语义
- [ ] **P1B-3**: 版本历史列表 — 确认 `role="list"` / `role="listitem"` 正确标记
  - 文件：`renderer/src/features/version-history/` 下相关组件（如存在）
  - 测试：单元测试

### 1C. 表单区域语义化

- [ ] **P1C-1**: `SettingsDialog.tsx` 及子页面 — 所有 `<input>` 关联 `<label>`（`htmlFor`）或 `aria-label`；错误消息关联 `aria-describedby`；必填字段标注 `aria-required`
  - 文件：`renderer/src/features/settings-dialog/SettingsDialog.tsx`、`SettingsAppearancePage.tsx`、`SettingsGeneral.tsx`、`SettingsAccount.tsx`
  - 测试：单元测试 `features/settings-dialog/SettingsDialog.a11y.test.tsx`
- [ ] **P1C-2**: `ExportDialog.tsx` — 表单字段语义化标记
  - 文件：`renderer/src/features/export/ExportDialog.tsx`
  - 测试：单元测试
- [ ] **P1C-3**: 创建项目对话框 — 表单字段语义化标记
  - 文件：`renderer/src/features/dashboard/` 下相关对话框
  - 测试：单元测试

### 1D. 导航与工具栏语义化

- [ ] **P1D-1**: `Sidebar.tsx` — 添加 `role="navigation"` + `aria-label="主导航"`
  - 文件：`renderer/src/components/layout/Sidebar.tsx`
  - 测试：单元测试 `components/layout/Sidebar.a11y.test.tsx`
- [ ] **P1D-2**: Tab 组件（如 AI 面板 tab、设置 tab）— 确认 `role="tablist"` / `role="tab"` / `role="tabpanel"` 正确标记（Radix Tabs 已内置，需确认自定义 tab 实现）
  - 测试：单元测试，验证 tab 语义
- [ ] **P1D-3**: `EditorToolbar.tsx` — 添加 `role="toolbar"` + `aria-label="编辑器工具栏"`
  - 文件：`renderer/src/features/editor/EditorToolbar.tsx`
  - 测试：单元测试 `features/editor/EditorToolbar.a11y.test.tsx`

### 1E. Icon 无障碍

- [ ] **P1E-1**: 全局审查纯装饰 icon，添加 `aria-hidden="true"`；功能性 icon 添加 `aria-label`
  - 范围：`renderer/src/` 下所有使用 `<Icon>` 或 SVG 的组件
  - 验证：`grep -rn '<.*Icon' renderer/src/ --include='*.tsx' | grep -v 'aria-'` 输出为 0
  - 测试：Guard 测试 `guards/icon-aria.guard.test.ts`——扫描所有 `.tsx` 文件中的 Icon 使用，确认每个 Icon 要么有 `aria-hidden="true"` 要么有 `aria-label`

---

## Phase 2: 键盘导航

### 2A. 树形结构键盘导航

- [ ] **P2A-1**: 创建 `useTreeKeyboardNav` hook——实现树形结构通用键盘导航逻辑
  - 文件：新建 `renderer/src/hooks/useTreeKeyboardNav.ts`
  - 行为：↑↓ 移动焦点、→ 展开节点、← 折叠节点（或跳转到父节点）、Enter 选中/打开、Home 跳转首项、End 跳转末项
  - 测试：单元测试 `hooks/useTreeKeyboardNav.test.ts`，覆盖所有按键行为 + 边界（空树、单节点、深层嵌套）
- [ ] **P2A-2**: `FileTreePanel.tsx` — 集成 `useTreeKeyboardNav`，支持 F2 重命名、Delete 删除
  - 文件：`renderer/src/features/files/FileTreePanel.tsx`、`FileTreeNodeRow.tsx`
  - 测试：集成测试 `features/files/FileTreePanel.keyboard.test.tsx`，验证完整键盘操作流程
- [ ] **P2A-3**: `OutlinePanel.tsx` — 集成 `useTreeKeyboardNav`，Enter 跳转到文档对应位置
  - 文件：`renderer/src/features/outline/OutlinePanel.tsx`
  - 测试：集成测试 `features/outline/OutlinePanel.keyboard.test.tsx`

### 2B. Dashboard 网格导航

- [ ] **P2B-1**: `DashboardProjectGrid.tsx` — 实现方向键网格导航（←→↑↓ 在卡片间移动焦点）+ Enter 打开项目
  - 文件：`renderer/src/features/dashboard/DashboardProjectGrid.tsx`
  - 使用 `roving tabindex` 模式：网格中仅当前聚焦卡片 `tabIndex=0`，其余 `tabIndex=-1`
  - 测试：集成测试 `features/dashboard/DashboardProjectGrid.keyboard.test.tsx`

### 2C. 工具栏键盘导航

- [ ] **P2C-1**: `EditorToolbar.tsx` — 实现 `roving tabindex`：←→ 移动焦点、Enter/Space 激活、Tab 离开 toolbar
  - 文件：`renderer/src/features/editor/EditorToolbar.tsx`
  - 测试：集成测试 `features/editor/EditorToolbar.keyboard.test.tsx`

### 2D. AI 面板键盘操作

- [ ] **P2D-1**: AI 面板 — 确认 Tab 切换 tab、Enter 发送消息、Esc 关闭面板的键盘行为
  - 文件：`renderer/src/features/ai/` 下相关组件
  - 测试：集成测试 `features/ai/AiPanel.keyboard.test.tsx`

### 2E. Modal Focus 管理

- [ ] **P2E-1**: 审查所有非 Radix Dialog 的自定义弹窗，确认 focus trap 实现
  - 范围：`SkillManagerDialog.tsx`、`MemorySettingsDialog.tsx`、`MemoryCreateDialog.tsx` 及其他自定义 Modal
  - 行为：打开时聚焦第一个可交互元素、Tab/Shift+Tab 在弹窗内循环、Esc 关闭、关闭时恢复触发元素焦点
  - 实现：如自定义 Modal 均基于 Radix Dialog，则验证即可；若有非 Radix 实现，需创建 `useFocusTrap` hook
  - 测试：集成测试，每个自定义 Modal 一个 focus trap 测试用例

### 2F. CommandPalette 验证

- [ ] **P2F-1**: 验证 CommandPalette 键盘行为已完整——↑↓ 选择、Enter 执行、Esc 关闭、Type-ahead 搜索
  - 测试：确认现有测试覆盖，补充缺失用例

---

## Phase 3: 高对比模式

### 3A. `prefers-contrast: more` 支持

- [ ] **P3A-1**: 在 `tokens.css` 中添加 `@media (prefers-contrast: more)` 规则，覆盖核心 Design Token
  - 文件：`renderer/src/styles/tokens.css`
  - 覆盖内容：`--color-border-*`（增强边框可见性）、`--color-text-muted`（提升弱文本对比度）、`--color-bg-hover`（增强悬停反馈）、`--shadow-*`（增强阴影可见性）
  - 测试：单元测试 `styles/high-contrast.test.ts`——验证 `prefers-contrast: more` media query 存在且覆盖关键 token
- [ ] **P3A-2**: 在 `design/system/01-tokens.css` 中同步添加高对比模式 token 定义（如 design 层维护 token 源）
  - 文件：`design/system/01-tokens.css`

### 3B. `forced-colors: active` 支持（Windows 高对比模式）

- [ ] **P3B-1**: 添加 `@media (forced-colors: active)` 基础规则
  - 文件：`renderer/src/styles/tokens.css`（或新建 `renderer/src/styles/forced-colors.css`）
  - 内容：对关键组件的 `forced-color-adjust` 进行选择性控制
  - 测试：单元测试，验证 media query 规则存在

### 3C. 高对比模式视觉验证

- [ ] **P3C-1**: 在 Storybook 中添加高对比模式装饰器，允许在 Story 中切换高对比模式预览
  - 实现：Storybook global decorator 注入 `prefers-contrast: more` class 模拟
  - 验证：`pnpm -C apps/desktop storybook:build` 构建通过

---

## Phase 4: 屏幕阅读器优化

### 4A. Skip Links

- [ ] **P4A-1**: 创建 `SkipLink` 组件——页面顶部提供"跳转到主内容区"链接（仅在 Tab 聚焦时可见）
  - 文件：新建 `renderer/src/components/a11y/SkipLink.tsx`
  - 在 `App.tsx` 或 `AppShell.tsx` 顶部引入
  - 测试：单元测试 `components/a11y/SkipLink.test.tsx`——验证 Tab 聚焦时可见、Enter 后焦点跳转到 `main` 区域

### 4B. 状态通知区域

- [ ] **P4B-1**: 创建全局 `LiveRegion` 组件——`aria-live="polite"` 区域，用于通知操作结果
  - 文件：新建 `renderer/src/components/a11y/LiveRegion.tsx`
  - 用途：保存成功、AI 回复完成、导出完成等状态通知
  - 测试：单元测试 `components/a11y/LiveRegion.test.tsx`——验证文本更新时 aria-live 区域内容变化
- [ ] **P4B-2**: 在关键操作点集成 LiveRegion 通知
  - 范围：文件保存、AI 消息完成、导出完成、设置保存
  - 测试：集成测试，验证操作完成后 LiveRegion 内容更新

---

## Phase 5: axe-core CI 集成

### 5A. Storybook axe-core 集成

- [ ] **P5A-1**: 安装 `@storybook/addon-a11y`，在 Storybook 配置中注册
  - 文件：`apps/desktop/.storybook/main.ts`（或对应配置文件）
  - 验证：`pnpm -C apps/desktop storybook:build` 构建通过
- [ ] **P5A-2**: 创建 axe-core Storybook 审计脚本——自动对所有 Story 运行 axe 审计
  - 文件：新建 `scripts/storybook-a11y-audit.sh`（或 Node 脚本）
  - 通过条件：violation = 0
  - 测试：在 CI 中作为 required check 运行

### 5B. vitest-axe 单元测试集成

- [ ] **P5B-1**: 安装 `vitest-axe`（或 `jest-axe` + adapter），创建 axe 测试 helper
  - 文件：新建 `renderer/src/test-utils/axe-helper.ts`
  - 提供 `expectNoAxeViolations(container)` 工具函数
- [ ] **P5B-2**: 为核心组件添加 axe 自动审计测试
  - 范围：FileTreePanel、OutlinePanel、AiMessageList、DashboardPage、SettingsDialog、EditorToolbar、Sidebar
  - 文件：在各组件的 `.a11y.test.tsx` 中添加 `expectNoAxeViolations` 断言
  - 测试类型：单元测试，每个组件渲染后运行 axe 扫描

---

## R10 基线采集（2025-07-24）

**触发源**: v1-17 PR #1222 + v1-18 PR #1223 合并后
**采集口径**: worktree `issue-1224-r10-p8-tasks-cascade`（基于最新 main）
**采集范围**: `apps/desktop/renderer/src/`（全 renderer，比 R9 的 `features/` 更宽）

| 指标 | R9 值 | R10 值 | Delta | 说明 |
|------|-------|--------|-------|------|
| `role=` 属性（renderer/src/ .tsx） | — | 102 | — | R9 未单独统计 role=；R10 首次采集 |
| `aria-*` 属性（renderer/src/ .tsx） | 195（features/） | 368 | +173 | R10 范围扩大到 renderer/src/（含 components/）；Radix 组件贡献显著 |
| 键盘事件处理（onKeyDown/Up/Press） | 16（features/） | 28 | +12 | 范围扩大；含 components/ 层键盘处理 |
| `tabIndex` 使用 | — | 25 | — | R9 未单独统计；R10 首次采集 |
| `useFocus`/`autoFocus`/`focus()` | — | 74 | — | R9 未单独统计；R10 首次采集 |
| a11y 测试文件数 | — | 13 | — | 含 axe/a11y/accessibility 关键词的测试文件 |
| `prefers-reduced-motion`（CSS+TSX） | 5 | 5 | ±0 | 稳定，v1-12 已落地 |
| `prefers-contrast`（renderer） | 0 | 0 | ±0 | 仍为 0，v1-19 核心任务 |
| `prefers-contrast`（design/） | 0 | 0 | ±0 | 仍为 0，v1-19 核心任务 |

**R10 观察**：
- ARIA 基础由 Radix 组件自动覆盖（368 处），但树形结构（FileTree/OutlinePanel）仍缺少 `role="tree"` / `role="treeitem"` 语义
- 键盘处理（28 处）主要集中在 CommandPalette 和表单组件，树形导航和网格导航为空白
- 高对比模式支持为 0——从 R6 到 R10 无变化，确认为 v1-19 核心交付物
- 已有 13 个 a11y 相关测试文件，但无 axe-core 自动化审计

---

## 审计意见

### Phase 0（准备）

- ✅ **合理**。P0-4（axe-core 方案选型）和 P0-6（快捷键冲突 map）是关键准备，防止后续返工。
- ⚠️ **建议**：P0-6 的快捷键 map 建议输出为 `docs/references/keyboard-shortcuts.md`，作为持久资产而非一次性调研。

### Phase 1（语义化标记）

- ✅ **任务粒度适当**。按组件类型（树/列表/表单/导航/icon）分组，每个 task 指向具体文件。
- ✅ **测试要求合理**。每个语义标记变更配对单元测试，验证 ARIA 属性随状态正确变化。
- ⚠️ **P1B-2/P1B-3**（搜索结果/版本历史列表）——如果这些组件基于 Radix 的 `List` 原语，可能已有内置语义标记。建议先审查再决定是否需要手动标记，避免与 Radix 冲突。
- ⚠️ **P1E-1**（Icon Guard）——Guard 测试是好主意，但需注意：部分 Icon 通过父元素的 `aria-label` 提供语义（如 `<button aria-label="保存"><SaveIcon /></button>`），Guard 规则需排除这种情况。

### Phase 2（键盘导航）

- ✅ **P2A-1**（`useTreeKeyboardNav` hook）是正确抽象——FileTree 和 OutlinePanel 共享相同的键盘导航模式，提取为 hook 避免重复。
- ✅ **P2B-1**（Dashboard 网格导航）的 roving tabindex 方案符合 WAI-ARIA Grid 模式。
- ⚠️ **P2E-1**（Modal Focus 管理）——建议先确认所有自定义 Modal 是否均基于 Radix Dialog。如果是，此 task 简化为验证任务。探索阶段结果显示 SkillManagerDialog 等可能已使用 Radix Dialog，需实际确认。
- ⚠️ **P2D-1**（AI 面板键盘）——"Esc 关闭面板"需与全局 Esc 行为（如关闭 CommandPalette）确认优先级，避免冲突。

### Phase 3（高对比模式）

- ✅ **任务范围合理**。`prefers-contrast: more` 和 `forced-colors: active` 两条路径都覆盖。
- ✅ **P3A-1 在 tokens.css 中覆盖 Design Token 是正确策略**——利用 CSS 变量级联，所有使用 token 的组件自动获得高对比效果，无需逐组件修改。
- ⚠️ **P3C-1**（Storybook 高对比装饰器）——Storybook 中模拟 `prefers-contrast` 需要 CSS class 方案而非真正的 media query，确保模拟准确性。可考虑使用 Storybook 的 `@storybook/addon-themes` 或自定义 viewport decorator。

### Phase 4（屏幕阅读器优化）

- ✅ **SkipLink 和 LiveRegion 是必要组件**，proposal 中明确要求。
- ⚠️ **P4B-2**（LiveRegion 集成点）——覆盖范围需明确。建议至少覆盖：文件保存成功/失败、AI 消息完成、导出成功/失败、设置保存。但不宜过度——不是每个状态变化都需要 aria-live 通知，否则会造成 screen reader 信息过载。

### Phase 5（axe-core CI 集成）

- ✅ **双层集成策略合理**——Storybook addon-a11y 覆盖 Story 级别，vitest-axe 覆盖单元测试级别。
- ⚠️ **P5A-2**（Storybook 审计脚本）——需确认 `@storybook/test-runner` + `axe-playwright` 的技术可行性。如果 Storybook 版本不支持 test-runner，可能需要回退到 vitest-axe 作为唯一 CI gate。
- ⚠️ **依赖风险**：axe-core Storybook 集成依赖 Storybook test-runner 和 Playwright，引入额外 CI 依赖。建议 P0-4 选型时评估维护成本。

### 遗漏检查

- ⚠️ **`prefers-reduced-motion` 已在 Non-Goals 中排除**（proposal 明确）。但 R10 显示已有 5 处支持——如果后续有人问起，可指向 R10 基线说明已有部分覆盖。
- ⚠️ **缺少 color contrast 专项任务**——AC-10 要求 4.5:1 对比度，但 Phase 1-5 中没有专门的色彩对比度审计和修复 task。建议依赖 Phase 5 的 axe-core 扫描来发现对比度问题，发现后作为 bug fix 处理。
- ✅ **proposal 中的 Non-Goals 均已排除**——WCAG AAA、完整 screen reader E2E、RTL、Radix 内部 a11y、动效偏好设置均不在 task 范围内。

### 总体评估

**工作量预估与 proposal 一致**：Phase 1 约 2d、Phase 2 约 3d、Phase 3 约 1d、Phase 4 约 1d、Phase 5 约 0.5d，合计约 7.5d。R6 级联分析已确认 Radix 基础使工作量减少约 40%，符合预期。

**主要风险**：
1. ARIA 角色错误使用比不用更糟——P0-4 选型完成后，建议每个 Phase 1 task 完成后立即运行 axe 扫描，而非等到 Phase 5
2. 键盘导航与快捷键冲突——P0-6 的快捷键 map 是关键风控措施
3. axe-core CI 集成的技术复杂度可能被低估——建议 Phase 5 作为独立 PR，避免阻塞其他 Phase 合并
