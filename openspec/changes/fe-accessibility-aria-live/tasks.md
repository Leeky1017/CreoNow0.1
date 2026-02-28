## 1. Specification

更新时间：2026-02-28 19:20

- [ ] 1.1 审阅并确认需求边界：为关键动态更新区域补齐 `aria-live` 语义。`polite` 用于非紧急更新（搜索结果、保存状态、AI 流式输出），`assertive` 仅用于错误/关键失败。不改功能逻辑。
- [ ] 1.2 审阅并确认错误路径与边界路径：assertive 仅用于错误/关键失败提示，避免过度播报干扰用户。
- [ ] 1.3 审阅并确认验收阈值与不可变契约：AI 流式输出、搜索结果列表、自动保存状态、Toast 必须可被屏幕阅读器感知。
- [ ] 1.4 依赖同步检查（Dependency Sync Check）：N/A

### 1.5 预期实现触点

- 已有 aria 语义（无需改动）：
  - ErrorState.tsx（4 处 `role="alert"`）、StatusBar.tsx（`role="status"`）、Spinner.tsx（`role="status"`）
- 需补齐的区域：
  - `features/ai/AiPanel.tsx`：流式输出容器 → 添加 `aria-live="polite"` + `aria-atomic="false"`
  - `features/ai/ChatHistory.tsx`：新消息区域 → `aria-live="polite"`
  - `features/search/SearchPanel.tsx`：搜索结果列表容器 → `aria-live="polite"`
  - `components/layout/SaveIndicator.tsx`：保存状态文本 → `aria-live="polite"`（已有 `useTranslation` 但无 aria-live）
  - `components/primitives/Toast.tsx`：Toast 容器 → `aria-live="assertive"`（错误 toast）/ `aria-live="polite"`（信息 toast）
    - 需根据 Toast variant 区分 polite/assertive

**为什么是这些触点**：AI 流式输出、搜索结果、保存状态、Toast 是四大动态更新场景，当前均缺失 aria-live。

## 2. TDD Mapping（先测前提）

- [ ] 2.1 将 delta spec 的每个 Scenario 映射为至少一个测试用例
- [ ] 2.2 为每个测试标注对应 Scenario ID，建立可追踪关系
- [ ] 2.3 设定门禁：未出现 Red（失败测试）不得进入实现

### Scenario → 测试映射

| Scenario ID | 测试文件（计划） | 测试名称（计划） | 断言要点 | Mock/依赖 | 运行命令 |
| ----------- | ---------------- | ---------------- | -------- | --------- | -------- |
| `WB-FE-ARIA-S1` | `apps/desktop/renderer/src/features/ai/AiPanel.aria-live.test.tsx` | `it('marks streaming output container as aria-live polite')` | 渲染 AiPanel，断言流式输出容器有 `aria-live="polite"` | mock AI store | `pnpm -C apps/desktop test:run features/ai/AiPanel.aria-live` |
| `WB-FE-ARIA-S2` | `apps/desktop/renderer/src/features/search/SearchPanel.aria-live.test.tsx` | `it('marks search results list as aria-live polite')` | 渲染 SearchPanel，断言结果列表容器有 `aria-live="polite"` | mock search store | `pnpm -C apps/desktop test:run features/search/SearchPanel.aria-live` |
| `WB-FE-ARIA-S3` | `apps/desktop/renderer/src/components/primitives/Toast.aria-live.test.tsx` | `it('uses assertive for error toast and polite for info toast')` | 渲染 error Toast 断言 `aria-live="assertive"`；渲染 info Toast 断言 `aria-live="polite"` | 无 | `pnpm -C apps/desktop test:run components/primitives/Toast.aria-live` |
| `WB-FE-ARIA-S4` | `apps/desktop/renderer/src/components/layout/SaveIndicator.aria-live.test.tsx` | `it('marks save status as aria-live polite')` | 渲染 SaveIndicator，断言状态文本有 `aria-live="polite"` | mock save state | `pnpm -C apps/desktop test:run components/layout/SaveIndicator.aria-live` |

### 可复用测试范本

- ErrorState 测试：`apps/desktop/renderer/src/components/patterns/ErrorState.test.tsx`

## 3. Red（先写失败测试）

- [ ] 3.1 `WB-FE-ARIA-S1`：渲染 AiPanel（mock AI store），查找流式输出容器，断言 `aria-live="polite"`。
  - 期望红灯原因：当前 AiPanel 流式输出容器无 aria-live 属性。
- [ ] 3.2 `WB-FE-ARIA-S2`：渲染 SearchPanel（mock search store），查找结果列表容器，断言 `aria-live="polite"`。
  - 期望红灯原因：当前 SearchPanel 结果列表无 aria-live。
- [ ] 3.3 `WB-FE-ARIA-S3`：渲染 error Toast，断言 `aria-live="assertive"`；渲染 info Toast，断言 `aria-live="polite"`。
  - 期望红灯原因：当前 Toast 无 aria-live 属性。
- [ ] 3.4 `WB-FE-ARIA-S4`：渲染 SaveIndicator，断言状态文本有 `aria-live="polite"`。
  - 期望红灯原因：当前 SaveIndicator 无 aria-live。
- 运行：`pnpm -C apps/desktop test:run AiPanel.aria-live` / `SearchPanel.aria-live` / `Toast.aria-live` / `SaveIndicator.aria-live`

## 4. Green（最小实现通过）

- [ ] 4.1 `AiPanel.tsx`：流式输出容器添加 `aria-live="polite" aria-atomic="false"` → S1 转绿
- [ ] 4.2 `SearchPanel.tsx`：结果列表容器添加 `aria-live="polite"` → S2 转绿
- [ ] 4.3 `Toast.tsx`：根据 variant 添加 `aria-live="assertive"`（error）/ `aria-live="polite"`（其余） → S3 转绿
- [ ] 4.4 `SaveIndicator.tsx`：状态文本添加 `aria-live="polite"` → S4 转绿

## 5. Refactor（保持绿灯）

- [ ] 5.1 确认 AI 流式输出的 `aria-atomic="false"` 不会导致逐字播报（应播报新增段落）
- [ ] 5.2 评估是否需要 `aria-relevant="additions text"` 精细控制播报内容

## 6. Evidence

- [ ] 6.1 记录 RUN_LOG：Red 阶段测试失败的输出
- [ ] 6.2 记录 RUN_LOG：Green 阶段全部通过的输出
- [ ] 6.3 记录 RUN_LOG：`pnpm -C apps/desktop test:run` 全量回归无新增失败
- [ ] 6.4 记录 Dependency Sync Check（N/A）
- [ ] 6.5 Main Session Audit（仅在 Apply 阶段需要）
