# Project Management Specification Delta

更新时间：2026-02-28 19:20

## Change: fe-dashboard-herocard-responsive-layout

### Requirement: Dashboard HeroCard 必须响应式适配极宽/极窄窗口 [ADDED]

#### Scenario: 宽屏下装饰区必须有最大宽度 [ADDED]

- **假设** 窗口宽度 >= 1920px
- **当** HeroCard 渲染
- **则** 右侧装饰区必须有最大宽度限制
- **并且** 不得出现“空旷占比过大”导致信息密度下降

#### Scenario: 窄屏下装饰区不得挤压文字区 [ADDED]

- **假设** 窗口宽度 <= 1280px
- **当** HeroCard 渲染
- **则** 装饰区必须收缩或隐藏
- **并且** 文字内容必须保持可读且不溢出
