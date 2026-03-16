# 记忆语义能力与冲突处理升级

- **GitHub Issue**: #1138（child issue；umbrella #1122）
- **所属 umbrella**: `a1-capability-closure-program`
- **涉及模块**: memory-system
- **前端验收**: 是

---

## Why：为什么必须做

### 1. 用户现象

Memory 现在“会记住你喜欢什么”，但对你拒绝什么学得很少；冲突只显示数量，不能处理。

### 2. 根因

当前 memory pipeline 的语义底座仍以规则与 hash 近似为主，冲突处理只到了指标层。

### 3. 风险 / 威胁

记忆系统难以稳定成长，且冲突会在后台悄悄积压。

---

## What：这条 change 要完成什么

1. 把 reject / partial 纳入偏好学习权重
2. 用真实 embedding 与蒸馏替代当前近似方案
3. 提供 conflict resolution 的 UI 入口与处理流程

---

## Non-Goals：不做什么

1. 不在本 change 中做云端 long-term memory
2. 不重写全部 memory 面板 UI

---

## 依赖与影响

- 依赖 memory-system / ai-service / workbench

---

## 当前计划中的主要落点

- `apps/desktop/main/src/services/memory/`
- `apps/desktop/renderer/src/features/memory/`
