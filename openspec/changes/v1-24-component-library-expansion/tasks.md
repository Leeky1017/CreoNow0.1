# Tasks: V1-24 Component Library Expansion

- **状态**: 📋 已建档（待实施）
- **分支**: `task/<N>-component-library-expansion`
- **Delta Spec**: `openspec/specs/design-system/spec.md`（需更新新增组件定义）
- **上游依赖**: v1-02 ✅ 已合并 | v1-01 ✅ 已合并

---

## 验收标准

| ID    | 标准                                                                                                            | 验证方式                                                                                                                                                  | 结果 |
| ----- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| AC-1  | `Table` compound component 存在（Table/TableHeader/TableBody/TableRow/TableCell/TableHeaderCell）               | TypeScript 编译 + 文件存在                                                                                                                                | ⬜   |
| AC-2  | `<Table variant="striped">` 渲染时奇偶行交替背景色                                                              | 单元测试 className 断言                                                                                                                                   | ⬜   |
| AC-3  | `<TableHeaderCell sortable sortDirection="asc">` 渲染时含 `aria-sort="ascending"`                               | 单元测试 ARIA 断言                                                                                                                                        | ⬜   |
| AC-4  | `<TableRow selected>` 渲染时含 `aria-selected="true"` 和选中背景色                                              | 单元测试 ARIA + className 断言                                                                                                                            | ⬜   |
| AC-5  | `Separator` 组件存在，支持 `orientation="horizontal" \| "vertical"` 和 `variant="default" \| "bold"`            | TypeScript 编译 + 单元测试                                                                                                                                | ⬜   |
| AC-6  | `<Separator orientation="vertical">` 渲染时含 `aria-orientation="vertical"`                                     | 单元测试 ARIA 断言                                                                                                                                        | ⬜   |
| AC-7  | `Alert` 组件存在，支持 `variant="info" \| "warning" \| "error" \| "success"`                                    | TypeScript 编译 + 单元测试                                                                                                                                | ⬜   |
| AC-8  | `<Alert variant="error">` 渲染时含 `role="alert"` 和 error variant 对应的背景/边框色 className                  | 单元测试 ARIA + className 断言                                                                                                                            | ⬜   |
| AC-9  | `<Alert closable onClose={fn}>` 渲染关闭按钮，点击触发 onClose 回调                                             | 单元测试交互断言                                                                                                                                          | ⬜   |
| AC-10 | `SegmentedControl` compound component 存在（SegmentedControl + SegmentedControlItem）                           | TypeScript 编译 + 文件存在                                                                                                                                | ⬜   |
| AC-11 | `<SegmentedControl value="a">` 受控选中态正确，active item 含 `aria-checked="true"`                             | 单元测试 ARIA + 交互断言                                                                                                                                  | ⬜   |
| AC-12 | SegmentedControl 支持 `size="sm" \| "md"`                                                                       | 单元测试 className 断言                                                                                                                                   | ⬜   |
| AC-13 | `Progress` 组件存在，支持 `value` 0-100 + `variant` 四种                                                        | TypeScript 编译 + 单元测试                                                                                                                                | ⬜   |
| AC-14 | `<Progress value={65}>` 渲染时含 `role="progressbar"` + `aria-valuenow="65"` + 填充宽度 65%                     | 单元测试 ARIA + style 断言                                                                                                                                | ⬜   |
| AC-15 | `<Progress size="sm">` 和 `<Progress size="md">` 渲染不同高度                                                   | 单元测试 className 断言                                                                                                                                   | ⬜   |
| AC-16 | `Input` 支持 `prefix` 和 `suffix` ReactNode prop                                                                | TypeScript 编译 + 单元测试                                                                                                                                | ⬜   |
| AC-17 | `<Input prefix={<Icon />}>` 渲染时前缀在输入框左侧，输入框保持正常功能                                          | 单元测试 DOM 结构 + 交互断言                                                                                                                              | ⬜   |
| AC-18 | 不传 prefix/suffix 时 Input 行为与现有完全一致（零回归）                                                        | 回归测试                                                                                                                                                  | ⬜   |
| AC-19 | 所有 6 个新/增强组件有 Storybook Story，每个 variant + size 至少一个                                            | Story 存在 + `storybook:build` 通过                                                                                                                       | ⬜   |
| AC-20 | 所有新组件在 `primitives/index.ts` 中导出                                                                       | grep 验证                                                                                                                                                 | ⬜   |
| AC-21 | TypeScript 类型检查通过                                                                                         | `pnpm typecheck`                                                                                                                                          | ⬜   |
| AC-22 | 全量测试通过                                                                                                    | `pnpm -C apps/desktop vitest run`                                                                                                                         | ⬜   |
| AC-23 | lint 无新增违规                                                                                                 | `pnpm lint`                                                                                                                                               | ⬜   |
| AC-24 | Storybook 可构建                                                                                                | `pnpm -C apps/desktop storybook:build`                                                                                                                    | ⬜   |
| AC-25 | 原始组件文件数从 30（R10 基线）增长至 ≥ 35（新增 Table 系列 + Separator + Alert + SegmentedControl + Progress） | `find apps/desktop/renderer/src/components/primitives -maxdepth 1 -name '*.tsx' ! -name '*.test.*' ! -name '*.stories.*' ! -name '*.behavior.*' \| wc -l` | ⬜   |
| AC-26 | 所有用户可见文本走 `t()` / i18n                                                                                 | grep 验证无裸字符串                                                                                                                                       | ⬜   |

---

## Phase 0: 准备

- [ ] 阅读 `AGENTS.md` 和 `design/DESIGN_DECISIONS.md` §6（组件规范）
- [ ] 阅读 v1-02 的 Button/Card/Tabs/Badge 源码，理解 variant/size/token 标杆模式
- [ ] 阅读 v1-02 的 `.test.tsx` 和 `.stories.tsx`，理解测试和 Story 的组织方式
- [ ] 阅读设计稿 `04-dashboard-list-progress.html`（Table + Progress）、`14-ai-panel.html`（Alert + Input prefix）、`20-settings-appearance.html`（SegmentedControl）、`05-file-tree.html`（Separator + Input prefix）
- [ ] 确认所需 Design Token 已定义：`--color-separator`、`--color-separator-bold`、`--color-bg-subtle`、`--color-bg-info`/`warning`/`error`/`success`、`--color-bg-selected`、`--color-bg-hover`、`--shadow-sm`
- [ ] 阅读 `docs/references/testing/README.md` 了解测试规范
- [ ] 阅读 `Spinner.tsx`（88 行）理解反馈类 primitive 的模式（size type + ARIA）

---

## Phase 1: Red（测试先行）

### Task 1.1: Table compound component 测试

**映射验收标准**: AC-1, AC-2, AC-3, AC-4

- [ ] 测试：`<Table>` 渲染 `<table>` 元素
- [ ] 测试：`<TableHeader>` 渲染 `<thead>`，`<TableBody>` 渲染 `<tbody>`
- [ ] 测试：`<TableRow>` 渲染 `<tr>`，`<TableCell>` 渲染 `<td>`，`<TableHeaderCell>` 渲染 `<th>`
- [ ] 测试：`<Table variant="striped">` 的奇数行和偶数行 className 不同（交替背景）
- [ ] 测试：`<Table variant="default">` 无交替背景（回归）
- [ ] 测试：`<TableHeaderCell sortable sortDirection="asc">` 含 `aria-sort="ascending"`
- [ ] 测试：`<TableHeaderCell sortable sortDirection="desc">` 含 `aria-sort="descending"`
- [ ] 测试：`<TableHeaderCell sortable sortDirection="none">` 含 `aria-sort="none"`
- [ ] 测试：`<TableRow selected>` 含 `aria-selected="true"` 和选中背景色 className
- [ ] 测试：`<TableRow hover>` 含 hover 背景色 className

**文件**: `renderer/src/components/primitives/Table.test.tsx`（新建）

### Task 1.2: Separator 测试

**映射验收标准**: AC-5, AC-6

- [ ] 测试：默认渲染 `role="separator"` 的水平分割线
- [ ] 测试：`<Separator orientation="vertical">` 含 `aria-orientation="vertical"`
- [ ] 测试：`<Separator variant="default">` 使用 `--color-separator` 背景色
- [ ] 测试：`<Separator variant="bold">` 使用 `--color-separator-bold` 背景色
- [ ] 测试：`<Separator spacing="md">` 应用正确的 margin className

**文件**: `renderer/src/components/primitives/Separator.test.tsx`（新建）

### Task 1.3: Alert 测试

**映射验收标准**: AC-7, AC-8, AC-9

- [ ] 测试：`<Alert variant="info">` 含 `role="alert"` 和 info 变体的背景/边框色 className
- [ ] 测试：`<Alert variant="warning">` 含 warning 变体的背景/边框色 className
- [ ] 测试：`<Alert variant="error">` 含 error 变体的背景/边框色 className
- [ ] 测试：`<Alert variant="success">` 含 success 变体的背景/边框色 className
- [ ] 测试：`<Alert title="标题">描述</Alert>` 同时渲染 title 和 description
- [ ] 测试：`<Alert closable onClose={fn}>` 渲染关闭按钮
- [ ] 测试：点击关闭按钮调用 `onClose` 回调
- [ ] 测试：`<Alert icon={<CustomIcon />}>` 渲染自定义图标

**文件**: `renderer/src/components/primitives/Alert.test.tsx`（新建）

### Task 1.4: SegmentedControl 测试

**映射验收标准**: AC-10, AC-11, AC-12

- [ ] 测试：`<SegmentedControl value="a">` 渲染 `role="radiogroup"` 容器
- [ ] 测试：`<SegmentedControlItem value="a">` 在选中时含 `role="radio"` + `aria-checked="true"`
- [ ] 测试：`<SegmentedControlItem value="b">` 在未选中时含 `aria-checked="false"`
- [ ] 测试：点击未选中 item 触发 `onValueChange` 回调
- [ ] 测试：`<SegmentedControl size="sm">` 应用小尺寸 className（height 28px）
- [ ] 测试：`<SegmentedControl size="md">` 应用中尺寸 className（height 36px）
- [ ] 测试：disabled item 不可点击，含 `aria-disabled="true"`

**文件**: `renderer/src/components/primitives/SegmentedControl.test.tsx`（新建）

### Task 1.5: Progress 测试

**映射验收标准**: AC-13, AC-14, AC-15

- [ ] 测试：`<Progress value={65}>` 含 `role="progressbar"` + `aria-valuenow="65"` + `aria-valuemin="0"` + `aria-valuemax="100"`
- [ ] 测试：`<Progress value={0}>` 填充宽度为 0%
- [ ] 测试：`<Progress value={100}>` 填充宽度为 100%
- [ ] 测试：value 超出 0-100 范围时 clamp 到边界值
- [ ] 测试：`<Progress variant="default">` 使用 `--color-accent` 填充色
- [ ] 测试：`<Progress variant="success">` 使用 `--color-success` 填充色
- [ ] 测试：`<Progress variant="warning">` 使用 `--color-warning` 填充色
- [ ] 测试：`<Progress variant="error">` 使用 `--color-error` 填充色
- [ ] 测试：`<Progress size="sm">` 轨道高度为 4px
- [ ] 测试：`<Progress size="md">` 轨道高度为 8px
- [ ] 测试：`<Progress label="65%">` 渲染进度标签文本

**文件**: `renderer/src/components/primitives/Progress.test.tsx`（新建）

### Task 1.6: Input prefix/suffix 测试

**映射验收标准**: AC-16, AC-17, AC-18

- [ ] 测试：`<Input prefix={<span>🔍</span>}>` 渲染前缀元素在输入框左侧
- [ ] 测试：`<Input suffix={<span>×</span>}>` 渲染后缀元素在输入框右侧
- [ ] 测试：`<Input prefix={<span>🔍</span>} suffix={<span>×</span>}>` 同时渲染前后缀
- [ ] 测试：带 prefix/suffix 时输入框仍可正常输入、获取焦点
- [ ] 测试：带 prefix/suffix 时 error 态样式应用到外层容器
- [ ] 测试：带 prefix/suffix 时 disabled 态正确生效
- [ ] 测试：不传 prefix/suffix 时渲染结果与当前 Input 完全一致（DOM 结构不变）
- [ ] 测试：`ref` 仍然指向 `<input>` 元素（不是 wrapper）

**文件**: `renderer/src/components/primitives/Input.test.tsx`（追加/新建）

### Task 1.7: Story 完整性测试

**映射验收标准**: AC-19

- [ ] 测试：`Table.stories.tsx` 导出至少 Default 和 Striped Story
- [ ] 测试：`Separator.stories.tsx` 导出至少 Horizontal 和 Vertical Story
- [ ] 测试：`Alert.stories.tsx` 导出至少 Info/Warning/Error/Success 和 Closable Story
- [ ] 测试：`SegmentedControl.stories.tsx` 导出至少 Default 和 Sizes Story
- [ ] 测试：`Progress.stories.tsx` 导出至少 Default 和 Variants Story
- [ ] 测试：`Input.stories.tsx` 导出至少 WithPrefix 和 WithSuffix Story

**文件**: guard 测试或各 Story 文件中验证

---

## Phase 2: Green（实现）

### Task 2.1: Table compound component

**映射验收标准**: AC-1, AC-2, AC-3, AC-4

- [ ] 定义 `TableVariant` type：`"default" | "striped"`
- [ ] 实现 `Table` Root 组件：`<table>` wrapper + variant context provider
- [ ] 实现 `TableHeader`：`<thead>` + 底部粗分割线样式
- [ ] 实现 `TableBody`：`<tbody>` + 行间细分割线样式
- [ ] 实现 `TableRow`：`<tr>` + hover 背景 + `selected` prop + `aria-selected`
- [ ] 实现 `TableHeaderCell`：`<th>` + `sortable`/`sortDirection`/`onSort` props + `aria-sort`
- [ ] 实现 `TableCell`：`<td>` + 标准 padding
- [ ] striped variant：通过 CSS `even:bg-[var(--color-bg-subtle)]` 实现交替背景
- [ ] 从 `primitives/index.ts` 导出所有 Table 子组件

**文件**: `renderer/src/components/primitives/Table.tsx`（新建）

### Task 2.2: Table Story

- [ ] Default Story：3 列 × 5 行基础表格
- [ ] Striped Story：交替背景行
- [ ] Sortable Story：可排序列头
- [ ] Selectable Story：可选中行
- [ ] Empty Story：空态（无数据行）

**文件**: `renderer/src/components/primitives/Table.stories.tsx`（新建）

### Task 2.3: Separator

**映射验收标准**: AC-5, AC-6

- [ ] 定义 `SeparatorVariant` type：`"default" | "bold"`
- [ ] 定义 `SeparatorOrientation` type：`"horizontal" | "vertical"`
- [ ] 实现水平分割线（默认）：1px 高、100% 宽
- [ ] 实现垂直分割线：1px 宽、100% 高
- [ ] variant 样式映射：default → `--color-separator`，bold → `--color-separator-bold`
- [ ] `spacing` prop：可选 margin token
- [ ] ARIA：`role="separator"` + 垂直时 `aria-orientation="vertical"`
- [ ] 从 `primitives/index.ts` 导出

**文件**: `renderer/src/components/primitives/Separator.tsx`（新建）

### Task 2.4: Separator Story

- [ ] Horizontal Story：水平默认分割线
- [ ] Vertical Story：垂直分割线（在 flex row 中展示）
- [ ] Bold Story：粗分割线
- [ ] WithSpacing Story：带不同间距的分割线

**文件**: `renderer/src/components/primitives/Separator.stories.tsx`（新建）

### Task 2.5: Alert

**映射验收标准**: AC-7, AC-8, AC-9

- [ ] 定义 `AlertVariant` type：`"info" | "warning" | "error" | "success"`
- [ ] 实现 variantStyles map：4 种 variant 的背景/边框/前景色组合
- [ ] 实现 `title` + `children` 双 slot 布局
- [ ] 实现 `icon` prop：默认按 variant 自动选择图标
- [ ] 实现 `closable` + `onClose`：右侧关闭按钮 + 回调
- [ ] ARIA：`role="alert"`，关闭按钮 `aria-label={t('common.close')}`
- [ ] 从 `primitives/index.ts` 导出

**文件**: `renderer/src/components/primitives/Alert.tsx`（新建）

### Task 2.6: Alert Story

- [ ] Info / Warning / Error / Success Story：4 种 variant
- [ ] WithTitle Story：带标题的 Alert
- [ ] Closable Story：可关闭的 Alert
- [ ] CustomIcon Story：自定义图标

**文件**: `renderer/src/components/primitives/Alert.stories.tsx`（新建）

### Task 2.7: SegmentedControl

**映射验收标准**: AC-10, AC-11, AC-12

- [ ] 定义 `SegmentedControlSize` type：`"sm" | "md"`
- [ ] 实现 `SegmentedControl` Root：`role="radiogroup"` + 受控 value/onValueChange + context provider
- [ ] 实现 `SegmentedControlItem`：`role="radio"` + `aria-checked` + active 态样式
- [ ] sizeStyles map：sm → h-7，md → h-9
- [ ] active indicator 样式：`bg-[var(--color-bg-surface)]` + `shadow-[var(--shadow-sm)]` + `rounded-[calc(var(--radius-md)-2px)]`
- [ ] CSS transition：`transition-all var(--duration-normal) var(--ease-default)`
- [ ] disabled item 支持
- [ ] 从 `primitives/index.ts` 导出

**文件**: `renderer/src/components/primitives/SegmentedControl.tsx`（新建）

### Task 2.8: SegmentedControl Story

- [ ] Default Story：3 选项基础分段控制
- [ ] Sizes Story：sm 和 md 对比
- [ ] Disabled Story：部分/全部禁用
- [ ] ThemeSelector Story：浅色/深色/系统主题切换示例

**文件**: `renderer/src/components/primitives/SegmentedControl.stories.tsx`（新建）

### Task 2.9: Progress

**映射验收标准**: AC-13, AC-14, AC-15

- [ ] 定义 `ProgressVariant` type：`"default" | "success" | "warning" | "error"`
- [ ] 定义 `ProgressSize` type：`"sm" | "md"`
- [ ] 实现轨道 + 填充条布局：`overflow: hidden` + `border-radius: var(--radius-full)`
- [ ] variantStyles map：4 种 variant 的填充色
- [ ] sizeStyles map：sm → h-1，md → h-2
- [ ] `value` prop：百分比，clamp 到 0-100
- [ ] 填充条宽度：`style={{ width: \`${clampedValue}%\` }}`
- [ ] `label` prop：可选进度文本
- [ ] ARIA：`role="progressbar"` + `aria-valuenow` + `aria-valuemin="0"` + `aria-valuemax="100"`
- [ ] transition：`transition-[width] var(--duration-normal) var(--ease-default)`
- [ ] 从 `primitives/index.ts` 导出

**文件**: `renderer/src/components/primitives/Progress.tsx`（新建）

### Task 2.10: Progress Story

- [ ] Default Story：65% 进度
- [ ] Variants Story：4 种 variant 对比
- [ ] Sizes Story：sm 和 md 对比
- [ ] WithLabel Story：带进度文本
- [ ] Zero and Full Story：0% 和 100% 边界

**文件**: `renderer/src/components/primitives/Progress.stories.tsx`（新建）

### Task 2.11: Input prefix/suffix slot 增强

**映射验收标准**: AC-16, AC-17, AC-18

- [ ] 新增 `prefix` prop（`ReactNode`）和 `suffix` prop（`ReactNode`）到 `InputProps`
- [ ] 有 prefix 或 suffix 时：包裹 flex 容器，外层容器承接边框/焦点/错误样式
- [ ] `<input>` 在 wrapper 内 `border: none` + `outline: none` + `flex: 1`
- [ ] prefix 区域：`flex-shrink-0` + `color: var(--color-fg-muted)` + `pl-3 pr-0`
- [ ] suffix 区域：`flex-shrink-0` + `color: var(--color-fg-muted)` + `pr-3 pl-0`
- [ ] 不传 prefix/suffix 时：保持原有裸 `<input>` 渲染路径，零回归
- [ ] `ref` 始终指向 `<input>` 元素
- [ ] 更新 `primitives/index.ts` 导出（InputProps 已导出，仅需确认 type 扩展生效）

**文件**: `renderer/src/components/primitives/Input.tsx`（修改）

### Task 2.12: Input Story 更新

- [ ] WithPrefix Story：搜索图标前缀
- [ ] WithSuffix Story：清除按钮后缀
- [ ] WithPrefixAndSuffix Story：同时使用前后缀

**文件**: `renderer/src/components/primitives/Input.stories.tsx`（追加）

---

## Phase 3: Verification（验证）

- [ ] 运行 Phase 1 全部测试，确认全绿
- [ ] 运行 `pnpm -C apps/desktop vitest run` 全量测试通过
- [ ] 运行 `pnpm typecheck` 类型检查通过
- [ ] 运行 `pnpm lint` lint 无新增违规
- [ ] 运行 `pnpm -C apps/desktop storybook:build` Storybook 可构建
- [ ] 视觉验收：在 Storybook 中核对每个新组件的渲染效果
  - Table：确认行分割线、交替背景、排序指示器、选中高亮
  - Separator：确认水平/垂直方向、默认/粗线样式
  - Alert：确认 4 种 variant 的颜色差异、图标、关闭按钮
  - SegmentedControl：确认 active 态样式、尺寸差异、切换动效
  - Progress：确认填充动效、4 种 variant 颜色、两种尺寸
  - Input prefix/suffix：确认前后缀渲染、焦点态边框在外层容器
- [ ] 确认原始组件文件数 ≥ 35
- [ ] 确认 Input 零回归：不传 prefix/suffix 时行为与 v1-02 完全一致
- [ ] 确认所有新组件导出注册在 `primitives/index.ts`
- [ ] 确认所有用户可见文本走 `t()` / i18n

---

## R1 Cascade Refresh 记录（2026-03-21）

### 上游依赖复核

- **v1-01** ✅ 完成（2026-03-20 验收）——Design Token 体系完备，`--color-separator`、`--color-bg-info` 等新组件所需 token 已就位
- **v1-02** ✅ 完成（2026-03-21 验收）——variant/size/token 标杆模式已建立（Button 229 行、Card 129 行、Tabs 333 行、Badge 130 行）

### 基线指标验证

| 指标                  | 实测值 | 采集命令                                                                                                                                                  |
| --------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Primitive 组件文件数  | 29     | `find apps/desktop/renderer/src/components/primitives -maxdepth 1 -name '*.tsx' ! -name '*.test.*' ! -name '*.stories.*' ! -name '*.behavior.*' \| wc -l` |
| Primitive 总行数      | 4452   | `find apps/desktop/renderer/src/components/primitives -name '*.tsx' ! -name '*.test.*' ! -name '*.stories.*' -exec wc -l {} + \| tail -1`                 |
| Input.tsx 行数        | 85     | `wc -l apps/desktop/renderer/src/components/primitives/Input.tsx`                                                                                         |
| Input prefix/suffix   | 0      | `grep -c 'prefix\|suffix' apps/desktop/renderer/src/components/primitives/Input.tsx`                                                                      |
| Table 组件            | 不存在 | `find apps/desktop/renderer/src/components/primitives -name 'Table*'` → 空                                                                                |
| Separator 组件        | 不存在 | `find apps/desktop/renderer/src/components/primitives -name 'Separator*'` → 空                                                                            |
| Alert 组件            | 不存在 | `find apps/desktop/renderer/src/components/primitives -name 'Alert*'` → 空                                                                                |
| SegmentedControl 组件 | 不存在 | `find apps/desktop/renderer/src/components/primitives -name 'Segment*'` → 空                                                                              |
| Progress 组件         | 不存在 | `find apps/desktop/renderer/src/components/primitives -name 'Progress*'` → 空                                                                             |

所有指标与初始建档一致，无变化。

### Phase 0 调整

无需调整。上游依赖已全部就绪，v1-02 标杆模式可直接参考。建议 Phase 0 增加对 v1-02 新增的 `.behavior.test.tsx` 模式的阅读，作为新组件行为测试的参考。

---

## R10 级联刷新记录（2026-03-22）

> 📋 **R10 P8**: v1-19~v1-23 tasks.md 创建/复核完成，v1-17（PR#1222）/v1-18（PR#1223）已合并

### 上游依赖复核

- **v1-01** ✅ 完成 — Design Token 体系完备
- **v1-02** ✅ 完成 — variant/size/token 标杆模式已建立
- **v1-17** ✅ 已合并 — shadow token 扩展至 6 档（`--shadow-xs` ~ `--shadow-2xl`），视觉回归 CI 已建立
- **v1-18** ✅ 已合并 — arbitrary 值清理完成，variant 推广模式可参考

### R10 基线指标验证

| 指标                  | R1 值  | R10 值 | Delta | 采集命令                                                                                                                                  |
| --------------------- | ------ | ------ | ----- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Primitive 组件文件数  | 29     | 30     | +1    | `find apps/desktop/renderer/src/components/primitives -name '*.tsx' ! -name '*.test.*' ! -name '*.stories.*' \| wc -l`                    |
| Primitive 总行数      | 4452   | 4479   | +27   | `find apps/desktop/renderer/src/components/primitives -name '*.tsx' ! -name '*.test.*' ! -name '*.stories.*' -exec wc -l {} + \| tail -1` |
| Input.tsx 行数        | 85     | 85     | →     | `wc -l apps/desktop/renderer/src/components/primitives/Input.tsx`                                                                         |
| Input prefix/suffix   | 0      | 0      | →     | `grep -c 'prefix\|suffix' apps/desktop/renderer/src/components/primitives/Input.tsx`                                                      |
| Table 组件            | 不存在 | 不存在 | →     | `find apps/desktop/renderer/src/components/primitives -name 'Table*'` → 空                                                                |
| Separator 组件        | 不存在 | 不存在 | →     | `find apps/desktop/renderer/src/components/primitives -name 'Separator*'` → 空                                                            |
| Alert 组件            | 不存在 | 不存在 | →     | `find apps/desktop/renderer/src/components/primitives -name 'Alert*'` → 空                                                                |
| SegmentedControl 组件 | 不存在 | 不存在 | →     | `find apps/desktop/renderer/src/components/primitives -name 'Segment*'` → 空                                                              |
| Progress 组件         | 不存在 | 不存在 | →     | `find apps/desktop/renderer/src/components/primitives -name 'Progress*'` → 空                                                             |
| Shadow tokens         | 4 档   | 6 档   | +2    | `grep 'shadow' design/system/01-tokens.css`（新增 `--shadow-xs` / `--shadow-2xl`）                                                        |
| Story 文件数          | 26     | 26     | →     | `find apps/desktop/renderer/src/components/primitives -name '*.stories.tsx' \| wc -l`                                                     |

### AC/Task 调整

1. **AC-25 基线更新**: 原始组件文件数基线从 29 调整为 30（R10 实测值），目标仍为 ≥ 35
2. **v1-20 交叉依赖**: Task 1.7（Story 完整性）和 Phase 2 各 Story Task 应确保包含 play function（交互测试），以满足 v1-20 Storybook 体系化要求
3. **v1-23 交叉依赖**: Task 2.5（Alert 实现）的 variantStyles map 可直接引用 v1-23 补全的功能色 hover/active token

### Scope 变更

无需调整。v1-17/v1-18 的合并强化了 Token 基础但未改变组件范围。v1-19~v1-23 的交叉依赖已在现有 AC 中覆盖。
