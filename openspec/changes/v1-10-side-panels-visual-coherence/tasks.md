# Tasks: V1-10 侧面板视觉统一

- **GitHub Issue**: 待创建
- **分支**: `task/<N>-side-panels-visual-coherence`
- **Delta Spec**: `openspec/changes/v1-10-side-panels-visual-coherence/specs/`

---

## 验收标准

| ID | 标准 | 验证方式 |
| --- | --- | --- |
| AC-1 | 5 个面板 header 高度统一 40px，标题字号统一 `var(--text-subtitle-size)`，内边距统一 `var(--space-panel-padding)` | 视觉审查 + Storybook |
| AC-2 | 5 个面板 section 间距统一使用 `var(--space-section-gap)`，内容内边距统一 `var(--space-panel-padding)` | grep token 引用 |
| AC-3 | 列表项交互状态链统一：hover → selected → active 视觉表现一致 | 视觉交互验证 |
| AC-4 | CharacterDetailDialog 滚动溢出有 scroll shadow 提示 | 视觉验证 |
| AC-5 | CharacterPanel Avatar 灰度/透明度在 relationships 中一致 | 视觉验证 |
| AC-6 | MemoryPanel Distilling 有 `<LoadingState>` indicator | 代码审查 + 视觉验证 |
| AC-7 | MemoryPanel Rule cards 区分 auto-generated vs user-confirmed 标签 | 视觉验证 |
| AC-8 | MemoryPanel 冲突解决面板为 sticky 置顶或有醒目视觉强调 | 视觉验证 |
| AC-9 | OutlinePanel 缩进改用 `em` 比例制（响应式缩放） | 代码审查 |
| AC-10 | OutlinePanel Collapse toggle icon ≥ 24px | 代码审查 + 视觉验证 |
| AC-11 | OutlinePanel Word count badge 与 hover action 不重叠冲突 | 视觉交互验证 |
| AC-12 | KnowledgeGraphPanel 空状态使用 `<EmptyState>` 组件 | 代码审查 |
| AC-13 | KnowledgeGraphPanel JSON 解析失败显示 `<ErrorState>` | 代码审查 + 视觉验证 |
| AC-14 | KnowledgeGraphPanel Timeline 拖拽有阴影升起视觉反馈 | 视觉交互验证 |
| AC-15 | VersionHistoryPanel diff 摘要 line-clamp 有 "展开" 按钮 | 视觉交互验证 |
| AC-16 | VersionHistoryPanel hover action buttons 有 ≥150ms fade-in 过渡 | 视觉交互验证 |
| AC-17 | VersionHistoryPanel "No changes" badge contrast ratio ≥ 4.5:1 | 对比度工具检查 |
| AC-18 | 5 个面板 eslint-disable 从 93 处降至 ≤10 | `grep` 统计 |
| AC-19 | 所有新增视觉元素使用语义化 Design Token，0 处新增 arbitrary 值 | grep 验证 |
| AC-20 | 全量测试通过（`pnpm -C apps/desktop vitest run`） | CI 命令 |
| AC-21 | Storybook 可构建（`pnpm -C apps/desktop storybook:build`） | CI 命令 |
| AC-22 | TypeScript 类型检查通过（`pnpm typecheck`） | CI 命令 |
| AC-23 | lint 无新增违规（`pnpm lint`） | CI 命令 |
| AC-24 | 7 个面板主文件（KnowledgeGraphPanel / OutlinePanel / CharacterDetailDialog / MemoryPanel / VersionHistoryPanel / VersionHistoryContainer / CharacterPanel）各 ≤ 300 行 | 架构 |

---

## Phase 0: 准备

- [ ] 阅读 `AGENTS.md`
- [ ] 阅读 `design/DESIGN_DECISIONS.md` §11（面板规范）
- [ ] 阅读 5 个设计稿：
  - `design/Variant/designs/18-character-manager.html`
  - `design/Variant/designs/19-knowledge-graph.html`
  - `design/Variant/designs/20-memory-panel.html`
  - `design/Variant/designs/23-version-history.html`
  - `design/Variant/designs/13-sidebar-outline.html`
- [ ] 阅读 5 个面板的源码，标注当前 header 高度、间距、交互状态实现
- [ ] 确认 v1-11（`<EmptyState>` / `<LoadingState>` / `<ErrorState>`）是否已完成
- [ ] 如 v1-11 未完成，规划先实施不依赖状态组件的部分（header 统一、间距统一、专项修复）

---

## Phase 1: Red（测试先行）

### Task 1.1: 面板 Header 统一测试

**映射验收标准**: AC-1, AC-2

- [ ] 测试：5 个面板 header 包含统一 className 或 `<PanelHeader>` 组件调用
- [ ] 测试：header 渲染高度 40px（通过 computed style 或 snapshot）
- [ ] 测试：面板 section 间距引用 `var(--space-section-gap)` token

**文件**: 各面板测试文件中新增用例

### Task 1.2: CharacterPanel 测试

**映射验收标准**: AC-4, AC-5

- [ ] 测试：CharacterDetailDialog 滚动区域有 scroll-shadow class
- [ ] 测试：Avatar 在 relationships 列表中使用统一的灰度 / 透明度 class

**文件**: `CharacterPanel.test.tsx` / `CharacterDetailDialog.test.tsx`

### Task 1.3: MemoryPanel 测试

**映射验收标准**: AC-6, AC-7, AC-8

- [ ] 测试：Distilling 状态下渲染 `<LoadingState>` 组件
- [ ] 测试：Rule card 根据类型（auto-generated / user-confirmed）渲染不同标签
- [ ] 测试：冲突解决面板有 sticky 定位 class

**文件**: `MemoryPanel.test.tsx`

### Task 1.4: OutlinePanel 测试

**映射验收标准**: AC-9, AC-10, AC-11

- [ ] 测试：缩进使用 `em` 单位而非固定 px
- [ ] 测试：Collapse toggle 渲染尺寸 ≥ 24px
- [ ] 测试：Word count badge 和 hover action 不在同一交互区域内（分区渲染）

**文件**: `OutlinePanel.test.tsx`

### Task 1.5: KnowledgeGraphPanel 测试

**映射验收标准**: AC-12, AC-13, AC-14

- [ ] 测试：无数据时渲染 `<EmptyState>` 组件（含 icon + 描述 + action 按钮）
- [ ] 测试：JSON 解析失败时渲染 `<ErrorState severity="error">`
- [ ] 测试：Timeline 拖拽时元素有 elevation / shadow class 变化

**文件**: `KnowledgeGraphPanel.test.tsx`

### Task 1.6: VersionHistoryPanel 测试

**映射验收标准**: AC-15, AC-16, AC-17

- [ ] 测试：line-clamp 的 diff 摘要旁有"展开"按钮渲染
- [ ] 测试：hover action buttons 有 `transition` / `duration` class
- [ ] 测试："No changes" badge 使用的 token 组合满足 WCAG AA 对比度

**文件**: `VersionHistoryPanel.test.tsx`

---

## Phase 2: Green（实现）

### Task 2.0: 提取 `<PanelHeader>` 共享实现

**映射验收标准**: AC-1

- [ ] 在 `renderer/src/components/patterns/` 下创建 `PanelHeader.tsx`（或在 5 个面板中统一 CSS class `panel-header`）
- [ ] Props：`title: string`、`actions?: ReactNode`
- [ ] 样式：高度 40px、1px 底部分隔线 `var(--color-border-subtle)`、标题 `var(--text-subtitle-size)` + `var(--weight-semibold)`、内边距 `var(--space-panel-padding)`

### Task 2.1: CharacterPanel 统一 & 修复

**映射验收标准**: AC-1, AC-2, AC-3, AC-4, AC-5, AC-18

- [ ] 替换 header 为 `<PanelHeader>` / 统一 class
- [ ] 统一 section 间距引用 token
- [ ] 统一列表项 hover / selected / active 状态
- [ ] CharacterDetailDialog 添加 scroll shadow（`.scroll-shadow-y` 或 CSS mask-image）
- [ ] Avatar 灰度 / 透明度在 relationships 列表中统一
- [ ] 原生 HTML → Primitives 替换（目标清理 26 处 eslint-disable 中的 20+）

**文件**: `CharacterPanel.tsx`、`CharacterDetailDialog.tsx` 及关联文件

### Task 2.2: MemoryPanel 统一 & 修复

**映射验收标准**: AC-1, AC-2, AC-3, AC-6, AC-7, AC-8, AC-18

- [ ] 替换 header 为 `<PanelHeader>` / 统一 class
- [ ] 统一 section 间距 + 列表项交互状态
- [ ] Distilling 状态添加 `<LoadingState variant="spinner" message="提炼中…" />`
- [ ] Rule card 区分 auto-generated（badge "自动生成"）vs user-confirmed（badge "已确认"）
- [ ] 冲突解决面板改为 `position: sticky; top: 0; z-index: 10` 或醒目背景色
- [ ] 原生 HTML → Primitives 替换（目标清理 13 处中的 10+）

**文件**: `MemoryPanel.tsx` 及关联文件

### Task 2.3: OutlinePanel 统一 & 修复

**映射验收标准**: AC-1, AC-2, AC-3, AC-9, AC-10, AC-11, AC-18

- [ ] 替换 header 为 `<PanelHeader>` / 统一 class
- [ ] 统一 section 间距 + 列表项交互状态
- [ ] 缩进从固定 16/32/48px 改为 `1em`/`2em`/`3em`（随字号缩放）
- [ ] Collapse toggle icon 从 4px 扩展至 24px（使用 `<IconButton size="sm">`）
- [ ] Word count badge 移至行末固定区域，hover action 使用 absolute 定位不覆盖 badge
- [ ] 原生 HTML → Primitives 替换（目标清理 9 处中的 7+）

**文件**: `OutlinePanel.tsx` 及关联文件

### Task 2.4: KnowledgeGraphPanel 统一 & 修复

**映射验收标准**: AC-1, AC-2, AC-3, AC-12, AC-13, AC-14

- [ ] 替换 header 为 `<PanelHeader>` / 统一 class
- [ ] 统一 section 间距 + 列表项交互状态
- [ ] 空状态替换为 `<EmptyState icon={<GraphIcon />} title="暂无知识图谱" description="..." action={{ label: '创建', onClick: ... }} />`
- [ ] JSON 解析失败替换为 `<ErrorState severity="error" title="数据解析失败" action={{ label: '重试', onClick: ... }} />`
- [ ] Timeline 拖拽添加视觉反馈：拖拽中 `shadow-lg` + `scale(1.02)` + `opacity: 0.9`

**文件**: `KnowledgeGraphPanel.tsx` 及关联文件

### Task 2.5: VersionHistoryPanel 统一 & 修复

**映射验收标准**: AC-1, AC-2, AC-3, AC-15, AC-16, AC-17, AC-18

- [ ] 替换 header 为 `<PanelHeader>` / 统一 class
- [ ] 统一 section 间距 + 列表项交互状态
- [ ] Diff 摘要：line-clamp 后添加"展开"按钮（`<Button variant="ghost" size="xs">`），展开后显示全文
- [ ] Hover action buttons：添加 `opacity: 0; transition: opacity var(--duration-fast) var(--ease-default)` + hover 时 `opacity: 1`
- [ ] "No changes" badge：调整前景色 / 背景色组合确保 contrast ratio ≥ 4.5:1（使用 `var(--color-text-secondary)` + `var(--color-bg-tertiary)` 或等效）
- [ ] 原生 HTML → Primitives 替换（目标清理 15 处中的 12+）

**文件**: `VersionHistoryPanel.tsx` 及关联文件

### Task 2.6: 面板文件解耦拆分

**映射验收标准**: AC-24

- [ ] **KnowledgeGraphPanel.tsx**（1,315→≤300）：提取 `KGToolbar.tsx`、`KGNodeDetail.tsx`、`KGFilterPanel.tsx`、`useKGLayout.ts`
- [ ] **OutlinePanel.tsx**（1,094→≤300）：提取 `OutlineItem.tsx`、`OutlineDragDrop.tsx`、`useOutlineTree.ts`
- [ ] **CharacterDetailDialog.tsx**（1,090→≤300）：提取 `CharacterTraitsEditor.tsx`、`CharacterRelationships.tsx`、`CharacterAppearance.tsx`
- [ ] **MemoryPanel.tsx**（918→≤300）：提取 `MemoryRuleCard.tsx`、`MemoryConflictResolver.tsx`、`useMemoryDistill.ts`
- [ ] **VersionHistoryPanel.tsx**（860→≤300）：提取 `VersionHistoryItem.tsx`、`VersionDiffSummary.tsx`、`useVersionCompare.ts`
- [ ] **VersionHistoryContainer.tsx**（760→≤300）：提取 `VersionTimeline.tsx`、`VersionActions.tsx`
- [ ] **CharacterPanel.tsx**（379→≤300）：提取 `CharacterListItem.tsx`（角色列表项渲染）
- [ ] 每个拆分后的子组件 ≤ 300 行
- [ ] 确认提取后所有现有测试仍通过

**文件**: `apps/desktop/renderer/src/features/` 下各面板目录

---

## Phase 3: Verification（验证）

- [ ] 运行 Phase 1 全部测试，确认全绿
- [ ] 运行 `pnpm -C apps/desktop vitest run` 全量测试通过
- [ ] 运行 `pnpm typecheck` 类型检查通过
- [ ] 运行 `pnpm lint` lint 无新增违规
- [ ] 运行 `pnpm -C apps/desktop storybook:build` Storybook 可构建
- [ ] 统计 5 个面板 `eslint-disable` 总数，确认 ≤10
- [ ] grep 确认 0 处新增 Tailwind arbitrary 色值（`text-[#`、`bg-[#`、`border-[#`）
- [ ] 逐面板视觉对比设计稿，确认 header / 间距 / 交互状态一致
- [ ] 确认 `<EmptyState>` / `<LoadingState>` / `<ErrorState>` 在各面板中的渲染正确
