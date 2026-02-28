# 提案：fe-onboarding-flow-refresh

更新时间：2026-02-28 19:20

## Why（问题与目标）

Onboarding 是用户与产品第一次对话。当前初始打开体验缺少清晰的路径指引（打开项目/打开文件夹/基础设置），导致用户进入主界面后才发现“无从下手”。

本 change 目标：将 Onboarding 改为一条可闭环的最短路径，并与 Open Folder 与 i18n 策略对齐。

## What（交付内容）

- 重排并补齐 Onboarding 步骤（以现有资产为准）：
  - Step 1：语言选择（与 i18n foundation 对齐）
  - Step 2：AI 配置引导（可跳过；若未配置，后续 AiPanel 仍需引导卡片兜底）
  - Step 3：Open Folder（打开工作区）
- Step 3 的行为必须遵循“文件夹即工作区”的定义（见 open-folder contract）。

## Scope（影响范围）

- OpenSpec Delta:
  - `openspec/changes/fe-onboarding-flow-refresh/specs/project-management/spec.md`
- 预期实现触点（后续 Apply 阶段）：
  - `apps/desktop/renderer/src/features/onboarding/OnboardingPage.tsx`
  - 相关设置页跳转与 open-folder action

## Out of Scope（不做什么）

- 不在本 change 内实现 AI native binding 打包修复（见 `fe-desktop-native-binding-packaging`）。

## Dependencies（依赖）

- 上游：`fe-ui-open-folder-entrypoints`
- 上游：`fe-i18n-language-switcher-foundation`（若 Step 1 需要真实切换）

## 审阅状态

- Owner 审阅：`PENDING`
