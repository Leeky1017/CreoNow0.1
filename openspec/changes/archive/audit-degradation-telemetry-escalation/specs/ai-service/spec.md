# AI Service Specification Delta

更新时间：2026-02-25 23:50

## Change: audit-degradation-telemetry-escalation

### Requirement: AiPanel 与 aiService 的静默错误抑制必须添加日志记录 [ADDED]

`AiPanel.tsx` 的 localStorage 读写失败与 judge 评估失败、`aiService.ts` 的 SSE JSON 解析失败，当前均为静默丢弃。**必须**在 catch 块中添加日志记录，确保失败可被诊断。

#### Scenario: AUD-C3-S5 AiPanel localStorage 读写失败记录 console.error [ADDED]

- **假设** AiPanel 组件尝试读取或写入 localStorage
- **当** localStorage 操作抛出异常（如存储已满、隐私模式限制）
- **则** catch 块通过 `console.error` 记录错误信息，包含操作类型（读/写）与 key 名称
- **并且** 组件继续正常运行（降级行为不变）

#### Scenario: AUD-C3-S6 AiPanel judge 评估失败记录日志 [ADDED]

- **假设** AiPanel 触发 judge 质量评估
- **当** judge 评估过程抛出异常
- **则** catch 块通过 `console.error` 记录错误信息，包含评估上下文
- **并且** 不影响主聊天流程的正常运行

#### Scenario: AUD-C3-S7 aiService SSE JSON 解析失败记录 warn 日志 [ADDED]

- **假设** aiService 正在处理 SSE 流式响应
- **当** 某个 SSE 数据行的 JSON 解析失败
- **则** 通过 `logger.warn()` 记录解析失败的原始数据片段（截断至安全长度）与错误信息
- **并且** 继续处理后续 SSE 数据行（降级行为不变）
