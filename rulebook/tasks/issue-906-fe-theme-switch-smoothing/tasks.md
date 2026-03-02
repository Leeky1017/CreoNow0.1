# Tasks: fe-theme-switch-smoothing (#906)

## Specification

在根节点增加主题切换过渡策略（background-color / color / border-color），消除切换闪烁。
`prefers-reduced-motion: reduce` 启用时必须禁用该过渡。

## TDD Mapping

| Scenario ID      | 测试名                                                            | 断言                                                                     |
| ---------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------ |
| WB-FE-THEME-S1   | main.css defines theme transition on root element                 | html 规则包含 transition，含 background-color 和 color                   |
| WB-FE-THEME-S2   | theme transition uses duration token, not hardcoded ms            | 过渡时长引用 var(--duration-fast)，不含硬编码 ms                         |
| WB-FE-THEME-S3   | theme transition is disabled under reduced motion                 | @media (prefers-reduced-motion: reduce) 全局规则覆盖过渡                 |

## Red

Guard 测试文件：`apps/desktop/renderer/src/styles/__tests__/theme-transition.guard.test.ts`

3 个测试全部 FAIL（见 RUN_LOG）。

## Green

在 `apps/desktop/renderer/src/styles/main.css` 中新增：

1. `html { transition: background-color var(--duration-fast) ..., color var(--duration-fast) ..., border-color var(--duration-fast) ...; }`
2. `@media (prefers-reduced-motion: reduce) { html { transition-duration: 0s; } }`

3 个测试全部 PASS。

## Refactor

无需重构。实现仅为 CSS 声明，不涉及逻辑代码。全量回归 217 文件 1643 测试全部通过。

## Evidence

- 见 `openspec/_ops/task_runs/ISSUE-906.md`
