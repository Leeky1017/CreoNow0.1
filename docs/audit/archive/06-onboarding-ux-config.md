# 06 — Onboarding、UX 与配置流程

> 对应问题：P2-12（Onboarding 无实质引导）、P2-13（WelcomeScreen 冷启动）、P2-14（AI 面板缺智能交互）、P2-15（无 AI 配置界面）

---

## 一、CN 当前状态

### 1.1 Onboarding 只是一张静态页

**文件**：`apps/desktop/renderer/src/features/onboarding/OnboardingPage.tsx`

当前流程：
```
启动应用
  → 检查 localStorage 中 onboarding.completed
    → false → 显示 OnboardingPage（4 张特性卡片 + "开始使用"按钮）
    → true  → 显示 AppShell
```

OnboardingPage 内容：
- Logo + "欢迎使用 CreoNow"
- 4 张特性卡片（AI 辅助写作、角色管理、知识图谱、版本历史）
- "开始使用" 按钮

**缺失**：
- 无 API Key 配置步骤——用户进入后 AI 功能必然不可用
- 无项目创建引导——点击后到 WelcomeScreen，仍需自行操作
- 无交互式教程——不知道怎么使用各功能
- 无示例项目——空白状态，无参考

### 1.2 WelcomeScreen 极简

**文件**：`apps/desktop/renderer/src/features/welcome/WelcomeScreen.tsx`

只有：
- "Welcome to CreoNow" 标题
- "Create a local project to start." 说明
- 一个 "Create project" 按钮

**缺失**：
- 无最近项目列表
- 无项目模板（小说、剧本、论文、日记等）
- 无快速开始引导
- 与 Onboarding 语言不一致（英文 vs 中文）

### 1.3 AI 面板无智能交互

**文件**：`apps/desktop/renderer/src/features/ai/AiPanel.tsx`

- 纯输入框 + 输出区，无对话视图
- 技能需手动选择，无自动推断
- 无建议 prompt / 快速操作卡片
- 无新用户引导提示（如"试试输入…"）
- 无空状态设计

### 1.4 无 AI 配置界面

后端有 provider 配置逻辑（OpenAI / Anthropic），但前端：
- 无设置页面或设置面板
- 无 API Key 输入界面
- 无模型选择 UI
- 无用量统计展示

用户完全无法配置 AI 提供商，意味着 AI 功能从安装到首次使用之间存在一个**不可跨越的断层**。

---

## 二、业界如何解决

### 2.1 Cursor — 首次启动引导

Cursor 的首次使用流程：

```
1. 安装后首次启动
   → 登录/注册 Cursor 账号
   → 自动获取 API 额度（免费版有限额）

2. 首次打开项目
   → 自动索引代码库（显示进度条）
   → 底部状态栏显示"Indexing... X/Y files"

3. 首次使用 AI
   → Cmd+K 调出 inline edit（光标处弹出输入框）
   → Cmd+L 打开 Chat panel
   → Tab 触发 autocomplete
   → 每个入口都有 placeholder 文本引导
```

**关键设计**：
- **零配置开始**：注册账号即获得免费额度，不需要自带 API Key
- **自动索引**：打开项目后自动开始，不需要用户手动触发
- **多入口引导**：每个 AI 功能入口都有 placeholder 提示

### 2.2 Notion AI — 上下文化的空状态

Notion 的 AI 功能引导：

- 新建页面时：输入区域显示 "Press '/' for commands, 'Space' for AI..."
- 选中文本时：浮动菜单自动出现 "Ask AI" 选项
- AI 面板：预设常用操作卡片（Summarize / Translate / Explain / Continue writing）
- 首次使用：简短的 tooltip 教程，不打断工作流

### 2.3 Sudowrite — 写作专用 Onboarding

Sudowrite 的引导流程：

```
1. 注册后进入 Dashboard
   → 显示 "Start your first story" 引导卡
   → 提供模板选择（Short Story / Novel / Screenplay）

2. 创建故事后
   → 左侧自动打开 Story Bible 面板
   → 引导用户填写：Genre / Tone / POV / Main Characters

3. 首次使用 AI 功能
   → 编辑器右侧显示工具面板
   → 每个工具（Write / Describe / Brainstorm）有 tooltip 说明
   → "Write" 按钮旁显示 "Click to generate your first paragraph"
```

**关键设计**：
- **渐进式引导**：不是一次性展示所有功能，而是在用户到达每个节点时才引导
- **模板驱动**：新用户不是面对空白页，而是有结构化的起点
- **上下文帮助**：每个功能旁边都有说明，不需要单独的教程页

### 2.4 VS Code — 设置同步 + 首次配置向导

VS Code 的扩展配置模式：

```
1. 安装 GitHub Copilot 扩展
   → 自动弹出 "Sign in to GitHub" 通知
   → 一键登录

2. 无 API Key 时
   → 功能入口显示 "Sign in to use Copilot"
   → 状态栏图标显示灰色 + 感叹号

3. 配置完成后
   → 功能入口变为可用
   → 首次触发时显示 Getting Started 页面
```

---

## 三、CN 应该怎么做

### 3.1 重构 Onboarding 为多步引导

```
步骤 1: 欢迎页（保留现有设计，稍作优化）
  "欢迎使用 CreoNow — AI 驱动的文字创作 IDE"
  [继续 →]

步骤 2: AI 配置（关键新增）
  "配置 AI 引擎"
  选择提供商：[OpenAI] [Anthropic] [本地模型]
  输入 API Key: [________________]
  [测试连接] → 成功/失败反馈
  [跳过，稍后配置 →]

步骤 3: 创建首个项目
  "创建你的第一个写作项目"
  项目名称: [________________]
  项目类型: [小说] [剧本] [散文] [论文] [自由写作]
  [创建项目 →]

步骤 4: 快速教程（可选）
  "3 个核心功能快速体验"
  1. 在编辑器中输入几句话 → 体验 AI 续写
  2. 选中文本 → 体验 AI 润色
  3. 打开 AI 面板 → 体验自由对话
  [开始写作 →] [跳过教程 →]
```

### 3.2 项目模板系统

```typescript
type ProjectTemplate = {
  id: string;
  name: string;
  description: string;
  genre?: string;
  defaultDocuments: Array<{
    title: string;
    type: "chapter" | "note" | "character" | "worldbuild";
    initialContent?: string;
  }>;
  defaultKgEntities?: Array<{
    name: string;
    type: KnowledgeEntityType;
    description: string;
  }>;
};

const TEMPLATES: ProjectTemplate[] = [
  {
    id: "novel-fantasy",
    name: "奇幻小说",
    description: "包含世界观设定、角色模板、章节结构",
    genre: "fantasy",
    defaultDocuments: [
      { title: "第一章", type: "chapter" },
      { title: "世界观设定", type: "worldbuild", initialContent: "## 世界背景\n\n## 魔法体系\n\n## 种族与势力\n" },
      { title: "主要角色", type: "character", initialContent: "## 主角\n姓名：\n年龄：\n外貌：\n性格：\n背景：\n" },
    ],
  },
  {
    id: "novel-mystery",
    name: "悬疑推理",
    description: "包含案件线索、嫌疑人、时间线模板",
    genre: "mystery",
    // ...
  },
  {
    id: "screenplay",
    name: "剧本",
    description: "包含场景列表、角色表、对白格式",
    // ...
  },
  {
    id: "blank",
    name: "空白项目",
    description: "从零开始，自由创作",
    defaultDocuments: [{ title: "未命名文档", type: "chapter" }],
  },
];
```

### 3.3 AI 面板空状态设计

当 AI 面板没有对话历史时，显示引导卡片：

```
┌──────────────────────────────────┐
│  ✨ 试试这些                      │
│                                  │
│  [帮我想一个故事开头]             │
│  [润色选中的段落]                 │
│  [为这个角色设计背景故事]         │
│  [分析文本的节奏和结构]           │
│                                  │
│  💡 选中编辑器中的文本后，        │
│     可以直接点击浮动菜单的 AI 按钮 │
└──────────────────────────────────┘
```

### 3.4 AI 设置面板

```
┌─ AI 设置 ────────────────────────┐
│                                  │
│  提供商                          │
│  ○ OpenAI    ○ Anthropic         │
│  ○ 本地模型   ○ 自定义           │
│                                  │
│  API Key                         │
│  [sk-***************************]│
│  [测试连接 ✓]                    │
│                                  │
│  模型                            │
│  对话: [gpt-4o      ▼]           │
│  续写: [gpt-4o-mini ▼]           │
│  Embedding: [bge-small-zh ▼]     │
│                                  │
│  行为                            │
│  记忆注入: [✓ 启用]              │
│  偏好学习: [✓ 启用]              │
│  隐私模式: [  关闭]              │
│                                  │
│  用量统计                        │
│  本月: 12,345 tokens / $0.12     │
│  本日: 2,100 tokens / $0.02      │
│                                  │
└──────────────────────────────────┘
```

### 3.5 无 API Key 时的降级体验

参考 VS Code Copilot 的模式：

```
AI 面板输入框 → disabled
  placeholder: "请先在设置中配置 AI 提供商"
  [打开设置 →] 按钮

Bubble Menu AI 按钮 → disabled + tooltip
  "AI 功能需要配置 API Key"

Inline suggestion → 不触发

状态栏 → 显示 "AI: 未配置" 图标
  点击跳转设置
```

确保用户在任何遇到 AI 功能的地方都能被引导到配置页面，而不是看到神秘的错误。

---

## 四、实施优先级

| 步骤 | 内容 | 工作量 | 前置依赖 |
|------|------|--------|---------|
| 1 | AI 设置面板（API Key / 模型 / 提供商） | 2d | 后端 provider 配置已有 |
| 2 | 无 API Key 降级体验（禁用 + 引导） | 1d | 步骤 1 |
| 3 | Onboarding 增加 AI 配置步骤 | 1.5d | 步骤 1 |
| 4 | AI 面板空状态设计 + 建议 prompt | 1d | 无 |
| 5 | 项目模板系统 | 2d | 无 |
| 6 | WelcomeScreen 改造（最近项目 + 模板） | 1.5d | 步骤 5 |
| 7 | 语言统一（全部中文或全部中英） | 0.5d | 无 |
| 8 | 交互式快速教程 | 2d | 步骤 1-4 完成后 |

**总计约 11.5 天**。步骤 1-2 最紧急——没有 API Key 配置入口，AI 功能完全不可用。
