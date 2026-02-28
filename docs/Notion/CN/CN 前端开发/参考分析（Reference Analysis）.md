# 参考分析（Reference Analysis）

> Source: Notion local DB page `98276bf9-13d9-47ee-8b88-7ec804e76e74`

> 🎯

逆向拆解标杆产品，提取可迁移的设计模式。 不是抄界面，而是理解"为什么这样做"。

## 标杆产品

### Notion — 编辑器体验的天花板

值得学习的：

- Block 系统的视觉一致性 — 每一个 block 的 spacing、typography、hover state、transition timing 都遵循同一套数学关系

- 极度克制的颜色使用 — 主界面几乎只有黑白灰 + 一个强调色，信息层级靠字重和间距区分而非颜色

- 微交互的精准度 — 拖拽时阴影升起 + 轻微缩放；Slash command 的 subtle fade-in + slide-up；侧边栏折叠的内容淡出 → 宽度收缩时差编排

- Cmd+K 的即时响应感 — 弹出速度 <100ms，输入无延迟

- 编辑器 + 数据库的统一体验 — 切换无割裂感

CN 可以借鉴的：

- Block 间距系统（Notion 的 4px grid 极为严格）

- Slash command / Command Palette 的交互节奏

- 侧边栏折叠的动画编排方式

不需要学的：

- Notion 的多人协作实时同步机制（CN 是单机写作 IDE）

- Notion 的数据库系统复杂度

---

### Cursor — IDE 中 AI 集成的标杆

值得学习的：

- 在 VS Code 基础上做极度克制的增量改动 — 每一处都不破坏整体节奏，这是"演进式设计"的典范

- AI 交互感觉原生 — 不像是"粘"上去的功能，而是编辑器的自然延伸

- 内联 AI 补全的视觉处理 — 灰色 ghost text + 淡入动画，不打断写作节奏

- 多面板布局稳定性 — 侧边栏、终端、编辑区的空间分配非常稳定

CN 可以借鉴的：

- AI 补全/建议的视觉处理方式（ghost text 而非弹窗）

- 面板布局的稳定性原则——编辑区永远不被意外压缩

- AI 面板与主编辑区的空间关系

---

### Linear — 极致的交互性能

值得学习的：

- 响应速度 — 所有操作都在 <50ms 内响应，给用户"直接操作"的错觉

- 动画的物理感 — 弹簧动画（spring physics）而非线性过渡

- 键盘优先 — 几乎所有操作都可以纯键盘完成

- 极简的视觉设计 — 大量留白，信息密度恰到好处

CN 可以借鉴的：

- 交互响应速度目标：<100ms

- 键盘快捷键体系的设计思路

- 动画的弹簧物理模型（如果未来引入 framer-motion）

---

## 直接竞品：写作工具

> CN 是写作 IDE，上面三个标杆是“通用工具”参考，以下四个才是直接竞品——它们和 CN 争夺同一批用户。

### iA Writer — 纯粹写作体验的极致

产品定位： 极简主义 Markdown 编辑器，“少即是多”的设计哲学。

值得学习的：

- Typography 极致 — 自研 iA Writer Duo / Quattro 字体，字号阶梯仅 3 级（标题/正文/脚注），行高 1.5-1.7，每个参数都经过可读性研究验证

- Focus Mode — 只高亮当前句子/段落，其余淡化为 30% 透明度，这是“沉浸式写作”的标杆实现

- 零 UI 干扰 — 无工具栏、无侧边栏、无颜色、无装饰；用户打开就直接写

- 字数统计的克制展示 — 状态栏仅显示字数/阅读时间，不用进度条或贮家感设计

CN 可以借鉴的：

- ZenMode 应该对标 iA Writer 的 Focus Mode，而不是只是“隐藏侧边栏”

- Typography Token 的行高/字重设定可参考 iA 的研究数据

- 编辑区的默认状态应该是“干净”的，而不是“功能丰富”的

CN 的优势：

- iA Writer 无 AI 能力、无知识图谱、无人物管理——这些是 CN 的差异化护城河

---

### Ulysses — 长篇写作的项目管理

产品定位： 面向长篇写作的 Markdown 编辑器 + 项目管理器。

值得学习的：

- Library → Group → Sheet 三层结构 — 文件组织很符合写作者心智模型（书 → 章节 → 片段）

- 无缝拼接导出 — 多个 Sheet 可以按顺序拼接为一个完整文档导出（ePub / PDF / DOCX）

- 写作目标系统 — 可设定字数/截止日期目标，状态栏显示进度

- iCloud 同步 — Mac / iPad / iPhone 无缝切换

CN 可以借鉴的：

- 文件树的组织方式可参考 Ulysses 的“书 → 章节 → 片段”模型

- 导出功能应该支持多片段拼接（CN 已有 ExportDialog，但拼接能力未知）

- 写作目标/进度追踪是写作工具的标配功能

CN 的优势：

- Ulysses 的 AI 集成极为浅层（仅基础纠错），CN 的 AI 协作深度远超

- Ulysses 无知识图谱、无人物关系网络

---

### Scrivener — 小说家的专业工具

产品定位： 专业级长篇写作工具，功能极其丰富但界面老旧。

值得学习的：

- Binder（活页夹） — 左侧树状结构可拖拽重排，每个节点可以是场景/章节/研究资料

- Corkboard 视图 — 每个场景变成一张索引卡，可在软木板上拖拽重排，这是“视觉化情节规划”的经典交互

- Research 文件夹 — 可以在项目内存放参考图片、PDF、网页截图，写作时并排查看

- Compile（编译导出） — 极其强大的导出系统，可定义复杂的排版规则

- Snapshots — 每次重大修改前可保存快照，类似简化版的 Git

CN 可以借鉴的：

- Corkboard 概念 — CN 的 KnowledgeGraph 可以借鉴这种“视觉化情节结构”的交互模式

- Research 并排查看 — 写作时能同时查看参考资料是专业写作工具的刚需

- Snapshots — CN 已有 VersionHistoryPanel，可以对标 Scrivener 的快照体验

CN 的优势：

- Scrivener 的 UI 停留在 2010 年代，视觉设计极其过时——这是 CN 最大的体验差异化机会

- Scrivener 零 AI 能力，零知识图谱

- Scrivener 的学习曲线极陡，CN 应该追求“开箱可用”

---

### Obsidian — 知识图谱 + Markdown 编辑器

产品定位： 本地优先的 Markdown 知识管理工具，插件生态极其丰富。

值得学习的：

- Graph View — 知识图谱的视觉化标杆，节点大小反映链接数，拖拽流畅，缩放自然

- 双向链接 — [[wikilink]] 语法即时创建双向关联，无需手动维护

- Canvas — 自由画布上摆放笔记、图片、链接，用线条连接，类似无限白板

- 插件系统 — 社区插件 2000+，覆盖几乎所有需求

- 本地优先 — 所有数据存储在本地 .md 文件，用户完全掌控

CN 可以借鉴的：

- KnowledgeGraph 对标 Graph View — CN 已有 KnowledgeGraph.tsx，应该对标 Obsidian 的交互流畅度（拖拽手感、缩放平滑度、节点 hover 信息）

- 双向链接体验 — 写作时快速建立人物/场景/线索之间的关联

- Canvas 概念 — 用于情节规划和世界观构建的自由画布

CN 的优势：

- Obsidian 的富文本编辑体验远不如 TipTap/ProseMirror 驱动的编辑器

- Obsidian 的 AI 集成依赖第三方插件，体验碎片化

- Obsidian 面向“笔记”而非“创作”，CN 的人物系统 / Memory 系统是写作工具的独特价值

---

## 竞品综合对比

| 维度 | iA Writer | Ulysses | Scrivener | Obsidian | CN |
| --- | --- | --- | --- | --- | --- |
| 核心场景 | 纯粹写作 | 长篇 + 管理 | 小说/剧本 | 知识管理 | AI 协作写作 |
| AI 集成 | ❌ 无 | ⚠️ 浅层 | ❌ 无 | ⚠️ 插件 | ✅ 深度原生 |
| 知识图谱 | ❌ | ❌ | ❌ | ✅ Graph View | ✅ KG + 人物网络 |
| 人物/角色管理 | ❌ | ❌ | ✅ Character Sheet | ❌ | ✅ + AI 理解 |
| Memory 系统 | ❌ | ❌ | ❌ | ❌ | ✅ 独家 |
| 沿浸式写作 | ⭐ 标杆 | ✅ 良好 | ⚠️ 一般 | ⚠️ 一般 | 目标：⭐ |
| 视觉设计 | ⭐ 极简优雅 | ✅ 现代 | ❌ 过时 | ✅ 可主题 | 目标：⭐ |
| 技术架构 | 原生 AppKit | 原生 AppKit | 原生 AppKit | Electron | Electron |

### CN 的竞争位置

> 🎯

CN 的独特价值主张： 把 iA Writer 级别的沿浸式写作体验，与 Scrivener 级别的项目管理能力，通过原生 AI 协作统一在一个现代化的界面里。这是任何现有工具都未实现的组合。

要达到这个目标，前端必须解决：

1. 编辑区体验达到 iA Writer 水准 — Typography Token、行高、Focus Mode 的极致打磨

1. 面板稳定性达到 Cursor 水准 — AppShell 拆分后编辑区永远不被压缩

1. KG 交互达到 Obsidian 水准 — 拖拽手感、缩放平滑、hover 信息

1. 响应速度达到 Linear 水准 — 所有操作 <100ms

---

## 逆向分析方法论

当需要分析一个标杆产品时，使用以下步骤：

### 1. 截图标注法

对标杆产品的每个核心界面截图，用标注工具标出：

- 间距数值（padding、margin、gap）

- 字号和字重

- 颜色值（前景、背景、边框）

- 圆角大小

- 阴影参数

### 2. 交互录屏法

录制标杆产品的核心交互，逐帧分析：

- 动画持续时间（Chrome DevTools → Performance → Screenshots）

- Easing 曲线

- 多属性动画的时差编排

### 3. Token 逆向

从截图中提取出 Token 系统：

- 这个产品用了多少种灰色？

- 间距只有哪几个值？

- 字号阶梯是什么？

### 4. 差异对比

将逆向得到的 Token 与 CN 当前的 Token 对比：

- 哪些维度 CN 缺失？

- 哪些维度 CN 已有但不够精确？

- 哪些维度 CN 做得更好？

---

## CN 差异化定位

> CreoNow 不是 Notion，也不是 Cursor。它是写作者的 IDE。

| 维度 | Notion | Cursor | CreoNow |
| --- | --- | --- | --- |
| 核心用户 | 知识工作者 | 程序员 | 文字创作者 |
| 编辑器核心 | Block Editor | Code Editor | Rich Text + AI 协作 |
| AI 角色 | 辅助工具 | 编程伙伴 | 创作伙伴 |
| 空间隐喻 | 文档/数据库 | 代码工作区 | 写作工作台 |
| 关键体验 | 组织信息 | 写代码更快 | 沉浸式创作 Flow |

CN 应该从 Notion 学编辑器的优雅，从 Cursor 学 AI 集成的自然，从 Linear 学交互的速度感。但最终，CN 的核心差异化在于——为长篇创作者提供沉浸式的 Flow State 环境。
