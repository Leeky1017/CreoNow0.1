# Proposal: issue-914-fe-composites-p0

更新时间：2026-03-02 20:10

## Why

现有 Feature 层中 AiPanel、FileTreePanel、CommandPalette 等组件存在大量散装的面板/命令项实现（手写 header/body 结构、手写 li 样式），缺乏统一复合组件抽象，导致风格不一致且维护成本高。

## What Changes

- 新增 `PanelContainer` 复合组件 — 统一面板 header/body/footer 结构，支持 collapsible
- 新增 `SidebarItem` 复合组件 — 统一侧边栏列表项容器，支持 icon/label/action slot
- 新增 `CommandItem` 复合组件 — 统一命令列表项，扩展支持 `labelContent`/`onMouseEnter`/`data-index`
- 替换 `AiPanel.tsx` → 使用 PanelContainer
- 替换 `FileTreePanel.tsx` → 使用 PanelContainer
- 替换 `CommandPalette.tsx` → 使用 CommandItem

## Impact

- Affected specs:
  - `openspec/changes/fe-composites-p0-panel-and-command-items/`
- Affected code:
  - `apps/desktop/renderer/src/components/composites/PanelContainer.tsx`
  - `apps/desktop/renderer/src/components/composites/SidebarItem.tsx`
  - `apps/desktop/renderer/src/components/composites/CommandItem.tsx`
  - `apps/desktop/renderer/src/features/ai-service/AiPanel.tsx`
  - `apps/desktop/renderer/src/features/document-management/FileTreePanel.tsx`
  - `apps/desktop/renderer/src/features/workbench/CommandPalette.tsx`
