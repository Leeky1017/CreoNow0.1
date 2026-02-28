## 1. Specification

更新时间：2026-02-28 19:20

- [ ] 1.1 审阅并确认需求边界：重写 SearchPanel UI 回归设计系统——移除硬编码 hex/rgba、内联 style、原生 input/button，统一使用 Token + Primitives/Composites。不改搜索数据链路。
- [ ] 1.2 审阅并确认错误路径与边界路径：空结果显示 EmptyState；加载态显示 Skeleton/Spinner；错误态显示 ErrorState。
- [ ] 1.3 审阅并确认验收阈值与不可变契约：SearchPanel 不得残留 hex/rgba/内联 style/原生 input-button；动画遵循 `prefers-reduced-motion`。
- [ ] 1.4 依赖同步检查（Dependency Sync Check）：
  - [ ] `fe-hotfix-searchpanel-backdrop-close`（关闭语义先稳定）
  - [ ] `fe-composites-p0-panel-and-command-items`（复用 PanelContainer/CommandItem）

### 1.5 预期实现触点

- `apps/desktop/renderer/src/features/search/SearchPanel.tsx`（1079 行）：
  - 72 处 hex/rgba 硬编码 → 替换为 `var(--color-*)` Token
  - 12 处原生 `<input>`/`<button>` → 替换为 `<Input>`/`<Button>` Primitive
  - 6 处 `style=` 内联样式 → 替换为 Tailwind Token class
  - 17 处内联 `<svg>` → 替换为 Lucide 图标（与 `fe-lucide-icon-unification` 协同）
  - `@keyframes` 动画（L~内联）→ 移到 main.css 或遵循 reduced motion
  - 搜索输入区 → 复用 `<SearchInput>` Composite（若 P1 已就绪）
  - 结果列表项 → 复用 `<CommandItem>` 或 `<SidebarItem>` Composite

**为什么是这些触点**：SearchPanel 是单文件最大 Token 逃逸区（72 处 hex/rgba），集中治理效果最显著。

## 2. TDD Mapping（先测前提）

- [ ] 2.1 将 delta spec 的每个 Scenario 映射为至少一个测试用例
- [ ] 2.2 为每个测试标注对应 Scenario ID，建立可追踪关系
- [ ] 2.3 设定门禁：未出现 Red（失败测试）不得进入实现

### Scenario → 测试映射

| Scenario ID | 测试文件（计划） | 测试名称（计划） | 断言要点 | Mock/依赖 | 运行命令 |
| ----------- | ---------------- | ---------------- | -------- | --------- | -------- |
| `WB-FE-SRCH-S1` | `apps/desktop/renderer/src/features/search/SearchPanel.token-guard.test.ts` | `it('does not contain raw hex/rgba in source')` | 读取 SearchPanel.tsx 源码，断言不含 `#[0-9a-f]{3,8}` 或 `rgba(` | `fs.readFileSync` | `pnpm -C apps/desktop test:run features/search/SearchPanel.token-guard` |
| `WB-FE-SRCH-S1b` | 同上 | `it('does not contain inline style attributes')` | 断言不含 `style=` | `fs.readFileSync` | 同上 |
| `WB-FE-SRCH-S2` | `apps/desktop/renderer/src/features/search/SearchPanel.primitives.test.ts` | `it('uses Input and Button primitives instead of native elements')` | 断言不含 `<input` 或 `<button`（应为 `<Input`/`<Button`） | `fs.readFileSync` | `pnpm -C apps/desktop test:run features/search/SearchPanel.primitives` |
| `WB-FE-SRCH-S3` | `apps/desktop/renderer/src/features/search/SearchPanel.motion.test.ts` | `it('does not use transition-all')` | 断言不含 `transition-all` | `fs.readFileSync` | `pnpm -C apps/desktop test:run features/search/SearchPanel.motion` |

### 可复用测试范本

- SearchPanel 测试：`apps/desktop/renderer/src/features/search/SearchPanel.test.tsx`

## 3. Red（先写失败测试）

- [ ] 3.1 `WB-FE-SRCH-S1`：读取 SearchPanel.tsx 源码，断言不含 hex/rgba 硬编码。
  - 期望红灯原因：当前 72 处 hex/rgba。
- [ ] 3.2 `WB-FE-SRCH-S1b`：断言不含 `style=` 内联样式。
  - 期望红灯原因：当前 6 处 inline style。
- [ ] 3.3 `WB-FE-SRCH-S2`：断言不含原生 `<input` 或 `<button`。
  - 期望红灯原因：当前 12 处原生元素。
- [ ] 3.4 `WB-FE-SRCH-S3`：断言不含 `transition-all`。
  - 期望红灯原因：当前可能存在 transition-all。
- 运行：`pnpm -C apps/desktop test:run features/search/SearchPanel.token-guard` / `SearchPanel.primitives` / `SearchPanel.motion`

## 4. Green（最小实现通过）

- [ ] 4.1 72 处 hex/rgba → `var(--color-*)` Token 替换 → S1 转绿
- [ ] 4.2 6 处 `style=` → Tailwind Token class → S1b 转绿
- [ ] 4.3 12 处原生 `<input>`/`<button>` → `<Input>`/`<Button>` Primitive → S2 转绿
- [ ] 4.4 `transition-all` → 精确 `transition-colors`/`transition-opacity` → S3 转绿
- [ ] 4.5 17 处内联 SVG → Lucide 图标（与 `fe-lucide-icon-unification` 协同）

## 5. Refactor（保持绿灯）

- [ ] 5.1 搜索输入区复用 `<SearchInput>` Composite（若 P1 已就绪）
- [ ] 5.2 结果列表项复用 `<CommandItem>` / `<SidebarItem>` Composite
- [ ] 5.3 评估 SearchPanel 拆分为子组件（当前 1079 行单文件）

## 6. Evidence

- [ ] 6.1 记录 RUN_LOG：Red 阶段 guard 测试失败的输出（含逃逸计数）
- [ ] 6.2 记录 RUN_LOG：Green 阶段全部通过的输出
- [ ] 6.3 记录 RUN_LOG：`pnpm -C apps/desktop test:run` 全量回归无新增失败
- [ ] 6.4 记录 Dependency Sync Check：确认 `fe-hotfix-searchpanel-backdrop-close` + `fe-composites-p0` 状态
- [ ] 6.5 Main Session Audit（仅在 Apply 阶段需要）
