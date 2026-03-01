# Proposal: issue-806-fe-rightpanel-ai-guidance-and-style

更新时间：2026-03-01 16:45

## Why

当前 AI 右侧面板在 `DB_ERROR` 和 `AI_NOT_CONFIGURED` 场景下只给出通用报错，用户无法直接定位下一步操作；同时 `AiPanel` 通过内联 `<style>` 注入光标动画，破坏样式治理一致性并引入快照漂移噪音。

## What Changes

- 为 `DB_ERROR` 增加可执行修复引导卡：展示 rebuild 命令、复制按钮和重启提示。
- 为 `AI_NOT_CONFIGURED` / `UPSTREAM_ERROR` 增加配置引导卡：一键打开 `Settings -> AI`。
- 将 `AiPanel` 内联 `@keyframes blink` 迁移到 `main.css`，并补齐 `prefers-reduced-motion` 降级。
- 补齐回归测试：错误引导分流测试、内联样式守卫测试、Workbench 快照更新。

## Impact

- Affected specs:
  - `openspec/changes/fe-rightpanel-ai-guidance-and-style/specs/workbench/spec.md`
- Affected code:
  - `apps/desktop/renderer/src/features/ai/AiPanel.tsx`
  - `apps/desktop/renderer/src/components/layout/RightPanel.tsx`
  - `apps/desktop/renderer/src/components/layout/AppShell.tsx`
  - `apps/desktop/renderer/src/contexts/OpenSettingsContext.ts`
  - `apps/desktop/renderer/src/styles/main.css`
  - `apps/desktop/renderer/src/features/ai/AiPanel.error-guide.test.tsx`
  - `apps/desktop/renderer/src/features/ai/AiPanel.styles.guard.test.ts`
  - `apps/desktop/renderer/src/components/layout/__snapshots__/workbench.stories.snapshot.test.ts.snap`
- Breaking change: NO
- User benefit: 错误不再“只报错不指路”，用户可按面板提示立即修复或配置 AI，且样式注入策略与全局 CSS 体系保持一致。
