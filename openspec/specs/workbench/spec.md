# Workbench Specification


## Purpose

应用 UI 外壳：布局系统、Surface 注册与路由、命令面板、面板管理、设置对话框、主题切换。定义用户与 IDE 交互的整体框架。

### Scope

| Layer      | Path                                                                                                                                                                                                                                                           |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend   | `renderer/src/components/layout/`, `renderer/src/surfaces/`, `renderer/src/features/commandPalette/`, `renderer/src/features/rightpanel/`, `renderer/src/features/settings/`, `renderer/src/features/settings-dialog/`, `renderer/src/features/quality-gates/` |
| Store      | `renderer/src/stores/layoutStore.tsx`, `renderer/src/stores/themeStore.tsx`                                                                                                                                                                                    |
| Components | `renderer/src/components/primitives/`, `renderer/src/components/patterns/`                                                                                                                                                                                     |

## Requirements

### Requirement: 整体布局架构

系统**必须**采用三栏布局架构（Icon Bar + Left Sidebar + Main Content + Right Panel），遵循 `DESIGN_DECISIONS.md` §1.1 定义的布局结构。

布局结构：

```
+----+----------+---------------------------------+-------------------+
| I  |  Left    |         Main Content            |   Right Panel     |
| c  |  Sidebar |         (Editor)                |   (AI/Info)       |
| o  |          |                                 |                   |
| n  |  可拖拽   |                                 |   可拖拽           |
|    |  <->     |                                 |   <->             |
| B  |          |                                 |                   |
| a  |          +---------------------------------+                   |
| r  |          |         底部状态栏               |                   |
+----+----------+---------------------------------+-------------------+
```

布局**必须**满足以下约束：

- 窗口高度固定为 `100vh`，**禁止**整个页面滚动
- 主容器使用 `flex-direction: column`，内容区域使用 `flex: 1; min-height: 0`
- 左侧栏、主内容区、右侧面板各自独立滚动（`overflow-y: auto`）
- 状态栏固定在底部（`height: 28px; flex-shrink: 0`）
- 最小窗口宽度 1024px，最小窗口高度 640px
- 主内容区最小宽度 400px

布局组件（`AppShell`）**必须**有 Storybook Story，覆盖：三栏全展开态、左侧栏折叠态、右侧面板折叠态、双侧均折叠态。

#### Scenario: 应用启动时加载默认布局

- **假设** 用户首次启动应用（无持久化布局偏好）
- **当** 应用主窗口渲染
- **则** Icon Bar 宽 48px，Left Sidebar 宽 240px，Right Panel 宽 320px
- **并且** 状态栏固定在底部，高 28px
- **并且** 主内容区占据剩余宽度

#### Scenario: 应用启动时恢复用户布局偏好

- **假设** 用户之前将左侧栏调整为 300px 并折叠了右侧面板
- **当** 应用再次启动
- **则** 系统从 Preference Store 读取布局偏好（`creonow.layout.*`）
- **并且** 左侧栏宽度恢复为 300px，右侧面板处于折叠状态
- **并且** 主内容区自动填充剩余空间

#### Scenario: 窗口缩小到最小宽度时的布局行为

- **假设** 应用窗口正在被用户拖拽缩小
- **当** 窗口宽度接近 1024px 最小值
- **则** Electron 阻止窗口继续缩小
- **并且** 主内容区宽度不低于 400px

---

### Requirement: Icon Bar（图标栏）

系统**必须**渲染一个固定在最左侧的 Icon Bar，宽度 48px，不可调整。

Icon Bar 当前实现入口按以下固定顺序排列（遵循 `DESIGN_DECISIONS.md` §9.1）：

| 位置     | ID           | 图标   | 说明           |
| -------- | ------------ | ------ | -------------- |
| 顶部 1   | `files`      | 文件夹 | 文件树（默认） |
| 顶部 2   | `search`     | 搜索   | 搜索           |
| 顶部 3   | `outline`    | 列表   | 大纲           |
| 顶部 4   | `versionHistory` | 历史   | 历史版本       |
| 顶部 5   | `memory`     | 记忆   | 记忆面板       |
| 顶部 6   | `characters` | 人物   | 角色管理       |
| 顶部 7   | `knowledgeGraph` | 节点图 | 知识图谱       |
| 底部固定 | `settings`   | 齿轮   | 设置           |

`media` 入口保留为未来能力（`[FUTURE]`），当前不计入实现入口顺序校验；能力上线后再并入当前序列。

图标规格：

- 图标尺寸 24px，按钮区域 40×40px，居中对齐（flexbox）
- 当前激活项**必须**有左侧 2px 白色指示条（`--color-accent`）
- 悬停反馈：`background: var(--color-bg-hover)`，过渡 `var(--duration-fast)`
- 所有按钮**必须**有 `aria-label` 属性

点击 Icon Bar 中当前已激活的图标**必须**切换左侧 Sidebar 的折叠/展开状态。点击未激活的图标**必须**切换到对应面板并展开 Sidebar。

Icon Bar 组件**必须**有 Storybook Story，覆盖：默认态（files 激活）、其他面板激活态、悬停态。

#### Scenario: 用户切换左侧面板

- **假设** 当前 Icon Bar 激活项为 `files`，左侧 Sidebar 展开
- **当** 用户点击 `knowledgeGraph` 图标
- **则** Icon Bar 的激活指示条移动到 `knowledgeGraph` 位置
- **并且** 左侧 Sidebar 内容切换为知识图谱面板

#### Scenario: 点击当前激活图标折叠 Sidebar

- **假设** 当前 Icon Bar 激活项为 `files`，左侧 Sidebar 展开
- **当** 用户再次点击 `files` 图标
- **则** 左侧 Sidebar 折叠，仅保留 Icon Bar（48px）
- **并且** 主内容区扩展填充释放的空间
- **并且** 折叠状态持久化到 Preference Store（`creonow.layout.sidebarCollapsed`）

#### Scenario: 键盘快捷键折叠 Sidebar

- **假设** 左侧 Sidebar 处于展开状态
- **当** 用户按下 `Cmd/Ctrl+\`
- **则** 左侧 Sidebar 折叠
- **当** 用户再次按下 `Cmd/Ctrl+\`
- **则** 左侧 Sidebar 恢复展开

---

### Requirement: 左侧 Sidebar 面板

左侧 Sidebar**必须**支持拖拽调整宽度，遵循 `DESIGN_DECISIONS.md` §2.2 和 §2.4 规范。

| 属性     | 值    |
| -------- | ----- |
| 默认宽度 | 240px |
| 最小宽度 | 180px |
| 最大宽度 | 400px |

拖拽手柄规格：

- 可点击区域 8px 宽，可见分割线 1px（`--color-separator`）
- 悬停时分割线变为 2px 高亮 + `cursor: col-resize`
- 拖拽中实时更新布局
- 双击手柄恢复默认宽度（240px）
- 释放后持久化用户偏好（`creonow.layout.sidebarWidth`）

Sidebar 内容由 Icon Bar 的激活项决定，每个面板为独立的 React 组件，通过 `activePanel` 状态切换渲染。

当前激活的左侧面板**必须**持久化到 `creonow.layout.activeLeftPanel`，应用重启后恢复上次选择。若持久化值非法，回退默认值 `files`。

#### Scenario: 用户拖拽调整 Sidebar 宽度

- **假设** 左侧 Sidebar 当前宽度 240px
- **当** 用户拖拽右侧分割线向右移动 60px
- **则** Sidebar 宽度变为 300px，主内容区同步收缩
- **并且** 宽度值持久化到 Preference Store

#### Scenario: 拖拽到最小宽度限制

- **假设** 用户正在向左拖拽 Sidebar 分割线
- **当** 宽度减小到 180px
- **则** 分割线停止响应继续向左拖拽
- **并且** Sidebar 保持 180px 最小宽度

#### Scenario: 双击分割线恢复默认宽度

- **假设** 用户之前将 Sidebar 宽度调整为 350px
- **当** 用户双击分割线
- **则** Sidebar 宽度动画恢复到 240px（过渡 `var(--duration-slow)`）

---

### Requirement: 右侧面板（AI 面板 / Info 面板 / Quality 面板）

右侧面板**必须**包含三个标签页：**AI 面板**、**Info 面板**和 **Quality 面板**，通过顶部标签切换。

| 属性     | 值      |
| -------- | ------- |
| 默认宽度 | 320px   |
| 最小宽度 | 280px   |
| 最大宽度 | 480px   |
| 默认显示 | AI 面板 |

**AI 面板**：

- 对话交互区：展示用户与 AI 的对话历史
- 技能按钮区：展示可用技能（由 Skill System 提供）
- AI 建议展示区：展示 AI 生成的内容
- 顶部 tab bar 右侧提供 `History` 与 `New Chat` 动作入口（仅在 `activeRightPanel === "ai"` 显示）
- `History` 与 `New Chat` 按钮触达区域不小于 24×24px
- 主交互区不展示 candidateCount（`1x`）循环按钮；候选数能力保留在持久化/运行参数链路中
- 通过 `Cmd/Ctrl+L` 打开/关闭

**Info 面板**：

- 展示当前编辑器中打开文件的元信息（文档名称、字数统计、创建时间、修改时间、文档状态）

右侧面板**不放置**知识图谱、记忆面板等功能——这些功能统一在左侧栏管理。

右侧面板支持完全折叠（隐藏，宽度 0px），通过面板折叠按钮或 `Cmd/Ctrl+L` 切换。

右侧面板拖拽规范与左侧 Sidebar 一致（§2.4），宽度持久化到 `creonow.layout.panelWidth`。

AI 面板和 Info 面板**必须**各有 Storybook Story，覆盖默认态、空态、加载态、错误态。

#### Scenario: 用户切换右侧面板标签

- **假设** 右侧面板当前显示 AI 面板
- **当** 用户点击顶部的「信息」标签
- **则** 面板内容切换为 Info 面板，展示当前文档元信息
- **并且** 活动标签状态持久化到 `creonow.layout.activePanelTab`

#### Scenario: AI 激活时显示 History/New Chat 动作入口

- **假设** `activeRightPanel === "ai"`
- **当** 用户查看 RightPanel 顶部 tab bar
- **则** 右侧动作区显示 `History` 与 `New Chat` 按钮
- **并且** 两个按钮触达区域不小于 24×24px

#### Scenario: 非 AI 面板时隐藏 AI 动作入口

- **假设** `activeRightPanel !== "ai"`
- **当** 用户查看 RightPanel 顶部 tab bar
- **则** `History` 与 `New Chat` 动作入口不出现

#### Scenario: 用户通过快捷键打开/关闭 AI 面板

- **假设** 右侧面板处于折叠（隐藏）状态
- **当** 用户按下 `Cmd/Ctrl+L`
- **则** 右侧面板展开并显示 AI 面板
- **当** 用户再次按下 `Cmd/Ctrl+L`
- **则** 右侧面板折叠隐藏

#### Scenario: 右侧面板折叠时的布局调整

- **假设** 右侧面板宽度 320px，处于展开状态
- **当** 用户点击右侧面板折叠按钮
- **则** 右侧面板动画收起至 0px（过渡 `var(--duration-slow)`）
- **并且** 主内容区扩展填充释放的空间
- **并且** 折叠状态持久化到 `creonow.layout.panelCollapsed`

---

### Requirement: 项目切换器

系统**必须**在左侧栏顶部（Sidebar 内，Icon Bar 下方）设置项目切换器。

项目切换器行为：

- 默认显示当前项目名称和类型图标
- 点击后展开项目列表下拉面板（`--shadow-md`，`z-index: var(--z-dropdown)`）
- 列表支持搜索过滤（输入即搜）
- 列表按最近打开时间降序排列
- 选择项目后，整个工作台上下文（编辑器文档、知识图谱、记忆、技能配置）全部跟随切换

项目切换通过 IPC 通道完成：

| IPC 通道              | 通信模式         | 方向            | 用途             |
| --------------------- | ---------------- | --------------- | ---------------- |
| `project:switch`      | Request-Response | Renderer → Main | 切换当前活动项目 |
| `project:list:recent` | Request-Response | Renderer → Main | 获取最近项目列表 |

项目切换器组件**必须**有 Storybook Story，覆盖：展开态（有项目列表）、搜索态、空态（无项目）。

#### Scenario: 用户通过项目切换器切换项目

- **假设** 用户当前在项目「暗流」中编辑，左侧栏顶部显示「暗流」
- **当** 用户点击项目切换器，在下拉列表中选择「星际迷航」
- **则** 系统通过 `project:switch` 通知主进程切换项目
- **并且** 编辑器加载「星际迷航」的当前文档
- **并且** 知识图谱切换为「星际迷航」的实体数据
- **并且** 记忆系统切换为「星际迷航」的项目级记忆
- **并且** 项目切换器显示更新为「星际迷航」

#### Scenario: 项目切换器搜索过滤

- **假设** 用户有 10 个项目
- **当** 用户在项目切换器的搜索框中输入「暗」
- **则** 列表过滤为名称包含「暗」的项目
- **并且** 清空搜索框后恢复完整列表

#### Scenario: 无项目时的空状态

- **假设** 用户是全新用户，没有任何项目
- **当** 用户点击项目切换器
- **则** 显示空状态「暂无项目」和「创建新项目」按钮

---

### Requirement: 命令面板（Command Palette）

系统**必须**提供命令面板，通过 `Cmd/Ctrl+P` 全局快捷键呼出，遵循 `DESIGN_DECISIONS.md` §11.4 定义的组件契约。

命令面板行为：

- 居中弹出，使用 `--shadow-xl`，`z-index: var(--z-modal)`，背后有遮罩层（`--color-scrim`）
- 顶部为搜索输入框，支持即时过滤
- 搜索结果分类展示：最近使用、文件、命令
- 上下箭头键导航，Enter 激活选中项，Escape 关闭
- 每个命令项显示名称、图标和快捷键（如有）

命令面板**必须**有 Storybook Story，覆盖：默认态（搜索框聚焦）、有搜索结果态、无结果态。

#### Scenario: 用户通过命令面板打开文件

- **假设** 用户在编辑器中编辑
- **当** 用户按下 `Cmd/Ctrl+P`
- **则** 命令面板居中弹出，搜索框自动聚焦
- **当** 用户输入「第三章」
- **则** 搜索结果过滤出匹配的文件
- **当** 用户按 Enter 选中结果
- **则** 编辑器加载对应文件，命令面板关闭

#### Scenario: 命令面板无搜索结果

- **假设** 命令面板已打开
- **当** 用户输入一个不匹配任何文件或命令的字符串
- **则** 结果区域显示「未找到匹配结果」
- **并且** 不阻碍用户继续输入或关闭面板

---

### Requirement: 底部状态栏

系统**必须**渲染固定在窗口底部的状态栏，高度 28px，不可调整。

状态栏内容：

- **左侧**：当前项目名称、当前文档名称
- **右侧**：字数统计、保存状态指示器（idle / saving / saved / error）、当前时间

状态栏使用 `--color-bg-surface` 背景，`--color-separator-bold` 上边框，文字使用 `--font-family-ui` 11px `--color-fg-muted`。

状态栏**必须**始终固定在底部，不随内容滚动（`flex-shrink: 0`）。

状态栏组件**必须**有 Storybook Story，覆盖：正常态、保存中态、保存错误态。

#### Scenario: 状态栏显示保存状态

- **假设** 用户正在编辑文档
- **当** 自动保存触发
- **则** 状态栏保存指示器显示「保存中...」
- **当** 保存成功
- **则** 指示器切换为「已保存」（持续 2 秒后恢复为空）

#### Scenario: 状态栏保存错误显示

- **假设** 自动保存失败
- **当** IPC 返回错误
- **则** 状态栏保存指示器显示「保存失败」（`--color-error`）
- **并且** 点击指示器可触发重试

---

### Requirement: 主题切换

系统**必须**支持深色和浅色主题切换，通过 `<html>` 元素的 `data-theme` 属性控制（`dark` | `light`）。

主题切换入口在设置面板中。系统**必须**支持「跟随系统」选项，通过 `matchMedia('(prefers-color-scheme: dark)')` 监听 OS 偏好变化。`system` 模式下 OS 切换时应用自动跟随；切换为非 `system` 模式时监听器必须注销。

主题切换**必须**无闪烁（切换时所有 CSS Variable 同步更新）。

当前主题持久化到 `creonow.theme.mode`（值为 `dark` | `light` | `system`）。

V1 阶段仅交付深色主题为完整状态，浅色主题为可选。

#### Scenario: 用户切换到浅色主题

- **假设** 当前为深色主题
- **当** 用户在设置面板中选择「浅色主题」
- **则** `document.documentElement` 的 `data-theme` 切换为 `light`
- **并且** 所有使用 CSS Variable 的组件颜色同步更新，无闪烁
- **并且** 主题偏好持久化到 `creonow.theme.mode`

#### Scenario: 跟随系统主题

- **假设** 用户选择了「跟随系统」主题模式
- **当** 操作系统从深色切换到浅色
- **则** 应用自动切换为浅色主题
- **并且** 无需用户手动操作

---

### Requirement: 全局快捷键

系统**必须**支持以下全局快捷键，遵循 `DESIGN_DECISIONS.md` §10.1：

| 功能     | macOS         | Windows/Linux  |
| -------- | ------------- | -------------- |
| 命令面板 | `Cmd+P`       | `Ctrl+P`       |
| AI 面板  | `Cmd+L`       | `Ctrl+L`       |
| 左侧边栏 | `Cmd+\`       | `Ctrl+\`       |
| 禅模式   | `F11`         | `F11`          |
| 设置     | `Cmd+,`       | `Ctrl+,`       |
| 新建文件 | `Cmd+N`       | `Ctrl+N`       |
| 新建项目 | `Cmd+Shift+N` | `Ctrl+Shift+N` |
| 保存     | `Cmd+S`       | `Ctrl+S`       |

`Cmd/Ctrl+B` **必须**保留给编辑器加粗，侧边栏折叠使用 `Cmd/Ctrl+\`。

快捷键冲突解决原则：编辑器快捷键优先级高于全局快捷键，当编辑器获得焦点时，编辑器快捷键优先响应。

#### Scenario: 快捷键触发对应功能

- **假设** 用户在编辑器中编辑
- **当** 用户按下 `Cmd/Ctrl+P`
- **则** 命令面板弹出

#### Scenario: 快捷键冲突时编辑器优先

- **假设** 编辑器获得焦点
- **当** 用户按下 `Cmd/Ctrl+B`
- **则** 编辑器执行加粗操作（不触发任何全局快捷键）

---

### Requirement: 全局 Toast 通知基础设施

系统**必须**在应用根级挂载全局 Toast 基础设施，使任意工作台组件都能触发一致的即时通知反馈。当前实现由 `AppToastProvider`、`useAppToast()`、`ToastIntegrationBridge` 与 `GlobalErrorToastBridge` 组成。

- `App.tsx` **必须**在主题 Provider 之内挂载 `AppToastProvider`，并将主应用树包裹在其中
- `useAppToast()` **必须**暴露 `showToast({ title, description?, variant?, duration?, action? })`
- `ToastViewport` **必须**固定在窗口右下角；同一时刻多条 Toast **必须**按触发顺序堆叠显示
- 默认停留时间为 5000ms；`error` variant 未显式指定 `duration` 时**必须**使用 8000ms
- `ToastIntegrationBridge` **必须**监听 autosave 成功 / 失败、flush warning 与 AI 错误等状态变化并触发 Toast
- `GlobalErrorToastBridge` **必须**消费全局错误事件并统一展示 `globalError.toast.*` 文案的 error Toast

#### Scenario: 组件通过 useAppToast 触发全局通知

- **假设** 应用已正常挂载 `AppToastProvider`
- **当** 任意组件调用 `showToast({ title, variant: "success" })`
- **则** 右下角出现对应样式的 Toast
- **并且** `error` variant 使用 `aria-live="assertive"`，其余 variant 使用 `aria-live="polite"`

#### Scenario: 自动保存失败触发带重试动作的 Toast

- **假设** 编辑器 autosave 状态变为 `error`
- **当** `useAutoSaveToast()` 观察到状态切换
- **则** 系统展示 error Toast
- **并且** Toast action 调用 `retryLastAutosave()` 以重试最近一次自动保存

---

### Requirement: 渲染进程全局异常兜底

渲染进程**必须**在 React 挂载前安装全局异常兜底，覆盖 `ErrorBoundary` 之外的未处理 Promise rejection 与非 React render 阶段错误。当前实现入口为 `main.tsx` 中的 `installGlobalErrorHandlers()`。

- `installGlobalErrorHandlers()` **必须**在 `ReactDOM.createRoot(...).render(...)` 之前调用
- 兜底范围至少包括：`window.unhandledrejection` 与 `window.error`
- 异常条目**必须**标准化为 `GlobalErrorEntry { source, name, message, stack, timestamp }`
- 日志链路**必须**通过 `invoke("app:renderer:logerror", entry)` 写入主进程日志；日志失败时仅 `console.error`，不得触发递归提示
- Toast 提示**必须**按 `name + message` 在 1000ms 窗口内去重；日志记录**不得**去重
- 全局错误提示**必须**通过 `cn:global-error-toast` 事件桥接到统一 Toast，而不是在任意组件中散落处理

#### Scenario: 未处理 rejection 被记录并提示用户

- **假设** 一个未被业务代码捕获的 Promise rejection 发生在 renderer 中
- **当** 全局错误处理器接收到事件
- **则** 生成 `source: "unhandledrejection"` 的 `GlobalErrorEntry`
- **并且** 通过 `app:renderer:logerror` 发送到主进程
- **并且** 用户收到一条通用的 error Toast，而不是仅在控制台看到异常

#### Scenario: 短时间重复异常只提示一次但日志完整保留

- **假设** 相同的 `name + message` 在 1000ms 内重复触发多次
- **当** 全局错误处理器执行去重逻辑
- **则** 用户侧 Toast 仅显示一次
- **并且** 每次异常仍分别写入日志

---

### Requirement: 错误展示与 i18n 文案收口

Workbench 范围内所有用户可见的错误展示**必须**走统一的人话化与 i18n 管线，禁止直接泄露技术错误码、后端原文或硬编码技术前缀。

- 组件在 JSX 或状态文本中展示 IPC 错误时，**必须**调用 `getHumanErrorMessage(error)`，而不是直接渲染 `error.code` / `error.message`
- `CommandPalette` 的本地错误文案**必须**使用 `workbench.commandPalette.errors.*` i18n key
- locale 文件中的错误文案**必须**为自然语言，不得包含 `NO_PROJECT:`、`ACTION_FAILED:`、`{{code}}` 等技术泄露模式
- `QualityPanel`、`InfoPanel`、版本历史预览、命令面板等工作台 surface **必须**共享这一收口规则

#### Scenario: CommandPalette 无法打开对话框时显示 i18n 错误

- **假设** CommandPalette 触发设置或导出动作，但对应 dialog action 不可用
- **当** 面板需要反馈失败原因
- **则** 界面展示 `workbench.commandPalette.errors.*` 对应的本地化文案
- **并且** 不显示 `ACTION_FAILED`、`NO_PROJECT` 或其他技术前缀

#### Scenario: 工作台错误展示不泄露后端术语

- **假设** 某个右侧面板收到 `{ code: "DB_ERROR", message: "SQLITE_CONSTRAINT ..." }`
- **当** 组件渲染错误状态
- **则** 用户只看到 `getHumanErrorMessage()` 映射后的自然语言提示
- **并且** DOM 中不出现 `DB_ERROR`、`SQLITE`、HTTP 状态码或上游 API 名称

---

### Requirement: 发布边界与 i18n 审计工件

Workbench 相关的发布事实**必须**沉淀为可复核的工件，供事实表、审计和后续收口任务直接引用。

- Windows 首发边界**必须**维护结构化工件 `docs/release/v0.1-windows-boundary.md`，覆盖代码签名、自动更新、备份能力与崩溃可观测性四个维度
- 数据安全边界**必须**维护结构化工件 `docs/release/v0.1-data-safety-boundary.md`，覆盖项目文件、KG、Memory、敏感凭证与临时缓存的存储方式与保护边界
- renderer i18n 裸字符串治理**必须**拥有可重复执行的扫描入口（`scripts/i18n-inventory-scan.ts`）与自动化验证（`apps/desktop/tests/i18n/i18n-inventory-audit.test.ts`），用于维护按模块分组的清理清单
- 上述工件的结论**必须**忠于当前代码现场，不得以“计划中能力”冒充已交付能力

#### Scenario: 发布事实表引用发布边界工件时不需二次猜测

- **假设** 事实表或审计报告需要判断 Windows 首发能力或数据安全边界
- **当** 读取对应 release 工件
- **则** 可以直接获得结构化的当前状态、证据与处置建议
- **并且** 这些结论与当前代码现场保持一致

---

### Requirement: 模块级可验收标准（适用于本模块全部 Requirement）

- 量化阈值：
  - 主布局首屏可交互（TTI）p95 < 1.2s
  - 侧栏展开/折叠动画完成 p95 < 220ms
  - 命令面板唤起到可输入 p95 < 120ms
- 边界与类型安全：
  - `TypeScript strict` 必须开启
  - `layout/theme/command` store 输入参数必须做 zod 校验，具体 schema：
    - `sidebarWidth`: `z.number().min(180).max(400)`
    - `panelWidth`: `z.number().min(280).max(480)`
    - `sidebarCollapsed` / `panelCollapsed`: `z.boolean()`
    - `activeLeftPanel`: `z.enum(["files","search","outline","versionHistory","memory","characters","knowledgeGraph"])`
    - `activeRightPanel`: `z.enum(["ai","info","quality"])`
    - `theme.mode`: `z.enum(["dark","light","system"])`
- 失败处理策略：
  - 偏好恢复失败时回退默认布局 + 写入修正值到 preferences + 状态栏一次性提示「布局已重置」
  - 快捷键冲突以编辑器优先并记录冲突事件
  - UI 状态异常必须可恢复（重置布局）
- Owner 决策边界：
  - 三栏布局最小宽高、默认面板顺序、核心快捷键由 Owner 固定
  - Agent 不得私改 `Cmd/Ctrl+B` 的编辑器优先策略

#### Scenario: 布局恢复失败时自动回退

- **假设** 本地布局偏好数据损坏
- **当** 应用启动恢复布局
- **则** 自动回退默认布局参数
- **并且** 状态栏显示一次性提示「布局已重置」

#### Scenario: 命令面板性能达标

- **假设** 项目含 5,000 文件与 500 命令项
- **当** 用户按下 `Cmd/Ctrl+P`
- **则** 命令面板在 p95 120ms 内可输入
- **并且** 搜索过滤首批结果在 200ms 内显示

---

### Requirement: 异常与边界覆盖矩阵

| 类别         | 最低覆盖要求                         |
| ------------ | ------------------------------------ |
| 网络/IO 失败 | 偏好读写失败、项目切换器数据加载失败 |
| 数据异常     | 布局配置非法值、主题值非法枚举       |
| 并发冲突     | 快捷键并发触发、双面板并发拖拽       |
| 容量溢出     | 命令面板超大结果集、最近项目列表过长 |
| 权限/安全    | 非法快捷键注入、未授权面板状态篡改   |

#### Scenario: 双拖拽冲突以全局 dragging flag 为准

- **假设** 用户几乎同时拖拽左侧栏和右侧栏分割线
- **当** 两个更新事件进入布局 store
- **则** 全局 dragging flag 确保同一时刻只有一个 Resizer 活跃（last-write-wins）
- **并且** 宽度仍受最小/最大边界约束

#### Scenario: 主题值非法时阻断写入

- **假设** 持久化层读到 `theme=neon`（非法值）
- **当** 应用加载主题
- **则** 回退 `system` 并写入修正值
- **并且** 不产生白屏或闪烁

---

### Non-Functional Requirements

**Performance**

- 布局初始化：p50 < 500ms，p95 < 1.2s，p99 < 2s
- 侧栏展开/折叠：p50 < 120ms，p95 < 220ms，p99 < 400ms
- 命令面板检索：p95 < 200ms

**Capacity**

- 最近项目列表上限：200
- 命令面板一次检索返回上限：300（其余分页）
- 布局历史快照上限：50

**Security & Privacy**

- 本地偏好仅存 UI 状态，禁止存正文内容
- 快捷键映射只接受白名单命令
- 状态栏诊断信息禁止泄漏路径和密钥

**Concurrency**

- UI 状态更新在主线程批处理（每帧最多一次 commit）
- 命令面板检索请求采用可取消策略（仅保留最新）
- 项目切换期间锁定高风险操作按钮

#### Scenario: 命令面板超大结果集分页

- **假设** 查询命中 10,000 项
- **当** 用户输入关键词
- **则** 首屏仅展示 100 项并支持滚动加载
- **并且** 输入响应不掉帧

#### Scenario: 并发快捷键不触发重复动作

- **假设** 用户快速连按 `Cmd/Ctrl+L`
- **当** 事件在 300ms 内多次到达
- **则** 系统去抖处理，只执行一次面板状态翻转
- **并且** UI 最终状态可预测

---

### Requirement: API Key 加密存储与配置管理

API Key **必须**通过 `SecretStorageAdapter`（封装 Electron `safeStorage` API）加密存储到 SQLite，**禁止**明文存储。

支持的 provider 模式：

| 模式            | 值                    | 说明                        |
| --------------- | --------------------- | --------------------------- |
| OpenAI 兼容代理 | `"openai-compatible"` | 自建/第三方代理，需 baseUrl |
| OpenAI 直连     | `"openai-byok"`       | 用户自有 OpenAI API Key     |
| Anthropic 直连  | `"anthropic-byok"`    | 用户自有 Anthropic API Key  |

每种模式独立存储 `baseUrl` 和 `apiKey`。

IPC 通道：

| IPC 通道           | 通信模式         | 方向            | 用途                           |
| ------------------ | ---------------- | --------------- | ------------------------------ |
| `ai:config:get`    | Request-Response | Renderer → Main | 获取 AI 配置（不返回明文 key） |
| `ai:config:update` | Request-Response | Renderer → Main | 更新 AI 配置（含加密存储 key） |
| `ai:config:test`   | Request-Response | Renderer → Main | 测试连接有效性                 |

`ai:config:get` 返回的公开数据结构：

```typescript
type AiProxySettings = {
  enabled: boolean;
  baseUrl: string;
  apiKeyConfigured: boolean;
  providerMode: "openai-compatible" | "openai-byok" | "anthropic-byok";
  openAiCompatibleBaseUrl: string;
  openAiCompatibleApiKeyConfigured: boolean;
  openAiByokBaseUrl: string;
  openAiByokApiKeyConfigured: boolean;
  anthropicByokBaseUrl: string;
  anthropicByokApiKeyConfigured: boolean;
};
```

REQ-ID: `REQ-WB-KEYSAFE`

#### Scenario: S1 存储并读取配置

- **假设** 调用 `update({ patch: { providerMode: "openai-byok", openAiByokBaseUrl: "https://api.openai.com", openAiByokApiKey: "sk-test-abc123" } })`
- **当** 然后调用 `get()`
- **则** 返回 `{ ok: true, data }` 且 `data.providerMode === "openai-byok"`
- **并且** `data.openAiByokBaseUrl === "https://api.openai.com"`
- **并且** `data.openAiByokApiKeyConfigured === true`（不返回明文 key）

#### Scenario: S2 未存储时 apiKeyConfigured 为 false

- **假设** 未执行任何 `update` 操作
- **当** 调用 `get()`
- **则** 返回 `{ ok: true, data }` 且 `data.openAiByokApiKeyConfigured === false`
- **并且** `data.anthropicByokApiKeyConfigured === false`

#### Scenario: S3 不同 provider 模式独立存储

- **假设** 执行 `update({ patch: { providerMode: "openai-byok", openAiByokApiKey: "sk-openai" } })`
- **并且** 执行 `update({ patch: { providerMode: "anthropic-byok", anthropicByokApiKey: "sk-anthropic" } })`
- **当** 调用 `get()`
- **则** `data.openAiByokApiKeyConfigured === true`
- **并且** `data.anthropicByokApiKeyConfigured === true`

#### Scenario: S4 空 key 拒绝存储

- **假设** 调用 `update({ patch: { openAiByokApiKey: "" } })`
- **当** 读取内部 raw 数据
- **则** `openAiByokApiKey` 为 `null`（空字符串被 `normalizeApiKey` 过滤）

#### Scenario: S5 加密不可用时返回错误

- **假设** `SecretStorageAdapter.isEncryptionAvailable()` 返回 `false`
- **当** 调用 `update({ patch: { openAiByokApiKey: "sk-test" } })`
- **则** 返回 `{ ok: false, error: { code: "UNSUPPORTED", message: "safeStorage is required to persist API key securely" } }`

#### Scenario: S6 测试连接成功

- **假设** provider 配置了有效的 baseUrl 和 apiKey，`GET /v1/models` 返回 200
- **当** 调用 `test()`
- **则** 返回 `{ ok: true, data: { ok: true, latencyMs: <number> } }`

#### Scenario: S7 测试连接失败——认证错误

- **假设** `GET /v1/models` 返回 401
- **当** 调用 `test()`
- **则** 返回 `{ ok: true, data: { ok: false, latencyMs: <number>, error: { code: "AI_AUTH_FAILED" } } }`

---

### Requirement: AI 配置设置面板

设置面板**必须**包含 AI 配置区组件 `AiSettingsSection`，包含：

| 元素          | 类型                      | data-testid        | 说明                                             |
| ------------- | ------------------------- | ------------------ | ------------------------------------------------ |
| Provider 选择 | `<select>`                | `ai-provider-mode` | openai-compatible / openai-byok / anthropic-byok |
| Base URL 输入 | `<input>`                 | `ai-base-url`      | URL 输入框                                       |
| API Key 输入  | `<input type="password">` | `ai-api-key`       | 密码类型，placeholder 显示配置状态               |
| 保存按钮      | `<button>`                | `ai-save-btn`      | 调用 `ai:config:update`                          |
| 测试连接按钮  | `<button>`                | `ai-test-btn`      | 调用 `ai:config:test`                            |
| 错误显示      | `<span>`                  | `ai-error`         | 错误文案                                         |
| 测试结果      | `<span>`                  | `ai-test-result`   | 成功/失败状态文案                                |

REQ-ID: `REQ-WB-AICONFIG`

### Requirement: 无 API Key 时降级体验

无可用 API Key 时，AI 面板发送区**应该**显示配置引导文案和跳转链接，而非报错。

REQ-ID: `REQ-WB-AI-DEGRADATION`

#### Scenario: S0 无 API Key 时 placeholder 显示引导文案

- **假设** mock `ai:config:get` 返回所有 provider 的 `apiKeyConfigured` 均为 `false`
- **当** 渲染 `<AiSettingsSection />`
- **则** API Key 输入框的 placeholder 为 `"未配置"`
- **并且** 页面不显示 `data-testid="ai-error"` 的错误元素（未配置不是错误状态）

#### Scenario: S1 面板渲染所有必要元素

- **假设** mock `ai:config:get` 返回 `{ ok: true, data: { providerMode: "openai-compatible", openAiCompatibleBaseUrl: "", openAiCompatibleApiKeyConfigured: false, ... } }`
- **当** 渲染 `<AiSettingsSection />`
- **则** 页面包含 `data-testid="ai-provider-mode"` 的 select 元素
- **并且** 页面包含 `data-testid="ai-api-key"` 的 password 输入框
- **并且** 页面包含 `data-testid="ai-base-url"` 的输入框
- **并且** 页面包含 `data-testid="ai-save-btn"` 的保存按钮
- **并且** 页面包含 `data-testid="ai-test-btn"` 的测试连接按钮

#### Scenario: S2 测试连接调用 IPC 并显示成功

- **假设** 渲染 `<AiSettingsSection />`，初始加载完成
- **并且** mock `ai:config:test` 返回 `{ ok: true, data: { ok: true, latencyMs: 42 } }`
- **当** 用户点击 `data-testid="ai-test-btn"` 按钮
- **则** `ai:config:test` IPC 被调用 1 次
- **并且** 页面显示 `data-testid="ai-test-result"` 元素，内容包含 `"连接成功"` 和 `"42ms"`

#### Scenario: S3 测试连接失败显示错误

- **假设** mock `ai:config:test` 返回 `{ ok: true, data: { ok: false, latencyMs: 100, error: { code: "AI_AUTH_FAILED", message: "Proxy unauthorized" } } }`
- **当** 用户点击测试连接按钮
- **则** 页面显示 `data-testid="ai-test-result"` 元素，内容包含 `"AI_AUTH_FAILED"`

#### Scenario: S4 保存配置调用 IPC

- **假设** 渲染 `<AiSettingsSection />`，用户选择 provider 为 `"openai-byok"`，输入 Base URL 和 API Key
- **并且** mock `ai:config:update` 返回 `{ ok: true, data: { providerMode: "openai-byok", openAiByokApiKeyConfigured: true, ... } }`
- **当** 用户点击 `data-testid="ai-save-btn"` 按钮
- **则** `ai:config:update` IPC 被调用 1 次
- **并且** 调用参数 patch 包含 `providerMode: "openai-byok"`

#### Scenario: S5 API Key placeholder 显示配置状态

- **假设** mock `ai:config:get` 返回 `{ ok: true, data: { providerMode: "openai-byok", openAiByokApiKeyConfigured: true, ... } }`
- **当** 渲染 `<AiSettingsSection />`
- **则** API Key 输入框的 placeholder 为 `"已配置"`

#### Scenario: S6 未配置 key 时 placeholder 显示未配置

- **假设** mock `ai:config:get` 返回 `{ ok: true, data: { providerMode: "openai-byok", openAiByokApiKeyConfigured: false, ... } }`
- **当** 渲染 `<AiSettingsSection />`
- **则** API Key 输入框的 placeholder 为 `"未配置"`
