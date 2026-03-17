# Tasks: V1-04 编辑器排版与布局

- **GitHub Issue**: 待创建
- **分支**: `task/<N>-editor-typography-and-layout`
- **Delta Spec**: `openspec/changes/v1-04-editor-typography-and-layout/specs/`

---

## 验收标准

| ID    | 标准                                                                                                           | 对应 Scenario |
| ----- | -------------------------------------------------------------------------------------------------------------- | ------------- |
| AC-1  | 编辑器正文区域存在 `max-width: 760px`（或等效 token 值）+ 水平居中                                             | 全局          |
| AC-2  | 编辑器文档标题使用 `--text-display-*` token（48px / weight 300 / letter-spacing -0.03em），不再使用 `text-4xl` | 全局          |
| AC-3  | CSS 层面支持 serif 字体（Lora 或等效），通过 CSS 变量或 class 切换                                             | 全局          |
| AC-4  | 编辑器正文 line-height 为 1.8（使用 `--leading-relaxed` token）                                                | 全局          |
| AC-5  | 编辑器顶部有 featured image 区域 + gradient overlay，当无图片时优雅降级                                        | 全局          |
| AC-6  | 编辑区域侧边 padding 为 40-48px（使用语义间距 token）                                                          | 全局          |
| AC-7  | 所有 typography 修改使用 Design Token，0 处新增 Tailwind arbitrary 字号/色值                                   | 全局          |
| AC-8  | Storybook 可构建（`pnpm -C apps/desktop storybook:build`）                                                     | 全局          |
| AC-9  | 全量测试通过（`pnpm -C apps/desktop vitest run`）                                                              | 全局          |
| AC-10 | TypeScript 类型检查通过（`pnpm typecheck`）                                                                    | 全局          |
| AC-11 | lint 无新增违规（`pnpm lint`）                                                                                 | 全局          |

---

## Phase 0: 准备

- [ ] 阅读 `AGENTS.md`、`design/DESIGN_DECISIONS.md` §4（字体系统）、§19（编辑器交互）
- [ ] 阅读设计稿 `design/Variant/designs/07-editor-simple.html` 全文，提取 typography 数值（字号/字重/行高/字间距/max-width/padding）
- [ ] 阅读设计稿 `design/Variant/designs/08-editor-workspace.html`，对比两种编辑器布局
- [ ] 阅读 `apps/desktop/renderer/src/features/editor/EditorPane.tsx` 中与 typography/layout 相关的代码段
- [ ] 阅读 `apps/desktop/renderer/src/styles/` 下编辑器相关 CSS 文件
- [ ] 确认 v1-01（Design Token 补完）已合并，`--text-display-*`、`--leading-relaxed` 等 token 可用
- [ ] 与 v1-05 协调文件修改边界：本 change 只动 typography/layout 行，不做结构性拆分

---

## Phase 1: Red（测试先行）

### Task 1.1: 正文 max-width 测试

**映射验收标准**: AC-1

- [ ] 测试：编辑器正文容器存在 max-width 样式约束（760px 或等效 token 值）
- [ ] 测试：正文容器在父容器中水平居中（`margin-left: auto; margin-right: auto` 或等效）

**文件**: `apps/desktop/renderer/src/features/editor/__tests__/EditorTypography.test.tsx`（新建）

### Task 1.2: 标题 typography 测试

**映射验收标准**: AC-2

- [ ] 测试：编辑器 H1 标题渲染后不含 `text-4xl` class
- [ ] 测试：编辑器 H1 标题使用 `--text-display-*` 相关的 class 或 CSS 变量

**文件**: `apps/desktop/renderer/src/features/editor/__tests__/EditorTypography.test.tsx`

### Task 1.3: Serif 字体支持测试

**映射验收标准**: AC-3

- [ ] 测试：编辑器 CSS 中存在 serif 字体 family 定义（Lora 或等效）
- [ ] 测试：通过 CSS 变量或 class 切换可激活 serif 字体

**文件**: `apps/desktop/renderer/src/features/editor/__tests__/EditorTypography.test.tsx`

### Task 1.4: 行高测试

**映射验收标准**: AC-4

- [ ] 测试：编辑器正文区域 line-height 为 1.8

**文件**: `apps/desktop/renderer/src/features/editor/__tests__/EditorTypography.test.tsx`

### Task 1.5: Featured Image 测试

**映射验收标准**: AC-5

- [ ] 测试：当文档 metadata 包含 coverImage 时，编辑器顶部渲染 featured image 区域
- [ ] 测试：featured image 区域包含 gradient overlay 效果
- [ ] 测试：当无 coverImage 时，featured image 区域不渲染（优雅降级）

**文件**: `apps/desktop/renderer/src/features/editor/__tests__/EditorFeaturedImage.test.tsx`（新建）

### Task 1.6: 编辑区域 padding 测试

**映射验收标准**: AC-6

- [ ] 测试：编辑器正文区域侧边 padding 使用语义间距 token（40-48px 范围）

**文件**: `apps/desktop/renderer/src/features/editor/__tests__/EditorTypography.test.tsx`

---

## Phase 2: Green（最小实现）

### Task 2.1: 正文 max-width + 居中

**映射验收标准**: AC-1

- [ ] 为 TipTap 编辑器正文容器添加 `max-width: 760px` 和水平居中
- [ ] 使用 CSS 变量定义宽度值（如 `--editor-content-max-width: 760px`），便于后续可配置化
- [ ] 确保在窄屏时正文自然收缩（`max-width` 不硬截断）

**文件**: `apps/desktop/renderer/src/features/editor/EditorPane.tsx`、编辑器相关 CSS

### Task 2.2: 标题 typography 对齐

**映射验收标准**: AC-2

- [ ] 将 H1 标题从 `text-4xl`（36px）改为使用 `--text-display-*` token（48px / weight 300 / -0.03em）
- [ ] 确保 H2-H6 标题层级与设计稿对应（如需微调）
- [ ] TipTap heading 扩展的 CSS 样式通过编辑器 CSS 文件覆盖

**文件**: `apps/desktop/renderer/src/styles/` 下编辑器 CSS、`EditorPane.tsx`

### Task 2.3: Serif 字体引入

**映射验收标准**: AC-3

- [ ] 在编辑器 CSS 中定义 serif 字体 family 变量（如 `--editor-font-serif: 'Lora', serif`）
- [ ] 确保字体文件通过现有字体加载机制引入（如 Google Fonts 或本地资产）
- [ ] 添加 `.editor-serif` class，应用时切换 `font-family` 为 serif
- [ ] 默认保持 sans-serif（Inter），serif 为 opt-in

**文件**: `apps/desktop/renderer/src/styles/` 下编辑器 CSS

### Task 2.4: 正文行高调整

**映射验收标准**: AC-4

- [ ] 将编辑器正文段落的 line-height 设置为 `--leading-relaxed`（1.8）
- [ ] 确保 TipTap 默认段落样式被正确覆盖

**文件**: `apps/desktop/renderer/src/styles/` 下编辑器 CSS

### Task 2.5: Featured Image 实现

**映射验收标准**: AC-5

- [ ] 在编辑器顶部实现 featured image 容器组件
- [ ] 实现 gradient overlay（从半透明到不透明的渐变遮罩，对齐 `07-editor-simple.html`）
- [ ] 数据来源：从文档 metadata 的 `coverImage` 字段读取图片 URL
- [ ] 无图片时：组件不渲染（条件判断），编辑器标题直接顶部对齐
- [ ] 图片加载失败时：优雅降级到无图片状态

**文件**: `apps/desktop/renderer/src/features/editor/EditorFeaturedImage.tsx`（新建）、`EditorPane.tsx`（集成）

### Task 2.6: 编辑区域 padding 调整

**映射验收标准**: AC-6

- [ ] 将编辑区域侧边 padding 从当前值增加至 40-48px
- [ ] 使用语义间距 token 或 CSS 变量定义（如 `--editor-padding-x: 48px`）
- [ ] 确保 padding 在 zen mode 和普通模式下均生效

**文件**: `apps/desktop/renderer/src/features/editor/EditorPane.tsx`、编辑器相关 CSS

---

## Phase 3: Verification & Delivery

- [ ] 运行 Phase 1 全部测试，确认全绿
- [ ] 运行 `pnpm -C apps/desktop vitest run` 全量测试通过
- [ ] 运行 `pnpm typecheck` 类型检查通过
- [ ] 运行 `pnpm lint` lint 无新增违规
- [ ] 运行 `pnpm -C apps/desktop storybook:build` Storybook 可构建
- [ ] 目视比对编辑器与 `07-editor-simple.html` 设计稿，确认六项 typography/layout 改动对齐
- [ ] 确认宽屏下正文行宽不超过 760px 且水平居中
- [ ] 确认 serif 字体在 `.editor-serif` class 下正确渲染
- [ ] 确认 featured image 有/无两种情况均正确展示
- [ ] 确认 0 处新增 Tailwind arbitrary 字号/色值
- [ ] 创建 PR（含 `Closes #N`），附编辑器排版对比截图
