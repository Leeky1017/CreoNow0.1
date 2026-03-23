# Tasks: V1-20 Storybook 卓越化与组件文档

- **状态**: 待启动
- **GitHub Issue**: 待创建
- **分支**: `task/<N>-storybook-excellence`
- **Delta Spec**: `renderer/src/**/*.stories.tsx`、`.storybook/preview.tsx`

---

## 验收标准

| ID   | 标准                                                    | 验证方式                                         | 结果 | R10 基线                                                              |
| ---- | ------------------------------------------------------- | ------------------------------------------------ | ---- | --------------------------------------------------------------------- |
| AC-1 | 所有 22 个功能目录（不含 `__tests__`）有对应 Story 文件 | `find features -name "*.stories.tsx"` 逐目录检查 | 待验 | 19/22（缺 rightpanel, settings, shortcuts）                           |
| AC-2 | 单个 Story 文件 ≤ 500 行                                | `find -name "*.stories.tsx" -exec wc -l` 检查    | 待验 | 21 个文件超 500 行                                                    |
| AC-3 | Play function ≥ 290 个（当前 256 + 新增 ≥ 34）          | `grep "play:" --include="*.stories.tsx" \| wc`   | 待验 | 256 个 play function                                                  |
| AC-4 | ≥ 9 个组件有 Storybook Docs page 含 usage guidelines    | 人工检查 docs description 内容                   | 待验 | 21 个文件有 docs 配置，但多为 story 级描述，缺组件级 usage guidelines |
| AC-5 | Storybook 构建通过                                      | `pnpm -C apps/desktop storybook:build`           | 待验 | 构建通过                                                              |
| AC-6 | 暗/浅双主题 decorator 已配置                            | Storybook 全局配置检查                           | 待验 | ThemeDecorator 硬编码 dark 主题，14 处主题引用                        |
| AC-7 | 拆分后的 Story 文件在 Storybook 导航中归类正确          | 手动验证 Storybook 侧边栏                        | 待验 | N/A                                                                   |

---

## Phase 0: 准备

### T0.1 阅读规范与确认覆盖缺口

- [ ] 阅读 `AGENTS.md`、`docs/references/testing/README.md`
- [ ] 阅读 `design/DESIGN_DECISIONS.md`（前端任务必读）
- [ ] 确认 3 个无 Story 的功能目录组件结构：
  - `rightpanel/`：InfoPanel、QualityPanel、QualityPanelSections（均依赖 IPC，需 mock）
  - `settings/`：AiSettingsSection、AppearanceSection、JudgeSection（均依赖 store/IPC）
  - `shortcuts/`：ShortcutsPanel（纯展示，依赖 `getAllShortcuts()` 配置）
- [ ] 确认巨石 Story 拆分边界（见 Phase 2 分析）
- [ ] 运行 `pnpm -C apps/desktop storybook:build` 确认基线构建通过

### T0.2 规划拆分策略

根据 R10 实测，> 500 行的 Story 文件共 21 个。按优先级分层：

- **P0 拆分**（> 800 行，8 个文件）：Phase 2 核心目标
- **P1 拆分**（500–800 行，13 个文件）：视 Phase 2 进度酌情纳入
- 拆分原则：按组件/场景语义边界拆分，而非机械按行数切割

---

## Phase 1: Story 全覆盖（补缺口）

> 目标：22/22 功能目录全部有对应 Story（AC-1）

### T1.1 `rightpanel/` → `RightPanel.stories.tsx`

**组件**：InfoPanel（文档统计面板）、QualityPanel（质量检查面板）、QualityPanelSections（子区域）

**Story 清单**：

| Story 名称                | 描述                                             | Play Function     |
| ------------------------- | ------------------------------------------------ | ----------------- |
| `InfoPanelDefault`        | 有文档统计数据（字数、时长、修改日期）的默认状态 | ✅ 验证统计项渲染 |
| `InfoPanelEmpty`          | 无文档选中时的空状态                             | ❌ 纯展示         |
| `InfoPanelLoading`        | 加载中状态                                       | ❌ 纯展示         |
| `QualityPanelReady`       | Judge 模型就绪 + 检查通过                        | ✅ 展开/收起交互  |
| `QualityPanelDownloading` | Judge 模型下载中                                 | ❌ 纯展示         |
| `QualityPanelError`       | Judge 模型错误 + 重试按钮                        | ✅ 点击重试       |
| `QualityConstraints`      | 约束条件列表展示                                 | ✅ 列表项交互     |

**Mock 策略**：

- `invoke`（IPC 调用）→ mock 返回预设数据
- `useFileStore` → mock 提供 `DocumentListItem`
- `useProjectStore` → mock 提供 `projectId`

**预估行数**：~300 行

### T1.2 `settings/` → `SettingsPages.stories.tsx`

**组件**：AiSettingsSection、AppearanceSection、JudgeSection

**Story 清单**：

| Story 名称                | 描述                                               | Play Function         |
| ------------------------- | -------------------------------------------------- | --------------------- |
| `AiSettingsDefault`       | AI 配置面板默认状态（provider 选择、API key 输入） | ✅ 切换 provider mode |
| `AiSettingsConnected`     | 连接测试成功状态                                   | ❌ 纯展示             |
| `AppearanceDefault`       | 主题切换界面                                       | ✅ 点击切换暗/浅主题  |
| `JudgeSectionReady`       | Judge 模型就绪状态                                 | ❌ 纯展示             |
| `JudgeSectionDownloading` | Judge 模型下载中                                   | ❌ 纯展示             |
| `JudgeSectionError`       | 错误 + ensure 按钮                                 | ✅ 点击 ensure        |
| `AllSections`             | 三个 Section 组合展示                              | ❌ 纯展示             |

**Mock 策略**：

- `invoke`（IPC 调用）→ mock 返回 AiSettings / JudgeModelState
- `useThemeStore` → mock 提供 theme mode
- `useJudgeEnsure` → mock hook

**预估行数**：~350 行

### T1.3 `shortcuts/` → `ShortcutsPanel.stories.tsx`

**组件**：ShortcutsPanel（纯展示组件，依赖 `getAllShortcuts()` 配置函数）

**Story 清单**：

| Story 名称      | 描述                   | Play Function         |
| --------------- | ---------------------- | --------------------- |
| `Default`       | 全部快捷键列表         | ✅ 验证列表渲染完整性 |
| `ManyShortcuts` | 大量快捷键时的滚动表现 | ❌ 纯展示             |
| `EmptyState`    | 无快捷键配置时的空状态 | ❌ 纯展示             |

**Mock 策略**：

- `getAllShortcuts` → mock 返回预设快捷键列表
- 无 IPC 依赖，mock 成本低

**预估行数**：~120 行

---

## Phase 2: 巨石 Story 拆分

> 目标：所有 Story 文件 ≤ 500 行（AC-2）
> 原则：「大块拆小块，语义为界」——按组件功能域拆分，非机械切割

### P0 拆分（> 800 行，必须完成）

#### T2.1 `AiPanel.stories.tsx`（1265 行 → 3 文件）

| 原 Story                                                                                                                   | 拆分去向                        | 语义         |
| -------------------------------------------------------------------------------------------------------------------------- | ------------------------------- | ------------ |
| Default、ConversationStatic、StreamingStatic、EmptyConversation、EmptyState、GeneratingState、ErrorState、LongConversation | `AiPanelChat.stories.tsx`       | 对话流与状态 |
| NarrowWidth、WideWidth、MediumHeight                                                                                       | `AiPanelResponsive.stories.tsx` | 响应式布局   |
| HistoryDropdownStatic、SendButtonStates                                                                                    | `AiPanelControls.stories.tsx`   | 控件与操作   |

- 共享 mock 数据提取到 `__stories__/aiPanelFixtures.ts`
- 预估每文件 ~400 行

#### T2.2 `Card.stories.tsx`（1062 行 → 3 文件）

| 原 Story                                                                                                  | 拆分去向                             | 语义       |
| --------------------------------------------------------------------------------------------------------- | ------------------------------------ | ---------- |
| Default、Raised、Bordered、Hoverable、HoverableRaised、NoPadding、AllVariants、AllHoverable、EmptyContent | `Card.stories.tsx`（保留，变体展示） | 基础变体   |
| WithSlots、LongContent、LongContentConstrained、NestedCards、WithEmoji                                    | `CardComposition.stories.tsx`        | 组合用法   |
| VariantMatrix、FullMatrix、ProjectCardScenario、SettingsCardScenario、Bento                               | `CardScenarios.stories.tsx`          | 场景与矩阵 |

- 预估每文件 ~350 行

#### T2.3 `QualityGatesPanel.stories.tsx`（989 行 → 2 文件）

| 原 Story                                                                                 | 拆分去向                           | 语义     |
| ---------------------------------------------------------------------------------------- | ---------------------------------- | -------- |
| DefaultWithIssues、AllPassed、CheckRunning、ErrorLevelIssues、AllIgnored、MultipleIssues | `QualityGatesOverview.stories.tsx` | 概览状态 |
| ExpandedIssueDetail、FixIssueAction、IgnoreIssueAction、SettingsExpanded、RunAllChecks   | `QualityGatesActions.stories.tsx`  | 操作交互 |

- 预估每文件 ~500 行

#### T2.4 `CharacterPanel.stories.tsx`（910 行 → 2 文件）

| 原 Story                                                                                                                                                        | 拆分去向                                       | 语义       |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | ---------- |
| DefaultWithData、EmptyProject、EditingCharacterForm、AddingPersonalityTrait、UploadingAvatar、DeletingCharacterConfirm、AvatarHoverState                        | `CharacterPanel.stories.tsx`（保留，核心状态） | 角色管理   |
| ManagingRelationships、SwitchingBetweenCharacters、ChapterAppearanceNavigation、RoleSelectorOpen、GroupSelectorOpen、AddingRelationshipFlow、DeleteConfirmation | `CharacterRelationships.stories.tsx`           | 关系与导航 |

- 预估每文件 ~450 行

#### T2.5 `Resizer.stories.tsx`（841 行 → 2 文件）

| 原 Story                                                        | 拆分去向                                | 语义     |
| --------------------------------------------------------------- | --------------------------------------- | -------- |
| Default、DualResizer、InteractionGuide                          | `Resizer.stories.tsx`（保留，基础展示） | 基础     |
| DragToMinWidth、DragToMaxWidth、DoubleClickReset、KeyboardFocus | `ResizerInteractions.stories.tsx`       | 交互测试 |

- 预估每文件 ~420 行

#### T2.6 `VersionHistoryPanel.stories.tsx`（823 行 → 2 文件）

| 原 Story                                                                                                               | 拆分去向                                        | 语义     |
| ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | -------- |
| DefaultWithHistory、SelectedVersionExpanded、HoverShowQuickActions、WordCountVariations、EmptyHistory、RichVersionInfo | `VersionHistoryPanel.stories.tsx`（保留，概览） | 历史浏览 |
| RestoreConfirmation、CompareWithCurrent、ScrollAndSticky、AutoSaveDisabled、PreviewVersion                             | `VersionHistoryActions.stories.tsx`             | 操作场景 |

- 预估每文件 ~410 行

#### T2.7 `AiDialogs.stories.tsx`（818 行 → 3 文件）

| 原 Story                                                                        | 拆分去向                      | 语义              |
| ------------------------------------------------------------------------------- | ----------------------------- | ----------------- |
| InlineConfirmDefault ~ InlineConfirmApplyingState                               | `AiInlineConfirm.stories.tsx` | Inline 确认流     |
| DiffModalWithHighlight ~ DiffModalApplyingChanges                               | `AiDiffModal.stories.tsx`     | Diff 弹窗         |
| ErrorRetryLoading ~ AllErrorStates + SystemDeleteWithLoading ~ AllSystemDialogs | `AiDialogStates.stories.tsx`  | 错误 & 系统对话框 |

- 注意：原文件前 614 行为 mock 数据和 render function——需提取到 `__fixtures__/aiDialogFixtures.ts`
- 预估每文件 ~200 行（含 fixtures 提取后）

#### T2.8 `FileTreePanel.stories.tsx`（817 行 → 2 文件）

| 原 Story                                                                          | 拆分去向                                      | 语义       |
| --------------------------------------------------------------------------------- | --------------------------------------------- | ---------- |
| Default、Empty、Loading、ManyFiles、LongFileNames、WithSelection、NestedHierarchy | `FileTreePanel.stories.tsx`（保留，基础状态） | 文件树展示 |
| RenameDemo、DragDropState、ContextMenuState、KeyboardNavigation                   | `FileTreeInteractions.stories.tsx`            | 交互操作   |

- 预估每文件 ~410 行

#### T2.9 `CommandPalette.stories.tsx`（806 行 → 2 文件）

| 原 Story                                                              | 拆分去向                                   | 语义     |
| --------------------------------------------------------------------- | ------------------------------------------ | -------- |
| Default、Searching、EmptyResults、Closed、Interactive、MultipleGroups | `CommandPalette.stories.tsx`（保留，基础） | 基础状态 |
| KeyboardNavigationDemo、SearchHighlight、LongCommandList              | `CommandPaletteAdvanced.stories.tsx`       | 高级交互 |

- 预估每文件 ~400 行

### P1 拆分（500–800 行，视进度纳入）

> 以下 12 个文件超过 500 行但未超 800 行。拆分优先级低于 P0，但若 AC-2 严格执行则需完成。

| 文件                         | 行数 | 建议拆分策略               |
| ---------------------------- | ---- | -------------------------- |
| `KnowledgeGraph.stories.tsx` | 763  | 基础图 + 节点操作 + 对话框 |
| `Select.stories.tsx`         | 670  | 基础变体 + 交互场景        |
| `SearchPanel.stories.tsx`    | 650  | 搜索状态 + 交互操作        |
| `Button.stories.tsx`         | 649  | 基础变体 + 交互/辅助       |
| `Input.stories.tsx`          | 647  | 基础变体 + 验证/交互       |
| `Textarea.stories.tsx`       | 612  | 基础 + 高级特性            |
| `ListItem.stories.tsx`       | 612  | 基础变体 + 组合场景        |
| `Tabs.stories.tsx`           | 611  | 基础变体 + 交互            |
| `OutlinePanel.stories.tsx`   | 586  | 大纲展示 + 操作            |
| `Text.stories.tsx`           | 538  | 基础 + 排版场景            |
| `Popover.stories.tsx`        | 528  | 基础 + 交互                |
| `DiffView.stories.tsx`       | 527  | 基础 + 对比场景            |

---

## Phase 3: Play Function 强化

> 目标：play function ≥ 290 个（AC-3）
> 当前：256 个 play function / 706 个 Story export = 36.3% 覆盖

### T3.1 Phase 1 新增 Story 的 Play Function（~8 个）

| 文件                         | Play Function        | 验证行为           |
| ---------------------------- | -------------------- | ------------------ |
| `RightPanel.stories.tsx`     | `InfoPanelDefault`   | 统计项渲染完整性   |
|                              | `QualityPanelReady`  | 展开/收起交互      |
|                              | `QualityPanelError`  | 重试按钮点击       |
|                              | `QualityConstraints` | 约束列表项交互     |
| `SettingsPages.stories.tsx`  | `AiSettingsDefault`  | provider mode 切换 |
|                              | `AppearanceDefault`  | 主题切换           |
|                              | `JudgeSectionError`  | ensure 按钮点击    |
| `ShortcutsPanel.stories.tsx` | `Default`            | 快捷键列表渲染验证 |

### T3.2 现有无 Play Function 的关键 Story 补充（~26 个）

以下文件有 Story 但完全没有 play function，按交互价值排序：

| 文件                               | 当前 Play | 需新增场景                   | 新增数 |
| ---------------------------------- | --------- | ---------------------------- | ------ |
| `DashboardPage.stories.tsx`        | 0         | 点击卡片、分类切换、搜索过滤 | 3      |
| `ExportDialog.stories.tsx`         | 0         | 格式选择、预览更新、导出按钮 | 3      |
| `SettingsDialog.stories.tsx`       | 0         | Tab 切换、表单交互           | 2      |
| `EditorPane.stories.tsx`           | 0         | 编辑器聚焦、工具栏交互       | 2      |
| `EditorToolbar.stories.tsx`        | 0         | 按钮点击、下拉菜单           | 2      |
| `DiffView.stories.tsx`             | 0         | 差异高亮交互                 | 2      |
| `MemoryPanel.stories.tsx`          | 0         | 记忆卡片交互、搜索           | 2      |
| `MemorySettingsDialog.stories.tsx` | 0         | 设置切换                     | 1      |
| `ZenMode.stories.tsx`              | 0         | 进入/退出禅模式              | 2      |
| `AnalyticsPage.stories.tsx`        | 0         | 图表悬停、时间范围切换       | 2      |
| `KgViews.stories.tsx`              | 0         | 视图切换                     | 1      |
| `WriteButton.stories.tsx`          | 0         | AI 写作按钮交互              | 1      |
| `SkillPicker.stories.tsx`          | 0         | 技能选择                     | 1      |
| `OnboardingPage.stories.tsx`       | 0         | 步骤导航                     | 2      |

**合计新增**：~34 个 play function（Phase 1 的 8 个 + Phase 3 的 26 个）

### T3.3 Play Function 编写规范

```tsx
play: async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  // 1. 查找元素（优先 getByRole > getByLabelText > getByTestId）
  const button = canvas.getByRole("button", { name: /submit/i });
  // 2. 执行交互
  await userEvent.click(button);
  // 3. 验证结果（验证行为，非实现）
  await expect(canvas.getByText(/success/i)).toBeInTheDocument();
},
```

---

## Phase 4: Props 文档与 Usage Guidelines

> 目标：≥ 9 个组件有 Storybook Docs page 含 usage guidelines（AC-4）

### T4.1 组件选择（按使用频率和复杂度排序）

| #   | 组件         | 所在文件                            | 选择理由                                                | 当前 Docs 状态                    |
| --- | ------------ | ----------------------------------- | ------------------------------------------------------- | --------------------------------- |
| 1   | Button       | `primitives/Button.stories.tsx`     | 最高频组件，5 种 variant 需要使用指南                   | 有 story 级 docs，缺 component 级 |
| 2   | Card         | `primitives/Card.stories.tsx`       | variant 多（Default/Raised/Bordered/Hoverable），易混淆 | 无 usage guidelines               |
| 3   | Input        | `primitives/Input.stories.tsx`      | 表单核心，有 validation 模式                            | 有部分 docs                       |
| 4   | Select       | `primitives/Select.stories.tsx`     | 下拉选择器，API 复杂                                    | 无 usage guidelines               |
| 5   | Tabs         | `primitives/Tabs.stories.tsx`       | 多模式导航核心                                          | 无 usage guidelines               |
| 6   | Badge        | `primitives/Badge.stories.tsx`      | variant 多，语义区分重要                                | 无 usage guidelines               |
| 7   | EmptyState   | `patterns/EmptyState.stories.tsx`   | 全应用通用模式                                          | 无 usage guidelines               |
| 8   | LoadingState | `patterns/LoadingState.stories.tsx` | 全应用通用模式                                          | 无 usage guidelines               |
| 9   | ErrorState   | `patterns/ErrorState.stories.tsx`   | 全应用通用模式                                          | 无 usage guidelines               |
| 10  | Dialog       | `primitives/Dialog.stories.tsx`     | 对话框使用模式需规范                                    | 无 usage guidelines               |

### T4.2 Usage Guidelines 内容模板

每个组件的 Docs page 应包含：

```markdown
## 使用指南

### 何时使用

- variant A：适用场景描述
- variant B：适用场景描述

### 不应使用

- 反模式 1 → 替代方案
- 反模式 2 → 替代方案

### Props 说明

- 关键 prop 1：用途、默认值、注意事项
- 关键 prop 2：用途、默认值、注意事项

### 与其他组件的关系

- 与 ComponentX 的区别：...
- 配合 ComponentY 使用时：...
```

### T4.3 实现方式

在 Story 文件的 `meta` 中添加 `parameters.docs.description.component`：

```tsx
const meta: Meta<typeof Button> = {
  title: "Primitives/Button",
  component: Button,
  parameters: {
    docs: {
      description: {
        component: `## 使用指南\n\n### 何时使用\n- **primary**: ...`,
      },
    },
  },
};
```

---

## Phase 5: 双主题 Story

> 目标：暗/浅双主题 decorator 配置完成（AC-6）

### T5.1 全局 ThemeDecorator 改造

**当前状态**：`.storybook/preview.tsx` 中 `ThemeDecorator` 硬编码 `data-theme="dark"`

**改造方案**：

```tsx
// .storybook/preview.tsx
export const globalTypes = {
  theme: {
    description: "Global theme for components",
    toolbar: {
      title: "Theme",
      icon: "circlehollow",
      items: [
        { value: "dark", title: "Dark", icon: "moon" },
        { value: "light", title: "Light", icon: "sun" },
      ],
      dynamicTitle: true,
    },
  },
};

function ThemeDecorator({
  children,
  globals,
}: {
  children: React.ReactNode;
  globals: Record<string, string>;
}) {
  const theme = globals["theme"] ?? "dark";
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    return () => document.documentElement.removeAttribute("data-theme");
  }, [theme]);
  return <div style={{ padding: "1rem" }}>{children}</div>;
}
```

**验证**：Storybook 工具栏出现主题切换按钮，切换后 CSS 变量生效。

### T5.2 关键 Story 双主题变体（可选）

> 审计建议：**不建议**为每个 Story 创建 `Light` 变体副本。
> 原因：全局 ThemeDecorator 已允许任意 Story 在两种主题下查看，创建变体副本会导致 Story 数量翻倍、维护成本激增。
> 替代策略：仅对主题敏感的 Showcase Story（如颜色色板、阴影展示）创建双主题并排对比 Story。

建议创建双主题对比 Story 的组件（≤ 5 个）：

| 组件       | Story 名称        | 理由                             |
| ---------- | ----------------- | -------------------------------- |
| Button     | `ThemeComparison` | variant 在两种主题下对比度差异大 |
| Card       | `ThemeComparison` | 阴影/边框在浅色主题下表现不同    |
| Input      | `ThemeComparison` | 聚焦 ring 在浅色主题下需验证     |
| Badge      | `ThemeComparison` | 颜色语义在两种主题下映射不同     |
| EmptyState | `ThemeComparison` | 插图/文字对比度需双主题验证      |

---

## R10 基线采集（2025-07-25）

### 核心指标

| 指标                 | R8 值 | R9 值 | R10 值    | Delta（R9→R10）                       |
| -------------------- | ----- | ----- | --------- | ------------------------------------- |
| Feature Story 文件数 | 26    | 26    | **26**    | ±0                                    |
| 有 Story 的功能目录  | 19/22 | 19/22 | **19/22** | ±0                                    |
| 无 Story 的功能目录  | 3     | 3     | **3**     | ±0（rightpanel, settings, shortcuts） |
| Play function 总数   | 256   | 256   | **256**   | ±0                                    |
| 最大 Story 文件行数  | 1265  | 1265  | **1265**  | ±0（AiPanel.stories.tsx）             |
| Story 文件 > 500 行  | 21    | 21    | **21**    | ±0                                    |

### 补充指标

| 指标                      | R10 值      | 说明                                                                                                                                           |
| ------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Story 文件总数            | 86          | 含 features（26）+ primitives（26）+ composites（10）+ patterns（7）+ layout（12）+ features-components（3）+ providers（1）+ **stories**（3） |
| Story export 总数         | 706         | 所有 Story 文件中 `export const` 计数                                                                                                          |
| Play function 覆盖率      | 36.3%       | 256 / 706                                                                                                                                      |
| 有 play function 的文件数 | 44 / 86     | 51.2% 的文件有至少一个 play function                                                                                                           |
| Primitives Story 文件数   | 26          | 全覆盖                                                                                                                                         |
| Storybook Docs 配置数     | 95          | 含 story 级 docs（非 component 级 usage guidelines）                                                                                           |
| 主题相关 Story 引用       | 14          | `data-theme` 或 `ThemeProvider` 出现次数                                                                                                       |
| ThemeDecorator 状态       | 硬编码 dark | `.storybook/preview.tsx` 中 `data-theme="dark"`                                                                                                |

### > 800 行巨石 Story 文件清单

| #   | 文件                                                       | 行数 | Story 数 |
| --- | ---------------------------------------------------------- | ---- | -------- |
| 1   | `features/ai/AiPanel.stories.tsx`                          | 1265 | 13       |
| 2   | `primitives/Card.stories.tsx`                              | 1062 | 20       |
| 3   | `features/quality-gates/QualityGatesPanel.stories.tsx`     | 989  | 11       |
| 4   | `features/character/CharacterPanel.stories.tsx`            | 910  | 15       |
| 5   | `layout/Resizer.stories.tsx`                               | 841  | 7        |
| 6   | `features/version-history/VersionHistoryPanel.stories.tsx` | 823  | 12       |
| 7   | `features/AiDialogs/AiDialogs.stories.tsx`                 | 818  | 18       |
| 8   | `features/files/FileTreePanel.stories.tsx`                 | 817  | 11       |
| 9   | `features/commandPalette/CommandPalette.stories.tsx`       | 806  | 9        |

### 采集命令

```bash
find apps/desktop/renderer/src/features -name "*.stories.tsx" | wc -l          # → 26
grep -r "play:" apps/desktop/renderer/src --include="*.stories.tsx" | wc -l     # → 256
find apps/desktop/renderer/src -name "*.stories.tsx" -exec wc -l {} + | sort -rn | head -20
find apps/desktop/renderer/src -name "*.stories.tsx" | wc -l                    # → 86
grep -r "^export const" apps/desktop/renderer/src --include="*.stories.tsx" | wc -l  # → 706
```

---

## 审计意见

### Phase 1（Story 全覆盖）：✅ 合理

- 3 个缺失目录组件结构清晰，mock 依赖明确
- `shortcuts/ShortcutsPanel` 是纯展示组件，Story 编写成本最低（~120 行），应最先完成
- `rightpanel/` 依赖 IPC 和 store，mock 设计是关键——建议参考 `QualityGatesPanel.stories.tsx` 现有 mock 模式
- `settings/` 的 3 个 Section 组件各自独立，可在一个 Story 文件中作为不同 Story 展示

### Phase 2（巨石 Story 拆分）：⚠️ 需调整预期

**P0 拆分（9 文件 > 800 行）**：合理且必要。

- AiPanel（1265 行）的拆分边界清晰：对话流 / 响应式 / 控件三域自然分离
- AiDialogs（818 行）前 614 行为 mock 数据和 render function。**建议优先提取 fixtures**，提取后单文件可能直接降到 500 行以下，减少不必要的 Story 拆分
- Card（1062 行，20 个 Story）拆分为 3 个文件是合理的——基础变体 / 组合用法 / 场景矩阵是自然语义边界

**P1 拆分（12 文件 500–800 行）**：⚠️ 过度工程化风险。

- Button（649 行）、Input（647 行）等 Primitives Story 包含大量变体矩阵和 play function，拆分后 Storybook 导航会碎片化
- **建议**：P1 层仅拆分 KnowledgeGraph（763 行）和 SearchPanel（650 行）这类 Feature 层 Story；Primitives 层 500–700 行可接受，暂不拆分
- 「AC-2: 单个 Story 文件 ≤ 500 行」对 Primitives 层过于严格——建议调整为「Feature 层 ≤ 500 行，Primitives 层 ≤ 700 行」

### Phase 3（Play Function 强化）：✅ 合理但需澄清指标

- 新增 ~34 个 play function 是合理工作量
- **但 proposal 中 "≥ 90% 覆盖率"（需 ~635 个）与 "≥ 290 个"（41% 覆盖率）目标矛盾**——建议以 AC-3（≥ 290 个）为准，删除 90% 描述
- 14 个无 play function 的 Feature Story 文件中，`DashboardPage`、`ExportDialog`、`SettingsDialog` 是最高价值的补充目标（核心用户路径）
- 纯展示型 Story（颜色色板、间距示例等）无需交互测试——Non-Goals 已明确

### Phase 4（Props 文档）：✅ 合理

- 选择的 10 个组件（Button、Card、Input、Select、Tabs、Badge、EmptyState、LoadingState、ErrorState、Dialog）覆盖了最高频和最易混淆的组件
- 当前 95 个 docs 配置多为 story 级描述（"使用 Tab 键聚焦..."），缺乏 component 级 usage guidelines
- **建议追加** `Text`/`Heading` 的 usage guidelines——这两个组件的 `size`/`level` prop 使用容易混淆

### Phase 5（双主题 Story）：✅ 合理（调整后）

- 全局 ThemeDecorator 改造（T5.1）是正确做法——一次改造，所有 Story 受益
- **创建 Light 变体副本（原 proposal 方案）会导致 Story 数量翻倍**，维护成本高
- 调整为：仅对 ≤ 5 个主题敏感组件创建 `ThemeComparison` 并排对比 Story，其余通过全局切换器验证

### 优先级排序建议

```
T5.1 (全局 ThemeDecorator) → Phase 1 (补缺口) → Phase 2 P0 (巨石拆分) → Phase 3 (Play Function)
→ Phase 4 (Props 文档) → Phase 2 P1 (可选拆分) → T5.2 (可选主题对比)
```

理由：ThemeDecorator 改造是全局基础设施，应最先完成；Phase 1 工作量最小且直接满足 AC-1；Phase 2 P0 是核心工作量所在。

### 遗漏项

1. **Storybook 构建性能**：86 个 Story 文件、706 个 Story export——构建时间是否需要优化？当前未提及
2. **Story 命名一致性**：现有 Story 命名风格不统一（有的用 `Default`、有的用 `DefaultWithData`），拆分时应统一命名约定
3. **Accessibility Story**：当前无专门的 a11y 验证 Story——虽不在 v1-20 scope 内，但值得作为后续改进项记录
