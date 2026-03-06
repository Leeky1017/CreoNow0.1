# Active Changes Execution Order

更新时间：2026-03-06 23:30

适用范围：`openspec/changes/` 下所有非 `archive/`、非 `_template/` 的活跃 change。

## 执行策略

- 当前活跃 change 数量为 **2**。
- 执行模式：并行推进（互不依赖的变更可并行进入 Red）。
- 规则：新 change 启动前，需先在本文件登记顺序与依赖，再进入 Red。

## 执行顺序

1. `a0-01-zen-mode-editable`
2. `a0-05-skill-router-negation-guard`

## 本次同步说明（Wave 1 启动）

- `a0-01-zen-mode-editable`：Wave 1 新增，对应 Issue #986，禅模式行为变更，需走完整 Change 流程。
- `a0-05-skill-router-negation-guard`：Wave 1 新增，对应 Issue #987，Skill Router 否定守卫，需走完整 Change 流程。

## 依赖说明

- `a0-01-zen-mode-editable`：无上游依赖。
- `a0-05-skill-router-negation-guard`：无上游依赖，可与 `a0-01-zen-mode-editable` 并行推进。

## 依赖拓扑

```text
a0-01-zen-mode-editable
a0-05-skill-router-negation-guard
```
