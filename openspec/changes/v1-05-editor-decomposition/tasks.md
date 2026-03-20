# Tasks: V1-05 编辑器组件拆分

> **✅ 已合并** · 评级 ⭐⭐⭐⭐⭐ · EditorPane 1,550→232 行（↓85%）

- **状态**: ✅ 已合并到 main
- **Delta Spec**: `openspec/changes/v1-05-editor-decomposition/specs/`

---

## 验收标准

| ID    | 标准                                                                                                       | 对应 Scenario | 结果                                  |
| ----- | ---------------------------------------------------------------------------------------------------------- | ------------- | ------------------------------------- |
| AC-1  | `EditorPane.tsx` 行数 ≤ 300 行，仅保留布局编排逻辑                                                         | 全局          | ✅ **232 行**（↓85%）                 |
| AC-2  | `useEditorSetup.ts` 独立文件存在，包含 TipTap 初始化 + 扩展注册 + editor 实例创建，行数 ≤ 300 行           | 全局          | ✅ **290 行**                         |
| AC-3  | `InlineAiOverlay.tsx` 独立文件存在，包含 inline AI 输入处理 + proposal 展示 + accept/reject，行数 ≤ 300 行 | 全局          | ✅ **200 行**                         |
| AC-4  | `EntityCompletionPopover.tsx` 独立文件存在，包含 `@` mention 触发 + 候选列表 + 键盘导航，行数 ≤ 300 行     | 全局          | ✅ EntityCompletionPanel **86 行** + useEntityCompletion **269 行** |
| AC-5  | `SlashCommandMenu.tsx` 独立文件存在，包含 `/` 命令面板 + 命令执行，行数 ≤ 300 行                           | 全局          | ✅ SlashCommandPanel **84 行** + slashCommands **107 行** |
| AC-6  | `useEditorKeybindings.ts` 独立文件存在，包含快捷键注册逻辑，行数 ≤ 300 行                                  | 全局          | ✅ **219 行**                         |
| AC-7  | 拆分前后全量测试 100% 通过，0 个新增失败                                                                   | 全局          | ✅ 100% 通过                          |
| AC-8  | 拆分前后所有现有行为不变（纯重构，无功能变更）                                                             | 全局          | ✅ 零回归                             |
| AC-9  | 拆分后各子模块之间通过 props / hook 返回值通信，无全局隐式依赖                                             | 全局          | ✅ 达成                               |
| AC-10 | Storybook 可构建（`pnpm -C apps/desktop storybook:build`）                                                 | 全局          | ✅ 通过                               |
| AC-11 | TypeScript 类型检查通过（`pnpm typecheck`）                                                                | 全局          | ✅ 通过                               |
| AC-12 | lint 无新增违规（`pnpm lint`）                                                                             | 全局          | ✅ 通过                               |

---

## Phase 0: 准备

- [x] 阅读 `AGENTS.md`
- [x] 阅读 `apps/desktop/renderer/src/features/editor/EditorPane.tsx` 全文（1,550 行），绘制职责分区图：
  - 标注 TipTap 初始化区域（行号范围）
  - 标注 inline AI 处理区域（行号范围）
  - 标注 Entity Completion 区域（行号范围）
  - 标注 Slash Command 区域（行号范围）
  - 标注 autosave 区域（行号范围）
  - 标注快捷键注册区域（行号范围）
  - 标注布局渲染区域（行号范围）
- [x] 识别各区域之间的数据依赖：哪些变量/状态跨区域共享
- [x] 列出现有测试文件：`apps/desktop/renderer/src/features/editor/__tests__/` 下所有测试
- [x] 运行现有测试基线：`pnpm -C apps/desktop vitest run editor`，记录通过/失败数量
- [x] 确认 autosave 逻辑：评估是否保留在 EditorPane 还是提取——鉴于 autosave 通常与 editor 实例紧耦合，可能保留在 `useEditorSetup.ts` 中

---

## Phase 1: Red（测试先行）

### Task 1.1: 模块独立性测试

**映射验收标准**: AC-1, AC-9

- [x] 测试：`EditorPane.tsx` 仅导入子模块组件/hook，不直接包含 TipTap 初始化代码
- [x] 测试：`EditorPane` 渲染后包含 InlineAiOverlay、EntityCompletionPopover、SlashCommandMenu 子组件

**文件**: `apps/desktop/renderer/src/features/editor/EditorPane.test.tsx`

### Task 1.2: useEditorSetup hook 测试

**映射验收标准**: AC-2

- [x] 测试：`useEditorSetup` 返回有效的 editor 实例
- [x] 测试：editor 实例包含所有已注册扩展（数量与拆分前一致）
- [x] 测试：editor 实例在组件卸载时正确销毁

**文件**: `apps/desktop/renderer/src/features/editor/EditorPane.test.tsx`

### Task 1.3: InlineAiOverlay 独立渲染测试

**映射验收标准**: AC-3

- [x] 测试：InlineAiOverlay 接收 editor 实例 prop 后可独立渲染
- [x] 测试：AI 输入激活/取消的 UI 状态切换正确

**文件**: `apps/desktop/renderer/src/features/editor/InlineAi.test.tsx`

### Task 1.4: EntityCompletionPopover 独立渲染测试

**映射验收标准**: AC-4

- [x] 测试：EntityCompletionPopover 接收 editor 实例后可独立渲染
- [x] 测试：`@` 触发后弹出候选列表
- [x] 测试：键盘导航（上/下/Enter/Esc）行为正确

**文件**: `apps/desktop/renderer/src/features/editor/__tests__/entity-completion.*.test.tsx`

### Task 1.5: SlashCommandMenu 独立渲染测试

**映射验收标准**: AC-5

- [x] 测试：SlashCommandMenu 接收 editor 实例后可独立渲染
- [x] 测试：`/` 触发后弹出命令列表
- [x] 测试：选中命令后执行并关闭菜单

**文件**: `apps/desktop/renderer/src/features/editor/slashCommands.test.ts`

### Task 1.6: useEditorKeybindings hook 测试

**映射验收标准**: AC-6

- [x] 测试：`useEditorKeybindings` 接收 editor 实例和 action map 后注册快捷键
- [x] 测试：注册的快捷键组合正确触发对应 action

**文件**: `apps/desktop/renderer/src/features/editor/skillShortcutDispatcher.test.ts`

### Task 1.7: 行为等价回归测试

**映射验收标准**: AC-7, AC-8

- [x] 运行 `pnpm -C apps/desktop vitest run editor` 全部现有测试，确认与 Phase 0 基线一致
- [x] 确认 0 个新增失败

**注意**: 此 Task 在 Phase 2 完成后执行，但在 Phase 1 阶段明确定义为回归门禁。

---

## Phase 2: Green（最小实现）

### Task 2.1: 提取 `useEditorSetup.ts`

**映射验收标准**: AC-2

- [x] 从 EditorPane.tsx 中提取 TipTap 初始化代码：
  - editor 实例创建（`useEditor()` 或等效）
  - 扩展注册列表
  - 初始内容设置
  - editor 生命周期管理（onDestroy / cleanup）
- [x] autosave 集成评估：autosave 提取为独立 `useAutosave.ts`（87 行）
- [x] hook 返回值：`{ editor, isReady }` 或等效接口
- [x] EditorPane 中替换为 `const { editor } = useEditorSetup(options)`

**文件**: `apps/desktop/renderer/src/features/editor/useEditorSetup.ts`（290 行）

### Task 2.2: 提取 `InlineAiOverlay.tsx`

**映射验收标准**: AC-3

- [x] 从 EditorPane.tsx 中提取 inline AI 相关代码：
  - AI 调用触发逻辑
  - AI proposal 展示 UI
  - accept/reject 交互
  - AI 输入 UI 状态管理
- [x] 组件 props：`{ editor: Editor }`（+ store 中的 AI 相关 state）
- [x] EditorPane 中替换为 `<InlineAiOverlay editor={editor} />`

**文件**: `apps/desktop/renderer/src/features/editor/InlineAiOverlay.tsx`（200 行）+ `InlineAiInput.tsx`（70 行）+ `InlineAiDiffPreview.tsx`（127 行）

### Task 2.3: 提取 `EntityCompletionPopover.tsx`

**映射验收标准**: AC-4

- [x] 从 EditorPane.tsx 中提取 entity completion 相关代码：
  - `@` mention 触发检测
  - 候选列表数据获取与渲染
  - 键盘导航逻辑（上/下选择、Enter 确认、Esc 取消）
  - 选中后插入 editor 的逻辑
- [x] 组件 props：`{ editor: Editor }`
- [x] EditorPane 中替换为 `<EntityCompletionPanel editor={editor} />`

**文件**: `apps/desktop/renderer/src/features/editor/EntityCompletionPanel.tsx`（86 行）+ `useEntityCompletion.ts`（269 行）

### Task 2.4: 提取 `SlashCommandMenu.tsx`

**映射验收标准**: AC-5

- [x] 从 EditorPane.tsx 中提取 slash command 相关代码：
  - `/` 命令触发检测
  - 命令列表注册与渲染
  - 命令执行逻辑
  - 菜单关闭逻辑
- [x] 组件 props：`{ editor: Editor }`
- [x] EditorPane 中替换为 `<SlashCommandPanel editor={editor} />`

**文件**: `apps/desktop/renderer/src/features/editor/SlashCommandPanel.tsx`（84 行）+ `slashCommands.ts`（107 行）

### Task 2.5: 提取 `useEditorKeybindings.ts`

**映射验收标准**: AC-6

- [x] 从 EditorPane.tsx 中提取快捷键注册代码：
  - 全局快捷键绑定
  - 编辑器内快捷键绑定
  - 快捷键冲突处理（如有）
- [x] hook 签名：`useEditorKeybindings(editor: Editor, actions: ActionMap)`
- [x] EditorPane 中替换为 `useEditorKeybindings(editor, { ... })`

**文件**: `apps/desktop/renderer/src/features/editor/useEditorKeybindings.ts`（219 行）

### Task 2.6: 精简 `EditorPane.tsx`

**映射验收标准**: AC-1

- [x] 移除已提取到子模块的所有代码
- [x] 保留布局 JSX 结构：toolbar 区域、编辑器正文区域、zen mode 切换
- [x] 导入并组合子模块：`useEditorSetup`、`InlineAiOverlay`、`EntityCompletionPanel`、`SlashCommandPanel`、`useEditorKeybindings`
- [x] 确保 editor 实例通过 props 传递给各子组件
- [x] 目标行数 ≤ 300 行 → **实际 232 行 ✅**
- [x] 清理不再需要的 import 语句

**文件**: `apps/desktop/renderer/src/features/editor/EditorPane.tsx`（232 行）

---

## Phase 3: Verification & Delivery

- [x] 运行 Phase 1 全部新测试，确认全绿
- [x] 运行 `pnpm -C apps/desktop vitest run editor` 全部 editor 测试，确认与 Phase 0 基线 100% 一致
- [x] 运行 `pnpm -C apps/desktop vitest run` 全量测试通过
- [x] 运行 `pnpm typecheck` 类型检查通过
- [x] 运行 `pnpm lint` lint 无新增违规
- [x] 运行 `pnpm -C apps/desktop storybook:build` Storybook 可构建
- [x] 确认文件行数：
  - `EditorPane.tsx` ≤ 300 行 → **232 行 ✅**
  - `useEditorSetup.ts` ≤ 300 行 → **290 行 ✅**
  - `InlineAiOverlay.tsx` ≤ 300 行 → **200 行 ✅**
  - `EntityCompletionPanel.tsx` ≤ 300 行 → **86 行 ✅**
  - `SlashCommandPanel.tsx` ≤ 300 行 → **84 行 ✅**
  - `useEditorKeybindings.ts` ≤ 300 行 → **219 行 ✅**
- [x] 确认拆分后各文件之间无循环依赖
- [x] PR 已合并到 main，100% 行为等价，零回归

---

**无遗留项。**
