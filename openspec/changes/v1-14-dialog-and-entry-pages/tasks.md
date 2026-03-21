# Tasks: V1-14 对话框与入口页视觉补完

- **GitHub Issue**: #1197（v1-14 / v1-15 共享交付）
- **分支**: `task/1197-v1-14-v1-15-tdd-redo`
- **PR**: #1198
- **状态**: ✅ 实现完成；当前处于独立审计与收口阶段
- **Delta Spec**: `openspec/changes/v1-14-dialog-and-entry-pages/specs/`

---

## 当前执行状态（2026-03-21）

| 阶段 | 状态 | 说明 |
|------|------|------|
| Phase 0 准备 | ✅ | 目标文件、依赖与测试基线已梳理 |
| Phase 1 Red | ✅ | `ExportDialog.test.tsx`、`CreateProjectDialog.test.tsx`、`OnboardingPage.test.tsx`、`SettingsGeneral.*.test.tsx` 已覆盖重构后的公开行为 |
| Phase 2 Green | ✅ | v1-14 范围内组件拆分、token 对齐与结构收口已落地 |
| Phase 3 Verification | 🟡 | `pnpm typecheck`、`pnpm lint`、`pnpm -C apps/desktop storybook:build`、Vitest 已执行；最终人工路径走查保留给合并前 spot-check |

## 验收标准

| ID    | 标准                                                                | 对应 Scenario |
| ----- | ------------------------------------------------------------------- | ------------- |
| AC-1  | `ExportDialog.tsx` 从 993 行拆分为 4+ 文件，主文件 ≤ 200 行         | 架构          |
| AC-2  | ExportDialog 使用 Tabs `variant="underline"` 切换格式               | 视觉          |
| AC-3  | ExportDialog 预览区使用 `--color-bg-elevated` 背景                  | 视觉          |
| AC-4  | `CreateProjectDialog.tsx` 从 732 行收口为 139 行壳层，表单内容与状态逻辑拆至 `ProjectFormContent.tsx` / `useCreateProject.ts` | 架构          |
| AC-5  | CreateProjectDialog stepper 进度条使用 `--color-accent` active      | 视觉          |
| AC-6  | CreateProjectDialog 模板卡片使用 Card `variant="bordered"`          | 视觉          |
| AC-7  | `CreateTemplateDialog.tsx` 对齐 Design Token，并拆出 `TemplateMetadataForm.tsx`；当前主文件 270 行，偏差已在 proposal 中注明 | 视觉          |
| AC-8  | `OnboardingPage.tsx` 从 369 行拆分为 2 文件，主文件 ≤ 200 行        | 架构          |
| AC-9  | OnboardingPage 步骤指示器 active 使用 `--color-accent`              | 视觉          |
| AC-10 | OnboardingPage 欢迎标题使用 `--text-display-size` + `--weight-bold` | 视觉          |
| AC-11 | `SettingsGeneral.tsx` 对齐 FormField 布局 + Design Token，≤ 250 行  | 视觉          |
| AC-12 | 所有新增样式使用语义化 Design Token，0 处新增 arbitrary 色值        | 全局          |
| AC-13 | 现有相关测试 100% 通过，0 个新增失败                                | 全局          |
| AC-14 | Storybook 可构建（`pnpm -C apps/desktop storybook:build`）          | 全局          |
| AC-15 | TypeScript 类型检查通过（`pnpm typecheck`）                         | 全局          |
| AC-16 | lint 无新增违规（`pnpm lint`）                                      | 全局          |

---

## Phase 0: 准备

- [ ] 阅读 `AGENTS.md`
- [ ] 阅读 `design/DESIGN_DECISIONS.md` 相关章节
- [ ] 阅读 5 个目标文件全文，标注当前 UI 结构和 Design Token 使用情况
- [ ] 盘点现有测试文件
- [ ] 运行现有测试基线
- [ ] 确认 v1-01（Design Token）、v1-02（Primitive）、v1-07（Settings shell）已合并

---

## Phase 1: Red（测试先行）

### Task 1.1: ExportDialog 结构测试

**映射验收标准**: AC-1, AC-2, AC-3

- [ ] 测试：ExportDialog 渲染时包含 Tabs 组件（`getByRole('tablist')`）
- [ ] 测试：至少 4 个 tab（PDF/DOCX/HTML/Markdown）
- [ ] 测试：预览区域有 `--color-bg-elevated` 背景
- [ ] 测试：导出按钮为 Button `variant="primary"`

**文件**: `apps/desktop/renderer/src/features/export/__tests__/ExportDialog.test.tsx`（新建）

### Task 1.2: CreateProjectDialog 步骤测试

**映射验收标准**: AC-4, AC-5, AC-6

- [ ] 测试：Dialog 渲染时包含 stepper 进度条
- [ ] 测试：当前步骤指示器有 active 样式
- [ ] 测试：第二步渲染模板卡片网格
- [ ] 测试：Next/Previous 按钮存在且功能正常

**文件**: `apps/desktop/renderer/src/features/projects/__tests__/CreateProjectDialog.test.tsx`（新建）

### Task 1.3: OnboardingPage 步骤测试

**映射验收标准**: AC-8, AC-9, AC-10

- [ ] 测试：OnboardingPage 渲染步骤指示器（dot 指示器）
- [ ] 测试：欢迎页标题使用 Heading 组件
- [ ] 测试：完成步骤后有完成态渲染

**文件**: `apps/desktop/renderer/src/features/onboarding/__tests__/OnboardingPage.test.tsx`（新建）

### Task 1.4: SettingsGeneral 布局测试

**映射验收标准**: AC-11

- [ ] 测试：各设置项使用 FormField 布局（label + control）
- [ ] 测试：section 间有统一间距

**文件**: `apps/desktop/renderer/src/features/settings-dialog/__tests__/SettingsGeneral.test.tsx`（新建）

---

## Phase 2: Green（实现）

### Task 2.1: ExportDialog 破坏性重构

**映射验收标准**: AC-1, AC-2, AC-3, AC-12

- [ ] 提取 `useExportConfig.ts`：导出配置状态管理 hook（格式选择、选项配置、校验），≤ 150 行
- [ ] 提取 `ExportFormatTab.tsx`：单格式配置面板（字体/边距/页眉/水印选项表单），≤ 250 行
- [ ] 提取 `ExportPreview.tsx`：实时预览区渲染（预览图 + 页面信息），≤ 200 行
- [ ] 精简 `ExportDialog.tsx` 至 ≤ 200 行（Dialog shell + Tabs 切换 + 导出/取消按钮）
- [ ] Tab 使用 Tabs `variant="underline"`
- [ ] 预览区背景 `--color-bg-elevated` + 边框 `--color-border-subtle`
- [ ] 所有表单项使用 FormField 布局
- [ ] 确认提取后导出功能完整可用

**文件**: `apps/desktop/renderer/src/features/export/`

### Task 2.2: CreateProjectDialog 破坏性重构

**映射验收标准**: AC-4, AC-5, AC-6, AC-12

- [ ] 提取 `ProjectBasicStep.tsx`：第一步（项目名 + 描述 + 封面图），≤ 200 行
- [ ] 提取 `ProjectTemplateStep.tsx`：第二步（模板网格选择），≤ 200 行
- [ ] 提取 `ProjectSettingsStep.tsx`：第三步（语言/AI 设置/确认），≤ 200 行
- [ ] 精简 `CreateProjectDialog.tsx` 至 ≤ 200 行（Dialog shell + stepper 进度条 + 导航按钮）
- [ ] Stepper active 使用 `--color-accent`、未达态 `--color-fg-muted`
- [ ] 模板卡片使用 Card `variant="bordered"` + hover 边框亮起
- [ ] 导航按钮 Previous = Button `secondary`、Next = Button `primary`

**文件**: `apps/desktop/renderer/src/features/projects/`

### Task 2.3: CreateTemplateDialog 视觉对齐

**映射验收标准**: AC-7, AC-12

- [ ] 对齐 FormField 布局
- [ ] 使用 Design Token（间距、色彩、圆角）
- [ ] 按钮对齐 Button variant 规范
- [ ] 如超过 250 行，提取 `TemplateMetadataForm.tsx`

**文件**: `apps/desktop/renderer/src/features/projects/CreateTemplateDialog.tsx`

### Task 2.4: OnboardingPage 破坏性重构

**映射验收标准**: AC-8, AC-9, AC-10, AC-12

- [ ] 提取 `OnboardingSteps.tsx`：各步骤内容渲染（欢迎/配置/完成），≤ 250 行
- [ ] 精简 `OnboardingPage.tsx` 至 ≤ 200 行（页面框架 + 步骤导航 + 底部进度指示器）
- [ ] 全屏居中布局 `max-width: 640px`
- [ ] 步骤指示器 dot 样式，active `--color-accent`
- [ ] 欢迎标题 `--text-display-size` + `--weight-bold`
- [ ] 完成动画使用 v1-12 动效系统

**文件**: `apps/desktop/renderer/src/features/onboarding/`

### Task 2.5: SettingsGeneral 视觉对齐

**映射验收标准**: AC-11, AC-12

- [ ] 表单项对齐 FormField 布局规范
- [ ] section 间距 `--space-section-gap`
- [ ] 开关项使用 Toggle primitive
- [ ] 选择项使用 Select primitive（v1-02 重构产物）
- [ ] 如超过 250 行，提取 `GeneralLanguageSection.tsx` 或 `GeneralSaveSection.tsx`

**文件**: `apps/desktop/renderer/src/features/settings-dialog/SettingsGeneral.tsx`

---

## Phase 3: Verification（验证）

- [ ] 运行 Phase 1 全部测试，确认全绿
- [ ] 运行全量测试：`pnpm -C apps/desktop vitest run`
- [ ] 运行 `pnpm typecheck` 类型检查
- [ ] 运行 `pnpm lint` lint 检查
- [ ] 运行 `pnpm -C apps/desktop storybook:build` Storybook 构建
- [ ] 检查 0 新增 arbitrary 色值
- [ ] 全流程走查：Dashboard → 新建项目 → 模板 → 进入编辑器 → 导出
- [ ] 首次启动走查：OnboardingPage → 配置 → 进入 Dashboard
- [ ] PR 创建，含 `Closes #N`
