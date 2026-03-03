# Proposal: issue-935-fe-editor-inline-diff

更新时间：2026-03-03 16:00

## Why

Inline Diff 当前是空壳对象（`{ name: "inlineDiff", decorations: [] }`），无法在编辑器正文中实际呈现版本差异高亮。用户执行"与上一版本对比"时看不到任何视觉反馈，影响版本审阅体验。

## What Changes

- `inlineDiff.ts`：从空壳对象重构为 `Extension.create()` + `addProseMirrorPlugins()` + `DecorationSet`
- 新增纯函数 `diffToDecorationSet()`：`InlineDiffDecoration[] → DecorationSet`
- CSS 样式：`.inline-diff-added`（`--color-success-subtle`）、`.inline-diff-removed`（`--color-error-subtle` + line-through）
- 通过 `editor.storage.inlineDiff.diffs` + `setMeta('inlineDiffUpdate')` 触发装饰更新
- 5 个 TDD 测试覆盖 S1–S4 场景

## Impact

- Affected specs: `openspec/specs/version-control/spec.md`（Inline Diff scenarios）
- Affected code: `apps/desktop/renderer/src/features/editor/extensions/inlineDiff.ts`
