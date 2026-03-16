# A0-18 Judge 能力决策文档

> **GitHub Issue**: #997
> **首次决策日期**: 2026-03-08
> **2026-03-16 校准说明**: 删除旧的 pending approval 状态，改为当前仓库已执行口径。
> **当前状态**: **已执行并归档**
> **最终决策**: **方案 B —— 基础规则检查优先，保留高级校验扩展位**

---

## 一、当前仓库事实

### 1. Judge readiness 已不再阻塞基础能力

`apps/desktop/main/src/services/judge/judgeService.ts` 中：

- 非 E2E 环境下 `runEnsure()` 直接返回成功
- 状态机会从 `not_ready` → `downloading` → `ready`
- 当前口径已从“基础能力长期处于 not-ready 错误”改为“规则引擎始终可就绪”

### 2. 基础规则检查已接线

`apps/desktop/main/src/services/ai/judgeQualityService.ts` 当前提供：

- `detectPerspectiveMismatch()`：第一人称上下文中的叙述视角不一致检测
- `detectRepetition()`：句子级 / 窗口级重复片段检测
- `runAdvancedChecks` 扩展位：高级检查失败时不会拖垮基础检查
- `partialChecksSkipped`：用于显式标记“高级校验被跳过”的降级状态

### 3. IPC 与前端入口已对齐

- `apps/desktop/main/src/ipc/judge.ts` 已注册：
  - `judge:model:getstate`
  - `judge:model:ensure`
  - `judge:quality:evaluate`
- `apps/desktop/renderer/src/features/rightpanel/QualityPanel.tsx`
  与 `apps/desktop/renderer/src/features/settings/JudgeSection.tsx`
  均已消费上述状态机与 IPC 响应。

### 4. 当前仍未完成的部分

高级语义检查仍未接入真正的 LLM / advanced runner；当前仓库的 Judge 更准确的描述是：

> **可用的基础规则检查 + 可观测的降级标记，而不是完整语义 Judge。**

---

## 二、为什么“方案 B”已被执行

相较于旧版文档中的旧审批态描述，当前仓库已经明确体现出方案 B 的落地特征：

1. **规则引擎优先可用**：不依赖模型下载即可 ready。
2. **高级能力可渐进增强**：`runAdvancedChecks` 与 `partialChecksSkipped` 已预留清晰扩展位。
3. **UI 与 IPC 已同向**：QualityPanel / JudgeSection 不再围绕一个永远失败的 `ensure()` 打转，而是能给出基础结果与降级说明。

因此，本归档决策的正确口径不再是“等待审批”，而是：

> **方案 B 已被执行；当前 v0.1 提供基础规则 Judge，高级语义 Judge 留待后续增强。**

---

## 三、需要从旧文档中删除的陈旧口径

以下内容已被当前仓库推翻：

- 任何把当前状态描述为“仍待审批”的措辞
- 任何把 Judge 基础能力描述为“永久 not-ready”的措辞
- 任何把当前能力描述为“只有空壳 UI、尚未进入执行态”的措辞

以下内容应保留为当前事实：

- 方案 B（基础规则检查）是最终走向
- 高级语义检查仍是后续增强项
- 降级会通过 `partialChecksSkipped` 被显式暴露，而不是静默吞掉

---

## 四、归档后的发布口径

### v0.1 可宣传的部分

- 基础质量检查可用
- 规则引擎可检测视角一致性与重复片段
- 前端可显示结构化结果与降级标记

### v0.1 不应夸大的部分

- 不能把当前 Judge 描述为“完整 LLM 语义评审”
- 不能省略 `partialChecksSkipped` 所代表的能力边界

---

## 五、2026-03-16 复核命令

```bash
rg -n "partialChecksSkipped|runAdvancedChecks|status: "ready"|judge:model:ensure" \
  openspec/changes/archive/a0-18-judge-capability-resolution/decision.md \
  apps/desktop/main/src/services/judge/judgeService.ts \
  apps/desktop/main/src/services/ai/judgeQualityService.ts \
  apps/desktop/main/src/ipc/judge.ts

rg -n "judge:model:getstate|judge:model:ensure|judge:quality:evaluate" \
  apps/desktop/renderer/src/features/rightpanel/QualityPanel.tsx \
  apps/desktop/renderer/src/features/settings/JudgeSection.tsx
```
