# OpenSpec + GitHub 交付规则


本文件是 CreoNow 的交付规则主源（Source of Truth）。
本文件只定义约束条件和验收标准，不定义具体命令和脚本参数。

命令与脚本用法参见 `scripts/README.md`。
测试编写规范与测试类型选择参见 `docs/references/testing/README.md`。

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

0. **GitHub 能力探测强制**：发起 Issue / PR / comment 前，必须先运行 `python3 scripts/agent_github_delivery.py capabilities`，明确当前使用 `gh` 还是 GitHub MCP 通道。
1. **Spec-first**：任何功能变更必须先有 OpenSpec spec。
2. **红灯先行**：测试必须先失败再通过（Red → Green → Refactor），禁止先写实现再补测试。
3. **依赖同步检查**：若 change 依赖其他 change，进入实现前必须确认上游状态，发现漂移先更新文档再继续。
4. **证据落盘**：CI 失败和修复过程必须记录在 PR comment 中，禁止 silent failure。
5. **门禁一致**：文档契约与 GitHub required checks 必须一致；不一致时必须阻断并升级。
6. **门禁全绿 + 串行合并**：PR 必须通过 `ci`、`merge-serial`；auto-merge 仅可在指定审计 Agent 已发布 `FINAL-VERDICT` + `ACCEPT` 评论后显式开启。
7. **控制面收口**：所有变更提交后必须合并回控制面 `main`，仅停留在 `task/*` 分支不算交付完成。
8. **Issue 新鲜度强制**：新任务必须使用当前 OPEN Issue；禁止复用已关闭或历史 Issue。
9. **环境基线强制**：创建 `task/*` 分支和 worktree 前，必须先同步控制面到最新 `origin/main`。
10. **完成变更归档强制**：当 `openspec/changes/<change>/tasks.md` 全部勾选完成时，必须归档到 `openspec/changes/archive/`。

---

### GitHub 控制面选择

- `auto`：优先 `gh`；若 `gh` 不可用或未认证，则在 GitHub MCP 可写时回退到 GitHub MCP。
- `gh`：仅当 `gh auth status` 正常时允许继续；默认只创建/更新 PR，不自动开启 auto-merge。
- `mcp`：仅当当前会话具备 GitHub MCP 写权限时允许继续；当前主要覆盖远程 Issue / PR / comment 动作。
- 若两条通道都不可写，必须立即阻断，并在交付记录中写清缺失的是 tool / auth / permission 哪一项。

## 三、工作流阶段

| 阶段          | 完成条件                                                                                                           |
| ------------- | ------------------------------------------------------------------------------------------------------------------ |
| 1. 任务准入   | 当前 OPEN Issue 已创建或认领，`N` 和 `SLUG` 已确定                                                                 |
| 2. 规格制定   | OpenSpec spec 已编写或更新；若有上游依赖则已确认上游状态                                                     |
| 3. 环境隔离   | 控制面 `origin/main` 已同步，Worktree 已创建，工作目录已切换                                                       |
| 4. 实现与测试 | 按 TDD 循环实现；所有测试通过；测试写法与类型选择遵循 `docs/references/testing/README.md` |
| 5. 提交与合并 | PR 已创建；所选 GitHub 通道已确认；指定审计 Agent 的 `FINAL-VERDICT` + `ACCEPT` 评论已存在后，gh 通道方可显式开启 auto-merge；CI 全绿；PR 已确认合并                     |
| 6. 收口与归档 | 控制面 `main` 已包含任务提交；worktree 已清理                                                                       |

---

## 四、异常处理规则

| 情况                                 | 规则                                                                                        |
| ------------------------------------ | --------------------------------------------------------------------------------------- |
| `gh` 命令超时                        | 最多重试 3 次（间隔 10s），仍失败则在 GitHub MCP 可写时切到 MCP；否则必须记录并升级                              |
| `gh` 缺失 / 未认证                    | 立即运行 `agent_github_delivery.py capabilities` 复核；若 MCP 可写则切换通道，否则阻断并升级                              |
| PR 需要 review                       | 记录 blocker，通知 reviewer，等待处理，禁止 silent abandonment                              |
| 审计通过评论缺失                      | 禁止开启 auto-merge；等待指定审计 Agent 发布 `FINAL-VERDICT` + `ACCEPT` 评论                              |
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


## 八、独立审计协议（Reviewer SOP）

适用对象：被指派为 reviewer 或执行独立审计的 Agent。

### 8.1 "不能做"清单（违反任一项 → 审计结论必须 REJECT）

审计 Agent 必须按"先禁令，后建议"的顺序输出。以下违规任一触发，结论必须 `REJECT`：

1. **不能**提交 CRLF/LF 噪音型大 diff（无语义改动却整文件替换）
2. **不能**删除/跳过测试来换取 CI 通过
3. **不能**保留过时治理术语并声称"已收口"
4. **不能**只给建议不给结论（必须给 `ACCEPT/REJECT`）
5. **不能**无证据下结论（每条结论必须附命令或 diff 证据）
6. **不能**把审计结果只写本地文件不发 PR 评论
7. **不能**在 required checks 未通过时给出可合并结论
8. **不能**用"后续再看"替代当前阻断问题

### 8.2 根因排查格式（每条问题必须包含）

1. **现象（Symptom）**
2. **根因（Root Cause）**
3. **影响面（Impact）**
4. **复现/检测命令（Reproduce）**
5. **阻断级别（Blocking / Non-blocking）**
6. **处理结论（Reject / Accept with risk）**

### 8.3 审计步骤

1. **读 PR diff**：`gh pr diff <PR_NUMBER>` 或在 GitHub UI 查看全部变更文件
2. **读关联 spec**：`openspec/specs/<module>/spec.md` + `openspec/changes/<change>/` 下的 delta spec
3. **跑验证命令**：至少执行 typecheck (`pnpm typecheck`) + 相关测试 (`pnpm -C apps/desktop test:run <path>`)；命令选择、测试层级和写法约束遵循 `docs/references/testing/README.md`
4. **跑审计必跑命令**（见 8.6）
5. **识别问题并分级**：逐文件审查，每个问题必须引用具体文件路径和行号，附上问题代码片段与修复建议
   - BLOCKER：违反核心原则、安全漏洞、数据丢失风险 → 必须修复后才能合并
   - SIGNIFICANT：超出 spec 范围、类型重复、死路径、测试缺失 → 应修复，可协商
   - MINOR：措辞、格式、可读性 → 不阻塞合并，记录即可
6. **在 PR 下发 PRE-AUDIT 评论**
7. **等待修复并发 RE-AUDIT 评论**
8. **发 FINAL-VERDICT 评论**

### 8.4 PR 评论强制要求（缺一不可）

审计 Agent 在同一 PR 必须发布 3 条评论：

#### PRE-AUDIT 评论

```
## PRE-AUDIT：Issue #<N>

**审计人：** <独立审计 Agent 名称>
**审计 HEAD：** `<commit SHA 前 8 位>`

### 不能做清单命中项
- [ ] CRLF/LF 噪音检查
- [ ] 测试完整性检查
- [ ] 过时术语检查
...

### 初始阻断结论：ACCEPT / REJECT

## 🔴 必须修复（Blocking）
...
## 🟠 应当修复（Significant）
...
## ⚪ 微瑕（Minor，不阻塞）
...
```

#### RE-AUDIT 评论

```
## RE-AUDIT：Issue #<N>

**审计 HEAD：** `<commit SHA 前 8 位>`

### PRE-AUDIT 阻断问题关闭状态
| # | 问题 | 状态 |
|---|------|------|
| 1 | ... | ✅ 已关闭 / ❌ 未关闭 |
...

### 复审结论：ACCEPT / REJECT
```

#### FINAL-VERDICT 评论

```
## FINAL-VERDICT：Issue #<N>

### 最终判定：ACCEPT / REJECT

### 证据命令与结果摘要
（附完整证据命令输出）

### 剩余风险（若 ACCEPT）
...
```

### 8.5 Decision 判定标准

- **ACCEPT**：无 BLOCKER；SIGNIFICANT 全部已解决或已记录跟进 Issue
- **REJECT**：存在 BLOCKER 或未解决的 SIGNIFICANT → 等修复后复审

### 8.6 审计必跑命令（结果需进 PR 评论）

```bash
git diff --numstat
git diff --check
git diff --ignore-cr-at-eol --name-status
bash -n scripts/agent_pr_automerge_and_sync.sh
pytest -q scripts/tests
test -x scripts/agent_pr_automerge_and_sync.sh && echo EXEC_OK
```

### 8.7 不可省略

- 审计必须覆盖 PR 的全部变更文件，不得跳过
- 至少一条验证命令（typecheck / test）必须实际执行并记录结果
- PR 评论不可省略——即使 ACCEPT 也要发 comment 记录审计结论
- 每个问题必须附带证据：具体文件路径、行号、相关代码片段
- 验证命令的完整输出（通过或失败）必须包含在 PR 评论中

### 8.8 Tier 3 产品行为验证（非自动化检查项）

PRE-AUDIT 必须包含**至少 1 条产品行为验证**——纯 diff review 不计入：

1. **前端 PR 必须有用户场景验证**：以用户身份操作应用，附截图或命令输出证明行为符合 spec.md 定义
2. **字体渲染验证**（涉及 UI 改动时）：按 `docs/references/font-verification-checklist.md` 执行，附截图。无 UI 改动标注 "N/A — 无 UI 变更"
3. **Design Token 使用率验证**（涉及样式改动时）：确认新增样式全部使用 Design Token，无 Tailwind 原始色值或硬编码值
4. **CJK 场景验证**（涉及文本显示改动时）：中英文混排、纯 CJK 段落截图

FINAL-VERDICT 必须逐条回应以下问题：
- "作为用户，修改后行为是否符合 spec.md 定义？"
- "列举至少 1 个用户场景的预期行为与实际行为对照"
- "PR template 中 Tier 3 检查项是否全部填写？未填 = REJECT"

### 8.9 审计交付口径

> "能发现问题、能定位根因、能明确阻断"优先于"写一堆建议"。
> 审计的第一职责是划红线，不是润色方案。
