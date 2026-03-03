# Tasks: issue-947-fe-reduced-motion-respect

更新时间：2026-03-03 22:00

## Specification

- [x] 审阅 `openspec/changes/fe-reduced-motion-respect/tasks.md` 确认需求边界
- [x] 确认前置依赖 `fe-visual-noise-reduction`（PR #943）已归档，无上游漂移

## TDD Mapping

| Scenario | Test | Assertion |
|----------|------|-----------|
| WB-FE-MOTION-S1 | main.css 全局 reduced-motion 规则 | `@media (prefers-reduced-motion: reduce)` 包含 `animation-duration` + `transition-duration` 覆盖 |
| WB-FE-MOTION-S2 | tokens.css duration token 覆盖 | `:root` 下 `--duration-fast/normal/slow` 在 reduced-motion 下为 `0ms` |
| WB-FE-MOTION-S3 | SearchPanel.tsx 无内联 @keyframes | 文件不含 `@keyframes` |

## Red

- [x] 创建 `reduced-motion-global.guard.test.ts`，3 个测试用例
- [x] 运行确认 3 个测试全部失败
- [x] 提交：`test: add reduced-motion guard tests (Red) (#947)`

## Green

- [x] `main.css`：添加 `@keyframes slideDown` + 全局 `@media (prefers-reduced-motion: reduce)` 规则
- [x] `tokens.css`：添加 reduced-motion 下 duration token 覆盖
- [x] `SearchPanel.tsx`：移除内联 `<style>` 中的 `@keyframes slideDown`
- [x] 运行确认 3 个测试全部通过
- [x] 提交：`feat: add global reduced-motion and motion token overrides (#947)`

## Refactor

- [x] 全量回归：251 文件 / 1757 测试通过，无新增失败
- [x] TypeCheck：`tsc --noEmit` 通过

## Evidence

- Red 输出：3 failed (3) — 见 RUN_LOG
- Green 输出：3 passed (3) — 见 RUN_LOG
- 全量回归：251 passed (251), 1757 tests — 见 RUN_LOG
- TypeCheck：无错误 — 见 RUN_LOG
