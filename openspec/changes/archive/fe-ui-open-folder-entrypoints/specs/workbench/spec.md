# Workbench Specification Delta

更新时间：2026-02-28 19:20

## Change: fe-ui-open-folder-entrypoints

### Requirement: Open Folder 必须提供多入口且行为一致 [ADDED]

Workbench 必须在关键路径提供 Open Folder 入口，且所有入口必须触发同一 action 与相同的取消/错误语义。

#### Scenario: Command Palette 必须提供 Open Folder 命令 [ADDED]

- **假设** 用户唤起 Command Palette
- **当** 用户搜索 "Open Folder"
- **则** 系统必须展示对应命令项
- **并且** 触发后必须打开系统目录选择器
