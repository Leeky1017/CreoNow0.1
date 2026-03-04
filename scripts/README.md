# Scripts

自动化脚本，供 Agent 在交付流程中调用。交付规则见 `docs/delivery-skill.md`。

## 脚本清单

| 脚本                               | 职责                                            | 调用时机           |
| ---------------------------------- | ----------------------------------------------- | ------------------ |
| `agent_controlplane_sync.sh`       | 同步控制面的 main 到最新                        | 阶段 3 前 + 阶段 6 |
| `agent_worktree_setup.sh`          | 创建 worktree 隔离环境                          | 阶段 3：环境隔离   |
| `agent_pr_preflight.sh`            | 提交前 / PR 前的预检查                          | 阶段 5：提交前     |
| `agent_pr_automerge_and_sync.sh`   | 创建 PR + auto-merge + 等待                     | 阶段 5：提交与合并 |
| `agent_worktree_cleanup.sh`        | 清理 worktree                                   | 阶段 6：收口       |
| `ipc-acceptance-gate.ts`           | IPC acceptance SLO 门禁                         | 阶段 4：实现与测试 |
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
- `agent_pr_preflight.sh` 为轻量预检入口，直接执行：
  - `scripts/agent_pr_preflight.sh`
- 一键提交前预检命令（可直接复制）：
  - `scripts/agent_pr_preflight.sh`
- `agent_worktree_setup.sh` 默认会在新 worktree 内执行 `pnpm install --frozen-lockfile`（可用 `--no-bootstrap` 关闭）。
- `agent_pr_automerge_and_sync.sh` 在 preflight 通过后执行 auto-merge；遇到 `REVIEW_REQUIRED` 会阻断并提示先完成评审。
- `agent_pr_automerge_and_sync.sh` 在 GitHub TLS 抖动时会标记 `transient` 并自动重试，必要时回退到 `gh run list` 快照通道。
