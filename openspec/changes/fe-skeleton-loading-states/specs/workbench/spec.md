# Workbench Specification Delta

更新时间：2026-02-28 19:20

## Change: fe-skeleton-loading-states

### Requirement: 关键区域加载态必须使用 Skeleton [ADDED]

系统必须为关键区域提供骨架屏以降低等待焦虑，并遵循阈值策略。

#### Scenario: 加载 >=200ms 必须展示骨架屏 [ADDED]

- **假设** 某区域进入 loading 状态
- **当** loading 持续时间达到或超过 200ms
- **则** 系统必须展示与该区域结构一致的 Skeleton
- **并且** 骨架屏必须使用 `Skeleton` Primitive，而非散写 div
