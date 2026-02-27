# Proposal: issue-663-audit-fatal-error-visibility-guardrails

更新时间：2026-02-27 11:12

## Why

审计报告（九-9.2）识别出 2 处高风险静默错误抑制：`index.ts:466` 的空 catch 在日志写入失败时完全吞没异常；`CreateProjectDialog.tsx:456` 的空 catch 在项目创建失败时不向用户显示任何错误提示。

## What Changes

- `index.ts:466`：fatal 日志写入失败时添加 `process.stderr.write()` fallback
- `CreateProjectDialog.tsx:456`：项目创建失败时捕获错误并通过 UI 状态向用户展示可见的错误提示

## Impact

- Affected specs: `openspec/changes/audit-fatal-error-visibility-guardrails/specs/`
- Affected code: `apps/desktop/main/src/index.ts`, `apps/desktop/renderer/src/features/projects/CreateProjectDialog.tsx`
- Breaking change: NO
- User benefit: 启动失败时有 stderr 诊断输出；项目创建失败时用户看到错误提示
