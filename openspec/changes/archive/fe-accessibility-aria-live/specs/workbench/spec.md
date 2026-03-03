# Workbench Specification Delta

更新时间：2026-02-28 19:20

## Change: fe-accessibility-aria-live

### Requirement: 动态内容必须具备 aria-live 播报语义 [ADDED]

#### Scenario: AI 流式输出区域必须使用 aria-live=polite [ADDED]

- **假设** AI 面板正在流式输出内容
- **当** 内容持续追加
- **则** 输出容器必须设置 `aria-live="polite"`

#### Scenario: Toast 通知必须可被屏幕阅读器播报 [ADDED]

- **假设** 系统触发一条成功或错误 Toast
- **当** Toast 出现
- **则** Toast 必须具备合适的 `aria-live` 语义
- **并且** 错误类 Toast 应使用更高优先级的播报（如 `assertive`）
