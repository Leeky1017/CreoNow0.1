## 1. Specification

更新时间：2026-03-04 03:30

- [x] 1.1 审阅并确认需求边界：将 `prefers-reduced-motion` 从"个别组件记得做"提升为"系统级默认"。所有自定义动画/过渡在 reduced motion 下必须被禁用或压缩为 0ms。不改变业务功能。
- [x] 1.2 审阅并确认错误路径与边界路径：reduced motion 未启用时行为不变。
- [x] 1.3 审阅并确认验收阈值与不可变契约：Feature 层 46 处 `transition-all`/`animate-*` 以及 2 处内联 `@keyframes`（SearchPanel/AiPanel）必须受 reduced motion 控制。
- [x] 1.4 依赖同步检查（Dependency Sync Check）：N/A

### 1.5 预期实现触点

- `apps/desktop/renderer/src/styles/main.css`
  - 新增全局 `@media (prefers-reduced-motion: reduce)` 规则：将 `animation-duration`、`transition-duration` 强制为 `0.01ms`（或 `0ms`），覆盖所有 `@keyframes`（L193-263：progress-indeterminate/shimmer/accordion-down/accordion-up/cursor-blink/fade-in-up）
- `apps/desktop/renderer/src/styles/tokens.css`
  - 新增 motion Token：`--duration-fast`、`--duration-normal`、`--duration-slow`，在 reduced motion 下全部为 `0ms`
- `apps/desktop/renderer/src/features/search/SearchPanel.tsx`
  - L1072：内联 `@keyframes slideDown` → 需受 reduced motion 控制（或移到 main.css 统一管理）
- `apps/desktop/renderer/src/features/ai/AiPanel.tsx`
  - L1611：内联 `@keyframes blink` → 同上
- `apps/desktop/renderer/src/lib/motion/reducedMotion.ts`
  - 已有 `readPrefersReducedMotion()`/`resolveReducedMotionDuration()` 等工具，但仅 EditorBubbleMenu 使用。本 change 不需要改此文件，而是通过 CSS 全局规则覆盖。
- Feature 层 46 处 `transition-all`：
  - 全局 CSS 规则会自动覆盖 `transition-duration`，无需逐个改。但 `transition-all` 本身是性能反模式，可在 Refactor 阶段收敛为具体属性。

**为什么是这些触点**：CSS 全局 `@media` 规则是最小侵入方案——一处定义覆盖全部动画/过渡，无需逐个组件改。内联 `@keyframes` 需要单独处理因为它们不在全局 CSS 中。

## 2. TDD Mapping（先测前提）

- [x] 2.1 将 delta spec 的每个 Scenario 映射为至少一个测试用例
- [x] 2.2 为每个测试标注对应 Scenario ID，建立可追踪关系
- [x] 2.3 设定门禁：未出现 Red（失败测试）不得进入实现

### Scenario → 测试映射

| Scenario ID | 测试文件（计划） | 测试名称（计划） | 断言要点 | Mock/依赖 | 运行命令 |
| ----------- | ---------------- | ---------------- | -------- | --------- | -------- |
| `WB-FE-MOTION-S1` | `apps/desktop/renderer/src/styles/__tests__/reduced-motion-global.guard.test.ts` | `it('main.css contains @media (prefers-reduced-motion: reduce) rule')` | 读取 main.css 源码，断言包含 `@media (prefers-reduced-motion: reduce)` 且内含 `animation-duration` 和 `transition-duration` 覆盖 | `fs.readFileSync` | `pnpm -C apps/desktop test:run styles/__tests__/reduced-motion-global.guard` |
| `WB-FE-MOTION-S2` | 同上 | `it('tokens.css defines motion duration tokens with reduced-motion override')` | 读取 tokens.css，断言包含 `--duration-fast`/`--duration-normal`/`--duration-slow` 且在 reduced-motion 媒体查询下为 `0ms` | `fs.readFileSync` | 同上 |
| `WB-FE-MOTION-S3` | 同上 | `it('no inline @keyframes in feature files (must be in main.css)')` | 读取 SearchPanel.tsx，断言不含 `@keyframes`（AiPanel.tsx 已在先前 change 清理，无内联 @keyframes） | `fs.readFileSync` | 同上 |

### 可复用测试范本

- 源码 guard 范本：`apps/desktop/renderer/src/components/layout/__tests__/panel-orchestrator.test.tsx`
- Motion contract 范本：`apps/desktop/renderer/src/components/layout/workbench-motion.contract.test.ts`

## 3. Red（先写失败测试）

- [x] 3.1 `WB-FE-MOTION-S1`：读取 `main.css`，断言包含 `@media (prefers-reduced-motion: reduce)` 且覆盖 `animation-duration` 和 `transition-duration`。
  - 期望红灯原因：当前 main.css 无此媒体查询规则。
- [x] 3.2 `WB-FE-MOTION-S2`：读取 `tokens.css`，断言包含 `--duration-fast`/`--duration-normal`/`--duration-slow` 且在 reduced-motion 下为 `0ms`。
  - 期望红灯原因：当前 tokens.css 未定义 motion duration Token。
- [x] 3.3 `WB-FE-MOTION-S3`：读取 `SearchPanel.tsx`，断言不含 `@keyframes`（AiPanel.tsx 已在先前 change 清理内联 @keyframes，当前无需断言）。
  - 期望红灯原因：SearchPanel.tsx L821 有 `@keyframes slideDown`。
- 运行：`pnpm -C apps/desktop test:run styles/__tests__/reduced-motion-global.guard`

## 4. Green（最小实现通过）

- [x] 4.1 `main.css`：新增全局 reduced motion 规则：
  ```css
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
  ```
  → S1 转绿
- [x] 4.2 `tokens.css`：新增 motion Token 并在 reduced-motion 下覆盖为 `0ms`：
  ```css
  :root { --duration-fast: 150ms; --duration-normal: 250ms; --duration-slow: 400ms; }
  @media (prefers-reduced-motion: reduce) {
    :root { --duration-fast: 0ms; --duration-normal: 0ms; --duration-slow: 0ms; }
  }
  ```
  → S2 转绿
- [x] 4.3 `SearchPanel.tsx`：将 L1072 的 `@keyframes slideDown` 移到 `main.css` → S3 转绿
- [x] 4.4 `AiPanel.tsx`：已在先前 change 清理，无需改动：将 L1611 的 `@keyframes blink` 移到 `main.css` → S3 转绿

## 5. Refactor（保持绿灯）

- [x] 5.1 将 Feature 层 `transition-all` 逐步替换为具体属性（如 `transition-colors`/`transition-opacity`），减少不必要的 GPU 合成。此步可选，不阻塞本 change 交付。（由后续 `fe-token-escape-sweep` / PR #952 覆盖）
- [x] 5.2 将 `duration-300` 等硬编码 Tailwind duration 替换为 `duration-[var(--duration-normal)]`（可选，为后续 Token 化铺路）。（N/A：本 change 不阻塞，保留后续统一治理）

## 6. Evidence

- [x] 6.1 记录 RUN_LOG：Red 阶段 3 个 guard 测试全部失败的输出
- [x] 6.2 记录 RUN_LOG：Green 阶段 3 个测试全部通过的输出
- [x] 6.3 记录 RUN_LOG：`pnpm -C apps/desktop test:run` 全量回归无新增失败
- [x] 6.4 记录 Dependency Sync Check（N/A）
- [x] 6.5 Main Session Audit（仅在 Apply 阶段需要）
