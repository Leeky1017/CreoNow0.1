# OpenSpec + Rulebook + GitHub 交付规则

更新时间：2026-03-01 22:00

本文件是 CreoNow 的交付规则主源（Source of Truth）。
本文件只定义约束条件和验收标准，不定义具体命令和脚本参数。

命令与脚本用法参见 `scripts/README.md`。

---

## 一、命名约定

| 实体     | 格式                                   | 示例                               |
| -------- | -------------------------------------- | ---------------------------------- |
| Issue    | GitHub Issue，自动分配编号 `N`         | `#42`                              |
| Branch   | `task/<N>-<slug>`                      | `task/42-memory-decay`             |
| Commit   | `<type>: <summary> (#<N>)`             | `feat: add memory decay (#42)`     |
| PR title | `<summary> (#<N>)`                     | `Add memory decay (#42)`           |
| PR body  | 必须包含 `Closes #<N>`                 | `Closes #42`                       |
| RUN_LOG  | `openspec/_ops/task_runs/ISSUE-<N>.md` | `ISSUE-42.md`                      |
| Worktree | `.worktrees/issue-<N>-<slug>`          | `.worktrees/issue-42-memory-decay` |

Commit type：`feat` / `fix` / `refactor` / `test` / `docs` / `chore` / `ci`

---

## 二、交付规则（硬约束）

1. **Spec-first + Rulebook-first**：任何功能变更必须先有 OpenSpec spec，并且 Rulebook task 必须可定位（`active` 或 `archive`）；若位于 `active`，必须通过 `validate`。
2. **红灯先行**：测试必须先失败再通过（Red → Green → Refactor），禁止先写实现再补测试。
3. **Change 文档 TDD 结构强制**：每个 `openspec/changes/<change>/tasks.md` 必须按固定顺序撰写 `Specification → TDD Mapping → Red → Green → Refactor → Evidence`。
4. **Red 证据前置**：`TDD Mapping` 未建立 Scenario→测试映射，或未记录 Red 失败测试证据，不得进入 Green 实现。
5. **多 change 执行顺序文档强制**：当活跃 change ≥ 2，必须维护 `openspec/changes/EXECUTION_ORDER.md`（执行模式、顺序、依赖、更新时间，精确到小时和分钟，格式 `YYYY-MM-DD HH:mm`）。
6. **顺序文档同步强制**：任一活跃 change 的范围/依赖/状态变更时，必须同步更新 `EXECUTION_ORDER.md`。
7. **依赖同步检查强制**：若 change 依赖其他 change，进入 Red 前必须完成 `Dependency Sync Check`，并在 `tasks.md` 与 RUN_LOG 记录“无漂移/已更新”结论。
8. **依赖漂移先更新文档**：若发现上游产出与当前 change 假设不一致，必须先更新 `proposal.md`、`specs/*`、`tasks.md`（必要时同步 `EXECUTION_ORDER.md`）再进入实现。
9. **证据落盘**：关键命令输入输出必须写入 RUN_LOG，禁止 silent failure。
10. **门禁一致**：文档契约与 GitHub required checks 必须一致；不一致时必须阻断并升级。
11. **门禁全绿 + 串行合并**：PR 必须通过 `ci`、`openspec-log-guard`、`merge-serial`，并启用 auto-merge。
12. **控制面收口**：所有变更提交后必须合并回控制面 `main`，仅停留在 `task/*` 分支不算交付完成。
13. **Issue 新鲜度强制**：新任务必须使用当前 OPEN Issue；禁止复用已关闭或历史 Issue。
14. **环境基线强制**：创建 `task/*` 分支和 worktree 前，必须先同步控制面到最新 `origin/main`。
15. **RUN_LOG PR 真实链接强制**：`openspec/_ops/task_runs/ISSUE-<N>.md` 的 `PR` 字段不得为占位符（如 `待回填/TBD/TODO`）。
16. **主会话审计强制**：RUN_LOG 必须包含 `## Main Session Audit`，且同时满足 `Audit-Owner=main-session`、`Reviewed-HEAD-SHA==签字提交的 HEAD^`、`Spec-Compliance/Code-Quality/Fresh-Verification` 全部 `PASS`、`Blocking-Issues=0`、`Decision=ACCEPT`；并且签字提交 `HEAD^..HEAD` 仅允许变更当前任务 RUN_LOG。任一不满足必须被 preflight 与 `openspec-log-guard` 阻断，子代理完成不得替代主会话签字。
17. **独立审计前置强制**：`task/<N>-<slug>` 分支进入合并前，必须存在 `openspec/_ops/reviews/ISSUE-<N>.md` 并通过独立审计校验：`Author-Agent != Reviewer-Agent`、`Decision=PASS`、`Reviewed-HEAD-SHA==签字提交的 HEAD^^（代码审计基线）`；由 `openspec-log-guard` 阻断未满足场景。
18. **完成变更归档强制**：当 `openspec/changes/<change>/tasks.md` 全部勾选完成时，必须归档到 `openspec/changes/archive/`，不得继续停留在活跃目录。
19. **Rulebook 自归档无递归**：允许当前任务在同一 PR 中将自身 Rulebook task 从 `active` 归档到 `archive`；不得仅为“归档当前任务”再创建递归 closeout issue。

---

## 三、工作流阶段

| 阶段          | 完成条件                                                                                                           |
| ------------- | ------------------------------------------------------------------------------------------------------------------ |
| 1. 任务准入   | 当前 OPEN Issue 已创建或认领，`N` 和 `SLUG` 已确定                                                                 |
| 2. 规格制定   | OpenSpec spec 已编写或更新；Rulebook task 已创建并通过 validate；若有上游依赖则 Dependency Sync Check 已完成并落盘 |
| 3. 环境隔离   | 控制面 `origin/main` 已同步，Worktree 已创建，工作目录已切换                                                       |
| 4. 实现与测试 | 按 TDD 循环实现；所有测试通过；RUN_LOG 已记录                                                                      |
| 5. 提交与合并 | PR 已创建；独立审计记录已通过；auto-merge 已开启；三个 checks 全绿；PR 已确认合并                                  |
| 6. 收口与归档 | 控制面 `main` 已包含任务提交；worktree 已清理；Rulebook task 已归档（可同 PR 自归档，无需递归 closeout issue）     |

---

## 四、异常处理规则

| 情况                                 | 规则                                                                                        |
| ------------------------------------ | ------------------------------------------------------------------------------------------- | -------------------------- |
| `gh` 命令超时                        | 最多重试 3 次（间隔 10s），仍失败必须记录 RUN_LOG 并升级                                    |
| PR 需要 review                       | 记录 blocker，通知 reviewer，等待处理，禁止 silent abandonment                              |
| 独立审计缺失或未通过                 | 阻断交付；先补齐 `openspec/_ops/reviews/ISSUE-<N>.md` 并满足 Author/Reviewer 分离 + PASS + SHA 对齐，再继续        |
| checks 失败                          | 修复后重新 push，重跑并记录失败原因和修复证据                                               |
| Spec 不存在或不完整                  | 必须先补 spec 并确认，禁止猜测实现                                                          |
| 上游依赖产出与当前 change 假设不一致 | 先做 Dependency Sync Check 并记录，再更新 proposal/spec/tasks（必要时更新 EXECUTION_ORDER） | 跳过更新直接进入 Red/Green |
| Rulebook task 缺失或不合规           | 阻断交付，先修复 Rulebook（active 需 validate；archive 需结构完整）再继续                   |
| 非 `task/*` 分支提交 PR              | 可跳过 RUN_LOG，但 PR body 必须包含 `Skip-Reason:`                                          |
| 改动仅停留在 `task/*` 分支           | 继续完成合并回 `main` 并更新 RUN_LOG 证据                                                   |
| required checks 与本文件不一致       | 阻断交付并升级治理，禁止宣称“门禁全绿”                                                      |
| 误用已关闭/历史 Issue                | 立即停止实现，改为新建 OPEN Issue，并从最新 `origin/main` 重建 worktree                     |
| RUN_LOG PR 字段是占位符              | 先回填真实 PR 链接，再进入交付与合并流程                                                    |
| RUN_LOG 主会话审计缺失/未通过        | 阻断交付；先补齐 `## Main Session Audit` 并满足全部通过条件，确保签字提交仅变更 RUN_LOG     |
| 活跃 change 已完成但未归档           | 阻断交付，先归档到 `openspec/changes/archive/` 再继续                                       |
| 当前任务已在同 PR 归档               | 允许 preflight 通过 archive 路径校验，不要求再次创建 closeout issue                         |

---

## 五、三体系协作

```
OpenSpec（做什么）     Rulebook（怎么做）     GitHub（怎么验收）
openspec/             rulebook/tasks/        .github/workflows/
```

- **OpenSpec**：定义行为和约束，Agent 实现前必须阅读。
- **Rulebook**：记录任务拆解、执行与验证证据，交付前必须可验证。
- **GitHub**：以 required checks 和 auto-merge 作为最终验收门禁。

规则冲突时，以本文件为主源；`AGENTS.md` 与外部 Skill 必须保持一致。

---

## 六、防返工复盘（强制对齐）

- 既往不符合项 A：复用历史/已关闭 Issue 执行新任务，导致上下文错位与返工。
  - 现行防线：仅允许使用当前 OPEN Issue；preflight 强制校验 Issue 状态。
- 既往不符合项 B：`RUN_LOG` 的 `PR` 字段保留占位符进入交付，导致收口后仍需补丁返工。
  - 现行防线：preflight 阻断占位符；`agent_pr_automerge_and_sync.sh` 在创建 PR 后自动回填真实 PR 链接并重新 preflight。
- 既往不符合项 C：串行依赖只维护顺序，未强制下游在实现前核对上游产出，导致需求漂移返工。
  - 现行防线：对存在上游依赖的 change 强制执行 Dependency Sync Check，发现漂移先更新 change 文档再进入 Red/Green。
- 既往不符合项 D：治理 closeout task 归档后仍遗留 active，触发递归 closeout issue。
  - 现行防线：preflight 支持当前任务 `active/archive` 双路径，并允许同 PR 自归档收口。
- 既往不符合项 E：子代理自报完成但主会话未审计签字，仍进入合并路径。
  - 现行防线：RUN_LOG 强制 `Main Session Audit`，preflight 与 `openspec-log-guard` 双门禁校验并阻断未通过场景。

---

## 七、文档时间戳治理（强制对齐）

为减少文档静默漂移造成的误导，受管文档必须包含时间戳，并通过 CI/Preflight 自动校验阻断缺失场景。

- 规则主源：`docs/references/document-timestamp-governance.md`
- 校验脚本：`scripts/check_doc_timestamps.py`
- CI 接入：`.github/workflows/ci.yml` 的 `doc-timestamp-gate` job（接入 required check `ci` 的 `needs`）

---

## 八、独立审计协议（Reviewer SOP）

适用对象：被指派为 reviewer 的独立审计 Agent。

### 审计步骤

1. **读 PR diff**：`gh pr diff <PR_NUMBER>` 或在 GitHub UI 查看全部变更文件
2. **读关联 spec**：`openspec/specs/<module>/spec.md` + `openspec/changes/<change>/` 下的 delta spec
3. **跑验证命令**：至少执行 typecheck (`pnpm typecheck`) + 相关测试 (`pnpm -C apps/desktop test:run <path>`)，命令输出必须完整记录作为证据
4. **识别问题并分级**：逐文件审查，每个问题必须引用具体文件路径和行号，附上问题代码片段与修复建议
   - BLOCKER：违反 P1-P7 核心原则、安全漏洞、数据丢失风险 → 必须修复后才能合并
   - SIGNIFICANT：超出 spec 范围、类型重复、死路径、测试缺失 → 应修复，可协商
   - MINOR：措辞、格式、可读性 → 不阻塞合并，记录即可
5. **在 PR 下发评论**：将审计结论（判定 + 问题清单 + checklist）作为 PR comment 发布，格式见下
6. **等待修复**：如果 Decision=HOLD/FAIL，等作者修复后进行二轮复审，复审结论同样以 PR comment 发布
7. **生成审计记录文件**：Decision=PASS 后，调用 `scripts/independent_review_record.sh` 生成 `openspec/_ops/reviews/ISSUE-<N>.md`，填写实际 Scope/Findings/Verification
8. **提交审计记录**：作为独立 commit 提交到 task 分支（三层序列的第二层）

### PR 评论格式

```
## 独立审计报告：Issue #<N>

**审计人：** <独立审计 Agent 名称>
**审计 HEAD：** `<commit SHA 前 8 位>`

### 判定：PASS / HOLD — 需修复后方可合并 / FAIL

## 🔴 必须修复（Blocking）
...
## 🟠 应当修复（Significant）
...
## 🟡 文档缺陷
...
## ⚪ 微瑕（Minor，不阻塞）
...

## 放行前必须完成的 Checklist
| # | 项目 | 状态 |
...
```

### Decision 判定标准

- **PASS**：无 BLOCKER；SIGNIFICANT 全部已解决或已记录跟进 Issue
- **HOLD**：存在 BLOCKER 或未解决的 SIGNIFICANT → 等修复后复审
- **FAIL**：结构性问题无法通过局部修复解决 → 需要重新设计

### 不可省略

- 审计必须覆盖 PR 的全部变更文件，不得跳过
- 至少一条验证命令（typecheck / test）必须实际执行并记录结果
- PR 评论不可省略——即使 PASS 也要发 comment 记录审计结论
- 每个问题必须附带证据：具体文件路径、行号、相关代码片段
- 验证命令的完整输出（通过或失败）必须包含在 PR 评论或审计记录中
