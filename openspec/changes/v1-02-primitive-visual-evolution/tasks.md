# Tasks: V1-02 Primitive 组件视觉进化

- **GitHub Issue**: 待创建
- **分支**: `task/<N>-primitive-visual-evolution`
- **Delta Spec**: `specs/primitives/spec.md`（如需更新 variant 定义）

---

## 验收标准

| ID | 标准 | 验证方式 |
| --- | --- | --- |
| AC-1 | `ButtonVariant` type 包含 `"pill"`，`ButtonSize` type 包含 `"icon"` | TypeScript 编译 + grep |
| AC-2 | `<Button variant="pill">` 渲染时 `border-radius` 为 `var(--radius-full)` | 单元测试 className 断言 |
| AC-3 | `<Button size="icon">` 渲染时宽高相等，padding 为 0 | 单元测试 className 断言 |
| AC-4 | `CardVariant` type 包含 `"bento"` 和 `"compact"` | TypeScript 编译 + grep |
| AC-5 | `<Card variant="bento">` 渲染时 `border-radius` 为 `var(--radius-2xl)`，padding 为 `var(--space-8)` | 单元测试 className 断言 |
| AC-6 | `<Card variant="compact">` 渲染时使用紧凑 padding `var(--space-3)` | 单元测试 className 断言 |
| AC-7 | Tabs 组件支持 `variant` prop，类型为 `"default" \| "underline"` | TypeScript 编译 |
| AC-8 | `<Tabs variant="underline">` 的 active tab 下方渲染 2px accent 色底线 | 单元测试 DOM 断言 |
| AC-9 | 不传 `variant` 时 Tabs 行为与当前完全一致（默认 `"default"`，无底线） | 回归测试 |
| AC-10 | `BadgeVariant` type 包含 `"pill"` | TypeScript 编译 + grep |
| AC-11 | `<Badge variant="pill">` 渲染时有 `uppercase`、`border-radius: var(--radius-full)`、正确的 letter-spacing | 单元测试 className 断言 |
| AC-12 | Button / Card / Tabs / Badge 各有新增 variant 的 Storybook Story | Story 存在 + `storybook:build` 通过 |
| AC-13 | 所有现有 Button / Card / Tabs / Badge 测试通过（回归零破坏） | `vitest run` |
| AC-14 | Storybook 可构建 | `pnpm -C apps/desktop storybook:build` |
| AC-15 | 全量测试通过 | `pnpm -C apps/desktop vitest run` |
| AC-16 | TypeScript 类型检查通过 | `pnpm typecheck` |
| AC-17 | lint 无新增违规 | `pnpm lint` |
| AC-18 | `Radio.tsx` 从 493 行拆分为 RadioGroup + RadioItem + hook，各文件 ≤ 200 行 | 架构 |
| AC-19 | `Select.tsx` 从 350 行拆分为 Select + SelectContent，各文件 ≤ 200 行 | 架构 |
| AC-20 | `ImageUpload.tsx` 从 335 行分离 ImagePreview，各文件 ≤ 200 行 | 架构 |

---

## Phase 0: 准备

- [ ] 阅读 `AGENTS.md` 和 `design/DESIGN_DECISIONS.md` §6（组件规范）
- [ ] 阅读 `Button.tsx`（198 行）、`Card.tsx`（104 行）、`Tabs.tsx`（215 行）、`Badge.tsx`（105 行）全文
- [ ] 阅读各组件对应的 `.test.tsx` 和 `.stories.tsx`，理解现有测试和 Story 的组织方式
- [ ] 阅读设计稿 `01-dashboard.html`、`03-dashboard-sidebar-full.html`、`05-file-tree.html`、`14-ai-panel.html`、`20-settings-appearance.html`，截取新 variant 的视觉参考
- [ ] 确认 `--color-accent`、`--tracking-wide`、`--weight-semibold` 等 token 已定义（如 v1-01 未合并，则在本 change 中使用 token 名占位，v1-01 合并后生效）
- [ ] 阅读 `docs/references/testing/README.md` 了解测试规范

---

## Phase 1: Red（测试先行）

### Task 1.1: Button 新 variant 测试

**映射验收标准**: AC-1, AC-2, AC-3

- [ ] 测试：`<Button variant="pill">Text</Button>` 渲染的元素 className 包含 pill variant 对应的圆角样式
- [ ] 测试：`<Button variant="pill">` 的其余样式（背景、border、hover）与 `secondary` 一致
- [ ] 测试：`<Button size="icon"><Icon /></Button>` 渲染的元素 className 包含正方形尺寸样式
- [ ] 测试：`size="icon"` 与 `variant="pill"` 可组合使用
- [ ] 测试：现有 `variant="primary/secondary/ghost/danger"` 和 `size="sm/md/lg"` 的行为不变（回归）

**文件**: `renderer/src/components/primitives/Button.test.tsx`（追加）

### Task 1.2: Card 新 variant 测试

**映射验收标准**: AC-4, AC-5, AC-6

- [ ] 测试：`<Card variant="bento">` 渲染的元素 className 包含 `--radius-2xl` 对应的圆角样式和 `--space-8` 对应的 padding 样式
- [ ] 测试：`<Card variant="bento" hoverable>` 在 hover 态下应用边框颜色过渡
- [ ] 测试：`<Card variant="compact">` 渲染的元素 className 包含紧凑 padding 样式
- [ ] 测试：现有 `variant="default/raised/bordered"` 行为不变（回归）

**文件**: `renderer/src/components/primitives/Card.test.tsx`（追加）

### Task 1.3: Tabs variant 系统测试

**映射验收标准**: AC-7, AC-8, AC-9

- [ ] 测试：Tabs 组件接受 `variant` prop，类型为 `"default" | "underline"`
- [ ] 测试：不传 `variant` 时，渲染结果与当前完全一致（snapshot 或 className 比对）
- [ ] 测试：`<Tabs variant="underline">` 的 active TabTrigger 下方存在 indicator 元素（`data-testid="tab-indicator"` 或特定 className）
- [ ] 测试：切换 active tab 时，indicator 跟随移动到新 tab 下方
- [ ] 测试：`variant="underline"` 的 inactive tab 无 indicator

**文件**: `renderer/src/components/primitives/Tabs.test.tsx`（追加）

### Task 1.4: Badge 新 variant 测试

**映射验收标准**: AC-10, AC-11

- [ ] 测试：`<Badge variant="pill">TAG</Badge>` 渲染的元素 className 包含 `uppercase`、圆角、letter-spacing 样式
- [ ] 测试：`variant="pill"` 的 padding 符合设计稿（`6px 14px`）
- [ ] 测试：现有 `variant="default/success/warning/error/info"` 行为不变（回归）

**文件**: `renderer/src/components/primitives/Badge.test.tsx`（追加）

### Task 1.5: Story 存在性测试

**映射验收标准**: AC-12

- [ ] 测试：`Button.stories.tsx` 导出包含 `Pill` 和 `IconOnly` Story
- [ ] 测试：`Card.stories.tsx` 导出包含 `Bento` 和 `Compact` Story
- [ ] 测试：`Tabs.stories.tsx` 导出包含 `Underline` Story
- [ ] 测试：`Badge.stories.tsx` 导出包含 `Pill` Story

**文件**: `apps/desktop/tests/guards/primitive-story-completeness.test.ts`（新建）或在各 Story 文件中作为 guard

---

## Phase 2: Green（实现）

### Task 2.1: Button variant="pill" 和 size="icon"

- [ ] 扩展 `ButtonVariant` type：`"primary" | "secondary" | "ghost" | "danger" | "pill"`
- [ ] 扩展 `ButtonSize` type：`"sm" | "md" | "lg" | "icon"`
- [ ] 在 `variantStyles` map 中添加 `pill` 键：`rounded-[var(--radius-full)]` + 继承 secondary 的背景/边框/hover 样式
- [ ] 在 `sizeStyles` map 中添加 `icon` 键：`w-10 h-10 p-0 flex items-center justify-center`（md 基准），sm 变体 `w-8 h-8 p-0`
- [ ] 更新 JSDoc 注释和使用示例

**文件**: `renderer/src/components/primitives/Button.tsx`

### Task 2.2: Button 新 Story

- [ ] 新增 `Pill` Story：展示 pill 按钮的各种状态（默认/hover/disabled/loading）
- [ ] 新增 `IconOnly` Story：展示 icon-only 按钮的 sm 和 md 尺寸
- [ ] 新增 `PillIcon` Story：展示 pill + icon 的组合

**文件**: `renderer/src/components/primitives/Button.stories.tsx`

### Task 2.3: Card variant="bento" 和 variant="compact"

- [ ] 扩展 `CardVariant` type：`"default" | "raised" | "bordered" | "bento" | "compact"`
- [ ] 在 `variantStyles` map 中添加 `bento` 键：`rounded-[var(--radius-2xl)] p-[var(--space-8)] border border-[var(--color-border)] transition-colors duration-[var(--duration-normal)]`，hoverable 时 `hover:border-[var(--color-border-hover)]`
- [ ] 在 `variantStyles` map 中添加 `compact` 键：`rounded-[var(--radius-md)] p-[var(--space-3)] space-y-[var(--space-1)]`
- [ ] 更新 JSDoc 注释

**文件**: `renderer/src/components/primitives/Card.tsx`

### Task 2.4: Card 新 Story

- [ ] 新增 `Bento` Story：展示 bento card 的默认状态和 hover 边框变亮效果
- [ ] 新增 `Compact` / `StatCard` Story：展示紧凑统计卡片——大号数字 + 小号标签

**文件**: `renderer/src/components/primitives/Card.stories.tsx`

### Task 2.5: Tabs variant 系统

- [ ] 定义 `TabsVariant` type：`"default" | "underline"`
- [ ] 在 `TabsList` 或 `Tabs` 根组件中新增 `variant` prop，默认值 `"default"`
- [ ] 通过 React Context 或 prop drilling 将 variant 传递到 `TabsTrigger`
- [ ] `variant="underline"` 时 `TabsTrigger` 的 active 态渲染 2px 底线（`border-bottom: 2px solid var(--color-accent)` 或 `after` 伪元素），inactive 态无底线
- [ ] 确保 `variant="default"` 时行为与当前完全一致

**文件**: `renderer/src/components/primitives/Tabs.tsx`

### Task 2.6: Tabs 新 Story

- [ ] 新增 `Underline` Story：展示底线指示器风格的 Tabs，3-4 个 tab 切换

**文件**: `renderer/src/components/primitives/Tabs.stories.tsx`

### Task 2.7: Badge variant="pill"

- [ ] 扩展 `BadgeVariant` type：`"default" | "success" | "warning" | "error" | "info" | "pill"`
- [ ] 在 `variantStyles` map 中添加 `pill` 键：`rounded-[var(--radius-full)] px-3.5 py-1.5 uppercase tracking-[var(--tracking-wide)] font-[var(--weight-semibold)] text-[var(--text-label-size)]`
- [ ] 更新 JSDoc 注释

**文件**: `renderer/src/components/primitives/Badge.tsx`

### Task 2.8: Badge 新 Story

- [ ] 新增 `Pill` Story：展示 pill badge 的各种文本长度和颜色组合

**文件**: `renderer/src/components/primitives/Badge.stories.tsx`

### Task 2.9: Radio 组件重构

**映射验收标准**: AC-18

- [ ] 提取 `RadioItem.tsx`：单选项渲染（custom indicator + label + description + disabled 态），≤ 150 行
- [ ] 提取 `useRadioGroup.ts`：选中态管理 + 键盘导航（↑/↓），≤ 80 行
- [ ] 精简 `RadioGroup.tsx` 至 ≤ 200 行（容器布局 + 方向 + spacing + error 状态）
- [ ] 对齐 Design Token：indicator `--color-accent`、focus ring `--color-ring`、error `--color-danger`
- [ ] 更新 Story：RadioGroup 在 Storybook 中有 default / horizontal / with-error / disabled 四态
- [ ] 确认现有 Radio 相关测试全部通过

**文件**: `apps/desktop/renderer/src/components/primitives/Radio.tsx`（拆分）

### Task 2.10: Select 组件重构

**映射验收标准**: AC-19

- [ ] 提取 `SelectContent.tsx`：dropdown 面板 + option 列表 + 搜索过滤 + 空结果态，≤ 200 行
- [ ] 精简 `Select.tsx` 至 ≤ 200 行（trigger 渲染 + Radix Root 集成 + size/variant API）
- [ ] 对齐设计稿：dropdown `--radius-md`、option hover `--bg-hover`、选中 `--bg-selected` + check mark
- [ ] 更新 Story：Select 在 Storybook 中有 default / searchable / multi-select / disabled 四态
- [ ] 确认现有 Select 相关测试全部通过

**文件**: `apps/desktop/renderer/src/components/primitives/Select.tsx`（拆分）

### Task 2.11: ImageUpload 组件重构

**映射验收标准**: AC-20

- [ ] 提取 `ImagePreview.tsx`：预览图渲染 + 裁剪入口（打开 ImageCropper）+ 删除按钮，≤ 150 行
- [ ] 精简 `ImageUpload.tsx` 至 ≤ 200 行（拖拽区 + 文件校验 + 状态机 idle/hover/uploading/error）
- [ ] 对齐 Design Token：border-dashed `--color-border-default`、hover `--color-border-hover`、error `--color-danger`
- [ ] 更新 Story：ImageUpload 在 Storybook 中有 empty / with-preview / uploading / error 四态
- [ ] 确认现有 ImageUpload 相关测试全部通过

**文件**: `apps/desktop/renderer/src/components/primitives/ImageUpload.tsx`（拆分）

---

## Phase 3: Verification（验证）

- [ ] 运行 Phase 1 全部测试，确认全绿
- [ ] 运行 `pnpm -C apps/desktop vitest run` 全量测试通过
- [ ] 运行 `pnpm typecheck` 类型检查通过
- [ ] 运行 `pnpm lint` lint 无新增违规
- [ ] 运行 `pnpm -C apps/desktop storybook:build` Storybook 可构建
- [ ] 视觉验收：在 Storybook 中核对每个新 variant 的渲染效果，与设计稿截图比对
  - Button pill：确认圆角 100px、背景/边框与 secondary 一致
  - Button icon：确认正方形、内容居中
  - Card bento：确认圆角 24px、padding 32px、hover 边框变亮
  - Card compact：确认紧凑 padding、小间距
  - Tabs underline：确认 active tab 下方 2px accent 色线
  - Badge pill：确认 uppercase、圆角、tracking
- [ ] 确认所有现有测试（Button 回归、Card 回归、Badge 回归）通过，零破坏
