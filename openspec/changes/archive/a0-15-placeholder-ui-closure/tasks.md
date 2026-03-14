# Tasks: A0-15 占位 UI 收口

- **GitHub Issue**: #995
- **分支**: `task/995-placeholder-ui-closure`
- **Delta Spec**: `specs/workbench/spec.md`
- **前置依赖**: 无

---

## 所属任务簇

P0-3: 能力诚实分级与假功能处置

---

## 验收标准

| ID   | 标准                                                                                                                                                        | 对应 Scenario                                |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| AC-1 | Settings Account 页所有 disabled 按钮附有 tooltip，显示 `t('settings.account.comingSoonTooltip')`                                                           | Settings Account 页按钮显示 Coming Soon 标注 |
| AC-2 | Search 面板中 "View More" 链接不渲染                                                                                                                        | Search 面板隐藏无功能链接                    |
| AC-3 | Search 面板中 "Search All Projects" 链接不渲染                                                                                                              | Search 面板隐藏无功能链接                    |
| AC-4 | RightPanel ChatHistory 条目点击不执行操作，不输出 `console.info`，显示 Coming Soon tooltip                                                                  | ChatHistory 条目点击显示 Coming Soon 提示    |
| AC-5 | 版本恢复 Restore 按钮 disabled + tooltip `t('versionControl.restoreComingSoon')`                                                                            | 版本恢复 Restore 按钮显示 Coming Soon 提示   |
| AC-6 | `zh-CN.json` 和 `en.json` 包含 `common.comingSoon`、`common.featureInDevelopment`、`settings.account.comingSoonTooltip`、`versionControl.restoreComingSoon` | i18n 切换后 Coming Soon 文案跟随             |
| AC-7 | 切换界面语言后 Coming Soon 文案跟随语言变化                                                                                                                 | i18n 切换后 Coming Soon 文案跟随             |
| AC-8 | 所有新增文案通过 `t()` 函数获取，无裸字符串字面量                                                                                                           | 全部 Scenario                                |
| AC-9 | disabled 按钮设置 `aria-disabled="true"`，tooltip 通过 `aria-describedby` 关联                                                                              | 可访问性                                     |

---

## Phase 1: Red（测试先行）

### Task 1.1: Settings Account Coming Soon 标注测试

**映射验收标准**: AC-1

编写 SettingsAccount 页 disabled 按钮标注的单元测试：

- [x] 测试：渲染 SettingsAccount 页，断言所有操作按钮处于 disabled 状态
- [x] 测试：hover disabled 按钮，断言 tooltip 文本匹配 `t('settings.account.comingSoonTooltip')` 的值
- [x] 测试：点击 disabled 按钮，断言无事件触发

**文件**: `apps/desktop/renderer/src/features/settings-dialog/SettingsAccount.test.tsx`（新建或扩展）

### Task 1.2: Search 面板链接隐藏测试

**映射验收标准**: AC-2, AC-3

- [x] 测试：渲染 Search 面板，断言不存在 "View More" 文本节点
- [x] 测试：渲染 Search 面板，断言不存在 "Search All Projects" 文本节点
- [x] 测试：搜索结果列表正常渲染，不受隐藏影响

**文件**: `apps/desktop/renderer/src/features/search/SearchPanel.test.tsx`（新建或扩展）

### Task 1.3: ChatHistory 交互降级测试

**映射验收标准**: AC-4

- [x] 测试：渲染 ChatHistory 列表，点击某条历史记录，断言不调用任何回调
- [x] 测试：渲染 ChatHistory 列表，点击某条历史记录，断言 `console.info` 未被调用
- [x] 测试：hover 历史记录条目，断言 tooltip 文本匹配 `t('common.comingSoon')` 的值

**文件**: `apps/desktop/renderer/src/features/rightpanel/ChatHistory.test.tsx`（新建或扩展）

### Task 1.4: 版本恢复 Restore 按钮测试

**映射验收标准**: AC-5

- [x] 测试：渲染版本历史面板，断言 Restore 按钮处于 disabled 状态
- [x] 测试：hover Restore 按钮，断言 tooltip 文本匹配 `t('versionControl.restoreComingSoon')` 的值

**文件**: 需搜索确认版本历史面板组件位置

### Task 1.5: i18n key 完整性测试

**映射验收标准**: AC-6

- [x] 测试：`zh-CN.json` 包含 `common.comingSoon`、`common.featureInDevelopment`、`settings.account.comingSoonTooltip`、`versionControl.restoreComingSoon` 四个 key
- [x] 测试：`en.json` 包含相同的四个 key
- [x] 测试：中英文文件中新增 key 的数量一致

**文件**: `apps/desktop/tests/i18n/placeholder-ui-keys.test.ts`（新建）

---

## Phase 2: Green（实现）

### Task 2.1: Settings Account 按钮添加 tooltip

- [x] 修改 `SettingsAccount.tsx`，为每个 disabled 按钮添加 Radix UI `Tooltip`，文案为 `t('settings.account.comingSoonTooltip')`
- [x] 确认 `aria-disabled="true"` 已设置
- [x] 确认 tooltip 通过 `aria-describedby` 关联

**文件**: `apps/desktop/renderer/src/features/settings-dialog/SettingsAccount.tsx`

### Task 2.2: Search 面板隐藏无功能链接

- [x] 在 Search 面板组件中移除 "View More" 链接的 JSX 渲染（条件渲染 `false` 或移除代码）
- [x] 移除 "Search All Projects" 链接的 JSX 渲染
- [x] 确认搜索结果列表不受影响
- [x] 在被移除的 JSX 代码位置添加注释 `// placeholder: hidden in v0.1, restore when search expansion is implemented`

**文件**: Search 面板组件（需搜索确认具体文件）

### Task 2.3: ChatHistory 交互降级

- [x] 修改 ChatHistory 组件，将 `console.info("TODO")` 回调替换为 disabled 状态 + tooltip
- [x] 条目视觉上标记为不可点击（cursor 不变为 pointer）
- [x] 添加 tooltip `t('common.comingSoon')`

**文件**: `apps/desktop/renderer/src/features/rightpanel/` 下的 ChatHistory 组件

### Task 2.4: 版本恢复 Restore 按钮添加 tooltip

- [x] 为 Restore 按钮的 disabled 状态添加 tooltip `t('versionControl.restoreComingSoon')`
- [x] 确认 `aria-disabled="true"` 已设置

**文件**: 需搜索确认具体文件

### Task 2.5: 新增 i18n key

- [x] 在 `zh-CN.json` 新增：
  - `"common.comingSoon": "即将推出"`
  - `"common.featureInDevelopment": "此功能正在开发中"`
  - `"settings.account.comingSoonTooltip": "账户功能正在开发中"`
  - `"versionControl.restoreComingSoon": "版本恢复功能正在开发中"`
- [x] 在 `en.json` 新增：
  - `"common.comingSoon": "Coming Soon"`
  - `"common.featureInDevelopment": "This feature is in development"`
  - `"settings.account.comingSoonTooltip": "Account features are in development"`
  - `"versionControl.restoreComingSoon": "Version restore is in development"`

**文件**: `apps/desktop/renderer/src/i18n/locales/zh-CN.json`、`apps/desktop/renderer/src/i18n/locales/en.json`

---

## Phase 3: Refactor & 视觉验收

### Task 3.1: Storybook 验证

- [x] 确认受影响组件在 Storybook 中可构建（`pnpm -C apps/desktop storybook:build`）
- [x] 确认 Settings Account 页的 Coming Soon tooltip 在 Story 中正确显示
- [x] 确认 Search 面板在 Story 中不显示隐藏链接

### Task 3.2: 全局排查

- [x] 搜索代码库中其他可能的占位 UI（`grep -rn "console.info\|TODO\|FIXME\|placeholder" renderer/src/`），确认处置清单是否有遗漏
- [x] 若发现新的占位 UI，记录但不在本任务中处置——上报给 Owner

---

## 自查清单

| 条目                          | 检查项                           | 状态 |
| ----------------------------- | -------------------------------- | ---- |
| AC-1 Account tooltip          | disabled 按钮附 tooltip          | [ ]  |
| AC-2 View More 隐藏           | 链接不渲染                       | [ ]  |
| AC-3 Search All Projects 隐藏 | 链接不渲染                       | [ ]  |
| AC-4 ChatHistory 降级         | 无 console.info，有 tooltip      | [ ]  |
| AC-5 Restore tooltip          | disabled + tooltip               | [ ]  |
| AC-6 i18n key                 | 两个 locale 文件均含新增 key     | [ ]  |
| AC-7 i18n 跟随                | 切换语言后文案跟随               | [ ]  |
| AC-8 禁止裸字符串             | 无新增裸字符串字面量             | [ ]  |
| AC-9 可访问性                 | aria-disabled + aria-describedby | [ ]  |
| 禁止原始色值                  | 无新增 Tailwind 原始色值         | [ ]  |
| Storybook 可构建              | `storybook:build` 通过           | [ ]  |

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
