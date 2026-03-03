# Proposal: fe-feature-focus-visible-coverage

## 引用 Change

本任务引用 `openspec/changes/fe-feature-focus-visible-coverage/` 中的 delta spec。

## 目标

补齐 Feature 层所有可交互元素的 `focus-visible` 焦点反馈样式。

## 策略

1. 新增 `--color-focus-ring` Design Token（亮/暗两套值）
2. 新增 `.focus-ring` utility class 供无法替换为 Primitive 的元素使用
3. 高优先级 Feature 中的原生 `<button>` 优先替换为 `<Button>` Primitive（自带 focus-visible）；无法替换者添加 `className="focus-ring"`
4. 新增 guard 测试确保未来不退化

## 范围

- 不改业务逻辑
- 不新增错误路径
- 聚焦 Feature 层（`renderer/src/features/`）
