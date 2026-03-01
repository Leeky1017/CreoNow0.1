# Delivery Rule Mapping Matrix (CN Skill v2)

更新时间：2026-03-01 14:10

本表用于审计“规则声明 -> 仓库门禁 -> 脚本校验”是否一致。

| 规则项                              | 外部 Skill                                       | 仓库规则主源                         | 宪法入口             | Workflow / Script                                                                                 |
| ----------------------------------- | ------------------------------------------------ | ------------------------------------ | -------------------- | ------------------------------------------------------------------------------------------------- |
| 身份锚点：Issue / Branch / RUN_LOG  | `openspec-rulebook-github-delivery/SKILL.md` §一 | `docs/delivery-skill.md` §一         | `AGENTS.md` P3 + §五 | `openspec-log-guard.yml`, `agent_pr_preflight.py`                                                 |
| Spec-first + Rulebook-first         | 外部 Skill §二 规则 1                            | `docs/delivery-skill.md` §二 规则 1  | `AGENTS.md` P1 + §五 | `agent_pr_preflight.py`（Rulebook validate 强制）                                                 |
| 红灯先行（TDD）                     | 外部 Skill §二 规则 2                            | `docs/delivery-skill.md` §二 规则 2  | `AGENTS.md` P2       | CI `unit-test`, `integration-test`                                                                |
| 证据落盘（RUN_LOG）                 | 外部 Skill §二 规则 3                            | `docs/delivery-skill.md` §二 规则 3  | `AGENTS.md` P3       | `openspec-log-guard.yml`                                                                          |
| 门禁一致（文档=远端）               | 外部 Skill §二 规则 4                            | `docs/delivery-skill.md` §二 规则 4  | `AGENTS.md` P4       | branch protection required checks                                                                 |
| 门禁全绿 + auto-merge               | 外部 Skill §二 规则 5                            | `docs/delivery-skill.md` §二 规则 5  | `AGENTS.md` P4       | `ci.yml`, `merge-serial.yml`, `openspec-log-guard.yml`                                            |
| 控制面收口（必须回到 `main`）       | 外部 Skill §二 规则 6                            | `docs/delivery-skill.md` §二 规则 6  | `AGENTS.md` P4 + §五 | `agent_pr_preflight.py`（分支与任务收口校验）                                                     |
| 主会话审计强制（子代理完成≠可合并） | 外部 Skill §二 规则 3/5                          | `docs/delivery-skill.md` §二 规则 16 | `AGENTS.md` P3 + P4  | `agent_pr_preflight.py` + `openspec-log-guard.yml`（`Reviewed-HEAD-SHA == HEAD^` + 签字提交隔离） |
| 独立审计前置强制（作者/审计分离）   | 外部 Skill §二 规则 5                            | `docs/delivery-skill.md` §二 规则 17 | `AGENTS.md` P4 + P7  | `openspec-log-guard.yml` + `validate_independent_review_ci.py`（`Author-Agent != Reviewer-Agent` + `Decision=PASS` + `Reviewed-HEAD-SHA == HEAD^^`） |
| 非 task 分支必须 Skip-Reason        | 外部 Skill §四                                   | `docs/delivery-skill.md` §四         | `AGENTS.md` §七      | `openspec-log-guard.yml`                                                                          |
| gh 超时 3 次 + 升级                 | 外部 Skill §四                                   | `docs/delivery-skill.md` §四         | `AGENTS.md` §七      | 执行规范（RUN_LOG 记录）                                                                          |

## Canonical Checks

- `ci`
- `openspec-log-guard`
- `merge-serial`

若 GitHub branch protection 与上面三项不一致，按 blocker 处理，不得宣称“门禁全绿”。
