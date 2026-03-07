# CreoNow 全量 Markdown 审计与清理判决书


> "大道至简，衍化至繁。"——老子。2005 个 .md 文件、147,608 行治理文档，是实际代码量的 3.8 倍。本文件对每一个 .md 区域逐一审判，给出 KEEP / DELETE / REWRITE / MERGE 四类判决。

---

## 文件索引（TOC）

| § | 章节 | 内容 |
|---|------|------|
| 一 | 全局概览 | 2005 文件分布、行数统计、问题诊断 |
| 二 | 判决总表 | 按目录汇总判决（DELETE / KEEP / REWRITE） |
| 三 | 第一类：必须删除的区域 | rulebook、_ops、changes/archive 等 |
| 四 | 第二类：需要精简的区域 | docs/Notion、docs/plans、docs/audit/archive |
| 五 | 第三类：保留但需更新的区域 | openspec/specs、docs/references、design |
| 六 | 第四类：根文件治理 | AGENTS.md、CLAUDE.md、README.md |
| 七 | 文档治理标准 | 统一的文档管理规则与维护约定 |
| 八 | 执行计划 | 本 PR 实际删除清单 + 后续 PR 计划 |

---

## 一、全局概览

### 1.1 文件分布

| 区域 | 文件数 | 行数 | 占比 | 判决 |
|------|--------|------|------|------|
| `rulebook/` | 661 | 15,208 | 10.3% | **DELETE ALL** |
| `openspec/_ops/` | 417 | 38,943 | 26.4% | **DELETE ALL** |
| `openspec/changes/archive/` | 757 | 36,491 | 24.7% | **DELETE ALL** |
| `openspec/changes/_template/` | 5 | ~50 | 0.0% | **DELETE ALL** |
| `docs/Notion/` | 72 | 37,382 | 25.3% | **DELETE ALL** |
| `docs/plans/archive/` | 11 | ~5,500 | 3.7% | **DELETE ALL** |
| `docs/audit/archive/` | 10 | 2,346 | 1.6% | **DELETE ALL** |
| `docs/audits/` | 1 | ~200 | 0.1% | DELETE |
| `openspec/specs/` | 13 | 6,401 | 4.3% | **KEEP** |
| `docs/references/` | 9 | 438 | 0.3% | **KEEP + REWRITE** |
| `design/` | 16 | 5,350 | 3.6% | **KEEP** |
| 根文件 (AGENTS/CLAUDE/README) | 3 | 659 | 0.4% | **KEEP + REWRITE** |
| 其他 (docs 顶层, openspec 顶层, .github, scripts, apps 内置 SKILL) | ~30 | — | — | 逐文件判决 |

### 1.2 关键数字

- **待删除**：1,934 文件 / ~136,120 行（占 92.1%）
- **保留**：~71 文件 / ~11,510 行（占 7.9%）
- 清理后 .md 文件 ÷ 前端代码 ≈ 0.30（从 3.8 降至 0.30）

### 1.3 问题诊断

| 病因 | 表现 | 来源 |
|------|------|------|
| Rulebook 治理膨胀 | 661 个文件，每个 Issue 都生成 proposal + tasks + specs 副本 | Agent 无限递归归档 |
| RUN_LOG 证据落盘 | 374 个 task_runs + 43 reviews = 417 文件 | 每个 PR 都要写日志 |
| Change Archive 堆积 | 757 文件，已归档的 delta spec 永不再被引用 | P5 变更协议 |
| Notion 历史导入 | 72 文件，从 Notion 导出但从未与代码同步 | 早期产品规划 |
| 计划归档 | 11 个过期执行计划 | 过期的阶段性文档 |

---

## 二、判决总表

```
DELETE ALL (1,934 files / ~136,120 lines)
├── rulebook/                         661 files   15,208 lines
├── openspec/_ops/                    417 files   38,943 lines
├── openspec/changes/archive/         757 files   36,491 lines
├── openspec/changes/_template/         5 files      ~50 lines
├── docs/Notion/                       72 files   37,382 lines
├── docs/plans/archive/                11 files   ~5,500 lines
├── docs/audit/archive/                10 files    2,346 lines
└── docs/audits/                        1 file      ~200 lines

KEEP AS-IS (35 files)
├── openspec/specs/        13 spec.md（系统行为规范，核心资产）
├── design/                16 files（设计系统，前端必需）
├── apps/desktop/main/skills/  17 SKILL.md（产品内置技能定义）
├── .github/pull_request_template.md
└── openspec/changes/EXECUTION_ORDER.md（保留结构，内容已清空）

KEEP + REWRITE (15 files)
├── AGENTS.md              306→~130 lines（见 agents-md-reform-proposal.md）
├── CLAUDE.md              306→~130 lines（与 AGENTS.md 同步）
├── README.md              47 lines（保留，微调）
├── docs/references/       9 files / 438 lines（保留，合并精简）
├── docs/delivery-skill.md 183 lines → 重写（去除 Rulebook/RUN_LOG 引用）
├── docs/delivery-rule-mapping.md   27 lines → 重写或删除
└── openspec/ 顶层 3 files  → 精简

DELETE + 内容迁移 (7 files)
├── docs/frontend-overhaul-plan.md   1,328 lines → 精华入 docs/references/
├── docs/OpenSpec Owner 意图定义书.md 522 lines → 精华入 openspec/project.md
├── docs/PRODUCT_OVERVIEW.md          701 lines → 精简保留或合并到 README
├── openspec/AGENTS.md                  5 lines → 删除（仅引用根 AGENTS.md）
├── openspec/README.md                 33 lines → 删除（与 project.md 重复）
└── scripts/README.md + cc_codex_controller_prompt.md → 精简
```

---

## 三、第一类：必须删除的区域

### 3.1 `rulebook/` — 661 文件 / 15,208 行

**判决：DELETE ALL**

**理由**：
- Rulebook 是旧治理体系的产物，每个 GitHub Issue 都生成 `proposal.md` + `tasks.md` + 可选 `specs/` 副本
- 无任何代码文件引用 `rulebook/`
- CI 中 `openspec-log-guard.yml` 不引用 rulebook
- 活跃任务（`rulebook/tasks/issue-*`）共 151 个目录，已全部过期或被 OpenSpec 取代
- 归档任务（`rulebook/tasks/archive/`）共 75 个目录，纯历史垃圾
- Agent 常误读 rulebook 中过期的 spec 副本，导致实现偏差

**包含**：
- `rulebook/tasks/README.md`
- `rulebook/tasks/issue-*/` (151 active task dirs)
- `rulebook/tasks/archive/` (75 archived task dirs)

### 3.2 `openspec/_ops/` — 417 文件 / 38,943 行

**判决：DELETE ALL**

**理由**：
- `task_runs/` (374 files)：RUN_LOG 证据日志，已被 PR description + todo list 替代
- `reviews/` (43 files)：独立审计记录，已被 PR review comments 替代
- `audits/` (0 files)：空目录
- 这些文件从未被产品代码引用，仅被 `openspec-log-guard.yml` CI 校验
- 删除后需同步修改 `openspec-log-guard.yml`（见 §八）

### 3.3 `openspec/changes/archive/` — 757 文件 / 36,491 行

**判决：DELETE ALL**

**理由**：
- 已结题的 delta spec 归档，含 ~80 个 change 目录（每个含 proposal.md + tasks.md + specs/delta.md）
- Delta spec 的精华已合并到主 `openspec/specs/*/spec.md`，归档只是历史记录
- 757 个文件是最大的单一噪音源
- 无任何代码或 CI 引用归档内容

### 3.4 `openspec/changes/_template/` — 5 文件

**判决：DELETE ALL**

**理由**：
- Change Protocol 模板，新治理不再需要 delta spec 模板
- 5 个文件：proposal.md / tasks.md / delta-spec.md 模板

### 3.5 `docs/Notion/` — 72 文件 / 37,382 行

**判决：DELETE ALL**

**理由**：
- 从 Notion 历史导出的产品/技术/设计文档
- 内容与当前代码实现严重漂移（如"三类创作者差异化工具链"从未实现）
- 有价值的概念（如记忆层架构、后端审计快照）已被代码和 openspec specs 取代
- Agent 读到这些过期文档会产生错误假设

**包含子目录**：
- `CN/` (反模式审计报告、前端开发、后端开发、CreoNow pitch)
- `三类创作者差异化工具链/` (5 files)
- `记忆层与 Agentic 架构深化/` (7 files)
- 顶层 11 个文档（产品定义、技术架构、UI UX 设计等）

### 3.6 `docs/plans/archive/` — 11 文件 / ~5,500 行

**判决：DELETE ALL**

**理由**：
- 过期的执行计划（如 `P5-WORKBENCH-ANALYSIS.md`、`audit-roadmap.md`、`phase1-agent-instruction.md`）
- 已被后续实现完全取代
- `docs/plans/unified-roadmap.md`（保留，但需更新）

### 3.7 `docs/audit/archive/` — 10 文件 / 2,346 行

**判决：DELETE ALL**

**理由**：
- 旧版审计报告（01-07 系列：system-prompt、conversation、editor-ai、rag、memory、onboarding、quality）
- CN-doc-reality-alignment 两个 Issue 报告
- 已被本轮审计文档（`docs/audit/*.md`）完全取代

### 3.8 `docs/audits/backend-code-snapshot-2026-02-22.md` — 1 文件

**判决：DELETE**

**理由**：
- 旧版后端审计快照，已被 `docs/audit/backend-code-analysis.md` 取代

---

## 四、第二类：删除时需注意的关联修改

删除上述区域后，以下文件中有引用需要同步修改：

| 引用源 | 引用的被删内容 | 修改方式 |
|--------|---------------|----------|
| `AGENTS.md` L169 | `rulebook/tasks/` | 删除 Rulebook 相关章节 |
| `CLAUDE.md` | 同上 | 与 AGENTS.md 同步 |
| `.github/workflows/openspec-log-guard.yml` | `openspec/_ops/task_runs/` RUN_LOG 检查 | 简化为仅检查 Skip-Reason |
| `docs/delivery-skill.md` | Rulebook / RUN_LOG 引用 | 重写去除旧体系引用 |
| `docs/delivery-rule-mapping.md` | 旧交付规则映射 | 重写 |
| `scripts/validate_independent_review_ci.py` | RUN_LOG 校验 | 简化或删除 |
| `scripts/validate_main_session_audit_ci.py` | RUN_LOG 审计校验 | 简化或删除 |
| `scripts/independent_review_record.sh` | 审计记录脚本 | 评估是否保留 |
| `scripts/main_audit_resign.sh` | 审计签章脚本 | 评估是否保留 |
| `scripts/agent_pr_preflight.py` | RUN_LOG 相关检查 | 简化 |
| `scripts/team_delivery_status.py` | _ops 引用 | 删除或简化 |
| `scripts/ipc-acceptance-gate.ts` | 可能引用 _ops | 检查并修改 |

> **策略**：本 PR 先执行文件删除 + 核心引用修改。CI workflow 和 scripts 的大规模重构放到下一个 PR（ci-simplification），避免本 PR 范围过大。

---

## 五、第三类：保留并维护的区域

### 5.1 `openspec/specs/` — 13 文件 / 6,401 行 ✅ KEEP

系统行为规范是 OpenSpec 的核心价值。12 个模块 spec + 1 个跨模块集成 spec。

| 文件 | 行数 | 判决 |
|------|------|------|
| `ai-service/spec.md` | 663 | KEEP |
| `context-engine/spec.md` | 412 | KEEP |
| `document-management/spec.md` | 417 | KEEP |
| `editor/spec.md` | 677 | KEEP |
| `ipc/spec.md` | 513 | KEEP |
| `knowledge-graph/spec.md` | 438 | KEEP |
| `memory-system/spec.md` | 673 | KEEP |
| `project-management/spec.md` | 437 | KEEP |
| `search-and-retrieval/spec.md` | 376 | KEEP |
| `skill-system/spec.md` | 478 | KEEP |
| `version-control/spec.md` | 378 | KEEP |
| `workbench/spec.md` | 685 | KEEP |
| `cross-module-integration-spec.md` | 254 | KEEP |

### 5.2 `docs/references/` — 9 文件 / 438 行 ✅ KEEP + REWRITE

精炼的参考手册，继续维护。

| 文件 | 行数 | 判决 | 备注 |
|------|------|------|------|
| `coding-standards.md` | 33 | KEEP | 代码原则 |
| `design-ui-architecture.md` | 36 | KEEP | 前端设计规范 |
| `exception-handling.md` | 22 | KEEP | 异常处理 |
| `file-structure.md` | 103 | REWRITE | 删除 rulebook 路径 |
| `naming-conventions.md` | 52 | KEEP | 命名约定 |
| `tech-stack.md` | 44 | KEEP | 技术选型 |
| `testing-guide.md` | 37 | KEEP | 测试要求 |
| `toolchain.md` | 56 | KEEP | 工具链 |

### 5.3 `design/` — 16 文件 / 5,350 行 ✅ KEEP

设计系统文档，前端开发的重要参考。

| 文件 | 判决 | 备注 |
|------|------|------|
| `DESIGN_DECISIONS.md` (1292 行) | KEEP | 核心设计决策 |
| `system/` (10 files) | KEEP | 组件卡、状态清单、设计映射、快捷键 |
| `Variant/` (2 files) | KEEP | 主题/缺失设计 prompts |
| `reference-implementations/README.md` | KEEP | 参考实现入口 |

### 5.4 `apps/desktop/main/skills/` — 17 SKILL.md ✅ KEEP

产品内置技能定义（brainstorm, chat, condense, continue, critique 等），是功能代码的一部分，不属于治理文档。

### 5.5 其他保留文件

| 文件 | 判决 | 备注 |
|------|------|------|
| `.github/pull_request_template.md` | KEEP | PR 模板 |
| `openspec/project.md` (91 行) | KEEP | 项目概述 |
| `openspec/changes/EXECUTION_ORDER.md` | KEEP | 保留结构（当前无活跃 change） |
| `docs/plans/unified-roadmap.md` | KEEP | 统一路线图 |
| `scripts/README.md` | KEEP | 脚本说明 |

---

## 六、第四类：根文件治理

### 6.1 `AGENTS.md` — 306 行 → REWRITE

**当前问题**：
- 包含大量 Rulebook / RUN_LOG 引用（14 处）
- P3 Evidence 要求 RUN_LOG 记录
- P5 Change Protocol 过于繁重
- §四 提到 Rulebook 体系

**改革方案**：见 `docs/audit/agents-md-reform-proposal.md`，计划缩减到 ~130 行。

### 6.2 `CLAUDE.md` — 306 行 → REWRITE

与 `AGENTS.md` 内容完全相同。改革后同步更新。

### 6.3 `README.md` — 47 行 → KEEP

项目 README，内容简洁合适。可考虑添加快速开发指南。

### 6.4 需要删除的 openspec 顶层文件

| 文件 | 判决 | 理由 |
|------|------|------|
| `openspec/AGENTS.md` (5 行) | DELETE | 仅引用根 AGENTS.md，无独立价值 |
| `openspec/README.md` (33 行) | KEEP | 解释 openspec 结构 |

### 6.5 需要处置的 docs 顶层文件

| 文件 | 行数 | 判决 | 理由 |
|------|------|------|------|
| `docs/delivery-skill.md` | 183 | REWRITE | 核心交付规则，但需去除 Rulebook/RUN_LOG |
| `docs/delivery-rule-mapping.md` | 27 | DELETE | 旧规则映射，不再适用 |
| `docs/frontend-overhaul-plan.md` | 1,328 | DELETE | 已过期的前端重组计划 |
| `docs/PRODUCT_OVERVIEW.md` | 701 | KEEP | 产品概述，需精简 |
| `docs/OpenSpec Owner 意图定义书.md` | 522 | DELETE | 早期 Owner 意图文档，内容已融入 specs |

---

## 七、文档治理标准

### 7.1 文档分层

清理后，项目文档归为三层：

```
Layer 1：Agent 指令层（AGENTS.md / CLAUDE.md）
  - 最高优先级，Agent 必读
  - 内容：核心原则 + 阅读链 + 架构索引
  - 维护者：Owner
  - 更新频率：按需，变更需 Owner 确认

Layer 2：规范层（openspec/specs/ + docs/references/）
  - 系统行为定义 + 开发参考手册
  - 内容：模块 spec.md + 编码/测试/命名/文件结构标准
  - 维护者：Agent 提案 + Owner 确认
  - 更新频率：随功能迭代

Layer 3：设计层（design/）
  - 视觉设计系统、组件卡、主题
  - 内容：DESIGN_DECISIONS.md + 组件系统 + 变体
  - 维护者：设计驱动
  - 更新频率：随设计迭代
```

### 7.2 文档命名规范

- 文件名：全小写 kebab-case（`coding-standards.md`）
- 禁止中文文件名（避免路径编码问题）
- 禁止空格（使用 `-` 分隔）
- Spec 文件统一命名为 `spec.md`，放在模块目录下


### 7.4 文档审计周期

- 每月一次轻量审计：检查文档是否与代码匹配
- 新功能 PR 必须同步更新相关 spec
- 禁止创建一次性文档后不维护

### 7.5 禁止事项

1. **禁止创建 archive 目录**——不需要的文件直接删除，git history 保留一切
2. **禁止为每个 Issue 创建 proposal.md / tasks.md**——用 PR description 替代
3. **禁止 RUN_LOG / evidence .md**——用 PR comments + CI output 替代
4. **禁止 Notion 导出文件入库**——如有需要，提取精华写入 spec 或 references
5. **禁止文档中写易漂移的精确统计数字**（如"共 X 个模块"），除非有门禁自动校验

---

## 八、执行计划

### 本 PR 执行范围

**Phase 1（本次提交）**：删除纯垃圾文件

```bash
git rm -r rulebook/
git rm -r openspec/_ops/
git rm -r openspec/changes/archive/
git rm -r openspec/changes/_template/
git rm -r docs/Notion/
git rm -r docs/plans/archive/
git rm -r docs/audit/archive/
git rm    docs/audits/backend-code-snapshot-2026-02-22.md
git rm    docs/delivery-rule-mapping.md
git rm    docs/frontend-overhaul-plan.md
git rm    "docs/OpenSpec Owner 意图定义书.md"
git rm    openspec/AGENTS.md
git rm    docs/audit/audit-index.md
```

**预计清除**：~1,940 文件 / ~136,000+ 行

### 后续 PR（ci-simplification）

- 修改 `.github/workflows/openspec-log-guard.yml`：去除 RUN_LOG 检查
- 修改/删除 `scripts/validate_*_ci.py`
- 简化 `scripts/agent_pr_preflight.py`
- 重写 `AGENTS.md` / `CLAUDE.md`（按 agents-md-reform-proposal.md）
- 重写 `docs/delivery-skill.md`
- 更新 `file-structure.md`

---

*本文件即为最终审计判决书。所有标记为 DELETE 的文件将在本 PR 中通过 `git rm` 执行。*
