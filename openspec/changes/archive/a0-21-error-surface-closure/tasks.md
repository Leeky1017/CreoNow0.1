# Tasks: A0-21 错误展示组件收口

- **GitHub Issue**: #988
- **分支**: `task/988-error-surface-closure`
- **Delta Spec**: `specs/workbench/spec.md`
- **前置依赖**: A0-20（#983）必须先合并——`getHumanErrorMessage()` 函数和全量映射表必须在代码库中可用

---

## 验收标准

| ID   | 标准                                                                                                                                                            | 对应 Scenario       |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| AC-1 | 14 个泄露组件中无任何一处直接渲染 `error.code` 或 `error.message`——全部通过 `getHumanErrorMessage()` 获取文案                                                   | Scenario 1, 2, 4, 6 |
| AC-2 | CommandPalette 中无硬编码错误字符串（`ACTION_FAILED: ...`、`NO_PROJECT: ...`），全部走 `t()` i18n 调用                                                          | Scenario 3          |
| AC-3 | 所有错误展示位置使用 `var(--color-text-error)` Token，不使用 Tailwind 原始色值                                                                                  | Scenario 1          |
| AC-4 | 所有错误区域设置 `role="alert"` 或 `aria-live="polite"` 属性                                                                                                    | Scenario 1          |
| AC-5 | `zh-CN.json` 和 `en.json` 包含 CommandPalette 所有错误场景的 i18n 翻译条目                                                                                      | Scenario 3, 5       |
| AC-6 | i18n 语言切换后，所有收口组件的错误文案跟随语言切换                                                                                                             | Scenario 5          |
| AC-7 | 全局搜索 renderer 源码中不存在 `error.code}` / `error.message}` / `res.error.code}` / `res.error.message}` 等直接渲染模式（排除 `errorMessages.ts` 及测试文件） | Scenario 6          |
| AC-8 | 错误文案中不包含大写蛇形标识符、HTTP 状态码、SQLite 报错、上游 API 名称等技术术语                                                                               | Scenario 6          |

---

## Phase 1: Red（测试先行）

### Task 1.1: 全局泄露检测测试

**映射验收标准**: AC-7, AC-8

编写一个测试，扫描 renderer 源码目录中的全部 `.tsx` / `.ts` 文件（排除 `errorMessages.ts`、`errorMessages.test.ts`、`*.test.*`），检测是否存在错误码直接渲染模式：

- [x] 测试：扫描全部 `.tsx` 文件中的 JSX 表达式，断言无 `{error.code}` / `{error.message}` / `{state.error.code}` / `{state.error.message}` / `{lastError.code}` / `{lastError.message}` 模式
- [x] 测试：扫描全部 `.tsx` / `.ts` 文件中的模板字符串，断言无 `` `${...error.code}` `` / `` `${...error.message}` `` 拼接模式
- [x] 测试：扫描全部 `.tsx` 文件，断言无 `"ACTION_FAILED:` / `"NO_PROJECT:` 硬编码字符串

**文件**: `apps/desktop/tests/error-surface-closure.test.ts`（新建）

### Task 1.2: ExportDialog 错误展示测试

**映射验收标准**: AC-1, AC-3, AC-4

- [x] 测试：渲染 `ExportDialog`，模拟导出失败返回 `{ code: "DB_ERROR", message: "SQLITE_CONSTRAINT: UNIQUE constraint failed" }`，断言 DOM 中不包含 `DB_ERROR` 和 `SQLITE_CONSTRAINT`
- [x] 测试：同上场景，断言 DOM 中包含 `getHumanErrorMessage()` 对 `DB_ERROR` 的返回值
- [x] 测试：断言错误文本元素使用了 `var(--color-text-error)` Token（通过 className 或 computed style）
- [x] 测试：断言错误区域存在 `role="alert"` 属性

**文件**: `apps/desktop/renderer/src/features/export/ExportDialog.test.tsx`（扩展现有或新建）

### Task 1.3: QualityPanel 错误展示测试

**映射验收标准**: AC-1, AC-4

- [x] 测试：渲染 `QualityPanel`，模拟 Judge 错误 `{ code: "MODEL_NOT_READY", message: "Judge model ensure is not implemented (non-E2E build)" }`，断言 DOM 中不包含 `MODEL_NOT_READY` 和 `non-E2E build`
- [x] 测试：渲染 `QualityPanel`，模拟 Constraints 错误，断言 DOM 中包含人话文案而非技术码
- [x] 测试：断言错误区域存在 `role="alert"` 属性

**文件**: `apps/desktop/renderer/src/features/rightpanel/QualityPanel.test.tsx`

### Task 1.4: 模板字符串组件测试（JudgeSection / AiSettingsSection / DashboardPage）

**映射验收标准**: AC-1

- [x] 测试：渲染 `JudgeSection`，模拟检测失败返回错误，断言 DOM 中不包含 `error.code` 值
- [x] 测试：渲染 `AiSettingsSection`，模拟 API Key 验证失败，断言 DOM 中包含人话文案
- [x] 测试：渲染 `DashboardPage`，模拟操作失败，断言 DOM 中不包含模板字符串拼接的技术信息

**文件**: `apps/desktop/renderer/src/features/settings/JudgeSection.test.tsx`、`apps/desktop/renderer/src/features/settings/AiSettingsSection.test.tsx`、`apps/desktop/renderer/src/features/dashboard/DashboardPage.test.tsx`

### Task 1.5: CommandPalette 错误文案测试

**映射验收标准**: AC-2, AC-5

- [x] 测试：触发 CommandPalette 中 Settings 不可用场景，断言不展示 `"ACTION_FAILED: Settings dialog not available"`
- [x] 测试：触发 CommandPalette 中 No Project 场景，断言不展示 `"NO_PROJECT: Please open a project first"`
- [x] 测试：断言展示的文案为 `t()` 返回值（通过 mock i18n 验证）
- [x] 测试：切换 locale 后，错误文案跟随切换

**文件**: `apps/desktop/renderer/src/features/commandPalette/CommandPalette.test.tsx`

### Task 1.6: AiErrorCard 错误码隐藏测试

**映射验收标准**: AC-1

- [x] 测试：渲染 `AiErrorCard` 并设置 `service_error` 状态和 `errorCode: "AI_RATE_LIMITED"`，断言 DOM 中不包含 `AI_RATE_LIMITED`
- [x] 测试：断言 DOM 中包含 `getHumanErrorMessage()` 对 `AI_RATE_LIMITED` 的返回值

**文件**: `apps/desktop/renderer/src/components/features/AiDialogs/AiErrorCard.test.tsx`

### Task 1.7: i18n 语言切换测试

**映射验收标准**: AC-6

- [x] 测试：在中文 locale 下渲染一个收口组件（如 `ExportDialog`）的错误状态，记录错误文案
- [x] 测试：切换到英文 locale，断言错误文案变更为英文翻译
- [x] 测试：两次渲染的错误文案不相等

**文件**: `apps/desktop/renderer/src/features/export/ExportDialog.test.tsx`

### Task 1.8: i18n key 完整性测试（CommandPalette）

**映射验收标准**: AC-5

- [x] 测试：`zh-CN.json` 中包含 `workbench.commandPalette.errors.*` 下全部错误场景的 key（至少覆盖 settings、export、layout、noProject）
- [x] 测试：`en.json` 中包含相同结构的 key，数量与 `zh-CN.json` 一致
- [x] 测试：所有 `workbench.commandPalette.errors.*` 值不包含 `ACTION_FAILED` 或 `NO_PROJECT` 等硬编码前缀

**文件**: `apps/desktop/tests/i18n/command-palette-error-keys.test.ts`

---

## Phase 2: Green（实现）

### Task 2.1: 收口 JSX 直接渲染组件（第一批：ExportDialog、QualityPanel、VersionPreviewDialog）

逐个修改组件，将 `{error.code}: {error.message}` 替换为 `getHumanErrorMessage(error)` 调用：

- [x] `ExportDialog.tsx` L425, L427：导入 `getHumanErrorMessage`，替换错误渲染
- [x] `QualityPanel.tsx` L112-114, L197-199：替换 Judge 和 Constraints 两处错误渲染
- [x] `VersionPreviewDialog.tsx` L79：替换错误渲染
- [x] 确认三个组件的错误文本元素使用 `var(--color-text-error)` Token
- [x] 确认三个组件的错误区域设置 `role="alert"`

**文件**: `features/export/ExportDialog.tsx`、`features/rightpanel/QualityPanel.tsx`、`features/version-history/VersionPreviewDialog.tsx`（修改）

### Task 2.2: 收口 JSX 直接渲染组件（第二批：InfoPanel、MemoryPanel、AnalyticsPage）

- [x] `InfoPanel.tsx` L151-152：替换错误渲染
- [x] `MemoryPanel.tsx` L498, L510：替换 `{state.error.code}` + `{state.error.message}` 渲染
- [x] `AnalyticsPage.tsx` L151：替换错误渲染
- [x] 确认三个组件使用正确的 Design Token 和 `role="alert"`

**文件**: `features/rightpanel/InfoPanel.tsx`、`features/memory/MemoryPanel.tsx`、`features/analytics/AnalyticsPage.tsx`（修改）

### Task 2.3: 收口 JSX 直接渲染组件（第三批：CreateProjectDialog、KnowledgeGraphPanel、VersionHistoryContainer）

- [x] `CreateProjectDialog.tsx` L321：替换 `{lastError.code}: {lastError.message}` 渲染
- [x] `KnowledgeGraphPanel.tsx` L917-918, L930, L1126, L1138：替换四处错误渲染
- [x] `VersionHistoryContainer.tsx` L675-676, L727-728：替换合并错误和预览错误两处渲染
- [x] 确认三个组件使用正确的 Design Token 和 `role="alert"`

**文件**: `features/projects/CreateProjectDialog.tsx`、`features/kg/KnowledgeGraphPanel.tsx`、`apps/desktop/renderer/src/features/version-history/VersionHistoryContainer.tsx`（修改）

### Task 2.4: 收口模板字符串拼接组件

将 `` `${res.error.code}: ${res.error.message}` `` 替换为 `getHumanErrorMessage(res.error)` 调用：

- [x] `JudgeSection.tsx` L18：`` `error (${state.error.code})` `` → `getHumanErrorMessage(state.error)`
- [x] `JudgeSection.tsx` L54, L82, L85：`` `${res.error.code}: ${res.error.message}` `` → `getHumanErrorMessage(res.error)`
- [x] `AiSettingsSection.tsx` L42, L104, L121：同上替换模式
- [x] `DashboardPage.tsx` L428：同上替换模式

**文件**: `features/settings/JudgeSection.tsx`、`features/settings/AiSettingsSection.tsx`、`features/dashboard/DashboardPage.tsx`（修改）

### Task 2.5: 收口 AiErrorCard

- [x] `AiErrorCard.tsx` L768-770：将 `service_error` 状态下 `{error.errorCode}` 展示替换为 `getHumanErrorMessage({ code: error.errorCode, message: error.message })` 调用

**文件**: `components/features/AiDialogs/AiErrorCard.tsx`（修改）

### Task 2.6: 收口 CommandPalette 硬编码 + 新增 i18n key

- [x] 在 `zh-CN.json` / `en.json` 中维护当前 `workbench.commandPalette.errors.*` 命名空间，至少覆盖：
  - `workbench.commandPalette.errors.settingsUnavailable`
  - `workbench.commandPalette.errors.exportUnavailable`
  - `workbench.commandPalette.errors.layoutUnavailable`
  - `workbench.commandPalette.errors.noProject`
  - `workbench.commandPalette.errors.createDocumentFailed`
  - `workbench.commandPalette.errors.documentUnavailable`
  - `workbench.commandPalette.errors.versionHistoryUnavailable`
  - `workbench.commandPalette.errors.createProjectUnavailable`
- [x] 将 `CommandPalette.tsx` 中历史上的硬编码错误字符串收口为 `t("workbench.commandPalette.errors.<场景>")` 调用
  - settings / export 对话框不可用 → `settingsUnavailable` / `exportUnavailable`
  - layout 相关不可用 → `layoutUnavailable`
  - 无项目上下文 → `noProject`
  - 创建文档、文档打开、版本历史、创建项目失败 → 对应 current error key

**文件**: `features/commandPalette/CommandPalette.tsx`（修改）、`renderer/src/i18n/locales/zh-CN.json`（修改）、`renderer/src/i18n/locales/en.json`（修改）

### Task 2.7: Design Token 与无障碍样式统一

逐个检查已修改的 14 个组件，确保错误展示位置的样式统一：

- [x] 所有错误文字使用 `var(--color-text-error)` Token（不使用 `text-red-500` 等原始值）
- [x] 带背景的错误区域使用 `var(--color-bg-error)` Token
- [x] 所有错误区域设置 `role="alert"` 或 `aria-live="polite"`
- [x] 错误文案的颜色对比度满足 WCAG 2.1 AA（4.5:1）

**文件**: 上述 14 个组件文件（修改）

---

## Phase 3: Refactor（收口与回归）

### Task 3.1: 全量测试回归

- [x] 执行 `pnpm -C apps/desktop vitest run apps/desktop/tests/error-surface-closure.test.ts` 全局泄露检测通过
- [x] 执行各组件测试文件全部通过
- [x] 执行 `pnpm -C apps/desktop tsc --noEmit` 类型检查通过
- [x] 执行 `pnpm -C apps/desktop lint` 通过

### Task 3.2: 视觉验收

- [x] 确认 Storybook 可构建（`pnpm -C apps/desktop storybook:build`）
- [x] 在 Storybook 或应用中手动触发至少 3 个组件的错误状态，截图确认展示人话文案
- [x] 确认错误文案在暗色主题和亮色主题下均可读（Token 自动适配）

### Task 3.3: 清理确认

- [x] 全局搜索确认 renderer 源码中无遗留的 `{error.code}` / `{error.message}` 直接渲染（排除 `errorMessages.ts` 和测试文件）
- [x] 全局搜索确认无遗留的 `"ACTION_FAILED:` / `"NO_PROJECT:` 硬编码
- [x] 确认所有新增 `getHumanErrorMessage` 导入指向 `renderer/src/lib/errorMessages.ts`

---

## 验收标准 → 测试映射

| 验收标准                     | 对应测试文件                                                                                              | 测试用例名                                       | 状态 |
| ---------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | ---- |
| AC-1 全组件调用映射函数      | `apps/desktop/renderer/src/lib/__tests__/error-surface-closure.guard.test.ts` + 各组件测试                | 无直接渲染模式 + 各组件不展示技术码              | [x]  |
| AC-2 CommandPalette 无硬编码 | `CommandPalette.test.tsx` + `apps/desktop/renderer/src/lib/__tests__/error-surface-closure.guard.test.ts` | 无 ACTION_FAILED/NO_PROJECT 硬编码               | [x]  |
| AC-3 Design Token 使用       | 各组件测试                                                                                                | 错误文本使用 --color-text-error                  | [x]  |
| AC-4 无障碍属性              | 各组件测试                                                                                                | 错误区域 role="alert"                            | [x]  |
| AC-5 i18n key 完整           | `apps/desktop/renderer/src/lib/__tests__/error-surface-closure.guard.test.ts`                             | zh-CN/en workbench.commandPalette.errors.\* 覆盖 | [x]  |
| AC-6 i18n 语言切换           | `ExportDialog.test.tsx`                                                                                   | 切换 locale 后错误文案跟随                       | [x]  |
| AC-7 全局无泄露              | `apps/desktop/renderer/src/lib/__tests__/error-surface-closure.guard.test.ts`                             | renderer 目录无直接渲染模式                      | [x]  |
| AC-8 文案无技术术语          | 各组件测试                                                                                                | DOM 不包含大写蛇形标识符/技术术语                | [x]  |

---

## Done 定义

- [x] 所有 Scenario 有对应测试且通过
- [x] 14 个泄露组件全部收口完成——无一处直接渲染 `error.code` 或 `error.message`
- [x] CommandPalette 全部硬编码错误字符串替换为 i18n 调用
- [x] `zh-CN.json` 和 `en.json` 包含 `workbench.commandPalette.errors.*` 全量条目
- [x] 所有错误展示使用语义化 Design Token
- [x] 所有错误区域有正确的无障碍属性
- [x] Storybook 构建通过
- [x] PR body 包含 `Closes #988`
- [x] 审计评论闭环完成（PRE-AUDIT → RE-AUDIT → FINAL-VERDICT）

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
