# 版本恢复能力接通

- **GitHub Issue**: #1129（child issue；umbrella #1122）
- **所属 umbrella**: `a1-capability-closure-program`
- **涉及模块**: version-control
- **前端验收**: 是

---

## Why：为什么必须做

### 1. 用户现象

Version history 面板能看不能回，像一扇只画不推的门。

### 2. 根因

Restore action 仍是 disabled / placeholder，恢复流程未与编辑器状态闭环。

### 3. 风险 / 威胁

版本系统失去核心价值；用户只能看见过去，不能回到过去。

---

## What：这条 change 要完成什么

1. 启用 Restore 按钮和恢复确认流程
2. 定义恢复后的 autosave、version marker、editor refresh 行为
3. 让 factsheet / spec / tests 一致描述恢复能力

---

## Non-Goals：不做什么

1. 不在本 change 中重写 entire branching UI
2. 不实现跨项目版本恢复

---

## 依赖与影响

- 依赖 version-control / editor / document-management

---

## 当前计划中的主要落点

- `apps/desktop/main/src/services/version/`
- `apps/desktop/renderer/src/features/version-history/`
- `apps/desktop/tests/unit/`
