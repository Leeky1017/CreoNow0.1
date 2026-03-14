# G0.5-06 前端视觉回归测试基础设施

- **GitHub Issue**: 待创建
- **所属任务簇**: W0.5-GATE（审计补丁 — 视觉回归测试）
- **涉及模块**: testing, storybook, visual-regression
- **前端验收**: 需要

---

## Why：为什么必须做

### 1. 现状

Storybook 现在只能证明“能 build”，不能证明“长得对”。视觉回归是整张网里最大的空洞之一，尤其对组件库、布局壳和关键面板来说，这种空洞会让样式退化悄无声息地混进主线。

### 2. 根因

- 没有 baseline 截图机制
- 没有截图 diff 在 CI 中的阻断路径
- 现有 story 资产没有进入视觉测试闭环

### 3. 不做的后果

- Phase 0 的“视觉验收控制”只剩 Storybook build 这一层薄皮
- UI 改动的退化只能靠人工 eyeballing

### 4. 证据来源

| 文档                                            | 章节     | 内容                                  |
| ----------------------------------------------- | -------- | ------------------------------------- |
| `docs/references/testing-excellence-roadmap.md` | Wave 0.5 | 明确要求补齐视觉回归基础设施          |
| `openspec/changes/EXECUTION_ORDER.md`           | 完成标志 | 将视觉 baseline 纳入 Phase 0 完成条件 |

---

## What：做什么

1. 建立 Playwright + Storybook 截图对比基线
2. 覆盖原语、布局与关键功能 story
3. 把视觉 diff 纳入 CI 阻断
4. 补齐缺失的基础原语 story

---

## Non-Goals：不做什么

1. 不引入付费第三方视觉测试平台
2. 不在本 change 内完成所有组件的像素级覆盖
3. 不替代产品级人工视觉验收

---

## 依赖与影响

- **上游依赖**: Storybook 基础设施已存在
- **下游受益**: 所有前端组件 / 布局 / 样式类 PR
