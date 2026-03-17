本 change 涉及 QualityGatesPanel / QualityPanel / InfoPanel / Diff 模块（7 文件）/
AnalyticsPage / ZenMode / ShortcutsPanel / Settings 子组件，
均为视觉对齐 + 结构重构（Design Token 统一 + PanelHeader 组件复用），不修改对外行为协议。
变更限于 JSX/CSS 渲染层，不影响 Store / IPC / Service / diff 算法 / 质量门禁规则引擎。

此为 V1 最后的「100% 全覆盖收口」change，确保用户可触达的一切前端路径均经过视觉重塑。

无需 delta spec。如实施中发现对外行为变更，须先更新 spec 再实现。
