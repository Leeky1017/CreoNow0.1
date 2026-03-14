# Delta Spec: search-and-retrieval — 基础全文搜索入口

- **Parent Change**: `a0-10-search-mvp`
- **Base Spec**: `openspec/specs/search-and-retrieval/spec.md`
- **GitHub Issue**: #1003

---

## 变更摘要

为已实现的 FTS 全文检索接通前端入口：注册 `Cmd/Ctrl+Shift+F` 快捷键打开 SearchPanel，实现搜索结果点击跳转到对应文档匹配位置。

---

## 变更的 Requirements

### Requirement: 全局搜索快捷键入口（新增）

系统**必须**注册 `Cmd/Ctrl+Shift+F` 作为全局搜索快捷键，按下后打开 SearchPanel 并聚焦搜索输入框。

#### 快捷键注册规则

- `shortcuts.ts` 的 `LAYOUT_SHORTCUTS` 中**必须**新增 `globalSearch` 条目，keys 为 `mod+Shift+F`
- `surfaceRegistry.ts` 中 `searchPanel` 的 `entryPoints` **必须**新增 `{ type: "shortcut", description: "Cmd/Ctrl+Shift+F" }`
- 快捷键处理**必须**在全局键盘事件监听器中注册，优先级低于编辑器内搜索（`Cmd/Ctrl+F`）
- 当用户处于文本输入状态（`<input>`、`<textarea>`、`contenteditable`）时，`Cmd/Ctrl+Shift+F` **必须**仍然触发全局搜索（因为这是全局级快捷键，不与文本输入冲突）

#### 面板切换行为

- 若 SearchPanel 当前未显示：左侧面板切换到 SearchPanel，搜索输入框自动获得焦点
- 若 SearchPanel 已显示：搜索输入框重新获得焦点（不关闭面板）
- 若左侧边栏已折叠：先展开左侧边栏，再切换到 SearchPanel

#### 无障碍要求

- 搜索输入框**必须**具有 `role="searchbox"` 和 `aria-label`，值为 i18n key `search.input.ariaLabel`
- 快捷键**必须**在命令面板中可见（`06-shortcuts.md` §快捷键冲突避免规则第 4 条：可发现性）
- SearchPanel 打开后，焦点**必须**移至搜索输入框，确保键盘用户可立即输入
- 搜索结果列表**必须**支持 Arrow Up/Down 键盘导航，Enter 键激活当前选中项
- 按 `Escape` 时：若搜索输入框有文本则清空；若输入框已空则关闭 SearchPanel 并将焦点归还编辑器

#### i18n 要求

以下 i18n key **必须**存在于 `zh-CN.json` 和 `en.json` 中：

| i18n Key                      | 用途                         |
| ----------------------------- | ---------------------------- |
| `search.input.placeholder`    | 搜索输入框 placeholder       |
| `search.input.ariaLabel`      | 搜索输入框无障碍标签         |
| `search.noResults.title`      | 无结果标题                   |
| `search.noResults.suggestion` | 无结果建议文案               |
| `search.resultCount`          | 搜索结果计数（支持复数插值） |
| `search.shortcut.label`       | 快捷键在命令面板中的显示名   |

#### Scenario: 用户通过快捷键打开全局搜索

- **GIVEN** 用户在编辑器中编辑文档，左侧面板显示的是文件列表
- **WHEN** 用户按下 `Cmd/Ctrl+Shift+F`
- **THEN** 左侧面板切换到 SearchPanel
- **AND** 搜索输入框自动获得焦点
- **AND** 用户可立即输入搜索关键词

#### Scenario: SearchPanel 已打开时再次按快捷键

- **GIVEN** 用户已通过快捷键打开了 SearchPanel，但焦点在编辑器中
- **WHEN** 用户再次按下 `Cmd/Ctrl+Shift+F`
- **THEN** SearchPanel 保持显示状态（不关闭）
- **AND** 搜索输入框重新获得焦点

#### Scenario: 左侧边栏已折叠时按快捷键

- **GIVEN** 用户已通过 `Cmd/Ctrl+\` 折叠了左侧边栏
- **WHEN** 用户按下 `Cmd/Ctrl+Shift+F`
- **THEN** 左侧边栏自动展开
- **AND** 左侧面板切换到 SearchPanel
- **AND** 搜索输入框自动获得焦点

#### Scenario: Escape 键退出搜索

- **GIVEN** SearchPanel 已打开，搜索输入框为空
- **WHEN** 用户按下 `Escape`
- **THEN** SearchPanel 关闭
- **AND** 焦点归还到之前活动的编辑器

---

### Requirement: 搜索结果点击跳转（新增）

系统**必须**支持用户点击搜索结果后跳转到对应文档的匹配位置。

#### 跳转行为

- 点击搜索结果项后，编辑器**必须**加载对应文档
- 加载完成后，编辑器**必须**滚动到第一个匹配位置
- 匹配关键词**必须**短暂高亮闪烁提示（持续 1.5 秒后渐隐），使用 `--color-accent` 作为高亮背景色，opacity 从 0.3 渐变到 0
- 若目标文档已在编辑器中打开，**不得**重新加载，仅滚动到匹配位置
- 若当前文档有未保存的编辑，跳转前**不得**丢弃已有编辑（依赖 autosave 机制）

#### 搜索结果项展示

搜索结果项**必须**展示以下信息（遵循主规范定义）：

- 文档标题
- 匹配片段（关键词高亮，使用 `--color-accent` 文字色与 `--color-accent-subtle` 背景色）
- 文档类型图标

#### Design Token 引用

| 用途               | Token                           |
| ------------------ | ------------------------------- |
| 关键词高亮文字色   | `--color-accent`                |
| 关键词高亮背景色   | `--color-accent-subtle`         |
| 搜索结果项悬停背景 | `--color-bg-hover`              |
| 搜索结果项选中背景 | `--color-bg-active`             |
| 搜索结果文档标题   | `--color-fg-default`            |
| 搜索结果匹配片段   | `--color-fg-muted`              |
| 搜索输入框边框聚焦 | `--color-border-focus`          |
| 闪烁高亮背景       | `--color-accent`（opacity 0.3） |

#### Scenario: 用户点击搜索结果跳转到文档

- **GIVEN** 用户在 SearchPanel 中搜索关键词「林远」，结果列表显示"第三章"中有匹配
- **WHEN** 用户点击"第三章"的搜索结果项
- **THEN** 编辑器加载「第三章」文档
- **AND** 编辑器滚动到第一个匹配位置
- **AND** 匹配关键词短暂高亮闪烁（1.5 秒后渐隐）

#### Scenario: 搜索结果跳转——目标文档已打开

- **GIVEN** 用户已在编辑器中打开「第三章」，且有未保存的编辑
- **WHEN** 用户点击指向「第三章」的搜索结果
- **THEN** 编辑器**不重新加载**文档，保留已有编辑
- **AND** 编辑器滚动到匹配位置
- **AND** 匹配关键词短暂高亮闪烁

#### Scenario: 搜索无结果

- **GIVEN** 用户在 SearchPanel 中输入了一个项目中不存在的关键词
- **WHEN** FTS 查询返回空结果
- **THEN** SearchPanel 显示无结果状态
- **AND** 标题显示 `t("search.noResults.title")` 的翻译值
- **AND** 建议文案显示 `t("search.noResults.suggestion")` 的翻译值

#### Scenario: 搜索结果键盘导航与激活

- **GIVEN** SearchPanel 搜索结果列表中有多个结果
- **WHEN** 用户按 Arrow Down 键
- **THEN** 焦点从搜索输入框移到结果列表第一项
- **AND** 继续按 Arrow Down 移动到下一项
- **WHEN** 用户在选中的结果项上按 Enter
- **THEN** 触发跳转行为（与点击效果一致）

---

### 约束

1. 本 delta 仅覆盖 FTS 全文检索入口，**不涉及**语义搜索模式
2. 搜索范围限定在当前项目内，**不支持**跨项目搜索
3. **不修改** FTS 后端逻辑（SQLite FTS5 索引、IPC 通道 `search:fts:query`）
4. **不实现**搜索替换（Find & Replace）功能
5. 快捷键显示文本**必须**使用 `shortcuts.ts` 的 `formatShortcutDisplay()` 统一格式化，不得硬编码平台特定符号
6. 所有用户可见文案**必须**通过 `t()` 函数获取，禁止裸字符串
