## 第 1 段：产品定位与视觉基调

> 这是第一条指令，让 Variant 理解整个产品是什么、视觉往哪走。不涉及任何具体界面。以下所有 Token 值为全局设计规范，后续所有界面段落都继承这套系统。

设计一款名为 CreoNow 的深色主题桌面端 Web 应用。

### 产品是什么——「创作者的 IDE」

CreoNow 不是一个文档编辑器，也不是一个笔记工具。它是**创作者的 IDE**——但这个 IDE 和程序员的 IDE 有本质区别。

程序员的 IDE（如 VS Code、Cursor）围绕「代码文件 + 终端 + 调试器」组织工作。创作者的 IDE 围绕的是一个完全不同的工作流：**构思 → 结构化 → 写作 → 审视 → 迭代**。它的核心对象不是代码文件，而是：

- **稿件**：长篇文本、分章节、有结构层级——这是创作者的「源代码」
- **角色/实体档案**：小说家有人物关系网，编剧有场景设定，学术写作者有概念体系——这是创作者的「类型系统」
- **知识图谱**：所有实体之间的关系、时间线、因果链——这是创作者的「依赖关系图」
- **创作数据**：写作速度、专注深度、产出趋势——这是创作者的「性能监控面板」

所以 CreoNow 的界面布局逻辑是：左侧是项目导航和知识库入口（类似 IDE 的文件树 + 符号浏览器），中间是编辑区（类似 IDE 的代码编辑器），右侧是 AI 面板（类似 IDE 的终端/辅助面板），顶层有仪表盘、分析、日历等全局视图。

**这不是一个「写字的地方加了点 AI」，而是一个「让 AI 理解你整个创作世界、并在每个环节提供深度辅助」的专业创作环境。**

### 两个参考产品的 AI 风格——学什么、不学什么

**Notion 的 AI 风格：**

- 视觉上：整体白底（或浅灰底），圆角较大（8-12px），大量留白，风格柔和、亲切、低压力
- AI 交互：通过「/」斜杠命令或选中文本后的浮动菜单触发。AI 的输出直接内联在文档中，带有淡紫色背景标记，用户可以接受、丢弃或重试
- 气质：像一个安静的助手——你叫它才出来，出来就干活，干完就退下
- **学什么**：AI 内联到内容中的方式（而非独立窗口）、斜杠命令的交互范式、AI 输出不打断写作流的克制感
- **不学什么**：Notion 的 AI 没有上下文感知能力（它不知道你的人物关系、情节线），也没有持续在场的 AI 面板——这正是 CN 要超越的

**Cursor 的 AI 风格：**

- 视觉上：深色主题为主，极度克制，几乎没有装饰元素，所有视觉重心都在代码内容上
- AI 交互：Cmd+K 内联生成（光标位置直接出内容，带有绿色/红色 diff 标记）；右侧有独立 AI 面板，用「指令-响应流」模式——用户输入是小灰字触发标签，AI 输出是全宽内容块，没有对称气泡
- 气质：像一个高效的副驾驶——你不说话它不打扰，但你一开口它立刻响应，而且它理解你整个代码库的上下文
- **学什么**：深色主题的沉浸感、AI 面板的指令-响应流模式（绝不是聊天气泡）、内联生成的 diff 预览交互、全代码库上下文感知的设计思路
- **不学什么**：Cursor 的视觉完全面向程序员，没有任何「创作感」，CN 需要在克制的基础上注入一层精准感——不是 Notion 那种圆润柔和，而是深色背景上精确的冷光蓝点缀，像精密仪器的指示灯——安静、可靠、始终在场

**Apple HIG 的设计哲学：**

- 语义化色彩：颜色按用途定义（labelColor、separator、systemBackground），而非按外观。Dark Mode 用「更暗背景 + 更亮前景」而非简单反色
- System Blue (#007AFF) 作为全平台默认强调色 = 「可交互 / 系统智能」，全球认知最成熟的 UI 强调色
- 层级靠背景色阶（三级 systemBackground），而非靠阴影
- **学什么**：语义 Token 架构、蓝色作为强调色的普适性、背景色阶制造深度
- **不学什么**：Liquid Glass / vibrancy 依赖系统渲染，Web 无法复现；大圆角风格与 CN 不符

**Claude（Anthropic）的设计气质：**

- 品牌色 Crail (#C15F3C)——故意避开蓝/紫，传达「温暖、人文、可信赖」
- 极度克制，大留白，Pampas (#F4F3EE) 暖白底，AI 输出以纯内容流呈现，零装饰
- 设计主管 Jenny Wen（前 Figma 设计负责人）：快速原型 → 即时实现，设计与代码的界限正在消失
- **学什么**：内容至上的极简哲学、单一强调色建立 AI 身份识别、AI 输出不需要花哨视觉包装
- **不学什么**：暖色调适合轻量对话产品，不适合深色沉浸式创作 IDE

### AI 强调色决策——为什么是冷光蓝

综合 Apple、Claude、Notion 三个产品的设计哲学研究，CN 的 AI 强调色确定为**冷光蓝 (#7AA2F7)**：

1. **认知复用**：Apple 20 年建立的「蓝色 = 系统智能」全球认知，CN 直接复用，零学习成本
2. **工具气质**：蓝色 =「精密仪器 / 专业工具」，金色 =「奢侈品 / 装饰」——前者与「创作者的 IDE」定位完全匹配
3. **内容退让性**：在 #0D0D0D 深色背景上，高饱和暖色视觉权重过重，蓝色更易退居标记角色——标记「AI 在这里」但不与写作内容争注意力
4. **语义色隔离**：蓝色与绿/红/黄语义色零冲突，金色与 semantic-warning 黄色容易混淆
5. **色值优化**：#7AA2F7 比 Apple System Blue (#007AFF) 饱和度更低、明度更高，专为深色背景调校——在 #0D0D0D 上对比度 7.2:1（WCAG AAA），醒目但不刺眼

### 视觉基调

视觉情绪关键词：**专注的、专业的、安静但有力量感的**。把它想象成创作者深夜书房里的驾驶舱——精密仪器的冷光在黑暗中指引方向。

---

### 全局 Design Token 系统

以下是整个应用的设计基础，所有界面段落都强制继承此系统。任何界面中的颜色、字号、间距、圆角都必须从以下 Token 中选取，不可使用任意自定义值。

#### Token A：色彩系统

**背景色阶（从深到浅）：**

| Token 名    | 色值            | 用途                           |
| ----------- | --------------- | ------------------------------ |
| bg-base     | #0D0D0D         | 应用主背景、编辑器背景         |
| bg-surface  | #1A1A1A         | 卡片、面板、侧边栏背景         |
| bg-elevated | #1E1E1E         | 悬浮元素、焦点卡片、hover 背景 |
| bg-sunken   | #111111         | 输入框、搜索栏（凹陷感）       |
| bg-overlay  | rgba(0,0,0,0.6) | 模态遮罩层                     |

**边框与分割线：**

| Token 名       | 色值    | 用途                         |
| -------------- | ------- | ---------------------------- |
| border-default | #2A2A2A | 卡片边框、分割线、输入框边框 |
| border-hover   | #3A3A3A | hover 态边框、focus 态边框   |
| border-active  | #F0F0F0 | 键盘焦点 outline（2px）      |

**文字色阶：**

| Token 名       | 色值    | 用途                                    |
| -------------- | ------- | --------------------------------------- |
| text-primary   | #F0F0F0 | 标题、正文、激活态元素、按钮文字        |
| text-secondary | #CCCCCC | 正文描述、AI 输出内容                   |
| text-tertiary  | #888888 | 元数据、时间戳、非激活导航、placeholder |
| text-disabled  | #555555 | 禁用态文字、输入框 placeholder          |
| text-inverse   | #0D0D0D | 亮色按钮上的深色文字（极少使用）        |

**语义色：**

| Token 名         | 色值    | 用途                             |
| ---------------- | ------- | -------------------------------- |
| semantic-success | #4ADE80 | 正向趋势、进度达标、确认反馈     |
| semantic-error   | #F87171 | 负向趋势、截止日临近、不一致警告 |
| semantic-warning | #FBBF24 | 进行中、注意提示                 |
| semantic-info    | #60A5FA | 提示信息、链接（极少使用）       |

**AI 专属色（绝不用于非 AI 元素）：**

| Token 名         | 色值                      | 用途                                    |
| ---------------- | ------------------------- | --------------------------------------- |
| ai-accent        | #7AA2F7                   | AI 标记色——左侧竖线、悬浮按钮、内容指示 |
| ai-accent-hover  | #8BB3F8                   | AI 按钮 hover 态                        |
| ai-accent-subtle | rgba(122, 162, 247, 0.08) | AI 内联生成内容的背景标记               |
| ai-pulse         | #7AA2F7 → opacity 0.3↔1.0 | AI 生成中的脉动圆点动画                 |

**色彩规则（强制执行）：**

- 导航栏激活项 → text-primary（白色），不是 ai-accent
- 文档标题 → text-primary，不是 ai-accent
- 选中文本高亮 → rgba(240,240,240,0.2)，不是 ai-accent
- Tab 栏活跃标签 → text-primary + 底部 2px text-primary 指示线
- AI 生成的段落 → 左侧 3px ai-accent 竖线（唯一蓝色出现在内容区的场景）
- **AI 竖线统一规范**：所有 AI 标记竖线一律 3px 宽 × ai-accent (#7AA2F7)，圆角 1.5px——编辑器、AI 面板、Dashboard、Analytics 全局统一，不可出现 4px 或其他宽度变体
- **冷光蓝 = AI 的身份色**。用户一看到蓝色就知道「这里有 AI」。其他一切用黑白灰解决。

**绝对禁止：**

- 任何 AI 紫色（#7C3AED 及类似色）
- 糖果色、渐变色、毛玻璃效果
- 过度装饰、插画风格元素
- 对称气泡式聊天界面
- 把 ai-accent 当成通用高亮色使用

#### Token B：字体系统

**字体栈：**

- UI 元素：`Inter, -apple-system, 'SF Pro Text', 'Segoe UI', sans-serif`
- 编辑器正文：`'Source Serif 4', 'Noto Serif SC', Georgia, serif`（创作者的 IDE 需要衬线体带来的阅读舒适感）
- 代码/等宽：`'JetBrains Mono', 'Fira Code', monospace`

**全局字体阶梯：**

**UI 字体（Sans-serif：Inter）：**

| Token 名         | 字号 | 字重 | 行高 | 字间距  | 典型用途                                       |
| ---------------- | ---- | ---- | ---- | ------- | ---------------------------------------------- |
| text-display     | 36px | 700  | 1.1  | -0.01em | 统计大号数字（Dashboard / Analytics 核心指标） |
| text-h1          | 28px | 700  | 1.2  | -0.01em | 页面标题（如 Dashboard 标题、角色名）          |
| text-h3          | 16px | 600  | 1.4  | 0       | 卡片标题、列表分组标题（Dashboard 中也称 H2）  |
| text-body        | 14px | 400  | 1.6  | 0       | 正文、AI 输出内容、描述文字                    |
| text-body-strong | 14px | 500  | 1.6  | 0       | 列表标题、按钮文字、强调正文                   |
| text-caption     | 12px | 400  | 1.4  | 0       | 元数据、时间戳、标签、辅助文字                 |
| text-micro       | 11px | 500  | 1.2  | 0.02em  | 趋势指示器、徽章数字、状态标签                 |

**编辑器字体（Serif：Source Serif 4 / Noto Serif SC）：**

| Token 名          | 字号 | 字重 | 行高 | 字间距  | 典型用途                                           |
| ----------------- | ---- | ---- | ---- | ------- | -------------------------------------------------- |
| text-editor-title | 32px | 700  | 1.25 | -0.01em | 编辑器文档标题（页面顶部大标题，区别于文内 H1-H3） |
| text-editor-h1    | 28px | 700  | 1.2  | -0.01em | 编辑器内 H1 标题（文内章节大标题）                 |
| text-editor-h2    | 22px | 600  | 1.3  | 0       | 编辑器内 H2 标题                                   |
| text-editor-h3    | 18px | 600  | 1.35 | 0       | 编辑器内 H3 标题                                   |
| text-editor-body  | 16px | 400  | 1.8  | 0       | 编辑器正文（创作舒适行高）                         |

**字体规则（强制执行）：**

- 所有字号必须从 Token B 中选取，不可使用任意自定义字号（如 13px、15px、17px、20px 均禁止）
- **字体栈不可混用**：UI 元素只用 Inter（Sans-serif），编辑器正文只用 Source Serif 4（Serif），代码块只用 JetBrains Mono（Monospace）——绝不交叉
- **字重限定**：全局仅使用 400（Regular）/ 500（Medium）/ 600（SemiBold）/ 700（Bold）四档，不可使用 300（Light）或 800+（ExtraBold/Black）
- **行高必须匹配 Token**：每个字号都有唯一对应行高（如 text-body = 14px / 1.6，text-editor-body = 16px / 1.8），不可随意更改
- **字间距规则**：仅 Display 和 H1 级使用负字间距（-0.01em），text-micro 使用正字间距（0.02em），其余一律为 0——不可使用任意 letter-spacing 值
- **最小可读字号**：11px（text-micro），任何场景不可低于此值。text-micro 仅用于趋势指示器、徽章等极短标签，不可用于正文或描述
- **大写字母间距**：仅分组标题、菜单区域标题使用全大写 + 0.05em 字间距（如斜杠菜单的「格式」「AI」标签），其他场景禁止全大写
- **CJK 回退**：中文环境下，Sans-serif 回退为系统默认（-apple-system / 'PingFang SC' / 'Microsoft YaHei'），Serif 回退为 'Noto Serif SC'。确保中英文混排时基线对齐
- **编辑器正文色 = text-secondary (#CCCCCC)**，不是 text-primary——这是刻意降低亮度以减轻长时间阅读疲劳，不可「修正」为白色

**字体禁止清单：**

- 任何装饰性/手写体字体（如 Comic Sans、Pacifico、Dancing Script）
- 任何 Display 专用字体（如 Playfair Display、Lobster）——CN 的 Display 层级用 Inter 700 实现，不引入额外字体
- 字号低于 11px 的任何元素
- 在 UI 区域使用衬线体，或在编辑器正文区使用无衬线体
- 使用 font-style: italic 作为装饰（italic 仅用于编辑器引用块和富文本语义斜体）

#### Token C：间距系统（4px 基准网格）

所有间距必须为 4 的倍数，不可使用任意值。

| Token 名 | 值   | 用途                               |
| -------- | ---- | ---------------------------------- |
| space-1  | 4px  | 图标与文字的微间距、徽章内边距     |
| space-2  | 8px  | 紧凑元素间距、卡片内子元素间距     |
| space-3  | 12px | 卡片标题与内容间距、列表项间距     |
| space-4  | 16px | 组件间间距（中等）                 |
| space-5  | 20px | 卡片内边距、行间距（卡片垂直间距） |
| space-6  | 24px | 列 gutter、区域间距、面板 padding  |
| space-8  | 32px | 页面上边距、大区块间距             |
| space-10 | 40px | 重要分区间距                       |
| space-12 | 48px | 页面下边距、超大间距               |

#### Token D：圆角系统

| Token 名    | 值     | 用途                          |
| ----------- | ------ | ----------------------------- |
| radius-sm   | 4px    | 标签、徽章、小按钮            |
| radius-md   | 6px    | 按钮、输入框、下拉菜单        |
| radius-lg   | 8px    | 卡片、面板、对话框            |
| radius-xl   | 12px   | 模态框、大面板（使用极少）    |
| radius-full | 9999px | 圆形按钮（AI 悬浮按钮）、头像 |

**圆角规则**：CN 的圆角比 Notion（8-12px）更锐利，但不像 Cursor 那样完全直角。主视觉元素使用 radius-lg（8px），细节元素使用 radius-sm/md。绝不使用 16px+ 的大圆角（避免糖果感）。

#### Token E：阴影系统

CN 极少使用阴影，优先用边框和背景色差异制造层次。

| Token 名     | 值                         | 用途                           |
| ------------ | -------------------------- | ------------------------------ |
| shadow-sm    | 0 2px 8px rgba(0,0,0,0.3)  | tooltip、下拉菜单              |
| shadow-md    | 0 4px 16px rgba(0,0,0,0.4) | 全局搜索 Overlay、斜杠命令菜单 |
| shadow-float | 0 8px 32px rgba(0,0,0,0.5) | AI 悬浮按钮、浮动工具栏        |

#### Token F：动画系统

| Token 名          | 值                           | 用途                             |
| ----------------- | ---------------------------- | -------------------------------- |
| duration-fast     | 100ms                        | 点击态、即时反馈                 |
| duration-normal   | 150ms                        | hover 态过渡、边框色变化         |
| duration-slow     | 300ms                        | 面板展开/收起、页面进入          |
| duration-skeleton | 1500ms                       | 骨架屏脉动周期                   |
| easing-default    | cubic-bezier(0.4, 0, 0.2, 1) | 通用缓动（Material Design 标准） |
| easing-enter      | cubic-bezier(0, 0, 0.2, 1)   | 元素进入（ease-out）             |
| easing-exit       | cubic-bezier(0.4, 0, 1, 1)   | 元素退出（ease-in）              |

**无障碍规则：** 当用户设置 `prefers-reduced-motion: reduce` 时，所有 duration 强制降为 0ms（禁用动画），easing 保持不变。骨架屏脉动改为静态灰色块。

#### Token G：图标系统

| 属性       | 值                                                        |
| ---------- | --------------------------------------------------------- |
| 图标库参考 | Lucide Icons 或 Phosphor Icons（线性描边风格）            |
| 描边粗细   | 1.5px（16px 图标）/ 2px（20px+ 图标）                     |
| 风格       | 仅 outline（线性），不用 filled（填充）或 duotone         |
| 尺寸阶梯   | 12px（micro）/ 16px（默认）/ 20px（导航）/ 24px（大按钮） |
| 颜色-默认  | text-tertiary (#888888)                                   |
| 颜色-激活  | text-primary (#F0F0F0)                                    |
| 颜色-AI    | ai-accent (#7AA2F7)——仅 AI 相关元素使用                   |

#### Token H：断点与布局

| 属性                   | 值                                                                                         |
| ---------------------- | ------------------------------------------------------------------------------------------ |
| 设计稿基准宽度         | 1440px（桌面端全屏基准）                                                                   |
| 自适应降级（窗口缩小） | 当视口宽度 < 1024px 时，Context Panel 默认收起；当视口宽度 < 800px 时，两侧边距缩减至 16px |
| 最大内容宽度-编辑器    | 720px（正文列）/ 960px（宽版模式）                                                         |
| 最大内容宽度-页面      | 1120px（Dashboard、Analytics、Calendar）                                                   |
| 页面水平边距           | min 32px（两侧）                                                                           |

#### Token I：z-index 层级系统

所有悬浮元素必须遵循以下层级，不可使用任意 z-index 值。

| Token 名   | 值  | 用途                                     |
| ---------- | --- | ---------------------------------------- |
| z-base     | 0   | 普通内容流元素                           |
| z-sticky   | 10  | sticky 分组标题、状态栏                  |
| z-toolbar  | 20  | 顶部工具栏、浮动工具栏、选中文本工具栏   |
| z-sidebar  | 30  | Icon Rail、Context Panel、右侧详情面板   |
| z-dropdown | 50  | 下拉菜单、斜杠命令、tooltip、AI 操作菜单 |
| z-floating | 100 | AI 悬浮按钮                              |
| z-overlay  | 200 | 模态遮罩层（bg-overlay）                 |
| z-modal    | 300 | Cmd+K 搜索、AI 命令面板、对话框          |
| z-toast    | 400 | 通知消息、保存确认、快速捕捉成功反馈     |

#### Token J：无障碍规范

**对比度要求（强制执行）：**

- 所有文字必须满足 WCAG 2.1 AA 最低对比度（正文 4.5:1，大字 3:1）
- ai-accent (#7AA2F7) 在 bg-base (#0D0D0D) 上对比度 7.2:1（超 AAA）✅
- text-primary (#F0F0F0) 在 bg-base 上对比度 17.1:1（超 AAA）✅
- text-tertiary (#888888) 在 bg-base 上对比度 5.3:1（超 AA）✅
- text-disabled (#555555) 在 bg-base 上对比度 2.8:1 —— 仅用于禁用态/placeholder，不承载关键信息

**键盘导航（强制执行）：**

- 所有可交互元素必须可通过 Tab 键到达
- 焦点指示器：2px border-active (#F0F0F0) outline，offset 2px
- 焦点顺序：从左到右、从上到下，符合 DOM 顺序
- Esc 键必须能关闭任何模态/overlay/面板

**动画无障碍：**

- `prefers-reduced-motion: reduce` 时所有 duration 强制为 0ms（已在 Token F 定义）

**ARIA 角色指导：**

- Icon Rail：`role="navigation"` + `aria-label="主导航"`
- Context Panel：`role="complementary"` + `aria-label="项目文件树"`
- AI 侧边面板：`role="complementary"` + `aria-label="AI 助手"`
- Cmd+K Overlay：`role="dialog"` + `aria-modal="true"`
- 编辑器正文区：`role="textbox"` + `aria-multiline="true"`
- 所有图标按钮：必须有 `aria-label` 描述功能（如 `aria-label="打开 AI 助手"`）

#### Token K：空态与加载态系统

为了保证业务接入时体验一致，所有列表、卡片和面板的加载与空数据状态必须遵循以下统一规范：

| 状态类别               | 规范定义                                                                                                                                                                                      |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 骨架屏 (Skeleton)      | 背景色 #2A2A2A，圆角匹配对应组件，必须带有 opacity 0.3↔0.7 的脉动动画，周期 1500ms（对应 Token F）。禁止使用旋转加载图标 (Spinner)。                                                          |
| 数据空态 (Empty State) | 垂直水平居中布局；统一使用 32×32px 的 text-disabled (#555555) 线性图标；主标题 text-body (14px 400 #888888)；副标题/建议操作 text-caption (12px 400 #555555)；元素垂直间距依次为 8px 和 4px。 |

#### 全局设计约束清单（所有段落强制遵守）

以下约束覆盖色彩、字体、间距、圆角、阴影、动画、布局全维度。任何界面元素都必须通过此清单校验。

**❶ 取值约束——「只能从 Token 中选」**

- 颜色 → 只能使用 Token A 中定义的色值（含 rgba 变体），不可自定义 hex/rgb
- 字号/字重/行高 → 只能使用 Token B 中定义的组合，不可拆开混搭（如不可 text-body 字号 + text-h3 字重）
- 间距 → 只能使用 Token C 中定义的值（4px 倍数），不可使用 5px、7px、10px、15px 等非 4 倍值
- 圆角 → 只能使用 Token D 中的五档（4/6/8/12/9999px），不可使用 2px、3px、10px、16px、20px 等
- 阴影 → 只能使用 Token E 中的三档，不可自定义 box-shadow
- 动画 → 时长只能使用 Token F 中的四档，缓动只能使用三条曲线，不可使用 ease / linear 等简写
- z-index → 只能使用 Token I 中的九档，不可使用任意数字

**❷ 组合约束——「Token 之间如何搭配」**

- 卡片标题必须使用 text-h3（16px 600），不可用 text-body-strong 替代
- 页面级标题必须使用 text-h1（28px 700），不可用 text-display 替代（Display 仅用于统计数字）
- 输入框背景必须使用 bg-sunken（#111111），不可使用 bg-base 或 bg-surface
- 悬浮元素（tooltip / dropdown / modal）必须有阴影（Token E），普通卡片使用边框不使用阴影
- AI 相关元素的蓝色（ai-accent）不可与语义色混用——蓝色 = AI，绿色 = 成功，红色 = 错误，黄色 = 警告

**❸ 层级约束——「视觉重量的优先级」**

- 同一界面中，视觉重量排序：AI 悬浮按钮 > 页面标题 > 卡片标题 > 正文 > 元数据 > 禁用态
- 同一区域内，字号严格递减：Display > H1 > H3 > Body > Caption > Micro，不可逆序或跳级
- 色彩重量排序：ai-accent（唯一彩色）> text-primary（白）> text-secondary（浅灰）> text-tertiary（中灰）> text-disabled（深灰）
- 背景色深度排序：bg-base（最深）< bg-sunken < bg-surface < bg-elevated（最浅），层级越高越亮

**❹ 一致性约束——「同类元素同样处理」**

- 所有输入框：bg-sunken + 1px #2A2A2A + focus 态 #3A3A3A + radius-md (6px) + 14px placeholder #555555
- 所有卡片：bg-surface + 1px #2A2A2A + radius-lg (8px) + 20px 内边距 + hover border #3A3A3A
- 所有文字按钮：无背景、无边框，12-14px text-tertiary，hover → text-primary + cursor: pointer
- 所有分割线：1px #2A2A2A，水平或垂直
- 所有 Hover 态：duration-fast (100ms) 或 duration-normal (150ms)，不可使用 0ms（无过渡）或 500ms+（过慢）
- 所有骨架屏：bg #2A2A2A + radius-sm (4px) + 脉动 opacity 0.3↔0.7 + 周期 1500ms
- 所有 stagger 动画：duration-slow (300ms) + 每项延迟 30-50ms

**❺ 禁止清单（全维度）**

- ❌ 任何非 Token 定义的色值、字号、间距、圆角、阴影、z-index
- ❌ 任何渐变色（linear-gradient / radial-gradient），包括背景和文字——**唯一例外**：数据可视化面积填充渐变（如折线图下方 rgba → transparent）允许使用，属信息编码而非装饰
- ❌ 任何毛玻璃效果（backdrop-filter: blur）
- ❌ 任何 CSS filter 效果（blur / brightness / saturate）用于装饰目的
- ❌ 任何边框粗于 2px（除 AI 竖线 3px 和焦点指示器 2px）
- ❌ 任何旋转加载图标（spinner）——用脉动圆点或骨架屏替代
- ❌ 任何弹跳动画（bounce / elastic easing）
- ❌ 同一元素上同时使用阴影和边框营造层次（选一种）
- ❌ 在 bg-base 上使用 bg-base 色的文字或边框（零对比度）
- ❌ 在非 AI 上下文中使用任何蓝色（包括 semantic-info，该色极少使用）

**❻ 组件接口约束——「面向真实数据的组件化」**

- 所有生成的 React 组件必须**预留清晰的 Props 接口**。
- 必须解耦数据和视图，例如显式暴露 `isLoading`, `isEmpty`, `data`, `onAIAction`, `onNavigate` 等属性。
- 绝不要写死无法抽取状态的硬编码逻辑，确保后续可以无缝对接到 SQLite 存储层和 Electron IPC 进程。

---

## 第 2 段：App Shell 与侧边导航

> 这是全局骨架，所有界面共享这一套外壳。采用 IDE 的双层侧边栏结构。以下所有尺寸为精确规范。

设计应用的整体布局框架。左侧采用**双层侧边栏结构**，参考 VS Code / Cursor 的标准 IDE 布局。

### 整体布局结构

| 区域          | 宽度                                 | 背景色               | 说明                                      |
| ------------- | ------------------------------------ | -------------------- | ----------------------------------------- |
| Icon Rail     | 52px（固定）                         | bg-surface (#1A1A1A) | 始终可见，不可折叠                        |
| Context Panel | 200px（可折叠）                      | bg-surface (#1A1A1A) | 仅「项目」视图时展开，其他视图自动收起    |
| 主内容区      | calc(100vw - 52px - 200px)（或全屏） | bg-base (#0D0D0D)    | Context Panel 收起时占 calc(100vw - 52px) |

- 应用总高度：100vh，无滚动条（各区域内部独立滚动）
- Icon Rail 与 Context Panel 之间：1px border-default (#2A2A2A) 分割线
- Context Panel 与主内容区之间：1px border-default (#2A2A2A) 分割线
- 无顶部导航栏——页面标题和上下文操作都在内容区内部

### 第一层：Icon Rail（图标轨道）

**尺寸规范：**

| 属性           | 值                                                                           |
| -------------- | ---------------------------------------------------------------------------- |
| 宽度           | 52px（固定）                                                                 |
| 高度           | 100vh                                                                        |
| 背景色         | bg-surface (#1A1A1A)                                                         |
| 内边距         | 上下 12px，左右居中                                                          |
| 图标尺寸       | 20×20px                                                                      |
| 图标可点击区域 | 36×36px（图标居中）——注：桌面端可接受，iOS 设计需补足至 44×44pt（Apple HIG） |
| 图标间距       | 4px（可点击区域之间）                                                        |
| 图标描边粗细   | 1.5px                                                                        |
| 图标风格       | outline only（Lucide / Phosphor 参考）                                       |

**图标状态：**

| 状态     | 图标色                   | 背景                                        | 额外指示                                        |
| -------- | ------------------------ | ------------------------------------------- | ----------------------------------------------- |
| Hover    | text-secondary (#CCCCCC) | bg-elevated (#1E1E1E)，圆角 radius-md (6px) | tooltip 在右侧弹出（见 tooltip 规范）           |
| 键盘焦点 | 同 hover                 | 同 hover                                    | 2px border-active (#F0F0F0) outline，offset 2px |

**Tooltip 规范：**

- 位置：图标右侧，距离图标可点击区域 8px
- 背景色：bg-elevated (#1E1E1E)
- 边框：1px border-default (#2A2A2A)
- 圆角：radius-sm (4px)
- 内边距：6px 10px
- 文字：text-caption (12px 400) text-primary (#F0F0F0)
- 阴影：shadow-sm
- 延迟：hover 500ms 后显示，离开后 100ms 消失
- 动画：opacity 0→1，duration-fast (100ms)

**Icon Rail 布局排列（从上到下）：**

**上半区（核心工作流）：**

1. 搜索图标（放大镜）— 点击弹出全局搜索 overlay（Cmd+K），不是跳转到一个页面
2. 仪表盘图标（网格/仪表盘形状）— 创作指挥中心
3. 项目图标（文件夹）— 点击后在 Context Panel 中展开项目文件树
4. 分析图标（图表）— 创作数据分析
5. 日历图标（日历）— 写作计划和截止日

**分割线：**

- 1px border-default (#2A2A2A)，左右各留 8px 边距，与上下图标间距 8px

**下半区（知识库）：**

1. 角色图标（人物轮廓）— 点击直接切换主内容区为全屏角色管理面板
2. 知识图谱图标（节点网络）— 点击直接切换主内容区为全屏知识图谱

**底部（系统区），贴底排列：**

1. 设置图标（齿轮）— 包含用户身份信息、账户、偏好等所有设置。不需要单独用户头像入口

**编辑器不显示行号**——行号是代码编辑器的特征，创作者的 IDE 不需要行号。

### AI 入口：悬浮图标

| 属性       | 值                                                             |
| ---------- | -------------------------------------------------------------- |
| 按钮尺寸   | 44×44px（符合 Apple HIG 最小可点击区域）                       |
| 按钮形状   | 圆形 (radius-full)                                             |
| 按钮背景色 | ai-accent (#7AA2F7)——整个界面唯一的彩色常亮元素                |
| 图标内容   | 机器人头像，20×20px，线性描边 2px                              |
| 图标色     | bg-base (#0D0D0D)——深色图标在蓝色背景上高对比显示              |
| 位置       | fixed，right: 24px，bottom: 24px（始终悬浮在右下角）           |
| z-index    | z-floating (100)——高于主内容，低于 overlay/modal               |
| 阴影       | shadow-float (0 8px 32px rgba(0,0,0,0.5))                      |
| Hover      | 背景色 → ai-accent-hover (#8BB3F8)，scale(1.05)，duration-fast |
| 点击态     | scale(0.95)，duration-fast                                     |
| 右键点击   | 屏幕中央弹出 AI 命令面板（全局模态）                           |

- 这是整个界面唯一的彩色常亮元素，立刻传达「AI 始终在场」
- **禁止**用星火/闪电/魔法棒标志——只用机器人头像

### 全局搜索 Overlay（Cmd+K）

| 属性       | 值                                                                                 |
| ---------- | ---------------------------------------------------------------------------------- |
| 尺寸       | 宽 560px，最大高 480px，水平居中，距顶部 20vh                                      |
| 背景色     | bg-surface (#1A1A1A)                                                               |
| 边框       | 1px border-default (#2A2A2A)                                                       |
| 圆角       | radius-xl (12px)                                                                   |
| 阴影       | shadow-md (0 4px 16px rgba(0,0,0,0.4))                                             |
| 遮罩层     | bg-overlay rgba(0,0,0,0.6)，点击遮罩层关闭                                         |
| 输入框高度 | 48px，背景 bg-sunken (#111111)，无边框，内边距 0 16px                              |
| 输入文字   | text-body (14px 400) text-primary                                                  |
| 占位文字   | 「搜索文档、命令、AI 指令…」(14px text-disabled #555555)                           |
| 进入动画   | opacity 0 + scale(0.98) → opacity 1 + scale(1)，duration-slow (300ms) easing-enter |
| 退出动画   | opacity 1 → opacity 0，duration-normal (150ms) easing-exit                         |

**结果列表：**

- 每条结果高度：40px，内边距 0 16px
- 左侧：类型图标 16×16px (text-tertiary)，距文字 12px
- 文字：text-body-strong (14px 500 text-primary)
- 右侧：快捷键提示 text-caption (12px text-tertiary)
- Hover 态：背景 bg-elevated (#1E1E1E)，duration-fast
- 激活项（键盘选中）：同 hover 效果
- 最多显示 8 条结果，超出滚动

### 第二层：Context Panel（上下文面板）

| 属性   | 值                  |
| ------ | ------------------- |
| 高度   | 100vh               |
| 内边距 | 12px 16px           |
| 快捷键 | Cmd+B 切换折叠/展开 |

**当「项目」图标激活时展开**，支持「文件树」和「大纲」两种子视图模式（顶部下拉切换）。大纲模式仅在编辑器中文档打开时可用。其他顶级视图（仪表盘、分析、日历、角色、知识图谱）自动收起 Context Panel，主内容区全屏显示。

**项目文件树规范：**

- 顶部：「项目」标题 (text-h3 16px 600 text-primary) + 右侧「+」新建按钮 (16px 图标，text-tertiary，hover → text-primary)
- 项目名：text-body-strong (14px 500 text-primary)，左侧 16px 文件夹图标
- 章节/文档：text-body (14px 400 text-secondary)，每级缩进 16px
- 树节点高度：32px，垂直居中
- 展开/折叠箭头：12px 图标，text-tertiary，旋转 90° 表示展开，动画 duration-normal
- Hover 态：背景 bg-elevated (#1E1E1E)，圆角 radius-sm (4px)
- 激活文档：背景 rgba(240,240,240,0.08)，文字色 text-primary
- 底部：当前文档的字数统计 (text-caption 12px text-tertiary)

### Context Panel：Outline 文档大纲模式

当切换到「大纲」视图后，Context Panel 内容区替换为当前文档的标题导航结构。交互范式参考 Notion Outline——自动从文档标题层级（H1/H2/H3）实时生成，滚动联动高亮当前段落，点击跳转。**Outline 不是独立外部面板，而是 Context Panel 的第二种子视图**，与文件树共享同一物理位置和宽度（200px）。

<aside>
⚠️

**旧版废弃声明**：早期 Figma 设计稿中存在独立于 Context Panel 之外的 Outline 面板（外挂式侧边栏），该方案已**正式废弃**。Outline 必须且仅能作为 Context Panel 的子视图存在，不可作为独立浮动面板、外部侧边栏或弹出窗口实现。如在 Figma 中发现旧版独立 Outline 设计稿，应直接删除并以本节规范替代。

</aside>

**视图切换器（替换原顶部标题行）：**

| 属性       | 值                                                                                                          |
| ---------- | ----------------------------------------------------------------------------------------------------------- |
| 位置       | Context Panel 顶部第一行，高度 32px                                                                         |
| 当前模式名 | text-h3 (16px 600 text-primary)，如「OUTLINE」或「文件树」                                                  |
| 切换指示   | 模式名右侧 4px (space-1)，上下双箭头图标 12px text-tertiary，hover → text-primary                           |
| 下拉菜单   | 宽度 160px，bg-surface / 1px #2A2A2A / radius-md (6px) / shadow-sm                                          |
| 菜单项     | 每项 36px 高，左侧 16px 图标 text-tertiary + 12px + 名称 (14px 400 text-primary)                            |
| 选项       | 「文件树」(文件夹图标) ｜ 「OUTLINE」(列表层级图标)——大纲仅编辑器中文档打开时可选，否则置灰 + text-disabled |
| 切换动画   | 内容区 crossfade opacity 0→1，duration-normal (150ms)                                                       |

**大纲节点规范：**

| 属性          | 值                                                                                                                                                                 |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 数据来源      | 实时解析当前文档中的 H1 / H2 / H3 标题（对应编辑器 text-editor-h1/h2/h3）                                                                                          |
| 层级缩进      | H1 = 0px，H2 = 16px (space-4)，H3 = 32px (space-8)                                                                                                                 |
| 节点高度      | 32px，文字垂直居中                                                                                                                                                 |
| 节点文字      | text-body (14px 400 text-secondary #CCCCCC)，单行截断 + ellipsis                                                                                                   |
| 展开/折叠箭头 | 有子标题的节点左侧 12px 箭头图标 text-tertiary，展开态旋转 90°，动画 duration-normal (150ms)                                                                       |
| 激活节点      | 文字色 text-primary (#F0F0F0) + 左侧 2px text-primary 指示竖线（高度 20px 居中）——注意：指示线用 text-primary 而非 ai-accent，因为大纲是文档导航工具，不是 AI 功能 |
| Hover         | 背景 bg-elevated (#1E1E1E)，圆角 radius-sm (4px)，duration-fast (100ms)                                                                                            |
| 点击          | 编辑器 smooth scroll 到对应标题位置，大纲立即切换激活项                                                                                                            |
| 滚动联动      | 编辑器滚动时，Intersection Observer 检测视口顶部最近标题，大纲自动高亮对应节点并确保其在可见区内                                                                   |
| 键盘导航      | ↑/↓ 在节点间移动焦点，Enter 跳转到对应标题，←/→ 折叠/展开子节点                                                                                                    |

**空态设计（文档无标题时）：**

| 属性     | 值                                                          |
| -------- | ----------------------------------------------------------- |
| 布局     | Context Panel 内容区垂直水平居中                            |
| 图标     | 文档轮廓图标 32×32px text-disabled (#555555)                |
| 主文字   | 「还没有大纲」(text-body 14px 400 #888888)，居中            |
| 副文字   | 「添加标题后自动生成」(text-caption 12px 400 #555555)，居中 |
| 元素间距 | 图标→主文字 8px (space-2)，主文字→副文字 4px (space-1)      |

**Outline 模式 Token 合规要求：**

- **字体**：全部 UI 字体栈 Inter。切换器标签 = text-h3 (16px 600)，节点文字 = text-body (14px 400)，空态主文字 = text-body (14px 400)，空态副文字 = text-caption (12px 400)。禁止衬线体
- **色彩**：面板背景 = bg-surface (#1A1A1A)，节点默认 = text-secondary (#CCCCCC)，激活 = text-primary (#F0F0F0)。**激活指示线 = text-primary (#F0F0F0)，不是 ai-accent**——大纲属于文档导航工具，不是 AI 功能，蓝色不应出现
- **间距**：缩进 = space-4 (16px) 倍数，节点高度 32px (space-8)。继承 Context Panel 内边距 12px×16px
- **圆角**：hover 背景 = radius-sm (4px)，下拉菜单 = radius-md (6px)
- **ARIA**：大纲容器 `role="navigation"` + `aria-label="文档大纲"`，激活节点 `aria-current="true"`

### 主内容区

- 占据 Icon Rail 和 Context Panel 右侧的全部剩余空间
- 背景色：bg-base (#0D0D0D)
- 无顶部导航栏——页面标题和上下文操作都在内容区内部
- 视图切换动画：新视图从 opacity 0 + translateY(4px) 进入，duration-slow (300ms) easing-enter，旧视图立即隐藏（无退出动画）

### ⚙️ 本段设计约束提醒

<aside>
🔒

**本段 Token 合规校验清单（生成后逐项检查）：**

**字体**：本段全部使用 UI 字体栈（Inter Sans-serif），禁止出现衬线体。Icon Rail 无文字标签，仅 tooltip 使用 text-caption (12px 400)。Context Panel 标题 = text-h3 (16px 600)，文件树 = text-body / text-body-strong (14px)，底部字数 = text-caption (12px)。禁止出现 13px / 15px / 20px 等非 Token 字号。

**色彩**：Icon Rail 和 Context Panel 背景 = bg-surface (#1A1A1A)，主内容区 = bg-base (#0D0D0D)。图标默认 = text-tertiary (#888888)，激活 = text-primary (#F0F0F0)。唯一彩色 = AI 悬浮按钮的 ai-accent (#7AA2F7)，导航图标激活态不可使用蓝色。

**间距**：所有间距必须为 4px 倍数。Icon Rail 图标间距 4px (space-1)，tooltip 距离 8px (space-2)，Context Panel padding 12px×16px (space-3×space-4)，文件树缩进 16px (space-4)。

**圆角**：tooltip = radius-sm (4px)，Icon Rail hover 背景 = radius-md (6px)，文件树 hover = radius-sm (4px)，搜索 Overlay = radius-xl (12px)，AI 按钮 = radius-full。禁止 16px+ 圆角。

**阴影**：tooltip = shadow-sm，搜索 Overlay = shadow-md，AI 悬浮按钮 = shadow-float。普通面板（Icon Rail / Context Panel）使用 1px 边框不使用阴影。

**z-index**：Icon Rail / Context Panel = z-sidebar (30)，浮动工具栏 = z-toolbar (20)，AI 悬浮按钮 = z-floating (100)，搜索遮罩 = z-overlay (200)，搜索面板 = z-modal (300)。不可使用任意 z-index。

**动画**：tooltip 显示 = duration-fast (100ms)，hover 过渡 = duration-normal (150ms)，面板折叠/展开 = duration-slow (300ms)，视图切换 = duration-slow (300ms) easing-enter。骨架屏周期 = 1500ms。

</aside>

---

## 第 3 段：Dashboard 仪表盘

> 这是用户每天打开应用看到的第一个界面。它是创作指挥中心，不是展示页。以下所有数值为精确设计规范，不可随意更改。

设计 Dashboard 视图。这是创作者的工作台首屏，用户打开后必须在 3 秒内找到「上次在做什么」和「接下来该做什么」。

### 全局约束

- **禁止**任何大字营销标题（如「CONTINUE CREATING」「开始创作」）——这不是 Landing Page
- **禁止**装饰性插画、渐变背景卡片、悬浮 3D 元素
- 页面最大内容宽度：1120px，水平居中，两侧留白 min 32px
- 页面上下内边距：padding-top 32px，padding-bottom 48px

### 网格系统

- 采用 **12 列网格**，列间距（gutter）24px
- 左主区占 **8 列**（约 728px），右辅区占 **4 列**（约 344px）
- 区域间距（左右栏之间）：24px（即一个 gutter）
- 行间距（卡片垂直间距）：20px

### 字体阶梯（Dashboard 专用，继承全局 Design Token）

| 层级    | 用途                         | 字号 | 字重          | 行高 | 颜色           |
| ------- | ---------------------------- | ---- | ------------- | ---- | -------------- |
| Display | 统计数字（如 42,850）        | 36px | 700 (Bold)    | 1.1  | #F0F0F0        |
| H2      | 卡片标题（如「活跃上下文」） | 16px | 600 (Semi)    | 1.4  | #F0F0F0        |
| Body    | 正文描述、AI 摘要            | 14px | 400 (Regular) | 1.6  | #CCCCCC        |
| Caption | 元数据、时间戳、标签         | 12px | 400 (Regular) | 1.4  | #888888        |
| Micro   | 趋势指示器文字（如 +12%）    | 11px | 500 (Medium)  | 1.2  | 语义色（见下） |

### 语义色（Dashboard 状态色）

| 语义       | 色值                | 用途                     |
| ---------- | ------------------- | ------------------------ |
| 正向趋势   | #4ADE80（低饱和绿） | 数据上升箭头、进度达标   |
| 负向趋势   | #F87171（低饱和红） | 数据下降箭头、截止日临近 |
| 中性/持平  | #888888             | 无变化指示               |
| AI 标记    | #7AA2F7（冷光蓝）   | 仅用于 AI 洞察卡片左边框 |
| 进度条填充 | #F0F0F0（白色）     | 进度条已完成部分         |
| 进度条轨道 | #2A2A2A             | 进度条未完成部分         |

### 卡片通用规范

- 背景色：#1A1A1A
- 边框：1px solid #2A2A2A（不要用 box-shadow 营造层次，用边框）
- 圆角：8px
- 内边距：20px
- Hover 态：边框色过渡到 #3A3A3A，transition 150ms ease
- 点击态：背景色过渡到 #1E1E1E，transition 100ms ease
- 卡片标题与内容间距：12px
- 卡片内子元素间距：8px

---

### 左主区（8 列 / 728px）

**▎区块 A：活跃上下文卡片**

这是整个 Dashboard 视觉层级最高的元素，用户打开应用第一眼看到它。

- 高度：auto，最小高度 160px
- 内部布局：上下两行
- **第一行**（项目信息）：
  - 左侧：项目名（H2 16px Semi #F0F0F0）+ 章节标题（Body 14px Regular #CCCCCC），中间用 `›` 分隔
  - 右侧：上次编辑时间（Caption 12px #888888），格式如「3 小时前」
- **第二行**（进度 + AI 摘要）：
  - 进度条：高度 4px，圆角 2px，轨道色 #2A2A2A，填充色 #F0F0F0，宽度 100%
  - 进度条下方 8px：AI 生成的一句话摘要（Body 14px #CCCCCC），如「你上次在第 12 章写到 Elara 进入密室，下一步可以展开她与守卫的对话」
  - 摘要文字最大 2 行，超出截断 + ellipsis
- **右下角**：一个「继续写作 →」文字按钮（14px 500 #F0F0F0），hover 下划线，点击直接跳转到上次编辑位置
- 此卡片**不使用边框**，改用背景色 #1E1E1E（比其他卡片略亮），形成视觉焦点

**▎区块 B：最近工作列表**

- 标题行：「最近编辑」（H2）+ 右侧「查看全部 →」文字链接（Caption 12px #888888，hover → #F0F0F0）
- 列表形式，非卡片网格——每行一个文档条目，共显示 5 条
- 每条高度：56px，垂直居中
- 每条结构（Flexbox 水平排列）：
  - 左侧 40px：文档类型图标（16×16px，线性描边，#888888）
  - 标题区（flex: 1）：文档标题（Body 14px 500 #F0F0F0） + 所属项目名（Caption 12px #888888）上下排列
  - 右侧 80px：字数变化标签（Micro 11px），正数 #4ADE80 带 ↑，负数 #F87171 带 ↓，零变化不显示
  - 最右 72px：最后编辑时间（Caption 12px #888888），如「2h ago」
- 每条之间用 1px #2A2A2A 分割线
- Hover 态：整行背景色 #1E1E1E，transition 100ms

**▎区块 C：快速捕捉输入框**

- 输入框高度：44px，圆角 8px
- 背景色：#111111（比卡片暗，形成凹陷感）
- 边框：1px solid #2A2A2A，focus 态边框 #3A3A3A
- 占位文字：「记下一个灵感…」（14px #555555）
- 右侧内嵌发送按钮：24×24px 圆形，图标为向上箭头（12px #888888），hover → #F0F0F0
- 输入有内容时发送按钮变为白色实心
- Enter 直接保存并清空，Shift+Enter 换行
- 保存成功后：输入框底部闪现一条 2px 高的绿色确认条（#4ADE80，200ms 淡入 → 1s 后淡出）

---

### 右辅区（4 列 / 344px）

**▎区块 D：本周目标卡片**

- 标题：「本周目标」（H2）
- 主数据：目标字数 / 实际字数，格式如 `12,400 / 20,000`（Display 36px / Body 14px）
  - 实际字数用 Display 大字 #F0F0F0，目标字数紧跟其后用 Body 14px #888888，用 `/` 分隔
- 进度条：高度 6px，圆角 3px，与区块 A 的进度条规格一致但略粗
- 进度条下方 8px：完成百分比（Caption 12px #888888），如「62% 已完成」
- 如果进度 ≥ 80%：百分比文字变为 #4ADE80
- 如果进度 ＜ 30% 且本周已过半：百分比文字变为 #F87171

**▎区块 E：AI 洞察卡片**

- 标题：「AI 洞察」（H2），标题左侧有一个 3px 宽的冷光蓝竖线（#7AA2F7），高度与标题等高
- 列表显示 3 条洞察条目，每条之间间距 12px
- 每条结构：
  - 一句话洞察文字（Body 14px #CCCCCC），最大 2 行
  - 例如：「第 12 章有一条未解决的伏笔——Elara 提到的钥匙至今未出现」
  - 例如：「你的写作速度在周二上午 9-11 点达到峰值（1,200 字/小时）」
  - 例如：「角色 Marcus 已连续 3 章未出场，考虑在下一章重新引入」
- 每条可点击，hover 时文字色从 #CCCCCC → #F0F0F0，cursor: pointer
- 点击跳转到相关内容位置
- 底部：「刷新洞察」文字按钮（Caption 12px #888888）

**▎区块 F：写作热力图**

- 标题：「过去 30 天」（H2）
- 热力图参考 GitHub Contribution Graph，但水平布局
- 网格：7 行（周一至周日）× 5 列（最近 5 周），每格 14×14px，间距 4px (space-1)
- 色阶（5 级，从无到多）：
  - 0 字：#1A1A1A（与背景同色，仅靠 1px #2A2A2A 边框区分）
  - 1-500 字：#2A2A2A
  - 501-1500 字：#3A3A3A
  - 1501-3000 字：#888888
  - 3000+ 字：#F0F0F0
- 热力图下方 8px：「本月共 12,400 字」（Caption 12px #888888）
- Hover 某格：tooltip 显示具体日期 + 字数，如「3月22日 · 1,842 字」

---

### 交互规范

- **键盘导航**：Tab 键可在所有可交互元素间切换，当前焦点元素显示 2px #F0F0F0 outline（offset 2px）
- **空态设计**（新用户 / 无数据）：
  - 活跃上下文卡片 → 显示「创建你的第一个项目 →」文字按钮，无进度条和 AI 摘要
  - 最近工作列表 → 显示 3 行骨架屏（skeleton），灰色脉动动画，1.5s 循环
  - AI 洞察 → 显示「开始写作后，AI 会在这里为你提供创作建议」（Body 14px #555555）
  - 热力图 → 全部为 #1A1A1A 空格，底部文字改为「开始你的第一次写作」
- **加载态**：卡片内容用骨架屏（矩形色块 #2A2A2A，圆角 4px，脉动动画 opacity 0.3↔0.7，周期 1.5s）
- **页面进入动画**：卡片从 opacity 0 / translateY(8px) 过渡到 opacity 1 / translateY(0)，duration 300ms ease-out，每张卡片延迟 50ms 依次出现（stagger）

### ⚙️ 本段设计约束提醒

<aside>
🔒

**本段 Token 合规校验清单（生成后逐项检查）：**

**字体**：全部使用 UI 字体栈（Inter Sans-serif）。统计大号数字 = text-display (36px 700)，卡片标题 = text-h3 (16px 600)（Dashboard 中称 H2），正文/摘要 = text-body (14px 400)，元数据/时间戳 = text-caption (12px 400)，趋势指示器 = text-micro (11px 500)。禁止在 Dashboard 中使用衬线体或 Token 外字号。

**色彩**：页面背景 = bg-base (#0D0D0D)，卡片 = bg-surface (#1A1A1A)，活跃上下文卡片 = bg-elevated (#1E1E1E)（无边框，用背景色差异突出）。输入框 = bg-sunken (#111111)。ai-accent 仅用于 AI 洞察卡片左侧竖线，不可用于其他卡片。进度条填充 = #F0F0F0（白色），轨道 = #2A2A2A。热力图色阶仅用灰阶 5 级（#1A1A1A → #F0F0F0），不引入彩色。

**间距**：页面 padding-top 32px (space-8) / bottom 48px (space-12)。12 列网格 gutter = 24px (space-6)。卡片内边距 = 20px (space-5)。卡片标题与内容 = 12px (space-3)。卡片内子元素 = 8px (space-2)。行间距 = 20px (space-5)。最大内容宽 = 1120px。

**圆角**：所有卡片 = radius-lg (8px)。输入框 = radius-lg (8px)（Dashboard 快速捕捉特例，与通用 radius-md 不同）。进度条 = 2px/3px（半高圆角，组件内圆角非 Token D 但合理）。热力图格子无圆角。

**交互**：所有卡片 hover = border #3A3A3A + duration-normal (150ms)。列表 hover = bg-elevated + duration-fast (100ms)。文字按钮 hover = text-primary + 下划线。焦点 = 2px #F0F0F0 outline offset 2px。stagger = 300ms 每卡延迟 50ms。

**语义色严格对应**：正向 = #4ADE80，负向 = #F87171，中性 = #888888。不可用 ai-accent 表示正/负趋势。

</aside>

---

## 第 4 段：Editor 编辑器

> 这是 CreoNow 最核心的界面，用户 80% 的时间都在这里。必须极致专注。以下所有数值为精确设计规范。

设计主编辑器视图。这是最关键的界面。用户从 Dashboard 点击「继续写作」或从项目文件树点击文档后进入此视图。

### 编辑器布局结构

| 区域               | 规格              | 说明                                                         |
| ------------------ | ----------------- | ------------------------------------------------------------ |
| 写作列宽度（默认） | 720px 居中        | 与 Notion 正文列一致，左右各留 calc((100% - 720px) / 2) 留白 |
| 写作列宽度（宽版） | 960px 居中        | 用户通过底部状态栏或 Cmd+Shift+W 切换                        |
| 页面上内边距       | 48px              | 标题区顶部到内容区顶端                                       |
| 页面下内边距       | 40vh              | 保证最后一行可滚动到屏幕中部（Apple HIG 阅读舒适原则）       |
| 背景色             | bg-base (#0D0D0D) | 纯净深色，零干扰                                             |
| 滚动方式           | 垂直平滑滚动      | scroll-behavior: smooth，无水平滚动                          |

### 标题区

| 属性             | 值                                                                                                    |
| ---------------- | ----------------------------------------------------------------------------------------------------- |
| 文档标题         | text-editor-title (32px 700 #F0F0F0)，字体使用编辑器衬线体 Source Serif 4                             |
| 标题占位符       | 「无标题」(32px 700 #555555)                                                                          |
| 标题与元数据间距 | 8px                                                                                                   |
| 元数据行         | text-caption (12px 400 #888888)，格式：项目名 › 章节名 ｜ 12,400 字 ｜ 约 28 分钟阅读 ｜ 3 分钟前保存 |
| 元数据与正文间距 | 32px                                                                                                  |

### 正文编辑区

| 属性           | 值                                                                   |
| -------------- | -------------------------------------------------------------------- |
| 正文字体       | Source Serif 4, 16px, 400, 行高 1.8（创作舒适行高）                  |
| 正文颜色       | text-secondary (#CCCCCC)——比 UI 文字略暗，减轻长时间阅读疲劳         |
| 段间距         | 16px（一个空行 = 段间距）                                            |
| H1（文内标题） | text-editor-h1 (28px 700 #F0F0F0)，上间距 40px，下间距 16px          |
| H2             | text-editor-h2 (22px 600 #F0F0F0)，上间距 32px，下间距 12px          |
| H3             | text-editor-h3 (18px 600 #F0F0F0)，上间距 24px，下间距 8px           |
| 引用块         | 左边框 3px #3A3A3A，左内边距 16px，文字 16px 400 italic #888888      |
| 代码块         | JetBrains Mono 14px，背景 #111111，内边距 16px，圆角 radius-md (6px) |
| 光标           | 2px 宽 #F0F0F0，闪烁周期 1s（opacity 1↔0）                           |
| 选中文本高亮   | rgba(240, 240, 240, 0.2)                                             |

### AI 内联入口 ①：选中文本浮动工具栏

| 属性     | 值                                                                                   |
| -------- | ------------------------------------------------------------------------------------ |
| 触发条件 | 选中 ≥1 个字符后 200ms 弹出                                                          |
| 位置     | 选中区域正上方居中，距选中文本 8px                                                   |
| 尺寸     | 高度 36px，宽度 auto（按按钮数量撑开）                                               |
| 背景色   | bg-surface (#1A1A1A)                                                                 |
| 边框     | 1px border-default (#2A2A2A)                                                         |
| 圆角     | radius-md (6px)                                                                      |
| 阴影     | shadow-sm (0 2px 8px rgba(0,0,0,0.3))                                                |
| 按钮规格 | 每个 28×28px 可点击区域，图标 16×16px，text-tertiary (#888888)，hover → text-primary |
| 分隔线   | 格式按钮与 AI 按钮之间用 1px #2A2A2A 竖线分隔，左右 4px margin                       |
| AI 按钮  | 机器人图标 16×16px，颜色 ai-accent (#7AA2F7)——工具栏中唯一的彩色元素                 |
| 进入动画 | opacity 0 + translateY(4px) → opacity 1 + translateY(0)，duration-fast (100ms)       |

**AI 操作菜单（点击 AI 按钮后展开）：**

- 位置：浮动工具栏下方，左对齐
- 宽度：200px，背景 bg-surface，边框 1px #2A2A2A，圆角 radius-md，阴影 shadow-sm
- 菜单项高度：36px，内边距 0 12px
- 菜单项文字：text-body (14px 400 text-primary)
- 菜单项左侧：16px 图标 text-tertiary
- 选项列表：改写 ｜ 续写 ｜ 缩写 ｜ 扩写 ｜ 翻译 ｜ 解释
- Hover 态：背景 bg-elevated (#1E1E1E)

### AI 内联入口 ②：斜杠命令菜单

| 属性               | 值                                         |
| ------------------ | ------------------------------------------ |
| 触发               | 空行或行首输入「/」后立即弹出              |
| 位置               | 光标下方 4px，左对齐                       |
| 宽度               | 280px                                      |
| 最大高度           | 360px，超出内部滚动                        |
| 背景 / 边框 / 圆角 | bg-surface / 1px #2A2A2A / radius-lg (8px) |
| 阴影               | shadow-md (0 4px 16px rgba(0,0,0,0.4))     |

**菜单分区：**

- **格式块区域**（上半部分）：标题行「格式」(12px 500 #888888 大写字母间距 0.05em)，下方列出：标题1/2/3、无序列表、有序列表、引用、代码块、分割线、图片
- **AI 命令区域**（下半部分）：左侧 3px ai-accent (#7AA2F7) 竖线贯穿整个区域，标题行「AI」(12px 500 #7AA2F7)，下方列出：续写、生成对话、描述场景、分析人物、查找矛盾、总结段落
- 每条命令高度：36px，左侧 16px 图标 + 12px 间距 + 命令名（14px 400 text-primary）
- AI 命令图标色：ai-accent (#7AA2F7)，格式块图标色：text-tertiary (#888888)
- 输入文字可实时过滤命令列表

### AI 内联入口 ③：Cmd+J 内联生成

| 属性       | 值                                                          |
| ---------- | ----------------------------------------------------------- |
| 触发       | Cmd+J（macOS）/ Ctrl+J（Windows）                           |
| 输入框位置 | 光标所在行下方，与正文列同宽（720px / 960px）               |
| 输入框高度 | 40px，背景 bg-sunken (#111111)，圆角 radius-md (6px)        |
| 输入框边框 | 1px ai-accent (#7AA2F7)——用蓝色边框明确标识「这是 AI 操作」 |
| 占位文字   | 「输入 AI 指令…」(14px #555555)                             |
| 发送       | Enter 发送，Esc 取消                                        |

**AI 生成的内联内容（Cmd+J 结果）：**

- 生成内容插入光标位置，背景标记 ai-accent-subtle (rgba(122, 162, 247, 0.08))
- 左侧 3px ai-accent (#7AA2F7) 竖线
- 内容顶部：操作栏——「✓ 接受」(14px 500 #4ADE80) ｜「✕ 拒绝」(14px 500 #F87171) ｜「↻ 重新生成」(14px 500 #888888)
- 操作栏高度：32px，背景 transparent，距内容顶部 0px
- 接受后：背景标记和竖线淡出（duration-slow 300ms），内容变为普通正文
- 拒绝后：整块内容收缩消失（height → 0 + opacity → 0，duration-slow）

### 底部状态栏

| 属性         | 值                                                                                                                 |
| ------------ | ------------------------------------------------------------------------------------------------------------------ |
| 高度         | 32px                                                                                                               |
| 位置         | 编辑器底部固定，全宽                                                                                               |
| 背景色       | bg-surface (#1A1A1A)                                                                                               |
| 上边框       | 1px border-default (#2A2A2A)                                                                                       |
| 内边距       | 0 16px                                                                                                             |
| 文字         | text-caption (12px 400 #888888)                                                                                    |
| 内容（左侧） | 12,400 字 ｜ 24,800 字符 ｜ 第 12 章 — 觉醒                                                                        |
| 内容（右侧） | 「专注模式」开关——12px 文字 + 小型 toggle (24×14px)，开启后隐藏 Icon Rail + Context Panel + 状态栏自身淡化为半透明 |

**专注模式（Zen Mode）：**

- 快捷键：Cmd+Shift+F
- 效果：Icon Rail 隐藏（translateX(-52px)），Context Panel 隐藏，写作列保持居中，状态栏 opacity → 0.3（hover 时恢复 opacity 1）
- 进入/退出动画：duration-slow (300ms) easing-default
- 按 Esc 或再次 Cmd+Shift+F 退出

### ⚙️ 本段设计约束提醒

<aside>
🔒

**本段 Token 合规校验清单（生成后逐项检查）：**

**字体**：本段是唯一使用**编辑器衬线体栈**（Source Serif 4 / Noto Serif SC）的界面。文档标题 = text-editor-title (32px 700)，文内 H1 = text-editor-h1 (28px 700)，H2 = text-editor-h2 (22px 600)，H3 = text-editor-h3 (18px 600)，正文 = text-editor-body (16px 400 行高 1.8)。代码块 = JetBrains Mono 14px。元数据行 / 状态栏 / 浮动工具栏 / 斜杠菜单等 **UI 元素仍用 Inter**（text-caption 12px / text-body 14px）。禁止在 UI 区使用衬线体，禁止在编辑器正文区使用无衬线体。

**色彩**：编辑器背景 = bg-base (#0D0D0D)，正文色 = text-secondary (#CCCCCC)（刻意降亮减疲劳，不可「修正」为 text-primary）。选中高亮 = rgba(240,240,240,0.2)（不是 ai-accent）。引用块左边框 = #3A3A3A（不是 ai-accent）。代码块背景 = bg-sunken (#111111)。ai-accent 仅出现在：浮动工具栏 AI 按钮图标、斜杠菜单 AI 区域竖线与图标、Cmd+J 输入框边框、AI 生成内容左侧竖线 + 背景标记。

**间距**：页面 padding-top 48px (space-12) / bottom 40vh。标题与元数据 8px (space-2)，元数据与正文 32px (space-8)。段间距 16px (space-4)。H1 上 40px (space-10) 下 16px，H2 上 32px (space-8) 下 12px，H3 上 24px (space-6) 下 8px。写作列默认 720px / 宽版 960px。

**圆角**：浮动工具栏 = radius-md (6px)，斜杠菜单 = radius-lg (8px)，Cmd+J 输入框 = radius-md (6px)，代码块 = radius-md (6px)。禁止 16px+ 圆角。

**阴影**：浮动工具栏 = shadow-sm，斜杠菜单 = shadow-md。编辑器正文区、状态栏均无阴影（使用边框分层）。

**z-index**：浮动工具栏 = z-toolbar (20)，斜杠菜单 / AI 操作菜单 = z-dropdown (50)，状态栏 = z-sticky (10)。

**动画**：浮动工具栏弹出 = duration-fast (100ms)，斜杠菜单输入过滤 = 即时，AI 生成接受/拒绝 = duration-slow (300ms)，专注模式切换 = duration-slow (300ms) easing-default。光标闪烁 1s 周期。

**AI 色彩隔离**：ai-accent 仅标记「这里有 AI」——浮动工具栏 AI 图标、斜杠菜单 AI 区域、Cmd+J 蓝框、生成内容竖线。格式按钮 / 引用块 / 选中高亮 / 文档标题等非 AI 元素绝不使用蓝色。

</aside>

---

## 第 5 段：AI 侧边面板

> 紧跟编辑器，这两个界面是一体的。这是 CreoNow 区别于所有竞品的关键交互。以下所有数值为精确设计规范。

设计编辑器的 AI 侧边面板。

**核心原则：这个面板使用「指令-响应流」模式，绝对不是对称气泡聊天。不可妥协。**

### 面板容器

| 属性     | 值                                                                                                                |
| -------- | ----------------------------------------------------------------------------------------------------------------- |
| 宽度     | 360px（固定）                                                                                                     |
| 高度     | 100%（与编辑器等高）                                                                                              |
| 背景色   | bg-surface (#1A1A1A)                                                                                              |
| 左边框   | 1px border-default (#2A2A2A)                                                                                      |
| 展开方式 | Cmd+Shift+A 或点击 AI 悬浮按钮，从右侧滑入（translateX(360px) → translateX(0)，duration-slow 300ms easing-enter） |
| 收起     | 同快捷键或点击面板外区域，面板滑出 + 编辑器写作列自动回到居中                                                     |
| 布局     | Flexbox column，三区域：顶部固定（上下文 + 模式切换）→ 中部滚动（响应流）→ 底部固定（输入区）                     |

### 顶部区域：上下文指示器 + 模式切换

| 属性             | 值                                                                                                 |
| ---------------- | -------------------------------------------------------------------------------------------------- |
| 高度             | 44px                                                                                               |
| 内边距           | 0 16px                                                                                             |
| 下边框           | 1px border-default (#2A2A2A)                                                                       |
| 左侧：上下文标签 | text-caption (12px 400 #888888)：「上下文：第 12 章 — 觉醒」                                       |
| 上下文切换按钮   | 标签右侧 4px，下拉箭头图标 12px #888888，点击弹出选择器（当前段落 / 当前章节 / 全文 / 自定义选区） |
| 右侧：模式切换   | 小型 toggle (28×16px)，标签「内联」(11px #888888)，开启后 AI 响应写入编辑器光标位置而非面板        |

### 中部区域：响应流（核心交互区）

| 属性       | 值                             |
| ---------- | ------------------------------ |
| 滚动       | 垂直滚动，新响应自动滚动到底部 |
| 内边距     | 16px                           |
| 响应块间距 | 24px                           |

**用户指令显示：**

- 位置：每个 AI 响应块上方
- 样式：text-caption (12px 500 #888888)，左对齐，无背景、无气泡
- 前缀：无（不需要「你：」或头像）
- 视觉权重：极低——像一个 label/tag，不像消息
- 与下方 AI 响应间距：8px

**AI 响应块：**

- 左侧竖线：3px ai-accent (#7AA2F7)，圆角 1.5px，高度撑满响应块
- 内容区左内边距（竖线到文字）：12px
- 文字样式：text-body (14px 400 #CCCCCC)，行高 1.6
- 富文本支持：段落、**加粗**、_斜体_、`代码`、无序列表、有序列表、小型表格
- 列表缩进：16px
- 表格样式：1px #2A2A2A 边框，表头 text-body-strong (14px 500 #F0F0F0)，单元格内边距 8px 12px
- **绝对禁止**：头像、气泡背景、时间戳、圆角消息框

**响应块操作栏（hover 时显示）：**

- 位置：响应块右上角，hover 时从 opacity 0 → opacity 1 (duration-fast)
- 按钮组：「复制」｜「应用到文档」｜「重新生成」——图标按钮 24×24px，text-tertiary，hover → text-primary
- 「应用到文档」按钮图标色：ai-accent (#7AA2F7)——强调这是核心操作

### 底部区域：指令输入

**快捷指令芯片行：**

| 属性       | 值                                                                                                                    |
| ---------- | --------------------------------------------------------------------------------------------------------------------- |
| 高度       | 36px                                                                                                                  |
| 内边距     | 0 16px                                                                                                                |
| 滚动       | 水平滚动（overflow-x: auto），隐藏滚动条                                                                              |
| 芯片样式   | 高度 28px，内边距 0 12px，背景 bg-elevated (#1E1E1E)，圆角 radius-full (9999px)，文字 text-caption (12px 500 #CCCCCC) |
| 芯片间距   | 8px                                                                                                                   |
| 芯片 hover | 背景 #2A2A2A，文字 text-primary，duration-fast                                                                        |
| 芯片列表   | 续写 ｜ 总结本章 ｜ 查找情节漏洞 ｜ 生成对话 ｜ 分析人物弧光                                                          |

**指令输入框：**

| 属性       | 值                                                                                              |
| ---------- | ----------------------------------------------------------------------------------------------- |
| 容器内边距 | 12px 16px                                                                                       |
| 上边框     | 1px border-default (#2A2A2A)                                                                    |
| 输入框高度 | 最小 40px，多行时自动扩展，最大 120px（超出内部滚动）                                           |
| 输入框背景 | bg-sunken (#111111)                                                                             |
| 输入框边框 | 1px #2A2A2A，focus 态 1px #3A3A3A                                                               |
| 输入框圆角 | radius-md (6px)                                                                                 |
| 占位文字   | 「让 AI 帮你写、改、分析…」(14px #555555)                                                       |
| 输入文字   | text-body (14px 400 text-primary)                                                               |
| 发送按钮   | 输入框右侧内嵌，24×24px 圆形，向上箭头图标 12px，默认 #888888，有内容时变为 ai-accent (#7AA2F7) |
| 发送方式   | Enter 发送，Shift+Enter 换行                                                                    |

### 生成状态动画

- **生成中**：响应块底部显示脉动圆点——6×6px 圆形 ai-accent (#7AA2F7)，opacity 0.3↔1.0 循环，周期 1.2s，easing ease-in-out
- **流式输出**：文本逐 token 出现，每个 token 出现时有极微弱的 opacity 0→1 过渡（duration-fast 50ms），模拟 Cursor 的流式效果
- **生成完成**：脉动圆点淡出（opacity → 0，duration-normal 150ms），操作栏自动显示 2s 后淡入半透明
- **禁止**：旋转加载图标、进度条、骨架屏

### ⚙️ 本段设计约束提醒

<aside>
🔒

**本段 Token 合规校验清单（生成后逐项检查）：**

**字体**：本段全部使用 **UI 字体栈（Inter Sans-serif）**，禁止出现衬线体。用户指令 = text-caption (12px 500)，AI 响应正文 = text-body (14px 400)，响应内加粗 = text-body-strong (14px 500)，表头 = text-body-strong (14px 500)，上下文标签 = text-caption (12px 400)，芯片文字 = text-caption (12px 500)，输入占位 = 14px #555555。禁止在面板中使用 text-display / text-h1 等大字号。

**色彩**：面板背景 = bg-surface (#1A1A1A)，输入框 = bg-sunken (#111111)，芯片 = bg-elevated (#1E1E1E)。AI 响应文字 = text-secondary (#CCCCCC)，用户指令 = text-tertiary (#888888)。ai-accent 仅用于：响应块左侧 3px 竖线、脉动圆点、「应用到文档」按钮图标、有内容时发送按钮色。禁止用 ai-accent 做面板背景、芯片高亮、分割线。

**间距**：面板宽度 360px 固定。响应流 padding = 16px (space-4)。响应块间距 = 24px (space-6)。用户指令与 AI 响应 = 8px (space-2)。竖线到文字 = 12px (space-3)。芯片行高 36px，芯片间距 8px (space-2)。输入区 padding = 12px 16px (space-3×space-4)。

**圆角**：输入框 = radius-md (6px)，芯片 = radius-full (9999px)，操作栏按钮 = 无特殊圆角（图标按钮）。面板本身无圆角（全高贴边）。

**阴影**：面板无阴影（使用左边框 1px #2A2A2A 分层）。响应块无阴影、无背景。操作栏按钮无阴影。

**动画**：面板展开 = duration-slow (300ms) easing-enter（translateX 滑入）。脉动圆点 = 1.2s 周期 opacity 0.3↔1.0 ease-in-out。流式 token = duration-fast (50ms) opacity 渐现。操作栏 hover = duration-fast (100ms)。生成完成后脉动淡出 = duration-normal (150ms)。

**绝对禁止**：对称气泡聊天界面、用户头像、AI 头像、时间戳、圆角消息框、旋转加载图标、进度条、骨架屏。指令-响应流是唯一允许的交互模式。

</aside>

---

## 第 6 段：Analytics 数据分析

> 数据不是装饰，每个数字都要能驱动行动。以下所有数值为精确设计规范。

设计数据分析视图。这是创作者的性能监控面板——参考 Grafana/Datadog 的信息密度，但用 Apple HIG 的视觉克制来平衡。

### 页面全局约束

| 属性               | 值                                      |
| ------------------ | --------------------------------------- |
| 最大内容宽度       | 1120px，水平居中，两侧 min 32px 留白    |
| 页面内边距         | padding-top 32px，padding-bottom 48px   |
| 网格系统           | 12 列，gutter 24px（与 Dashboard 一致） |
| 行间距（区块之间） | 24px                                    |
| 背景色             | bg-base (#0D0D0D)                       |

### 第一行：四张统计卡片（各占 3 列 / 256px）

**单张卡片规范：**

| 属性   | 值                                              |
| ------ | ----------------------------------------------- |
| 宽度   | 3 列（约 256px），四卡并排 = 12 列              |
| 高度   | auto，最小 140px                                |
| 背景色 | bg-surface (#1A1A1A)                            |
| 边框   | 1px solid #2A2A2A                               |
| 圆角   | radius-lg (8px)                                 |
| 内边距 | 20px                                            |
| Hover  | border-color → #3A3A3A，duration-normal (150ms) |

**卡片内部结构（从上到下）：**

| 元素                       | 规格                                                                                                  |
| -------------------------- | ----------------------------------------------------------------------------------------------------- |
| 指标标签                   | text-caption (12px 400 #888888)，如「总写作字数」「平均写作速度」「总写作时长」「连续创作天数」       |
| 标签与数字间距             | 8px                                                                                                   |
| 核心数字                   | Display (36px 700 #F0F0F0)，如「42,850」「840 字/h」「3h 12m」「14 天」                               |
| 趋势指示器（数字右侧 8px） | Micro (11px 500)，上升 = #4ADE80 + ↑ 箭头 10px，下降 = #F87171 + ↓ 箭头 10px，持平 = #888888 + — 符号 |
| 趋势对比文字               | 12px 400 #888888，格式「vs 上周 +12%」，紧跟趋势箭头                                                  |
| 数字与 AI 洞察间距         | 12px                                                                                                  |
| AI 洞察文字                | text-caption (12px 400 #888888)，最大 2 行，overflow ellipsis                                         |
| AI 洞察左侧标记            | 2px ai-accent (#7AA2F7) 圆点（6×6px radius-full），距文字 6px                                         |

**四张卡片内容定义：**

1. **总写作字数**——数字如「42,850」，AI 洞察如「本月产出超过上月同期 23%」
2. **平均写作速度**——数字如「840 字/h」，AI 洞察如「你周二和周四上午 9-11 点效率最高」
3. **总写作时长**——数字如「3h 12m」，AI 洞察如「今日专注时长比你的 7 日均值高 18%」
4. **连续创作天数**——数字如「14 天」，AI 洞察如「再坚持 3 天就能打破你的最长记录（16 天）」

### 第二行：两个图表并排（各占 6 列 / 536px）

**图表卡片通用规范：**

| 属性               | 值                                                            |
| ------------------ | ------------------------------------------------------------- |
| 高度               | 280px（含标题 + 图表 + 图例）                                 |
| 背景 / 边框 / 圆角 | bg-surface (#1A1A1A) / 1px #2A2A2A / radius-lg (8px)          |
| 内边距             | 20px                                                          |
| 标题               | text-h3 (16px 600 #F0F0F0)，距图表区 16px                     |
| 坐标轴标签         | text-micro (11px 400 #888888)                                 |
| 网格线             | 1px #1E1E1E（极淡，仅水平）                                   |
| 图例               | text-caption (12px 400 #888888)，圆点 8×8px + 4px 间距 + 标签 |

**左图：「本周产出」柱状图**

| 属性         | 值                                                                                                          |
| ------------ | ----------------------------------------------------------------------------------------------------------- |
| X 轴         | 周一至周日，7 根柱子                                                                                        |
| Y 轴         | 字数（自动刻度，如 0 / 500 / 1000 / 1500 / 2000）                                                           |
| 柱宽         | 32px，圆角顶部 radius-sm (4px)                                                                              |
| 柱间距       | 16px                                                                                                        |
| 柱色——普通日 | #3A3A3A                                                                                                     |
| 柱色——今天   | #F0F0F0                                                                                                     |
| 柱色——最高日 | #F0F0F0（与今天同色，但如果今天不是最高日则最高日为 #888888）                                               |
| Hover        | 柱色变亮 10%，tooltip 显示「周三 · 1,842 字」(bg-elevated #1E1E1E / 1px #2A2A2A / 12px #F0F0F0 / shadow-sm) |
| 空柱（0 字） | 最小高度 2px #2A2A2A，标识「有这天但没写」                                                                  |

**右图：「专注深度」折线图**

| 属性              | 值                                                         |
| ----------------- | ---------------------------------------------------------- |
| X 轴              | 过去 14 天日期                                             |
| Y 轴              | 平均会话时长（分钟），如 0 / 30 / 60 / 90                  |
| 折线              | 2px #F0F0F0，圆滑曲线（cubic bezier 插值）                 |
| 数据点            | 6×6px 圆形 #F0F0F0，hover 时放大为 8×8px                   |
| 面积填充          | 折线下方渐变 rgba(240,240,240,0.06) → transparent          |
| 辅助线（7日均值） | 1px dashed #888888                                         |
| Hover tooltip     | 同柱状图 tooltip 规范，显示「3月22日 · 平均 47 分钟/会话」 |

### 第三行：左项目分布 + 右 AI 建议（各占 6 列）

**左：「项目分布」环形图**

| 属性                  | 值                                                                                           |
| --------------------- | -------------------------------------------------------------------------------------------- |
| 卡片高度              | 320px                                                                                        |
| 环形图直径            | 180px，内圆直径 100px（环宽 40px）                                                           |
| 内圆中心              | 总时长数字 text-h1 (28px 700 #F0F0F0)，如「28.5h」——内圆空间有限，使用 text-h1 替代 Display  |
| 内圆副文字            | text-caption (11px 400 #888888)「本月总计」                                                  |
| 配色方案（最多 5 色） | #F0F0F0 / #888888 / #555555 / #3A3A3A / #2A2A2A——纯灰阶，不引入额外颜色                      |
| Hover 扇区            | 外扩 4px，tooltip 显示「项目名 · 12.5h · 44%」                                               |
| 图例位置              | 环形图右侧，垂直列表，每条：8×8px 圆点 + 8px + 项目名 (14px #CCCCCC) + 百分比 (14px #888888) |
| 图例行高              | 28px                                                                                         |

**右：「AI 优化建议」面板**

| 属性           | 值                                                                                             |
| -------------- | ---------------------------------------------------------------------------------------------- |
| 卡片高度       | 320px（与左侧等高）                                                                            |
| 标题           | 「AI 优化建议」(16px 600 #F0F0F0)，左侧 3px ai-accent (#7AA2F7) 竖线（全局统一）               |
| 标题与列表间距 | 16px                                                                                           |
| 建议条数       | 3 条，超出则内部滚动                                                                           |
| 每条建议结构   | 序号圆圈 (20×20px radius-full bg-elevated #1E1E1E 居中数字 11px 500 #F0F0F0) + 12px + 建议文字 |
| 建议文字       | text-body (14px 400 #CCCCCC)，行高 1.6，最大 3 行                                              |
| 条目间距       | 16px                                                                                           |
| Hover          | 整条背景 bg-elevated (#1E1E1E)，圆角 radius-sm (4px)，duration-fast                            |
| 底部           | 「刷新建议」文字按钮 (12px 400 #888888，hover → #F0F0F0)                                       |

**AI 建议内容示例：**

1. 「尝试在中午之前安排深度写作——你上午的产出比下午高 40%」
2. 「本周角色对话占比偏低（12%），试试用 AI 生成对话练习」
3. 「你的写作会话平均 25 分钟就中断，建议使用番茄钟模式（50 分钟专注）」

### 交互与状态规范

- **页面进入动画**：卡片 stagger 进入，opacity 0 + translateY(8px) → opacity 1 + translateY(0)，duration-slow (300ms) easing-enter，每卡延迟 50ms
- **图表加载态**：图表区域显示骨架屏——矩形 #2A2A2A，圆角 4px，脉动 opacity 0.3↔0.7，周期 1.5s
- **空态**（无数据）：统计卡片数字显示「—」(36px 700 #555555)，AI 洞察显示「开始写作后将生成数据洞察」(12px #555555)
- **时间范围选择器**：页面右上角，与标题同行——分段控制器（Segmented Control）「7天 / 30天 / 90天 / 全部」，高度 32px，每段内边距 0 12px，text-caption (12px 500)，默认 #888888 bg-transparent，激活 #F0F0F0 bg-elevated (#1E1E1E) radius-sm (4px)
- **键盘导航**：Tab 遍历所有可交互元素，2px #F0F0F0 outline offset 2px

### ⚙️ 本段设计约束提醒

<aside>
🔒

**本段 Token 合规校验清单（生成后逐项检查）：**

**字体**：全部使用 UI 字体栈（Inter Sans-serif）。核心数字 = text-display (36px 700)，卡片标题 / 图表标题 = text-h3 (16px 600)，正文 / AI 建议 = text-body (14px 400)，指标标签 / 趋势对比 / 图例 = text-caption (12px 400)，趋势指示器 / 坐标轴 = text-micro (11px 500/400)，环形图中心数字 = text-h1 (28px 700)——内圆空间有限时的 Display 降级方案。禁止衬线体、禁止 Token 外字号。

**色彩**：页面背景 = bg-base (#0D0D0D)，卡片 = bg-surface (#1A1A1A)。图表配色严格纯灰阶：柱状图普通日 = #3A3A3A，今天 = #F0F0F0，最高日 = #888888；折线图 = #F0F0F0，面积填充 = rgba(240,240,240,0.06)；环形图 5 色 = #F0F0F0 / #888888 / #555555 / #3A3A3A / #2A2A2A。ai-accent 仅用于 AI 洞察圆点 (6×6px) 和 AI 优化建议标题竖线 (3px)，不可用于图表配色、趋势箭头、卡片边框。语义色：正向 = #4ADE80，负向 = #F87171，持平 = #888888。

**间距**：页面 padding-top 32px (space-8) / bottom 48px (space-12)。12 列网格 gutter = 24px (space-6)。卡片内边距 = 20px (space-5)。行间距 = 24px (space-6)。标签与数字 = 8px (space-2)，数字与 AI 洞察 = 12px (space-3)。标题与图表区 = 16px (space-4)。最大内容宽 = 1120px。

**圆角**：所有卡片 = radius-lg (8px)。柱状图顶部 = radius-sm (4px)。时间范围选择器激活段 = radius-sm (4px)。序号圆圈 = radius-full。禁止 16px+ 圆角。

**阴影**：所有卡片使用 1px 边框不使用阴影。tooltip = shadow-sm。

**动画**：卡片 stagger 进入 = duration-slow (300ms) + 每卡延迟 50ms。卡片 hover = duration-normal (150ms)。图表加载态 = 骨架屏脉动 1500ms。

**空态规则**：无数据时数字显示「—」(36px 700 #555555)，AI 洞察 = 12px #555555 提示文字。不可显示空白或隐藏卡片。

</aside>

---

## 第 7 段：Characters 角色管理

> 角色不是静态档案卡，而是与稿件活数据联动的智能实体。以下所有数值为精确设计规范。

设计角色管理视图。采用左右分栏的 Master-Detail 布局——左侧角色列表始终可见，右侧展示选中角色的完整信息。参考 Apple Contacts + Notion 数据库详情页的信息组织方式。

### 整体布局

| 区域               | 宽度               | 背景色                   | 说明                             |
| ------------------ | ------------------ | ------------------------ | -------------------------------- |
| 左面板（角色列表） | 320px（固定）      | bg-surface (#1A1A1A)     | 始终可见，独立垂直滚动           |
| 右面板（角色详情） | calc(100% - 320px) | bg-base (#0D0D0D)        | 选中角色后显示，未选中时显示空态 |
| 分割线             | 1px                | border-default (#2A2A2A) | 左右面板之间                     |

### 左面板：角色列表

**顶部搜索栏：**

| 属性         | 值                                |
| ------------ | --------------------------------- |
| 容器内边距   | 12px 16px                         |
| 输入框高度   | 36px                              |
| 输入框背景   | bg-sunken (#111111)               |
| 输入框边框   | 1px #2A2A2A，focus 态 1px #3A3A3A |
| 输入框圆角   | radius-md (6px)                   |
| 占位文字     | 「搜索角色…」(14px #555555)       |
| 左侧搜索图标 | 16px #888888，距输入文字 8px      |

**分组标题：**

| 属性     | 值                                                                                                               |
| -------- | ---------------------------------------------------------------------------------------------------------------- |
| 高度     | 32px                                                                                                             |
| 内边距   | 0 16px                                                                                                           |
| 文字     | text-caption (12px 500 #888888)，大写字母间距 0.05em                                                             |
| 数量徽章 | 标题右侧 8px，min-width 20px，高 18px，圆角 radius-full，背景 bg-elevated (#1E1E1E)，文字 11px 500 #888888，居中 |
| 分组     | 主要角色 / 次要角色 / 其他角色                                                                                   |
| sticky   | 滚动时分组标题置顶（position: sticky，bg-surface）                                                               |

**角色列表项：**

| 属性           | 值                                                                         |
| -------------- | -------------------------------------------------------------------------- |
| 高度           | 64px                                                                       |
| 内边距         | 8px 16px                                                                   |
| 左侧头像占位   | 40×40px radius-full，背景 bg-elevated (#1E1E1E)，居中人物图标 20px #888888 |
| 头像与文字间距 | 12px                                                                       |
| 角色名         | text-body-strong (14px 500 #F0F0F0)，单行截断                              |
| 简述           | text-caption (12px 400 #888888)，单行截断                                  |
| 名与简述间距   | 4px                                                                        |
| Hover          | 背景 bg-elevated (#1E1E1E)，圆角 radius-sm (4px)，duration-fast            |
| 选中态         | 背景 rgba(240,240,240,0.08)，左侧 3px #F0F0F0 竖线                         |

**底部操作区：**

| 属性                | 值                                                                                                           |
| ------------------- | ------------------------------------------------------------------------------------------------------------ |
| 容器                | 底部固定，内边距 12px 16px，上边框 1px #2A2A2A                                                               |
| 「+ 新建角色」按钮  | 全宽，高度 36px，背景 bg-elevated (#1E1E1E)，圆角 radius-md (6px)，文字 14px 500 #F0F0F0，hover → bg #2A2A2A |
| 「AI 建议角色」按钮 | 「+ 新建角色」下方 8px，同规格但文字色 ai-accent (#7AA2F7)，左侧机器人图标 16px ai-accent                    |

### 右面板：角色详情

**详情页最大内容宽度：720px，水平居中，上内边距 32px，下内边距 48px。**

**角色名区域：**

| 属性             | 值                                                                                                             |
| ---------------- | -------------------------------------------------------------------------------------------------------------- |
| 头像区域（可选） | 角色名左侧，64×64px radius-full，bg-elevated (#1E1E1E)，居中人物图标 32px #888888，距角色名 16px               |
| 角色名           | text-h1 (28px 700 #F0F0F0)                                                                                     |
| 原型标签         | 角色名下方 8px，text-caption (12px 500 #888888)，背景 bg-elevated (#1E1E1E)，圆角 radius-full，内边距 4px 10px |

**结构化字段区（角色名下方 24px）：**

| 属性     | 值                                                                                                                                      |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| 字段布局 | 两列网格，列间距 24px，行间距 16px                                                                                                      |
| 字段标签 | text-caption (12px 400 #888888)                                                                                                         |
| 字段值   | text-body (14px 400 #F0F0F0)，标签下方 4px                                                                                              |
| 字段类型 | 年龄（数字）/ 性别 / 原型 / 阵营 / 首次出场章节                                                                                         |
| 外貌描述 | 跨两列，text-body (14px 400 #CCCCCC)，行高 1.6，最大 4 行，超出「展开」按钮 (12px #888888)                                              |
| 性格特征 | 跨两列，标签组——每个标签：高 24px，内边距 0 10px，背景 bg-elevated (#1E1E1E)，圆角 radius-full，文字 12px 500 #CCCCCC，间距 8px，可换行 |

**关系网络区（字段区下方 32px）：**

| 属性               | 值                                                                                                                    |
| ------------------ | --------------------------------------------------------------------------------------------------------------------- |
| 标题               | 「关系网络」(16px 600 #F0F0F0)，右侧「+ 添加关系」图标按钮 (16px #888888)                                             |
| 标题与卡片间距     | 12px                                                                                                                  |
| 关系卡片           | 水平排列可换行，每卡宽 200px，高 80px，背景 bg-surface (#1A1A1A)，边框 1px #2A2A2A，圆角 radius-lg (8px)，内边距 12px |
| 卡片间距           | 12px                                                                                                                  |
| 卡片内容——关系类型 | 顶部，12px 400 #888888，如「盟友」「敌人」「导师」「恋人」                                                            |
| 卡片内容——角色名   | 关系类型下方 4px，14px 500 #F0F0F0                                                                                    |
| 卡片左侧           | 32×32px radius-full bg-elevated，人物图标 16px #888888                                                                |
| Hover              | border-color → #3A3A3A，cursor: pointer，duration-normal                                                              |
| 点击               | 切换到该关联角色的详情页                                                                                              |

**出场统计区（关系网络下方 32px）：**

| 属性           | 值                                                                                               |
| -------------- | ------------------------------------------------------------------------------------------------ |
| 标题           | 「出场统计」(16px 600 #F0F0F0)，右侧总出场次数徽章（同分组标题徽章规格）                         |
| 标题与列表间距 | 12px                                                                                             |
| 列表项高度     | 40px                                                                                             |
| 列表项内容     | 左：章节名 (14px 400 #F0F0F0)，右：出场次数 (12px 400 #888888) + 最近出场时间 (12px 400 #888888) |
| 列表项分割线   | 1px #2A2A2A                                                                                      |
| 最多显示       | 5 条，超出「查看全部 →」文字链接 (12px #888888)                                                  |
| Hover          | 背景 bg-elevated (#1E1E1E)，duration-fast，点击跳转到对应章节                                    |

### AI 分析区（出场统计下方 32px）

| 属性           | 值                                                                                                                |
| -------------- | ----------------------------------------------------------------------------------------------------------------- |
| 标题           | 「AI 分析」(16px 600 #F0F0F0)，左侧 4px ai-accent (#7AA2F7) 竖线，高度与标题等高                                  |
| 标题与洞察间距 | 12px                                                                                                              |
| 洞察条数       | 3-5 条，按严重程度排序（不一致 > 弧光建议 > 统计）                                                                |
| 每条洞察结构   | 左侧类型图标 (16px)——⚠️ 不一致用 #F87171，📊 统计用 #888888，💡 建议用 ai-accent (#7AA2F7) + 12px 间距 + 洞察文字 |
| 洞察文字       | text-body (14px 400 #CCCCCC)，行高 1.6，最大 2 行                                                                 |
| 条目间距       | 12px                                                                                                              |
| 条目 Hover     | 背景 bg-elevated (#1E1E1E)，圆角 radius-sm (4px)，duration-fast，点击跳转到相关章节                               |
| 底部           | 「重新分析」文字按钮 (12px 400 #888888，hover → #F0F0F0)，距最后一条 16px                                         |

**AI 洞察内容示例：**

- ⚠️「潜在不一致：Elara 的眼睛颜色在第 3 章（碧绿）和第 7 章（深蓝）的描述不同」
- 📊「Elara 在 23 个场景中出现，主要与 Marcus 互动（15 次）」
- 💡「人物弧光评估：目前缺少明确的内在冲突转折点，建议在第 15-18 章加入」

### 交互与状态规范

- **空态**（未选中角色）：右面板居中显示「选择一个角色查看详情」(14px #555555) + 人物图标 48px #555555
- **空态**（无角色）：左面板仅显示搜索栏 + 底部按钮，中间显示「创建你的第一个角色」(14px #555555)
- **页面进入动画**：左面板列表项 stagger 进入，duration-slow (300ms)，每项延迟 30ms
- **详情切换动画**：右面板内容 opacity 0 → opacity 1，duration-normal (150ms)

### ⚙️ 本段设计约束提醒

<aside>
🔒

**本段 Token 合规校验清单（生成后逐项检查）：**

**字体**：全部使用 UI 字体栈（Inter Sans-serif）。角色名 = text-h1 (28px 700)，列表项角色名 = text-body-strong (14px 500)，分组标题（如「主要角色」「次要角色」）= text-caption (12px 500 全大写 letter-spacing 0.05em)，字段标签 = text-caption (12px 400)，字段值 = text-body (14px 400)，搜索占位 = 14px #555555。禁止衬线体、禁止 Token 外字号。

**色彩**：左侧列表面板 = bg-surface (#1A1A1A)，右侧详情区 = bg-base (#0D0D0D)。选中角色 = rgba(240,240,240,0.08) 背景 + 左侧 3px **#F0F0F0** 竖线（不是 ai-accent，角色选中是用户操作不是 AI 标记）。搜索框 = bg-sunken (#111111)。关系卡片 = bg-surface (#1A1A1A) + 1px #2A2A2A + radius-lg (8px)。ai-accent 仅用于：「AI 建议角色」按钮文字与图标、AI 分析区左侧竖线 (3px #7AA2F7)、AI 生成内容标记。不可用于角色选中态、分组标题、字段标签。

**间距**：左侧面板宽 320px 固定。列表项高度 56px。搜索框高度 40px + padding 12px 16px。右侧详情区 padding = 24px (space-6)。字段间距 = 16px (space-4)。关系卡片内边距 = 16px (space-4)。分组标题上方 = 24px (space-6)。

**圆角**：搜索框 = radius-md (6px)，关系卡片 = radius-lg (8px)，角色头像 = radius-full，列表 hover = radius-sm (4px)。禁止 16px+ 圆角。

**阴影**：左右面板均无阴影（使用 1px 边框分层）。tooltip = shadow-sm。

**动画**：列表 hover = duration-fast (100ms)，面板切换 = duration-slow (300ms) easing-enter，详情区内容更新 = opacity 渐现 duration-normal (150ms)。

**AI 色彩隔离**：ai-accent 仅标记 AI 功能入口（建议角色按钮、AI 分析竖线）。角色选中竖线 = #F0F0F0（白色），关系连线 = text-secondary (#CCCCCC)，字段边框 = #2A2A2A。绝不用 ai-accent 做角色列表装饰。

</aside>

---

## 第 8 段：Knowledge Graph 知识图谱

> 知识图谱是 CreoNow 的差异化功能之一，视觉必须有信息密度和层次感。以下所有数值为精确设计规范。

设计知识图谱视图。这是全屏画布视图，参考 Obsidian Graph View + D3.js 力导向图的视觉语言，但用 CN 的克制色彩系统重新设计。

### 整体布局

| 区域         | 规格                               | 说明                                                                           |
| ------------ | ---------------------------------- | ------------------------------------------------------------------------------ |
| 画布区域     | 100% 宽 × 100% 高（全屏）          | 背景 bg-base (#0D0D0D)，可无限平移和缩放                                       |
| 顶部工具栏   | 全宽，高 48px                      | bg-surface (#1A1A1A)，下边框 1px #2A2A2A，固定在顶部                           |
| 右侧详情面板 | 360px（点击节点后滑出）            | bg-surface (#1A1A1A)，左边框 1px #2A2A2A，与 Characters 详情面板同样的布局规范 |
| 右下角控制区 | 固定定位，距右边 16px，距底部 16px | 缩放控制 + 操作按钮                                                            |

### 节点规范

**节点尺寸三级体系（按出场频次/重要程度自动分级）：**

| 级别               | 直径 | 边框  | 文字                             | 适用                            |
| ------------------ | ---- | ----- | -------------------------------- | ------------------------------- |
| Large（核心实体）  | 48px | 2px   | 12px 500 #F0F0F0，节点下方 4px   | 出现 20+ 次，主角色/核心地点    |
| Medium（重要实体） | 32px | 1.5px | 11px 400 #CCCCCC，节点下方 4px   | 出现 5-19 次，次要角色/重要事件 |
| Small（边缘实体）  | 20px | 1px   | 10px 400 #888888，hover 时才显示 | 出现 1-4 次，物品/次要地点      |

**节点形状与色彩（按实体类型区分）：**

| 实体类型 | 形状                     | 边框色  | 填充色                | 图标（居中）     |
| -------- | ------------------------ | ------- | --------------------- | ---------------- |
| 角色     | 圆形 (radius-full)       | #F0F0F0 | bg-elevated (#1E1E1E) | 人物图标 #888888 |
| 地点     | 菱形 (rotate 45° square) | #888888 | bg-elevated (#1E1E1E) | 地点图标 #888888 |
| 事件     | 六边形                   | #888888 | bg-elevated (#1E1E1E) | 闪电图标 #888888 |
| 物品     | 圆角方形 (radius-sm 4px) | #555555 | bg-elevated (#1E1E1E) | 钥匙图标 #888888 |

**节点状态：**

| 状态            | 规格                                                                                                 |
| --------------- | ---------------------------------------------------------------------------------------------------- |
| 默认            | 如上表，边框 + 填充 + 图标                                                                           |
| Hover           | 边框色变亮 1 级（如 #888888 → #CCCCCC），scale(1.1)，duration-fast，弹出预览卡片                     |
| 选中            | 边框色 #F0F0F0，外发光 0 0 12px rgba(240,240,240,0.15)，关联节点保持正常亮度，非关联节点 opacity 0.3 |
| AI 建议（虚线） | 边框 2px dashed ai-accent (#7AA2F7)，填充 transparent，opacity 0.6，点击确认后实体化                 |

### 连线规范

| 属性                             | 值                                                                                             |
| -------------------------------- | ---------------------------------------------------------------------------------------------- |
| 连线颜色——默认                   | #2A2A2A                                                                                        |
| 连线颜色——hover/选中节点的关联线 | #888888                                                                                        |
| 连线粗细——强关系                 | 2px                                                                                            |
| 连线粗细——中关系                 | 1.5px                                                                                          |
| 连线粗细——弱关系                 | 1px                                                                                            |
| 关系标签                         | text-micro (10px 400 #888888)，连线中点，背景 bg-base (#0D0D0D) 内边距 2px 4px（避免与线重叠） |
| 曲线                             | cubic bezier 曲线，非直线——避免视觉生硬                                                        |
| AI 建议连线                      | 1px dashed ai-accent (#7AA2F7)，opacity 0.5                                                    |

### Hover 预览卡片

| 属性     | 值                                                                                                                                     |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 尺寸     | 宽 240px，高 auto（最大 200px）                                                                                                        |
| 背景     | bg-surface (#1A1A1A)                                                                                                                   |
| 边框     | 1px #2A2A2A                                                                                                                            |
| 圆角     | radius-lg (8px)                                                                                                                        |
| 阴影     | shadow-sm (0 2px 8px rgba(0,0,0,0.3))                                                                                                  |
| 内边距   | 12px                                                                                                                                   |
| 实体名   | 14px 500 #F0F0F0                                                                                                                       |
| 实体类型 | 11px 400 #888888，名称下方 4px                                                                                                         |
| 关键属性 | 12px 400 #CCCCCC，最多 3 行                                                                                                            |
| 最近提及 | 「最近出现」(11px 400 #888888)，下方 3 条章节链接 (12px 400 #CCCCCC，hover → #F0F0F0 + 下划线)——章节链接不是 AI 元素，不使用 ai-accent |
| 延迟     | hover 300ms 后显示，离开 100ms 后消失                                                                                                  |
| 动画     | opacity 0 → 1，duration-fast (100ms)                                                                                                   |

### 顶部工具栏

| 属性   | 值                   |
| ------ | -------------------- |
| 高度   | 48px                 |
| 内边距 | 0 16px               |
| 背景   | bg-surface (#1A1A1A) |
| 下边框 | 1px #2A2A2A          |

**左侧：实体类型过滤器**

- 4 个 toggle 按钮：角色 / 地点 / 事件 / 物品
- 每个按钮：高 32px，内边距 0 12px，圆角 radius-full，间距 8px
- 激活态：背景 bg-elevated (#1E1E1E)，文字 12px 500 #F0F0F0
- 未激活：背景 transparent，文字 12px 500 #555555
- 每个按钮左侧有对应形状的微型图标 (10px)

**中间：搜索栏**

- 宽度 240px，高度 32px，背景 bg-sunken (#111111)，圆角 radius-md (6px)
- 边框 1px #2A2A2A，focus 态 1px #3A3A3A
- 占位文字「搜索实体…」(12px #555555)
- 匹配时：匹配节点 scale(1.15) + 边框变为 #F0F0F0，非匹配节点 opacity 0.2

**右侧：布局模式切换**

- 3 个图标按钮：力导向 / 层级 / 放射状，每个 28×28px，图标 16px
- 激活态：#F0F0F0，未激活 #888888，hover #CCCCCC
- 间距 4px
- 切换动画：节点平滑过渡到新位置，duration-slow (300ms) easing-default

### 右下角控制区

| 元素                | 规格                                                                                                                                                       |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 缩放控制器          | 垂直排列，「+」按钮 32×32px / 滑块轨道高 80px 宽 4px #2A2A2A / 「−」按钮 32×32px，按钮背景 bg-surface，边框 1px #2A2A2A，圆角 radius-md，图标 16px #888888 |
| 「+ 新建节点」按钮  | 缩放器下方 12px，宽 120px，高 36px，背景 bg-surface (#1A1A1A)，边框 1px #2A2A2A，圆角 radius-md (6px)，文字 12px 500 #F0F0F0                               |
| 「AI 发现关联」按钮 | 同上规格，但文字色 ai-accent (#7AA2F7)，左侧机器人图标 12px ai-accent                                                                                      |

### 右侧详情面板（点击节点后滑出）

- 宽度 360px，从右侧 translateX(360px) → translateX(0) 滑入，duration-slow (300ms) easing-enter
- 内部布局与 Characters 详情页一致：实体名 (text-h1 28px 700 #F0F0F0) + 类型标签 + 属性字段区 + 关联列表 + AI 分析区
- 关联列表每行：40px 高，左侧形状图标 (12px) + 实体名 (14px #F0F0F0) + 关系标签 (12px #888888)，点击跳转到该节点
- 关闭按钮：右上角 × 图标 16px #888888，hover → #F0F0F0

### 交互与状态规范

- **画布操作**：鼠标拖拽平移（cursor: grab / grabbing），滚轮缩放，双指缩放
- **缩放范围**：min 0.1x，max 3x，默认 auto-fit（显示所有节点）
- **节点拖拽**：长按节点 200ms 后可拖拽重新定位，释放后布局微调动画 duration-slow
- **双击节点**：跳转到该实体在稿件中的首次出现位置
- **空态**：画布中心显示「开始写作后，AI 将自动构建知识图谱」(14px #555555) + 节点网络图标 48px #555555
- **加载动画**：节点从中心点向外扩散，opacity 0 → 1，stagger 20ms，duration-slow (300ms)
- **AI 发现关联**：点击后虚线节点/连线淡入 (opacity 0 → 0.6，duration-slow)，每个虚线节点可点击「✓ 确认」或「✕ 忽略」，确认后虚线变实线 (duration-normal 150ms)

---

### ⚙️ 本段设计约束提醒

<aside>
🔒

**本段 Token 合规校验清单（生成后逐项检查）：**

**字体**：全部使用 UI 字体栈（Inter Sans-serif）。页面标题 = text-h1 (28px 700)，节点标签 = text-body-strong (14px 500)，节点描述 = text-body (14px 400)，关系标签 = text-caption (12px 400)，侧边面板字段标签 = text-caption (12px 400)，字段值 = text-body (14px 400)，筛选/搜索 = text-body (14px 400)。禁止衬线体、禁止 Token 外字号。

**色彩**：画布背景 = bg-base (#0D0D0D)。节点配色严格纯灰阶——主角色节点 = #F0F0F0 描边 + #1A1A1A 填充，次要节点 = #888888 描边 + #1A1A1A 填充，关系连线 = #3A3A3A（默认）/ #888888（hover）。**AI 建议节点 = 2px dashed ai-accent (#7AA2F7) 边框**——这是图谱中唯一允许的蓝色。章节链接 = text-secondary (#CCCCCC)，不是 ai-accent。选中节点 = 2px #F0F0F0 实线边框 + bg-elevated (#1E1E1E) 填充（不是 ai-accent）。侧边面板 = bg-surface (#1A1A1A)。

**间距**：画布全屏占满主内容区（无内边距）。侧边面板宽 320px，padding = 20px (space-5)。节点间最小距离由力导向布局自动计算，不手动定义。筛选工具栏高 44px，padding 0 16px (space-4)。

**圆角**：节点 = radius-full（圆形）或 radius-lg (8px)（矩形卡片式）。侧边面板内卡片 = radius-lg (8px)。搜索框 = radius-md (6px)。禁止 16px+ 圆角。

**阴影**：画布节点无阴影（使用描边区分层级）。侧边面板无阴影（使用 1px 边框）。tooltip = shadow-sm。

**动画**：节点 hover 放大 = scale(1.1) duration-fast (100ms)。力导向布局初始化 = duration-slow (300ms)。侧边面板滑入 = duration-slow (300ms) easing-enter。连线 hover 高亮 = duration-fast (100ms)。

**AI 色彩隔离**：ai-accent 仅用于 AI 建议节点的虚线边框。普通节点、选中态、连线、章节链接均不使用蓝色。

</aside>

---

## 第 9 段：Calendar

### ⚙️ 本段设计约束提醒

<aside>
🔒

**本段 Token 合规校验清单（生成后逐项检查）：**

**字体**：全部使用 UI 字体栈（Inter Sans-serif）。月份/年份标题 = text-h1 (28px 700)，日期数字 = text-body (14px 400)，星期标题 = text-caption (12px 500)，事件标题 = text-body-strong (14px 500)，事件时间 = text-caption (12px 400)，时间轴刻度 = text-micro (11px 400)。禁止衬线体、禁止 Token 外字号。

**色彩**：页面背景 = bg-base (#0D0D0D)，日期格子 = bg-surface (#1A1A1A) + hover bg-elevated (#1E1E1E)。事件卡片 = bg-surface + 1px #2A2A2A。截止日标记 = semantic-error (#F87171) 和 semantic-warning (#FBBF24)——红色 = 截止日临近/过期，黄色 = 即将到期。当前时间指示线建议使用中性色（如 text-tertiary #888888 或 text-primary #F0F0F0），避免与截止日语义色冲突。ai-accent (#7AA2F7) **仅用于** AI 建议的写作时间段标记，不可用于日期选中、导航箭头、今日标记等非 AI 元素。今日日期标记 = text-primary (#F0F0F0) + bg-elevated (#1E1E1E)。选中日期 = 2px #F0F0F0 outline（不是 ai-accent）。

**间距**：页面 padding-top 32px (space-8) / bottom 48px (space-12)。日历网格 gutter 必须为 4px 倍数。事件卡片内边距 = 8-12px (space-2~space-3)。月视图日期格子内边距 = 8px (space-2)。最大内容宽 = 1120px。

**圆角**：事件卡片 = radius-sm (4px)。日期格子无圆角或 radius-sm。视图切换按钮 = radius-sm (4px)。禁止 16px+ 圆角。

**阴影**：所有卡片使用边框不使用阴影。tooltip = shadow-sm。

**动画**：月/周视图切换 = duration-slow (300ms) easing-enter。日期 hover = duration-fast (100ms)。事件卡片 hover = duration-normal (150ms)。stagger 进入 = duration-slow (300ms) + 每卡延迟 50ms。

**AI 色彩隔离**：ai-accent 仅标记「AI 建议的写作时间段」——这是日历中唯一的蓝色。导航箭头、今日按钮、日期选中、时间指示线均使用灰阶色，不使用 ai-accent。

</aside>

> 功能性优先，像开发者的日历，不像消费级彩色日历应用。以下所有数值为精确设计规范。

设计日历视图。参考 Linear 日历 + Apple Calendar 月视图的克制风格，不是 Google Calendar 的彩色消费级风格。

### 整体布局

| 区域         | 规格                                | 说明                                     |
| ------------ | ----------------------------------- | ---------------------------------------- |
| 顶部工具栏   | 全宽，高 56px                       | bg-base (#0D0D0D)，下边框 1px #2A2A2A    |
| 日历主区域   | 最大宽度 1120px 居中，两侧 min 32px | bg-base (#0D0D0D)                        |
| 右侧详情面板 | 360px（点击日期后滑出）             | bg-surface (#1A1A1A)，左边框 1px #2A2A2A |

### 顶部工具栏

| 属性                   | 值                                                                                                                                                               |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 高度                   | 56px                                                                                                                                                             |
| 内边距                 | 0 32px，最大宽度 1120px 居中                                                                                                                                     |
| 左侧：当前月份标题     | text-h1 (28px 700 #F0F0F0)，如「2026年 3月」                                                                                                                     |
| 左右箭头               | 标题右侧 12px，两个图标按钮 28×28px，图标 16px #888888，hover → #F0F0F0，间距 4px                                                                                |
| 「今天」按钮           | 箭头右侧 16px，高 28px，内边距 0 12px，背景 bg-elevated (#1E1E1E)，圆角 radius-full，文字 12px 500 #F0F0F0，hover → bg #2A2A2A                                   |
| 右侧：视图切换器       | 分段控制器「月 / 周 / 日」，高 32px，每段内边距 0 12px，text-caption (12px 500)，默认 #888888 bg-transparent，激活 #F0F0F0 bg-elevated (#1E1E1E) radius-sm (4px) |
| 「显示系统事件」复选框 | 切换器左侧 16px，复选框 16×16px (#2A2A2A 边框，勾选后 #F0F0F0 对号，背景 transparent) + 8px + 文字 12px 400 #888888                                              |

### 月视图（默认）

**网格结构：**

| 属性         | 值                                                                                         |
| ------------ | ------------------------------------------------------------------------------------------ |
| 列数         | 7（周一至周日）                                                                            |
| 行数         | 5-6（按当月实际天数）                                                                      |
| 星期标题行   | 高 32px，text-caption (12px 500 #888888)，居中，缩写如「一 / 二 / 三 / 四 / 五 / 六 / 日」 |
| 日期格尺寸   | 均分网格，最小高 120px                                                                     |
| 日期格边框   | 1px #2A2A2A（网格线）                                                                      |
| 日期格背景   | bg-base (#0D0D0D)                                                                          |
| 日期格内边距 | 8px                                                                                        |

**日期数字：**

| 状态       | 规格                                                             |
| ---------- | ---------------------------------------------------------------- |
| 默认       | text-body (14px 500 #F0F0F0)，左上角                             |
| 非当月日期 | 14px 500 #555555                                                 |
| 今天       | 数字居中在 24×24px 圆形 (#F0F0F0)，文字色 text-inverse (#0D0D0D) |
| 选中日期   | 整格背景 bg-elevated (#1E1E1E)，左侧 3px #F0F0F0 竖线            |
| Hover      | 背景 bg-elevated (#1E1E1E)，duration-fast                        |

**事件 Pill（日期格内）：**

| 属性      | 值                                             |
| --------- | ---------------------------------------------- |
| 尺寸      | 宽 100%（格内），高 22px，圆角 radius-sm (4px) |
| 文字      | 11px 400，单行截断，内边距 0 6px               |
| Pill 间距 | 2px                                            |
| 最多显示  | 3 条，超出显示「+N 更多」(11px 400 #888888)    |

**事件类型色彩方案（仅这三种 + 系统事件，不引入更多颜色）：**

| 事件类型           | Pill 背景                 | Pill 文字色 | 左侧圆点 (4px) |
| ------------------ | ------------------------- | ----------- | -------------- |
| 写作会话           | rgba(122, 162, 247, 0.12) | #7AA2F7     | #7AA2F7        |
| 截止日期           | rgba(248, 113, 113, 0.12) | #F87171     | #F87171        |
| 里程碑             | rgba(74, 222, 128, 0.12)  | #4ADE80     | #4ADE80        |
| 系统事件（可隐藏） | rgba(136, 136, 136, 0.08) | #888888     | #555555        |

### 右侧详情面板（点击日期后滑出）

| 属性     | 值                                                                    |
| -------- | --------------------------------------------------------------------- |
| 宽度     | 360px                                                                 |
| 入场动画 | translateX(360px) → translateX(0)，duration-slow (300ms) easing-enter |
| 背景     | bg-surface (#1A1A1A)                                                  |
| 左边框   | 1px #2A2A2A                                                           |
| 内边距   | 16px                                                                  |

**面板内容（从上到下）：**

- **日期标题**：text-h3 (16px 600 #F0F0F0)，如「3月 22日 · 周二」，右侧关闭按钮 × 16px #888888
- **写作概览**：标题下方 16px，卡片形式——bg-elevated (#1E1E1E)，圆角 radius-lg (8px)，内边距 12px
  - 当日字数：20px 700 #F0F0F0，如「1,842 字」
  - 专注时长：12px 400 #888888，如「专注 2h 15m」
- **事件列表**：写作概览下方 16px
  - 每条高度 48px，左侧 4px 圆点（对应事件类型颜色） + 12px + 事件名 (14px 400 #F0F0F0) + 时间 (12px 400 #888888)
  - 条目间分割线 1px #2A2A2A
  - Hover：背景 bg-elevated (#1E1E1E)，duration-fast
- **快速添加输入框**：事件列表下方 16px
  - 高度 36px，背景 bg-sunken (#111111)，边框 1px #2A2A2A，focus 1px #3A3A3A，圆角 radius-md (6px)
  - 占位文字「添加事件…」(12px #555555)
  - 右侧事件类型选择器：下拉按钮 24×24px，显示当前类型圆点色，点击弹出 3 项选择菜单

### 周视图

| 属性           | 值                                                                                                        |
| -------------- | --------------------------------------------------------------------------------------------------------- |
| 结构           | 7 列（周一至周日），每列为一天                                                                            |
| 时间轴         | 左侧，每小时一行，显示 0:00-23:00，text-micro (11px 400 #888888)                                          |
| 行高           | 每小时 60px                                                                                               |
| 事件块         | 按时间范围占据对应高度，背景用事件类型色（同月视图 pill 配色），圆角 radius-sm (4px)，左侧 3px 类型色竖线 |
| 事件块文字     | 12px 400，与 pill 文字色一致，内边距 4px 8px                                                              |
| 当前时间指示线 | 1px #F87171 水平线，左侧 6px 圆点 #F87171，横贯全宽                                                       |

### 日视图

- 单列时间轴，与周视图相同规范但仅显示 1 天
- 左侧时间轴 + 右侧事件块
- 事件块更宽（占据更多水平空间），可显示更多事件详情文字

### 交互与状态规范

- **视图切换动画**：内容 opacity 0 → 1，duration-normal (150ms)
- **月份切换动画**：新月份从切换方向 translateX(±20px) + opacity 0 → translateX(0) + opacity 1，duration-slow (300ms)
- **空态**：日期格内无事件时不显示任何内容（纯净空格）
- **右侧面板空态**：当日无事件时显示「这天没有安排，专注写作吧」(14px #555555)
- **键盘导航**：方向键切换日期，Enter 打开详情面板，Esc 关闭面板
- **拖拽创建事件**（周/日视图）：在时间轴上拖拽创建新事件块，拖拽时显示半透明预览块 (opacity 0.5)，释放后弹出快速编辑输入框
