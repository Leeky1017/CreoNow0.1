# Tasks: A0-03 渲染进程全局错误兜底

- **GitHub Issue**: #993
- **分支**: `task/993-renderer-global-error-fallback`
- **Delta Spec**: `specs/workbench/spec.md`

---

## 验收标准

| ID | 标准 | 对应 Scenario |
|----|------|--------------|
| AC-1 | 未处理的 Promise rejection 触发 error Toast，标题为 `t("globalError.toast.title")`，描述为 `t("globalError.toast.description")` | 未处理的 Promise rejection 触发 Toast 通知并写入日志 |
| AC-2 | 未处理的 Promise rejection 通过 IPC 将 `GlobalErrorEntry`（含 `source: 'unhandledrejection'`）发送到主进程写入日志 | 未处理的 Promise rejection 触发 Toast 通知并写入日志 |
| AC-3 | `setTimeout` 等非 render 阶段的同步异常触发 error Toast 并通过 IPC 写入日志（`source: 'error'`） | 非 React render 阶段的同步错误触发 Toast 通知并写入日志 |
| AC-4 | 同一 `name + message` 的异常在 1000ms 窗口内仅触发 1 次 Toast | 短时间内重复异常仅触发一次 Toast |
| AC-5 | 去重不影响日志落盘——每条异常均通过 IPC 发送 | 短时间内重复异常仅触发一次 Toast |
| AC-6 | 日志 IPC 调用失败不触发新 Toast、不产生递归 `unhandledrejection` | 日志 IPC 调用失败不触发递归错误 |
| AC-7 | 已被业务 `.catch()` / `try-catch` 处理的异常不触发全局兜底 | 已被业务代码捕获的异常不触发全局兜底 |
| AC-8 | 全局监听器在 `ReactDOM.createRoot().render()` 之前注册 | N/A（代码结构约束） |
| AC-9 | `zh-CN.json` 和 `en.json` 包含 `globalError.toast.title` 和 `globalError.toast.description` | i18n 要求 |

---

## Phase 1: Red（测试先行）

### Task 1.1: `installGlobalErrorHandlers` 单元测试 — unhandledrejection 捕获

**映射验收标准**: AC-1, AC-2

编写 `installGlobalErrorHandlers` 函数的单元测试，验证 `unhandledrejection` 事件的捕获行为：

- [ ] 测试：调用 `installGlobalErrorHandlers({ onError })` 后，`window` 上存在 `unhandledrejection` 事件监听器
- [ ] 测试：dispatch 一个 `PromiseRejectionEvent`（reason 为 `new Error('IPC timeout')`），`onError` 被调用，接收的 `GlobalErrorEntry.source` 为 `'unhandledrejection'`，`name` 为 `'Error'`，`message` 为 `'IPC timeout'`
- [ ] 测试：dispatch 一个 `PromiseRejectionEvent`（reason 为非 Error 值，如字符串 `'raw rejection'`），`onError` 被调用，`name` 为 `'UnknownError'`，`message` 为 `'raw rejection'`
- [ ] 测试：调用返回的卸载函数后，再 dispatch `PromiseRejectionEvent`，`onError` 不被调用

**文件**: `renderer/src/lib/globalErrorHandlers.test.ts`（新建）

### Task 1.2: `installGlobalErrorHandlers` 单元测试 — error 捕获

**映射验收标准**: AC-3

编写 `error` 事件的捕获行为测试：

- [ ] 测试：dispatch 一个 `ErrorEvent`（error 为 `new TypeError('Cannot read properties of undefined')`），`onError` 被调用，`source` 为 `'error'`，`name` 为 `'TypeError'`
- [ ] 测试：dispatch 一个 `ErrorEvent`（error 为 `undefined`，仅有 `message`），`onError` 被调用，`name` 为 `'UnknownError'`
- [ ] 测试：调用卸载函数后，再 dispatch `ErrorEvent`，`onError` 不被调用

**文件**: `renderer/src/lib/globalErrorHandlers.test.ts`

### Task 1.3: Toast 去重逻辑单元测试

**映射验收标准**: AC-4, AC-5

编写去重防护的单元测试（使用 `vi.useFakeTimers()`）：

- [ ] 测试：同一 `name + message` 组合在 1000ms 内触发 3 次，`showToast` 仅被调用 1 次
- [ ] 测试：同一组合第 1 次触发后等待 1001ms（`vi.advanceTimersByTime`），第 2 次触发，`showToast` 被调用第 2 次（冷却已过）
- [ ] 测试：不同 `name + message` 组合在 200ms 内各触发 1 次，`showToast` 被调用 2 次
- [ ] 测试：去重仅影响 Toast——每次触发时日志回调均被调用（3 次触发 → 日志回调 3 次）

**文件**: `renderer/src/lib/globalErrorHandlers.test.ts`

### Task 1.4: 日志 IPC 调用失败防递归测试

**映射验收标准**: AC-6

- [ ] 测试：mock `invoke('log:renderer-error', ...)` 抛出异常，全局兜底 handler 不触发新的 Toast
- [ ] 测试：mock `invoke` 抛出异常后，`console.error` 被调用一次（静默记录）
- [ ] 测试：日志 IPC 失败不产生新的 `unhandledrejection` 事件（不递归）

**文件**: `renderer/src/lib/globalErrorHandlers.test.ts`

### Task 1.5: `main.tsx` 集成测试 — 注册时序

**映射验收标准**: AC-8

- [ ] 测试：`installGlobalErrorHandlers` 在 `ReactDOM.createRoot` 之前被调用（通过 mock 两个函数，断言调用顺序）

**文件**: `renderer/src/main.test.ts`（新建，或扩展已有）

### Task 1.6: i18n key 完整性测试

**映射验收标准**: AC-9

- [ ] 测试：`zh-CN.json` 和 `en.json` 均包含 `globalError.toast.title` 和 `globalError.toast.description`
- [ ] 测试：中英文 key 值均为非空字符串

**文件**: `tests/i18n/global-error-keys.test.ts`（新建）

---

## Phase 2: Green（实现）

### Task 2.1: 新增 `GlobalErrorEntry` 类型定义

定义全局错误条目的数据结构：

- [ ] 在 `renderer/src/lib/globalErrorHandlers.ts` 中导出 `GlobalErrorEntry` interface
- [ ] 包含字段：`source`（`'unhandledrejection' | 'error'`）、`name`（string）、`message`（string）、`stack`（string | undefined）、`timestamp`（string，ISO 8601）

**文件**: `renderer/src/lib/globalErrorHandlers.ts`（新建）

### Task 2.2: 实现 `installGlobalErrorHandlers` 函数

实现全局异常监听器注册：

- [ ] 注册 `window.addEventListener('unhandledrejection', handler)`
  - 从 `event.reason` 提取错误信息：若为 `Error` 实例，取 `name` / `message` / `stack`；否则取 `String(reason)` 作为 message，name 为 `'UnknownError'`
  - 调用 `event.preventDefault()` 阻止浏览器默认控制台输出
  - 构造 `GlobalErrorEntry` 并传递给 `options.onError`
- [ ] 注册 `window.addEventListener('error', handler)`
  - 从 `event.error` 提取错误信息；若 `event.error` 为 `undefined`，使用 `event.message` 和 `'UnknownError'`
  - 构造 `GlobalErrorEntry` 并传递给 `options.onError`
- [ ] 返回卸载函数，调用时移除两个监听器

**文件**: `renderer/src/lib/globalErrorHandlers.ts`

### Task 2.3: 实现 Toast 去重逻辑

实现全局错误 Toast 的去重防护：

- [ ] 维护一个 `Map<string, number>` 记录去重键（`name + ':' + message`）的上次 Toast 触发时间戳
- [ ] 新错误到达时，检查去重键的上次触发时间是否在 1000ms 以内；若是则跳过 Toast
- [ ] 超过冷却期或新键则触发 Toast 并更新时间戳
- [ ] 去重逻辑封装在 `globalErrorHandlers.ts` 内部或导出为可测试的辅助函数

**文件**: `renderer/src/lib/globalErrorHandlers.ts`

### Task 2.4: 实现日志 IPC 调用

将错误条目发送到主进程写入磁盘日志：

- [ ] 在 `onError` 回调中调用 `invoke('log:renderer-error', entry)`
- [ ] IPC 调用使用 `void invoke(...).catch((err) => console.error(...))` 模式——发送失败仅 console.error，不抛出
- [ ] 确保 `invoke` 的 `.catch()` handler 内不触发任何可能产生新 `unhandledrejection` 的操作

**文件**: `renderer/src/lib/globalErrorHandlers.ts` 或 `renderer/src/main.tsx`（在 `onError` 回调中）

### Task 2.5: 在 `main.tsx` 中注册全局错误兜底

将全局错误兜底接入应用入口：

- [ ] 在 `ReactDOM.createRoot(rootEl).render(...)` 之前调用 `installGlobalErrorHandlers({ onError })`
- [ ] `onError` 回调中执行两件事：(1) 调用 `showToast`（含去重）；(2) 调用日志 IPC
- [ ] Toast 调用需要导入并使用 `useToast` 暴露的命令式 API（或直接调用 Toast store）

**文件**: `renderer/src/main.tsx`（修改）

### Task 2.6: 新增 IPC 通道 `log:renderer-error`

在主进程中实现日志接收与写入：

- [ ] 注册 IPC handler `log:renderer-error`，接收 `GlobalErrorEntry` 对象
- [ ] 将条目序列化为 JSON 单行，追加写入 `userData/logs/renderer-errors.log`
- [ ] 日志文件大小超过 5MB 时执行轮转（保留后半部分，删除前半部分）
- [ ] 写入失败时 `console.error` 静默记录，不向 renderer 返回错误

**文件**: `main/src/services/logService.ts`（新建或扩展已有日志服务）

### Task 2.7: 新增 i18n key

- [ ] 在 `zh-CN.json` 中新增 `globalError.toast.title` 和 `globalError.toast.description`
- [ ] 在 `en.json` 中新增相同 key 的英文翻译
- [ ] 确认 key 命名符合现有 namespace 约定

**文件**: `renderer/src/i18n/locales/zh-CN.json`、`renderer/src/i18n/locales/en.json`（修改）

### Task 2.8: Preload 层暴露 `log:renderer-error` 通道

- [ ] 在 preload 的 IPC 通道白名单中注册 `log:renderer-error`
- [ ] 确保 renderer 可通过 `invoke` 正常调用该通道

**文件**: `preload/src/index.ts`（修改）

---

## Phase 3: Refactor

### Task 3.1: 评估 `onError` 回调拆分

- [ ] 若 `main.tsx` 中的 `onError` 回调超过 20 行，提取为独立函数 `handleGlobalError` 放入 `globalErrorHandlers.ts`
- [ ] 确保提取后 Toast 调用和日志 IPC 调用的职责清晰分离

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
