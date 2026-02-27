# 提案：audit-dead-code-and-path-resolution-cleanup

更新时间：2026-02-25 23:50

## 背景

审计报告（七、八-8.2/8.3）发现死代码与暴力路径搜索问题：`phase4-delivery-gate.ts`（271 行）仅被测试文件引用，生产代码中无任何 import，属于孤立模块；`templateService.ts:98-116` 使用 5 个候选路径暴力搜索模板文件；`index.ts:66-77` 使用 3 个候选路径暴力搜索 preload 文件。暴力路径搜索是因为构建输出路径不确定而采用的绕过方案，增加了启动延迟与维护复杂度，且掩盖了构建配置不明确的根因。

## 变更内容

- 评估 `phase4-delivery-gate.ts` 的用途，明确"接入生产代码或删除"的决策并执行
- 将 `templateService.ts` 的模板路径从 5 候选暴力搜索改为基于构建配置的确定性解析
- 将 `index.ts` 的 preload 路径从 3 候选暴力搜索改为基于构建配置的确定性解析
- 确保 `ping-dead-code-cleanup.test.ts` 守卫测试继续有效，防止死代码回归

## 受影响模块

- workbench — phase4-delivery-gate 孤立模块处置、模板路径与预加载路径确定性解析

## 不做什么

- 不重构构建系统本身（仅在应用层明确路径解析策略）
- 不处理其他 @deprecated 方法清理（属于 C11 范围）
- 不修改测试文件中对 phase4-delivery-gate 的引用（若决策为删除，测试一并清理）

## 依赖关系

- 上游依赖：C10（`audit-editor-save-queue-extraction`）— 避免同时改动 workbench 模块核心文件产生冲突
- 下游依赖：无

## 来源映射

| 来源 | 提炼结论 | 落地位置 |
| --- | --- | --- |
| 审计报告 七 | templateService 与 index.ts 暴力路径搜索应改确定性解析 | `specs/workbench/spec.md` |
| 审计报告 八-8.2 | phase4-delivery-gate.ts 孤立模块需明确接入或删除 | `specs/workbench/spec.md` |
| 审计报告 八-8.3 | ping 死代码守卫测试应继续有效 | `specs/workbench/spec.md` |

## 审阅状态

- Owner 审阅：`PENDING`
