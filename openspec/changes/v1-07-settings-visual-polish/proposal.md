# V1-07 Settings 视觉精修

- **GitHub Issue**: 待创建
- **所属任务簇**: V1（视觉重塑）— Wave 2 AI + 设置
- **umbrella**: v1-00-visual-overhaul-program
- **涉及模块**: settings-dialog
- **前端验收**: 需要（视觉对齐设计稿 + 硬编码颜色清零 + Storybook 构建通过）

---

## Why：为什么必须做

### 1. 用户现象

Settings 是用户个性化创作环境的入口——「工欲善其事，必先利其器」，而利器之始在于调校。CreoNow 的设置页面功能完备（主题切换、字号调整、色板选择、语言设置、导出配置），但视觉表达与 `10-settings.html` 设计稿之间存在可观测的精度差距：

- **Appearance 页 10 处硬编码颜色值**：`#ffffff`、`#3b82f6`、`#22c55e`、`#f97316`、`#8b5cf6`、`#ec4899` 作为色板选项直接硬编码在 `getAccentColors()` 函数中（6 处）；`#0f0f0f`、`#ffffff`、`#1a1a1a`、`#666666`、`#888888` 在 `ThemePreview` 组件中硬编码（5 处，含重复）；另有 1 处 `#ffffff` 出现在默认 `accentColor` 初始值中——共计 10 处独立硬编码行。虽然色板选项属于功能性颜色选择，但未走 Design Token 通道的做法与设计系统原则相悖，主题变更时维护成本陡增
- **Section headers 分节层次不够强**：设计稿定义 uppercase 10px 0.1em letter-spacing 分节标题 + 1px 分割线，当前分节视觉层次感不足——用户在长页面中难以快速定位目标设置项
- **Theme 按钮选中态不够强烈**：设计稿有 filled 按钮 + 视觉深度（box-shadow + 背景色填充），当前 outline 风格不够突出——用户不确定自己选了哪个主题
- **Font size 滑块缺 step markers**：设计稿有 12px–24px 刻度标记，当前只有裸滑块——用户不知道当前值在什么范围
- **色板选环 hover 效果缺失**：设计稿有 hover scale（1.15x）+ glow 动画（box-shadow 外发光），当前无 hover 反馈——色板不像可交互元素
- **Nav 切换 active indicator 不够精致**：设计稿有 active 项的 glow / background polish，当前只有基本高亮——"细节不入，则整体失色"
- **Toggle 组件动效**：设计稿定义 smooth 0.2s 过渡动画，需验证当前实现是否已达标

### 2. 根因

「基础扎实，精度未足。」

SettingsDialog 模块共 12 个文件、2,420 行总代码，结构清晰（Dialog 主体 486 行、Appearance 页 265 行、General 页 330 行、Account 页 261 行、Export 页 214 行）。问题不在巨石化，而在视觉精度：

- **色板选项的硬编码**是功能性需求（用户选择强调色），但实现方式直接在源码中写死 hex 值，未通过 token 映射——当品牌色调整或新增主题变体时，需要手动找到每一处值修改
- **ThemePreview 的硬编码**更为严重——`#0f0f0f`（暗色背景）、`#1a1a1a`（暗色前景）、`#666666` / `#888888`（muted 色）直接定义在组件内，完全绕过了 `01-tokens.css` 中已定义的对应 token
- **设计稿定义的微交互**（section header uppercase、theme 选中态填充、色板 hover glow、滑块 step markers）在开发过程中被跳过——"刀成而未磨"

### 3. 威胁

- **设计系统权威性**：Settings 页作为设计系统自身的配置入口，如果它自己都不走 token 通道，开发者会认为"token 不是强制的"——"令出于上而不行于己，焉能服人？"
- **主题扩展风险**：当新增浅色变体或高对比度主题时，ThemePreview 中的 5 处硬编码颜色将显示错误的预览
- **品牌维护成本**：10 处散落的 hex 值，任何品牌色调整都需要全文搜索修改
- **交互信心**：色板无 hover 反馈、theme 选中态模糊、滑块无刻度——用户在更改设置时缺少"操作已生效"的确定感

### 4. 证据来源

| 数据点 | 值 | 来源 |
| --- | --- | --- |
| SettingsDialog.tsx 行数 | 486 行 | `wc -l` |
| SettingsAppearancePage.tsx 行数 | 265 行 | `wc -l` |
| SettingsGeneral.tsx 行数 | 330 行 | `wc -l` |
| Settings 模块总行数 | 2,420 行 / 12 文件 | `wc -l` 统计 |
| 硬编码颜色值行数（SettingsAppearancePage） | 10 处独立硬编码行 | `grep '#[0-9a-fA-F]'` |
| 色板选项硬编码 | 6 处（`#ffffff`, `#3b82f6`, `#22c55e`, `#f97316`, `#8b5cf6`, `#ec4899`） | SettingsAppearancePage.tsx L77–82 |
| ThemePreview 硬编码 | 4 处独立值（`#0f0f0f`, `#1a1a1a`, `#666666`, `#888888`） + 1 处重复 `#ffffff` | SettingsAppearancePage.tsx L92–94 |
| 默认 accentColor 硬编码 | 1 处（`#ffffff`） | SettingsAppearancePage.tsx L263 |
| 设计稿参考 | `10-settings.html` | 设计稿目录 |
| 组件规范参考 | `34-component-primitives.html` | 设计稿目录 |
| DESIGN_DECISIONS.md | §6（组件规范）、§6.10（Toggle）、§6.7（Tabs） | 设计文档 |

---

## What：做什么

### 1. 色板选项 Token 化

将 `getAccentColors()` 中 6 处硬编码 hex 值迁移为命名常量 + Design Token 映射，使色板选项可随主题变体扩展。

### 2. ThemePreview Token 化

将 `ThemePreview` 组件中 5 处硬编码颜色替换为 Design Token 引用（`--color-bg-base`、`--color-fg-default`、`--color-fg-muted` 等），确保主题预览在任何主题下都能正确反映实际效果。

### 3. 默认 accentColor Token 化

将 `accentColor: "#ffffff"` 初始值替换为 token 引用或语义常量。

### 4. Section Headers 视觉升级

对齐 `10-settings.html`，分节标题增加 uppercase 样式 + 10px 字号 + 0.1em letter-spacing + 底部 1px 分割线，使用 `--text-heading-*` typography token + `--color-border-default` 分割线 token。

### 5. Theme 选中态增强

对齐设计稿，将 theme 按钮选中态从 outline 风格改为 filled：选中项增加背景色填充（`--color-bg-selected`）+ box-shadow 深度（`--shadow-sm`），使选中状态一目了然。

### 6. Font Size 滑块刻度标记

在 font size 滑块下方增加 12px–24px 刻度标记，使用 `--text-label-*` typography token，对齐设计稿。

### 7. 色板 Hover 效果

色板选环增加 hover 交互：`transform: scale(1.15)` + `box-shadow: 0 0 0 3px var(--color-accent-subtle)`，过渡时间使用 `--duration-fast`（150ms）。

### 8. Nav Active Indicator 精修

Settings 左侧导航的 active 项增加 glow 背景或左侧边栏指示器，对齐 `10-settings.html` 设计稿。使用 `--color-bg-selected` + `--radius-sm`。

### 9. Toggle 动效验证

验证 Toggle 组件的切换过渡是否已实现 0.2s smooth 动画（`--duration-fast`）。如未达标则补齐。

---

## Non-Goals：不做什么

1. **不改 Settings Store 逻辑**——Preference Store 的 API / 持久化逻辑不变
2. **不改 Settings 功能项列表**——不增减设置项
3. **不改 IPC 接口**——设置的 main ↔ renderer 通信协议不变
4. **不引入新依赖**——动画使用 CSS transition / `@keyframes`，不加动效库
5. **不改 SettingsGeneral.tsx 视觉**——General 页无明显视觉差距，本 change 不涉及
6. **不改 SettingsExport.tsx 视觉**——Export 页无设计稿对齐需求
7. **SettingsDialog.tsx 职责解耦**——486 行中导航侧边栏、页面标题、框架编排三个独立职责耦合在一起，在视觉精修过程中提取 `SettingsNavigation.tsx`（导航侧边栏，单一职责：页面切换）和 `SettingsHeader.tsx`（页面标题 + 描述，单一职责：页头展示），SettingsDialog.tsx 仅保留框架编排职责

---

## 依赖与影响

- **上游依赖**: v1-01（Design Token 补完）提供 typography scale token、animation token；v1-02（Primitive 进化）提供 Toggle 增强动效、Tabs 底线指示器
- **下游影响**: v1-11（空/加载/错误状态统一）可能需要在 Settings 页添加加载状态；v1-12（交互动效收口）将复用本 change 中的 hover / transition 模式
- **风险控制**: 本 change 涉及的文件行数较少（核心改动集中在 SettingsAppearancePage 265 行 + SettingsDialog 486 行），风险可控。但色板 Token 化需注意：色板值是用户功能选择，Token 化方案需确保用户选中的颜色值仍能正确持久化和回显
