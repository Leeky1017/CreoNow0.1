# 11 — 前端静态代码全面审计（Impeccable Skills 深度版）


> "不闻不若闻之，闻之不若见之，见之不若知之，知之不若行之。"——荀子《儒效》
>
> 本文档不同于 07 的设计完整度审查。07 以 **用户视角** 逐模块检查假 UI、i18n 缺失与交互断线；本文件则以 **代码静态分析** 为方法，使用 VS Code Impeccable 前端专用 Skills 做全量扫描，量化问题规模，划定红线与修复优先级。

---

## 文档索引

| § | 章节 | 内容 |
|---|------|------|
| 零 | ⚠️ 后续 Agent 强制技能要求 | **前端任务必须启用的 Impeccable Skills 清单** |
| 一 | 审计范围与方法论 | 静态分析手段、扫描范围、与 07 的关系 |
| 二 | 审计总览：记分卡 | 9 大维度评分摘要 |
| 三 | P0 阻断问题（必须在 v0.1 前修复） | 阻断发布的 4 类问题 |
| 四 | P1 高优问题（v0.1 后首批修复） | 影响质量感的 5 类问题 |
| 五 | P2 中优问题（持续演进） | 架构债与可维护性 |
| 六 | 正面发现（值得保持） | 值得作为团队规范固化的优秀实践 |
| 七 | 模块级问题热力图 | 每模块问题密度排名 |
| 八 | 修复路线图 | 按阶段排列的行动项 |
| 九 | 审计证据附录 | 扫描命令与原始数据 |

---

## 零、⚠️ 后续 Agent 强制技能要求

> **所有处理前端 UI / 样式 / 组件 / 交互任务的 Agent，在动手前必须加载并使用以下 Impeccable 前端专用 Skills。仅靠通用编码能力处理界面任务，不符合 CreoNow 的质量标准。**

### 必须使用的 Skills（按场景）

| 场景 | 必选 Skill | 说明 |
|------|-----------|------|
| 新建组件 / 页面 | **frontend-design** | 生成高设计品质的生产级前端界面，避免"AI 味"模板 |
| 修改已有组件 | **audit** + **critique** | 先审计当前状态，再评估设计效能 |
| 样式 / Token 变更 | **normalize** + **extract** | 确保符合 Design System，提取可复用 Token 与模式 |
| 错误提示 / 文案 | **clarify** + **harden** | 改善 UX 文案，增强边界场景鲁棒性 |
| 动效 / 交互增强 | **animate** + **polish** | 添加有意义的微交互，完成发布前最终打磨 |
| 响应式 / 多端适配 | **adapt** | 确保跨尺寸 / 上下文的一致体验 |
| 降噪 / 视觉减压 | **quieter** + **distill** | 降低视觉攻击性，提炼设计本质 |
| 品牌感 / 情感化 | **colorize** + **delight** + **bolder** | 注入品牌色、愉悦感与视觉记忆点 |
| 首次使用 / 空状态 | **onboard** | 设计引导流与空状态体验 |
| 组件提取到 Design System | **extract** | 识别并固化可复用模式 |
| 性能优化 | **optimize** | 加载、渲染、动画、包体积优化 |

### 加载方式

在 VS Code Chat 中：Agent 接到前端相关任务后，在 prompt 中显式声明使用对应 skill，或在 `.github/copilot-instructions.md` 中配置默认加载。例如：

```
请使用 frontend-design skill 创建这个组件。
请使用 audit + critique skill 评估这个页面。
```

### 禁止行为

- ❌ 不使用任何 Impeccable Skill，直接用通用编码能力处理前端设计任务
- ❌ 只跑 Vitest 测试通过就声称前端任务完成（P-Visual 原则要求视觉验收）
- ❌ 使用 Tailwind 原始色值 / 内置阴影类 / 裸字符串（AGENTS.md 禁令 §五）

---

## 一、审计范围与方法论

### 1.1 扫描范围

| 层级 | 路径 | 文件数 |
|------|------|--------|
| Primitive 组件 | `renderer/src/components/primitives/` | 27 组件 |
| Composite 组件 | `renderer/src/components/composites/` | 10 组件 |
| Layout 组件 | `renderer/src/components/layout/` | 11 组件 |
| Feature 模块 | `renderer/src/features/` | 22 模块 |
| 样式 | `renderer/src/styles/` | main.css, fonts.css, tokens.css |
| Store 层 | `renderer/src/stores/` | 全部 Zustand store |
| 设计源 | `design/system/` | tokens.css, component-cards, state-inventory |

### 1.2 审计方法

1. **grep / ripgrep 正则扫描**：量化原始色值、裸字符串、native HTML 元素、`!important` 使用
2. **AST 级结构分析**：Provider 嵌套深度、组件导出/引用关系
3. **Design Token 交叉验证**：`design/system/01-tokens.css` vs `renderer/src/styles/tokens.css`
4. **Impeccable Skills 多维评估**：使用 audit / critique / frontend-design 三个 Skill 分别评估
5. **AGENTS.md 禁令逐条检查**：§五全部 7 条禁令

### 1.3 与 07 的关系

| 维度 | 07-ui-ux-design-audit | 本文件（11） |
|------|----------------------|-------------|
| 视角 | 用户体验（肉眼可见的断点） | 代码质量（静态分析可检测的问题） |
| 方法 | 模块逐一走查 | 正则扫描 + 交叉验证 |
| 产出 | 假 UI 清单、交互断线、体感评级 | 量化违规数据、热力图、修复路线图 |
| 互补关系 | 07 说"这里体验不好" | 11 说"为什么不好，问题出在哪行代码" |

---

## 二、审计总览：记分卡

| 维度 | 评分 | 说明 |
|------|------|------|
| **Design Token 一致性** | ⭐⭐⭐⭐⭐ A+ | tokens.css 100% 同步，main.css 零硬编码值 |
| **Primitive 组件质量** | ⭐⭐⭐⭐⭐ A | 27 组件近乎完美：Token 化、Radix 基座、状态覆盖全 |
| **动效与 Reduced Motion** | ⭐⭐⭐⭐ A- | 12 处 prefers-reduced-motion 引用，体系化处理 |
| **i18n 覆盖率** | ⭐⭐ D | Feature 层 109+ 裸英文字符串，Primitive 层无问题 |
| **组件复用率** | ⭐⭐ D+ | 94 处 native `<button>`、17+ 处 native `<input>` 绕过 Primitive |
| **CSS 工程纪律** | ⭐⭐⭐ C+ | 14+ 处 `!important` 覆盖集中在 SearchPanel |
| **无障碍（a11y）** | ⭐⭐⭐ C | aria-live 仅 4 处，导航/对话框/文件树缺失 |
| **响应式设计** | ⭐⭐ D | SettingsDialog 固定 1000×700px，多处 min-w 硬编码 |
| **品牌与情感化设计** | ⭐ F | 无视觉品牌标识，像通用工具而非文学创作 IDE |

**综合评级：C+** — 基础设施（Token、Primitive）一流，Feature 层大面积"跑冒滴漏"。

---

## 三、P0 阻断问题（必须在 v0.1 前修复）

### 3.1 i18n 裸字符串（109+ 处）

**现象**：Feature 模块中大量用户可见文本直接写 English 字面量，未经 `t()` 函数。

**影响**：
- 无法本地化，中文用户看到英文界面
- 违反 AGENTS.md §五第 3 条禁令

**重灾区**（按严重程度排序）：

| 模块 | 裸字符串数 | 典型示例 |
|------|-----------|----------|
| version-history | 20+ | `"Version History"`, `"Restore"`, `"Current"` |
| settings | 15+ | `"Settings"`, `"General"`, `"Appearance"` |
| dashboard | 12+ | `"Recent Projects"`, `"Create New"` |
| ai (AiPanel) | 10+ | `"Ask AI"`, `"Generating..."` |
| search | 8+ | `"Search"`, `"Replace"`, `"No results"` |
| export | 8+ | `"Export as..."`, `"PDF"`, `"Markdown"` |
| onboarding | 6+ | `"Welcome"`, `"Get Started"` |
| character | 5+ | `"Characters"`, `"Add Character"` |
| editor | 5+ | `"Untitled"`, toolbar labels |

**修复规范**：
```tsx
// ❌ 禁止
<span>Version History</span>

// ✅ 必须
<span>{t('versionHistory.title')}</span>
```

**检测命令**：
```bash
grep -rn '"[A-Z][a-z].*"' apps/desktop/renderer/src/features/ \
  --include="*.tsx" | grep -v 'import\|console\|type\|interface\|className\|key='
```

### 3.2 Native HTML 绕过 Primitive 组件（94 处 button + 17 处 input）

**现象**：Feature 层大量使用原生 `<button>` 和 `<input>` 而非仓库 Primitive 组件。

**影响**：
- 样式不一致：原生元素无 Design Token 覆盖
- 状态缺失：无 focus ring、hover、disabled 标准化处理
- 无障碍缺失：Primitive 组件内建 aria 属性被跳过

**分布**：

| 元素 | 总数 | Primitive 替代 |
|------|------|---------------|
| `<button` | 94 处 | `<Button>` (from primitives) |
| `<input` | 17+ 处 | `<Input>` / `<TextInput>` (from primitives) |
| `<select` | 5+ 处 | `<Select>` (Radix-based) |

**重灾区**：version-history、settings、export、character

**检测命令**：
```bash
grep -rn '<button' apps/desktop/renderer/src/features/ --include="*.tsx" | wc -l
grep -rn '<input' apps/desktop/renderer/src/features/ --include="*.tsx" | wc -l
```

### 3.3 StatusBar 硬编码 Locale

**现象**：StatusBar 组件中硬编码 `"en-GB"` / `"en-US"` 作为日期格式 locale。

**影响**：
- 中文用户看到英文日期格式
- 违反 i18n 原则

**位置**：`renderer/src/components/layout/StatusBar/`

**修复方向**：从 i18n context 取当前 locale。

### 3.4 SettingsDialog 固定尺寸溢出

**现象**：SettingsDialog 使用固定 `width: 1000px; height: 700px`。

**影响**：
- 小于 1024×768 的窗口直接溢出
- Electron 允许用户缩放窗口，固定尺寸无法自适应

**修复方向**：改用 `max-w-[min(1000px,90vw)]` + `max-h-[min(700px,85vh)]` + overflow-auto。

---

## 四、P1 高优问题（v0.1 后首批修复）

### 4.1 CSS `!important` 覆盖（14+ 处）

**现象**：SearchPanel 中集中出现 `!important` Tailwind 覆盖。

**根因**：Tailwind CSS 4 层叠优先级不足以覆盖 TipTap 编辑器内联样式，开发者用 `!important` 强行覆盖。

**影响**：
- 样式难以维护和预测
- 后续主题切换可能失效

**位置**：`renderer/src/features/search/SearchPanel.tsx` 及相关

**修复方向**：
1. 使用 Tailwind `@layer` 提升优先级
2. 通过 TipTap extension 在编辑器层面控制样式
3. 如必须覆盖，收敛到 `styles/overrides.css` 统一管理

### 4.2 aria-live 覆盖不足

**现象**：`aria-live` 仅在 4 处使用（Toast、SaveIndicator、SearchPanel、AiPanel）。

**缺失场景**：
- 文件树增删节点后无公告
- 导航切换（IconBar → Sidebar）无公告
- Dialog 打开/关闭无公告
- 版本历史恢复操作无公告

**修复方向**：在 Primitive Dialog / FileTree / Navigation 组件中补充 `aria-live="polite"` 区域。

### 4.3 Storybook 仅展示暗色主题

**现象**：当前 Storybook 构建仅配置暗色主题，亮色主题从未被视觉验证。

**影响**：
- 亮色主题可能全面失效（Token 缺失、对比度不足）
- 发布后切换亮色可能导致不可读界面

**修复方向**：
1. 在 Storybook 配置中启用主题切换 decorator
2. 将亮色/暗色 snapshot 纳入 CI

### 4.4 版本历史模块质量最低

**现象**：version-history 是全仓库前端质量最差的模块。

**问题叠加**：
- 20+ 裸字符串
- 全部使用 native `<button>` / `<div>`
- 无 Primitive 组件引用
- 无 aria 标签
- 硬编码样式

**建议**：该模块需要整体重写，而非逐个修补。

### 4.5 Store Provider 嵌套 13 层

**现象**：App.tsx 中 Context / Store Provider 嵌套达 13 层。

**影响**：
- 顶层任一 Provider 变更触发全树 re-render
- 开发体验差，难以调试组件重渲染原因

**修复方向**：
1. 合并同质 Provider（如多个 Zustand store 不需要 Provider 包裹，直接 hook 调用）
2. 使用 React.lazy 拆分不在首屏需要的 Provider

---

## 五、P2 中优问题（持续演进）

### 5.1 品牌与情感化设计缺失

**现象**：CreoNow 定位为「创作者的 Cursor」，但界面视觉与任何通用开发工具无异。

**缺失项**：
- 无品牌色系或视觉主题
- 无启动画面 / 品牌 Logo 动画
- 空状态无插画或文案温度
- 编辑器无"写作氛围"暗示（如纸张质感、字体选择、行间距微调）

**建议使用 Skill**：`colorize` + `delight` + `bolder` + `onboard`

### 5.2 字体系统未激活

**现象**：`fonts.css` 中声明了 `GeistSans` 和 `GeistMono` 字体，但实际打包中可能未包含字体文件，回退到系统字体。

**影响**：跨平台字体不一致，Windows 和 macOS 渲染差异大。

### 5.3 暗色/亮色主题 Token 完整性

**现象**：Token 系统的 `:root`（亮色）和 `.dark`（暗色）声明完整，但没有自动化门禁确保每个暗色 Token 在亮色中都有对应值。

**修复方向**：CI 门禁脚本检查两套 Token 同名覆盖率。

---

## 六、正面发现（值得保持）

这些是审计中发现的高质量实践，应作为团队规范固化：

### 6.1 Token 三层体系完美落地

`design/system/01-tokens.css` → `renderer/src/styles/tokens.css` → 组件消费。100% 同步，无遗漏、无多余。

### 6.2 main.css 零硬编码值

`main.css` 中无任何硬编码颜色、尺寸或阴影值。所有值通过 CSS 变量引用 Token。这是"Design Token 做到极致"的标杆。

### 6.3 Primitive 组件品质卓越

27 个 Primitive 组件分数接近满分：
- 全部基于 Radix UI 构建
- 全部消费 Design Token
- 状态覆盖完整（hover、focus、disabled、active）
- Focus Ring 正确使用 `outline` 而非 `box-shadow`

### 6.4 prefers-reduced-motion 体系化

12 处 `prefers-reduced-motion` 引用分布在 CSS 和组件中，包含 `transition`、`animation`、`transform` 全覆盖。这在同类项目中属于上乘水准。

### 6.5 SearchPanel 状态机完备

搜索模块的状态处理堪称范本：空查询、无结果、搜索中、有结果、替换确认——五种状态都有对应 UI 和清晰的视觉反馈。

### 6.6 Layout 架构精确匹配 DESIGN_DECISIONS.md

AppShell 双列布局（IconBar + Sidebar | MainContent + RightPanel）完全遵循 `design/DESIGN_DECISIONS.md` 中的布局规范，无偏移。

### 6.7 Resizer 组件体验精致

键盘支持（Arrow + Shift+Arrow）、最小/最大约束、拖拽手柄视觉反馈——超出常见水准。

### 6.8 Component Cards 覆盖 P0 Primitive

`design/system/02-component-cards/` 中包含 Button、Dialog、Toast、Input、Select、Tabs 等核心组件的参考设计卡片，为实现提供了明确的视觉基准。

---

## 七、模块级问题热力图

按问题密度降序排列（🔴 高密 / 🟡 中密 / 🟢 低密）：

| 模块 | 密度 | 裸字符串 | Native HTML | !important | a11y 缺失 | 响应式 |
|------|------|---------|-------------|------------|----------|--------|
| version-history | 🔴🔴🔴 | 20+ | ✗ 全量 | — | ✗ 全量 | ✗ |
| settings | 🔴🔴 | 15+ | ✗ 部分 | — | ✗ 部分 | ✗ 固定尺寸 |
| search | 🔴🔴 | 8+ | ✗ 部分 | ✗ 14+ | — | — |
| dashboard | 🔴 | 12+ | ✗ 部分 | — | — | — |
| ai | 🔴 | 10+ | ✗ 部分 | — | ✗ 部分 | — |
| export | 🟡 | 8+ | ✗ 部分 | — | — | — |
| character | 🟡 | 5+ | ✗ 部分 | — | — | — |
| onboarding | 🟡 | 6+ | — | — | — | — |
| editor | 🟡 | 5+ | — | — | — | — |
| layout (StatusBar) | 🟡 | — | — | — | — | ✗ locale |
| primitives | 🟢 | — | — | — | — | — |
| composites | 🟢 | — | — | — | — | — |

---

## 八、修复路线图

### Phase 0（v0.1 发布前）

| ID | 任务 | 涉及模块 | Skill |
|----|------|---------|-------|
| S0-01 | i18n 全量扫描 + 补齐 Features 层裸字符串 | 全部 features | harden + clarify |
| S0-02 | 替换 Features 层 native `<button>` → Primitive `<Button>` | version-history, settings, export, character | normalize + extract |
| S0-03 | 替换 Features 层 native `<input>` → Primitive `<Input>` | settings, search | normalize |
| S0-04 | 修复 StatusBar 硬编码 locale | layout | harden |
| S0-05 | SettingsDialog 响应式改造 | settings | adapt |

### Phase 1（v0.1 后首批）

| ID | 任务 | 涉及模块 | Skill |
|----|------|---------|-------|
| S1-01 | 消除 SearchPanel `!important` 覆盖 | search | normalize |
| S1-02 | 补充 aria-live 到 Dialog / FileTree / Navigation | primitives, layout | harden |
| S1-03 | Storybook 启用亮色主题 + CI snapshot | 配置 | audit |
| S1-04 | version-history 模块整体重写 | version-history | frontend-design + harden |
| S1-05 | 评估并拆分 Provider 嵌套 | App.tsx | optimize |

### Phase 2（持续演进）

| ID | 任务 | Skill |
|----|------|-------|
| S2-01 | 品牌视觉建立：色系、Logo、Splash Screen | colorize + delight + bolder |
| S2-02 | 空状态插画与文案温度 | onboard + delight |
| S2-03 | 写作氛围视觉暗示（纸张质感、专注模式增强） | frontend-design + polish |
| S2-04 | 字体系统激活与跨平台验证 | adapt |
| S2-05 | 暗色/亮色 Token 覆盖率 CI 门禁 | extract |

---

## 九、审计证据附录

### 9.1 扫描命令

```bash
# 裸字符串扫描（Features 层）
grep -rn '"[A-Z][a-z].*"' apps/desktop/renderer/src/features/ \
  --include="*.tsx" | grep -v 'import\|console\|type\|interface\|className\|key=' | wc -l

# Native button 计数
grep -rn '<button' apps/desktop/renderer/src/features/ --include="*.tsx" | wc -l

# Native input 计数
grep -rn '<input' apps/desktop/renderer/src/features/ --include="*.tsx" | wc -l

# !important 计数
grep -rn '!important' apps/desktop/renderer/src/features/ --include="*.tsx" | wc -l
grep -rn '!important' apps/desktop/renderer/src/styles/ --include="*.css" | wc -l

# Tailwind 原始色值扫描
grep -rn 'bg-\(red\|blue\|green\|yellow\|gray\|slate\|zinc\)-' \
  apps/desktop/renderer/src/ --include="*.tsx" | wc -l

# prefers-reduced-motion 引用
grep -rn 'prefers-reduced-motion\|reduced-motion' \
  apps/desktop/renderer/src/ --include="*.css" --include="*.tsx" | wc -l

# aria-live 使用
grep -rn 'aria-live' apps/desktop/renderer/src/ --include="*.tsx" | wc -l

# Design Token 同步验证
diff <(grep '^  --' design/system/01-tokens.css | sort) \
     <(grep '^  --' apps/desktop/renderer/src/styles/tokens.css | sort)
```

### 9.2 关键数据汇总

| 指标 | 数值 | 备注 |
|------|------|------|
| Features 层裸英文字符串 | 109+ | 全部需走 `t()` |
| Features 层 native `<button>` | 94 | 应使用 Primitive `<Button>` |
| Features 层 native `<input>` | 17+ | 应使用 Primitive `<Input>` |
| `!important` 使用 | 14+ | 集中在 SearchPanel |
| `prefers-reduced-motion` 引用 | 12 | 优秀 |
| `aria-live` 使用 | 4 | 不足，需扩充 |
| Design Token 同步偏差 | 0 | 完美 |
| Primitive 组件数 | 27 | 品质卓越 |
| Composite 组件数 | 10 | 品质良好 |
| Provider 嵌套深度 | 13 层 | 需优化 |
| 设计参考 HTML 文件 | 35 | 覆盖全面 |

---

> "凡事豫则立，不豫则废。"——《礼记·中庸》
>
> 这份审计不是恐慌清单，而是**北极星**。CreoNow 的基础设施（Token 体系 + Primitive 组件）已经是 S 级水准。真正需要做的，是让 Feature 层的执行品质配得上那个底座——让"创作者的 Cursor"不仅技术过硬，更让创作者在每一个像素里感受到"这是为我而做"。
