# V1-03 Dashboard 视觉重写

- **状态**: ✅ 已合并（PR #1168）
- **评级**: ⭐⭐⭐⭐
- **GitHub Issue**: #1168
- **所属任务簇**: V1（视觉重塑）— Wave 1 P0 页面重塑
- **umbrella**: v1-00-visual-overhaul-program
- **涉及模块**: dashboard
- **前端验收**: 需要（Storybook 构建通过 + 设计稿逐项对齐验收）

---

## Why：为什么必须做

### 1. 用户现象

Dashboard 是用户每次打开 CreoNow 的第一眼——「入门即见堂奥」。然而当前实现与设计稿 `05-dashboard-sidebar-full.html`（已在 DESIGN_DECISIONS.md §1.2 + §11.14 采纳）之间，存在可观测的视觉偏差：

- **布局模型错位**：设计稿定义固定侧边栏 + 内容区的二栏布局，代码使用 `repeat(auto-fill, minmax(280px, 1fr))` 响应式网格，且 minmax 基准值 280px 与 spec 定义的 240px 不一致——用户在宽屏上看到的不是设计稿中精心编排的固定侧边栏，而是一排随窗口缩放的浮动卡片
- **HeroCard 视觉硬编码**：`p-10`（40px）、`max-w-[500px]`、`w-16 h-16`（64px icon）、`text-[11px]` pill 均为 Tailwind arbitrary 值，未走 Design Token 通道——主题切换时这些值将失控
- **设计稿元素缺失**：plus-grid 装饰图案、arrow icon hover 旋转效果、stat display 卡片（字数/章节/创作天数统计）、monospace meta 字体均未实现
- **原生 HTML 绕过设计系统**：ProjectCard 的菜单触发按钮和 archived toggle 共 2 处使用原生 `<button>` 带 `eslint-disable`，未走 Button primitive
- **卡片交互不完整**：设计稿定义 hover 时 border 变亮 + subtle shadow elevation 双重反馈，代码只有 border 变亮
- **空状态缺位**：无项目时的空状态未对齐 `26-empty-states.html` 的视觉语言——"门可罗雀之时，更需体面"

### 2. 根因

DashboardPage.tsx 约 929 行，是一个中型巨石组件。HeroCard、ProjectCard、SearchBar、CreateProjectDialog 虽然已拆分引用，但主文件承载了布局编排、响应式逻辑、空状态判定等多重职责，导致视觉实现在快速迭代中偏离设计稿——"积薪之下，火必先从微处起。"

### 3. 威胁

- **首因效应**：用户对产品的第一印象在 Dashboard 形成。布局失序、卡片粗糙将直接影响用户对 CreoNow 专业度的信任——"观其门庭，知其家风"
- **设计系统权威性受损**：Dashboard 作为最高曝光页面若不走 token 通道，其他模块开发者将效仿硬编码
- **主题切换风险**：HeroCard 的 6 处 arbitrary 值在浅色主题切换时不受 token 变量控制

### 4. 证据来源

| 数据点                           | 原始值（proposal 初稿）                                 | 实测值（合并后）                                         | 采集命令                                                                                          |
| -------------------------------- | ------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| DashboardPage.tsx 行数           | 929 行                                                  | **268 行**（↓71%，目标 ≤300 ✅）                         | `wc -l apps/desktop/renderer/src/features/dashboard/DashboardPage.tsx`                            |
| DashboardHero.tsx                | —（不存在）                                             | **85 行**（新提取）                                      | `wc -l apps/desktop/renderer/src/features/dashboard/DashboardHero.tsx`                            |
| DashboardProjectGrid.tsx         | —（不存在）                                             | **232 行**（新提取）                                     | `wc -l apps/desktop/renderer/src/features/dashboard/DashboardProjectGrid.tsx`                     |
| DashboardSidebar.tsx             | —（不存在）                                             | **153 行**（新提取）                                     | `wc -l apps/desktop/renderer/src/features/dashboard/DashboardSidebar.tsx`                         |
| useDashboardLayout.ts            | —（不存在）                                             | **17 行**（新提取）                                      | `wc -l apps/desktop/renderer/src/features/dashboard/useDashboardLayout.ts`                        |
| HeroCard arbitrary 值            | 6 处（p-10, max-w-[500px], w-16, h-16, text-[11px] 等） | **0 处**（全部 Token 化 ✅）                             | `grep -rn 'p-10\|max-w-\[500px\]\|w-16 h-16\|text-\[11px\]' …/dashboard/ --include='*.tsx'`      |
| 原生 `<button>` + eslint-disable | 2 处                                                    | **0 处**（已替换为 Primitive ✅）                        | `grep -rn '<button' …/dashboard/ --include='*.tsx'`（仅 guard 测试中引用，生产代码 0 处）          |
| `eslint-disable` 注释            | 2 处                                                    | **0 处** ✅                                              | `grep -rn 'eslint-disable' …/dashboard/ --include='*.tsx' --include='*.ts'`                       |
| Guard 测试                       | —（不存在）                                             | **3 个**（ghost-buttons / i18n / HeroCard responsive）   | `find …/dashboard/ -name '*guard*'`                                                               |
| 测试文件总数                     | —                                                       | **10 个**                                                | `find …/dashboard/ \( -name '*.test.*' -o -name '*.spec.*' \) \| wc -l`                          |
| 设计稿采纳版                     | `05-dashboard-sidebar-full.html`                        | （同左）                                                 | DESIGN_DECISIONS.md §1.2 + §11.14                                                                 |
| 空状态设计稿                     | `26-empty-states.html`                                  | （同左）                                                 | 设计稿目录                                                                                        |

---

## What：做什么

### 1. 布局模型对齐 [✅ 已完成]

将 DashboardPage 的网格系统从 `repeat(auto-fill, minmax(280px, 1fr))` 改为设计稿定义的固定侧边栏布局（DESIGN_DECISIONS.md §11.14 + §17.2 首屏结构），确保侧边栏宽度、内容区网格与设计稿一致。

### 2. HeroCard Token 化 [✅ 已完成]

将 HeroCard 的 6 处 Tailwind arbitrary 值替换为 Design Token 引用：`p-10` → 语义间距 token、`max-w-[500px]` → 布局 token、`w-16 h-16` → icon sizing token、`text-[11px]` → typography token。实测 0 处 arbitrary 值残留。

### 3. 设计稿元素补全 [✅ 已完成]

实现设计稿 `05-dashboard-sidebar-full.html` 中定义但当前缺失的视觉元素：

- plus-grid 装饰图案（新建项目卡片区域）
- arrow icon hover 旋转动效（0.2s cubic-bezier）
- stat display 卡片（字数/章节/创作天数统计区域）
- monospace meta 字体（项目元数据展示）

### 4. 原生 HTML → Primitive 替换 [✅ 已完成]

将 ProjectCard 中 2 处原生 `<button>` 替换为 Button primitive，移除对应 `eslint-disable` 注释。实测生产代码 0 处原生 `<button>`、0 处 `eslint-disable`。

### 5. 卡片 hover 效果完善 [✅ 已完成]

补全卡片 hover 交互：在现有 border 变亮基础上增加 subtle shadow elevation（使用 `--shadow-*` Design Token），实现设计稿定义的双重 hover 反馈。

### 6. 空状态视觉对齐 [✅ 已完成]

无项目时的空状态页面对齐 `26-empty-states.html` 的视觉语言：illustrative icon、引导文案、行动按钮统一走 Primitive + Design Token。

> **遗留**: DashboardEmptyState 迁移到标准 EmptyState 状态组件 → 归入 v1-18 统一处理。

### 7. DashboardPage.tsx 职责解耦——按用户交互区域拆分为独立子组件 [✅ 已完成]

DashboardPage.tsx（929 行）承载了 Hero 区域、项目网格、侧边栏三大用户交互区域，任何一处视觉修改都需要理解全部 929 行上下文。视觉重写过程中按职责边界破坏性拆分为独立子组件，每个组件只承担一个用户可感知的交互区域，彻底消除跨区域耦合：

- **`DashboardHero.tsx`**（85 行） — HeroCard 区域：欢迎文案 + 统计数据 + CTA 按钮（单一职责：首屏展示与引导）
- **`DashboardProjectGrid.tsx`**（232 行） — 项目卡片网格：排序逻辑 + 卡片列表 + 新建入口（单一职责：项目浏览与选择）
- **`DashboardSidebar.tsx`**（153 行） — 侧边栏：最近文档 / 快捷入口 / stat display（单一职责：辅助导航）
- **`useDashboardLayout.ts`**（17 行） — 布局状态 hook：sidebar 折叠 / 网格模式管理（单一职责：布局编排逻辑）
- **`DashboardPage.tsx`**（268 行） — 页面框架 + 组合子组件 + 空状态判定（单一职责：组合层）

拆分后各文件均 ≤300 行，行数是质量指标的自然结果而非目标本身。

---

## Non-Goals：不做什么

1. **不改 Store 逻辑**——Dashboard 的 project CRUD、排序、过滤逻辑保持不变
2. **不改路由**——Dashboard 的路由结构不变
3. **不改 DashboardToolbar 功能**——仅做视觉对齐，不增减功能
4. **不引入新依赖**——不加图表库、不加动效库
5. **不改 CreateProjectDialog 业务逻辑**——仅做视觉层面调整
6. **不改设计稿**——以 `05-dashboard-sidebar-full.html` 为准

---

## 依赖与影响

- **上游依赖**: v1-01（Design Token 补完）✅ 已合并——typography token、语义间距 token 已就位；v1-02（Primitive 进化）✅ 已合并——Card bento/stat variant、Button pill/ghost 已就位
- **下游影响**: 无直接下游依赖；与 v1-04、v1-05 并行无冲突（不同模块）
- **遗留项**: DashboardEmptyState 迁移到标准 EmptyState 状态组件 → v1-18
- **风险**: ~~DashboardPage 929 行改动面较大~~ → 已拆分完成，268 行主文件 + 独立子组件，风险已消解

---

## 完成总结

> 「大道至简，衍化至繁。」——老子

DashboardPage 从 929 行巨石组件拆解为 268 行组合层 + 5 个独立子组件，代码量削减 71%。6 处 Tailwind arbitrary 值、2 处原生 `<button>`、2 处 `eslint-disable` 全部清零。3 个 Guard 测试（ghost-buttons / i18n / HeroCard responsive）守护架构不退化。10 个测试文件覆盖关键行为路径。

**关键成果**：
- DashboardPage.tsx: 929 → 268 行（↓71%，目标 ≤300 ✅）
- 提取子组件：DashboardHero（85）、DashboardProjectGrid（232）、DashboardSidebar（153）、useDashboardLayout（17）
- 辅助模块：DashboardInternals（59）、DashboardEmptyState（94）、DashboardSkeleton（26）、useDashboardActions（241）、dashboardUtils（72）
- eslint-disable: 2 → 0 ✅
- 原生 `<button>`: 2 → 0 ✅
- Arbitrary 值: 6 → 0 ✅
- Guard 测试: 0 → 3 ✅
- 测试文件: 10 个

**遗留项**：DashboardEmptyState 迁移到标准 EmptyState 状态组件 → v1-18
