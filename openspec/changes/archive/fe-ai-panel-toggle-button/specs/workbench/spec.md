# Workbench Specification Delta

更新时间：2026-02-28 19:20

## Change: fe-ai-panel-toggle-button

### Requirement: 必须提供显式的 AI 面板 Toggle 入口 [ADDED]

Workbench 必须在主编辑区提供一个显式的 AI 面板 toggle 按钮，用于展开/折叠右侧面板并切换到 AI tab。

#### Scenario: 点击 AI toggle 必须展开/折叠 RightPanel 且激活 AI tab [ADDED]

- **假设** RightPanel 当前处于折叠或展开状态
- **当** 用户点击 AI toggle 按钮
- **则** RightPanel 状态必须在折叠/展开之间切换
- **并且** activeRightPanel 必须切换为 `ai`

#### Scenario: Tooltip 必须提示 Ctrl+L 快捷键 [ADDED]

- **假设** 用户将鼠标悬停在 AI toggle 按钮上
- **当** tooltip 显示
- **则** tooltip 文案必须包含 `Ctrl+L`
