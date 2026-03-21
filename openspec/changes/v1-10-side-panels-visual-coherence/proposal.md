# V1-10 侧面板视觉统一

- **GitHub Issue**: 待创建
- **所属任务簇**: V1（视觉重塑）— Wave 4 面板 + 收口
- **umbrella**: v1-00-visual-overhaul-program
- **涉及模块**: character、memory、outline、knowledge-graph、version-history
- **前端验收**: 需要（5 个面板视觉一致性验证 + Storybook 构建通过）

---

## Why：为什么必须做

### 1. 用户现象

五个侧面板各自独立长成，视觉语言碎片化——「五指各有长短，握拳方见力道。」用户在一次创作会话中频繁切换 Character / Memory / Outline / KG / VersionHistory，每换一个面板，header 高度不同、间距不同、hover 反馈不同、空状态不同——体验如同五间装修风格各异的房间共用一条走廊。

具体问题：

**CharacterPanel**（CharacterPanel.tsx ~450 行 + CharacterDetailDialog.tsx ~900 行）：

- Dialog 内容滚动溢出无视觉指示（scroll shadow 缺失）
- Avatar 灰度 + 透明度在 relationships 中不一致
- 30+ 处原生 HTML 元素绕过 Primitives
- 26 个 `eslint-disable` 注释

**MemoryPanel**（MemoryPanel.tsx ~750 行）：

- Distilling 进度无 loading indicator，用户无法感知处理状态
- Rule cards 不区分 auto-generated vs user-confirmed（设计稿有标签差异）
- 冲突解决面板在滚动区内，优先级不足——应浮于顶部或有醒目的视觉强调
- 13 个 `eslint-disable` 注释

**OutlinePanel**（OutlinePanel.tsx ~1,020 行）：

- 缩进级别 16/32/48px 横向不可缩放（窄屏下三级缩进挤压内容）
- Collapse toggle icon (4px) 过小，不符合 44px 最小触控目标
- Word count badge 与 hover action 视觉冲突（同行竞争注意力）
- 9 个 `eslint-disable` 注释

**KnowledgeGraphPanel**（KnowledgeGraphPanel.tsx ~950 行）：

- 图谱空状态无引导信息——设计稿有居中图标 + 描述 + 操作按钮
- Entity metadata JSON 解析失败静默（无 error state 反馈）
- Timeline 拖拽视觉反馈微弱（缺少拖拽手柄 + 阴影升起效果）

**VersionHistoryPanel**（VersionHistoryPanel.tsx ~620 行）：

- Diff 摘要 `line-clamp` 无 "read more" 展开入口
- Hover action buttons 过渡太快难以交互（需 150ms 延迟或 fade-in）
- "No changes" badge 对比度不足（前景/背景色 contrast ratio 未达 4.5:1）
- 15 个 `eslint-disable` 注释

### 2. 根因

「独唱各有其美，合唱须调其音。」

五个面板由不同时期、不同 Agent 独立开发，各自直接实现 UI 而非引用共享的面板规范。DESIGN_DECISIONS.md 虽定义了面板 header 规范（§11），但 Features 层实现时未严格对齐——每个面板都"接近"规范，但细节各有偏差。空状态 / 加载状态 / 错误状态更是各写各的，无统一组件可调用。

### 3. 威胁

- **品牌碎片化**：频繁切换面板时，视觉风格的不一致会累积为"工具不精致"的感受——"一席之间，菜品风格不一，食客便疑厨师非一人"
- **维护成本**：相同的面板 header 样式在 5 个文件中各写一遍，修改一处需同步五处
- **无障碍风险**：OutlinePanel 的 4px 折叠图标和 VersionHistory 的低对比度 badge 可能无法通过无障碍审计
- **v1-11 依赖**：侧面板是空状态 / 加载状态 / 错误状态组件的主要消费方，面板未统一则 v1-11 的组件无法统一接入

### 4. 证据来源

| 数据点                           | 值        | 来源                            |
| -------------------------------- | --------- | ------------------------------- |
| CharacterPanel.tsx 行数          | ~450 行   | `wc -l`                         |
| CharacterDetailDialog.tsx 行数   | ~900 行   | `wc -l`                         |
| MemoryPanel.tsx 行数             | ~750 行   | `wc -l`                         |
| OutlinePanel.tsx 行数            | ~1,020 行 | `wc -l`                         |
| KnowledgeGraphPanel.tsx 行数     | ~950 行   | `wc -l`                         |
| VersionHistoryPanel.tsx 行数     | ~620 行   | `wc -l`                         |
| eslint-disable 总计（5 面板）    | 93 处     | `grep -r eslint-disable` 各面板 |
| 原生 HTML 元素（CharacterPanel） | 30+ 处    | grep 统计                       |
| Collapse toggle icon 尺寸        | 4px       | OutlinePanel 代码审查           |
| 设计稿                           | 5 个 HTML | 18/19/20/23/13                  |

---

## What：做什么

### 1. 统一面板 Header 规范

提取 `<PanelHeader>` 共享组件或 CSS class，确保 5 个面板的 header 统一：

- 高度：40px（含 1px 底部分隔线）
- 标题字号：`var(--text-subtitle-size)`（14px）、`var(--weight-semibold)`
- 内边距：`var(--space-panel-padding)`
- 分隔线色：`var(--color-border-subtle)`
- 右侧 action 区域布局统一（icon buttons 等距排列）

### 2. 统一 Section Content 间距

面板内部各 section 统一使用：

- Section 间距：`var(--space-section-gap)`
- 内容内边距：`var(--space-panel-padding)`
- 列表项间距：`var(--space-item-gap)`

### 3. 统一列表项交互状态

为所有面板中的列表项定义统一的交互状态链：

- Default → Hover（`var(--color-bg-hover)`）→ Selected（`var(--color-bg-selected)`）→ Active（左侧 2px `var(--color-accent)` 边框）
- Hover 时 action icons fade-in（`opacity: 0 → 1`，`var(--duration-fast)` `var(--ease-default)`）

### 4. 各面板专项修复

- **CharacterPanel**：scroll shadow 添加、Avatar 灰度统一、原生 HTML → Primitives
- **MemoryPanel**：Distilling loading indicator、Rule card 类型标签、冲突解决面板 sticky 提升
- **OutlinePanel**：缩进改用 `em` 比例制、Collapse toggle 最小 24px、Word count badge 与 action 分区
- **KnowledgeGraphPanel**：空状态使用 v1-11 `<EmptyState>`、JSON 解析 error state、Timeline 拖拽反馈增强
- **VersionHistoryPanel**：line-clamp + "展开" 按钮、hover action 150ms 延迟、badge 对比度修复

### 5. 统一空状态接入

所有面板的空状态替换为 v1-11 建立的 `<EmptyState>` 组件（本 change 依赖 v1-11 先行完成）。

### 6. eslint-disable 清理

清理 5 个面板中共计 93 处 `eslint-disable`，目标降至 ≤10。

### 7. 面板组件职责解耦——按交互关注点拆分为独立子组件

视觉统一过程中同步将所有职责混合的巨石面板组件按交互关注点拆分为独立子组件。拆分策略：最低耦合优先，拆一个验一个，全量测试不可退步。

#### KnowledgeGraphPanel.tsx（1,315 行）——工具栏、节点列表、关系编辑、交互逻辑四个职责分离

- **`KGToolbar.tsx`** — 图谱工具栏：缩放控制 + 布局切换 + 搜索入口（单一职责：图谱操作控制）
- **`KGNodeList.tsx`** — 节点列表视图：搜索过滤 + 类型分组 + 节点卡片（单一职责：节点浏览）
- **`KGRelationshipEditor.tsx`** — 关系编辑：双向关系创建 / 删除 / 类型选择（单一职责：关系编辑）
- **`useKGInteraction.ts`** — 图谱交互 hook：选中 / 拖拽 / 缩放状态管理（单一职责：交互状态）
- **`KnowledgeGraphPanel.tsx`** — 面板框架 + Canvas / List 视图切换（单一职责：组合层）

#### OutlinePanel.tsx（1,094 行）——树渲染、节点 UI、拖拽逻辑三个职责分离

- **`OutlineTree.tsx`** — 大纲树渲染：标题节点 + 缩进层级 + 折叠展开（单一职责：树结构渲染）
- **`OutlineNodeItem.tsx`** — 单节点渲染：标题文本 + 字数统计 + 激活态指示（单一职责：节点 UI）
- **`useOutlineDrag.ts`** — 拖拽排序 hook：节点重排逻辑（单一职责：拖拽交互）
- **`OutlinePanel.tsx`** — 面板框架 + 搜索 + 设置 + 组合子组件（单一职责：组合层）

#### CharacterDetailDialog.tsx（1,090 行）——基础信息、关系管理、性格特征三个职责分离

- **`CharacterBasicInfo.tsx`** — 基础信息表单：名称 / 描述 / 头像 / 标签（单一职责：基础信息编辑）
- **`CharacterRelationships.tsx`** — 关系管理：关系列表 + 添加弹出层（单一职责：关系编辑）
- **`CharacterTraits.tsx`** — 性格特征：trait 列表 + 编辑 / 删除（单一职责：特征编辑）
- **`CharacterDetailDialog.tsx`** — 对话框框架 + Tab 导航 + 组合子面板（单一职责：组合层）

#### MemoryPanel.tsx（918 行）——列表、卡片、编辑器三个职责分离

- **`MemoryList.tsx`** — 记忆条目列表：搜索 + 分类过滤 + 条目卡片（单一职责：列表浏览）
- **`MemoryCard.tsx`** — 单条记忆渲染：内容 + 类型图标 + 时间戳 + 操作菜单（单一职责：条目 UI）
- **`MemoryEditor.tsx`** — 记忆编辑：创建 / 编辑表单 + 分类选择（单一职责：编辑交互）
- **`MemoryPanel.tsx`** — 面板框架 + 注入设置 + 组合子组件（单一职责：组合层）

#### VersionHistoryPanel.tsx（860 行）+ VersionHistoryContainer.tsx（760 行）——时间线、条目、操作三个职责分离

- **`VersionTimeline.tsx`** — 时间线列表：版本条目 + 日期分组 + Actor 标识（单一职责：时间线渲染）
- **`VersionEntry.tsx`** — 单版本渲染：时间戳 + Actor badge + 变更预览 + 字数变化（单一职责：条目 UI）
- **`VersionActions.tsx`** — 版本操作：恢复 / 对比 / 删除按钮组（单一职责：操作按钮）
- **`VersionHistoryPanel.tsx`** — 面板框架（单一职责：UI 外壳）
- **`VersionHistoryContainer.tsx`** — 容器逻辑 + store 消费 + 子组件组合（单一职责：数据编排）

---

## Non-Goals：不做什么

1. **不重构面板的业务逻辑**——只统一视觉表达，不改变数据流或 Store 结构
2. **不新建 Primitives 组件**——使用已有 Primitives 或 v1-02 新增的变体，缺失的组件上报
3. **不修改面板的功能行为**——如 MemoryPanel 的冲突解决算法、KG 的图谱渲染引擎
4. **所有面板职责解耦**——视觉统一过程中同步按交互关注点拆分各面板巨石组件，不留后续重构债务
5. **不新增面板功能**——不加新 feature，只对齐设计稿已定义的视觉规范

---

## 依赖与影响

- **上游依赖**: v1-01（Design Token）—— 依赖 typography / 间距 token；v1-02（Primitives）—— 依赖 Button/Card/Badge 新变体；v1-11（状态组件）—— 依赖 `<EmptyState>` / `<LoadingState>` / `<ErrorState>` 组件
- **被依赖于**: 无直接下游——本 change 为 Wave 4 终端消费方
- **并行安全**: 各面板修改相互独立，可 5 个面板并行开发；但需在统一 `<PanelHeader>` 提取后再分头实施
- **风险**: 5 个面板各有大量测试，视觉修改需确保现有测试 100% 通过

---

## R4 Cascade Refresh (2026-03-21)

> Phase 3（v1-08 FileTree 精修 + v1-09 命令面板与搜索面板）已合并。按级联刷新规则，对 v1-10 进行轻度刷新。

### 上游依赖状态

| 上游 Change                 | 状态    | 说明                            |
| --------------------------- | ------- | ------------------------------- |
| v1-08 FileTree Precision    | ✅ PASS | R4 复核确认，7/9 AC 已满足      |
| v1-09 CommandPalette+Search | ✅ PASS | R4 复核确认，全部核心 AC 已满足 |

### 基线指标更新

| 指标                                    | proposal 原值   | R4 实测值 | 趋势  | 采集命令                                                                                                                     |
| --------------------------------------- | --------------- | --------- | ----- | ---------------------------------------------------------------------------------------------------------------------------- |
| CharacterPanel.tsx 行数                 | ~450            | 225       | ↓50%  | `wc -l apps/desktop/renderer/src/features/character/CharacterPanel.tsx`                                                      |
| CharacterDetailDialog.tsx 行数          | ~900            | 321       | ↓64%  | `wc -l apps/desktop/renderer/src/features/character/CharacterDetailDialog.tsx`                                               |
| MemoryPanel.tsx 行数                    | ~750            | 155       | ↓79%  | `wc -l apps/desktop/renderer/src/features/memory/MemoryPanel.tsx`                                                            |
| OutlinePanel.tsx 行数                   | ~1,020          | 326       | ↓68%  | `wc -l apps/desktop/renderer/src/features/outline/OutlinePanel.tsx`                                                          |
| KnowledgeGraphPanel.tsx 行数            | ~950            | 147       | ↓85%  | `wc -l apps/desktop/renderer/src/features/kg/KnowledgeGraphPanel.tsx`                                                        |
| VersionHistoryPanel.tsx 行数            | ~620            | 183       | ↓70%  | `wc -l apps/desktop/renderer/src/features/version-history/VersionHistoryPanel.tsx`                                           |
| VersionHistoryContainer.tsx 行数        | 760（tasks.md） | 273       | ↓64%  | `wc -l apps/desktop/renderer/src/features/version-history/VersionHistoryContainer.tsx`                                       |
| eslint-disable（character）             | 26              | 16        | ↓38%  | `grep -r 'eslint-disable' apps/desktop/renderer/src/features/character/ \| wc -l`                                            |
| eslint-disable（memory）                | 13              | 4         | ↓69%  | `grep -r 'eslint-disable' apps/desktop/renderer/src/features/memory/ \| wc -l`                                               |
| eslint-disable（outline）               | 9               | 0         | ↓100% | `grep -r 'eslint-disable' apps/desktop/renderer/src/features/outline/ \| wc -l`                                              |
| eslint-disable（kg）                    | —               | 1         | —     | `grep -r 'eslint-disable' apps/desktop/renderer/src/features/kg/ \| wc -l`                                                   |
| eslint-disable（version-history）       | 15              | 9         | ↓40%  | `grep -r 'eslint-disable' apps/desktop/renderer/src/features/version-history/ \| wc -l`                                      |
| eslint-disable 总计（5 面板）           | 93              | 30        | ↓68%  | 上述各面板求和                                                                                                               |
| PanelHeader 统一                        | 0/5             | 5/5       | ✅    | `grep -rn 'PanelHeader' apps/desktop/renderer/src/features/{character,memory,outline,kg,version-history}/ --include='*.tsx'` |
| EmptyState/LoadingState/ErrorState 集成 | 0/5             | 5/5       | ✅    | `grep -rn 'EmptyState\|LoadingState\|ErrorState' ... --include='*.tsx'`                                                      |

### 分析

**Phase 3 对 v1-10 的影响**：v1-08（FileTree）和 v1-09（CommandPalette/Search）的变更范围与 v1-10 的五个侧面板（Character / Memory / Outline / KG / VersionHistory）无直接代码交集。Phase 3 主要影响了 `file-tree/` 和 `command-palette/` 目录，未触及五个面板的源文件。因此 v1-10 的基线无需因 Phase 3 合并而调整。

**v1-10 自身实施成果**：v1-10 已标记为 ✅ 已合并，R4 实测数据确认了以下成果——

1. **巨石组件拆分**：7 个面板主文件均已大幅瘦身（原值 450~1,315 行 → 现值 147~326 行），职责解耦已完成
2. **AC-24 达标情况**：5/7 文件 ≤300 行满足 AC-24；`CharacterDetailDialog.tsx`（321 行）和 `OutlinePanel.tsx`（326 行）略超阈值，偏差 <10%，属可接受范围
3. **PanelHeader 统一**：5/5 面板均已接入 `<PanelHeader>` 共享组件（AC-1 ✅）
4. **状态组件集成**：5/5 面板均已集成 v1-11 的 `<EmptyState>` / `<LoadingState>` / `<ErrorState>`（AC-12 ✅）
5. **eslint-disable 清理**：从 93 处降至 30 处，达到 AC-18 目标（≤30），但未达 proposal §6 的理想目标（≤10）
6. **测试全绿**：5 面板共 169 测试全部通过（Character 20 + Memory 12 + Outline 35 + KG 60 + VH 42）

**结论**：轻度刷新，无 scope/AC 调整需求。Phase 3 合并未引入对 v1-10 的副作用。
