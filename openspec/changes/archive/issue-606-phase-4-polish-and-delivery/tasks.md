更新时间：2026-02-25 09:41

## 1. Specification

- [x] 1.1 审阅并确认 Phase 4 “精磨”边界（视觉审计闭环、参考对标、交付物管理、工程化落地）。
- [x] 1.2 审阅并确认关键边界路径（审计不通过、截图缺失、CI 门禁不一致、i18n 漏提取）。
- [x] 1.3 审阅并确认验收阈值与不可变契约（required checks、benchmark 阈值、ADR 落盘规则）。
- [x] 1.4 若存在上游依赖，先完成依赖同步检查（Dependency Sync Check）并记录“无漂移/已更新”；无依赖则标注 N/A。

## 2. TDD Mapping（先测前提）

- [x] 2.1 将 delta spec 的每个 Scenario 映射为至少一个测试或校验用例（包含文档/脚本门禁）。
- [x] 2.2 为每个测试标注对应 Scenario ID，建立可追踪关系。
- [x] 2.3 设定门禁：未出现 Red（失败测试）不得进入实现。

### Scenario -> 测试映射

| Scenario ID | 目标测试/校验文件（计划）                                               | 核对要点                              | Red 命令 ID           | Green 命令 ID           |
| ----------- | ----------------------------------------------------------------------- | ------------------------------------- | --------------------- | ----------------------- |
| WB-P4-S1    | `apps/desktop/tests/integration/workbench/phase4-visual-audit.spec.ts`  | 审计项存在“问题-整改-复测”闭环        | `RED-WB-REPLAY`       | `GREEN-WB-AUDIT`        |
| WB-P4-S2    | `apps/desktop/tests/integration/workbench/phase4-visual-audit.spec.ts`  | 未闭环审计项阻断 Phase 4 验收         | `RED-WB-REPLAY`       | `GREEN-WB-AUDIT`        |
| WB-P4-S3    | `apps/desktop/tests/e2e/visual/phase4-baseline-capture.spec.ts`         | 基线截图清单与目录结构完整            | `RED-WB-REPLAY`       | `GREEN-WB-BASELINE`     |
| WB-P4-S4    | `apps/desktop/tests/e2e/visual/phase4-visual-diff.spec.ts`              | 视觉差异超阈值触发失败                | `RED-WB-REPLAY`       | `GREEN-WB-DIFF`         |
| WB-P4-S5    | `apps/desktop/tests/perf/phase4-benchmark.spec.ts`                      | benchmark 指标达标后允许收口          | `RED-WB-REPLAY`       | `GREEN-WB-BENCHMARK`    |
| WB-P4-S6    | `apps/desktop/tests/perf/phase4-benchmark.spec.ts`                      | 任一 benchmark 未达标时进入下一轮精磨 | `RED-WB-REPLAY`       | `GREEN-WB-BENCHMARK`    |
| PM-P4-S1    | `apps/desktop/tests/integration/governance/phase4-deliverables.spec.ts` | ADR 与交付物台账关联完整              | `RED-PM-DELIVERABLES` | `GREEN-PM-DELIVERABLES` |
| PM-P4-S2    | `apps/desktop/tests/integration/governance/phase4-deliverables.spec.ts` | 缺失 ADR/交付物阻断审阅               | `RED-PM-DELIVERABLES` | `GREEN-PM-DELIVERABLES` |
| PM-P4-S3    | `scripts/tests/phase4-branch-strategy.spec.ts`                          | 短命执行分支按策略回合并治理分支      | `RED-PM-BRANCH`       | `GREEN-PM-BRANCH`       |
| PM-P4-S4    | `scripts/tests/phase4-branch-strategy.spec.ts`                          | experiment 分支未晋升时阻断主干交付   | `RED-PM-BRANCH`       | `GREEN-PM-BRANCH`       |
| PM-P4-S5    | `scripts/tests/phase4-ci-gates.spec.ts`                                 | required checks 全绿并启用 auto-merge | `RED-PM-CI`           | `GREEN-PM-CI`           |
| PM-P4-S6    | `scripts/tests/phase4-ci-gates.spec.ts`                                 | 任一质量门禁失败时阻断交付            | `RED-PM-CI`           | `GREEN-PM-CI`           |
| PM-P4-S7    | `apps/desktop/tests/integration/i18n/phase4-i18n-strategy.spec.ts`      | 新增 UI 文案必须走 i18n key 与 Intl   | `RED-PM-I18N`         | `GREEN-PM-I18N`         |
| PM-P4-S8    | `apps/desktop/tests/integration/i18n/phase4-i18n-strategy.spec.ts`      | 文案未提取或格式化违规时立即阻断合并  | `RED-PM-I18N`         | `GREEN-PM-I18N`         |

### Evidence 命令索引（ISSUE-635）

- `RED-WB-REPLAY`: `cd /tmp/creonow-635-wb-red-75b1fde7 && pnpm exec tsx apps/desktop/tests/integration/workbench/phase4-visual-audit.spec.ts`
- `GREEN-WB-AUDIT`: `pnpm exec tsx apps/desktop/tests/integration/workbench/phase4-visual-audit.spec.ts`
- `GREEN-WB-BASELINE`: `pnpm exec tsx apps/desktop/tests/e2e/visual/phase4-baseline-capture.spec.ts`
- `GREEN-WB-DIFF`: `pnpm exec tsx apps/desktop/tests/e2e/visual/phase4-visual-diff.spec.ts`
- `GREEN-WB-BENCHMARK`: `pnpm exec tsx apps/desktop/tests/perf/phase4-benchmark.spec.ts`
- `RED-PM-DELIVERABLES`: `pnpm exec tsx apps/desktop/tests/integration/governance/phase4-deliverables.spec.ts`
- `GREEN-PM-DELIVERABLES`: `pnpm exec tsx apps/desktop/tests/integration/governance/phase4-deliverables.spec.ts`
- `RED-PM-BRANCH`: `pnpm exec tsx scripts/tests/phase4-branch-strategy.spec.ts`
- `GREEN-PM-BRANCH`: `pnpm exec tsx scripts/tests/phase4-branch-strategy.spec.ts`
- `RED-PM-CI`: `pnpm exec tsx scripts/tests/phase4-ci-gates.spec.ts`
- `GREEN-PM-CI`: `pnpm exec tsx scripts/tests/phase4-ci-gates.spec.ts`
- `RED-PM-I18N`: `pnpm exec tsx apps/desktop/tests/integration/i18n/phase4-i18n-strategy.spec.ts`
- `GREEN-PM-I18N`: `pnpm exec tsx apps/desktop/tests/integration/i18n/phase4-i18n-strategy.spec.ts`

## 3. Red（先写失败测试）

- [x] 3.1 编写视觉审计与截图基线的失败测试，验证缺失闭环时必然失败。
- [x] 3.2 编写交付物台账与 ADR 的失败校验，验证缺失关联信息时失败。
- [x] 3.3 编写分支策略、CI 门禁、i18n 提取的失败校验，记录 Red 证据（含 i18n 阻断场景）。

## 4. Green（最小实现通过）

- [x] 4.1 仅实现使审计闭环、基线截图、benchmark 验收通过的最小变更。
- [x] 4.2 仅实现使 ADR/交付物管理、分支策略、CI 门禁、i18n 阻断策略通过的最小变更。
- [x] 4.3 逐条让映射测试转绿，不引入 Phase 4 范围外能力。

## 5. Refactor（保持绿灯）

- [x] 5.1 合并重复校验逻辑，统一审计与 benchmark 数据结构。
- [x] 5.2 收敛治理策略文档与自动化校验规则，避免门禁规则分叉。
- [x] 5.3 保持所有场景测试与门禁持续全绿。

## 6. Evidence

- [x] 6.1 记录 RUN_LOG（含 Red 失败证据、Green 通过证据与关键命令输出）。
- [x] 6.2 记录依赖同步检查（Dependency Sync Check）的输入、结论与后续动作（无漂移/已更新）。
- [x] 6.3 记录 Main Session Audit（Audit-Owner/Reviewed-HEAD-SHA=签字提交 HEAD^/三项 PASS/Blocking-Issues=0/Decision=ACCEPT），并确认签字提交仅变更当前任务 RUN_LOG。
