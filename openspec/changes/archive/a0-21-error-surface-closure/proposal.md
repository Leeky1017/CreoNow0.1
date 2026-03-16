# A0-21 错误展示组件收口

- **GitHub Issue**: #988
- **所属任务簇**: P0-2（失败可见与错误人话化）
- **涉及模块**: workbench
- **前端验收**: 是

---

## Why：为什么必须做

### 1. 用户现象

CreoNow 中 15+ 处组件直接将后端错误对象的 `code` 和 `message` 渲染到界面上——用户在导出对话框看到 `DB_ERROR: SQLITE_CONSTRAINT`，在质量面板看到 `MODEL_NOT_READY: Judge model ensure is not implemented (non-E2E build)`，在知识图谱面板看到 `KG_ENTITY_DUPLICATE: entity with same type and normalized name already exists`。创作者的工作台上，遍地是 SQL 约束和 HTTP 状态码。"在画室里贴满了机房日志"，这不是 v0.1 可接受的体验。

### 2. 根因

组件直接使用 `{error.code}: {error.message}` 或模板字符串 `` `${res.error.code}: ${res.error.message}` `` 渲染错误信息，而非调用 A0-20 建立的统一映射函数 `getHumanErrorMessage()`。泄露模式分两类：

- **JSX 直接渲染**：`ExportDialog`、`QualityPanel`、`VersionPreviewDialog`、`InfoPanel`、`MemoryPanel`、`AnalyticsPage`、`CreateProjectDialog`、`KnowledgeGraphPanel`、`VersionHistoryContainer` 等组件在 JSX 中直接插值 `{error.code}` 和 `{error.message}`
- **模板字符串拼接**：`JudgeSection`、`AiSettingsSection`、`DashboardPage`、`AiErrorCard`、`CommandPalette` 等组件在 JS 逻辑中将错误码和消息拼接为字符串后设入 state

### 3. v0.1 威胁

- **信任崩塌**：用户看到 `SQLITE_CONSTRAINT` 或 `Upstream returned 401` 时，无法理解发生了什么，只会认为产品质量低劣
- **安全暴露**：透传的 `error.message` 可能包含系统路径（`ENOENT: /home/user/.creonow/...`）、上游供应商名称（`Anthropic API error`）、内部构建类型（`non-E2E build`）
- **i18n 断裂**：错误文案绕开了 i18n 体系，切换语言后错误仍是英文技术消息
- **A0-20 价值归零**：A0-20 建立了全量映射函数，但如果组件不调用它，映射表形同虚设

### 4. 证据来源

| 文档                                  | 章节                                       | 内容                                                                                                                                                                                                                                                                |
| ------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/audit/amp/09-error-ux-audit.md` | §三 错误码直接暴露清单                     | 15+ 处泄露点的文件路径、行号、用户实际所见                                                                                                                                                                                                                          |
| `docs/audit/amp/09-error-ux-audit.md` | §三.1 `{error.code}: {error.message}` 模式 | ExportDialog L425/L427, QualityPanel L112-114/L197-199, VersionPreviewDialog L79, InfoPanel L151-152, MemoryPanel L498/L510, AnalyticsPage L151, CreateProjectDialog L321, KnowledgeGraphPanel L917-918/L930/L1126/L1138, VersionHistoryContainer L675-676/L727-728 |
| `docs/audit/amp/09-error-ux-audit.md` | §三.2 模板字符串拼接模式                   | JudgeSection L18/L54/L82/L85, AiSettingsSection L42/L104/L121, DashboardPage L428                                                                                                                                                                                   |
| `docs/audit/amp/09-error-ux-audit.md` | §三.3 AiErrorCard                          | AiErrorCard L768-770                                                                                                                                                                                                                                                |
| `docs/audit/amp/09-error-ux-audit.md` | §三.4 CommandPalette 硬编码                | CommandPalette L324/L341/L358/L375/L392/L406/L414/L417/L432/L449                                                                                                                                                                                                    |
| `docs/audit/amp/09-error-ux-audit.md` | §九.1 统一错误展示层                       | "步骤 3 收口所有组件：15+ 处直接渲染 error.code 的组件统一调用 getUserFacingErrorMessage()"                                                                                                                                                                         |
| `docs/audit/amp/01-master-roadmap.md` | §4.1 体验侧必修项                          | "错误消息人话化：全量映射 + 统一展示层"                                                                                                                                                                                                                             |

---

## What：做什么

1. **收口 JSX 直接渲染泄露**：将 `ExportDialog`、`QualityPanel`、`VersionPreviewDialog`、`InfoPanel`、`MemoryPanel`、`AnalyticsPage`、`CreateProjectDialog`、`KnowledgeGraphPanel`、`VersionHistoryContainer` 中直接渲染 `{error.code}` / `{error.message}` 的位置，统一替换为调用 `getHumanErrorMessage(error)` 获取用户友好文案
2. **收口模板字符串拼接泄露**：将 `JudgeSection`、`AiSettingsSection`、`DashboardPage` 中 `` `${res.error.code}: ${res.error.message}` `` 拼接模式，替换为 `getHumanErrorMessage(res.error)`
3. **收口 AiErrorCard 错误码展示**：`AiErrorCard` 在 `service_error` 状态展示 `{error.errorCode}` 的位置，改为调用 `getHumanErrorMessage()` 获取友好文案
4. **收口 CommandPalette 硬编码**：将 `CommandPalette` 中 `"ACTION_FAILED: ..."` / `"NO_PROJECT: ..."` 等硬编码错误字符串，替换为 i18n key 调用 `t("workbench.commandPalette.errors.<场景>")`，并在 `zh-CN.json` / `en.json` 中注册对应翻译
5. **错误展示样式统一**：所有错误文案展示位置**必须**使用语义化 Design Token `--color-text-error`（文字色）和 `--color-bg-error`（背景色），不得使用 Tailwind 原始色值

---

## Non-Goals：不做什么

1. **不修改 `errorMessages.ts` 映射表或 `getHumanErrorMessage()` 函数本身**——映射表的建立与维护由 A0-20 负责，本任务只消费其输出
2. **不修改 `ErrorBoundary` 或 `RegionFallback` 组件**——异常边界脱敏属于 Phase 1 工作（A1-18），不在本任务范围
3. **不替换 `window.confirm` 为应用内对话框**——原生对话框替换属于 Phase 1 工作（A1-17）
4. **不新增 CI lint 规则检测错误码直接渲染**——防护性自动化属于 Phase 2+ 工作
5. **不修改 i18n locale 文件中已有的错误码前缀文案**（如 `export.error.noProject` 中的 `NO_PROJECT:` 前缀）——由 A0-22（i18n 错误文案修正）负责清理
6. **不修改 `IpcError` 类型定义或新增错误码**——本任务只消费已定义的 `IpcErrorCode`

---

## 依赖与影响

- **上游依赖**: A0-20（错误消息统一人话化）——`getHumanErrorMessage()` 函数和全量映射表必须先就绪，本任务的组件收口才有可调用对象
- **被依赖于**: 无直接下游依赖；但本任务完成后，A0-22（i18n 错误文案修正）可无冲突地清理 i18n 文件中的错误码前缀

---

## 泄露点完整清单

以下为 `09-error-ux-audit.md` §三 中记录的全部泄露点，每一处都必须在本任务中收口：

### 类型一：JSX 直接渲染 `{error.code}: {error.message}`

| 组件                            | 文件路径                                               | 行号           | 泄露内容                                                 |
| ------------------------------- | ------------------------------------------------------ | -------------- | -------------------------------------------------------- |
| ExportDialog                    | `features/export/ExportDialog.tsx`                     | L425, L427     | `DB_ERROR` + 技术 message                                |
| QualityPanel（Judge）           | `features/rightpanel/QualityPanel.tsx`                 | L112-114       | `MODEL_NOT_READY: Judge model ensure is not implemented` |
| QualityPanel（Constraints）     | `features/rightpanel/QualityPanel.tsx`                 | L197-199       | `{error.code}: {error.message}`                          |
| VersionPreviewDialog            | `features/version-history/VersionPreviewDialog.tsx`    | L79            | `{error.code}: {error.message}`                          |
| InfoPanel                       | `features/rightpanel/InfoPanel.tsx`                    | L151-152       | `{error.code}` + `{error.message}`                       |
| MemoryPanel                     | `features/memory/MemoryPanel.tsx`                      | L498, L510     | `{state.error.code}` + `{state.error.message}`           |
| AnalyticsPage                   | `features/analytics/AnalyticsPage.tsx`                 | L151           | `{error.code}: {error.message}`                          |
| CreateProjectDialog             | `features/projects/CreateProjectDialog.tsx`            | L321           | `{lastError.code}: {lastError.message}`                  |
| KnowledgeGraphPanel（一）       | `features/kg/KnowledgeGraphPanel.tsx`                  | L917-918, L930 | `{lastError.code}` + `{lastError.message}`               |
| KnowledgeGraphPanel（二）       | `features/kg/KnowledgeGraphPanel.tsx`                  | L1126, L1138   | 同上                                                     |
| VersionHistoryContainer（合并） | `features/version-history/VersionHistoryContainer.tsx` | L675-676       | `{branchMergeError.code}: {branchMergeError.message}`    |
| VersionHistoryContainer（预览） | `features/version-history/VersionHistoryContainer.tsx` | L727-728       | `{previewError.code}: {previewError.message}`            |

### 类型二：模板字符串拼接

| 组件              | 文件路径                                  | 行号            | 拼接方式                                        |
| ----------------- | ----------------------------------------- | --------------- | ----------------------------------------------- |
| JudgeSection      | `features/settings/JudgeSection.tsx`      | L18             | `` `error (${state.error.code})` ``             |
| JudgeSection      | `features/settings/JudgeSection.tsx`      | L54, L82, L85   | `` `${res.error.code}: ${res.error.message}` `` |
| AiSettingsSection | `features/settings/AiSettingsSection.tsx` | L42, L104, L121 | `` `${res.error.code}: ${res.error.message}` `` |
| DashboardPage     | `features/dashboard/DashboardPage.tsx`    | L428            | `` `${res.error.code}: ${res.error.message}` `` |

### 类型三：AiErrorCard 错误码展示

| 组件        | 文件路径                                        | 行号     | 泄露内容                                   |
| ----------- | ----------------------------------------------- | -------- | ------------------------------------------ |
| AiErrorCard | `components/features/AiDialogs/AiErrorCard.tsx` | L768-770 | `service_error` 时展示 `{error.errorCode}` |

### 类型四：CommandPalette 硬编码

| 组件           | 文件路径                                     | 行号                   | 硬编码内容                                       |
| -------------- | -------------------------------------------- | ---------------------- | ------------------------------------------------ |
| CommandPalette | `features/commandPalette/CommandPalette.tsx` | L324                   | `"ACTION_FAILED: Settings dialog not available"` |
| CommandPalette | `features/commandPalette/CommandPalette.tsx` | L341                   | `"ACTION_FAILED: Export dialog not available"`   |
| CommandPalette | `features/commandPalette/CommandPalette.tsx` | L358, L375, L392       | Layout 相关 `ACTION_FAILED`                      |
| CommandPalette | `features/commandPalette/CommandPalette.tsx` | L406                   | `"NO_PROJECT: Please open a project first"`      |
| CommandPalette | `features/commandPalette/CommandPalette.tsx` | L414, L417, L432, L449 | 其他 `ACTION_FAILED`                             |
