# Delta Spec: editor — Inline AI 从 0 到 1 新建

- **Parent Change**: `a0-12-inline-ai-baseline`
- **Base Spec**: `openspec/specs/editor/spec.md`
- **GitHub Issue**: #1004

---

## 变更摘要

新增 Inline AI 交互流程：注册 `Cmd/Ctrl+K` 快捷键 → 有选区时弹出浮动输入组件 `InlineAiInput` → 复用 `skill:execute` IPC 调用 Skill 管线 → 通过 `InlineAiDiffPreview` 就地展示流式 diff → 用户 Accept/Reject/Regenerate。整个路径 ≤ 4 步，在编辑器语境内完成 AI 协作，不跳转到 AI 面板。

---

## 新增 Requirement: Inline AI 快捷交互

编辑器**必须**提供 Inline AI 快捷交互入口，允许用户在不离开编辑现场的情况下触发 AI 技能、预览修改结果并决定是否应用。

### 快捷键注册

- `shortcuts.ts` 的 `EDITOR_SHORTCUTS` 中**必须**新增 `inlineAi` 条目，keys 为 `mod+K`
- 快捷键显示文本**必须**使用 `formatShortcutDisplay()` 统一格式化（macOS 显示 `⌘K`，Windows/Linux 显示 `Ctrl+K`）
- `Cmd/Ctrl+K` **必须**仅在编辑器具有焦点且存在非空文本选区时触发。以下情况**不得**触发：
  - 无选区（光标 collapsed）
  - 选区内容为纯空白字符
  - 禅模式激活（`layoutStore.zenMode === true`）
  - 编辑器处于只读模式
  - 已有 Inline AI 会话正在进行（输入框或 diff 预览可见时）

### InlineAiInput 浮动输入组件

触发 `Cmd/Ctrl+K` 后，系统**必须**在选区下方渲染 `InlineAiInput` 浮动输入组件。

#### 定位规则

- 默认定位于选区末尾下方 `--space-2`（8px）处
- 当选区接近编辑器底部（下方空间不足组件高度 + 8px）时，**必须**自动翻转到选区上方
- 组件水平居中于选区中点，但**不得**超出编辑器可视区域左右边界（至少保留 `--space-4` 内边距）

#### 视觉规格

| 属性           | Token / 值                                      | 备注                        |
| -------------- | ----------------------------------------------- | --------------------------- |
| 容器背景       | `--color-bg-raised`                             | 浮起层级                    |
| 容器边框       | `--color-border-default`                        | 1px solid                   |
| 容器圆角       | `--radius-md`（8px）                            |                             |
| 容器阴影       | `--shadow-lg`                                   | 浮动层标准阴影              |
| 容器 z-index   | `var(--z-popover)`                              | 高于编辑器内容，低于 modal  |
| 容器最小宽度   | 320px                                           | 确保输入体验                |
| 容器最大宽度   | 480px                                           | 不过度占据编辑区            |
| 输入框字号     | `--text-body-size`（13px）                      | UI 正文规格                 |
| 输入框字体     | `--font-family-ui`                              | UI 字体，非编辑器 body 字体 |
| 输入框文字色   | `--color-fg-default`                            |                             |
| placeholder 色 | `--color-fg-placeholder`                        |                             |
| 输入框内边距   | `--space-3`（12px）水平，`--space-2`（8px）垂直 |                             |
| 快捷键提示文字 | `--color-fg-muted`                              | 右侧小字显示 `Enter ↵`      |
| 快捷键提示字号 | `--text-caption-size`（12px）                   |                             |

#### 交互行为

- 输入框**必须**在渲染后自动获取焦点（`autoFocus`）
- 用户按 `Enter` 提交指令，触发 Skill 执行。提交后 `InlineAiInput` 消失，进入 diff 预览阶段
- 用户按 `Escape` 关闭输入框，不执行任何操作，编辑器焦点恢复到选区
- 输入框为空时按 `Enter` 不提交（防止误触发）
- 点击输入框外部区域（编辑器内或外）关闭输入框（与 Escape 行为一致）
- 输入框底部**可选**展示 Skill 快捷按钮（如"润色"、"改写"、"翻译"），点击等同于输入对应指令并提交。按钮文案通过 `t()` 获取

#### 出现/消失动效

- 出现：从 `opacity: 0, translateY(4px)` 过渡到 `opacity: 1, translateY(0)`，持续 `--duration-normal`（200ms），缓动 `--ease-out`
- 消失：从 `opacity: 1` 过渡到 `opacity: 0`，持续 `--duration-fast`（100ms），缓动 `--ease-in`

### Skill 执行复用

Inline AI **必须**复用 Skill 执行管线，**不得**创建独立的 LLM 调用通道。

- 用户提交指令后，前端通过 `skill:execute` IPC 通道发送执行请求，payload 包含：
  - `input`：选中文本
  - `instruction`：用户输入的自然语言指令
  - `source`：`"inline"`（标识来自 inline 入口，区别于 `"panel"` 面板入口）
  - `selectionRef`：选区位置引用（用于冲突检测）
- 主进程 `SkillExecutor` 根据指令自动匹配最合适的内置技能（或直接使用自由指令模式），组装上下文并调用 LLM
- 流式结果通过 `skill:stream:chunk` 推送到前端
- 完成信号通过 `skill:stream:done` 推送，包含完整 `SkillResult`

### InlineAiDiffPreview 就地 diff 预览组件

Skill 执行开始后，系统**必须**在选区位置渲染 `InlineAiDiffPreview` 组件，展示 AI 修改结果与原文的就地 diff。

#### 定位规则

- `InlineAiDiffPreview` **必须**定位于原选区文本的位置，覆盖（overlay）原始内容
- 组件宽度与编辑器内容区域宽度一致（不是选区宽度）
- 组件高度自适应内容

#### 视觉规格

| 属性            | Token / 值                                        | 备注                 |
| --------------- | ------------------------------------------------- | -------------------- |
| 容器背景        | `--color-bg-surface`                              | 面板层级             |
| 容器边框        | `--color-border-default`                          | 1px solid            |
| 容器圆角        | `--radius-md`（8px）                              |                      |
| 容器上/下内边距 | `--space-3`（12px）                               |                      |
| 容器左/右内边距 | `--space-4`（16px）                               |                      |
| 删除文本背景    | `--color-diff-removed-bg`                         | 已有 diff token      |
| 删除文本颜色    | `--color-diff-removed-text`                       |                      |
| 删除文本装饰    | `line-through`，`--color-diff-removed-decoration` |                      |
| 新增文本背景    | `--color-diff-added-bg`                           | 已有 diff token      |
| 新增文本颜色    | `--color-diff-added-text`                         |                      |
| 正文字号        | `--text-editor-size`（16px）                      | 与编辑器正文一致     |
| 正文字体        | `--font-family-body`                              | 与编辑器正文一致     |
| 正文行高        | `--text-editor-line-height`（1.8）                | 与编辑器正文一致     |
| 操作栏背景      | `--color-bg-raised`                               | 底部操作按钮区域     |
| 操作栏边框顶部  | `--color-separator`                               | 与内容区分隔         |
| 加载指示器颜色  | `--color-info`                                    | 流式生成中的 spinner |

#### 流式渲染

- Skill 执行开始时，组件进入 `streaming` 状态，显示加载指示器（spinner + `t("inlineAi.loading")`）
- 每收到一个 `skill:stream:chunk`，实时更新 diff 展示
- 收到 `skill:stream:done` 后，组件进入 `ready` 状态，加载指示器消失，操作按钮完全可用

#### 操作按钮

操作栏位于 diff 预览下方，包含以下按钮：

| 按钮       | 文案（i18n key）           | 快捷键                      | 行为                                       |
| ---------- | -------------------------- | --------------------------- | ------------------------------------------ |
| Accept     | `t("inlineAi.accept")`     | `Enter` 或 `Cmd/Ctrl+Enter` | 将 AI 修改应用到编辑器文档，关闭 diff 预览 |
| Reject     | `t("inlineAi.reject")`     | `Escape`                    | 恢复原文，关闭 diff 预览                   |
| Regenerate | `t("inlineAi.regenerate")` | `Cmd/Ctrl+Shift+Enter`      | 保持选区和指令，重新执行 Skill             |

- Accept 按钮使用 `--color-btn-success-bg` 背景、`--color-fg-inverse` 文字色
- Reject 按钮使用默认轮廓样式（`--color-border-default` 边框）
- Regenerate 按钮使用默认轮廓样式
- 按钮圆角 `--radius-sm`（4px），间距 `--space-2`（8px）
- `streaming` 状态时 Accept 和 Regenerate 按钮**必须**禁用（`disabled`），仅 Reject/Escape 可用

#### Accept 行为

- 接受修改时，系统**必须**使用 `selectionRef` 进行冲突检测（选区内容自触发 inline AI 后是否被修改）
- 若无冲突，将 AI 输出替换选区内容，操作记入 TipTap undo 历史（用户可 `Cmd/Ctrl+Z` 撤销）
- 若检测到冲突（选区内容已被 autosave 或其他操作修改），**必须**中止应用并通过 Toast 通知用户 `t("inlineAi.conflictError")`
- Accept 后 autosave 正常触发

#### Reject 行为

- 原文不做任何修改
- diff 预览组件移除
- 编辑器焦点恢复到原选区位置

#### Regenerate 行为

- 取消当前 Skill 执行（如仍在 streaming 则通过 `skill:cancel` 取消）
- 以相同的选区和指令重新触发 `skill:execute`
- diff 预览组件回到 `streaming` 状态

### editorStore 状态扩展

`editorStore` **必须**新增以下状态字段管理 Inline AI 会话：

| 字段                   | 类型                                          | 默认值   | 说明                       |
| ---------------------- | --------------------------------------------- | -------- | -------------------------- |
| `inlineAiState`        | `"idle" \| "input" \| "streaming" \| "ready"` | `"idle"` | Inline AI 当前阶段         |
| `inlineAiInstruction`  | `string \| null`                              | `null`   | 用户输入的指令             |
| `inlineAiSelectionRef` | `SelectionRef \| null`                        | `null`   | 触发时的选区引用           |
| `inlineAiResult`       | `string \| null`                              | `null`   | Skill 执行结果（流式累积） |
| `inlineAiExecutionId`  | `string \| null`                              | `null`   | 当前执行的 executionId     |

状态机转换：

```
idle → (Cmd+K with selection) → input
input → (Enter submit) → streaming
input → (Escape) → idle
streaming → (stream:done) → ready
streaming → (Escape reject) → idle
streaming → (stream error) → idle (+ Toast error)
ready → (Accept) → idle (+ apply changes)
ready → (Reject / Escape) → idle
ready → (Regenerate) → streaming
```

### Design Token 引用

| 用途                   | Token                                                             |
| ---------------------- | ----------------------------------------------------------------- |
| 输入框/操作栏容器背景  | `--color-bg-raised`                                               |
| diff 预览容器背景      | `--color-bg-surface`                                              |
| 容器边框               | `--color-border-default`                                          |
| 容器圆角               | `--radius-md`                                                     |
| 容器阴影               | `--shadow-lg`                                                     |
| 容器 z-index           | `--z-popover`                                                     |
| 删除文本背景           | `--color-diff-removed-bg`                                         |
| 删除文本颜色           | `--color-diff-removed-text`                                       |
| 删除文本装饰           | `--color-diff-removed-decoration`                                 |
| 新增文本背景           | `--color-diff-added-bg`                                           |
| 新增文本颜色           | `--color-diff-added-text`                                         |
| 操作栏分隔线           | `--color-separator`                                               |
| 加载指示器             | `--color-info`                                                    |
| Accept 按钮背景        | `--color-btn-success-bg`                                          |
| Accept 按钮文字        | `--color-fg-inverse`                                              |
| Reject/Regenerate 边框 | `--color-border-default`                                          |
| 按钮圆角               | `--radius-sm`                                                     |
| 按钮间距               | `--space-2`                                                       |
| 输入框字号             | `--text-body-size`                                                |
| 输入框字体             | `--font-family-ui`                                                |
| placeholder 色         | `--color-fg-placeholder`                                          |
| 快捷键提示色           | `--color-fg-muted`                                                |
| diff 正文字号          | `--text-editor-size`                                              |
| diff 正文字体          | `--font-family-body`                                              |
| diff 正文行高          | `--text-editor-line-height`                                       |
| 出现动效时长           | `--duration-normal`                                               |
| 消失动效时长           | `--duration-fast`                                                 |
| 出现缓动               | `--ease-out`                                                      |
| 消失缓动               | `--ease-in`                                                       |
| 禁用按钮悬浮           | `cursor-not-allowed`, `opacity: 0.4`                              |
| focus ring             | `--color-ring-focus`, `--ring-focus-width`, `--ring-focus-offset` |

### 无障碍要求

- `InlineAiInput` 输入框**必须**具有 `role="textbox"` 和 `aria-label`（`t("inlineAi.a11y.inputLabel")`，"AI 指令输入"）
- `InlineAiInput` 容器**必须**具有 `role="dialog"` 和 `aria-label`（`t("inlineAi.a11y.dialogLabel")`，"Inline AI"）
- `InlineAiDiffPreview` 容器**必须**具有 `role="region"` 和 `aria-label`（`t("inlineAi.a11y.diffPreviewLabel")`，"AI 修改预览"）
- `InlineAiDiffPreview` 操作按钮**必须**具有 `aria-label`：
  - Accept：`t("inlineAi.a11y.acceptButton")`
  - Reject：`t("inlineAi.a11y.rejectButton")`
  - Regenerate：`t("inlineAi.a11y.regenerateButton")`
- 流式生成中，diff 预览区域**必须**设置 `aria-live="polite"` 和 `aria-busy="true"`
- 生成完成后，`aria-busy` 切换为 `false`
- 所有操作按钮**必须**在 `:focus-visible` 时显示 focus ring（`--color-ring-focus`）
- `Tab` 键在 diff 预览操作按钮间移动焦点，顺序为 Accept → Reject → Regenerate
- 快捷键提示文案**必须**对屏幕阅读器可见（不使用 `aria-hidden`）

### i18n 要求

所有新增文案**必须**通过 `t()` 函数获取。新增 i18n key：

| i18n Key                         | 中文值                                      | 英文值                                                    |
| -------------------------------- | ------------------------------------------- | --------------------------------------------------------- |
| `inlineAi.placeholder`           | 输入 AI 指令…（如"润色"、"改写成正式语气"） | Enter AI instruction… (e.g. "polish", "rewrite formally") |
| `inlineAi.accept`                | 接受                                        | Accept                                                    |
| `inlineAi.reject`                | 拒绝                                        | Reject                                                    |
| `inlineAi.regenerate`            | 重新生成                                    | Regenerate                                                |
| `inlineAi.loading`               | AI 正在生成…                                | AI is generating…                                         |
| `inlineAi.conflictError`         | 文本已被修改，无法应用 AI 结果              | Text has been modified, cannot apply AI result            |
| `inlineAi.executionError`        | AI 执行失败，请重试                         | AI execution failed, please retry                         |
| `inlineAi.shortcut.polish`       | 润色                                        | Polish                                                    |
| `inlineAi.shortcut.rewrite`      | 改写                                        | Rewrite                                                   |
| `inlineAi.shortcut.translate`    | 翻译                                        | Translate                                                 |
| `inlineAi.a11y.inputLabel`       | AI 指令输入                                 | AI instruction input                                      |
| `inlineAi.a11y.dialogLabel`      | Inline AI                                   | Inline AI                                                 |
| `inlineAi.a11y.diffPreviewLabel` | AI 修改预览                                 | AI modification preview                                   |
| `inlineAi.a11y.acceptButton`     | 接受 AI 修改                                | Accept AI modification                                    |
| `inlineAi.a11y.rejectButton`     | 拒绝 AI 修改                                | Reject AI modification                                    |
| `inlineAi.a11y.regenerateButton` | 重新生成 AI 修改                            | Regenerate AI modification                                |

---

## Scenarios

### Scenario 1: 选中文本触发 Inline AI 输入

- **GIVEN** 编辑器处于正常编辑模式，用户选中了一段非空文本
- **WHEN** 用户按下 `Cmd/Ctrl+K`
- **THEN** `InlineAiInput` 浮动输入组件渲染在选区下方 8px 处
- **AND** 输入框自动获取焦点，显示 placeholder `t("inlineAi.placeholder")`
- **AND** `editorStore.inlineAiState` 变为 `"input"`
- **AND** `editorStore.inlineAiSelectionRef` 存储当前选区的位置引用和 `selectionTextHash`
- **AND** 输入框容器具有 `role="dialog"` 和 `aria-label`

### Scenario 2: 无选中文本时 Cmd+K 不触发

- **GIVEN** 编辑器处于正常编辑模式，光标在文档中但无文本选区（collapsed cursor）
- **WHEN** 用户按下 `Cmd/Ctrl+K`
- **THEN** 不渲染 `InlineAiInput`，不触发任何操作
- **AND** `editorStore.inlineAiState` 保持 `"idle"`
- **AND** 光标位置不变

### Scenario 3: 禅模式下 Cmd+K 不触发

- **GIVEN** 禅模式已激活（`layoutStore.zenMode === true`），用户在禅模式编辑器中选中了文本
- **WHEN** 用户按下 `Cmd/Ctrl+K`
- **THEN** 不渲染 `InlineAiInput`，不触发任何操作
- **AND** 禅模式的纯写作体验不被打断

### Scenario 4: 提交指令触发 Skill 执行并展示流式 diff

- **GIVEN** `InlineAiInput` 已打开，用户输入了指令"润色这段话"
- **WHEN** 用户按下 `Enter`
- **THEN** `InlineAiInput` 消失
- **AND** 系统通过 `skill:execute` IPC 发送请求，payload 包含选中文本、用户指令和 `source: "inline"`
- **AND** `InlineAiDiffPreview` 在选区位置渲染，显示加载指示器和 `t("inlineAi.loading")`
- **AND** `editorStore.inlineAiState` 变为 `"streaming"`
- **AND** 随着 `skill:stream:chunk` 到达，diff 预览实时更新（删除内容 `--color-diff-removed-bg` + `line-through`，新增内容 `--color-diff-added-bg`）
- **AND** 收到 `skill:stream:done` 后，加载指示器消失，Accept/Reject/Regenerate 按钮完全可用
- **AND** `editorStore.inlineAiState` 变为 `"ready"`
- **AND** diff 预览区域具有 `role="region"` 和 `aria-label`

### Scenario 5: 用户接受 AI 修改

- **GIVEN** `InlineAiDiffPreview` 处于 `ready` 状态，展示 AI 润色后的 diff
- **WHEN** 用户点击 Accept 按钮（或按 `Cmd/Ctrl+Enter`）
- **THEN** AI 修改内容替换编辑器中对应选区的原文
- **AND** 替换操作记入 TipTap undo 历史（用户可 `Cmd/Ctrl+Z` 撤销）
- **AND** `InlineAiDiffPreview` 移除
- **AND** `editorStore.inlineAiState` 回到 `"idle"`
- **AND** autosave 正常触发

### Scenario 6: 用户拒绝 AI 修改

- **GIVEN** `InlineAiDiffPreview` 处于 `ready` 状态（或 `streaming` 状态）
- **WHEN** 用户按下 `Escape` 或点击 Reject 按钮
- **THEN** 原文不做任何修改
- **AND** `InlineAiDiffPreview` 移除
- **AND** 如处于 `streaming` 状态，系统通过 `skill:cancel` 取消正在进行的 Skill 执行
- **AND** `editorStore.inlineAiState` 回到 `"idle"`
- **AND** 编辑器焦点恢复到原选区位置

### Scenario 7: 用户重新生成

- **GIVEN** `InlineAiDiffPreview` 处于 `ready` 状态
- **WHEN** 用户点击 Regenerate 按钮（或按 `Cmd/Ctrl+Shift+Enter`）
- **THEN** 系统以相同的选区和指令重新触发 `skill:execute`
- **AND** `InlineAiDiffPreview` 回到 `streaming` 状态，显示加载指示器
- **AND** 新的流式结果替换旧的 diff 展示

### Scenario 8: Skill 执行失败的错误处理

- **GIVEN** 用户已提交 Inline AI 指令，Skill 正在执行
- **WHEN** `skill:stream:done` 返回错误状态（如 LLM API 超时或速率限制）
- **THEN** `InlineAiDiffPreview` 移除
- **AND** 原文不做任何修改
- **AND** 系统通过 Toast 展示错误信息 `t("inlineAi.executionError")`
- **AND** `editorStore.inlineAiState` 回到 `"idle"`

---

## 变更的 Requirement: 编辑器键盘快捷键

Base Spec 中的 Requirement "编辑器键盘快捷键" 做以下变更：

### 新增快捷键

| Action    | macOS | Windows/Linux | 条件                         |
| --------- | ----- | ------------- | ---------------------------- |
| Inline AI | `⌘K`  | `Ctrl+K`      | 需要有非空文本选区，非禅模式 |

### 新增 Scenario

#### Scenario: Inline AI 快捷键在快捷键帮助中正确显示

- **GIVEN** 用户查看快捷键帮助
- **WHEN** 快捷键列表渲染
- **THEN** 包含 "Inline AI" 条目，macOS 显示 `⌘K`，Windows/Linux 显示 `Ctrl+K`

---

## 保持不变的行为

以下行为保持 Base Spec 定义，不做修改：

- AI 面板触发的 Skill 执行流程不变——Inline AI 是新增入口，不修改面板入口
- `DiffViewPanel` 全面板级 diff 展示不变——Inline AI 使用独立的 `InlineAiDiffPreview`
- `AiInlineConfirm` 组件行为不变——该组件服务于面板级 AI 建议确认，与 Inline AI 的 `InlineAiDiffPreview` 是两个独立组件
- `BubbleMenu` 行为不变——Inline AI 输入框与 BubbleMenu 互斥（有 Inline AI 会话时 BubbleMenu 不显示，因为选区已被 Inline AI 锁定）
- 编辑器其他快捷键不变

---

## Storybook 要求

以下组件**必须**有 Storybook Story：

1. **InlineAiInput**
   - Default：显示空输入框 + placeholder
   - WithQuickActions：显示底部快捷按钮
   - FlippedPosition：选区接近底部时上翻定位

2. **InlineAiDiffPreview**
   - Streaming：流式生成中（spinner + 部分 diff）
   - Ready：生成完成，展示完整 diff + 操作按钮
   - LongContent：长文本 diff 滚动展示
