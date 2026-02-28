# AI Native 内容架构——结构层与呈现层设计

> Source: Notion local DB page `ed448a12-b11c-4705-a8e5-49aaacc72b82`

> 🎯

核心命题：让人类看到最好的界面，而底层对 AI 完全透明。 结构层是从语义层派生的轻量 AST，呈现层是纯粹的视觉渲染——两者都不写回存储核心。CN 的前端要做到：AI 流式输出时 UI 丝滑更新，人类编辑时体验不输 Notion。whatis2@

---

## 1. 三层分离原则（全局锚点）

```
┌─────────────────────────────────┐
│   呈现层（Presentation）         │  ← 人类看到的：排版、样式、交互      【本页】
├─────────────────────────────────┤
│   结构层（Structure）            │  ← 轻量标注：段落、标题、引用等      【本页】
├─────────────────────────────────┤
│   语义层（Semantic）             │  ← AI 消费的：连续文本 + 语义标签    【后端侧】
└─────────────────────────────────┘
```

- 语义层（后端侧）：存储核心，AI 直接消费 → 详见 ‣

- 结构层（本页）：从语义层派生的轻量 AST，可缓存可重建

- 呈现层（本页）：渲染引擎 + design token，不写回存储

---

## 2. 结构层：派生的、而非规定的

### 2.1 核心思想

结构层回答的问题是：这段文字的组织形式是什么？

```
语义层的 content + spans
  → 结构解析器（Structure Parser）
    → 输出：轻量 AST（段落、标题、列表、引用...）
```

这个 AST 和 Notion 的 block 树看起来很像，但有本质区别：

| 维度 | Notion 的 Block | CN 的结构 AST |
| --- | --- | --- |
| 地位 | 是存储的主体 | 是从语义层派生的缓存 |
| 持久化 | 每个 block 独立存储在数据库中 | 可缓存，但随时可从语义层重建 |
| AI 写入路径 | text → parse → create blocks → save each | text → append to content → invalidate AST cache |
| 编辑粒度 | 必须定位到具体 block | 直接操作文本偏移量，AST 自动更新 |

### 2.2 增量解析

> 💡

类比：Tree-sitter 对代码做的事，CN 要对散文做。 文本变化时只重新解析受影响的区间，不重建整棵树。

增量解析的核心流程：

```
sequenceDiagram
    participant S as 语义层 (content)
    participant P as Structure Parser
    participant A as AST Cache
    participant R as Renderer

    Note over S: 文本发生变化（人类编辑或 AI 输出）
    S->>P: changeEvent { range, newText }
    P->>P: 仅重新解析受影响区间
    P->>A: patchAST(affectedNodes)
    A->>R: astDiff
    R->>R: 仅重绘变化的视觉节点
```

性能关键：

- 普通编辑（敲一个字）：只影响当前段落节点，解析时间 < 1ms

- AI 流式输出（每 100ms 追加一批 token）：只解析新增区间，不触碰已有 AST 节点

- 大规模粘贴/替换：最差情况退化为全量解析，但仍然比逐 block 创建快

### 2.3 与 ProseMirror/TipTap 的关系

CN 目前使用 TipTap 2.26 / ProseMirror 作为编辑器。ProseMirror 本身就是基于 document → schema → node tree 的模型，而非独立 block 实体。

适配建议：

- ProseMirror 的 doc 节点树本质上就是一棵结构 AST，可以直接复用

- 关键改造点：ProseMirror 的 State.doc 应该从语义层的 content + spans 派生，而不是作为 source of truth

- AI 写入时：先更新语义层 content → 然后通过 tr.replaceWith() 同步 ProseMirror state → ProseMirror 自动增量更新视图

- 人类编辑时：ProseMirror transaction → 反向同步到语义层 content + spans

```
graph LR
    subgraph Backend["后端（语义层）"]
        C["content\n连续文本"]
    end

    subgraph Frontend["前端（结构层）"]
        PM["ProseMirror State\nAST = doc node tree"]
    end

    C -->|"AI 写入 / 加载"| PM
    PM -->|"人类编辑"| C

    PM --> V["ProseMirror View\n渲染到 DOM"]

    style C fill:#e8f5e9,stroke:#4CAF50
    style PM fill:#e3f2fd,stroke:#1976D2
    style V fill:#fff3e0,stroke:#FF9800
```

---

## 3. 呈现层：厚客户端，薄存储

### 3.1 核心原则

```
结构 AST
  → 渲染引擎（ProseMirror View + CN Design Token）
    → 排版、字体、间距、动画、交互
    → 完全是前端的事，不写回存储
```

以下内容不进入语义层存储：

- 字体大小、颜色、间距等纯视觉属性 → 用 ‣ 在渲染时决定

- 折叠状态、光标位置、滚动位置 → 前端 session 状态

- 多种渲染模式（编辑模式、阅读模式、大纲模式、PDF 导出）→ 同一份 content，不同渲染管线

### 3.2 语义属性 vs 视觉属性的边界

> ⚠️

判定规则：如果一个标注影响 AI 对文本的理解，它就属于语义层；如果只影响人类的视觉感受，它就属于呈现层。

| 标注类型 | 归属 | 理由 |
| --- | --- | --- |
| 加粗 | 语义层 span | 表示"强调"，AI 需要知道哪些内容被作者标记为重点 |
| 斜体 | 语义层 span | 可能表示内心独白、术语、书名等语义信息 |
| 分隔线 | 语义层 span | 表示"话题转换"或"场景切换" |
| 用户高亮（标记重点） | 语义层 span | 创作者有意标注的重要段落，AI 应感知 |
| 字体大小 | 呈现层 | 纯视觉排版，不影响语义理解 |
| 行间距 | 呈现层 | 纯视觉排版 |
| 装饰性颜色 | 呈现层 | 纯视觉美化 |
| 折叠/展开状态 | 呈现层（session） | 临时交互状态 |

### 3.3 多渲染模式

同一份语义层 content 可以呈现为多种视觉形态：

| 模式 | 渲染策略 | 用途 |
| --- | --- | --- |
| 编辑模式 | ProseMirror View + 完整交互 | 主写作界面 |
| 阅读模式 | 连续排版流（像书一样），无可编辑元素 | 长文阅读、预览 |
| 大纲模式 | 只渲染 heading 节点，可折叠层级视图 | 结构导航 |
| 导出模式 | 生成 PDF/EPUB/HTML | 发布 |

这是 block 模型很难做到的——因为 block 同时是存储和渲染单元，渲染模式切换意味着底层数据结构也要变。语义层 + 派生渲染的架构天然支持多模式。

---

## 4. AI 流式输出的 UI 更新策略

### 4.1 全链路：从 Token 到像素

```
sequenceDiagram
    participant LLM as LLM
    participant M as Main Process
    participant CB as ChunkBatcher
    participant SL as 语义层 (content)
    participant PM as ProseMirror State
    participant V as ProseMirror View

    loop 流式输出
        LLM->>M: token chunks
        M->>CB: push(tokens)
        CB->>SL: append to content（批量）
        CB->>PM: tr.insertText()（批量）
        PM->>V: 增量 DOM 更新
    end

    Note over V: 用户看到文字逐步出现，丝滑无卡顿
```

### 4.2 对比 Notion 的渲染路径

```
Notion:
  token → create block → insert into block tree → React re-render block component
  → 每个 block 是独立 React 组件 → 大量组件挂载 → 渲染树瞬间重建 → 白屏

CN:
  token → append text → ProseMirror incremental update → 只更新变化的 DOM 节点
  → 无新组件挂载 → 无渲染树重建 → 丝滑
```

关键差异：Notion 的每个 block 是独立 React 组件，AI 生成 100 个 block = 挂载 100 个 React 组件。CN 的 ProseMirror 是对整个文档做 DOM diff，AI 输出再多文本也只是一次 insertText transaction。

### 4.3 前端配合后端防护

与 ‣ 及 ‣ 协同：

| 后端提供 | 前端配合 |
| --- | --- |
| ChunkBatcher 后的批量 IPC push | 按批量更新 ProseMirror state，不需逐 token 触发 transaction |
| 背压信号（ai:stream:backpressure） | 降低更新频率，显示"生成中"占位或骨架动画 |
| 流结束事件（SKILL_STREAM_DONE） | 触发语法高亮、LaTeX 渲染等后处理 |
| 事务回滚通知（{ rolledBack: true }） | 恢复到 AI 生成前的 ProseMirror state 快照 |
| 版本冲突通知（VERSION_CONFLICT） | 提示用户 AI 生成被丢弃，手动编辑已保留 |

---

## 5. 人类编辑体验：不输 Notion

### 5.1 "人类消费"不等于"block 呈现"

CN 的最终读者是人类创作者和读者。但人类消费内容的最佳方式不一定是 Notion 式的 block 编辑器：

- 长文阅读需要的是连续的排版流（像书一样），不是可拖拽的 block

- 大纲/结构需要的是可折叠的层级视图，这从结构 AST 直接派生就够了

- 协作批注标注在语义区间上比标注在 block 上更精确——可以标注半句话，而不是整个段落 block

### 5.2 用户交互的映射

用户的每个编辑操作最终都映射为对语义层 content 的区间操作：

| 用户操作 | ProseMirror 处理 | 语义层影响 |
| --- | --- | --- |
| 打字输入 | tr.insertText() | content insert at offset + 更新受影响的 spans 偏移 |
| 删除文字 | tr.delete() | content delete at range + 收缩/删除受影响的 spans |
| 拖拽段落 | tr.delete()  • tr.insert() | content 区间移动 + spans 偏移重算 |
| 加粗/标记 | tr.addMark() | 新增语义 span（role: emphasis / highlight） |
| 创建标题 | tr.setNodeMarkup() | 新增/修改 span（role: heading, level: N） |

### 5.3 ProseMirror State 快照

用于 AI 回滚场景：AI 开始生成前，保存当前 ProseMirror EditorState 快照。如果后端发来 rollback 通知，直接恢复到快照状态，用户看到的是"AI 生成被撤销"，体验干净利落。

```
// AI 生成前
const snapshot = editorView.state;

// 收到 rollback 通知
editorView.updateState(snapshot);
```

---

## 6. 相关页面

- ‣ — 后端侧的存储核心设计

- ‣ — 后端四道防线，前端需配合的协议

- ‣ — 现有 ProseMirror + Zustand 架构

- ‣ — 呈现层的视觉变量系统

- ‣ — AI 输出时的过渡动画设计

- ‣ — 渲染性能的全局优化策略
