# 提案：fe-searchpanel-tokenized-rewrite

更新时间：2026-02-28 19:20

## Why（问题与目标）

`SearchPanel.tsx` 是当前前端最大且最“自成宇宙”的 Token 逃逸区：大量硬编码 hex/rgba、内联 style、原生 input/button、自建子组件，几乎不复用 Primitives/Composites。

这会造成三重后果：

- 主题与设计系统失效（局部暗黑主题硬编码）
- 可访问性退化（focus-visible/aria/键盘导航不一致）
- 维护成本爆炸（1079 行单文件 + 自建控件散落）

本 change 目标：让 SearchPanel 回归设计系统，做到“换肤不破、复用不散”。

## What（交付内容）

- SearchPanel 全面回归 Token：移除硬编码 `#xxxxxx`/`rgba(...)`/内联 style。
- SearchPanel 全面回归 Primitives/Composites：
  - `<Input>` 替换原生 `<input>`
  - `<Button>`/`<ListItem>` 等替换原生 `<button>`
  - 图标统一使用 Lucide
- 动画与交互：
  - 禁止 `transition-all`
  - 尊重 `prefers-reduced-motion`

## Scope（影响范围）

- OpenSpec Delta:
  - `openspec/changes/fe-searchpanel-tokenized-rewrite/specs/workbench/spec.md`
- 预期实现触点（后续 Apply 阶段）：
  - `apps/desktop/renderer/src/features/search/SearchPanel.tsx`
  - 相关 primitives/composites（必要时新增）

## Out of Scope（不做什么）

- 不在本 change 内改变搜索能力本体（索引、排序、召回策略），仅改善 UI/UX 与设计系统对齐。
- 不在本 change 内进行 S3 的搜索入口形态迁移（Spotlight），该行为由 `fe-leftpanel-dialog-migration` 定义。

## Dependencies（依赖）

- 上游：`fe-hotfix-searchpanel-backdrop-close`（关闭语义先稳定）
- 上游：`openspec/specs/workbench/spec.md`
- 可能依赖：`fe-composites-p0-panel-and-command-items`（若需要复用 composite）

## 审阅状态

- Owner 审阅：`PENDING`
