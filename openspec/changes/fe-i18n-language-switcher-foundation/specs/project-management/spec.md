# Project Management Specification Delta

更新时间：2026-02-28 19:20

## Change: fe-i18n-language-switcher-foundation

### Requirement: Onboarding 必须提供语言选择入口 [ADDED]

#### Scenario: 用户在 Onboarding Step 1 选择语言后必须与 Settings 同步 [ADDED]

- **假设** 用户处于 Onboarding Step 1
- **当** 用户选择语言
- **则** 系统必须持久化该选择
- **并且** Settings 中的 Language 显示必须与该选择一致
