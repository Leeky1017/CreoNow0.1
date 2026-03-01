# Proposal: issue-807-fe-leftpanel-dialog-migration

更新时间：2026-03-01 16:02

## Why
当前左侧 Sidebar 同时承载结构化导航、检索、记忆、角色与知识图谱等多类能力，导致两类问题：其一，长期停靠与临时操作混在同一容器，空间语义混乱；其二，search/memory/characters/knowledgeGraph/versionHistory 占用 Sidebar 宽度，挤压主编辑区。Issue #807 的目标是在不重写业务面板功能的前提下，完成左侧入口的容器迁移：files/outline 继续停靠，search 改为 Spotlight，其余改为统一 Dialog。

## What Changes
- 状态模型收敛：`LeftPanelType` 限定为 `files | outline`，并新增 `dialogType` 与 `spotlightOpen` 作为弹出式容器状态。
- IconBar 入口行为迁移：
  - `search` → Spotlight 打开/关闭流；
  - `memory/characters/knowledgeGraph/versionHistory` → Dialog 打开/关闭流；
  - `files/outline` 保持停靠逻辑不变。
- AppShell 新增左侧弹出容器渲染：
  - 统一 `LeftPanelDialogShell` 承载 Dialog（Esc/backdrop/关闭按钮）；
  - Spotlight 承载 SearchPanel。
- Sidebar 渲染职责收敛为 `files/outline` 两类停靠面板。
- 测试与故事同步更新，新增迁移场景测试，修正 Story 激活语义。

## Impact
- Affected specs:
  - `openspec/changes/fe-leftpanel-dialog-migration/specs/workbench/spec.md`
  - `openspec/changes/fe-leftpanel-dialog-migration/tasks.md`
- Affected code:
  - `apps/desktop/renderer/src/stores/layoutStore.tsx`
  - `apps/desktop/renderer/src/components/layout/IconBar.tsx`
  - `apps/desktop/renderer/src/components/layout/AppShell.tsx`
  - `apps/desktop/renderer/src/components/layout/Sidebar.tsx`
  - `apps/desktop/renderer/src/components/layout/LeftPanelDialogShell.tsx`
  - `apps/desktop/renderer/src/surfaces/openSurface.ts`
  - 相关测试与 Story 文件
- Breaking change: NO
- User benefit: 左侧结构更聚焦，编辑区空间更稳定，临时操作统一使用可关闭的弹出容器，交互预期更一致。
