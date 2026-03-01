# Scripts

自动化脚本，供 Agent 在交付流程中调用。交付规则见 `docs/delivery-skill.md`。

## 脚本清单

| 脚本                               | 职责                                            | 调用时机           |
| ---------------------------------- | ----------------------------------------------- | ------------------ |
| `agent_controlplane_sync.sh`       | 同步控制面的 main 到最新                        | 阶段 3 前 + 阶段 6 |
| `agent_worktree_setup.sh`          | 创建 worktree 隔离环境                          | 阶段 3：环境隔离   |
| `agent_pr_preflight.sh`            | 提交前 / PR 前的预检查                          | 阶段 5：提交前     |
| `agent_pr_automerge_and_sync.sh`   | 创建 PR + auto-merge + 等待                     | 阶段 5：提交与合并 |
| `main_audit_resign.sh`             | RUN_LOG 主会话审计重签（`Reviewed-HEAD-SHA`）   | BEHIND/sync 后修复 |
| `independent_review_record.sh`     | 生成 `openspec/_ops/reviews/ISSUE-<N>.md` 初稿  | 独立审计执行前     |
| `validate_independent_review_ci.py`| 校验独立审计记录（CI）                          | `openspec-log-guard` 内 |
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
  - `## Main Session Audit` 的 `Reviewed-HEAD-SHA` 不得保留占位值（如 `PENDING_SHA` / `TBD`）；命中后会本地阻断并提示执行 `scripts/main_audit_resign.sh --issue <N> --preflight-mode fast`
- `agent_pr_preflight.sh` 支持 `--mode commit|fast|full`：
  - `commit`：task 分支提交前本地快检（仅校验 staged 文件），拦截文档时间戳格式与 `openspec/_ops/task_runs/ISSUE-*.md` 缺少 `## Main Session Audit` 段落
  - `fast`：治理与签字链路快检（Issue/Rulebook/RUN_LOG/Main Audit/doc 时间戳/OpenSpec 结构）
  - `full`：在 `fast` 基础上再执行 `prettier/typecheck/lint/contract/cross-module/test:unit`
- 一键提交前预检命令（可直接复制）：
  - `scripts/agent_pr_preflight.sh --mode commit`
- Main Session Audit 回填标准操作：
  - 回填时机：功能改动提交完成后、推送分支前执行一次重签；若后续又有代码提交，必须再次重签
  - 回填命令：`scripts/main_audit_resign.sh --issue <N> --preflight-mode fast`（会刷新 `Reviewed-HEAD-SHA` 并立即做本地快检）
- 独立审计记录标准操作：
  - 生成初稿：`scripts/independent_review_record.sh --issue <N> --author <agent> --reviewer <agent> --pr-url <url>`
  - 审计签字：填写 Findings/Verification，并确保 `Decision=PASS`、`Reviewed-HEAD-SHA` 对齐代码审计基线（最终签字序列 `HEAD^^`）
- `agent_worktree_setup.sh` 默认会在新 worktree 内执行 `pnpm install --frozen-lockfile`（可用 `--no-bootstrap` 关闭）。
- `agent_pr_automerge_and_sync.sh` 在回填 RUN_LOG PR 链接后会自动执行 `main_audit_resign.sh`；并且遇到 `REVIEW_REQUIRED` 时会阻断合并，不再走 admin bypass。
- `agent_pr_automerge_and_sync.sh` 在 GitHub TLS 抖动时会标记 `transient` 并自动重试，必要时回退到 `gh run list` 快照通道。
