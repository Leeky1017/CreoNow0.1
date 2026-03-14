# A0-01 禅模式改为真实可编辑

- **GitHub Issue**: #986
- **所属任务簇**: P0-1（真实编辑与 AI 基线）
- **涉及模块**: editor
- **前端验收**: 需要

---

## Why：为什么必须做

### 1. 用户现象

用户按下 F11 进入禅模式，看到深色背景、居中的标题与段落、闪烁的光标——一切迹象暗示「这里可以安静创作」。然而光标只是装饰，文字不可选中、不可输入、不可删改。用户的双手悬于键盘之上，却如同面对石板刻碑——"笔墨已备、砚台已开、纸却是画上去的。"

这不是一个小问题。禅模式的存在意义就是沉浸式书写，如果不能写，它就是一个纯粹的假 UI——不如不做。

### 2. 根因

`ZenMode.tsx` 通过 `content.paragraphs.map()` 渲染静态 `<p>` 元素，`BlinkingCursor` 只是一个 CSS 动画的 `<span>`。整个禅模式没有挂载 TipTap `EditorContent`，没有编辑器实例，没有写回链路。`AppShell.tsx` 中的 `ZenModeOverlay` 通过 `extractZenModeContent()` 从 `editorStore` 的 JSON 提取纯文本传入——这是一条单向只读管道。

具体问题链路：

- **无编辑器实例**：`ZenMode` 组件接收 `ZenModeContent`（title + paragraphs 字符串数组），而非 TipTap `Editor` 实例
- **无 `EditorContent`**：没有 `@tiptap/react` 的 `EditorContent` 组件挂载，自然没有任何编辑能力
- **假光标**：`BlinkingCursor` 是 `aria-hidden="true"` 的纯装饰 `<span>`，与编辑器光标无关
- **无写回链路**：即使能输入，当前架构也没有从禅模式写回 `editorStore` / autosave 的通道

### 3. v0.1 威胁

- **核心承诺落空**：CreoNow 作为创作 IDE，禅模式是核心创作场景之一。只读禅模式让用户对「沉浸创作」的期待彻底落空
- **P0-1 任务簇基石**：A0-01 是 P0-1 的根基——A0-12（Inline AI 基线）的前提是编辑器在所有模式下都可用，如果禅模式不可编辑，后续 AI 协作场景就是建立在幻觉之上
- **信任损害**：用户第一次在禅模式中尝试打字却毫无响应，就会判定这个功能是半成品——"连最基本的写字都做不到，AI 创作能有多靠谱？"

### 4. 证据来源

| 文档                                      | 章节                | 内容                                                                                                      |
| ----------------------------------------- | ------------------- | --------------------------------------------------------------------------------------------------------- |
| `docs/audit/amp/01-master-roadmap.md`     | §4.1                | 禅模式列为"真实编辑能力"必修项                                                                            |
| `docs/audit/amp/07-ui-ux-design-audit.md` | §二 假 UI 清单      | "ZenMode is read-only display with fake cursor"                                                           |
| `docs/audit/amp/07-ui-ux-design-audit.md` | §五 禅模式现状分析  | "全屏深色背景 + 静态段落展示 + 假光标闪烁 + hover 退出按钮。根本问题：无编辑能力。进入后只能看，不能写。" |
| `openspec/specs/editor/spec.md`           | Requirement: 禅模式 | 定义了禅模式的视觉规格与进出机制，但未明确要求使用 TipTap EditorContent                                   |
| `ZenMode.tsx`                             | 全文                | `content.paragraphs.map()` 渲染静态 `<p>`；`BlinkingCursor` 是装饰性 `<span>`                             |
| `AppShell.tsx`                            | `ZenModeOverlay`    | 通过 `extractZenModeContent()` 提取纯文本，单向只读传入 `ZenMode`                                         |

---

## What：做什么

1. **挂载 TipTap EditorContent**：禅模式正文区域替换静态 `<p>` 渲染为 TipTap `EditorContent`，复用 `editorStore` 中的同一 `Editor` 实例——不创建新实例，避免状态分裂
2. **移除假光标**：删除 `BlinkingCursor` 组件和 `showCursor` prop，使用 TipTap 编辑器的真实光标
3. **禅模式专属编辑器样式**：为禅模式下的 `EditorContent` 设置专属样式类（字号 `--zen-body-size`、行高 `--zen-body-line-height`、文字色 `--color-zen-text`、字体 `--font-family-body`），确保沉浸视觉不变
4. **隐藏工具栏与辅助 UI**：禅模式下隐藏 `EditorToolbar`、`BubbleMenu`、slash command、右键菜单中的 AI 相关项——保持纯写作沉浸
5. **自动保存正常工作**：禅模式下 autosave 照常运行（同一 editor 实例，无需额外处理），状态栏保存状态通过底部 `ZenModeStatus` 展示
6. **退出后保留编辑**：退出禅模式后，所有在禅模式中的编辑已通过同一 editor 实例实时同步到 `editorStore`，无需额外合并逻辑

---

## Non-Goals：不做什么

1. **不做 OS 层全屏**——禅模式为应用内全屏覆盖层（`z-index: var(--z-modal)`），不调用 `document.fullscreenElement` 或 Electron `BrowserWindow.setFullScreen`
2. **不在禅模式开放 AI 功能**——禅模式的定位是「纯手工创作的沉浸空间」，不提供 slash command、AI 面板、Bubble Menu 中的 AI 相关功能；此决定来自 `editor/spec.md` 明确声明 "NO AI assistance is available in Zen Mode"
3. **不在禅模式显示 EditorToolbar**——禅模式隐藏所有干扰元素（侧栏、右栏、工具栏、主状态栏），格式操作通过键盘快捷键完成
4. **不创建独立的 editor 实例**——禅模式必须复用 `editorStore.editor`，不得创建第二个 TipTap editor 以避免状态分裂、autosave 失效、undo 历史断裂
5. **不修改禅模式的视觉设计**——背景色 `--color-zen-bg`、辐射光晕 `--color-zen-glow`、内容居中 `--zen-content-max-width`、字号 `--zen-body-size` 等视觉参数保持不变
6. **不修改进出快捷键**——F11 进入、Escape / F11 退出的键绑定保持不变

---

## 依赖与影响

- **上游依赖**: 无——编辑器基础能力（TipTap EditorContent、editorStore）已存在
- **被依赖于**: A0-12（Inline AI 基线）——禅模式可编辑后，后续才能考虑是否在禅模式下引入部分 AI 能力（当前 spec 明确说不引入，但 A0-12 需要确认所有编辑模式的基线）
- **受益于**: A0-02（自动保存失败可见化）——禅模式下的 autosave 状态通过 `ZenModeStatus` 展示，A0-02 完成后失败状态更清晰
