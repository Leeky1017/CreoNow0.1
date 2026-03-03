# Workbench Specification Delta

更新时间：2026-02-28 19:20

## Change: fe-feature-focus-visible-coverage

### Requirement: Feature 层交互元素必须具备 focus-visible 焦点反馈 [ADDED]

- Feature 层所有可交互元素必须在键盘导航时提供可见焦点。
- 若通过 Composite/Primitive 提供，则不得绕过。

#### Scenario: 键盘 Tab 导航必须可见焦点位置 [ADDED]

- **假设** 用户使用键盘 Tab 在面板内移动焦点
- **当** 焦点落到任意可交互元素
- **则** 该元素必须展示 `focus-visible` 样式
- **并且** 焦点反馈在亮/暗主题下均清晰可见
