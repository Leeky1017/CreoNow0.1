# Workbench Specification Delta

更新时间：2026-02-28 19:20

## Change: fe-cleanup-proxysection-and-mocks

### Requirement: 禁止 Dead UI 与 Mock 结果进入生产路径 [ADDED]

Workbench 的 Feature 层不得保留未闭环的入口或 mock 数据，以避免误导用户与污染验收。

#### Scenario: Settings 中不得出现已确认删除的 Proxy 入口 [ADDED]

- **假设** 用户打开 Settings Dialog
- **当** 用户浏览导航项
- **则** 不得出现 `Proxy` 配置入口或相关 Section
- **并且** 代码库中不得存在对 `ProxySection` 的引用

#### Scenario: SearchPanel 不得使用 mock 结果作为默认展示 [ADDED]

- **假设** 搜索结果集合为空
- **当** 用户打开 SearchPanel
- **则** 系统必须展示明确的空结果状态（empty state）
- **并且** 不得回退到任何内置 mock 结果

#### Scenario: 禁止“可点但无效”的占位交互 [ADDED]

- **假设** 某个交互入口在 UI 中可被点击
- **当** 用户触发该交互
- **则** 系统必须产生可观察的结果（状态变化/导航/执行）
- **并且** 若功能未实现，入口必须显式禁用并提示原因（而非 no-op）
