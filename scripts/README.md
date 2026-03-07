# Scripts

更新时间：2026-03-07 11:44

自动化脚本，供 Agent 在交付流程中调用。交付规则见 `docs/delivery-skill.md`，测试规范主源见 `docs/references/testing/README.md`。

## 脚本清单

| 脚本                               | 职责                                            | 调用时机           |
| ---------------------------------- | ----------------------------------------------- | ------------------ |
| `agent_controlplane_sync.sh`       | 同步控制面的 main 到最新                        | 阶段 3 前 + 阶段 6 |
| `agent_worktree_setup.sh`          | 创建 worktree 隔离环境                          | 阶段 3：环境隔离   |
| `agent_pr_preflight.sh`            | 提交前 / PR 前的预检查                          | 阶段 5：提交前     |
| `agent_pr_automerge_and_sync.sh`   | 创建 PR；默认不开 auto-merge，显式开启时需审计通过（仅 gh 通道） | 阶段 5：提交与合并 |
| `agent_github_delivery.py`        | GitHub 能力探测、PR/评论模板、gh/MCP 通道选择   | 阶段 5：提交与合并 |
| `agent_worktree_cleanup.sh`        | 清理 worktree                                   | 阶段 6：收口       |
| `ipc-acceptance-gate.ts`           | IPC acceptance SLO 门禁                         | 阶段 4：实现与测试 |
| `test-discovery-consistency-gate.ts` | 测试发现与执行计划一致性校验                    | 阶段 4：实现与测试 |
| `check_doc_timestamps.py`            | 受管 Markdown 时间戳校验                        | 文档治理 / 手动      |
| `contract-generate.ts`             | 生成 IPC 契约类型定义                           | CI / 手动          |
| `cross-module-contract-gate.ts`    | cross-module 契约对齐门禁                       | CI / preflight     |
| `cross-module-contract-autofix.ts` | cross-module 失败分类与安全自动修复（开发分支） | 开发分支手动触发   |

## 使用约定

- 所有脚本使用 `set -euo pipefail`
- 退出码：`0` 成功，`1` 可恢复失败，`2` 不可恢复失败
- 输出前缀：`[OK]` / `[FAIL]` / `[SKIP]` / `[WARN]`
- 脚本入口校验必要参数，缺失时打印 usage 并退出
- `agent_pr_preflight.py` 会校验：
  - 分支命名必须符合 `task/<N>-<slug>`
  - `task/<N>-<slug>` 对应 GitHub Issue `#N` 必须为 `OPEN`（阻断复用已关闭/历史 Issue）
  - 当前分支的开放 PR body 必须包含 `Closes #N`
- 受管 Markdown 变更若需校验时间戳，请单独执行：
  - `python3 scripts/check_doc_timestamps.py`
- `agent_pr_preflight.sh` 为轻量预检入口，直接执行：
  - `scripts/agent_pr_preflight.sh`
- 一键提交前预检命令（可直接复制）：
  - `scripts/agent_pr_preflight.sh`
- `agent_worktree_setup.sh` 默认会在新 worktree 内执行 `pnpm install --frozen-lockfile`（可用 `--no-bootstrap` 关闭）。
- `agent_pr_automerge_and_sync.sh` 默认只创建/更新 PR，不自动开启 auto-merge；必须在指定审计 Agent 留下 `FINAL-VERDICT` + `ACCEPT` 评论后，显式传入 `--enable-auto-merge` 才会继续。
- `agent_pr_automerge_and_sync.sh` 在 GitHub TLS 抖动时会标记 `transient` 并自动重试，必要时回退到 `gh run list` 快照通道。
- `agent_github_delivery.py capabilities` 会输出结构化能力探测结果：`gh` 是否安装/认证、GitHub MCP 是否可用/可写、以及当前应选通道。
- `agent_pr_automerge_and_sync.sh` 进入 GitHub 远程操作前会先校验所选通道；若结果不是 `gh`，会明确阻断并提示改用 GitHub MCP + `agent_github_delivery.py` 生成的 payload。
- GitHub MCP 回退路径依赖环境变量：`CODEX_GITHUB_CHANNEL`（`auto|gh|mcp|none`）、`CODEX_GITHUB_MCP_AVAILABLE`、`CODEX_GITHUB_MCP_WRITE_CAPABLE`。
- `agent_github_delivery.py pr-payload` / `comment-payload` 负责统一 PR title/body 与阻断评论文案，避免不同通道各写一套模板。
- 可选环境变量：`AGENT_PR_SUMMARY`、`AGENT_PR_USER_IMPACT`、`AGENT_PR_WORST_CASE`、`AGENT_PR_ROLLBACK_REF`，用于在自动创建 PR 时覆盖默认占位文案。
