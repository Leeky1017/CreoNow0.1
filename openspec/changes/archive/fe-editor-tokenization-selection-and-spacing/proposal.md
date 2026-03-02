# 提案：fe-editor-tokenization-selection-and-spacing

更新时间：2026-02-28 19:20

## Why（问题与目标）

编辑器是写作 IDE 的“砚台”。当前光标与选区高亮仍依赖浏览器默认，未走 Token，导致：

- 亮/暗主题下选区颜色不一致
- 光标颜色无法统一控制
- 段间距/字间距缺少明确 Token，依赖 ProseMirror 默认 margin

本 change 目标：为编辑器补齐基础排版 Token，使“笔画与留白”可被系统化治理。

## What（交付内容）

- 新增并应用 Token：
  - `--color-selection`
  - `--color-caret`
  - `--text-editor-paragraph-spacing`
  - （可选）`--text-editor-letter-spacing`
- 在编辑器样式中应用上述 Token，确保主题切换一致。

## Scope（影响范围）

- OpenSpec Delta:
  - `openspec/changes/fe-editor-tokenization-selection-and-spacing/specs/editor/spec.md`
- 预期实现触点（后续 Apply 阶段）：
  - 编辑器 CSS（ProseMirror 内容区）
  - `tokens.css` 与 typography 相关工具

## Out of Scope（不做什么）

- 不在本 change 内调整 TipTap 扩展体系（仅排版 Token）。

## Dependencies（依赖）

- 上游：`openspec/specs/editor/spec.md`

## 审阅状态

- Owner 审阅：`PENDING`
