# Proposal: fe-composites-p2-empties-and-confirms
更新时间：2026-03-03 09:37

引用自 `openspec/changes/fe-composites-p2-empties-and-confirms/proposal.md`。

## Why

Feature 层空状态和确认弹窗各自内联实现，样式与交互不一致。新增 P2 级 Composite 组件统一空状态、确认对话框、信息条的视觉语义和可访问性。

## 概要

新增三个 P2 Composite 组件：

1. **EmptyState** — 统一空状态展示（icon + title + description + action）
2. **ConfirmDialog** — 基于 Dialog Primitive 的确认弹窗（支持 destructive 语义）
3. **InfoBar** — 面板内提示条（variant 驱动样式 + action + dismiss）

同时迁移 Feature 层散装空状态和确认弹窗至对应 Composite。
