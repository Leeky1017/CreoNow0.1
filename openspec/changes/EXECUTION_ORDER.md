# Active Changes Execution Order


适用范围：`openspec/changes/` 下所有非 `archive/`、非 `_template/` 的活跃 change。

## 执行策略

- 当前活跃 change 数量为 **6**。
- 执行模式：并行推进（互不依赖的变更可并行进入 Red）。
- 规则：新 change 启动前，需先在本文件登记顺序与依赖，再进入 Red。

## 执行顺序

1. `a0-01-zen-mode-editable`
2. `a0-04-export-honest-grading`
3. `a0-05-skill-router-negation-guard`
4. `a0-10-search-mvp`
5. `a0-12-inline-ai-baseline`
6. `testing-governance-foundation`

## 本次同步说明

- 既有 Phase 0 五个 active changes 继续保持原顺序与依赖关系。
- 新增活跃 change：`testing-governance-foundation`。
- 该 change 的前两阶段已通过独立 PR 落地：
  - `#1017 / PR #1018`：testing SSOT 与入口文档收口
  - `#1019 / PR #1020`：CI / preflight / gate 对齐
- 当前阶段通过三类测试迁移样板与 change 骨架，把 testing governance 从“已落地规则”推进到“可复用样板 + 活跃 change 跟踪”。

## 依赖说明

- `a0-01-zen-mode-editable`：无上游依赖。
- `a0-04-export-honest-grading`：无上游依赖，可与所有其他 change 并行。
- `a0-05-skill-router-negation-guard`：无上游依赖，可并行。
- `a0-10-search-mvp`：无上游依赖，可并行。
- `a0-12-inline-ai-baseline`：依赖 `a0-01-zen-mode-editable` 完成后启动。
- `testing-governance-foundation`：无产品行为上的上游依赖；作为治理 change，可与现有 Phase 0 active changes 并行推进，但不应覆盖它们的执行顺序声明。

## 依赖拓扑

```text
a0-01-zen-mode-editable ──→ a0-12-inline-ai-baseline
a0-04-export-honest-grading
a0-05-skill-router-negation-guard
a0-10-search-mvp
testing-governance-foundation
```
