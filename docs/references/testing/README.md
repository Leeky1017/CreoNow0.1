# 测试规范主源


> “工欲善其事，必先利其器。”
> 对 CreoNow 而言，测试不是交差的器物，而是把行为、边界与证据钉在地上的木楔。

本目录是 CreoNow 测试规范的唯一主源（SSOT）。

## 阅读顺序

1. `01-philosophy-and-anti-patterns.md`
2. `02-test-type-decision-guide.md`
3. 按任务类型继续阅读：
   - 前端：`03-frontend-testing-patterns.md`
   - 后端 / 服务 / IPC：`04-backend-testing-patterns.md`
   - E2E：`05-e2e-testing-patterns.md`
   - Guard / Lint：`06-guard-and-lint-policy.md`
4. 需要执行命令或核对 CI 时：`07-test-command-and-ci-map.md`
5. 需要整改历史弱测试或做 review 时：`08-migration-and-review-playbook.md`

## 三条总原则

### 1. 测试行为，不测实现

- 优先断言用户能观察到的输入、输出、状态变化、错误路径。
- 谨慎断言内部调用次数、私有函数结构或 mock 自身行为。

### 2. 测试是兜底，不是仪式

- 每个测试都要回答“它在防什么回归”。
- 没有失败信息价值、没有行为信号、没有边界判断的测试，宁缺毋滥。

### 3. 静态约束归 Lint，运行时行为归 Test

- 能由 ESLint 可靠表达的规则，不写 Guard 测试。
- 需要跨文件、跨层、跨工序验证的约束，才考虑 Guard 或契约测试。

## 与仓库规则的关系

- Agent 行为约束：`AGENTS.md`、`CLAUDE.md`
- 项目概览：`openspec/project.md`
- 交付主源：`docs/delivery-skill.md`
- 设计与视觉验收：`docs/references/design-ui-architecture.md`

## 何时必须回到这里

- 写任何新测试之前
- 修复 bug 并补回归测试时
- 审查 “这个规则该写测试、写 ESLint，还是写 Guard” 时
- 发现 CI 命令、PR 模板、脚本入口与文档说法不一致时

## 本目录回答的问题

| 文档                                  | 回答的问题                                          |
| ------------------------------------- | --------------------------------------------------- |
| `01-philosophy-and-anti-patterns.md`  | 什么是好测试？什么是空壳测试？                      |
| `02-test-type-decision-guide.md`      | 这次该写单元、集成、E2E、Guard 还是 Contract？      |
| `03-frontend-testing-patterns.md`     | 前端组件、Store、Hook、i18n、Storybook 应该怎么测？ |
| `04-backend-testing-patterns.md`      | Service、IPC、DB、AI/LLM、确定性裁剪应该怎么测？    |
| `05-e2e-testing-patterns.md`          | Electron + Playwright 的端到端约定是什么？          |
| `06-guard-and-lint-policy.md`         | Guard 与 ESLint 的边界在哪里？                      |
| `07-test-command-and-ci-map.md`       | 本地命令、CI job、coverage、storybook 如何对应？    |
| `08-migration-and-review-playbook.md` | 历史弱测试如何迁移？review 时看什么？               |
