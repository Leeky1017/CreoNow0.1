# Workbench Specification Delta

更新时间：2026-02-28 19:20

## Change: fe-i18n-language-switcher-foundation

### Requirement: 必须提供语言切换入口并持久化 [ADDED]

系统必须允许用户在 Settings 中切换 UI 语言，并将选择持久化以在下次启动生效。

#### Scenario: 用户在 Settings 切换语言后必须持久化并生效 [ADDED]

- **假设** 用户打开 Settings → General
- **当** 用户将 Language 从 `zh-CN` 切换到 `en`（或反之）
- **则** 系统必须持久化该选择
- **并且** UI 文案必须按所选语言渲染（即时或下次启动生效）
