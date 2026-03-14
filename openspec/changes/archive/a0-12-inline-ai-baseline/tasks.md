# Tasks: A0-12 Inline AI 从 0 到 1 新建

- **GitHub Issue**: #1004
- **分支**: `task/1004-inline-ai-baseline`
- **Delta Spec**: `specs/editor/spec.md`

---

## 验收标准

| ID    | 标准                                                                                                                                                           | 对应 Scenario |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| AC-1  | `shortcuts.ts` 的 `EDITOR_SHORTCUTS` 包含 `inlineAi` 条目（`mod+K`）                                                                                           | 快捷键注册    |
| AC-2  | 编辑器有非空文本选区时按 `Cmd/Ctrl+K`，`InlineAiInput` 在选区下方渲染，自动获取焦点                                                                            | Scenario 1    |
| AC-3  | 无选区时按 `Cmd/Ctrl+K` 不触发任何操作                                                                                                                         | Scenario 2    |
| AC-4  | 禅模式下按 `Cmd/Ctrl+K` 不触发任何操作                                                                                                                         | Scenario 3    |
| AC-5  | 用户在 `InlineAiInput` 输入指令按 Enter 后，通过 `skill:execute` IPC 发送请求（含选中文本、指令、`source: "inline"`），`InlineAiDiffPreview` 实时展示流式 diff | Scenario 4    |
| AC-6  | 用户 Accept 后 AI 修改替换原文，操作记入 TipTap undo 历史                                                                                                      | Scenario 5    |
| AC-7  | 用户 Reject/Escape 后原文不变，diff 预览移除，编辑器焦点恢复                                                                                                   | Scenario 6    |
| AC-8  | 用户 Regenerate 后以相同选区和指令重新执行 Skill                                                                                                               | Scenario 7    |
| AC-9  | Skill 执行失败时：diff 预览移除、原文不变、Toast 展示错误信息                                                                                                  | Scenario 8    |
| AC-10 | `InlineAiInput` 具有 `role="dialog"` + `aria-label`；`InlineAiDiffPreview` 具有 `role="region"` + `aria-label`；所有按钮有 `aria-label`                        | 无障碍        |
| AC-11 | 所有新增文案通过 `t()` 获取，`zh-CN.json` 和 `en.json` 包含全部新增 key                                                                                        | i18n          |
| AC-12 | `InlineAiInput` 和 `InlineAiDiffPreview` 各有 Storybook Story，`storybook:build` 可构建                                                                        | 视觉验收      |
| AC-13 | 流式生成中 Accept/Regenerate 按钮禁用，Reject/Escape 可用                                                                                                      | Scenario 4, 6 |
| AC-14 | Accept 时进行 `selectionRef` 冲突检测，冲突时中止并 Toast 通知                                                                                                 | Scenario 5    |
| AC-15 | Inline AI 状态机 `idle → input → streaming → ready → idle` 正确转换，无死锁                                                                                    | 全局          |

---

## Phase 1: Red（测试先行）

### Task 1.1: 快捷键注册测试

**映射验收标准**: AC-1

- [x] 测试：`EDITOR_SHORTCUTS.inlineAi` 存在且 `keys === "mod+K"`
- [x] 测试：`getAllShortcuts()` 返回数组中包含 `id === "inlineAi"` 的条目
- [x] 测试：macOS 下 `EDITOR_SHORTCUTS.inlineAi.display()` 返回 `"⌘K"`
- [x] 测试：非 macOS 下 `EDITOR_SHORTCUTS.inlineAi.display()` 返回 `"Ctrl+K"`

**文件**: `renderer/src/config/__tests__/shortcuts.test.ts`（新建或追加）

### Task 1.2: InlineAiInput 触发与守卫测试

**映射验收标准**: AC-2, AC-3, AC-4, AC-15

编写 `InlineAiInput` 触发条件的单元测试：

- [x] 测试：有非空文本选区 + 按 `Cmd/Ctrl+K` → `editorStore.inlineAiState` 变为 `"input"`，`InlineAiInput` 渲染
- [x] 测试：无选区（collapsed cursor）+ 按 `Cmd/Ctrl+K` → `editorStore.inlineAiState` 保持 `"idle"`，不渲染 `InlineAiInput`
- [x] 测试：选区为纯空白字符 + 按 `Cmd/Ctrl+K` → 不触发
- [x] 测试：`layoutStore.zenMode === true` + 有选区 + 按 `Cmd/Ctrl+K` → 不触发
- [x] 测试：`inlineAiState !== "idle"` 时（已有会话进行中）+ 按 `Cmd/Ctrl+K` → 不触发

**文件**: `renderer/src/features/editor/__tests__/inline-ai-trigger.test.tsx`（新建）

### Task 1.3: InlineAiInput 组件交互测试

**映射验收标准**: AC-2, AC-10

- [x] 测试：组件渲染后输入框自动获取焦点（`autoFocus`）
- [x] 测试：输入框显示 placeholder `t("inlineAi.placeholder")`
- [x] 测试：输入指令后按 `Enter` → 调用提交回调，组件消失
- [x] 测试：输入框为空时按 `Enter` → 不调用提交回调
- [x] 测试：按 `Escape` → 调用取消回调，组件消失
- [x] 测试：组件容器具有 `role="dialog"` 和正确的 `aria-label`
- [x] 测试：输入框具有 `aria-label`（`t("inlineAi.a11y.inputLabel")`）

**文件**: `renderer/src/features/editor/__tests__/InlineAiInput.test.tsx`（新建）

### Task 1.4: InlineAiDiffPreview 流式与操作测试

**映射验收标准**: AC-5, AC-6, AC-7, AC-8, AC-9, AC-13, AC-14

- [x] 测试：`streaming` 状态时显示加载指示器 + `t("inlineAi.generating")`
- [x] 测试：`streaming` 状态时 Accept 和 Regenerate 按钮 `disabled`，Reject 按钮可用
- [x] 测试：`ready` 状态时所有操作按钮可用
- [x] 测试：点击 Accept → 调用 `onAccept` 回调
- [x] 测试：点击 Reject → 调用 `onReject` 回调
- [x] 测试：点击 Regenerate → 调用 `onRegenerate` 回调
- [x] 测试：按 `Escape` → 调用 `onReject` 回调
- [x] 测试：组件具有 `role="region"` 和正确的 `aria-label`
- [x] 测试：`streaming` 状态时 `aria-busy="true"`，`ready` 状态时 `aria-busy="false"`
- [x] 测试：各操作按钮具有正确的 `aria-label`

**文件**: `renderer/src/features/editor/__tests__/InlineAiDiffPreview.test.tsx`（新建）

### Task 1.5: Inline AI 状态机集成测试

**映射验收标准**: AC-15

- [x] 测试：`idle` → 触发 `Cmd+K` → `input`
- [x] 测试：`input` → 提交指令 → `streaming`
- [x] 测试：`input` → Escape → `idle`
- [x] 测试：`streaming` → `skill:stream:done` 成功 → `ready`
- [x] 测试：`streaming` → `skill:stream:done` 错误 → `idle`
- [x] 测试：`streaming` → Escape → `idle`（+ `skill:cancel`）
- [x] 测试：`ready` → Accept → `idle`
- [x] 测试：`ready` → Reject → `idle`
- [x] 测试：`ready` → Regenerate → `streaming`

**文件**: `renderer/src/features/editor/__tests__/inline-ai-state-machine.test.tsx`（新建）

### Task 1.6: Skill 执行集成测试

**映射验收标准**: AC-5, AC-9

- [x] 测试：提交指令后 `skill:execute` IPC 被调用，payload 包含 `input`（选中文本）、`instruction`（用户指令）、`source: "inline"`
- [x] 测试：收到 `skill:stream:chunk` 后 `editorStore.inlineAiResult` 流式累积
- [x] 测试：收到 `skill:stream:done`（成功）后 `editorStore.inlineAiState` 变为 `"ready"`
- [x] 测试：收到 `skill:stream:done`（失败）后状态回到 `"idle"`，Toast 展示 `t("inlineAi.executionError")`

**文件**: `renderer/src/features/editor/__tests__/inline-ai-skill-integration.test.tsx`（新建）

### Task 1.7: Accept 冲突检测测试

**映射验收标准**: AC-14

- [x] 测试：Accept 时 `selectionRef.selectionTextHash` 与当前选区内容 hash 一致 → 正常替换
- [x] 测试：Accept 时 hash 不一致（选区内容已被修改）→ 中止替换，Toast 展示 `t("inlineAi.conflictError")`
- [x] 测试：Accept 后替换操作记入 TipTap undo 历史（调用 `editor.chain().deleteRange().insertContentAt()` 并在 undo 栈中留下记录）

**文件**: `renderer/src/features/editor/__tests__/inline-ai-accept-conflict.test.tsx`（新建）

### Task 1.8: i18n key 完整性测试

**映射验收标准**: AC-11

- [x] 测试：`zh-CN.json` 包含所有 `inlineAi.*` key（共 17 个）
- [x] 测试：`en.json` 包含相同 key
- [x] 测试：中英文 key 数量一致

**文件**: `tests/i18n/inline-ai-keys.test.ts`（新建）

---

## Phase 2: Green（实现）

### Task 2.1: 在 shortcuts.ts 新增 inlineAi 快捷键

- [x] 在 `EDITOR_SHORTCUTS` 中新增 `inlineAi: defineShortcut("inlineAi", "Inline AI", "mod+K")`
- [x] 确认 `getAllShortcuts()` 和 `getShortcutDisplay()` 自动包含新条目

**文件**: `apps/desktop/renderer/src/config/shortcuts.ts`（修改）

### Task 2.2: InlineAiInput 组件实现

新建 `InlineAiInput` 浮动输入组件：

- [x] 创建组件文件，接收 props：`position: { top, left, width }`, `onSubmit: (instruction: string) => void`, `onCancel: () => void`
- [x] 渲染 `<input>` 元素，`autoFocus`，placeholder 通过 `t("inlineAi.placeholder")` 获取
- [x] `Enter` 提交（输入非空时）、`Escape` 取消
- [x] 容器样式：`--color-bg-raised` 背景、`--color-border-default` 边框、`--radius-md` 圆角、`--shadow-lg` 阴影、`z-index: var(--z-popover)`
- [x] 入场动画：`opacity` + `translateY` 过渡
- [x] 添加 `role="dialog"` + `aria-label`，输入框 `aria-label`
- [x] 可选：底部快捷按钮（润色/改写/翻译），点击等同提交对应指令
- [x] 点击外部关闭（`useClickOutside` 或等效方案）

**文件**: `renderer/src/features/editor/InlineAiInput.tsx`（新建）

### Task 2.3: InlineAiDiffPreview 组件实现

新建 `InlineAiDiffPreview` 就地 diff 预览组件：

- [x] 创建组件文件，接收 props：`state: "streaming" | "ready"`, `originalText: string`, `modifiedText: string`, `onAccept`, `onReject`, `onRegenerate`
- [x] Diff 计算：使用 word-level diff 算法对比原文与修改文本，渲染删除/新增标记
- [x] 删除内容：`--color-diff-removed-bg` 背景 + `--color-diff-removed-text` 颜色 + `line-through`
- [x] 新增内容：`--color-diff-added-bg` 背景 + `--color-diff-added-text` 颜色
- [x] `streaming` 状态时显示 spinner + `t("inlineAi.generating")`，Accept/Regenerate 按钮禁用
- [x] `ready` 状态时所有按钮可用
- [x] 操作栏：Accept（成功色）/ Reject / Regenerate，带 `aria-label`
- [x] `role="region"` + `aria-label`，`aria-live="polite"` + `aria-busy`
- [x] 容器样式遵循 delta spec 视觉规格

**文件**: `renderer/src/features/editor/InlineAiDiffPreview.tsx`（新建）

### Task 2.4: editorStore Inline AI 状态管理

扩展 `editorStore`，新增 Inline AI 状态字段和操作方法：

- [x] 新增状态字段：`inlineAiState`, `inlineAiInstruction`, `inlineAiSelectionRef`, `inlineAiResult`, `inlineAiExecutionId`
- [x] 新增 action：`openInlineAi(selectionRef)`, `submitInlineAi(instruction)`, `appendInlineAiChunk(chunk)`, `completeInlineAi(result)`, `failInlineAi(error)`, `acceptInlineAi()`, `rejectInlineAi()`, `regenerateInlineAi()`, `cancelInlineAi()`
- [x] 状态机转换逻辑严格按照 delta spec 定义

**文件**: `renderer/src/stores/editorStore.tsx`（修改）

### Task 2.5: EditorPane 集成 Inline AI 触发

在 `EditorPane.tsx` 中集成 Inline AI 触发逻辑：

- [x] 注册 `Cmd/Ctrl+K` 热键（通过 `useHotkey` 或 TipTap keyboard shortcut extension）
- [x] 热键处理函数：检查选区非空、非禅模式、当前无 Inline AI 会话 → 调用 `editorStore.openInlineAi()`
- [x] 条件渲染 `InlineAiInput`（`inlineAiState === "input"` 时）
- [x] 条件渲染 `InlineAiDiffPreview`（`inlineAiState === "streaming" || "ready"` 时）
- [x] 计算浮动组件定位（基于 TipTap editor 的选区坐标 `editor.view.coordsAtPos()`）

**文件**: `renderer/src/features/editor/EditorPane.tsx`（修改）

### Task 2.6: Skill 执行集成

实现 `InlineAiInput` 提交后的 Skill 执行流程：

- [x] 提交时调用 `editorStore.submitInlineAi(instruction)`
- [x] store action 内部调用 `skill:execute` IPC，payload: `{ input, instruction, source: "inline", selectionRef }`
- [x] 注册 `skill:stream:chunk` listener，每个 chunk 调用 `editorStore.appendInlineAiChunk(chunk)`
- [x] 注册 `skill:stream:done` listener，成功时 `editorStore.completeInlineAi(result)`，失败时 `editorStore.failInlineAi(error)` + Toast
- [x] Reject/Escape 时调用 `skill:cancel` IPC

**文件**: `renderer/src/features/editor/useInlineAiExecution.ts`（新建）

### Task 2.7: Accept 冲突检测与应用

实现 Accept 时的冲突检测和文本替换：

- [x] `editorStore.acceptInlineAi()` 内部：
  1. 通过 `selectionRef` 获取当前选区位置的内容
  2. 对比 `selectionTextHash` 与当前内容 hash
  3. 一致 → 执行替换（`editor.chain().focus().deleteRange(range).insertContentAt(range.from, resultContent).run()`）
  4. 不一致 → 中止替换，Toast `t("inlineAi.conflictError")`
- [x] 替换操作在 TipTap 事务中执行，确保记入 undo 历史

**文件**: `renderer/src/features/editor/inlineAiApply.ts`（新建）

### Task 2.8: 新增 i18n key

- [x] 在 `zh-CN.json` 中新增 delta spec 定义的全部 `inlineAi.*` key
- [x] 在 `en.json` 中新增相同 key 的英文翻译
- [x] 确认 key 命名符合现有命名空间规范

**文件**: `renderer/src/i18n/locales/zh-CN.json`, `renderer/src/i18n/locales/en.json`（修改）

---

## Phase 3: Refactor

### Task 3.1: 浮动定位逻辑抽取

- [x] 如果 `InlineAiInput` 和 `InlineAiDiffPreview` 的定位逻辑有重复，抽取为 `useFloatingPosition` hook
- [x] 该 hook 接受 TipTap editor 选区坐标，返回 `{ top, left, flip }` 定位信息

**文件**: `renderer/src/features/editor/useFloatingPosition.ts`（新建，如有必要）

### Task 3.2: InlineAiInput Storybook Story

- [x] Default：空输入框 + placeholder
- [x] WithQuickActions：底部快捷按钮（润色/改写/翻译）
- [x] FlippedPosition：从上方渲染（模拟选区在底部时的翻转）
- [x] 确认 `pnpm -C apps/desktop storybook:build` 可构建

**文件**: `renderer/src/features/editor/InlineAiInput.stories.tsx`（新建）

### Task 3.3: InlineAiDiffPreview Storybook Story

- [x] Streaming：spinner + 部分 diff 内容
- [x] Ready：完整 diff + 操作按钮
- [x] LongContent：长文本 diff 滚动展示
- [x] 确认 `pnpm -C apps/desktop storybook:build` 可构建

**文件**: `renderer/src/features/editor/InlineAiDiffPreview.stories.tsx`（新建）

### Task 3.4: 清理与类型安全

- [x] 确认 `editorStore` 新增字段的 TypeScript 类型严格——`inlineAiState` 使用联合类型而非 `string`
- [x] 确认 `skill:execute` IPC payload 的 `source` 字段在 Zod schema 中新增 `"inline"` 选项
- [x] 确认 CI 中 `vitest` 全量通过、TypeScript strict 编译通过

**文件**: 多个文件（类型检查与清理）

---

## 验收核查表

| AC    | 对应测试文件                                              | 核心断言                                     | 状态 |
| ----- | --------------------------------------------------------- | -------------------------------------------- | ---- |
| AC-1  | `shortcuts.test.ts`                                       | `EDITOR_SHORTCUTS.inlineAi.keys === "mod+K"` | [ ]  |
| AC-2  | `inline-ai-trigger.test.tsx`                              | 有选区 + Cmd+K → InlineAiInput 渲染          | [ ]  |
| AC-3  | `inline-ai-trigger.test.tsx`                              | 无选区 + Cmd+K → 不触发                      | [ ]  |
| AC-4  | `inline-ai-trigger.test.tsx`                              | 禅模式 + Cmd+K → 不触发                      | [ ]  |
| AC-5  | `inline-ai-skill-integration.test.tsx`                    | `skill:execute` 被调用，流式 chunk 累积      | [ ]  |
| AC-6  | `inline-ai-accept-conflict.test.tsx`                      | Accept → 文本替换 + undo 历史                | [ ]  |
| AC-7  | `InlineAiDiffPreview.test.tsx`                            | Reject → 原文不变 + 组件移除                 | [ ]  |
| AC-8  | `inline-ai-state-machine.test.tsx`                        | Regenerate → `streaming` 状态 + 重新执行     | [ ]  |
| AC-9  | `inline-ai-skill-integration.test.tsx`                    | 错误 → Toast + 状态 idle                     | [ ]  |
| AC-10 | `InlineAiInput.test.tsx` + `InlineAiDiffPreview.test.tsx` | `role` + `aria-label` 断言                   | [ ]  |
| AC-11 | `inline-ai-keys.test.ts`                                  | 全部 17 个 key 存在于 zh-CN / en             | [ ]  |
| AC-12 | Storybook build                                           | `pnpm -C apps/desktop storybook:build` 成功  | [ ]  |
| AC-13 | `InlineAiDiffPreview.test.tsx`                            | streaming 时 Accept/Regenerate disabled      | [ ]  |
| AC-14 | `inline-ai-accept-conflict.test.tsx`                      | hash 不一致 → 中止 + Toast                   | [ ]  |
| AC-15 | `inline-ai-state-machine.test.tsx`                        | 全状态转换覆盖                               | [ ]  |

---

## TDD 规范引用

> 本 Change 的所有测试必须遵循 `docs/references/testing/` 中的规范。开始写测试前，先阅读以下文档。

**必读文档**：

- 测试哲学与反模式：`docs/references/testing/01-philosophy-and-anti-patterns.md`
- 测试类型决策树：`docs/references/testing/02-test-type-decision-guide.md`
- 前端测试模式：`docs/references/testing/03-frontend-testing-patterns.md`
- 命令与 CI 映射：`docs/references/testing/07-test-command-and-ci-map.md`

**本地验证命令**：

```bash
pnpm -C apps/desktop vitest run <test-file-pattern>   # 单元/集成测试
pnpm typecheck                                         # 类型检查
pnpm lint                                              # ESLint
pnpm -C apps/desktop storybook:build                   # Storybook 视觉验收
```

**五大反模式（Red Line）**：

1. ❌ 字符串匹配源码检测实现 → 用行为断言
2. ❌ 只验证存在性（`toBeTruthy`）→ 验证具体值（`toEqual`）
3. ❌ 过度 mock 导致测的是 mock 本身 → 只 mock 边界依赖
4. ❌ 仅测 happy path → 必须覆盖 edge + error 路径
5. ❌ 无意义测试名称 → 名称必须说明前置条件和预期行为
