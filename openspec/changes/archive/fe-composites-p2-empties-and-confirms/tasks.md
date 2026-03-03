## 1. Specification

更新时间：2026-02-28 19:20

- [ ] 1.1 审阅并确认需求边界：新增 P2 Composites（EmptyState/ConfirmDialog/InfoBar），迁移 Feature 层散装空状态和确认弹窗。不重构 Toast 队列。
- [ ] 1.2 审阅并确认错误路径与边界路径：ConfirmDialog 需支持 destructive 语义（红色确认按钮）；EmptyState 需支持可选 action 按钮。
- [ ] 1.3 审阅并确认验收阈值与不可变契约：空状态必须统一使用 EmptyState Composite；确认弹窗不得散写。
- [ ] 1.4 依赖同步检查（Dependency Sync Check）：建议先行 `fe-composites-p0` + `fe-composites-p1`

### 1.5 预期实现触点

- 新增 `apps/desktop/renderer/src/components/composites/EmptyState.tsx`：
  - Props：`icon?`、`title`、`description?`、`action?`（按钮 slot）
  - 当前散装：FileTreePanel L783（"暂无文件"）、CharacterCardList L44（"暂无角色"）、OutlinePanel L628（自建 `EmptyState` 函数）、SkillPicker L161/185/273、TimelineView L91、ProjectSwitcher L227
- 新增 `apps/desktop/renderer/src/components/composites/ConfirmDialog.tsx`：
  - Props：`title`、`description`、`confirmLabel`、`cancelLabel`、`destructive?`、`onConfirm`、`onCancel`、`open`
  - 当前散装：`useConfirmDialog` hook（DashboardPage L14/373、VersionHistoryContainer L15/207）、`DeleteConfirmDialog`（character/）
  - 目标：统一为 Composite，hook 可保留但内部渲染改用 ConfirmDialog Composite
- 新增 `apps/desktop/renderer/src/components/composites/InfoBar.tsx`：
  - Props：`variant`（info/warning/error/success）、`message`、`action?`、`dismissible?`
  - 用于面板内提示条（非 Toast）
- Feature 迁移点（至少 3 处）：
  - `features/files/FileTreePanel.tsx` L783 → `<EmptyState>`
  - `features/character/CharacterCardList.tsx` L44 → `<EmptyState>`
  - `features/character/DeleteConfirmDialog.tsx` → 改用 `<ConfirmDialog>` Composite

**为什么是这些触点**：EmptyState 散装 8+ 处是最大脏区，ConfirmDialog 有 3 种不同实现需统一。

## 2. TDD Mapping（先测前提）

- [ ] 2.1 将 delta spec 的每个 Scenario 映射为至少一个测试用例
- [ ] 2.2 为每个测试标注对应 Scenario ID，建立可追踪关系
- [ ] 2.3 设定门禁：未出现 Red（失败测试）不得进入实现

### Scenario → 测试映射

| Scenario ID | 测试文件（计划） | 测试名称（计划） | 断言要点 | Mock/依赖 | 运行命令 |
| ----------- | ---------------- | ---------------- | -------- | --------- | -------- |
| `WB-FE-COMP-P2-S1` | `apps/desktop/renderer/src/components/composites/EmptyState.test.tsx` | `it('renders icon, title, and description')` | 断言三者均出现 | 无 | `pnpm -C apps/desktop test:run components/composites/EmptyState` |
| `WB-FE-COMP-P2-S1b` | 同上 | `it('renders action button when provided')` | 传入 action，断言按钮出现且可点击 | 无 | 同上 |
| `WB-FE-COMP-P2-S2` | `apps/desktop/renderer/src/components/composites/ConfirmDialog.test.tsx` | `it('renders title and description')` | open=true 时断言标题和描述出现 | 无 | `pnpm -C apps/desktop test:run components/composites/ConfirmDialog` |
| `WB-FE-COMP-P2-S2b` | 同上 | `it('applies destructive style to confirm button')` | destructive=true 时断言确认按钮有 destructive 样式 | 无 | 同上 |
| `WB-FE-COMP-P2-S2c` | 同上 | `it('calls onConfirm and onCancel correctly')` | 点击确认/取消，断言对应回调被调用 | 无 | 同上 |
| `WB-FE-COMP-P2-S3` | `apps/desktop/renderer/src/components/composites/InfoBar.test.tsx` | `it('renders message with correct variant style')` | 传入 variant="warning"，断言 warning 样式类 | 无 | `pnpm -C apps/desktop test:run components/composites/InfoBar` |

### 可复用测试范本

- P0/P1 Composite 测试（完成后可参考）

## 3. Red（先写失败测试）

- [ ] 3.1 `WB-FE-COMP-P2-S1`：import `EmptyState`，渲染带 icon/title/description，断言三者出现。
  - 期望红灯原因：`composites/EmptyState.tsx` 不存在。
- [ ] 3.2 `WB-FE-COMP-P2-S1b`：传入 action 按钮，断言按钮渲染且可点击。
  - 期望红灯原因：同上。
- [ ] 3.3 `WB-FE-COMP-P2-S2`：import `ConfirmDialog`，open=true，断言标题和描述出现。
  - 期望红灯原因：`composites/ConfirmDialog.tsx` 不存在。
- [ ] 3.4 `WB-FE-COMP-P2-S2b`：destructive=true，断言确认按钮有 destructive 样式。
  - 期望红灯原因：同上。
- [ ] 3.5 `WB-FE-COMP-P2-S2c`：点击确认/取消按钮，断言回调被调用。
  - 期望红灯原因：同上。
- [ ] 3.6 `WB-FE-COMP-P2-S3`：import `InfoBar`，variant="warning"，断言 warning 样式。
  - 期望红灯原因：`composites/InfoBar.tsx` 不存在。
- 运行：`pnpm -C apps/desktop test:run components/composites/`

## 4. Green（最小实现通过）

- [ ] 4.1 新增 `EmptyState.tsx`：icon + title + description + 可选 action → S1/S1b 转绿
- [ ] 4.2 新增 `ConfirmDialog.tsx`：基于 Dialog Primitive，支持 destructive 语义 → S2/S2b/S2c 转绿
- [ ] 4.3 新增 `InfoBar.tsx`：variant 驱动样式 + message + 可选 action/dismiss → S3 转绿
- [ ] 4.4 迁移 Feature 散装：FileTreePanel L783 → EmptyState，CharacterCardList L44 → EmptyState，DeleteConfirmDialog → ConfirmDialog Composite

## 5. Refactor（保持绿灯）

- [ ] 5.1 评估 `useConfirmDialog` hook 是否可改为内部渲染 ConfirmDialog Composite（保持 API 不变）
- [ ] 5.2 清理 OutlinePanel 内自建的 `EmptyState` 函数（L628），改用 Composite
- [ ] 5.3 为三个 Composite 补 Storybook stories

## 6. Evidence

- [ ] 6.1 记录 RUN_LOG：Red 阶段测试失败的输出
- [ ] 6.2 记录 RUN_LOG：Green 阶段全部通过的输出
- [ ] 6.3 记录 RUN_LOG：`pnpm -C apps/desktop test:run` 全量回归无新增失败
- [ ] 6.4 记录 Dependency Sync Check：确认 `fe-composites-p0` + `fe-composites-p1` 状态
- [ ] 6.5 Main Session Audit（仅在 Apply 阶段需要）
