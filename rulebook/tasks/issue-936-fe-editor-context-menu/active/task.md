# Task: fe-editor-context-menu-and-tooltips

更新时间：2026-03-03 16:00

Issue: #936
Branch: `task/936-fe-editor-context-menu`
Change: `openspec/changes/fe-editor-context-menu-and-tooltips`

## Objective

1. Implement EditorContextMenu (Radix ContextMenu) for the editor area
2. Migrate native `title` attributes in features/ to Radix Tooltip
3. Add tooltip-title-guard test

## Steps

- [x] Create Rulebook task + RUN_LOG
- [x] Dependency Sync Check
- [x] Red: EditorContextMenu tests
- [x] Red: tooltip-title-guard test
- [x] Green: EditorContextMenu implementation
- [x] Green: EditorPane integration
- [x] Green: Tooltip migration (17 sites, 10 files)
- [x] Refactor: icon size fix (14→16), aria-label, unused imports
- [x] Full regression (237/237, 1714/1714) + typecheck (0 errors)
- [x] Commit: `76d0b6da`
- [x] Push + PR

## Verification

- `pnpm -C apps/desktop test:run features/editor/EditorContextMenu`
- `pnpm -C apps/desktop test:run features/__tests__/tooltip-title-guard`
- `pnpm -C apps/desktop test:run` (full regression)
- `pnpm typecheck`
