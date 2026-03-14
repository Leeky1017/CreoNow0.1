# Tasks: A0-02 自动保存失败可见化

- **GitHub Issue**: #992
- **分支**: `task/992-autosave-visible-failure`
- **Delta Spec**: `specs/document-management/spec.md`

---

## 验收标准

| ID    | 标准                                                                                                                                           | 对应 Scenario                            |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| AC-1  | `autosaveStatus === "error"` 时，状态栏显示错误指示（`--color-error` 文字 + `--color-error-subtle` 背景），文案为 `t("autosave.status.error")` | 自动保存失败后状态栏显示错误并触发 Toast |
| AC-2  | `autosaveStatus === "error"` 时，触发 error variant Toast，含 title / description / retry action                                               | 自动保存失败后状态栏显示错误并触发 Toast |
| AC-3  | 点击状态栏错误指示区域调用 `retryLastAutosave()`，重试成功后状态栏恢复 + 触发 success Toast                                                    | 用户通过状态栏点击重试保存成功           |
| AC-4  | 点击 Toast 重试按钮调用 `retryLastAutosave()`，行为与状态栏重试一致                                                                            | 用户通过 Toast 重试按钮重试保存          |
| AC-5  | 同一 `documentId` 连续失败不重复触发 Toast                                                                                                     | 连续失败不重复触发 Toast                 |
| AC-6  | 文档切换时 flush save 失败后，在新文档上下文触发 warning Toast                                                                                 | 文档切换时 flush save 失败的警告         |
| AC-7  | `autosaveStatus === "saved"` 时，状态栏显示 `t("autosave.status.saved")`（`--color-success`），2s 后回到 idle                                  | 保存成功时状态栏短暂显示成功后回到 idle  |
| AC-8  | 保存指示区域具有 `role="status"` + `aria-live="polite"`；error 态重试具有 `role="button"` + `aria-label`                                       | 屏幕阅读器播报保存状态变化               |
| AC-9  | 所有文案通过 `t()` 函数获取，`zh-CN.json` 和 `en.json` 包含全部 `autosave.*` key                                                               | i18n 要求                                |
| AC-10 | `autosaveStatus === "saving"` 时，状态栏显示 `t("autosave.status.saving")` + 旋转图标                                                          | 状态栏四态映射                           |

---

## Phase 1: Red（测试先行）

### Task 1.1: 状态栏保存状态指示单元测试

**映射验收标准**: AC-1, AC-7, AC-10

编写状态栏保存状态指示组件的单元测试：

- [x] 测试：`autosaveStatus === "idle"` 时，保存指示区域不渲染（或 `display: none`）
- [x] 测试：`autosaveStatus === "saving"` 时，渲染文案为 `t("autosave.status.saving")` 的指示元素，文字色匹配 `--color-fg-muted`
- [x] 测试：`autosaveStatus === "saved"` 时，渲染文案为 `t("autosave.status.saved")` 的指示元素，文字色匹配 `--color-success`
- [x] 测试：`autosaveStatus === "saved"` 后 2000ms（fake timer），状态切回 idle，指示元素消失
- [x] 测试：`autosaveStatus === "error"` 时，渲染文案为 `t("autosave.status.error")` 的指示元素，文字色匹配 `--color-error`，背景色匹配 `--color-error-subtle`

**文件**: `renderer/src/components/layout/StatusBar.test.tsx`（扩展现有文件或新建）

### Task 1.2: 状态栏重试交互测试

**映射验收标准**: AC-3

- [x] 测试：`autosaveStatus === "error"` 时，点击保存指示区域，断言 `retryLastAutosave()` 被调用
- [x] 测试：重试后 `autosaveStatus` 变为 `"saving"`，随后若成功变为 `"saved"`，状态栏显示成功指示
- [x] 测试：重试后若再次失败，`autosaveStatus` 保持 `"error"`，状态栏保持错误指示

**文件**: `renderer/src/components/layout/StatusBar.test.tsx`

### Task 1.3: 保存失败 Toast 触发测试

**映射验收标准**: AC-2, AC-4

- [x] 测试：`autosaveStatus` 从非 error 状态切换为 `"error"` 时，触发 error Toast，title 为 `t("autosave.toast.error.title")`，description 为 `t("autosave.toast.error.description")`
- [x] 测试：error Toast 包含 action 按钮，label 为 `t("autosave.toast.error.retry")`
- [x] 测试：点击 Toast 的 action 按钮，断言 `retryLastAutosave()` 被调用
- [x] 测试：重试成功后触发 success Toast，title 为 `t("autosave.toast.retrySuccess.title")`

**文件**: `tests/integration/autosave-toast.test.tsx`（新建）

### Task 1.4: 连续失败去重测试

**映射验收标准**: AC-5

- [x] 测试：同一 `documentId` 的连续两次 autosave 失败，仅触发一次 error Toast
- [x] 测试：用户重试失败后，不再触发新的 Toast
- [x] 测试：切换到新 `documentId` 后再次失败，触发新的 error Toast（不受前一文档去重限制）

**文件**: `tests/integration/autosave-toast.test.tsx`

### Task 1.5: Cleanup flush 失败 Toast 测试

**映射验收标准**: AC-6

- [x] 测试：mock `useAutosave` cleanup 中的 flush save 失败，断言在新文档上下文触发 warning Toast
- [x] 测试：warning Toast 的 title 为 `t("autosave.toast.flushError.title")`，description 为 `t("autosave.toast.flushError.description")`
- [x] 测试：warning Toast 无 action 按钮

**文件**: `tests/integration/autosave-toast.test.tsx`

### Task 1.6: 无障碍测试

**映射验收标准**: AC-8

- [x] 测试：保存指示区域具有 `role="status"` 和 `aria-live="polite"`
- [x] 测试：error 态下重试区域具有 `role="button"` 和 `aria-label` 为 `t("autosave.a11y.retryLabel")`
- [x] 测试：saving 态旋转图标具有 `aria-hidden="true"`

**文件**: `renderer/src/components/layout/StatusBar.test.tsx`

### Task 1.7: i18n key 完整性测试

**映射验收标准**: AC-9

- [x] 测试：`zh-CN.json` 和 `en.json` 均包含全部 `autosave.*` key（`autosave.status.saving`、`autosave.status.saved`、`autosave.status.error`、`autosave.toast.error.title`、`autosave.toast.error.description`、`autosave.toast.error.retry`、`autosave.toast.retrySuccess.title`、`autosave.toast.flushError.title`、`autosave.toast.flushError.description`、`autosave.a11y.retryLabel`）
- [x] 测试：中英文 key 数量一致

**文件**: `tests/i18n/autosave-keys.test.ts`（新建）

---

## Phase 2: Green（实现）

### Task 2.1: StatusBar 保存状态指示组件

实现状态栏中的自动保存状态可视化：

- [x] 在 `StatusBar` 中读取 `useEditorStore((s) => s.autosaveStatus)` 和 `s.autosaveError`
- [x] 按四种状态渲染对应 UI（idle 不显示、saving 显示旋转图标 + 文案、saved 显示成功文案、error 显示错误指示）
- [x] saved 状态 2s 后通过 `setTimeout` 切换回 idle（使用 `setAutosaveStatus("idle")`）
- [x] error 状态下整个指示区域可点击，onClick 调用 `retryLastAutosave()`
- [x] 使用语义化 Design Token，不使用 Tailwind 原始色值
- [x] 所有文案通过 `t()` 获取

**文件**: `renderer/src/components/layout/StatusBar.tsx`（修改）

### Task 2.2: 自动保存失败 Toast 触发逻辑

实现保存失败时的 Toast 通知：

- [x] 在编辑器页面（或 `StatusBar`）中监听 `autosaveStatus` 变化
- [x] 当 `autosaveStatus` 从非 error 变为 error 时，调用 `showToast()` 发送 error Toast
- [x] 实现去重逻辑：使用 `useRef` 记录已 Toast 的 `documentId`，同一文档连续失败不重复触发
- [x] Toast action 的 onClick 调用 `retryLastAutosave()`
- [x] 重试成功后调用 `showToast()` 发送 success Toast

**文件**: `renderer/src/components/layout/StatusBar.tsx`（修改）或新建 `renderer/src/features/editor/useAutosaveToast.ts`

### Task 2.3: useAutosave cleanup flush 失败反馈

修改 `useAutosave.ts`，使 cleanup 路径的 save 失败可被上层感知：

- [x] 将 cleanup 中的 `void save(...)` 改为 `save(...).catch(...)` 或 `save(...).then(...)`
- [x] 失败时调用 `setAutosaveStatus("error")` 并设置 `autosaveError`
- [x] 在 Toast 触发逻辑中，检测到切换文档后的 error 状态，触发 warning 类型的 flush 失败 Toast

**文件**: `renderer/src/features/editor/useAutosave.ts`（修改）

### Task 2.4: 新增 i18n key

- [x] 在 `zh-CN.json` 中新增 `autosave.*` 命名空间下全部 key 及中文值
- [x] 在 `en.json` 中新增相同 key 的英文翻译
- [x] 确认 key 命名符合现有 namespace 约定

**文件**: `renderer/src/i18n/locales/zh-CN.json`、`renderer/src/i18n/locales/en.json`（修改）

### Task 2.5: useAutosave 定时触发路径错误处理

改进 `useAutosave.ts` 中定时触发的 save 调用：

- [x] 将 `void save(...)` 改为消费 Promise 结果的形式（`save(...).catch(...)` 模式或在 `.then()` 中检查 `autosaveStatus`）
- [x] 注意：`editorStore.save()` 内部已经处理了 error 状态设置，此处主要确保 Promise rejection 不被吞没

**文件**: `renderer/src/features/editor/useAutosave.ts`（修改）

---

## Phase 3: Refactor

### Task 3.1: 提取 AutosaveStatusIndicator 子组件

- [x] 若 StatusBar 中保存状态指示逻辑超过 40 行，提取为独立的 `AutosaveStatusIndicator` 组件
- [x] 组件接收 `status: AutosaveStatus`、`onRetry: () => void` 作为 props
- [x] 为提取的组件补充 Storybook Story，覆盖四种状态

**文件**: `renderer/src/components/layout/AutosaveStatusIndicator.tsx`（新建，如需要）

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
