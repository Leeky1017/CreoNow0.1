# Tasks: issue-905-fe-lucide-icon-unification

## Specification
- [x] 审阅并确认需求边界：Feature 层 156 处内联 `<svg>` 替换为 `lucide-react`
- [x] 统一 `strokeWidth={1.5}`、`size={16|20|24}`
- [x] 不改交互逻辑

## TDD Mapping
- [x] S1 → `icon-lucide-guard.test.ts`: `feature layer contains no inline <svg> elements`
- [x] S2 → `icon-lucide-guard.test.ts`: `all lucide imports use consistent strokeWidth and size`

## Red
- [x] guard 测试运行确认 156 处内联 SVG 导致失败

## Green
- [x] 逐目录替换全部内联 SVG 为 Lucide 图标
- [x] guard 测试全部通过

## Refactor
- [x] 确认视觉权重一致

## Evidence
- [x] RUN_LOG: `openspec/_ops/task_runs/ISSUE-905.md`
