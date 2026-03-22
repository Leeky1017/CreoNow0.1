# V1-20 Storybook 卓越化与组件文档

- **GitHub Issue**: 待创建
- **所属任务簇**: V1（视觉重塑）— Wave 7 质量纵深
- **umbrella**: v1-00-visual-overhaul-program
- **涉及模块**: 全 Features 层 Story、Primitives 层 Story
- **前端验收**: 需要（Storybook 构建通过 + play function 覆盖率 + 视觉回归）

---

## Why：为什么必须做

### 1. 用户现象

Storybook 作为 CreoNow 的组件图书馆和视觉验收基准，当前覆盖率呈"中央丰满、边缘空白"态势：

- Features 层 26 个 Story 文件覆盖了 19 个功能目录中的 19 个（覆盖率看似不错）
- 但 3 个功能目录完全无 Story：`rightpanel`、`settings`（非 dialog 的 settings）、`shortcuts`
- 256 个 play function 已存在（质量优秀），但集中在少数几个 Story 文件中
- 最大的 Story 文件 `AiPanel.stories.tsx`（1,265 行）承载了过多场景，需要拆分
- Props 文档化依赖 Storybook ArgTypes 自动推断，但缺少手动编写的 usage guidelines
- 主题切换（暗/浅）在 Story 中的覆盖不系统——部分 Story 只在暗色主题下验证

### 2. 根因

- v1-01 至 v1-16 聚焦视觉对齐时，为每个 change 编写了对应 Story，但未做全局覆盖率审计
- Story 拆分策略未明确——`AiPanel.stories.tsx` 涵盖了 AI 面板的所有子状态，行数膨胀
- 浅色主题 Story 不被强制要求——CI 只检查 Storybook 是否构建成功，不检查主题覆盖
- Usage guidelines 在 Storybook Docs page 中缺失——开发者只能看到 Story 示例，无法了解"何时用、如何用、不应如何用"

### 3. 威胁

- **新成员上手困难**：没有 usage guidelines 的组件库是"展示柜"而非"说明书"——新开发者看得到组件长什么样，但不知道什么场景该用哪个变体
- **视觉验收断层**：3 个无 Story 的功能目录意味着这些区域的视觉变更无法通过 Storybook 验证
- **巨石 Story 维护困难**：1,265 行的 `AiPanel.stories.tsx` 修改任意一个 Story 都有 side effect 风险
- **主题回归**：浅色主题作为 v1 的重要特性，如果 Story 不覆盖，主题切换时的视觉问题将在 Storybook 中不可见

### 4. 证据来源

| 数据点               | 值                                        | 来源                                              |
| -------------------- | ----------------------------------------- | ------------------------------------------------- |
| Feature Story 文件数 | 26                                        | `find features -name "*.stories.tsx" \| wc -l`    |
| 有 Story 的功能目录  | 19 / 22（不含 `__tests__`）               | 逐目录检查                                        |
| 无 Story 的功能目录  | `rightpanel`、`settings`、`shortcuts`     | 排除法                                            |
| Play function 总数   | 256                                       | `grep -r "play:" --include="*.stories.tsx" \| wc` |
| 最大 Story 文件      | `AiPanel.stories.tsx`（1,265 行）         | `wc -l`                                           |
| 次大 Story 文件      | `QualityGatesPanel.stories.tsx`（989 行） | `wc -l`                                           |
| Storybook Docs page  | 未配置自定义 docs                         | 检查 Story 文件                                   |

---

## What：做什么

### Phase 1：Story 全覆盖（补缺口）

为 3 个缺失目录编写 Story：

1. **`rightpanel/`** → `RightPanel.stories.tsx`
   - InfoPanel 各 tab 状态
   - QualityPanelSections 各检查结果
   - 空状态 / 加载状态

2. **`settings/`** → `SettingsPages.stories.tsx`
   - Settings 各子页面渲染
   - 与 `settings-dialog/` 的整合展示

3. **`shortcuts/`** → `ShortcutsPanel.stories.tsx`
   - 快捷键列表渲染
   - 分类显示
   - 搜索过滤

### Phase 2：巨石 Story 拆分

| 原 Story                          | 行数  | 拆分为                                                                   |
| --------------------------------- | ----- | ------------------------------------------------------------------------ |
| `AiPanel.stories.tsx`             | 1,265 | `AiChat.stories.tsx` + `AiSkills.stories.tsx` + `AiOverlay.stories.tsx`  |
| `QualityGatesPanel.stories.tsx`   | 989   | `QualityOverview.stories.tsx` + `QualityRules.stories.tsx`               |
| `CharacterPanel.stories.tsx`      | 910   | `CharacterList.stories.tsx` + `CharacterDetail.stories.tsx`              |
| `VersionHistoryPanel.stories.tsx` | 823   | `VersionList.stories.tsx` + `VersionBranching.stories.tsx`               |
| `FileTreePanel.stories.tsx`       | 817   | `FileTreeNavigation.stories.tsx` + `FileTreeOperations.stories.tsx`      |
| `CommandPalette.stories.tsx`      | 806   | `CommandPaletteBasic.stories.tsx` + `CommandPaletteAdvanced.stories.tsx` |

拆分后每个文件 ≤ 500 行。

### Phase 3：Play Function 强化

为关键交互路径补充 play function：

- **Dashboard**：点击卡片 → 打开项目、切换分类 → 过滤卡片
- **FileTree**：右键菜单 → 新建/重命名/删除
- **Settings**：切换主题 → 验证 token 变化
- **Export**：选择格式 → 预览更新
- 目标：play function 覆盖率 ≥ 90%（当前已有 256 个，估计需新增 30-40 个）

### Phase 4：Props 文档与 Usage Guidelines

在关键 Primitives 和 Pattern 组件中添加 Storybook Docs page：

```tsx
// Button.stories.tsx
export default {
  title: "Primitives/Button",
  component: Button,
  parameters: {
    docs: {
      description: {
        component: `
## 使用指南

### 何时使用
- **primary**: 页面主操作（每页最多 1 个）
- **secondary**: 次级操作
- **ghost**: 工具栏、inline 操作
- **pill**: 设置页选项、标签
- **danger**: 删除、不可逆操作

### 不应使用
- 导航链接 → 用 \`<a>\` 或 Router Link
- 纯 icon → 用 \`size="icon"\`
        `,
      },
    },
  },
};
```

覆盖范围：Button、Card、Tabs、Badge、Input、Select、EmptyState、LoadingState、ErrorState（≥ 9 个组件）。

### Phase 5：双主题 Story

为每个 Story 添加 `parameters.backgrounds` 或 Storybook globals 切换，确保暗/浅两个主题的渲染在 Storybook 中可见：

- 使用 Storybook 的 `globalTypes` 添加主题切换 decorator
- 关键 Story 添加 `Light` variant（如 `ButtonLight`、`CardLight`）用于视觉对比

---

## Non-Goals：不做什么

1. **不做 Chromatic 等 SaaS 视觉比对**——视觉回归由 v1-17 的 Playwright 本地方案覆盖
2. **不做组件 API 变更**——仅添加 Story 和文档，不修改组件实现
3. **不做设计规范文档**——Usage guidelines 聚焦"代码使用指南"，设计语言规范在 `DESIGN_DECISIONS.md`
4. **不做全组件 Props 交互面板**——Storybook Controls 自动生成，仅对关键 props 添加手动描述
5. **不强制每个 Story 都有 play function**——纯展示型 Story（如颜色色板、间距示例）无需交互测试

---

## AC：验收标准

| #   | 验收条件                                                | 验证方式                                       |
| --- | ------------------------------------------------------- | ---------------------------------------------- |
| 1   | 所有 22 个功能目录（不含 `__tests__`）有对应 Story 文件 | `find features -name "*.stories.tsx"` 逐目录   |
| 2   | 单个 Story 文件 ≤ 500 行                                | `wc -l` 检查                                   |
| 3   | Play function ≥ 290 个（当前 256 + 新增 ≥ 34）          | `grep "play:" --include="*.stories.tsx" \| wc` |
| 4   | ≥ 9 个组件有 Storybook Docs page 含 usage guidelines    | 人工检查                                       |
| 5   | Storybook 构建通过                                      | `pnpm -C apps/desktop storybook:build`         |
| 6   | 暗/浅双主题 decorator 已配置                            | Storybook 全局配置检查                         |
| 7   | 拆分后的 Story 文件在 Storybook 导航中归类正确          | 手动验证                                       |

---

## 依赖与影响

- **上游依赖**: v1-16（全模块视觉覆盖完成）—— 所有组件已实现后才能编写完整 Story；v1-17（视觉回归 CI）—— 视觉回归基础设施用于验证 Story 拆分不引入视觉变化
- **被依赖于**: 无直接下游；但 Story 全覆盖 + play function 强化为后续开发提供持续的视觉验收基准
- **并行安全**: Story 文件修改与生产代码修改不冲突；但巨石 Story 拆分需确保在无其他 change 修改同一 Story 时进行
- **风险**: Story 拆分可能遗漏某些 Story variant（需逐 Story 验证）；play function 依赖 DOM 结构，组件重构后可能失效
- **预估工作量**: 约 v1-05 的 **0.6 倍**——无业务逻辑，但 Story 拆分和 play function 编写需要仔细的视觉验证。Phase 1 补缺 约 1d，Phase 2 拆分约 2d，Phase 3 play function 约 1d，Phase 4 文档约 1d，Phase 5 双主题约 0.5d

---

## R8 级联刷新记录（2026-03-22）

### 刷新触发

R8 P6 复核 v1-14/v1-15。两者已于 2026-03-21 合并（PR #1198），R8 结论均为 PASS。本次为 v1-20 首次级联刷新。

### 上游复核结论

| 上游               | R8 结论 | 关键数据                                                                     |
| ------------------ | ------- | ---------------------------------------------------------------------------- |
| v1-14 对话框入口页 | ✅ PASS | 14 文件 2853 行，涉及 features/export, projects, onboarding, settings-dialog |
| v1-15 AI Overlay   | ✅ PASS | 11 文件 2265 行，涉及 components/features/AiDialogs                          |

### 影响评估

#### Story 覆盖变化

v1-14 scope 4 个功能目录均已有 Story 文件（共 6 个），v1-15 scope 有 1 个 Story 文件（AiDialogs.stories.tsx）。**缺口列表不变**——`rightpanel`、`settings`、`shortcuts` 仍无 Story，Phase 1 计划无需调整。

v1-14 scope Story 明细：

- `features/export/ExportDialog.stories.tsx`（375 行）
- `features/projects/CreateProjectDialog.stories.tsx`（240 行）
- `features/projects/ProjectSwitcher.stories.tsx`（113 行）
- `features/projects/CreateTemplateDialog.stories.tsx`（151 行）
- `features/onboarding/OnboardingPage.stories.tsx`（73 行）
- `features/settings-dialog/SettingsDialog.stories.tsx`（133 行）

v1-15 scope Story 明细：

- `components/features/AiDialogs/AiDialogs.stories.tsx`（818 行）

#### 巨石 Story 状态

`AiPanel.stories.tsx` 当前仍为 **1265 行**，Phase 2 拆分计划不变。

**新增巨石候选**：`AiDialogs.stories.tsx`（818 行）超过 AC 规定的 500 行上限。此文件由 v1-15 引入，覆盖 AiDiffModal、AiErrorCard、SystemDialog、AiInlineConfirm 等组件。Phase 2 拆分表应新增此文件为拆分候选（建议拆为 `AiDiffModal.stories.tsx` + `AiErrorCard.stories.tsx` + `SystemDialog.stories.tsx`）。

此外，`Card.stories.tsx`（1062 行）在 Top 10 中位列第二，proposal 原拆分表未包含，Phase 2 也应考虑。

#### 新增组件的 Story 需求

v1-14 引入的子组件（无独立 Story）：

- `ExportFormatTab.tsx`、`ExportPreview.tsx`（export 子组件，由 ExportDialog.stories 覆盖）
- `OnboardingSteps.tsx`（onboarding 子组件，由 OnboardingPage.stories 覆盖）
- `AiAssistSection.tsx`、`ProjectFormContent.tsx`、`DeleteProjectDialog.tsx`、`TemplateMetadataForm.tsx`（projects 子组件）
- `SettingsAccount.tsx`、`SettingsAppearancePage.tsx`、`SettingsExport.tsx`、`SettingsGeneralSections.tsx`、`SettingsNavigation.tsx`（settings-dialog 子组件）

v1-15 引入的子组件（无独立 Story）：

- `AiDiffContent.tsx`、`AiDiffSummary.tsx`（AiDiffModal 子组件）
- `AiErrorActions.tsx`、`AiErrorDetails.tsx`（AiErrorCard 子组件）
- `AiInlinePreview.tsx`（AiInlineConfirm 子组件）
- `SystemDialogContent.tsx`（SystemDialog 子组件）

评估：这些子组件由父级 Story 间接覆盖，当前无需独立 Story。Phase 4（Props 文档与 Usage Guidelines）可在父级 Story 的 Docs page 中统一描述子组件用法。

### 基线重采集

| 指标                 | proposal 原值 | R8 实测 | Delta | 说明                            |
| -------------------- | ------------- | ------- | ----- | ------------------------------- |
| Feature Story 文件数 | 26            | 26      | ±0    | 无变化                          |
| 有 Story 的功能目录  | 19/22         | 19/22   | ±0    | 无变化                          |
| 无 Story 的功能目录  | 3             | 3       | ±0    | rightpanel, settings, shortcuts |
| Play function 总数   | 256           | 256     | ±0    | 无变化                          |
| 最大 Story 文件行数  | 1265          | 1265    | ±0    | AiPanel.stories.tsx 不变        |

### Scope 影响

- **Phase 1（补缺口）**：无需调整。3 个无 Story 目录不变。
- **Phase 2（巨石拆分）**：需新增 `AiDialogs.stories.tsx`（818 行）和 `Card.stories.tsx`（1062 行）为拆分候选。拆分表建议追加两行。
- **Phase 3（Play Function 强化）**：无需调整。v1-14/v1-15 Story 已有 play function，总数不变。
- **Phase 4（Props 文档）**：v1-14/v1-15 新增约 22 个子组件，可在父级 Story Docs 中补充 usage guidelines，但不增加独立 Story 文件数。
- **Phase 5（双主题）**：无需调整。

### 结论

**PASS** — proposal 基线五项指标与 R8 实测完全一致（Delta 均为 ±0），v1-14/v1-15 未改变缺口列表和 Play function 总量。唯一需注意：Phase 2 拆分表应追加 `AiDialogs.stories.tsx`（818 行）和 `Card.stories.tsx`（1062 行）为拆分候选。此为增量优化建议，不阻塞 v1-20 启动。
