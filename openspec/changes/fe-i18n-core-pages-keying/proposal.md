# 提案：fe-i18n-core-pages-keying

更新时间：2026-02-28 19:20

## Why（问题与目标）

核心页面（Dashboard/Onboarding/Search/AiPanel）仍大量硬编码字符串，导致中英混杂、日期/相对时间固化为 `en-US`。既然 i18n 基础设施已就绪，问题在“执行未覆盖”。

本 change 目标：对齐 Owner 决策“直接做 i18n 键值化”，将核心页面一次性纳入 `t()` 体系。

## What（交付内容）

- 核心页面硬编码字符串全部迁移为 i18n key（不论中文/英文，统一键值化）：
  - `DashboardPage`
  - `OnboardingPage`
  - `SearchPanel`
  - `AiPanel`
- 修复日期/相对时间本地化：
  - `formatDate` 不得硬编码 `en-US`
  - `formatRelativeTime` 必须可随语言切换返回对应语言
- 以 `CommandPalette.tsx` 与 `StatusBar.tsx` 为范本（既有 i18n 全实现）。

## Scope（影响范围）

- OpenSpec Delta:
  - `openspec/changes/fe-i18n-core-pages-keying/specs/workbench/spec.md`
  - `openspec/changes/fe-i18n-core-pages-keying/specs/project-management/spec.md`
- 预期实现触点（后续 Apply 阶段）：
  - 相关 Feature 文件 + `locales/zh-CN` / `locales/en`

## Out of Scope（不做什么）

- 不在本 change 内完成全仓库 60+ 文件的 i18n（其余 Feature 可另拆后续 change）。

## Dependencies（依赖）

- 上游：`fe-i18n-language-switcher-foundation`

## 审阅状态

- Owner 审阅：`PENDING`
