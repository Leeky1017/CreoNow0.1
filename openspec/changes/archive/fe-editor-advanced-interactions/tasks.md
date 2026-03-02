## 1. Specification

更新时间：2026-03-02 19:45

- [x] 1.1 审阅并确认需求边界：补齐三项编辑器高级交互——block drag handle（拖拽重排）、AI stream 原子撤销（一次 Ctrl+Z 回退一轮输出）、工具栏溢出菜单（窄窗口折叠）。不做长文档虚拟化。
- [x] 1.2 审阅并确认错误路径与边界路径：只读模式下 drag handle 不显示；无选区时 undo 行为不变；极窄窗口下 overflow 菜单仍可操作。
- [x] 1.3 审阅并确认验收阈值与不可变契约：drag handle 可拖拽重排内容块；AI stream 一次 Ctrl+Z 回退整轮输出；工具栏窄屏不截断按钮。
- [x] 1.4 依赖同步检查（Dependency Sync Check）：N/A

### 1.5 预期实现触点

- 新增 `apps/desktop/renderer/src/features/editor/extensions/dragHandle.ts`：
  - TipTap Extension：在每个 block 节点左侧渲染 drag handle
  - 使用 ProseMirror `NodeView` 或 `Decoration` 方案
  - 只读模式下不渲染
- `apps/desktop/renderer/src/features/editor/EditorPane.tsx`：
  - 注册 dragHandle extension 到 TipTap editor 配置
  - AI stream 写入时使用 `addToHistory: false`（或 `editor.chain().command(({ tr }) => { tr.setMeta('addToHistory', false); ... })`）
  - stream 结束后提交一个 history checkpoint
- `apps/desktop/renderer/src/features/editor/EditorToolbar.tsx`：
  - 当前工具栏按钮在窄窗口被截断 → 引入 overflow 检测（ResizeObserver）
  - 超出容器宽度的按钮折叠到 "More" 下拉菜单

**为什么是这些触点**：extensions/ 是 TipTap 扩展的标准位置，EditorPane 是 editor 配置入口，EditorToolbar 是工具栏渲染入口。

## 2. TDD Mapping（先测前提）

- [x] 2.1 将 delta spec 的每个 Scenario 映射为至少一个测试用例
- [x] 2.2 为每个测试标注对应 Scenario ID，建立可追踪关系
- [x] 2.3 设定门禁：未出现 Red（失败测试）不得进入实现

### Scenario → 测试映射

| Scenario ID | 测试文件（计划） | 测试名称（计划） | 断言要点 | Mock/依赖 | 运行命令 |
| ----------- | ---------------- | ---------------- | -------- | --------- | -------- |
| `ED-FE-ADV-S1` | `apps/desktop/renderer/src/features/editor/extensions/dragHandle.test.ts` | `it('creates drag handle decoration for block nodes')` | 构造 ProseMirror doc，调用 extension，断言每个 block 有 drag handle decoration | mock ProseMirror EditorState | `pnpm -C apps/desktop test:run features/editor/extensions/dragHandle` |
| `ED-FE-ADV-S1b` | 同上 | `it('does not render drag handle in readonly mode')` | editable=false 时断言无 decoration | 同上 | 同上 |
| `ED-FE-ADV-S2` | `apps/desktop/renderer/src/features/editor/Editor.ai-stream-undo.test.tsx` | `it('reverts full AI stream with single undo')` | 模拟 AI stream 写入多步，执行一次 undo，断言内容回到 stream 前状态 | mock editor + AI store | `pnpm -C apps/desktop test:run features/editor/Editor.ai-stream-undo` |
| `ED-FE-ADV-S3` | `apps/desktop/renderer/src/features/editor/EditorToolbar.overflow.test.tsx` | `it('shows overflow menu when toolbar exceeds container width')` | mock ResizeObserver 触发窄宽度，断言 "More" 菜单按钮出现 | mock ResizeObserver | `pnpm -C apps/desktop test:run features/editor/EditorToolbar.overflow` |

### 可复用测试范本

- InlineDiff extension 测试：`apps/desktop/renderer/src/features/editor/extensions/inlineDiff.test.ts`

## 3. Red（先写失败测试）

- [x] 3.1 `ED-FE-ADV-S1`：构造 ProseMirror doc，调用 dragHandle extension，断言 block 节点有 drag handle decoration。
  - 期望红灯原因：`extensions/dragHandle.ts` 不存在。
- [x] 3.2 `ED-FE-ADV-S1b`：editable=false，断言无 drag handle decoration。
  - 期望红灯原因：同上。
- [x] 3.3 `ED-FE-ADV-S2`：模拟 AI stream 写入多步，执行一次 undo，断言内容回到 stream 前。
  - 期望红灯原因：当前 AI stream 写入未使用 `addToHistory: false`，每步都入 history。
- [x] 3.4 `ED-FE-ADV-S3`：mock ResizeObserver 触发窄宽度，断言 "More" 菜单按钮出现。
  - 期望红灯原因：当前 EditorToolbar 无 overflow 检测和折叠逻辑。
- 运行：`pnpm -C apps/desktop test:run features/editor/extensions/dragHandle` / `Editor.ai-stream-undo` / `EditorToolbar.overflow`

## 4. Green（最小实现通过）

- [x] 4.1 新增 `extensions/dragHandle.ts`：TipTap Extension，block 节点左侧渲染 drag handle decoration，editable=false 时不渲染 → S1/S1b 转绿
- [x] 4.2 `EditorPane.tsx`：注册 dragHandle extension；AI stream 写入使用 `addToHistory: false`，stream 结束后提交 history checkpoint → S2 转绿
- [x] 4.3 `EditorToolbar.tsx`：引入 ResizeObserver 检测溢出，超出部分折叠到 "More" 下拉菜单 → S3 转绿

## 5. Refactor（保持绿灯）

- [x] 5.1 确认 drag handle 样式走 Token（hover 态、cursor 样式）
- [x] 5.2 确认 overflow 菜单的快捷键提示与原工具栏一致
- [x] 5.3 确认 AI stream undo 在多轮对话场景下每轮独立回退

## 6. Evidence

- [x] 6.1 记录 RUN_LOG：Red 阶段测试失败的输出
- [x] 6.2 记录 RUN_LOG：Green 阶段全部通过的输出
- [x] 6.3 记录 RUN_LOG：`pnpm -C apps/desktop test:run` 全量回归无新增失败
- [x] 6.4 记录 Dependency Sync Check（N/A）
- [ ] 6.5 Main Session Audit（仅在 Apply 阶段需要）
