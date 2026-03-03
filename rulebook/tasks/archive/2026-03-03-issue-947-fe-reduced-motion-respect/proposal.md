# Proposal: fe-reduced-motion-respect

更新时间：2026-03-03 22:00

## Why

当前 CreoNow 对 `prefers-reduced-motion` 的支持是碎片化的——仅个别组件（如 typing-cursor）单独处理。46 处 `transition-all`/`animate-*` 和 2 处内联 `@keyframes` 均未受 reduced motion 控制，违反 WCAG 2.1 SC 2.3.3 建议和无障碍最佳实践。

## What

1. 在 `main.css` 中添加全局 `@media (prefers-reduced-motion: reduce)` 规则，将所有元素的 `animation-duration` 和 `transition-duration` 强制为 `0.01ms`
2. 在 `tokens.css` 中添加 reduced-motion 下 duration token 覆盖（`--duration-fast`/`--duration-normal`/`--duration-slow` → `0ms`）
3. 将 `SearchPanel.tsx` 的内联 `@keyframes slideDown` 移至 `main.css` 统一管理

## Scope

- `apps/desktop/renderer/src/styles/main.css`
- `apps/desktop/renderer/src/styles/tokens.css`
- `apps/desktop/renderer/src/features/search/SearchPanel.tsx`
- 新增测试：`apps/desktop/renderer/src/styles/__tests__/reduced-motion-global.guard.test.ts`

不改动 AiPanel.tsx（已在先前 change 清理内联 keyframes）。不改动业务逻辑。
