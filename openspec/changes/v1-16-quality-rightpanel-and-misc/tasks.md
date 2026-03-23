> ⚠️ 本 change 已拆分为 micro-changes: v1-16a, v1-16b。以下为历史记录。

# Tasks: V1-16 Quality 面板、右面板与杂项页面补完

- **GitHub Issue**: 待创建
- **分支**: `task/<N>-quality-rightpanel-and-misc`
- **Delta Spec**: `openspec/changes/v1-16-quality-rightpanel-and-misc/specs/`
- **状态**: 🟡 部分完成；未完成项已拆分为 `v1-16a-panelheader-rollout`（9 任务）、`v1-16b-quality-rightpanel-cleanup`（5 任务）

---

## 验收标准

### Part A: Quality 面板

| ID   | 标准                                                            | 对应 Scenario |
| ---- | --------------------------------------------------------------- | ------------- |
| AC-1 | `QualityGatesPanel.tsx` 从 967 行拆分为 4 文件，主文件 ≤ 200 行 | 架构          |
| AC-2 | QualityGatesPanel 使用 PanelHeader 组件（v1-10 产物）           | 视觉          |
| AC-3 | QualityResultCard 使用 Card + severity 色彩系统                 | 视觉          |
| AC-4 | `QualityPanel.tsx` 从 575 行拆分为 2 文件，主文件 ≤ 250 行      | 架构          |
| AC-5 | QualityPanel 使用 PanelHeader 组件                              | 视觉          |
| AC-6 | `InfoPanel.tsx` 对齐 Design Token + PanelHeader，≤ 250 行       | 视觉          |

### Part B: Diff 模块

| ID   | 标准                                                                                     | 对应 Scenario |
| ---- | ---------------------------------------------------------------------------------------- | ------------- |
| AC-7 | Diff 组件（7 文件）全部使用语义化 Design Token                                           | 视觉          |
| AC-8 | Diff 高亮与 v1-15 AiDiffModal 统一（`--color-success-subtle` / `--color-danger-subtle`） | 视觉          |
| AC-9 | DiffView 与 v1-10 VersionHistoryPanel 视觉连续                                           | 视觉          |

### Part C: 杂项页面

| ID    | 标准                                                                                   | 对应 Scenario |
| ----- | -------------------------------------------------------------------------------------- | ------------- |
| AC-10 | AnalyticsPage 使用 Card 组件展示指标 + Design Token                                    | 视觉          |
| AC-11 | ZenMode 编辑器居中 `max-width: 760px`（与 v1-04 一致）                                 | 视觉          |
| AC-12 | ZenModeStatus 底部悬浮栏使用 `--color-bg-elevated`                                     | 视觉          |
| AC-13 | ShortcutsPanel 使用 Design Token 标签色                                                | 视觉          |
| AC-14 | Settings 子组件（AiSettingsSection/JudgeSection/AppearanceSection）对齐 FormField 布局 | 视觉          |

### 全局

| ID    | 标准                                                         | 对应 Scenario |
| ----- | ------------------------------------------------------------ | ------------- |
| AC-15 | 所有新增样式使用语义化 Design Token，0 处新增 arbitrary 色值 | 全局          |
| AC-16 | 现有相关测试 100% 通过，0 个新增失败                         | 全局          |
| AC-17 | Storybook 可构建（`pnpm -C apps/desktop storybook:build`）   | 全局          |
| AC-18 | TypeScript 类型检查通过（`pnpm typecheck`）                  | 全局          |
| AC-19 | lint 无新增违规（`pnpm lint`）                               | 全局          |

---

## Phase 0: 准备

- [ ] 阅读 `AGENTS.md`
- [ ] 阅读 `design/DESIGN_DECISIONS.md` 相关章节
- [ ] 阅读所有目标文件全文（17 文件）
- [ ] 盘点现有测试文件
- [ ] 运行现有测试基线
- [ ] 确认 v1-01、v1-02、v1-10（PanelHeader）、v1-11（状态组件）已合并

---

## Part A: Quality 面板

### Phase 1A: Red（测试先行）

#### Task 1A.1: QualityGatesPanel 结构测试

**映射验收标准**: AC-1, AC-2, AC-3

- [ ] 测试：QualityGatesPanel 使用 PanelHeader 组件
- [ ] 测试：规则列表渲染（至少 1 条规则有启用/禁用 toggle）
- [ ] 测试：检查结果卡片有 severity 指示（error/warning/info）
- [ ] 测试：空规则态渲染 EmptyState 组件

**文件**: `apps/desktop/renderer/src/features/quality-gates/__tests__/QualityGatesPanel.test.tsx`（新建）

#### Task 1A.2: QualityPanel + InfoPanel 测试

**映射验收标准**: AC-4, AC-5, AC-6

- [ ] 测试：QualityPanel 使用 PanelHeader 组件
- [ ] 测试：质量指标卡片网格渲染
- [ ] 测试：InfoPanel 使用 PanelHeader 组件
- [ ] 测试：信息项 label 使用 muted 色调

**文件**: `apps/desktop/renderer/src/features/rightpanel/__tests__/QualityPanel.test.tsx`（新建）

### Phase 2A: Green（实现）

#### Task 2A.1: QualityGatesPanel 破坏性重构

**映射验收标准**: AC-1, AC-2, AC-3, AC-15

- [ ] 提取 `useQualityGates.ts`：检查状态管理 + 规则配置 hook，≤ 150 行
- [ ] 提取 `QualityRuleList.tsx`：规则列表渲染 + 启用/禁用切换 + 过滤，≤ 250 行
- [ ] 提取 `QualityResultCard.tsx`：单项检查结果卡片（severity + 位置 + 建议），≤ 200 行
- [ ] 精简 `QualityGatesPanel.tsx` 至 ≤ 200 行（面板框架 + PanelHeader + tab 切换）
- [ ] 使用 PanelHeader 组件（v1-10 产物）
- [ ] 结果卡片使用 Card + severity 色彩（`--color-danger` / `--color-warning` / `--color-info`）
- [ ] 规则切换使用 Toggle primitive

**文件**: `apps/desktop/renderer/src/features/quality-gates/`

#### Task 2A.2: QualityPanel 重构

**映射验收标准**: AC-4, AC-5, AC-15

- [ ] 提取 `QualityMetricsGrid.tsx`：指标卡片网格（可读性/一致性/结构），≤ 200 行
- [ ] 精简 `QualityPanel.tsx` 至 ≤ 250 行（面板框架 + PanelHeader + 评分概览）
- [ ] 使用 PanelHeader 组件
- [ ] 指标卡片使用 Card `variant="compact"`

**文件**: `apps/desktop/renderer/src/features/rightpanel/`

#### Task 2A.3: InfoPanel 视觉对齐

**映射验收标准**: AC-6, AC-15

- [ ] 使用 PanelHeader 组件
- [ ] section 间距 `--space-section-gap`
- [ ] 信息项使用 Text primitive + `--color-fg-muted` 标签
- [ ] 目标 ≤ 250 行

**文件**: `apps/desktop/renderer/src/features/rightpanel/InfoPanel.tsx`

---

## Part B: Diff 模块视觉统一

### Phase 1B: Red（测试先行）

#### Task 1B.1: Diff 视觉一致性测试

**映射验收标准**: AC-7, AC-8, AC-9

- [ ] 测试：DiffView 中添加行有 `--color-success-subtle` 背景
- [ ] 测试：DiffView 中删除行有 `--color-danger-subtle` 背景
- [ ] 测试：DiffHeader 版本选择器使用 Select primitive
- [ ] 测试：DiffViewPanel 使用 PanelHeader 组件

**文件**: `apps/desktop/renderer/src/features/diff/__tests__/DiffVisual.test.tsx`（新建）

### Phase 2B: Green（实现）

#### Task 2B.1: Diff 模块 Design Token 统一

**映射验收标准**: AC-7, AC-8, AC-9, AC-15

- [ ] `DiffView.tsx`（345）：diff 高亮 `--color-success-subtle` / `--color-danger-subtle`、行号 `--color-fg-muted`
- [ ] `DiffHeader.tsx`（260）：版本选择器使用 Select primitive、视图切换 Button
- [ ] `SplitDiffView.tsx`（244）：分栏间距 `--space-panel-padding`、分隔线 `--color-border-subtle`
- [ ] `DiffViewPanel.tsx`（210）：使用 PanelHeader 组件
- [ ] `DiffFooter.tsx`（144）：统计栏 `--color-fg-muted` 文字 + `--color-bg-elevated` 背景
- [ ] `MultiVersionCompare.tsx`（121）：版本选择器样式统一
- [ ] `VersionPane.tsx`（99）：容器边框 `--color-border-subtle`
- [ ] 与 v1-10 VersionHistoryPanel 的操作「查看差异」建立视觉连续性

**文件**: `apps/desktop/renderer/src/features/diff/`

---

## Part C: 杂项页面

### Phase 1C: Red（测试先行）

#### Task 1C.1: 杂项页面视觉测试

**映射验收标准**: AC-10, AC-11, AC-12, AC-13, AC-14

- [ ] 测试：AnalyticsPage 指标展示使用 Card 组件
- [ ] 测试：ZenMode 编辑器区域有 `max-width` 约束
- [ ] 测试：ZenModeStatus 有 `--color-bg-elevated` 背景
- [ ] 测试：Settings 子组件使用 FormField 布局

**文件**: 各模块 `__tests__/` 目录下新建

### Phase 2C: Green（实现）

#### Task 2C.1: AnalyticsPage 视觉重塑

**映射验收标准**: AC-10, AC-15

- [ ] 统计指标使用 Card `variant="compact"` 展示
- [ ] 页面标题使用 Heading primitive
- [ ] 趋势图容器使用 `--color-bg-elevated` 背景
- [ ] section 间距 `--space-section-gap`

**文件**: `apps/desktop/renderer/src/features/analytics/AnalyticsPage.tsx`

#### Task 2C.2: ZenMode 视觉重塑

**映射验收标准**: AC-11, AC-12, AC-15

- [ ] `ZenMode.tsx`：全屏布局 + 编辑器居中 `max-width: 760px`（与 v1-04 一致）
- [ ] 背景 `--color-bg-base`、最小化 chrome
- [ ] `ZenModeStatus.tsx`：底部悬浮栏 `--color-bg-elevated` + `--shadow-sm` + 半透明
- [ ] 退出按钮 Button `variant="ghost"` + `--color-fg-muted`
- [ ] 字数/时间使用 Text `variant="mono"` + `--color-fg-muted`

**文件**: `apps/desktop/renderer/src/features/zen-mode/`

#### Task 2C.3: ShortcutsPanel 视觉对齐

**映射验收标准**: AC-13, AC-15

- [ ] 快捷键分类使用 Heading `level="h3"`
- [ ] 快捷键组合使用 `rounded` pill 背景（`--color-bg-elevated`）
- [ ] 描述文字 `--color-fg-muted`

**文件**: `apps/desktop/renderer/src/features/shortcuts/ShortcutsPanel.tsx`

#### Task 2C.4: Settings 子组件对齐

**映射验收标准**: AC-14, AC-15

- [ ] `AiSettingsSection.tsx`（245）：FormField 布局、Select/Toggle primitive、section gap
- [ ] `JudgeSection.tsx`（133）：FormField 布局、Toggle primitive
- [ ] `AppearanceSection.tsx`（75）：FormField 布局
- [ ] 全部使用 `--space-section-gap` 统一间距

**文件**: `apps/desktop/renderer/src/features/settings/`

---

## Phase 3: Verification（验证）

- [ ] 运行 Phase 1A + 1B + 1C 全部测试，确认全绿
- [ ] 运行全量测试：`pnpm -C apps/desktop vitest run`
- [ ] 运行 `pnpm typecheck` 类型检查
- [ ] 运行 `pnpm lint` lint 检查
- [ ] 运行 `pnpm -C apps/desktop storybook:build` Storybook 构建
- [ ] 检查 0 新增 arbitrary 色值
- [ ] 用户路径走查：编辑器 → 质量门禁面板 → 查看检查结果
- [ ] 用户路径走查：版本历史 → 查看差异 → 分栏对比
- [ ] 用户路径走查：Cmd+Shift+Z → ZenMode → 退出
- [ ] PR 创建，含 `Closes #N`

---

## R4 Cascade Refresh (2026-03-21)

### 基线复核结果

#### Part A: Quality 面板 — 已完成拆分重构（偏差 >30%）

- **QualityGatesPanel.tsx**: 967 → **184 行**（-80.9%）✅ 已拆分
  - 提取文件：`QualityRuleList.tsx`（217 行）、`QualityCheckItems.tsx`（299 行）、`qualityGatesTypes.ts`（101 行）
  - 拆分方案与 proposal 略异：实际提取 `QualityCheckItems` 而非 `QualityResultCard`，职责一致
  - ⚠️ 未提取 `useQualityGates.ts` hook（proposal 计划文件）
  - ⚠️ **未采纳 PanelHeader 组件**（AC-2 未完成）
- **QualityPanel.tsx**: 575 → **238 行**（-58.6%）✅ 已拆分
  - 提取文件：`QualityPanelSections.tsx`（295 行）
  - ⚠️ **未采纳 PanelHeader 组件**（AC-5 未完成）
- **InfoPanel.tsx**: 301 → **266 行**（-11.6%）目标 ≤250，差 16 行
  - ✅ 已采纳 PanelHeader（AC-6 部分完成）

**任务影响**: AC-1/AC-4 行数拆分目标已达成。AC-2/AC-5 PanelHeader 采纳待实施。

#### Part B: Diff 模块 — 未变动（偏差 0%）

- 7 个文件行数与 proposal 基线完全一致，等待 v1-16 实施
- DiffView.tsx（345 行）为最大文件，未超标
- ⚠️ **PanelHeader 未采纳**（DiffViewPanel，AC-9 未完成）
- ⚠️ **pixel 残留严重**: `text-[10px]`/`text-[11px]`/`text-[13px]`/`underline-offset-[3px]` 等 15+ 处硬编码
- hardcoded hex 色值在生产代码中为 0 处（仅 stories 有 `#121212`）

#### Part C: 杂项页面 — 基本未变（偏差 <5%）

- AnalyticsPage.tsx: 197 行（不变）
- ZenMode.tsx: 226 行（不变）
- ZenModeStatus.tsx: 121 → **122 行**（+0.8%）
- ShortcutsPanel.tsx: 66 行（不变）
- AiSettingsSection.tsx: 245 → **243 行**（-0.8%）
- JudgeSection.tsx: 133 行（不变）
- AppearanceSection.tsx: 75 行（不变）

**任务影响**: proposal 基线有效，所有 AC 待实施。

### 测试基线

| 模块    | 文件数 | 用例数 | 状态        |
| ------- | ------ | ------ | ----------- |
| Quality | 2      | 32     | ✅ 全部通过 |
| Diff    | 8      | 59     | ✅ 全部通过 |

### pixel 残留盘点（EXECUTION_ORDER 提及）

| 文件                  | 残留类型                                                                                          | 数量  |
| --------------------- | ------------------------------------------------------------------------------------------------- | ----- |
| DiffView.tsx          | `text-[11px]`/`text-[13px]`/`underline-offset-[3px]`                                              | 5 处  |
| DiffHeader.tsx        | `text-[10px]`                                                                                     | 2 处  |
| SplitDiffView.tsx     | `text-[10px]`/`text-[11px]`/`text-[13px]`/`underline-offset-[3px]`                                | 6 处  |
| VersionPane.tsx       | `text-[10px]`                                                                                     | 1 处  |
| QualityRuleList.tsx   | `text-[11px]`/`text-[12px]`/`text-[13px]`/`left-[3px]`/`w-[18px]`/`h-[18px]`/`translate-x-[20px]` | 10 处 |
| QualityGatesPanel.tsx | `text-[13px]`/`text-[15px]`                                                                       | 2 处  |

> 合计 ~26 处 arbitrary pixel 值需在 v1-16 实施时替换为 Design Token 变量。

### 刷新结论

**轻度刷新**。Part A 行数拆分已完成（正向偏差），但 PanelHeader 采纳和 pixel 收口仍为未完成工作项。Part B/C 基线稳定，tasks 无需调整。

v1-16 实施优先级建议：

1. PanelHeader 采纳（QualityGatesPanel、QualityPanel、DiffViewPanel）
2. Diff 模块 pixel 残留系统性替换
3. InfoPanel 压缩至 ≤250 行
4. 杂项页面视觉对齐（按 proposal 执行）

---

## R5 Cascade Refresh (2026-03-21)

### 基线复核结果

#### Part A: Quality 面板 — 与 R4 完全一致（偏差 0%）

| 文件                       | R4 实测    | R5 实测    | R5-R4 偏差 | 采集命令                                                                       |
| -------------------------- | ---------- | ---------- | ---------- | ------------------------------------------------------------------------------ |
| `QualityGatesPanel.tsx`    | **184 行** | **184 行** | 0          | `wc -l apps/desktop/renderer/src/features/quality-gates/QualityGatesPanel.tsx` |
| `QualityRuleList.tsx`      | **217 行** | **217 行** | 0          | 同上                                                                           |
| `QualityCheckItems.tsx`    | **299 行** | **299 行** | 0          | 同上                                                                           |
| `qualityGatesTypes.ts`     | **101 行** | **101 行** | 0          | 同上                                                                           |
| `QualityPanel.tsx`         | **238 行** | **238 行** | 0          | `wc -l apps/desktop/renderer/src/features/rightpanel/QualityPanel.tsx`         |
| `QualityPanelSections.tsx` | **295 行** | **295 行** | 0          | 同上                                                                           |
| `InfoPanel.tsx`            | **266 行** | **266 行** | 0          | `wc -l apps/desktop/renderer/src/features/rightpanel/InfoPanel.tsx`            |

PanelHeader 采纳状态（与 R4 一致）：

| 组件              | 是否使用 PanelHeader | R5 状态 | 证据                                                 |
| ----------------- | -------------------- | ------- | ---------------------------------------------------- |
| QualityGatesPanel | ❌ 未采纳            | R5 确认 | `grep -rn PanelHeader quality-gates/` 无结果         |
| QualityPanel      | ❌ 未采纳            | R5 确认 | `grep -rn PanelHeader rightpanel/` 仅 InfoPanel 命中 |
| InfoPanel         | ✅ 已采纳            | R5 确认 | 第 7/243 行                                          |

#### Part B: Diff 模块 — 与 R4 完全一致（偏差 0%）

| 文件                      | R4 实测    | R5 实测    | R5-R4 偏差 |
| ------------------------- | ---------- | ---------- | ---------- |
| `DiffView.tsx`            | **345 行** | **345 行** | 0          |
| `DiffHeader.tsx`          | **260 行** | **260 行** | 0          |
| `SplitDiffView.tsx`       | **244 行** | **244 行** | 0          |
| `DiffViewPanel.tsx`       | **210 行** | **210 行** | 0          |
| `DiffFooter.tsx`          | **144 行** | **144 行** | 0          |
| `MultiVersionCompare.tsx` | **121 行** | **121 行** | 0          |
| `VersionPane.tsx`         | **99 行**  | **99 行**  | 0          |

PanelHeader：DiffViewPanel ❌ 未采纳（R5 确认，与 R4 一致）。

**Pixel 残留精细盘点**（R5 扩大采集范围，含 R4 遗漏的 QualityCheckItems + DiffFooter + MultiVersionCompare）：

| 文件                  | text-[Npx] 残留 | 其他 arbitrary 残留                             | 总计      |
| --------------------- | --------------- | ----------------------------------------------- | --------- |
| DiffView.tsx          | 3 处            | 2 处 underline-offset-[3px]                     | 5 处      |
| DiffHeader.tsx        | 2 处            | 0                                               | 2 处      |
| SplitDiffView.tsx     | 5 处            | 2 处 underline-offset-[3px]                     | 7 处      |
| DiffViewPanel.tsx     | 0               | 0                                               | 0 处      |
| DiffFooter.tsx        | 1 处            | 0                                               | 1 处      |
| MultiVersionCompare   | 1 处            | 0                                               | 1 处      |
| VersionPane.tsx       | 1 处            | 0                                               | 1 处      |
| QualityGatesPanel.tsx | 2 处            | 0                                               | 2 处      |
| QualityRuleList.tsx   | 6 处            | left-[3px] w-[18px] h-[18px] translate-x-[20px] | 10 处     |
| QualityCheckItems.tsx | 12 处           | 0                                               | 12 处     |
| **合计**              | **33**          | **9**                                           | **42 处** |

> R4 报告 ~26 处，R5 精细化后为 42 处——差异来自 R4 未统计 QualityCheckItems.tsx（12 处）、DiffFooter（1 处）、MultiVersionCompare（1 处）、SplitDiffView 多统计修正。无新增残留，仅采集范围扩大。

#### Part C: 杂项页面 — 与 R4 完全一致（偏差 0%）

| 文件                    | R4 实测    | R5 实测    | R5-R4 偏差 |
| ----------------------- | ---------- | ---------- | ---------- |
| `AnalyticsPage.tsx`     | **197 行** | **197 行** | 0          |
| `ZenMode.tsx`           | **226 行** | **226 行** | 0          |
| `ZenModeStatus.tsx`     | **122 行** | **122 行** | 0          |
| `ShortcutsPanel.tsx`    | **66 行**  | **66 行**  | 0          |
| `AiSettingsSection.tsx` | **243 行** | **243 行** | 0          |
| `JudgeSection.tsx`      | **133 行** | **133 行** | 0          |
| `AppearanceSection.tsx` | **75 行**  | **75 行**  | 0          |

### 测试基线

| 模块    | 文件数 | 用例数 | R4 状态     | R5 状态     | 偏差 |
| ------- | ------ | ------ | ----------- | ----------- | ---- |
| Quality | 2      | 32     | ✅ 全部通过 | ✅ 全部通过 | 无   |
| Diff    | 8      | 59     | ✅ 全部通过 | ✅ 全部通过 | 无   |

### AC 验证状态

| AC    | 描述                                        | R4 状态                                   | R5 状态                                       | 结论     |
| ----- | ------------------------------------------- | ----------------------------------------- | --------------------------------------------- | -------- |
| AC-1  | QualityGatesPanel 拆分 4 文件, 主文件 ≤200  | ✅ 184 行, 已拆分                         | ✅ R5 确认 (184 行, 4 文件)                   | 保持 ✅  |
| AC-2  | QualityGatesPanel 使用 PanelHeader          | ❌ 未采纳                                 | ❌ R5 确认未采纳                              | 保持 ❌  |
| AC-3  | QualityResultCard 使用 Card + severity 色彩 | 部分 — QualityCheckItems 有 severity 色彩 | 部分 — R5 确认 (4 种 severity 色彩 var)       | 保持部分 |
| AC-4  | QualityPanel 拆分 2 文件, 主文件 ≤250       | ✅ 238 行, 已拆分                         | ✅ R5 确认 (238 行, 2 文件)                   | 保持 ✅  |
| AC-5  | QualityPanel 使用 PanelHeader               | ❌ 未采纳                                 | ❌ R5 确认未采纳                              | 保持 ❌  |
| AC-6  | InfoPanel ≤250 行 + PanelHeader             | 部分 — 266 行 (差 16), PanelHeader ✅     | 部分 — R5 确认 (266 行, PanelHeader ✅)       | 保持部分 |
| AC-7  | Diff 7 文件全部使用语义化 Design Token      | ❌ 13 处 text-[Npx] 残留                  | ❌ R5 确认 13 处 (与 R4 一致)                 | 保持 ❌  |
| AC-8  | Diff 高亮统一 success-subtle/danger-subtle  | ❌ 待实施                                 | ❌ R5 确认待实施                              | 保持 ❌  |
| AC-9  | DiffView 与 VersionHistory 视觉连续         | ❌ DiffViewPanel 未用 PanelHeader         | ❌ R5 确认未采纳                              | 保持 ❌  |
| AC-10 | AnalyticsPage 使用 Card + Design Token      | ❌ 待实施                                 | ❌ R5 确认 (197 行, 未变动)                   | 保持 ❌  |
| AC-11 | ZenMode 居中 max-width 760px                | ❌ 待实施                                 | ❌ R5 确认 (226 行, 未变动)                   | 保持 ❌  |
| AC-12 | ZenModeStatus 使用 bg-elevated              | ❌ 待实施                                 | ❌ R5 确认 (122 行, 未变动)                   | 保持 ❌  |
| AC-13 | ShortcutsPanel Design Token 标签色          | ❌ 待实施                                 | ❌ R5 确认 (66 行, 未变动)                    | 保持 ❌  |
| AC-14 | Settings 子组件对齐 FormField               | ❌ 待实施                                 | ❌ R5 确认 (行数未变)                         | 保持 ❌  |
| AC-15 | 0 新增 arbitrary 色值                       | ❌ 42 处 pixel 残留                       | ❌ R5 确认 42 处 (R4 统计 ~26 因采集范围偏小) | 保持 ❌  |
| AC-16 | 现有测试 100% 通过                          | ✅ Quality 32, Diff 59                    | ✅ R5 确认 Quality 32, Diff 59                | 保持 ✅  |
| AC-17 | Storybook 可构建                            | — 待 v1-16 实施后验证                     | — 待 v1-16 实施后验证                         | 保持 —   |
| AC-18 | TypeScript 类型检查通过                     | — 待 v1-16 实施后验证                     | — 待 v1-16 实施后验证                         | 保持 —   |
| AC-19 | lint 无新增违规                             | — 待 v1-16 实施后验证                     | — 待 v1-16 实施后验证                         | 保持 —   |

### 刷新结论

**零偏差确认（PASS）**。R5 所有指标与 R4 完全一致，无回归、无新增问题。

- Part A/B/C 全部文件行数 R5-R4 偏差为 0
- PanelHeader 采纳状态无变化
- Pixel 残留 R5 精细化为 42 处（R4 的 ~26 因采集范围不含 QualityCheckItems 等文件），实际无新增
- 测试 Quality 32 pass / Diff 59 pass，与 R4 一致

v1-16 实施优先级建议（沿用 R4，无调整）：

1. PanelHeader 采纳（QualityGatesPanel、QualityPanel、DiffViewPanel）
2. Pixel 残留系统性替换（42 处 → 0）
3. InfoPanel 压缩至 ≤250 行（差 16 行）
4. 杂项页面视觉对齐（按 proposal 执行）

---

## R5 Cascade Refresh（级联刷新）

**触发**：R5 P4 复核（v1-11 / v1-10 全部 PASS）→ 上游基线确认
**日期**：2026-03-22

### 上游依赖状态

| 上游 Change      | R5 复核结论 | 关键指标                                                                  |
| ---------------- | ----------- | ------------------------------------------------------------------------- |
| v1-11 状态组件   | ✅ PASS     | EmptyState 241, LoadingState 337, ErrorState 537; 64 tests 全绿           |
| v1-10 侧面板统一 | ✅ PASS     | 侧面板行数无变化; PanelHeader 5/5 统一; eslint-disable 30; 169 tests 全绿 |

### 交叉引用实测

**v1-11 状态组件**：`grep -rn 'EmptyState\|LoadingState\|ErrorState' features/{quality-gates,rightpanel,diff}/` → **零命中**。v1-16 模块当前未引用 v1-11 的状态组件。

**v1-10 PanelHeader**：`grep -rn 'PanelHeader' features/{quality-gates,rightpanel,diff}/` → **仅 InfoPanel.tsx 命中**（L7 import, L243 使用）。采纳率 1/4。

| 面板              | PanelHeader 采纳 | v1-10 基线 | v1-16 待办 |
| ----------------- | ---------------- | ---------- | ---------- |
| QualityGatesPanel | ❌               | 5/5 统一   | AC-2       |
| QualityPanel      | ❌               | 5/5 统一   | AC-5       |
| InfoPanel         | ✅               | 5/5 统一   | —          |
| DiffViewPanel     | ❌               | 5/5 统一   | AC-9       |

### 对未完成 AC 的影响

| AC   | 上游依赖           | 影响评估                                              |
| ---- | ------------------ | ----------------------------------------------------- |
| AC-2 | v1-10 PanelHeader  | 上游 API 稳定（R5 PASS），可直接采纳                  |
| AC-5 | v1-10 PanelHeader  | 同上                                                  |
| AC-9 | v1-10 PanelHeader  | 同上，需同时建立与 VersionHistory 的视觉连续性        |
| AC-7 | v1-01 Design Token | 42 处 pixel 残留为 v1-16 内部问题，与上游无关         |
| AC-8 | v1-15 AiDiffModal  | diff 高亮色彩对齐，v1-15 已完成                       |
| 空态 | v1-11 状态组件     | Quality/Diff 面板实施时应引入 EmptyState 等，API 稳定 |

### 结论

**上游基线已锁定，v1-16 无级联风险。** v1-10 PanelHeader（5/5 统一）和 v1-11 状态组件（64 tests 全绿）均 R5 PASS、API 稳定。v1-16 的采纳差距（PanelHeader 1/4、状态组件 0/3）是自身待完成工作，不构成上游阻断。实施优先级建议无调整。
