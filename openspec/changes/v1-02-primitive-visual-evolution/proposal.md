# V1-02 Primitive 组件视觉进化

- **GitHub Issue**: 待创建
- **所属任务簇**: V1（视觉重塑）— Wave 0 地基增强
- **涉及模块**: primitives（Button / Card / Tabs / Badge / Radio / Select / ImageUpload）
- **前端验收**: 需要（Storybook Story + 视觉验收截图）

---

## Why：为什么必须做

### 1. 用户现象

现有 Primitives 层（15,080 行）品质优秀——Button 有 primary/secondary/ghost/danger 四种 variant、sm/md/lg 三种 size；Card 有 default/raised/bordered 三种 variant；Badge 有 default/success/warning/error/info 五种 variant。但当 Wave 1-4 的 Features 层组件要向设计稿对齐时，将发现"积木够用，形状不够"：

- **Dashboard 卡片**（`01-dashboard.html`、`03-dashboard-sidebar-full.html`）使用大圆角 24px bento card（32px padding、hover 边框变亮），当前 Card 最大圆角为 `--radius-lg`（12px），无 bento 变体
- **Dashboard stat card** 展示数字型统计（大号数字 + 小号标签），需要紧凑布局 + 数字加粗突出，当前 Card 无此变体
- **AI 面板 tab**（`14-ai-panel.html`）使用底线指示器风格（active tab 下方 2px accent 色线），当前 Tabs 组件（215 行）无 `variant` 概念，只有默认文字高亮
- **Dashboard 分类标签**（`01-dashboard.html`）使用 pill badge（`padding: 6px 14px`、`uppercase`、`tracking: 0.05em`），当前 Badge 无 pill 形态
- **纯图标按钮**（`05-file-tree.html`、`14-ai-panel.html`）需要 `size="icon"`（40×40px 或 32×32px 正方形），当前 Button size 系统只能通过 `sm` 近似，但比例不对
- **Settings 开关区域**（`20-settings-appearance.html`）大量使用 pill 形按钮（`border-radius: 100px`），当前 Button 最大圆角为 `--radius-md`（8px）

如果不在 Wave 0 补齐这些变体，Wave 1-4 的每个 Feature 组件都将自行实现——"规矩不立于始，必散于末。"

### 2. 根因

Primitives 初建时以 MVP 功能覆盖为目标，variant 设计遵循最小必要原则。设计稿在 Primitives 之后完成定稿，设计稿使用的变体超出了 Primitives 初始覆盖范围。具体差距：

| 组件             | 当前 variant                                         | 设计稿需要                                                  | 缺口                                     |
| ---------------- | ---------------------------------------------------- | ----------------------------------------------------------- | ---------------------------------------- |
| Button（198 行） | primary / secondary / ghost / danger × sm / md / lg  | + pill 形态 + icon-only size                                | `variant="pill"` 和 `size="icon"`        |
| Card（104 行）   | default / raised / bordered                          | + bento（大圆角 24px、32px padding）+ compact（紧凑统计卡） | `variant="bento"` 和 `variant="compact"` |
| Tabs（215 行）   | 无 variant 系统                                      | + underline（底线指示器）                                   | `variant="underline"`                    |
| Badge（105 行）  | default / success / warning / error / info × sm / md | + pill 形态 + category 色彩主题（蓝/紫/绿/黄/红）           | `variant="pill"` 和主题色扩展            |

### 3. 威胁

- **变体泛滥**：若各 Feature 自行实现设计稿需要的视觉样式（如 bento card、pill badge），将产生多个不兼容的局部实现——目前已在 Dashboard 相关代码中看到直接使用 `rounded-[24px]` 的迹象
- **主题不一致**：Primitives 的 variant 统一通过 Design Token 着色，如果 Feature 层自建变体则无法保证暗/浅色主题一致
- **Story 缺失**：新 variant 若不在 Primitives 层建立 Story，Storybook 将无法展示完整的组件库，视觉验收将缺乏基准

### 4. 证据来源

| 数据点              | 值                                                         | 来源                                                  |
| ------------------- | ---------------------------------------------------------- | ----------------------------------------------------- |
| Button.tsx 行数     | 198 行                                                     | `wc -l primitives/Button.tsx`                         |
| Card.tsx 行数       | 104 行                                                     | `wc -l primitives/Card.tsx`                           |
| Tabs.tsx 行数       | 215 行                                                     | `wc -l primitives/Tabs.tsx`                           |
| Badge.tsx 行数      | 105 行                                                     | `wc -l primitives/Badge.tsx`                          |
| Button 现有 variant | `"primary" \| "secondary" \| "ghost" \| "danger"`          | `grep ButtonVariant Button.tsx`                       |
| Button 现有 size    | `"sm" \| "md" \| "lg"`                                     | `grep ButtonSize Button.tsx`                          |
| Card 现有 variant   | `"default" \| "raised" \| "bordered"`                      | `grep CardVariant Card.tsx`                           |
| Badge 现有 variant  | `"default" \| "success" \| "warning" \| "error" \| "info"` | `grep BadgeVariant Badge.tsx`                         |
| Tabs variant        | 无                                                         | `grep variant Tabs.tsx` → 无匹配                      |
| Bento card 设计     | 圆角 24px、padding 32px、hover 边框变亮                    | `01-dashboard.html`、`03-dashboard-sidebar-full.html` |
| AI tab 底线         | 2px accent 色底线                                          | `14-ai-panel.html`                                    |
| Pill badge          | `padding: 6px 14px, uppercase, tracking: 0.05em`           | `01-dashboard.html`                                   |
| Icon button 尺寸    | 40×40px / 32×32px                                          | `05-file-tree.html`、`14-ai-panel.html`               |

---

## What：做什么

### 1. Button 增强

- 新增 `variant="pill"`：`border-radius: var(--radius-full)`（100px），其余样式继承 `secondary` variant（背景/边框/hover 行为一致）
- 新增 `size="icon"`：宽高相等正方形（md 对应 40×40px、sm 对应 32×32px），`padding: 0`，内容 flex 居中
- 更新 `ButtonVariant` type 定义、`variantStyles` map、`sizeStyles` map
- 新增对应 Story variants
- 新增对应测试用例

### 2. Card 增强

- 新增 `variant="bento"`：`border-radius: var(--radius-2xl)`（24px）、`padding: var(--space-8)`（32px）、hover 时 `border-color` 过渡到 `--color-border-hover`
- 新增 `variant="compact"`：紧凑布局用于 stat card（`padding: var(--space-3)`（12px）、行间距 `var(--space-1)`（4px）），适合展示大号数字 + 小号标签的统计卡片
- 更新 `CardVariant` type 定义、`variantStyles` map
- 新增对应 Story variants
- 新增对应测试用例

### 3. Tabs 增强

- 在 Tabs 组件中引入 `variant` prop 系统：`"default" | "underline"`
- `variant="underline"`：active tab 底部显示 2px 线条，颜色使用 `--color-accent`；tab 文字 hover 态改变不透明度；tab 之间用 inline gap 分隔
- 更新 Tabs 相关 type 定义
- 新增对应 Story variants
- 新增对应测试用例

### 4. Badge 增强

- 新增 `variant="pill"`：`border-radius: var(--radius-full)`、`padding: 6px 14px`、`text-transform: uppercase`、`letter-spacing: var(--tracking-wide)`（来自 v1-01）、`font-weight: var(--weight-semibold)`（来自 v1-01）
- 新增 `variant="category"` 支持传入 `color` prop 的主题色 badge（蓝/紫/绿/黄/红），每种颜色对应一对 `background` / `color` token
- 更新 `BadgeVariant` type 定义、`variantStyles` map
- 新增对应 Story variants
- 新增对应测试用例

### 5. Radio 组件结构化重构（493 → ≤ 200 行 × 2-3 文件）

当前 Radio.tsx（493 行）承载了 RadioGroup 容器 + RadioItem 单项 + 描述文本 + error 状态 + disabled 态，全部堆叠在单文件中。

**重构方案**：

- `RadioGroup.tsx`：容器布局 + 方向控制 + aria-radiogroup 语义，≤ 200 行
- `RadioItem.tsx`：单选项渲染（indicator + label + description），≤ 150 行
- `useRadioGroup.ts`：选中态管理 hook（value/onChange），≤ 80 行
- 对齐 Design Token：indicator 使用 `--color-accent`，focus ring 使用 `--color-ring`

### 6. Select 组件视觉对齐与拆分（350 → ≤ 200 行 × 2 文件）

Select.tsx（350 行）包含 trigger + dropdown + option list + 搜索过滤 + 多选支持。

**重构方案**：

- `Select.tsx`：trigger + Radix Select.Root 集成，≤ 200 行
- `SelectContent.tsx`：dropdown 面板 + option 渲染 + 搜索过滤，≤ 200 行
- 对齐设计稿：dropdown 圆角 `--radius-md`、option hover `--bg-hover`、active `--bg-selected`

### 7. ImageUpload 组件解耦（335 → ≤ 200 行 × 2 文件）

ImageUpload.tsx（335 行）混合了拖拽区渲染、文件校验、预览图、裁剪集成。

**重构方案**：

- `ImageUpload.tsx`：拖拽区 + 交互态（idle/hover/uploading/error），≤ 200 行
- `ImagePreview.tsx`：预览图渲染 + 裁剪入口 + 删除操作，≤ 150 行
- 对齐 Design Token：border-dashed 使用 `--color-border-default`、hover 使用 `--color-border-hover`

---

## Non-Goals：不做什么

1. **不修改 Primitives 现有 variant 的行为**——`primary`/`secondary`/`ghost`/`danger` 按钮、`default`/`raised`/`bordered` 卡片等现有 variant 的样式和行为完全保持不变
2. **不修改现有 API 的类型签名**——只扩展 union type（如 `ButtonVariant` 添加 `"pill"`），不修改现有成员的语义
3. **不在 Primitives 中使用 Feature 级逻辑**——Primitives 保持纯视觉组件，不引入业务概念（如 "AI"、"Dashboard"）
4. **不修改其他未列出的 Primitives**——本 change 仅涉及 Button / Card / Tabs / Badge / Radio / Select / ImageUpload 七个组件
5. **不做 Features 层的大面积迁移**——本 change 只扩展 Primitives variant，不替换 Features 层的现有实现；Features 层迁移在 Wave 1-4 逐模块进行
6. **不引入新依赖**——所有 variant 通过 CSS / Tailwind 实现，不引入 Framer Motion 或其他动效库

---

## 依赖与影响

- **上游依赖**: v1-01（Design Token 补完）——Tabs `variant="underline"` 使用 `--color-accent`；Badge `variant="pill"` 使用 `--tracking-wide` 和 `--weight-semibold`；Card `variant="bento"` 使用 `--radius-2xl`（已存在）和 `--space-8`（已存在）
- **被依赖于**: v1-03（Dashboard）需要 bento Card、compact Card、pill Badge；v1-06（AI 面板）需要 underline Tabs；v1-07（Settings）需要 pill Button；v1-08（FileTree）需要 icon Button
- **并行安全**: 本 change 只扩展 union type 和追加 variant 样式，不修改现有 variant，合并冲突风险低
- **风险**: Tabs 引入 variant 系统是对 Tabs 组件 API 的结构性变更（从无 variant 到有 variant），需确保默认值 `"default"` 使现有使用方无需修改
