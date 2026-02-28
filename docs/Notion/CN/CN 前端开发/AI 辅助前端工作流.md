# AI 辅助前端工作流

> Source: Notion local DB page `e772edba-80fb-4dc6-ad34-311b45fd97bc`

> ⚡

核心心法：你做设计决策，AI 做实现。 永远不要让 AI "自由发挥设计"。给它约束（Token + 参考 + 你的判断），让它在约束内高效执行。

## 分工模型

| 你做的事 | AI 做的事 |
| --- | --- |
| 定 Design Token Spec | 生成 CSS variables / Tailwind config |
| 截图 + 标注问题 | 批量重构组件以符合 Token |
| 画粗略线框或描述布局 | 生成完整组件代码 |
| 定义动画编排表 | 实现所有 transition / animation |
| 指出"这里感觉不对" | 提供 3 个改进方案供你选择 |
| 找到一个参考（如 Notion） | 逆向分析并为 CN 适配 |

---

## 工作流程

### Step 1：约束先行

在让 AI 写任何一行代码之前，先准备好约束文档：

必须给 AI 的上下文：

- tokens.css 完整内容（让 AI 知道可用的变量）

- 目标组件的 Primitive 接口定义（让 AI 知道能用什么组件）

- 标杆产品的截图（让 AI 知道视觉目标）

- 当前代码的问题截图 + 你的标注（让 AI 知道哪里不对）

禁止让 AI 做的事：

- ❌ "帮我设计一个好看的侧边栏" — 太模糊，AI 会随意发挥

- ❌ "用你觉得合适的颜色" — AI 没有审美判断力

- ❌ "自由选择字号和间距" — 会破坏 Token 系统

正确的指令方式：

- ✅ "按照 tokens.css 中的变量，将 SearchPanel 的所有硬编码颜色替换为语义 Token"

- ✅ "参考 Notion 侧边栏的间距，用 --space-2 和 --space-4 重写 Sidebar 的 padding"

- ✅ "将 DiffHeader 的 shadow-[0_18px_48px_rgba(0,0,0,0.45)] 替换为 var(--shadow-xl)"

---

### Step 2：批量操作

AI 最大的优势是批量一致性操作。以下任务适合让 AI 一次性完成：

Token 清扫（Phase 1 核心任务）：

```
输入：
- tokens.css（可用变量清单）
- 24 个违规文件列表
- 违规模式 → 替换规则映射表

指令：
"逐个打开以下文件，将所有硬编码颜色替换为 tokens.css 中对应的语义变量。
替换规则：
- text-blue-400 → text-[var(--color-accent)]
- text-red-400 → text-[var(--color-error)]
- z-10/z-20/z-30/z-50 → z-[var(--z-{对应层级})]
- shadow-[...] → shadow-[var(--shadow-{对应级别})]
每个文件替换后，列出改动清单供我确认。"
```

原生元素替换：

```
输入：
- Primitives 组件的 API 文档（Button props、Input props 等）

指令：
"在以下文件中，找到所有直接使用 <button> 和 <input> 的地方，
替换为项目的 <Button> 和 <Input> Primitive 组件。
保留原有的 onClick/onChange 逻辑，样式从行内类名迁移到 Primitive 的 variant/size props。"
```

---

### Step 3：逐组件打磨

批量清扫完成后，逐个组件精细打磨：

对每个核心组件的 AI 指令模板：

```
"我要优化 [组件名] 的视觉和交互质量。

当前代码：[粘贴代码]
当前效果截图：[附图]
目标效果参考：[附 Notion/Cursor 截图]

请按以下要求改造：
1. 所有间距使用 tokens.css 中的 --space-* 变量
2. 所有颜色使用 --color-* 语义变量
3. hover 状态使用 transition-colors duration-[var(--duration-fast)]
4. focus-visible 使用 outline-[var(--color-ring-focus)]
5. 弹出动画使用 scale(0.98→1) + opacity(0→1)，duration 200ms，ease-out

输出改造后的完整代码。"
```

---

### Step 4：视觉走查

改造完成后，用 AI 辅助做视觉走查：

录屏走查法：

1. 录制自己使用 CN 的全流程（5-10 分钟）

1. 回看录屏，在每一次"皱眉"的地方截图

1. 将截图分类（间距问题 / 颜色问题 / 动画问题 / 状态缺失）

1. 每一类交给 AI 批量修复

截图对比法：

1. CN 截图 vs Notion 截图，同一类界面并排放

1. 让 AI 分析差异："对比这两张截图，列出 CN 与 Notion 在间距、字号、颜色、阴影上的具体差异"

1. 根据 AI 的分析结果决定哪些差异需要修复

---

## 效率倍增器

### 1. Storybook 驱动开发

为每个 Primitive 建立 Storybook Story，让 AI 在隔离环境中调试组件，而不是在整个应用中调试。

### 2. ESLint 规则自动化

让 AI 帮你写 ESLint 自定义规则，自动禁止：

- 使用 raw Tailwind colors（text-blue-*）

- 硬编码 z-index 数字

- transition-all

- h-screen / w-screen 在非 Shell 组件中出现

这样未来的代码就不会再"漂移"回去。

### 3. AI Code Review

每次提交前，让 AI 检查：

- 是否引入了新的硬编码值？

- 是否使用了 Primitives 还是散写了原生元素？

- 动画是否引用了 Token？

- 是否有不必要的 Store 订阅？

---

## 多 Agent 协作模型

> 🤖

单 Agent 模式的瓶颈： 上面的工作流假设你只用一个 AI。但 CN 已经是多 Agent 架构（Cursor + Claude + Gemini + 本地 Agent），需要明确分工协议，否则 Agent 之间会互相覆盖、风格不一致、产生“设计漂移”。

### Agent 角色与专业化

| Agent 角色 | 典型工具 | 擅长 | 指派任务 | 禁止任务 |
| --- | --- | --- | --- | --- |
| 🛠️ Builder | Cursor / Windsurf | 大范围代码生成、多文件重构 | Token 清扫、组件替换、AppShell 拆分 | 设计决策、新增 Token 变量 |
| 🧠 Thinker | Claude / GPT | 架构分析、方案设计、文档撰写 | 设计方案对比、代码审计、知识库维护 | 直接修改生产代码 |
| 🔍 Auditor | Gemini（长上下文） | 全库扫描、模式识别、回归检测 | 审计报告、违规检测、一致性检查 | 代码修改（只报告，不动手） |
| 🎨 Stylist | Claude / 专项 Prompt | 视觉微调、动画参数、设计细节 | 单组件视觉打磨、动画曲线调参 | 架构变更、多文件重构 |

### 协作协议

原则：单一真相源 + 明确交接点

```
graph LR
    A["👁️ 你（最终裁判）"] --> B["约束文档"]
    B --> C["🛠️ Builder"]
    B --> D["🎨 Stylist"]
    B --> E["🔍 Auditor"]
    B --> F["🧠 Thinker"]
    C -->|"PR / diff"| A
    D -->|"PR / diff"| A
    E -->|"审计报告"| A
    F -->|"方案文档"| A
```

协作规则：

1. 约束文档是唯一真相源

  - 所有 Agent 必须接收同一份约束文档（tokens.css + 设计规范 + 组件 API）

  - 任何 Agent 不得“发明”新 Token 或新组件——只有你可以扩展约束文档

1. 串行决策，并行执行

  - 架构决策（Thinker）必须在代码生成（Builder）之前完成

  - 同一决策确定后，多个文件的 Builder 任务可并行

  - Auditor 始终在 Builder 完成之后运行

1. 不跨界

  - Builder 不做设计决策（遇到模糊地带停下问你）

  - Thinker 不直接改代码（只输出方案文档）

  - Auditor 只报告不修复（避免“运动员兼裁判”）

### 典型协作流程示例

场景：AppShell 拆分

| 步骤 | Agent | 输入 | 输出 |
| --- | --- | --- | --- |
| 1. 审计现状 | 🔍 Auditor | AppShell.tsx 全文 + 所有 import 文件 | 职责清单、耦合点、风险分析 |
| 2. 设计方案 | 🧠 Thinker | 审计报告 + 你的约束（三组件架构） | LayoutShell / NavController / PanelOrchestrator 接口定义 |
| 3. 你审批 | 👁️ 你 | 方案文档 | ✅ / ❌ / 修改意见 |
| 4. 代码实现 | 🛠️ Builder | 批准的接口定义 + tokens.css + 组件 API | 3 个新文件 + AppShell 的 diff |
| 5. 视觉微调 | 🎨 Stylist | 拆分后的截图 + 动画编排表 | 过渡动画、间距微调 |
| 6. 回归检查 | 🔍 Auditor | 改造前后的完整代码 | ✅ 一致性确认 / ❌ 新问题清单 |

### Agent 冲突解决

当多个 Agent 给出矛盾建议时：

1. 谁说了算？ → 永远是你。Agent 只提供信息，不做决策

1. 如何判断？ → 回到约束文档。符合 Token / 规范 / 性能目标的方案胜出

1. 无法判断？ → 让两个 Agent 分别实现，用 Storybook 并排对比，你看哪个好

### 上下文模板（Agent Briefing）

每次启动一个 Agent 任务时，用以下模板提供上下文：

```
## Agent Briefing

**你的角色：** [Builder / Thinker / Auditor / Stylist]
**任务：** [一句话描述]

### 约束文档
- tokens.css：[附件/链接]
- 组件 API：[附件/链接]
- 动画编排表：[附件/链接]

### 输入
- 目标文件：[...]
- 参考截图：[...]
- 前置决策：[已确定的架构/设计选择]

### 输出要求
- 格式：[代码 diff / 方案文档 / 审计报告]
- 约束：[禁止新增 Token / 禁止改架构 / ...]

### 不确定时
如果遇到不确定的设计决策，停下并列出选项让我选择。
禁止自行决定任何设计方向。
```

---

## 关键原则

> 世界级的前端不是"做了很多好东西"，而是"没有任何一个地方让你出戏"。

1. 约束产生质量 — Token 系统的价值不是"好看"，而是"不可能不一致"

1. 批量优于逐个 — 用 AI 做系统级清扫，而不是逐个像素调

1. 自动化守护成果 — ESLint 规则 + CI 检查，防止改好的东西再次退化

1. 你的眼睛是最终裁判 — AI 写代码，你判断"对不对"
