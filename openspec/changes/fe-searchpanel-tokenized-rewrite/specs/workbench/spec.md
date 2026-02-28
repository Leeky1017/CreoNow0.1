# Workbench Specification Delta

更新时间：2026-02-28 19:20

## Change: fe-searchpanel-tokenized-rewrite

### Requirement: SearchPanel 必须遵循 Token 与 Primitives 体系 [ADDED]

SearchPanel 不得形成独立主题孤岛，必须复用设计系统资产。

#### Scenario: SearchPanel 不得出现硬编码 hex/rgba 或内联 style [ADDED]

- **假设** 用户打开 SearchPanel
- **当** SearchPanel 渲染
- **则** 组件不得使用任何硬编码 `#xxxxxx` 或 `rgba(...)` 颜色
- **并且** 不得通过内联 `style={{...}}` 注入颜色/阴影

#### Scenario: SearchPanel 必须使用 Input/Button 等 Primitives [ADDED]

- **假设** SearchPanel 提供搜索输入与结果交互
- **当** 用户进行输入与点击
- **则** 搜索输入必须使用 `<Input>` Primitive
- **并且** 交互按钮必须使用 `<Button>`（或受控 Composite），不得散写原生 `<button>`

#### Scenario: SearchPanel 动画必须尊重 reduced motion [ADDED]

- **假设** 用户启用 `prefers-reduced-motion: reduce`
- **当** SearchPanel 打开/关闭
- **则** 系统不得使用强制位移/淡入动画
- **并且** 动画时长必须可被压缩为 0 或近似 0
