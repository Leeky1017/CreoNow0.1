# 提案：issue-606-phase-4-polish-and-delivery

更新时间：2026-02-22 12:22

## 背景

Issue 606 的前端重组在前 3 个阶段主要完成了止血、拆弹与提质。Phase 4 需要进入“精磨”阶段，把视觉审计、参考对标、设计交付物管理与工程化策略（分支、CI/CD、i18n）收敛为可验收、可追溯、可持续执行的闭环。

## 变更内容

- 在 `workbench` 增量规格中补充视觉审计闭环、截图基线库与最终 benchmark 验收标准。
- 在 `project-management` 增量规格中补充设计交付物台账与 ADR 管理、分支策略落地、CI/CD 门禁策略、i18n/l10n 交付策略。
- 在 `tasks.md` 建立 Scenario 到测试与证据的映射，确保后续执行满足 Red -> Green -> Refactor 与 Evidence 落盘要求。

## 受影响模块

- `workbench` — 增加 Phase 4 视觉精磨验收标准与 benchmark 关闭条件。
- `project-management` — 增加设计与工程交付治理策略，确保阶段性产出可管控。

## 不做什么

- 不直接修改 `openspec/specs/workbench/spec.md` 或 `openspec/specs/project-management/spec.md` 主规格。
- 不在本提案中新增运行时代码实现，仅定义 Phase 4 的行为契约与验收口径。

## 依赖关系

- 上游依赖：
  - Issue 606 前 3 阶段既有产出（作为 Phase 4 精磨输入基线）。
  - `openspec/specs/workbench/spec.md`
  - `openspec/specs/project-management/spec.md`
  - `docs/delivery-skill.md`
- 外部输入（参考材料）：
  - `/tmp/cn_notion_vault/CN前端开发/CN 前端开发/参考分析（Reference Analysis）.md`
  - `/tmp/cn_notion_vault/CN前端开发/CN 前端开发/设计交付物管理.md`
  - `/tmp/cn_notion_vault/CN前端开发/CN 前端开发/Git 分支策略.md`
  - `/tmp/cn_notion_vault/CN前端开发/CN 前端开发/CI-CD 集成.md`
  - `/tmp/cn_notion_vault/CN前端开发/CN 前端开发/i18n - l10n 考量.md`
- 下游依赖：
  - Phase 4 执行任务的测试实现、RUN_LOG 证据与门禁通过记录。

## 依赖同步检查（Dependency Sync Check）

- 核对输入：
  - 当前主规格（Workbench / Project Management）
  - `docs/delivery-skill.md` required checks 约束
  - Phase 4 Notion 源材料（视觉、交付物、分支、CI/CD、i18n）
- 核对项：
  - 分支策略需与仓库治理兼容：交付层保持 `task/<N>-<slug>`，前端执行层允许短命 `feat/refactor/style/fix/experiment` 子分支。
  - CI 门禁必须保留 `ci`、`openspec-log-guard`、`merge-serial` 三个 required checks，不允许与文档契约漂移。
- i18n 采用渐进式语言扩展（先架构与提取规范，后扩语言），但提取与 `Intl` 违规在 Phase 4 即阻断。
- 结论：`UPDATED`
- 后续动作：
  - 在本 change 的 delta spec 中固化上述收敛规则。
  - 在执行阶段以测试和 RUN_LOG 证据验证无漂移。

## 来源映射

| 来源                                | 提炼结论                                          | 落地位置与对应场景                                           |
| ----------------------------------- | ------------------------------------------------- | ------------------------------------------------------------ |
| `视觉审计（Visual Audit）.md`       | 建立“问题-整改-复测”闭环，未闭环项阻断验收        | `specs/workbench/spec.md`（`WB-P4-S1`、`WB-P4-S2`）          |
| `参考分析（Reference Analysis）.md` | 截图基线必须覆盖关键页面与主题态，差异超阈值阻断  | `specs/workbench/spec.md`（`WB-P4-S3`、`WB-P4-S4`）          |
| `设计交付物管理.md`                 | 交付物台账与 ADR 必须可追溯，缺失信息阻断审阅     | `specs/project-management/spec.md`（`PM-P4-S1`、`PM-P4-S2`） |
| `Git 分支策略.md`                   | 执行分支生命周期治理，experiment 未晋升不可入主干 | `specs/project-management/spec.md`（`PM-P4-S3`、`PM-P4-S4`） |
| `CI-CD 集成.md`                     | required checks 与质量门禁必须同时通过            | `specs/project-management/spec.md`（`PM-P4-S5`、`PM-P4-S6`） |
| `i18n - l10n 考量.md`               | UI 文案提取与 `Intl` 规范在 Phase 4 即作为阻断项  | `specs/project-management/spec.md`（`PM-P4-S7`、`PM-P4-S8`） |

## 审阅状态

- Owner 审阅：`PENDING`
