## 1. Specification

更新时间：2026-02-28 20:55

- [x] 1.1 审阅并确认需求边界：修复 SearchPanel 关闭语义——`open=false` 短路不渲染 overlay，backdrop 点击触发 `onClose`。不引入弹出式改造。
- [x] 1.2 审阅并确认错误路径与边界路径：`open=false` 不渲染 overlay/backdrop；`onClose` 缺失时 backdrop 点击静默（不报错）。
- [x] 1.3 审阅并确认验收阈值与不可变契约：backdrop 必须可关闭；`open=false` 不渲染 overlay。
- [x] 1.4 依赖同步检查（Dependency Sync Check）：N/A

### 1.5 预期实现触点

- `apps/desktop/renderer/src/features/search/SearchPanel.tsx`：
  - L500-501：`open?: boolean`、`onClose?: () => void` — `open` 是可选的，无短路
  - L625：`fixed inset-0 z-[var(--z-modal)]` — 全屏覆盖层始终渲染
  - 需要：在 L625 之前加 `if (!open) return null` 短路
  - L575-576：Esc 已调用 `onClose()`（正确）
  - L600：某处已调用 `onClose?.()`（正确）
  - 需要：L625 的 backdrop 容器添加 `onClick` → `onClose?.()`（点击空白区域关闭）
- `apps/desktop/renderer/src/components/layout/Sidebar.tsx`（或 AppShell）：
  - 挂载 SearchPanel 时必须传入 `open` 和 `onClose` props

**为什么是这些触点**：SearchPanel 的 `open` 短路和 backdrop `onClick` 是修复关闭语义的最小改动点。

## 2. TDD Mapping（先测前提）

- [x] 2.1 将 delta spec 的每个 Scenario 映射为至少一个测试用例
- [x] 2.2 为每个测试标注对应 Scenario ID，建立可追踪关系
- [x] 2.3 设定门禁：未出现 Red（失败测试）不得进入实现

### Scenario → 测试映射

| Scenario ID | 测试文件（计划） | 测试名称（计划） | 断言要点 | Mock/依赖 | 运行命令 |
| ----------- | ---------------- | ---------------- | -------- | --------- | -------- |
| `WB-FE-HF-SP-S1` | `apps/desktop/renderer/src/features/search/SearchPanel.visibility.test.tsx` | `it('does not render overlay when open is false')` | 渲染 `<SearchPanel open={false} />`，断言无 `fixed inset-0` 元素 | mock search store | `pnpm -C apps/desktop test:run features/search/SearchPanel.visibility` |
| `WB-FE-HF-SP-S2` | `apps/desktop/renderer/src/features/search/SearchPanel.close.test.tsx` | `it('calls onClose when clicking backdrop')` | 渲染 `<SearchPanel open={true} onClose={fn} />`，点击 backdrop，断言 fn 被调用 | mock search store | `pnpm -C apps/desktop test:run features/search/SearchPanel.close` |
| `WB-FE-HF-SP-S2b` | 同上 | `it('calls onClose when pressing Escape')` | 按 Escape，断言 onClose 被调用 | mock search store | 同上 |

### 可复用测试范本

- SearchPanel 测试：`apps/desktop/renderer/src/features/search/SearchPanel.test.tsx`

## 3. Red（先写失败测试）

- [x] 3.1 `WB-FE-HF-SP-S1`：渲染 `<SearchPanel open={false} />`，断言无 overlay 元素。
  - 期望红灯原因：当前 `open` 可选且无短路，overlay 始终渲染。
- [x] 3.2 `WB-FE-HF-SP-S2`：渲染 `<SearchPanel open={true} onClose={fn} />`，点击 backdrop 区域，断言 fn 被调用。
  - 期望红灯原因：当前 backdrop 容器无 onClick handler。
- [x] 3.3 `WB-FE-HF-SP-S2b`：按 Escape，断言 onClose 被调用。
  - 期望可能绿灯：L575-576 已有 Esc 处理（需验证）。
- 运行：`pnpm -C apps/desktop test:run features/search/SearchPanel.visibility` / `SearchPanel.close`

## 4. Green（最小实现通过）

- [x] 4.1 `SearchPanel.tsx`：在渲染 overlay 前加 `if (!open) return null` 短路 → S1 转绿
- [x] 4.2 `SearchPanel.tsx` L625：backdrop 容器添加 `data-testid="search-backdrop"`（已有 `onClick={onClose}`）→ S2 转绿
- [x] 4.3 Sidebar/AppShell：确保挂载 SearchPanel 时传入 `open` + `onClose`

## 5. Refactor（保持绿灯）

- [x] 5.1 将 `open` 从可选改为必选 prop（`open: boolean`），强制调用方传入
- [x] 5.2 确认 Esc 关闭行为与 backdrop 关闭行为一致

## 6. Evidence

- [x] 6.1 记录 RUN_LOG：Red 阶段测试失败的输出
- [x] 6.2 记录 RUN_LOG：Green 阶段全部通过的输出
- [x] 6.3 记录 RUN_LOG：`pnpm -C apps/desktop test:run` 全量回归无新增失败
- [x] 6.4 记录 Dependency Sync Check（N/A）
- [x] 6.5 Main Session Audit（PASS，已落盘）
