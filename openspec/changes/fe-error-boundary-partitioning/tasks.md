## 1. Specification

更新时间：2026-02-28 19:20

- [ ] 1.1 审阅并确认需求边界：将单层全局 `ErrorBoundary` 拆分为 4 层分区边界（App/Editor/Sidebar/Panel），使崩溃只影响自身区域。不改业务逻辑。
- [ ] 1.2 审阅并确认错误路径与边界路径：每个分区 Boundary 提供可恢复的 fallback（提示 + 重新加载/关闭该区域）。全局 AppErrorBoundary 作为兜底。
- [ ] 1.3 审阅并确认验收阈值与不可变契约：任一区域（Sidebar/RightPanel/Editor）崩溃不得导致全屏白屏；其余区域必须保持可用。
- [ ] 1.4 依赖同步检查（Dependency Sync Check）：N/A

### 1.5 预期实现触点

- `apps/desktop/renderer/src/components/patterns/ErrorBoundary.tsx`
  - 已有通用 `ErrorBoundary` class component，支持 `children` + `fallback` props
  - 可直接复用，无需改动（或增加 `onReset` 回调支持"重试"）
- `apps/desktop/renderer/src/main.tsx`
  - L25-29：当前单层 `<ErrorBoundary>` 包裹整个 App → 保留为 AppErrorBoundary（兜底）
- `apps/desktop/renderer/src/components/layout/AppShell.tsx`
  - 在 Sidebar 渲染处包裹 `<ErrorBoundary fallback={<SidebarFallback />}>`
  - 在 RightPanel 渲染处包裹 `<ErrorBoundary fallback={<PanelFallback />}>`
  - 在 Editor 主内容区包裹 `<ErrorBoundary fallback={<EditorFallback />}>`
- 新增 fallback 组件（可放在 `components/patterns/` 下）：
  - `RegionFallback.tsx`（通用）：显示错误提示 + "重新加载此区域" 按钮（调用 `onReset`）
  - 或按区域分别定义（SidebarFallback/PanelFallback/EditorFallback）

**为什么是这些触点**：main.tsx 是全局兜底，AppShell.tsx 是三区域（Sidebar/Editor/RightPanel）的组装点，ErrorBoundary.tsx 是复用基础。

## 2. TDD Mapping（先测前提）

- [ ] 2.1 将 delta spec 的每个 Scenario 映射为至少一个测试用例
- [ ] 2.2 为每个测试标注对应 Scenario ID，建立可追踪关系
- [ ] 2.3 设定门禁：未出现 Red（失败测试）不得进入实现

### Scenario → 测试映射

| Scenario ID | 测试文件（计划） | 测试名称（计划） | 断言要点 | Mock/依赖 | 运行命令 |
| ----------- | ---------------- | ---------------- | -------- | --------- | -------- |
| `WB-FE-EB-S1` | `apps/desktop/renderer/src/components/layout/AppShell.error-boundary.test.tsx` | `it('isolates sidebar crash from editor area')` | 构造 Sidebar 子组件抛异常，断言 Editor 区域仍渲染正常内容，Sidebar 区域渲染 fallback | mock 抛异常的子组件；`vi.spyOn(console, "error")` 静默 React 错误日志 | `pnpm -C apps/desktop test:run components/layout/AppShell.error-boundary` |
| `WB-FE-EB-S2` | 同上 | `it('isolates right panel crash from main content')` | 构造 RightPanel 子组件抛异常，断言 Editor + Sidebar 正常，RightPanel 渲染 fallback | 同上 | 同上 |
| `WB-FE-EB-S3` | 同上 | `it('isolates editor crash from sidebar and panel')` | 构造 Editor 区域抛异常，断言 Sidebar + RightPanel 正常 | 同上 | 同上 |
| `WB-FE-EB-S4` | 同上 | `it('region fallback provides a retry/reset action')` | 断言 fallback 中存在"重新加载"按钮，点击后区域重新渲染 | 同上 | 同上 |

### 可复用测试范本

- AppShell 测试：`apps/desktop/renderer/src/components/layout/AppShell.test.tsx`

## 3. Red（先写失败测试）

- [ ] 3.1 `WB-FE-EB-S1`：构造一个会抛异常的 mock Sidebar 子组件，渲染 AppShell，断言 Editor 区域仍正常。
  - 期望红灯原因：当前 AppShell 无分区 Boundary，Sidebar 崩溃会冒泡到全局 ErrorBoundary 导致全屏 fallback。
- [ ] 3.2 `WB-FE-EB-S2`：构造 RightPanel 子组件抛异常，断言 Editor + Sidebar 正常。
  - 期望红灯原因：同上。
- [ ] 3.3 `WB-FE-EB-S3`：构造 Editor 区域抛异常，断言 Sidebar + RightPanel 正常。
  - 期望红灯原因：同上。
- [ ] 3.4 `WB-FE-EB-S4`：断言 fallback 中有"重新加载"按钮。
  - 期望红灯原因：无分区 fallback 组件。
- 运行：`pnpm -C apps/desktop test:run components/layout/AppShell.error-boundary`

## 4. Green（最小实现通过）

- [ ] 4.1 新增 `RegionFallback.tsx`（或按区域分别定义）：
  - 显示错误提示文案 + "重新加载此区域" 按钮
  - 按钮调用 `ErrorBoundary` 的 `onReset`（需确认现有 ErrorBoundary 是否支持 reset，若不支持则增加 `resetErrorBoundary` 方法）
  → S4 转绿
- [ ] 4.2 `AppShell.tsx`：在 Sidebar 渲染处包裹 `<ErrorBoundary fallback={<RegionFallback region="sidebar" />}>` → S1 转绿
- [ ] 4.3 `AppShell.tsx`：在 RightPanel 渲染处包裹 `<ErrorBoundary fallback={<RegionFallback region="panel" />}>` → S2 转绿
- [ ] 4.4 `AppShell.tsx`：在 Editor 主内容区包裹 `<ErrorBoundary fallback={<RegionFallback region="editor" />}>` → S3 转绿
- [ ] 4.5 `main.tsx`：保留全局 `<ErrorBoundary>` 作为最终兜底（不改动）

## 5. Refactor（保持绿灯）

- [ ] 5.1 若 `ErrorBoundary` 不支持 `onReset`/`resetErrorBoundary`，增加 key-based reset 策略（改变 key 强制重新挂载）
- [ ] 5.2 确认 fallback 样式走 Token，与整体设计一致

## 6. Evidence

- [ ] 6.1 记录 RUN_LOG：Red 阶段 4 个测试失败的输出
- [ ] 6.2 记录 RUN_LOG：Green 阶段全部通过的输出
- [ ] 6.3 记录 RUN_LOG：`pnpm -C apps/desktop test:run` 全量回归无新增失败
- [ ] 6.4 记录 Dependency Sync Check（N/A）
- [ ] 6.5 Main Session Audit（仅在 Apply 阶段需要）
