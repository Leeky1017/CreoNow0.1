# CreoNow 前端 UI/UX 设计完整度审查


> "画龙画虎难画骨。"——设计系统底盘不错，但用户肉眼可见的那一层，有不少断线和占位。本文不靠文档，只靠组件源码反推实际用户体验。

---

## 文件索引

| § | 章节 | 内容 |
|---|------|------|
| 一 | 设计系统底盘 | Token、主题、组件库的实际状态 |
| 二 | 假/占位 UI 清单 | 看起来像功能但实际未接通的部分 |
| 三 | 硬编码 / i18n 遗漏 | 未走 `t()` 的用户可见文案 |
| 四 | 交互断线清单 | 功能存在但用户无法触达的路径 |
| 五 | 写作 IDE 视觉体验 | 编辑器、禅模式、AI 面板的体感判断 |
| 六 | 各模块视觉完整度速查 | 一张表看完所有模块 |
| 七 | v0.1 必修清单 | 按优先级排列的具体修复项 |

---

## 一、设计系统底盘

### 1.1 做对了的部分

| 方向 | 现状 | 证据 |
|------|------|------|
| 语义化 Token | 完整：颜色、排版、间距、阴影、圆角、z-index、动效时长 | `tokens.css` 双主题定义 |
| 深/浅主题 | 完整：`data-theme="dark/light"` + 跟随系统 | `App.tsx` + `index.html` 防闪 |
| Reduced motion | 完整：全局 duration 归零 + animation 降级 | `main.css` + `tokens.css:316` |
| Radix 原语库 | 完整：Button/Dialog/Tooltip/DropdownMenu/ContextMenu/Select/Tabs/Accordion/Toast | `components/primitives/` |
| Lucide 图标 | 统一：CI guard 限制只用 `lucide-react` | `icon-lucide-guard.test.ts` |
| 4px 网格间距 | 完整：`--space-0` 到 `--space-20` | `tokens.css` |
| 编辑器排版 | 优秀：16px/1.8 行高，CJK 1.95，段距 0.75em，三档缩放 | `tokens.css` + `typography.ts` |
| ErrorState 组件 | 丰富：inline/banner/card/fullPage，含重试 | `patterns/ErrorState.tsx` |
| LoadingState 组件 | 丰富：spinner/skeleton/progress，含延迟显示防闪 | `patterns/LoadingState.tsx` + `useDeferredLoading.ts` |
| EmptyState 组件 | 双套存在：`patterns/` + `composites/` | 覆盖主要场景 |

### 1.2 实现与设计稿的漂移

| 问题 | 现象 | 影响 |
|------|------|------|
| 字体未按设计加载 | `tokens.css` 指定 Inter/Lora/JetBrains Mono，但 `fonts.css` 在 `main.css` 中后引入，覆盖为 `ui-serif`/`ui-monospace` 系统回退 | 跨平台字体表现不统一，与设计稿不符 |
| Token 源文件不同步 | `design/system/01-tokens.css` 与 `renderer/src/styles/tokens.css` 内容不同（生产版多 Zen/overlay/faction 等） | 设计侧无法作为单一真相源 |
| Storybook 硬编码颜色 | `SearchPanel.stories.tsx`、`CommandPalette.stories.tsx` 等使用 `#080808`、`#121212` | Story 不反映真实 token 效果 |

---

## 二、假/占位 UI 清单

> 这些是 v0.1 最危险的部分——用户看到了"功能界面"，但点击后发现是空的。

| 位置 | 用户看到什么 | 实际状态 | 时序 |
|------|------------|----------|------|
| **Toast 系统** | 什么都看不到 | `Toast.tsx` 完整实现，但 `App.tsx` **未挂载** `ToastProvider` / `ToastViewport`，全应用无 Toast 能力 | 先做 |
| **AI Chat History** | 下拉面板含搜索框 | 搜索框 `disabled`（`opacity-50 cursor-not-allowed`），注释写明 `chat persistence is not yet implemented (P1 scope)` | 先做 |
| **Settings → Account** | Edit Profile / Upgrade / Delete Account 按钮 | 全部 `disabled` 或 TODO 空实现 | 再做 |
| **Settings → General** | 语言、写作体验、数据存储、编辑器默认值 | 组件内 state 仅本地，**不写入 preferences**，刷新即丢 | 先做 |
| **Settings → Export** | 组件存在 | `SettingsExport.tsx` 实现完毕但**未接入 Settings 导航**，用户找不到 | 再做 |
| **Search → "Search All Projects"** | 按钮 | 无 `onClick`，点击无反应 | 再做 |
| **Search → "View More"** | 按钮 | 无 `onClick`，点击无反应 | 再做 |
| **Search → Memory/Knowledge 结果** | 可点击的搜索结果卡片 | `handleItemClick` 仅处理 `type === "document"`，其余类型点击只关闭面板不跳转 | 再做 |
| **搜索时间** | "搜索耗时 0.04s" | `time: "0.04s"` 硬编码固定值 | 再做 |
| **版本恢复** | Preview 里 "Restore" 按钮 | `disabled`，无恢复逻辑 | 再做 |
| **版本字数变化** | 版本卡片上的字数统计 | `wordChange: { type: "none", count: 0 }` 仍为 TODO | 后做 |
| **备份** | 设置页有 `backupInterval` 选项 | 无后端调度/写盘/恢复实现 | 先做（已在 05 中记录） |
| **RightPanel ChatHistory** | 选择历史会话 | 仅 `console.info`，未加载聊天内容 | 再做 |

---

## 三、硬编码 / i18n 遗漏

> 以下是组件源码中直接写死的用户可见文案，切换语言后会露底。

### 3.1 编辑器区域

| 文件 | 硬编码内容 | 类型 |
|------|-----------|------|
| `EditorPane.tsx:400` | `"Entity suggestions unavailable."` | 英文硬编码 |
| `EditorPane.tsx:616` | `"This document is final. Editing will switch it back to draft. Continue?"` | 英文 confirm 对话框 |
| `EditorContextMenu.tsx:263` | `"AI"` | 标签 |
| `slashCommands.ts` | `/续写`、`/描写`、`/对白`、`/角色`、`/大纲`、`/搜索` 的 label 与 description 全部中文硬编码 | 全量 |

### 3.2 版本历史

| 文件 | 硬编码内容 |
|------|-----------|
| `VersionHistoryContainer.tsx` | `"You"` / `"AI"` / `"Auto"` / `"Unknown"`（作者名） |
| `VersionHistoryContainer.tsx` | `"Just now"` / `"Xm ago"` / `"Today"` / `"Yesterday"` / `"Earlier"`（时间分组） |
| `VersionHistoryContainer.tsx` | `"Loading versions..."`（加载提示） |
| `VersionHistoryPanel.tsx:372` | `"Restore"` / `"Compare"` / `"Preview"`（Hover 操作 Tooltip） |
| `useVersionCompare.ts:73,77` | `"No differences found."` / `"Unknown error"` |

### 3.3 AI 面板

| 文件 | 硬编码内容 |
|------|-----------|
| `AiPanel.tsx` | `formatDbErrorDescription` 中 `" Then restart the app."` |
| `AiPanel.tsx CodeBlock` | `props.language \|\| "code"` |
| `AiPanel PanelContainer` | `title="AI"` |

---

## 四、交互断线清单

> 功能在代码中存在，但用户当前无法触达。

| 断线 | 代码位置 | 用户影响 |
|------|----------|----------|
| **Toast 无法触发** | `Toast.tsx` 完整但 `App.tsx` 无 Provider | 保存、导出、AI 完成等无即时反馈 |
| **InlineDiffExtension 未注册** | `extensions/inlineDiff.ts` 存在但未在 `EditorPane` 的 `useEditor({ extensions })` 中引入 | 行内 diff 装饰无法工作 |
| **BubbleMenu Link 固定 URL** | `EditorBubbleMenu.tsx` 中 `toggleLink` 使用 `href: "https://example.com"` | 用户无法设置自定义链接 |
| **Character 章节跳转** | `CharacterPanelContainer.tsx` 未传入 `onNavigateToChapter` | 角色详情页的"出场章节"链接点击无反应 |
| **快捷键面板无入口** | `ShortcutsPanel.tsx` 完整实现但未接入 Settings 或帮助菜单 | 用户无法查看完整快捷键列表 |
| **SettingsExport 未接入** | `SettingsExport.tsx` 存在但 `SettingsDialog.tsx` 导航中无此 Tab | 用户找不到导出设置 |

---

## 五、写作 IDE 视觉体验

### 5.1 编辑区（EditorPane）

**已做好：**
- TipTap 编辑器 + ScrollArea，含内边距
- 工具栏：行内格式 + 块级格式 + 历史，溢出有 More 菜单
- BubbleMenu：选中文本后浮现格式 + AI 快捷操作
- SlashCommand：`/` 触发命令面板
- EntityCompletion：`@` 触发实体补全
- WriteButton：右下角"续写"浮动按钮
- 大粘贴分块处理 + 容量警告
- 版本预览模式 + 定稿模式

**缺失：**
- 无链接编辑弹窗（只能插入固定 URL）
- 无图片插入/管理
- 无表格支持（TipTap 可扩展）
- InlineDiff 扩展未启用

### 5.2 禅模式（ZenMode）

**现状：** 全屏深色背景 + 静态段落展示 + 假光标闪烁 + hover 退出按钮。

**根本问题：** 无编辑能力。进入后只能看，不能写。（已记录在 01 中）

### 5.3 AI 面板（AiPanel）

**已做好：**
- 多模式输入：textarea + 选择引用 + Mode/Model/Skill 工具栏
- 流式输出 + 打字光标动画
- 多候选支持 + Judge 评分
- DiffView：双列行号 + 颜色区分
- Apply / Reject / Back to Diff 流程完整
- 错误引导卡片（DB 错误、Provider 错误）

**缺失：**
- Chat History 仅占位
- AiInlineConfirm 未接入主流程
- Usage 统计（tokens/成本）对非技术用户可能费解

### 5.4 Knowledge Graph

**已做好且超出预期：**
- 三种视图：力导向图 / 时间线 / 列表
- 实体/关系 CRUD 完整
- 节点拖拽、缩放平移、类型过滤、选中详情
- 编辑对话框字段齐全

### 5.5 角色管理（Character）

**已做好：**
- 分组列表（主角/配角/其他）
- 丰富档案字段（年龄、星座、原型、特征、性格等）
- 关系管理 + 出场章节

**断线：** 出场章节的跳转回调未接通。

### 5.6 记忆系统（Memory）

**已做好：**
- Global/Project 切换
- 规则 Confirm/Modify/Delete
- 手动添加规则
- 暂停/恢复学习

**不足：** 冲突仅显示数量，无进入解决流程的入口。

### 5.7 大纲面板（Outline）

**已做好且完整：**
- H1/H2/H3 层级、展开/折叠、搜索、字数
- 拖拽排序、多选批量删除、重命名
- 与编辑器滚动同步

### 5.8 搜索面板（Search）

**已做好：**
- 全文搜索 IPC 链路打通
- 分类过滤 + 语义搜索 Toggle
- 文档结果可点击跳转并高亮

**占位/断线：** Search All Projects 和 View More 按钮无实现；Memory/Knowledge 结果不可跳转。

### 5.9 Dashboard

**已做好：**
- Hero 大卡 + 项目网格 + 搜索过滤 + 归档折叠
- 空状态 + 错误状态完整

**缺失：** 无模板入口、无最近文件独立区块。

### 5.10 Onboarding

**已做好：** 三步向导（语言 → AI 配置 → 打开文件夹），进度指示完整。

### 5.11 命令面板（Command Palette）

**已做好且完整：** 搜索过滤、键盘导航、分组、最近使用。

### 5.12 文件树（FileTree）

**已做好且完整：** 树形结构、拖拽排序、右键菜单、新建章节/笔记、键盘导航。

---

## 六、各模块视觉完整度速查

| 模块 | 完整度 | 真实可用 | 关键问题 |
|------|--------|----------|----------|
| 编辑器主体 | ✅ 完整 | ✅ | 无链接编辑弹窗，InlineDiff 未启用 |
| 编辑器工具栏 | ✅ 完整 | ✅ | — |
| BubbleMenu | ✅ 完整 | ⚠️ | Link 固定 URL |
| Slash 命令 | ✅ 完整 | ✅ | 全量硬编码中文 |
| Entity 补全 | ✅ 完整 | ✅ | 展示朴素 |
| 续写按钮 | ✅ 完整 | ✅ | — |
| 禅模式 | ✅ 好看 | ❌ 不可编辑 | 先做（A0-01） |
| AI 面板 | ✅ 完整 | ✅ | ChatHistory 占位 |
| DiffView | ✅ 完整 | ✅ | — |
| 知识图谱 | ✅ 超出预期 | ✅ | — |
| 角色管理 | ✅ 完整 | ⚠️ | 章节跳转断线 |
| 记忆面板 | ✅ 完整 | ✅ | 冲突无解决入口 |
| 大纲面板 | ✅ 完整 | ✅ | — |
| 搜索面板 | ⚠️ 部分 | ⚠️ | 占位按钮多 |
| Dashboard | ✅ 完整 | ✅ | 无模板 |
| Onboarding | ✅ 完整 | ✅ | — |
| 命令面板 | ✅ 完整 | ✅ | — |
| 文件树 | ✅ 完整 | ✅ | — |
| 设置页 | ⚠️ 部分 | ⚠️ | General 不持久化，Account 占位，Export 未接入 |
| Toast | ✅ 实现 | ❌ 未接入 | 先做（A0-13） |
| 状态栏 | ✅ 完整 | ✅ | 无 AI 运行状态 |
| 窗口标题栏 | ✅ 完整 | ✅ | — |
| 快捷键面板 | ✅ 实现 | ❌ 无入口 | 再做（A1-10） |

---

## 七、v0.1 必修清单

### 7.1 先做：不修就是"产品在说谎"

| ID | 问题 | 修复方向 |
|----|------|----------|
| U0-01 | Toast 未接入 App | 在 `App.tsx` 挂载 `ToastProvider` + `ToastViewport`，梳理关键场景（保存、导出、AI、错误）接入 `useToast` |
| U0-02 | Settings General 不持久化 | 将 state 写入 preferences store，确保设置重启后保留 |
| U0-03 | Chat History 占位 | 要么实现持久化，要么将入口降级/隐藏，不展示空壳 |
| U0-04 | 搜索占位按钮 | 隐藏或 disable "Search All Projects" / "View More"，直到实现 |
| U0-05 | Settings Account 占位 | 隐藏整个 Tab 或标注 "Coming Soon"，不展示无功能按钮 |

### 7.2 再做：不修会让人感到粗糙

| ID | 问题 | 修复方向 |
|----|------|----------|
| U1-01 | 字体未按设计加载 | 决定方案：要么在应用内加载 Inter/Lora/JetBrains Mono，要么更新设计规范以系统字体为准 |
| U1-02 | 版本历史 i18n 遗漏 | 将 `getAuthorName`、`formatTimestamp`、`getTimeGroupLabel`、Hover Tooltip 走 `t()` |
| U1-03 | Slash 命令 i18n 遗漏 | 将 `slashCommands.ts` 全量 label/description 走 `t()` |
| U1-04 | EditorPane 硬编码 | 将 Entity 提示和定稿确认走 `t()` |
| U1-05 | BubbleMenu Link 固定 URL | 添加链接编辑弹窗（URL 输入 + 确认） |
| U1-06 | Character 章节跳转断线 | 在 `CharacterPanelContainer` 传入 `onNavigateToChapter` |
| U1-07 | 快捷键面板无入口 | 在 Settings 或帮助菜单中接入 `ShortcutsPanel` |
| U1-08 | SettingsExport 未接入 | 在 Settings 导航中添加 Export Tab |
| U1-09 | Token 源文件同步 | 建立 `tokens.css` 单一真相源，`design/system/` 由其生成或同步 |
| U1-10 | InlineDiffExtension 注册 | 在 `EditorPane` 的 `useEditor({ extensions })` 中引入 |
| U1-11 | Search Memory/Knowledge 跳转 | 实现非 document 类型结果的跳转 |
| U1-12 | 搜索时间真实化 | 传入实际搜索耗时替代硬编码 |
| U1-13 | 版本恢复启用 | 启用 Preview Restore 按钮逻辑 |
| U1-14 | 两套 EmptyState 统一 | 合并 `patterns/EmptyState` 与 `composites/EmptyState` |

### 7.3 后做：做好了才有竞争力

| ID | 问题 | 修复方向 |
|----|------|----------|
| U2-01 | AI 状态栏指示 | StatusBar 增加 AI 运行状态 |
| U2-02 | 颜色对比度审计 | 自动化对比度检查 |
| U2-03 | Motion 设计语言统一 | 文档化 motion 规范，统一 `motion-safe:` 使用 |
| U2-04 | Entity Completion 增强 | 添加类型图标和分组 |
| U2-05 | Memory 冲突解决入口 | 提供冲突列表和解决流程 |
| U2-06 | AI Usage 统计人性化 | 为非技术用户提供更直觉的表述 |
| U2-07 | Dashboard 模板入口 | 新建项目时提供模板画廊 |
| U2-08 | Storybook 硬编码颜色 | 替换为 Design Token |
| U2-09 | 版本字数变化 | 实现 `wordChange` 统计 |

---

> 设计系统的底盘比许多同阶段产品都好：Token 齐全、双主题、Reduced motion、Radix 原语、CI guard。但**"好底盘"和"好体验"之间还差最后一步**：把 Toast 接上、把占位 UI 收口、把硬编码文案走完 i18n、把断线的交互链路接通。这一步不需要重构，只需要"最后一公里的诚实"。
