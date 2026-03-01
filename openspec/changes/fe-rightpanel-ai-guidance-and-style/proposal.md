# 提案：fe-rightpanel-ai-guidance-and-style

更新时间：2026-03-01 16:55

## Why（问题与目标）

Owner 反馈的 AI 报错已拿到截图证据，当前主要有两类：

- Skills unavailable / `DB_ERROR`：打包后 `better-sqlite3` native binding 缺失或路径错误。
- Models unavailable / `AI_NOT_CONFIGURED`：`CREONOW_AI_PROVIDER` 未配置导致 provider 不可用。

现状的问题不在“是否报错”，而在“报错不指路”：用户只看到一串码与通用错误卡片，无法知道下一步该去哪里修。

同时，AiPanel 还存在视觉债：内联 `<style>` 定义 keyframes、边框分割过密，导致噪音叠加。

本 change 的目标是：

- 错误卡片从“宣判”升级为“引导”：给出具体修复步骤与一键跳转。
- 样式从“内联临时”回归到 Token/CSS 体系：减少边框、消除内联 style。

## What（交付内容）

- 为 AI 面板新增专用引导卡片（按错误码分流）：
  - `DB_ERROR`：展示 native binding 修复步骤（含命令与重启提示）。
  - `AI_NOT_CONFIGURED`：提示用户到 Settings → AI 选择 Provider 并配置。
- AiPanel 移除内联 `<style>` 标签：动画 keyframes 迁移到 `tokens.css` 或 Tailwind 配置。
- 降噪：减少 header/content/footer 的多层边框分割；错误卡片以“左侧色条 + 背景”表达层级。

## Scope（影响范围）

- OpenSpec Delta:
  - `openspec/changes/fe-rightpanel-ai-guidance-and-style/specs/workbench/spec.md`
- 预期实现触点（后续 Apply 阶段）：
  - `apps/desktop/renderer/src/features/ai/AiPanel.tsx`
  - `apps/desktop/renderer/src/features/settings/*`（跳转目标）
  - `apps/desktop/renderer/src/styles/tokens.css`（keyframes/变量）

## Out of Scope（不做什么）

- 不在本 change 内修复打包阶段的 native binding 问题本体（见 `fe-desktop-native-binding-packaging`）。
- 不在本 change 内重构 AI 面板整体布局结构（tab bar 合并见 `fe-rightpanel-ai-tabbar-layout`）。

## Dependencies（依赖）

- 上游：`fe-rightpanel-ai-tabbar-layout`（动作入口与布局层级先稳定）
- 上游：`openspec/specs/ai-service/spec.md`、`openspec/specs/workbench/spec.md`

## 审阅状态

- Owner 审阅：`APPROVED`
- 批准来源：Issue `#806`（https://github.com/Leeky1017/CreoNow/issues/806）
