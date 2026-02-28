# Workbench Specification Delta

更新时间：2026-02-28 19:20

## Change: fe-composites-p1-search-and-forms

### Requirement: P1 Composites 必须统一搜索输入与表单字段结构 [ADDED]

#### Scenario: SearchPanel/CommandPalette 的搜索输入必须复用 SearchInput [ADDED]

- **假设** 某面板提供搜索输入
- **当** 渲染搜索输入
- **则** 必须复用 `SearchInput` Composite
- **并且** icon/clear/placeholder/shortcut 提示结构必须一致

#### Scenario: Settings 表单字段必须复用 FormField [ADDED]

- **假设** 某设置项需要 label + control + help/error
- **当** 渲染表单字段
- **则** 必须复用 `FormField` Composite
- **并且** 布局与间距必须一致
