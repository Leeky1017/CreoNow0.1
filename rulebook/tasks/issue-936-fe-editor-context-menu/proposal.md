# Proposal: issue-936-fe-editor-context-menu

更新时间：2026-03-03 16:00

## Why

编辑区当前缺少自定义右键菜单，用户右键只能使用浏览器默认上下文菜单，无法快速访问格式化和 AI 辅助功能。同时，多处 UI 组件使用原生 `title` 属性作为提示，样式不统一且无法自定义，与设计系统 Radix Tooltip 组件不一致。

## What Changes

- 新增 `EditorContextMenu.tsx`：基于 Radix ContextMenu，提供基础动作（复制/粘贴/撤销/重做）、格式动作（加粗/斜体/下划线）和 AI 动作（润色/改写）
- `EditorPane.tsx` 包裹 `<ContextMenu.Root>` + `<ContextMenu.Trigger>`
- 17 处原生 `title=` → `<Tooltip content="...">` 迁移（10 个文件）
- `tooltip-title-guard.test.ts`：静态源码扫描防止未来 `title=` 回归
- 全部菜单文案 i18n 化

## Impact

- Affected specs: `openspec/specs/editor/spec.md`（context menu scenarios）, `openspec/specs/workbench/spec.md`（tooltip scenarios）
- Affected code: `EditorContextMenu.tsx`（新增）, `EditorPane.tsx`, 10 个 Tooltip 迁移文件
