# 提案：fe-i18n-language-switcher-foundation

更新时间：2026-02-28 19:20

## Why（问题与目标）

当前 UI 中英混杂且缺少语言切换入口。仓库已存在 `react-i18next` 基础设施与 `locales/` 目录，但未形成“用户可操作”的闭环。

本 change 目标：先落地语言切换的最小系统能力（入口 + 持久化 + 热切换），为后续全量键值化提供底座。

## What（交付内容）

- Settings → General 新增 Language 下拉框（至少 `zh-CN` / `en`）。
- Onboarding Step 1 提供语言选择（与 Settings 共享同一持久化 key）。
- 语言选择必须持久化，并在下次启动生效；尽可能支持即时切换（hot reload）。

## Scope（影响范围）

- OpenSpec Delta:
  - `openspec/changes/fe-i18n-language-switcher-foundation/specs/workbench/spec.md`
  - `openspec/changes/fe-i18n-language-switcher-foundation/specs/project-management/spec.md`
- 预期实现触点（后续 Apply 阶段）：
  - `apps/desktop/renderer/src/features/settings/*`
  - `apps/desktop/renderer/src/features/onboarding/*`
  - `apps/desktop/renderer/src/i18n/*`（若存在）

## Out of Scope（不做什么）

- 不在本 change 内全量替换硬编码字符串（见 `fe-i18n-core-pages-keying`）。

## Dependencies（依赖）

- 上游：现有 `react-i18next` 基础设施（以代码为准）

## 审阅状态

- Owner 审阅：`PENDING`
