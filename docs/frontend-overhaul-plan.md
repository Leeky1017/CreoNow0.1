# CN 前端整改方案

更新时间：2026-02-28（二次审计修正：Spec 漂移补全 + S2/S5 矛盾修正 + A11 状态更新 + 量化数据校正 + §七重排）

> 日期：2026-02-28
> 触发：Owner 打包版实测两轮反馈（共 11 项问题）
> 状态：执行中
> 权威参考：`docs/Notion/CN/CN 前端开发` 系列文档 + Storybook + `openspec/specs/workbench/spec.md`

---

## 目录

- [〇. 根因判断](#〇根因判断)
- [一. 问题总览](#一问题总览)
- [二. 逐项分析（第二轮）](#二逐项分析第二轮新增)
  - [S1. 上传图片不能调整大小](#s1-创建项目上传图片不能调整大小聚焦)
  - [S2. 无法打开已有文件夹](#s2-无法读取系统目录打开已有文件夹)
  - [S3. 左侧边栏改弹出式（含现存 Bug）](#s3-左侧边栏面板改为弹出式)
  - [S4. AI 面板 toggle 按钮](#s4-无显式按钮弹出-ai-面板)
  - [S5. 国际化（i18n 单步方案）](#s5-语言不能切换中英文)
  - [S6. AI 面板布局](#s6-ai-面板布局问题)
  - [S7. 视觉噪音](#s7-过多无意义的框边框)
- [三. 第一轮问题更新](#三第一轮问题更新)
- [四. Storybook ↔ 产品差距分析](#四storybook--产品差距分析)
- [四-A. Spec 漂移清单](#四-aspec-漂移清单)
- [五. Owner 确认项（历史决策记录）](#五owner-确认项回复记录)
- [六. 系统性审计发现（A1–A17）](#六系统性审计发现深度扫描)
- [七. 执行优先级（重排）](#七执行优先级重排)
- [八. 审计维度清单](#八审计维度清单供后续复查)
- [九. 编辑器与桌面体验深度审计（B1–B45）](#九owner-补充审计维度--代码实况windsurf-报告未覆盖)

---

## 〇、根因判断

> 底层试图建立严谨的 Design Token 体系和受控的 Primitive 组件，但业务层为了快速交付，倒退回了滥用 Tailwind 任意值的模式。架构徒有其表，失去了对全局一致性的约束力。
> — `CN 前端开发/视觉审计`

**Storybook 中的效果非常好，打包后的实际产品一塌糊涂。** 根因不是组件设计错误，而是：

1. **Feature 层绕过 Primitives** — 业务代码散写原生 `<button>`/`<input>`，不复用 Storybook 中验证过的组件
2. **左侧边栏滥用列表呈现** — 搜索/记忆/KG/角色/版本历史等「配置型」功能全塞进侧边栏列表，挤压编辑区；已有弹出式页面组件却不使用
3. **AI 面板布局违反设计决策** — 设计规范明确采用 Prompt-Response Panel，实际实现却杂糅了多行冗余控件
4. **Token 逃逸** — ~24 文件硬编码颜色、~8 文件硬编码 z-index、大量魔法阴影和间距
5. **无意义的视觉分割** — 到处用边框/卡片框把内容框起来，「为了分割而分割」

本方案以 `docs/Notion/CN/CN 前端开发` 和 Storybook 为总章程，所有改动必须对齐。

---

## 一、问题总览

### 第一轮反馈（已处理 ✅ 或方案已出）

| # | 问题 | 严重度 | 状态 |
|---|------|--------|------|
| F1 | 初始打开无引导/预设置/打开项目入口 | P0 | 方案已出 |
| F2 | AI 功能报错（截图：DB_ERROR + UPSTREAM_ERROR） | P0 | 方案已出 + 截图已获 |
| F3 | 左侧边栏拖动僵硬 | P1 | ✅ 已修复 |
| F4 | Settings tab "Proxy" → 实为 AI 配置 | P1 | ✅ 已修复 |

### 第二轮反馈（本次新增）

| # | 问题 | 严重度 | 类型 |
|---|------|--------|------|
| S1 | 创建项目上传图片不能调整大小/聚焦 | P1 | 功能缺失 |
| S2 | 无法读取系统目录打开已有文件夹（对标 Cursor/Antigravity） | P0 | 功能缺失 |
| S3 | 左侧边栏面板应改为弹出式（搜索/记忆/KG/角色/版本历史） | P0 | 架构设计 |
| S4 | 无显式按钮弹出 AI 面板（对标 Cursor/Windsurf 右上角按钮） | P1 | 交互缺失 |
| S5 | 语言不能切换中英文，中英混杂 | P1 | i18n 缺失 |
| S6 | AI 面板 1x-5x 功能不直观，History/NewChat 按钮应与 tab 并列 | P1 | 设计问题 |
| S7 | 太多无意义的框/边框，为了分割而分割 | P1 | 视觉噪音 |

### 结构性根因（贯穿所有问题）

| # | 根因 | 严重度 |
|---|------|--------|
| R1 | Storybook 组件未被 Feature 层精确复用 | P0 |
| R2 | Token 逃逸（颜色/z-index/阴影/间距/字号） | P1 |
| R3 | 缺少 Composite 层（Layer 2）抽象 | P1 |

---

## 二、逐项分析（第二轮新增）

### S1. 创建项目上传图片不能调整大小/聚焦

**现状**：

`ImageUpload.tsx`（331 行）是一个纯粹的拖放上传组件：
- 预览用 `object-cover` 裁剪填满容器，不可交互
- 无缩放/裁剪/聚焦功能
- hover 只能「Remove」，无其他操作

**对标**：Notion 封面图——上传后可拖拽调整焦点位置，hover 时出现「Reposition」按钮。

**修复方案**：

在 `ImageUpload` 或其上层封装一个 `ImageCropper` Composite：
- 上传后进入编辑模式：拖拽平移 + 滚轮缩放
- 输出 `{ file, cropArea: { x, y, zoom } }` 而非裸 `File`
- 技术选型：`react-easy-crop`（轻量，7KB gzip）或自研基于 CSS `object-position` + `transform: scale()`
- 保留当前 `ImageUpload` API 向后兼容，`ImageCropper` 作为增强包装

涉及改动：
- 新增 `ImageCropper` Composite（Layer 2）
- `CreateProjectDialog.tsx` — 替换裸 `ImageUpload` 为 `ImageCropper`

---

### S2. 无法读取系统目录打开已有文件夹

**现状**：

- IPC 层无 `dialog.showOpenDialog` 相关通道
- 用户无法在任何界面打开已有文件夹
- 对标 Cursor/Windsurf：启动后可直接 File → Open Folder 或拖拽打开

**修复方案**（与 F1.C 合并）：

| 层 | 改动 |
|----|------|
| IPC contract | 新增 `dialog:open-folder` 通道，返回 `string \| null` |
| 主进程 | `dialog.showOpenDialog({ properties: ['openDirectory'] })` |
| Preload | 暴露通道 |
| 渲染层入口 | ① Onboarding Step 3 ② Dashboard 空状态 ③ CommandPalette ④ 菜单栏 File → Open Folder |

行为定义（按 Owner 决策，见 §五 第 2 条）：
- 文件夹即工作区，直接打开，**不创建「项目」中间层**
- 若文件夹包含 `.creonow/` 元目录，则识别已有元数据并恢复（名称、封面图等）
- 后续可在项目属性中按需补充元数据（名称、封面图等）

---

### S3. 左侧边栏面板改为弹出式

**这是本轮最关键的架构改动。**

> ⚠️ **前置 Hotfix（现存 Bug）**
>
> `SearchPanel` 当前在 `Sidebar.tsx:94` 中直接挂载且不传 `open` 和 `onClose`。由于 `SearchPanel` 始终渲染 `fixed inset-0` 全屏覆盖层（无 `open` 短路），且 backdrop 的 `onClick={onClose}`（`onClose` 为 `undefined`），用户点击背景无法关闭搜索面板——只能通过 `IconBar` 切换到其他面板才能“退出”。**这是当前已经 broken 的用户体验。**
>
> 修复方案（装载在 §七 第零批 ①）：为 `Sidebar.tsx` 中的 `SearchPanel` 挂载添加 `open` 短路（`if (!open) return null`），并传入 `onClose` 回调关闭导航到居中位快捷键等任意查询方法。

**现状**：

`IconBar.tsx` 定义 7 个左侧面板：files / search / outline / versionHistory / memory / characters / knowledgeGraph。点击后全部在左侧边栏内以列表/面板形式展开，侵占编辑区宽度。

**设计规范已有定论**（`CN 前端开发/视觉审计`）：

> 结论：对于 CN 这样的写作 IDE，弹窗（Modal/Dialog）在大多数场景下确实更优。
> - Memory 面板展开后已占屏幕近 1/3，主编辑区被压缩
> - 编辑区宽度直接关系写作体验，侧边栏侵占是有代价的
> - 例外：需要并排比对的场景（如版本历史 Diff）仍应使用可停靠 Panel

**改动方案**：

| 面板 | 当前 | 改为 | 理由 |
|------|------|------|------|
| **files**（文件树） | 侧边栏列表 | **保持** | 结构化文件导航需要持久可见，是 IDE 核心 |
| **outline**（大纲） | 侧边栏列表 | **保持** | 结构化目录导航，需要与编辑区同步滚动 |
| **search**（搜索） | 侧边栏面板 | **弹出 Dialog** | 配置型交互，用完即走；对标 Cmd+K |
| **memory**（记忆） | 侧边栏面板 | **弹出 Dialog** | 配置型交互，空间需求大；已有 MemoryPanel 页面组件 |
| **characters**（角色） | 侧边栏列表 | **弹出 Dialog** | 角色详情 CharacterDetailDialog 已存在 |
| **knowledgeGraph**（知识图谱） | 侧边栏面板 | **弹出 Dialog** | 需要大屏空间渲染图谱，侧边栏太窄 |
| **versionHistory**（版本历史） | 侧边栏面板 | **弹出 Dialog**（含 Diff 并排） | 版本比对需要空间；时间线列表可在 Dialog 内左栏呈现 |

涉及改动：
- `IconBar.tsx` — 保留 files/outline 走 sidebar，其余 5 项触发对应 Dialog
- `AppShell.tsx` — 减少 LeftPanelType 枚举，新增 5 个 Dialog 的 open 状态
- `layoutStore.tsx` — `LeftPanelType` 缩减为 `"files" | "outline"`
- 复用已有弹出式组件：`SearchPanel`/`MemoryPanel`/`CharacterDetailDialog`/`KnowledgeGraph` 包装进 Dialog
- 每个 Dialog 遵循 `SettingsDialog` 的统一样式规范

IconBar 改造后结构：

```
IconBar
├── files      → 展开左侧边栏文件树（保持）
├── outline    → 展开左侧边栏大纲（保持）
├── search     → 弹出搜索 Dialog
├── memory     → 弹出记忆 Dialog
├── characters → 弹出角色 Dialog
├── kg         → 弹出知识图谱 Dialog
├── history    → 弹出版本历史 Dialog
└── settings   → 弹出设置 Dialog（已有）
```

---

### S4. 无显式按钮弹出 AI 面板

**现状**：

- AI 面板是右侧边栏的一个 tab（AI / Info / Quality），只能通过 Ctrl+L 弹出或手动展开右侧栏
- 无类似 Cursor/Windsurf 右上角的专用 AI 按钮

**对标**：
- Windsurf：右上角有明显的 AI 面板 toggle 按钮（截图已提供）
- Cursor：编辑器右上角有 AI Pane 按钮

**修复方案**：

在主编辑区右上角（或工具栏区域）添加一个 AI toggle 按钮：
- 点击：展开/折叠右侧 AI 面板，自动切换到 AI tab
- 视觉：使用 Lucide `Sparkles` 或 `Bot` 图标
- 快捷键提示：tooltip 显示 "AI Panel (Ctrl+L)"

涉及改动：
- `AppShell.tsx` 或 `EditorToolbar`（如存在）— 新增 AI toggle 按钮
- `layoutStore.tsx` — 复用 `panelCollapsed` + `setActiveRightPanel("ai")`

---

### S5. 语言不能切换中英文

**现状**：

- UI 中英混杂（OnboardingPage 中文，WelcomeScreen 英文，DashboardPage 混合）
- 已有 `react-i18next` 基础设施和 `locales/` 目录
- 无语言切换 UI 入口

**设计规范**（`CN 前端开发/i18n-l10n 考量`）：

> 策略：渐进式预埋，而非立即全量翻译。

**修复方案**：

单步方案：

- **i18n 键值化**：所有硬编码字符串（不论中英文）直接改为 `t()` 调用，提取到 `locales/zh-CN/` 和 `locales/en/`
- **语言切换 UI**：Settings → General 增加 Language 下拉框（`zh-CN` / `en`），Onboarding Step 1 也提供语言选择
- **范本文件**：`CommandPalette.tsx` 和 `StatusBar.tsx` 已完整实现 i18n，以其为模板

涉及文件（按优先级顺序）：
- 核心页面：`DashboardPage.tsx`、`OnboardingPage.tsx`、`SearchPanel.tsx`、`AiPanel.tsx`
- 次要：`WelcomeScreen.tsx`、`IconBar.tsx`（label）、`SettingsGeneral.tsx`、`CreateProjectDialog.tsx`
- 预计 30+ 文件需要修改，作为独立 Issue 执行

---

### S6. AI 面板布局问题

**现状（截图可见）**：

```
┌─ AI  Info  Quality ─────────── × ─┐ ← RightPanel tab bar
├─ ⏱ + ─────────────────────────────┤ ← AI header（History + NewChat，独占一行）
│  ...错误卡片...                      │
│  "选中文本或输入指令，开始与 AI 协作"   │
│                                     │
├─────────────────────────────────────┤
│ Ask  GPT-5.2  1x  SKILL        ↑  │ ← AI footer toolbar
└─────────────────────────────────────┘
```

问题：
1. **`1x` 按钮（candidateCount 切换）**：点击在 1x~5x 间循环，控制生成候选数。功能不直观，无说明文字，普通用户完全看不懂
2. **History/NewChat 按钮独占一行**：浪费纵向空间，应与 AI/Info/Quality tabs 并列
3. **过度边框分割**：header/content/footer 三段边框，加上错误卡片本身的边框，视觉噪音严重

**修复方案**：

#### A. 移除 candidateCount UI
- 删除 `1x` ToolButton 及相关 `candidateCount` 状态
- 保留 `CANDIDATE_COUNT_STORAGE_KEY` 后端逻辑但默认值锁定为 1
- 如未来需要，可在 Settings → AI 中暴露高级选项

#### B. History/NewChat 合并到 tab bar

当前 RightPanel tab bar 结构：
```
[AI] [Info] [Quality]                     [×]
```

改为：
```
[AI] [Info] [Quality]          [⏱] [+] [×]
```

- `⏱`（History）和 `+`（NewChat）从 AiPanel header 移到 RightPanel tab bar 右侧
- AiPanel 删除整个 `<header>` 区域，减少一层视觉分割
- 仅当 activeRightPanel === "ai" 时显示这两个按钮

涉及改动：
- `RightPanel.tsx` — tab bar 右侧增加 History/NewChat 按钮（条件渲染）
- `AiPanel.tsx` — 删除 header section、删除 candidateCount 相关代码
- `AiPanel.tsx` — History/NewChat 的 state 和 handler 通过 props 或 context 向上传递

---

### S7. 过多无意义的框/边框

**现状**：

用户反馈「太多地方用了无意义的框子框起来，为了分割而分割」。

代码层面的表现：
- AI 面板错误卡片：`border border-[var(--color-border-default)] rounded-[var(--radius-md)]`
- 用户请求框：`border border-[var(--color-border-default)] rounded-[var(--radius-md)] bg-[var(--color-bg-base)]`
- 候选结果卡片：每个候选又包一层 `border` + `rounded`
- DashboardPage 项目卡片：多层嵌套边框
- Settings 各 section 也用卡片包裹

**设计规范**（`CN 前端开发/视觉审计`）：

> 视觉噪音过载 — 过度依赖边框和阴影区分层级，屏幕布满无意义的线条

**对标**（`CN 前端开发/参考分析`）：

> Notion — 极度克制的颜色使用。主界面几乎只有黑白灰 + 一个强调色，信息层级靠字重和间距区分而非颜色。
> Linear — 极简的视觉设计。大量留白，信息密度恰到好处。暗色模式下几乎不用阴影，完全依赖微弱边缘区分层级。

**修复原则**：

信息层级的区分手段优先级（由高到低）：
1. **间距**（空间分组）
2. **字号/字重**（排版层级）
3. **背景色差异**（面/底区分）
4. **细微分隔线**（最后手段，且用 `--color-separator` 而非 `--color-border-default`）
5. ~~**边框包裹**~~（除非是可交互卡片如「可选候选项」）

**修复方案**：

逐区域审计，移除非功能性边框：
- AI 面板用户请求区：去掉边框 → 改为 padding + 背景色差异
- AI 面板错误卡片：保留左侧色条（severity indicator），去掉包裹边框
- DashboardPage 项目卡片：保留 hover 边框（交互反馈），去掉默认状态边框
- Settings sections：用间距 + heading 分组，去掉卡片包裹

---

## 三、第一轮问题更新

### F1. 初始打开体验（P0）

方案维持不变。新增以下对齐：
- Onboarding Step 1 增加**语言选择**（与 S5 联动）
- Step 3 的「打开文件夹」对齐 S2 的行为定义

### F2. AI 功能报错（P0）

**截图已获**（第二张图）：

```
Skills unavailable
Database native binding is missing. Run pnpm -C apps/desktop rebuild:native and restart app.
DB_ERROR

Models unavailable
INVALID_ARGUMENT: CREONOW_AI_PROVIDER is required (anthropic|openai|proxy)
UPSTREAM_ERROR
```

现在可以精确定位：

| 错误 | 根因 | 修复 |
|------|------|------|
| Skills: DB_ERROR | 打包后 `better-sqlite3` native binding 路径错误 | 主进程构建配置修复 native addon 路径 |
| Models: UPSTREAM_ERROR | 环境变量 `CREONOW_AI_PROVIDER` 未配置 | ① Settings → AI 页面引导用户配置 Provider ② AiPanel 检测到 `AI_NOT_CONFIGURED` 时显示专用引导卡片而非通用错误 |

修复路径：
1. **短期**：AiPanel 对 `DB_ERROR` 和 `UPSTREAM_ERROR` / `AI_NOT_CONFIGURED` 分别渲染专用引导 UI（含修复步骤和一键跳转 Settings）
2. **中期**：打包流程修复 native binding 打包路径
3. **长期**：Onboarding 向导中前置 AI 配置（Step 2），避免用户进入主界面后才遇到未配置问题

### F3. 左侧边栏拖动僵硬 ✅

已修复。移除 `Sidebar.tsx` 的 `width` transition，同步更新 3 个测试文件。

### F4. Settings tab 命名 ✅

已修复。`"proxy"` → `"ai"`，同步更新 Dialog/Test/Stories。

---

## 四、Storybook ↔ 产品差距分析

这是所有表面问题的共同根因。Storybook 中组件遵守 Token 和 Primitive 规范，但 Feature 层大面积绕过。

### 4.1 已有 Storybook Stories（60 个文件）

> 验证命令：`find apps/desktop -name "*.stories.tsx" | wc -l` → 当前实测 **60** 个。

| 层 | 覆盖 | 数量 |
|----|------|------|
| Primitives | 高 | **23** 个（Accordion/Avatar/Badge/Button/Card/Checkbox/Dialog/Heading/ImageUpload/Input/ListItem/Popover/Radio/Select/Skeleton/Slider/Spinner/Tabs/Text/Textarea/Toast/Toggle/Tooltip） |
| Layout | 中 | **7** 个（AppShell/IconBar/Layout/Resizer/RightPanel/Sidebar/StatusBar） |
| Features（`features/*` + `components/features/*`） | 低 | **30** 个（AiPanel/SkillPicker/AnalyticsPage/CharacterPanel/CommandPalette/DashboardPage/DiffView/EditorPane/EditorToolbar/WriteButton/ExportDialog/FileTreePanel/KgViews/MemoryCreateDialog/MemoryPanel/MemorySettingsDialog/OnboardingPage/OutlinePanel/CreateProjectDialog/CreateTemplateDialog/ProjectSwitcher/QualityGatesPanel/SearchPanel/SettingsDialog/VersionHistoryPanel/WelcomeScreen/ZenMode + AiDialogs/KnowledgeGraph/NodeDetailCard） |

### 4.2 差距清单

| 维度 | Storybook 中 | 实际产品中 | 差距原因 |
|------|-------------|-----------|----------|
| 按钮 | 全部使用 `<Button>` Primitive | AiPanel/Dashboard 大量原生 `<button>` | Feature 层散写 |
| 输入框 | 全部使用 `<Input>` Primitive | SearchPanel/Settings 混用原生 `<input>` | 同上 |
| 卡片 | `<Card>` 有统一的 hover/focus 状态 | DashboardPage 项目卡片自行实现 hover | 未复用 |
| 对话框 | `<Dialog>` 基于 Radix UI，统一动画 | 部分 Feature 自行包 Portal + 定位 | 未复用 |
| 字号 | Typography Stories 有 Heading/Text/Caption | 业务代码 `text-[28px]`/`text-[13px]` 散装 | Token 逃逸 |
| 颜色 | Token 变量 `--color-*` | ~24 文件硬编码 Tailwind 原始色 | 纪律缺失 |
| 间距 | 4px Grid | `px-[80px]`/`py-[120px]` 等魔法值 | 纪律缺失 |
| z-index | `--z-modal`/`--z-dropdown` 等 Token | z-10/z-30/z-50 硬编码 | Token 逃逸 |

### 4.3 根治方案

严格遵循 `CN 前端开发/组件架构` 的三层模型：

```
Layer 1: Primitives（已有 25 个，覆盖率高，需补 ScrollArea + Surface）
    ↓
Layer 2: Composites（缺失，需新建 12 个）
    ↓
Layer 3: Features（69 个，需逐个清理回归 Layer 1/2 复用）
```

**Layer 2 Composites 优先级**（摘自 `CN 前端开发/组件架构`）：

| 优先级 | Composite | 覆盖脏区 |
|--------|-----------|----------|
| P0 | PanelContainer（面板容器） | AiPanel/SearchPanel/FileTreePanel |
| P0 | SidebarItem（侧边栏项） | FileTreePanel/CharacterListPanel |
| P0 | CommandItem（命令项） | SearchPanel/CommandPalette |
| P1 | SearchInput（搜索框） | SearchPanel/CommandPalette/FileTreePanel |
| P1 | FormField（表单字段） | SettingsPanel/ExportDialog |
| P1 | ToolbarGroup（工具栏组） | EditorToolbar/DiffHeader |
| P2 | EmptyState（空状态） | 多处内联 div |
| P2 | ConfirmDialog（确认弹窗） | 多处重复实现 |
| P2 | InfoBar（信息条） | Toast 之外的内联提示 |

---

## 四-A、Spec 漂移清单

> 对照 `openspec/specs/workbench/spec.md`（权威参考），当前代码与 Spec 的已知偏差。每项需 Owner 决策：**更新 Spec** 或 **回退代码** 或 **维持现状并记录例外**。决策结果将影响 S3 改造范围（见 §七 待 Owner 决策项）。

### Icon Bar 漂移

**Spec 定义**（`workbench/spec.md` §Icon-Bar 节）：

| 位置 | 面板 ID | 图标描述 |
|------|---------|----------|
| 顶部 1 | `files` | 文件夹 |
| 顶部 2 | `outline` | 列表 |
| 顶部 3 | `characters` | 人物 |
| 顶部 4 | `media` | 图片 |
| 顶部 5 | `graph` | 节点图 |
| 底部固定 | `settings` | 齿轮 |

**实际实现**（`IconBar.tsx` `MAIN_ICONS`）：`files` → `search` → `outline` → `versionHistory` → `memory` → `characters` → `knowledgeGraph` + `settings`

| 漂移类型 | 面板 | 说明 | 需 Owner 决策 |
|---------|------|------|---------------|
| **代码多出** | `search` | Spec 无此 IconBar 入口 | S3 改造后迁为弹出 Dialog（已计划） |
| **代码多出** | `versionHistory` | Spec 无此 IconBar 入口 | S3 改造后迁为弹出 Dialog（已计划） |
| **代码多出** | `memory` | Spec 无此 IconBar 入口 | S3 改造后迁为弹出 Dialog（已计划） |
| **代码缺失** | `media` | Spec 要求有，代码无对应实现 | 补全媒体功能 / 从 Spec 移除 |
| **顺序不同** | — | Spec: files→outline→characters→media→graph；代码: files→search→outline→versionHistory→memory→characters→knowledgeGraph | 对齐其一 |
| **命名不同** | `graph` vs `knowledgeGraph` | Spec 用 `graph`，代码用 `knowledgeGraph` | 统一命名，建议用 Spec 值 |

> 注：S3 改造完成后，`search`/`versionHistory`/`memory` 将从 sidebar 面板迁为触发 Dialog——Icon Bar 图标可保留（变为 Dialog 触发器），规范漂移自然消减。`media` 缺失和 `graph`/`knowledgeGraph` 命名不一致需独立决策。

### RightPanel 漂移

**Spec 要求**（`workbench/spec.md` §右侧面板 节）：

> 右侧面板**必须**仅包含两个标签页：**AI 面板**和 **Info 面板**，通过顶部标签切换。不放置知识图谱、记忆面板等功能。

**实际实现**（`RightPanel.tsx` `RIGHT_PANEL_TABS`）：`AI` / `Info` / `Quality`（3 个 tab）

| 漂移类型 | Tab | 说明 | 需 Owner 决策 |
|---------|-----|------|---------------|
| **代码多出** | `Quality`（质量门禁） | Spec 明确仅允许两个 tab | 更新 Spec 允许第三个 tab / 移除 Quality tab |

### 数值一致性验证

| 属性 | Spec 定义 | 代码实现（`layoutStore.tsx`） | 一致 |
|------|----------|-----------------------------|------|
| 右面板默认宽度 | 320px | `panel.default: 320` | ✅ |
| 右面板最小宽度 | 280px | `panel.min: 280` | ✅ |
| 右面板最大宽度 | 480px | `panel.max: 480` | ✅ |
| 左边栏默认宽度 | 240px | `sidebar.default: 240` | ✅ |
| 左边栏最小宽度 | 180px | `sidebar.min: 180` | ✅ |
| 左边栏最大宽度 | 400px | `sidebar.max: 400` | ✅ |

---

## 五、Owner 确认项——历史决策记录

> **正文已按以下决策全部更新。** 本节保留为决策溯源 changelog，不再作为独立的最终裁定。具体体现：S2 行为定义已对齐第 2 条，S5 修复方案已对齐第 4 条。

| # | 问题 | Owner 决定 |
|---|------|-----------|
| 1 | S3 弹出式改造范围 | 全部改弹出。search 走 Spotlight 浮层（对标 Cmd+K），其余 4 个走全屏 Dialog |
| 2 | S2 打开文件夹行为 | 对标 Windsurf/Cursor：文件夹即工作区，直接打开，不创建「项目」中间层。后续可在项目属性中补充元数据 |
| 3 | S6 candidateCount | 隐藏 UI，保留后端逻辑 + localStorage 持久化，在 Settings → AI 中增加高级选项 |
| 4 | S5 语言策略 | 直接做 i18n 键值化，不走先统一中文再改的中间态 |
| 5 | ProxySection.tsx | 死代码，删除 |
| 6 | 执行模式 | 逐项提 PR |

---

## 六、系统性审计发现（深度扫描）

以顶级前端 UI/UX 设计师视角，对全部 Feature/Layout/Primitive 组件进行 10 维度扫描。以下为前两轮反馈未覆盖的新发现。

### 审计量化数据

| 维度 | 匹配数 | 涉及文件数 | 最严重文件 |
|------|--------|-----------|-----------|
| 硬编码 hex 颜色（`#xxx`） | 120 | 25 | SearchPanel.tsx（**61**）¹ |
| 硬编码 rgba() | 82 | 15 | SearchPanel.tsx（**43** 处）² |
| `transition-all` 滥用 | 47 | 23 | CharacterDetailDialog.tsx（7） |
| 硬编码 z-index（`z-\d+`） | 17 | 12 | ZenMode.tsx（3） |
| `h-screen`/`w-screen` 越权 | 52 | 11 | CharacterPanel.stories.tsx（12） |
| overflow-* 碎片化 | 103 | 58 | SearchPanel.tsx（5） |
| `focus-visible` 覆盖 | 184 | 43 | 集中在 Primitives，Feature 层稀疏 |
| aria 属性覆盖 | 164 | 65 | 底层覆盖率中等，Feature 层有缺口 |

> ¹ 验证：`grep -oP '#[0-9a-fA-F]{3,8}' SearchPanel.tsx | wc -l` → **61**（原报告写 56，已校正）
> ² 验证：`grep -oP 'rgba\(' SearchPanel.tsx | wc -l` → **43**（原报告写 28 为含 rgba 的行数，此处为出现次数，已校正）

### A1. SearchPanel 完全脱离设计系统

**严重度：P0**

`SearchPanel.tsx`（**1079 行**）是全前端最严重的 Token 逃逸区：
- **61 处**硬编码 hex 颜色：`#0f0f0f`/`#888888`/`#444444`/`#3b82f6`/`#ef4444` 等
  > 验证：`grep -oP '#[0-9a-fA-F]{3,8}' SearchPanel.tsx | wc -l` → **61**
- **43 处**硬编码 rgba：`rgba(255,255,255,0.05)`/`rgba(59,130,246,0.2)` 等
  > 验证：`grep -oP 'rgba\(' SearchPanel.tsx | wc -l` → **43**
- 5 处 `transition-all`
- 内联 `style={{ background: "#0f0f0f" }}` 和 `style={{ boxShadow: "..." }}`
- 自建 `CategoryButton`/`ToggleSwitch`/`KeyHint` 等子组件，完全不复用 Primitives
- 原生 `<input>` 替代 `<Input>` Primitive
- 原生 `<button>` 替代 `<Button>` Primitive

**本质**：这个组件是独立暗黑主题硬编码的小世界，对 Token 变量和 Primitive 组件的存在视而不见。

**修复**：全面重写，所有颜色改为 `--color-*` Token，子组件改为复用 Primitives/Composites，`<input>` 替换为 `<Input>`。

---

### A2. DashboardPage 幽灵按钮（Dead UI）

**严重度：P1**

DashboardPage 中存在多个「有 UI 无逻辑」的幽灵按钮：

| 按钮 | 位置 | 问题 |
|------|------|------|
| "View All" | HeroCard section title | 无 `onClick` handler，点击无响应 |
| Grid View / List View 切换 | Recent Projects title | 无 `onClick` handler，纯装饰图标按钮 |
| ProjectCard 描述文案 | 每个项目卡片 | 全部硬编码 "Open this project to continue writing." 无实际信息价值 |

**修复**：
- 移除未实现的功能按钮，或实现对应逻辑
- ProjectCard 描述应显示项目实际摘要/最近编辑内容，而非固定文案

---

### A3. ErrorBoundary 单层架构

**严重度：P1**

当前仅有一个 `ErrorBoundary` 包裹整个渲染进程。任何子组件（包括 KG 面板、SearchPanel）的崩溃都会导致**全屏白屏**。

设计规范（`CN 前端开发/渲染架构与状态管理`）明确要求 4 层 Boundary：

```
AppErrorBoundary（整个应用）
├── EditorBoundary（主编辑区）
├── SidebarBoundary（左侧边栏）
└── PanelBoundary（右侧面板/AI/搜索/KG）
```

**修复**：新增 3 个分区 Boundary，各区崩溃只影响自身，不影响其他区域。

---

### A4. 无骨架屏（Skeleton）

**严重度：P1**

已有 `Skeleton` Primitive 组件（`components/primitives/Skeleton.tsx`），但全前端无一处使用。所有加载状态只有裸 `<Spinner>`：
- DashboardPage 加载：居中 Spinner
- 文件树加载：空白
- 人物列表加载：空白
- KG 面板加载：空白

设计规范（`CN 前端开发/微交互与动画编排`）明确要求：
> 加载时间 < 200ms 的场景不显示骨架屏，> 200ms 的场景必须有骨架屏。

**修复**：为 DashboardPage、FileTreePanel、CharacterPanel、KnowledgeGraph 创建对应骨架屏组件。

---

### A5. AI 面板内联 `<style>` 标签

**严重度：P2**

`AiPanel.tsx` 末尾有一个内联 `<style>` 标签定义 `typing-cursor` 动画和 `@keyframes blink`。这种写法：
- 每次组件重渲染都创建新的 `<style>` 元素
- 绕过 Tailwind/CSS 模块系统
- 无法被 purge 或 tree-shake

**修复**：将 keyframes 移入 `tokens.css` 或 Tailwind config，用 `animate-*` 类名引用。

---

### A6. AI 面板点击目标过小

**严重度：P1**

AI 面板 header 中的 History/NewChat 按钮尺寸为 `w-5 h-5`（20×20px），低于 WCAG 2.2 对触控目标最小 24×24px 的要求（Target Size Level AA）。

内部 SVG 图标为 `12×12px`，极难精确点击。

**修复**：按钮尺寸提升到至少 `w-6 h-6`（24px），图标保持 12-16px，padding 补足。合并到 S6 RightPanel tab bar 改造时一并修复。

---

### A7. SVG 图标不统一，未复用 Lucide

**严重度：P2**

项目已引入 `lucide-react`（IconBar 使用），但大量 Feature 组件手写内联 SVG：
- DashboardPage：SearchBar 图标、HeroCard 图标、MoreIcon、Grid/List 切换图标、NewDraftCard "+" 符号
- SearchPanel：搜索图标、关闭图标、文件夹图标、箭头图标、错误图标等 15+ 处
- OnboardingPage：4 个 Feature 图标
- AiPanel：History/NewChat 图标

**后果**：
- 不同 `strokeWidth`（1 / 1.5 / 2）混用，视觉权重不统一
- 相同语义图标（如搜索）在不同组件中有不同 SVG 路径
- 无法通过 Lucide 的 `size`/`strokeWidth` 统一管理

**修复**：全部替换为 Lucide 图标，统一 `strokeWidth={1.5}`/`size={16|20|24}`。

---

### A8. DashboardPage i18n 混沌

**严重度：P1**

同一个 `DashboardPage.tsx` 内中英文混杂：

| 语言 | 示例 |
|------|------|
| 中文 | "大纲"/"初稿"/"修改"/"定稿"/"项目"/"开始创建你的第一个创作项目"/"新建项目"/"未找到匹配结果" |
| 英文 | "Continue Writing"/"Recent Projects"/"Start Something New"/"New Draft"/"Archived"/"Create New"/"View All"/"Search across projects..."/"Untitled Project"/"Open this project to continue writing."/"Last edited X ago" |

`formatDate` 函数硬编码 `en-US` locale。`formatRelativeTime` 返回英文字符串。

对比：`StatusBar.tsx` 和 `CommandPalette.tsx` 已经使用 `useTranslation()` + `t()` 调用。说明 **i18n 基础设施已就绪**，但 DashboardPage/OnboardingPage/SearchPanel/AiPanel 等核心页面未接入。

**修复**：纳入 i18n 键值化任务（已确认直接做 i18n）。

---

### A9. WelcomeScreen 应合并到 DashboardPage

**严重度：P2**

`WelcomeScreen.tsx`（63 行）极简：一个 Card + "Welcome to CreoNow" + "Create project" 按钮。而 `DashboardPage` 的空状态（`items.length === 0`）已有更完整的 empty state UI（图标 + 说明 + 按钮）。

两者功能完全重叠。

**修复**：删除 `WelcomeScreen`，将其入口点（AppShell 中 `bootstrapStatus === "ready" && items.length === 0` 分支）直接渲染 `DashboardPage`。DashboardPage 空状态增加「打开文件夹」按钮。

---

### A10. `prefers-reduced-motion` 未被 Feature 层尊重

**严重度：P2**

设计规范（`CN 前端开发/微交互与动画编排`）要求所有动画尊重 `prefers-reduced-motion`。

实际：
- DashboardPage 使用 `animate-fade-in-up`/`animation-delay-*` 动画，无 reduced motion 检查
- SearchPanel 使用内联 `animation: slideDown 0.3s`，无 reduced motion 检查
- OnboardingPage 使用 `animate-fade-in-up`，无 reduced motion 检查

Sidebar 的 reduced motion 支持已有（虽因 transition 移除而不再需要），说明**机制已知**，但未推广。

**修复**：在 `tokens.css` 的 `@media (prefers-reduced-motion: reduce)` 下统一禁用或缩短所有自定义动画。

---

### A11. ZenMode Token 化

**严重度：✅ 核心已完成（残余清扫 P2）**

> 验证：`ZenMode.tsx:100` `backgroundColor: "var(--color-zen-bg)"`；`tokens.css:84` `--color-zen-bg: #050505`；`--color-zen-glow` 和 `--color-zen-text` 同样已 Token 化。

`ZenMode.tsx` 核心背景色（`--color-zen-bg`）、发光效果（`--color-zen-glow`）、文字颜色（`--color-zen-text`）已在 `tokens.css` 中定义并在代码中引用。**原问题已修复。**

**残余 Token 逃逸**（待清扫，见 §七 第三批 ①）：

| 位置 | 硬编码内容 | 建议替换为 |
|------|---------|---------------|
| `ZenMode.tsx:142` | `rgba(255, 255, 255, 0.05)` hover 色 | `var(--color-zen-hover)` 或相近 Token |
| `ZenMode.tsx:197` | `px-[80px] py-[120px]` 魔法间距 | `--zen-content-padding-*` Token 或 4px Grid |
| `ZenMode.tsx:200` | `text-[48px]` 魔法字号 | `--zen-title-size` Token |
| `ZenMode.tsx:211` | `text-[18px]` 魔法字号 | `--zen-body-size` Token |
| `ZenModeStatus.tsx:57` | `rgba(0, 0, 0, 0.5)` 状态栏背景 | `var(--color-zen-statusbar-bg)` Token |
| `ZenMode.tsx` 内联 style | 枚举 原生 `<style>` 标签 | 移入 `tokens.css` 或 Tailwind config |

---

### A12. Feature 层 focus-visible 缺失

**严重度：P1**

`focus-visible` 样式集中在 Primitives（Button/Input/Select 等 43 个文件），但 Feature 层自定义按钮几乎全部缺失：
- DashboardPage：`HeroCard`、`ProjectCard`、`NewDraftCard`、`SectionTitle` action 按钮 — 无 focus-visible
- SearchPanel：`CategoryButton`、`ToggleSwitch`、所有结果项 — 无 focus-visible
- AiPanel：History/NewChat 按钮 — 无 focus-visible
- CharacterPanel：`EmptyGroupState` 按钮 — `hover:bg-[#111]` 硬编码

**后果**：键盘用户无法看到当前焦点位置，纯键盘操作不可用。

**修复**：所有可交互元素添加 `focus-visible:outline` 样式。长期方案：通过 Composites 封装统一解决。

---

### A13. aria-live 缺失（动态内容无播报）

**严重度：P2**

以下动态更新区域缺少 `aria-live` 属性，屏幕阅读器用户无法感知内容变化：
- AI 面板流式输出区域
- 搜索结果列表
- 自动保存状态变化
- 错误/成功 Toast 通知

**修复**：在动态内容容器上添加 `aria-live="polite"`（非紧急更新）或 `aria-live="assertive"`（错误）。

---

### A14. 死代码清理

**严重度：P2**

| 文件 | 问题 |
|------|------|
| `ProxySection.tsx`（12KB） | 未被任何文件引用，Owner 已确认删除 |
| `WelcomeScreen.tsx`（63 行） | 功能与 DashboardPage 空状态重叠，应合并删除 |
| SearchPanel `MOCK_SEARCH_RESULTS` | 60 行 Mock 数据留在生产代码中 |
| AiPanel `ChatHistory.onSelectChat` | placeholder 实现（`void chatId`），UI 可点击但无实际功能 |

---

### A15. HeroCard 固定比例布局问题

**严重度：P2**

`HeroCard` 右侧装饰区用 `w-[35%]`，在超宽屏（>1920px）空旷、窄屏（<1280px）挤压文字区域。`min-h-[280px]` 在小窗口下可能超出可视区域。

设计规范（`CN 前端开发/视觉审计`）：
> DashboardPage Hero Card — 写死 w-[35%]，超宽屏空旷，窄屏挤压

**修复**：改用 `max-w-[240px]` 或 `clamp()` 限制装饰区最大宽度，小屏隐藏装饰区。

---

### A16. `Date.now()` 在测试中不确定

**严重度：P2**

`formatRelativeTime()` 直接调用 `Date.now()`，`SearchPanel.navigateSearchResult()` 使用 `Date.now()` 生成 flashKey。设计规范 P6（确定性与隔离）：

> 测试不得依赖真实时间。使用 fake timer。

`formatRelativeTime` 在测试中结果不确定（今天通过明天可能失败）。

**修复**：注入 `now` 参数或使用 fake timer。

---

### A17. CommandPalette 搜索已有 i18n，可作为范本

**严重度：信息**

`CommandPalette.tsx` 已完整使用 `useTranslation()` + `t()` + `GROUP_TRANSLATION_KEYS` 映射。`StatusBar.tsx` 同样使用了 i18n。

这两个文件可以作为其余 60+ 文件 i18n 改造的范本。

---

## 七、执行优先级（重排）

> 排序原则：① 当前已 broken 的 Bug 优先 ② 前置依赖先行 ③ 高收益低成本靠前 ④ 独立 Issue 最后。
> 已完成项标 ✅ 保留原位作为进度记录。

### 第零批：现存 Bug（立即 Hotfix，不等批次）

| 序号 | 任务 | 预估 | 依赖 | 状态 |
|------|------|------|------|------|
| ① | **SearchPanel Sidebar 挂载无法关闭 Bug**（S3 前置）：`Sidebar.tsx` 挂载 `SearchPanel` 时不传 `open`/`onClose`，导致 `fixed inset-0` 全屏覆盖后 backdrop 点击无响应（见 §二.S3 标注） | 30min | — | 待执行 |

### 第一批：核心体验修复（逐项 PR）

| 序号 | 任务 | 预估 | 依赖 | 状态 |
|------|------|------|------|------|
| ② | Sidebar 拖动 Bug (F3) | 30 min | — | ✅ 已完成 |
| ③ | Settings tab 命名 (F4) | 30 min | — | ✅ 已完成 |
| ④ | 删除死代码：ProxySection + WelcomeScreen + Mock 数据 (A14) | 1h | — | 待执行 |
| ⑤ | AI 面板布局整改 (S6)：移除 1x UI、History/NewChat 提升到 tab bar、修复点击目标 (A6) | 3h | — | 待执行 |
| ⑥ | AI 面板去边框 (S7 局部) + 错误专用引导 UI (F2) + 移除内联 style (A5) | 4h | ⑤ | 待执行 |
| ⑦ | 左侧面板弹出式改造 (S3)：search→Spotlight，其余 4 个→Dialog | 8h | ① | 待执行 |
| ⑧ | AI toggle 按钮 (S4) | 2h | — | 待执行 |
| ⑨ | DashboardPage 幽灵按钮清理 + WelcomeScreen 合并 (A2/A9) | 3h | ④ | 待执行 |

### 第二批：功能补全

| 序号 | 任务 | 预估 | 依赖 | 状态 |
|------|------|------|------|------|
| ⑩ | dialog:open-folder IPC + 多入口 (S2) | 4h | — | 待执行 |
| ⑪ | ImageUpload → ImageCropper (S1) | 4h | — | 待执行 |
| ⑫ | Onboarding 向导重做 (F1.A) | 6h | ⑦⑩ | 待执行 |
| ⑬ | ErrorBoundary 分层 (A3) | 3h | — | 待执行 |
| ⑭ | 骨架屏补全 (A4) | 4h | — | 待执行 |

### 第三批：设计系统回归

| 序号 | 任务 | 预估 | 依赖 | 状态 |
|------|------|------|------|------|
| ⑮ | SearchPanel 全面重写回归 Token + Primitives (A1) | 8h | ① | 待执行 |
| ⑯ | SVG 图标统一替换为 Lucide (A7) | 4h | — | 待执行 |
| ⑰ | Feature 层 focus-visible 补全 (A12) | 3h | — | 待执行 |
| ⑱ | 全局去视觉噪音 (S7 全量) | 6h | ⑤⑥⑦ | 待执行 |
| ⑲ | prefers-reduced-motion 全局支持 (A10) | 2h | — | 待执行 |
| ⑳ | ZenMode 残余 Token 逃逸清扫 (A11 残余)：hover rgba、魔法间距字号、ZenModeStatus 背景、内联 style | 1h | — | 待执行 |
| ㉑ | HeroCard 响应式修复 (A15) | 1h | — | 待执行 |

> 注：A11 核心（`--color-zen-bg` / `--color-zen-glow` / `--color-zen-text` Token 化）**✅ 已完成**，⑳ 仅为残余逃逸清扫。

### 第四批：独立 Issue

| 序号 | 任务 | 预估 | 状态 |
|------|------|------|------|
| ㉒ | i18n 键值化 + 语言切换 UI (S5 + A8 + A17) | 12h+ | 独立 Issue |
| ㉓ | Token 逃逸清扫（颜色/z-index/阴影/间距/rgba） (R2) | 10h+ | 独立 Issue |
| ㉔ | Layer 2 Composites 封装 (R3) | 12h+ | 独立 Issue |
| ㉕ | aria-live + 动态内容无障碍 (A13) | 4h | 独立 Issue |
| ㉖ | Date.now() 确定性修复 (A16) | 2h | 独立 Issue |
| ㉗ | AI DB/打包 native binding 修复 (F2 中期) | 待定 | 独立 Issue |

### 待 Owner 决策（Spec 漂移阻塞项）

在以下决策确认前，相关任务的最终实现方向存在不确定性：

| # | 决策项 | 阻塞任务 |
|---|--------|---------|
| D1 | Icon Bar 中 `media` 面板如何处置（补全实现 / 从 Spec 删除） | S3 改造范围 ⑦ |
| D2 | Icon Bar `graph` vs `knowledgeGraph` 命名统一 | S3 改造 ⑦ |
| D3 | RightPanel `Quality` tab 保留 / 移除（涉及 Spec 更新） | S6 改造 ⑤ |

---

## 八、审计维度清单（供后续复查）

### Windsurf 审计已覆盖

| 维度 | 检查项 | 状态 |
|------|--------|------|
| 信息架构 | 页面流转/导航模式/心智模型 | ✅ 已审计（S3/A2/A9） |
| 布局 | Grid 一致性/间距/响应式/面板比例 | ✅ 已审计（A15/S7） |
| 排版 | 字号层级/字重/行高/语义化 | ✅ 已审计（R2） |
| 颜色 | Token 使用/对比度/暗亮切换 | ✅ 已审计（A1/R2/A11） |
| 交互 | 点击目标/hover 反馈/动画一致性 | ✅ 已审计（A6/A10/A5） |
| 错误处理 | Error Boundary/错误 UI/恢复机制 | ✅ 已审计（A3/F2） |
| 加载状态 | 骨架屏/Spinner/空状态 | ✅ 已审计（A4/A2） |
| 无障碍 | focus-visible/aria/键盘导航 | ✅ 已审计（A12/A13） |
| i18n | 语言统一/键值化/切换 UI | ✅ 已审计（A8/A17/S5） |
| 代码卫生 | 死代码/Mock 数据/内联 style/确定性 | ✅ 已审计（A14/A5/A16） |

### 编辑器与桌面体验（§九）— 已全部审计

> 以下维度在 §九 中均有具体代码实况审计结果（B1–B45）。

| 维度 | §九 节点 | 状态 | 核心发现 |
|------|--------|------|----------|
| 编辑器核心 UX | B1–B6 | ✅ 已审计 | Inline Diff 脱离编辑器（B4）；选区/光标未走 Token（B1） |
| 键盘快捷键体系 | B7–B11 | ✅ 已审计 | 4+ 处独立 addEventListener，无统一 HotkeyManager（B9） |
| 右键菜单 | B12–B14 | ✅ 已审计 | 编辑区无自定义菜单，仅浏览器默认（B12） |
| 拖拽交互 | B15–B17 | ✅ 已审计 | 文件树拖拽已实现；编辑内容块拖拽不支持（B16） |
| Tooltip/Popover 一致性 | B18–B20 | ✅ 已审计 | 47 个文件用原生 `title`，Radix Tooltip 几乎无人用（B18） |
| Undo/Redo + 自动保存 | B21–B24 | ✅ 已审计 | AI stream 非原子撤销（B22）；保存四态 UI 已实现（B23） |
| 主题切换完整性 | B25–B28 | ✅ 已审计 | 切换附闪烁，无过渡动画（B26）；三态切换已实现（B28） |
| Electron 窗口管理 | B29–B32 | ✅ 已审计 | 窗口位置不持久化（B31）；无 singleInstanceLock（B32） |
| Command Palette 深度 | B33–B37 | ✅ 已审计 | 仅 8 个命令；无文件搜索；无 fuzzy match（B34/B37） |
| 响应式/极端尺寸 | B38–B40 | ✅ 已审计 | 编辑区无最小宽度保护；工具栏无溢出处理（B38/B45） |
| 细节体验 | B41–B45 | ✅ 已审计 | 文件树无展开动画（B41）；CommandPalette 无焦点陷阱（B42） |
| **Spec 漂移** | §四-A | ✅ 已审计 | IconBar 漂移 6 项；RightPanel Quality tab 超出 Spec |

---

## 九、编辑器与桌面体验深度审计（B1–B45）

> 以下为对照代码的实际审计结果。🔴 = 必需修复，🟡 = 建议修复，✅ = 已实现良好。

---

### 🔴 B1–B6. 编辑器核心体验

**B1. 光标与选区体验**

- **光标闪烁**：使用 ProseMirror 默认光标（浏览器原生 `caret-color`），`AiPanel.tsx` 末尾有内联 `<style>` 定义 `@keyframes blink` 用于 AI 打字光标，但编辑区本身的光标无自定义动画，也**未走 Token**。
- **选区高亮**：ProseMirror 默认 `::selection` 颜色，由浏览器决定。**未走主题 Token**——亮色模式下选区颜色与暗色模式相同（浏览器默认蓝色）。
- **多光标/协作光标**：**未预留**。TipTap 扩展列表中无 `Collaboration` 或 `CollaborationCursor`。
- **问题**：选区色应为 `--color-selection` Token，光标色应为 `--color-caret` Token。

**B2. 段落间距与行高**

- **已有独立 Editor Token**（`tokens.css`）：`--text-editor-size: 16px`、`--text-editor-line-height: 1.8`、`--text-editor-line-height-cjk: 1.95`。
- **CJK 检测**：`typography.ts` 中 `resolveEditorLineHeightToken()` 按 `locale` 匹配 `zh|ja|ko` 切换 CJK 行高。
- **缩放适配**：`resolveEditorScaleFactor()` 按 `devicePixelRatio` 分三档 (`1x`/`1.25x`/`1.5x`)。
- **实际应用**：`EditorPane.tsx:1026` 编辑区容器通过 CSS 变量 `--editor-line-height` 和 `--editor-font-size` 生效。
- **问题**：缺少 `--text-editor-paragraph-spacing` 和 `--text-editor-letter-spacing` Token。段间距靠 ProseMirror 默认 margin，未显式控制。对标 iA Writer（line-height 1.6–1.7 for Latin、2.0 for CJK），当前值 **1.8/1.95 偏高**，可能导致单屏可视行数过少。

**B3. 长文档滚动性能**

- **无虚拟化**。`EditorPane.tsx` 直接渲染 `<EditorContent editor={editor} />`，外层仅包一个 `<ScrollArea>`（Radix ScrollArea Primitive）。
- TipTap/ProseMirror **本身不支持虚拟化**。`EDITOR_DOCUMENT_CHARACTER_LIMIT = 1_000_000`（100 万字符 ≈ 50万中文字），超限有警告文案。
- **大粘贴处理**：`LARGE_PASTE_THRESHOLD_CHARS = 2MB` 时分块插入（64KB/chunk），有 overflow 确认弹窗。
- **问题**：10 万字文档（约 30 万字符）在 ProseMirror 中仍会渲染完整 DOM，**滚动帧率未做基准测试**。需要实测。

**B4. AI 内联编辑（Inline Diff）**

- **已实现**。`InlineDiffControls.tsx` 提供逐 hunk 的 accept/reject 交互：
  - 删除行：`bg-[var(--color-error-subtle)]` + `line-through` + 红色文字
  - 新增行：`bg-[var(--color-success-subtle)]` + 绿色文字
  - 每个 hunk 下方有 Accept / Reject 按钮（使用 `<Button>` Primitive）
- `extensions/inlineDiff.ts` 基于 `lib/diff/unifiedDiff.ts` 计算 hunk，走纯函数。
- **问题**：当前 Inline Diff 是**独立面板渲染**（`section` 容器），**不是编辑器内联 decoration**。与 Cursor 的内联体验有本质差距——Cursor 的 diff 高亮直接叠加在编辑器文本上，用户可在原文位置逐行 accept/reject。CN 的实现是在编辑区外的一个卡片里展示 diff，脱离了写作上下文。`InlineDiffExtension` 目前只是空壳（`decorations: []`），TipTap decoration 集成尚未落地。

**B5. 打字延迟（Input Latency）**

- **潜在问题**：`EditorPane` 每次 `editor.on("update")` 触发时执行 `syncCapacityState()`（计算字符数）+ entity completion 检测（文本扫描 + 可能的 IPC 调用）。
- `useAutosave` 在 update 时设置 `setAutosaveStatus("saving")` + 500ms debounce。
- **无 `React.memo` 或 `useDeferredValue` 保护**。编辑区外层状态变化（如 `autosaveStatus`、`entityCompletionSession`）可能导致非编辑区域 re-render。
- **问题**：需要实测。代码层面看，每次按键至少触发 3 个 `editor.on("update")` 回调，其中 entity completion 的 `detectEntityCompletionInput()` 做正则匹配 + 字符串截取。高频输入时可能产生微卡。

**B6. 浮动工具栏（Bubble Menu）**

- **已实现**（`EditorBubbleMenu.tsx`），基于 TipTap `<BubbleMenu>` + Tippy.js。
- **格式按钮**：Bold / Italic / Underline / Strikethrough / Code / Link（6 个），使用自定义 `<InlineFormatButton>`。
- **AI 操作入口**：✅ 有 4 个——润色 / 改写 / 描写 / 对白。点击后捕获选区、注入 AI 技能执行。
- **样式走 Token**：✅ `z-[var(--z-dropdown)]`、`rounded-[var(--radius-md)]`、`bg-[var(--color-bg-raised)]`、`shadow-[var(--shadow-lg)]`。
- **placement 智能切换**：`resolveBubbleMenuPlacement()` 检测选区距顶部距离，不够时翻转到 bottom。
- **reduced motion**：✅ `resolveReducedMotionDurationPair()` 支持。
- **问题**：AI 按钮使用原生 `<button>` 而非 `<InlineFormatButton>`（格式按钮用了后者），且有 `focus-visible` 样式但**与格式按钮的实现不一致**。缺少「翻译」「续写」入口——当前只有润色/改写/描写/对白。

---

### 🔴 B7–B11. 键盘快捷键体系

**B7. 快捷键清单**

`config/shortcuts.ts` 集中定义，实际注册的快捷键：

| 分类 | 快捷键 | 实现状态 |
|------|--------|----------|
| 格式 | mod+B / mod+I / mod+U / mod+Shift+X / mod+E | ✅ TipTap StarterKit 内置 + EditorToolbar |
| 标题 | mod+1 / mod+2 / mod+3 | ✅ TipTap StarterKit |
| 列表 | mod+Shift+8 / mod+Shift+7 | ✅ TipTap StarterKit |
| 块 | mod+Shift+B / mod+Alt+C | ✅ TipTap StarterKit |
| 历史 | mod+Z / mod+Shift+Z (mac) / mod+Y (win) | ✅ TipTap StarterKit |
| 保存 | mod+S | ✅ `EditorPane.tsx` 手动 `addEventListener` |
| 布局 | F11 (ZenMode) / Escape (退出 Zen) / mod+P (CommandPalette) / mod+\\ (侧边栏) / mod+L (右面板) | ✅ AppShell 层注册 |
| AI | 续写/润色有快捷键 | ✅ `skillShortcutDispatcher.ts` |

**缺失**：无 Ctrl+K（搜索/链接插入统一入口）、无 Ctrl+/ （快捷键参考）、无 Ctrl+Shift+P（区分文件搜索 vs 命令面板）。

**B8. 快捷键冲突**

- **mod+P** 同时是 CommandPalette 和浏览器默认打印——Electron 中打印不是问题，但需确认 macOS 上 ⌘P 是否被 Electron 拦截。
- **mod+L** 同时是 Toggle Right Panel 和浏览器默认聚焦地址栏——Electron 中无地址栏，安全。
- **未发现直接冲突**，但 TipTap StarterKit 内置快捷键未在 `shortcuts.ts` 中显式列出（如 Tab/Shift+Tab 缩进），可能与 Dialog 内 Tab 导航冲突。

**B9. 统一管理机制**

- **半统一**。`config/shortcuts.ts` 是集中定义文件，提供 `getAllShortcuts()` / `getShortcutDisplay()` API。
- **但注册是分散的**：
  - `EditorPane.tsx:839-878`：`window.addEventListener("keydown")` 处理 mod+S 和 AI 快捷键
  - `AppShell.tsx`：另一处 `window.addEventListener("keydown")` 处理 F11/mod+P/mod+L/mod+\\
  - `EditorBubbleMenu.tsx`：Tooltip 中显示快捷键但不注册
  - `EntityCompletion`：又一处 `window.addEventListener("keydown")`
- **问题**：4+ 处独立的 `window.addEventListener("keydown")`，无优先级/传播控制。如果同时有 Dialog 打开 + 编辑器聚焦，所有 listener 都会触发。**无统一的 HotkeyManager**。

**B10. 快捷键参考面板**

- **不存在**。无类似 Notion 的 Ctrl+/ 或 VS Code 的 Ctrl+K Ctrl+S 面板。
- `getAllShortcuts()` 已准备好数据源，但前端**无任何 UI 消费它**。
- **修复建议**：在 CommandPalette 或 Settings 中增加 Shortcuts 面板。

**B11. 跨平台映射**

- **已处理**。`isMac()` 检测 `navigator.platform`，`getModKey()` 返回 `⌘` 或 `Ctrl`。
- `formatShortcutDisplay()` 将 `mod` 映射为平台对应符号，macOS 使用无分隔符拼接（`⌘B`），Windows 使用 `+` 拼接（`Ctrl+B`）。
- ✅ 实现正确。

---

### 🔴 B12–B14. 右键菜单 / Context Menu

**B12. 编辑区右键菜单**

- **浏览器默认菜单**。`EditorPane.tsx` 和 `EditorContent` 均无 `onContextMenu` 处理。编辑区右键弹出 Chromium 默认菜单（Copy/Paste/Select All 等英文条目）。
- **问题**：作为桌面 IDE 产品，编辑区右键应提供自定义菜单，包含格式操作、AI 技能入口、复制为 Markdown 等。

**B13. 文件树右键菜单**

- **已实现**，且使用 Radix `ContextMenu` Primitive。`FileTreePanel.tsx:817-871` 定义了 6 个菜单项：
  - Rename / Copy / Move to Folder / Delete（destructive） / Version History / Mark as Draft/Final
- **缺失**：无「复制路径」、无「在文件管理器中打开」、无「新建同级文件」。与 VS Code/Cursor 的文件操作体验有差距。

**B14. 实现复用**

- ✅ 文件树使用 `ContextMenu` Primitive（`@radix-ui/react-context-menu`），走 Token 样式。
- ❌ 编辑区无自定义右键菜单。
- ❌ DashboardPage 项目卡片无右键菜单（只有 onClick）。

---

### 🟡 B15–B17. 拖拽交互

**B15. 文件树拖拽**

- **已实现**，使用**原生 HTML5 Drag API**（`draggable`、`onDragStart`、`onDragOver`、`onDrop`）。
- 支持两种 drop 模式：`"before"`（排序）和 `"into"`（移入文件夹）。
- `buildReorderedDocumentIds()` 计算重排后的 ID 序列，通过 IPC `reorder` 提交。
- 有 `FileTreePanel.drag-drop.test.tsx` 测试文件。

**B16. 编辑区内容块拖拽**

- **不支持**。TipTap 扩展列表中无 drag handle 插件。编辑器内容块无法拖拽重排。
- ProseMirror 原生支持文本选区拖拽（浏览器行为），但无 block-level drag handle（Notion 样式的）。

**B17. 拖拽视觉一致性**

- 文件树 drop indicator：`bg-[var(--color-accent)]` 的 2px 水平线，✅ 走 Token。
- drop-into 状态：`bg-[var(--color-bg-selected)]` 高亮目标行，✅ 走 Token。
- drag ghost：**使用浏览器默认 drag ghost**（半透明元素克隆），未自定义。
- **OutlinePanel** 也有拖拽（61 处 drag 相关匹配），使用类似原生 HTML5 drag 实现。

---

### 🟡 B18–B20. Tooltip 和 Popover 一致性

**B18. Tooltip 实现统一性**

- Radix `Tooltip` Primitive 已有（`Tooltip.tsx`），基于 `@radix-ui/react-tooltip`。
- **但大量组件使用原生 `title` 属性替代**：扫描发现 **47 个 TSX 文件** 中有 `title=` 使用，包括：
  - `EditorToolbar.tsx`：`ToolbarButton` 使用 `title={shortcut ? \`${label} (${shortcut})\` : label}` 而非 Radix Tooltip
  - `AiPanel.tsx`：4 处 `title=`
  - `DashboardPage.tsx`：2 处
  - `DiffHeader.tsx`、`ExportDialog.tsx`、`SettingsAppearancePage.tsx` 等均有
- 仅 `ExportDialog.tsx`（3 处）和 `surfaceRegistry.ts`（4 处）实际导入使用了 `Tooltip` 组件。
- **问题**：Radix Tooltip Primitive 几乎无人使用。全前端 tooltip 实现处于「title 属性为主、Radix 组件为辅」的混乱状态。

**B19. Tooltip delay**

- Radix Tooltip Primitive 默认 `delayDuration={400}` ms、`skipDelayDuration={300}` ms。✅ 在 IDE 推荐范围内。
- 但原生 `title` 属性的延迟由浏览器控制（通常 500-1000ms），**两者不一致**。

**B20. z-index 层叠**

- `tokens.css` 定义了完整的 z-index Token 体系：`--z-dropdown: 200`、`--z-popover: 300`、`--z-modal: 400`、`--z-toast: 500`、`--z-tooltip: 600`。
- Tooltip Primitive 使用 `z-[var(--z-tooltip)]` ✅。
- ContextMenu 使用 `z-[var(--z-popover)]` ✅。
- **但** `EditorBubbleMenu.tsx:288` 硬编码 `zIndex: 400`（应为 `--z-modal` 的值但未引用 Token）。

---

### 🟡 B21–B24. Undo/Redo 和自动保存的 UX 反馈

**B21. Undo/Redo 基础功能**

- ✅ TipTap `StarterKit` 内置 `History` 扩展，mod+Z / mod+Shift+Z (mac) / mod+Y (win) 均可用。
- 撤销粒度：ProseMirror `History` 默认按 **input rule 分组**（连续输入算一组，停顿或其他操作断开分组），类似「逐词/逐操作」。
- EditorToolbar 有 Undo/Redo 按钮，通过 `editor.can().undo()` / `editor.can().redo()` 控制 disabled 状态 ✅。

**B22. AI 生成内容的原子撤销**

- **未做原子化处理**。AI 内联 diff 的 accept 操作通过 `InlineDiffControls.onAcceptHunk` → `onApplyAcceptedText` 回调写入，最终调用 `editor.commands.setContent()` 或 `insertContentAt()`。
- ProseMirror 的 `setContent()` 会**整体替换文档内容，创建一个撤销步骤**——但如果 AI 分多次 stream 写入，每次写入都是一个独立的撤销步骤。
- **问题**：如果用户 accept 一个 hunk，是一次 undo。但如果 AI stream 写入过程中用户想回退，需要多次 Ctrl+Z。应在 stream 开始和结束时包裹 `editor.state.tr.setMeta("addToHistory", false)` 来合并为原子操作。

**B23. 自动保存状态指示**

- ✅ **已实现**。`SaveIndicator.tsx` 渲染在 `StatusBar` 中（底部状态栏）。
- 四态：`idle`（不显示） / `saving`（"保存中…"） / `saved`（"已保存"，2 秒后自动消失） / `error`（红色错误文案 + 可点击重试）。
- 使用 i18n `t()` 调用（`workbench.saveIndicator.saving` 等）。
- `useAutosave.ts` 在 `editor.on("update")` 时设置 `saving` 状态，500ms debounce 后执行 IPC save。

**B24. 保存失败感知**

- ✅ **已实现**。`SaveIndicator` 在 `error` 状态下：
  - 文字变红色 `text-[var(--color-error)]`
  - 添加下划线 `underline`
  - 变为可点击 `cursor-pointer`
  - 点击调用 `onRetry`（即 `retryLastAutosave`）
- `editorStore` 有 `autosaveError` 字段和 `retryLastAutosave` / `clearAutosaveError` 方法。
- **问题**：重试机制存在但**无次数限制和指数退避**——如果 IPC 持续失败，每次点击都会立即重试。也没有 Toast 级别的全局提醒，只在 StatusBar 小字显示。

---

### 🟡 B25–B28. 主题切换的完整性

**B25. 全页面截图对比**

- **需运行时验证**，代码审计无法替代。但从代码看：
- `tokens.css` 定义了 `[data-theme="dark"]` 和 `[data-theme="light"]`（需确认 light 主题是否完整，文件仅 166 行，dark 主题定义从 line 95 开始）。
- `SearchPanel.tsx` 有 56 处硬编码 hex 颜色（`#0f0f0f`/`#888888` 等），**亮色模式下必然视觉崩塌**。
- `SettingsAppearancePage.tsx:84-86` 的 ThemePreview 组件内硬编码 `#0f0f0f`/`#ffffff` 等，不走 Token。

**B26. 切换过渡动画**

- **无过渡动画**。`App.tsx:73` 直接 `document.documentElement.setAttribute("data-theme", resolve(mode))`，瞬间闪切。
- `<html>` 和 `<body>` 上无 `transition` 样式。
- **问题**：主题切换时会产生刺眼的闪烁，应在 `<html>` 上加 `transition: background-color 150ms, color 150ms`。

**B27. 代码块高亮跟随**

- TipTap 使用 `StarterKit` 内置的 `CodeBlock` 扩展（纯 `<pre><code>` 渲染），**无语法高亮库**（未引入 `highlight.js` 或 `shiki`）。
- 代码块样式走 Token（`--color-bg-raised` 背景），主题切换时背景色会跟随。
- **文字颜色**：无语法着色，纯 `--color-fg-default`，主题切换无问题但功能缺失。

**B28. 三态切换**

- ✅ **已实现**。`themeStore.tsx` 定义 `ThemeMode = "dark" | "light" | "system"`。
- `App.tsx:63-80` 中 `resolve()` 函数：`system` 模式监听 `window.matchMedia("(prefers-color-scheme: dark)")`，自动切换。
- `SettingsAppearancePage.tsx` 提供 Light / Dark / System 三个按钮。
- 设置持久化通过 `PreferenceStore`（`localStorage`）key `creonow.theme.mode`。
- ✅ 实现完整。

---

### 🟡 B29–B32. 窗口管理和多窗口

**B29. 标题栏**

- **Windows**：自定义标题栏。`createMainWindow()` 中 `isWindows ? { frame: false } : {}`，渲染层 `WindowTitleBar.tsx` 提供拖拽区域 + 最小化/最大化(恢复)/关闭按钮。
  - 按钮有 `aria-label`（Minimize / Maximize / Restore / Close）✅
  - 双击标题栏切换最大化 ✅（`onDoubleClick={handleToggleMaximized}`）
  - 窗口状态通过 IPC `app:window:getstate` 同步 ✅
- **macOS**：使用系统原生标题栏（`frame` 默认 `true`），红绿灯按钮由系统提供。✅ 正确。
- **Linux**：与 macOS 相同，使用系统原生标题栏。

**B30. 最小尺寸限制**

- ✅ `minWidth: 1024`、`minHeight: 640`（`main/src/index.ts:108-109`）。
- 默认尺寸 `width: 1280`、`height: 800`。
- **问题**：1024×640 对于三栏布局（左侧栏 + 编辑区 + 右面板）是否足够？需实测。

**B31. 窗口状态持久化**

- **未实现**。`createMainWindow()` 使用固定 `width: 1280, height: 800`，无 `electron-window-state` 或手动 bounds 记忆。
- **问题**：每次启动都是 1280×800 居中显示，不记忆用户上次的窗口位置和大小。桌面应用基本体验缺失。

**B32. 多窗口支持**

- **不支持**。`main/src/index.ts` 中 `createMainWindow()` 仅在 `app.whenReady()` 时创建一个窗口。
- Electron 的 `app.requestSingleInstanceLock()` **未调用**——意味着用户可以启动多个实例，但它们共享同一个 SQLite 数据库，可能产生锁冲突。
- **问题**：应加 `requestSingleInstanceLock()` 防重复打开，或在第二实例启动时聚焦已有窗口。

---

### 🟡 B33–B37. Command Palette 深度

**B33. 命令清单**

`CommandPalette.tsx` 默认注册 **7 个命令**：

| ID | 命令 | 快捷键 | 分组 |
|----|------|--------|------|
| `open-settings` | Open Settings | mod+, | suggestions |
| `export` | Export… | — | suggestions |
| `toggle-sidebar` | Toggle Sidebar | mod+\\ | layout |
| `toggle-right-panel` | Toggle Right Panel | mod+L | layout |
| `toggle-zen-mode` | Toggle Zen Mode | F11 | layout |
| `create-new-document` | Create New Document | mod+N | document |
| `open-version-history` | Open Version History | — | document |
| `create-new-project` | Create New Project | mod+⇧N | project |

**极度稀薄**。对比 VS Code 的 200+ 命令和 Cursor 的 100+ 命令，这里只有 8 个。

**B34. 文件搜索**

- **有数据模型支持**（`category: "file"` 类型），但**默认命令列表中无任何文件项**。
- `filterCommands()` 在无搜索词时过滤掉 `category === "file"` 的项——说明文件搜索功能已预留但**未接入文件数据源**。
- **问题**：不支持 fuzzy find file by name。对标 VS Code Ctrl+P 的核心功能缺失。

**B35. 最近文件**

- **有数据模型支持**（`category: "recent"`），且 `filterCommands()` 在有搜索词时过滤掉 recent 项。
- 但**默认命令列表中无 recent 项**——未从 `fileStore` 或 `editorStore` 注入最近打开的文件。
- **问题**：功能预留但未实现。

**B36. 命令分组与排序**

- 分组由 `command.group` 字段决定，有 7 个预定义 group（suggestions/layout/document/project/command/file/recent）。
- 分组标题走 i18n（`GROUP_TRANSLATION_KEYS`）。
- 排序：**按分组出现顺序排列，组内按数组顺序排列**。无「最近使用」智能排序。
- 支持分页加载（`PAGE_SIZE = 100`，滚动到底加载更多）。

**B37. 搜索算法**

- **简单 `includes`**。`filterCommands()` 使用 `cmd.label.toLowerCase().includes(normalizedQuery)` 和 `cmd.subtext?.toLowerCase().includes(normalizedQuery)`。
- **未使用 fuzzy match**（无 fuse.js、no-fuzz 等）。
- 高亮：`highlightMatch()` 找第一个 `indexOf` 匹配位置加 `<span>` 高亮。
- **问题**：不支持拼音搜索、首字母缩写匹配（如输入 `tsp` 匹配 `Toggle Side Panel`）。

---

### 🟡 B38–B40. 响应式和窗口极端尺寸

**B38. 极窄编辑区**

- `EditorPane.tsx:964` 使用 `min-w-0`，允许被压缩到任意宽度。
- 左侧栏有 `Resizer`（可拖拽调整宽度），右面板同理。
- **问题**：无编辑区最小宽度保护。如果左右面板都展开到最大，编辑区可能被压缩到几十像素。需实测确认 `minWidth: 1024` 的窗口限制是否足够防止极端情况。

**B39. 水平滚动**

- 编辑区使用 `<ScrollArea>` 包裹，文本自然换行。代码块（`<pre>`）可能产生水平滚动。
- `EditorPane` 容器 `w-full min-w-0` + `flex-col`，不应出现水平滚动条。
- **需实测确认**。

**B40. Dialog 溢出**

- Dialog 基于 Radix UI `<Dialog>`，默认居中定位 + `max-h` 限制。
- CommandPalette 使用 `max-w-[90vw]` + `max-h-[424px]` 的 body，有视口保护。
- **SettingsDialog** 等需确认是否有 `max-h` 和 `overflow-auto`。

---

### 🟢 B41–B45. 细节体验

**B41. 文件树展开/折叠动画**

- **无动画**。`FileTreePanel.tsx` 通过 `expandedFolderIds` Set 控制子节点是否渲染——展开时直接 `visit(node.children)`，折叠时不渲染。即 `display: none` 硬切。
- 无 `transition: height` 或 `framer-motion` 包裹。

**B42. Tab 键导航与焦点陷阱**

- Dialog（`Dialog.tsx`）基于 Radix UI `<Dialog>`，**内置焦点陷阱**（Radix 默认行为）。Tab 键在 Dialog 内循环，不会跑到外面 ✅。
- CommandPalette 使用自定义 overlay + `onClick` 关闭，**无 Radix Dialog 包裹**，焦点陷阱靠 `inputRef.current?.focus()` 手动管理。Tab 键可能跑到 overlay 外的元素 ❌。
- 文件树 `role="tree" tabIndex={0}` 支持键盘导航（ArrowUp/Down/Left/Right/Enter/F2/Delete）✅。

**B43. 空状态一致性**

- `EmptyState` 组件存在（`components/patterns/EmptyState.tsx`）。
- **文件树空状态**：`FileTreePanel.tsx:781-793` 自行实现（`Text` + `Button`），未使用 `EmptyState` ❌。
- **CommandPalette 空结果**：`SearchIcon` + `Text` 自行实现 ❌。
- **AI 面板空状态**：自行实现 ❌。
- **问题**：各面板空状态样式不统一，`EmptyState` Composite 基本无人使用。

**B44. Toast 通知位置和堆叠**

- `Toast.tsx` 基于 Radix UI `@radix-ui/react-toast`。
- **位置**：右下角（`bottom-4 right-4`）✅。
- **堆叠**：`ToastViewport` 使用 `flex flex-col gap-2`，多个 Toast **垂直堆叠显示** ✅。
- **动画**：slide-in-from-right + fade-in，swipe-to-dismiss 支持 ✅。
- **z-index**：`z-[var(--z-toast)]` (500) ✅。
- **问题**：`useToast` hook 是简化实现（单 Toast 状态），**不支持同时显示多个 Toast**。需要 context-based queue 或 Sonner 等方案。但 Primitive 层的 `ToastViewport` 支持堆叠，只是应用层未充分利用。

**B45. 编辑器工具栏**

- ✅ **已有完整格式工具栏**（`EditorToolbar.tsx`，517 行）。
- 按钮分 5 组（分隔符隔开）：
  1. 文本格式：Bold / Italic / Underline / Strikethrough / Code（5 个）
  2. 标题：H1 / H2 / H3（3 个）
  3. 列表：Bullet / Ordered（2 个）
  4. 块：Blockquote / CodeBlock / HR（3 个）
  5. 历史：Undo / Redo（2 个）
- 共 **15 个按钮**，每个都有快捷键 tooltip、active 状态高亮、disabled 状态控制。
- **Responsive 行为**：**无溢出处理**。工具栏使用 `flex items-center gap-0.5`，窄窗口时按钮会被截断或溢出隐藏（由 `overflow: hidden` 决定），**无 "更多" 折叠菜单**。
- **问题**：15 个按钮 + 4 个分隔符在窄屏（<800px 编辑区宽度）时必然溢出。需要添加 overflow menu 或自适应隐藏。

---

### 审计总结：按严重度分类

**🔴 必须修复（影响核心体验）**

| # | 发现 | 当前状态 | 修复方向 |
|---|------|----------|----------|
| B1 | 光标/选区未走 Token | 浏览器默认 | 新增 `--color-selection` / `--color-caret` Token |
| B4 | Inline Diff 脱离编辑器 | 独立面板渲染 | 完成 TipTap decoration 集成 |
| B9 | 快捷键注册分散 | 4+ 处 `addEventListener` | 统一 HotkeyManager |
| B10 | 无快捷键参考面板 | 不存在 | 新建 Shortcuts Panel |
| B12 | 编辑区无右键菜单 | 浏览器默认 | 自定义 ContextMenu |
| B18 | Tooltip 混用 | 47 文件用 `title`，2 文件用 Radix | 统一迁移到 Radix Tooltip |

**🟡 建议修复（影响体验完整度）**

| # | 发现 | 当前状态 | 修复方向 |
|---|------|----------|----------|
| B2 | 缺少段间距/字间距 Token | ProseMirror 默认 | 新增 `--text-editor-paragraph-spacing` |
| B16 | 编辑区无 block drag handle | 不支持 | TipTap drag handle 插件 |
| B22 | AI stream 非原子撤销 | 多次 Ctrl+Z | `setMeta("addToHistory", false)` |
| B26 | 主题切换闪烁 | 无过渡 | `<html>` 加 transition |
| B31 | 窗口位置不持久化 | 每次 1280×800 | electron-window-state 或手动记忆 |
| B32 | 无 single instance lock | 可重复启动 | `requestSingleInstanceLock()` |
| B34 | CommandPalette 无文件搜索 | 预留未实现 | 接入 fileStore |
| B37 | 搜索无 fuzzy match | `includes` | 引入 fuse.js |
| B45 | 工具栏无溢出处理 | 截断 | overflow menu |

**🟢 已实现良好**

| # | 发现 |
|---|------|
| B6 | Bubble Menu：6 格式 + 4 AI 操作，Token 样式，placement 自适应 |
| B11 | 跨平台快捷键映射完整 |
| B13 | 文件树右键菜单使用 Radix Primitive |
| B15 | 文件树拖拽排序+移入文件夹 |
| B20 | z-index Token 体系完整 |
| B21 | Undo/Redo 功能正常 |
| B23–B24 | 自动保存四态反馈 + 错误重试 |
| B28 | 主题三态切换完整 |
| B29 | Windows 自定义标题栏正确 |
| B42 | Dialog 焦点陷阱（Radix）正常 |
| B44 | Toast 右下角堆叠，走 Token |
