# 编辑器链接与 BubbleMenu 收口

- **GitHub Issue**: 待创建（child issue；umbrella #1122）
- **所属 umbrella**: `a1-capability-closure-program`
- **涉及模块**: editor
- **前端验收**: 是

---

## Why：为什么必须做

### 1. 用户现象

用户点“插入链接”，却只能得到硬编码 `https://example.com`。

### 2. 根因

BubbleMenu 链接入口没有自己的输入与编辑闭环。

### 3. 风险 / 威胁

富文本编辑能力看似完整，实则在关键场景上失真。

---

## What：这条 change 要完成什么

1. 提供创建 / 编辑 / 清除链接的真实交互
2. 让 BubbleMenu 的链接行为与 Editor / Selection 状态一致
3. 补齐 i18n、a11y、测试与 Storybook 覆盖

---

## Non-Goals：不做什么

1. 不在本 change 中重做整个 BubbleMenu 布局
2. 不实现外部网页预览

---

## 依赖与影响

- 依赖 editor module 当前 selection / tiptap mark 能力

---

## 当前计划中的主要落点

- `apps/desktop/renderer/src/features/editor/`
- `apps/desktop/renderer/src/components/primitives/`
