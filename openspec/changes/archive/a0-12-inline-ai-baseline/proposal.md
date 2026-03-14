# A0-12 Inline AI 从 0 到 1 新建

- **GitHub Issue**: #1004
- **所属任务簇**: P0-1（真实编辑与 AI 基线）
- **涉及模块**: editor
- **前端验收**: 需要

---

## Why：为什么必须做

### 1. 用户现象

用户在编辑器中选中一段文字，想让 AI 帮忙润色。目前的路径是：选中 → 目光移向右侧 AI 面板 → 确认选中文本被引用 → 输入指令 → 等待生成 → 切换到 Diff 面板 → 审阅 → 接受——十步之遥，心流断裂如长堤蚁穴。用户按下 `Cmd/Ctrl+K`——nothing happens。这是主流创作 IDE 的标配快捷键，却在 CreoNow 中如石沉大海。

"十步杀一人，千里不留行。"——李白写的是侠客，现在用户杀的是耐心。一次 AI 润色要十步，三次就够让人放弃。

### 2. 根因

Inline AI 从未实现。具体的问题链路：

- **快捷键未注册**：`shortcuts.ts` 的 `LAYOUT_SHORTCUTS` 和 `EDITOR_SHORTCUTS` 中均无 `Cmd/Ctrl+K` 定义。该快捷键在当前系统中完全无绑定
- **无输入层组件**：不存在任何"选中文本 → 浮动输入框 → 发送指令"的 UI 组件。`AiInlineConfirm.tsx` 是确认/拒绝层（展示 AI 建议的 Accept/Reject），不是输入层（接收用户自然语言指令）
- **无就地 Diff 预览**：现有 `DiffViewPanel` 是全面板级别的 diff 展示，适用于版本对比场景。Inline AI 需要的是选区级别的就地 diff——在选中文本原始位置直接展示 before/after，不跳转不切换面板
- **Skill 管线存在但未被 inline 触发**：`skill:execute` IPC 通道和 `SkillExecutor` 已实现，但只通过 AI 面板触发。需要一个 inline 入口来复用这条管线

### 3. v0.1 威胁

- **核心体验缺失**：Inline AI 是 CreoNow 与"套壳 ChatGPT"的分水岭。如果用户每次 AI 交互都必须离开编辑现场去操作右侧面板，CreoNow 就不是创作 IDE，而是创作编辑器 + 聊天窗口的拼凑
- **Magic Moment 不可达**：审计报告 `02` §二 定义的 Magic Moment 要求用户在 4 步以内完成 AI 辅助修改。当前 10 步路径无法实现这一承诺
- **P0-1 任务簇核心**：A0-12 是 P0-1 的第二关键任务（仅次于 A0-01）。A0-01 让编辑器可用，A0-12 让 AI 可达——二者共同构成"真实编辑与 AI 基线"的完整闭环
- **竞品参照**：Cursor、Notion AI、Google Docs 均已提供 inline AI 交互。CreoNow 如果缺失此能力，用户会在第一次对比中判定"不如竞品"

### 4. 证据来源

| 文档                                                                          | 章节                             | 内容                                                          |
| ----------------------------------------------------------------------------- | -------------------------------- | ------------------------------------------------------------- |
| `docs/audit/amp/01-master-roadmap.md`                                         | §4.1                             | "AI 编辑路径过长…`Cmd/Ctrl+K` Inline AI 尚未实现"             |
| `docs/audit/amp/07-ui-ux-design-audit.md`                                     | §四                              | "InlineDiffExtension 未注册…AiInlineConfirm 未接入主流程"     |
| `docs/audit/amp/01-master-roadmap.md`                                         | §4.1 (Magic Moment)              | "Inline AI 快捷路径：把 AI 从右侧面板搬回编辑器语境内"        |
| `openspec/specs/skill-system/spec.md`                                         | Requirement: 技能触发方式        | 技能触发通过 `skill:execute` IPC，返回 `SkillResult`          |
| `openspec/specs/editor/spec.md`                                               | Requirement: AI 协作 Inline Diff | Diff 展示已有规格，但仅服务于面板级触发                       |
| `openspec/specs/editor/spec.md`                                               | Requirement: 编辑器键盘快捷键    | 快捷键表中无 `Cmd/Ctrl+K` 条目                                |
| `apps/desktop/renderer/src/config/shortcuts.ts`                               | 全文                             | `EDITOR_SHORTCUTS` 和 `LAYOUT_SHORTCUTS` 中无 `inlineAi` 定义 |
| `apps/desktop/renderer/src/components/features/AiDialogs/AiInlineConfirm.tsx` | 全文                             | 仅是确认层（Accept/Reject），不是输入层                       |

---

## What：做什么

1. **注册 `Cmd/Ctrl+K` 快捷键**：在 `shortcuts.ts` 的 `EDITOR_SHORTCUTS` 中新增 `inlineAi` 快捷键定义（`mod+K`）。该快捷键仅在编辑器有文本选中时触发——无选中文本时不响应
2. **新建 `InlineAiInput` 浮动输入组件**：用户按下 `Cmd/Ctrl+K` 后，在选中文本下方弹出浮动输入框。用户输入自然语言指令（"润色"、"改写成鲁迅风格"、"翻译成英文"），按 Enter 发送
3. **复用 Skill 执行管线**：`InlineAiInput` 提交后，通过 `skill:execute` IPC 通道将选中文本 + 用户指令发送到主进程。不创建独立的 LLM 调用通道——inline 入口和 AI 面板入口共享同一个 `SkillExecutor`
4. **新建 `InlineAiDiffPreview` 就地 diff 组件**：Skill 执行完成后，在选中文本原始位置展示就地 diff 预览（删除内容红色删除线、新增内容绿色高亮），附带 Accept / Reject / Regenerate 操作按钮
5. **接受/拒绝/重新生成**：Accept 将 AI 修改应用到编辑器文档；Reject 恢复原文关闭预览；Regenerate 保持 diff 位置重新执行技能
6. **流式展示**：Skill 执行通过 `skill:stream:chunk` 推送流式结果，`InlineAiDiffPreview` 支持流式渲染——用户可在生成过程中实时看到 diff 变化

---

## Non-Goals：不做什么

1. **不在禅模式下提供 Inline AI**——禅模式的定位是「纯手工创作的沉浸空间」（A0-01 delta spec 明确声明 "NO AI assistance is available in Zen Mode"）。`Cmd/Ctrl+K` 在禅模式下不触发
2. **不走独立 LLM 通道**——Inline AI 必须复用 `SkillExecutor` 和 `skill:execute` IPC 通道。不创建 `inline-ai:execute` 之类的独立通道，避免 LLM 调用管线分裂
3. **不替代 AI 面板**——Inline AI 是快捷路径，适用于简单的选区级操作（润色、改写、翻译）。复杂的多轮对话、上下文引用、知识图谱查询仍通过右侧 AI 面板完成。两个入口并存不互斥
4. **不支持无选中文本的触发**——当前版本的 Inline AI 要求有明确的文本选中。光标无选区时按 `Cmd/Ctrl+K` 不触发。续写场景（无选区、光标处生成）留待后续迭代
5. **不实现 Inline AI 的历史记录**——Inline AI 的操作不记入 AI 面板的对话历史。每次触发是独立的一次性操作
6. **不修改现有 DiffViewPanel**——面板级 diff 展示保持不变。Inline AI 使用独立的 `InlineAiDiffPreview` 做选区级就地 diff，两者互不干扰

---

## 依赖与影响

- **上游依赖**: A0-01（禅模式可编辑）——编辑器需要在所有模式下提供真实编辑能力，Inline AI 才有稳定的编辑现场可依托
- **下游被依赖**: 无直接下游——但 Inline AI 基线建立后，后续可在此基础上扩展更多 inline 操作（续写、补全等）
- **受益于**: A0-13（Toast 接入）——Inline AI 执行失败时的错误通知可通过 Toast 展示
- **平行协作**: `skill-system/spec.md` 中的 Skill 执行管线——Inline AI 复用该管线，若 Skill 系统有变更需同步

---

## 用户路径（4 步完成）

1. **选中** → 用户在编辑器中选中目标文本
2. **触发** → 按 `Cmd/Ctrl+K`，浮动输入框出现在选区下方
3. **指令** → 输入"润色"并按 Enter，浮动输入框消失，就地 diff 预览开始流式渲染
4. **决策** → 查看 diff 预览，点击 Accept 应用修改（或 Reject 恢复原文、Regenerate 重试）

选中到应用 ≤ 4 步，满足 Magic Moment 要求。
