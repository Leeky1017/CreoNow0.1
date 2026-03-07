# 测试命令与 CI 映射

更新时间：2026-03-07 11:44

## 总览

测试命令分三层：

1. 根目录聚合命令
2. `apps/desktop` 包内命令
3. `.github/workflows/ci.yml` 中的 job 映射

理解这三层的对应关系，才能避免“本地跑过了，但 CI 跑的不是这个”。

## 根目录命令

| 命令                              | 作用                                                                     |
| --------------------------------- | ------------------------------------------------------------------------ |
| `pnpm test:unit`                  | 运行 root 侧单元测试发现计划（含 `run-discovered-tests.ts --mode unit`） |
| `pnpm test:integration`           | 运行 root 侧集成测试发现计划                                             |
| `pnpm test:discovery:consistency` | 检查“发现到的测试”与“实际执行的测试计划”是否一致                         |
| `pnpm test:coverage:desktop`      | 运行 renderer coverage                                                   |
| `pnpm test:coverage:core`         | 运行 main/core coverage                                                  |
| `pnpm typecheck`                  | 运行 TypeScript 检查                                                     |
| `pnpm lint`                       | 运行 ESLint                                                              |
| `pnpm format:check`               | 运行 Prettier 检查                                                       |

## `apps/desktop` 包内命令

| 命令                                      | 作用                          |
| ----------------------------------------- | ----------------------------- |
| `pnpm -C apps/desktop test:run`           | 运行 renderer/store 侧 vitest |
| `pnpm -C apps/desktop test:coverage`      | 运行 renderer coverage        |
| `pnpm -C apps/desktop test:coverage:core` | 运行 main/core coverage       |
| `pnpm -C apps/desktop test:e2e`           | 运行 Playwright Electron E2E  |
| `pnpm -C apps/desktop storybook:build`    | 验证 Storybook 可构建         |

## CI 对应关系

| CI Job                       | 实际命令                                                    | 说明                   |
| ---------------------------- | ----------------------------------------------------------- | ---------------------- |
| `lint-and-typecheck`         | `pnpm lint` / `pnpm lint:warning-budget` / `pnpm typecheck` | 基础静态门禁           |
| `unit-test-core`             | `pnpm test:unit`                                            | root 侧单元测试计划    |
| `unit-test-renderer`         | `pnpm -C apps/desktop test:run`                             | renderer/store vitest  |
| `integration-test`           | `pnpm test:integration`                                     | root 侧集成测试        |
| `test-discovery-consistency` | `pnpm test:discovery:consistency`                           | 发现与执行一致性（当前为 advisory） |
| `coverage-gate`              | `pnpm test:coverage:desktop` / `pnpm test:coverage:core`    | 生成 coverage artifact |
| `storybook-build`            | `pnpm -C apps/desktop storybook:build`                      | 视觉验收基础门禁       |
| `windows-e2e`                | `pnpm -C apps/desktop test:e2e`                             | Windows 平台 E2E       |

## 当前已知状态

### Discovery consistency

- 当前 CI 中 `test-discovery-consistency` 以单独 job 运行，但仍配置为 `continue-on-error: true`。
- 因此它目前更接近“治理告警 / 提醒型 job”，而不是严格阻断门禁；发现结果与执行计划不一致时，仍应尽快修复，但当前不会单独卡死 `ci`。

### Coverage

- renderer 侧已有 coverage threshold。
- backend/core 侧未来可继续收紧，但不应在未准备好时口头宣称“已强制”。

### Storybook

- 前端任务的视觉验收最低线是：`pnpm -C apps/desktop storybook:build` 通过。
- Storybook 是视觉验收门槛，不是行为测试替代。

### Format check

- `pnpm format:check` 当前是可用的根目录命令，可用于本地统一校验代码与文档的 Prettier 基线。
- 截至当前 `main`，它**尚未**作为独立 CI job 接入 `.github/workflows/ci.yml`。
- 若未来将其接入 CI，必须先同步更新工作流，再回写本文件。

## 本地验证建议

### 文档 / 脚本 / 治理改动

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test:discovery:consistency`
- `python3 -m py_compile scripts/agent_pr_preflight.py scripts/check_doc_timestamps.py`
- `pytest -q scripts/tests`

### 前端行为改动

- `pnpm -C apps/desktop test:run`
- `pnpm -C apps/desktop storybook:build`

### root 侧测试脚本改动

- `pnpm test:unit`
- `pnpm test:integration`

## 一句话原则

文档里写下的命令，必须真能在本地和 CI 中找到对应落点；找不到，就说明它不是规范，而只是传说。

## 第二阶段治理路线图

### 1. 后端 coverage threshold 对齐

现状：

- `apps/desktop/vitest.config.ts` 已对 renderer coverage 设置阈值。
- `apps/desktop/vitest.config.core.ts` 尚未设置同级别的 backend threshold。

第二阶段动作：

1. 先基于 `pnpm test:coverage:core` 连续收集基线。
2. 为 backend/core 设定首个可达阈值，而不是直接照搬 renderer 数字。
3. 将 `coverage-gate` 从“上传 artifact”升级为“校验阈值 + 失败阻断”。

升级条件：

- backend coverage 连续多轮稳定
- 历史盲区已有补测
- 失败成本低于维护收益

### 2. spec-scenario-test 映射门禁

目标：

- 让 spec 中的 Scenario 能追到测试，让测试也能追溯回 spec。

第二阶段动作：

1. 先在高价值区域试点，例如 IPC / Workbench。
2. 统一测试内的场景标识写法，如 `REQ-ID`、Scenario ID 或等价标签。
3. 新增映射脚本，先产出报告、后考虑阻断。

升级顺序：

- 先报告
- 再告警
- 最后才阻断

### 3. 审计脚本化与 reviewer wrapper

目标：

- 把 `git diff --check`、`pytest -q scripts/tests`、`python3 -m py_compile ...` 等审计必跑命令收口成一个 reviewer 入口。

第二阶段动作：

1. 设计 `scripts/review-audit.sh` 或等价 wrapper。
2. 输出统一摘要，方便贴入 PR comment。
3. 评估是否需要配套测试模板 / 脚手架，避免“先搭空架子，后无人使用”。

原则：

- 先让 reviewer 本地可一键执行
- 再考虑 CI 附件化
- 不在未稳定前宣称“已全面自动审计”
