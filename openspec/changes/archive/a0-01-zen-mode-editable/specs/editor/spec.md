# Delta Spec: editor — 禅模式改为真实可编辑

- **Parent Change**: `a0-01-zen-mode-editable`
- **Base Spec**: `openspec/specs/editor/spec.md`
- **GitHub Issue**: #986

---

## 变更摘要

禅模式（Zen Mode）从只读静态展示改为真实可编辑。移除 `BlinkingCursor` 假光标和 `content.paragraphs` 静态渲染，改为挂载 TipTap `EditorContent` 并复用 `editorStore.editor` 实例。用户在禅模式中的输入实时写入 editor 实例，autosave 照常工作，退出后所有编辑已保留。

---

## 变更的 Requirement: 禅模式（Zen Mode）

Base Spec 中的 Requirement "禅模式（Zen Mode)" 做以下变更：

### 删除的行为

- ~~"A blinking cursor SHALL be displayed at the end of the last paragraph when `showCursor` is enabled"~~ → 删除 `BlinkingCursor` 装饰组件和 `showCursor` prop
- ~~`ZenModeContent.paragraphs: string[]` 静态渲染~~ → 不再通过 `content.paragraphs.map()` 渲染 `<p>` 元素

### 新增的行为

禅模式正文区域**必须**挂载 TipTap `EditorContent` 组件，复用 `editorStore` 中的同一 `Editor` 实例。用户在禅模式中的输入**必须**实时反映在 editor 实例的文档中，autosave **必须**照常工作。

#### 编辑器实例复用

- 禅模式**必须**使用 `editorStore.editor`（同一个 TipTap `Editor` 实例），**不得**创建独立的 editor 实例
- 原因：创建第二个实例会导致状态分裂——undo 历史不共享、autosave 不知写哪份、退出时需要合并两份内容，复杂度不可接受
- `ZenModeOverlay` 从 `editorStore` 获取 `editor` 实例，通过 props 传入 `ZenMode` 组件

#### EditorContent 挂载

- `ZenMode` 组件中，正文区域渲染 `<EditorContent editor={editor} />`，替换原有的 `content.paragraphs.map()` 静态段落
- `EditorContent` 外层容器保持禅模式的视觉样式（居中、最大宽度、内边距、字号）

#### 标题展示

- 标题区域保持现有静态渲染方式（从 `editorStore.documentContentJson` 或 `editor.getJSON()` 中提取第一个 heading 的文本）
- 标题**不可编辑**——禅模式只编辑正文
- 如果文档无标题，显示 placeholder `t("zenMode.untitledDocument")`

#### 隐藏辅助编辑 UI

禅模式下**必须**隐藏以下编辑辅助 UI（纯键盘写作体验）：

| UI 元素            | 隐藏方式                                                                                 |
| ------------------ | ---------------------------------------------------------------------------------------- |
| `EditorToolbar`    | 不渲染（已在 `AppShell` 中通过禅模式条件隐藏）                                           |
| `BubbleMenu`       | 通过 TipTap BubbleMenu 的 `shouldShow` 返回 `false`（当 `layoutStore.zenMode === true`） |
| Slash command 菜单 | 通过 slash command extension 的条件判断禁用（当 `layoutStore.zenMode === true`）         |
| 右键上下文菜单     | 不拦截——使用浏览器默认右键菜单即可                                                       |

#### 键盘格式快捷键

禅模式下基础格式快捷键**继续可用**（因为 TipTap editor 实例仍然激活）：

- `Cmd/Ctrl+B`（加粗）、`Cmd/Ctrl+I`（斜体）、`Cmd/Ctrl+U`（下划线）
- `Cmd/Ctrl+Z`（撤销）、`Cmd/Ctrl+Shift+Z`（重做）
- **不**显示工具栏或任何视觉提示——用户依靠肌肉记忆操作

#### Autosave 不受影响

- 因为复用同一 `editor` 实例，TipTap 的 `update` 事件照常触发，`useAutosave` 的 debounce 链路正常工作
- 禅模式底部 `ZenModeStatus` 展示 `saveStatus`（来自 `autosaveStatus` 映射），行为不变

### 保持不变的行为

以下行为保持 Base Spec 定义，不做修改：

- 进入/退出：F11 进入、Escape / F11 退出
- 视觉：`--color-zen-bg` 背景、`--color-zen-glow` 辐射光晕
- 布局：`--zen-content-max-width`（720px）居中、`--zen-content-padding-x`（80px）/ `--zen-content-padding-y`（120px）
- 退出提示：顶部 `t("zenMode.pressEscOrF11ToExit")` 始终可见、hover 时显示退出按钮
- 底部状态栏：hover 触发 `ZenModeStatus` 显示字数、保存状态、阅读时间、当前时间
- z-index：`var(--z-modal)`
- 侧栏/右栏/工具栏/主状态栏全部隐藏

### ZenMode 组件 Props 变更

| 旧 Prop                        | 变更     | 新 Prop                            |
| ------------------------------ | -------- | ---------------------------------- |
| `content: ZenModeContent`      | **修改** | `editor: Editor` + `title: string` |
| `content.paragraphs: string[]` | **删除** | ——（由 `EditorContent` 替代）      |
| `content.showCursor: boolean`  | **删除** | ——（使用 TipTap 真实光标）         |
| `content.title: string`        | **移出** | `title: string`（独立 prop）       |
| `stats: ZenModeStats`          | 保持     | 保持                               |
| `currentTime?: string`         | 保持     | 保持                               |
| `open: boolean`                | 保持     | 保持                               |
| `onExit: () => void`           | 保持     | 保持                               |

### 禅模式 EditorContent 样式规格

禅模式下的 `EditorContent` 活动编辑区域须应用以下样式（通过 CSS class `zen-editor` 限定作用域）：

| 属性           | Token / 值                                  | 备注                     |
| -------------- | ------------------------------------------- | ------------------------ |
| 字体           | `--font-family-body`                        | 与 Base Spec 一致        |
| 字号           | `--zen-body-size`（18px）                   | 禅模式专属               |
| 行高           | `--zen-body-line-height`（1.8）             | 禅模式专属               |
| 文字色         | `--color-zen-text`（rgba(255,255,255,0.9)） | 深色背景上的浅色文字     |
| 光标色         | `--color-info`                              | 与原 BlinkingCursor 一致 |
| 选中文字背景   | `--color-accent`（opacity 0.3）             | 深色背景下可辨识的选区   |
| 段落间距       | `2rem`（与原 `space-y-8` 对应）             | 段落间保持呼吸感         |
| placeholder    | `t("zenMode.startWriting")`                 | 空文档时提示             |
| placeholder 色 | `--color-fg-placeholder`                    | 与禅模式视觉一致         |

### Design Token 引用

| 用途                  | Token                      |
| --------------------- | -------------------------- |
| 禅模式背景            | `--color-zen-bg`           |
| 辐射光晕              | `--color-zen-glow`         |
| 正文文字色            | `--color-zen-text`         |
| 正文字体              | `--font-family-body`       |
| 正文字号              | `--zen-body-size`          |
| 正文行高              | `--zen-body-line-height`   |
| 内容最大宽度          | `--zen-content-max-width`  |
| 水平内边距            | `--zen-content-padding-x`  |
| 垂直内边距            | `--zen-content-padding-y`  |
| 标题字号              | `--zen-title-size`         |
| 光标色                | `--color-info`             |
| 选区色                | `--color-accent`           |
| hover 背景            | `--color-zen-hover`        |
| 状态栏背景            | `--color-zen-statusbar-bg` |
| 退出提示文字色        | `--color-fg-placeholder`   |
| 退出提示字号          | `--zen-label-size`         |
| 退出按钮 hover 文字色 | `--color-fg-default`       |
| placeholder 色        | `--color-fg-placeholder`   |

### 无障碍要求

- `EditorContent` 的外层容器**必须**具有 `role="textbox"` 和 `aria-multiline="true"`（TipTap 默认行为）
- 禅模式覆盖层**必须**具有 `role="dialog"` 和 `aria-label`（`t("zenMode.a11y.dialogLabel")`，"禅模式编辑器"）
- 进入禅模式时，焦点**必须**自动移入 EditorContent 编辑区域
- 退出按钮**必须**保持现有 `aria-label`（`t("zenMode.exitAriaLabel")`）
- `ZenModeStatus` 的字数和保存状态**必须**保持 `aria-live="polite"`

### i18n 要求

所有新增文案**必须**通过 `t()` 函数获取。新增 i18n key：

| i18n Key                   | 中文值          | 英文值              |
| -------------------------- | --------------- | ------------------- |
| `zenMode.untitledDocument` | 无标题文档      | Untitled Document   |
| `zenMode.startWriting`     | 在此处开始创作… | Start writing here… |
| `zenMode.a11y.dialogLabel` | 禅模式编辑器    | Zen Mode Editor     |

已有 i18n key（保持不变）：

| i18n Key                      | 用途                |
| ----------------------------- | ------------------- |
| `zenMode.pressEscToExit`      | hover 区退出提示    |
| `zenMode.pressEscOrF11ToExit` | 持久退出提示        |
| `zenMode.exitAriaLabel`       | 退出按钮 aria-label |

---

## Scenarios

### Scenario 1: 用户在禅模式中输入文字

- **GIVEN** 用户已打开一篇包含正文的文档，编辑器处于正常模式
- **WHEN** 用户按下 F11 进入禅模式
- **THEN** 禅模式覆盖层以 `z-index: var(--z-modal)` 渲染
- **AND** 正文区域挂载 TipTap `EditorContent`，显示文档现有内容
- **AND** 焦点自动移入编辑区域，光标闪烁于文档末尾
- **AND** 用户输入 "风起于青萍之末" 后，文字实时出现在编辑区中
- **AND** `editorStore.editor.getHTML()` 包含新输入的文字

### Scenario 2: 禅模式中的编辑在退出后保留

- **GIVEN** 用户在禅模式中已输入新文字 "浪成于微澜之间"
- **WHEN** 用户按下 Escape 退出禅模式
- **THEN** 禅模式覆盖层关闭
- **AND** 正常编辑模式的编辑器显示包含 "浪成于微澜之间" 的完整文档内容
- **AND** 用户可以继续编辑该内容（undo 历史连续，可撤销禅模式中的输入）

### Scenario 3: 禅模式隐藏工具栏与 AI 功能

- **GIVEN** 禅模式已激活，编辑区域可输入
- **WHEN** 用户选中一段文字
- **THEN** BubbleMenu（浮动工具栏）**不出现**
- **AND** `EditorToolbar` 不可见
- **AND** 用户输入 `/` 不触发 slash command 菜单
- **AND** 用户仍可通过 `Cmd/Ctrl+B` 给选中文字加粗（快捷键有效）

### Scenario 4: 禅模式下 autosave 正常工作

- **GIVEN** 禅模式已激活，autosave 已启用
- **WHEN** 用户在禅模式中输入文字后停顿 500ms
- **THEN** autosave 被触发（TipTap `update` 事件 → `useAutosave` debounce → IPC save）
- **AND** `ZenModeStatus` 底部悬浮栏的保存状态从 `t("workbench.appShell.savingStatus")` 变为 `t("workbench.appShell.savedStatus")`

### Scenario 5: 禅模式中打开空文档

- **GIVEN** 当前文档为空（无标题无正文）
- **WHEN** 用户按下 F11 进入禅模式
- **THEN** 标题区域显示 `t("zenMode.untitledDocument")`
- **AND** 编辑区域显示 placeholder `t("zenMode.startWriting")`
- **AND** 焦点位于编辑区域，用户可直接开始输入
- **AND** 输入第一个字符后 placeholder 消失

### Scenario 6: 禅模式焦点管理与无障碍

- **GIVEN** 用户使用屏幕阅读器
- **WHEN** 用户按下 F11 进入禅模式
- **THEN** 禅模式覆盖层具有 `role="dialog"` 和 `aria-label`（`t("zenMode.a11y.dialogLabel")`）
- **AND** 焦点自动移入 `EditorContent`（`role="textbox"`，`aria-multiline="true"`）
- **AND** 屏幕阅读器播报进入了禅模式编辑器
- **AND** 按 Tab 可到达退出按钮，按 Enter 可退出

---

## 受影响的文件（预期）

| 文件                                                      | 变更类型 | 说明                                                                                |
| --------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------- |
| `renderer/src/features/zen-mode/ZenMode.tsx`              | **重构** | 替换静态渲染为 EditorContent；修改 props 接口；删除 BlinkingCursor                  |
| `renderer/src/components/layout/AppShell.tsx`             | **修改** | `ZenModeOverlay` 传递 `editor` 实例和 `title`，不再构造 `ZenModeContent`            |
| `renderer/src/components/layout/appShellLayoutHelpers.ts` | **修改** | `extractZenModeContent` 简化为仅提取标题和字数（不再需要 paragraphs）               |
| `renderer/src/features/zen-mode/ZenMode.test.tsx`         | **重写** | 测试真实编辑行为代替静态渲染断言                                                    |
| `renderer/src/features/zen-mode/ZenMode.stories.tsx`      | **更新** | Story 需提供 mock editor 实例                                                       |
| `renderer/src/i18n/locales/zh-CN.json`                    | **修改** | 新增 `zenMode.untitledDocument`、`zenMode.startWriting`、`zenMode.a11y.dialogLabel` |
| `renderer/src/i18n/locales/en.json`                       | **修改** | 同上英文对应                                                                        |
| BubbleMenu 相关文件                                       | **修改** | `shouldShow` 中增加 `zenMode` 条件判断                                              |
| Slash command 相关文件                                    | **修改** | 禅模式下禁用 slash command                                                          |
