# V1-24 Component Library Expansion

> 📋 **级联刷新 R1**（2026-03-21）：v1-02 完成后建档。基线已采集。

- **状态**: 📋 已建档（待实施）
- **所属任务簇**: V1（视觉重塑）— Phase 9 组件库扩展
- **涉及模块**: primitives（Table / Separator / Alert / SegmentedControl / Progress / Input 增强）
- **前端验收**: 需要（Storybook Story + 视觉验收截图）
- **预估工作量**: 1.5× v1-02

---

## Why：为什么必须做

### 1. 用户现象

v1-02 完成后，Primitives 层拥有 29 个组件文件、4452 行源码（不含测试和 Story），覆盖了基础表单控件（Button/Input/Select/Radio/Checkbox）、布局（Card/ListItem/ScrollArea）、排版（Text/Heading）、反馈（Dialog/Toast/Tooltip/Spinner）等基础积木。然而，当 Wave 1-4 的 Features 层组件要向设计稿对齐时，将发现"地基已固，但砖瓦仍缺"：

- **Dashboard 列表页**（`04-dashboard-list-progress.html`）使用 Table/DataTable 展示项目列表（列排序、行选中、分页），当前无 Table primitive——Features 层将不得不各自实现表格布局
- **面板/侧边栏分割**（`design/DESIGN_DECISIONS.md` §P0）要求使用 `--color-separator` 的 1px 分割线，但当前无 Separator primitive——各 Feature 直接写 `<div className="border-b border-[var(--color-separator)]" />`，样式散落
- **AI 面板/编辑器**（`14-ai-panel.html`、`20-memory-panel.html`）使用 Alert/Banner 组件展示状态通知（info/warning/error/success），当前无 Alert primitive——通知样式将与 Toast 混用或自建
- **Settings 外观切换**（`20-settings-appearance.html`）使用 SegmentedControl（分段切换器）选择主题模式（浅色/深色/系统），当前只能用 Tabs 或 Radio 近似——语义和交互模式均不匹配
- **Dashboard 进度展示**（`04-dashboard-list-progress.html`）使用确定性进度条显示创作完成度，当前 Spinner 仅支持不确定性旋转——缺少线性 Progress bar
- **搜索输入框**（`05-file-tree.html`、`14-ai-panel.html`）需要前缀图标（🔍）和后缀清除按钮（×），当前 Input（85 行）无 prefix/suffix slot 支持——Features 层将各自包装 wrapper

如果不在 Phase 9 补齐这些组件，Wave 1-4 的每个 Feature 都将自行实现——"千里之堤，溃于蚁穴。"

### 2. 根因

v1-02 聚焦于现有 7 个 Primitives 的 variant 扩展和结构重构，未新增组件类型。设计稿在 v1-02 之后继续演进，部分 UI 模式超出了当前 Primitives 的覆盖范围。具体差距：

| 组件                | 当前状态     | 设计稿需要                                                         | 缺口                           |
| ------------------- | ------------ | ------------------------------------------------------------------ | ------------------------------ |
| Table/DataTable     | 不存在       | 列定义 + 排序 + 行选中 + 分页 + 空态 + 加载态                      | 新建 Table + DataTable         |
| Separator           | 不存在       | 水平/垂直 1px 分割线，颜色 `--color-separator`                     | 新建 Separator                 |
| Alert/Banner        | 不存在       | info/warning/error/success 四种 variant + icon + 可关闭            | 新建 Alert                     |
| SegmentedControl    | 不存在       | 单选分段切换，≤ 5 选项，active indicator 动效                      | 新建 SegmentedControl          |
| Progress            | 仅有 Spinner | 确定性线性进度条 + 标签 + variant（default/success/warning/error） | 新建 Progress                  |
| Input prefix/suffix | 无 slot 支持 | 前缀（icon/text）+ 后缀（icon/button）slot，不改变 Input 核心行为  | 增强 Input，新增 prefix/suffix |

### 3. 威胁

- **重复实现**：Table、Alert、SegmentedControl 等在 Features 层已有零散的自建实现迹象（ErrorState 中的 alert 样式、ToolbarGroup 中的 separator 逻辑），若不统一将产生 N 个不兼容版本
- **主题不一致**：自建组件无法保证通过 Design Token 统一着色，暗/浅色主题切换时将出现不协调
- **compound pattern 缺失**：Table 和 SegmentedControl 需要 compound component pattern（Root + 子组件），若不在 Primitives 层建立范式，Features 层各自实现的 compound pattern 将不统一
- **可访问性盲区**：Table（aria-sort/aria-selected）、Alert（role="alert"）、Progress（role="progressbar" + aria-valuenow）等需要特定 ARIA 语义，自建实现极易遗漏

### 4. 证据来源（基线采集）

| 数据点                | 基线值                  | 采集命令                                                                                                                                                  |
| --------------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 原始组件文件数        | 29 个                   | `find apps/desktop/renderer/src/components/primitives -maxdepth 1 -name '*.tsx' ! -name '*.test.*' ! -name '*.stories.*' ! -name '*.behavior.*' \| wc -l` |
| 原始总行数            | 4452 行                 | `find apps/desktop/renderer/src/components/primitives -name '*.tsx' ! -name '*.test.*' ! -name '*.stories.*' -exec wc -l {} + \| tail -1`                 |
| Input.tsx 行数        | 85 行                   | `wc -l apps/desktop/renderer/src/components/primitives/Input.tsx`                                                                                         |
| Spinner.tsx 行数      | 88 行                   | `wc -l apps/desktop/renderer/src/components/primitives/Spinner.tsx`                                                                                       |
| Table 组件            | 不存在                  | `find apps/desktop/renderer/src/components/primitives -name 'Table*'`（无结果）                                                                           |
| Separator 组件        | 不存在                  | `find apps/desktop/renderer/src/components/primitives -name 'Separator*'`（无结果）                                                                       |
| Alert 组件            | 不存在                  | `find apps/desktop/renderer/src/components/primitives -name 'Alert*'`（无结果）                                                                           |
| SegmentedControl 组件 | 不存在                  | `find apps/desktop/renderer/src/components/primitives -name 'Segment*'`（无结果）                                                                         |
| Progress 组件         | 不存在                  | `find apps/desktop/renderer/src/components/primitives -name 'Progress*'`（无结果）                                                                        |
| Input prefix/suffix   | 无 slot 支持            | `grep -c 'prefix\|suffix' apps/desktop/renderer/src/components/primitives/Input.tsx`（0 匹配）                                                            |
| v1-02 Button 基线     | 229 行，pill + icon     | `wc -l apps/desktop/renderer/src/components/primitives/Button.tsx`                                                                                        |
| v1-02 Card 基线       | 129 行，bento + compact | `wc -l apps/desktop/renderer/src/components/primitives/Card.tsx`                                                                                          |
| v1-02 Tabs 基线       | 333 行，underline       | `wc -l apps/desktop/renderer/src/components/primitives/Tabs.tsx`                                                                                          |
| v1-02 Badge 基线      | 130 行，pill            | `wc -l apps/desktop/renderer/src/components/primitives/Badge.tsx`                                                                                         |

---

## What：做什么

所有新组件遵循 v1-02 建立的标杆模式：

- **Variant type 定义**：`type XxxVariant = "a" | "b" | "c"`
- **Size type 定义**（如适用）：`type XxxSize = "sm" | "md" | "lg"`
- **variantStyles map**：variant → Tailwind class 映射
- **Design Token 引用**：颜色/圆角/间距一律使用 `var(--xxx)` token
- **Storybook Story**：每个 variant + size 组合至少一个 Story
- **单元测试**：每个 variant 的 className 断言 + 行为测试 + 回归测试

### 1. Table / DataTable（新建，预估 ~300 行）

**Compound component pattern**：`<Table>` → `<TableHeader>` / `<TableBody>` / `<TableRow>` / `<TableCell>` / `<TableHeaderCell>`

- `Table`（Root）：`<table>` wrapper，`border-collapse: collapse`，`width: 100%`
- `TableHeader`：`<thead>`，底部 `1px solid var(--color-separator-bold)`
- `TableBody`：`<tbody>`，行间 `1px solid var(--color-separator)`
- `TableRow`：`<tr>`，hover 背景 `var(--color-bg-hover)`，可选 `selected` 态（`var(--color-bg-selected)`）
- `TableHeaderCell`：`<th>`，`text-align: left`，`font-weight: var(--weight-semibold)`，`font-size: 12px`，`color: var(--color-fg-muted)`，可选 `sortable` + `sortDirection`（`asc`/`desc`/`none`）
- `TableCell`：`<td>`，`padding: var(--space-3) var(--space-4)`，`font-size: 13px`
- ARIA：sortable 列 `aria-sort="ascending|descending|none"`，selected 行 `aria-selected="true"`
- variant：`"default" | "striped"`（striped: 奇偶行交替背景 `var(--color-bg-subtle)`）

### 2. Separator（新建，预估 ~60 行）

- `orientation` prop：`"horizontal" | "vertical"`，默认 `"horizontal"`
- 水平：`<hr>` 或 `<div role="separator">`，`height: 1px`，`width: 100%`，`background: var(--color-separator)`
- 垂直：`height: 100%`，`width: 1px`，`background: var(--color-separator)`
- `variant`：`"default" | "bold"`，bold 使用 `var(--color-separator-bold)`
- `spacing` prop：上下/左右 margin，使用 `var(--space-N)` token
- ARIA：`role="separator"`，垂直时 `aria-orientation="vertical"`

### 3. Alert / Banner（新建，预估 ~150 行）

- `variant`：`"info" | "warning" | "error" | "success"`
- 每种 variant 对应独立的背景色/边框色/图标色 token 组合：
  - info：`var(--color-bg-info)` / `var(--color-border-info)` / `var(--color-fg-info)`
  - warning：`var(--color-bg-warning)` / `var(--color-border-warning)` / `var(--color-fg-warning)`
  - error：`var(--color-bg-error)` / `var(--color-border-error)` / `var(--color-fg-error)`
  - success：`var(--color-bg-success)` / `var(--color-border-success)` / `var(--color-fg-success)`
- `icon` prop：可选前置图标，默认按 variant 自动选择
- `closable` prop：可选关闭按钮（右侧 × 按钮）
- `title` + `children`（description）双 slot
- `border-radius: var(--radius-md)`，`padding: var(--space-3) var(--space-4)`
- ARIA：`role="alert"`，closable 时关闭按钮 `aria-label` 国际化

### 4. SegmentedControl（新建，预估 ~200 行）

**Compound component pattern**：`<SegmentedControl>` → `<SegmentedControlItem>`

- `SegmentedControl`（Root）：容器，`display: inline-flex`，`background: var(--color-bg-subtle)`，`border-radius: var(--radius-md)`，`padding: 2px`
- `SegmentedControlItem`：单选项，active 态 `background: var(--color-bg-surface)`，`border-radius: calc(var(--radius-md) - 2px)`，`box-shadow: var(--shadow-sm)`
- `value` / `onValueChange` 受控 API
- `size`：`"sm" | "md"`（sm: height 28px，md: height 36px）
- active indicator 切换时 CSS transition（`transition: background var(--duration-normal) var(--ease-default)`）
- ARIA：`role="radiogroup"` + `role="radio"` + `aria-checked`
- 最大支持 5 个选项

### 5. Progress（新建，预估 ~120 行）

- 确定性（determinate）线性进度条
- `value` prop：0-100 百分比
- `variant`：`"default" | "success" | "warning" | "error"`
- 每种 variant 对应填充色 token：
  - default：`var(--color-accent)`
  - success：`var(--color-success)`
  - warning：`var(--color-warning)`
  - error：`var(--color-error)`
- `size`：`"sm" | "md"`（sm: height 4px，md: height 8px）
- `label` prop：可选进度文本（如 "65%"）
- 轨道背景：`var(--color-bg-subtle)`，`border-radius: var(--radius-full)`
- 填充条：同圆角，`width` 按 value 百分比，`transition: width var(--duration-normal) var(--ease-default)`
- ARIA：`role="progressbar"` + `aria-valuenow` + `aria-valuemin="0"` + `aria-valuemax="100"` + `aria-label`

### 6. Input prefix/suffix slot 增强（修改现有 Input，85 → ~150 行）

- 新增 `prefix` prop（`ReactNode`）：输入框左侧 slot，常用于图标（🔍）或文本标签
- 新增 `suffix` prop（`ReactNode`）：输入框右侧 slot，常用于清除按钮（×）或单位标签
- 实现方式：将 `<input>` 包裹在 flex 容器中，prefix/suffix 通过 `flex-shrink-0` 定位
- 有 prefix/suffix 时，外层容器承接原本 `<input>` 的边框/焦点/错误样式，`<input>` 本身 `border: none` + `outline: none`
- prefix/suffix 区域 `color: var(--color-fg-muted)`，`padding: 0 var(--space-2)`
- 不传 prefix/suffix 时，行为与当前 Input 完全一致（零回归）

---

## Non-Goals：不做什么

1. **不做虚拟滚动 Table**——大数据量表格的 virtualization 归 v1-26（@tanstack/virtual 集成）
2. **不做 editable Table cell**——单元格编辑是 Feature 级逻辑，不属于 Primitives
3. **不做 Toast 替换**——Alert 是内联通知组件，与 Toast（浮层通知）共存，不互相替代
4. **不做 SegmentedControl 多选模式**——仅支持单选（radio 语义），多选归 ToggleGroup
5. **不做 indeterminate Progress**——不确定性进度已由 Spinner 覆盖，本 change 仅做 determinate Progress
6. **不做 Input 组合组件**——Input prefix/suffix 是 slot 机制，不建立 SearchInput / PasswordInput 等具名组合组件（归 Features 层）
7. **不引入新依赖**——所有组件通过 Tailwind + Design Token 实现，不引入 @tanstack/table 或其他库
8. **不修改 v1-02 已完成的 7 个组件**——Button/Card/Tabs/Badge/Radio/Select/ImageUpload 保持不变
9. **不做 Features 层迁移**——Features 层对新组件的采用归后续 change

---

## 依赖与影响

- **上游依赖**:
  - v1-01（Design Token 补完）——✅ 已合并，`--color-separator`、`--color-separator-bold`、`--color-bg-subtle`、`--color-bg-info` 等 token 已就位
  - v1-02（Primitive 视觉进化）——✅ 已合并，建立了 variant/size/token 标杆模式，本 change 全部新组件遵循该模式
- **被依赖于**:
  - v1-25（Density System）需要新组件支持 compact/comfortable 双密度
  - v1-03（Dashboard）需要 Table/DataTable 展示项目列表、Progress 展示完成度
  - v1-07（Settings）需要 SegmentedControl 切换主题模式
  - v1-06（AI Panel）需要 Alert 展示状态通知、Input prefix 展示搜索图标
- **并行安全**: 本 change 新增组件文件和扩展 Input，不修改现有组件，合并冲突风险极低
- **风险**:
  - Input prefix/suffix 增强改变了 Input 的 DOM 结构（从裸 `<input>` 变为 wrapper + input），需确保不传 prefix/suffix 时零回归——通过条件渲染 wrapper 解决
  - Table compound pattern 是 Primitives 首个 compound component，需建立范式供后续组件（如 Form）参考

---

## R1 Cascade Refresh (2026-03-21)

### 上游依赖状态

| 依赖  | 状态                                    |
| ----- | --------------------------------------- |
| v1-01 | ✅ 完成（2026-03-20 验收，R1 复核通过） |
| v1-02 | ✅ 完成（2026-03-21 验收，⭐⭐⭐⭐⭐）  |

### 基线指标复核

所有指标 R1 复核完成，与初始建档一致：

| 指标                  | R1 建档值 | R1 复核值 | 趋势 | 说明                         |
| --------------------- | --------- | --------- | ---- | ---------------------------- |
| Primitive 组件文件数  | 29        | 29        | →    | 待本 change 扩展至 ≥ 35      |
| Primitive 总行数      | 4452      | 4452      | →    |                              |
| Button.tsx 行数       | 229       | 229       | →    | v1-02 标杆                   |
| Card.tsx 行数         | 129       | 129       | →    | v1-02 标杆                   |
| Tabs.tsx 行数         | 333       | 333       | →    | v1-02 标杆                   |
| Badge.tsx 行数        | 130       | 130       | →    | v1-02 标杆                   |
| Input.tsx 行数        | 85        | 85        | →    | 待 prefix/suffix 增强至 ~150 |
| Input prefix/suffix   | 0         | 0         | →    | 待本 change 新增             |
| Table 存在            | ❌        | ❌        | →    | 待本 change 新建             |
| Separator 存在        | ❌        | ❌        | →    | 待本 change 新建             |
| Alert 存在            | ❌        | ❌        | →    | 待本 change 新建             |
| SegmentedControl 存在 | ❌        | ❌        | →    | 待本 change 新建             |
| Progress 存在         | ❌        | ❌        | →    | 待本 change 新建             |

### Scope 变更

无需调整。v1-02 的 variant/size/token 标杆模式已建立，v1-24 新组件将严格遵循该模式。v1-02 完成为 v1-24 提供了清晰的实现范式——"前车之辙，后车之鉴。"

---

## 验收标准

| ID    | 标准                                                                                    | 验证方式                                                                                                                                                                      |
| ----- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-1  | Table / DataTable compound component 已建立（~300 行），支持 default/striped variant    | `wc -l apps/desktop/renderer/src/components/primitives/Table.tsx`；Storybook Story 可见                                                                                       |
| AC-2  | Separator 组件已建立（~60 行），支持 horizontal/vertical + default/bold variant         | `wc -l apps/desktop/renderer/src/components/primitives/Separator.tsx`；`grep 'role="separator"' apps/desktop/renderer/src/components/primitives/Separator.tsx`                |
| AC-3  | Alert 组件已建立（~150 行），支持 info/warning/error/success variant + closable         | `wc -l apps/desktop/renderer/src/components/primitives/Alert.tsx`；`grep 'role="alert"' apps/desktop/renderer/src/components/primitives/Alert.tsx`                            |
| AC-4  | SegmentedControl compound component 已建立（~200 行），支持 sm/md size                  | `wc -l apps/desktop/renderer/src/components/primitives/SegmentedControl.tsx`；`grep 'role="radiogroup"' apps/desktop/renderer/src/components/primitives/SegmentedControl.tsx` |
| AC-5  | Progress 组件已建立（~120 行），支持 default/success/warning/error variant + sm/md size | `wc -l apps/desktop/renderer/src/components/primitives/Progress.tsx`；`grep 'role="progressbar"' apps/desktop/renderer/src/components/primitives/Progress.tsx`                |
| AC-6  | Input prefix/suffix slot 增强（85 → ~150 行），不传 prefix/suffix 时零回归              | `grep -c 'prefix\|suffix' apps/desktop/renderer/src/components/primitives/Input.tsx` ≥ 4；现有 Input 测试全部通过                                                             |
| AC-7  | 每个新组件有对应 Storybook Story                                                        | `find apps/desktop/renderer/src/components/primitives -name '*.stories.tsx' \| wc -l` 增长 ≥ 5                                                                                |
| AC-8  | 每个新组件有单元测试（variant className 断言 + 行为测试）                               | `pnpm -C apps/desktop vitest run`                                                                                                                                             |
| AC-9  | 所有 ARIA 属性正确（Table aria-sort、Alert role、Progress aria-valuenow 等）            | 测试中验证 ARIA 属性                                                                                                                                                          |
| AC-10 | TypeScript 类型检查通过                                                                 | `pnpm typecheck`                                                                                                                                                              |
| AC-11 | Storybook 可构建                                                                        | `pnpm -C apps/desktop storybook:build`                                                                                                                                        |
| AC-12 | lint 无新增违规                                                                         | `pnpm lint`                                                                                                                                                                   |
