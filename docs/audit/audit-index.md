# CreoNow 治理改革 — 审计文档索引

更新时间：2026-03-04

> "目录者，学之纲领也。"

---

## 文档一览

| # | 文件 | 内容摘要 | 行数 |
|---|------|----------|------|
| 0 | [本文件](./audit-index.md) | 索引 | — |
| 1 | [治理改革总纲](./governance-reform-master-plan.md) | 十章完整方案：现状诊断、Rulebook 废止、OpenSpec 瘦身、前后端差异化工作流、CI 改革、AGENTS.md 改革、delivery-skill 分层、预期效果、实施顺序 | ~250 |
| 2 | [AGENTS.md 改革提案](./agents-md-reform-proposal.md) | 原则对照（7→6，废 P3/合 P5/新增 P-Visual）、完整新版草案（306→133 行，-56%）、三阶段工作流、风险评估 | ~200 |
| 3 | [CI 简化提案](./ci-simplification-proposal.md) | 14 jobs 逐项审判、删 openspec-log-guard、新增 i18n + token lint（含 YAML）、dependency-audit 改 weekly、脚本清理 | ~220 |
| 4 | [文件清理执行清单](./file-cleanup-execution-list.md) | 4 阶段 4 PR：Rulebook 冻结（151 dirs）→ RUN_LOG 归档（417 files）→ CI 清理 → 文档更新，含完整脚本和验证命令 | ~200 |
| 5 | [后端代码专项审计](./backend-code-analysis.md) | 评级 A-、15 模块逐项分析、4 模块零测试、memory 模块风险、后端改进路线图、前后端差异化治理建议 | ~200 |
| 6 | [前端问题与 i18n 分析](./amp-cn-frontend-issues-and-i18n-problems-analysis.md) | 五个根本病因、i18n 审计数据、Token 审计数据、38 个 fe-* 变更分类、治理改革建议、8 个潜在陷阱 | ~400 |

---

## 阅读建议

**如果只有 10 分钟**：读 §1 治理改革总纲的 §二（Rulebook 判决）和 §九（预期效果）。

**如果要做决策**：读 §1 总纲全文 + §2 AGENTS.md 改革 → 确认方向后，§4 执行清单就是行动清单。

**如果关心代码质量**：§5 后端审计 + §6 前端分析 → 了解前后端质量差距的根因。

**如果要改 CI**：§3 CI 简化提案有完整的 YAML 代码和实施清单。

---

## SKILL 文件变更记录

| 变更 | 改前 | 改后 |
|------|------|------|
| 交付主 SKILL | `openspec-rulebook-github-delivery`（~200 行） | **`openspec-github-delivery`**（104 行）——废止 Rulebook/RUN_LOG/审计 .md |
| 记忆叠加层 | `org-memory-overlay`（~80 行） | **`task-memory-overlay`**（56 行）——不再依赖 RUN_LOG/Rulebook evidence |
| 审计 SKILL | `independent-premerge-review`（~60 行） | **`independent-premerge-review`**（48 行）——review 结论写 PR comment，不生成 .md |

文件位置：
- `.codex/skills/<name>/SKILL.md`（源文件）
- `.claude/skills/<name>/` → 符号链接到 `.codex/skills/`

---

## 关键数字速查

| 指标 | 改前 | 改后 |
|------|------|------|
| 每任务文档产出 | 6-8 个 .md | 0-1 个 |
| delivery-skill 硬约束 | 20 条 | 8 条 |
| AGENTS.md 行数 | 306 行 / 7 原则 | ~133 行 / 6 原则 |
| CI required checks | 3 个 | 2 个 |
| CI jobs（每 PR） | 14 + log-guard | 13（含 2 新质量检查） |
| Agent 工作时间分配 | 30% 编码 / 70% 文档 | 70% 编码 / 30% 文档 |
| 后端评级 | A- | A-（补测试后可达 A） |
| 前端视觉检查 | 0 个自动检查 | 2 个（i18n + token lint） |
