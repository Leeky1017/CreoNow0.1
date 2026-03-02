# Workbench Specification Delta

更新时间：2026-02-28 19:20

## Change: fe-error-boundary-partitioning

### Requirement: 渲染层必须具备分区 ErrorBoundary [ADDED]

系统必须将渲染层错误隔离在区域边界内，避免单点崩溃导致全屏白屏。

#### Scenario: Sidebar 崩溃不得影响编辑区 [ADDED]

- **假设** 左侧 Sidebar 内某子组件抛出异常
- **当** 该异常发生
- **则** 系统必须仅在 Sidebar 区域展示 fallback
- **并且** 主编辑区必须保持可用

#### Scenario: RightPanel 崩溃不得影响主内容区 [ADDED]

- **假设** 右侧面板内某子组件抛出异常
- **当** 该异常发生
- **则** 系统必须仅在 RightPanel 区域展示 fallback
- **并且** 主内容区与左侧栏必须保持可用
