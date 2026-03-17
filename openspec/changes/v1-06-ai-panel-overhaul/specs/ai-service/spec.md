# Delta Spec: ai-service — AI 面板结构重组与视觉对齐

- **Parent Change**: `v1-06-ai-panel-overhaul`
- **Base Spec**: `openspec/specs/ai-service/spec.md`
- **GitHub Issue**: 待创建

---

## 变更摘要

AI 面板从单一视图改为 Chat / History 双标签页导航结构，AI 消息增加 accent 左边框视觉标识，空状态从纯文本提升为图标引导式体验，流式输出增加打字机动效。面板内组件从 AiPanel.tsx 巨石结构（2,100 行）拆分为 7 个子组件（各 ≤500 行）。

---

## 变更的 Requirement: AI 面板交互

Base Spec 中的 Requirement "AI 面板交互" 做以下变更：

### 删除的行为

无。本次变更为增量扩展和视觉升级，不删除现有行为。

### 新增的行为

#### Chat / History 标签页导航

- AI 面板**必须**在顶部渲染 Chat / History 双标签页切换 UI
- 使用 Tabs primitive 底线指示器（`variant="underline"`），active tab 底部显示 2px `--color-accent` 线条
- 点击 History tab **必须**切换到对话历史列表视图
- 点击 Chat tab **必须**切换回当前对话视图
- 默认 active tab 为 Chat

#### AI 消息 accent 视觉标识

- AI 回复消息容器**必须**有左侧 2px 边框，使用 `--color-accent` token
- 用户消息**不得**有左侧 accent 边框——仅 AI 消息有此视觉标识
- 目的：使 AI 回复在对话流中具有可辨识的视觉差异化

#### 空状态视觉升级

- AI 面板空态（新会话、无对话历史）**必须**展示 48px sunburst 图标 + 居中引导文案
- 图标**应当**有 CSS 旋转动画
- 容器**应当**有 opacity 0→1 渐入动画（`--duration-normal` + `--ease-default`）
- 替代 Base Spec 中的纯文本欢迎文案

#### 代码块 Monospace 字体

- AI 回复中的代码块（`<code>` / `<pre>`）**必须**使用 `font-family: var(--font-mono)`
- 确保 JetBrains Mono 或等宽字体回退栈生效

#### 流式输出动效

- AI 流式响应**必须**以打字机效果逐字渲染（使用 `requestAnimationFrame` 或 CSS animation）
- 流式输出末尾**必须**展示脉冲光标动画（`@keyframes blink`，配合 `--duration-normal`）
- 对齐设计稿 `32-ai-streaming-states.html`

#### 错误提示等级化

- ErrorGuideCard 组件**必须**支持 `severity` prop：`'error' | 'warning' | 'info'`
- 左边框颜色映射：
  - `error` → `var(--color-danger)`（红色）
  - `warning` → `var(--color-warning)`（黄色）
  - `info` → `var(--color-info)`（蓝色）

#### 选择器交互增强

- Model / Mode / Skill 选择器**必须**显示 chevron icon（ChevronDown）
- hover 态**必须**有背景色反馈（`--color-bg-hover`）
- 点击展开时 chevron **应当**旋转 180°（`--duration-fast` transition）

#### 使用量统计布局

- Token count 和 cost **必须**分行展示（不在同一行）
- **应当**包含小字注释说明（如「本轮对话消耗」）

### 保持不变的行为

以下行为保持 Base Spec 定义，不做修改：

- AI 面板位于右侧面板（Workbench spec 定义）
- 对话记录数据结构（role / content / skillId / timestamp / traceId）
- IPC 通道（ai:chat:list / ai:chat:send / ai:chat:clear）
- 面板背景色 `--color-bg-surface`
- 用户消息气泡 `--color-bg-raised`，AI 消息 `--color-bg-base`
- 操作按钮（应用到编辑器 / 复制 / 重新生成）
- 技能按钮区
- 输入区文本输入功能
