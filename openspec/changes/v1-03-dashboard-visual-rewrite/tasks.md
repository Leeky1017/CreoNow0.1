# Tasks: V1-03 Dashboard 视觉重写

- **状态**: ✅ 已合并（PR #1168）
- **评级**: ⭐⭐⭐⭐
- **GitHub Issue**: #1168
- **分支**: `task/<N>-dashboard-visual-rewrite`
- **Delta Spec**: `openspec/changes/v1-03-dashboard-visual-rewrite/specs/`

---

## 验收标准

| ID    | 标准                                                                                                                              | 对应 Scenario | 结果 |
| ----- | --------------------------------------------------------------------------------------------------------------------------------- | ------------- | ---- |
| AC-1  | DashboardPage 布局从 `repeat(auto-fill, minmax(280px, 1fr))` 网格改为设计稿 `05-dashboard-sidebar-full.html` 定义的固定侧边栏布局 | 全局          | ✅   |
| AC-2  | HeroCard 中 0 处 Tailwind arbitrary 值（`p-10`、`max-w-[500px]`、`w-16 h-16`、`text-[11px]` 等全部替换为 Design Token）           | 全局          | ✅   |
| AC-3  | ProjectCard 中 2 处原生 `<button>` 替换为 Button primitive，对应 `eslint-disable` 注释移除                                        | 全局          | ✅   |
| AC-4  | 卡片 hover 效果包含 border 变亮 + subtle shadow elevation 双重反馈，shadow 使用 `--shadow-*` Design Token                         | 全局          | ✅   |
| AC-5  | plus-grid 装饰图案、arrow icon hover 旋转（0.2s）、stat display 区域、monospace meta 字体四项设计稿元素已实现                     | 全局          | ✅   |
| AC-6  | 空状态页面对齐 `26-empty-states.html` 视觉语言（illustrative icon + 引导文案 + 行动按钮）                                         | 全局          | ✅   |
| AC-7  | 所有新增/修改的组件使用语义化 Design Token，0 处新增 Tailwind arbitrary 色值/字号                                                 | 全局          | ✅   |
| AC-8  | Storybook 可构建（`pnpm -C apps/desktop storybook:build`）                                                                        | 全局          | ✅   |
| AC-9  | 全量测试通过（`pnpm -C apps/desktop vitest run`）                                                                                 | 全局          | ✅   |
| AC-10 | TypeScript 类型检查通过（`pnpm typecheck`）                                                                                       | 全局          | ✅   |
| AC-11 | lint 无新增违规（`pnpm lint`）                                                                                                    | 全局          | ✅   |
| AC-12 | `DashboardPage.tsx` 从 ~929 行拆分至主文件 ≤ 300 行，子组件各 ≤ 300 行                                                            | 架构          | ✅ 268 行 |

---

## Phase 0: 准备

- [x] 阅读 `AGENTS.md`、`design/DESIGN_DECISIONS.md` §1.2 + §11.14 + §17.2
- [x] 阅读设计稿 `design/Variant/designs/05-dashboard-sidebar-full.html` 全文，标注布局结构、间距数值、颜色变量
- [x] 阅读设计稿 `design/Variant/designs/26-empty-states.html`，提取 Dashboard 空状态视觉规范
- [x] 阅读 `apps/desktop/renderer/src/features/dashboard/DashboardPage.tsx` 全文（929 行），标注需修改区域
- [x] 阅读 `apps/desktop/renderer/src/features/dashboard/DashboardToolbar.tsx` 及其他子组件
- [x] 确认 v1-01（Design Token 补完）已合并，所需 token 可用
- [x] 确认 v1-02（Primitive 进化）提供的 Card / Button variant 可用

---

## Phase 1: Red（测试先行）

### Task 1.1: 布局结构测试

**映射验收标准**: AC-1

- [x] 测试：DashboardPage 渲染后包含固定侧边栏容器（通过 role/testId 查询）
- [x] 测试：侧边栏与内容区按设计稿比例布局
- [x] 测试：内容区 ProjectCard 网格使用正确的 minmax 值（240px）

**文件**: `apps/desktop/renderer/src/features/dashboard/__tests__/DashboardLayout.test.tsx`（新建）

### Task 1.2: HeroCard Token 使用测试

**映射验收标准**: AC-2, AC-7

- [x] 测试：HeroCard 渲染后无 Tailwind arbitrary 值 class（不含 `p-10`、`max-w-[500px]`、`w-16`、`h-16`、`text-[11px]`）
- [x] 测试：HeroCard 渲染后 icon 尺寸通过 Design Token 控制

**文件**: `apps/desktop/renderer/src/features/dashboard/__tests__/HeroCard.test.tsx`（新建或扩展）

### Task 1.3: 原生元素替换测试

**映射验收标准**: AC-3

- [x] 测试：ProjectCard 的菜单触发使用 Button primitive（通过 role="button" + 组件类型判定）
- [x] 测试：ProjectCard 的 archived toggle 使用 Button primitive

**文件**: `apps/desktop/renderer/src/features/dashboard/__tests__/ProjectCard.test.tsx`（新建或扩展）

### Task 1.4: 卡片 hover 效果测试

**映射验收标准**: AC-4

- [x] 测试：ProjectCard hover 后 className 包含 shadow 相关的 Design Token class
- [x] 测试：ProjectCard hover 后 border 样式变化

**文件**: `apps/desktop/renderer/src/features/dashboard/__tests__/ProjectCard.test.tsx`

### Task 1.5: 空状态测试

**映射验收标准**: AC-6

- [x] 测试：当 projects 列表为空时，渲染空状态组件（包含 illustrative icon、引导文案、行动按钮）
- [x] 测试：空状态行动按钮点击触发 CreateProject 流程

**文件**: `apps/desktop/renderer/src/features/dashboard/__tests__/DashboardEmptyState.test.tsx`（新建）

---

## Phase 2: Green（最小实现）

### Task 2.1: 布局模型重构

**映射验收标准**: AC-1

- [x] 将 DashboardPage 网格从 `repeat(auto-fill, minmax(280px, 1fr))` 改为设计稿定义的固定侧边栏 + 内容区二栏布局
- [x] 侧边栏宽度、内容区网格对齐 DESIGN_DECISIONS.md §11.14 + §17.2 规范
- [x] 确保布局使用语义化 Design Token 间距

**文件**: `apps/desktop/renderer/src/features/dashboard/DashboardPage.tsx`

### Task 2.2: HeroCard Token 化

**映射验收标准**: AC-2

- [x] `p-10` → 语义间距 token（如 `--space-section-gap` 或新增语义 token）
- [x] `max-w-[500px]` → 布局约束 token
- [x] `w-16 h-16` → icon sizing token
- [x] `text-[11px]` → typography token（如 `--text-label-*` 或 `--text-metadata-*`）
- [x] 其他 arbitrary 值逐一替换

**文件**: `apps/desktop/renderer/src/features/dashboard/DashboardPage.tsx`（HeroCard 部分）

### Task 2.3: 设计稿元素实现

**映射验收标准**: AC-5

- [x] 实现 plus-grid 装饰图案（新建项目卡片区域的视觉背景）
- [x] 实现 arrow icon hover 旋转效果（`transform: rotate()`，使用 `--duration-fast` + `--ease-default`）
- [x] 实现 stat display 卡片（字数/章节/创作天数统计展示），使用 Card stat variant
- [x] 项目元数据部分使用 monospace 字体（通过 token 引用）

**文件**: `apps/desktop/renderer/src/features/dashboard/DashboardPage.tsx` 及相关子组件

### Task 2.4: 原生 HTML → Primitive

**映射验收标准**: AC-3

- [x] ProjectCard 菜单触发：原生 `<button>` → Button primitive（ghost variant），移除 `eslint-disable`
- [x] ProjectCard archived toggle：原生 `<button>` → Button primitive，移除 `eslint-disable`

**文件**: `apps/desktop/renderer/src/features/dashboard/` 下 ProjectCard 相关文件

### Task 2.5: 卡片 hover 效果完善

**映射验收标准**: AC-4

- [x] 在现有 border 变亮基础上新增 hover shadow：使用 `--shadow-*` Design Token
- [x] hover 过渡时间使用 `--duration-fast`（150ms）+ `--ease-default`

**文件**: `apps/desktop/renderer/src/features/dashboard/` 下 ProjectCard 相关文件

### Task 2.6: 空状态实现

**映射验收标准**: AC-6

- [x] 实现 Dashboard 空状态组件，对齐 `26-empty-states.html` 的视觉语言
- [x] 包含 illustrative icon（使用 Lucide icon）、引导文案（走 `t()` i18n）、行动按钮（Button primitive）
- [x] 集成到 DashboardPage 的空项目列表分支

**文件**: `apps/desktop/renderer/src/features/dashboard/DashboardEmptyState.tsx`（新建）

### Task 2.7: DashboardPage.tsx 解耦拆分

**映射验收标准**: AC-12

- [x] 提取 `DashboardHero.tsx`：顶部 hero 区域（欢迎语 + 快速操作 + 统计卡片），85 行 ✅
- [x] 提取 `DashboardProjectGrid.tsx`：项目卡片网格渲染（bento card 列表 + 排序），232 行 ✅
- [x] 提取 `DashboardSidebar.tsx`：侧栏（最近文件 + 活动动态），153 行 ✅
- [x] 提取 `useDashboardLayout.ts`：布局响应式逻辑 hook，17 行 ✅
- [x] 精简 `DashboardPage.tsx` 至 ≤ 300 行（实测 268 行 ✅）
- [x] 确认提取后所有现有测试仍通过

**文件**: `apps/desktop/renderer/src/features/dashboard/DashboardPage.tsx`（拆分）

---

## Phase 3: Verification & Delivery

- [x] 运行 Phase 1 全部测试，确认全绿
- [x] 运行 `pnpm -C apps/desktop vitest run` 全量测试通过
- [x] 运行 `pnpm typecheck` 类型检查通过
- [x] 运行 `pnpm lint` lint 无新增违规
- [x] 运行 `pnpm -C apps/desktop storybook:build` Storybook 可构建
- [x] 目视比对 DashboardPage 与 `05-dashboard-sidebar-full.html` 设计稿，确认关键元素对齐
- [x] 目视确认空状态与 `26-empty-states.html` 对齐
- [x] 确认 DashboardPage.tsx 无新增 Tailwind arbitrary 色值/字号
- [x] 确认 `eslint-disable` 注释净减少 ≥ 2 处（实测：2 → 0，净减 2 ✅）
- [x] 创建 PR（含 `Closes #N`），附视觉对比截图 → PR #1168 已合并

---

## 遗留项

| 遗留项 | 说明 | 归属 |
| ------ | ---- | ---- |
| DashboardEmptyState 迁移 | 当前为 Dashboard 内部组件（94 行），需迁移为标准 EmptyState 状态组件，统一空状态视觉语言 | v1-18 |
