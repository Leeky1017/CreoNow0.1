# V1-05 编辑器组件拆分

> **✅ 已合并** · 评级 ⭐⭐⭐⭐⭐（教科书级解体）

- **状态**: ✅ 已合并到 main
- **所属任务簇**: V1（视觉重塑）— Wave 1 P0 页面重塑
- **umbrella**: v1-00-visual-overhaul-program
- **涉及模块**: editor
- **前端验收**: 通过（全部现有行为不变 + Storybook 构建通过）

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

### 4. 证据来源（拆分前后对比）

| 数据点                    | 拆分前                           | 拆分后（实测）     | 来源         |
| ------------------------- | -------------------------------- | ------------------ | ------------ |
| **EditorPane.tsx**        | 1,550 行                         | **232 行 ↓85%**    | `wc -l`      |
| useEditorSetup.ts         | —（内嵌）                        | 290 行             | `wc -l`      |
| InlineAiOverlay.tsx       | ~300 行（内嵌）                  | 200 行             | `wc -l`      |
| EntityCompletionPanel.tsx | ~200 行（内嵌）                  | 86 行              | `wc -l`      |
| useEntityCompletion.ts    | —（内嵌）                        | 269 行             | `wc -l`      |
| SlashCommandPanel.tsx     | ~150 行（内嵌）                  | 84 行              | `wc -l`      |
| useEditorKeybindings.ts   | ~200 行（内嵌）                  | 219 行             | `wc -l`      |
| useAutosave.ts            | ~100 行（内嵌）                  | 87 行              | `wc -l`      |
| EditorToolbar.tsx         | 457 行                           | 97 行              | `wc -l`      |
| ToolbarFormatGroup.tsx    | —（内嵌）                        | 270 行             | `wc -l`      |
| EditorBubbleMenu.tsx      | 414 行                           | 170 行             | `wc -l`      |
| BubbleMenuFormatActions   | —（内嵌）                        | 183 行             | `wc -l`      |
| BubbleMenuAiActions       | —（内嵌）                        | 120 行             | `wc -l`      |
| editor/ 目录总行数        | —                                | 9,406 行（含测试） | `wc -l` 合计 |
| 目标：拆分后单一职责      | 每文件只承担一个可独立测试的职责 | ✅ 达成            | 架构验证     |

---

## What：做什么

### 1. 提取 `useEditorSetup.ts` [✅ 已完成]

将 TipTap 编辑器初始化与配置逻辑（扩展注册、editor 实例创建、初始内容设置）提取为独立 custom hook。返回 editor 实例供 EditorPane 消费。

- **实际文件**: `features/editor/useEditorSetup.ts`（290 行）

### 2. 提取 `InlineAiOverlay.tsx` [✅ 已完成]

将 inline AI 输入处理（AI 调用触发、proposal 展示、accept/reject 逻辑）提取为独立组件。接收 editor 实例作为 prop，自行管理 AI 交互的 UI 状态。

- **实际文件**: `features/editor/InlineAiOverlay.tsx`（200 行），另有子组件 `InlineAiInput.tsx`（70 行）、`InlineAiDiffPreview.tsx`（127 行）、`InlineDiffControls.tsx`（157 行）

### 3. 提取 `EntityCompletionPopover.tsx` [✅ 已完成]

将 `@` mention 触发、候选列表渲染、键盘导航（上下选择、Enter 确认、Esc 取消）提取为独立弹出层组件。

- **实际文件**: `features/editor/EntityCompletionPanel.tsx`（86 行）+ `useEntityCompletion.ts`（269 行）
- **命名调整**: 最终命名为 Panel 而非 Popover，逻辑拆分为 hook + 渲染组件

### 4. 提取 `SlashCommandMenu.tsx` [✅ 已完成]

将 `/` 命令面板（命令注册、命令列表渲染、命令执行）提取为独立菜单组件。

- **实际文件**: `features/editor/SlashCommandPanel.tsx`（84 行）+ `slashCommands.ts`（107 行）
- **命名调整**: 最终命名为 Panel 而非 Menu

### 5. 提取 `useEditorKeybindings.ts` [✅ 已完成]

将全局快捷键和编辑器快捷键绑定逻辑提取为独立 custom hook。接收 editor 实例和 action handlers。

- **实际文件**: `features/editor/useEditorKeybindings.ts`（219 行）

### 6. 精简 `EditorPane.tsx` 为纯布局编排层 [✅ 已完成]

EditorPane.tsx 剥离所有业务逻辑后，仅保留编排职责：

- 导入并组合上述子模块
- 布局 JSX 结构（toolbar、编辑器正文、zen mode 切换）
- 传递 editor 实例和 store state 给子模块
- **实际结果**: 1,550 → **232 行**（目标 ≤300，超额达成 ↓85%）

### 7. EditorToolbar.tsx 职责拆分——按按钮分组解耦 [✅ 已完成]

EditorToolbar.tsx（457 行）将格式化按钮、块级按钮、框架编排三个独立职责糊在一起，按职责边界拆分：

- **`ToolbarFormatGroup.tsx`**（270 行） — 格式化按钮组（单一职责：内联样式操作）
- **`ToolbarButton.tsx`**（52 行） — 可复用按钮原子组件
- **`EditorToolbar.tsx`**（97 行） — 工具栏框架 + 按钮组组合 + active 态同步（编排层）
- **实际结果**: 457 → **97 行**（↓79%），拆出 ToolbarFormatGroup + ToolbarButton

### 8. EditorBubbleMenu.tsx 职责拆分——操作类型分离 [✅ 已完成]

EditorBubbleMenu.tsx（414 行）将格式操作、AI 操作、浮动逻辑三个不同关注点耦合在一个文件中，按操作类型拆分：

- **`BubbleMenuFormatActions.tsx`**（183 行） — 浮动菜单内格式操作按钮组
- **`BubbleMenuAiActions.tsx`**（120 行） — AI 快捷操作入口
- **`EditorBubbleMenu.tsx`**（170 行） — 浮动菜单框架 + shouldShow 逻辑 + 子组件组合
- **实际结果**: 414 → **170 行**（↓59%）

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

- **上游依赖**: 无直接上游依赖
- **下游影响**: v1-06（AI 面板大整修）将直接受益——inline AI 拆分为独立组件后，v1-06 修改 AI 交互逻辑只需在 `InlineAiOverlay.tsx` 中操作
- **下游刷新**: 无直接下游需刷新
- **风险控制**: ✅ 纯重构已合并，100% 行为等价，零回归

---

## 完成总结

> 「庖丁解牛，游刃有余。」——《庄子·养生主》

| 指标                 | 目标    | 实际       | 评定        |
| -------------------- | ------- | ---------- | ----------- |
| EditorPane.tsx 行数  | ≤300 行 | **232 行** | ✅ 超额达成 |
| 瘦身幅度             | —       | **↓85%**   | ⭐⭐⭐⭐⭐  |
| 提取模块数           | 6 个    | 8+ 个      | ✅ 超额达成 |
| EditorToolbar.tsx    | 拆分    | 457→97 行  | ✅ ↓79%     |
| EditorBubbleMenu.tsx | 拆分    | 414→170 行 | ✅ ↓59%     |
| 行为等价             | 100%    | **100%**   | ✅ 零回归   |
| 所有子模块 ≤300 行   | 是      | **是**     | ✅ 全部达标 |

EditorPane 从 1,550 行的巨石文件瘦身至 232 行的纯编排层，超额完成 ≤300 行目标。共提取 `useEditorSetup`、`InlineAiOverlay`、`EntityCompletionPanel`、`SlashCommandPanel`、`useEditorKeybindings`、`useAutosave`、`ToolbarFormatGroup`、`BubbleMenuFormatActions`、`BubbleMenuAiActions` 等独立模块，每个模块单一职责、可独立测试。EditorToolbar 和 EditorBubbleMenu 同步完成职责拆分。全量测试 100% 通过，零行为回归。
