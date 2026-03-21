# Tasks: V1-09 命令面板与搜索面板 视觉精修

- **GitHub Issue**: 待创建
- **分支**: `task/<N>-command-palette-and-search`
- **Delta Spec**: `openspec/changes/v1-09-command-palette-and-search/specs/`

---

## 验收标准

### CommandPalette 验收

| ID   | 标准                                                                                | 对应 Scenario |
| ---- | ----------------------------------------------------------------------------------- | ------------- |
| AC-1 | 命令组之间有可见的 section header（10px uppercase `--color-fg-muted`）+ 1px 分隔线  | 视觉          |
| AC-2 | Active（选中）命令项左侧有 2px `--color-info` accent 边框                           | 视觉          |
| AC-3 | 有快捷键的命令项右侧显示 shortcut pill（11px 字号、rounded pill 背景）              | 视觉          |
| AC-4 | 至少 4 类命令（导航/AI/文件/编辑器）有差异化图标颜色                                | 视觉          |
| AC-5 | 生产代码中 0 处 inline style 对象（`style={{...}}`），全部迁移为 Tailwind className | 全局          |

### SearchPanel 验收

| ID   | 标准                                                                                                       | 对应 Scenario |
| ---- | ---------------------------------------------------------------------------------------------------------- | ------------- |
| AC-6 | Active filter pill 有 shadow（`--shadow-sm`）+ 蓝色文字或指示线                                            | 视觉          |
| AC-7 | Match highlight 背景色为 `rgba(59, 130, 246, 0.2)` 或对应 `--color-info-subtle` token                      | 视觉          |
| AC-8 | Toggle controls（Semantic search / Include archived）对齐 Primitive 规范（20px 高/36px 宽/圆角/0.2s 过渡） | 视觉          |
| AC-9 | 选中结果左侧指示条宽度对齐设计稿（验证后为 2px 或 3px），使用 `--color-info` token                         | 视觉          |

### 全局验收

| ID    | 标准                                                                            | 对应 Scenario |
| ----- | ------------------------------------------------------------------------------- | ------------- |
| AC-10 | 所有新增样式使用语义化 Design Token，0 处新增 Tailwind arbitrary 色值           | 全局          |
| AC-11 | 键盘导航（↑/↓/Enter/Esc）在 CommandPalette 分组 header 上正确跳过，不中断操作流 | 可访问性      |
| AC-12 | 现有 CommandPalette + SearchPanel 相关测试 100% 通过，0 个新增失败              | 全局          |
| AC-13 | Storybook 可构建（`pnpm -C apps/desktop storybook:build`）                      | 全局          |
| AC-14 | TypeScript 类型检查通过（`pnpm typecheck`）                                     | 全局          |
| AC-15 | lint 无新增违规（`pnpm lint`）                                                  | 全局          |
| AC-16 | `CommandPalette.tsx` 从 ~793 行拆分至主文件 ≤ 300 行，子组件各 ≤ 300 行         | 架构          |
| AC-17 | `SearchPanel.tsx` 从 ~994 行拆分至主文件 ≤ 300 行，子组件各 ≤ 300 行            | 架构          |

---

## Phase 0: 准备

- [ ] 阅读 `AGENTS.md`
- [ ] 阅读 `design/DESIGN_DECISIONS.md` §11.4（CommandPalette）、§11.9（SearchPanel）、§21（搜索面板规范）
- [ ] 阅读设计稿 `design/Variant/designs/17-command-palette.html` 全文——标注分组 header 样式、active 左蓝线、快捷键 pill、图标颜色
- [ ] 阅读设计稿 `design/Variant/designs/25-search-panel.html` 全文——标注 filter pills 样式、match highlight 颜色、toggle 规范、结果指示条
- [ ] 阅读设计稿 `design/Variant/designs/34-component-primitives.html`——Toggle 组件尺寸、色彩、动效规范
- [ ] 阅读 `apps/desktop/renderer/src/features/commandPalette/CommandPalette.tsx` 全文（~730 行）
- [ ] 阅读 `apps/desktop/renderer/src/features/search/SearchPanel.tsx` 全文（~900 行）
- [ ] 盘点 `commandPalette/` 和 `search/` 目录下所有子组件文件
- [ ] 确认现有测试文件：搜索 `features/commandPalette/` 和 `features/search/` 下的 `*.test.*` 文件
- [ ] 运行现有测试基线：
  - `pnpm -C apps/desktop vitest run CommandPalette`
  - `pnpm -C apps/desktop vitest run SearchPanel`
  - 记录各自通过 / 失败数量
- [ ] 确认 v1-01（Design Token 补完）已合并，所需 token 可用
- [ ] 确认 v1-02（Primitive 进化）已合并，Toggle 增强可用
- [ ] 盘点 inline style 对象：`grep -cn 'style={{' CommandPalette.tsx SearchPanel.tsx`，记录生产代码中的 inline style 位置

---

## Part A: CommandPalette

### Phase 1A: Red（测试先行）

#### Task 1A.1: 命令组分隔线测试

**映射验收标准**: AC-1

- [ ] 测试：CommandPalette 渲染时，相邻不同类别的命令之间有 section header 元素
- [ ] 测试：section header 包含分组名称文字（如「导航」「AI」「文件」）
- [ ] 测试：section header 元素有 `uppercase` 样式

**验证策略**: render CommandPalette with commands from multiple categories，断言 section header 元素数量 ≥ 2。

**文件**: `apps/desktop/renderer/src/features/commandPalette/__tests__/CommandGroupHeaders.test.tsx`（新建）

#### Task 1A.2: Active 状态左蓝线测试

**映射验收标准**: AC-2

- [ ] 测试：active（当前高亮）命令项有 `border-l-2` 或等效左边框 className
- [ ] 测试：左边框颜色使用 `--color-info` token

**验证策略**: render CommandPalette，模拟键盘 ↓ 选中第一个命令项，断言其 className 包含左蓝线。

**文件**: `apps/desktop/renderer/src/features/commandPalette/__tests__/ActiveItemIndicator.test.tsx`（新建）

#### Task 1A.3: 快捷键标签展示测试

**映射验收标准**: AC-3

- [ ] 测试：有快捷键的命令项包含 shortcut pill 元素
- [ ] 测试：shortcut pill 包含正确的快捷键文字（如 `Ctrl+N`、`Ctrl+P`）
- [ ] 测试：shortcut pill 有 rounded 背景样式

**验证策略**: render CommandPalette，定位有快捷键的命令项，断言 shortcut pill 子元素存在。

**文件**: `apps/desktop/renderer/src/features/commandPalette/__tests__/ShortcutPills.test.tsx`（新建）

#### Task 1A.4: 分类图标颜色测试

**映射验收标准**: AC-4

- [ ] 测试：导航类命令图标使用蓝色 token（`--color-info`）
- [ ] 测试：AI 类命令图标使用 accent token（`--color-accent`）
- [ ] 测试：文件类命令图标使用绿色 token（`--color-success`）
- [ ] 测试：编辑器类命令图标使用黄色 token（`--color-warning`）

**验证策略**: render 不同类别命令，断言各自图标颜色 className 不同。

**文件**: `apps/desktop/renderer/src/features/commandPalette/__tests__/CategoryIconColors.test.tsx`（新建）

#### Task 1A.5: 键盘导航跳过分组 Header 测试

**映射验收标准**: AC-11

- [ ] 测试：键盘 ↓ 从一个分组最后一项导航到下一分组时，跳过 section header 直接到第一个命令项
- [ ] 测试：键盘 ↑ 同理反向跳过 section header
- [ ] 测试：Enter 在 section header 上不触发任何操作

**验证策略**: render CommandPalette with multi-group commands，模拟 ↓/↑ 键盘事件，断言 active index 跳过 header 位置。

**文件**: `apps/desktop/renderer/src/features/commandPalette/__tests__/KeyboardNavGroupSkip.test.tsx`（新建）

### Phase 2A: Green（最小实现）

#### Task 2A.1: 命令组分隔线

**映射验收标准**: AC-1

- [ ] 在命令列表渲染逻辑中，检测相邻命令的 category 是否变化
- [ ] category 变化处插入 section header 元素：

```tsx
<div className="px-3 pt-3 pb-1.5">
  <span className="text-[10px] uppercase tracking-[0.1em] text-[var(--color-fg-muted)]">
    {groupName}
  </span>
  <div className="mt-1.5 h-px bg-[var(--color-border-default)]" />
</div>
```

- [ ] 确保 section header 在虚拟滚动（如有）中正确渲染

**文件**: `CommandPalette.tsx`（修改）

#### Task 2A.2: Active 状态左蓝线

**映射验收标准**: AC-2

- [ ] 选中命令项增加左边框样式：

```tsx
className={cn(
  'border-l-2',
  isActive
    ? 'border-[var(--color-info)] bg-[var(--bg-selected)]'
    : 'border-transparent'
)}
```

- [ ] 非 active 项使用 `border-transparent` 保持布局对齐

**文件**: `CommandPalette.tsx`（修改）

#### Task 2A.3: 快捷键标签展示

**映射验收标准**: AC-3

- [ ] 在命令数据结构中确认 `shortcut` 字段可用
- [ ] 命令项右侧增加 shortcut pill：

```tsx
{
  command.shortcut && (
    <span className="ml-auto pl-3 text-[11px] text-[var(--color-fg-muted)] bg-[var(--color-bg-elevated)] px-1.5 py-0.5 rounded">
      {command.shortcut}
    </span>
  );
}
```

- [ ] 使用 `--color-bg-elevated` token（映射到 `~#2a2a2a`）而非硬编码

**文件**: `CommandPalette.tsx`（修改）

#### Task 2A.4: 分类图标颜色编码

**映射验收标准**: AC-4

- [ ] 创建命令类别→颜色映射：

```typescript
const COMMAND_CATEGORY_COLORS: Record<string, string> = {
  navigation: "text-[var(--color-info)]",
  ai: "text-[var(--color-accent)]",
  file: "text-[var(--color-success)]",
  editor: "text-[var(--color-warning)]",
};
```

- [ ] 在图标渲染处应用对应颜色 className
- [ ] 未映射类别降级使用 `--color-fg-muted`

**文件**: `CommandPalette.tsx`（修改）

#### Task 2A.5: Inline Style 迁移（生产代码）

**映射验收标准**: AC-5

- [ ] 逐一排查 `CommandPalette.tsx` 中的 `style={{...}}`
- [ ] 将每处 inline style 转换为等效 Tailwind className
- [ ] 不可直接转换的（如动态计算值）保留并添加注释说明原因

**文件**: `CommandPalette.tsx`（修改）

#### Task 2A.6: CommandPalette.tsx 解耦拆分

**映射验收标准**: AC-16

- [ ] 提取 `CommandGroup.tsx`：分组渲染（section header + 分隔线 + 组内命令列表），≤ 200 行
- [ ] 提取 `CommandItem.tsx`：单命令项渲染（icon + label + shortcut pill + active 左蓝线），≤ 150 行
- [ ] 提取 `useCommandSearch.ts`：搜索过滤 + fuzzy match + 分组排序逻辑，≤ 200 行
- [ ] 精简 `CommandPalette.tsx` 至 ≤ 300 行（仅保留 modal 框架 + input + 子组件编排）
- [ ] 确认提取后所有现有测试仍通过

**文件**: `apps/desktop/renderer/src/features/commandPalette/CommandPalette.tsx`（拆分）

---

## Part B: SearchPanel

### Phase 1B: Red（测试先行）

#### Task 1B.1: Filter Pills Active 样式测试

**映射验收标准**: AC-6

- [ ] 测试：active filter pill 有 shadow className（`shadow-sm` 或 `--shadow-sm` 引用）
- [ ] 测试：active filter pill 文字颜色使用 `--color-info` token
- [ ] 测试：非 active filter pill 无 shadow

**验证策略**: render SearchPanel，定位 filter pills 区域，模拟点击某个 filter pill 使其 active，断言 className 变更。

**文件**: `apps/desktop/renderer/src/features/search/__tests__/FilterPillsActive.test.tsx`（新建）

#### Task 1B.2: Match Highlight 颜色测试

**映射验收标准**: AC-7

- [ ] 测试：搜索结果中的匹配词高亮元素使用 `--color-info-subtle` token 或等效的 `rgba(59, 130, 246, 0.2)` 背景色
- [ ] 测试：高亮元素有 background-color 样式

**验证策略**: render SearchPanel with search results containing matches，定位 highlight 元素，断言背景色 className。

**文件**: `apps/desktop/renderer/src/features/search/__tests__/MatchHighlightColor.test.tsx`（新建）

#### Task 1B.3: Toggle Controls 样式测试

**映射验收标准**: AC-8

- [ ] 测试：Semantic search toggle 有 `rounded-full` 样式
- [ ] 测试：toggle 有 `transition` 相关 className（过渡动效）

**验证策略**: 定位 toggle input 元素，断言 className 包含规范要求的样式。

**文件**: `apps/desktop/renderer/src/features/search/__tests__/ToggleControlsStyle.test.tsx`（新建）

#### Task 1B.4: 选中结果指示条宽度测试

**映射验收标准**: AC-9

- [ ] 测试：选中搜索结果的左侧指示条宽度 ≥ 2px
- [ ] 测试：指示条使用 `--color-info` token

**验证策略**: render SearchPanel with results，模拟选中某个结果，断言左侧指示条元素的宽度 className。

**文件**: `apps/desktop/renderer/src/features/search/__tests__/ResultIndicatorBar.test.tsx`（新建）

### Phase 2B: Green（最小实现）

#### Task 2B.1: Filter Pills Active 样式

**映射验收标准**: AC-6

- [ ] Active filter pill 增加样式：

```tsx
className={cn(
  'px-3 py-1 rounded-full text-sm transition-all',
  isActive
    ? 'shadow-[var(--shadow-sm)] text-[var(--color-info)] bg-[var(--color-bg-elevated)]'
    : 'text-[var(--color-fg-muted)]'
)}
```

- [ ] 使用 `--shadow-sm` token 而非硬编码 shadow

**文件**: `SearchPanel.tsx`（修改）

#### Task 2B.2: Match Highlight 颜色对齐

**映射验收标准**: AC-7

- [ ] 验证 `--color-info-subtle` 实际值
- [ ] 如实际值为 `rgba(59, 130, 246, 0.2)` 则确认已正确引用
- [ ] 如不匹配，将 highlight 背景色修正为 `bg-[var(--color-info-subtle)]`

**文件**: `SearchPanel.tsx`（修改）

#### Task 2B.3: Toggle Controls 样式对齐

**映射验收标准**: AC-8

- [ ] 验证 toggle 组件是否使用 Primitive Toggle 组件（如已使用 v1-02 增强版则无需修改）
- [ ] 如未使用 Primitive，对齐规范：高度 20px、宽度 36px、`rounded-full`、`transition-all duration-[var(--duration-fast)]`
- [ ] 确保开/关态颜色正确：开=`--color-info`、关=`--color-bg-elevated`

**文件**: `SearchPanel.tsx`（修改）

#### Task 2B.4: 选中结果指示条宽度调整

**映射验收标准**: AC-9

- [ ] 对照设计稿确认精确宽度（2px 或 3px）
- [ ] 如设计稿为 3px：将 `w-0.5`（2px）改为 `w-[3px]`
- [ ] 确保使用 `--color-info` token：`bg-[var(--color-info)]`

**文件**: `SearchPanel.tsx`（修改）

#### Task 2B.5: SearchPanel Inline Style 迁移

**映射验收标准**: AC-5（搜索面板部分）

- [ ] 盘点 `SearchPanel.tsx` 中的 `style={{...}}`
- [ ] 将生产代码中的 inline style 转换为 Tailwind className
- [ ] 不可直接转换的保留并注释说明

**文件**: `SearchPanel.tsx`（修改）

#### Task 2B.6: SearchPanel.tsx 解耦拆分

**映射验收标准**: AC-17

- [ ] 提取 `SearchResultList.tsx`：结果列表渲染（分组 + match highlight + 指示条），≤ 250 行
- [ ] 提取 `SearchFilters.tsx`：filter pills + toggle controls + active 状态管理，≤ 200 行
- [ ] 提取 `SearchResultItem.tsx`：单结果渲染（文件路径 + 上下文 + highlight），≤ 150 行
- [ ] 精简 `SearchPanel.tsx` 至 ≤ 300 行（仅保留面板框架 + search input + 子组件编排）
- [ ] 确认提取后所有现有测试仍通过

**文件**: `apps/desktop/renderer/src/features/search/SearchPanel.tsx`（拆分）

---

## Phase 3: Refactor（清理与验证）

- [ ] 确认所有 Phase 1A + Phase 1B 测试通过（Red → Green 完成）
- [ ] 运行全量回归：
  - `pnpm -C apps/desktop vitest run CommandPalette`
  - `pnpm -C apps/desktop vitest run SearchPanel`
- [ ] 运行 `pnpm typecheck` 类型检查
- [ ] 运行 `pnpm lint` lint 检查
- [ ] 运行 `pnpm -C apps/desktop storybook:build` Storybook 构建
- [ ] 检查 0 新增 inline style：`grep -c 'style={{' CommandPalette.tsx SearchPanel.tsx`（生产代码部分）
- [ ] 检查所有新增样式使用 Design Token：
  - `grep -rn '#[0-9a-fA-F]\{3,8\}' CommandPalette.tsx`
  - `grep -rn '#[0-9a-fA-F]\{3,8\}' SearchPanel.tsx`
  - 结果应为 0 新增硬编码色值
- [ ] 如两个组件修改量较大，可拆为两个独立 PR：
  - PR-A: CommandPalette 精修（Part A）
  - PR-B: SearchPanel 精修（Part B）
- [ ] PR 创建，含 `Closes #N`

---

## R3 Cascade Refresh (2026-03-21)

### 上游依赖确认

- ✅ v1-06 AI Panel Overhaul: PASS（27测试文件全通过）
- ✅ v1-07 Settings Visual Polish: PASS（91测试全通过）
- 上游依赖（v1-01 Design Token、v1-02 Primitive）已就绪

### 基线指标更新

| 指标                         | tasks.md 原值           | R3 实测值                  | 说明           |
| ---------------------------- | ----------------------- | -------------------------- | -------------- |
| CommandPalette.tsx 行数      | ~793（AC-16 目标 ≤300） | **283**                    | ✅ 已达标      |
| CommandPalette inline styles | ~35（含 SearchPanel）   | **0**                      | ✅ AC-5 已满足 |
| CommandPalette 模块总行数    | —                       | **3,170**                  | 首次采集       |
| CommandPalette 测试          | —                       | **5 文件 / 57 测试全通过** | AC-12 基线 ✅  |
| SearchPanel.tsx 行数         | ~994（AC-17 目标 ≤300） | **294**                    | ✅ 已达标      |
| SearchPanel inline styles    | —                       | **0**                      | ✅ 已清零      |
| SearchPanel 模块总行数       | —                       | **2,807**                  | 首次采集       |
| SearchPanel 测试             | —                       | **9 文件 / 30 测试全通过** | AC-12 基线 ✅  |

### AC 状态评估

| AC                       | 状态        | 说明                                                                  |
| ------------------------ | ----------- | --------------------------------------------------------------------- |
| AC-5                     | ✅ 已满足   | 生产代码 inline style = 0                                             |
| AC-12                    | ✅ 基线良好 | CommandPalette 57 + SearchPanel 30 = 87 测试全通过                    |
| AC-16                    | ✅ 已满足   | CommandPalette.tsx 283 行 ≤ 300                                       |
| AC-17                    | ✅ 已满足   | SearchPanel.tsx 294 行 ≤ 300                                          |
| AC-1~AC-4                | 🔲 待实现   | CommandPalette 视觉精修（分组线、左蓝线、快捷键 pill、图标颜色）      |
| AC-6~AC-9                | 🔲 待实现   | SearchPanel 视觉精修（filter pills、match highlight、toggle、指示条） |
| AC-10~AC-11, AC-13~AC-15 | 🔲 待验证   | Design Token / 键盘导航 / Storybook / typecheck / lint 在实现阶段执行 |
