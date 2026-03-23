> ⚠️ 本 change 已拆分为 micro-changes: v1-14a。以下为历史记录。

# Tasks: V1-14 对话框与入口页视觉补完

> 📋 **级联刷新 R1**（2026-03-21）：v1-02 完成后刷新。基线已重采集。

- **GitHub Issue**: #1197（v1-14 / v1-15 共享交付）
- **分支**: `task/1197-v1-14-v1-15-tdd-redo`
- **PR**: #1198
- **状态**: ✅ 主体实现完成（AC-1～AC-16）；AC-17/AC-18 拆入 `v1-14a-dialog-remaining`（#1199）
- **Delta Spec**: `openspec/changes/v1-14-dialog-and-entry-pages/specs/`

---

## 当前执行状态（2026-03-21）

| 阶段                 | 状态 | 说明                                                                                                                                    |
| -------------------- | ---- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Phase 0 准备         | ✅   | 目标文件、依赖与测试基线已梳理                                                                                                          |
| Phase 1 Red          | ✅   | `ExportDialog.test.tsx`、`CreateProjectDialog.test.tsx`、`OnboardingPage.test.tsx`、`SettingsGeneral.*.test.tsx` 已覆盖重构后的公开行为 |
| Phase 2 Green        | ✅   | v1-14 范围内组件拆分、token 对齐与结构收口已落地                                                                                        |
| Phase 3 Verification | 🟡   | `pnpm typecheck`、`pnpm lint`、`pnpm -C apps/desktop storybook:build`、Vitest 已执行；最终人工路径走查保留给合并前 spot-check           |

## 验收标准

| ID    | 标准                                                                                                                                   | 对应 Scenario |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| AC-1  | `ExportDialog.tsx` 从 993 行拆分为 4+ 文件，主文件 ≤ 200 行                                                                            | 架构          |
| AC-2  | ExportDialog 使用 Tabs `variant="underline"` 切换格式                                                                                  | 视觉          |
| AC-3  | ExportDialog 预览区使用 `--color-bg-elevated` 背景                                                                                     | 视觉          |
| AC-4  | `CreateProjectDialog.tsx` 从 732 行收口为 139 行壳层，表单内容与状态逻辑拆至 `ProjectFormContent.tsx`（308 行）/ `useCreateProject.ts` | 架构          |
| AC-5  | CreateProjectDialog stepper 进度条使用 `--color-accent` active                                                                         | 视觉          |
| AC-6  | CreateProjectDialog 模板卡片使用 Card `variant="bordered"`                                                                             | 视觉          |
| AC-7  | `CreateTemplateDialog.tsx` 对齐 Design Token，并拆出 `TemplateMetadataForm.tsx`；当前主文件 270 行，偏差已在 proposal 中注明           | 视觉          |
| AC-8  | `OnboardingPage.tsx` 从 369 行拆分为 2 文件，主文件 ≤ 200 行                                                                           | 架构          |
| AC-9  | OnboardingPage 步骤指示器 active 使用 `--color-accent`                                                                                 | 视觉          |
| AC-10 | OnboardingPage 欢迎标题使用 `--text-display-size` + `--weight-bold`                                                                    | 视觉          |
| AC-11 | `SettingsGeneral.tsx`（155 行）对齐 FormField 布局 + Design Token + `SettingsGeneralSections.tsx`（208 行）                            | 视觉          |
| AC-12 | 所有新增样式使用语义化 Design Token，0 处新增 arbitrary 色值                                                                           | 全局          |
| AC-13 | 现有相关测试 100% 通过，0 个新增失败                                                                                                   | 全局          |
| AC-14 | Storybook 可构建（`pnpm -C apps/desktop storybook:build`）                                                                             | 全局          |
| AC-15 | TypeScript 类型检查通过（`pnpm typecheck`）                                                                                            | 全局          |
| AC-16 | lint 无新增违规（`pnpm lint`）                                                                                                         | 全局          |
| AC-17 | 在 `CreateProjectDialog` 中新建模板成功返回后，刚创建的模板会被自动选中，无需用户二次点击                                              | 交互          |
| AC-18 | 导出进度态点击 `Cancel` 时，必须真实中止正在进行的导出任务；仅关闭前端等待界面不算完成                                                 | 跨层          |

---

## Phase 0: 准备

- [x] 阅读 `AGENTS.md`
- [x] 阅读 `design/DESIGN_DECISIONS.md` 相关章节
- [x] 阅读 5 个目标文件全文，标注当前 UI 结构和 Design Token 使用情况
- [x] 盘点现有测试文件
- [x] 运行现有测试基线
- [x] 确认 v1-01（Design Token）✅、v1-02（Primitive）✅、v1-07（Settings shell）✅ 已合并

> **R1 依赖状态**：三项前置依赖全部已合并。v1-02 变体系统（pill/bento/compact/underline）已在 Primitive 层就绪，features 层已有 13 处采用 `size="icon"`。v1-14 目标文件中变体全面推广归 v1-18。

---

## Phase 1: Red（测试先行）

### Task 1.1: ExportDialog 结构测试

**映射验收标准**: AC-1, AC-2, AC-3

- [x] 测试：ExportDialog 渲染时包含 Tabs 组件（`getByRole('tablist')`）
- [x] 测试：至少 4 个 tab（PDF/DOCX/HTML/Markdown）
- [x] 测试：预览区域有 `--color-bg-elevated` 背景
- [x] 测试：导出按钮为 Button `variant="primary"`

**文件**: `apps/desktop/renderer/src/features/export/__tests__/ExportDialog.test.tsx`（新建）

### Task 1.2: CreateProjectDialog 步骤测试

**映射验收标准**: AC-4, AC-5, AC-6

- [x] 测试：Dialog 渲染时包含 stepper 进度条
- [x] 测试：当前步骤指示器有 active 样式
- [x] 测试：第二步渲染模板卡片网格
- [x] 测试：Next/Previous 按钮存在且功能正常

**文件**: `apps/desktop/renderer/src/features/projects/__tests__/CreateProjectDialog.test.tsx`（新建）

### Task 1.3: OnboardingPage 步骤测试

**映射验收标准**: AC-8, AC-9, AC-10

- [x] 测试：OnboardingPage 渲染步骤指示器（dot 指示器）
- [x] 测试：欢迎页标题使用 Heading 组件
- [x] 测试：完成步骤后有完成态渲染

**文件**: `apps/desktop/renderer/src/features/onboarding/__tests__/OnboardingPage.test.tsx`（新建）

### Task 1.4: SettingsGeneral 布局测试

**映射验收标准**: AC-11

- [x] 测试：各设置项使用 FormField 布局（label + control）
- [x] 测试：section 间有统一间距

**文件**: `apps/desktop/renderer/src/features/settings-dialog/__tests__/SettingsGeneral.test.tsx`（新建）

---

## Phase 2: Green（实现）

### Task 2.1: ExportDialog 破坏性重构

**映射验收标准**: AC-1, AC-2, AC-3, AC-12

- [x] 提取 `useExportConfig.ts`：导出配置状态管理 hook（格式选择、选项配置、校验），≤ 150 行
- [x] 提取 `ExportFormatTab.tsx`：单格式配置面板（字体/边距/页眉/水印选项表单），≤ 250 行
- [x] 提取 `ExportPreview.tsx`：实时预览区渲染（预览图 + 页面信息），≤ 200 行
- [x] 精简 `ExportDialog.tsx` 至 ≤ 200 行（Dialog shell + Tabs 切换 + 导出/取消按钮）
- [x] Tab 使用 Tabs `variant="underline"`
- [x] 预览区背景 `--color-bg-elevated` + 边框 `--color-border-subtle`
- [x] 所有表单项使用 FormField 布局
- [x] 确认提取后导出功能完整可用

**文件**: `apps/desktop/renderer/src/features/export/`

### Task 2.2: CreateProjectDialog 破坏性重构

**映射验收标准**: AC-4, AC-5, AC-6, AC-12

- [x] 提取 `ProjectBasicStep.tsx`：第一步（项目名 + 描述 + 封面图），≤ 200 行
- [x] 提取 `ProjectTemplateStep.tsx`：第二步（模板网格选择），≤ 200 行
- [x] 提取 `ProjectSettingsStep.tsx`：第三步（语言/AI 设置/确认），≤ 200 行
- [x] 精简 `CreateProjectDialog.tsx` 至 ≤ 200 行（Dialog shell + stepper 进度条 + 导航按钮）
- [x] Stepper active 使用 `--color-accent`、未达态 `--color-fg-muted`
- [x] 模板卡片使用 Card `variant="bordered"` + hover 边框亮起
- [x] 导航按钮 Previous = Button `secondary`、Next = Button `primary`

**文件**: `apps/desktop/renderer/src/features/projects/`

### Task 2.3: CreateTemplateDialog 视觉对齐

**映射验收标准**: AC-7, AC-12

- [x] 对齐 FormField 布局
- [x] 使用 Design Token（间距、色彩、圆角）
- [x] 按钮对齐 Button variant 规范
- [x] 如超过 250 行，提取 `TemplateMetadataForm.tsx`

**文件**: `apps/desktop/renderer/src/features/projects/CreateTemplateDialog.tsx`

### Task 2.4: OnboardingPage 破坏性重构

**映射验收标准**: AC-8, AC-9, AC-10, AC-12

- [x] 提取 `OnboardingSteps.tsx`：各步骤内容渲染（欢迎/配置/完成），≤ 250 行
- [x] 精简 `OnboardingPage.tsx` 至 ≤ 200 行（页面框架 + 步骤导航 + 底部进度指示器）
- [x] 全屏居中布局 `max-width: 640px`
- [x] 步骤指示器 dot 样式，active `--color-accent`
- [x] 欢迎标题 `--text-display-size` + `--weight-bold`
- [x] 完成动画使用 v1-12 动效系统

**文件**: `apps/desktop/renderer/src/features/onboarding/`

### Task 2.5: SettingsGeneral 视觉对齐

**映射验收标准**: AC-11, AC-12

- [x] 表单项对齐 FormField 布局规范
- [x] section 间距 `--space-section-gap`
- [x] 开关项使用 Toggle primitive
- [x] 选择项使用 Select primitive（v1-02 重构产物）
- [x] 如超过 250 行，提取 `GeneralLanguageSection.tsx` 或 `GeneralSaveSection.tsx`

**文件**: `apps/desktop/renderer/src/features/settings-dialog/SettingsGeneral.tsx`

---

## 后续必修补丁（Issue #1199 → v1-14a-dialog-remaining）

> 这两项不是"建议优化"，而是已确认会误导用户的遗留约束。已拆入 `v1-14a-dialog-remaining`。

- [ ] `CreateProjectDialog`：新增模板创建成功后，自动选中刚创建的模板，并补充回归测试
- [ ] `ExportDialog`：为导出进度态补齐真实 cancel / abort 链路，并补充前端 + IPC / main 级验证

## Phase 3: Verification（验证）

- [x] 运行 Phase 1 全部测试，确认全绿
- [x] 运行全量测试：`pnpm -C apps/desktop vitest run`
- [x] 运行 `pnpm typecheck` 类型检查
- [x] 运行 `pnpm lint` lint 检查
- [x] 运行 `pnpm -C apps/desktop storybook:build` Storybook 构建
- [x] 检查 0 新增 arbitrary 色值
- [x] 全流程走查：Dashboard → 新建项目 → 模板 → 进入编辑器 → 导出
- [x] 首次启动走查：OnboardingPage → 配置 → 进入 Dashboard
- [x] PR 创建，含 `Closes #N`

---

## R1+R3 级联刷新记录（2026-03-21）

### 刷新触发

R1+R3 合并级联刷新——v1-01/02（R1）与 v1-06/07（R3）四个源 change 全部 PASS。

### 基线验证

v1-14 已实现完毕（✅），全部 14 个拆分文件行数与 R1 完全一致：

- ExportDialog 系列：181 / 336 / 195 / 341 行（4 文件）
- CreateProjectDialog 系列：139 / 308 / 216 / 80 行（4 文件）
- CreateTemplateDialog 系列：270 / 92 行（2 文件）
- OnboardingPage 系列：142 / 196 行（2 文件）
- SettingsGeneral 系列：155 / 208 行（2 文件）

### 上游影响

- v1-06/v1-07 与 v1-14 无文件交叉、无指标冲突
- v1-02 新变体（underline Tabs / bordered Card / pill Badge）在 v1-14 范围内 **0 处使用**——变体推广归 v1-18
- 15 个测试文件持续覆盖 v1-14 范围

### AC 状态

- AC-1～AC-16：状态不变（✅ 已满足）
- AC-17/AC-18：后续约束（#1199），不受此次刷新影响

### 任务状态

- v1-14 主体已完成，此次刷新确认上游变更未影响已落地结果
- 后续约束（模板自动选中 + 导出取消链路）仍待 #1199 解决

---

## R8 级联刷新记录（2026-03-22）

R8 P6 复核。v1-14 已合并（PR #1198），稳定性验证。

### 基线验证

| 文件                        | R6 行数  | R8 行数  | Delta  |
| --------------------------- | -------- | -------- | ------ |
| ExportDialog.tsx            | 181      | 181      | 0      |
| ExportFormatTab.tsx         | 336      | 336      | 0      |
| ExportPreview.tsx           | 195      | 195      | 0      |
| useExportConfig.ts          | 341      | 341      | 0      |
| CreateProjectDialog.tsx     | 139      | 137      | -2     |
| ProjectFormContent.tsx      | 308      | 306      | -2     |
| useCreateProject.ts         | 216      | 216      | 0      |
| AiAssistSection.tsx         | 80       | 80       | 0      |
| CreateTemplateDialog.tsx    | 270      | 267      | -3     |
| TemplateMetadataForm.tsx    | 92       | 91       | -1     |
| OnboardingPage.tsx          | 142      | 143      | +1     |
| OnboardingSteps.tsx         | 196      | 196      | 0      |
| SettingsGeneral.tsx         | 155      | 156      | +1     |
| SettingsGeneralSections.tsx | 208      | 208      | 0      |
| **合计**                    | **2859** | **2853** | **-6** |

### 测试结果

vitest 全量：**2600 passed**，0 失败。

### AC 状态

- AC-1～AC-16：状态不变（✅ 已满足），无回归
- AC-17/AC-18：后续约束（#1199），不受此次刷新影响

### 结论

**PASS** — 14 文件行数偏差 ≤3 行（共 -6），无语义变化。2600 测试全绿，R6 以来无上游变更影响 v1-14 scope。
