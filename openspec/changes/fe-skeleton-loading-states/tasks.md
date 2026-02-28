## 1. Specification

更新时间：2026-02-28 19:20

- [ ] 1.1 审阅并确认需求边界：为关键 Feature 区域补齐骨架屏，替换当前居中 Spinner 或空白加载态。建立 >=200ms 阈值策略。不改数据加载层。
- [ ] 1.2 审阅并确认错误路径与边界路径：加载失败仍需错误 UI（ErrorBoundary/fallback），骨架屏仅用于 loading 态。<200ms 不显示骨架（避免闪烁）。
- [ ] 1.3 审阅并确认验收阈值与不可变契约：loading >=200ms 必须展示 `Skeleton` Primitive 构建的骨架屏；禁止散写 `<div className="animate-pulse">` 替代。
- [ ] 1.4 依赖同步检查（Dependency Sync Check）：N/A

### 1.5 预期实现触点

- `apps/desktop/renderer/src/components/primitives/Skeleton.tsx`
  - 已有 Primitive，无需改动。
- 新增 Skeleton 组合组件（按区域）：
  - `apps/desktop/renderer/src/features/dashboard/DashboardSkeleton.tsx`（新）
    - 当前 `DashboardPage.tsx` L549-555 使用居中 `<Spinner size="lg" />`
  - `apps/desktop/renderer/src/features/files/FileTreeSkeleton.tsx`（新）
    - 当前 FileTreePanel 加载态为空白
  - `apps/desktop/renderer/src/features/character/CharacterPanelSkeleton.tsx`（新）
    - 当前 `CharacterPanelContainer.tsx` L138 使用 `bootstrapStatus === "loading"` 但无骨架
  - `apps/desktop/renderer/src/features/kg/KnowledgeGraphSkeleton.tsx`（新）
    - 当前 KG 面板加载态待确认
- 新增 `useDeferredLoading` hook（可选）：
  - `apps/desktop/renderer/src/lib/useDeferredLoading.ts`（新）
  - 逻辑：loading 开始后 200ms 内返回 `false`（不显示骨架），>=200ms 返回 `true`
  - 使用 `setTimeout` + cleanup，需配合 `vi.useFakeTimers()` 测试

**为什么是这些触点**：Dashboard/FileTree/Character/KG 是用户最常见的四个加载场景，Skeleton Primitive 已就绪只需组合。

## 2. TDD Mapping（先测前提）

- [ ] 2.1 将 delta spec 的每个 Scenario 映射为至少一个测试用例
- [ ] 2.2 为每个测试标注对应 Scenario ID，建立可追踪关系
- [ ] 2.3 设定门禁：未出现 Red（失败测试）不得进入实现

### Scenario → 测试映射

| Scenario ID | 测试文件（计划） | 测试名称（计划） | 断言要点 | Mock/依赖 | 运行命令 |
| ----------- | ---------------- | ---------------- | -------- | --------- | -------- |
| `WB-FE-SKEL-S1` | `apps/desktop/renderer/src/features/dashboard/Dashboard.skeleton.test.tsx` | `it('shows skeleton instead of spinner when loading >= 200ms')` | mock bootstrapStatus="loading"，advance timer 200ms，断言 `Skeleton` 组件渲染且无 `Spinner` | `vi.useFakeTimers()` | `pnpm -C apps/desktop test:run features/dashboard/Dashboard.skeleton` |
| `WB-FE-SKEL-S2` | 同上 | `it('does not show skeleton when loading < 200ms')` | advance timer 100ms，断言无 Skeleton 渲染 | `vi.useFakeTimers()` | 同上 |
| `WB-FE-SKEL-S3` | `apps/desktop/renderer/src/features/character/CharacterPanel.skeleton.test.tsx` | `it('shows character panel skeleton when loading >= 200ms')` | mock loading 态，advance 200ms，断言 Skeleton 渲染 | `vi.useFakeTimers()` | `pnpm -C apps/desktop test:run features/character/CharacterPanel.skeleton` |
| `WB-FE-SKEL-S4` | `apps/desktop/renderer/src/lib/__tests__/useDeferredLoading.test.ts` | `it('returns false before threshold and true after')` | `useDeferredLoading(true, 200)` → 0ms: false, 200ms: true | `vi.useFakeTimers()`, `renderHook` | `pnpm -C apps/desktop test:run lib/__tests__/useDeferredLoading` |

### 可复用测试范本

- Dashboard 测试：`apps/desktop/renderer/src/features/dashboard/DashboardPage.test.tsx`
- Skeleton Primitive 测试：`apps/desktop/renderer/src/components/primitives/Skeleton.test.tsx`

## 3. Red（先写失败测试）

- [ ] 3.1 `WB-FE-SKEL-S1`：mock `bootstrapStatus="loading"`，advance timer 200ms，断言 Dashboard 渲染 `Skeleton` 而非 `Spinner`。
  - 期望红灯原因：当前 DashboardPage L549-555 直接渲染 `<Spinner>`，无骨架屏。
- [ ] 3.2 `WB-FE-SKEL-S2`：advance timer 100ms，断言无 Skeleton。
  - 期望红灯原因：无 deferred loading 逻辑，当前立即显示 Spinner。
- [ ] 3.3 `WB-FE-SKEL-S3`：mock CharacterPanel loading 态，advance 200ms，断言 Skeleton 渲染。
  - 期望红灯原因：当前无骨架屏。
- [ ] 3.4 `WB-FE-SKEL-S4`：测试 `useDeferredLoading` hook。
  - 期望红灯原因：hook 不存在。
- 运行：`pnpm -C apps/desktop test:run Dashboard.skeleton` / `CharacterPanel.skeleton` / `useDeferredLoading`

## 4. Green（最小实现通过）

- [ ] 4.1 新增 `lib/useDeferredLoading.ts`：
  - `useDeferredLoading(isLoading: boolean, thresholdMs = 200): boolean`
  - loading 开始后 `thresholdMs` 内返回 `false`，超过后返回 `true`；loading 结束立即返回 `false`
  → S4 转绿
- [ ] 4.2 新增 `DashboardSkeleton.tsx`：用 `<Skeleton>` Primitive 模拟 Dashboard 布局（HeroCard + 项目卡片网格）
- [ ] 4.3 `DashboardPage.tsx`：将 L549-555 的 `<Spinner>` 替换为 `useDeferredLoading` + `<DashboardSkeleton>` → S1 + S2 转绿
- [ ] 4.4 新增 `CharacterPanelSkeleton.tsx`：用 `<Skeleton>` 模拟角色卡片列表
- [ ] 4.5 `CharacterPanelContainer.tsx`：L138 loading 分支替换为 deferred skeleton → S3 转绿

## 5. Refactor（保持绿灯）

- [ ] 5.1 为 FileTreePanel 和 KG 面板补齐骨架屏（同模式，可选）
- [ ] 5.2 确认 `useDeferredLoading` 在组件卸载时正确 cleanup timeout

## 6. Evidence

- [ ] 6.1 记录 RUN_LOG：Red 阶段 4 个测试失败的输出
- [ ] 6.2 记录 RUN_LOG：Green 阶段全部通过的输出
- [ ] 6.3 记录 RUN_LOG：`pnpm -C apps/desktop test:run` 全量回归无新增失败
- [ ] 6.4 记录 Dependency Sync Check（N/A）
- [ ] 6.5 Main Session Audit（仅在 Apply 阶段需要）
