# Tasks: A0-16 编辑器/版本/Slash i18n 核查

- **GitHub Issue**: #991
- **分支**: `task/991-editor-version-slash-i18n`
- **Delta Spec**: `specs/editor/spec.md`
- **前置依赖**: A0-09（#990）必须先完成——清理清单是本任务的修复范围依据

---

## 所属任务簇

P0-5: 文案与 i18n 存量止血

---

## 验收标准

| ID | 标准 | 对应 Scenario |
|----|------|--------------|
| AC-1 | `EditorPane.tsx` 不含裸字符串 `"Entity suggestions unavailable."` 和 confirm 对话框英文文案，改为 `t()` 调用 | Scenario 1 |
| AC-2 | `EditorContextMenu.tsx` 的 `"AI"` 标签改为 `t('editor.contextMenu.ai')` | Scenario 1 |
| AC-3 | `slashCommands.ts` 全部 slash command 的 label 和 description 改为 `t()` 调用，切换 locale 后文案跟随 | Scenario 2 |
| AC-4 | `VersionHistoryContainer.tsx` 中作者名 `"You"` / `"AI"` / `"Auto"` / `"Unknown"` 全部改为 `t()` 调用 | Scenario 3 |
| AC-5 | `VersionHistoryContainer.tsx` 中时间分组 `"Just now"` / `"Today"` / `"Yesterday"` / `"Earlier"` 全部改为 `t()` 调用 | Scenario 3 |
| AC-6 | `VersionHistoryContainer.tsx` 中 `"Loading versions..."` 改为 `t()` 调用 | Scenario 3 |
| AC-7 | `VersionHistoryPanel.tsx` 中 tooltip `"Restore"` / `"Compare"` / `"Preview"` 全部改为 `t()` 调用 | Scenario 4 |
| AC-8 | `useVersionCompare.ts` 中 `"No differences found."` / `"Unknown error"` 改为 `t()` 调用 | Scenario 3 |
| AC-9 | `zh-CN.json` 和 `en.json` 新增全部所需 i18n key，且中英 key 数量一致 | 全部 Scenario |
| AC-10 | 全部变更文件无裸字符串字面量残留（扫描验证） | 全部 Scenario |

---

## Phase 1: Red（测试先行）

### Task 1.1: 编辑器区域裸字符串消除测试

**映射验收标准**: AC-1, AC-2

- [ ] 测试：扫描 `EditorPane.tsx` 源码，断言不包含裸字符串 `"Entity suggestions unavailable."`
- [ ] 测试：扫描 `EditorPane.tsx` 源码，断言不包含裸字符串 `"This document is final. Editing will switch it back to draft. Continue?"`
- [ ] 测试：断言 `EditorPane.tsx` 中存在 `t('editor.entitySuggestionsUnavailable')` 调用
- [ ] 测试：断言 `EditorPane.tsx` 中存在 `t('editor.confirmSwitchToDraft')` 调用
- [ ] 测试：扫描 `EditorContextMenu.tsx` 源码，断言 `"AI"` 作为菜单标签的位置已改为 `t('editor.contextMenu.ai')` 调用

**文件**: `apps/desktop/tests/i18n/editor-version-slash-i18n.test.ts`（新建）

### Task 1.2: Slash command i18n 测试

**映射验收标准**: AC-3

- [ ] 测试：扫描 `slashCommands.ts` 源码，断言不包含硬编码中文 label（`"续写"` / `"描写"` / `"对白"` / `"角色"` / `"大纲"` / `"搜索"` 作为 label 值）
- [ ] 测试：断言存在 `t('editor.slash.continue.label')` 等 6 套 label + description 的 `t()` 调用
- [ ] 测试：读取 `zh-CN.json`，断言包含 `editor.slash.continue.label` 等全部 12 个 slash i18n key
- [ ] 测试：读取 `en.json`，断言包含相同 12 个 slash i18n key

**文件**: `apps/desktop/tests/i18n/editor-version-slash-i18n.test.ts`

### Task 1.3: 版本历史裸字符串消除测试

**映射验收标准**: AC-4, AC-5, AC-6, AC-7, AC-8

- [ ] 测试：扫描 `VersionHistoryContainer.tsx` 源码，断言不包含裸字符串 `"You"` / `"AI"` / `"Auto"` / `"Unknown"` 作为作者名的赋值
- [ ] 测试：扫描 `VersionHistoryContainer.tsx` 源码，断言不包含裸字符串 `"Just now"` / `"Today"` / `"Yesterday"` / `"Earlier"` 作为分组标题的赋值
- [ ] 测试：扫描 `VersionHistoryContainer.tsx` 源码，断言不包含裸字符串 `"Loading versions..."`
- [ ] 测试：扫描 `VersionHistoryPanel.tsx` 源码，断言不包含裸字符串 `"Restore"` / `"Compare"` / `"Preview"` 作为 tooltip 值
- [ ] 测试：扫描 `useVersionCompare.ts` 源码，断言不包含裸字符串 `"No differences found."` / `"Unknown error"`

**文件**: `apps/desktop/tests/i18n/editor-version-slash-i18n.test.ts`

### Task 1.4: i18n key 完整性测试

**映射验收标准**: AC-9

- [ ] 测试：读取 `zh-CN.json`，断言包含 Delta Spec 中定义的全部新增 key（≥ 28 个：3 编辑器 + 12 slash + 15 版本历史 - 2 AI 相同 key）
- [ ] 测试：读取 `en.json`，断言包含相同数量的新增 key
- [ ] 测试：断言 `zh-CN.json` 和 `en.json` 中新增 key 集合完全一致（对称性检查）

**文件**: `apps/desktop/tests/i18n/editor-version-slash-i18n.test.ts`

---

## Phase 2: Green（实现）

### Task 2.1: 编辑器区域 i18n 改造

- [ ] `EditorPane.tsx:400`：将 `"Entity suggestions unavailable."` 替换为 `t('editor.entitySuggestionsUnavailable')`
- [ ] `EditorPane.tsx:616`：将 confirm 对话框中 `"This document is final..."` 替换为 `t('editor.confirmSwitchToDraft')`
- [ ] `EditorContextMenu.tsx:263`：将菜单标签 `"AI"` 替换为 `t('editor.contextMenu.ai')`
- [ ] 确认 `useTranslation()` hook 已在相关组件中导入

**文件**: `renderer/src/features/editor/EditorPane.tsx`（修改）、`renderer/src/features/editor/EditorContextMenu.tsx`（修改）

### Task 2.2: Slash command 双语化

- [ ] `slashCommands.ts`：将每个 slash command 的 label 和 description 从硬编码字符串改为 `t()` 调用
- [ ] 确认 slash command 的触发 key（如 `/续写` 中的中文名）不受影响——触发 key 保持中文
- [ ] 确认 `t()` 函数在 `slashCommands.ts` 的调用上下文中可用（可能需要传入 `t` 函数作为参数，或从 i18n 实例直接获取）

**文件**: `renderer/src/features/editor/slashCommands.ts`（修改）

### Task 2.3: 版本历史 i18n 改造——作者名和时间分组

- [ ] `VersionHistoryContainer.tsx`：将 `"You"` / `"AI"` / `"Auto"` / `"Unknown"` 替换为 `t('versionControl.author.you')` 等调用
- [ ] `VersionHistoryContainer.tsx`：将 `"Just now"` / `"Today"` / `"Yesterday"` / `"Earlier"` 替换为对应 `t()` 调用
- [ ] `VersionHistoryContainer.tsx`：将 `"Xm ago"` 替换为 `t('versionControl.timeGroup.minutesAgo', { count: X })`
- [ ] `VersionHistoryContainer.tsx`：将 `"Loading versions..."` 替换为 `t('versionControl.loadingVersions')`

**文件**: `renderer/src/features/version-control/VersionHistoryContainer.tsx`（修改）

### Task 2.4: 版本历史 i18n 改造——tooltip 和错误文案

- [ ] `VersionHistoryPanel.tsx:372`：将 `"Restore"` / `"Compare"` / `"Preview"` tooltip 替换为 `t()` 调用
- [ ] `useVersionCompare.ts:73`：将 `"No differences found."` 替换为 `t('versionControl.noDifferencesFound')`
- [ ] `useVersionCompare.ts:77`：将 `"Unknown error"` 替换为 `t('versionControl.unknownError')`

**文件**: `renderer/src/features/rightpanel/VersionHistoryPanel.tsx`（修改）、`renderer/src/features/version-control/useVersionCompare.ts`（修改）

### Task 2.5: 新增 i18n key

- [ ] `zh-CN.json`：新增全部编辑器 i18n key（3 个）
- [ ] `zh-CN.json`：新增全部 slash command i18n key（12 个）
- [ ] `zh-CN.json`：新增全部版本历史 i18n key（15 个）
- [ ] `en.json`：同步新增全部 key，值为英文文案
- [ ] 确认 key 命名遵循现有模块命名空间（`editor.*`、`versionControl.*`）

**文件**: `renderer/src/i18n/locales/zh-CN.json`（修改）、`renderer/src/i18n/locales/en.json`（修改）

---

## Phase 3: Refactor（收尾）

### Task 3.1: 运行全量测试

- [ ] 运行 `pnpm -C apps/desktop vitest run`，确认无回归
- [ ] 运行 `pnpm -C apps/desktop tsc --noEmit`，确认无类型错误

### Task 3.2: 残留裸字符串验证

- [ ] 扫描 `EditorPane.tsx`、`EditorContextMenu.tsx`、`slashCommands.ts`、`VersionHistoryContainer.tsx`、`VersionHistoryPanel.tsx`、`useVersionCompare.ts` 全部修改文件
- [ ] 断言上述文件中无面向用户的裸字符串残留

### Task 3.3: 视觉验收

- [ ] 确认 Storybook 可构建：`pnpm -C apps/desktop storybook:build`
- [ ] 确认编辑器 confirm 对话框在中文 locale 下显示中文文案
- [ ] 确认 slash 菜单在中文 locale 下显示中文 label/description，在英文 locale 下显示英文
- [ ] 确认版本历史面板在中文 locale 下作者名、时间分组、tooltip 均显示中文
- [ ] 确认版本历史面板在英文 locale 下全部显示英文

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
