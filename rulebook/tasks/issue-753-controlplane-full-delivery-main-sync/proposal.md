# Proposal: issue-753-controlplane-full-delivery-main-sync

## Why
当前控制面存在一批已完成但未交付的本地改动，覆盖前端测试、文档迁移与治理归档。若继续滞留本地，会导致团队对主线状态的判断失真，增加后续冲突与返工成本。

## What Changes
- 基于 `task/753-controlplane-full-delivery-main-sync` 分支交付控制面全部待交付文件。
- 将审计文档从旧目录收敛到 `docs/Notion/CN/**`，并同步更新索引。
- 纳入 `rulebook/tasks/archive/2026-02-27-issue-701-audit-store-provider-style-unification/**` 历史归档材料。
- 建立 `ISSUE-753` RUN_LOG，记录测试、PR 与合并证据。

## Impact
- Affected specs: 无新增/修改主 spec（本任务为交付收口与同步）
- Affected code:
  - `apps/desktop/renderer/src/components/layout/*`
  - `apps/desktop/renderer/src/features/settings-dialog/*`
  - `docs/Notion/**`
  - `rulebook/tasks/archive/2026-02-27-issue-701-audit-store-provider-style-unification/*`
- Breaking change: NO
- User benefit: 控制面状态与 GitHub 主线对齐，待交付文件一次性可追溯落盘并完成主线收口。
