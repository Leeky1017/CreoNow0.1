# 提案：audit-error-language-standardization

更新时间：2026-02-25 23:50

## 背景

审计报告（十一-11.3、十三-13.2）发现后端服务中存在中英文错误消息混用问题：`runtime-validation.ts` 中 6 处硬编码中文错误消息，`providerResolver.ts` 中 2 处硬编码中文错误消息，而其他后端服务使用英文。后端 IPC 层语言不一致导致前端无法统一处理错误展示，增加了国际化难度，且违反了"后端统一英文 error code + message，前端负责翻译"的最佳实践。

## 变更内容

- 将 `runtime-validation.ts` 中 6 处硬编码中文错误消息替换为英文 error code + 英文 message
- 将 `providerResolver.ts` 中 2 处硬编码中文错误消息替换为英文 error code + 英文 message
- 建立后端错误消息规范：统一使用英文 error code + 英文 message 格式
- 在前端建立翻译映射层，将后端 error code 映射为用户可见的中文提示
- 为中英混用场景添加回归测试，防止新代码引入硬编码中文错误消息

## 受影响模块

- ipc — 错误码规范定义与统一
- ai-service — runtime-validation 与 providerResolver 的中文硬编码清理

## 不做什么

- 不实现完整的 i18n 国际化框架（仅建立 error code 到中文的映射层）
- 不修改前端 UI 层的中文文案（前端中文是正确的用户界面语言）
- 不处理后端日志中的中文（日志语言不在本次范围内）
- 不重构 runtime-validation 或 providerResolver 的业务逻辑

## 依赖关系

- 上游依赖：C2（`audit-fatal-error-visibility-guardrails`）— 需要错误可见性基础设施就绪后再统一错误语言
- 下游依赖：无

## 来源映射

| 来源 | 提炼结论 | 落地位置 |
| --- | --- | --- |
| 审计报告 十一-11.3 | runtime-validation 6 处与 providerResolver 2 处中文硬编码应替换为英文 error code | `specs/ai-service/spec.md` |
| 审计报告 十三-13.2 | 后端统一英文 error code + message，前端负责翻译 | `specs/ipc/spec.md` |

## 审阅状态

- Owner 审阅：`PENDING`
