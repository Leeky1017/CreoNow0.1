# Tasks: V1-07 Settings 视觉精修

- **GitHub Issue**: 待创建
- **分支**: `task/<N>-settings-visual-polish`
- **Delta Spec**: `openspec/changes/v1-07-settings-visual-polish/specs/`

---

## 验收标准

| ID    | 标准                                                                           | 对应 Scenario |
| ----- | ------------------------------------------------------------------------------ | ------------- |
| AC-1  | SettingsAppearancePage.tsx 中 0 处硬编码 hex 颜色值直接出现在生产渲染逻辑中    | 全局          |
| AC-2  | 色板选项通过命名常量 + Design Token 映射定义，不直接写 hex 字面量              | 全局          |
| AC-3  | ThemePreview 组件中 0 处硬编码颜色值，全部替换为 `--color-*` token 引用        | 全局          |
| AC-4  | Section headers 使用 uppercase 10px 0.1em letter-spacing + 底部 1px 分割线样式 | 视觉          |
| AC-5  | Theme 选中态为 filled 样式（背景色 + box-shadow），非 outline                  | 视觉          |
| AC-6  | Font size 滑块下方有 12px–24px 刻度标记                                        | 视觉          |
| AC-7  | 色板选环 hover 时有 scale(1.15) + glow shadow 动画效果                         | 视觉          |
| AC-8  | Nav active 项有 glow 背景或指示器，对齐 `10-settings.html` 设计稿              | 视觉          |
| AC-9  | Toggle 组件切换有 ≥ 0.15s smooth 过渡动画                                      | 视觉          |
| AC-10 | 所有新增样式使用语义化 Design Token，0 处新增 Tailwind arbitrary 色值 / 字号   | 全局          |
| AC-11 | 现有测试 100% 通过，0 个新增失败                                               | 全局          |
| AC-12 | Storybook 可构建（`pnpm -C apps/desktop storybook:build`）                     | 全局          |
| AC-13 | TypeScript 类型检查通过（`pnpm typecheck`）                                    | 全局          |
| AC-14 | lint 无新增违规（`pnpm lint`）                                                 | 全局          |
| AC-15 | `SettingsDialog.tsx` 从 ~486 行拆分至主文件 ≤ 300 行，子组件各 ≤ 300 行        | 架构          |

---

## 硬编码颜色值清单与 Token 映射

> 以下为 `SettingsAppearancePage.tsx` 中全部硬编码颜色值及其目标 Token 映射。

### 色板选项（`getAccentColors()` L77–82）

| 行号 | 当前硬编码值 | 用途           | 目标 Token / 方案                                                         |
| ---- | ------------ | -------------- | ------------------------------------------------------------------------- |
| L77  | `#ffffff`    | 白色强调色选项 | `--accent-white` 命名常量（色板选项属于功能性枚举，需定义为语义常量集合） |
| L78  | `#3b82f6`    | 蓝色强调色选项 | `--accent-blue` 命名常量                                                  |
| L79  | `#22c55e`    | 绿色强调色选项 | `--accent-green` 命名常量                                                 |
| L80  | `#f97316`    | 橙色强调色选项 | `--accent-orange` 命名常量                                                |
| L81  | `#8b5cf6`    | 紫色强调色选项 | `--accent-purple` 命名常量                                                |
| L82  | `#ec4899`    | 粉色强调色选项 | `--accent-pink` 命名常量                                                  |

**方案说明**：色板选项是用户功能选择（持久化到 preference store），不适合直接替换为可变 token。正确做法是将 6 组颜色值提取为 `ACCENT_PALETTE` 命名常量对象（位于 `packages/shared/` 或 `renderer/src/constants/`），并在 `01-tokens.css` 中注册对应 `--accent-*` token。这样品牌色调整时只需修改一处。

### ThemePreview 组件（L92–94）

| 行号 | 当前硬编码值 | 用途              | 目标 Token                                |
| ---- | ------------ | ----------------- | ----------------------------------------- |
| L92  | `#0f0f0f`    | 暗色主题预览背景  | `--color-bg-base`（dark theme value）     |
| L92  | `#ffffff`    | 亮色主题预览背景  | `--color-bg-base`（light theme value）    |
| L93  | `#ffffff`    | 暗色主题预览前景  | `--color-fg-default`（dark theme value）  |
| L93  | `#1a1a1a`    | 亮色主题预览前景  | `--color-fg-default`（light theme value） |
| L94  | `#666666`    | 暗色主题 muted 色 | `--color-fg-muted`（dark theme value）    |
| L94  | `#888888`    | 亮色主题 muted 色 | `--color-fg-muted`（light theme value）   |

**方案说明**：ThemePreview 的用途是预览不同主题的效果。正确做法是通过 CSS class（如 `[data-theme="dark"]`）切换 token 值，让预览区域自动继承目标主题的 token 值，而非硬编码。

### 默认值（L263）

| 行号 | 当前硬编码值 | 用途               | 目标 Token                             |
| ---- | ------------ | ------------------ | -------------------------------------- |
| L263 | `#ffffff`    | accentColor 默认值 | `ACCENT_PALETTE.white`（引用命名常量） |

---

## Phase 0: 准备

- [ ] 阅读 `AGENTS.md`
- [ ] 阅读 `design/DESIGN_DECISIONS.md` §6（组件规范）、§6.7（Tabs）、§6.10（Toggle）
- [ ] 阅读设计稿 `design/Variant/designs/10-settings.html` 全文——标注 section header 样式、theme 选中态、色板 hover、滑块刻度、nav active indicator
- [ ] 阅读设计稿 `design/Variant/designs/34-component-primitives.html`——标注 Toggle 动效规范
- [ ] 阅读 `apps/desktop/renderer/src/features/settings-dialog/SettingsAppearancePage.tsx` 全文（265 行）
- [ ] 阅读 `apps/desktop/renderer/src/features/settings-dialog/SettingsDialog.tsx` 全文（486 行）
- [ ] 确认现有测试文件：
  - `SettingsDialog.test.tsx`（280 行）
  - `SettingsDialog.persistence.test.tsx`（177 行）
  - `SettingsAccount.test.tsx`（56 行）
  - `SettingsGeneral.backup.test.tsx`（121 行）
  - `SettingsGeneral.language.test.tsx`（60 行）
- [ ] 运行现有测试基线：`pnpm -C apps/desktop vitest run settings`，记录通过 / 失败数量
- [ ] 确认 v1-01（Design Token 补完）已合并，typography scale token 和 animation token 可用
- [ ] 确认 v1-02（Primitive 进化）已合并，Toggle 增强、Tabs 底线指示器可用
- [ ] 阅读 `design/system/01-tokens.css`，确认 `--color-bg-base`、`--color-fg-default`、`--color-fg-muted` 在 dark / light 主题下的值

---

## Phase 1: Red（测试先行）

### Task 1.1: 硬编码颜色清零测试

**映射验收标准**: AC-1, AC-2, AC-3

- [ ] 测试：SettingsAppearancePage 源码中不直接包含 `#0f0f0f`、`#1a1a1a`、`#666666`、`#888888` 等 ThemePreview 硬编码值
- [ ] 测试：色板选项通过 `ACCENT_PALETTE` 常量引用（而非内联 hex 字面量）

**文件**: `apps/desktop/renderer/src/features/settings-dialog/__tests__/SettingsAppearanceTokens.test.ts`（新建）

### Task 1.2: Section Header 样式测试

**映射验收标准**: AC-4

- [ ] 测试：Settings 页面的 section header 元素有 `uppercase` 样式或对应 className
- [ ] 测试：section header 元素有 letter-spacing 样式（≥ 0.05em）

**文件**: `apps/desktop/renderer/src/features/settings-dialog/__tests__/SettingsSectionHeader.test.tsx`（新建）

### Task 1.3: Theme 选中态测试

**映射验收标准**: AC-5

- [ ] 测试：选中的 theme 按钮有 filled 样式（背景色非 transparent）
- [ ] 测试：选中的 theme 按钮有 box-shadow 样式

**文件**: `apps/desktop/renderer/src/features/settings-dialog/__tests__/ThemeSelector.test.tsx`（新建）

### Task 1.4: 色板 Hover 效果测试

**映射验收标准**: AC-7

- [ ] 测试：色板选环有 hover 相关 className（包含 `hover:scale` 或自定义 hover 样式）
- [ ] 测试：色板选环有 transition 相关 className

**文件**: `apps/desktop/renderer/src/features/settings-dialog/__tests__/AccentColorPicker.test.tsx`（新建）

### Task 1.5: Font Size 滑块刻度测试

**映射验收标准**: AC-6

- [ ] 测试：font size 滑块区域包含刻度标记元素（至少包含 "12" 和 "24" 文本）
- [ ] 测试：刻度标记元素使用 `--text-label-*` typography token 样式

**文件**: `apps/desktop/renderer/src/features/settings-dialog/__tests__/FontSizeSlider.test.tsx`（新建）

### Task 1.6: 行为等价回归测试

**映射验收标准**: AC-11

- [ ] 运行 `pnpm -C apps/desktop vitest run settings` 全部 Settings 测试，确认与 Phase 0 基线一致
- [ ] 确认 0 个新增失败

---

## Phase 2: Green（最小实现）

### Task 2.1: 色板选项 Token 化

**映射验收标准**: AC-1, AC-2

- [ ] 创建 `ACCENT_PALETTE` 命名常量：

```typescript
export const ACCENT_PALETTE = [
  { id: "white", value: "#ffffff", token: "--accent-white" },
  { id: "blue", value: "#3b82f6", token: "--accent-blue" },
  { id: "green", value: "#22c55e", token: "--accent-green" },
  { id: "orange", value: "#f97316", token: "--accent-orange" },
  { id: "purple", value: "#8b5cf6", token: "--accent-purple" },
  { id: "pink", value: "#ec4899", token: "--accent-pink" },
] as const;
```

- [ ] 在 `01-tokens.css` 中注册对应 `--accent-*` token（或在 `@theme` 块中声明）
- [ ] `getAccentColors()` 改为从 `ACCENT_PALETTE` 常量生成
- [ ] L263 `accentColor: "#ffffff"` 改为 `accentColor: ACCENT_PALETTE[0].value`

**文件**: 常量文件（新建）+ `SettingsAppearancePage.tsx`（修改）

### Task 2.2: ThemePreview Token 化

**映射验收标准**: AC-3

- [ ] 方案 A（推荐）：ThemePreview 改为通过 `data-theme` 属性切换主题 class，让预览区域自动继承目标主题的 token 值：

```tsx
<div data-theme={mode === "dark" ? "dark" : "light"} className="...">
  {/* 内部元素自动使用 --color-bg-base, --color-fg-default 等 */}
</div>
```

- [ ] 方案 B（备选）：如 `data-theme` 切换机制不可行，则将硬编码值替换为主题感知常量对象：

```typescript
const THEME_PREVIEW_TOKENS = {
  dark: {
    bg: "var(--color-bg-base)",
    fg: "var(--color-fg-default)",
    muted: "var(--color-fg-muted)",
  },
  light: {
    bg: "var(--color-bg-base)",
    fg: "var(--color-fg-default)",
    muted: "var(--color-fg-muted)",
  },
} as const;
```

- [ ] 移除 L92–94 的 `#0f0f0f`、`#ffffff`、`#1a1a1a`、`#666666`、`#888888` 硬编码

**文件**: `SettingsAppearancePage.tsx`（修改）

### Task 2.3: Section Headers 视觉升级

**映射验收标准**: AC-4

- [ ] 分节标题增加 CSS 样式：
  - `text-transform: uppercase`
  - `font-size: 10px`（或 `--text-label-sm` token）
  - `letter-spacing: 0.1em`
  - `color: var(--color-fg-muted)`
- [ ] 分节标题下方增加 1px 分割线：`border-bottom: 1px solid var(--color-border-default)`
- [ ] 分割线间距：`padding-bottom: var(--space-2)` + `margin-bottom: var(--space-4)`

**文件**: `SettingsDialog.tsx` 和 / 或 `SettingsAppearancePage.tsx`

### Task 2.4: Theme 选中态增强

**映射验收标准**: AC-5

- [ ] Theme 按钮选中态样式从 outline 改为 filled：
  - 背景色：`var(--color-bg-selected)`
  - 边框：`var(--color-accent)`
  - box-shadow：`var(--shadow-sm)`
  - 过渡动画：`--duration-fast`
- [ ] 未选中态保持当前 outline 风格（对比度足够）

**文件**: `SettingsAppearancePage.tsx`

### Task 2.5: Font Size 滑块刻度标记

**映射验收标准**: AC-6

- [ ] 在 font size 滑块下方增加刻度标记：
  - 标记值：12、14、16、18、20、22、24（或设计稿定义的子集）
  - 字号：`--text-label-sm`（10px）
  - 颜色：`var(--color-fg-muted)`
  - 布局：`justify-between` 等分对齐

**文件**: `SettingsAppearancePage.tsx`

### Task 2.6: 色板 Hover 效果

**映射验收标准**: AC-7

- [ ] 色板选环增加 hover 交互样式：
  - `transform: scale(1.15)`——hover 时放大
  - `box-shadow: 0 0 0 3px var(--color-accent-subtle)`——外发光
  - `transition: transform var(--duration-fast), box-shadow var(--duration-fast)`
  - `cursor: pointer`

**文件**: `SettingsAppearancePage.tsx`

### Task 2.7: Nav Active Indicator 精修

**映射验收标准**: AC-8

- [ ] Settings 左侧导航 active 项视觉增强：
  - 背景色：`var(--color-bg-selected)`
  - 圆角：`var(--radius-sm)`
  - 左侧边栏指示器（可选）：`border-left: 2px solid var(--color-accent)`
  - 过渡动画：`--duration-fast`

**文件**: `SettingsDialog.tsx`（导航部分）

### Task 2.8: Toggle 动效验证与补齐

**映射验收标准**: AC-9

- [ ] 检查 Toggle primitive 组件是否已有 0.2s 过渡动画
- [ ] 如已有 → 确认动效平滑，标记 AC-9 通过
- [ ] 如未有 → 在 Toggle primitive 中增加 `transition: background-color var(--duration-fast), transform var(--duration-fast)`
- [ ] 确保 knob 滑动有 `transform: translateX()` + 过渡

**文件**: Toggle primitive 组件（如 `components/primitives/Toggle.tsx` 或等效）

### Task 2.9: SettingsDialog.tsx 解耦拆分

**映射验收标准**: AC-15

- [ ] 提取 `SettingsNavigation.tsx`：左侧导航栏（分组 + 图标 + active 指示条），≤ 200 行
- [ ] 提取 `SettingsHeader.tsx`：顶部 header（标题 + 关闭按钮 + 搜索），≤ 100 行
- [ ] 精简 `SettingsDialog.tsx` 至 ≤ 300 行（仅保留 dialog 框架 + 路由切换 + 子组件编排）
- [ ] 确认提取后所有现有测试仍通过

**文件**: `apps/desktop/renderer/src/features/settings-dialog/SettingsDialog.tsx`（拆分）

---

## Phase 3: Verification & Delivery

- [ ] 运行 Phase 1 全部测试，确认全绿
- [ ] 运行 `pnpm -C apps/desktop vitest run settings` 全部 Settings 测试，确认与 Phase 0 基线 100% 一致
- [ ] 运行 `pnpm -C apps/desktop vitest run` 全量测试通过
- [ ] 运行 `pnpm typecheck` 类型检查通过
- [ ] 运行 `pnpm lint` lint 无新增违规
- [ ] 运行 `pnpm -C apps/desktop storybook:build` Storybook 可构建
- [ ] 确认 SettingsAppearancePage.tsx 中 `grep '#[0-9a-fA-F]'` 输出为 0 行（ThemePreview 和色板选项全部 Token 化）
- [ ] 视觉验收——逐项目视比对：
  - Section headers 有 uppercase + letter-spacing + 分割线
  - Theme 选中态为 filled 背景 + shadow
  - Font size 滑块下方有刻度标记
  - 色板 hover 有 scale + glow 动画
  - Nav active 项有 glow / indicator
  - Toggle 切换有 smooth 过渡
- [ ] 确认 0 处新增 Tailwind arbitrary 色值 / 字号
- [ ] 创建 PR（含 `Closes #N`），附视觉对比截图

---

## R2 级联刷新记录（2026-03-21）

### 刷新触发

R2 P1 复核 v1-03/04/05 → 级联刷新。v1-07 已实现并合并。

### AC 验证状态（R2 重采集）

| AC    | 状态 | R2 证据                                                          |
| ----- | ---- | ---------------------------------------------------------------- |
| AC-1  | ✅   | SettingsAppearancePage.tsx 中 0 处 hex 值                        |
| AC-2  | ✅   | accentPalette.ts 49 行，命名常量 + token 映射                    |
| AC-3  | ✅   | ThemePreview 无硬编码（grep 验证 0 处）                          |
| AC-4  | —    | 需 diff review 确认 section header 样式                          |
| AC-5  | —    | 需 diff review 确认 theme filled 选中态                          |
| AC-6  | —    | 需 diff review 确认 font-size 滑块刻度                           |
| AC-7  | —    | 需 diff review 确认色板 hover glow 效果                          |
| AC-8  | —    | 需 diff review 确认 nav active indicator                         |
| AC-9  | —    | 需 diff review 确认 toggle transition ≥0.15s                     |
| AC-10 | ✅   | R2 基线未新增 arbitrary 值                                       |
| AC-11 | ✅   | CI 守护                                                          |
| AC-12 | ✅   | CI 守护                                                          |
| AC-13 | ✅   | CI 守护                                                          |
| AC-14 | ✅   | CI 守护                                                          |
| AC-15 | ✅   | SettingsDialog.tsx 297 行（≤300），SettingsNavigation.tsx 103 行 |

### 结论

核心 AC（hex 清零 AC-1~3、拆分 AC-15、CI 门禁 AC-10~14）全部达成。视觉精度 AC（AC-4~9）需在后续审计中确认。

---

## R3 复核记录（2026-03-21）

### 复核方式

R3 P2 独立复核——在 `.worktrees/issue-1207-cascade-refresh-r1-r3` 中重新执行全部度量命令，与 R2 记录逐项比对。

### 度量重采集

| 度量                                 | R2 记录值 | R3 实际值             | 判定                              |
| ------------------------------------ | --------- | --------------------- | --------------------------------- |
| SettingsDialog.tsx 行数              | 297       | 297                   | ✅ R3 复核确认                    |
| SettingsAppearancePage.tsx 行数      | 249       | 249                   | ✅ R3 复核确认                    |
| SettingsNavigation.tsx 行数          | 103       | 103                   | ✅ R3 复核确认                    |
| accentPalette.ts 行数                | 49        | 49                    | ✅ R3 复核确认                    |
| SettingsHeader.tsx                   | —         | 不存在                | ℹ️ tasks 提及但未创建，非 AC 要求 |
| 硬编码 hex（SettingsAppearancePage） | 0         | 0                     | ✅ R3 复核确认                    |
| ACCENT_PALETTE 使用                  | ✅        | 3 处引用              | ✅ R3 复核确认                    |
| Settings-dialog 模块总行数（prod）   | 1,753     | 1,753                 | ✅ R3 复核确认                    |
| Settings 测试                        | 全通过    | 14 文件 91 测试全通过 | ✅ R3 复核确认                    |

### AC 验证状态（R3 重采集）

| AC    | R2 状态 | R3 状态 | R3 证据                                                                           |
| ----- | ------- | ------- | --------------------------------------------------------------------------------- |
| AC-1  | ✅      | ✅      | `grep -n '#[0-9a-fA-F]{3,8}' SettingsAppearancePage.tsx` → 0 行                   |
| AC-2  | ✅      | ✅      | accentPalette.ts 49 行，SettingsAppearancePage.tsx L5/L73/L76 引用 ACCENT_PALETTE |
| AC-3  | ✅      | ✅      | grep 验证 SettingsAppearancePage.tsx 0 处 hex 硬编码                              |
| AC-4  | —       | —       | 视觉精度项，需 diff review / 视觉验收                                             |
| AC-5  | —       | —       | 视觉精度项，需 diff review / 视觉验收                                             |
| AC-6  | —       | —       | 视觉精度项，需 diff review / 视觉验收                                             |
| AC-7  | —       | —       | 视觉精度项，需 diff review / 视觉验收                                             |
| AC-8  | —       | —       | 视觉精度项，需 diff review / 视觉验收                                             |
| AC-9  | —       | —       | 视觉精度项，需 diff review / 视觉验收                                             |
| AC-10 | ✅      | ✅      | R3 基线未发现新增 arbitrary 值                                                    |
| AC-11 | ✅      | ✅      | `vitest run Settings` → 14 文件 91 测试全通过                                     |
| AC-12 | ✅      | ✅      | CI 守护                                                                           |
| AC-13 | ✅      | ✅      | CI 守护                                                                           |
| AC-14 | ✅      | ✅      | CI 守护                                                                           |
| AC-15 | ✅      | ✅      | SettingsDialog.tsx 297 行（≤300 ✓），SettingsNavigation.tsx 103 行（≤300 ✓）      |

### 发现

1. **SettingsHeader.tsx 未创建**：tasks.md Phase 2 Task 2.9 提及提取 SettingsHeader.tsx（≤100 行），但实际未创建。不过 AC-15 仅要求 SettingsDialog.tsx ≤300 行 + 子组件各 ≤300 行，297 行已达标。SettingsHeader 提取属于 Non-Goals §7 中的"可选"拆分，不构成 AC 违规。
2. **视觉精度 AC-4~9 仍为未验证状态**：与 R2 一致，这些项需要 diff review 或运行时视觉验收，非度量命令可覆盖。

### 结论

**PASS** — R2 记录的全部可度量 AC（AC-1~3、AC-10~15）在 R3 独立复核中均确认达成，无回归。视觉精度 AC（AC-4~9）维持 R2 状态不变。
