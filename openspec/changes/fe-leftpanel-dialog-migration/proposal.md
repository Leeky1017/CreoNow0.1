# 提案：fe-leftpanel-dialog-migration

更新时间：2026-02-28 19:20

## Why（问题与目标）

写作 IDE 的编辑区宽度是“寸土寸金”。当前 IconBar 的多项功能（search/memory/characters/KG/versionHistory）全部挤在左侧 Sidebar 内，以列表/面板形态长期占用空间，导致主编辑区被迫变窄。

Owner 已明确决策（见 `docs/frontend-overhaul-plan.md` §五）：

- search 走 Spotlight 浮层（对标 Cmd+K）
- 其余 4 项走全屏 Dialog
- files/outline 仍保留为 Sidebar 内的可停靠面板

本 change 的目标是把左侧 Sidebar 的职责从“万物收纳”收敛为“结构化导航”，其余配置型/大屏型能力改为“用完即走”的弹出式。

## What（交付内容）

- 缩减 Left Sidebar 面板：仅保留 `files` 与 `outline` 两类可停靠内容。
- 将以下 IconBar 入口改为弹出式：
  - `search` → Spotlight
  - `memory` / `characters` / `knowledgeGraph` / `versionHistory` → Dialog
- 统一弹出式面板样式：对齐 `SettingsDialog` 的 dialog shell（间距、header、关闭按钮、Esc 关闭）。

## Scope（影响范围）

- OpenSpec Delta:
  - `openspec/changes/fe-leftpanel-dialog-migration/specs/workbench/spec.md`
- 预期实现触点（后续 Apply 阶段）：
  - `apps/desktop/renderer/src/components/layout/IconBar.tsx`
  - `apps/desktop/renderer/src/components/layout/Sidebar.tsx`
  - `apps/desktop/renderer/src/components/layout/AppShell.tsx`
  - `apps/desktop/renderer/src/stores/layoutStore.tsx`
  - 相关 Feature 面板组件（Search/Memory/Character/KG/History）

## Out of Scope（不做什么）

- 不在本 change 内实现 `media` 面板（见 Spec 漂移决策 D1）。
- 不在本 change 内处理 `graph` vs `knowledgeGraph` 命名统一（见 Spec 漂移决策 D2）。
- 不在本 change 内重写 SearchPanel 的 Token/Primitives（见 `fe-searchpanel-tokenized-rewrite`）。

## Dependencies（依赖）

- 上游：`fe-hotfix-searchpanel-backdrop-close`（先修复现存无法关闭 bug，避免迁移时带病）
- 阻塞：Owner 决策
  - D1：IconBar `media` 面板处置
  - D2：`graph` vs `knowledgeGraph` 命名统一

## 审阅状态

- Owner 审阅：`PENDING`
