# CreoNow 错误体验审查


> "知屋漏者在宇下，知政失者在草野。"——用户感知到的错误，不是你的 error code，而是"这个软件不懂我在说什么"。把 `DB_ERROR` 扔给写小说的人，就像在诗社聚会上念 SQL 语句。

---

## 文件索引

| § | 章节 | 内容 |
|---|------|------|
| 一 | 审查原则 | 错误呈现的"用户体感"标准 |
| 二 | 问题总览 | 当前错误暴露的全景 |
| 三 | 错误码直接暴露清单 | 每一处泄露点的文件、行号、用户实际所见 |
| 四 | 错误消息基础设施分析 | `errorMessages.ts` 覆盖范围与缺口 |
| 五 | i18n 中的技术文案 | 国际化文件中写死的错误码 |
| 六 | ErrorBoundary 与 RegionFallback | 异常边界的信息泄露 |
| 七 | 原生对话框 | `window.confirm` 的体验降级 |
| 八 | 全量错误码人话映射表 | 每个 IPC 错误码的推荐用户文案 |
| 九 | 修复方案 | 统一错误展示层的架构设计 |
| 十 | v0.1 必修清单 | 先做 / 再做 / 后做 |

---

## 一、审查原则

错误消息的好坏标准只有一个：**用户看到后，能知道发生了什么、该怎么办。**

以下任何一种都算不合格：

- 用户看到 `DB_ERROR`——他不知道什么是 DB
- 用户看到 `AI_RATE_LIMITED`——他不知道什么是 rate limit
- 用户看到 `INTERNAL_ERROR: something went wrong`——他不知道是他的问题还是软件的问题
- 用户看到 `NO_PROJECT: Please open a project first`——错误码不该出现在面向用户的文案中

---

## 二、问题总览

| 暴露类型 | 数量 | 典型表现 | 时序 |
|----------|------|----------|------|
| 直接展示给用户 | 15+ 处 | `{error.code}: {error.message}` 直接渲染为 UI 文本 | 先做 |
| 在错误状态中展示 | 5+ 处 | AiErrorCard、ErrorBoundary、RegionFallback 展示技术详情 | 再做 |
| 体验降级 | 3 处 | `window.confirm` 原生对话框 | 再做 |

当前 `errorMessages.ts` 仅覆盖 **6 个**错误码，系统共有 **88 个**错误码。覆盖率 **6.8%**。

---

## 三、错误码直接暴露清单

### 3.1 `{error.code}: {error.message}` 模式

这是最普遍的泄露模式——组件直接把 IPC 错误对象的 `code` 和 `message` 渲染到页面上。

| 组件 | 文件路径 | 行号 | 用户看到什么 |
|------|----------|------|-------------|
| ExportDialog | `features/export/ExportDialog.tsx` | L425, L427 | `DB_ERROR` + 技术 message |
| QualityPanel（Judge） | `features/rightpanel/QualityPanel.tsx` | L112-114 | `MODEL_NOT_READY: Judge model ensure is not implemented` |
| QualityPanel（Constraints） | `features/rightpanel/QualityPanel.tsx` | L197-199 | `{error.code}: {error.message}` |
| VersionPreviewDialog | `features/version-history/VersionPreviewDialog.tsx` | L79 | `{error.code}: {error.message}` |
| InfoPanel | `features/rightpanel/InfoPanel.tsx` | L151-152 | `{error.code}` + `{error.message}` |
| MemoryPanel | `features/memory/MemoryPanel.tsx` | L498, L510 | `{state.error.code}` + `{state.error.message}` |
| AnalyticsPage | `features/analytics/AnalyticsPage.tsx` | L151 | `{error.code}: {error.message}` |
| CreateProjectDialog | `features/projects/CreateProjectDialog.tsx` | L321 | `{lastError.code}: {lastError.message}` |
| KnowledgeGraphPanel（第一处） | `features/kg/KnowledgeGraphPanel.tsx` | L917-918, L930 | `{lastError.code}` + `{lastError.message}` |
| KnowledgeGraphPanel（第二处） | `features/kg/KnowledgeGraphPanel.tsx` | L1126, L1138 | 同上 |
| VersionHistoryContainer（合并） | `features/version-history/VersionHistoryContainer.tsx` | L675-676 | `{branchMergeError.code}: {branchMergeError.message}` |
| VersionHistoryContainer（预览） | `features/version-history/VersionHistoryContainer.tsx` | L727-728 | `{previewError.code}: {previewError.message}` |

### 3.2 模板字符串拼接模式

这些组件在 JS 逻辑中将 `error.code` 和 `error.message` 拼接为字符串，再设置到 state 中展示。

| 组件 | 文件路径 | 行号 | 拼接方式 |
|------|----------|------|----------|
| JudgeSection | `features/settings/JudgeSection.tsx` | L18 | `` `error (${state.error.code})` `` |
| JudgeSection | `features/settings/JudgeSection.tsx` | L54 | `` `${res.error.code}: ${res.error.message}` `` |
| JudgeSection | `features/settings/JudgeSection.tsx` | L82, L85 | 同上 |
| AiSettingsSection | `features/settings/AiSettingsSection.tsx` | L42 | `` `${res.error.code}: ${res.error.message}` `` |
| AiSettingsSection | `features/settings/AiSettingsSection.tsx` | L104 | 同上 |
| AiSettingsSection | `features/settings/AiSettingsSection.tsx` | L121 | 同上 |
| DashboardPage | `features/dashboard/DashboardPage.tsx` | L428 | `` `${res.error.code}: ${res.error.message}` `` |

### 3.3 AiErrorCard

| 组件 | 文件路径 | 行号 | 泄露内容 |
|------|----------|------|----------|
| AiErrorCard | `components/features/AiDialogs/AiErrorCard.tsx` | L768-770 | `service_error` 时展示 `{error.errorCode}`（如 `DB_ERROR`、`AI_RATE_LIMITED`） |

### 3.4 CommandPalette 硬编码

| 组件 | 文件路径 | 行号 | 硬编码内容 |
|------|----------|------|-----------|
| CommandPalette | `features/commandPalette/CommandPalette.tsx` | L324 | `"ACTION_FAILED: Settings dialog not available"` |
| CommandPalette | `features/commandPalette/CommandPalette.tsx` | L341 | `"ACTION_FAILED: Export dialog not available"` |
| CommandPalette | `features/commandPalette/CommandPalette.tsx` | L358, L375, L392 | Layout 相关 `ACTION_FAILED` |
| CommandPalette | `features/commandPalette/CommandPalette.tsx` | L406 | `"NO_PROJECT: Please open a project first"` |
| CommandPalette | `features/commandPalette/CommandPalette.tsx` | L414, L417, L432, L449 | 其他 `ACTION_FAILED` |

---

## 四、错误消息基础设施分析

### 4.1 当前覆盖

`errorMessages.ts`（`renderer/src/lib/errorMessages.ts`）：

| 错误码 | 用户文案 |
|--------|----------|
| `PROJECT_IPC_SCHEMA_INVALID` | 项目请求参数不符合契约 |
| `VALIDATION_ERROR` | 请求参数不符合契约 |
| `FORBIDDEN` | 调用方未授权 |
| `INTERNAL_ERROR` | 内部错误 |
| `AI_NOT_CONFIGURED` | 请先在设置中配置 AI API Key |
| `IPC_TIMEOUT` | 请求超时（含耗时） |

### 4.2 覆盖缺口

以下错误码在系统中存在且会触达用户，但 `errorMessages.ts` 未覆盖——触发时直接透传后端原始 `error.message`：

| 错误码 | 可能的后端 message | 用户实际看到 |
|--------|-------------------|-------------|
| `DB_ERROR` | `SQLITE_CONSTRAINT: UNIQUE constraint failed` | 完整 SQLite 报错 |
| `AI_RATE_LIMITED` | `AI request rate limited` | 英文技术短语 |
| `AI_AUTH_FAILED` | `Upstream returned 401` | HTTP 状态码 |
| `LLM_API_ERROR` | `Anthropic API error: ...` | 上游 API 名称暴露 |
| `IO_ERROR` | `ENOENT: no such file or directory` | 系统级路径暴露 |
| `NOT_FOUND` | `document not found` | 英文 |
| `CONFLICT` | `version conflict` | 英文 |
| `SKILL_TIMEOUT` | `skill execution timed out` | 英文 |
| `NO_PROJECT` | `no project loaded` | 英文 |
| `UNSUPPORTED` | `unsupported export format` | 英文 |
| `MODEL_NOT_READY` | `Judge model ensure is not implemented (non-E2E build)` | 暴露内部构建类型 |
| `KG_ENTITY_DUPLICATE` | `entity with same type and normalized name already exists` | 英文技术描述 |
| `DOCUMENT_SAVE_CONFLICT` | `document save conflict` | 英文 |
| `VERSION_DIFF_PAYLOAD_TOO_LARGE` | `Diff payload too large for merge` | 英文技术术语 |
| `INVALID_ARGUMENT` | `query is required` / `query is too long` | 英文 |
| `MEMORY_CAPACITY_EXCEEDED` | 容量超限 | 英文 |

### 4.3 根因

`getUserFacingErrorMessage()` 的 fallback 逻辑是 **直接返回 `error.message`**：

```typescript
if (!resolver) {
  return error.message; // 后端原始消息直接透传
}
```

这意味着：只要一个错误码没在映射表里注册，后端的任何英文技术消息都会原样出现在 UI 中。

---

## 五、i18n 中的技术文案

国际化文件本身也存在技术术语泄露：

| i18n Key | zh-CN 值 | 问题 |
|----------|----------|------|
| `export.error.noProject` | `"NO_PROJECT: 请先打开一个项目"` | 错误码 `NO_PROJECT:` 前缀不应出现 |
| `rightPanel.quality.errorWithCode` | `"错误 ({{code}})"` | `{{code}}` 插值会展示 `MODEL_NOT_READY` 等技术码 |

对应英文值同样有问题：

| i18n Key | en 值 |
|----------|-------|
| `export.error.noProject` | `"NO_PROJECT: Please open a project first"` |
| `rightPanel.quality.errorWithCode` | `"Error ({{code}})"` |

---

## 六、ErrorBoundary 与 RegionFallback

### 6.1 ErrorBoundary

`components/patterns/ErrorBoundary.tsx` L48-49, L125-131：

- 构建 `details` 字符串：`` `${error.name}: ${error.message}` ``
- 在 `<pre>` 标签中展示完整 details + component stack
- 目的是诊断（可复制），但对普通用户来说是一堆看不懂的代码

### 6.2 RegionErrorBoundary / RegionFallback

- `RegionErrorBoundary.tsx` L25-26：将 `error.message` 传入 fallback 组件
- `RegionFallback.tsx` L36-38：直接展示 `{errorMessage}`
- `Error.message` 可能包含 stack trace 片段或内部模块路径

---

## 七、原生对话框

桌面应用使用 `window.confirm` 是体验降级——原生弹窗外观与应用主题不一致，无法自定义按钮文案和样式。

| 文件 | 行号 | 场景 | 问题 |
|------|------|------|------|
| `MemoryPanel.tsx` | L230 | 删除规则确认 | `window.confirm(t('memory.panel.confirmDeleteRule'))` |
| `EditorPane.tsx` | L615-616 | Final 文档编辑确认 | `window.confirm("This document is final...")` — 且为英文硬编码 |
| `EditorPane.tsx` | L906-907 | 粘贴超限确认 | `window.confirm(t('editor.pane.pasteLimitExceeded'))` |

---

## 八、全量错误码人话映射表

以下是推荐的用户面向文案，应全部注册到 `errorMessages.ts` 的 `USER_FACING_MESSAGE_BY_CODE` 映射中：

| 错误码 | 推荐中文文案 | 推荐英文文案 |
|--------|-------------|-------------|
| `PROJECT_IPC_SCHEMA_INVALID` | 请求参数不符合要求 | Request parameters are invalid |
| `VALIDATION_ERROR` | 输入内容不符合要求 | Input does not meet requirements |
| `FORBIDDEN` | 当前操作未授权 | This action is not authorized |
| `INTERNAL_ERROR` | 系统遇到了意外问题，请稍后重试 | Something went wrong. Please try again later |
| `AI_NOT_CONFIGURED` | 请先在设置中配置 AI API Key | Please configure your AI API Key in Settings |
| `IPC_TIMEOUT` | 请求超时，请稍后重试 | Request timed out. Please try again |
| `DB_ERROR` | 数据存储遇到问题，请稍后重试 | Data storage error. Please try again |
| `AI_RATE_LIMITED` | AI 请求过于频繁，请稍等片刻 | AI requests are too frequent. Please wait a moment |
| `AI_AUTH_FAILED` | AI 服务认证失败，请检查 API Key 是否正确 | AI authentication failed. Please check your API Key |
| `LLM_API_ERROR` | AI 服务暂时不可用，请稍后重试 | AI service is temporarily unavailable |
| `IO_ERROR` | 文件读写出错，请检查磁盘空间 | File operation failed. Please check disk space |
| `NOT_FOUND` | 找不到请求的内容 | The requested content was not found |
| `CONFLICT` | 内容存在冲突，请刷新后重试 | Content conflict detected. Please refresh and retry |
| `SKILL_TIMEOUT` | AI 处理超时，请缩短文本后重试 | AI processing timed out. Try with shorter text |
| `TIMEOUT` | 操作超时，请稍后重试 | Operation timed out. Please try again |
| `NO_PROJECT` | 请先打开一个项目 | Please open a project first |
| `UNSUPPORTED` | 当前不支持此操作 | This operation is not supported |
| `MODEL_NOT_READY` | AI 模型正在准备中，请稍后重试 | AI model is loading. Please try again shortly |
| `KG_ENTITY_DUPLICATE` | 已存在同名同类型的实体 | An entity with this name and type already exists |
| `DOCUMENT_SAVE_CONFLICT` | 文档保存冲突，内容可能已被修改 | Document save conflict. Content may have been modified |
| `VERSION_DIFF_PAYLOAD_TOO_LARGE` | 文档变更过大，无法比较 | Document changes are too large to compare |
| `INVALID_ARGUMENT` | 输入内容有误，请检查后重试 | Invalid input. Please check and try again |
| `MEMORY_CAPACITY_EXCEEDED` | 记忆存储已满，旧记忆将被整理 | Memory storage is full. Older memories will be organized |
| `DOCUMENT_SIZE_LIMIT_EXCEEDED` | 文档超出大小限制 | Document exceeds size limit |
| `AI_STREAM_ERROR` | AI 响应中断，请重试 | AI response interrupted. Please retry |
| `CANCELLED` | 操作已取消 | Operation cancelled |

> 以上映射应同时注册到 i18n 文件中（`zh-CN.json` / `en.json`），由 `errorMessages.ts` 调用 `t()` 获取。

---

## 九、修复方案

### 9.1 统一错误展示层

**核心原则**：所有面向用户的错误展示，必须经过 `getUserFacingErrorMessage()` 转译，**禁止直接渲染 `error.code` 或 `error.message`**。

**实施步骤**：

1. **扩展 `errorMessages.ts`**：将第八章全量映射表注册到 `USER_FACING_MESSAGE_BY_CODE`，覆盖全部 88 个错误码
2. **修改 fallback 逻辑**：未注册的错误码不再透传 `error.message`，改为通用文案"系统遇到问题，请稍后重试"
3. **收口所有组件**：15+ 处直接渲染 `error.code` 的组件统一调用 `getUserFacingErrorMessage()`
4. **修正 i18n 文案**：删除所有 i18n key 中的错误码前缀（如 `NO_PROJECT:`）
5. **CommandPalette 脱硬编码**：将 `ACTION_FAILED:` / `NO_PROJECT:` 等硬编码改为 i18n key
6. **ErrorBoundary 脱敏**：details 区域折叠为"技术详情"可展开区，默认不展示
7. **RegionFallback 脱敏**：不直接展示 `error.message`，改为通用区域错误提示
8. **替换 `window.confirm`**：使用应用内确认对话框组件

### 9.2 CI 级防护

在 `errorMessages.ts` 全量覆盖后，增加一条 lint 规则或 guard test：

- 检测 renderer 代码中是否存在 `error.code` 直接渲染到 JSX 的模式
- 检测是否存在 `${error.code}:` 或 `${res.error.code}:` 的模板字符串拼接

---

## 十、v0.1 必修清单

### 10.1 先做（Phase 0）

| ID | 任务 | 涉及文件数 |
|----|------|-----------|
| A0-20 | 扩展 `errorMessages.ts` 覆盖全量错误码 | 1 |
| A0-21 | 15+ 处组件统一走 `getUserFacingErrorMessage()` | 12+ |
| A0-22 | 清除 i18n 中的错误码前缀 + CommandPalette 脱硬编码 | 4+ |

### 10.2 再做（Phase 1）

| ID | 任务 | 涉及文件数 |
|----|------|-----------|
| A1-17 | `window.confirm` 替换为应用对话框 | 2 |
| A1-18 | ErrorBoundary / RegionFallback 脱敏 | 2 |
| A1-19 | CommandPalette 错误文案人话化 | 1 |
| A1-20 | AiErrorCard `service_error` 脱敏 | 1 |

### 10.3 后做（Phase 2+）

| ID | 任务 |
|----|------|
| — | CI lint 规则防止新增错误码泄露 |
| — | 错误消息 A/B 测试与用户反馈迭代 |

---

> 一个写作工具的错误消息，应该像一个耐心的编辑对作者说的话——告诉他发生了什么，该怎么做，而不是把排版引擎的报错甩在他脸上。"言之无文，行而不远。"错误消息也是产品文案的一部分，值得被认真对待。
