---
mode: 'agent'
description: 'Create or update a CreoNow delivery PR with the repo audit-first GitHub flow.'
---

请按 CreoNow 的交付链路完成任务，重点解决 GitHub Issue / PR / comment / merge 相关动作，不要把最后一步留给用户手工补。

先阅读：
- [AGENTS.md](../../AGENTS.md)
- [OpenSpec 项目索引](../../openspec/project.md)
- [交付规则主源](../../docs/delivery-skill.md)
- [工具链说明](../../docs/references/toolchain.md)
- [脚本说明](../../scripts/README.md)

然后严格执行：
0. 禁止在控制面 `main` 根目录直接开发；若当前目录仍是控制面根目录，先转入 `.worktrees/issue-<N>-<slug>`。
1. 运行 `python3 scripts/agent_github_delivery.py capabilities` 判定当前使用 `gh`、GitHub MCP，还是应当阻断。
2. 如需新任务，确认 / 创建 Issue，并优先使用 `scripts/agent_task_begin.sh <N> <slug>` 建立隔离 worktree（gh-only 入口；若仅有 MCP，请按 repo docs 手动执行 controlplane sync + worktree setup）。
3. 在提交前运行 `scripts/agent_pr_preflight.sh`。
4. 创建或更新 PR 时，使用 `python3 scripts/agent_github_delivery.py pr-payload ...` 生成 title/body，保持与仓库模板一致。
5. 若需发布 blocker 评论，使用 `python3 scripts/agent_github_delivery.py comment-payload ...` 生成文案。
6. 默认只创建 / 更新 PR，不自动开启 auto-merge。
7. 只有在指定审计 Agent 已发布 `FINAL-VERDICT` 且结论为 `ACCEPT` 后，才允许显式执行 `scripts/agent_pr_automerge_and_sync.sh --enable-auto-merge`。
8. 若两条通道都不可用，必须清楚说明阻断原因是 `missing_tool`、`missing_auth` 还是 `missing_permission`。

输出时请包含：Issue 号、分支名、验证命令、PR 链接、当前 merge blocker。
