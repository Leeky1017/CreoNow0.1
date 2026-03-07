# 设计与 UI 架构


## 设计基准

- 设计 SSOT：`design/DESIGN_DECISIONS.md`
- 所有 UI 实现必须严格遵循设计规范，禁止偏移
- Token 定义源（设计规范）：`design/system/01-tokens.css`
- Token 生产文件：`apps/desktop/renderer/src/styles/tokens.css`
- Token 同步规则：任何新增/修改 Token 必须同时更新设计源和生产文件，两者保持一致

## Design Token 规则

- 禁止在组件中直接使用 Tailwind 原始色值（如 `bg-blue-500`），必须通过语义化 Token（如 `bg-primary`）
- Token 三层结构：**Primitive**（原始值）→ **Semantic**（语义别名）→ **Component**（组件级覆盖）
- 新增颜色、间距、字号必须走完整 Token 链路，禁止跳过语义层

## 组件分层

| 层级 | 命名       | 说明                                       | 允许的依赖                 |
| ---- | ---------- | ------------------------------------------ | -------------------------- |
| L1   | Primitives | 最小原子组件（Button、Input、Badge、Icon） | 仅依赖 Token，不含业务逻辑 |
| L2   | Composites | 由 L1 组合（SearchBar、ToolbarGroup）      | L1 组件 + Token            |
| L3   | Features   | 业务级（AIPanel、KnowledgeGraphCard）      | L1/L2 + Store + IPC        |

- L1/L2 禁止调用 Zustand Store 或 IPC，只通过 props 接收数据
- L3 采用 Container/Presentational 分离模式

## Storybook 要求

- 每个可复用 UI 组件必须附带 Storybook Story（默认态、交互态、边界态、禁用态）
- Story 是组件的可视化契约，没有 Story 的组件提交视为不完整
- Storybook 全局样式必须加载与应用相同的 Tailwind CSS 入口文件，确保 Token 一致

## Tailwind CSS 4 约束

- 使用 CSS-first 配置（`@theme` / `@layer`），不使用 `tailwind.config.js`
- 禁止 `@apply` 滥用：重复 utility 组合应提取为组件
- 暗色模式通过 Token 层切换，组件层不直接写 `dark:` 前缀硬编码颜色值
