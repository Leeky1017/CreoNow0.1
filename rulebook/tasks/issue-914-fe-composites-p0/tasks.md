更新时间：2026-03-02 21:00

## 1. Implementation

- [x] 1.1 `PanelContainer.tsx` — header/body/footer 结构 + collapsible 支持
- [x] 1.2 `SidebarItem.tsx` — icon/label/action slot 侧边栏列表项
- [x] 1.3 `CommandItem.tsx` — 命令列表项 + `labelContent`/`onMouseEnter`/`data-index` 扩展（单元测试已覆盖；Storybook stories 延迟到 Refactor 阶段，对应 openspec tasks.md §5.3）
- [x] 1.4 `AiPanel.tsx` → 替换散装面板结构为 PanelContainer
- [x] 1.5 `FileTreePanel.tsx` → 替换散装面板结构为 PanelContainer
- [x] 1.6 `CommandPalette.tsx` → 替换散装 li 为 CommandItem

### 1.7 替换范围偏差说明

Spec tasks.md §4.5 预期"至少 4 处"替换，实际完成 3 处。差异原因：

- `SearchPanel.tsx`：不适用 PanelContainer——SearchPanel 是 modal 语义（backdrop + floating），非 sidebar panel 语义。强行套用会引入语义错误。
- `FileTreePanel.tsx` 的文件项：不适用 SidebarItem——文件项有复杂的 DnD（拖拽排序）、内联重命名、嵌套缩进等交互，当前 SidebarItem API 不覆盖这些场景。FileTreePanel 的 panel 外壳已用 PanelContainer 替换。

以上为合理工程判断，不影响 P0 Composites 的可复用性验证目标。

## 2. Testing

- [x] 2.1 `PanelContainer.test.tsx` — 4 个测试（渲染 header/body、collapsible 切换、footer 渲染、accessibility）
- [x] 2.2 `SidebarItem.test.tsx` — 4 个测试（渲染 label、icon slot、action slot、点击回调）
- [x] 2.3 `CommandItem.test.tsx` — 4 个测试（渲染 label、shortcut、labelContent、hover/select 状态）
- [x] 2.4 全量回归 221 文件 / 1654 测试全绿

## 3. Documentation

- [x] 3.1 RUN_LOG `openspec/_ops/task_runs/ISSUE-914.md` 已记录 Red/Green/全量回归
