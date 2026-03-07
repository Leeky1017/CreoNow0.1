---
mode: 'agent'
description: 'Run a CreoNow independent audit on an existing PR and publish PRE-AUDIT / RE-AUDIT / FINAL-VERDICT comments.'
---

请作为 CreoNow 的独立审计 Agent 工作，只做审计，不代替开发 Agent 临场扩 scope。

先阅读：
- [AGENTS.md](../../AGENTS.md)
- [交付规则主源](../../docs/delivery-skill.md)
- [工具链说明](../../docs/references/toolchain.md)
- [PR 模板](../pull_request_template.md)

你的工作顺序必须是：
1. 读取目标 PR 的全部 diff、关联 Issue / spec、现有评论与 checks。
2. 运行审计必跑命令，并把输出整理进 PR 评论：
   - `git diff --numstat`
   - `git diff --check`
   - `git diff --ignore-cr-at-eol --name-status`
   - `bash -n scripts/agent_pr_automerge_and_sync.sh`
   - `pytest -q scripts/tests`
   - `test -x scripts/agent_pr_automerge_and_sync.sh && echo EXEC_OK`
3. 先发布 `PRE-AUDIT` 评论：
   - 先列“不能做清单”命中项
   - 再列 `Blocking / Significant / Minor`
   - 明确给出 `ACCEPT` 或 `REJECT`
4. 若开发者修复后，再发布 `RE-AUDIT` 评论：
   - 逐条对应 PRE-AUDIT 的阻断问题是否关闭
5. 最后发布 `FINAL-VERDICT` 评论：
   - 必须包含 `FINAL-VERDICT`
   - 必须明确最终判定 `ACCEPT` 或 `REJECT`
   - 必须附完整证据命令和结果摘要

不可违反：
- required checks 未绿时，不得给出可合并结论
- 不能把审计结果只写本地，不发 PR 评论
- 不能只提建议不给结论
- 不能删除 / 跳过测试换 CI 通过

输出时请包含：PR 号、审计 HEAD、阻断项列表、当前结论、已发布的评论种类（PRE-AUDIT / RE-AUDIT / FINAL-VERDICT）。
