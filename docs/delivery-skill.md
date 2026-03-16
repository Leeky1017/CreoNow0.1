# OpenSpec + GitHub 交付规则

本文件是 CreoNow 的交付规则主源（Source of Truth）。
本文件只定义约束条件和验收标准，不定义具体命令和脚本参数。

命令与脚本用法参见 `scripts/README.md`。
测试编写规范与测试类型选择参见 `docs/references/testing/README.md`。

---

## 一、命名约定

| 实体     | 格式                           | 示例                               |
| -------- | ------------------------------ | ---------------------------------- |
| Issue    | GitHub Issue，自动分配编号 `N` | `#42`                              |
| Branch   | `task/<N>-<slug>`              | `task/42-memory-decay`             |
| Commit   | `<type>: <summary> (#<N>)`     | `feat: add memory decay (#42)`     |
| PR title | `<summary> (#<N>)`             | `Add memory decay (#42)`           |
| PR body  | 必须包含 `Closes #<N>`         | `Closes #42`                       |
| Worktree | `.worktrees/issue-<N>-<slug>`  | `.worktrees/issue-42-memory-decay` |

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

- 边界说明：该规则仅用于任务准入。若 PR 已因 `Closes #N` 成功合并并自动关闭 Issue，则 `agent_pr_automerge_and_sync.sh` 的 rerun / retry 应识别为终局成功，不得继续等待 Issue 重新打开。

9. **环境基线强制**：创建 `task/*` 分支和 worktree 前，必须先同步控制面到最新 `origin/main`。
10. **完成变更归档强制**：当 `openspec/changes/<change>/tasks.md` 全部勾选完成时，必须归档到 `openspec/changes/archive/`。
11. **控制面主工作树禁改强制**：除 Owner 明示的紧急热修外，禁止在控制面 `main` 直接编辑受管文件；必须先执行 `scripts/agent_task_begin.sh <N> <slug>`（gh-only 入口；若仅有 MCP，请改走 `agent_controlplane_sync.sh` + `agent_worktree_setup.sh`）进入 `.worktrees/issue-<N>-<slug>`。执行 `scripts/agent_task_begin.sh`、`scripts/agent_worktree_setup.sh` 或 `scripts/agent_controlplane_sync.sh` 后，repo-managed git hooks 会阻止控制面根目录提交与直接推送 `main`。

---

### GitHub 控制面选择

- `auto`：优先 `gh`；若 `gh` 不可用或未认证，则在 GitHub MCP 可写时回退到 GitHub MCP。
- `gh`：仅当 `gh auth status` 正常时允许继续；默认只创建/更新 PR，不自动开启 auto-merge。
- `mcp`：仅当当前会话具备 GitHub MCP 写权限时允许继续；当前主要覆盖远程 Issue / PR / comment 动作。
- 若两条通道都不可写，必须立即阻断，并在交付记录中写清缺失的是 tool / auth / permission 哪一项。

## 三、工作流阶段

| 阶段          | 完成条件                                                                                                                                                                                 |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. 任务准入   | 当前 OPEN Issue 已创建或认领，`N` 和 `SLUG` 已确定                                                                                                                                       |
| 2. 规格制定   | OpenSpec spec 已编写或更新；若有上游依赖则已确认上游状态                                                                                                                                 |
| 3. 环境隔离   | 控制面 `origin/main` 已同步，`scripts/agent_task_begin.sh <N> <slug>`（gh-only；MCP-only 会话改走手动脚本链路）或等效步骤已创建 Worktree，工作目录已切换到 `.worktrees/issue-<N>-<slug>` |
| 4. 实现与测试 | 按 TDD 循环实现；所有测试通过；测试写法与类型选择遵循 `docs/references/testing/README.md`                                                                                                |
| 5. 提交与合并 | PR 已创建；所选 GitHub 通道已确认；指定审计 Agent 的 `FINAL-VERDICT` + `ACCEPT` 评论已存在后，gh 通道方可显式开启 auto-merge；CI 全绿；PR 已确认合并                                     |
| 6. 收口与归档 | 控制面 `main` 已包含任务提交；worktree 已清理                                                                                                                                            |

---

### 建议的任务启动命令（默认路径）

```bash
python3 scripts/agent_github_delivery.py capabilities
scripts/agent_task_begin.sh "$N" "$SLUG"  # gh-only；MCP-only 会话改走手动脚本链路
cd ".worktrees/issue-${N}-${SLUG}"
```

## 四、异常处理规则

| 情况                                      | 规则                                                                                                |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `gh` 命令超时                             | 最多重试 3 次（间隔 10s），仍失败则在 GitHub MCP 可写时切到 MCP；否则必须记录并升级                 |
| `gh` 缺失 / 未认证                        | 立即运行 `agent_github_delivery.py capabilities` 复核；若 MCP 可写则切换通道，否则阻断并升级        |
| PR 需要 review                            | 记录 blocker，通知 reviewer，等待处理，禁止 silent abandonment                                      |
| 审计通过评论缺失                          | 禁止开启 auto-merge；等待指定审计 Agent 发布 `FINAL-VERDICT` + `ACCEPT` 评论                        |
| checks 失败                               | 修复后重新 push，重跑并记录失败原因和修复证据                                                       |
| Spec 不存在或不完整                       | 必须先补 spec 并确认，禁止猜测实现                                                                  |
| 上游依赖与当前 change 假设不一致          | 先更新 proposal/spec/tasks 再进入实现                                                               |
| 非 `task/*` 分支提交 PR                   | PR body 必须包含 `Skip-Reason:`                                                                     |
| 改动仅停留在 `task/*` 分支                | 继续完成合并回 `main`                                                                               |
| 在控制面根目录直接开发 / 提交 / 推送 main | 立即停止并迁移到 task worktree；必要时通过 `.githooks` / preflight 报错阻断                         |
| required checks 与本文件不一致            | 阻断交付并升级治理，禁止宣称“门禁全绿”                                                              |
| 误用已关闭/历史 Issue                     | 立即停止实现，改为新建 OPEN Issue，并从最新 `origin/main` 重建 worktree                             |
| PR 已合并且 `Closes #N` 已自动关闭 Issue  | 视为交付终局成功；允许 `agent_pr_automerge_and_sync.sh` 直接完成 sync / 退出，不再等待 Issue reopen |
| 活跃 change 已完成但未归档                | 阻断交付，先归档到 `openspec/changes/archive/` 再继续                                               |

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
- 既往不符合项 D：PR 已合并并自动关闭 Issue 后，合并脚本 rerun 仍按任务准入规则死等，导致收口卡住。
  - 现行防线：`agent_pr_automerge_and_sync.sh` 必须识别 merged PR 为终局成功，只对未完成任务继续执行 OPEN Issue preflight。
- 既往不符合项 B：串行依赖只维护顺序，未强制下游在实现前核对上游产出，导致需求漂移返工。
  - 现行防线：对存在上游依赖的 change 强制确认上游状态，发现漂移先更新 change 文档再进入实现。
- 既往不符合项 C：活跃 change 已完成但未归档，遂回让后续 Agent 错误认为其仍活跃。
  - 现行防线：完成变更归档强制（规则 10）防止历史残留活跃目录。

---

## 八、独立审计协议（Reviewer SOP）— 分层自适应审计

适用对象：被指派为 reviewer 或执行独立审计的 Agent。

> 「明者因时而变，知者随事而制。」——桓宽《盐铁论》
> 审计不是一成不变的流水线，而是因任务类型、风险等级、影响面而自适应的质量守护。

### 8.0 变更分类（审计第一步）

审计 Agent 在一切检查之前，必须先分析 PR diff，判定以下三个维度：

**变更层（WHERE）**：

| 标签       | 路径模式                                       |
| ---------- | ---------------------------------------------- |
| `backend`  | `apps/desktop/main/**`                         |
| `frontend` | `apps/desktop/renderer/**`                     |
| `preload`  | `apps/desktop/preload/**`                      |
| `shared`   | `packages/shared/**`                           |
| `infra`    | `scripts/**`, `.github/**`, `*.config.*`       |
| `docs`     | `docs/**`, `openspec/**`, `*.md`（非代码目录） |

**风险等级（RISK）**：

| 等级       | 判定依据                                               |
| ---------- | ------------------------------------------------------ |
| `critical` | 涉及数据持久化 / 安全 / IPC / 主进程生命周期           |
| `high`     | 涉及核心编辑器 / AI Service / Memory / Knowledge Graph |
| `medium`   | 涉及 UI 组件 / 状态管理 / 导出                         |
| `low`      | 仅样式 / 文档 / 测试补充                               |
| `minimal`  | 纯注释 / 格式 / typo                                   |

**影响面（SCOPE）**：

| 等级            | 判定依据               |
| --------------- | ---------------------- |
| `cross-module`  | 变更跨 3+ 模块或跨进程 |
| `single-module` | 变更限于单一模块内     |
| `isolated`      | 独立文件级别           |

分类结果决定审计层级和 Playbook 选择。

### 8.0.1 审计层级（Tiered Audit Protocol）

| 层级       | 适用条件                                      | 评论模型                                                | 入口命令                    |
| ---------- | --------------------------------------------- | ------------------------------------------------------- | --------------------------- |
| **Tier L** | `risk=low\|minimal` 且 `scope=isolated`       | 单条 FINAL-VERDICT                                      | `scripts/review-audit.sh L` |
| **Tier S** | `risk=medium` 且 `scope=single-module`        | PRE-AUDIT + FINAL-VERDICT（有 BLOCKER 时插入 RE-AUDIT） | `scripts/review-audit.sh S` |
| **Tier D** | `risk=critical\|high` 或 `scope=cross-module` | PRE → RE（可多轮）→ FINAL                               | `scripts/review-audit.sh D` |

**层级选择不可降级**：高风险 PR 不得以 Tier L 审计。不确定时，选择更高层级。

### 8.0.2 审计 Playbook 加载

根据变更层，加载 `docs/references/audit-playbooks/` 下对应文件执行专项检查：

| 变更层                   | Playbook 文件                |
| ------------------------ | ---------------------------- |
| `backend`                | `backend-service.md`         |
| `frontend`               | `frontend-component.md`      |
| `preload` / IPC          | `ipc-channel.md`             |
| `infra`                  | `ci-infra.md`                |
| `docs`                   | `docs-only.md`               |
| 安全相关（Tier D 追加）  | `security-electron.md`       |
| 性能相关（Tier D 追加）  | `performance.md`             |
| 行为变更（Tier S+ 必做） | `functional-verification.md` |

多层变更时，加载所有涉及层的 Playbook。功能性验证是横切关注点，补充而非替代各变更层的专项 Playbook。

### 8.0.3 审计四律

1. **CI 能查的，信任 CI；CI 不能查的，才是审计 Agent 的主战场。**
   你的核心价值：语义正确性、spec 对齐、架构合理性、安全性、测试质量。
2. **每条结论必须有证据。没有 diff 引用或命令输出，不要开口。**
3. **问自己：如果这个 PR 合并了，最有可能出什么问题？** 然后去验证那个场景。
4. **代码写了不等于功能生效。** 必须验证：用户操作路径是否连通？Spec Scenario 的预期行为是否真的出现？

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

### 8.1.1 "必须做"白名单（审计质量底线）

审计 Agent 至少必须完成以下动作，否则审计无效：

1. **必须**实际读取 PR 变更的每一个文件（不可只看 commit message 或 PR 标题）
2. **必须**运行 `scripts/review-audit.sh <TIER>`（分层审计命令入口）
3. **必须**在 PRE-AUDIT / FINAL-VERDICT 评论中声明审计层级和变更分类结果
4. **必须**声明实际执行了哪些验证命令（附输出）
5. **必须**加载并执行对应 Playbook 的每一条检查项（标注 ✅/❌/N/A）
6. **必须**验证新增 public 行为是否有对应测试（Tier S/D）
7. **必须**验证测试是否测了行为而非实现（Tier S/D，涉及测试变更时）
8. **必须**执行功能性验证（Tier S/D，涉及行为变更时）——加载 `functional-verification.md`，验证 Spec Scenario 与实现的行为对照，确认功能真的生效

### 8.2 根因排查格式（每条问题必须包含）

1. **现象（Symptom）**
2. **根因（Root Cause）**
3. **影响面（Impact）**
4. **复现/检测命令（Reproduce）**
5. **阻断级别（Blocking / Non-blocking）**
6. **处理结论（Reject / Accept with risk）**

### 8.3 审计步骤

1. **变更分类**：分析 `git diff --name-only origin/main`，确定 WHERE / RISK / SCOPE（见 8.0）
2. **选择层级**：根据分类结果选择 Tier L / S / D（见 8.0.1）
3. **加载 Playbook**：根据变更层加载 `docs/references/audit-playbooks/` 对应文件（见 8.0.2）
4. **读 PR diff**：`gh pr diff <PR_NUMBER>` 或在 GitHub UI 查看全部变更文件
5. **读关联 spec**：`openspec/specs/<module>/spec.md` + `openspec/changes/<change>/` 下的 delta spec
6. **跑分层审计命令**：`scripts/review-audit.sh <TIER> [<base-ref>]`
7. **跑 Playbook 检查**：逐条执行 Playbook 中的检查项，标注 ✅/❌/N/A
8. **识别问题并分级**：逐文件审查，每个问题必须引用具体文件路径和行号，附上问题代码片段与修复建议
   - BLOCKER：违反核心原则、安全漏洞、数据丢失风险、spec 行为不符 → 必须修复后才能合并
   - SIGNIFICANT：超出 spec 范围、类型重复、死路径、测试缺失、性能退化 → 应修复，可协商
   - MINOR：措辞、格式、可读性 → 不阻塞合并，记录即可
9. **发布评论**（按层级适配，见 8.4）

### 8.4 PR 评论强制要求（按层级自适应）

评论模型根据审计层级自适应，不再一律要求三条评论：

| Tier       | 评论模型                             | 说明                       |
| ---------- | ------------------------------------ | -------------------------- |
| **Tier L** | 单条 FINAL-VERDICT                   | 低风险 PR 直接给结论       |
| **Tier S** | PRE-AUDIT + FINAL-VERDICT            | 有 BLOCKER 时插入 RE-AUDIT |
| **Tier D** | PRE → RE（可多轮，最多 5 轮）→ FINAL | 架构性 PR 允许深度迭代     |

所有评论必须包含结构化元数据头（`<!-- audit-meta ... -->`）。

#### PRE-AUDIT 评论（Tier S/D）

```
## PRE-AUDIT：Issue #<N>

<!-- audit-meta
tier: S|D
change_type: <WHERE 标签>
risk: <RISK 等级>
scope: <SCOPE 等级>
files_reviewed: <已审/总数>
commands_executed: [review-audit.sh, ...]
playbooks_loaded: [<playbook 文件名>, ...]
-->

**审计人：** <独立审计 Agent 名称>
**审计 HEAD：** `<commit SHA 前 8 位>`
**审计层级：** Tier <L|S|D>
**变更分类：** <WHERE> / <RISK> / <SCOPE>

### Playbook 检查结果
| # | 检查项 | 结果 | 证据 |
|---|--------|------|------|
| 1 | ... | ✅ / ❌ BLOCKER / N/A | ... |

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

#### FINAL-VERDICT 评论（所有 Tier）

```
## FINAL-VERDICT：Issue #<N>

<!-- audit-meta
tier: <L|S|D>
verdict: ACCEPT|REJECT
files_reviewed: <已审/总数>
commands_executed: [...]
-->

### 最终判定：ACCEPT / REJECT

### 证据命令与结果摘要
（附完整证据命令输出）

### 剩余风险（若 ACCEPT）
...
```

### 8.5 Decision 判定标准

- **ACCEPT**：无 BLOCKER；SIGNIFICANT 全部已解决或已记录跟进 Issue
- **REJECT**：存在 BLOCKER 或未解决的 SIGNIFICANT → 等修复后复审

### 8.6 审计命令（分层执行）

审计命令已整合为分层入口脚本：

```bash
scripts/review-audit.sh L [<base-ref>]   # Tier L：CRLF + diff 概览
scripts/review-audit.sh S [<base-ref>]   # Tier S：+ typecheck + 相关测试 + Storybook + 脚本检查
scripts/review-audit.sh D [<base-ref>]   # Tier D：+ 全量测试 + lint + 架构门禁 + contract
```

各层级包含的具体命令详见 `scripts/review-audit.sh` 内部注释。

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
