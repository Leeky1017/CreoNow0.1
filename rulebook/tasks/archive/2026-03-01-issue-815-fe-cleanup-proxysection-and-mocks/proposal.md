# Proposal: issue-815-fe-cleanup-proxysection-and-mocks

更新时间：2026-03-01 19:40

## Why

Workbench 前端存在三类治理债务：
- 已确认废弃的 `ProxySection` 死代码仍在仓库中；
- `SearchPanel` 生产路径存在内置 mock 结果常量；
- AI 历史入口存在 no-op 占位交互，用户可点击但无闭环反馈。

这些问题会放大维护成本，并对验收真实性造成噪音。

## What Changes

- 删除 `apps/desktop/renderer/src/features/settings/ProxySection.tsx` 并清理引用。
- 从 `SearchPanel.tsx` 移除 `MOCK_SEARCH_RESULTS`，将展示数据留在 Storybook story。
- `ChatHistory` 收敛为空状态，移除硬编码 mock 历史。
- `RightPanel` 历史选择入口由 `void chatId` no-op 改为显式可观察提示。
- 增加 guard 测试覆盖，防止 dead code / mock 回流。

## Impact

- Affected specs:
  - `openspec/changes/fe-cleanup-proxysection-and-mocks/specs/workbench/spec.md`
- Affected code:
  - `apps/desktop/renderer/src/features/settings/ProxySection.tsx`
  - `apps/desktop/renderer/src/features/search/SearchPanel.tsx`
  - `apps/desktop/renderer/src/features/search/SearchPanel.stories.tsx`
  - `apps/desktop/renderer/src/features/ai/ChatHistory.tsx`
  - `apps/desktop/renderer/src/components/layout/RightPanel.tsx`
  - `apps/desktop/renderer/src/features/__tests__/proxy-section-dead.guard.test.ts`
  - `apps/desktop/renderer/src/features/search/SearchPanel.no-mock.guard.test.ts`
  - `apps/desktop/renderer/src/features/ai/AiPanel.history.interaction.test.tsx`
- Breaking change: NO
- User benefit: 生产路径行为更真实，UI 入口语义更清晰，回归风险更可控。
