# Proposal: issue-925-fe-composites-p1
更新时间：2026-03-03 09:37

## 引用

本任务对应 change `fe-composites-p1-search-and-forms`（Wave 4b-1），详见：

- `openspec/changes/fe-composites-p1-search-and-forms/proposal.md`
- `openspec/changes/fe-composites-p1-search-and-forms/specs/workbench/spec.md`

## Why

Feature 层搜索框和表单字段大量内联实现，缺乏统一交互与可访问性。新增 P1 级 Composite 组件（SearchInput / FormField / ToolbarGroup）统一复用模式，降低维护成本。

## 概述

新增 P1 Composite 组件（SearchInput / FormField / ToolbarGroup），并在 Feature 层完成替换示范：

- OutlinePanel 搜索区 → `<SearchInput>`
- SettingsGeneral 表单字段 → `<FormField>`

## 依赖

- `fe-composites-p0-panel-and-command-items` (#919) 已完成 ✓
