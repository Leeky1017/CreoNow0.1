# Workbench Specification Delta

更新时间：2026-02-28 19:20

## Change: fe-leftpanel-dialog-migration

### Requirement: 左侧 Sidebar 仅承担结构化导航 [MODIFIED]

左侧 Sidebar 仅保留需要与编辑区长期并列的结构化导航面板（files/outline）。其余配置型或需要大屏空间的面板必须改为弹出式（Spotlight/Dialog）。

#### Scenario: files/outline 保持可停靠，其余不得占用 Sidebar 宽度 [ADDED]

- **假设** IconBar 包含 files/outline/search/memory/characters/knowledgeGraph/versionHistory 入口
- **当** 用户依次点击这些入口
- **则** 仅 files/outline 会切换 Sidebar 的停靠内容
- **并且** search/memory/characters/knowledgeGraph/versionHistory 必须以弹出式呈现（不改变 Sidebar 宽度）

#### Scenario: search 必须以 Spotlight 形态弹出并可快速关闭 [ADDED]

- **假设** 用户触发 search 入口
- **当** Spotlight 弹出
- **则** 输入框必须自动聚焦
- **并且** 用户按 Esc 或点击 backdrop 必须关闭 Spotlight

#### Scenario: 弹出式 Dialog 必须遵循统一 shell 规范 [ADDED]

- **假设** 用户打开 memory/characters/knowledgeGraph/versionHistory 任意 Dialog
- **当** Dialog 渲染
- **则** Dialog 必须提供一致的关闭入口（关闭按钮/Esc/backdrop）
- **并且** Dialog 内部布局与间距必须对齐 SettingsDialog 的基础样式规范
