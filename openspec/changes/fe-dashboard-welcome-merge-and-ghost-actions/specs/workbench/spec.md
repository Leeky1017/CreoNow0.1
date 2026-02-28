# Workbench Specification Delta

更新时间：2026-02-28 19:20

## Change: fe-dashboard-welcome-merge-and-ghost-actions

### Requirement: 禁止 Dashboard 入口存在可点无效的占位按钮 [ADDED]

- Dashboard 的 action 按钮不得以装饰性 UI 形式存在。
- “View All / Grid View / List View”等入口若未闭环，必须移除或禁用并提示依赖。
