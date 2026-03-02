# Workbench Specification Delta

更新时间：2026-02-28 19:20

## Change: fe-composites-p0-panel-and-command-items

### Requirement: 必须提供 Layer 2 P0 Composites 以收敛 Feature 散写 [ADDED]

系统必须提供 P0 优先级的 Composite 组件，作为 Feature 与 Primitives 之间的结构复用层。

#### Scenario: Feature 面板必须复用 PanelContainer 统一 shell [ADDED]

- **假设** 某 Feature 面板需要 header + content 的面板结构
- **当** 面板渲染
- **则** 必须复用 `PanelContainer` Composite
- **并且** 不得在 Feature 层复制粘贴面板 shell 样式

#### Scenario: CommandPalette/Search 的命令项必须复用 CommandItem [ADDED]

- **假设** 某列表项语义为“可执行命令”
- **当** 列表项渲染
- **则** 必须复用 `CommandItem` Composite
- **并且** 图标/标题/快捷键提示的布局必须一致
