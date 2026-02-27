# 提案：audit-fatal-error-visibility-guardrails

更新时间：2026-02-25 23:50

## 背景

审计报告（九-9.2）识别出 2 处高风险静默错误抑制：`index.ts:466` 的 `catch { // Swallow }` 在日志写入失败时完全吞没异常，导致应用启动失败时无任何诊断信息；`CreateProjectDialog.tsx:456` 的 `catch { setSubmitting(false) }` 在项目创建失败时不向用户显示任何错误提示，用户操作无反馈。这两处是审计报告中仅有的 2 个高风险空 catch，必须立即修复。

## 变更内容

- `index.ts:466`：fatal 日志写入失败时添加 `process.stderr.write()` fallback，确保启动失败时至少有 stderr 输出可供诊断
- `CreateProjectDialog.tsx:456`：项目创建失败时捕获错误并通过 UI 状态向用户展示可见的错误提示信息

## 受影响模块

- workbench — index.ts 主进程 fatal 日志 stderr fallback
- project-management — CreateProjectDialog 项目创建失败的用户可见错误提示

## 不做什么

- 不处理审计报告 9.2 中的中风险项（AiPanel.tsx、aiService.ts），这些属于 C3 范围
- 不重构日志系统架构，仅在现有 catch 块中添加 fallback
- 不改变 CreateProjectDialog 的业务流程，仅补充错误展示
- 不处理 9.1（合理静默抑制）和 9.3（降级式抑制）

## 依赖关系

- 上游依赖：无
- 下游依赖：C4（`audit-ipc-result-unification`）依赖本 change 完成

## 来源映射

| 来源 | 提炼结论 | 落地位置 |
| --- | --- | --- |
| 审计报告 九-9.2 `index.ts:466` | fatal 日志吞没需 stderr fallback | `specs/workbench/spec.md` |
| 审计报告 九-9.2 `CreateProjectDialog.tsx:456` | 项目创建失败需用户可见错误提示 | `specs/project-management/spec.md` |

## 审阅状态

- Owner 审阅：`PENDING`
