# V1-14 对话框与入口页视觉补完

- **GitHub Issue**: 待创建
- **所属任务簇**: V1（视觉重塑）— Wave 5 全覆盖收口
- **涉及模块**: export、projects、onboarding、settings-dialog（SettingsGeneral）
- **前端验收**: 需要（Storybook Story + 视觉验收截图）

---

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

| 文件 | 行数 | 用户触达频率 | 视觉落差严重度 |
| --- | --- | --- | --- |
| ExportDialog.tsx | 993 | 高（终态操作） | 严重——多 tab、多配置项、预览区全未对齐设计稿 |
| CreateProjectDialog.tsx | 732 | 高（项目入口） | 严重——多步骤向导样式陈旧 |
| CreateTemplateDialog.tsx | 381 | 中（项目入口） | 中——与 CreateProjectDialog 同族 |
| OnboardingPage.tsx | 369 | 极高（第一印象） | 严重——用户首次打开应用看到的页面 |
| SettingsGeneral.tsx | 330 | 中（设置常用页） | 中——v1-07 shell 精修后内容区不协调 |

---

## What：做什么

### 1. ExportDialog 破坏性重构（993 → ≤ 250 行 × 4+ 文件）

ExportDialog 是一个多 tab（PDF/DOCX/HTML/Markdown）、多配置项（字体/边距/页眉/水印）、带预览区的重型对话框。当前 993 行全部堆叠在单文件中。

**破坏性重构方案**：

| 提取文件 | 职责 | 目标行数 |
| --- | --- | --- |
| `ExportDialog.tsx` | Dialog shell + tab 切换 + 导出按钮 | ≤ 200 行 |
| `ExportFormatTab.tsx` | 单格式配置面板（字体/边距/页眉/水印选项） | ≤ 250 行 |
| `ExportPreview.tsx` | 实时预览区渲染 | ≤ 200 行 |
| `useExportConfig.ts` | 导出配置状态管理 hook | ≤ 150 行 |

**视觉对齐**：
- Dialog 使用 `--radius-lg` 圆角、`--shadow-dialog` 阴影
- Tab 使用 Tabs `variant="underline"`（v1-02 产物）
- 配置项使用 FormField（label + control 右对齐布局）
- 预览区 `--color-bg-elevated` 背景 + `--color-border-subtle` 边框

### 2. CreateProjectDialog 破坏性重构（732 → ≤ 250 行 × 3+ 文件）

多步骤向导对话框：项目名 → 模板选择 → 设置确认。

**破坏性重构方案**：

| 提取文件 | 职责 | 目标行数 |
| --- | --- | --- |
| `CreateProjectDialog.tsx` | Dialog shell + stepper 进度条 + 导航按钮 | ≤ 200 行 |
| `ProjectBasicStep.tsx` | 第一步：项目名 + 描述 + 封面图 | ≤ 200 行 |
| `ProjectTemplateStep.tsx` | 第二步：模板网格选择 | ≤ 200 行 |
| `ProjectSettingsStep.tsx` | 第三步：语言/AI 设置/确认 | ≤ 200 行 |

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

| 提取文件 | 职责 | 目标行数 |
| --- | --- | --- |
| `OnboardingPage.tsx` | 页面框架 + 步骤导航 + 底部进度 | ≤ 200 行 |
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

## Non-Goals（不做什么）

1. 不改变对话框的功能逻辑——只做视觉 + 结构重构
2. 不引入新的路由或页面——这些都是已存在的 UI
3. 不修改 Store 或后端逻辑
4. 不做 i18n key 重组——仅确保已有 key 正确使用 `t()`

---

## Dependencies

- v1-01（Design Token 补完）：spacing、typography token
- v1-02（Primitive 进化）：Card bento/compact、Tabs underline、Button pill/icon、Radio/Select 重构产物
- v1-07（Settings 精修）：SettingsDialog shell 样式须已定稿，SettingsGeneral 才能对齐

---

## Risks

| 风险 | 缓解 |
| --- | --- |
| ExportDialog 重构范围大，可能影响导出功能 | 功能逻辑提取到 useExportConfig hook，UI 层与逻辑层解耦，分别测试 |
| CreateProjectDialog 步骤逻辑复杂 | 保留 stepper 状态机，只重构 UI 渲染层 |
| OnboardingPage 首次体验敏感 | 完成后需要全流程走查（首次启动 → 配置 → 进入 Dashboard） |
