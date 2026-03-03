# Proposal: fe-accessibility-aria-live

更新时间：2026-03-03 20:00

## Why

当前多个动态更新区域（AI 流式输出、搜索结果列表、Toast 通知、自动保存状态）缺少 aria-live 属性，屏幕阅读器用户无法感知内容变化。本 change 补齐这些关键区域的播报语义。

## What Changes

- AiPanel.tsx：流式输出容器添加 `aria-live="polite" aria-atomic="false"`
- SearchPanel.tsx：结果列表容器添加 `aria-live="polite"`
- Toast.tsx：根据 variant 分流 `assertive`（error）/ `polite`（其余）
- SaveIndicator.tsx：状态文本添加 `aria-live="polite"`

## Impact

- 仅添加 HTML 属性，无功能逻辑变更
