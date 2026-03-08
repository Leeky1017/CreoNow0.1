# Tasks: A0-01 禅模式改为真实可编辑

- **GitHub Issue**: #986
- **分支**: `task/986-zen-mode-editable`
- **Delta Spec**: `specs/editor/spec.md`

---

## 验收标准

| ID | 标准 | 对应 Scenario |
|----|------|--------------|
| AC-1 | 禅模式正文区域挂载 TipTap `EditorContent`，使用 `editorStore.editor` 实例，用户输入实时反映在编辑器文档中 | Scenario 1 |
| AC-2 | 退出禅模式后，正常编辑模式显示包含禅模式中所有编辑的完整内容，undo 历史连续 | Scenario 2 |
| AC-3 | 禅模式下 `BubbleMenu` 不出现、`EditorToolbar` 不可见、slash command 不触发 | Scenario 3 |
| AC-4 | 禅模式下键盘格式快捷键（`Cmd/Ctrl+B/I/U`、`Cmd/Ctrl+Z`）正常工作 | Scenario 3 |
| AC-5 | 禅模式下 autosave 正常触发，`ZenModeStatus` 保存状态正确显示 | Scenario 4 |
| AC-6 | 空文档进入禅模式时，标题显示 `t("zenMode.untitledDocument")`，编辑区显示 placeholder `t("zenMode.startWriting")` | Scenario 5 |
| AC-7 | 进入禅模式时焦点自动移入 EditorContent；覆盖层具有 `role="dialog"` + `aria-label` | Scenario 6 |
| AC-8 | 所有新增文案通过 `t()` 获取，`zh-CN.json` 和 `en.json` 包含全部新增 key | i18n 要求 |
| AC-9 | `BlinkingCursor` 组件和 `showCursor` prop 已删除 | 全局 |
| AC-10 | 禅模式视觉样式不变：`--color-zen-bg`、`--zen-content-max-width`、`--zen-body-size`、段落间距 | 全局 |

---

## Phase 1: Red（测试先行）

### Task 1.1: 禅模式真实编辑能力测试

**映射验收标准**: AC-1, AC-9

编写禅模式核心编辑能力的单元测试：

- [ ] 测试：禅模式 `open=true` 时，渲染 `EditorContent` 组件（不渲染静态 `<p>` 元素）
- [ ] 测试：渲染区域不包含 `data-testid="zen-cursor"`（BlinkingCursor 已移除）
- [ ] 测试：通过 mock editor 实例模拟用户输入，断言 `editor.getHTML()` 包含新内容
- [ ] 测试：禅模式 `open=false` 时不渲染任何内容（保持现有行为）

**文件**: `renderer/src/features/zen-mode/ZenMode.test.tsx`（重写）

### Task 1.2: 退出后编辑保留测试

**映射验收标准**: AC-2

- [ ] 测试：禅模式 `open` 从 `true` 变为 `false` 后，editor 实例中的内容不变（无内容丢失）
- [ ] 测试：退出禅模式后，editor 实例的 undo 历史包含禅模式中的操作（可 `Cmd+Z` 撤销）
- [ ] 测试：不存在第二个 editor 实例（`createEditor` 仅被调用一次）

**文件**: `renderer/src/features/zen-mode/__tests__/zen-mode-exit-restore.test.tsx`（修改）

### Task 1.3: 工具栏与 AI 功能隐藏测试

**映射验收标准**: AC-3, AC-4

- [ ] 测试：`layoutStore.zenMode === true` 时，BubbleMenu 的 `shouldShow` 返回 `false`
- [ ] 测试：`layoutStore.zenMode === true` 时，slash command extension 不响应 `/` 输入
- [ ] 测试：`layoutStore.zenMode === true` 时，`EditorToolbar` 不在 DOM 中
- [ ] 测试：禅模式下，`Cmd/Ctrl+B` 仍然切换选中文字的加粗状态（快捷键通过 TipTap 处理，不受 UI 隐藏影响）

**文件**: `renderer/src/features/zen-mode/__tests__/zen-mode-toolbar-hidden.test.tsx`（新建）

### Task 1.4: 禅模式 autosave 集成测试

**映射验收标准**: AC-5

- [ ] 测试：禅模式下编辑内容后，`useAutosave` 的 debounce 触发 save（mock IPC，断言 `file:document:save` 被调用）
- [ ] 测试：save 成功后，传入 `ZenModeStatus` 的 `saveStatus` 值更新为已保存状态对应文案

**文件**: `tests/integration/zen-mode-autosave.test.tsx`（新建）

### Task 1.5: 空文档禅模式测试

**映射验收标准**: AC-6

- [ ] 测试：editor 内容为空时进入禅模式，标题区域文本为 `t("zenMode.untitledDocument")`
- [ ] 测试：editor 内容为空时，编辑区域显示 placeholder `t("zenMode.startWriting")`
- [ ] 测试：输入第一个字符后 placeholder 不再显示

**文件**: `renderer/src/features/zen-mode/ZenMode.test.tsx`

### Task 1.6: 无障碍测试

**映射验收标准**: AC-7

- [ ] 测试：禅模式覆盖层具有 `role="dialog"` 和 `aria-label` 属性
- [ ] 测试：`aria-label` 值为 `t("zenMode.a11y.dialogLabel")`
- [ ] 测试：进入禅模式后，`document.activeElement` 在 EditorContent 容器内

**文件**: `renderer/src/features/zen-mode/ZenMode.test.tsx`

### Task 1.7: i18n key 完整性测试

**映射验收标准**: AC-8

- [ ] 测试：`zh-CN.json` 包含 `zenMode.untitledDocument`、`zenMode.startWriting`、`zenMode.a11y.dialogLabel`
- [ ] 测试：`en.json` 包含相同 key
- [ ] 测试：中英文 key 数量一致

**文件**: `tests/i18n/zen-mode-keys.test.ts`（新建）

---

## Phase 2: Green（实现）

### Task 2.1: ZenMode 组件重构——挂载 EditorContent

核心实现：将静态渲染替换为真实编辑。

- [ ] 修改 `ZenModeProps`：移除 `content: ZenModeContent`，新增 `editor: Editor`（TipTap 实例）和 `title: string`
- [ ] 删除 `BlinkingCursor` 组件、`ZenModeContent` 接口、`showCursor` 相关逻辑
- [ ] 在正文区域渲染 `<EditorContent editor={editor} />`，替换 `content.paragraphs.map()`
- [ ] 为 `EditorContent` 外层容器添加 CSS class `zen-editor`，通过该 class 设置禅模式专属样式
- [ ] 进入禅模式时（`open` 变为 `true`），调用 `editor.commands.focus('end')` 将焦点和光标移入编辑区

**文件**: `renderer/src/features/zen-mode/ZenMode.tsx`（重构）

### Task 2.2: 禅模式 EditorContent 样式

为禅模式下的编辑器添加专属样式规则：

- [ ] 创建 `.zen-editor .ProseMirror` 样式块（在 `ZenMode.tsx` 内联或独立 CSS 文件），设置 `font-family`、`font-size`、`line-height`、`color`、`caret-color` 等
- [ ] 设置段落间距 `p + p { margin-top: 2rem; }`（对应原 `space-y-8`）
- [ ] 设置选区颜色 `::selection { background: var(--color-accent); opacity: 0.3; }`
- [ ] 禅模式下 `.ProseMirror` 无边框、无 outline（保持沉浸感），focus 时不显示默认 focus ring
- [ ] 空编辑器 placeholder 样式：`.ProseMirror p.is-editor-empty:first-child::before` 设置 `content: attr(data-placeholder)`、`color: var(--color-fg-placeholder)`

**文件**: `renderer/src/features/zen-mode/ZenMode.tsx` 或 `renderer/src/features/zen-mode/zen-editor.css`（新建，如需要）

### Task 2.3: ZenModeOverlay 适配

修改 `AppShell.tsx` 中的 `ZenModeOverlay` 以适配新的 `ZenMode` props：

- [ ] 从 `editorStore` 获取 `editor` 实例
- [ ] 从 `editor.getJSON()` 或 `documentContentJson` 中提取标题（复用 `extractZenModeContent` 的标题提取逻辑）
- [ ] 字数统计和阅读时间保持现有逻辑
- [ ] 传递 `editor` 和 `title` 给 `ZenMode`，移除 `content` prop 的构造

**文件**: `renderer/src/components/layout/AppShell.tsx`（修改）

### Task 2.4: BubbleMenu 禅模式禁用

在 BubbleMenu 的 `shouldShow` 回调中增加禅模式判断：

- [ ] 导入 `useLayoutStore`，读取 `zenMode` 状态
- [ ] 当 `zenMode === true` 时，`shouldShow` 返回 `false`

**文件**: 包含 BubbleMenu 配置的编辑器文件（`renderer/src/features/editor/` 下相关文件）

### Task 2.5: Slash command 禅模式禁用

在 slash command extension 的触发条件中增加禅模式判断：

- [ ] 当 `layoutStore.zenMode === true` 时，不激活 slash command 菜单

**文件**: `renderer/src/features/editor/slashCommands.ts` 或相关文件（修改）

### Task 2.6: 禅模式覆盖层无障碍属性

- [ ] 为禅模式最外层 `<div>` 添加 `role="dialog"` 和 `aria-label={t("zenMode.a11y.dialogLabel")}`
- [ ] 确认 `EditorContent` 生成的 `div.ProseMirror` 具有 `role="textbox"` 和 `aria-multiline="true"`（TipTap 默认行为，仅需验证）

**文件**: `renderer/src/features/zen-mode/ZenMode.tsx`（修改）

### Task 2.7: 新增 i18n key

- [ ] 在 `zh-CN.json` 中新增 `zenMode.untitledDocument`（"无标题文档"）、`zenMode.startWriting`（"在此处开始创作…"）、`zenMode.a11y.dialogLabel`（"禅模式编辑器"）
- [ ] 在 `en.json` 中新增相同 key 的英文翻译
- [ ] 确认 key 命名符合现有 `zenMode.*` 命名空间

**文件**: `renderer/src/i18n/locales/zh-CN.json`、`renderer/src/i18n/locales/en.json`（修改）

---

## Phase 3: Refactor

### Task 3.1: 清理 extractZenModeContent

- [ ] `extractZenModeContent` 不再需要返回 `paragraphs: string[]`，简化为仅返回 `{ title, wordCount }`
- [ ] 更新所有调用方

**文件**: `renderer/src/components/layout/appShellLayoutHelpers.ts`（修改）

### Task 3.2: 更新 ZenMode Storybook Story

- [ ] 更新 `ZenMode.stories.tsx` 以适配新的 props（需提供 mock TipTap editor 实例）
- [ ] 新增 story：编辑状态的禅模式、空文档的禅模式
- [ ] 确认 `pnpm -C apps/desktop storybook:build` 可构建

**文件**: `renderer/src/features/zen-mode/ZenMode.stories.tsx`（更新）

### Task 3.3: 清理旧测试与旧类型

- [ ] 删除 `ZenModeContent` interface export（如仍有外部引用需一同清理）
- [ ] 删除 `BlinkingCursor` 相关的测试断言和 story
- [ ] 确认 CI 中 `vitest` 全量通过

**文件**: 多个文件（清理）

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
