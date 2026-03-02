# Project Management Specification Delta

更新时间：2026-02-28 19:20

## Change: fe-onboarding-flow-refresh

### Requirement: 首次启动必须提供可闭环的 Onboarding 流程 [MODIFIED]

Onboarding 必须引导用户完成最小可用配置，使其能在首次会话中进入可写作的工作区。

#### Scenario: Step 1 必须允许用户选择语言 [ADDED]

- **假设** 用户首次启动应用
- **当** Onboarding 显示
- **则** Step 1 必须提供语言选择入口（至少 `zh-CN` / `en`）
- **并且** 选择必须被持久化

#### Scenario: Step 3 必须引导用户打开文件夹并进入工作区 [ADDED]

- **假设** 用户处于 Onboarding 的“打开文件夹”步骤
- **当** 用户点击 Open Folder
- **则** 系统必须打开系统目录选择器
- **并且** 选择目录后必须进入该工作区并展示文件树
