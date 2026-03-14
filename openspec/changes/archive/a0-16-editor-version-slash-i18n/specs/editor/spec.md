# Delta Spec: editor — 编辑器/版本/Slash i18n 核查

- **Parent Change**: `a0-16-editor-version-slash-i18n`
- **Base Spec**: `openspec/specs/editor/spec.md`（主）、`openspec/specs/version-control/spec.md`（关联）
- **GitHub Issue**: #991

---

## 变更摘要

编辑器区域、版本历史面板、slash menu 中大量用户可见文案硬编码未走 `t()`/i18n，本变更定义需国际化的裸字符串清单、对应 i18n key 命名、中英文案，以及 slash command 的双语化方案。

---

## 变更的 Requirements

### Requirement: 编辑器区域裸字符串国际化（变更）

编辑器区域所有面向用户的文案**必须**通过 `t()` 函数从 i18n locale 文件获取，**禁止**在 JSX 或逻辑层中使用裸字符串字面量。

#### 编辑器 i18n 修正清单

| 文件                    | 行号 | 当前裸字符串                                                                | i18n key                              | zh-CN                                          | en                                                                      |
| ----------------------- | ---- | --------------------------------------------------------------------------- | ------------------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------- |
| `EditorPane.tsx`        | 400  | `"Entity suggestions unavailable."`                                         | `editor.entitySuggestionsUnavailable` | 实体建议不可用                                 | Entity suggestions unavailable.                                         |
| `EditorPane.tsx`        | 616  | `"This document is final. Editing will switch it back to draft. Continue?"` | `editor.confirmSwitchToDraft`         | 此文档已定稿。编辑将切换回草稿状态，是否继续？ | This document is final. Editing will switch it back to draft. Continue? |
| `EditorContextMenu.tsx` | 263  | `"AI"`                                                                      | `editor.contextMenu.ai`               | AI                                             | AI                                                                      |

#### Slash Command 双语化

`slashCommands.ts` 中的 slash command **必须**将 label 和 description 改为通过 i18n key 获取：

| Slash 命令 | label key                      | label zh-CN | label en  | description key                      | description zh-CN（沿用现有） | description en                                       |
| ---------- | ------------------------------ | ----------- | --------- | ------------------------------------ | ----------------------------- | ---------------------------------------------------- |
| `/续写`    | `editor.slash.continue.label`  | 续写        | Continue  | `editor.slash.continue.description`  | 继续当前段落的写作            | Continue writing the current paragraph               |
| `/描写`    | `editor.slash.describe.label`  | 描写        | Describe  | `editor.slash.describe.description`  | 对场景或角色进行详细描写      | Write a detailed description of a scene or character |
| `/对白`    | `editor.slash.dialogue.label`  | 对白        | Dialogue  | `editor.slash.dialogue.description`  | 生成角色对白                  | Generate character dialogue                          |
| `/角色`    | `editor.slash.character.label` | 角色        | Character | `editor.slash.character.description` | 创建或描述角色                | Create or describe a character                       |
| `/大纲`    | `editor.slash.outline.label`   | 大纲        | Outline   | `editor.slash.outline.description`   | 生成内容大纲                  | Generate a content outline                           |
| `/搜索`    | `editor.slash.search.label`    | 搜索        | Search    | `editor.slash.search.description`    | 搜索相关内容                  | Search for related content                           |

**约束**：slash command 的触发 key（`/续写` 的 `/` 前缀和中文名）不受 i18n 影响——触发 key 始终为中文；label 和 description 跟随 locale 切换。

### Requirement: 版本历史裸字符串国际化（变更）

版本历史面板中所有面向用户的文案**必须**通过 `t()` 函数获取。

#### 版本历史 i18n 修正清单

| 文件                          | 当前裸字符串              | i18n key                              | zh-CN           | en                    |
| ----------------------------- | ------------------------- | ------------------------------------- | --------------- | --------------------- |
| `VersionHistoryContainer.tsx` | `"You"`                   | `versionControl.author.you`           | 你              | You                   |
| `VersionHistoryContainer.tsx` | `"AI"`                    | `versionControl.author.ai`            | AI              | AI                    |
| `VersionHistoryContainer.tsx` | `"Auto"`                  | `versionControl.author.auto`          | 自动            | Auto                  |
| `VersionHistoryContainer.tsx` | `"Unknown"`               | `versionControl.author.unknown`       | 未知            | Unknown               |
| `VersionHistoryContainer.tsx` | `"Just now"`              | `versionControl.timeGroup.justNow`    | 刚刚            | Just now              |
| `VersionHistoryContainer.tsx` | `"Xm ago"`                | `versionControl.timeGroup.minutesAgo` | {{count}}分钟前 | {{count}}m ago        |
| `VersionHistoryContainer.tsx` | `"Today"`                 | `versionControl.timeGroup.today`      | 今天            | Today                 |
| `VersionHistoryContainer.tsx` | `"Yesterday"`             | `versionControl.timeGroup.yesterday`  | 昨天            | Yesterday             |
| `VersionHistoryContainer.tsx` | `"Earlier"`               | `versionControl.timeGroup.earlier`    | 更早            | Earlier               |
| `VersionHistoryContainer.tsx` | `"Loading versions..."`   | `versionControl.loadingVersions`      | 加载版本中…     | Loading versions...   |
| `VersionHistoryPanel.tsx`     | `"Restore"`               | `versionControl.action.restore`       | 恢复            | Restore               |
| `VersionHistoryPanel.tsx`     | `"Compare"`               | `versionControl.action.compare`       | 对比            | Compare               |
| `VersionHistoryPanel.tsx`     | `"Preview"`               | `versionControl.action.preview`       | 预览            | Preview               |
| `useVersionCompare.ts`        | `"No differences found."` | `versionControl.noDifferencesFound`   | 未发现差异      | No differences found. |
| `useVersionCompare.ts`        | `"Unknown error"`         | `versionControl.unknownError`         | 未知错误        | Unknown error         |

### 约束

- **禁止**在组件 JSX 中使用裸字符串字面量——所有用户可见文案通过 `t()` 获取
- **禁止**使用 Tailwind 原始色值——新增 UI 元素的样式通过语义化 Design Token
- 中英文 locale 文件**必须**同步：新增一个 zh-CN key 必须同时新增对应 en key
- i18n key 命名遵循现有模块命名空间（`editor.*`、`versionControl.*`）

---

## Scenarios

### Scenario 1: 编辑器 confirm 对话框跟随 locale 切换

- **GIVEN** 用户界面语言为中文，打开了一个已定稿文档
- **WHEN** 用户尝试编辑该文档，触发 confirm 对话框
- **THEN** 对话框文案显示 `"此文档已定稿。编辑将切换回草稿状态，是否继续？"`
- **AND** 切换界面语言为英文后，对话框文案显示 `"This document is final. Editing will switch it back to draft. Continue?"`

### Scenario 2: Slash command label 和 description 跟随 locale 切换

- **GIVEN** 用户界面语言为英文
- **WHEN** 用户在编辑器中输入 `/` 触发 slash 菜单
- **THEN** `/续写` 对应条目的 label 显示 `"Continue"`，description 显示 `"Continue writing the current paragraph"`
- **AND** 切换界面语言为中文后，label 显示 `"续写"`，description 显示 `"继续当前段落的写作"`

### Scenario 3: 版本历史面板作者名和时间分组跟随 locale 切换

- **GIVEN** 用户界面语言为中文，版本历史中存在 AI 生成的版本
- **WHEN** 用户打开版本历史面板
- **THEN** AI 生成版本的作者显示为 `"AI"`，用户版本显示为 `"你"`
- **AND** 时间分组标题显示为 `"刚刚"` / `"今天"` / `"昨天"` / `"更早"`
- **AND** 切换界面语言为英文后，作者显示为 `"AI"` / `"You"`，时间分组显示为 `"Just now"` / `"Today"` / `"Yesterday"` / `"Earlier"`

### Scenario 4: 版本历史操作按钮 tooltip 跟随 locale 切换

- **GIVEN** 用户界面语言为中文
- **WHEN** 用户在版本历史面板中 hover 某个版本条目的操作按钮
- **THEN** tooltip 分别显示 `"恢复"` / `"对比"` / `"预览"`
- **AND** 切换界面语言为英文后 tooltip 显示 `"Restore"` / `"Compare"` / `"Preview"`
