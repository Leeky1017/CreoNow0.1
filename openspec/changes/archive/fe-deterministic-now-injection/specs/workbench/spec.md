# Workbench Specification Delta

更新时间：2026-02-28 19:20

## Change: fe-deterministic-now-injection

### Requirement: 时间相关逻辑必须可注入 now 以保证测试确定性 [ADDED]

#### Scenario: 相对时间格式化必须可在测试中固定 now [ADDED]

- **假设** 测试环境需要验证相对时间文案
- **当** 调用相对时间格式化逻辑
- **则** 逻辑必须允许注入固定 `now`
- **并且** 测试不得直接依赖真实 `Date.now()`
