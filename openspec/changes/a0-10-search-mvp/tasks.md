# Tasks: A0-10 基础全文搜索入口

- **GitHub Issue**: #1003
- **分支**: `task/1003-search-mvp`
- **Delta Spec**: `specs/search-and-retrieval/spec.md`

---

## 所属任务簇

P0-6: 基础输入输出防线

## 前置依赖

- 无（FTS 后端与 SearchPanel UI 已存在）

---

## 验收标准

| ID | 标准 | 对应 Scenario |
|----|------|--------------|
| AC-1 | `Cmd/Ctrl+Shift+F` 打开 SearchPanel | 用户通过快捷键打开全局搜索 |
| AC-2 | 打开 SearchPanel 后搜索输入框自动获得焦点 | 用户通过快捷键打开全局搜索 |
| AC-3 | SearchPanel 已打开时再次按快捷键，输入框重新获得焦点 | SearchPanel 已打开时再次按快捷键 |
| AC-4 | 左侧边栏已折叠时按快捷键，边栏展开并切换到 SearchPanel | 左侧边栏已折叠时按快捷键 |
| AC-5 | 点击搜索结果后编辑器加载对应文档并滚动到匹配位置 | 用户点击搜索结果跳转到文档 |
| AC-6 | 匹配关键词短暂高亮闪烁（1.5 秒渐隐） | 用户点击搜索结果跳转到文档 |
| AC-7 | 已打开文档的搜索结果跳转不重新加载，仅滚动 | 搜索结果跳转——目标文档已打开 |
| AC-8 | 搜索无结果时显示 i18n 化的提示文案 | 搜索无结果 |
| AC-9 | 搜索结果支持 Arrow Up/Down 键盘导航，Enter 激活 | 搜索结果键盘导航与激活 |
| AC-10 | Escape 在输入框为空时关闭 SearchPanel 并归还焦点 | Escape 键退出搜索 |
| AC-11 | 搜索输入框具有 `role="searchbox"` 和 `aria-label` | 无障碍要求 |
| AC-12 | `shortcuts.ts` 的 `LAYOUT_SHORTCUTS` 包含 `globalSearch` 条目 | 快捷键注册 |
| AC-13 | `surfaceRegistry.ts` 的 `searchPanel` 的 `entryPoints` 包含 `shortcut` 类型 | 入口注册 |
| AC-14 | 所有搜索相关 UI 文案通过 `t()` 获取，无裸字符串 | i18n 要求 |

---

## Phase 1: Red（测试先行）

### Task 1.1: 快捷键注册与定义单元测试

**映射验收标准**: AC-12

- [ ] 测试：`LAYOUT_SHORTCUTS.globalSearch` 存在，keys 为 `mod+Shift+F`
- [ ] 测试：`getAllShortcuts()` 返回的数组包含 id 为 `globalSearch` 的条目
- [ ] 测试：Mac 下 `LAYOUT_SHORTCUTS.globalSearch.display()` 返回 `⌘⇧F`
- [ ] 测试：非 Mac 下 `LAYOUT_SHORTCUTS.globalSearch.display()` 返回 `Ctrl+Shift+F`

**文件**: `tests/unit/config/shortcuts.test.ts`（新建或追加）

### Task 1.2: surfaceRegistry 入口更新测试

**映射验收标准**: AC-13

- [ ] 测试：`getSurfaceById("searchPanel")` 返回的 `entryPoints` 中包含 `type: "shortcut"` 的条目
- [ ] 测试：shortcut 入口的 `description` 包含 `Cmd/Ctrl+Shift+F`

**文件**: `tests/unit/surfaces/surfaceRegistry.test.ts`（新建或追加）

### Task 1.3: 快捷键触发 SearchPanel 打开集成测试

**映射验收标准**: AC-1, AC-2, AC-4

- [ ] 测试：模拟按下 `Cmd/Ctrl+Shift+F` → 断言 SearchPanel 变为可见
- [ ] 测试：模拟按下 `Cmd/Ctrl+Shift+F` → 断言搜索输入框获得焦点（`document.activeElement` 为搜索输入框）
- [ ] 测试：设置左侧边栏为折叠状态，模拟按下 `Cmd/Ctrl+Shift+F` → 断言边栏展开且 SearchPanel 可见

**文件**: `tests/integration/search/search-shortcut-open.test.ts`（新建）

### Task 1.4: 快捷键重复按下行为测试

**映射验收标准**: AC-3

- [ ] 测试：SearchPanel 已打开但焦点在编辑器中，模拟按下 `Cmd/Ctrl+Shift+F` → 断言 SearchPanel 保持可见且搜索输入框重新获得焦点

**文件**: `tests/integration/search/search-shortcut-open.test.ts`

### Task 1.5: Escape 键退出测试

**映射验收标准**: AC-10

- [ ] 测试：SearchPanel 打开，搜索输入框为空，模拟按下 `Escape` → 断言 SearchPanel 关闭
- [ ] 测试：SearchPanel 打开，搜索输入框有文本，模拟按下 `Escape` → 断言输入框文本清空、SearchPanel 保持打开

**文件**: `tests/integration/search/search-shortcut-open.test.ts`

### Task 1.6: 搜索结果点击跳转测试

**映射验收标准**: AC-5, AC-7

- [ ] 测试：mock FTS 返回包含 `documentId` 和 `offset` 的结果 → 点击结果项 → 断言编辑器加载了对应文档（通过 editorStore 或 documentStore 的 mock 验证）
- [ ] 测试：目标文档已在编辑器中打开 → 点击结果项 → 断言文档未被重新加载（load 函数未再次调用），仅触发滚动

**文件**: `tests/integration/search/search-result-jump.test.ts`（新建）

### Task 1.7: 搜索结果键盘导航测试

**映射验收标准**: AC-9

- [ ] 测试：搜索结果列表有 3 项，焦点在输入框 → 按 Arrow Down → 断言第一项被选中（`aria-selected="true"` 或等效）
- [ ] 测试：第一项被选中 → 按 Enter → 断言触发了跳转行为

**文件**: `tests/integration/search/search-result-jump.test.ts`

### Task 1.8: 搜索无结果展示测试

**映射验收标准**: AC-8

- [ ] 测试：mock FTS 返回空数组 → 断言 SearchPanel 渲染无结果状态
- [ ] 测试：无结果状态包含 `t("search.noResults.title")` 的翻译值

**文件**: `tests/integration/search/search-no-results.test.ts`（新建）

### Task 1.9: 无障碍属性测试

**映射验收标准**: AC-11

- [ ] 测试：搜索输入框具有 `role="searchbox"`
- [ ] 测试：搜索输入框具有 `aria-label` 属性，值不为空

**文件**: `tests/integration/search/search-shortcut-open.test.ts`

### Task 1.10: i18n key 覆盖验证测试

**映射验收标准**: AC-14

- [ ] 测试：`zh-CN.json` 和 `en.json` 包含所有 `search.input.*`、`search.noResults.*`、`search.resultCount`、`search.shortcut.label` key

**文件**: `tests/i18n/search-keys.test.ts`（新建）

---

## Phase 2: Green（实现）

### Task 2.1: 在 shortcuts.ts 新增 globalSearch 快捷键

- [ ] 在 `LAYOUT_SHORTCUTS` 中新增 `globalSearch: defineShortcut("globalSearch", "Global Search", "mod+Shift+F")`
- [ ] 确认 `getAllShortcuts()` 和 `getShortcutDisplay()` 的泛型类型更新

**文件**: `apps/desktop/renderer/src/config/shortcuts.ts`（修改）

### Task 2.2: 更新 surfaceRegistry searchPanel 入口

- [ ] 在 `searchPanel` 的 `entryPoints` 中新增 `{ type: "shortcut", description: "Cmd/Ctrl+Shift+F" }`

**文件**: `apps/desktop/renderer/src/surfaces/surfaceRegistry.ts`（修改）

### Task 2.3: 注册全局键盘事件处理

- [ ] 在全局键盘事件监听器中添加 `Cmd/Ctrl+Shift+F` 的处理逻辑
- [ ] 触发时调用 workbench store 的面板切换方法，切换到 SearchPanel
- [ ] 若左侧边栏已折叠，先展开再切换
- [ ] 切换后使用 `ref` 或 `setTimeout` 聚焦搜索输入框

**文件**: 全局键盘事件监听器所在文件（由实现 Agent 定位）

### Task 2.4: SearchPanel 搜索输入框自动聚焦

- [ ] SearchPanel 组件接收 `autoFocus` prop 或监听面板激活事件
- [ ] 面板切换到 SearchPanel 时，搜索输入框通过 `ref.focus()` 获得焦点
- [ ] 搜索输入框添加 `role="searchbox"` 和 `aria-label={t("search.input.ariaLabel")}`

**文件**: `apps/desktop/renderer/src/features/search/` 下 SearchPanel 相关组件（修改）

### Task 2.5: 实现搜索结果点击跳转

- [ ] 搜索结果项的 `onClick` 处理：提取 `documentId` 和匹配 `offset`
- [ ] 调用文档加载逻辑（检查文档是否已打开，已打开则跳过加载）
- [ ] 加载完成后滚动到匹配位置
- [ ] 匹配位置添加高亮闪烁动画（CSS animation，`--color-accent` opacity 0.3 → 0，duration 1.5s）

**文件**: `apps/desktop/renderer/src/features/search/` 下搜索结果组件（修改）

### Task 2.6: 搜索结果键盘导航

- [ ] 搜索结果列表支持 Arrow Up/Down 键盘导航
- [ ] 当前选中项具有 `aria-selected="true"`
- [ ] Enter 键在选中项上触发跳转（复用 Task 2.5 的跳转逻辑）

**文件**: `apps/desktop/renderer/src/features/search/` 下搜索结果组件（修改）

### Task 2.7: Escape 键行为

- [ ] 搜索输入框监听 `keydown` 事件：`Escape` 时若有文本则清空，若为空则关闭 SearchPanel
- [ ] 关闭 SearchPanel 后焦点归还到编辑器

**文件**: `apps/desktop/renderer/src/features/search/` 下 SearchPanel 组件（修改）

### Task 2.8: 新增 i18n key

- [ ] 在 `zh-CN.json` 的 `search` 命名空间下新增 key（`search.input.placeholder`、`search.input.ariaLabel`、`search.noResults.title`、`search.noResults.suggestion`、`search.resultCount`、`search.shortcut.label`）
- [ ] 在 `en.json` 的 `search` 命名空间下新增对应英文翻译

**文件**: `apps/desktop/renderer/src/i18n/locales/zh-CN.json`、`apps/desktop/renderer/src/i18n/locales/en.json`（修改）

---

## Phase 3: Refactor（收口）

### Task 3.1: Storybook Story 验证

- [ ] 确认 SearchPanel 的现有 Story 覆盖：有结果态、无结果态、搜索中态
- [ ] 如需补充：新增"通过快捷键打开后输入框聚焦"的 Story
- [ ] 执行 `pnpm -C apps/desktop storybook:build` 通过

### Task 3.2: 全量测试回归

- [ ] 执行 `pnpm -C apps/desktop test` 全量通过
- [ ] 执行 `pnpm -C apps/desktop tsc --noEmit` 类型检查通过
- [ ] 执行 `pnpm -C apps/desktop lint` 通过

### Task 3.3: 确认无多余文件

- [ ] 检查无多余导入或未使用的变量
- [ ] 确认 `shortcuts.ts` 中 `LAYOUT_SHORTCUTS` 的类型签名保持正确

---

## 验收标准 → 测试映射

| 验收标准 | 对应测试文件 | 测试用例名 | 状态 |
|----------|-------------|-----------|------|
| AC-1: 快捷键打开 SearchPanel | `tests/integration/search/search-shortcut-open.test.ts` | 模拟 Cmd/Ctrl+Shift+F 打开 SearchPanel | [ ] |
| AC-2: 输入框自动聚焦 | `tests/integration/search/search-shortcut-open.test.ts` | 打开后搜索输入框获得焦点 | [ ] |
| AC-3: 重复按键聚焦 | `tests/integration/search/search-shortcut-open.test.ts` | 已打开时再按快捷键输入框重新聚焦 | [ ] |
| AC-4: 折叠边栏展开 | `tests/integration/search/search-shortcut-open.test.ts` | 折叠状态按快捷键后边栏展开 | [ ] |
| AC-5: 结果点击跳转 | `tests/integration/search/search-result-jump.test.ts` | 点击结果加载文档并滚动 | [ ] |
| AC-6: 跳转后高亮闪烁 | `tests/integration/search/search-result-jump.test.ts` | 跳转后匹配位置高亮闪烁 | [ ] |
| AC-7: 已打开文档不重载 | `tests/integration/search/search-result-jump.test.ts` | 已打开文档仅滚动不重载 | [ ] |
| AC-8: 无结果状态 | `tests/integration/search/search-no-results.test.ts` | 空结果渲染无结果提示 | [ ] |
| AC-9: 键盘导航 | `tests/integration/search/search-result-jump.test.ts` | Arrow Down 选中 + Enter 激活 | [ ] |
| AC-10: Escape 退出 | `tests/integration/search/search-shortcut-open.test.ts` | Escape 清空或关闭 | [ ] |
| AC-11: 无障碍属性 | `tests/integration/search/search-shortcut-open.test.ts` | 搜索输入框 role 和 aria-label | [ ] |
| AC-12: shortcuts.ts 条目 | `tests/unit/config/shortcuts.test.ts` | LAYOUT_SHORTCUTS 包含 globalSearch | [ ] |
| AC-13: surfaceRegistry 入口 | `tests/unit/surfaces/surfaceRegistry.test.ts` | searchPanel entryPoints 包含 shortcut | [ ] |
| AC-14: i18n key 覆盖 | `tests/i18n/search-keys.test.ts` | zh-CN 和 en 包含 search.* key | [ ] |

---

## 前端验收

本变更需要前端视觉验收：

- [ ] 按下 `Cmd/Ctrl+Shift+F` 后左侧面板切换到 SearchPanel，输入框自动聚焦
- [ ] 在搜索框中输入关键词，结果列表正常展示（文档标题、匹配片段、关键词高亮）
- [ ] 点击搜索结果，编辑器加载对应文档并滚动到匹配位置，匹配词短暂高亮闪烁
- [ ] Arrow Up/Down 导航搜索结果，Enter 触发跳转
- [ ] 搜索无结果时显示友好的空状态提示
- [ ] `Escape` 键清空搜索或关闭面板
- [ ] 左侧边栏折叠时按快捷键，边栏自动展开并显示 SearchPanel
- [ ] 切换至英文语言后所有搜索相关文案显示英文

---

## Done 定义

- [ ] 所有 Scenario 有对应测试且通过
- [ ] PR body 包含 `Closes #1003`
- [ ] 审计评论闭环完成（PRE-AUDIT → RE-AUDIT → FINAL-VERDICT）
- [ ] 前端任务有视觉验收证据

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
