# 提案：audit-editor-save-queue-extraction

更新时间：2026-02-25 23:50

## 背景

`editorStore.tsx:367-465` 在 zustand store 工厂函数内部实现了完整的 save queue（含优先级插入、串行处理、错误恢复），这 100 行逻辑本应是独立模块（审计类别十二-12.3）。同时，`editorStore.tsx:128` 使用 `eslint-disable-next-line max-lines-per-function` 抑制了函数规模告警（审计类别五），说明 `createEditorStore` 工厂函数已超长。不改的风险：save queue 逻辑无法独立测试，优先级/串行/恢复行为的正确性依赖整个 store 的集成测试；函数规模豁免掩盖了可维护性问题。

## 变更内容

- 将 editor save queue（优先级插入、串行处理、错误恢复）提取为独立模块
- 为提取后的 save queue 模块编写独立单测，覆盖优先级排序、串行执行、错误恢复行为
- 移除 `editorStore.tsx:128` 的 `eslint-disable-next-line max-lines-per-function` 豁免
- `createEditorStore` 改为调用独立 save queue 模块，降低函数规模

## 受影响模块

- editor — `editorStore.tsx` 的 save queue 提取与函数规模治理

## 不做什么

- 不改变 editor save queue 的外部行为（优先级/串行/恢复语义保持不变）
- 不改变 editorStore 的公开 API 或 zustand 状态结构
- 不涉及其他 store 的重构（kgStore/memoryStore 属于 C9 范围）
- 不涉及 `ipcGateway.ts` 的 eslint-disable（低风险，可后续处理）

## 依赖关系

- 上游依赖：无
- 下游依赖：
  - C12 `audit-dead-code-and-path-resolution-cleanup`（editor 模块整理完成后，死代码清理更安全）

## 来源映射

| 来源 | 提炼结论 | 落地位置 |
| --- | --- | --- |
| 审计报告 §十二-12.3（EditorStore 内联 save queue） | 100 行 save queue 逻辑内联在 store 工厂函数中，应独立模块化 | `specs/editor/spec.md`、`tasks.md` |
| 审计报告 §五（eslint-disable 抑制） | `editorStore.tsx:128` 用 eslint-disable 掩盖函数规模问题 | `specs/editor/spec.md`、`tasks.md` |
| 拆解计划 C10 | 风险中，规模 M，无依赖 | `proposal.md` |

## 审阅状态

- Owner 审阅：`PENDING`
