# Skill 路由发现性与关键词覆盖收口

- **GitHub Issue**: #1135（child issue；umbrella #1122）
- **所属 umbrella**: `a1-capability-closure-program`
- **涉及模块**: skill-system
- **前端验收**: 是

---

## Why：为什么必须做

### 1. 用户现象

当前 skill catalog 虽已丰富，但仍有多项技能只能显式选择；用户对“该说什么才会触发哪个 skill”缺少可见线索。

### 2. 根因

现有路由系统完成了否定守卫，却没有把关键词覆盖、发现性提示与语义退化路径一并收口。

### 3. 风险 / 威胁

用户会把“不会触发”误判成“没有这个能力”，使 skill 系统的可发现性和可信度同时受损。

---

## What：这条 change 要完成什么

1. 补齐高频 skill 的关键词覆盖或等价发现性提示
2. 明确显式选择、关键词路由与语义退化三条路径的契约
3. 让 factsheet、skill-system spec 与实际触发行为一致

---

## Non-Goals：不做什么

1. 不在本 change 中扩充 builtin skill catalog 数量
2. 不在本 change 中实现完整语义理解代理

---

## 依赖与影响

- 与 `a1-09-skill-output-validation-expansion` 共用 skill-system 的用户可见文案与错误链路
- 与 AI 面板的 skill picker、slash command 发现性存在协同

---

## 当前计划中的主要落点

- `apps/desktop/main/src/services/skills/`
- `apps/desktop/renderer/src/features/ai/`
- `openspec/specs/skill-system/spec.md`
