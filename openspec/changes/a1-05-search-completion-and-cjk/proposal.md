# 搜索能力补完与 CJK 收敛

- **GitHub Issue**: 待创建（child issue；umbrella #1122）
- **所属 umbrella**: `a1-capability-closure-program`
- **涉及模块**: search-and-retrieval
- **前端验收**: 是

---

## Why：为什么必须做

### 1. 用户现象

搜索基础可用，但跨项目、Memory/Knowledge 跳转、CJK 质量都还差一口气。

### 2. 根因

FTS tokenizer、UI action 和跨域结果导航没有一起完成。

### 3. 风险 / 威胁

搜索会被误判为“能搜但不好用”，难以承担创作 IDE 的主入口。

---

## What：这条 change 要完成什么

1. 补齐 Search All Projects / View More / 多结果域跳转
2. 提升中文等 CJK 查询效果与 query normalization
3. 让 SearchPanel 的 UI、store、IPC 和 retrieval spec 完整对齐

---

## Non-Goals：不做什么

1. 不在本 change 中实现全新的搜索引擎
2. 不做 unrelated UI 重设计

---

## 依赖与影响

- 依赖 search-and-retrieval / workbench / knowledge-graph / memory-system

---

## 当前计划中的主要落点

- `apps/desktop/main/src/services/search/`
- `apps/desktop/tests/integration/search/`
- `apps/desktop/renderer/src/features/search/`
