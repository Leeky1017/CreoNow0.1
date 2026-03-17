# Tasks: V1-06 AI 面板大整修

- **GitHub Issue**: 待创建
- **分支**: `task/<N>-ai-panel-overhaul`
- **Delta Spec**: `openspec/changes/v1-06-ai-panel-overhaul/specs/`

---

## 验收标准

| ID | 标准 | 对应 Scenario |
| --- | --- | --- |
| AC-1 | `AiPanel.tsx` 行数 ≤ 300 行，仅保留面板框架 + Tab 切换 + 子组件编排 | 全局 |
| AC-2 | `AiPanelTabBar.tsx` 独立文件存在，实现 Chat / History 标签页切换 UI | 全局 |
| AC-3 | `AiMessageList.tsx` 独立文件存在，包含消息流渲染（用户 + AI + 系统消息） | 全局 |
| AC-4 | `AiInputArea.tsx` 独立文件存在，包含 textarea + emoji + 文件上传 + Model / Mode / Skill 选择器 | 全局 |
| AC-5 | `AiProposalView.tsx` 独立文件存在，包含 Proposal accept / reject / undo + inline diff | 全局 |
| AC-6 | `AiEmptyState.tsx` 独立文件存在，包含 48px sunburst icon + 居中引导文案 + 渐入动画 | 全局 |
| AC-7 | `AiUsageStats.tsx` 独立文件存在，包含 token / cost 分行展示 + 小字注释 | 全局 |
| AC-8 | AI 回复消息左侧有 2px accent 边框，使用 `--color-accent` token | 视觉 |
| AC-9 | 代码块使用 `var(--font-mono)` 字体，渲染为等宽字体（JetBrains Mono 或回退） | 视觉 |
| AC-10 | Model / Mode / Skill 选择器有 chevron icon + hover 高亮交互指示 | 视觉 |
| AC-11 | 流式输出有打字机逐字渲染效果 + 脉冲光标动画 | 视觉 |
| AC-12 | ErrorGuideCard 按严重等级区分左边框颜色：error（`--color-danger`）/ warning（`--color-warning`）/ info（`--color-info`） | 视觉 |
| AC-13 | 拆分前后全量测试 100% 通过，0 个新增失败 | 全局 |
| AC-14 | 拆分前后现有 14 个 AI 测试文件全部通过，行为无任何变化 | 全局 |
| AC-15 | 拆分后各子组件通过 props / hook 返回值通信，无全局隐式依赖 | 全局 |
| AC-16 | Storybook 可构建（`pnpm -C apps/desktop storybook:build`） | 全局 |
| AC-17 | TypeScript 类型检查通过（`pnpm typecheck`） | 全局 |
| AC-18 | lint 无新增违规（`pnpm lint`） | 全局 |
| AC-19 | 所有新增视觉元素使用语义化 Design Token，0 处新增 Tailwind arbitrary 色值 / 字号 | 全局 |

---

## Phase 0: 准备

- [ ] 阅读 `AGENTS.md`
- [ ] 阅读 `design/DESIGN_DECISIONS.md` §22（AI 面板规范）
- [ ] 阅读设计稿 `design/Variant/designs/14-ai-panel.html` 全文——标注 Tab 布局、消息气泡样式、空状态规范、输入区结构
- [ ] 阅读设计稿 `design/Variant/designs/32-ai-streaming-states.html`——标注流式输出动效、状态切换视觉
- [ ] 阅读设计稿 `design/Variant/designs/33-ai-dialogs.html`——标注 ErrorGuideCard 等级化视觉
- [ ] 阅读 `apps/desktop/renderer/src/features/ai/AiPanel.tsx` 全文（2,100 行），绘制职责分区图：
  - 标注 Tab 切换逻辑区域（行号范围）
  - 标注消息流渲染区域（行号范围）
  - 标注输入区域（行号范围）
  - 标注 Proposal 预览区域（行号范围）
  - 标注空状态渲染区域（行号范围）
  - 标注 ErrorGuideCard 区域（行号范围）
  - 标注使用量统计区域（行号范围）
  - 标注流式输出状态管理区域（行号范围）
- [ ] 识别各区域之间的数据依赖——哪些 store state / props 跨区域共享
- [ ] 列出现有测试文件：
  - `AiPanel.aria-live.test.tsx`
  - `AiPanel.db-error.test.tsx`
  - `AiPanel.error-guide.test.tsx`
  - `AiPanel.history-replay.test.tsx`
  - `AiPanel.history.interaction.test.tsx`
  - `AiPanel.i18n-guard.test.ts`
  - `AiPanel.imports.test.ts`
  - `AiPanel.layout.test.tsx`
  - `AiPanel.selection-reference.test.tsx`
  - `AiPanel.stories.test.ts`
  - `AiPanel.styles.guard.test.ts`
  - `AiPanel.test.tsx`
  - `SkillManagerDialog.test.tsx`
  - `SkillPicker.test.tsx`
- [ ] 运行现有测试基线：`pnpm -C apps/desktop vitest run ai`，记录通过 / 失败数量——此基线在拆分全程不可退步
- [ ] 确认 `--color-accent` 和 `--font-mono` token 可用
- [ ] 确认 v1-02（Primitive 进化）已合并，Tabs 底线指示器 primitive 可用

---

## Phase 1: Red（测试先行）

### 组件拆分测试策略

> 「解牛不伤刃，拆组件不丢行为。」

AiPanel 的拆分测试采用 **三层防护** 策略：

1. **回归门禁**（Task 1.7）：拆分前后全部 14 个现有测试文件必须 100% 通过——这是不可协商的底线
2. **子组件独立性测试**（Task 1.1）：验证新拆分的子组件可独立渲染，不依赖 AiPanel 内部状态
3. **子组件行为测试**（Task 1.2–1.6）：验证提取出的子组件各自承担了正确的职责

拆分过程中，每提取一个子组件后立即运行全部 14 个测试——如有失败，立即回退修复。不允许"先拆完再修测试"。

### Task 1.1: 模块独立性测试

**映射验收标准**: AC-1, AC-15

- [ ] 测试：`AiPanel.tsx` 仅导入子组件（AiPanelTabBar、AiMessageList、AiInputArea、AiProposalView、AiEmptyState、AiUsageStats），不直接包含消息渲染 / 输入逻辑代码
- [ ] 测试：`AiPanel` 渲染后包含 `AiPanelTabBar`、`AiMessageList`（或 `AiEmptyState`）、`AiInputArea` 子组件

**文件**: `apps/desktop/renderer/src/features/ai/__tests__/AiPanelDecomposition.test.tsx`（新建）

### Task 1.2: AiPanelTabBar 行为测试

**映射验收标准**: AC-2

- [ ] 测试：AiPanelTabBar 渲染包含 "Chat" 和 "History" 两个 tab（通过 `getByRole('tab')`）
- [ ] 测试：点击 "History" tab 触发 `onTabChange('history')` 回调
- [ ] 测试：活跃 tab 有底线指示器样式

**文件**: `apps/desktop/renderer/src/features/ai/__tests__/AiPanelTabBar.test.tsx`（新建）

### Task 1.3: AiMessageList 渲染测试

**映射验收标准**: AC-3, AC-8, AC-9

- [ ] 测试：AiMessageList 接收消息列表 prop 后正确渲染用户消息和 AI 消息
- [ ] 测试：AI 回复消息的容器有 `border-left: 2px solid` accent 边框样式（通过 computed style 或 className 验证）
- [ ] 测试：代码块元素有 `font-family` 包含 monospace / `var(--font-mono)` 的样式

**文件**: `apps/desktop/renderer/src/features/ai/__tests__/AiMessageList.test.tsx`（新建）

### Task 1.4: AiInputArea 交互测试

**映射验收标准**: AC-4, AC-10

- [ ] 测试：AiInputArea 渲染包含 textarea 输入区（通过 `getByRole('textbox')`）
- [ ] 测试：Model / Mode / Skill 选择器有 chevron icon 元素
- [ ] 测试：选择器 hover 后有高亮视觉反馈（className 变化）

**文件**: `apps/desktop/renderer/src/features/ai/__tests__/AiInputArea.test.tsx`（新建）

### Task 1.5: AiEmptyState 渲染测试

**映射验收标准**: AC-6

- [ ] 测试：AiEmptyState 渲染包含 sunburst icon（48px 尺寸验证）
- [ ] 测试：AiEmptyState 包含引导文案文本
- [ ] 测试：AiEmptyState 的 icon 有旋转动画 className

**文件**: `apps/desktop/renderer/src/features/ai/__tests__/AiEmptyState.test.tsx`（新建）

### Task 1.6: AiUsageStats 渲染测试

**映射验收标准**: AC-7

- [ ] 测试：AiUsageStats 接收 token count 和 cost 后分行展示（不在同一行）
- [ ] 测试：AiUsageStats 包含小字注释元素

**文件**: `apps/desktop/renderer/src/features/ai/__tests__/AiUsageStats.test.tsx`（新建）

### Task 1.7: 行为等价回归测试（贯穿全程）

**映射验收标准**: AC-13, AC-14

- [ ] 运行 `pnpm -C apps/desktop vitest run ai` 全部 AI 测试，确认与 Phase 0 基线 100% 一致
- [ ] 确认 0 个新增失败

**注意**: 此 Task 在 Phase 2 每个子任务完成后立即执行——不是"拆完再验"，而是"拆一个验一个"。

---

## Phase 2: Green（最小实现）

### 拆分执行策略

> 「庖丁解牛，以无厚入有间。」

拆分顺序遵循 **最低耦合优先** 原则——从与主组件耦合最松的模块开始提取，降低每一步的风险：

1. `AiEmptyState` → 2. `AiUsageStats` → 3. `AiPanelTabBar` → 4. `AiMessageList` → 5. `AiInputArea` → 6. `AiProposalView` → 7. 精简 `AiPanel`

每提取一个子组件后，立即执行 Task 1.7 回归门禁。

### Task 2.1: 提取 `AiEmptyState.tsx`

**映射验收标准**: AC-6

- [ ] 从 AiPanel.tsx 中提取空状态渲染代码
- [ ] 实现 48px sunburst icon（使用 Lucide icon 或 SVG）+ CSS `@keyframes` 旋转动画
- [ ] 居中引导文案（走 `t()` i18n）
- [ ] icon 渐入动画：`opacity 0 → 1`，`--duration-normal`（200ms）+ `--ease-default`
- [ ] 组件 props：`{ className?: string }`
- [ ] AiPanel 中替换为 `<AiEmptyState />`
- [ ] **立即运行 Task 1.7 回归门禁**

**文件**: `apps/desktop/renderer/src/features/ai/AiEmptyState.tsx`（新建）

### Task 2.2: 提取 `AiUsageStats.tsx`

**映射验收标准**: AC-7

- [ ] 从 AiPanel.tsx 中提取 token / cost 统计渲染代码
- [ ] 重新布局：token count 和 cost 分行展示
- [ ] 增加小字注释说明（如 "本轮对话消耗"，走 `t()` i18n）
- [ ] 使用 `--text-label-*` typography token
- [ ] 组件 props：`{ tokenCount: number; cost: number; className?: string }`
- [ ] AiPanel 中替换为 `<AiUsageStats tokenCount={...} cost={...} />`
- [ ] **立即运行 Task 1.7 回归门禁**

**文件**: `apps/desktop/renderer/src/features/ai/AiUsageStats.tsx`（新建）

### Task 2.3: 提取 `AiPanelTabBar.tsx`

**映射验收标准**: AC-2

- [ ] 从 AiPanel.tsx 中提取 Tab 切换逻辑
- [ ] 实现 Chat / History 双标签页 UI，使用 Tabs primitive（底线指示器）
- [ ] 对齐 `14-ai-panel.html` 设计稿的 Tab 视觉——active tab 底线使用 `--color-accent`
- [ ] 组件 props：`{ activeTab: 'chat' | 'history'; onTabChange: (tab: string) => void }`
- [ ] AiPanel 中替换为 `<AiPanelTabBar activeTab={...} onTabChange={...} />`
- [ ] **立即运行 Task 1.7 回归门禁**

**文件**: `apps/desktop/renderer/src/features/ai/AiPanelTabBar.tsx`（新建）

### Task 2.4: 提取 `AiMessageList.tsx`

**映射验收标准**: AC-3, AC-8, AC-9

- [ ] 从 AiPanel.tsx 中提取消息流渲染代码——用户消息、AI 消息、系统消息
- [ ] AI 回复消息容器增加左侧 2px accent 边框：`border-left: 2px solid var(--color-accent)`
- [ ] 代码块增加 `font-family: var(--font-mono)`——确保 JetBrains Mono 或等宽回退
- [ ] 流式输出动效实现：
  - 打字机效果：逐字渲染，使用 `requestAnimationFrame` 或 CSS animation
  - 脉冲光标：`@keyframes blink { 0%, 100% { opacity: 1 } 50% { opacity: 0 } }` 配合 `--duration-normal`
  - 对齐 `32-ai-streaming-states.html` 设计稿
- [ ] 组件 props：`{ messages: Message[]; isStreaming: boolean; ... }`
- [ ] AiPanel 中替换为 `<AiMessageList messages={...} isStreaming={...} />`
- [ ] **立即运行 Task 1.7 回归门禁**

**文件**: `apps/desktop/renderer/src/features/ai/AiMessageList.tsx`（新建）

### Task 2.5: 提取 `AiInputArea.tsx`

**映射验收标准**: AC-4, AC-10

- [ ] 从 AiPanel.tsx 中提取输入区代码——textarea、emoji 选择、文件上传
- [ ] Model / Mode / Skill 选择器增加交互增强：
  - 每个选择器增加 chevron icon（使用 Lucide `ChevronDown`）
  - hover 时背景色变为 `var(--color-bg-hover)`
  - 点击展开状态下 chevron 旋转 180°，使用 `--duration-fast` transition
- [ ] 组件 props：接收 store state + 回调函数
- [ ] AiPanel 中替换为 `<AiInputArea ... />`
- [ ] **立即运行 Task 1.7 回归门禁**

**文件**: `apps/desktop/renderer/src/features/ai/AiInputArea.tsx`（新建）

### Task 2.6: 提取 `AiProposalView.tsx`

**映射验收标准**: AC-5

- [ ] 从 AiPanel.tsx 中提取 Proposal 预览代码——accept / reject / undo 操作、inline diff 展示
- [ ] 保持现有交互逻辑不变
- [ ] 组件 props：`{ proposal: Proposal; onAccept: () => void; onReject: () => void; onUndo: () => void; ... }`
- [ ] AiPanel 中替换为 `<AiProposalView proposal={...} ... />`
- [ ] **立即运行 Task 1.7 回归门禁**

**文件**: `apps/desktop/renderer/src/features/ai/AiProposalView.tsx`（新建）

### Task 2.7: ErrorGuideCard 等级化

**映射验收标准**: AC-12

- [ ] 修改 ErrorGuideCard 组件（位于 AiPanel 内或独立文件），增加 `severity` prop：`'error' | 'warning' | 'info'`
- [ ] 左边框颜色映射：
  - `error` → `border-left: 3px solid var(--color-danger)`（红色）
  - `warning` → `border-left: 3px solid var(--color-warning)`（黄色）
  - `info` → `border-left: 3px solid var(--color-info)`（蓝色）
- [ ] 对齐 `33-ai-dialogs.html` 设计稿
- [ ] **立即运行 Task 1.7 回归门禁**

**文件**: AiPanel 内 ErrorGuideCard 部分（或独立文件）

### Task 2.8: 精简 `AiPanel.tsx`

**映射验收标准**: AC-1

- [ ] 移除已提取到子组件的所有代码
- [ ] 保留面板框架 JSX：Tab 切换编排、组件条件渲染、store 消费分发
- [ ] 导入并组合子组件：AiPanelTabBar、AiMessageList、AiInputArea、AiProposalView、AiEmptyState、AiUsageStats
- [ ] 确保 store state 通过 props 传递给各子组件
- [ ] 目标行数 ≤ 300 行
- [ ] 清理不再需要的 import 语句
- [ ] **最终运行 Task 1.7 回归门禁**

**文件**: `apps/desktop/renderer/src/features/ai/AiPanel.tsx`（重构）

---

## Phase 3: Verification & Delivery

- [ ] 运行 Phase 1 全部新测试（Task 1.1–1.6），确认全绿
- [ ] 运行 `pnpm -C apps/desktop vitest run ai` 全部 AI 测试，确认与 Phase 0 基线 100% 一致
- [ ] 运行 `pnpm -C apps/desktop vitest run` 全量测试通过
- [ ] 运行 `pnpm typecheck` 类型检查通过
- [ ] 运行 `pnpm lint` lint 无新增违规
- [ ] 运行 `pnpm -C apps/desktop storybook:build` Storybook 可构建
- [ ] 确认文件行数：
  - `AiPanel.tsx` ≤ 300 行
  - `AiPanelTabBar.tsx` ≤ 200 行
  - `AiMessageList.tsx` ≤ 300 行
  - `AiInputArea.tsx` ≤ 300 行
  - `AiProposalView.tsx` ≤ 300 行
  - `AiEmptyState.tsx` ≤ 100 行
  - `AiUsageStats.tsx` ≤ 100 行
- [ ] 确认拆分后各文件之间无循环依赖
- [ ] 视觉验收——逐项目视比对：
  - Tab UI 对齐 `14-ai-panel.html`
  - AI 消息 accent 左边框可见
  - 空状态 sunburst icon 渲染且有旋转动画
  - 代码块使用等宽字体
  - 选择器有 chevron + hover 高亮
  - 流式输出有打字机效果 + 脉冲光标
  - ErrorGuideCard 三色等级可见
  - 使用量统计分行展示
- [ ] 确认 0 处新增 Tailwind arbitrary 色值 / 字号
- [ ] 创建 PR（含 `Closes #N`），附视觉对比截图 + 拆分前后文件结构对比
