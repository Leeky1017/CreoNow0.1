# Skill 输出校验扩面

- **GitHub Issue**: #1134（child issue；umbrella #1122）
- **所属 umbrella**: `a1-capability-closure-program`
- **涉及模块**: skill-system
- **前端验收**: 否

---

## Why：为什么必须做

### 1. 用户现象

现在只有部分技能受保护，剩余技能仍可能吐出空内容、脏格式或异常膨胀结果。

### 2. 根因

输出校验规则按历史高频技能补丁式增长，还没有成为全技能矩阵。

### 3. 风险 / 威胁

Skill system 的可靠性在不同技能之间不一致。

---

## What：这条 change 要完成什么

1. 定义 skill-by-skill 输出校验矩阵
2. 扩展 `SKILL_OUTPUT_INVALID` 触发条件与可观测性
3. 确保 factsheet / spec / tests 对哪些技能受校验有明确口径

---

## Non-Goals：不做什么

1. 不在本 change 中实现模型级语义质量打分
2. 不改变 skill catalog 范围

---

## 依赖与影响

- 依赖 skill-system / ipc / ai-service

---

## 当前计划中的主要落点

- `apps/desktop/main/src/services/skills/`
- `apps/desktop/renderer/src/lib/errorMessages.ts`
