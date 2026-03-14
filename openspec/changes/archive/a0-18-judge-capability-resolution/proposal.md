# A0-18 Judge 决策：接入或降级

- **GitHub Issue**: #997
- **所属任务簇**: P0-3（能力诚实分级与假功能处置）
- **涉及模块**: ai-service
- **前端验收**: 视决策结果而定
- **载体类型**: 决策 issue（Decision）

---

## Why：为什么必须做

### 1. 用户现象

用户在 QualityPanel 中点击"质量检查"按钮，期望获得对创作内容的 AI 质量评估反馈。实际上，`JudgeService.ensure()` 永远返回 `MODEL_NOT_READY`——无论用户怎么点，结果都是"模型未就绪"。用户看到了质量检查入口，有了质量改进的期待，点击后却只收获一句冷漠的错误提示。有入口无能力，"虚有其表"。

### 2. 根因

Judge 模块的全链路分析：

- **UI 层**：`QualityPanel` 已渲染质量检查按钮，绑定了点击事件，调用 Judge 相关 IPC
- **IPC 层**：`judge.ts` 中 `judge:ensure` handler 已注册
- **Service 层**：`JudgeService.ensure()` 检查 LLM 可用性——但由于**未配置远程 LLM**（无 API Key、无 provider 配置），`ensure()` 始终返回 `MODEL_NOT_READY`
- **本质**：Judge 需要 LLM 支撑才能工作，但 v0.1 的 LLM 连接体系尚未在 Judge 场景中打通

### 3. v0.1 威胁

- **能力欺骗**：质量检查入口存在但无法工作，属于 P0-3 任务簇定义的"假功能"——UI 承诺了 AI 能力，实际不兑现
- **用户挫败感**：创作者在写作过程中最需要质量反馈的时刻，得到的却是"模型未就绪"——这不是"功能不够好"，是"功能不存在"
- **架构依赖**：Judge 依赖 LLM Proxy，而 LLM Proxy 的配置链路涉及 API Key 安全存储、provider 选择等——决策需考虑这条依赖链的就绪度

### 4. 证据来源

| 文档                                               | 章节           | 内容                                                      |
| -------------------------------------------------- | -------------- | --------------------------------------------------------- |
| `docs/audit/amp/08-backend-module-health-audit.md` | §三 Judge 模块 | `ensure()` 永远返回 `MODEL_NOT_READY`，Judge 功能无法使用 |
| `docs/audit/amp/07-ui-ux-design-audit.md`          | §二 假 UI 清单 | QualityPanel 质量检查入口存在但无实际功能                 |
| `docs/audit/amp/05-implementation-backlog.md`      | P0-3           | Judge 能力决策归属能力诚实分级任务簇                      |

---

## What：这是一个决策任务

本任务需要做出 v0.1 对 Judge 能力的产品决策。三个可选方向、一个必须选定。

### 产出物

1. **决策结论**：从三个方案中选定 v0.1 的处置方式
2. **实施指令**：基于决策结论，给出具体的代码变更要求
3. **对 A0-06 的影响声明**：决策对发布事实表中 Judge 能力分级的影响

---

## Scope

- **主规范**: `openspec/specs/ai-service/spec.md`
- **涉及源码（视决策结果）**:
  - `renderer/src/features/quality-gates/` — QualityPanel UI
  - `main/src/services/ai/` — JudgeService
  - `main/src/ipc/judge.ts` — Judge IPC handler
- **所属任务簇**: P0-3（能力诚实分级与假功能处置）
- **前置依赖**: 无直接代码依赖——但决策需参考 LLM Proxy 配置链路的当前就绪状态
- **下游影响**: A0-06（发布事实表）——Judge 能力分级取决于本决策结论

---

## Non-Goals：不做什么

1. **不实现完整的 AI 质量评估系统**——即使选择"接入 LLM"方案，也只做最小可用的质量检查能力，不做深度评估
2. **不修改 LLM Proxy 核心架构**——Judge 复用现有 LLM Proxy 抽象，不引入新的 LLM 调用路径
3. **不新增 AI 模型评估或模型选型**——使用现有 LLM 配置，不为 Judge 单独引入新模型
4. **不为 Judge 设计离线评估能力**——v0.1 不考虑本地小模型或离线规则引擎
5. **不修改 QualityPanel 的布局或视觉设计**——仅处置功能可用性，不做 UI 重设计

---

## 依赖与影响

- **上游依赖**: 无直接代码前置；但决策需考虑 LLM Proxy 配置体系的就绪度
- **被依赖于**: A0-06（发布事实表）——Judge 能力分级引用
- **协调关系**: A0-15（占位 UI 收口）——如选择隐藏 QualityPanel，需与占位 UI 策略一致
