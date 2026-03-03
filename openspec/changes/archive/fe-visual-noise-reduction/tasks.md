## 1. Specification

更新时间：2026-02-28 19:20

- [x] 1.1 审阅并确认需求边界：逐区域审计并移除非功能性边框，以间距与排版为主分组手段。分隔线统一使用 `--color-separator`。不改功能逻辑。
- [x] 1.2 审阅并确认错误路径与边界路径：交互卡片（hover/focus 反馈）保留轻边框；纯装饰性边框移除。
- [x] 1.3 审阅并确认验收阈值与不可变契约：默认态不得出现多层 border 包裹；分隔线必须使用 `--color-separator` Token（不使用 `--color-border-default`）。
- [x] 1.4 依赖同步检查（Dependency Sync Check）：建议先行 `fe-rightpanel-ai-tabbar-layout`、`fe-rightpanel-ai-guidance-and-style`

### 1.5 预期实现触点

- `apps/desktop/renderer/src/styles/tokens.css`
  - `--color-separator` 已存在（L120/156），无需新增
- 高优先级区域（border 密度排序）：
  - `features/ai/`（55 处 border）：
    - AiPanel.tsx：请求区/错误卡片/候选卡片的多层 border → 移除非功能性，保留交互卡片 hover border
    - ChatHistory.tsx：消息气泡 border → 改为间距分组
  - `features/settings-dialog/`（21 处 border）：
    - SettingsGeneral.tsx / SettingsAccount.tsx：section border → 改为间距 + `--color-separator` 分隔线
  - `features/dashboard/`（10 处 border）：
    - DashboardPage.tsx：项目卡片默认态 border → 移除，hover 态保留轻反馈
- 分隔线替换：所有 `border-[var(--color-border-default)]` 用于纯分隔的 → `border-[var(--color-separator)]`

**为什么是这些触点**：ai/settings/dashboard 是 border 密度最高的三个区域，覆盖后视觉降噪效果最显著。

## 2. TDD Mapping（先测前提）

- [x] 2.1 将 delta spec 的每个 Scenario 映射为至少一个测试用例
- [x] 2.2 为每个测试标注对应 Scenario ID，建立可追踪关系
- [x] 2.3 设定门禁：未出现 Red（失败测试）不得进入实现

### Scenario → 测试映射

| Scenario ID | 测试文件（计划） | 测试名称（计划） | 断言要点 | Mock/依赖 | 运行命令 |
| ----------- | ---------------- | ---------------- | -------- | --------- | -------- |
| `WB-FE-VIS-S1` | `apps/desktop/renderer/src/features/__tests__/visual-noise-guard.test.ts` | `it('ai panel has no nested non-functional borders')` | 读取 AiPanel.tsx 源码，统计 `border` class 数量，断言不超过阈值（仅交互卡片保留） | `fs.readFileSync` | `pnpm -C apps/desktop test:run features/__tests__/visual-noise-guard` |
| `WB-FE-VIS-S2` | 同上 | `it('dashboard project cards have no default-state border')` | 读取 DashboardPage.tsx，断言项目卡片默认态无 `border`（hover 态可有） | `fs.readFileSync` | 同上 |
| `WB-FE-VIS-S3` | 同上 | `it('separator lines use --color-separator token')` | 扫描 ai/dashboard/settings 下 `.tsx`，断言分隔用途的 border 使用 `--color-separator` 而非 `--color-border-default` | `fs`/`glob` | 同上 |

### 可复用测试范本

- Token guard 测试：`apps/desktop/renderer/src/features/__tests__/`

## 3. Red（先写失败测试）

- [x] 3.1 `WB-FE-VIS-S1`：读取 AiPanel.tsx 源码，统计非交互 border class 数量，断言不超过阈值。
  - Red 确认：10 matches，阈值 5 → ❌ FAIL
- [x] 3.2 `WB-FE-VIS-S2`：读取 DashboardPage.tsx，匹配项目卡片区域，断言默认态无 border class。
  - Red 确认：8 matches，预期 0 → ❌ FAIL
- [x] 3.3 `WB-FE-VIS-S3`：扫描 ai/dashboard/settings 下 `.tsx`，找出分隔用途的 `--color-border-default`，断言为 0。
  - Red 确认：12 violations → ❌ FAIL
- 运行：`pnpm -C apps/desktop test:run features/__tests__/visual-noise-guard`

## 4. Green（最小实现通过）

- [x] 4.1 `features/ai/`：移除请求区/错误卡片/候选卡片的非功能性 border，保留交互卡片 hover border → S1 转绿
- [x] 4.2 `features/dashboard/DashboardPage.tsx`：项目卡片默认态移除 border，hover 态保留 → S2 转绿
- [x] 4.3 `features/settings-dialog/`：section border → 间距分组 + `--color-separator` 分隔线
- [x] 4.4 全局替换分隔用途的 `--color-border-default` → `--color-separator` → S3 转绿

## 5. Refactor（保持绿灯）

- [x] 5.1 确认移除 border 后间距足够表达层级（视觉回归检查）
- [x] 5.2 若 PanelContainer Composite 已就绪，将 panel 分隔样式收敛到 Composite 层（不适用，跳过）

## 6. Evidence

- [x] 6.1 记录 RUN_LOG：Red 阶段 guard 测试失败的输出
- [x] 6.2 记录 RUN_LOG：Green 阶段全部通过的输出
- [x] 6.3 记录 RUN_LOG：`pnpm -C apps/desktop test:run` 全量回归无新增失败
- [x] 6.4 记录 Dependency Sync Check：确认上游 change 状态
- [x] 6.5 Main Session Audit（仅在 Apply 阶段需要）
