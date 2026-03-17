# V1-16 Quality 面板、右面板与杂项页面补完

- **GitHub Issue**: 待创建
- **所属任务簇**: V1（视觉重塑）— Wave 5 全覆盖收口
- **涉及模块**: quality-gates、rightpanel、diff、analytics、zen-mode、shortcuts、settings（非 dialog）
- **前端验收**: 需要（Storybook Story + 视觉验收截图）

---

## Why：为什么必须做

### 1. 用户现象

V1 Wave 1-4 + v1-14/v1-15 覆盖了所有主要页面和 AI 组件。但以下 **用户可触达路径** 仍然是未翻新区域：

| 文件 | 行数 | 用户路径 | 说明 |
| --- | --- | --- | --- |
| QualityGatesPanel.tsx | 967 | 左侧面板 → 质量门禁 tab | 写作质量检查面板，功能面板 |
| QualityPanel.tsx | 575 | 右面板 → Quality tab | 右侧质量分析面板 |
| InfoPanel.tsx | 301 | 右面板 → Info tab | 右侧文档信息面板 |
| DiffView.tsx | 345 | 版本历史 → 查看差异 | 版本对比主视图 |
| DiffHeader.tsx | 260 | 同上 | 对比视图头部 |
| SplitDiffView.tsx | 244 | 同上 | 分栏对比视图 |
| DiffViewPanel.tsx | 210 | 同上 | 对比视图容器 |
| DiffFooter.tsx | 144 | 同上 | 对比视图底部 |
| MultiVersionCompare.tsx | 121 | 同上 | 多版本对比 |
| VersionPane.tsx | 99 | 同上 | 版本窗格 |
| AnalyticsPage.tsx | 197 | Dashboard → 统计 | 写作分析页 |
| ZenMode.tsx | 226 | Cmd+Shift+Z | 专注写作模式 |
| ZenModeStatus.tsx | 121 | 同上 | 专注模式状态栏 |
| ShortcutsPanel.tsx | 66 | Settings 或 ? | 快捷键面板 |
| AiSettingsSection.tsx | 245 | Settings → AI | AI 设置区域 |
| JudgeSection.tsx | 133 | Settings → Judge | Judge 设置区域 |
| AppearanceSection.tsx | 75 | Settings → 外观 | 外观设置区域 |

**总计 17 个文件，~4,329 行**——这是实现 100% 前端覆盖的最后一块拼图。

### 2. 根因

- Quality/rightpanel 模块功能相对独立，V1 初版按优先级排序时被归入"低优"
- Diff 模块文件虽多但单个不大（最大 345 行），看似"不紧急"。但从 v1-10（VersionHistory）出发，用户点「查看差异」就进入这些文件——**路径是连续的**
- Analytics/ZenMode/Shortcuts 是低频页面，但它们是用户能触达的——100% 覆盖不能留死角

---

## What：做什么

### Part A：Quality 面板重构

#### A.1 QualityGatesPanel 破坏性重构（967 → ≤ 250 行 × 4 文件）

QualityGatesPanel 包含：规则列表 + 检查结果 + 严重度统计 + 自定义规则编辑器。

**破坏性重构方案**：

| 提取文件 | 职责 | 目标行数 |
| --- | --- | --- |
| `QualityGatesPanel.tsx` | 面板框架 + PanelHeader + tab 切换 | ≤ 200 行 |
| `QualityRuleList.tsx` | 规则列表渲染 + 启用/禁用切换 + 过滤 | ≤ 250 行 |
| `QualityResultCard.tsx` | 单项检查结果卡片（severity + 位置 + 建议） | ≤ 200 行 |
| `useQualityGates.ts` | 检查状态管理 + 规则配置 hook | ≤ 150 行 |

#### A.2 QualityPanel 重构（575 → ≤ 250 行 × 2 文件）

右面板的 Quality tab，展示文档质量分析。

| 提取文件 | 职责 | 目标行数 |
| --- | --- | --- |
| `QualityPanel.tsx` | 面板框架 + 评分概览 | ≤ 250 行 |
| `QualityMetricsGrid.tsx` | 指标卡片网格（可读性/一致性/结构） | ≤ 200 行 |

#### A.3 InfoPanel 视觉对齐（301 → ≤ 250 行）

右面板 Info tab。行数接近阈值，主要做视觉对齐：
- section 间距 `--space-section-gap`
- 使用 PanelHeader 组件（v1-10 产物）
- 信息项使用 `Text` primitive + `--color-fg-muted` 标签

### Part B：Diff 模块视觉统一

Diff 模块 7 个文件共 1,423 行，单个文件都不大但风格需要与 v1-10（VersionHistory）统一。

**视觉统一方案**：
- `DiffView.tsx`（345）：header/content/footer 布局对齐 Design Token，diff 高亮使用 `--color-success-subtle` / `--color-danger-subtle`
- `DiffHeader.tsx`（260）：版本选择器样式 + 视图切换按钮
- `SplitDiffView.tsx`（244）：分栏对比区域的边框和间距
- `DiffViewPanel.tsx`（210）：容器面板对齐 PanelHeader
- `DiffFooter.tsx`（144）：底部统计栏样式
- `MultiVersionCompare.tsx`（121）：多版本选择器
- `VersionPane.tsx`（99）：版本窗格容器

所有文件使用 `--bg-hover`、`--bg-selected`、`--color-border-subtle` 统一交互态。与 v1-10 的 VersionHistoryPanel 建立视觉连续性。

### Part C：杂项页面视觉对齐

#### C.1 AnalyticsPage 视觉重塑（197 → ≤ 250 行）

写作分析页，展示统计图表和趋势。对齐 Design Token + 使用 Card 组件展示指标。

#### C.2 ZenMode 视觉重塑（226 + 121 = 347 行）

专注写作模式——全屏沉浸式编辑界面。
- `ZenMode.tsx`：全屏布局 + 编辑器居中（`max-width: 760px`，与 v1-04 编辑器一致）
- `ZenModeStatus.tsx`：底部悬浮状态栏（字数/时间/退出按钮）
- 视觉：纯黑背景 `--color-bg-base`、最小化 chrome、退出按钮 ghost style

#### C.3 ShortcutsPanel 视觉对齐（66 行）

快捷键面板，行数很小，仅做 Design Token 对齐 + 使用 `--color-fg-muted` 标签色。

#### C.4 Settings 子组件对齐（245 + 133 + 75 = 453 行）

位于 `features/settings/` 的独立 section 组件（非 dialog shell）：
- `AiSettingsSection.tsx`（245）：AI 提供商配置、模型选择
- `JudgeSection.tsx`（133）：Judge 评估设置
- `AppearanceSection.tsx`（75）：外观设置入口
- 全部对齐 FormField 布局 + Toggle/Select/Radio primitive + `--space-section-gap`

---

## Non-Goals（不做什么）

1. 不改变任何功能逻辑——纯视觉 + 结构重构
2. 不引入新页面或路由
3. 不修改 Store / Service / IPC
4. Diff 模块不改 diff 算法——仅改 diff 的 UI 渲染

---

## Dependencies

- v1-01（Design Token）：全部 spacing/typography token
- v1-02（Primitive 进化）：Card/Tabs/Badge/Button/Toggle/Radio/Select
- v1-10（侧面板统一）：PanelHeader 组件、`--space-section-gap` 使用规范
- v1-11（状态组件）：EmptyState / LoadingState / ErrorState

---

## Risks

| 风险 | 缓解 |
| --- | --- |
| QualityGatesPanel 拆分可能影响规则检查功能 | 逻辑提取到 useQualityGates hook，UI 层仅渲染 |
| Diff 模块文件虽小但文件多（7 个），改动面广 | 先统一 Design Token 引用，再逐文件微调 |
| 低频页面（Analytics/ZenMode）投入回报低 | 这些页面改动量小（总共 ~550 行），视觉对齐即可，不做深度重构 |
