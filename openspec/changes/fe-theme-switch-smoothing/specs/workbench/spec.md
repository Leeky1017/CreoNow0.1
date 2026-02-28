# Workbench Specification Delta

更新时间：2026-02-28 19:20

## Change: fe-theme-switch-smoothing

### Requirement: 主题切换必须平滑且尊重 reduced motion [ADDED]

#### Scenario: 主题切换不得出现闪烁 [ADDED]

- **假设** 用户从 light 切换到 dark（或反之）
- **当** 主题切换发生
- **则** UI 不得出现明显闪烁
- **并且** 过渡时长应短且不影响输入响应

#### Scenario: reduced motion 启用时必须禁用主题过渡 [ADDED]

- **假设** `prefers-reduced-motion: reduce`
- **当** 主题切换发生
- **则** 系统必须禁用该过渡动画
