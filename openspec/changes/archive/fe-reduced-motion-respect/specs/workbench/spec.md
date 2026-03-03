# Workbench Specification Delta

更新时间：2026-02-28 19:20

## Change: fe-reduced-motion-respect

### Requirement: 全局必须尊重 prefers-reduced-motion [ADDED]

系统必须在全局层面尊重 `prefers-reduced-motion`，确保用户启用减少动效时，所有自定义动画/过渡都被禁用或压缩。

#### Scenario: reduced motion 启用时自定义动画必须被禁用或近似为 0 [ADDED]

- **假设** 系统检测到 `prefers-reduced-motion: reduce`
- **当** 用户打开/关闭面板或触发动效
- **则** 自定义动画必须被禁用或压缩为近似 0 的时长
- **并且** 动效不应成为信息传达的唯一方式
