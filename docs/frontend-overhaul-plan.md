# CN 前端整改方案
更新时间：2026-02-28 11:58

> 日期：2026-02-28
> 触发：Owner 打包版实测反馈四项问题
> 状态：待确认

---

## 一、问题总览

| # | 问题 | 严重度 | 类型 | 涉及文件 |
|---|------|--------|------|----------|
| 1 | 初始打开无引导/预设置/打开项目入口 | P0 | 功能缺失 | `OnboardingPage`, `WelcomeScreen`, `AppShell` |
| 2 | AI 功能报错 | P0 | 链路故障 | `AiPanel`, `AiSettingsSection`, `aiStore`, 主进程 AI Service |
| 3 | 左侧边栏拖动僵硬 | P1 | Bug | `Sidebar.tsx` |
| 4 | 前端设计逻辑混乱（多项子问题） | P1 | 设计债 | 多处 |

---

## 二、逐项分析与修复方案

### 2.1 初始打开体验（P0）

**现状诊断**：

- `OnboardingPage` 只是功能卡片展示 + "开始使用"按钮，无实质引导
- 点击后进入 `AppShell`，无项目时展示 `WelcomeScreen`
- `WelcomeScreen` 只有 "Create project" 按钮
- **无"打开已有文件夹"入口**（IPC 层也无 `showOpenDialog` 通道）
- **无 API Key 首次配置引导**（配置藏在 Settings → Proxy tab）
- **无最近项目列表**

**修复方案**：

#### A. 重做 Onboarding 流程（多步向导）

当前单页展示改为 3 步向导：

| 步骤 | 内容 | 完成标志 |
|------|------|----------|
| Step 1: 欢迎 | 品牌展示 + 语言/主题偏好选择 | 用户点击"下一步" |
| Step 2: AI 配置 | 内嵌 `AiSettingsSection` 核心字段（Provider / Base URL / API Key / 测试连接） | 配置保存成功或用户跳过 |
| Step 3: 开始创作 | "创建新项目" / "打开已有文件夹" 两个入口 | 项目创建或文件夹选择完成 |

涉及改动：
- `OnboardingPage.tsx` — 改为多步向导组件
- `onboardingStore.tsx` — 增加 `currentStep` 状态
- 新增 IPC 通道：`dialog:open-folder`（调用 Electron `dialog.showOpenDialog`）
- 主进程注册 `dialog:open-folder` handler

#### B. 重做 WelcomeScreen

从简陋卡片改为完整的项目入口页面：

- **最近项目列表**（复用 `DashboardPage` 的 `ProjectCard`）
- **"新建项目"按钮**（已有）
- **"打开文件夹"按钮**（新增，依赖 `dialog:open-folder` IPC）
- **模板快速入口**（复用 `CreateProjectDialog` 的模板选择）

#### C. 新增 "打开文件夹" 全链路

| 层 | 改动 |
|----|------|
| IPC contract | 新增 `dialog:open-folder` 通道 |
| 主进程 | 注册 handler，调用 `dialog.showOpenDialog({ properties: ['openDirectory'] })` |
| Preload | 暴露通道 |
| 渲染层 | WelcomeScreen / Onboarding / CommandPalette 调用 |

---

### 2.2 AI 功能报错（P0）

**现状诊断**：

报错链路可能出在以下任一环节：

```
AiPanel.refreshModels() → IPC "ai:models:list" → 主进程 → DB/Provider
AiPanel.refreshSkills() → IPC "skill:registry:list" → 主进程 → DB
aiStore.run() → IPC "ai:skill:run" → 主进程 → LLM API
```

已知问题点：
1. **API Key 未配置**：`IpcErrorCode` 包含 `AI_NOT_CONFIGURED`，首次使用必触发
2. **DB 初始化**：打包版 SQLite native binding 路径可能错误（`DB_ERROR`）
3. **模型列表为空**：`refreshModels` 返回空数组后 `selectedModel` 不匹配

**修复方案**：

#### A. AI 未配置的友好引导

当 `ai:models:list` 或 `ai:skill:run` 返回 `AI_NOT_CONFIGURED` 时：
- AiPanel 不显示通用错误卡片
- 改为显示专用的 **"配置 AI"引导卡片**，含一键跳转 Settings → AI 配置

改动文件：
- `AiPanel.tsx` — 增加 `AI_NOT_CONFIGURED` 专用 UI 分支
- 复用 `openSettings` context，直接跳转到 AI 配置 tab

#### B. DB 初始化错误兜底

当 `DB_ERROR` 出现时：
- 错误卡片已有 `formatDbErrorDescription` 支持修复命令提示
- 需要确认打包后 `better-sqlite3` native binding 路径正确
- 主进程需增加 DB 健康检查 + 启动时自动修复逻辑

#### C. 需要 Owner 提供的信息

**需要 Console 报错截图或文字**，才能定位具体是 A/B/C 中的哪个。

---

### 2.3 左侧边栏拖动僵硬（P1 - Bug）

**根因**：

`Sidebar.tsx` 对 `width` 属性施加了 `transition: width 300ms var(--ease-default)` CSS 过渡。
拖动时 `Resizer` 每帧更新宽度值，但 CSS 过渡使视觉效果始终滞后于鼠标位置 300ms。

`RightPanel.tsx` 无此 transition，因此丝滑。

**修复方案（二选一）**：

#### 方案 A：去掉 Sidebar 的 width transition（推荐）

Sidebar 的 width transition 原意是让 collapse/expand 有动画。但：
- collapse 时 Sidebar 直接 `hidden w-0`，transition 对 `display:none` 无效
- expand 时从 `hidden` 切到具体宽度，transition 同样无效

结论：**这个 transition 从未生效过其设计意图，纯粹是拖动时的副作用**。直接移除。

改动：
- `Sidebar.tsx` — 删除 `readPrefersReducedMotion` / `resolveReducedMotionDuration` / `widthTransition` 相关代码
- 删除 `style={{ transition: widthTransition }}` 

#### 方案 B：拖动时动态禁用 transition

如果未来需要 sidebar 的 collapse/expand 动画：
- `PanelOrchestrator` 传递 `isDragging` 状态给 `Sidebar`
- `Sidebar` 仅在 `isDragging=false` 时启用 transition

**推荐方案 A**，因为当前 transition 从未正确服务于 collapse/expand。

---

### 2.4 前端设计逻辑混乱（P1 - 设计债）

排查发现以下子问题：

#### 2.4.1 Settings 导航命名不匹配

`SettingsDialog.tsx` 中：
```
{ value: "proxy", label: "Proxy" }
```
但渲染的是 `<AiSettingsSection />`（AI 配置）。

**修复**：将 tab value 改为 `"ai"`，label 改为 `"AI"`。同步更新 `SettingsTab` 类型和测试。

#### 2.4.2 国际化不统一

| 位置 | 语言 | 示例 |
|------|------|------|
| OnboardingPage | 中文 | "欢迎使用 CreoNow" |
| WelcomeScreen | 英文 | "Welcome to CreoNow" |
| Sidebar 面板标题 | 英文 | "Explorer", "Search" |
| DashboardPage | 混合 | "Continue Writing" + "大纲" + "未找到匹配结果" |
| AiSettingsSection | 混合 | "AI 配置" + "Provider" + "保存" + "测试连接" |
| SettingsGeneral | 英文 | "Writing Experience" |

**修复方案**：
- 统一使用 i18n（已有 `react-i18next` 基础设施）
- 默认语言中文，所有硬编码字符串改为 `t()` 调用
- 这是大规模改动，建议作为独立 Issue 跟进

#### 2.4.3 DashboardPage 与 WelcomeScreen 职责重叠

当前路由逻辑（`AppShell.renderMainContent`）：
```
项目数 = 0 且 bootstrapStatus = ready → WelcomeScreen
项目数 > 0 且无 currentProject → DashboardPage
有 currentProject → EditorPane
```

WelcomeScreen 过于简陋（一个卡片一个按钮），而 DashboardPage 的空状态已经有更好的 empty state UI。

**修复方案**：
- 合并 WelcomeScreen 到 DashboardPage 的 empty state
- DashboardPage 空状态增加"打开文件夹"入口
- 删除独立的 WelcomeScreen 组件

#### 2.4.4 Settings Proxy tab 实际是 AI 设置但旁边还有独立 ProxySection

`features/settings/` 下同时存在：
- `AiSettingsSection.tsx`（6.8KB）— 被 Settings "Proxy" tab 渲染
- `ProxySection.tsx`（12KB）— 存在但未被 SettingsDialog 引用

**修复方案**：
- 确认 ProxySection 的功能是否仍需保留
- 如需保留，Settings 增加独立 "Proxy" tab，"AI" tab 渲染 AiSettingsSection
- 如已废弃，删除 ProxySection

---

## 三、执行优先级

| 序号 | 任务 | 预估工时 | 依赖 |
|------|------|----------|------|
| ① | 修复 Sidebar 拖动 Bug (#2.3) | 30 min | 无 |
| ② | Settings tab 命名修复 (#2.4.1) | 30 min | 无 |
| ③ | AI 未配置引导卡片 (#2.2.A) | 2h | 无 |
| ④ | WelcomeScreen 合并到 Dashboard (#2.4.3) | 3h | 无 |
| ⑤ | 新增 dialog:open-folder IPC (#2.1.C) | 3h | 无 |
| ⑥ | 重做 Onboarding 向导 (#2.1.A) | 6h | ⑤ |
| ⑦ | ProxySection 清理 (#2.4.4) | 1h | ② |
| ⑧ | 国际化统一 (#2.4.2) | 8h+ | 独立 Issue |
| ⑨ | AI DB/打包问题排查 (#2.2.B) | 待定 | 需 Console 日志 |

---

## 四、Owner 待确认项

1. **AI 报错的具体信息**（Console 截图），以便定位 #2.2 的具体故障点
2. **ProxySection 是否保留**（12KB 代码目前未被引用）
3. **国际化策略**：是否全面中文化？还是保留英文 UI + 中文内容？
4. **Onboarding 多步向导的设计稿**：是否有 design/ 下的参考？还是我按 spec 自行设计？
5. **"打开文件夹"的行为定义**：打开后是创建新项目还是直接导入文件？
