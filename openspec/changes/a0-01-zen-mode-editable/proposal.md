# Proposal: a0-01-zen-mode-editable

## Why

当前禅模式在视觉上已经具备沉浸感，但实现上仍是只读展示层：

- `ZenMode.tsx` 通过 `content.paragraphs.map()` 渲染静态 `<p>`
- `BlinkingCursor` 只是视觉组件，不是真实编辑光标
- `ZenModeOverlay` 仅从 `editorStore.editor` / `documentContentJson` 提取内容，没有写回链路

这让“禅模式”变成了一个好看的壳，而不是写作现场。对创作工具而言，这不是小瑕疵，而是主承诺失真。

## What Changes

本 change 将把禅模式从“只读内容投影”升级为“真实可编辑的写作视图”：

- 禅模式正文区域必须保持可编辑
- 禅模式中的输入必须写回当前文档状态
- 退出禅模式后，输入内容必须完整保留
- 保持现有沉浸式限制：隐藏侧栏/右栏/工具栏/主状态栏，不开放 AI assistance

## Scope

涉及模块：

- `openspec/specs/editor/spec.md`
- `apps/desktop/renderer/src/features/zen-mode/ZenMode.tsx`
- `apps/desktop/renderer/src/components/layout/AppShell.tsx`
- 相关 renderer 测试

## Non-Goals

- 不做 OS 级全屏
- 不在禅模式中加入 AI 功能
- 不重写整个 TipTap / editor store 架构
