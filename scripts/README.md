# Scripts

自动化脚本，供 Agent 在交付流程中调用。交付规则见 `docs/delivery-skill.md`。

## 脚本清单

| 脚本                               | 职责                                            | 调用时机           |
| ---------------------------------- | ----------------------------------------------- | ------------------ |
| `agent_controlplane_sync.sh`       | 同步控制面的 main 到最新                        | 阶段 3 前 + 阶段 6 |
| `agent_worktree_setup.sh`          | 创建 worktree 隔离环境                          | 阶段 3：环境隔离   |
| `agent_pr_preflight.sh`            | PR 前的预检查                                   | 阶段 5：提交前     |
| `agent_pr_automerge_and_sync.sh`   | 创建 PR + auto-merge + 等待                     | 阶段 5：提交与合并 |
| `main_audit_resign.sh`             | RUN_LOG 主会话审计重签（`Reviewed-HEAD-SHA`）   | BEHIND/sync 后修复 |
| `agent_worktree_cleanup.sh`        | 清理 worktree                                   | 阶段 6：收口       |
| `team_delivery_status.py`          | 聚合 Team/GitHub/Governance 状态并给出可合并判定 | 盯盘/收口阶段      |
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
  - 当前任务 Rulebook 路径可定位于 `rulebook/tasks/<task-id>`（active）或 `rulebook/tasks/archive/*-<task-id>`（archive）
  - 当前任务位于 active 时必须 `rulebook task validate` 通过；位于 archive 时必须具备 `.metadata.json` / `proposal.md` / `tasks.md`
  - `openspec/changes/*/tasks.md` 的固定 TDD 章节顺序
  - 活跃 change 若已“全部勾选完成”，必须已归档至 `openspec/changes/archive/`
  - 多活跃 change（>=2）时 `openspec/changes/EXECUTION_ORDER.md` 的存在与同步更新
  - `task/<N>-<slug>` 对应 GitHub Issue `#N` 必须为 `OPEN`（阻断复用已关闭/历史 Issue）
  - `openspec/_ops/task_runs/ISSUE-<N>.md` 的 `PR` 字段不得为占位符（必须为真实链接）
- `agent_pr_preflight.sh` 支持 `--mode fast|full`：
  - `fast`：治理与签字链路快检（Issue/Rulebook/RUN_LOG/Main Audit/doc 时间戳/OpenSpec 结构）
  - `full`：在 `fast` 基础上再执行 `prettier/typecheck/lint/contract/cross-module/test:unit`
- `agent_pr_automerge_and_sync.sh` 在 GitHub TLS 抖动时会标记 `transient` 并自动重试，必要时回退到 `gh run list` 快照通道。
