# CreoNow 治理改革总纲


> "繁文缛节，适彼乐土。"——当流程比产品更壮观时，方向就错了。

---

## 文件索引

| § | 章节 | 内容 |
|---|------|------|
| 一 | 现状诊断 | 数字量化当前治理负担 |
| 二 | Rulebook 判决 | 废止理由与迁移方案 |
| 三 | OpenSpec 瘦身 | 保留骨架、去除仪式 |
| 四 | 前端 vs 后端 | 差异化工作流建议 |
| 五 | CI 改革方案 | 门禁精简思路 |
| 六 | AGENTS.md 改革 | 指令文件改革要点 |
| 七 | 文件清理方案 | 清理策略摘要 |
| 八 | delivery-skill.md 改革 | 交付规则简化 |
| 九 | 预期效果 | 改革后的关键指标 |
| 十 | 实施顺序 | 分阶段执行计划 |
| 十一 | Warning 债务清零专项 | 存量告警治理与 warn→error 升级路径 |

---

## 一、现状诊断：数字说话

| 指标 | 数值 | 问题 |
|------|------|------|
| 治理文档总量 | 1,966 个 .md / 147,608 行 | 是前端生产代码的 **3.8 倍** |
| 前端生产代码 | 152 文件 / 38,873 行 | 33 天 / 505 commits 的产出 |
| 前端测试代码 | 264 文件 / 89,782 行 | 测试:产品 = 2.3:1，但 i18n 仅覆盖 5.4% 文件 |
| Rulebook tasks | 151 active + 114 archived / 15,208 行 | 每个 task 是 openspec change 的镜像，零独立信息 |
| OpenSpec _ops | 374 RUN_LOG + reviews / 38,943 行 | 流水账式记录，几乎不被任何人回看 |
| OpenSpec changes/archive | 240 个变更 / ~6 MB | 每个含 proposal + tasks + delta spec |
| delivery-skill.md | 20 条硬约束 + 8 步审计协议 | 一个 5 行 CSS 修复也要走完全流程 |
| CI jobs | 14（ci.yml）+ 2（log-guard + merge-serial）| 16 个 check，其中 6 个是纯治理门禁 |
| 后端代码质量 | A-（0 any, 0 console.log, 46K 行）| 证明基础能力没问题，流程对后端有效 |
| 前端视觉质量 | i18n 5.4%，硬编码中文 42 文件 | 证明流程对前端视觉工作完全失效 |

### 核心矛盾

> **Agent 花 70% 的时间在"证明自己做了"，30% 的时间在"做"。**

Agent 每完成一个任务需要：
1. 创建 Issue
2. 创建 openspec change（proposal.md + tasks.md）
3. 创建 Rulebook task（proposal.md + tasks.md + .metadata.json）— **是第 2 步的复制品**
4. 创建 RUN_LOG
5. TDD 映射文档 → Red 证据 → Green 证据 → Refactor 记录
6. Main Session Audit（固定 8 字段签字）
7. Independent Review（另一个 agent 读 diff + 跑测试 + 写报告）
8. Rulebook validate → archive
9. OpenSpec change archive
10. Worktree 清理

对一个"给按钮加 `aria-label`"的修改，Agent 要生产 **6-8 个 .md 文件** 和 **至少 4 个 commits**。

---

## 二、Rulebook 判决：废止

### 证据

我们打开一个典型的 Rulebook task（`issue-101-p4-panel-components`）：

**proposal.md 内容**：
```
# Proposal: issue-101-p4-panel-components
## Why
（与 openspec change 的 proposal 完全相同的文字）
## What Changes
（与 openspec change 的 proposal 完全相同的文字）
```

**tasks.md 内容**：
```
## 1. Implementation
- [ ] 1.1 移除 storybook-static（与 openspec tasks.md 相同）
- [ ] 1.2 Button/ListItem 改 forwardRef（与 openspec tasks.md 相同）
...
## 2. Testing
- [ ] 2.1 pnpm typecheck（千篇一律）
- [ ] 2.2 pnpm lint（千篇一律）
...
```

Rulebook README 自己都承认：**"Rulebook 是治理侧产物，不是系统行为的事实源。"**

### 结论

Rulebook 是 OpenSpec 的 **影子层**（Shadow Layer）：
- proposal.md → 复制 openspec change 的 proposal
- tasks.md → 复制 openspec change 的 tasks + 千篇一律的 testing checklist
- .metadata.json → 可以用 git 本身追踪

它不增加任何信息，但增加了：
- 每个任务多 3 个文件的创建成本
- `validate` 步骤的时间成本
- CI 中 `openspec-log-guard` 需要检查 Rulebook 是否存在的成本
- Agent 认知负担：需要记住两套结构完全相同但路径不同的文档

### 行动

1. **立即停止**创建新的 Rulebook tasks
2. 不用删除历史 Rulebook，它们是过去的记录
3. 从 delivery-skill.md 中删除所有 Rulebook 相关条款
4. 从 CI（openspec-log-guard）中移除 Rulebook 校验
5. 从 AGENTS.md 中移除"三体系"概念，改为"OpenSpec + GitHub"双体系

---

## 三、OpenSpec 瘦身：保留骨架，去除仪式

OpenSpec 的核心价值是 **spec.md**——模块行为的规范定义。这必须保留。

但以下层可以大幅简化：

### 3.1 Changes 流程简化

**现状**：每个变更需要 `proposal.md` + `tasks.md` + delta spec + TDD 6 段式结构 + Dependency Sync Check + EXECUTION_ORDER.md

**改革**：

| 层级 | 改前 | 改后 |
|------|------|------|
| 大型功能变更 | 完整 proposal + tasks + delta spec | 保留，但 tasks.md 简化为 checklist（无需 6 段式） |
| 中型修改（跨多文件） | 完整 proposal + tasks + delta spec | 仅 PR description 中描述意图和范围 |
| 小型修复（< 5 文件） | 完整 proposal + tasks + delta spec | **无需 change 文档**，PR description 即可 |

**判断标准**：如果一个变更需要修改 spec.md，则创建 change 文档；否则只需 PR。

### 3.2 RUN_LOG 简化

**现状**：374 个 RUN_LOG，38,943 行，每个包含固定模板、命令输出、Main Session Audit 8 字段签字

**改革**：
- **废止 RUN_LOG**。CI 日志本身就是最好的 RUN_LOG。
- 如果 Agent 遇到异常需要记录，写在 PR description 或 PR comment 中。
- Main Session Audit 的核心意图（确保代码被审查）由 CI 测试结果 + PR review 替代。

### 3.3 Independent Review 简化

**现状**：每个 PR 需要另一个 Agent 写 `openspec/_ops/reviews/ISSUE-<N>.md`，包含固定格式、SHA 对齐校验

**改革**：
- 对于 **有 spec 变更的 PR**：保留 review 要求，但记录在 PR comment 中，不再生成独立 .md 文件
- 对于 **无 spec 变更的 PR**：CI 通过即可，无需独立审计

---

## 四、前端 vs 后端：差异化工作流

### 后端（保持结构化，略微简化）

后端代码质量 A- 证明当前流程对后端有效。后端的核心优势：
- 行为可完全用测试验证
- 数据流清晰，接口明确
- TDD 循环自然适配

**后端保留**：
- Spec-first（P1）
- Test-first（P2）
- CI 全绿（P4）
- `pnpm typecheck` + `pnpm test:run` 门禁

**后端移除**：
- Rulebook（同上）
- RUN_LOG（同上）
- 6 段式 TDD 结构化文档
- Main Session Audit 签字
- Independent Review .md 文件

### 前端（大幅简化，增加视觉验收）

前端工作的核心问题：Agent 从不"看"界面。1778 个测试全绿，但 42 个文件硬编码中文、按钮没有 accent 色。

**前端改革**：

| 维度 | 改前 | 改后 |
|------|------|------|
| 验收方式 | 只跑 vitest | vitest + **Storybook 视觉检查清单** |
| i18n | 无专门检查 | 新增 **i18n 完整性 lint**（检查硬编码中文） |
| Token | 部分 Tailwind 直接用 | 新增 **token lint**（禁止非语义化色值） |
| 文档 | 完整 openspec change 流程 | PR description + Storybook 截图 |
| 测试 | 先红后绿仪式 | 写测试即可，不要求记录红灯证据 |

**增加前端专属 CI 检查**（替代治理文档）：
1. `i18n-completeness`：扫描 `renderer/src/` 中的硬编码中日韩字符
2. `token-compliance`：扫描非语义化 Tailwind 色值（`bg-blue-*`, `text-gray-*` 等）
3. `storybook-build`：已有，保留

---

## 五、CI 改革方案

### 保留（真正保护代码质量的）

| Job | 理由 |
|-----|------|
| `lint-and-typecheck` | 类型安全是后端 A- 的核心保障 |
| `unit-test-core` | 后端测试 |
| `unit-test-renderer` | 前端测试 |
| `integration-test` | 跨模块集成 |
| `storybook-build` | 前端组件可构建 |
| `windows-e2e` | 端到端验证 |
| `windows-build` | 确保能打包 |
| `coverage-gate` | 覆盖率底线 |
| `merge-serial` | 串行合并防冲突——保留 |

### 移除或降级

| Job | 理由 | 行动 |
|-----|------|------|
| `openspec-log-guard` | 检查 RUN_LOG、Rulebook、Main Session Audit、Independent Review | **移除整个 workflow** |
| `test-discovery-consistency` | 检查测试文件是否被发现 | **降级为 warning**（不阻塞合并） |
| `ipc-acceptance` | IPC 契约校验 | 保留但 **仅在 IPC 文件变更时运行** |
| `contract-check` | 跨模块契约 | 保留但 **仅在契约文件变更时运行** |
| `cross-module-check` | 跨模块依赖 | 保留但 **仅在跨模块文件变更时运行** |
| `dependency-audit` | npm audit | 保留但 **改为 weekly cron**，不阻塞每个 PR |

### 新增

| Job | 作用 |
|-----|------|
| `i18n-completeness` | 扫描硬编码中日韩字符，阻塞合并 |
| `token-compliance` | 扫描非语义化 Tailwind 色值，阻塞合并 |

---

## 六、AGENTS.md 改革要点

详见 [AGENTS.md 改革提案](./agents-md-reform-proposal.md)。

核心变化：
1. 从 7 条原则精简为 6 条（合并 P3+P5，移除纯文档仪式，新增 P-Visual）
2. 废止"三体系"概念，改为"OpenSpec + GitHub"
3. 增加 **P-Visual**：前端任务必须有视觉验收证据（Storybook 截图/lint 通过）
4. 简化工作流从 6 阶段 10 步 → 3 阶段 5 步
5. 移除所有 Rulebook 引用
6. 移除 RUN_LOG 要求
7. 移除 Main Session Audit 和 Independent Review .md 文件要求

---

## 七、文件清理方案

> **注意**：以下方案在 PR #954 执行时，策略从「归档」升级为「直接删除」（`git rm`），详见 [Full MD Audit](./full-md-audit-and-cleanup-verdicts.md)。

| 清理目标 | 数量 | 行动（已执行） |
|----------|------|------|
| `rulebook/` 整个目录 | 265 dirs | **已删除**（PR #954） |
| `openspec/_ops/` 整个目录 | 417 files | **已删除**（PR #954） |
| `openspec/changes/archive/` | 240 dirs | **已删除**（PR #954） |
| `openspec/changes/_template/` | 模板目录 | **已删除**（PR #954） |
| `docs/Notion/` | Notion 导出 | **已删除**（PR #954） |
| `docs/plans/archive/` | 历史计划 | **已删除**（PR #954） |
| `docs/audit/archive/` | 历史审计 | **已删除**（PR #954） |
| 治理脚本 | 6 个 | **已删除**（PR #954） |

共删除 **2,203 个文件 / 138,872 行**。.md 文件从 2,005 个减至 74 个。

---

## 八、delivery-skill.md 改革

### 改前：20 条硬约束

每条违反 = 交付失败，没有轻重之分。

### 改后：分层约束

**L1 硬约束（违反 = 阻塞合并）**：
1. 分支必须为 `task/<N>-<slug>`
2. PR 必须包含 `Closes #<N>`
3. CI 全绿（lint + typecheck + test + build）
4. 涉及 spec 变更时，必须先更新 spec
5. 串行合并（merge-serial）

**L2 软约束（违反 = PR comment 提醒，不阻塞）**：
6. 大型功能建议有 proposal
7. 测试优先（建议先写测试）
8. i18n 和 token 完整性

**移除的约束**：
- Rulebook 相关（3 条）
- RUN_LOG 相关（3 条）
- Main Session Audit（1 条）
- Independent Review .md（1 条）
- EXECUTION_ORDER.md（2 条）
- 过程记录时序（1 条）

从 20 条 → 8 条。Agent 的认知负担降低 **60%**。

---

## 九、预期效果

| 指标 | 改前 | 改后 |
|------|------|------|
| 每任务文档产出 | 6-8 个 .md 文件 | 0-1 个（仅 spec 变更时） |
| 每任务 commits | 4+（代码 + RUN_LOG + audit + review） | 1-2（代码 + 可能的 spec 更新） |
| CI check 数量 | 16 | 11（移除 3 治理 + 2 按需 → 新增 2 质量） |
| Agent 工作时间分配 | 30% 编码 / 70% 文档 | 70% 编码 / 30% 文档 |
| 前端质量检查 | 0 个自动检查 | 2 个（i18n + token lint） |
| 视觉验收 | 无 | Storybook 截图 |

---

## 十、实施顺序

1. **第一步：废止 Rulebook**（风险最低，收益最高）
   - 修改 delivery-skill.md
   - 修改 AGENTS.md
   - 移除 CI 中 Rulebook 校验
   
2. **第二步：废止 RUN_LOG + 审计 .md**
   - 修改 delivery-skill.md
   - 移除 openspec-log-guard workflow
   - 归档历史文件
   
3. **第三步：CI 清理**
   - 新增 i18n-completeness + token-compliance
   - 降级 test-discovery-consistency
   
4. **第四步：AGENTS.md 重写**
   - 精简原则
   - 增加视觉验收要求
   - 简化工作流

5. **第五步：文件归档**
   - 执行清理脚本
   - 确认 git history 保留

6. **第六步：Warning 债务清零（后续独立任务）**
   - **Task 5.1（Token）**：清零 `creonow/no-raw-tailwind-tokens`，以 Design Token 替换 `shadow-lg/xl/2xl` 与原始色值类。
   - **Task 5.2（Hooks）**：清零 `react-hooks/exhaustive-deps`。
   - **Task 5.3（i18n）**：分模块批量治理 `i18next/no-literal-string`（每 PR 建议控制在 40-80 条，避免大爆炸式改动）。
   - **Task 5.4（结构化复杂度）**：治理 `max-lines-per-function` 与 `complexity`，采用“拆函数/提 hook/提 service”策略。
   - **阶段验收**：每个子任务必须让 warning 总量单调下降；禁止“回升后再解释”。
   - **专项完成定义**：
     - `pnpm lint` = `0 errors, 0 warnings`
     - `pnpm lint:warning-budget` PASS（基线与当前一致，且最终为 0）
     - 决策并执行将对应规则从 `warn` 升级为 `error`

---

## 十一、Warning 债务清零专项

### 11.1 背景与边界

- 本次 Task 2/3/4 的目标是“接入规则并形成可执行门禁”，不是“一次性清空历史存量告警”。
- 从治理视角，warning 存量本身应被视为明确的后续任务，而不是“可做可不做”的优化项。
- 因此将其单列为 **Task 5**，纳入 audit 主文件的正式范围。

### 11.2 Task 5 定义（新增）

| Task | 内容 | 验收 |
|------|------|------|
| Task 5.1 | Token 告警清零（`creonow/no-raw-tailwind-tokens`） | 该规则告警 = 0 |
| Task 5.2 | Hooks 依赖告警清零（`react-hooks/exhaustive-deps`） | 该规则告警 = 0 |
| Task 5.3 | i18n 存量治理（`i18next/no-literal-string`） | 告警持续下降并最终归零 |
| Task 5.4 | 复杂度治理（`max-lines-per-function` + `complexity`） | 两规则告警归零或经 Owner 书面豁免 |

### 11.3 执行原则

1. 按规则域分批，不混杂大规模重构与文案迁移。
2. 每批次必须有可重复命令证据（`pnpm lint`、`pnpm lint:warning-budget`、必要的 typecheck/test）。
3. 当某一规则稳定归零后，再把该规则从 `warn` 升级到 `error`，避免“未清库存先收紧门禁”。
4. 交付形态以 GitHub Issue/PR 为准，audit 文档负责定义边界与验收，不替代交付流水。

### 11.4 复杂度与风险控制（补充）

1. **最小变更单元**：每个 PR 只处理一种 warning 规则（例如只做 `no-raw-tailwind-tokens`），禁止混做。
2. **改动范围上限**：单 PR 建议不超过 10 个生产文件；超过上限必须先拆分批次再提交。
3. **禁止搭车重构**：warning 治理 PR 不得夹带架构重构、状态管理迁移或 UI 行为变更。
4. **回滚友好**：每个批次都要保证可独立回退；若出现回归，按批次回滚而非整体回滚。
5. **先稳后严**：仅在某规则连续 3 个批次保持 0 增量后，才允许提案升级为 `error` 门禁。

---

> "大道至简。天下难事，必作于易；天下大事，必作于细。"
> 
> 流程的目的是保障质量，不是保障流程自身的存在。当流程文档是产品代码的 3.8 倍时，流程已经成为了问题本身。
