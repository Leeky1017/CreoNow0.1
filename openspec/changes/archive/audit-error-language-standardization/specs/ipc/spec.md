# IPC Specification Delta

更新时间：2026-02-25 23:50

## Change: audit-error-language-standardization

### Requirement: 后端 IPC 错误消息必须统一为英文 error code + 英文 message [ADDED]

后端 IPC 层的错误响应**必须**使用英文 error code 与英文 message，前端负责根据 error code 映射为用户可见的本地化文案。禁止在后端服务中硬编码中文错误消息。

#### Scenario: AUD-C13-S1 后端错误响应格式统一 [ADDED]

- **假设** 后端 IPC 服务处理请求时发生业务错误
- **当** 服务返回错误响应
- **则** 错误响应包含英文 `code`（如 `VALIDATION_FAILED`）和英文 `message`（如 `Provider configuration is invalid`）
- **并且** 错误响应中不包含任何中文字符

#### Scenario: AUD-C13-S2 前端翻译映射覆盖所有后端 error code [ADDED]

- **假设** 前端翻译映射表已建立
- **当** 前端接收到后端返回的 error code
- **则** 翻译映射表中存在该 error code 对应的中文用户提示
- **并且** 未映射的 error code 有兜底显示策略（显示英文 message 而非空白）

#### Scenario: AUD-C13-S3 新增后端错误消息的语言规范守卫 [ADDED]

- **假设** 开发者在后端服务中新增错误消息
- **当** 代码提交触发 lint/静态检查
- **则** 检查规则能检测到后端 IPC 错误消息中的中文字符并报警
- **并且** 守卫规则覆盖 `services/` 目录下所有 IPC 错误返回路径
