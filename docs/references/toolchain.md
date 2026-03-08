# 工具链


## 包管理与构建

| 用途     | 工具                      | 约束                               |
| -------- | ------------------------- | ---------------------------------- |
| 包管理   | pnpm 8                    | 必须使用 `--frozen-lockfile`       |
| 构建     | Vite（via electron-vite） | —                                  |
| Monorepo | pnpm workspace            | `apps/desktop` + `packages/shared` |

## 测试

| 用途      | 工具                           | 说明                        |
| --------- | ------------------------------ | --------------------------- |
| 单元/集成 | Vitest                         | 兼容 Jest API               |
| 组件测试  | React Testing Library          | 测试行为而非实现            |
| E2E       | Playwright                     | 支持 Electron               |
| Mock      | Vitest 内置（vi.mock / vi.fn） | —                           |
| AI Eval   | Golden Test Set                | 人工标注基线 + LLM-as-Judge |
| 覆盖率    | Vitest coverage                | CI 门禁强制                 |

## 样式与设计

| 用途     | 工具           | 说明                               |
| -------- | -------------- | ---------------------------------- |
| 样式     | Tailwind CSS 4 | `@theme` / `@layer` CSS-first 配置 |
| 组件原语 | Radix UI       | 无样式、可访问                     |
| 组件文档 | Storybook      | 可视化契约，与应用共享 Token       |

## CI/CD

| 用途                 | 工具 / 配置                                | 说明                            |
| -------------------- | ------------------------------------------ | ------------------------------- |
| CI                   | GitHub Actions                             | 三个 required checks            |
| `ci`                 | `.github/workflows/ci.yml`                 | lint + typecheck + test + build |
| `merge-serial`       | `.github/workflows/merge-serial.yml`       | 串行合并队列                    |
| 合并策略             | auto-merge                                 | 禁止手动合并                    |

## VS Code / Copilot Agent 定制

| 入口 | 路径 | 用途 |
| ---- | ---- | ---- |
| Repo-wide instructions | `.github/copilot-instructions.md` | 对整个 workspace 生效的常驻规则 |
| File-based instructions | `.github/instructions/*.instructions.md` | 针对脚本 / `.github` / 文档的条件指令 |
| Prompt files | `.github/prompts/*.prompt.md` | 包含 `creonow-delivery`、`creonow-audit`、`creonow-fix-ci` 三类专项流程模板 |
| Custom agents | `.github/agents/*.agent.md` | 在 VS Code Agent picker 中提供 delivery / audit / fix-ci 专项角色 |
| Workspace settings | `.vscode/settings.json` | 显式开启 AGENTS / instructions / prompt files 加载 |

## 自动化脚本

| 脚本                             | 职责                                       |
| -------------------------------- | ------------------------------------------ |
| `agent_controlplane_sync.sh`     | 同步控制面 `origin/main`                   |
| `agent_git_hooks_install.sh`     | 为当前 repo/worktree 安装 `.githooks`      |
| `agent_task_begin.sh`            | gh-only fail-closed 任务入口：capabilities + sync + worktree |
| `agent_worktree_setup.sh`        | 创建 `.worktrees/issue-<N>-<slug>`         |
| `agent_worktree_cleanup.sh`      | 清理 worktree                              |
| `agent_pr_preflight.py`          | PR 提交前校验（Branch、Issue）         |
| `agent_pr_automerge_and_sync.sh` | 创建 PR；默认不开 auto-merge，显式开启时需审计通过（仅 gh 通道） |
| `agent_github_delivery.py`        | GitHub 能力探测、PR/评论模板、gh/MCP 通道选择 |
| `ipc-acceptance-gate.ts`         | IPC 契约验收门禁                           |
| `contract-generate.ts`           | IPC 契约代码生成                           |
| `cross-module-contract-gate.ts`  | cross-module 契约对齐门禁（含 skill-output / api-key-format 维度）|
| `cross-module-contract-autofix.ts` | cross-module 失败分类与安全自动修复      |
| `resource-size-gate.ts`          | 资源文件大小 baseline ratchet 门禁         |
| `bundle-size-budget.ts`          | 构建产物体积预算门禁                       |
| `ipc-handler-validation-gate.ts` | IPC handler schema 校验覆盖门禁            |
| `service-stub-detector-gate.ts`  | Service 桩方法检测门禁                     |
| `error-boundary-coverage-gate.ts`| ErrorBoundary 覆盖门禁                     |
| `architecture-health-gate.ts`    | 架构健康度门禁                             |
| `spec-test-mapping-gate.ts`      | Spec Scenario→测试映射门禁                 |
| `ai-rate-limit-coverage-gate.ts` | AI 请求限流 + scheduler / queue coverage gate    |
| `lint-ratchet.ts`                | ESLint warning budget ratchet              |

脚本约定：

- GitHub 交付前必须先运行 `python3 scripts/agent_github_delivery.py capabilities`，显式确认当前使用 `gh` 还是 GitHub MCP 通道。
- `auto` 模式默认优先 `gh`；若 `gh` 缺失或未认证，但 GitHub MCP 具备写权限，则回退到 GitHub MCP。
- Shell 脚本 `agent_pr_automerge_and_sync.sh` 仅负责 `gh` 通道；默认只创建/更新 PR。若要开启 auto-merge，必须显式传入 `--enable-auto-merge`，且 PR 上已存在指定审计 Agent 的 `FINAL-VERDICT` + `ACCEPT` 评论。GitHub MCP 通道应复用 `agent_github_delivery.py` 生成的 payload，并通过会话内 GitHub 工具执行远程 PR/评论操作。

- 所有脚本使用 `set -euo pipefail`
- 退出码：`0` 成功，`1` 可恢复失败，`2` 不可恢复失败
- 输出前缀：`[OK]`、`[FAIL]`、`[SKIP]`、`[WARN]`


本仓库在执行 `agent_task_begin.sh`、`agent_worktree_setup.sh` 或 `agent_controlplane_sync.sh` 后启用 repo-managed git hooks：`.githooks/pre-commit` 阻止控制面根目录提交，`.githooks/pre-push` 阻止直接推送 `main`。
