# 组件架构（Component Architecture）

> Source: Notion local DB page `33b99595-908f-4ca1-a61d-9be69742fd38`

> 📍

Primitives 基础完备，Radix UI 底座扎实。核心问题是业务层绕过 Primitives 散写原生元素。

## 三层架构模型

```
Layer 1: Primitives  → 基础 UI 原子（Button, Input, Dialog...）
Layer 2: Composites  → 组合组件（Toolbar, Sidebar Item, Command Palette Row...）
Layer 3: Patterns    → 页面级模式（Page Header, Editor Canvas, Settings Panel...）
```

原则： Layer 1 必须像素级完美，因为它是一切的基石。Layer 2 关注组合规则。Layer 3 关注页面节奏。

---

## Layer 1：Primitives 现状

### 已有组件清单（25 个）

基本使用 Radix UI 作为无头组件底座，耦合度极低，完全纯受控：

- 交互类： Button、Input、Textarea、Select、Checkbox、Radio、Toggle、Slider

- 反馈类： Dialog、Popover、Tooltip、Toast

- 展示类： Card、Accordion、Avatar、Badge、Skeleton、Tabs

- 上传类： ImageUpload

### 评估

- ✅ 耦合度极低，无状态依赖，只负责 UI 渲染

- ✅ 代码注释中频繁引用 design spec §xxx，有规范意识

- ✅ Button.tsx:40-99 已有统一状态定义（variant + size + state 数组映射）

- ✅ ListItem 已统一定义 focus-visible:outline-[var(--color-ring-focus)]

- ⚠️ hover/focus/disabled 状态和过渡动画尚未完全收敛到所有 Primitives

### 缺失组件

- ❌ ScrollArea — 当前最大的结构性缺口，导致 194 处碎片化滚动声明

- ❌ Typography 组件 — 无 <Heading>、<Text>、<Caption> 等语义化排版组件

- ❌ Surface / Panel 容器 — 无统一的面板容器抽象

---

## Layer 2：Composites 清单

> 🧩

Composites = Primitives 的有意义组合。 每个 Composite 封装一种「交互模式」而非一个「UI 元素」。业务层（Layer 3）只组装 Composites，不再直接拼装 Primitives。

### 从现有代码推导的 Composites

CN 的 69 个 Feature 组件中，反复出现以下组合模式——这些就是应该被抽象为 Layer 2 的 Composites：

| Composite | 组合的 Primitives | 封装的交互模式 | 当前散写位置（需收敛） |
| --- | --- | --- | --- |
| ToolbarGroup | Button × N + Separator + Tooltip | 水平工具栏，按钮组间距 + 溢出折叠 | EditorToolbar、DiffHeader 各自拼装 |
| CommandItem | ListItem + Kbd + Icon | 命令面板行：图标 + 标签 + 快捷键 + hover/active | SearchPanel 内散写，CommandPalette 重复实现 |
| SidebarItem | ListItem + Icon + Badge + DragHandle | 侧边栏导航项：可拖拽、可折叠、多层级缩进 | FileTreePanel、CharacterListPanel 各自实现 |
| PanelContainer | Surface + ScrollArea + ResizeHandle | 可停靠面板：标题栏 + 滚动区域 + 拖拽调整宽度 | AiPanel、SearchPanel、FileTreePanel 各自硬编码 h-screen  • overflow |
| FormField | Label + Input/Select/Textarea + ErrorText | 表单字段：标签 + 输入 + 校验错误提示 | SettingsPanel、ExportDialog 散写 |
| ConfirmDialog | Dialog + Text + Button × 2 | 确认弹窗：标题 + 描述 + 取消/确认按钮 | 多处重复实现 Dialog + 按钮组合 |
| DropdownMenu | Popover + ListItem × N + Separator | 下拉菜单：触发器 + 选项列表 + 分组分隔 | ModelPicker、ContextMenu 各自实现 |
| InfoBar | Surface + Icon + Text + Button(optional) | 信息提示条：成功/警告/错误 + 可选操作按钮 | Toast 之外的内联提示各处散写 |
| SearchInput | Input + Icon(search) + Kbd + ClearButton | 搜索框：前置图标 + 快捷键提示 + 清除按钮 | SearchPanel、CommandPalette、FileTreePanel 重复 |
| EmptyState | Surface + Icon + Text + Button(optional) | 空状态：插图/图标 + 说明文字 + 可选操作 | 多处内联 div  • 文字，无统一样式 |
| TabBar | Tabs + Badge + CloseButton | 标签栏：可关闭 + 未保存标记 + 拖拽排序 | EditorTabs 单点实现，无法复用 |
| PropertyRow | Label + dynamic value (Text/Select/Date/Person) | 属性行：左侧标签 + 右侧可编辑值 | CharacterDetailDialog、MetadataPanel 各自实现 |

### Composite 设计规则

1. 只组合 Layer 1 Primitives——Composite 不能依赖另一个 Composite（防止嵌套爆炸）

1. Props 透传 Primitive 的 variant/size——Composite 不发明新的 variant 系统，直接复用 Primitive 的

1. 零业务逻辑——Composite 不 import Store、不调用 IPC、不持有业务状态

1. Slot 模式处理变体——用 children / renderProp / slot 处理内容变化，而非 if/else 分支

1. 每个 Composite 必须有 Storybook story——独立可视化验证

### 实施优先级

| 优先级 | Composite | 理由 |
| --- | --- | --- |
| P0 | PanelContainer、SidebarItem、CommandItem | 覆盖最多"脏区"文件，收益最大 |
| P1 | SearchInput、ToolbarGroup、FormField | 消除重复代码最多 |
| P2 | ConfirmDialog、DropdownMenu、EmptyState | 统一交互模式 |
| P3 | InfoBar、TabBar、PropertyRow | 目前散写点较少，可后续补 |

### 与改造计划的协同

```
Phase 1 (Primitives 补全)    → ScrollArea + Typography + Surface 就位
                                ↓
Phase 2 (Composites 封装)     → 用 ↑ 的 Primitives 组装 12 个 Composites
                                ↓
Phase 3 (Feature 层清理)      → Feature 组件替换散写代码为 Composites
```

每个 Composite 封装后，对应的"脏区"文件自然被清理——Composites 是 Feature 层清理的前置条件，不是独立任务。

---

## Layer 3：Features 现状

### 规模

- 69 个 Feature 组件，分布在 src/features/ 下

- 核心业务容器：DashboardPage、SearchPanel、AiPanel、FileTreePanel、KnowledgeGraph

### 耦合度分析

| 指标 | 数值 | 评估 |
| --- | --- | --- |
| 直接使用 Store Hook 的文件 | 43 处 import { useXxxStore } | ⚠️ 中等偏高 |
| 直接调用 IPC invoke 的文件 | 13 个 | ⚠️ 渲染/主进程边界模糊 |
| 散写原生 <button> / <input> | 较多 | ❌ 绕过 Primitives |
| 样式硬编码比例 | ~15-20% 业务组件 | ⚠️ 需清理 |

### "脏区"集中文件

以下 Feature 组件是违规最集中的区域，优先清理：

1. SearchPanel.tsx — 硬编码颜色 + Z-Index 违规 + 散写原生元素

1. CharacterDetailDialog.tsx — 魔法数值 + 硬编码色值 + transition-all

1. VersionHistoryPanel.tsx — 硬编码颜色 + 滚动处理碎片化

1. ExportDialog.tsx:727 — 局部绕过设计系统

1. KnowledgeGraph.tsx — Z-Index 硬编码 + 绝对定位越权

---

## 改造方案

### 1. 补全缺失 Primitives（优先）

ScrollArea：

- 封装统一的滚动容器，处理滚动条样式、阴影遮罩、越界隐藏

- 替换全局 194 处碎片化的 overflow-* 声明

Typography：

- 封装 <Heading level={1-4}> / <Text size="sm|base|lg"> / <Caption> 等

- 内部引用 Typography Token，业务代码通过语义名称引用

Surface / Panel：

- 封装统一面板容器，业务组件不再自行处理 h-screen / overflow / border

- Panel 自动处理可停靠、可伸缩逻辑

### 2. 收敛 Primitives 的交互状态

改造难度：低。 架构已高度收敛。

执行方案：

- 在 Button.tsx、Input.tsx、Select.tsx、Card、ListItem 的基础类字符串数组中更新 hover: / focus-visible: 规则

- 统一引用 --duration-fast 和 --ease-default

- 这些改动会立即全站全局生效

### 3. 清理 Feature 层违规

两段式策略：

1. Phase A： 改好 Primitives → 自动获得一波全局收益

1. Phase B： 逐个清理 5 个"脏区" Feature，替换原生元素为 Primitives，清除硬编码

### 4. IPC 调用收敛

当前 13 个文件直接调用 IPC invoke，应收敛到统一的 Service 层：

```
Feature 组件 → Service 层（统一 IPC 调用）→ Main Process
```

禁止 Feature 组件直接 import { ipcRenderer } 或 window.electron.invoke()。
