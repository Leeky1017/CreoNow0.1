# Workbench Specification Delta

更新时间：2026-02-28 19:20

## Change: fe-composites-p2-empties-and-confirms

### Requirement: 空状态与确认弹窗必须通过 Composite 统一 [ADDED]

#### Scenario: 各面板空状态必须复用 EmptyState [ADDED]

- **假设** 某面板处于“无数据/无结果”状态
- **当** 面板渲染空状态
- **则** 必须复用 `EmptyState` Composite
- **并且** icon/title/description/action 的样式与间距必须一致

#### Scenario: destructive 操作必须使用 ConfirmDialog [ADDED]

- **假设** 用户触发删除/归档等 destructive 操作
- **当** 系统需要二次确认
- **则** 必须使用 `ConfirmDialog` Composite
- **并且** destructive 按钮语义必须明确（颜色/文案/默认焦点）
