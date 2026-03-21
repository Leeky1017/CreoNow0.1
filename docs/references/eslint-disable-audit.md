# eslint-disable 审计清单

> 审计版本：v1-13（R7 P5b）
> 审计范围：`apps/desktop/renderer/src/features/` 全量文件（生产 + 测试）
> 审计前总数：27 处（生产 25 + 测试 2）
> 审计后总数：27 处（生产 25 + 测试 2），全部 KEEP，0 REMOVE，0 TRACK

## 总览

| 规则                                    | 审计前 | REMOVE | KEEP   | TRACK | 审计后 |
| --------------------------------------- | ------ | ------ | ------ | ----- | ------ |
| `creonow/no-hardcoded-dimension`        | 10     | 0      | 10     | 0     | 10     |
| `creonow/no-raw-error-code-in-ui`       | 5      | 0      | 5      | 0     | 5      |
| `i18next/no-literal-string`             | 4      | 0      | 4      | 0     | 4      |
| `creonow/no-native-html-element`        | 2      | 0      | 2      | 0     | 2      |
| `react-hooks/refs`                      | 2      | 0      | 2      | 0     | 2      |
| `max-lines-per-function`                | 2      | 0      | 2      | 0     | 2      |
| **生产文件小计**                        | **25** | **0**  | **25** | **0** | **25** |
| `@typescript-eslint/no-require-imports` | 2      | 0      | 2      | 0     | 2      |
| **测试文件小计**                        | **2**  | **0**  | **2**  | **0** | **2**  |
| **合计**                                | **27** | **0**  | **27** | **0** | **27** |

## 逐条审计记录

### #001

- **文件**: `features/character/character-detail-shared.tsx`
- **行号**: L38
- **规则**: `creonow/no-hardcoded-dimension`
- **判定**: KEEP
- **理由**: dialog content width `w-[560px]` 由 design spec 指定，无对应 design token

### #002

- **文件**: `features/settings-dialog/SettingsAppearancePage.tsx`
- **行号**: L130
- **规则**: `creonow/no-hardcoded-dimension`
- **判定**: KEEP
- **理由**: settings content width `max-w-[560px]` 由 design spec 指定，四个 settings 页面统一使用

### #003

- **文件**: `features/settings-dialog/SettingsAccount.tsx`
- **行号**: L115
- **规则**: `creonow/no-hardcoded-dimension`
- **判定**: KEEP
- **理由**: 同 #002，settings content width `max-w-[560px]` 由 design spec 指定

### #004

- **文件**: `features/settings-dialog/SettingsGeneral.tsx`
- **行号**: L88
- **规则**: `creonow/no-hardcoded-dimension`
- **判定**: KEEP
- **理由**: 同 #002，settings content width `max-w-[560px]` 由 design spec 指定

### #005

- **文件**: `features/settings-dialog/SettingsExport.tsx`
- **行号**: L124
- **规则**: `creonow/no-hardcoded-dimension`
- **判定**: KEEP
- **理由**: 同 #002，settings content width `max-w-[560px]` 由 design spec 指定

### #006

- **文件**: `features/search/SearchResultItems.tsx`
- **行号**: L131
- **规则**: `i18next/no-literal-string`
- **判定**: KEEP
- **理由**: `•` 是装饰性分隔符 glyph，不是用户可见的可翻译文本

### #007

- **文件**: `features/search/SearchPanel.tsx`
- **行号**: L196
- **规则**: `creonow/no-hardcoded-dimension`
- **判定**: KEEP
- **理由**: search modal width `w-[640px]` 由 design spec 指定

### #008

- **文件**: `features/files/useFileTreeCore.ts`
- **行号**: L14
- **规则**: `max-lines-per-function`
- **判定**: KEEP
- **理由**: 核心状态 hook 聚合 store 消费、React 状态与副作用，已从 useFileTreeState 拆分，进一步拆分会破坏内聚性

### #009

- **文件**: `features/files/FileTreeNodeRow.tsx`
- **行号**: L175
- **规则**: `i18next/no-literal-string`
- **判定**: KEEP
- **理由**: `▸` 是装饰性 chevron glyph，不是用户可见的可翻译文本

### #010

- **文件**: `features/files/useFileTreeState.ts`
- **行号**: L15
- **规则**: `max-lines-per-function`
- **判定**: KEEP
- **理由**: 聚合 useFileTreeCore 与 CRUD handlers，已拆分核心逻辑至 useFileTreeCore，进一步拆分会破坏 API 内聚性

### #011

- **文件**: `features/ai/AiPanel.tsx`
- **行号**: L127
- **规则**: `react-hooks/refs`
- **判定**: KEEP
- **理由**: ref-taint false positive；callbacks 仅在 event handlers 中调用，不在渲染期间执行

### #012

- **文件**: `features/ai/AiPanel.tsx`
- **行号**: L169
- **规则**: `react-hooks/refs`
- **判定**: KEEP
- **理由**: `ref.current` 赋值在 `useEffect` 中执行，非渲染期间，属于 `react-hooks/refs` 误报

### #013

- **文件**: `features/ai/AiMessageList.tsx`
- **行号**: L117
- **规则**: `creonow/no-raw-error-code-in-ui`
- **判定**: KEEP
- **理由**: diagnostic code reference 用于 AI error display，user-friendly description 已在上方单独展示

### #014

- **文件**: `features/ai/CodeBlock.tsx`
- **行号**: L53
- **规则**: `creonow/no-raw-error-code-in-ui`
- **判定**: KEEP
- **理由**: false positive；`props.code` 是编程源代码内容，不是 error code

### #015

- **文件**: `features/ai/AiInputArea.tsx`
- **行号**: L179
- **规则**: `creonow/no-native-html-element`
- **判定**: KEEP
- **理由**: `<textarea>` 需要 ref 转发用于自动调整高度，Textarea 原语不支持 forwardRef

### #016

- **文件**: `features/commandPalette/CommandPalette.tsx`
- **行号**: L175
- **规则**: `creonow/no-hardcoded-dimension`
- **判定**: KEEP
- **理由**: command palette modal width `w-[600px]` 由 design spec 指定

### #017

- **文件**: `features/commandPalette/CommandPalette.tsx`
- **行号**: L204
- **规则**: `creonow/no-hardcoded-dimension`
- **判定**: KEEP
- **理由**: command list height `max-h-[424px]` 由 design spec 指定

### #018

- **文件**: `features/commandPalette/CommandPaletteFooter.tsx`
- **行号**: L12
- **规则**: `i18next/no-literal-string`
- **判定**: KEEP
- **理由**: `↑↓` 是装饰性导航箭头 glyph，不是用户可见的可翻译文本

### #019

- **文件**: `features/commandPalette/CommandPaletteFooter.tsx`
- **行号**: L22
- **规则**: `i18next/no-literal-string`
- **判定**: KEEP
- **理由**: `↵` 是装饰性 enter 箭头 glyph，不是用户可见的可翻译文本

### #020（测试文件）

- **文件**: `features/editor/InlineAi.test.tsx`
- **行号**: L274
- **规则**: `@typescript-eslint/no-require-imports`
- **判定**: KEEP
- **理由**: 测试文件使用 `require()` 加载 JSON locale 文件进行 key 存在性验证，ESM import 无法在 describe 块内使用

### #021（测试文件）

- **文件**: `features/editor/InlineAi.test.tsx`
- **行号**: L276
- **规则**: `@typescript-eslint/no-require-imports`
- **判定**: KEEP
- **理由**: 同 #020，测试文件使用 `require()` 加载 zh-CN locale JSON

### #022

- **文件**: `features/editor/BubbleMenuFormatActions.tsx`
- **行号**: L122
- **规则**: `creonow/no-raw-error-code-in-ui`
- **判定**: KEEP
- **理由**: false positive；`EDITOR_SHORTCUTS.code` 指 code-formatting shortcut，不是 error code

### #023

- **文件**: `features/editor/BubbleMenuFormatActions.tsx`
- **行号**: L125
- **规则**: `creonow/no-raw-error-code-in-ui`
- **判定**: KEEP
- **理由**: 同 #022，`EDITOR_SHORTCUTS.code.display()` 指 code-formatting shortcut display

### #024

- **文件**: `features/editor/BubbleMenuFormatActions.tsx`
- **行号**: L132
- **规则**: `creonow/no-raw-error-code-in-ui`
- **判定**: KEEP
- **理由**: false positive；`formatIcons.code` 是 code-formatting icon，不是 error code

### #025

- **文件**: `features/editor/EditorContextMenu.tsx`
- **行号**: L42
- **规则**: `creonow/no-hardcoded-dimension`
- **判定**: KEEP
- **理由**: Editor context menu min-width `min-w-[180px]` 由 design spec 指定

### #026

- **文件**: `features/onboarding/OnboardingPage.tsx`
- **行号**: L58
- **规则**: `creonow/no-hardcoded-dimension`
- **判定**: KEEP
- **理由**: onboarding page layout bounds `max-h-[900px]`, `max-w-[800px]` 由 design spec 指定

### #027

- **文件**: `features/projects/ProjectFormContent.tsx`
- **行号**: L301
- **规则**: `creonow/no-native-html-element`
- **判定**: KEEP
- **理由**: `<input type="hidden">` 是 HTML 表单语义元素，无对应 Primitive 组件
