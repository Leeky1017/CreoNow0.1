# Proposal: issue-915-fe-editor-tokens

更新时间：2026-03-02 19:42

## Why

编辑器当前选区高亮使用浏览器默认蓝色，光标颜色不受主题控制，段落间距无 Token 治理。这导致主题切换时编辑区域的视觉一致性无法保证。

## What Changes

- `tokens.css`：在亮/暗主题中新增 `--color-selection`、`--color-caret`、`--text-editor-paragraph-spacing` Token
- `main.css`：ProseMirror 编辑区域应用上述 Token（`::selection`、`caret-color`、`p + p margin-top`）
- 新建 Guard 测试（5 个 Scenario）验证 Token 存在性和 CSS 应用

## Impact

- Affected specs:
  - `openspec/changes/fe-editor-tokenization-selection-and-spacing/`
- Affected code:
  - `apps/desktop/renderer/src/styles/tokens.css`
  - `apps/desktop/renderer/src/styles/main.css`
  - `apps/desktop/renderer/src/features/editor/__tests__/editor-selection-token.guard.test.ts`
