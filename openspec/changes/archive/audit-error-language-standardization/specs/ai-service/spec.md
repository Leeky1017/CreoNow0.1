# AI Service Specification Delta

更新时间：2026-02-25 23:50

## Change: audit-error-language-standardization

### Requirement: runtime-validation.ts 中文硬编码错误消息必须替换为英文 [ADDED]

`runtime-validation.ts` 中 6 处硬编码中文错误消息**必须**替换为英文 error code + 英文 message 格式，保持与后端 IPC 错误规范一致。

#### Scenario: AUD-C13-S4 runtime-validation 错误消息全部英文化 [ADDED]

- **假设** `runtime-validation.ts` 当前包含 6 处中文硬编码错误消息
- **当** 执行本次变更的错误消息替换
- **则** 所有 6 处错误消息替换为英文 error code + 英文 message
- **并且** 在 `runtime-validation.ts` 中搜索中文字符（Unicode `\u4e00-\u9fff` 范围）结果为零

#### Scenario: AUD-C13-S5 runtime-validation 错误消息替换后功能不变 [ADDED]

- **假设** 前端已建立 error code 到中文的翻译映射
- **当** runtime-validation 校验失败并返回错误
- **则** 前端能通过 error code 正确映射为中文用户提示
- **并且** 用户看到的错误提示内容与替换前语义一致

### Requirement: providerResolver.ts 中文硬编码错误消息必须替换为英文 [ADDED]

`providerResolver.ts` 中 2 处硬编码中文错误消息**必须**替换为英文 error code + 英文 message 格式。

#### Scenario: AUD-C13-S6 providerResolver 错误消息全部英文化 [ADDED]

- **假设** `providerResolver.ts` 当前包含 2 处中文硬编码错误消息
- **当** 执行本次变更的错误消息替换
- **则** 所有 2 处错误消息替换为英文 error code + 英文 message
- **并且** 在 `providerResolver.ts` 中搜索中文字符结果为零

#### Scenario: AUD-C13-S7 providerResolver 错误路径回归测试 [ADDED]

- **假设** providerResolver 的错误路径已有测试覆盖或新增测试
- **当** provider 配置无效或凭证缺失触发错误
- **则** 返回的错误响应包含英文 error code 与英文 message
- **并且** 前端翻译映射能正确将该 error code 映射为中文提示
