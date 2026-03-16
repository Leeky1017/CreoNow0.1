# Tasks: A0-22 i18n 错误文案修正

- **GitHub Issue**: #989
- **分支**: `task/989-i18n-error-copy-cleanup`
- **Delta Spec**: `specs/workbench/spec.md`
- **前置依赖**: A0-20（#983）必须先合并——全量映射函数和 `error.code.*` i18n 命名空间必须在代码库中可用

---

## 验收标准

| ID   | 标准                                                                                                              | 对应 Scenario |
| ---- | ----------------------------------------------------------------------------------------------------------------- | ------------- |
| AC-1 | `export.error.noProject` 的 zh-CN 值为 `"请先打开一个项目"`，不含 `NO_PROJECT` 前缀                               | Scenario 1    |
| AC-2 | `export.error.noProject` 的 en 值为 `"Please open a project first"`，不含 `NO_PROJECT` 前缀                       | Scenario 1    |
| AC-3 | `rightPanel.quality.errorWithCode` 的 zh-CN 值为 `"质量检测遇到问题"`，不含 `{{code}}` 插值                       | Scenario 2    |
| AC-4 | `rightPanel.quality.errorWithCode` 的 en 值为 `"Quality check encountered an issue"`，不含 `{{code}}` 插值        | Scenario 2    |
| AC-5 | 调用 `t("rightPanel.quality.errorWithCode")` 的组件代码已移除 `{ code: ... }` 参数传递                            | Scenario 2    |
| AC-6 | `zh-CN.json` 全量扫描：无任何值匹配 `/^[A-Z][A-Z_]{2,}:\s/`（错误码前缀）或包含 `{{code}}` / `{{errorCode}}` 插值 | Scenario 3    |
| AC-7 | `en.json` 全量扫描：同 AC-6 约束                                                                                  | Scenario 3    |

---

## Phase 1: Red（测试先行）

### Task 1.1: export.error.noProject 文案测试

**映射验收标准**: AC-1, AC-2

- [x] 测试：读取 `zh-CN.json` 中 `export.error.noProject` 的值，断言等于 `"请先打开一个项目"`
- [x] 测试：断言该值不匹配 `/^[A-Z][A-Z_]+:/`（不含大写蛇形前缀）
- [x] 测试：读取 `en.json` 中 `export.error.noProject` 的值，断言等于 `"Please open a project first"`
- [x] 测试：断言该值不匹配 `/^[A-Z][A-Z_]+:/`

**文件**: `apps/desktop/tests/i18n/error-copy-cleanup.test.ts`（新建）

### Task 1.2: rightPanel.quality.errorWithCode 文案测试

**映射验收标准**: AC-3, AC-4

- [x] 测试：读取 `zh-CN.json` 中 `rightPanel.quality.errorWithCode` 的值，断言等于 `"质量检测遇到问题"`
- [x] 测试：断言该值不包含 `{{code}}` 或 `{{errorCode}}`
- [x] 测试：读取 `en.json` 中 `rightPanel.quality.errorWithCode` 的值，断言等于 `"Quality check encountered an issue"`
- [x] 测试：断言该值不包含 `{{code}}` 或 `{{errorCode}}`

**文件**: `apps/desktop/tests/i18n/error-copy-cleanup.test.ts`

### Task 1.3: 调用点参数移除测试

**映射验收标准**: AC-5

- [x] 测试：运行当前 i18n / error-surface guard，确认 renderer 中不再以技术码参数调用 `t("rightPanel.quality.errorWithCode")`
- [x] 测试：断言相关调用点已改为不传入技术码插值参数

**文件**: `apps/desktop/tests/i18n/error-copy-cleanup.test.ts`

### Task 1.4: locale 文件全量扫描测试

**映射验收标准**: AC-6, AC-7

- [x] 测试：遍历 `zh-CN.json` 全部 key-value 对，断言无任何 value 匹配 `/^[A-Z][A-Z_]{2,}:\s/`（大写蛇形前缀 + 冒号 + 空格）
- [x] 测试：遍历 `zh-CN.json` 全部 key-value 对，断言无任何 value 包含 `{{code}}` 或 `{{errorCode}}`
- [x] 测试：遍历 `en.json` 全部 key-value 对，断言无任何 value 匹配 `/^[A-Z][A-Z_]{2,}:\s/`
- [x] 测试：遍历 `en.json` 全部 key-value 对，断言无任何 value 包含 `{{code}}` 或 `{{errorCode}}`

**文件**: `apps/desktop/tests/i18n/error-copy-cleanup.test.ts`

---

## Phase 2: Green（实现）

### Task 2.1: 修正 export.error.noProject 文案

- [x] `zh-CN.json`：将 `export.error.noProject` 的值从 `"NO_PROJECT: 请先打开一个项目"` 改为 `"请先打开一个项目"`
- [x] `en.json`：将 `export.error.noProject` 的值从 `"NO_PROJECT: Please open a project first"` 改为 `"Please open a project first"`

**文件**: `renderer/src/i18n/locales/zh-CN.json`（修改）、`renderer/src/i18n/locales/en.json`（修改）

### Task 2.2: 修正 rightPanel.quality.errorWithCode 文案

- [x] `zh-CN.json`：将 `rightPanel.quality.errorWithCode` 的值从 `"错误 ({{code}})"` 改为 `"质量检测遇到问题"`
- [x] `en.json`：将 `rightPanel.quality.errorWithCode` 的值从 `"Error ({{code}})"` 改为 `"Quality check encountered an issue"`

**文件**: `renderer/src/i18n/locales/zh-CN.json`（修改）、`renderer/src/i18n/locales/en.json`（修改）

### Task 2.3: 同步调用点——移除 {{code}} 参数传递

修改调用 `t("rightPanel.quality.errorWithCode", { code: state.error.code })` 的组件代码，移除第二个参数：

- [x] `QualityPanel.tsx`：将 `t('rightPanel.quality.errorWithCode', { code: state.error.code })` 改为 `t('rightPanel.quality.errorWithCode')`

**文件**: `renderer/src/features/rightpanel/QualityPanel.tsx`（修改）

### Task 2.4: 全量扫描并修正额外违规项

- [x] 对 `zh-CN.json` 和 `en.json` 执行全量扫描，匹配 `/^[A-Z][A-Z_]{2,}:\s/`、`/\{\{code\}\}/`、`/\{\{errorCode\}\}/` 三种模式
- [x] 对发现的额外违规 key 按文案撰写原则逐一修正
- [x] 将额外违规项补充到 Task 1.4 测试的断言中

**文件**: `renderer/src/i18n/locales/zh-CN.json`（修改）、`renderer/src/i18n/locales/en.json`（修改）

---

## Phase 3: Refactor（收尾）

### Task 3.1: 运行全量测试

- [x] 运行 `pnpm -C apps/desktop vitest run`，确认无回归
- [x] 运行 `pnpm -C apps/desktop tsc --noEmit`，确认无类型错误
- [x] 运行 `pnpm -C apps/desktop storybook:build`，确认 Storybook 可构建（前端验收）

### Task 3.2: 视觉验收

- [x] 确认导出面板无项目时展示 `"请先打开一个项目"`，不含 `NO_PROJECT` 前缀
- [x] 确认质量面板错误状态展示 `"质量检测遇到问题"`，不含 `(MODEL_NOT_READY)` 等技术码
- [x] 确认切换英文 locale 后对应文案正确展示

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
