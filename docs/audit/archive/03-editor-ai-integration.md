# 03 — 编辑器 × AI 深度集成

> 对应问题：P2-9（编辑器无 AI 内联功能）、P2-10（无禅模式）、P2-11（Diff 对比为占位）

---

## 一、CN 当前状态

### 1.1 编辑器扩展列表

**文件**：`apps/desktop/renderer/src/features/editor/EditorPane.tsx`

TipTap 编辑器挂载的扩展：

```typescript
extensions: [
  StarterKit,           // 基础：段落、标题、列表、引用、代码块、水平线
  Underline,            // 下划线
  Link.configure({ openOnClick: false, autolink: false, linkOnPaste: false }),
  BubbleMenuExtension,  // 浮动格式菜单
]
```

**完全没有 AI 相关扩展**。没有：
- Inline suggestion / ghost text 扩展
- Slash command 扩展
- AI decoration（标记 AI 生成的内容）
- 自动补全扩展

### 1.2 Bubble Menu 仅有格式按钮

**文件**：`apps/desktop/renderer/src/features/editor/EditorBubbleMenu.tsx`

选中文本后显示的浮动菜单只有：Bold、Italic、Underline、Strike、Code、Link。

**没有任何 AI 操作按钮**（润色、改写、续写、解释）。

### 1.3 Link 插入硬编码

```typescript
const toggleLink = () => {
  if (editor.isActive("link")) {
    editor.chain().focus().unsetLink().run();
    return;
  }
  editor.chain().focus().setLink({ href: "https://example.com" }).run();
};
```

直接写入 `"https://example.com"` 而非弹出输入框。

### 1.4 AI 面板与编辑器的交互路径

当前用户使用 AI 的完整流程：
1. 在编辑器中选中文本（或不选）
2. 切换到侧边 AI 面板
3. 在技能下拉菜单中选择一个技能
4. 在输入框中输入指令
5. 点击运行
6. 等待流式输出完成
7. 查看输出
8. 点击"应用"
9. `window.confirm` 弹窗确认
10. 文本替换回编辑器

这是 **10 步操作**，而 AI Native 的目标应该是 1-2 步。

### 1.5 无禅模式

spec 中定义了 zen mode（全屏无干扰写作模式），代码中无任何实现。无全屏切换、无 UI 隐藏逻辑、无键盘快捷键。

### 1.6 Diff 对比仅为 confirm 弹窗

AI 输出应用时使用 `window.confirm`，不是真正的 inline diff preview。用户无法看到 AI 修改了哪些部分。

---

## 二、业界如何解决

### 2.1 GitHub Copilot — Ghost Text + Next Edit Suggestions

**来源**：[VS Code Copilot Inline Suggestions](https://code.visualstudio.com/docs/copilot/ai-powered-suggestions)

**Ghost Text（幽灵文本）**：

- 用户输入时，Copilot 在光标后显示灰色的建议文本
- Tab 键接受全部建议
- Ctrl+→ 逐词接受
- 不影响编辑器状态，直到用户显式接受
- 上下文来源：当前文件、已打开文件、项目文件（通过 codebase index）

**Next Edit Suggestions (NES)**：

- 不仅补全光标位置，还预测用户下一个编辑位置
- 显示为光标跳转提示 + 修改预览
- 场景：用户修改了函数签名 → NES 自动建议修改所有调用处
- 范围：可以是单符号、整行、多行

**技术实现**：
- 低延迟模型（专门的 completion 模型，非 chat 模型）
- FIM (Fill-in-the-Middle) 训练方式：模型同时看到光标前后的文本
- 投机解码（speculative decoding）加速推理

### 2.2 Cursor Tab — Edit Sequence 训练 + 百万上下文

**来源**：[Cursor Tab Completion 简史](https://coplay.dev/blog/a-brief-history-of-cursors-tab-completion)

Cursor 收购 Supermaven 的 Babble 模型后获得了最强 tab 补全：

- **Edit Sequence 训练**：不是训练在代码行上，而是训练在 git diff 式的编辑序列上。模型理解的是"编辑意图"而非"下一个 token"
- **1M token 上下文窗口**：远超同期 chat 模型的 128K
- **250ms 延迟**：专门优化的推理速度
- **全编辑器可见**：因为 Cursor 控制了整个 IDE，可以获取所有编辑器操作（接受/拒绝/修改建议），用于训练数据飞轮

**对 CreoNow 的启示**：写作场景的 inline suggestion 应该训练在"写作编辑序列"上，而非简单的文本补全。但初期可以用通用 LLM 的 FIM 能力实现基础版。

### 2.3 Cursor Composer — 多文件编辑 + Inline Diff

Cursor 的 Composer 模式实现了真正的 inline diff：

- AI 建议的修改直接在编辑器中以 diff 视图显示（绿色新增、红色删除）
- 用户可以逐个 accept/reject 每个修改块
- 支持跨文件编辑
- diff 视图与编辑器深度集成，不是弹窗

### 2.4 Notion AI — 选中文本即刻 AI

Notion AI 的编辑器集成方式：

- 选中文本后，浮动菜单中直接出现 "Ask AI" 按钮
- 点击后展开 AI 选项：Improve writing / Fix grammar / Make shorter / Make longer / Explain / Translate
- AI 输出直接替换选中文本或插入到下方
- 支持 `/` 斜杠命令：`/ai` 直接在文档中调用 AI

### 2.5 Sudowrite — 写作专用 AI 集成（核心对标）

**来源**：[Sudowrite Muse Deep Dive](https://sudowrite.com/blog/what-is-sudowrite-muse-a-deep-dive-into-sudowrites-custom-ai-model/)、[Sudowrite 2026 评测](https://kindlepreneur.com/sudowrite-review/)

Sudowrite 是英语小说写作 AI 领域公认最强工具。其编辑器交互模式**与编程 IDE 截然不同**：

- **Write（续写）**：用户主动点击按钮，AI 从光标处接续 250-500 字，匹配前文风格。**不是自动弹出的 ghost text**，而是用户主动触发的段落级生成
- **Describe（描写）**：选中名词/动作后，AI 生成五感描写（视觉、听觉、触觉、嗅觉、味觉）。这是 Sudowrite 的杀手功能——弥补作家"告诉而非展示"的常见弱点
- **Shrink Ray（缩写）**：选中段落后精炼压缩，删除冗余修饰。对抗 AI 生成文本的啰嗦倾向
- **Rewrite（改写）**：支持精确指令如"用更多潜台词暗示她的愤怒，不要直接说她生气了"
- **Brainstorm（头脑风暴）**：基于故事上下文生成创意方向，而非泛泛的建议

**关键交互原则**：AI 不主动出现，创作者主动召唤。这保持了"我在写，AI 在帮"的心理模型。

### 2.6 ACM CHI 论文 — 为什么 Ghost Text 不适合创作写作

**来源**：[From Pen to Prompt (ACM CHI 2024)](https://arxiv.org/html/2411.03137v2)

对 16 位职业作家的深度访谈发现：

1. **创作者将 authenticity（保持自己的声音）列为最核心价值**。自动弹出的补全文字制造"被 AI 牵着走"的感觉，损害 ownership
2. **写作不是补全**：代码有确定性的正确答案（函数签名、API），散文没有。Ghost text 暗示"这是正确的下一句"，但创作中只有"选择"
3. **节奏不同**：程序员希望尽快写完代码；作家常停下来思考、重读、酝酿。自动补全打断这个创作节奏

---

## 三、CN 应该怎么做

### 3.1 Bubble Menu 增加写作 AI 操作组

在现有格式按钮后增加分隔符 + 写作专用 AI 按钮（对标 Sudowrite §2.5）：

```
[B] [I] [U] [S] [Code] [Link] | [✨ 润色] [🎭 改写] [👁️ 描写] [� 对白]
```

- **润色**（`rewrite`）：改善文笔，保持原意
- **改写**（`rewrite` + 自定义指令）：换一种表达方式，支持精确指令
- **描写**（`describe`）：为选中名词/动作添加五感描写——这是 Sudowrite 的杀手功能，弥补"告诉而非展示"的弱点
- **对白**（`dialogue`）：为选中角色生成对白建议，需要 KG Codex 上下文

**与原建议的差异**：删除了"续写"和"解释"。续写放在悬浮按钮组（§3.2），不在选中文本菜单中——因为续写不需要选中文本。"解释"是通用 AI 功能，不是写作核心需求。

**实现方式**：在 `EditorBubbleMenu.tsx` 中增加 AI 按钮，点击后通过 IPC 调用对应技能，选中文本作为 input。

### 3.2 续写悬浮按钮组（替代 Ghost Text）

**核心原则**（§2.5 + §2.6）：**AI 不主动出现，创作者主动召唤。**

编程 IDE 的 Ghost Text（光标后自动弹出灰色补全文字）**不适合创作写作**。替代方案是对标 Sudowrite 的 Write 按钮模式：

```
编辑器右下角悬浮按钮组（无选中文本时可见）：
  [▶ 续写]  — 从光标处接续，匹配前文风格（write 技能）
  [📝 扩写]  — 选中段落，扩展细节和描写（expand 技能）
  [✂️ 缩写]  — 选中段落，精炼压缩（shrink 技能）
```

**与 Ghost Text 的关键区别**：
- 用户**主动点击**才触发，不自动弹出
- 输出是 250-500 字的段落，不是一行补全
- 输出出现在**光标下方的临时区域**（复用 Inline Diff §3.4），用户审阅后接受/编辑/丢弃
- 保持"我在写，AI 在帮"的心理模型，而非"AI 在写，我在筛"

**Ghost Text 的正确使用场景**——限制为低创造性的实体名补全：
- 角色名补全：输入"林"时提示"林默"（从 KG 获取 name + aliases）
- 地点名补全：输入"长安"时提示"长安城"
- 对白标签补全：输入引号时提示角色名

这更接近 NovelCrafter 的 Codex 引用检测，而非 Copilot 的代码补全。实现上只需从 KG 加载实体名构建补全列表，不需要 LLM 调用。

### 3.3 实现 Slash Command

TipTap 有 `@tiptap/suggestion` 扩展可实现 slash command。命令集针对写作场景：

```
用户输入 "/" 后显示命令面板：
/续写     — 从光标处 AI 续写（write 技能）
/描写     — 为上一段添加感官描写（describe 技能）
/对白     — 为当前场景生成角色对话（dialogue 技能）
/角色     — 插入/查看角色档案（从 KG Codex）
/大纲     — 展示/生成大纲
/头脑风暴  — 打开头脑风暴面板（brainstorm 技能）
/搜索     — 全文搜索
```

### 3.4 实现 Inline Diff Preview

替代 `window.confirm`，在编辑器中显示真正的 diff：

```typescript
// AI 输出后，在编辑器中标记修改区域
function showInlineDiff(editor: Editor, original: string, proposed: string) {
  // 1. 计算 diff（使用 diff-match-patch 或 jsdiff）
  // 2. 在编辑器中用 decoration 标记：
  //    - 删除的文本：红色删除线
  //    - 新增的文本：绿色背景
  // 3. 在 diff 区域上方显示 [✓ Accept] [✗ Reject] 按钮
  // 4. Accept → 应用修改；Reject → 恢复原文
}
```

### 3.5 实现禅模式

```typescript
// workbenchStore 增加 zenMode 状态
zenMode: boolean;
toggleZenMode: () => void;

// 快捷键：Cmd+Shift+Z 或 F11
// 效果：
// - 隐藏侧边栏（文件树、AI 面板）
// - 隐藏顶部工具栏
// - 编辑器全屏居中，最大宽度 700px
// - 柔和的背景色
// - 只保留最小化的字数统计
// - Esc 退出
```

### 3.6 快捷键系统

| 快捷键 | 功能 |
|--------|------|
| `Cmd+K` | 打开 AI 快速命令面板（类 Cursor） |
| `Cmd+Shift+K` | AI 润色选中文本 |
| `Cmd+J` | AI 续写 |
| `Tab` | 接受 inline suggestion |
| `Esc` | 取消 inline suggestion |
| `Cmd+Shift+Z` | 切换禅模式 |
| `/` | 行首触发 slash command |

---

## 四、实施优先级

| 步骤 | 内容 | 工作量 | 影响 |
|------|------|--------|------|
| 1 | Bubble Menu 增加写作 AI 按钮组（润色/改写/描写/对白） | 1.5d | 选中文本即可调 AI，步骤从 10 降到 3 |
| 2 | 续写悬浮按钮组（Write/Expand/Shrink） | 1.5d | 写作核心功能——对标 Sudowrite 最高频操作 |
| 3 | Slash command 写作命令集 | 2d | 编辑器内直接调用 AI |
| 4 | Inline diff preview | 2d | 替代 window.confirm |
| 5 | 快捷键系统 | 1d | 高频操作零延迟 |
| 6 | KG 实体名 ghost text（低创造性补全） | 1d | 角色名/地点名自动补全，无需 LLM |
| 7 | 禅模式 | 1d | 沉浸式写作 |
| 8 | Link 输入框修复 | 0.5d | 修复硬编码 URL |

**总计约 10.5 天**。步骤 1-2 最具性价比——续写按钮 + Bubble AI 覆盖 Sudowrite 80% 的核心交互。步骤 6 仅做实体名补全（从 KG 加载），不做通用 prose ghost text。
