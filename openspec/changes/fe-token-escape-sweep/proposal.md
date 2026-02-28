# 提案：fe-token-escape-sweep

更新时间：2026-02-28 19:20

## Why（问题与目标）

前端已具备 Design Token 与 Primitives，但执行层仍存在系统性 Token 逃逸：硬编码 hex/rgba、数字 z-index、魔法阴影/间距、`transition-all` 滥用等。其后果不是“丑”这么简单，而是让主题、一致性、可访问性与可测试性都失去抓手。

本 change 目标：以审计量化数据为基线，完成一次可追溯的 Token 逃逸清扫，并建立 guard 口径防止回潮。

## What（交付内容）

- 清扫范围（按文档量化维度）：
  - 硬编码 hex / rgba
  - 数字 z-index（`z-\d+`）
  - `transition-all` 滥用
  - `h-screen/w-screen` 越权
  - 魔法阴影、魔法间距、魔法字号
- 建立 guard 测试（或 lint rule）阻断新增逃逸：
  - 新增 raw color / rgba / 数字 z-index / transition-all 时必须失败

## Scope（影响范围）

- OpenSpec Delta:
  - `openspec/changes/fe-token-escape-sweep/specs/workbench/spec.md`
  - `openspec/changes/fe-token-escape-sweep/specs/editor/spec.md`（若涉及编辑器区域）
- 预期实现触点（后续 Apply 阶段）：
  - 多个 Feature/Layout 组件（以审计 grep 结果为准）
  - `apps/desktop/renderer/src/styles/tokens.css`

## Out of Scope（不做什么）

- 不在本 change 内重写某个特定页面（如 SearchPanel 重写见独立 change）。

## Dependencies（依赖）

- 上游：`openspec/specs/workbench/spec.md`

## 审阅状态

- Owner 审阅：`PENDING`
