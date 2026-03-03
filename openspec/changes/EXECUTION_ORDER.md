# Active Changes Execution Order

更新时间：2026-03-03 21:20

适用范围：`openspec/changes/` 下所有非 `archive/`、非 `_template/` 的活跃 change。

## 执行策略

- 当前活跃 change 数量为 **0**（无）。
- 执行模式：空闲（等待下一批 change 进入 active）。
- 规则：新 change 启动前，需先在本文件登记顺序与依赖，再进入 Red。

## 执行顺序

当前无活跃 change。

## 本次同步说明（Round 6 终局收口）

- `fe-reduced-motion-respect`：PR #950 已合并，已归档到 `openspec/changes/archive/fe-reduced-motion-respect`。
- `fe-deterministic-now-injection`：PR #951 已合并，已归档到 `openspec/changes/archive/fe-deterministic-now-injection`。
- `fe-token-escape-sweep`：PR #952 已合并，已归档到 `openspec/changes/archive/fe-token-escape-sweep`。

## 依赖说明

- 当前无活跃依赖。

## 依赖拓扑

```text
(no active changes)
```
