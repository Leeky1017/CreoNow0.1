# Tasks: A0-13 Toast 接入 App

- **GitHub Issue**: #981
- **分支**: `task/981-toast-app-integration`
- **Delta Spec**: `specs/workbench/spec.md`

---

## 验收标准

| ID    | 标准                                                                                                | 对应 Scenario                       |
| ----- | --------------------------------------------------------------------------------------------------- | ----------------------------------- |
| AC-1  | `ToastProvider` 和 `ToastViewport` 在 `App.tsx` Provider 树中挂载，应用启动后 Viewport DOM 节点存在 | Provider 挂载后 Toast 可触发        |
| AC-2  | `useAppToast().showToast()` 在任意子组件中可调用，触发后 Toast 渲染在 Viewport 内                   | Provider 挂载后 Toast 可触发        |
| AC-3  | 文档保存成功后出现 success Toast，标题为 i18n 翻译值                                                | 文档保存成功触发 Toast              |
| AC-4  | 文档保存失败后出现 error Toast，包含重试 action 按钮，点击按钮重新触发保存                          | 文档保存失败触发带重试的 Toast      |
| AC-5  | AI 请求失败后出现 error Toast                                                                       | AI 请求失败触发 Toast               |
| AC-6  | 导出完成后出现 success Toast                                                                        | 导出完成触发 Toast                  |
| AC-7  | 设置保存成功后出现 success Toast                                                                    | 设置保存成功触发 Toast              |
| AC-8  | error variant 的 Toast 默认 duration 为 8000ms                                                      | error variant 的 Toast 停留时间更长 |
| AC-9  | Toast 可通过 Escape 键关闭                                                                          | Toast 被键盘关闭                    |
| AC-10 | 多条 Toast 自下而上堆叠，间距 `var(--spacing-2)`                                                    | 多条 Toast 同时显示时的堆叠         |
| AC-11 | 所有 Toast 文案通过 `t()` 函数获取，无裸字符串                                                      | i18n 要求                           |

---

## Phase 1: Red（测试先行）

### Task 1.1: AppToastProvider + useAppToast 单元测试

**映射验收标准**: AC-1, AC-2

编写 `AppToastProvider` 和 `useAppToast()` 的单元测试：

- [x] 测试：在 `AppToastProvider` 包裹下调用 `showToast()`，断言 Toast DOM 节点渲染在 Viewport 内
- [x] 测试：未包裹 `AppToastProvider` 时调用 `useAppToast()` 抛出有意义的错误
- [x] 测试：`showToast({ variant: "success" })` 渲染的 Toast 边框色匹配 `--color-success`
- [x] 测试：`showToast({ variant: "error" })` 渲染的 Toast `aria-live` 属性为 `assertive`
- [x] 测试：`showToast({ variant: "success" })` 渲染的 Toast `aria-live` 属性为 `polite`

**文件**: `tests/components/AppToastProvider.test.tsx`（新建）

### Task 1.2: error variant 默认 duration 测试

**映射验收标准**: AC-8

- [x] 测试：调用 `showToast({ variant: "error" })` 时未指定 duration，Toast 在 8000ms 后消失（使用 fake timer）
- [x] 测试：调用 `showToast({ variant: "success" })` 时未指定 duration，Toast 在 5000ms 后消失（使用 fake timer）

**文件**: `tests/components/AppToastProvider.test.tsx`

### Task 1.3: 保存场景 Toast 集成测试

**映射验收标准**: AC-3, AC-4

- [x] 测试：mock `editorStore.save()` 返回成功 → 断言触发了 success Toast，标题为 `t("toast.save.success.title")` 的值
- [x] 测试：mock `editorStore.save()` 返回失败 → 断言触发了 error Toast，包含 retry action 按钮
- [x] 测试：点击 retry action → 断言 `editorStore.save()` 被再次调用

**文件**: `tests/integration/toast-save.test.tsx`（新建）

### Task 1.4: AI 错误与导出场景 Toast 集成测试

**映射验收标准**: AC-5, AC-6

- [x] 测试：mock AI 请求返回错误 → 断言触发了 error Toast
- [x] 测试：mock 导出操作完成 → 断言触发了 success Toast

**文件**: `tests/integration/toast-feedback.test.tsx`（新建）

### Task 1.5: 设置保存场景 Toast 集成测试

**映射验收标准**: AC-7

- [x] 测试：mock 设置写入成功 → 断言触发了 success Toast

**文件**: `tests/integration/toast-settings.test.tsx`（新建）

### Task 1.6: 多 Toast 堆叠测试

**映射验收标准**: AC-10

- [x] 测试：连续调用两次 `showToast()`，断言 Viewport 内存在两条 Toast DOM 节点
- [x] 测试：断言两条 Toast 按触发顺序排列

**文件**: `tests/components/AppToastProvider.test.tsx`

### Task 1.7: i18n 覆盖验证测试

**映射验收标准**: AC-11

- [x] 测试：`zh-CN.json` 和 `en.json` 包含所有 `toast.*` 相关 key（`toast.save.success.title`、`toast.save.error.title`、`toast.save.error.description`、`toast.save.error.retry`、`toast.export.success.title`、`toast.ai.error.title`、`toast.ai.error.description`、`toast.settings.success.title`）

**文件**: `tests/i18n/toast-keys.test.ts`（新建）

---

## Phase 2: Green（实现）

### Task 2.1: 创建 AppToastProvider 和 useAppToast

实现全局 Toast context：

- [x] 创建 `AppToastProvider` 组件，内部持有 Toast 列表 state，渲染 `ToastProvider` + 所有活跃 Toast + `ToastViewport`
- [x] 实现 `useAppToast()` hook，从 context 中获取 `showToast` 方法
- [x] `showToast()` 将 Toast 追加到列表，每条 Toast 有唯一 id
- [x] variant 为 `error` 时默认 duration 设为 8000ms
- [x] Toast 的 `onOpenChange(false)` 回调将该 Toast 从列表中移除

**文件**: `renderer/src/components/providers/AppToastProvider.tsx`（新建）

### Task 2.2: 在 App.tsx 挂载 AppToastProvider

- [x] 在 `App.tsx` 的 Provider 树中挂载 `AppToastProvider`，位于 `ThemeStoreProvider` 之内、其他 Store Provider 之外
- [x] 确认 `ToastViewport` 在 DOM 中正确渲染

**文件**: `renderer/src/App.tsx`（修改）

### Task 2.3: 新增 i18n key

- [x] 在 `zh-CN.json` 的 `toast` 命名空间下新增关键场景 key
- [x] 在 `en.json` 的 `toast` 命名空间下新增相同 key 的英文翻译
- [x] 确认 key 命名符合现有 namespace 约定

**文件**: `renderer/src/i18n/locales/zh-CN.json`、`renderer/src/i18n/locales/en.json`（修改）

### Task 2.4: 接入保存场景

- [x] 在保存成功路径调用 `showToast({ title: t("toast.save.success.title"), variant: "success" })`
- [x] 在保存失败路径调用 `showToast({ title: t("toast.save.error.title"), description: t("toast.save.error.description"), variant: "error", action: { label: t("toast.save.error.retry"), onClick: retrySave } })`

**文件**: 保存操作触发处（具体文件由实现 Agent 定位）

### Task 2.5: 接入 AI 错误场景

- [x] 在 AI 请求失败路径调用 `showToast({ title: t("toast.ai.error.title"), description: t("toast.ai.error.description"), variant: "error" })`

**文件**: AI 请求错误处理处（具体文件由实现 Agent 定位）

### Task 2.6: 接入导出完成场景

- [x] 在导出操作成功路径调用 `showToast({ title: t("toast.export.success.title"), variant: "success" })`

**文件**: 导出操作完成处（具体文件由实现 Agent 定位）

### Task 2.7: 接入设置保存场景

- [x] 在设置写入 Preference Store 成功后调用 `showToast({ title: t("toast.settings.success.title"), variant: "success" })`

**文件**: 设置保存处（具体文件由实现 Agent 定位）

---

## Phase 3: Refactor（收口）

### Task 3.1: Storybook Story

- [x] 为 `AppToastProvider` 创建 Story，展示：单条 success Toast、单条 error Toast（含 action）、多条 Toast 堆叠
- [x] 确认 `pnpm -C apps/desktop storybook:build` 通过

**文件**: `renderer/src/components/providers/AppToastProvider.stories.tsx`（新建）

### Task 3.2: 导出 barrel 更新

- [x] 如有 barrel 导出文件（如 `components/providers/index.ts`），将 `AppToastProvider` 和 `useAppToast` 加入导出

### Task 3.3: 全量测试回归

- [x] 执行 `pnpm -C apps/desktop test` 全量通过
- [x] 执行 `pnpm -C apps/desktop tsc --noEmit` 类型检查通过
- [x] 执行 `pnpm -C apps/desktop lint` 通过

---

## 前端验收

本变更需要前端视觉验收：

- [x] 保存成功后右下角出现 success Toast，5 秒后自动消失
- [x] 保存失败后右下角出现 error Toast，含重试按钮，8 秒后自动消失
- [x] AI 请求失败后出现 error Toast
- [x] 导出完成后出现 success Toast
- [x] 设置保存后出现 success Toast
- [x] Toast 可通过点击关闭按钮关闭
- [x] Toast 可通过左右滑动关闭
- [x] 多条 Toast 正确堆叠，不重叠
- [x] 切换至英文语言后 Toast 文案显示英文

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
