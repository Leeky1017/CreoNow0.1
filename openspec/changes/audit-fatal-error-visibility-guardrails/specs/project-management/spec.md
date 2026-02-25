# Project Management Specification Delta

更新时间：2026-02-25 23:50

## Change: audit-fatal-error-visibility-guardrails

### Requirement: CreateProjectDialog 项目创建失败必须向用户展示可见错误 [ADDED]

`CreateProjectDialog.tsx:456` 的 catch 块在项目创建失败时仅重置 submitting 状态，不向用户展示任何错误信息。**必须**捕获错误并通过 UI 状态展示用户可见的错误提示。

#### Scenario: AUD-C2-S3 项目创建失败时用户看到错误提示 [ADDED]

- **假设** 用户在 CreateProjectDialog 中填写项目信息并点击创建
- **当** 后端项目创建 IPC 调用返回错误或抛出异常
- **则** 对话框展示用户可读的错误提示信息（如"项目创建失败，请重试"）
- **并且** submitting 状态被重置为 false，用户可重新操作

#### Scenario: AUD-C2-S4 项目创建失败的错误信息包含可诊断上下文 [ADDED]

- **假设** 项目创建因特定原因失败（如名称冲突、磁盘空间不足）
- **当** catch 块处理该错误
- **则** 错误提示中包含足够的上下文信息帮助用户理解失败原因
- **并且** 同时通过 `console.error` 记录完整错误详情供开发者诊断
