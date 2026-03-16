# 知识图谱规模治理与查询安全

- **GitHub Issue**: #1137（child issue；umbrella #1122）
- **所属 umbrella**: `a1-capability-closure-program`
- **涉及模块**: knowledge-graph
- **前端验收**: 是

---

## Why：为什么必须做

### 1. 用户现象

知识图谱在实体数量增大后，列表与路径查询的可用性、性能与安全边界都开始变得模糊。

### 2. 根因

当前实现更关注“能查到”，尚未把分页、循环保护与大规模数据下的查询边界收口成正式能力。

### 3. 风险 / 威胁

图谱规模一旦变大，用户会遇到列表退化、路径查询膨胀或不可控遍历，既伤体验，也伤稳定性。

---

## What：这条 change 要完成什么

1. 为实体列表与相关读取路径建立分页/分段策略
2. 为 `queryPath` 等查询链路补齐循环防护与可解释边界
3. 让 factsheet、spec 与实现对 KG 的规模治理口径一致

---

## Non-Goals：不做什么

1. 不在本 change 中重做图谱可视化布局
2. 不在本 change 中实现新的识别模型

---

## 依赖与影响

- 与 `a1-10-kg-recognition-and-character-navigation` 共用 KG 查询契约
- 可能影响 editor / search 的实体导航体验

---

## 当前计划中的主要落点

- `apps/desktop/main/src/services/knowledge-graph/`
- `apps/desktop/renderer/src/features/knowledge-graph/`
- `openspec/specs/knowledge-graph/spec.md`