# Tasks: V1-08 文件树像素精修

- **GitHub Issue**: 待创建
- **分支**: `task/<N>-file-tree-precision`
- **Delta Spec**: `openspec/changes/v1-08-file-tree-precision/specs/`

---

## 验收标准

| ID    | 标准                                                                              | 对应 Scenario |
| ----- | --------------------------------------------------------------------------------- | ------------- |
| AC-1  | 左侧 Icon Bar 宽度固定 48px（`w-12` + `flex-shrink-0`），窗口缩放时不被内容撑开   | 视觉          |
| AC-2  | 每个树节点行高固定 32px（`h-8`），rename input 出现时行高不跳动                   | 视觉          |
| AC-3  | 拖拽指示器包含 2px 蓝色横线 + 左端 8px 圆形手柄（`rounded-full`）                 | 视觉          |
| AC-4  | Rename input focus 态边框颜色为 `--color-info`（对应 `#3b82f6`），1px 宽度        | 视觉          |
| AC-5  | Context menu 各菜单项右侧显示快捷键标注（11px、`--color-fg-muted`）               | 视觉          |
| AC-6  | `--bg-hover` 与 `--bg-selected` 的视觉区分度可验证（hover → selected 有明显色差） | 可访问性      |
| AC-7  | 展开/折叠箭头有 `transition-transform` 旋转过渡（≥ 150ms）                        | 动效          |
| AC-8  | 至少 4 种文件类型（`.ts`、`.md`、`.json`、`.css`）有差异化图标颜色                | 视觉          |
| AC-9  | 所有新增样式使用语义化 Design Token，0 处新增 Tailwind arbitrary 色值             | 全局          |
| AC-10 | 现有 FileTree 相关测试 100% 通过，0 个新增失败                                    | 全局          |
| AC-11 | Storybook 可构建（`pnpm -C apps/desktop storybook:build`）                        | 全局          |
| AC-12 | TypeScript 类型检查通过（`pnpm typecheck`）                                       | 全局          |
| AC-13 | lint 无新增违规（`pnpm lint`）                                                    | 全局          |
| AC-14 | `FileTreePanel.tsx` 从 ~1,402 行拆分至主文件 ≤ 300 行，子组件各 ≤ 300 行          | 架构          |

---

## Phase 0: 准备

- [ ] 阅读 `AGENTS.md`
- [ ] 阅读 `design/DESIGN_DECISIONS.md` §9.1（左侧 Icon Bar）、§11.3（FileTree）
- [ ] 阅读设计稿 `design/Variant/designs/12-sidebar-filetree.html` 全文——逐像素标注 icon bar 宽度、行高、drag indicator、rename input、context menu
- [ ] 阅读 `apps/desktop/renderer/src/features/files/FileTreePanel.tsx` 全文（~1,320 行）
- [ ] 盘点 `apps/desktop/renderer/src/features/files/` 目录下所有子组件文件
- [ ] 确认现有测试文件：搜索 `features/files/` 下的 `*.test.*` 文件
- [ ] 运行现有测试基线：`pnpm -C apps/desktop vitest run FileTree`，记录通过 / 失败数量
- [ ] 确认 v1-01（Design Token 补完）已合并，`--color-info`、`--color-success`、`--color-warning` 等语义色 token 可用
- [ ] 验证 `--bg-hover`（`#1a1a1a`）与 `--bg-selected`（`#222222`）当前实际值，计算对比度

---

## Phase 1: Red（测试先行）

### Task 1.1: Icon Bar 固定宽度测试

**映射验收标准**: AC-1

- [ ] 测试：Icon Bar 容器元素有 `w-12` 或等效的 48px 宽度约束 className
- [ ] 测试：Icon Bar 容器元素有 `flex-shrink-0` 或 `shrink-0` 防止压缩

**验证策略**: 使用 `getByRole('navigation')` 或 `getByTestId('icon-bar')` 定位 Icon Bar 容器，断言 className 包含宽度约束。

**文件**: `apps/desktop/renderer/src/features/files/__tests__/IconBar.test.tsx`（新建）

### Task 1.2: 树节点 32px 行高测试

**映射验收标准**: AC-2

- [ ] 测试：tree item 容器元素有 `h-8` 或等效的 32px 固定高度 className
- [ ] 测试：rename input 所在行与普通行的容器高度一致（均为 32px）
- [ ] 测试：tree item 使用 `items-center` 实现垂直居中

**验证策略**: render FileTreePanel，定位第一个 tree item，断言其高度 className。trigger rename 操作后断言 input container 同样有 `h-8`。

**文件**: `apps/desktop/renderer/src/features/files/__tests__/TreeItemHeight.test.tsx`（新建）

### Task 1.3: 拖拽指示器圆形手柄测试

**映射验收标准**: AC-3

- [ ] 测试：drag indicator 渲染时包含圆形手柄元素（`rounded-full` className）
- [ ] 测试：圆形手柄元素尺寸为 8px（`w-2 h-2`）
- [ ] 测试：drag indicator 横线使用 `--color-info` 或 `bg-blue-500` token

**验证策略**: 触发拖拽操作使 drag indicator 可见，断言 DOM 中存在圆形手柄子元素。

**文件**: `apps/desktop/renderer/src/features/files/__tests__/DragIndicator.test.tsx`（新建）

### Task 1.4: Rename Input Focus 边框测试

**映射验收标准**: AC-4

- [ ] 测试：rename input 元素有 focus 态的 `border-color`（值为 `--color-info` 或 `#3b82f6`）
- [ ] 测试：rename input 元素 border-width 为 1px

**验证策略**: 触发 rename 操作，定位 input 元素，断言 focus 态 className 包含相应 border token 引用。

**文件**: `apps/desktop/renderer/src/features/files/__tests__/RenameInput.test.tsx`（新建）

### Task 1.5: Context Menu 快捷键标注测试

**映射验收标准**: AC-5

- [ ] 测试：context menu 中至少 1 个菜单项包含快捷键文本（如 `Ctrl+C`、`Del`）
- [ ] 测试：快捷键文本元素使用 `--color-fg-muted` 样式

**验证策略**: 触发右键菜单，断言菜单项中存在快捷键区域元素。

**文件**: `apps/desktop/renderer/src/features/files/__tests__/ContextMenuShortcuts.test.tsx`（新建）

### Task 1.6: 展开/折叠箭头动效测试

**映射验收标准**: AC-7

- [ ] 测试：chevron 图标元素有 `transition-transform` className
- [ ] 测试：展开态 chevron 有 `rotate-90`（或等效旋转样式）
- [ ] 测试：折叠态 chevron 有 `rotate-0`（或无旋转样式）

**验证策略**: render 带子节点的 folder tree item，断言 chevron className。点击展开后断言旋转 className 变更。

**文件**: `apps/desktop/renderer/src/features/files/__tests__/ChevronAnimation.test.tsx`（新建）

### Task 1.7: 文件类型图标颜色测试

**映射验收标准**: AC-8

- [ ] 测试：`.ts` 文件节点的图标使用蓝色 token（`--color-info` 或对应 className）
- [ ] 测试：`.md` 文件节点的图标使用绿色 token（`--color-success` 或对应 className）
- [ ] 测试：`.json` 文件节点的图标使用黄色 token（`--color-warning` 或对应 className）
- [ ] 测试：`.css` 文件节点的图标使用 accent token（`--color-accent` 或对应 className）

**验证策略**: render 不同文件类型的 tree item，断言各自图标元素的颜色 className 不同。

**文件**: `apps/desktop/renderer/src/features/files/__tests__/FileTypeIconColors.test.tsx`（新建）

### Task 1.8: 行为等价回归测试

**映射验收标准**: AC-10

- [ ] 运行 `pnpm -C apps/desktop vitest run FileTree` 全部 FileTree 测试，确认与 Phase 0 基线一致
- [ ] 确认 0 个新增失败

---

## Phase 2: Green（最小实现）

### Task 2.1: Icon Bar 固定 48px 宽度

**映射验收标准**: AC-1

- [ ] 定位 Icon Bar 容器（FileTreePanel.tsx 中渲染侧栏图标的外层 div）
- [ ] 添加 `w-12 shrink-0`（48px 固定宽度 + 不压缩）
- [ ] 验证窗口缩放至最小宽度时 Icon Bar 保持 48px

**文件**: `FileTreePanel.tsx`（修改）

### Task 2.2: 树节点统一 32px 行高

**映射验收标准**: AC-2

- [ ] 将 tree item 外层容器从 `py-1.5` 改为 `h-8 flex items-center`（固定 32px）
- [ ] rename input 容器同样使用 `h-8 flex items-center`
- [ ] 调整 tree item 内部 padding 为 `px-2`（水平 padding 保留，垂直由固定高度控制）
- [ ] 验证文字 + 图标在 32px 行高内垂直居中

**文件**: `FileTreePanel.tsx`（修改）

### Task 2.3: 拖拽指示器增加圆形手柄

**映射验收标准**: AC-3

- [ ] 在 drag indicator 组件（2px 蓝色横线）左端增加圆形手柄：

```tsx
<div className="relative">
  {/* 圆形手柄 */}
  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[var(--color-info)]" />
  {/* 蓝色横线 */}
  <div className="h-0.5 bg-[var(--color-info)]" />
</div>
```

- [ ] 使用 `--color-info` token 而非硬编码 `bg-blue-500`

**文件**: `FileTreePanel.tsx`（修改）或独立 DragIndicator 子组件

### Task 2.4: Rename Input Focus 边框对齐

**映射验收标准**: AC-4

- [ ] 验证当前 rename input 的 focus 边框 CSS variable 实际值
- [ ] 如不为 `#3b82f6`，修正 className 为 `focus:border-[var(--color-info)]`
- [ ] 确保 border-width 为 1px（`border`）

**文件**: `FileTreePanel.tsx`（修改）

### Task 2.5: Context Menu 快捷键标注

**映射验收标准**: AC-5

- [ ] 在 context menu 数据结构中为各操作增加 `shortcut` 字段：

```typescript
{ label: '复制', action: 'copy', shortcut: 'Ctrl+C' },
{ label: '粘贴', action: 'paste', shortcut: 'Ctrl+V' },
{ label: '删除', action: 'delete', shortcut: 'Del' },
{ label: '重命名', action: 'rename', shortcut: 'F2' },
```

- [ ] 菜单项右侧渲染快捷键标注：

```tsx
{
  item.shortcut && (
    <span className="text-[11px] text-[var(--color-fg-muted)] ml-auto pl-4">
      {item.shortcut}
    </span>
  );
}
```

- [ ] 使用 `--color-fg-muted` token + 11px 字号

**文件**: `FileTreePanel.tsx`（修改）或 context menu 子组件

### Task 2.6: 选中/Hover 对比度验证与调整

**映射验收标准**: AC-6

- [ ] 计算 `--bg-hover`（`#1a1a1a`）与 `--bg-selected`（`#222222`）的对比度
- [ ] 验证与基底背景色（`--color-bg-base` = `#0f0f0f`）的对比度是否达 WCAG AA 3:1（UI 组件标准）
- [ ] 如对比度不足，建议调整 `--bg-selected` 的值（如调至 `#2a2a2a`）并更新 `01-tokens.css`
- [ ] 记录计算结果作为审计证据

**文件**: `design/system/01-tokens.css`（如需修改）

### Task 2.7: 展开/折叠箭头旋转动效

**映射验收标准**: AC-7

- [ ] 为 chevron 图标添加过渡样式：

```tsx
<ChevronIcon
  className={cn(
    "transition-transform duration-[var(--duration-fast)]",
    isExpanded ? "rotate-90" : "rotate-0",
  )}
/>
```

- [ ] 使用 `--duration-fast`（150ms）token

**文件**: `FileTreePanel.tsx`（修改）

### Task 2.8: 文件类型图标颜色映射

**映射验收标准**: AC-8

- [ ] 创建文件扩展名→颜色 token 映射：

```typescript
const FILE_TYPE_COLORS: Record<string, string> = {
  ts: "text-[var(--color-info)]",
  tsx: "text-[var(--color-info)]",
  md: "text-[var(--color-success)]",
  json: "text-[var(--color-warning)]",
  css: "text-[var(--color-accent)]",
  scss: "text-[var(--color-accent)]",
};
```

- [ ] 在 file icon 渲染处根据文件扩展名应用对应颜色 className
- [ ] 未映射的扩展名降级使用 `--color-fg-muted`

**文件**: `FileTreePanel.tsx`（修改）或新建 `fileTypeColors.ts` 映射文件

### Task 2.9: FileTreePanel.tsx 解耦拆分

**映射验收标准**: AC-14

- [ ] 提取 `FileTreeNode.tsx`：单节点渲染（icon + label + chevron + rename input），≤ 300 行
- [ ] 提取 `FileTreeContextMenu.tsx`：右键菜单定义 + 快捷键标注 + 事件处理，≤ 200 行
- [ ] 提取 `FileTreeDragDrop.tsx`：拖拽逻辑 + drop indicator + 圆形手柄，≤ 250 行
- [ ] 提取 `useFileTreeKeyboard.ts`：键盘导航 hook（↑/↓/Enter/Esc/F2），≤ 150 行
- [ ] 精简 `FileTreePanel.tsx` 至 ≤ 300 行（仅保留布局框架 + Icon Bar + 子组件编排）
- [ ] 确认提取后所有现有测试仍通过

**文件**: `apps/desktop/renderer/src/features/files/FileTreePanel.tsx`（拆分）

---

## Phase 3: Refactor（清理与验证）

- [ ] 确认所有 Phase 1 测试通过（Red → Green 完成）
- [ ] 运行 `pnpm -C apps/desktop vitest run FileTree` 全量回归
- [ ] 运行 `pnpm typecheck` 类型检查
- [ ] 运行 `pnpm lint` lint 检查
- [ ] 运行 `pnpm -C apps/desktop storybook:build` Storybook 构建
- [ ] 检查所有新增样式是否使用 Design Token（`grep -rn '#[0-9a-fA-F]\{3,8\}' FileTreePanel.tsx` 应为 0 新增）
- [ ] 如有独立子组件可提取（如 DragIndicator、FileTypeIcon），做最小化提取以降低 FileTreePanel.tsx 行数，但不做大规模重构
- [ ] PR 创建，含 `Closes #N`

---

## R3 Cascade Refresh (2026-03-21)

### 上游依赖确认

- ✅ v1-06 AI Panel Overhaul: PASS（27测试文件全通过）
- ✅ v1-07 Settings Visual Polish: PASS（91测试全通过）
- 上游依赖（v1-01 Design Token、v1-02 Primitive）已就绪

### 基线指标更新

| 指标                   | tasks.md 原值             | R3 实测值                   | 说明                                |
| ---------------------- | ------------------------- | --------------------------- | ----------------------------------- |
| FileTreePanel.tsx 行数 | ~1,402（AC-14 目标 ≤300） | **126**                     | ✅ 已远超达标，壳层仅 126 行        |
| FileTree 模块总行数    | —                         | **4,350**（含测试/stories） | 首次采集                            |
| FileTreeNodeRow.tsx    | —                         | **300**                     | 拆分产物，节点渲染（AC-14 ≤300 ✅） |
| useFileTreeKeyboard.ts | —                         | **139**                     | 拆分产物，键盘导航 hook             |
| useFileTreeCore.ts     | —                         | **182**                     | 拆分产物，核心状态管理              |
| fileTreeContextMenu.ts | —                         | **86**                      | 拆分产物，右键菜单                  |
| FileTree 测试          | —                         | **9 文件 / 79 测试全通过**  | AC-10 ✅                            |

### AC 状态评估

| AC          | 状态        | 说明                                                             |
| ----------- | ----------- | ---------------------------------------------------------------- |
| AC-14       | ✅ 已满足   | 主文件 126 行 ≤ 300；子组件均 ≤ 300                              |
| AC-10       | ✅ 基线良好 | 79 测试全通过，0 失败                                            |
| AC-1~AC-9   | 🔲 待实现   | 视觉精修项（icon bar、行高、拖拽手柄、箭头动效、文件类型颜色等） |
| AC-11~AC-13 | 🔲 待验证   | Storybook / typecheck / lint 在实现阶段执行                      |

---

## R4 Cascade Refresh (2026-03-21)

### 上游依赖确认

- ✅ v1-06 AI Panel Overhaul: PASS（无文件交叉，并行安全）
- ✅ v1-07 Settings Visual Polish: PASS（无文件交叉，并行安全）
- ✅ v1-01 Design Token: 已就绪（`--color-info`、`--color-success`、`--color-warning` 等语义色 token 在组件中已使用）
- ✅ v1-02 Primitive: 已就绪（ContextMenu 组件已支持 `shortcut` 字段渲染）

### 基线指标更新

| 指标                   | R3 值                  | R4 实测值                  | 说明                      |
| ---------------------- | ---------------------- | -------------------------- | ------------------------- |
| FileTreePanel.tsx 行数 | 126                    | **126**                    | 无变化，AC-14 ✅ 持续满足 |
| 文件树模块总行数       | 4,350                  | **4,350**                  | 无变化                    |
| FileTreeNodeRow.tsx    | 300                    | **300**                    | 无变化                    |
| FileTreeRenameRow.tsx  | 88                     | **88**                     | 无变化                    |
| useFileTreeKeyboard.ts | 139                    | **139**                    | 无变化                    |
| useFileTreeCore.ts     | 182                    | **182**                    | 无变化                    |
| fileTreeContextMenu.ts | 86                     | **86**                     | 无变化                    |
| FileTree 测试          | 9 文件 / 79 测试全通过 | **9 文件 / 79 测试全通过** | 无变化，AC-10 ✅ 持续满足 |

### AC 状态评估

> R3 将 AC-1~AC-9 批量标注为「🔲 待实现」。R4 逐项独立验证后发现：多数视觉精修项已在前序组件拆分过程中实现，R3 评估过于保守。

| AC          | R3 状态     | R4 状态       | 说明                                                                                                                                                                                                                                                                                 |
| ----------- | ----------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| AC-1        | 🔲 待实现   | ✅ 已满足     | IconBar.tsx:226 已有 `shrink-0 w-12`（48px 固定宽度）。组件在 `components/layout/IconBar.tsx`，非 files/ 目录，但功能已满足                                                                                                                                                          |
| AC-2        | 🔲 待实现   | ✅ 已满足     | FileTreeNodeRow.tsx:153 和 FileTreeRenameRow.tsx:36 均使用 `h-8`（32px 固定行高），rename 不跳动                                                                                                                                                                                     |
| AC-3        | 🔲 待实现   | ✅ 已满足     | FileTreeNodeRow.tsx:110 有 `w-2 h-2 rounded-full bg-[var(--color-info)]` 圆形手柄；FileTreeRenameRow.tsx:31 同                                                                                                                                                                       |
| AC-4        | 🔲 待实现   | ✅ 已满足     | FileTreeRenameRow.tsx:60 有 `focus:border-[var(--color-info)]`，使用语义 token                                                                                                                                                                                                       |
| AC-5        | 🔲 待实现   | ✅ 已满足     | fileTreeContextMenu.ts 定义 `shortcut: "F2"` / `"Del"`；ContextMenu.tsx:148-155 渲染为 `text-[11px] text-[var(--color-fg-muted)]`，完全对齐设计稿                                                                                                                                    |
| AC-6        | 🔲 待实现   | ⚠️ 待深度验证 | FileTreeNodeRow 使用 `--color-bg-hover` / `--color-bg-selected` design token，token 使用正确；实际对比度取决于 v1-01 token 定义值，非本 change 职责                                                                                                                                  |
| AC-7        | 🔲 待实现   | ✅ 已满足     | FileTreeNodeRow.tsx:164 有 `transition-transform duration-[var(--duration-fast)]`；:166-168 使用 inline style `rotate(90deg)` / `rotate(0deg)`                                                                                                                                       |
| AC-8        | 🔲 待实现   | 🔲 待重新定义 | 当前使用 emoji 图标（📄📝📘🕒👤）按文档类型区分，非文件扩展名颜色映射。proposal 以代码编辑器视角描述（.ts/.md/.json），但 CreoNow 是创作 IDE，文档类型为 chapter/note/setting/timeline/character。需 Owner 确认是否需要为文档类型增加颜色映射，或 AC-8 已被 emoji 差异化方案等价满足 |
| AC-9        | 🔲 待实现   | ✅ 已满足     | `grep '#[0-9a-fA-F]{3,8}'` 返回 0 结果，files/ 下无硬编码色值                                                                                                                                                                                                                        |
| AC-10       | ✅ 基线良好 | ✅ R4 确认    | 79 测试全通过，0 失败                                                                                                                                                                                                                                                                |
| AC-11~AC-13 | 🔲 待验证   | 🔲 待验证     | Storybook / typecheck / lint 在实现阶段执行                                                                                                                                                                                                                                          |
| AC-14       | ✅ 已满足   | ✅ R4 确认    | 主文件 126 行 ≤ 300，子组件均 ≤ 300                                                                                                                                                                                                                                                  |

### 回补归属确认

| 未满足 AC                     | 归属               | 说明                                                                                                        |
| ----------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------- |
| AC-6（hover/selected 对比度） | v1-01 Design Token | 文件树已正确使用 `--color-bg-hover` / `--color-bg-selected` token，对比度由 token 定义值决定，属 v1-01 职责 |
| AC-8（文件类型图标颜色）      | 待 Owner 决策      | 当前 emoji 方案已提供类型差异化；若需进一步颜色编码，可作为独立精修任务或归入 v1-12                         |
| AC-11~AC-13（构建门禁）       | 本 change 实现阶段 | 在实际开发提交前执行验证                                                                                    |

### R4 关键发现

1. **R3 评估修正**：R3 将 AC-1~AC-9 批量标注「待实现」，R4 逐项验证后发现 AC-1/2/3/4/5/7/9 共 7 项已满足。前序组件拆分工作（FileTreeNodeRow、FileTreeRenameRow、ContextMenu primitive）中已包含了大部分视觉精修实现。
2. **AC-8 需重新定义**：proposal 以代码编辑器范式描述文件类型颜色映射，但 CreoNow 作为创作 IDE 使用文档类型（chapter/note/setting 等）+ emoji 图标方案。建议 Owner 确认 AC-8 的最终验收标准。
3. **剩余工作量大幅缩减**：从 R3 评估的「9 项待实现」降至「1 项待重新定义 + 1 项跨 change 待验证 + 3 项构建门禁」。
