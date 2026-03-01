## 1. Specification

更新时间：2026-02-28 19:20

- [x] 1.1 审阅并确认需求边界：清理 Dead UI / Mock 残留——删除 ProxySection、移除 SearchPanel mock 数据、收敛 AI 历史占位交互。不引入新功能。
- [x] 1.2 审阅并确认错误路径与边界路径：空结果必须走明确 EmptyState；占位交互要么闭环要么显式禁用。
- [x] 1.3 审阅并确认验收阈值与不可变契约：禁止 mock 数据进入生产路径；禁止"可点但无效"的幽灵交互。
- [x] 1.4 依赖同步检查（Dependency Sync Check）：N/A

### 1.5 预期实现触点

- `apps/desktop/renderer/src/features/settings/ProxySection.tsx`（删除）：
  - L16-21：`ProxySection` 组件，Owner 已确认为死代码
  - 需同步删除所有 import 引用（SettingsDialog 等）
- `apps/desktop/renderer/src/features/search/SearchPanel.tsx`：
  - L68：`export const MOCK_SEARCH_RESULTS` → 删除
  - L543：`// Use mock results if provided` → 移除 mock 分支，空结果走 EmptyState
- `apps/desktop/renderer/src/features/ai/AiPanel.tsx` 或 `ChatHistory.tsx`：
  - AI 历史列表的 placeholder handler → 要么实现选择行为闭环，要么 `disabled` + 说明文案

**为什么是这些触点**：ProxySection 是确认的死代码，MOCK_SEARCH_RESULTS 是生产路径中的 mock 残留，AI 历史占位是幽灵交互。

## 2. TDD Mapping（先测前提）

- [x] 2.1 将 delta spec 的每个 Scenario 映射为至少一个测试用例
- [x] 2.2 为每个测试标注对应 Scenario ID，建立可追踪关系
- [x] 2.3 设定门禁：未出现 Red（失败测试）不得进入实现

### Scenario → 测试映射

| Scenario ID | 测试文件（计划） | 测试名称（计划） | 断言要点 | Mock/依赖 | 运行命令 |
| ----------- | ---------------- | ---------------- | -------- | --------- | -------- |
| `WB-FE-CLN-S1` | `apps/desktop/renderer/src/features/__tests__/proxy-section-dead.guard.test.ts` | `it('ProxySection.tsx does not exist')` | 断言文件不存在（`fs.existsSync` 返回 false） | `fs` | `pnpm -C apps/desktop test:run features/__tests__/proxy-section-dead.guard` |
| `WB-FE-CLN-S1b` | 同上 | `it('no imports reference ProxySection')` | 扫描 features/**/*.tsx，断言无 `ProxySection` import | `fs`/`glob` | 同上 |
| `WB-FE-CLN-S2` | `apps/desktop/renderer/src/features/search/SearchPanel.no-mock.guard.test.ts` | `it('SearchPanel has no MOCK_ exports or constants')` | 读取 SearchPanel.tsx，断言不含 `MOCK_` | `fs.readFileSync` | `pnpm -C apps/desktop test:run features/search/SearchPanel.no-mock.guard` |
| `WB-FE-CLN-S3` | `apps/desktop/renderer/src/features/ai/AiPanel.history.interaction.test.tsx` | `it('history items are either functional or disabled')` | 渲染 AI 历史列表，断言每个可点击项要么触发实际行为，要么有 `disabled`/`aria-disabled` | mock AI store | `pnpm -C apps/desktop test:run features/ai/AiPanel.history.interaction` |

### 可复用测试范本

- SearchPanel 测试：`apps/desktop/renderer/src/features/search/SearchPanel.test.tsx`

## 3. Red（先写失败测试）

- [x] 3.1 `WB-FE-CLN-S1`：断言 `ProxySection.tsx` 不存在。
  - 期望红灯原因：文件仍存在。
- [x] 3.2 `WB-FE-CLN-S1b`：扫描 features，断言无 ProxySection import。
  - 期望红灯原因：SettingsDialog 仍引用。
- [x] 3.3 `WB-FE-CLN-S2`：读取 SearchPanel.tsx，断言不含 `MOCK_`。
  - 期望红灯原因：L68 导出 `MOCK_SEARCH_RESULTS`。
- [x] 3.4 `WB-FE-CLN-S3`：渲染 AI 历史列表，断言无 no-op 可点击项。
  - 期望红灯原因：当前存在 placeholder handler。
- 运行：`pnpm -C apps/desktop test:run features/__tests__/proxy-section-dead.guard` / `SearchPanel.no-mock.guard` / `AiPanel.history.interaction`

## 4. Green（最小实现通过）

- [x] 4.1 删除 `ProxySection.tsx` + 清理所有 import 引用 → S1/S1b 转绿
- [x] 4.2 SearchPanel：删除 `MOCK_SEARCH_RESULTS` + mock 分支，空结果走 EmptyState → S2 转绿
- [x] 4.3 AI 历史：placeholder handler → 实现闭环或 `disabled` + 说明 → S3 转绿

## 5. Refactor（保持绿灯）

- [x] 5.1 清理残余 import/类型/无用常量
- [x] 5.2 确认删除 ProxySection 后 Settings 布局不受影响

## 6. Evidence

- [x] 6.1 记录 RUN_LOG：Red 阶段测试失败的输出
- [x] 6.2 记录 RUN_LOG：Green 阶段全部通过的输出
- [x] 6.3 记录 RUN_LOG：`pnpm -C apps/desktop test:run` 全量回归无新增失败
- [x] 6.4 记录 Dependency Sync Check（N/A）
- [x] 6.5 Main Session Audit（仅在 Apply 阶段需要）
