# OpenSpec + GitHub 交付规则

更新时间：2026-03-04 12:00

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
| Worktree | `.worktrees/issue-<N>-<slug>`          | `.worktrees/issue-42-memory-decay` |

Commit type：`feat` / `fix` / `refactor` / `test` / `docs` / `chore` / `ci`

---

## 二、交付规则（硬约束）

1. **Spec-first**：任何功能变更必须先有 OpenSpec spec。
2. **红灯先行**：测试必须先失败再通过（Red → Green → Refactor），禁止先写实现再补测试。
3. **依赖同步检查**：若 change 依赖其他 change，进入实现前必须确认上游状态，发现漂移先更新文档再继续。
4. **证据落盘**：CI 失败和修复过程必须记录在 PR comment 中，禁止 silent failure。
5. **门禁一致**：文档契约与 GitHub required checks 必须一致；不一致时必须阻断并升级。
6. **门禁全绿 + 串行合并**：PR 必须通过 `ci`、`merge-serial`，并启用 auto-merge。
7. **控制面收口**：所有变更提交后必须合并回控制面 `main`，仅停留在 `task/*` 分支不算交付完成。
8. **Issue 新鲜度强制**：新任务必须使用当前 OPEN Issue；禁止复用已关闭或历史 Issue。
9. **环境基线强制**：创建 `task/*` 分支和 worktree 前，必须先同步控制面到最新 `origin/main`。
10. **完成变更归档强制**：当 `openspec/changes/<change>/tasks.md` 全部勾选完成时，必须归档到 `openspec/changes/archive/`。

---

## 三、工作流阶段

| 阶段          | 完成条件                                                                                                           |
| ------------- | ------------------------------------------------------------------------------------------------------------------ |
| 1. 任务准入   | 当前 OPEN Issue 已创建或认领，`N` 和 `SLUG` 已确定                                                                 |
| 2. 规格制定   | OpenSpec spec 已编写或更新；若有上游依赖则已确认上游状态                                                     |
| 3. 环境隔离   | 控制面 `origin/main` 已同步，Worktree 已创建，工作目录已切换                                                       |
| 4. 实现与测试 | 按 TDD 循环实现；所有测试通过                                            |
| 5. 提交与合并 | PR 已创建；auto-merge 已开启；CI 全绿；PR 已确认合并                     |
| 6. 收口与归档 | 控制面 `main` 已包含任务提交；worktree 已清理                                                                       |

---

## 四、异常处理规则

| 情况                                 | 规则                                                                                        |
| ------------------------------------ | --------------------------------------------------------------------------------------- |
| `gh` 命令超时                        | 最多重试 3 次（间隔 10s），仓失败必须在 PR comment 记录并升级                              |
| PR 需要 review                       | 记录 blocker，通知 reviewer，等待处理，禁止 silent abandonment                              |
| checks 失败                          | 修复后重新 push，重跑并记录失败原因和修复证据                                               |
| Spec 不存在或不完整                  | 必须先补 spec 并确认，禁止猜测实现                                                          |
| 上游依赖与当前 change 假设不一致 | 先更新 proposal/spec/tasks 再进入实现                                                         |
| 非 `task/*` 分支提交 PR              | PR body 必须包含 `Skip-Reason:`                                                          |
| 改动仅停留在 `task/*` 分支           | 继续完成合并回 `main`                                                                   |
| required checks 与本文件不一致       | 阻断交付并升级治理，禁止宣称“门禁全绿”                                                      |
| 误用已关闭/历史 Issue                | 立即停止实现，改为新建 OPEN Issue，并从最新 `origin/main` 重建 worktree                     |
| 活跃 change 已完成但未归档           | 阻断交付，先归档到 `openspec/changes/archive/` 再继续                                       |

---

## 五、双体系协作

```
OpenSpec（做什么）     GitHub（怎么验收）
openspec/             .github/workflows/
```

- **OpenSpec**：定义行为和约束，Agent 实现前必须阅读。
- **GitHub**：以 required checks 和 auto-merge 作为最终验收门禁。

规则冲突时，以本文件为主源；`AGENTS.md` 与外部 Skill 必须保持一致。

---

## 六、防返工复盘（强制对齐）

- 既往不符合项 A：复用历史/已关闭 Issue 执行新任务，导致上下文错位与返工。
  - 现行防线：仅允许使用当前 OPEN Issue；preflight 强制校验 Issue 状态。
- 既往不符合项 B：串行依赖只维护顺序，未强制下游在实现前核对上游产出，导致需求漂移返工。
  - 现行防线：对存在上游依赖的 change 强制确认上游状态，发现漂移先更新 change 文档再进入实现。
- 既往不符合项 C：活跃 change 已完成但未归档，遂回让后续 Agent 错误认为其仍活跃。
  - 现行防线：完成变更归档强制（规则 10）防止历史残留活跃目录。

---

## 七、文档时间戳治理（强制对齐）

为减少文档静默漂移造成的误导，受管文档必须包含时间戳。

- 规则主源：`docs/references/document-timestamp-governance.md`
- 校验脚本：`scripts/check_doc_timestamps.py`
- 文档时间戳由 `scripts/check_doc_timestamps.py` 在本地校验（preflight），不阻塞 CI 合并。

---

## 八、独立审计协议（Reviewer SOP）

适用对象：被指派为 reviewer 的独立审计 Agent。

### 审计步骤

1. **读 PR diff**：`gh pr diff <PR_NUMBER>` 或在 GitHub UI 查看全部变更文件
2. **读关联 spec**：`openspec/specs/<module>/spec.md` + `openspec/changes/<change>/` 下的 delta spec
3. **跑验证命令**：至少执行 typecheck (`pnpm typecheck`) + 相关测试 (`pnpm -C apps/desktop test:run <path>`)，命令输出必须完整记录作为证据
4. **识别问题并分级**：逐文件审查，每个问题必须引用具体文件路径和行号，附上问题代码片段与修复建议
   - BLOCKER：违反核心原则、安全漏洞、数据丢失风险 → 必须修复后才能合并
   - SIGNIFICANT：超出 spec 范围、类型重复、死路径、测试缺失 → 应修复，可协商
   - MINOR：措辞、格式、可读性 → 不阻塞合并，记录即可
5. **在 PR 下发评论**：将审计结论（判定 + 问题清单 + checklist）作为 PR comment 发布，格式见下
6. **等待修复**：如果 Decision=HOLD/FAIL，等作者修复后进行二轮复审，复审结论同样以 PR comment 发布
7. **发布审计结论**：Decision=PASS 后，在 PR comment 中发布最终审计结论（含判定、问题清单、验证结果）

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
- 验证命令的完整输出（通过或失败）必须包含在 PR 评论中
