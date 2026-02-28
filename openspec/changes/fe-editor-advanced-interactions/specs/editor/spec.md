# Editor Specification Delta

更新时间：2026-02-28 19:20

## Change: fe-editor-advanced-interactions

### Requirement: 编辑器必须支持块拖拽与原子撤销 [ADDED]

#### Scenario: 内容块必须支持 drag handle 拖拽重排 [ADDED]

- **假设** 用户在编辑器中有多个块级节点（段落/标题/列表等）
- **当** 用户使用 drag handle 拖拽某块
- **则** 系统必须允许该块在文档中重排

#### Scenario: AI 流式输出必须支持原子撤销 [ADDED]

- **假设** AI 对选中文本或插入内容进行流式输出
- **当** 用户按下一次 Undo
- **则** 系统必须回退该次 AI 输出的完整结果（原子一步）

### Requirement: 编辑器工具栏必须在窄窗口保持可用 [ADDED]

#### Scenario: 窄窗口下工具栏必须提供溢出菜单 [ADDED]

- **假设** 编辑区可用宽度不足以容纳全部工具栏按钮
- **当** 工具栏渲染
- **则** 系统必须将超出部分折叠进溢出菜单
- **并且** 主要常用按钮仍应保持可见
