# Delta Spec: ipc — 错误消息统一人话化

- **Parent Change**: `a0-20-error-message-humanization`
- **Base Spec**: `openspec/specs/ipc/spec.md`
- **GitHub Issue**: #983

---

## 新增 Requirement: 全量错误码→人话映射

系统**必须**为 `IpcErrorCode` 联合类型中的每一个错误码提供用户友好的中文文案映射，确保渲染进程展示给用户的错误消息不包含任何技术术语、英文报错或内部实现细节。

### 映射表规则

- 映射表位于 `renderer/src/lib/errorMessages.ts`，以 `Record<IpcErrorCode, ErrorMessageResolver>` 类型定义（非 `Partial`），编译器**必须**在新增错误码时强制要求补全映射
- 每个 `ErrorMessageResolver` 函数接收后端原始 `message: string` 参数，返回用户友好的中文文案
- 映射表返回的文案**必须**通过 `t()` 函数从 i18n 获取，不得在映射表中硬编码中文字符串
- `IPC_TIMEOUT` 的 resolver **必须**保留从后端 `message` 中提取超时时长（毫秒）并插入用户文案的能力

### Fallback 规则

- `getHumanErrorMessage()` 在错误码命中映射表时，**必须**返回映射表中的用户文案
- `getHumanErrorMessage()` 在错误码未命中映射表时（理论上不应发生，因 `Record` 类型保证全覆盖），**必须**返回通用兜底文案（i18n key: `error.generic`），对应中文"系统遇到了意外问题，请稍后重试"
- **禁止**在任何路径返回后端原始 `error.message`——这是本 Requirement 的核心约束

### 函数签名变更

- 将 `getUserFacingErrorMessage` 重命名为 `getHumanErrorMessage`
- 签名保持不变：`(error: { code: IpcErrorCode; message: string }) => string`
- `localizeIpcError` 内部调用同步更新为 `getHumanErrorMessage`
- 所有现有调用点（如 `ipcClient.ts`）同步更新导入

### i18n 命名空间

全量错误码的中英文翻译注册于 `zh-CN.json` 和 `en.json`，采用以下命名空间：

```
error.code.<ERROR_CODE>
```

例如：

| i18n Key                     | zh-CN 值                                 | en 值                                                 |
| ---------------------------- | ---------------------------------------- | ----------------------------------------------------- |
| `error.code.DB_ERROR`        | 数据存储遇到问题，请稍后重试             | Data storage error. Please try again                  |
| `error.code.AI_RATE_LIMITED` | AI 请求过于频繁，请稍等片刻              | AI requests are too frequent. Please wait a moment    |
| `error.code.AI_AUTH_FAILED`  | AI 服务认证失败，请检查 API Key 是否正确 | AI authentication failed. Please check your API Key   |
| `error.code.LLM_API_ERROR`   | AI 服务暂时不可用，请稍后重试            | AI service is temporarily unavailable                 |
| `error.code.IO_ERROR`        | 文件读写出错，请检查磁盘空间             | File operation failed. Please check disk space        |
| `error.code.NOT_FOUND`       | 找不到请求的内容                         | The requested content was not found                   |
| `error.code.CONFLICT`        | 内容存在冲突，请刷新后重试               | Content conflict detected. Please refresh and retry   |
| `error.code.SKILL_TIMEOUT`   | AI 处理超时，请缩短文本后重试            | AI processing timed out. Try with shorter text        |
| `error.code.NO_PROJECT`      | 请先打开一个项目                         | Please open a project first                           |
| `error.code.MODEL_NOT_READY` | AI 模型正在准备中，请稍后重试            | AI model is loading. Please try again shortly         |
| `error.code.INTERNAL_ERROR`  | 系统遇到了意外问题，请稍后重试           | Something went wrong. Please try again later          |
| `error.code.IPC_TIMEOUT`     | 请求超时，请稍后重试                     | Request timed out. Please try again                   |
| `error.generic`              | 系统遇到了意外问题，请稍后重试           | Something unexpected happened. Please try again later |

完整映射表覆盖 `IpcErrorCode` 联合类型中的全部成员（参见 `packages/shared/types/ipc-generated.ts`）。`09-error-ux-audit.md` §八 中列出的 26 个高优先级错误码的文案以该表为准，其余错误码的文案由实现 Agent 按"告诉用户发生了什么 + 该怎么做"原则撰写。

### 文案撰写原则

每条用户文案**必须**满足：

1. **说人话**：不包含英文技术术语（`constraint`、`rate limit`、`upstream`、`payload`、`schema`）、错误码标识符（`DB_ERROR`、`VALIDATION_ERROR`）、HTTP 状态码、系统路径或上游 API 名称
2. **可操作**：告诉用户下一步可以做什么（"请稍后重试"、"请检查磁盘空间"、"请检查 API Key"）
3. **不推责**：不暗示是用户的错误（不说"您的输入"，而说"输入内容"）
4. **简洁**：单条文案不超过 30 个中文字

---

### Scenario: 已注册错误码返回人话文案

- **假设** `IpcErrorCode` 中存在错误码 `DB_ERROR`，且映射表已注册该码的用户文案
- **当** 渲染进程调用 `getHumanErrorMessage({ code: "DB_ERROR", message: "SQLITE_CONSTRAINT: UNIQUE constraint failed" })`
- **则** 返回值为 i18n key `error.code.DB_ERROR` 对应的翻译值（中文环境下为 `"数据存储遇到问题，请稍后重试"`）
- **并且** 返回值不包含 `SQLITE_CONSTRAINT`、`UNIQUE constraint` 或任何英文技术术语

### Scenario: 兜底路径返回通用文案而非透传后端消息

- **假设** 映射表类型为 `Record<IpcErrorCode, ...>` 保证全覆盖，但运行时出现 TypeScript 类型系统外的未知码（如后端新增错误码但前端未同步更新）
- **当** 渲染进程调用 `getHumanErrorMessage({ code: "SOME_FUTURE_CODE" as IpcErrorCode, message: "raw backend message exposing internals" })`
- **则** 返回值为 i18n key `error.generic` 对应的翻译值（中文环境下为 `"系统遇到了意外问题，请稍后重试"`）
- **并且** 返回值**不是** `"raw backend message exposing internals"`——后端原始消息在任何情况下均不透传

### Scenario: IPC_TIMEOUT 保留超时时长参数

- **假设** 后端返回 `IPC_TIMEOUT` 错误，`message` 中包含超时时长 `(30000ms)`
- **当** 渲染进程调用 `getHumanErrorMessage({ code: "IPC_TIMEOUT", message: "Request timed out (30000ms)" })`
- **则** 返回值为 `"请求超时（30000ms），请稍后重试"`——保留了具体超时时长
- **并且** 若后端 `message` 不包含可识别的时长模式，返回 `"请求超时，请稍后重试"`（不含时长部分）

### Scenario: i18n 语言切换后错误文案跟随语言

- **假设** 用户将界面语言从中文切换为英文
- **当** 触发 `AI_RATE_LIMITED` 错误并调用 `getHumanErrorMessage({ code: "AI_RATE_LIMITED", message: "AI request rate limited" })`
- **则** 返回值为 `"AI requests are too frequent. Please wait a moment"`（英文翻译）
- **并且** 不返回中文文案 `"AI 请求过于频繁，请稍等片刻"`

### Scenario: localizeIpcError 使用重命名后的映射函数

- **假设** `localizeIpcError` 已更新内部调用为 `getHumanErrorMessage`
- **当** 调用 `localizeIpcError({ code: "FORBIDDEN", message: "Caller is not authorized", traceId: "t1", retryable: false })`
- **则** 返回的 `IpcError` 对象中 `message` 字段为 `"当前操作未授权"`
- **并且** `code`、`traceId`、`retryable`、`details` 等其他字段保持不变

### Scenario: 映射表类型完整性——新增错误码编译报错

- **假设** 开发者在 `IpcErrorCode` 联合类型中新增了 `NEW_ERROR_CODE`
- **当** 未在 `USER_FACING_MESSAGE_BY_CODE` 映射表中补全该码的 resolver
- **则** TypeScript 编译**必须**报错 `Property 'NEW_ERROR_CODE' is missing in type ...`
- **并且** 构建失败，阻止不完整映射进入代码
