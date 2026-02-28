# 提案：fe-zenmode-token-escape-cleanup

更新时间：2026-02-28 19:20

## Why（问题与目标）

ZenMode 的核心 Token 化已完成（背景/发光/文字），但仍残留少量 Token 逃逸：hover rgba、魔法间距与字号、状态栏背景等。这些残余会在主题切换与视觉一致性上留下“暗礁”。

本 change 目标：清扫 ZenMode 的残余逃逸，让其成为 Token 体系的“示范段”。

## What（交付内容）

- 将 ZenMode 残余硬编码（rgba/魔法间距/魔法字号/内联 style）替换为 Token。
- 必要时新增 ZenMode 专用 Token：
  - `--color-zen-hover`
  - `--color-zen-statusbar-bg`
  - `--zen-content-padding-*` / `--zen-title-size` / `--zen-body-size`

## Scope（影响范围）

- OpenSpec Delta:
  - `openspec/changes/fe-zenmode-token-escape-cleanup/specs/editor/spec.md`
- 预期实现触点（后续 Apply 阶段）：
  - `apps/desktop/renderer/src/features/editor/ZenMode.tsx`
  - `apps/desktop/renderer/src/features/editor/ZenModeStatus.tsx`
  - `apps/desktop/renderer/src/styles/tokens.css`

## Out of Scope（不做什么）

- 不在本 change 内调整 ZenMode 的信息架构与功能（只清扫 Token 逃逸）。

## Dependencies（依赖）

- 上游：`openspec/specs/editor/spec.md`

## 审阅状态

- Owner 审阅：`PENDING`
