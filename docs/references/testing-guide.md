# 测试要求（跳转页）

更新时间：2026-03-07 11:40

测试规范主源已迁移到 `docs/references/testing/`。

## 从这里开始

- 索引与阅读顺序：`docs/references/testing/README.md`
- 理念与反模式：`docs/references/testing/01-philosophy-and-anti-patterns.md`
- 测试类型决策：`docs/references/testing/02-test-type-decision-guide.md`
- 前端模式：`docs/references/testing/03-frontend-testing-patterns.md`
- 后端 / IPC / DB / AI：`docs/references/testing/04-backend-testing-patterns.md`
- E2E：`docs/references/testing/05-e2e-testing-patterns.md`
- Guard / Lint 边界：`docs/references/testing/06-guard-and-lint-policy.md`
- 命令与 CI：`docs/references/testing/07-test-command-and-ci-map.md`
- 迁移与 review：`docs/references/testing/08-migration-and-review-playbook.md`

## 保留在本页的最小摘要

- 测试先行：Red -> Green -> Refactor
- 测行为，不测实现
- 每个核心行为至少覆盖 happy / edge / error
- 单元 / 集成 / E2E / Guard 的选择以 `02-test-type-decision-guide.md` 为准
