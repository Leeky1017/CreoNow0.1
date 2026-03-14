# A0-18 Judge 能力决策文档

- **GitHub Issue**: #997
- **分支**: `task/997-a0-18-judge-capability-resolution`
- **日期**: 2026-03-08
- **状态**: 待 Owner 审批

---

## 一、必答问题核查（Q1-Q8）

### Q1: QualityPanel 质量检查按钮是否已渲染？绑定了什么事件？

**结论**: 已渲染，且已接入真实 IPC 数据。

**证据**:

- `apps/desktop/renderer/src/features/rightpanel/QualityPanel.tsx` 中 `QualityPanel` 组件已完整实现，包含：
  - **Judge 模型状态区域** (`JudgeStatusSection`)：显示模型就绪状态 + "初始化/重试" 按钮
  - **约束条件展示区域** (`ConstraintsSection`)：显示项目约束数量
  - **质量门禁面板** (`QualityGatesPanelContent`)：展示检查分组和结果
- 按钮事件绑定：
  - "Run All Checks" → `handleRunAllChecks()` → 调用 `invoke("judge:model:getstate")` + `invoke("constraints:policy:get")`
  - "初始化/重试" → `handleEnsure()` → 调用 `useJudgeEnsure().ensure()` → `invoke("judge:model:ensure")`
- 面板在 `surfaceRegistry.ts` 中注册为 `qualityGatesPanel`，通过右侧面板 icon bar 中的 Quality 标签页入口可见

### Q2: 质量检查的 IPC 调用链路是什么？

**结论**: 三条 IPC 通道，链路完整。

**证据**:

IPC 合约定义于 `apps/desktop/main/src/ipc/contract/ipc-contract.ts`（L2047-L2065）：

| IPC 通道                 | 方向            | 用途                    |
| ------------------------ | --------------- | ----------------------- |
| `judge:model:getstate`   | Renderer → Main | 获取 Judge 模型当前状态 |
| `judge:model:ensure`     | Renderer → Main | 触发模型初始化/下载     |
| `judge:quality:evaluate` | Renderer → Main | 评估文本质量            |

额外推送通道 `judge:quality:result`（`JUDGE_RESULT_CHANNEL`）用于 Main → Renderer 推送评估结果，在 preload (`aiStreamBridge.ts`) 中通过 `CustomEvent` 桥接。

调用链路：

```
QualityPanel.tsx
  → useJudgeEnsure() hook → invoke("judge:model:ensure")
  → invoke("judge:model:getstate")
  → (QualityGatesPanelContent 内) invoke("judge:quality:evaluate")
    ↓
preload/aiStreamBridge.ts (IPC 桥接 + 运行时校验)
    ↓
main/src/ipc/judge.ts → registerJudgeIpcHandlers()
  → judgeService.getState() / judgeService.ensure()
  → judgeQualityService.evaluate()
    ↓
main/src/services/judge/judgeService.ts (状态机)
main/src/services/ai/judgeQualityService.ts (质量评估引擎)
```

### Q3: `JudgeService.ensure()` 为什么返回 `MODEL_NOT_READY`？

**结论**: 非 E2E 环境下，`ensure()` **硬编码返回 `MODEL_NOT_READY`**——因为实际模型下载/加载管线尚未实现。

**证据** (`apps/desktop/main/src/services/judge/judgeService.ts` L103-112):

```typescript
async function runEnsure(timeoutMs: number): Promise<ServiceResult<true>> {
  if (!deps.isE2E) {
    return ipcError(
      "MODEL_NOT_READY",
      "Judge model ensure is not implemented (non-E2E build)",
    );
  }
  // E2E 模式下仅 sleep 25ms 模拟成功
  return await withTimeout(async () => {
    await sleep(25);
    return true as const;
  }, timeoutMs);
}
```

- `createJudgeService()` 通过 `process.env.CREONOW_E2E === "1"` 判断 isE2E
- **生产环境中 `isE2E = false`，因此 `ensure()` 必定返回错误**
- 这是一个有意的桩实现（stub）——原始注释明确写道 "Judge model ensure is not implemented (non-E2E build)"
- 没有真实的模型下载或 LLM 调用逻辑存在

### Q4: LLM Proxy 配置链路当前就绪状态如何？

**结论**: LLM Proxy 调用链路**已基本就绪**，但 Judge 未接入这条链路。

**证据**:

1. **Provider 解析链路存在** (`apps/desktop/main/src/services/ai/providerResolver.ts`)：
   - 支持三种 provider mode：`openai-compatible`、`openai-byok`、`anthropic-byok`
   - 支持通过环境变量 (`CREONOW_AI_PROVIDER`、`CREONOW_AI_API_KEY`) 或 UI 设置配置
   - 支持 `safeStorage` 加密存储 API Key（`index.ts` L337-340）

2. **AI Service 已有完整 LLM 调用能力** (`apps/desktop/main/src/services/ai/aiService.ts`)：
   - `buildLLMMessages()` 构造消息
   - `providerResolver` 解析 provider + credentials
   - SSE 流式响应解析已实现
   - E2E 环境下有 `fakeAiServer.ts` 本地模拟

3. **Judge 与 LLM Proxy 完全未打通**：
   - `createJudgeQualityService()` 接受一个可选的 `runAdvancedChecks` 回调
   - 在 `index.ts` L266-268 的实际初始化中，**未传入 `runAdvancedChecks`**
   - 因此 `runAdvancedChecks` 默认为 `async () => []`（空数组，不执行任何 LLM 调用）

### Q5: 若接入 LLM，Judge 需要什么 prompt？当前是否已定义？

**结论**: **无任何 prompt template 定义**。

**证据**:

- 全仓搜索 `judge.*prompt`、`quality.*prompt`、`评审.*prompt` 均无命中
- `judgeQualityService.ts` 中仅有两个硬编码规则函数（`detectPerspectiveMismatch`、`detectRepetition`），无 LLM 调用
- Spec（`openspec/specs/ai-service/spec.md` L177-186）定义了 5 个校验维度，其中"约束一致性"、"角色一致性"、"风格一致性"、"叙事连贯性" 四个维度需要 LLM 语义理解能力
- 若接入 LLM，需为上述四个维度各设计 prompt template

### Q6: QualityPanel 中除质量检查外，还有哪些功能？

**结论**: QualityPanel 包含**三个功能模块**，其中 Judge 模型状态和约束展示可独立使用。

**证据** (`apps/desktop/renderer/src/features/rightpanel/QualityPanel.tsx`)：

| 模块                     | 功能                                 | 是否依赖 Judge 模型                                           |
| ------------------------ | ------------------------------------ | ------------------------------------------------------------- |
| JudgeStatusSection       | 显示 Judge 模型就绪状态 + 初始化按钮 | 是——直接调用 `judge:model:getstate` / `ensure`                |
| ConstraintsSection       | 显示项目约束条件数量和预览           | 否——独立调用 `constraints:policy:get`                         |
| QualityGatesPanelContent | 展示检查分组 + 结果 + 设置           | 部分——通过 `buildCheckGroups()` 聚合 judge + constraints 数据 |

- ConstraintsSection **完全独立**：不依赖 Judge 模型，仅展示 constraints 数据
- QualityGatesPanelContent 是纯展示组件，接受 props 驱动，可在不同数据源下复用
- 设置面板中的 `JudgeSection`（`apps/desktop/renderer/src/features/settings/JudgeSection.tsx`） 也独立存在，用于 Settings 页面

### Q7: ai-service spec 中是否定义了 Judge 的行为规范？

**结论**: **Spec 已有明确定义**，且定义了 LLM + 规则引擎双轨策略。

**证据** (`openspec/specs/ai-service/spec.md` L173-222)：

- **明确要求**："系统**必须**实现 Judge 模块，对 AI 生成的内容进行质量校验"
- **5 个校验维度**：约束一致性（高）、角色一致性（高）、风格一致性（中）、叙事连贯性（中）、重复检测（低）
- **执行时机**：每次 AI 生成完成后自动执行（异步不阻塞）
- **关键设计约束**：
  > Judge**可以**调用 LLM 实现高级判定（如角色一致性分析），但**必须**使用独立的低延迟模型或规则引擎实现基础校验（如重复检测）。
- **降级 Scenario**：明确定义了 "Judge 服务不可用时的降级"——高级判定跳过，基础校验用规则引擎继续
- **IPC 通道**：`judge:evaluate` + `judge:result`

**关键洞察**：Spec 本身就预设了"LLM 不可用"的降级路径，未要求 LLM 必须在 v0.1 就绪。

### Q8: 降级为"基础规则检查"需要哪些规则？可否不依赖 LLM 实现？

**结论**: **已部分实现**。当前规则引擎有 2 条规则，可在不依赖 LLM 的情况下扩展。

**证据** (`apps/desktop/main/src/services/ai/judgeQualityService.ts`)：

**已实现的规则**：
| 规则 | 函数 | 逻辑 |
|------|------|------|
| 叙述视角不一致 | `detectPerspectiveMismatch()` | 当 contextSummary 包含"第一人称"时，检测 text 是否出现第三人称代词（他/她/他们/她们） |
| 重复片段检测 | `detectRepetition()` | 句子级重复（≥2 次相同句子）+ 窗口级重复（4-12 字连续重复） |

**可扩展的规则（不依赖 LLM）**：
| 规则 | 复杂度 | 说明 |
|------|--------|------|
| 字数统计 | S | 段落/章节/全文字数与目标对比 |
| 段落长度 | S | 段落过长/过短检测 |
| 空段落检测 | S | 连续空行/空段落 |
| 标点规范 | S | 中英文标点混用、标点重复 |
| 对话格式 | M | 引号配对检测、对话标识一致性 |
| 时间线一致性 | L | 基于关键词的时序矛盾检测（有限效果，需 LLM 做高精度） |

**规则引擎实现复杂度**：扩展现有 `createJudgeQualityService` 的 `runAdvancedChecks` 接口，添加纯规则检查函数，复杂度为 **M**。

**已有测试覆盖**：

- `judge-pass-state.test.ts`：验证无违规时返回通过
- `judge-fallback-partial-check.test.ts`：验证 advancedChecks 失败时仍返回 baseline 结果 + `partialChecksSkipped: true`

---

## 二、三方案对比

### 方案 A：v0.1 接入远程 LLM，让 Judge 全功能可用

| 维度                | 评估                                                                                                                                                                                                                                                                                                                                               |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **用户影响**        | 用户获得 AI 级别质量反馈能力——产品核心差异化。但依赖用户已配置 API Key，未配置时仍不可用。                                                                                                                                                                                                                                                         |
| **实现成本**        | **高 (L-XL)**：① 需将 `providerResolver` 链路接入 `judgeQualityService` 的 `runAdvancedChecks` ② 需为 4 个 LLM 维度（约束一致性、角色一致性、风格一致性、叙事连贯性）设计并调试 prompt template ③ 需处理 LLM 调用超时/失败的完整降级逻辑 ④ 需修改 `createJudgeService` 去掉 stub 逻辑，接入真实 provider ⑤ 需对 LLM 返回的非结构化结果做解析和校验 |
| **风险**            | ① LLM 调用延迟高（2-10 秒），影响用户体验 ② prompt 质量直接影响 Judge 准确率，需大量调试 ③ 依赖用户配置 API Key——未配置时 Judge 仍显示不可用状态 ④ Token 消耗成本由用户承担                                                                                                                                                                        |
| **可逆性**          | 中——已实现的 Judge LLM 逻辑需长期维护                                                                                                                                                                                                                                                                                                              |
| **对 A0-06 的影响** | 事实表标记为 "⚠️ 需要 LLM 配置"，注明 "用户未配置 API Key 时不可用"                                                                                                                                                                                                                                                                                |

### 方案 B：v0.1 降级为"基础规则检查"（不依赖 LLM）

| 维度                | 评估                                                                                                                                                                                                                                                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **用户影响**        | 用户获得基础质量反馈（视角一致性、重复检测、字数统计等），虽非 AI 级别但即开即用、零配置。                                                                                                                                                                                                                               |
| **实现成本**        | **低-中 (S-M)**：① 扩展现有 `judgeQualityService` 已有的规则函数即可 ② `runAdvancedChecks` 接口已预留 ③ **修改 `createJudgeService` 的 `runEnsure()` 使非 E2E 环境也返回 `ready`**（因为规则引擎不需要模型下载） ④ UI 无需大改——`QualityPanel` 已能展示 check 结果 ⑤ 需更新 UI 文案，将 "Judge 模型" 改为 "质量检查引擎" |
| **风险**            | ① 用户可能期望 "AI 评审" 但获得 "规则检查"——名实不符 ② 规则引擎精度有限，无法处理语义级问题                                                                                                                                                                                                                              |
| **可逆性**          | **高**——规则引擎可在后续版本被 LLM Judge 替代或增强，现有 `runAdvancedChecks` 接口天然支持渐进增强                                                                                                                                                                                                                       |
| **对 A0-06 的影响** | 事实表标记为 "⚠️ 基础规则检查"，注明 "非 AI 评估，提供字数/视角/重复等检测"                                                                                                                                                                                                                                              |

### 方案 C：v0.1 隐藏 Quality 入口

| 维度                | 评估                                                                                                                                                                                                                                            |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **用户影响**        | 用户不再看到无法兑现的质量检查承诺。但同时丢失 ConstraintsSection（约束展示）这一已可用功能。                                                                                                                                                   |
| **实现成本**        | **极低 (XS)**：在 `surfaceRegistry.ts` 中移除 `qualityGatesPanel` 注册，或在 `openSurface.ts` 中移除 `qualityGatesPanel` 映射，同时移除 Settings 中的 `JudgeSection`                                                                            |
| **风险**            | ① "创作者的 Cursor" 没有任何质量反馈——核心差异化能力缺席 ② 已实现的 QualityPanel、QualityGatesPanel、JudgeSection、Judge IPC、JudgeService、JudgeQualityService 全部沦为死代码 ③ 约束展示（ConstraintsSection）是独立可用功能，一并隐藏造成浪费 |
| **可逆性**          | 高——后续版本可随时恢复入口                                                                                                                                                                                                                      |
| **对 A0-06 的影响** | 事实表标记为 "❌ v0.1 未提供"                                                                                                                                                                                                                   |

---

## 三、推荐方案

### 推荐：方案 B — 降级为基础规则检查

**推荐理由**：

1. **Spec 已预设降级路径**（Q7）：`ai-service/spec.md` 明确规定 "Judge**必须**使用规则引擎实现基础校验"，降级方案**完全符合 spec 要求**，不存在名实不符的问题

2. **已有实现基础**（Q8）：`judgeQualityService.ts` 已有 `detectPerspectiveMismatch` 和 `detectRepetition` 两条规则 + `runAdvancedChecks` 扩展接口，只需扩展规则集 + 修改 `judgeService` 的 stub 逻辑

3. **即开即用，零配置**：不依赖用户配置 API Key，解决方案 A 中 "未配置时仍不可用" 的根本问题

4. **渐进增强设计**：`runAdvancedChecks` 接口天然支持后续接入 LLM，现在做的规则引擎工作在接入 LLM 后不会浪费——仍作为 LLM 不可用时的 fallback

5. **成本最优**：不需要编写和调试 prompt template（Q5 确认当前完全没有），不需要处理 LLM 调用超时逻辑，UI 层只需改文案

6. **保留 ConstraintsSection**（Q6）：约束展示功能完全独立可用，方案 B 保留了整个 QualityPanel

7. **与 A0-15 策略一致**（自检 4）：A0-15 处理的是 "纯占位无功能" 的 UI，方案 B 让 QualityPanel 变为 "有实际功能"，从隐藏候选名单中移除——策略一致

### 方案 A 不推荐的原因：

- 需要 **从零设计 4 组 prompt template**（Q5），工作量大且调试成本高
- 即使实现，未配置 API Key 的用户仍面临 `MODEL_NOT_READY` 的同样困境（Q3）
- Phase 0 目标是 "能力诚实分级与假功能处置"，而非 "全功能上线"

### 方案 C 不推荐的原因：

- 浪费已实现的完整架构（Q2 确认链路完整）和规则引擎（Q8 确认已有实现）
- ConstraintsSection 是独立可用功能（Q6），一并隐藏造成浪费
- "创作者的 Cursor" 应至少提供基础质量反馈

### 后续执行建议（若 Owner 采纳方案 B）：

1. 修改 `judgeService.ts` 的 `runEnsure()`：非 E2E 环境直接返回 `{ status: "ready" }`（因为规则引擎不依赖模型下载）
2. 在 `index.ts` 初始化 `createJudgeQualityService` 时传入包含扩展规则的 `runAdvancedChecks`
3. 更新 UI 文案：将 "Judge 模型" 改为 "质量检查"，将 Settings `JudgeSection` 改为 "质量检查配置"
4. 在 A0-06 事实表中如实标注："基础规则检查——提供视角一致性、重复检测等基础质量反馈，不依赖 LLM"

**最终决策权在 Owner。**

---

## 四、决策门槛自检

| 自检项 | 检查内容                                                                                      | 状态 |
| ------ | --------------------------------------------------------------------------------------------- | ---- |
| 自检 1 | Q1-Q8 全部已回答，无未闭项                                                                    | ✅   |
| 自检 2 | 三方案对比已完成，每方案五维度已填写                                                          | ✅   |
| 自检 3 | LLM Proxy 就绪度已明确回答——"LLM Proxy 调用链路已基本就绪，但 Judge 未接入该链路"             | ✅   |
| 自检 4 | 与 A0-15 占位 UI 策略一致性已确认——方案 B 使 QualityPanel 有实际功能，与 A0-15 隐藏策略不冲突 | ✅   |
| 自检 5 | 决策结论可被后续执行任务直接消费                                                              | ✅   |

---

## 五、验收标准对照

| AC   | 内容                                             | 状态 |
| ---- | ------------------------------------------------ | ---- |
| AC-1 | Q1-Q8 全部已回答，附代码证据                     | ✅   |
| AC-2 | 无 "待确认" 或 "需进一步调查" 项                 | ✅   |
| AC-3 | 三方案全部列出                                   | ✅   |
| AC-4 | 每方案五维度评估                                 | ✅   |
| AC-5 | 推荐方案 B + 理由                                | ✅   |
| AC-6 | LLM Proxy 就绪度已明确确认                       | ✅   |
| AC-7 | 决策门槛五项全绿                                 | ✅   |
| AC-8 | 产出物可被后续执行任务消费（后续执行建议已列出） | ✅   |
