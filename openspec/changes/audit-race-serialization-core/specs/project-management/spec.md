# Project Management Specification Delta

更新时间：2026-02-25 23:50

## Change: audit-race-serialization-core

### Requirement: projectLifecycle 项目切换必须串行化执行 [ADDED]

`projectLifecycle.ts` 的 `switchProject()` 执行 unbind→persist→bind 序列。并发调用**必须**通过锁机制串行化，防止 unbind/bind 步骤交错执行导致项目状态污染。

#### Scenario: AUD-C1-S4 并发 switchProject 串行执行无交错 [ADDED]

- **假设** 当前活跃项目为 P1
- **当** `switchProject(P2)` 和 `switchProject(P3)` 几乎同时被调用
- **则** 两次切换串行执行（先完成一次完整的 unbind→persist→bind，再执行下一次）
- **并且** 最终活跃项目为 P2 或 P3（取决于执行顺序），不会出现 P2 的 unbind 与 P3 的 bind 交错的中间态

#### Scenario: AUD-C1-S5 switchProject 期间重复切换到同一项目被幂等处理 [ADDED]

- **假设** 当前活跃项目为 P1，一次 `switchProject(P2)` 正在执行中
- **当** 第二次 `switchProject(P2)` 被调用
- **则** 第二次调用等待第一次完成后检测到目标项目已是活跃项目
- **并且** 不执行多余的 unbind→persist→bind 序列
