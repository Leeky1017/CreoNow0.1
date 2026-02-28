# Workbench Specification Delta

更新时间：2026-02-28 19:20

## Change: fe-rightpanel-ai-tabbar-layout

### Requirement: AI 面板操作入口必须并入 RightPanel tab bar [ADDED]

RightPanel 的 tab bar 必须承担“面板级动作入口”的职责，避免每个面板在内部重复造 header，造成纵向浪费与视觉噪音。

#### Scenario: AI 激活时 tab bar 提供 History/NewChat 动作入口 [ADDED]

- **假设** activeRightPanel === "ai"
- **当** 用户查看 RightPanel 顶部 tab bar
- **则** tab bar 右侧必须展示 History 与 NewChat 的动作按钮
- **并且** 这两个按钮的可点击目标尺寸不小于 24×24px

#### Scenario: 非 AI 面板激活时动作入口必须隐藏 [ADDED]

- **假设** activeRightPanel !== "ai"
- **当** 用户查看 RightPanel 顶部 tab bar
- **则** History/NewChat 动作入口不得出现

### Requirement: 候选数（candidateCount）不得污染主交互面板 [ADDED]

候选数属于高级策略，不得以 `1x~5x` 这种无语义的循环按钮暴露在 AI 面板主界面。

#### Scenario: AI 面板主界面不得出现 candidateCount 循环按钮 [ADDED]

- **假设** 用户打开 AI 面板
- **当** 用户查看面板 footer/toolbar
- **则** UI 中不得出现 `1x` 循环切换候选数的按钮
- **并且** 若提供配置入口，应迁移到 Settings → AI（高级选项）
