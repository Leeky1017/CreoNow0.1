## 1. Specification

更新时间：2026-02-28 19:20

- [x] 1.1 审阅并确认需求边界：将 Inline Diff 从独立面板渲染改为 TipTap/ProseMirror decoration 集成，使版本差异在编辑器正文中高亮呈现。不做多版本同时对比。
- [x] 1.2 审阅并确认错误路径与边界路径：diff 数据缺失时不渲染 decoration（静默降级）；关闭对比模式后 decoration 必须被完全移除。
- [x] 1.3 审阅并确认验收阈值与不可变契约：对比模式开启时，插入行绿色高亮、删除行红色高亮（走 Token `--color-success-subtle`/`--color-error-subtle`）；关闭后编辑器恢复正常。
- [x] 1.4 依赖同步检查（Dependency Sync Check）：`fe-leftpanel-dialog-migration` 已归档完成（PR #808），无漂移。

### 1.5 预期实现触点

- `apps/desktop/renderer/src/features/editor/extensions/inlineDiff.ts`
  - 当前 `InlineDiffExtension` 是空壳（`decorations: []`），需实现为真正的 TipTap Extension：
    - 使用 `Plugin` + `DecorationSet` 将 `InlineDiffDecoration[]` 映射为 ProseMirror `Decoration.inline`/`Decoration.widget`
    - 通过 Extension storage 或 plugin state 接收 diff 数据
- `apps/desktop/renderer/src/features/editor/InlineDiffControls.tsx`
  - 当前作为独立面板渲染 diff hunk → 改为与编辑器 decoration 联动
  - Accept/Reject 按钮改为 decoration widget（或保留浮动控件但定位到 hunk 位置）
- `apps/desktop/renderer/src/features/version-history/VersionHistoryContainer.tsx`
  - 当前触发对比后将数据传给 InlineDiffControls → 改为将 diff 数据注入编辑器 Extension
- `apps/desktop/renderer/src/lib/diff/unifiedDiff.ts`
  - 已有 `computeDiffHunks()`，纯函数，不需改动
- `apps/desktop/renderer/src/styles/tokens.css`
  - 已有 `--color-success-subtle`/`--color-error-subtle`，可直接用于 decoration 样式

**为什么是这些触点**：inlineDiff.ts 是 decoration 逻辑核心，InlineDiffControls.tsx 是交互层，VersionHistoryContainer.tsx 是数据入口。

## 2. TDD Mapping（先测前提）

- [x] 2.1 将 delta spec 的每个 Scenario 映射为至少一个测试用例
- [x] 2.2 为每个测试标注对应 Scenario ID，建立可追踪关系
- [x] 2.3 设定门禁：未出现 Red（失败测试）不得进入实现

### Scenario → 测试映射

| Scenario ID | 测试文件（计划） | 测试名称（计划） | 断言要点 | Mock/依赖 | 运行命令 |
| ----------- | ---------------- | ---------------- | -------- | --------- | -------- |
| `VC-FE-DIFF-S1` | `apps/desktop/renderer/src/features/editor/__tests__/inlineDiff.decoration.test.ts` | `it('createInlineDiffDecorations returns decoration data for each hunk')` | 给定 original/suggested text，返回的 decoration 数组长度 > 0，每项包含 removedLines/addedLines | 无外部 mock，纯函数 | `pnpm -C apps/desktop test:run features/editor/__tests__/inlineDiff.decoration` |
| `VC-FE-DIFF-S2` | 同上 | `it('InlineDiffExtension produces ProseMirror DecorationSet when diff data is provided')` | 构造 TipTap editor + InlineDiffExtension，注入 diff 数据后 `editor.view.docView` 包含 decoration class | TipTap test utils | 同上 |
| `VC-FE-DIFF-S3` | 同上 | `it('InlineDiffExtension clears decorations when diff data is removed')` | 注入 diff → 清除 diff → DecorationSet 为空 | TipTap test utils | 同上 |
| `VC-FE-DIFF-S4` | `apps/desktop/renderer/src/features/editor/__tests__/inlineDiff.decoration.test.ts` | `it('decoration uses semantic token classes for insert/delete')` | decoration 的 CSS class 引用 `--color-success-subtle`（insert）和 `--color-error-subtle`（delete） | TipTap test utils | 同上 |

### 可复用测试范本

- InlineDiffControls 测试：`apps/desktop/renderer/src/features/editor/InlineDiffControls.test.tsx`
- Diff 纯函数测试：`apps/desktop/renderer/src/lib/diff/` 下已有测试

## 3. Red（先写失败测试）

- [x] 3.1 `VC-FE-DIFF-S1`：已有 `createInlineDiffDecorations()` 纯函数，测试直接绿灯（回归基线）。
- [x] 3.2 `VC-FE-DIFF-S2`：构造 TipTap editor + InlineDiffExtension，注入 diff 数据，断言 DecorationSet 非空。
  - 红灯原因：`TypeError: Cannot set properties of undefined (setting 'diffs')` — 空壳无 storage。
- [x] 3.3 `VC-FE-DIFF-S3`：注入 diff → 清除 → 断言 DecorationSet 为空。
  - 红灯原因：同上。
- [x] 3.4 `VC-FE-DIFF-S4`：断言 decoration CSS class 包含 `inline-diff-removed`。
  - 红灯原因：同上。
- 运行：`pnpm -C apps/desktop test:run features/editor/__tests__/inlineDiff.decoration`

## 4. Green（最小实现通过）

- [x] 4.1 `inlineDiff.ts`：将 `InlineDiffExtension` 从空壳改为真正的 TipTap Extension：
  - `Extension.create({ name: 'inlineDiff', addStorage(), addProseMirrorPlugins() })`
  - Plugin 使用 `PluginKey('inlineDiff')` + `DecorationSet` + `diffToDecorationSet()` 纯函数
  - 插入行 class：`inline-diff-added`
  - 删除行 class：`inline-diff-removed`
  → S2 + S4 转绿 ✓
- [x] 4.2 清除逻辑：storage.diffs 置空 + setMeta → `DecorationSet.empty` → S3 转绿 ✓
- [x] 4.3 `main.css`：新增 `.inline-diff-added` / `.inline-diff-removed` 样式 ✓
- [ ] 4.4 `VersionHistoryContainer.tsx`：对比触发时将 diff 数据写入 editor extension storage（后续集成，不在本 PR 范围）

## 5. Refactor（保持绿灯）

- [x] 5.1 抽取 `diffToDecorationSet()` 纯函数：已在 Green 阶段直接实现为独立导出函数
- [ ] 5.2 评估 InlineDiffControls.tsx 是否可简化为 decoration widget（后续迭代）

## 6. Evidence

- [x] 6.1 记录 RUN_LOG：Red 阶段 S2/S3/S4 失败的输出 ✓
- [x] 6.2 记录 RUN_LOG：Green 阶段全部通过的输出 ✓
- [x] 6.3 记录 RUN_LOG：全量回归 236 文件 1716 测试全绿 ✓
- [x] 6.4 Dependency Sync Check：`fe-leftpanel-dialog-migration` 已归档完成，无漂移 ✓
- [ ] 6.5 Main Session Audit（仅在 Apply 阶段需要）
