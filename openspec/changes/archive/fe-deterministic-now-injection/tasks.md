## 1. Specification

更新时间：2026-03-04 03:30

- [x] 1.1 审阅并确认需求边界：将所有直接调用 `Date.now()` 的 UI helper 改为可注入 `now` 参数，使测试可控、行为可复现。不做时间库全量重构。
- [x] 1.2 审阅并确认错误路径与边界路径：`now` 未提供时默认 `Date.now()`（保持现有运行时行为不变）。
- [x] 1.3 审阅并确认验收阈值与不可变契约：所有时间相关测试必须使用注入 `now` 或 `vi.useFakeTimers()`，禁止裸调 `Date.now()`。
- [x] 1.4 依赖同步检查（Dependency Sync Check）：N/A

### 1.5 预期实现触点

- `apps/desktop/renderer/src/features/dashboard/DashboardPage.tsx`
  - `formatRelativeTime(timestamp)` (L308-321)：内部 `const now = Date.now()` → 改签名为 `formatRelativeTime(timestamp, now?: number)`
  - `formatDate(timestamp)` (L327)：无 `Date.now()` 依赖，不改
- `apps/desktop/renderer/src/features/projects/ProjectSwitcher.tsx`
  - `formatRelativeTime(updatedAt)` (L40-41)：内部 `Date.now() - updatedAt` → 改签名为 `formatRelativeTime(updatedAt, now?: number)`
- `apps/desktop/renderer/src/features/search/SearchPanel.tsx`
  - `flashKey` 生成 (L54)：`Date.now()` 用于去重 key → 提取为可 mock 的 helper 或接受注入
- `apps/desktop/renderer/src/features/version-history/VersionHistoryContainer.tsx`
  - L58：`const now = Date.now()` → 改为可注入参数
- `apps/desktop/renderer/src/features/analytics/AnalyticsPage.tsx`
  - L101-102：`Date.now()` 用于计算日期范围 → 改为可注入
- `apps/desktop/renderer/src/features/editor/aiStreamUndo.ts`
  - L50：`timestamp: Date.now()` 用于 checkpoint 时间戳 → 改为可注入 `now` 参数

**为什么是这些触点**：`grep -rn "Date.now()"` 在 renderer 生产代码中的全部 7 处调用点（含 aiStreamUndo 的 1 处），每一处都是测试不确定性来源。ChatHistory.tsx 已在先前 change 中清理，当前无 `Date.now()` 调用。

## 2. TDD Mapping（先测前提）

- [x] 2.1 将 delta spec 的每个 Scenario 映射为至少一个测试用例
- [x] 2.2 为每个测试标注对应 Scenario ID，建立可追踪关系
- [x] 2.3 设定门禁：未出现 Red（失败测试）不得进入实现

### Scenario → 测试映射

| Scenario ID | 测试文件（计划） | 测试名称（计划） | 断言要点 | Mock/依赖 | 运行命令 |
| ----------- | ---------------- | ---------------- | -------- | --------- | -------- |
| `WB-FE-NOW-S1` | `apps/desktop/renderer/src/features/dashboard/__tests__/formatRelativeTime.determinism.test.ts` | `it('returns "刚刚" for timestamps within 60s of injected now')` | 固定 `now=1700000060000`，传入 `timestamp=1700000000000`（60s 前），断言返回"1 分钟前"而非依赖真实时钟 | 无外部 mock，纯函数测试 | `pnpm -C apps/desktop test:run features/dashboard/__tests__/formatRelativeTime.determinism` |
| `WB-FE-NOW-S2` | `apps/desktop/renderer/src/features/projects/__tests__/projectSwitcher.determinism.test.ts` | `it('formats project timestamp deterministically with injected now')` | 固定 `now`，传入 `updatedAt = now - 3600000`，断言返回"1 小时前" | 无外部 mock，纯函数测试 | `pnpm -C apps/desktop test:run features/projects/__tests__/projectSwitcher.determinism` |
| `WB-FE-NOW-S3` | `apps/desktop/renderer/src/features/search/__tests__/search-panel-flashkey.determinism.test.ts` | `it('generates deterministic flashKey when now is injected')` | 注入固定 `now`，两次调用返回相同 flashKey（而非每次不同） | `vi.useFakeTimers()` 或注入参数 | `pnpm -C apps/desktop test:run features/search/__tests__/search-panel-flashkey.determinism` |
| `WB-FE-NOW-S4` | `apps/desktop/renderer/src/features/version-history/__tests__/versionHistory.determinism.test.ts` | `it('computes version age deterministically with injected now')` | 固定 `now`，断言版本年龄计算结果稳定 | 无外部 mock | `pnpm -C apps/desktop test:run features/version-history/__tests__/versionHistory.determinism` |
| `WB-FE-NOW-S5` | `apps/desktop/renderer/src/features/analytics/__tests__/analytics.determinism.test.ts` | `it('computes date range deterministically with injected now')` | 固定 `now`，断言 `from`/`to` 日期键值稳定 | `vi.useFakeTimers()` | `pnpm -C apps/desktop test:run features/analytics/__tests__/analytics.determinism` |
| `WB-FE-NOW-S6` | `apps/desktop/renderer/src/features/editor/__tests__/aiStreamUndo.determinism.test.ts` | `it('creates checkpoint with injected now timestamp')` | 固定 `now`，断言 `buildAiStreamUndoCheckpoint` 产出 checkpoint 的 timestamp 等于注入值 | 无外部 mock | `pnpm -C apps/desktop test:run features/editor/__tests__/aiStreamUndo.determinism` |

### 可复用测试范本

- Dashboard 测试范本：`apps/desktop/renderer/src/features/dashboard/DashboardPage.test.tsx`
- AI 面板测试范本：`apps/desktop/renderer/src/features/ai/AiPanel.test.tsx`

## 3. Red（先写失败测试）

- [x] 3.1 `WB-FE-NOW-S1`：新建测试文件，导入 `DashboardPage.tsx` 的 `formatRelativeTime`，传入 `(timestamp, fixedNow)`。
  - 期望红灯原因：当前函数签名不接受第二个参数，内部硬编码 `Date.now()`，测试中注入的 `now` 被忽略，断言结果不稳定。
  - 运行：`pnpm -C apps/desktop test:run features/dashboard/__tests__/formatRelativeTime.determinism`
- [x] 3.2 `WB-FE-NOW-S2`：新建测试文件，导入 `ProjectSwitcher.tsx` 的 `formatRelativeTime`，传入 `(updatedAt, fixedNow)`。
  - 期望红灯原因：同上，函数不接受 `now` 参数。
- [x] 3.3 `WB-FE-NOW-S3`：新建测试文件，使用 `vi.useFakeTimers()` 固定时间后调用 flashKey 生成逻辑。
  - 期望红灯原因：`SearchPanel.tsx` L54 的 `Date.now()` 内联在回调中，无法通过参数注入控制；若未导出该逻辑则需先提取。
- [x] 3.4 `WB-FE-NOW-S4`：新建测试文件，测试 `VersionHistoryContainer` 的时间计算。
  - 期望红灯原因：`now` 硬编码在组件内部。
- [x] 3.5 `WB-FE-NOW-S5`：新建测试文件，测试 `AnalyticsPage` 的日期范围计算。
  - 期望红灯原因：`Date.now()` 内联在组件 effect 中。
- [x] 3.6 `WB-FE-NOW-S6`：新建测试文件，测试 `aiStreamUndo.ts` 的 checkpoint 创建。
  - 期望红灯原因：`buildAiStreamUndoCheckpoint` 内部硬编码 `Date.now()`，无法注入 `now`。

## 4. Green（最小实现通过）

- [x] 4.1 `DashboardPage.tsx`：将 `formatRelativeTime(timestamp)` 改为 `formatRelativeTime(timestamp, now = Date.now())`，内部使用 `now` 替代 `Date.now()`。→ S1 转绿
- [x] 4.2 `ProjectSwitcher.tsx`：将 `formatRelativeTime(updatedAt)` 改为 `formatRelativeTime(updatedAt, now = Date.now())`。→ S2 转绿
- [x] 4.3 `SearchPanel.tsx`：将 L54 的 `Date.now()` 提取为可注入参数，通过 `NavigateSearchResultArgs.now` 注入。→ S3 转绿
- [x] 4.4 `VersionHistoryContainer.tsx`：将 L58 的 `const now = Date.now()` 改为接受 props 或参数注入。→ S4 转绿
- [x] 4.5 `AnalyticsPage.tsx`：将 L101-102 的 `Date.now()` 提取为 `computeDateRange(now)` 函数并 export。→ S5 转绿
- [x] 4.6 `aiStreamUndo.ts`：将 `buildAiStreamUndoCheckpoint` 的 `timestamp: Date.now()` 改为接受可选 `now` 参数。→ S6 转绿

## 5. Refactor（保持绿灯）

- [x] 5.1 评估是否将两处 `formatRelativeTime`（Dashboard 版 vs ProjectSwitcher 版）合并为共享 `lib/time.ts` 工具函数，统一签名 `(timestamp: number, now?: number) => string`。—— 结论：不合并，两者返回格式和依赖差异较大。
- [x] 5.2 若合并，更新所有调用点并确认测试仍绿。 —— N/A

## 6. Evidence

- [x] 6.1 记录 RUN_LOG：Red 阶段 6 个测试全部失败的输出截取（S1-S6）
- [x] 6.2 记录 RUN_LOG：Green 阶段 6 个测试全部通过的输出截取
- [x] 6.3 记录 RUN_LOG：`pnpm -C apps/desktop test:run` 全量回归无新增失败
- [x] 6.4 记录 Dependency Sync Check（N/A）
- [x] 6.5 Main Session Audit（仅在 Apply 阶段需要）
