# Spec Note: v1-05

本变更将 EditorPane.tsx（1,550 行）拆分为子组件 + hooks，为纯代码重构。

proposal 明确声明「全部现有行为不变」，不修改编辑器任何行为定义，因此无 delta spec。
