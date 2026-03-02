# 提案：fe-editor-advanced-interactions

更新时间：2026-02-28 19:20

## Why（问题与目标）

深度审计的若干体验缺口集中在“编辑器高级交互”层：

- 缺少 block-level drag handle，内容块无法拖拽重排
- AI stream 的撤销非原子，需要多次 Ctrl+Z 才能回退一轮输出
- 编辑器工具栏在窄窗口无溢出处理，按钮被截断

本 change 目标：补齐这三项“写作时会频繁撞到”的交互短板。

## What（交付内容）

- Block drag handle：引入 TipTap/ProseMirror 适配的 drag handle 方案（以现有扩展体系为准）。
- AI stream 原子撤销：对流式写入使用 `addToHistory=false` 或等价策略，保证一次 Ctrl+Z 回退一轮输出。
- 工具栏溢出菜单：在窄窗口下折叠为 “More” 菜单，保持可用。

## Scope（影响范围）

- OpenSpec Delta:
  - `openspec/changes/fe-editor-advanced-interactions/specs/editor/spec.md`

## Out of Scope（不做什么）

- 不在本 change 内做编辑器虚拟化与长文档性能专项（另立性能专题）。

## Dependencies（依赖）

- 上游：`openspec/specs/editor/spec.md`

## 审阅状态

- Owner 审阅：`PENDING`
