## 1. Specification

更新时间：2026-03-01 16:45

- [x] 1.1 审阅并确认需求边界：为 AI 面板错误卡片增加分流引导（DB_ERROR → rebuild 步骤，AI_NOT_CONFIGURED → Settings 跳转），移除内联 `<style>` 标签，降噪边框。不修复 native binding 打包问题本体。
- [x] 1.2 审阅并确认错误路径与边界路径：DB_ERROR 展示命令与重启提示；AI_NOT_CONFIGURED 引导跳转 Settings → AI；未知错误降级为通用错误卡片。
- [x] 1.3 审阅并确认验收阈值与不可变契约：错误卡片必须可操作（有明确下一步）；禁止内联 `<style>` 标签残留。
- [x] 1.4 依赖同步检查（Dependency Sync Check）：`fe-rightpanel-ai-tabbar-layout` 已归档（`openspec/changes/EXECUTION_ORDER.md` 标注 PR #801），无依赖漂移。

### 1.5 预期实现触点

- `apps/desktop/renderer/src/features/ai/AiPanel.tsx`：
  - L1038/1079：`DB_ERROR` 错误处理 → 新增引导卡片（展示 rebuild 命令 + 重启提示）
  - L1056：`AI_NOT_CONFIGURED` → 新增引导卡片（跳转 Settings → AI 配置 Provider）
  - L1587-1620：内联 `<style>` + `@keyframes blink` → 迁移到 `main.css` 或 `tokens.css`
  - header/content/footer 多层 border → 降噪（与 `fe-visual-noise-reduction` 协同）
- `apps/desktop/renderer/src/styles/main.css`：
  - 新增 `@keyframes blink`（从 AiPanel 内联迁移）
- 新增引导卡片组件（可内联或抽取）：
  - `ErrorGuideCard`：左侧色条 + 背景 + 标题 + 步骤 + 操作按钮

**为什么是这些触点**：AiPanel 是错误展示和内联 style 的唯一位置，main.css 是 keyframes 的正确归属。

## 2. TDD Mapping（先测前提）

- [x] 2.1 将 delta spec 的每个 Scenario 映射为至少一个测试用例
- [x] 2.2 为每个测试标注对应 Scenario ID，建立可追踪关系
- [x] 2.3 设定门禁：未出现 Red（失败测试）不得进入实现

### Scenario → 测试映射

| Scenario ID | 测试文件（计划） | 测试名称（计划） | 断言要点 | Mock/依赖 | 运行命令 |
| ----------- | ---------------- | ---------------- | -------- | --------- | -------- |
| `AI-FE-GUIDE-S1` | `apps/desktop/renderer/src/features/ai/AiPanel.error-guide.test.tsx` | `it('renders rebuild guide for DB_ERROR')` | mock error code=DB_ERROR，断言引导卡片含 rebuild 命令文本 | mock AI store | `pnpm -C apps/desktop test:run features/ai/AiPanel.error-guide` |
| `AI-FE-GUIDE-S1b` | 同上 | `it('renders rebuild guide when skillsLastError is DB_ERROR')` | mock `skillsLastError.code=DB_ERROR`，断言引导卡片与命令渲染 | mock AI store | 同上 |
| `AI-FE-GUIDE-S2` | 同上 | `it('renders provider config guide for AI_NOT_CONFIGURED')` | mock error code=AI_NOT_CONFIGURED，断言引导卡片含 Settings 跳转按钮 | mock AI store | 同上 |
| `AI-FE-GUIDE-S2b` | 同上 | `it('renders generic error for unknown codes')` | mock 未知 error code，断言通用错误卡片 | mock AI store | 同上 |
| `AI-FE-GUIDE-S2c` | 同上 | `it('keeps UPSTREAM_ERROR on generic error card')` | mock error code=UPSTREAM_ERROR，断言不走 Provider 引导 | mock AI store | 同上 |
| `WB-FE-STYLE-S1` | `apps/desktop/renderer/src/features/ai/AiPanel.styles.guard.test.ts` | `it('AiPanel has no inline style tag')` | 读取 AiPanel.tsx 源码，断言不含 `<style>` 标签 | `fs.readFileSync` | `pnpm -C apps/desktop test:run features/ai/AiPanel.styles.guard` |

### 可复用测试范本

- AiPanel 测试：`apps/desktop/renderer/src/features/ai/AiPanel.test.tsx`

## 3. Red（先写失败测试）

- [x] 3.1 `AI-FE-GUIDE-S1`：mock DB_ERROR，断言引导卡片含 rebuild 命令。
  - 期望红灯原因：当前 DB_ERROR 仅显示通用错误卡片，无引导步骤。
- [x] 3.2 `AI-FE-GUIDE-S2`：mock AI_NOT_CONFIGURED，断言引导卡片含 Settings 跳转。
  - 期望红灯原因：当前无分流引导。
- [x] 3.3 `WB-FE-STYLE-S1`：读取 AiPanel.tsx，断言不含 `<style>`。
  - 期望红灯原因：当前 L1587 有内联 `<style>` 标签。
- 运行：`pnpm -C apps/desktop test:run features/ai/AiPanel.error-guide` / `AiPanel.styles.guard`

## 4. Green（最小实现通过）

- [x] 4.1 AiPanel：DB_ERROR 分支渲染引导卡片（rebuild 命令 + 重启提示） → S1 转绿
- [x] 4.2 AiPanel：AI_NOT_CONFIGURED 分支渲染引导卡片（Settings → AI 跳转按钮），UPSTREAM_ERROR 保持通用错误卡片 → S2 / S2c 转绿
- [x] 4.3 AiPanel L1587-1620：删除内联 `<style>`，`@keyframes blink` 迁移到 main.css（含 reduced-motion） → S（STYLE）转绿

## 5. Refactor（保持绿灯）

- [x] 5.1 在 `AiPanel` 内抽取局部复用的 `ErrorGuideCard`（统一 DB/Provider 两类引导 UI）
- [x] 5.2 降噪：减少 header/content/footer 多层 border（本次仅完成引导与样式注入治理，降噪在后续 `fe-visual-noise-reduction`，跟踪 Issue #810 收口）

## 6. Evidence

- [x] 6.1 记录 RUN_LOG：Red 阶段测试失败的输出（含前态基线与快照失败证据）
- [x] 6.2 记录 RUN_LOG：Green 阶段全部通过的输出
- [x] 6.3 记录 RUN_LOG：`pnpm -C apps/desktop test:run` 全量回归无新增失败
- [x] 6.4 记录 Dependency Sync Check：确认 `fe-rightpanel-ai-tabbar-layout` 状态
- [x] 6.5 Main Session Audit（仅在 Apply 阶段需要）
