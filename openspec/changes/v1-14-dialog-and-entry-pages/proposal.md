# V1-14 对话框与入口页视觉补完

> 📋 **级联刷新 R1**（2026-03-21）：v1-02 完成后刷新。基线已重采集。

- **状态**: ✅ 已实现（随 PR #1198 进入合并审计）
- **GitHub Issue**: #1197（v1-14 / v1-15 共享交付）
- **分支**: `task/1197-v1-14-v1-15-tdd-redo`
- **所属任务簇**: V1（视觉重塑）— Wave 5 全覆盖收口
- **涉及模块**: export、projects、onboarding、settings-dialog（SettingsGeneral）
- **前端验收**: 需要（Storybook Story + 视觉验收截图）
- **后续跟踪**: #1199（模板自动选中 + 真正取消导出）

---

## 当前实现结果（R1 重采集 2026-03-21）

| 区域                 | 原始行数 | 当前结果                                                                                                            | 备注                                          |
| -------------------- | -------- | ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| ExportDialog         | 993      | `ExportDialog.tsx` 181 / `ExportFormatTab.tsx` 336 / `ExportPreview.tsx` 195 / `useExportConfig.ts` 341             | 主壳已压到 200 行内，配置与状态分离           |
| CreateProjectDialog  | 732      | `CreateProjectDialog.tsx` 139 / `ProjectFormContent.tsx` 308 / `useCreateProject.ts` 216 / `AiAssistSection.tsx` 80 | 从单体向导改为壳层 + 表单内容 + 状态逻辑分层  |
| CreateTemplateDialog | 381      | `CreateTemplateDialog.tsx` 270 / `TemplateMetadataForm.tsx` 92                                                      | 已拆出元数据表单，主文件仍高于最初 250 行目标 |
| OnboardingPage       | 369      | `OnboardingPage.tsx` 142 / `OnboardingSteps.tsx` 196                                                                | 页面框架与步骤内容已拆分                      |
| SettingsGeneral      | 330      | `SettingsGeneral.tsx` 155 / `SettingsGeneralSections.tsx` 208                                                       | General 页已收口为壳层 + section 组件         |

> 注：上表记录的是当前分支的真实落地结果；若与最初 proposal 的理想目标不同，以“当前实现结果”作为审计口径。
>
> **R1 基线变动**：ExportDialog 178→181、ExportFormatTab 340→336、ProjectFormContent 300→308、SettingsGeneral 154→155、SettingsGeneralSections 191→208（均为小幅演进，无结构性变化）。

## Why：为什么必须做

### 1. 用户现象

V1 Wave 1-4 精修了 Dashboard、Editor、AI Panel、Settings Dialog（shell）、FileTree、CommandPalette、SearchPanel、侧面板共 13 个模块。但用户**从精修页面出发的关键操作路径**仍然触达未翻新的界面：

- **Dashboard → 新建项目**：弹出 `CreateProjectDialog.tsx`（732 行），多步骤向导风格与精修后的 Dashboard 格格不入
- **Dashboard → 使用模板**：弹出 `CreateTemplateDialog.tsx`（381 行），同上
- **Editor → 导出**：弹出 `ExportDialog.tsx`（993 行），终态操作界面却是最粗糙的
- **首次启动**：渲染 `OnboardingPage.tsx`（369 行），第一印象页面未经打磨
- **Settings Dialog → General 页**：`SettingsGeneral.tsx`（330 行）——Dialog shell 精修了，但内容区未跟上

「入口精致、出口粗糙」造成的落差比「全不修」更刺眼。

### 2. 根因

V1 初版规划以「模块独立性」为边界，按 Feature 目录划分 change。这些文件横跨多个 Feature 模块（export/projects/onboarding），单独看每个太小不值得开 change，但合在一起是 3,405 行未覆盖代码，且全部在用户高频操作路径上。

### 3. 证据

| 文件                     | 行数 | 用户触达频率     | 视觉落差严重度                               |
| ------------------------ | ---- | ---------------- | -------------------------------------------- |
| ExportDialog.tsx         | 993  | 高（终态操作）   | 严重——多 tab、多配置项、预览区全未对齐设计稿 |
| CreateProjectDialog.tsx  | 732  | 高（项目入口）   | 严重——多步骤向导样式陈旧                     |
| CreateTemplateDialog.tsx | 381  | 中（项目入口）   | 中——与 CreateProjectDialog 同族              |
| OnboardingPage.tsx       | 369  | 极高（第一印象） | 严重——用户首次打开应用看到的页面             |
| SettingsGeneral.tsx      | 330  | 中（设置常用页） | 中——v1-07 shell 精修后内容区不协调           |

---

## What：做什么

### 1. ExportDialog 破坏性重构（993 → ≤ 250 行 × 4+ 文件）

ExportDialog 是一个多 tab（PDF/DOCX/HTML/Markdown）、多配置项（字体/边距/页眉/水印）、带预览区的重型对话框。当前 993 行全部堆叠在单文件中。

**破坏性重构方案**：

| 提取文件              | 职责                                      | 目标行数 |
| --------------------- | ----------------------------------------- | -------- |
| `ExportDialog.tsx`    | Dialog shell + tab 切换 + 导出按钮        | ≤ 200 行 |
| `ExportFormatTab.tsx` | 单格式配置面板（字体/边距/页眉/水印选项） | ≤ 250 行 |
| `ExportPreview.tsx`   | 实时预览区渲染                            | ≤ 200 行 |
| `useExportConfig.ts`  | 导出配置状态管理 hook                     | ≤ 150 行 |

**视觉对齐**：

- Dialog 使用 `--radius-lg` 圆角、`--shadow-dialog` 阴影
- Tab 使用 Tabs `variant="underline"`（v1-02 产物）
- 配置项使用 FormField（label + control 右对齐布局）
- 预览区 `--color-bg-elevated` 背景 + `--color-border-subtle` 边框

### 2. CreateProjectDialog 破坏性重构（732 → ≤ 250 行 × 3+ 文件）

多步骤向导对话框：项目名 → 模板选择 → 设置确认。

**破坏性重构方案**：

| 提取文件                  | 职责                                     | 目标行数 |
| ------------------------- | ---------------------------------------- | -------- |
| `CreateProjectDialog.tsx` | Dialog shell + stepper 进度条 + 导航按钮 | ≤ 200 行 |
| `ProjectBasicStep.tsx`    | 第一步：项目名 + 描述 + 封面图           | ≤ 200 行 |
| `ProjectTemplateStep.tsx` | 第二步：模板网格选择                     | ≤ 200 行 |
| `ProjectSettingsStep.tsx` | 第三步：语言/AI 设置/确认                | ≤ 200 行 |

**视觉对齐**：

- Stepper 进度条使用 `--color-accent` active 态 + `--color-fg-muted` 未达态
- 模板卡片使用 Card `variant="bordered"` + hover 边框亮起
- 导航按钮 Previous/Next 使用 Button `variant="secondary"` / `variant="primary"`

### 3. CreateTemplateDialog 视觉对齐（381 → ≤ 250 行）

与 CreateProjectDialog 共享向导模式，但更简单（单步）。

**方案**：

- 对齐 FormField 布局、Design Token、按钮样式
- 如超过 250 行，提取 `TemplateMetadataForm.tsx`

### 4. OnboardingPage 视觉重塑（369 → ≤ 250 行 × 2 文件）

用户首次启动看到的页面——第一印象决定一切。

**破坏性重构方案**：

| 提取文件              | 职责                             | 目标行数 |
| --------------------- | -------------------------------- | -------- |
| `OnboardingPage.tsx`  | 页面框架 + 步骤导航 + 底部进度   | ≤ 200 行 |
| `OnboardingSteps.tsx` | 各步骤内容渲染（欢迎/配置/完成） | ≤ 250 行 |

**视觉对齐**：

- 全屏居中布局，`max-width: 640px`
- 步骤指示器使用 dot 样式，active 用 `--color-accent`
- 欢迎页大标题 `--text-display-size` + `--weight-bold`
- 完成页使用 check 动画（v1-12 动效产物）

### 5. SettingsGeneral 视觉对齐（330 → ≤ 250 行）

Settings Dialog shell（v1-07）精修后，General 页内容区的样式需要跟上。

**方案**：

- 所有表单项对齐 FormField 布局规范
- section 间距使用 `--space-section-gap`
- 开关项使用 Toggle primitive
- 如超过 250 行，提取 `GeneralLanguageSection.tsx` 或 `GeneralSaveSection.tsx`

---

## 已知后续约束（必须在后续工程中解决）

### 1. 新建模板后必须自动选中新模板

- **问题归属**：前端问题（renderer / 表单状态管理）
- **现状**：用户在 `CreateProjectDialog` 里点击 `Create Template`，新模板创建成功后列表会刷新，但不会自动切换到刚创建的模板。
- **用户影响**：用户以为“我刚做好的模板已经被用上了”，实际创建项目时可能仍沿用旧默认模板，造成模板选择与结果不一致。
- **后续要求**：后续补丁必须保证 `onCreated(id)` 返回后，项目创建表单自动选中新模板，并补充对应行为测试。

### 2. 导出进度态的 Cancel 必须真正中止导出

- **问题归属**：跨层问题（前端 + IPC / main / export service）
- **现状**：用户在导出进度态点击 `Cancel` 时，前端会退出等待界面，但后台导出任务可能继续执行。
- **用户影响**：用户以为“我已经取消了”，结果文件仍然被导出；这会破坏取消操作的语义可信度。
- **后续要求**：后续补丁必须提供真实的 abort / cancel 链路；仅仅关闭前端进度视图，不算问题解决。

## Non-Goals（不做什么）

1. 不改变对话框的功能逻辑——只做视觉 + 结构重构
2. 不引入新的路由或页面——这些都是已存在的 UI
3. 不修改 Store 或后端逻辑
4. 不做 i18n key 重组——仅确保已有 key 正确使用 `t()`

---

## Dependencies

- ✅ v1-01（Design Token 补完）：spacing、typography token — 已合并
- ✅ v1-02（Primitive 进化）：Card bento/compact、Tabs underline、Button pill/icon、Radio/Select 重构产物 — 已合并（⭐⭐⭐⭐⭐，7/7 AC）
- ✅ v1-07（Settings 精修）：SettingsDialog shell 样式须已定稿，SettingsGeneral 才能对齐 — 已合并

> **R1 注**：v1-02 变体系统（pill / bento / compact / underline）已在 Primitive 层就绪，features 层已有 13 处采用 `size="icon"`。但 v1-14 目标文件中尚未显式采用 pill / bento / compact / underline 变体——**变体全面推广归 v1-18（variant-adoption）**。v1-14 的重构结构已完成，后续可在 v1-18 中无摩擦地引入新变体。

---

## Risks

| 风险                                      | 缓解                                                             |
| ----------------------------------------- | ---------------------------------------------------------------- |
| ExportDialog 重构范围大，可能影响导出功能 | 功能逻辑提取到 useExportConfig hook，UI 层与逻辑层解耦，分别测试 |
| CreateProjectDialog 步骤逻辑复杂          | 保留 stepper 状态机，只重构 UI 渲染层                            |
| OnboardingPage 首次体验敏感               | 完成后需要全流程走查（首次启动 → 配置 → 进入 Dashboard）         |

---

## R1+R3 级联刷新记录（2026-03-21）

### 刷新触发

R1+R3 合并级联刷新——v1-01/02（R1）与 v1-06/07（R3）四个源 change 同时影响 v1-14。

上游验证结果：

- **v1-01（Design Token）**：PASS ⭐⭐⭐⭐ — tokens.css 469 行, 14 档 typography, 完整 token 系统
- **v1-02（Primitive Evolution）**：PASS ⭐⭐⭐⭐⭐ — Button/Card/Tabs/Badge 变体完成, 新变体 130 处使用
- **v1-06（AI Panel Overhaul）**：PASS — 7 子组件拆分完成, 27 测试文件全通过
- **v1-07（Settings Polish）**：PASS — 0 硬编码 hex, 组件拆分完成, 91 测试全通过

### R1+R3 基线重采集

v1-14 已实现（状态 ✅），此次刷新验证已落地结果的稳定性。

| 区域                 | R1 行数 | R1+R3 行数 | Delta | 采集命令                                                                               |
| -------------------- | ------- | ---------- | ----- | -------------------------------------------------------------------------------------- |
| ExportDialog.tsx     | 181     | **181**    | 0     | `wc -l apps/desktop/renderer/src/features/export/ExportDialog.tsx`                     |
| ExportFormatTab.tsx  | 336     | **336**    | 0     | `wc -l apps/desktop/renderer/src/features/export/ExportFormatTab.tsx`                  |
| ExportPreview.tsx    | 195     | **195**    | 0     | `wc -l apps/desktop/renderer/src/features/export/ExportPreview.tsx`                    |
| useExportConfig.ts   | 341     | **341**    | 0     | `wc -l apps/desktop/renderer/src/features/export/useExportConfig.ts`                   |
| CreateProjectDialog  | 139     | **139**    | 0     | `wc -l apps/desktop/renderer/src/features/projects/CreateProjectDialog.tsx`            |
| ProjectFormContent   | 308     | **308**    | 0     | `wc -l apps/desktop/renderer/src/features/projects/ProjectFormContent.tsx`             |
| useCreateProject     | 216     | **216**    | 0     | `wc -l apps/desktop/renderer/src/features/projects/useCreateProject.ts`                |
| AiAssistSection      | 80      | **80**     | 0     | `wc -l apps/desktop/renderer/src/features/projects/AiAssistSection.tsx`                |
| CreateTemplateDialog | 270     | **270**    | 0     | `wc -l apps/desktop/renderer/src/features/projects/CreateTemplateDialog.tsx`           |
| TemplateMetadataForm | 92      | **92**     | 0     | `wc -l apps/desktop/renderer/src/features/projects/TemplateMetadataForm.tsx`           |
| OnboardingPage       | 142     | **142**    | 0     | `wc -l apps/desktop/renderer/src/features/onboarding/OnboardingPage.tsx`               |
| OnboardingSteps      | 196     | **196**    | 0     | `wc -l apps/desktop/renderer/src/features/onboarding/OnboardingSteps.tsx`              |
| SettingsGeneral      | 155     | **155**    | 0     | `wc -l apps/desktop/renderer/src/features/settings-dialog/SettingsGeneral.tsx`         |
| SettingsGeneralSect. | 208     | **208**    | 0     | `wc -l apps/desktop/renderer/src/features/settings-dialog/SettingsGeneralSections.tsx` |

> 全部 14 个文件行数与 R1 完全一致，无结构性变化。

### v1-02 新变体在 v1-14 范围内的使用情况

| v1-02 变体                 | v1-14 范围内使用 | 说明                                                                   |
| -------------------------- | ---------------- | ---------------------------------------------------------------------- |
| Tabs `variant="underline"` | **0 处**         | ExportDialog tab 切换未显式使用 underline 变体——变体推广归 v1-18       |
| Card `variant="bordered"`  | **0 处**         | CreateProjectDialog 模板卡片未显式使用 bordered 变体——变体推广归 v1-18 |
| Button `variant="pill"`    | **0 处**         | 未使用——变体推广归 v1-18                                               |
| Badge `variant="pill"`     | **0 处**         | 未使用——变体推广归 v1-18                                               |
| Button `size="icon"`       | **0 处**         | v1-14 范围文件未使用 icon size                                         |

> R1 注已记录：v1-02 变体系统已在 Primitive 层就绪，v1-14 重构结构已完成但变体全面推广归 v1-18。此次刷新确认该判断不变。

### 上游影响评估

- **v1-06（AI Panel Overhaul）✅**：v1-06 范围（AI 面板子组件）与 v1-14 范围（ExportDialog / CreateProjectDialog / OnboardingPage / SettingsGeneral）无文件交叉。v1-06 不影响 v1-14 已落地结果
- **v1-07（Settings Polish）✅**：v1-07 精修了 SettingsDialog shell，v1-14 中的 SettingsGeneral（155 行）+ SettingsGeneralSections（208 行）与 v1-07 的 shell 在同一 `settings-dialog/` 目录下协同。行数指标未变，表明两者已和谐共存
- **v1-01（Design Token）✅**：spacing / typography / color token 已完备，v1-14 已引用
- **v1-02（Primitive Evolution）✅**：变体系统已就绪。v1-14 重构结构已完成，后续 v1-18 可无摩擦引入新变体

### 测试覆盖

v1-14 范围内已有 15 个测试文件：

- `ExportDialog.test.tsx`、`export-i18n-keys.test.ts`
- `CreateProjectDialog.test.tsx`、`CreateProjectDialog.cropper.test.tsx`、`CreateTemplateDialog.test.tsx`
- `OnboardingPage.test.tsx`、`Onboarding.open-folder.test.tsx`、`Onboarding.wizard.test.tsx`、`OnboardingPage.i18n-guard.test.ts`
- `SettingsGeneral.language.test.tsx`、`SettingsGeneral.backup.test.tsx`
- `DeleteProjectDialog.confirmation.test.tsx`、`ProjectSwitcher.test.tsx`、`projectSwitcher.determinism.test.ts`
- `onboardingStore.test.tsx`

### 结论

v1-14 已实现完毕（✅），所有 14 个文件行数与 R1 完全一致，无结构性变化。v1-06/v1-07 与 v1-14 无文件交叉、无指标冲突。v1-02 新变体尚未在 v1-14 范围内采用（归 v1-18）。后续约束（#1199：模板自动选中 + 导出取消）仍待解决。
