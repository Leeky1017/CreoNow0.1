# 提案：fe-ui-open-folder-entrypoints

更新时间：2026-03-01 22:00

## Why（问题与目标）

Open Folder 不是隐藏技能，而是第一性入口。即便 IPC 已打通，若没有足够多的 UI 入口，用户仍会困在“我该从哪里开始”。

本 change 目标：在产品的四个关键位置提供一致的 Open Folder 入口，并确保行为一致。

## What（交付内容）

新增以下入口（全部调用同一 open-folder action）：

- Onboarding Step 3（打开文件夹）
- Dashboard 空状态（Open Folder）
- Command Palette 命令（Open Folder）
- 菜单栏 File → Open Folder（⚠️ 已推迟：当前应用尚无原生菜单系统，待菜单栏基础设施就绪后由后续 change 补充）

## Scope（影响范围）

- OpenSpec Delta:
  - `openspec/changes/fe-ui-open-folder-entrypoints/specs/workbench/spec.md`
  - `openspec/changes/fe-ui-open-folder-entrypoints/specs/project-management/spec.md`
- 预期实现触点（后续 Apply 阶段）：
  - `apps/desktop/renderer/src/features/onboarding/OnboardingPage.tsx`
  - `apps/desktop/renderer/src/features/dashboard/DashboardPage.tsx`
  - `apps/desktop/renderer/src/features/command-palette/CommandPalette.tsx`
  - `apps/desktop/main/src/*`（菜单项）

## Out of Scope（不做什么）

- 不在本 change 内调整“打开文件夹后的工作区加载逻辑”（属于 open-folder contract 与文档管理/项目管理实现）。

## Dependencies（依赖）

- 上游：`fe-ipc-open-folder-contract`

## 审阅状态

- Owner 审阅：`PENDING`
