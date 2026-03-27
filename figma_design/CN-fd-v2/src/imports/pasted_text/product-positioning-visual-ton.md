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
