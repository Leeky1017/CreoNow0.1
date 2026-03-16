# 知识图谱识别与角色导航收口

- **GitHub Issue**: #1136（child issue；umbrella #1122）
- **所属 umbrella**: `a1-capability-closure-program`
- **涉及模块**: knowledge-graph
- **前端验收**: 是

---

## Why：为什么必须做

### 1. 用户现象

角色页能看到出场章节，却点不进去；实体识别仍停留在规则近似。

### 2. 根因

recognition pipeline 与 renderer navigation callback 没有闭环。

### 3. 风险 / 威胁

知识图谱难以成为真正的创作工作台，而只是旁观者。

---

## What：这条 change 要完成什么

1. 升级实体识别能力与证据链
2. 接通角色出场章节跳转
3. 让 KG / editor / document navigation 三层协作一致

---

## Non-Goals：不做什么

1. 不在本 change 中重做图谱可视化布局
2. 不引入 unrelated graph algorithms

---

## 依赖与影响

- 依赖 knowledge-graph / search-and-retrieval / document-management / renderer navigation

---

## 当前计划中的主要落点

- `apps/desktop/main/src/services/kg/`
- `apps/desktop/renderer/src/features/character/`
- `apps/desktop/renderer/src/features/kg/`
