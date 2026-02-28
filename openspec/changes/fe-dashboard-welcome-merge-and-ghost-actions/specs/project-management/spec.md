# Project Management Specification Delta

更新时间：2026-02-28 19:20

## Change: fe-dashboard-welcome-merge-and-ghost-actions

### Requirement: 空状态必须提供闭环入口 [MODIFIED]

Dashboard 的空状态必须提供用户可立即执行的闭环入口，禁止出现“欢迎页/空状态”两套重复路径。

#### Scenario: 无项目时必须展示统一 empty state [ADDED]

- **假设** 当前没有任何项目（recent projects 为空）
- **当** 用户进入 Dashboard
- **则** 系统必须展示唯一的 empty state 视图
- **并且** 不得再渲染独立的 WelcomeScreen 分支

#### Scenario: empty state 必须提供 Create Project 与 Open Folder 两个入口 [ADDED]

- **假设** Dashboard 处于 empty state
- **当** 用户查看主操作区
- **则** 系统必须提供 Create Project 与 Open Folder 两个操作入口
- **并且** 两个入口必须可点击且产生可观察结果

### Requirement: 禁止幽灵按钮（可点无效） [ADDED]

- 所有可点击按钮必须有闭环行为。
- 若功能未实现，入口必须被移除或显式禁用并提示原因。
