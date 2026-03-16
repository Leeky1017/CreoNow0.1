# CreoNow Copilot Instructions

在这个仓库里，VS Code / GitHub Copilot Agent 不应把 GitHub 交付理解成“用户手动补最后一步”。请遵守以下规则：

- 先读 `AGENTS.md`、`openspec/project.md`、相关 `openspec/specs/<module>/spec.md`、`docs/delivery-skill.md`。
- 默认禁止在控制面 `main` 根目录直接实现；先运行 `scripts/agent_task_begin.sh <N> <slug>` 进入 `.worktrees/issue-<N>-<slug>`（gh-only；若仅有 MCP，请改走手动脚本链路）。
- 优先复用仓库脚本，而不是即兴拼命令：
  - `scripts/agent_task_begin.sh`
  - `scripts/agent_git_hooks_install.sh`
  - `scripts/agent_worktree_setup.sh`
  - `scripts/agent_pr_preflight.sh`
  - `scripts/agent_pr_automerge_and_sync.sh`
  - `python3 scripts/agent_github_delivery.py capabilities|pr-payload|comment-payload|audit-pass`
- 发起 GitHub Issue / PR / comment 之前，先运行：
  - `python3 scripts/agent_github_delivery.py capabilities`
- 通道选择规则：
  - `selected_channel=gh`：继续使用本地 `gh` / 仓库脚本。
  - `selected_channel=mcp`：改用 GitHub MCP / API，并继续复用 `agent_github_delivery.py` 生成 payload。
  - `selected_channel=none`：明确报告 `missing_tool / missing_auth / missing_permission`，不要只说“没有 gh 上下文”。
- 默认策略：**只创建 / 更新 PR，不自动开启 auto-merge**。
  - auto-merge 默认关闭。
  - 只有在指定审计 Agent 已发布 `FINAL-VERDICT` 且结论为 `ACCEPT` 后，才允许显式执行 `scripts/agent_pr_automerge_and_sync.sh --enable-auto-merge`。
- 不要在尚未尝试 `gh` 与 GitHub MCP 两条通道前，把 PR 创建、PR 评论、Issue 更新甩回给用户手工完成。
- PR 文案必须遵循 `.github/pull_request_template.md`：包含 `Closes #N`、验证证据、回滚点、审计门禁。
- 修改 GitHub 交付脚本或文档时，要同步维护 `AGENTS.md`、`CLAUDE.md`、`docs/delivery-skill.md`、`docs/references/toolchain.md`、`scripts/README.md` 的一致性。

可在 VS Code Chat Diagnostics 中确认这些 instructions / prompt files / agents 是否已加载。

## Recommended specialized entrypoints

- Use `creonow-delivery` for end-to-end Issue / PR handoff.
- Use `creonow-audit` when the task is review-only and you must publish tiered audit comments (`PRE-AUDIT`, `RE-AUDIT`, `FINAL-VERDICT`) per the adaptive audit protocol in `AGENTS.md` §六.
- Use `creonow-fix-ci` when the task is to repair failing CI on an existing Issue / PR chain without breaking audit continuity.

## Audit system

审计体系采用分层自适应审计（Tiered Adaptive Audit）。审计 Agent 必须：

1. 先运行变更分类（`docs/delivery-skill.md` §8.0），判定 WHERE / RISK / SCOPE
2. 根据分类选择审计层级：`scripts/review-audit.sh L|S|D`
3. 加载 `docs/references/audit-playbooks/` 下对应 Playbook 执行专项检查
4. 涉及行为变更时，执行功能性验证（`functional-verification.md`），确认功能真的生效
5. 评论模型按层级自适应（L=单条，S=双条，D=三条+）

详见 `AGENTS.md` §六、`docs/delivery-skill.md` §八。
