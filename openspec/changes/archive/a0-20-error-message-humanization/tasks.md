# Tasks: A0-20 错误消息统一人话化

- **GitHub Issue**: #983
- **分支**: `task/983-error-message-humanization`
- **Delta Spec**: `specs/ipc/spec.md`

---

## 验收标准

| ID   | 标准                                                                                                                              | 对应 Scenario                           |
| ---- | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| AC-1 | `getHumanErrorMessage()` 对 `IpcErrorCode` 中每一个已注册错误码返回 i18n 翻译值，不返回后端原始 message                           | 已注册错误码返回人话文案                |
| AC-2 | `getHumanErrorMessage()` 对运行时出现的未知码返回通用兜底文案 `error.generic`，不透传后端 message                                 | 兜底路径返回通用文案而非透传后端消息    |
| AC-3 | `IPC_TIMEOUT` 的 resolver 从后端 message 中提取超时时长并插入用户文案                                                             | IPC_TIMEOUT 保留超时时长参数            |
| AC-4 | 界面语言切换后，`getHumanErrorMessage()` 返回对应语言的翻译值                                                                     | i18n 语言切换后错误文案跟随语言         |
| AC-5 | `localizeIpcError()` 内部调用已更新为 `getHumanErrorMessage`，行为不变                                                            | localizeIpcError 使用重命名后的映射函数 |
| AC-6 | `USER_FACING_MESSAGE_BY_CODE` 类型为 `Record<IpcErrorCode, ErrorMessageResolver>`（非 `Partial`），新增错误码未补全映射时编译报错 | 映射表类型完整性——新增错误码编译报错    |
| AC-7 | `zh-CN.json` 和 `en.json` 包含 `error.code.<每个IpcErrorCode>` 和 `error.generic` 的翻译条目                                      | i18n 覆盖                               |
| AC-8 | 所有用户文案不含英文技术术语、错误码标识符、HTTP 状态码、系统路径或上游 API 名称                                                  | 文案质量                                |

---

## Phase 1: Red（测试先行）

### Task 1.1: 全量映射覆盖测试

**映射验收标准**: AC-1, AC-6

从 `packages/shared/types/ipc-generated.ts` 导入 `IpcErrorCode` 联合类型中的全部成员，逐一验证映射表覆盖：

- [x] 测试：遍历 `IpcErrorCode` 的每一个值，调用 `getHumanErrorMessage({ code, message: "raw backend message" })`，断言返回值**不等于** `"raw backend message"`
- [x] 测试：`USER_FACING_MESSAGE_BY_CODE` 的类型为 `Record<IpcErrorCode, ErrorMessageResolver>`——通过 TypeScript 编译即可验证（但需在测试文件中显式做类型断言 `satisfies Record<IpcErrorCode, ...>`）
- [x] 测试：映射表的 key 数量等于 `IpcErrorCode` 联合类型的成员数量

**文件**: `renderer/src/lib/errorMessages.test.ts`（扩展现有文件）

### Task 1.2: 兜底路径测试

**映射验收标准**: AC-2

- [x] 测试：传入一个强制类型断言的虚构错误码 `"NONEXISTENT_CODE" as IpcErrorCode`，调用 `getHumanErrorMessage()`，断言返回值为 `error.generic` 对应的翻译值
- [x] 测试：断言兜底返回值**不包含**传入的原始 `message` 字符串

**文件**: `renderer/src/lib/errorMessages.test.ts`

### Task 1.3: IPC_TIMEOUT 参数化测试

**映射验收标准**: AC-3

- [x] 测试：`message` 为 `"Request timed out (30000ms)"` 时，返回值包含 `"30000ms"`
- [x] 测试：`message` 为 `"Request timed out (5000ms)"` 时，返回值包含 `"5000ms"`
- [x] 测试：`message` 为 `"Request timed out"` （无毫秒数）时，返回值不包含括号和数字，但仍为人话文案

**文件**: `renderer/src/lib/errorMessages.test.ts`

### Task 1.4: i18n 语言切换测试

**映射验收标准**: AC-4

- [x] 测试：在中文 locale 下调用 `getHumanErrorMessage({ code: "AI_RATE_LIMITED", ... })`，断言返回中文文案
- [x] 测试：切换到英文 locale 后重新调用，断言返回英文文案
- [x] 测试：两次调用的返回值不相等

**文件**: `renderer/src/lib/errorMessages.test.ts`

### Task 1.5: localizeIpcError 兼容性测试

**映射验收标准**: AC-5

- [x] 测试：`localizeIpcError({ code: "FORBIDDEN", message: "Caller is not authorized", traceId: "t1", retryable: false })` 返回对象中 `message` 为人话文案（`"当前操作未授权"`），`code`、`traceId`、`retryable` 保持不变
- [x] 测试：`localizeIpcError({ code: "DB_ERROR", message: "SQLITE_CONSTRAINT: ..." })` 返回的 `message` 不包含 `SQLITE_CONSTRAINT`

**文件**: `renderer/src/lib/errorMessages.test.ts`

### Task 1.6: i18n key 完整性测试

**映射验收标准**: AC-7

- [x] 测试：`zh-CN.json` 中 `error.code.*` 命名空间下的 key 数量等于 `IpcErrorCode` 联合类型的成员数量
- [x] 测试：`en.json` 中 `error.code.*` 命名空间下的 key 数量与 `zh-CN.json` 相等
- [x] 测试：`zh-CN.json` 和 `en.json` 均包含 `error.generic` key

**文件**: `renderer/src/lib/errorMessages.test.ts`（或独立的 `tests/i18n/error-keys.test.ts`）

### Task 1.7: 文案质量检测测试

**映射验收标准**: AC-8

- [x] 测试：遍历 `zh-CN.json` 中 `error.code.*` 的每一条值，断言不包含以下模式：`/[A-Z_]{3,}/`（大写蛇形标识符）、`/\d{3}/`（HTTP 状态码）、`/SQLITE|ENOENT|Anthropic|OpenAI|ipcRenderer|constraint/i`（技术术语）
- [x] 测试：遍历全部中文文案，断言每条不超过 30 个字符

**文件**: `renderer/src/lib/errorMessages.test.ts`

---

## Phase 2: Green（实现）

### Task 2.1: 新增 i18n key

在 `zh-CN.json` 和 `en.json` 中注册全量错误码翻译：

- [x] 在 `zh-CN.json` 中新增 `error.code.<每个IpcErrorCode>` 条目，文案遵循 `09-error-ux-audit.md` §八 映射表（高优先级码）和 Delta Spec 文案撰写原则（其余码）
- [x] 在 `en.json` 中新增相同结构的英文条目
- [x] 新增 `error.generic` 条目（中文 `"系统遇到了意外问题，请稍后重试"`，英文 `"Something unexpected happened. Please try again later"`）

**文件**: `renderer/src/i18n/locales/zh-CN.json`、`renderer/src/i18n/locales/en.json`（修改）

### Task 2.2: 扩展映射表并修改 fallback

重写 `errorMessages.ts`：

- [x] 将 `USER_FACING_MESSAGE_BY_CODE` 类型从 `Partial<Record<IpcErrorCode, ErrorMessageResolver>>` 改为 `Record<IpcErrorCode, ErrorMessageResolver>`
- [x] 为 `IpcErrorCode` 联合类型中的每一个成员注册 resolver，resolver 内部调用 `t("error.code.<CODE>")` 获取翻译值
- [x] `IPC_TIMEOUT` 的 resolver 保留从 `backendMessage` 提取超时时长的逻辑，使用 `t("error.code.IPC_TIMEOUT")` 作为基础文案并插入时长参数
- [x] 将 fallback 从 `return error.message` 改为 `return t("error.generic")`

**文件**: `renderer/src/lib/errorMessages.ts`（修改）

### Task 2.3: 重命名导出函数

- [x] 将 `getUserFacingErrorMessage` 重命名为 `getHumanErrorMessage`
- [x] 更新 `localizeIpcError` 内部调用为 `getHumanErrorMessage`
- [x] 更新所有导入点（`ipcClient.ts` 及其他引用文件）

**文件**: `renderer/src/lib/errorMessages.ts`（修改）、`renderer/src/lib/ipcClient.ts`（修改）、其他引用文件

### Task 2.4: 更新现有测试

- [x] 更新 `errorMessages.test.ts` 中现有测试用例的函数名引用（`getUserFacingErrorMessage` → `getHumanErrorMessage`）
- [x] 确认现有测试仍然通过（含 `localizeIpcError` 系列）

**文件**: `renderer/src/lib/errorMessages.test.ts`（修改）

---

## Phase 3: Refactor（收口）

### Task 3.1: 全量测试回归

- [x] 执行 `pnpm -C apps/desktop vitest run renderer/src/lib/errorMessages.test.ts` 全部通过
- [x] 执行 `pnpm -C apps/desktop tsc --noEmit` 类型检查通过——特别确认 `Record<IpcErrorCode, ...>` 全覆盖无缺失
- [x] 执行 `pnpm -C apps/desktop lint` 通过

### Task 3.2: 清理确认

- [x] 确认无遗留的 `getUserFacingErrorMessage` 引用（全局搜索）
- [x] 确认映射表中无硬编码中文字符串（全部走 `t()` 调用）
- [x] 确认 `errorMessages.ts` 导出列表正确（`getHumanErrorMessage`、`localizeIpcError`）

---

## 验收标准 → 测试映射

| 验收标准                   | 对应测试文件                             | 测试用例名                                      | 状态 |
| -------------------------- | ---------------------------------------- | ----------------------------------------------- | ---- |
| AC-1 全量映射覆盖          | `renderer/src/lib/errorMessages.test.ts` | 遍历 IpcErrorCode 全部成员返回非原始 message    | [ ]  |
| AC-2 兜底不透传            | `renderer/src/lib/errorMessages.test.ts` | 虚构错误码返回 error.generic 翻译值             | [ ]  |
| AC-3 IPC_TIMEOUT 参数化    | `renderer/src/lib/errorMessages.test.ts` | 超时时长提取与无时长回退                        | [ ]  |
| AC-4 i18n 语言切换         | `renderer/src/lib/errorMessages.test.ts` | 中英文 locale 切换返回对应翻译                  | [ ]  |
| AC-5 localizeIpcError 兼容 | `renderer/src/lib/errorMessages.test.ts` | localizeIpcError 结构不变 + message 人话化      | [ ]  |
| AC-6 类型完整性            | `renderer/src/lib/errorMessages.test.ts` | Record 类型断言 + key 数量等于联合成员数        | [ ]  |
| AC-7 i18n key 完整         | `renderer/src/lib/errorMessages.test.ts` | zh-CN/en error.code.\* 数量与 IpcErrorCode 对齐 | [ ]  |
| AC-8 文案无技术术语        | `renderer/src/lib/errorMessages.test.ts` | 文案禁止模式正则检测                            | [ ]  |

---

## Done 定义

- [x] 所有 Scenario 有对应测试且通过
- [x] `getHumanErrorMessage()` 对全部 `IpcErrorCode` 返回 i18n 翻译值
- [x] fallback 路径不透传后端原始 message
- [x] `zh-CN.json` 和 `en.json` 包含全量 `error.code.*` 条目
- [x] `getUserFacingErrorMessage` 旧名称无遗留引用
- [x] PR body 包含 `Closes #983`
- [x] 审计评论闭环完成（PRE-AUDIT → RE-AUDIT → FINAL-VERDICT）

---

## TDD 规范引用

> 本 Change 的所有测试必须遵循 `docs/references/testing/` 中的规范。开始写测试前，先阅读以下文档。

**必读文档**：

- 测试哲学与反模式：`docs/references/testing/01-philosophy-and-anti-patterns.md`
- 测试类型决策树：`docs/references/testing/02-test-type-decision-guide.md`
- 后端测试模式：`docs/references/testing/04-backend-testing-patterns.md`
- 命令与 CI 映射：`docs/references/testing/07-test-command-and-ci-map.md`

**本地验证命令**：

```bash
pnpm -C apps/desktop vitest run <test-file-pattern>   # 单元/集成测试
pnpm typecheck                                         # 类型检查
pnpm lint                                              # ESLint
```

**五大反模式（Red Line）**：

1. ❌ 字符串匹配源码检测实现 → 用行为断言
2. ❌ 只验证存在性（`toBeTruthy`）→ 验证具体值（`toEqual`）
3. ❌ 过度 mock 导致测的是 mock 本身 → 只 mock 边界依赖
4. ❌ 仅测 happy path → 必须覆盖 edge + error 路径
5. ❌ 无意义测试名称 → 名称必须说明前置条件和预期行为
