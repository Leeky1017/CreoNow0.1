# V1-09 命令面板与搜索面板 视觉精修

- **GitHub Issue**: 待创建
- **所属任务簇**: V1（视觉重塑）— Wave 3 Overlay 精修
- **umbrella**: v1-00-visual-overhaul-program
- **涉及模块**: commandPalette、search
- **前端验收**: 需要（视觉对齐设计稿 `17-command-palette.html` + `25-search-panel.html` + Storybook 构建通过）

---

## Why：为什么必须做

### 1. 用户现象

命令面板与搜索面板是创作者调度全局操作的两把钥匙——「令由上出，搜从心发。」一个掌管命令调度，一个掌管知识检索，两者皆为 overlay 形态的高频交互入口。然功能虽全，与设计稿逐像素比对后，发现两个面板各存在多处视觉精度缺口。

**CommandPalette（~730 行）的偏差：**

- **分组分隔线缺失**：设计稿 `17-command-palette.html` 各命令组之间有可见的 section header（10px uppercase muted 文字）+ 视觉分隔线，当前分组界限不够清晰——列表浑然一体，用户不知「导航」结束、「AI」开始
- **Active 状态缺左蓝线**：设计稿选中项有左侧 2px 蓝色 accent 边框（`border-left: 2px solid #3b82f6`）+ 背景色变化，当前可能只有背景高亮——「有面而无棱，虽亮而不锐」
- **快捷键标签缺失/不够明显**：设计稿每个命令项右侧显示快捷键（11px、grey 背景 pill `px-1.5 py-0.5 rounded bg-[#2a2a2a]`），当前可能缺少或样式不对
- **分类图标颜色缺差异化**：设计稿不同命令类别用 color-coded 图标（蓝=导航 `--color-info`、AI `--color-accent`、绿=文件 `--color-success`、黄=编辑器 `--color-warning`），当前可能使用单色 `--color-fg-muted`
- **35 个 inline style 对象**：部分分布在 stories 中，但生产代码中也有 inline style 对象——需逐一迁移为 Tailwind className

**SearchPanel（~900 行 + ~950 行 stories）的偏差：**

- **Filter pills 样式不对齐**：设计稿 `25-search-panel.html` 有 All/Documents/Memories/Knowledge/Assets 分类标签页，active 标签有 shadow（`--shadow-sm`）+ 蓝色文字指示，当前样式可能缺少 shadow 和 active 指示效果
- **Match highlight 颜色待验证**：设计稿用 `rgba(59, 130, 246, 0.2)` 蓝色背景高亮匹配词，需验证 `var(--color-info-subtle)` 的实际值是否对应
- **Toggle controls 样式不对齐**：「Semantic search」、「Include archived」toggle 需对齐设计稿 toggle 规范（`34-component-primitives.html`），验证尺寸、色彩、动效
- **结果项蓝色指示条过细**：设计稿选中结果左侧有 thick border 指示，当前 `w-0.5`（2px）可能太细（设计稿可能为 3-4px），需比对精确值

### 2. 根因

「器成于匠手，精在毫厘间。」

两个组件功能实现完善，问题在于 overlay 组件的视觉细节——分组层次、active 状态指示、快捷键展示、颜色编码——这些「信息密度增强」的视觉元素在开发过程中被简化或跳过：

- **CommandPalette**（~730 行）：命令列表渲染逻辑完整，但分组 header 和 active 左边框属于纯视觉增强，开发期聚焦功能而延后
- **SearchPanel**（~900 行）：搜索结果渲染、filter 切换、semantic search toggle 功能完备，但 filter pills 的 active shadow、match highlight 精确颜色、左侧指示条宽度属于像素级调优
- **Inline style 问题**：部分组件在早期迭代中使用 inline style 对象快速原型，未迁移为 Tailwind className

### 3. 威胁

- **命令可发现性降低**：无分组分隔线和分类颜色编码，用户在 30+ 条命令列表中靠滚动查找——「大海捞针不如分门别类」
- **快捷键学习受阻**：命令面板是用户发现快捷键的最佳场所，不展示快捷键标签则用户永远停留在"鼠标点击命令"的低效阶段
- **搜索结果定位模糊**：filter pills 无 active 指示 + match highlight 颜色不准 + 选中结果指示条太细——用户在搜索结果中"迷路"
- **设计系统一致性**：inline style 绕过 Design Token 体系，增加主题切换时的遗漏风险

### 4. 证据来源

| 数据点                     | 值                                                                 | 来源                                                    |
| -------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------- |
| CommandPalette.tsx 行数    | ~730 行                                                            | `wc -l`                                                 |
| SearchPanel.tsx 行数       | ~900 行                                                            | `wc -l`                                                 |
| SearchPanel stories 行数   | ~950 行                                                            | `wc -l`                                                 |
| Inline style 对象总数      | ~35 处                                                             | `grep -c 'style={{' CommandPalette.tsx SearchPanel.tsx` |
| 命令组分隔设计             | 10px uppercase muted header + 分隔线                               | `17-command-palette.html`                               |
| Active 左蓝线              | `border-left: 2px solid #3b82f6`                                   | `17-command-palette.html`                               |
| 快捷键标签样式             | 11px、`#2a2a2a` 背景 pill                                          | `17-command-palette.html`                               |
| 分类图标颜色               | 蓝=导航、紫=AI、绿=文件、黄=编辑器                                 | `17-command-palette.html`                               |
| Filter pills active shadow | `--shadow-sm` + 蓝色文字                                           | `25-search-panel.html`                                  |
| Match highlight 色         | `rgba(59, 130, 246, 0.2)`                                          | `25-search-panel.html`                                  |
| 选中结果左侧指示条         | 当前 `w-0.5`（2px），设计稿可能 3-4px                              | `25-search-panel.html`                                  |
| DESIGN_DECISIONS.md        | §11.4（CommandPalette）、§11.9（SearchPanel）、§21（搜索面板规范） | 设计文档                                                |

---

## What：做什么

### CommandPalette 部分

#### 1. 命令组分组分隔线

在各命令组之间增加 section header：10px uppercase `--color-fg-muted` 文字 + 底部 1px `--color-border-default` 分隔线。分组标题如「导航」「AI」「文件」「编辑器」。

#### 2. Active 状态左蓝线

选中命令项增加左侧 2px `--color-info` accent 边框（`border-l-2 border-[var(--color-info)]`），与背景色变化叠加。

#### 3. 快捷键标签展示

每个有快捷键的命令项右侧增加 shortcut pill：11px 字号、`--color-fg-muted` 文字、`#2a2a2a` 背景 rounded pill（`px-1.5 py-0.5 rounded text-[11px]`）。使用 `--color-bg-elevated` 或对应 token 替代硬编码背景色。

#### 4. 分类图标颜色编码

建立命令类别→图标颜色映射，至少覆盖 4 类：导航=`--color-info`（蓝）、AI=`--color-accent`、文件=`--color-success`（绿）、编辑器=`--color-warning`（黄）。

#### 5. Inline Style 迁移

将生产代码中的 inline style 对象迁移为 Tailwind className（stories 中的 inline style 可在后续统一处理）。

### SearchPanel 部分

#### 6. Filter Pills Active 样式

Active filter pill 增加 `--shadow-sm` box-shadow + 蓝色文字（`text-[var(--color-info)]`）或底部指示线，与非 active pill 形成明确视觉区分。

#### 7. Match Highlight 颜色验证与对齐

验证 `var(--color-info-subtle)` 的实际值是否为 `rgba(59, 130, 246, 0.2)`。如不匹配，调整 token 值或使用精确值。

#### 8. Toggle Controls 样式对齐

验证「Semantic search」「Include archived」toggle 是否对齐 `34-component-primitives.html` 设计稿。确认尺寸（高度 20px / 宽度 36px）、圆角（`rounded-full`）、动效（0.2s transition）。

#### 9. 选中结果指示条宽度调整

验证设计稿中左侧指示条的精确宽度。如设计稿为 3px，将当前 `w-0.5`（2px）调整为 `w-[3px]`，使用 `--color-info` token。

### 10. 组件职责解耦——按交互关注点拆分

视觉精修过程中同步将两个职责混合的巨石组件按交互关注点拆分为独立子组件：

#### CommandPalette.tsx（793 行）——分组渲染、条目渲染、搜索逻辑三个职责分离

- **`CommandGroup.tsx`** — 命令分组渲染：分组标题 + 分隔线 + 组内条目列表（单一职责：分组 UI）
- **`CommandItem.tsx`** — 单条命令渲染：图标（分类颜色）+ 名称 + 快捷键标签 + active 态左侧 accent 线（单一职责：条目 UI）
- **`useCommandSearch.ts`** — 命令搜索/过滤/键盘导航 hook（单一职责：搜索交互逻辑）
- **`CommandPalette.tsx`** — 对话框框架 + 搜索输入 + 组合子组件（单一职责：组合层）

#### SearchPanel.tsx（994 行）——结果列表、过滤器、单条结果三个职责分离

- **`SearchResultList.tsx`** — 搜索结果列表渲染 + 匹配文本高亮（mark 标签）（单一职责：结果展示）
- **`SearchFilters.tsx`** — filter pills + 文件类型/范围筛选器（单一职责：筛选交互）
- **`SearchResultItem.tsx`** — 单条结果渲染：文件路径 + 匹配上下文 + 相关度图标（单一职责：条目 UI）
- **`SearchPanel.tsx`** — 面板框架 + 搜索输入 + 组合子组件（单一职责：组合层）

拆分原则：最低耦合优先，拆一个验一个。

---

## Non-Goals：不做什么

1. **不修改命令注册逻辑**——只改视觉展示，不改命令的注册、过滤、执行逻辑
2. **不新增搜索功能**——只对齐现有搜索结果的视觉精度，不新增搜索类型或过滤器
3. **CommandPalette 和 SearchPanel 职责解耦**——视觉精修过程中按交互关注点拆解。CommandPalette 提取 `CommandGroup.tsx`（分组渲染 + 分隔线）、`CommandItem.tsx`（条目 + 快捷键标签 + 分类图标）；SearchPanel 提取 `SearchResultList.tsx`（结果列表 + 高亮渲染）、`SearchFilters.tsx`（filter pills + 文件类型筛选器）
4. **不迁移 stories 中的 inline style**——本 change 只处理生产代码中的 inline style，stories 可在独立任务中统一处理
5. **不修改快捷键绑定**——只展示已定义的快捷键，不修改或新增快捷键绑定
6. **不修改 DESIGN_DECISIONS.md**——设计决策文档由 Owner 维护

---

## 依赖与影响

- **上游依赖**: v1-01（Design Token 补完）——需要 `--color-info`、`--color-accent`、`--color-success`、`--color-warning`、`--color-info-subtle`、`--shadow-sm` 等 token 可用；v1-02（Primitive 进化）——Toggle 组件增强需已合并
- **被依赖于**: 无直接下游——本 change 是终端叶子节点
- **并行安全**: CommandPalette 和 SearchPanel 与其他 v1 change 无文件交叉，可并行开发；两个组件之间也可拆为独立 PR 串行提交
- **风险**: CommandPalette 的分组逻辑修改可能涉及列表渲染结构调整，需谨慎处理键盘导航（↑/↓ 箭头）在分组 header 上的跳过逻辑

---

## R3 Cascade Refresh (2026-03-21)

### 上游依赖状态

| 上游 Change                  | 状态    | 说明                                                                       |
| ---------------------------- | ------- | -------------------------------------------------------------------------- |
| v1-06 AI Panel Overhaul      | ✅ PASS | AiPanel 281行, TabBar 50, MessageList 432, InputArea 293, 27测试文件全通过 |
| v1-07 Settings Visual Polish | ✅ PASS | SettingsDialog 297行, AppearancePage 249, Navigation 103, 91测试全通过     |

### 基线指标更新

| 指标                         | proposal 原值         | R3 实测值                  | 趋势                      | 采集命令                                                                |
| ---------------------------- | --------------------- | -------------------------- | ------------------------- | ----------------------------------------------------------------------- |
| CommandPalette.tsx 行数      | ~730                  | **283**                    | ⬇️ 大幅下降（已完成拆分） | `wc -l .../commandPalette/CommandPalette.tsx`                           |
| CommandPalette inline styles | ~35（含 SearchPanel） | **0**                      | ⬇️ 已清零                 | `grep -cn 'style={{' .../CommandPalette.tsx`                            |
| CommandPalette 模块总行数    | —                     | **3,170**                  | 📊 首次采集               | `find .../commandPalette/ -name '*.tsx' -o -name '*.ts' \| xargs wc -l` |
| CommandPaletteFooter.tsx     | —                     | **38**                     | 📊 拆分产物               | `wc -l .../CommandPaletteFooter.tsx`                                    |
| commandPaletteCommands.tsx   | —                     | **231**                    | 📊 拆分产物               | `wc -l .../commandPaletteCommands.tsx`                                  |
| commandPaletteHelpers.tsx    | —                     | **95**                     | 📊 拆分产物               | `wc -l .../commandPaletteHelpers.tsx`                                   |
| fuzzyMatch.ts                | —                     | **160**                    | 📊 拆分产物               | `wc -l .../fuzzyMatch.ts`                                               |
| CommandPalette 测试          | —                     | **5 文件 / 57 测试全通过** | ✅                        | `npx vitest run --reporter=verbose CommandPalette`                      |
| SearchPanel.tsx 行数         | ~900                  | **294**                    | ⬇️ 大幅下降（已完成拆分） | `wc -l .../search/SearchPanel.tsx`                                      |
| SearchPanel inline styles    | —                     | **0**                      | ⬇️ 已清零                 | `grep -cn 'style={{' .../SearchPanel.tsx`                               |
| SearchPanel 模块总行数       | —                     | **2,807**                  | 📊 首次采集               | `find .../search/ -name '*.tsx' -o -name '*.ts' \| xargs wc -l`         |
| SearchPanelParts.tsx         | —                     | **175**                    | 📊 拆分产物               | `wc -l .../SearchPanelParts.tsx`                                        |
| SearchResultItems.tsx        | —                     | **245**                    | 📊 拆分产物               | `wc -l .../SearchResultItems.tsx`                                       |
| SearchResultsArea.tsx        | —                     | **180**                    | 📊 拆分产物               | `wc -l .../SearchResultsArea.tsx`                                       |
| SearchPanel 测试             | —                     | **9 文件 / 30 测试全通过** | ✅                        | `npx vitest run --reporter=verbose SearchPanel`                         |

### 分析

CommandPalette.tsx 已从 ~730 行拆分至 **283 行**，SearchPanel.tsx 从 ~900 行拆分至 **294 行**，均接近 AC-16/AC-17 的 ≤300 行目标。inline style 已全部清零（原值 ~35 处）。

**已完成部分**：组件解耦拆分、inline style 迁移。
**剩余工作聚焦**：视觉精修——CommandPalette 的分组分隔线、active 左蓝线、快捷键 pill、分类图标颜色；SearchPanel 的 filter pills active 样式、match highlight 颜色、toggle 对齐、指示条宽度。
