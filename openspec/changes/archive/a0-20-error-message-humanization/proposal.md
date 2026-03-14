# A0-20 错误消息统一人话化

- **GitHub Issue**: #983（执行主入口；#982 保留历史）
- **所属任务簇**: P0-2（失败可见与错误人话化）
- **涉及模块**: ipc
- **前端验收**: 否（基础设施层）

---

## Why：为什么必须做

### 1. 用户现象

用户在 CreoNow 中触发任何失败操作时，界面上直接展示后端技术错误码与英文原始报错——`DB_ERROR: SQLITE_CONSTRAINT: UNIQUE constraint failed`、`AI_RATE_LIMITED: AI request rate limited`、`MODEL_NOT_READY: Judge model ensure is not implemented (non-E2E build)`。一个写小说的创作者，被迫阅读 SQLite 约束冲突和 HTTP 状态码。"在诗社聚会上念 SQL 语句"，这是 v0.1 不可接受的体验。

### 2. 根因

`errorMessages.ts` 中 `USER_FACING_MESSAGE_BY_CODE` 仅注册了 6 个错误码（`PROJECT_IPC_SCHEMA_INVALID`、`VALIDATION_ERROR`、`FORBIDDEN`、`INTERNAL_ERROR`、`AI_NOT_CONFIGURED`、`IPC_TIMEOUT`），系统共定义 88 个 `IpcErrorCode`，覆盖率 6.8%。`getUserFacingErrorMessage()` 的 fallback 逻辑直接 `return error.message`——即后端英文技术消息原样透传到用户界面。只要一个错误码不在映射表中，后端任何技术术语（SQLite 报错、HTTP 状态码、上游 API 名称、内部构建类型）都会暴露给用户。

### 3. v0.1 威胁

- **信任崩塌**：用户看到 `SQLITE_CONSTRAINT` 或 `Upstream returned 401` 时，不知道发生了什么、该怎么做，只会认为产品有严重缺陷
- **下游阻塞**：A0-21（错误展示组件收口）和 A0-22（i18n 错误文案修正）依赖本任务提供的全量映射函数——映射表不建立，组件收口无可调用对象
- **安全暴露**：`IO_ERROR` 透传 `ENOENT: no such file or directory, '/home/user/.creonow/xxx'` 暴露系统级文件路径；`LLM_API_ERROR` 透传 `Anthropic API error: ...` 暴露上游供应商名称

### 4. 证据来源

| 文档                                  | 章节                     | 内容                                                                                         |
| ------------------------------------- | ------------------------ | -------------------------------------------------------------------------------------------- |
| `docs/audit/amp/09-error-ux-audit.md` | §二 问题总览             | "当前 `errorMessages.ts` 仅覆盖 **6 个**错误码，系统共有 **88 个**错误码。覆盖率 **6.8%**。" |
| `docs/audit/amp/09-error-ux-audit.md` | §四 错误消息基础设施分析 | "4.3 根因：`getUserFacingErrorMessage()` 的 fallback 逻辑是直接返回 `error.message`"         |
| `docs/audit/amp/09-error-ux-audit.md` | §八 全量错误码人话映射表 | 26 个高优先级错误码的推荐中英文文案                                                          |
| `docs/audit/amp/09-error-ux-audit.md` | §九 修复方案             | "9.1 统一错误展示层——步骤 1 扩展映射表、步骤 2 修改 fallback"                                |
| `docs/audit/amp/01-master-roadmap.md` | §4.1 体验侧必修项        | "错误消息人话化：全量映射 + 统一展示层"                                                      |

---

## What：做什么

1. **扩展 `USER_FACING_MESSAGE_BY_CODE` 映射表**：为 `IpcErrorCode` 联合类型中的全部错误码注册用户友好中文文案，覆盖率从 6.8% 提升到 100%
2. **修改 fallback 逻辑**：`getUserFacingErrorMessage()` 在错误码未注册时，返回通用兜底文案（`"系统遇到了意外问题，请稍后重试"`），不再透传 `error.message`
3. **新增 i18n key**：在 `zh-CN.json` 和 `en.json` 中以 `error.code.<ERROR_CODE>` 命名空间注册全量错误码的中英文翻译，映射表改为调用 `t()` 获取翻译值
4. **重命名导出函数**：将 `getUserFacingErrorMessage` 重命名为 `getHumanErrorMessage`，使命名更准确地反映"人话化"语义；同步更新 `localizeIpcError` 内部调用
5. **类型安全约束**：映射表类型从 `Partial<Record<IpcErrorCode, ...>>` 改为 `Record<IpcErrorCode, ...>`，确保新增错误码时编译器强制要求补全映射

---

## Non-Goals：不做什么

1. **不修改任何组件的错误渲染逻辑**——15+ 处直接展示 `{error.code}: {error.message}` 的组件由 A0-21（错误展示组件收口）负责收口
2. **不修改 i18n locale 文件中已有的错误码前缀文案**（如 `export.error.noProject` 中的 `NO_PROJECT:` 前缀）——由 A0-22（i18n 错误文案修正）负责清理
3. **不增加 CI lint 规则检测 `error.code` 直接渲染**——属于后续 Phase 1+ 防护性工作
4. **不修改 `IpcError` 类型定义或新增错误码**——本任务只消费已定义的 `IpcErrorCode`，不变更 IPC 契约本身
5. **不实现上下文相关的动态错误参数**（如在 `IPC_TIMEOUT` 中插入具体超时时长以外的场景级参数）——v0.1 仅做静态映射，动态参数化留给后续迭代

---

## 依赖与影响

- **上游依赖**: A0-13（Toast 接入 App）——Toast 基础设施就绪后，人话化错误消息才有通知通道可用
- **被依赖于**: A0-21（错误展示组件收口）——组件收口需调用本任务提供的 `getHumanErrorMessage()`；A0-22（i18n 错误文案修正）——i18n 清理需本任务的 i18n key 命名空间已建立
