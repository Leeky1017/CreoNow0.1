# Workbench Specification Delta

更新时间：2026-02-28 19:20

## Change: fe-lucide-icon-unification

### Requirement: Feature 层图标必须统一使用 Lucide [ADDED]

Feature 层不得散写内联 SVG；图标必须从 `lucide-react` 统一引入并遵循统一规格。

#### Scenario: Feature 层不得存在内联 <svg> 图标实现 [ADDED]

- **假设** 开发者在 Feature 组件内新增图标
- **当** 代码进入测试与门禁阶段
- **则** 若出现内联 `<svg>`，检查必须失败
- **并且** 必须改用 Lucide 图标并对齐 `strokeWidth/size` 规范
