# Tasks: A0-18 Judge 决策：接入或降级

- **GitHub Issue**: #997
- **分支**: `task/997-judge-capability-resolution`
- **Delta Spec**: `specs/ai-service/spec.md`
- **前置依赖**: 无直接代码依赖

---

## 所属任务簇

P0-3: 能力诚实分级与假功能处置

---

## 验收标准

| ID   | 标准                                                                      | 对应 Scenario |
| ---- | ------------------------------------------------------------------------- | ------------- |
| AC-1 | Q1-Q8 必答问题全部已回答，每个答案附代码证据                              | S-JUDGE-Q     |
| AC-2 | 无"待确认"或"需进一步调查"等未闭项                                        | S-JUDGE-Q     |
| AC-3 | 三个方案（接入 LLM / 降级规则检查 / 隐藏入口）全部列出                    | S-JUDGE-CMP   |
| AC-4 | 每个方案包含五维度评估（用户影响、实现成本、风险、可逆性、对 A0-06 影响） | S-JUDGE-CMP   |
| AC-5 | 有基于事实的推荐方案及理由                                                | S-JUDGE-CMP   |
| AC-6 | LLM Proxy 就绪度已明确确认                                                | S-JUDGE-THR   |
| AC-7 | 决策门槛四项全部满足                                                      | S-JUDGE-THR   |
| AC-8 | 产出物决策结论可被后续执行任务直接消费                                    | S-JUDGE-THR   |

---

## Phase 1: 事实核查（Q1-Q8）

### Task 1.1: UI 层核查（Q1, Q6）

- [x] **Q1**: 搜索 QualityPanel 质量检查按钮的渲染逻辑，确认按钮是否已渲染、绑定了什么点击事件
  - 命令：`grep -rn "QualityPanel\|quality.*check\|质量检查" apps/desktop/renderer/src/`
- [x] **Q6**: 分析 QualityPanel 组件的完整功能列表——除质量检查外还有什么？哪些可独立使用？
  - 阅读 QualityPanel 组件代码，列出全部功能模块

**文件**: `apps/desktop/renderer/src/features/quality-gates/`

### Task 1.2: IPC 与 Service 层核查（Q2, Q3）

- [x] **Q2**: 追踪质量检查的 IPC 调用链路——从 QualityPanel 的点击事件 → IPC 通道 → JudgeService 方法
  - 命令：`grep -rn "judge" apps/desktop/main/src/ipc/`
  - 命令：`grep -rn "judge" apps/desktop/preload/`
- [x] **Q3**: 阅读 `JudgeService.ensure()` 方法的源码，确认返回 `MODEL_NOT_READY` 的条件逻辑
  - 命令：`grep -rn "ensure\|MODEL_NOT_READY" apps/desktop/main/src/services/ai/`

**文件**: `apps/desktop/main/src/ipc/judge.ts`、`apps/desktop/main/src/services/ai/`

### Task 1.3: LLM Proxy 就绪度核查（Q4, Q5）

- [x] **Q4**: 确认 LLM Proxy 配置链路——API Key 存储（`safeStorage`）、provider 选择、baseUrl 配置是否已可用
  - 命令：`grep -rn "safeStorage\|apiKey\|provider" apps/desktop/main/src/services/ai/`
  - 阅读 `ai-service/spec.md` 中 LLM Proxy 配置部分
- [x] **Q5**: 搜索 Judge 相关 prompt template——是否已定义 prompt、prompt 内容是什么
  - 命令：`grep -rn "judge.*prompt\|quality.*prompt" apps/desktop/main/src/`

### Task 1.4: Spec 核查与降级可行性（Q7, Q8）

- [x] **Q7**: 阅读 `openspec/specs/ai-service/spec.md`，搜索 Judge 行为定义
  - 命令：`grep -n "judge\|Judge\|质量" openspec/specs/ai-service/spec.md`
- [x] **Q8**: 评估"基础规则检查"降级方案的可行性
  - 列出可不依赖 LLM 实现的规则类型（字数统计、段落长度、标点检查、空段落检测等）
  - 评估规则引擎的实现复杂度（S/M/L/XL）

---

## Phase 2: 方案对比

### Task 2.1: 三方案五维度对比

**映射验收标准**: AC-3, AC-4

- [x] **方案 A（接入 LLM）**：
  - 基于 Q4 的 LLM Proxy 就绪度，量化需打通的链路环节
  - 基于 Q5 评估 prompt template 的编写工作量
  - 评估用户未配置 API Key 时的降级体验
- [x] **方案 B（降级规则检查）**：
  - 基于 Q8 的可行性评估，列出可实现的规则集
  - 评估 UI 展示的调整——将"AI 质量检查"改为"基础质量检查"的文案变更
  - 评估名实不符风险——spec 中定义的 Judge 是 AI 级别，降级为规则检查是否违反 spec
- [x] **方案 C（隐藏入口）**：
  - 基于 Q6 评估——若 QualityPanel 有其他独立功能，是仅隐藏质量检查按钮还是整个面板
  - 量化实施成本

### Task 2.2: 推荐方案与理由

**映射验收标准**: AC-5

- [x] 基于事实核查结论（Q1-Q8）和方案对比，给出推荐方案
- [x] 推荐理由引用具体 Q 编号和核查结论
- [x] 明确标注：最终决策权在 Owner

---

## Phase 3: 决策门槛自检

### Task 3.1: 决策门槛清单

**映射验收标准**: AC-6, AC-7, AC-8

- [x] 自检 1：Q1-Q8 全部已回答，无未闭项 ✓/✗
- [x] 自检 2：三方案对比已完成，每方案五维度已填写 ✓/✗
- [x] 自检 3：LLM Proxy 就绪度已明确回答——"当前能/不能支撑 Judge 调用" ✓/✗
- [x] 自检 4：与 A0-15 占位 UI 策略一致性已确认 ✓/✗
- [x] 自检 5：决策结论格式可被后续执行任务直接消费 ✓/✗

---

## 自查清单

| 条目            | 检查项             | 状态 |
| --------------- | ------------------ | ---- |
| AC-1 Q 全覆盖   | Q1-Q8 全部已回答   | [ ]  |
| AC-2 无未闭项   | 无"待确认"项       | [ ]  |
| AC-3 方案齐全   | 三方案全部列出     | [ ]  |
| AC-4 五维度完整 | 每方案五维度填写   | [ ]  |
| AC-5 有推荐     | 推荐方案附理由     | [ ]  |
| AC-6 LLM 就绪度 | 已明确确认         | [ ]  |
| AC-7 门槛全满足 | 四项门槛全绿       | [ ]  |
| AC-8 可消费     | 后续任务可直接行动 | [ ]  |

---

## TDD 规范引用

> 本任务为文档/决策类，不涉及代码实现。验收方式为输出物审查，而非自动化测试。
> 若决策结论导致后续实现任务，该实现任务必须遵循 `docs/references/testing/` 中的完整 TDD 规范。
