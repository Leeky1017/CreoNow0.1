# Tasks: V1-05 编辑器组件拆分

- **GitHub Issue**: 待创建
- **分支**: `task/<N>-editor-decomposition`
- **Delta Spec**: `openspec/changes/v1-05-editor-decomposition/specs/`

---

## 验收标准

| ID | 标准 | 对应 Scenario |
| --- | --- | --- |
| AC-1 | `EditorPane.tsx` 行数 ≤ 300 行，仅保留布局编排逻辑 | 全局 |
| AC-2 | `useEditorSetup.ts` 独立文件存在，包含 TipTap 初始化 + 扩展注册 + editor 实例创建，行数 ≤ 300 行 | 全局 |
| AC-3 | `InlineAiOverlay.tsx` 独立文件存在，包含 inline AI 输入处理 + proposal 展示 + accept/reject，行数 ≤ 300 行 | 全局 |
| AC-4 | `EntityCompletionPopover.tsx` 独立文件存在，包含 `@` mention 触发 + 候选列表 + 键盘导航，行数 ≤ 300 行 | 全局 |
| AC-5 | `SlashCommandMenu.tsx` 独立文件存在，包含 `/` 命令面板 + 命令执行，行数 ≤ 300 行 | 全局 |
| AC-6 | `useEditorKeybindings.ts` 独立文件存在，包含快捷键注册逻辑，行数 ≤ 300 行 | 全局 |
| AC-7 | 拆分前后全量测试 100% 通过，0 个新增失败 | 全局 |
| AC-8 | 拆分前后所有现有行为不变（纯重构，无功能变更） | 全局 |
| AC-9 | 拆分后各子模块之间通过 props / hook 返回值通信，无全局隐式依赖 | 全局 |
| AC-10 | Storybook 可构建（`pnpm -C apps/desktop storybook:build`） | 全局 |
| AC-11 | TypeScript 类型检查通过（`pnpm typecheck`） | 全局 |
| AC-12 | lint 无新增违规（`pnpm lint`） | 全局 |

---

## Phase 0: 准备

- [ ] 阅读 `AGENTS.md`
- [ ] 阅读 `apps/desktop/renderer/src/features/editor/EditorPane.tsx` 全文（1,550 行），绘制职责分区图：
  - 标注 TipTap 初始化区域（行号范围）
  - 标注 inline AI 处理区域（行号范围）
  - 标注 Entity Completion 区域（行号范围）
  - 标注 Slash Command 区域（行号范围）
  - 标注 autosave 区域（行号范围）
  - 标注快捷键注册区域（行号范围）
  - 标注布局渲染区域（行号范围）
- [ ] 识别各区域之间的数据依赖：哪些变量/状态跨区域共享
- [ ] 列出现有测试文件：`apps/desktop/renderer/src/features/editor/__tests__/` 下所有测试
- [ ] 运行现有测试基线：`pnpm -C apps/desktop vitest run editor`，记录通过/失败数量
- [ ] 确认 autosave 逻辑：评估是否保留在 EditorPane 还是提取——鉴于 autosave 通常与 editor 实例紧耦合，可能保留在 `useEditorSetup.ts` 中

---

## Phase 1: Red（测试先行）

### Task 1.1: 模块独立性测试

**映射验收标准**: AC-1, AC-9

- [ ] 测试：`EditorPane.tsx` 仅导入子模块组件/hook，不直接包含 TipTap 初始化代码
- [ ] 测试：`EditorPane` 渲染后包含 InlineAiOverlay、EntityCompletionPopover、SlashCommandMenu 子组件

**文件**: `apps/desktop/renderer/src/features/editor/__tests__/EditorDecomposition.test.tsx`（新建）

### Task 1.2: useEditorSetup hook 测试

**映射验收标准**: AC-2

- [ ] 测试：`useEditorSetup` 返回有效的 editor 实例
- [ ] 测试：editor 实例包含所有已注册扩展（数量与拆分前一致）
- [ ] 测试：editor 实例在组件卸载时正确销毁

**文件**: `apps/desktop/renderer/src/features/editor/__tests__/useEditorSetup.test.ts`（新建）

### Task 1.3: InlineAiOverlay 独立渲染测试

**映射验收标准**: AC-3

- [ ] 测试：InlineAiOverlay 接收 editor 实例 prop 后可独立渲染
- [ ] 测试：AI 输入激活/取消的 UI 状态切换正确

**文件**: `apps/desktop/renderer/src/features/editor/__tests__/InlineAiOverlay.test.tsx`（新建）

### Task 1.4: EntityCompletionPopover 独立渲染测试

**映射验收标准**: AC-4

- [ ] 测试：EntityCompletionPopover 接收 editor 实例后可独立渲染
- [ ] 测试：`@` 触发后弹出候选列表
- [ ] 测试：键盘导航（上/下/Enter/Esc）行为正确

**文件**: `apps/desktop/renderer/src/features/editor/__tests__/EntityCompletionPopover.test.tsx`（新建）

### Task 1.5: SlashCommandMenu 独立渲染测试

**映射验收标准**: AC-5

- [ ] 测试：SlashCommandMenu 接收 editor 实例后可独立渲染
- [ ] 测试：`/` 触发后弹出命令列表
- [ ] 测试：选中命令后执行并关闭菜单

**文件**: `apps/desktop/renderer/src/features/editor/__tests__/SlashCommandMenu.test.tsx`（新建）

### Task 1.6: useEditorKeybindings hook 测试

**映射验收标准**: AC-6

- [ ] 测试：`useEditorKeybindings` 接收 editor 实例和 action map 后注册快捷键
- [ ] 测试：注册的快捷键组合正确触发对应 action

**文件**: `apps/desktop/renderer/src/features/editor/__tests__/useEditorKeybindings.test.ts`（新建）

### Task 1.7: 行为等价回归测试

**映射验收标准**: AC-7, AC-8

- [ ] 运行 `pnpm -C apps/desktop vitest run editor` 全部现有测试，确认与 Phase 0 基线一致
- [ ] 确认 0 个新增失败

**注意**: 此 Task 在 Phase 2 完成后执行，但在 Phase 1 阶段明确定义为回归门禁。

---

## Phase 2: Green（最小实现）

### Task 2.1: 提取 `useEditorSetup.ts`

**映射验收标准**: AC-2

- [ ] 从 EditorPane.tsx 中提取 TipTap 初始化代码：
  - editor 实例创建（`useEditor()`  或等效）
  - 扩展注册列表
  - 初始内容设置
  - editor 生命周期管理（onDestroy / cleanup）
- [ ] autosave 集成评估：如 autosave 与 editor 实例紧耦合（使用 editor.on('update') 等），则包含在此 hook 中
- [ ] hook 返回值：`{ editor, isReady }` 或等效接口
- [ ] EditorPane 中替换为 `const { editor } = useEditorSetup(options)`

**文件**: `apps/desktop/renderer/src/features/editor/useEditorSetup.ts`（新建）

### Task 2.2: 提取 `InlineAiOverlay.tsx`

**映射验收标准**: AC-3

- [ ] 从 EditorPane.tsx 中提取 inline AI 相关代码：
  - AI 调用触发逻辑
  - AI proposal 展示 UI
  - accept/reject 交互
  - AI 输入 UI 状态管理
- [ ] 组件 props：`{ editor: Editor }`（+ store 中的 AI 相关 state）
- [ ] EditorPane 中替换为 `<InlineAiOverlay editor={editor} />`

**文件**: `apps/desktop/renderer/src/features/editor/InlineAiOverlay.tsx`（新建）

### Task 2.3: 提取 `EntityCompletionPopover.tsx`

**映射验收标准**: AC-4

- [ ] 从 EditorPane.tsx 中提取 entity completion 相关代码：
  - `@` mention 触发检测
  - 候选列表数据获取与渲染
  - 键盘导航逻辑（上/下选择、Enter 确认、Esc 取消）
  - 选中后插入 editor 的逻辑
- [ ] 组件 props：`{ editor: Editor }`
- [ ] EditorPane 中替换为 `<EntityCompletionPopover editor={editor} />`

**文件**: `apps/desktop/renderer/src/features/editor/EntityCompletionPopover.tsx`（新建）

### Task 2.4: 提取 `SlashCommandMenu.tsx`

**映射验收标准**: AC-5

- [ ] 从 EditorPane.tsx 中提取 slash command 相关代码：
  - `/` 命令触发检测
  - 命令列表注册与渲染
  - 命令执行逻辑
  - 菜单关闭逻辑
- [ ] 组件 props：`{ editor: Editor }`
- [ ] EditorPane 中替换为 `<SlashCommandMenu editor={editor} />`

**文件**: `apps/desktop/renderer/src/features/editor/SlashCommandMenu.tsx`（新建）

### Task 2.5: 提取 `useEditorKeybindings.ts`

**映射验收标准**: AC-6

- [ ] 从 EditorPane.tsx 中提取快捷键注册代码：
  - 全局快捷键绑定
  - 编辑器内快捷键绑定
  - 快捷键冲突处理（如有）
- [ ] hook 签名：`useEditorKeybindings(editor: Editor, actions: ActionMap)`
- [ ] EditorPane 中替换为 `useEditorKeybindings(editor, { ... })`

**文件**: `apps/desktop/renderer/src/features/editor/useEditorKeybindings.ts`（新建）

### Task 2.6: 精简 `EditorPane.tsx`

**映射验收标准**: AC-1

- [ ] 移除已提取到子模块的所有代码
- [ ] 保留布局 JSX 结构：toolbar 区域、编辑器正文区域、zen mode 切换
- [ ] 导入并组合子模块：`useEditorSetup`、`InlineAiOverlay`、`EntityCompletionPopover`、`SlashCommandMenu`、`useEditorKeybindings`
- [ ] 确保 editor 实例通过 props 传递给各子组件
- [ ] 目标行数 ≤ 300 行
- [ ] 清理不再需要的 import 语句

**文件**: `apps/desktop/renderer/src/features/editor/EditorPane.tsx`（重构）

---

## Phase 3: Verification & Delivery

- [ ] 运行 Phase 1 全部新测试，确认全绿
- [ ] 运行 `pnpm -C apps/desktop vitest run editor` 全部 editor 测试，确认与 Phase 0 基线 100% 一致
- [ ] 运行 `pnpm -C apps/desktop vitest run` 全量测试通过
- [ ] 运行 `pnpm typecheck` 类型检查通过
- [ ] 运行 `pnpm lint` lint 无新增违规
- [ ] 运行 `pnpm -C apps/desktop storybook:build` Storybook 可构建
- [ ] 确认文件行数：
  - `EditorPane.tsx` ≤ 300 行
  - `useEditorSetup.ts` ≤ 300 行
  - `InlineAiOverlay.tsx` ≤ 300 行
  - `EntityCompletionPopover.tsx` ≤ 300 行
  - `SlashCommandMenu.tsx` ≤ 300 行
  - `useEditorKeybindings.ts` ≤ 300 行
- [ ] 确认拆分后各文件之间无循环依赖（`madge --circular` 或等效检查）
- [ ] 创建 PR（含 `Closes #N`），附拆分前后文件结构对比
