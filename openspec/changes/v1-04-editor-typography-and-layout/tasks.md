# Tasks: V1-04 编辑器排版与布局

> ✅ **已合并** — 评级 ⭐⭐⭐⭐ — 所有 Phase 完成，无遗留项

- **GitHub Issue**: 待创建
- **分支**: `task/<N>-editor-typography-and-layout`
- **Delta Spec**: `openspec/changes/v1-04-editor-typography-and-layout/specs/`

---

## 验收标准

| ID    | 标准                                                                                                           | 对应 Scenario | 结果 |
| ----- | -------------------------------------------------------------------------------------------------------------- | ------------- | ---- |
| AC-1  | 编辑器正文区域存在 `max-width: 760px`（或等效 token 值）+ 水平居中                                             | 全局          | ✅ `main.css:570` `--editor-content-max-width: 760px` |
| AC-2  | 编辑器文档标题使用 `--text-display-*` token（48px / weight 300 / letter-spacing -0.03em），不再使用 `text-4xl` | 全局          | ✅ `main.css:579-581` |
| AC-3  | CSS 层面支持 serif 字体（Lora 或等效），通过 CSS 变量或 class 切换                                             | 全局          | ✅ `tokens.css:64` Lora 字体栈 |
| AC-4  | 编辑器正文 line-height 为 1.8（使用 `--leading-relaxed` token）                                                | 全局          | ✅ `tokens.css:53` + CJK 1.95 |
| AC-5  | 编辑器顶部有 featured image 区域 + gradient overlay，当无图片时优雅降级                                        | 全局          | ✅ `EditorFeaturedImage.tsx` |
| AC-6  | 编辑区域侧边 padding 为 40-48px（使用语义间距 token）                                                          | 全局          | ✅ `tokens.css:25` 48px |
| AC-7  | 所有 typography 修改使用 Design Token，0 处新增 Tailwind arbitrary 字号/色值                                   | 全局          | ✅ 全部通过 token |
| AC-8  | Storybook 可构建（`pnpm -C apps/desktop storybook:build`）                                                     | 全局          | ✅ |
| AC-9  | 全量测试通过（`pnpm -C apps/desktop vitest run`）                                                              | 全局          | ✅ |
| AC-10 | TypeScript 类型检查通过（`pnpm typecheck`）                                                                    | 全局          | ✅ |
| AC-11 | lint 无新增违规（`pnpm lint`）                                                                                 | 全局          | ✅ |

---

## Phase 0: 准备

- [x] 阅读 `AGENTS.md`、`design/DESIGN_DECISIONS.md` §4（字体系统）、§19（编辑器交互）
- [x] 阅读设计稿 `design/Variant/designs/07-editor-simple.html` 全文，提取 typography 数值（字号/字重/行高/字间距/max-width/padding）
- [x] 阅读设计稿 `design/Variant/designs/08-editor-workspace.html`，对比两种编辑器布局
- [x] 阅读 `apps/desktop/renderer/src/features/editor/EditorPane.tsx` 中与 typography/layout 相关的代码段
- [x] 阅读 `apps/desktop/renderer/src/styles/` 下编辑器相关 CSS 文件
- [x] 确认 v1-01（Design Token 补完）已合并，`--text-display-*`、`--leading-relaxed` 等 token 可用
- [x] 与 v1-05 协调文件修改边界：本 change 只动 typography/layout 行，不做结构性拆分

---

## Phase 1: Red（测试先行）

### Task 1.1: 正文 max-width 测试

**映射验收标准**: AC-1

- [x] 测试：编辑器正文容器存在 max-width 样式约束（760px 或等效 token 值）
- [x] 测试：正文容器在父容器中水平居中（`margin-left: auto; margin-right: auto` 或等效）

**文件**: `apps/desktop/renderer/src/features/editor/__tests__/EditorTypography.test.tsx`（新建）

### Task 1.2: 标题 typography 测试

**映射验收标准**: AC-2

- [x] 测试：编辑器 H1 标题渲染后不含 `text-4xl` class
- [x] 测试：编辑器 H1 标题使用 `--text-display-*` 相关的 class 或 CSS 变量

**文件**: `apps/desktop/renderer/src/features/editor/__tests__/EditorTypography.test.tsx`

### Task 1.3: Serif 字体支持测试

**映射验收标准**: AC-3

- [x] 测试：编辑器 CSS 中存在 serif 字体 family 定义（Lora 或等效）
- [x] 测试：通过 CSS 变量或 class 切换可激活 serif 字体

**文件**: `apps/desktop/renderer/src/features/editor/__tests__/EditorTypography.test.tsx`

### Task 1.4: 行高测试

**映射验收标准**: AC-4

- [x] 测试：编辑器正文区域 line-height 为 1.8

**文件**: `apps/desktop/renderer/src/features/editor/__tests__/EditorTypography.test.tsx`

### Task 1.5: Featured Image 测试

**映射验收标准**: AC-5

- [x] 测试：当文档 metadata 包含 coverImage 时，编辑器顶部渲染 featured image 区域
- [x] 测试：featured image 区域包含 gradient overlay 效果
- [x] 测试：当无 coverImage 时，featured image 区域不渲染（优雅降级）

**文件**: `apps/desktop/renderer/src/features/editor/__tests__/EditorFeaturedImage.test.tsx`（新建）

### Task 1.6: 编辑区域 padding 测试

**映射验收标准**: AC-6

- [x] 测试：编辑器正文区域侧边 padding 使用语义间距 token（40-48px 范围）

**文件**: `apps/desktop/renderer/src/features/editor/__tests__/EditorTypography.test.tsx`

---

## Phase 2: Green（最小实现）

### Task 2.1: 正文 max-width + 居中

**映射验收标准**: AC-1

- [x] 为 TipTap 编辑器正文容器添加 `max-width: 760px` 和水平居中
- [x] 使用 CSS 变量定义宽度值（如 `--editor-content-max-width: 760px`），便于后续可配置化
- [x] 确保在窄屏时正文自然收缩（`max-width` 不硬截断）

**文件**: `apps/desktop/renderer/src/features/editor/EditorPane.tsx`、编辑器相关 CSS

### Task 2.2: 标题 typography 对齐

**映射验收标准**: AC-2

- [x] 将 H1 标题从 `text-4xl`（36px）改为使用 `--text-display-*` token（48px / weight 300 / -0.03em）
- [x] 确保 H2-H6 标题层级与设计稿对应（如需微调）
- [x] TipTap heading 扩展的 CSS 样式通过编辑器 CSS 文件覆盖

**文件**: `apps/desktop/renderer/src/styles/` 下编辑器 CSS、`EditorPane.tsx`

### Task 2.3: Serif 字体引入

**映射验收标准**: AC-3

- [x] 在编辑器 CSS 中定义 serif 字体 family 变量（如 `--editor-font-serif: 'Lora', serif`）
- [x] 确保字体文件通过现有字体加载机制引入（如 Google Fonts 或本地资产）
- [x] 添加 `.editor-serif` class，应用时切换 `font-family` 为 serif
- [x] 默认保持 sans-serif（Inter），serif 为 opt-in

**文件**: `apps/desktop/renderer/src/styles/` 下编辑器 CSS

### Task 2.4: 正文行高调整

**映射验收标准**: AC-4

- [x] 将编辑器正文段落的 line-height 设置为 `--leading-relaxed`（1.8）
- [x] 确保 TipTap 默认段落样式被正确覆盖

**文件**: `apps/desktop/renderer/src/styles/` 下编辑器 CSS

### Task 2.5: Featured Image 实现

**映射验收标准**: AC-5

- [x] 在编辑器顶部实现 featured image 容器组件
- [x] 实现 gradient overlay（从半透明到不透明的渐变遮罩，对齐 `07-editor-simple.html`）
- [x] 数据来源：从文档 metadata 的 `coverImage` 字段读取图片 URL
- [x] 无图片时：组件不渲染（条件判断），编辑器标题直接顶部对齐
- [x] 图片加载失败时：优雅降级到无图片状态

**文件**: `apps/desktop/renderer/src/features/editor/EditorFeaturedImage.tsx`（新建）、`EditorPane.tsx`（集成）

### Task 2.6: 编辑区域 padding 调整

**映射验收标准**: AC-6

- [x] 将编辑区域侧边 padding 从当前值增加至 40-48px
- [x] 使用语义间距 token 或 CSS 变量定义（如 `--editor-padding-x: 48px`）
- [x] 确保 padding 在 zen mode 和普通模式下均生效

**文件**: `apps/desktop/renderer/src/features/editor/EditorPane.tsx`、编辑器相关 CSS

---

## Phase 3: Verification & Delivery

- [x] 运行 Phase 1 全部测试，确认全绿
- [x] 运行 `pnpm -C apps/desktop vitest run` 全量测试通过
- [x] 运行 `pnpm typecheck` 类型检查通过
- [x] 运行 `pnpm lint` lint 无新增违规
- [x] 运行 `pnpm -C apps/desktop storybook:build` Storybook 可构建
- [x] 目视比对编辑器与 `07-editor-simple.html` 设计稿，确认六项 typography/layout 改动对齐
- [x] 确认宽屏下正文行宽不超过 760px 且水平居中
- [x] 确认 serif 字体在 `.editor-serif` class 下正确渲染
- [x] 确认 featured image 有/无两种情况均正确展示
- [x] 确认 0 处新增 Tailwind arbitrary 字号/色值
- [x] 创建 PR（含 `Closes #N`），附编辑器排版对比截图

---

## EXECUTION_ORDER

无直接下游需刷新。v1-07（Settings 视觉精修）为消费方，不阻塞。
