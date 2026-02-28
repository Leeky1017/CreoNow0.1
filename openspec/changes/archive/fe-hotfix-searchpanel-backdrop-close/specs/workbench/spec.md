# Workbench Specification Delta

更新时间：2026-02-28 19:20

## Change: fe-hotfix-searchpanel-backdrop-close

### Requirement: SearchPanel 可见性与关闭语义 [ADDED]

SearchPanel 必须为受控组件：其 overlay/backdrop 的渲染必须由 `open` 状态决定，并且必须存在确定的关闭回调。

#### Scenario: open=false 时不得渲染 overlay/backdrop [ADDED]

- **假设** SearchPanel 组件收到 `open=false`
- **当** Workbench 渲染左侧 Sidebar
- **则** SearchPanel 不得渲染任何全屏覆盖层（backdrop/overlay）
- **并且** 不得拦截用户对编辑区的点击与滚动

#### Scenario: 点击 backdrop 必须触发关闭 [ADDED]

- **假设** SearchPanel 组件收到 `open=true` 且提供 `onClose`
- **当** 用户点击 backdrop（面板外区域）
- **则** 系统必须调用 `onClose`
- **并且** SearchPanel 必须回到关闭状态
