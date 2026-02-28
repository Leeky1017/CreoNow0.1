## 1. Specification

更新时间：2026-02-28 19:20

- [ ] 1.1 审阅并确认需求边界：将 AI 面板 History/NewChat 从 AiPanel header 迁移到 RightPanel tab bar 右侧动作区；移除 candidateCount（`1x`）工具按钮。不引入新业务能力。
- [ ] 1.2 审阅并确认错误路径与边界路径：activeRightPanel 非 ai 时动作区隐藏；candidateCount 持久化保留（默认 1），高级配置入口迁到 Settings。
- [ ] 1.3 审阅并确认验收阈值与不可变契约：按钮可点击、目标尺寸 >= 24px；候选数 UI 不再污染主面板。
- [ ] 1.4 依赖同步检查（Dependency Sync Check）：N/A

### 1.5 预期实现触点

- `apps/desktop/renderer/src/features/ai/AiPanel.tsx`：
  - L1097-1149：header 行（History/NewChat 按钮）→ 删除整个 header 行
  - L59/406：`candidateCount` state + `CANDIDATE_COUNT_STORAGE_KEY` → 移除 UI 按钮，保留 localStorage 持久化
  - L1005：`handleNewChat()` → 提升为 prop 或通过 store 暴露给 RightPanel
- `apps/desktop/renderer/src/components/layout/RightPanel.tsx`：
  - tab bar 右侧新增动作区：仅在 `activeRightPanel === "ai"` 时渲染 History + NewChat 按钮
  - 按钮尺寸 >= 24×24px
- `apps/desktop/renderer/src/features/settings-dialog/`（可选）：
  - AI 高级选项新增 candidateCount 配置

**为什么是这些触点**：AiPanel header 是当前 History/NewChat 的位置，RightPanel tab bar 是迁移目标。

## 2. TDD Mapping（先测前提）

- [ ] 2.1 将 delta spec 的每个 Scenario 映射为至少一个测试用例
- [ ] 2.2 为每个测试标注对应 Scenario ID，建立可追踪关系
- [ ] 2.3 设定门禁：未出现 Red（失败测试）不得进入实现

### Scenario → 测试映射

| Scenario ID | 测试文件（计划） | 测试名称（计划） | 断言要点 | Mock/依赖 | 运行命令 |
| ----------- | ---------------- | ---------------- | -------- | --------- | -------- |
| `WB-FE-AI-TAB-S1` | `apps/desktop/renderer/src/components/layout/RightPanel.ai-tabbar-actions.test.tsx` | `it('renders history and newchat actions when ai panel active')` | activeRightPanel="ai" 时断言 History/NewChat 按钮出现且尺寸 >= 24px | mock layoutStore | `pnpm -C apps/desktop test:run components/layout/RightPanel.ai-tabbar-actions` |
| `WB-FE-AI-TAB-S1b` | 同上 | `it('hides actions when non-ai panel active')` | activeRightPanel="info" 时断言无 History/NewChat 按钮 | mock layoutStore | 同上 |
| `WB-FE-AI-TAB-S2` | `apps/desktop/renderer/src/features/ai/AiPanel.layout.test.tsx` | `it('does not render separate ai header row')` | 渲染 AiPanel，断言无 header 行（无 `<header>` 元素） | mock AI store | `pnpm -C apps/desktop test:run features/ai/AiPanel.layout` |
| `WB-FE-AI-TAB-S3` | `apps/desktop/renderer/src/features/ai/AiPanel.layout.test.tsx` | `it('does not render candidateCount button in main panel')` | 断言无 `1x`/`2x` 等候选数按钮 | mock AI store | 同上 |

### 可复用测试范本

- RightPanel 测试：`apps/desktop/renderer/src/components/layout/RightPanel.test.tsx`

## 3. Red（先写失败测试）

- [ ] 3.1 `WB-FE-AI-TAB-S1`：activeRightPanel="ai"，断言 tab bar 有 History/NewChat 按钮。
  - 期望红灯原因：当前 RightPanel tab bar 无动作区。
- [ ] 3.2 `WB-FE-AI-TAB-S1b`：activeRightPanel="info"，断言无动作按钮。
  - 期望红灯原因：同上（无动作区逻辑）。
- [ ] 3.3 `WB-FE-AI-TAB-S2`：渲染 AiPanel，断言无 `<header>` 元素。
  - 期望红灯原因：当前 L1097 有 header 行。
- [ ] 3.4 `WB-FE-AI-TAB-S3`：断言无候选数按钮。
  - 期望红灯原因：当前 L406 有 candidateCount UI。
- 运行：`pnpm -C apps/desktop test:run RightPanel.ai-tabbar-actions` / `AiPanel.layout`

## 4. Green（最小实现通过）

- [ ] 4.1 `RightPanel.tsx`：tab bar 右侧新增条件动作区（ai 时 History + NewChat） → S1/S1b 转绿
- [ ] 4.2 `AiPanel.tsx`：删除 L1097-1149 header 行 → S2 转绿
- [ ] 4.3 `AiPanel.tsx`：移除 candidateCount UI 按钮（保留 localStorage 逻辑） → S3 转绿

## 5. Refactor（保持绿灯）

- [ ] 5.1 确认 History/NewChat handler 通过 store 或 props 正确传递到 RightPanel
- [ ] 5.2 确认 AI 面板消息流/技能执行等既有行为不变

## 6. Evidence

- [ ] 6.1 记录 RUN_LOG：Red 阶段测试失败的输出
- [ ] 6.2 记录 RUN_LOG：Green 阶段全部通过的输出
- [ ] 6.3 记录 RUN_LOG：`pnpm -C apps/desktop test:run` 全量回归无新增失败
- [ ] 6.4 记录 Dependency Sync Check（N/A）
- [ ] 6.5 Main Session Audit（仅在 Apply 阶段需要）
