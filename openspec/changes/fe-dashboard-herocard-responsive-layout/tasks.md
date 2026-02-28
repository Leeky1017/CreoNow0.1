## 1. Specification

更新时间：2026-02-28 19:20

- [ ] 1.1 审阅并确认需求边界：修复 HeroCard 装饰区 `w-[35%]` 固定比例导致的极宽/极窄问题。不重写 Dashboard 信息架构。
- [ ] 1.2 审阅并确认错误路径与边界路径：极窄窗口（<=800px）装饰区应隐藏；极宽屏（>=1920px）装饰区不超过 max-w。
- [ ] 1.3 审阅并确认验收阈值与不可变契约：文字区不得被装饰挤压到不可读；`min-h-[280px]` 在小窗口下不得溢出。
- [ ] 1.4 依赖同步检查（Dependency Sync Check）：N/A

### 1.5 预期实现触点

- `apps/desktop/renderer/src/features/dashboard/DashboardPage.tsx`
  - L83：HeroCard 容器 `min-h-[280px]` → 改为 `min-h-0` 或 `min-h-[clamp(200px, 20vh, 280px)]`
  - L101：装饰区 `w-[35%]` → 改为 `max-w-[280px] w-[35%]`（宽屏不膨胀）+ 窄屏 breakpoint 隐藏（`hidden lg:block`）
  - HeroCard 函数（L69-）：调整 flex 布局使文字区 `flex-1 min-w-0`

**为什么是这些触点**：HeroCard 是 DashboardPage 内的局部组件，装饰区宽度和容器高度是唯二需要调整的点。

## 2. TDD Mapping（先测前提）

- [ ] 2.1 将 delta spec 的每个 Scenario 映射为至少一个测试用例
- [ ] 2.2 为每个测试标注对应 Scenario ID，建立可追踪关系
- [ ] 2.3 设定门禁：未出现 Red（失败测试）不得进入实现

### Scenario → 测试映射

| Scenario ID | 测试文件（计划） | 测试名称（计划） | 断言要点 | Mock/依赖 | 运行命令 |
| ----------- | ---------------- | ---------------- | -------- | --------- | -------- |
| `PM-FE-HERO-S1` | `apps/desktop/renderer/src/features/dashboard/HeroCard.responsive.guard.test.ts` | `it('HeroCard decoration area has max-width constraint')` | 读取 DashboardPage.tsx 源码，断言装饰区 className 包含 `max-w-` 限制（不再是纯 `w-[35%]`） | `fs.readFileSync` | `pnpm -C apps/desktop test:run features/dashboard/HeroCard.responsive.guard` |
| `PM-FE-HERO-S2` | 同上 | `it('HeroCard decoration area is hidden on narrow screens')` | 断言装饰区 className 包含 `hidden` + breakpoint 显示（如 `hidden lg:block`） | `fs.readFileSync` | 同上 |
| `PM-FE-HERO-S3` | 同上 | `it('HeroCard container does not use fixed min-h-[280px]')` | 断言容器不含 `min-h-[280px]`（改为 clamp 或移除） | `fs.readFileSync` | 同上 |

### 可复用测试范本

- Dashboard 测试：`apps/desktop/renderer/src/features/dashboard/DashboardPage.test.tsx`

## 3. Red（先写失败测试）

- [ ] 3.1 `PM-FE-HERO-S1`：读取 DashboardPage.tsx 源码，找到装饰区 className，断言包含 `max-w-` 限制。
  - 期望红灯原因：当前装饰区仅有 `w-[35%]`，无 max-width 约束。
- [ ] 3.2 `PM-FE-HERO-S2`：断言装饰区 className 包含 `hidden` + breakpoint 显示类（如 `lg:block`）。
  - 期望红灯原因：当前装饰区在所有宽度下均显示。
- [ ] 3.3 `PM-FE-HERO-S3`：断言 HeroCard 容器不含 `min-h-[280px]`。
  - 期望红灯原因：当前 L83 硬编码 `min-h-[280px]`。
- 运行：`pnpm -C apps/desktop test:run features/dashboard/HeroCard.responsive.guard`

## 4. Green（最小实现通过）

- [ ] 4.1 `DashboardPage.tsx` L101：装饰区 `w-[35%]` → `w-[35%] max-w-[280px] hidden lg:block` → S1 + S2 转绿
- [ ] 4.2 `DashboardPage.tsx` L83：容器 `min-h-[280px]` → `min-h-0`（或 clamp 方案） → S3 转绿
- [ ] 4.3 HeroCard 文字区确保 `flex-1 min-w-0`（防止文字被挤压）

## 5. Refactor（保持绿灯）

- [ ] 5.1 确认装饰区隐藏后文字区自动撑满（flex-1 行为正确）
- [ ] 5.2 确认 breakpoint 阈值（`lg` = 1024px）与需求（<=800px 隐藏）是否匹配，必要时改为 `md`（768px）

## 6. Evidence

- [ ] 6.1 记录 RUN_LOG：Red 阶段 3 个测试失败的输出
- [ ] 6.2 记录 RUN_LOG：Green 阶段全部通过的输出
- [ ] 6.3 记录 RUN_LOG：`pnpm -C apps/desktop test:run` 全量回归无新增失败
- [ ] 6.4 记录 Dependency Sync Check（N/A）
- [ ] 6.5 Main Session Audit（仅在 Apply 阶段需要）
