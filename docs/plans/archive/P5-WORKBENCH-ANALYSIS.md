# P5 Workbench UI/UX 完整分析

> 最后更新：2026-02-12 14:50 UTC+8
> 基准文档：`openspec/specs/workbench/spec.md`、`design/DESIGN_DECISIONS.md`
> 视觉验证：Storybook 6006 + Electron headless 截图（`/tmp/storybook-screenshots/`）

---

## 一、P5 的定位

P5 = **Workbench UI 外壳层落地收口**。

P0–P4 已完成所有后端引擎、IPC 契约、前端 Feature 的核心实现。P5 不是"再加功能"，而是：

1. 将 Workbench 主规范（`openspec/specs/workbench/spec.md`）中 **每一条 Requirement** 完整落地
2. 修正 P0–P4 迭代中产生的 **Spec 漂移**（代码与 Spec 不一致）
3. 补齐 **鲁棒性、性能、可验收标准**（zod 校验、异常回退、去抖、NFR 阈值）
4. 通过 delta spec 将 P0–P4 的合理扩展 **正式纳入主 Spec**

---

## 二、执行顺序（三阶段）

| 阶段 | 内容 | 目的 |
|------|------|------|
| **Phase A** | Dependency Sync Check | 对齐 IPC 命名漂移、跨模块契约，确保后续实现基于正确的契约 |
| **Phase B** | Workbench 主流程实现 | 三栏布局约束、IconBar、Sidebar、RightPanel、ProjectSwitcher、CommandPalette、StatusBar、Theme、快捷键 |
| **Phase C** | Hardening + 验收门 | zod 输入校验、异常回退、并发/容量场景、Storybook 补齐、NFR 阈值测量、RUN_LOG 收口 |

**Phase A 必须先于 Phase B**，否则后续实现可能基于错误的 IPC 通道名。

---

## 三、Dependency Sync Check（Phase A 详情）

### 3.1 IPC 通道命名漂移

| 位置 | 使用的通道名 | 问题 |
|------|-------------|------|
| `openspec/specs/workbench/spec.md:236` | `project:switch` | Spec 定义 |
| `openspec/specs/project-management/spec.md:138,153` | `project:switch` | PM Spec 定义 |
| `packages/shared/types/ipc-generated.ts:2430` | `project:project:switch` | **实际 IPC 契约** |
| `apps/desktop/main/src/ipc/contract/ipc-contract.ts:1784` | `project:project:switch` | **实际后端实现** |
| `apps/desktop/renderer/src/stores/projectStore.tsx:213` | `project:project:switch` | **实际前端调用** |

**结论**：代码统一使用 `project:project:switch`（含 namespace 前缀），但 Workbench Spec 和 PM Spec 都写的 `project:switch`。需要在 delta spec 中修正 Spec 文字，使之与实际契约一致。

同理需检查 `project:list:recent` 是否存在类似漂移（Spec 中定义但实际 IPC 契约中可能为 `project:project:list:recent` 或其它命名）。

### 3.2 RightPanel Tab 类型漂移

| 位置 | 内容 | 问题 |
|------|------|------|
| `openspec/specs/workbench/spec.md:167` | "仅包含两个标签页：AI 面板和 Info 面板" | Spec 定义 |
| `apps/desktop/renderer/src/stores/layoutStore.tsx:35` | `type RightPanelType = "ai" \| "info" \| "quality"` | **多了 quality** |
| `apps/desktop/renderer/src/components/layout/RightPanel.tsx:62` | 三个 tab：AI / Info / Quality | **多了 Quality tab** |

Quality tab 是 P4（Quality Gates）期间添加的合理扩展，但未同步更新 Workbench Spec。需在 delta spec 中决定：保留（`[ADDED]`）或移除。

### 3.3 IconBar 项目列表漂移

| 位置 | 内容 |
|------|------|
| `openspec/specs/workbench/spec.md:78-85` | 固定 6 项：files → outline → characters → media → graph → settings |
| `apps/desktop/renderer/src/components/layout/IconBar.tsx:57-80` | 实际 7 项：files → search → outline → versionHistory → memory → characters → knowledgeGraph |

**差异**：
- Spec 有但代码无：`media`（媒体管理模块不在 V1 范围，无对应 spec.md）
- 代码有但 Spec 无：`search`（P2 search-and-retrieval）、`versionHistory`（P3 version-control）、`memory`（P3 memory-system）

需在 delta spec 中：
- 将 `search`、`versionHistory`、`memory` 用 `[ADDED]` 纳入
- 将 `media` 标记为 `[DEFERRED]`

---

## 四、当前 UI/UX 缺陷清单

### S0 级（严重结构性缺陷——与 Spec 直接矛盾）

#### S0-1: RightPanel 双层 Tab 嵌套

**现象**：

```
RightPanel（外层）
├── [AI] tab ──→ AiPanel（内层）
│   ├── [Assistant] sub-tab ──→ AI 对话区
│   └── [Info] sub-tab ──→ AiPanel 内部的 InfoPanel 占位组件
├── [Info] tab ──→ features/rightpanel/InfoPanel（真正的 Info 面板）
└── [Quality] tab ──→ QualityPanel
```

**问题**：
1. `AiPanel.tsx:437` 定义了内部 `activeTab: "assistant" | "info"` 状态，渲染了自己的 Assistant/Info 子 tab（`:1093-1131`）
2. `RightPanel.tsx:62` 外层又有 AI/Info/Quality 三个 tab
3. 用户看到的效果：选择外层 AI tab 后，里面又嵌套了 Assistant/Info 两个子 tab——其中内层 Info（`:329-337`，仅一行占位文字）和外层 Info（`features/rightpanel/InfoPanel.tsx`，真正的文档统计面板）**完全不同**
4. 这导致信息架构混乱：用户不知道该看哪个 Info

**Spec 要求**（`workbench/spec.md:167`）：
> 右侧面板**必须**仅包含两个标签页：AI 面板和 Info 面板

**修正方向**：
- 删除 `AiPanel` 内部的 Assistant/Info 子 tab，AiPanel 只渲染 AI 对话功能
- RightPanel 外层 tab 收敛为 AI + Info（是否保留 Quality 需 delta spec 决定）
- `Cmd/Ctrl+L` 从折叠打开时默认展示 AI tab（Spec 要求）

**涉及文件**：
- `apps/desktop/renderer/src/features/ai/AiPanel.tsx:329-337,437,1093-1206`
- `apps/desktop/renderer/src/components/layout/RightPanel.tsx:57-65`
- `apps/desktop/renderer/src/stores/layoutStore.tsx:35`

---

#### S0-2: IconBar 信息架构与 Spec 不一致

**现象**：

| Spec 顺序 | 实际代码顺序 |
|-----------|-------------|
| files | files |
| outline | search ← **不在 Spec** |
| characters | outline |
| media | versionHistory ← **不在 Spec** |
| graph | memory ← **不在 Spec** |
| settings（底部固定） | characters |
| — | knowledgeGraph |
| — | settings（底部固定） |

**问题**：
1. 顺序不匹配：Spec 要求 files → outline → characters → media → graph，代码是 files → search → outline → versionHistory → memory → characters → knowledgeGraph
2. `media` 面板缺失（底层模块不存在）
3. P2–P4 新增的 3 个面板（search, versionHistory, memory）未在 Spec 中记录

**涉及文件**：
- `apps/desktop/renderer/src/components/layout/IconBar.tsx:57-80`
- `openspec/specs/workbench/spec.md:76-85`

---

#### S0-3: IconBar 激活指示条样式不符 Spec

**Spec 要求**（`workbench/spec.md:90`）：
> 当前激活项**必须**有左侧 2px 白色指示条（`--color-accent`）

**实际实现**（`IconBar.tsx:41-42`）：
```tsx
const iconButtonActive =
  "border-[var(--color-border-focus)] bg-[var(--color-bg-selected)] text-[var(--color-fg-default)]";
```
使用的是矩形边框高亮 + 背景色变化，不是左侧 2px 白色条。视觉语义完全不同。

---

#### S0-4: 项目切换器未集成到 Sidebar

**Spec 要求**（`workbench/spec.md:222`）：
> 系统**必须**在左侧栏顶部（Sidebar 内，Icon Bar 下方）设置项目切换器

**现状**：
- `ProjectSwitcher.tsx` 组件存在，但是：
  1. 使用原生 `<select>` 元素（`:65-82`），不是 Spec 要求的「可搜索下拉面板」
  2. **未接入** `AppShell.tsx` 或 `Sidebar.tsx` —— `Sidebar.tsx:132-145` 中无 ProjectSwitcher 的引用
  3. 不支持搜索过滤、空状态「暂无项目」+ 创建按钮、`--shadow-md` 下拉样式
  4. 缺少 Storybook Story

**涉及文件**：
- `apps/desktop/renderer/src/features/projects/ProjectSwitcher.tsx`（现有组件）
- `apps/desktop/renderer/src/components/layout/Sidebar.tsx:132-145`（未集成）
- `apps/desktop/renderer/src/components/layout/AppShell.tsx`（未集成）

---

### S1 级（功能不完整——Spec 要求存在但实现缺失或不足）

#### S1-1: CommandPalette 缺少文件搜索和分类

**Spec 要求**（`workbench/spec.md:274`）：
> 搜索结果分类展示：最近使用、文件、命令

**运行时现状**（`CommandPalette.tsx:376-529`）：
- `defaultCommands` 分 4 组：Suggestions / Layout / Document / Project，**全部是命令**
- `AppShell.tsx:744-750` 未传入 `commands` prop，因此运行时始终使用 `defaultCommands`
- 无文件搜索能力——输入文件名不会搜索项目文件
- 无“最近使用”分类
- 无文件打开场景（Spec Scenario `workbench/spec.md:280-288`：输入文件名 → 过滤匹配文件 → Enter 打开）

**组件能力**：
- `CommandPalette` 接受 `commands: CommandItem[]` prop，支持任意 `group` 分类
- Storybook mock 数据已演示了 "Recent Files" + "Suggestions" 分组（截图 `commandpalette.png`）
- 说明组件本身支持分类展示，但运行时集成未传入文件项

**涉及文件**：
- `apps/desktop/renderer/src/features/commandPalette/CommandPalette.tsx:376-529`（运行时命令列表）
- `apps/desktop/renderer/src/components/layout/AppShell.tsx:744-750`（集成点）

---

#### S1-2: StatusBar 信息严重不足

**Spec 要求**（`workbench/spec.md:303-306`）：

| 位置 | 内容 | 当前状态 |
|------|------|---------|
| 左侧 | 当前项目名称 | ❌ 缺失 |
| 左侧 | 当前文档名称 | ❌ 缺失 |
| 右侧 | 字数统计 | ❌ 缺失 |
| 右侧 | 保存状态指示器（idle/saving/saved/error） | ⚠️ 部分实现（仅原始 autosaveStatus 值） |
| 右侧 | 当前时间 | ❌ 缺失 |

**现状**（`StatusBar.tsx:10-13`）：
```tsx
const autosaveStatus = useEditorStore((s) => s.autosaveStatus);
const capacityWarning = useEditorStore((s) => s.capacityWarning);
```
仅显示 autosave 状态原始值和容量警告。缺少完整的保存状态机（idle → saving → saved（2s 后清除）→ error）及视觉样式区分。

**涉及文件**：
- `apps/desktop/renderer/src/components/layout/StatusBar.tsx`

---

#### S1-3: `Cmd/Ctrl+L` 行为不完全满足 Spec

**Spec 要求**（`workbench/spec.md:167,174`）：
- 从折叠状态打开时默认展示 **AI 面板**
- `Cmd/Ctrl+L` 300ms 内多次按压只执行一次翻转（`workbench/spec.md:487-490`）

**现状**（`AppShell.tsx:484` 附近）：
- `layoutStore.setActiveRightPanel` 会自动展开面板，但未强制切到 AI tab
- 无去抖（debounce）实现

---

### S2 级（鲁棒性缺失——Spec 可验收标准未满足）

#### S2-1: Store 缺少 zod 输入校验

**Spec 要求**（`workbench/spec.md:401`）：
> `layout/theme/command` store 输入参数必须做 zod 校验

**现状**：
- `layoutStore.tsx:85-174`：`createLayoutStore` 从 preferences 读取值时无 zod 校验，直接 `??` 回退默认值。无法识别"类型正确但值非法"的情况（如 `sidebarWidth: -100`）
- `themeStore.tsx:31-33`：`normalizeMode` 只做了枚举白名单检查（手写，非 zod），且 `setMode` 中不校验调用方传入的非法值边界
- `commandPalette`：无输入校验

---

#### S2-2: 布局恢复失败无回退与提示

**Spec Scenario**（`workbench/spec.md:410-415`）：
> 假设本地布局偏好数据损坏 → 自动回退默认布局参数 → 状态栏显示一次性提示「布局已重置」

**现状**：
- `layoutStore.tsx:91-100` 使用 `??` 回退默认值，但：
  1. 不检测数据是否损坏（如 `sidebarWidth` 为 NaN 或负数）
  2. 不通知用户布局已重置
  3. 不将修正值写回 preferences（下次启动仍读到损坏值）

---

#### S2-3: 主题跟随系统未实现

**Spec 要求**（`workbench/spec.md:335`）：
> 系统**应该**支持「跟随系统」选项

**现状**：
- `themeStore.tsx` 支持 `mode: "system"` 的存储
- 但 **无 `matchMedia('(prefers-color-scheme: dark)')` 监听**
- 当 OS 切换深色/浅色主题时，应用不会自动跟随
- 无法确认 `system` 模式下实际使用的是 dark 还是 light

---

#### S2-4: 主题值非法时未阻断写入

**Spec Scenario**（`workbench/spec.md:443-448`）：
> 假设持久化层读到 `theme=neon`（非法值）→ 回退 `system` 并写入修正值

**现状**：
- `themeStore.tsx:42-43`：`normalizeMode(stored) ?? "system"` 能回退
- 但 **未将修正值写入 preferences**——下次启动仍读到 `neon`，每次都重复回退
- `setMode` 中（`:48-56`）对非法值直接 `return`，不写入修正值

---

#### S2-5: 并发快捷键无去抖

**Spec Scenario**（`workbench/spec.md:485-490`）：
> 用户快速连按 `Cmd/Ctrl+L` → 300ms 内多次到达 → 系统去抖处理，只执行一次面板状态翻转

**现状**：`AppShell.tsx` 中的快捷键处理无任何去抖逻辑。

---

#### S2-6: 双拖拽冲突无显式处理

**Spec Scenario**（`workbench/spec.md:436-441`）：
> 用户几乎同时拖拽左侧栏和右侧栏分割线 → 采用最后一次鼠标事件作为最终宽度

**现状**：`Resizer.tsx` 使用 window-level mousemove 事件，两个 Resizer 实例会各自独立处理。由于 React 状态更新批处理，实际行为可能符合 last-write-wins，但未做显式保证。

---

#### S2-7: `activeLeftPanel` / `activeRightPanel` 未持久化

**现状**（`layoutStore.tsx:162-172`）：
- `setActiveLeftPanel` 和 `setActiveRightPanel` 仅调用 `set()`，**不调用 `preferences.set()`**
- 每次应用重启，左侧面板重置为 `files`，右侧面板重置为 `ai`
- 用户切换到 `outline`/`knowledgeGraph` 等面板后重启即丢失选择

`prefKey` 函数（`:73-76`）的允许值列表中不包含 `activeLeftPanel` / `activeRightPanel`，需要扩展。

---

## 4.5、视觉验证截图记录

通过 Storybook 6006（WSL IP `172.18.248.30`） + Electron headless 截图验证。截图存储在 `/tmp/storybook-screenshots/`。

| 截图文件 | Story ID | 确认的缺陷 |
|----------|----------|----------|
| `iconbar.png` | `layout-iconbar--default` | **S0-2**: 8 个图标（files→search→outline→versionHistory→memory→characters→knowledgeGraph + settings），Spec 要6个；**S0-3**: 激活状态用矩形边框而非左侧 2px 指示条 |
| `rightpanel.png` | `layout-rightpanel--default` | **S0-1**: 外层 AI\|Info\|Quality 3 tab + 内层 ASSISTANT\|INFO 2 sub-tab，双层嵌套明显 |
| `aipanel.png` | `features-aipanel--default` | **S0-1**: AiPanel 内部 ASSISTANT\|INFO 子 tab 清晰可见 |
| `statusbar.png` | `layout-statusbar--default` | **S1-2**: 底部栏仅显示 `idle` 文字，无项目名/文档名/字数/时间 |
| `sidebar.png` | `layout-sidebar--default` | **S0-4**: 仅显示 EXPLORER + "No project open"，无 ProjectSwitcher |
| `commandpalette.png` | `features-commandpalette--default` | **S1-1**: Storybook mock 有 "Recent Files"，但运行时无文件搜索 |
| `rightpanel-collapsed.png` | `layout-rightpanel--collapsed` | 折叠态正常 |

> AppShell story 因 tiptap 依赖缺失无法渲染（`Failed to fetch dynamically imported module`），未获得完整布局截图。需补装 `@tiptap/extension-underline`、`@tiptap/extension-link`、`@tiptap/extension-bubble-menu` 后重试。

---

## 五、Change 拆分方案

基于三阶段执行顺序和缺陷清单，建议拆分为 **6 个 change**：

```
Phase A ──→ [Change 00] contract-sync
                │
Phase B ──→ [Change 01] layout-iconbar-shell ─┐
            [Change 02] project-switcher ──────┤ 可并行
            [Change 03] rightpanel-statusbar ──┤
            [Change 04] command-palette ───────┘
                │
Phase C ──→ [Change 05] hardening-gate
```

---

### Change 00: `workbench-p5-00-contract-sync`

**范围**：仅做依赖同步与 delta spec，不涉及功能代码变更。

| 条目 | 内容 |
|------|------|
| IPC 命名对齐 | Workbench Spec 中 `project:switch` → 修正为 `project:project:switch`；同理 `project:list:recent` 需确认实际通道名并修正 |
| IconBar 列表对齐 | delta spec 将 `search`、`versionHistory`、`memory` 标记 `[ADDED]`；`media` 标记 `[DEFERRED]` |
| RightPanel tab 对齐 | delta spec 决定 Quality tab 保留（`[ADDED]`）或移除（`[REMOVED]`），并更新 `RightPanelType` 描述 |
| 产出 | `openspec/changes/workbench-p5-00-contract-sync/proposal.md` + `tasks.md` + delta spec |

---

### Change 01: `workbench-p5-01-layout-iconbar-shell`

**范围**：三栏布局约束 + IconBar Spec 对齐。

| 条目 | 内容 |
|------|------|
| IconBar 顺序 | 按 delta spec 确定的最终顺序调整 `MAIN_ICONS` 数组 |
| IconBar 激活指示条 | 将矩形高亮改为左侧 2px `--color-accent` 白色指示条 |
| IconBar 图标规格 | 确认图标 24px、按钮 40×40px、居中（flexbox） |
| 折叠动画 | 侧栏展开/折叠过渡 `var(--duration-slow)` |
| 偏好持久化 | 验证 `creonow.layout.sidebarCollapsed` / `sidebarWidth` 正确持久化 |
| Storybook | AppShell 四种折叠态组合；IconBar 默认态/激活态/悬停态 |

---

### Change 02: `workbench-p5-02-project-switcher`

**范围**：Sidebar 顶部项目切换器完整实现。

| 条目 | 内容 |
|------|------|
| 组件重写 | 将现有 `<select>` 替换为可搜索下拉面板（`--shadow-md`, `z-index: var(--z-dropdown)`） |
| 搜索过滤 | 输入即搜，按最近打开时间降序 |
| 空状态 | 「暂无项目」+ 「创建新项目」按钮 |
| 超时进度条 | 切换 >1s 时显示 2px 进度条（已有 loading bar 逻辑，需保留） |
| Sidebar 集成 | 在 `Sidebar.tsx` 顶部（LeftPanelHeader 之前或替代）渲染 ProjectSwitcher |
| IPC 对接 | 使用 Change 00 确认后的实际通道名 |
| Storybook | 展开态（有项目列表）、搜索态、空态（无项目） |

---

### Change 03: `workbench-p5-03-rightpanel-statusbar`

**范围**：RightPanel 结构修正 + StatusBar 信息补齐。

| 条目 | 内容 |
|------|------|
| **RightPanel Tab 收敛** | 按 Change 00 delta spec 结论执行（若移除 Quality 则 `RightPanelType = "ai" \| "info"`） |
| **AiPanel 子 tab 消除** | 删除 `AiPanel.tsx` 内部的 `activeTab: "assistant" \| "info"` 及其 sub-tab header（`:1091-1203`），AiPanel 只渲染 AI 对话功能 |
| **AiPanel 内部 InfoPanel 删除** | 删除 `AiPanel.tsx:329-337` 的占位 InfoPanel 函数 |
| **`Cmd/Ctrl+L` 语义修正** | 从折叠打开时强制 `setActiveRightPanel("ai")`；添加 300ms 去抖（当前实现 `AppShell.tsx:486` 仅调用 `setPanelCollapsed(!panelCollapsed)`，不切 tab） |
| **activePanelTab 持久化** | `activeRightPanel` 持久化到 `creonow.layout.activeRightPanel`，扩展 `prefKey` 允许值 |
| **StatusBar 左侧** | 添加项目名称（`projectStore.current.name`）、文档名称（`fileStore.currentDocumentId` → `items.find().title`） |
| **StatusBar 右侧** | 添加字数统计（`editorStore.wordCount`）、保存状态完整状态机（idle/saving/saved/error + 样式）、当前时间（每分钟刷新） |
| **StatusBar Storybook** | 正常态、保存中态、保存错误态 |

---

### Change 04: `workbench-p5-04-command-palette`

**范围**：命令面板文件搜索 + 分类展示。

| 条目 | 内容 |
|------|------|
| 搜索结果分类 | 三类：最近使用（从 localStorage 或 store 读取）、文件（从 `fileStore.items` 搜索）、命令 |
| 文件打开 | 选中文件项后加载对应文档到编辑器 |
| 无结果文案 | 显示「未找到匹配结果」 |
| 容量策略 | 首屏 100 项 + 滚动加载（Spec `workbench/spec.md:478-483`） |
| 性能指标 | 首批结果 200ms 内显示（Spec `workbench/spec.md:421-422`） |
| Storybook | 默认态、分类搜索结果态、无结果态 |

---

### Change 05: `workbench-p5-05-hardening-gate`

**范围**：鲁棒性 + 验收门 + 收口。

| 条目 | 内容 |
|------|------|
| **zod 校验** | `layoutStore` 输入参数（sidebarWidth, panelWidth, sidebarCollapsed, panelCollapsed）加 zod schema 校验 |
| | `themeStore` 输入参数加 zod schema（替代手写 normalizeMode） |
| | `commandPalette` 输入参数校验 |
| **非法偏好回退** | `layoutStore`：zod 校验失败时回退默认值 + 写入修正值 + 状态栏提示「布局已重置」 |
| | `themeStore`：非法值回退 `system` + 写入修正值（消除反复回退问题） |
| **主题跟随系统** | 添加 `matchMedia('(prefers-color-scheme: dark)')` 监听；`system` 模式下自动跟随 OS |
| **并发去抖** | `Cmd/Ctrl+L`、`Cmd/Ctrl+\` 等布局快捷键加 300ms debounce |
| **双拖拽** | Resizer 添加显式 last-write-wins 保证（如全局 dragging flag） |
| **Resizer 悬停样式** | 对齐 Spec：悬停时分割线 2px 高亮 + `cursor: col-resize` |
| **右侧面板折叠按钮** | 面板内添加折叠按钮（当前只能通过 `Cmd/Ctrl+L` 折叠） |
| **Storybook 补齐** | 审计所有 Layout 组件 Story 覆盖度，补齐缺失的状态组合 |
| **NFR 验收** | TTI p95 < 1.2s、侧栏动画 p95 < 220ms、命令面板 p95 < 120ms |
| **RUN_LOG 收口** | 所有 change 的 task_runs 完整、PR 链接回填 |

---

## 六、各 Change 依赖关系

```
Change 00 (contract-sync)
    │
    ├──→ Change 01 (layout-iconbar-shell)     ← 依赖 00 的 IconBar 列表 delta
    ├──→ Change 02 (project-switcher)          ← 依赖 00 的 IPC 通道名确认
    ├──→ Change 03 (rightpanel-statusbar)      ← 依赖 00 的 RightPanel tab 决定
    └──→ Change 04 (command-palette)           ← 依赖 00 的 IPC 文件列表通道确认
              │
              ▼
         Change 05 (hardening-gate)            ← 依赖 01-04 全部合并后
```

Change 01–04 **可并行**（无互相依赖），但都依赖 Change 00 的 delta spec 结论。

---

## 七、代码引用索引

| 文件 | 行号 | 关联缺陷 |
|------|------|---------|
| `apps/desktop/renderer/src/components/layout/IconBar.tsx` | 41-42, 57-80 | S0-2, S0-3 |
| `apps/desktop/renderer/src/components/layout/RightPanel.tsx` | 57-65 | S0-1 |
| `apps/desktop/renderer/src/features/ai/AiPanel.tsx` | 329-337, 437, 1091-1206 | S0-1 |
| `apps/desktop/renderer/src/features/projects/ProjectSwitcher.tsx` | 16-85 | S0-4 |
| `apps/desktop/renderer/src/components/layout/Sidebar.tsx` | 132-145 | S0-4 |
| `apps/desktop/renderer/src/features/commandPalette/CommandPalette.tsx` | 375+ | S1-1 |
| `apps/desktop/renderer/src/components/layout/StatusBar.tsx` | 10-47 | S1-2 |
| `apps/desktop/renderer/src/components/layout/AppShell.tsx` | 484+ | S1-3, S2-5 |
| `apps/desktop/renderer/src/stores/layoutStore.tsx` | 85-174 | S2-1, S2-2 |
| `apps/desktop/renderer/src/stores/themeStore.tsx` | 31-57 | S2-3, S2-4 |
| `apps/desktop/renderer/src/components/layout/Resizer.tsx` | 17-66 | S2-6 |
| `apps/desktop/renderer/src/stores/layoutStore.tsx` | 73-76, 162-172 | S2-7 |
| `packages/shared/types/ipc-generated.ts` | 2430 | IPC 漂移 |
| `apps/desktop/main/src/ipc/contract/ipc-contract.ts` | 1784 | IPC 漂移 |
| `openspec/specs/workbench/spec.md` | 76-85, 90, 167, 222, 236, 274, 303, 401, 410, 443, 487 | 所有 Spec 引用 |

---

## 八、Spec 要求完整覆盖矩阵

| Spec Requirement | Spec 行号 | 当前状态 | 目标 Change |
|-----------------|-----------|---------|------------|
| 整体布局架构（三栏 flex） | 37-68 | ✅ 基本满足 | 01 |
| Icon Bar 顺序与指示条 | 72-96 | ❌ 不符 | 00 + 01 |
| 左侧 Sidebar 拖拽 | 123-161 | ✅ 满足 | 01（验证） |
| 右侧面板 Tab 结构 | 165-218 | ❌ 不符（嵌套 + 多 tab） | 00 + 03 |
| 项目切换器 | 220-263 | ❌ 未集成 | 00 + 02 |
| 命令面板分类 + 文件搜索 | 266-295 | ❌ 缺失 | 04 |
| 状态栏完整信息 | 299-327 | ❌ 严重不足 | 03 |
| 主题切换 + 跟随系统 | 331-349 | ⚠️ 部分 | 05 |
| Zen 模式（F11） | 354,444-447 | ✅ 满足（layoutStore save/restore + ZenMode overlay） | —（已完成） |
| 全局快捷键 | 351-389 | ⚠️ 部分（缺去抖） | 05 |
| zod 校验 | 401 | ❌ 未实现 | 05 |
| 布局恢复失败回退 | 410-415 | ❌ 未实现 | 05 |
| 主题值非法阻断 | 443-448 | ⚠️ 部分（未写回） | 05 |
| 双拖拽冲突 | 436-441 | ⚠️ 隐式 | 05 |
| 命令面板性能 | 417-422 | ❓ 未验证 | 05 |
| 并发快捷键去抖 | 485-490 | ❌ 未实现 | 05 |
| 命令面板分页 | 478-483 | ❌ 未实现 | 04 |
| activePanel 持久化 | 111（隐含） | ❌ 未持久化 | 03 + 05 |

---

## 九、Storybook 覆盖度审计

| 组件 | Story 文件 | 需覆盖状态 | 当前状态 |
|------|-----------|-----------|---------|
| AppShell | `AppShell.stories.tsx` | 四种折叠态组合 | 需审计 |
| IconBar | `IconBar.stories.tsx` | 默认态、其他面板激活态、悬停态 | 需审计 |
| Sidebar | `Sidebar.stories.tsx` | 拖拽、min/max、折叠/展开 | 需审计 |
| RightPanel | `RightPanel.stories.tsx` | AI/Info/Quality 各状态 | 需审计（Tab 结构变更后需重写） |
| StatusBar | `StatusBar.stories.tsx` | 正常态、保存中态、保存错误态 | 需审计（信息补齐后需重写） |
| CommandPalette | `CommandPalette.stories.tsx` | 默认态、分类结果态、无结果态 | 需审计（分类功能实现后需补充） |
| ProjectSwitcher | **无** | 展开态、搜索态、空态 | ❌ 需新建 |
| Resizer | `Resizer.stories.tsx` | 默认态、悬停态、拖拽中 | 需审计 |

---

## 十、NFR 验收阈值

| 指标 | Spec 要求 | 验证方式 |
|------|----------|---------|
| 布局初始化 TTI | p50 < 500ms, p95 < 1.2s, p99 < 2s | Playwright + `performance.now()` |
| 侧栏展开/折叠 | p50 < 120ms, p95 < 220ms, p99 < 400ms | Playwright 动画帧测量 |
| 命令面板唤起 | p95 < 120ms | Playwright |
| 命令面板检索 | p95 < 200ms | 单元测试 + 计时 |
| 最近项目列表上限 | 200 | 单元测试 |
| 命令面板单次返回上限 | 300（分页） | 单元测试 |
