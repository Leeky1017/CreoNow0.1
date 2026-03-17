# V1-05 编辑器组件拆分

- **GitHub Issue**: 待创建
- **所属任务簇**: V1（视觉重塑）— Wave 1 P0 页面重塑
- **umbrella**: v1-00-visual-overhaul-program
- **涉及模块**: editor
- **前端验收**: 需要（全部现有行为不变 + Storybook 构建通过）

---

## Why：为什么必须做

### 1. 用户现象

EditorPane.tsx 以 1,550 行之身，居全仓 Features 层文件第二大——仅次于 AiPanel.tsx（2,500 行）。一个文件中揉合了 TipTap 编辑器初始化、inline AI 输入处理、Entity Completion 弹出层、Slash Command 菜单、autosave 集成、快捷键注册、布局渲染七大职责。「百工同室而作，器虽未废，匠必相碍。」

这不是用户直接可见的视觉问题，而是一个结构性的维护工程学问题：

- **修改 inline AI 行为需阅读 1,550 行**：AI 相关的 ~300 行散布在编辑器初始化、键盘事件、渲染逻辑之间，无法独立理解
- **Entity Completion 和 Slash Command 的键盘导航逻辑耦合**：两者共享 keydown handler，修改一个容易影响另一个
- **快捷键注册与编辑器逻辑交织**：~200 行快捷键代码与编辑器内容逻辑在同一作用域中，作用域污染
- **v1-04 和 v1-06 的先决条件**：v1-04 修改 typography/layout 需要在 1,550 行中精确定位；v1-06 修改 AI 面板与编辑器的交互需要理解 inline AI 部分——"巨石不解，后续工程寸步难行"

### 2. 根因

EditorPane 的巨石化是渐进式功能叠加的自然结果：TipTap 编辑器初始化 → 加入 inline AI → 加入 Entity Completion → 加入 Slash Command → 加入 autosave → 加入快捷键。每次增量合理，累积后失控——"积微成著，月不知其盈也。"

这些功能模块之间只有松散的数据依赖（共享 editor 实例 + store state），完全可以通过 custom hooks 和独立组件拆分。

### 3. 威胁

- **维护成本指数增长**：1,550 行的 cognitive load 使任何修改都需要 20+ 分钟的上下文理解，bug 修复引发 side effect 的概率随行数非线性增长
- **并行开发阻塞**：两个 Agent/开发者无法同时修改 EditorPane 的不同功能——merge conflict 几乎必然
- **v1-04 / v1-06 风险放大**：如果不先拆分，v1-04（typography）和 v1-06（AI 面板）都要在 1,550 行中做精度手术，风险显著高于在 300 行子模块中修改

### 4. 证据来源

| 数据点 | 值 | 来源 |
| --- | --- | --- |
| EditorPane.tsx 行数 | 1,550 行 | `wc -l` |
| Features 层排名 | 第 2 大（仅次于 AiPanel.tsx 2,500 行） | `wc -l` 排序 |
| TipTap 初始化代码 | ~200 行 | 代码审计 |
| Inline AI 处理代码 | ~300 行 | 代码审计 |
| Entity Completion 代码 | ~200 行 | 代码审计 |
| Slash Command 代码 | ~150 行 | 代码审计 |
| Autosave 集成代码 | ~100 行 | 代码审计 |
| 快捷键注册代码 | ~200 行 | 代码审计 |
| 布局渲染代码 | ~400 行 | 代码审计 |
| 目标：拆分后单一职责 | 每文件只承担一个可独立测试的职责 | 架构目标 |

---

## What：做什么

### 1. 提取 `useEditorSetup.ts`

将 TipTap 编辑器初始化与配置逻辑（扩展注册、editor 实例创建、初始内容设置）提取为独立 custom hook。返回 editor 实例供 EditorPane 消费。

### 2. 提取 `InlineAiOverlay.tsx`

将 inline AI 输入处理（AI 调用触发、proposal 展示、accept/reject 逻辑）提取为独立组件。接收 editor 实例作为 prop，自行管理 AI 交互的 UI 状态。

### 3. 提取 `EntityCompletionPopover.tsx`

将 `@` mention 触发、候选列表渲染、键盘导航（上下选择、Enter 确认、Esc 取消）提取为独立弹出层组件。

### 4. 提取 `SlashCommandMenu.tsx`

将 `/` 命令面板（命令注册、命令列表渲染、命令执行）提取为独立菜单组件。

### 5. 提取 `useEditorKeybindings.ts`

将全局快捷键和编辑器快捷键绑定逻辑提取为独立 custom hook。接收 editor 实例和 action handlers。

### 6. 精简 `EditorPane.tsx` 为纯布局编排层

EditorPane.tsx 剥离所有业务逻辑后，仅保留编排职责：
- 导入并组合上述子模块
- 布局 JSX 结构（toolbar、编辑器正文、zen mode 切换）
- 传递 editor 实例和 store state 给子模块

### 7. EditorToolbar.tsx 职责拆分——按按钮分组解耦

EditorToolbar.tsx（457 行）将格式化按钮、块级按钮、框架编排三个独立职责糊在一起，按职责边界拆分：

- **`ToolbarFormatGroup.tsx`** — 格式化按钮组：Bold / Italic / Underline / Strikethrough / Code（单一职责：内联样式操作）
- **`ToolbarBlockGroup.tsx`** — 块级按钮组：Heading / List / Blockquote / CodeBlock / HR（单一职责：块级结构操作）
- **`EditorToolbar.tsx`** — 工具栏框架 + 按钮组组合 + active 态同步（单一职责：编排层）

### 8. EditorBubbleMenu.tsx 职责拆分——操作类型分离

EditorBubbleMenu.tsx（414 行）将格式操作、AI 操作、浮动逻辑三个不同关注点耦合在一个文件中，按操作类型拆分：

- **`BubbleMenuFormatActions.tsx`** — 浮动菜单内格式操作按钮组（单一职责：内联样式操作）
- **`BubbleMenuAiActions.tsx`** — AI 快捷操作入口（单一职责：AI 交互入口）
- **`EditorBubbleMenu.tsx`** — 浮动菜单框架 + shouldShow 逻辑 + 子组件组合（单一职责：弹出层编排）

---

## Non-Goals：不做什么

1. **不改任何现有行为**——纯结构重构，所有功能的外部表现完全不变
2. **不改 typography/layout**——排版调整由 v1-04 负责
3. **不改 Store 接口**——Zustand store 的 API 不变
4. **不改 TipTap 扩展列表**——编辑器扩展数量和配置不变
5. **不优化性能**——不改 memo、不改渲染策略，仅拆分文件
6. **不新增功能**——不加 feature，不改交互流程

---

## 依赖与影响

- **上游依赖**: 无直接上游依赖。建议在 v1-04 之后或同时进行——如 v1-04 已合并，v1-05 在拆分后的结构上进行；如并行，两者需协调修改边界
- **下游影响**: v1-06（AI 面板大整修）将直接受益——inline AI 拆分为独立组件后，v1-06 修改 AI 交互逻辑只需在 `InlineAiOverlay.tsx` 中操作
- **风险控制**: 本 change 是纯重构，风险点在于拆分过程中遗漏隐式依赖。应确保拆分前后全量测试 100% 通过，行为无任何变化
