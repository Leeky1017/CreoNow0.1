# InlineDiff 注册与应用闭环

- **GitHub Issue**: #1131（child issue；umbrella #1122）
- **所属 umbrella**: `a1-capability-closure-program`
- **涉及模块**: editor
- **前端验收**: 是

---

## Why：为什么必须做

### 1. 用户现象

当前 Diff 对比已能在 AI 面板中双列审阅，但 InlineDiff 扩展虽已存在，却尚未真正接入编辑器。

### 2. 根因

InlineDiff 的注册、展示与应用语义没有与现有 editor / AI 修改链路形成闭环。

### 3. 风险 / 威胁

Diff 能力停留在“有旁路预览、无原位协作”，会让用户误判编辑器内联修改能力已经完整。

---

## What：这条 change 要完成什么

1. 将 InlineDiff 扩展真实注册到编辑器链路
2. 定义 InlineDiff 的展示、接受、拒绝与回退语义
3. 让 factsheet、editor spec 与实现口径一致

---

## Non-Goals：不做什么

1. 不在本 change 中重做 AI 面板双列 DiffView
2. 不在本 change 中扩展新的编辑器格式能力

---

## 依赖与影响

- 与 editor / ai-service / workbench 的现有修改提案链路协同
- 与 `a1-07-editor-link-and-bubblemenu-closure` 共享 editor 模块的交互边界

---

## 当前计划中的主要落点

- `apps/desktop/renderer/src/features/editor/`
- `apps/desktop/renderer/src/features/diff/`
- `openspec/specs/editor/spec.md`