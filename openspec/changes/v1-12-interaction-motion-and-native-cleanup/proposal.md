# V1-12 交互动效铺设与原生 HTML 收口

> 📋 **级联刷新 R1**（2025-07-25）：v1-02 完成后刷新。基线已重采集。

- **GitHub Issue**: 待创建
- **所属任务簇**: V1（视觉重塑）— Wave 4 面板 + 收口
- **umbrella**: v1-00-visual-overhaul-program
- **涉及模块**: 全 Features 层、renderer/styles
- **前端验收**: 需要（动效视觉验收 + Primitives 替换验证 + Storybook 构建通过）

---

## Why：为什么必须做

### 1. 用户现象

两大视觉短板在前几波 change 聚焦模块级重塑后依然散布全局——「堂室已整，门窗未润。」

**交互动效层面：**

设计稿全局标准过渡定义为 `0.2-0.3s cubic-bezier(0.2, 0, 0.2, 1)`，但代码中的实际表现：

- 大量使用 `transition-colors` 但缺少 duration / easing specification——Tailwind v4 默认 `transition-colors` 只声明 property，不附带 duration
- Hover 状态变化缺少 smooth transition——边框颜色、背景颜色直接跳变，感知上"硬"
- Scroll shadow（容器顶部/底部的渐变遮罩提示可滚动内容）几乎不存在——用户不知道下方还有内容
- 列表项 hover 时的 action icons fade-in 效果缺失或不完整——图标直接从无到有，无过渡
- 面板展开/折叠无 height 动画——内容直接出现/消失

**原生 HTML 元素收口层面：**

Features 层有 186 处 `<button>`（153）、`<input>`（14）、`<select>`（7）、`<textarea>`（12）直接使用原生 HTML 元素，绕过 Primitives 设计系统。外加 121 处 `eslint-disable-next-line creonow/no-native-html-element` 注释压制告警。

> **R1 基线变化**：v1-02 完成了 Radio（493→139+183+70 行）、Select（350→130+134 行）、ImageUpload（335→200+93 行）的 Primitive 重构，原生 `<input>` 从 50+ 降至 14、`<select>` 从 20+ 降至 7。v1-02 还交付了 `Button size="icon"` variant（features/ 已有 13 处使用），为 icon-only button 替换提供了直接替换路径。

审计发现其中许多标注为 "specialized button" 但实际完全可以替换：

- 纯 icon 按钮 → `<Button size="icon">`（v1-02 新增 variant）
- 文字按钮 → `<Button variant="ghost">` 或 `<Button variant="pill">`（v1-02 新增 variant）
- 文本输入 → `<Input>` / `<Textarea>`
- 下拉选择 → `<Select>`（v1-02 已重构为 SelectTrigger/SelectContent/SelectItem 组合）

### 2. 根因

**动效**：Tailwind v4 的 `transition-*` utility 默认不含 duration 和 easing——必须显式添加 `duration-*` 和 `ease-*`。开发过程中写了 `transition-colors` 却未配合 `duration-200 ease-default`，导致过渡效果不生效。

**原生 HTML**：v1-02 之前的 Primitives 覆盖不完整（如 ghost/pill Button、SelectTrigger 等），开发者被迫用原生 HTML 绕道。v1-02 已补完 Button（pill + icon size）、Select（Trigger/Content/Item 组合）、Radio（RadioGroup/RadioGroupItem）、Badge（pill），**替换基础已就绪**。

### 3. 威胁

- **品质感知**：交互过渡是用户"触感"体验的核心——无过渡的界面感觉"便宜"，有过渡的界面感觉"精致"
- **可滚动性发现**：缺少 scroll shadow 意味着用户可能错过面板底部内容
- **设计系统失效**：200+ 原生 HTML 意味着 Primitives 设计系统的覆盖率不足 70%，token 变更无法传导到这些元素
- **eslint 信噪比**：176 条 `eslint-disable` 使规则形同虚设——真正需要 disable 的极少数场景被淹没在大量不必要的 disable 中

### 4. 证据来源

| 数据点                                     | 旧值（v1-02 前）                        | R1 实测值                                      | 采集命令                                                                                                       |
| ------------------------------------------ | --------------------------------------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `eslint-disable` 总数（renderer/src/）     | 176 处                                  | **229 处**                                     | `grep -r 'eslint-disable' apps/desktop/renderer/src/ \| wc -l`                                                 |
| 其中 `no-native-html-element`（features/） | ~153 处                                 | **121 处**（↓21%）                             | `grep -r 'no-native-html-element' apps/desktop/renderer/src/features/ \| wc -l`                                |
| 原生 `<button>`（features/ 全部）          | 80+ 处                                  | **153 处**（含 test/story/guard 84 处）        | `grep -rn '<button' apps/desktop/renderer/src/features/ --include='*.tsx' \| wc -l`                            |
| 原生 `<button>`（features/ 仅 prod）       | —                                       | **69 处**                                      | 同上排除 `.test.` / `.stories.` / `.guard.`                                                                    |
| 原生 `<input>`                             | 50+ 处                                  | **14 处**（↓72%，v1-02 重构效果）              | `grep -rn '<input' apps/desktop/renderer/src/features/ --include='*.tsx' \| wc -l`                             |
| 原生 `<select>`                            | 20+ 处                                  | **7 处**（↓65%，v1-02 Select 重构效果）        | `grep -rn '<select' apps/desktop/renderer/src/features/ --include='*.tsx' \| wc -l`                            |
| 原生 `<textarea>`                          | 10+ 处                                  | **12 处**                                      | `grep -rn '<textarea' apps/desktop/renderer/src/features/ --include='*.tsx' \| wc -l`                          |
| `Button size="icon"` 使用                  | 0                                       | **13 处**（v1-02 新增 variant 已推广）         | `grep -rn 'size="icon"' apps/desktop/renderer/src/features/ --include='*.tsx' \| wc -l`                        |
| `transition-colors` 无 duration            | 普遍                                    | **76 处** transition-colors，仅 44 处 duration | `grep -rn 'transition-colors\|duration-' ... --include='*.tsx' \| wc -l`                                       |
| 设计稿全局过渡                             | `0.2–0.3s cubic-bezier(0.2, 0, 0.2, 1)` | 不变                                           | 35 个 HTML 设计稿                                                                                              |
| scroll shadow 实现                         | 几乎为 0                                | **2 处**                                       | `grep -rn 'scroll-shadow\|mask-image' apps/desktop/renderer/src/ --include='*.tsx' --include='*.css' \| wc -l` |
| AppShell.tsx 行数                          | 1,260 行                                | **1,267 行**                                   | `wc -l apps/desktop/renderer/src/components/layout/AppShell.tsx`                                               |

---

## What：做什么

### Part A: 交互动效铺设

#### A1. 全局 CSS Utility Classes

在 `renderer/src/styles/main.css` 中新增标准 utility：

- `.transition-default`：`transition-property: color, background-color, border-color, opacity, box-shadow; transition-duration: var(--duration-fast); transition-timing-function: var(--ease-default);`
- `.transition-slow`：同上但 `transition-duration: var(--duration-normal)`
- `.scroll-shadow-y`：顶部/底部可滚动渐变遮罩（CSS `mask-image` 实现）

#### A2. 面板 / 列表 / 卡片统一过渡

为所有面板中的交互元素添加标准过渡：

- Hover 背景色变化：`transition-default`
- Border 颜色变化：`transition-default`
- 列表项 action icons：`opacity: 0` → hover 时 `opacity: 1`，`transition-default`
- 折叠/展开：`max-height` + `overflow: hidden` + `transition-slow`

#### A3. Scroll Shadow 铺设

为所有可滚动容器添加 `.scroll-shadow-y`：

- 面板内容区域
- Dialog 内容区域
- 长列表（Outline、Character relationships、Memory rules）

### Part B: 原生 HTML 元素替换

#### B1. 按类型批量替换

> **R1 注意**：v1-02 已将原生 `<input>` 从 50+ 降至 14、`<select>` 从 20+ 降至 7。主要替换目标现集中于 `<button>`（69 处 prod 代码）和 `<textarea>`（12 处）。

- 所有可直接替换的 `<button>` → `<Button>` / `<Button size="icon">`（v1-02 新增 variant）
  - AI 模块（24 处 prod）、character 模块（11 处）、diff 模块（9 处）为重点
- 所有可直接替换的 `<input type="text">` → `<Input>`（仅剩 14 处，大部分可直接替换）
- 所有可直接替换的 `<select>` → `<Select>` + `<SelectTrigger>` + `<SelectContent>` + `<SelectItem>`（仅剩 7 处）
- 所有可直接替换的 `<textarea>` → `<Textarea>`（12 处，AI 模块 11 处需评估自动扩展场景）

#### B2. 移除对应 `eslint-disable`

每次替换成功后，移除对应的 `eslint-disable-next-line creonow/no-native-html-element` 注释。

#### B3. 标记真正需要保留的原生 HTML

对于确实需要原生 HTML 的场景（如 `<input type="file">`、`<input type="color">` 等），保留 `eslint-disable` 但补充详细技术理由注释。

### Part C：AppShell 全局布局骨架职责解耦

AppShell.tsx（R1 实测 1,267 行）是整个应用的布局容器，承载了：窗口级 flex 布局、侧栏宽度管理、面板可见性控制、拖拽 resize 逻辑、全局快捷键绑定、路由切换渲染。所有 V1 视觉重塑的成果最终渲染在 AppShell 内部——如果“外壳”仍然是一个不可维护的巨石，那么“内容”再精致也会因为布局容器的脆弱性而产生回归。

**按职责边界破坏性拆分——布局区域、状态逻辑、交互逻辑三者彻底分离**：

| 提取文件                 | 职责                                     | 单一职责说明 |
| ------------------------ | ---------------------------------------- | ------------ |
| `AppShell.tsx`           | 顶层 flex 容器 + 子组件编排，仅做“骨架”  | 组合层       |
| `AppShellLeftPanel.tsx`  | 侧栏容器（Icon Bar + FileTree/面板切换） | 左侧布局区域 |
| `AppShellMainArea.tsx`   | 中央编辑区域容器 + 标签页管理            | 主内容区域   |
| `AppShellRightPanel.tsx` | 右侧面板容器 + 面板切换逻辑              | 右侧布局区域 |
| `useAppShellLayout.ts`   | 面板可见性状态 + 宽度管理 + resize 逻辑  | 布局状态管理 |
| `useAppShellKeyboard.ts` | 全局快捷键绑定（面板切换/焦点移动）      | 键盘交互逻辑 |

**设计稿对齐**：确保分割后的布局容器使用 `--space-panel-padding`、`--color-border-subtle`、`--shadow-panel` Design Token，与 V1 视觉标准统一。

### Part D：全窗组合验证（Composition Story）

V1 各 Wave 中的子组件都有独立的 Storybook Story，但组件之间的 **组合关系** 缺乏视觉验证——“各美其美”不等于“美美与共”。本 Part 新增全窗组合 Storybook Story，验证子组件在真实布局中的视觉协调性：

| Composition Story                 | 组合对象                                      | 验证要点                                    |
| --------------------------------- | --------------------------------------------- | ------------------------------------------- |
| `AppShellComposition.stories.tsx` | AppShell + Dashboard                          | 全窗布局 + 侧栏宽度比例 + Panel 切换过渡    |
| `EditorWorkspace.stories.tsx`     | AppShell + EditorPane + FileTree + RightPanel | 三栏布局分配 + resize 交互 + 视觉分割线对齐 |
| `AiPanelExpanded.stories.tsx`     | AppShell + AiPanel + EditorPane               | AI 面板展开收起 + 主区域自适应 + 动效过渡   |

这些 Story 使用 `parameters: { layout: 'fullscreen' }` 以全窗渲染，确保在 Storybook 中能快速副验组合层的视觉质量。

注：本 Part 必须在 Part C 完成后执行，依赖拆分后的 AppShell 子组件架构。

---

## Non-Goals：不做什么

1. **不实现页面级过渡动画**——不做路由切换动画、面板展开收起的 spring physics 动画
2. **不引入动画库**——不使用 Framer Motion / React Spring 等，纯 CSS transition 实现
3. **不修改 Primitives 组件内部**——只替换 Features 层的原生 HTML 调用点
4. **不逐条审计 eslint-disable 的合理性**——v1-13 负责最终审计，本 change 只做替换+清理
5. **不做性能优化**——不添加 `will-change`、不做 GPU 加速分析，聚焦视觉效果

---

## 依赖与影响

- **上游依赖**: v1-01（Design Token）—— 依赖 `--duration-*` / `--ease-*` token；v1-02（Primitives）—— 依赖 Button/Input/Select/Textarea 组件完备 **[已完成 ✅]**
- **待回补上游**: v1-08（FileTree 4 AC 回补）、v1-10（OutlinePanel 回补）、v1-16（DiffView 回补）—— 均待各自完成后级联刷新
- **已完成上游**: v1-06（AI Panel Overhaul）✅ —— 子组件已提取至 `components/features/AiDialogs/`，新增 33 处原生 button 纳入范围；v1-07（Settings Polish）✅ —— SettingsDialog shell 精修完成
- **被依赖于**: v1-13（eslint-disable 审计）—— 本 change 清理大部分 `eslint-disable` 后，v1-13 负责审计剩余
- **执行顺序**: 本 change 应先于 v1-13 完成
- **并行安全**: Part A（动效）与 Part B（HTML 替换）可并行；Part B 与 v1-10（面板统一）可能有文件冲突，建议 Part B 在 v1-10 之后或协调进行
- **风险**: 大面积替换原生 HTML 可能引发测试失败（如测试中通过 `querySelector('button')` 查找元素），需逐一验证
- **v1-02 产出对本 change 的影响**:
  - `Button size="icon"` 提供了 icon-only 按钮的标准替换路径（features/ 已有 13 处采用）
  - `Button variant="pill"` 提供了圆角按钮的替换路径
  - Select 重构为 Trigger/Content/Item 组合模式，替换更直观
  - Radio 重构为 RadioGroup/RadioGroupItem，覆盖了原生 radio input 场景
  - 原生 `<input>` / `<select>` 数量显著下降，Part B 替换工作量相应减少

---

## R2 级联刷新记录（2026-03-21）

### 刷新触发

R2 P1 复核 v1-03/04/05 → 级联刷新下游。v1-12 尚未启动，此次为基线重采集。

### R2 基线重采集

| 度量                                    | 原始提案基线 | R2 实际 | Delta | 说明                     |
| --------------------------------------- | ------------ | ------- | ----- | ------------------------ |
| AppShell.tsx 行数                       | 1,267        | 1,267   | 0     | 未变化                   |
| 原生 `<button>`（features prod）        | 186          | 69      | -117  | v1-03/06/07 等已大量替换 |
| 原生 `<input>`（features prod）         | —            | 12      | —     | 首次采集                 |
| 原生 `<select>`（features prod）        | —            | 6       | —     | 首次采集                 |
| 原生 `<textarea>`（features prod）      | —            | 5       | —     | 首次采集                 |
| `no-native-html-element` eslint-disable | 121          | 121     | 0     | 未变化                   |
| transition 工具类使用                   | 0            | 2       | +2    | 少量已开始使用           |
| features 层 eslint-disable 总数         | —            | 146     | —     | 首次采集                 |

### AC 目标调整

- **原生 `<button>` 目标维持 ≤14**：当前 69（较原始 186 已下降 63%），仍需替换 ~55 处
- **AppShell.tsx 拆分目标维持 ≤250 行**：当前 1,267 行无变化
- **CSS 动效工具类目标不变**：`.transition-default`、`.transition-slow`、`.scroll-shadow-y` 待定义

### 上游影响评估

- v1-03（Dashboard）✅：Dashboard 区域原生按钮已清零，不再计入 v1-12 工作量
- v1-04（Editor Typography）✅：无原生 HTML 影响
- v1-05（Editor Decomposition）✅：编辑器已拆分为独立子模块，v1-12 可针对各子模块逐一处理原生 HTML 替换

### 结论

v1-12 基线已刷新。核心工作量：`<button>` 69→≤14（替换 ~55 处）、`<input>` 12→≤3、AppShell 拆分 1,267→≤250。上游完成降低了部分工作量（button 从 186 降至 69）。

---

## R1+R3 级联刷新记录（2026-03-21）

### 刷新触发

R1+R3 合并级联刷新——v1-01/02（R1）与 v1-06/07（R3）四个源 change 同时影响 v1-12。

上游验证结果：

- **v1-01（Design Token）**：PASS ⭐⭐⭐⭐ — tokens.css 469 行, 14 档 typography, `--duration-*` / `--ease-*` token 已就绪
- **v1-02（Primitive Evolution）**：PASS ⭐⭐⭐⭐⭐ — Button/Card/Tabs/Badge 变体完成, 新变体 130 处使用
- **v1-06（AI Panel Overhaul）**：PASS — 7 子组件拆分至 `components/features/AiDialogs/`, 27 测试文件全通过
- **v1-07（Settings Polish）**：PASS — 0 硬编码 hex, SettingsGeneralSections 拆分完成, 91 测试全通过

### R1+R3 基线重采集

**`features/` 层（原始范围）**：

| 度量                                     | R2 基线 | R1+R3 实际 | Delta | 采集命令                                                                                                                                      |
| ---------------------------------------- | ------- | ---------- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 原生 `<button>`（features/ prod）        | 69      | **69**     | 0     | `grep -rn '<button' apps/desktop/renderer/src/features/ --include='*.tsx' \| grep -v '.stories.' \| grep -v '.test.' \| wc -l`                |
| 原生 `<input>`（features/ prod）         | 12      | **12**     | 0     | 同上替换 `<input`                                                                                                                             |
| 原生 `<select>`（features/ prod）        | 6       | **6**      | 0     | 同上替换 `<select`                                                                                                                            |
| 原生 `<textarea>`（features/ prod）      | 5       | **5**      | 0     | 同上替换 `<textarea`                                                                                                                          |
| `no-native-html-element` eslint-disable  | 121     | **121**    | 0     | `grep -rn 'no-native-html-element' apps/desktop/renderer/src/features/ --include='*.tsx' \| grep -v '.stories.' \| grep -v '.test.' \| wc -l` |
| eslint-disable 总数（features/ prod）    | 146     | **142**    | -4    | `grep -rn 'eslint-disable' apps/desktop/renderer/src/features/ --include='*.tsx' \| grep -v '.stories.' \| grep -v '.test.' \| wc -l`         |
| Button `size="icon"` 使用（features/）   | 13      | **13**     | 0     | `grep -rn 'size="icon"' apps/desktop/renderer/src/features/ --include='*.tsx' \| grep -v '.stories.' \| grep -v '.test.' \| wc -l`            |
| AppShell.tsx 行数                        | 1,267   | **1,267**  | 0     | `wc -l apps/desktop/renderer/src/components/layout/AppShell.tsx`                                                                              |
| transition 工具类（CSS 定义）            | 0       | **0**      | 0     | `grep -rn 'transition-default\|transition-slow\|scroll-shadow' apps/desktop/renderer/src/ --include='*.css' \| wc -l`                         |
| scroll-shadow / mask-image               | 2       | **2**      | 0     | `grep -rn 'scroll-shadow\|mask-image' apps/desktop/renderer/src/ --include='*.tsx' --include='*.css' \| wc -l`                                |
| transition-colors 使用（features/ prod） | —       | **20**     | —     | 首次采集                                                                                                                                      |
| duration-\* 使用（features/ prod）       | —       | **30**     | —     | 首次采集                                                                                                                                      |

> `features/` 层指标与 R2 持平——v1-06/v1-07 的改动未影响此路径下的原生 HTML 计数。

**`components/features/` 层（v1-06 新增范围）**：

v1-06 AI Panel 重构将 7 个子组件（AiInlineConfirm、AiDiffContent、AiDiffModal、AiErrorCard、SystemDialog 等）提取至 `components/features/AiDialogs/`，同步创建了 `components/features/KnowledgeGraph/`。此路径在 R1/R2 基线中不存在。

| 度量                                             | R1+R3 实际 | 采集命令                                                                                                                                                 |
| ------------------------------------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 原生 `<button>`（components/features/ prod）     | **33**     | `grep -rn '<button' apps/desktop/renderer/src/components/features/ --include='*.tsx' \| grep -v '.stories.' \| grep -v '.test.' \| wc -l`                |
| 分布：AiDialogs                                  | 24         | —                                                                                                                                                        |
| 分布：KnowledgeGraph                             | 9          | —                                                                                                                                                        |
| `no-native-html-element` eslint-disable          | **38**     | `grep -rn 'no-native-html-element' apps/desktop/renderer/src/components/features/ --include='*.tsx' \| grep -v '.stories.' \| grep -v '.test.' \| wc -l` |
| eslint-disable 总数（components/features/ prod） | **39**     | 同上替换 `eslint-disable`                                                                                                                                |

### AC 目标调整

- **原生 `<button>` 合并目标**：`features/` 69 + `components/features/` 33 = **合计 102 处**，替换目标 ≤14。v1-06 新增范围使总工作量较 R2 增加约 48%
- **原生 `<input>/<select>/<textarea>` 目标维持**：features/ 12/6/5 处未变，components/features/ 无 input/select/textarea
- **AppShell.tsx 拆分目标维持 ≤250 行**：当前 1,267 行无变化
- **`no-native-html-element` eslint-disable 合并目标**：features/ 121 + components/features/ 38 = **合计 159 处**，替换目标 ≤25
- **CSS 动效工具类目标不变**：`.transition-default`、`.transition-slow`、`.scroll-shadow-y` 待定义

### 上游影响评估

- **v1-06（AI Panel Overhaul）✅**：将 AI 子组件提取至 `components/features/AiDialogs/`，引入 33 个新原生 `<button>` 到 v1-12 范围。`features/ai/` 内 24 处原生 button 未变——AI 模块 native HTML 替换工作量总体增加。同时 v1-06 的 7 子组件拆分架构为逐组件替换提供了清晰边界
- **v1-07（Settings Polish）✅**：SettingsDialog shell 精修完成，提取 `SettingsGeneralSections.tsx`（208 行）。`features/settings-dialog/` 原生 button 仅剩 2 处，替换工作量极小
- **v1-01（Design Token）✅**：`--duration-fast`、`--duration-normal`、`--ease-default` token 已就绪，Part A 动效铺设可直接引用
- **v1-02（Primitive Evolution）✅**：Button（pill + icon size）、Select（Trigger/Content/Item）、Radio（RadioGroup/RadioGroupItem）、Badge（pill）、Tabs（underline）变体系统已完备，Part B 替换基础已就绪

### 结论

`features/` 路径指标与 R2 持平。主要变化来自 v1-06：`components/features/` 层新增 33 个原生 `<button>` 和 38 条 `no-native-html-element` eslint-disable，需纳入 v1-12 范围。合并后总替换目标从 69 扩展至 **102 处** `<button>`、eslint-disable 从 121 扩展至 **159 处**。上游四项依赖全部 PASS，Part A 动效所需 token 和 Part B 替换所需 Primitive 变体均已就绪。

---

## R4 Cascade Refresh (2026-03-21)

> 「千里之堤，溃于蚁穴。」——韩非子
> Phase 3 完成后全面刷新。v1-12 是 v1-08 的直接下游，此次为基线 + AC + scope + 依赖 + 回补的全面刷新。

### 刷新触发

R4 P3 复核 v1-08/v1-09/v1-10 → 级联刷新。v1-08 是 v1-12 的直接上游（FileTree AC 回补来源），R4 复核发现回补任务大幅缩减。

### 上游依赖状态

| 上游 Change | 状态 | 说明 |
| --- | --- | --- |
| v1-01 Design Token | ✅ PASS | `--duration-*` / `--ease-*` token 已就绪 |
| v1-02 Primitive Evolution | ✅ PASS | Button/Select/Radio/Badge 变体完备 |
| v1-06 AI Panel Overhaul | ✅ PASS | SkillManagerDialog 624 行遗留待回补 |
| v1-07 Settings Polish | ✅ PASS | settings-dialog 仅剩 2 处原生 button |
| v1-08 FileTree Precision | ✅ PASS | **R4 复核：7/9 AC 已满足，回补大幅缩减** |
| v1-09 CommandPalette+Search | ✅ PASS | R4 复核：全部核心 AC 已满足 |
| v1-10 Side Panels | ✅ PASS | OutlinePanel 326 行（超标 26 行待回补） |

### R4 基线重采集

**Part A: 动效相关**

| 度量 | R1+R3 基线 | R4 实际 | Delta | 采集命令 |
| --- | --- | --- | --- | --- |
| `transition-colors` 使用（features/） | 76 处（全量） | **76** | 0 | `grep -rn 'transition-colors' apps/desktop/renderer/src/features/ --include='*.tsx' \| wc -l` |
| `transition-colors` 使用（features/ prod） | 20 处 | **72** | +52（↑260%） | 同上 `\| grep -v '.test.\|.stories.'` |
| `duration-*` 使用（features/） | 44 处（全量） | **44** | 0 | `grep -rn 'duration-' apps/desktop/renderer/src/features/ --include='*.tsx' \| wc -l` |
| `duration-*` 使用（features/ prod） | 30 处 | **30** | 0 | 同上 `\| grep -v '.test.\|.stories.'` |
| scroll shadow / mask-image | 2 处 | **2** | 0 | `grep -rn 'scroll-shadow\|mask-image\|scrollShadow' apps/desktop/renderer/src/ --include='*.tsx' --include='*.css' \| wc -l` |
| CSS 动效工具类（main.css 定义） | 0 | **0** | 0 | `grep -n 'transition-default\|transition-slow\|scroll-shadow' apps/desktop/renderer/src/styles/main.css` |

> **分析**：`transition-colors` prod 使用从 20→72（↑260%），说明 Phase 3 的 v1-08/v1-09/v1-10 在组件重构时已大量添加 transition。但 scroll shadow 仍仅 2 处，动效工具类仍未定义——Part A 核心工作不变。

**Part B: 原生 HTML 收口**

| 度量 | R1+R3 基线 | R4 实际 | Delta | 采集命令 |
| --- | --- | --- | --- | --- |
| 原生 `<button>`（features/ prod） | 69 | **69** | 0 | `grep -rn '<button' apps/desktop/renderer/src/features/ --include='*.tsx' \| grep -v '.test.\|.stories.\|.guard.' \| wc -l` |
| 原生 `<button>`（components/features/ prod） | 33 | **33** | 0 | 同上替换 `features/` → `components/features/` |
| 原生 `<button>` 合计（prod） | 102 | **102** | 0 | — |
| 原生 `<input>`（features/ prod） | 12 | **12** | 0 | `grep -rn '<input' apps/desktop/renderer/src/features/ --include='*.tsx' \| grep -v '.test.\|.stories.\|.guard.' \| wc -l` |
| 原生 `<select>`（features/ prod） | 6 | **6** | 0 | 同上替换 `<select` |
| 原生 `<textarea>`（features/ prod） | 5 | **5** | 0 | 同上替换 `<textarea` |
| `no-native-html-element`（features/） | 121 | **121** | 0 | `grep -r 'no-native-html-element' apps/desktop/renderer/src/features/ \| wc -l` |
| `no-native-html-element`（components/features/） | 38 | **38** | 0 | 同上替换路径 |
| `no-native-html-element` 合计 | 159 | **159** | 0 | — |
| `eslint-disable` 总数（renderer/src/） | 229 | **229** | 0 | `grep -r 'eslint-disable' apps/desktop/renderer/src/ \| wc -l` |
| Button `size="icon"`（features/） | 13 | **13** | 0 | `grep -rn 'size="icon"' apps/desktop/renderer/src/features/ --include='*.tsx' \| wc -l` |
| v1-02 变体使用（renderer/ 全量） | — | **66** | — | `grep -rn 'variant=.\(pill\|bento\|compact\)' apps/desktop/renderer/src/ --include='*.tsx' \| wc -l` |

> **分析**：原生 HTML 计数全部与 R1+R3 持平。Phase 3 的 v1-08/v1-09/v1-10 专注于功能与布局重构，未触及原生 HTML 替换——Part B 工作量不变。

**Part C: AppShell 解耦（AC-19）**

| 度量 | R1+R3 基线 | R4 实际 | Delta | 采集命令 |
| --- | --- | --- | --- | --- |
| AppShell.tsx 行数 | 1,267 | **1,267** | 0 | `wc -l apps/desktop/renderer/src/components/layout/AppShell.tsx` |
| layout/ 目录总行数 | — | **9,353** | — | `find .../layout/ -name '*.tsx' -o -name '*.ts' \| xargs wc -l` |
| layout/ 文件数 | — | **40** | — | 同上 |

> **分析**：AppShell.tsx 未变。layout/ 目录已有 40 个文件（含测试/Stories），拆分后需确保不引入循环依赖。

**Part D: 回补组件行数**

| 组件 | R1+R3 基线 | R4 实际 | 目标 | 采集命令 |
| --- | --- | --- | --- | --- |
| SkillManagerDialog.tsx | 624 | **624** | 拆分 | `wc -l .../features/ai/SkillManagerDialog.tsx` |
| OutlinePanel.tsx | — | **326** | ≤300 | `wc -l .../features/outline/OutlinePanel.tsx` |
| DiffView.tsx | — | **345** | 评估 | `wc -l .../features/diff/DiffView.tsx` |

**Part E: FileTree AC 回补确认**

| 检查项 | R4 状态 | 采集命令 / 证据 |
| --- | --- | --- |
| AC-8 文件类型颜色编码 | ⚠️ 待 Owner 决策 | `grep -rn 'file-type-icon' apps/desktop/renderer/src/features/files/ --include='*.tsx'` — 当前用 `data-testid="file-type-icon-*"` + emoji 差异化，无 color-coded icon |
| AC-6 hover/selected 对比度 | ↗️ 归 v1-01 | `grep -rn 'bg-hover\|bg-selected' apps/desktop/renderer/src/ --include='*.css'` — token 值 `--color-bg-hover: #1a1a1a` / `--color-bg-selected: #222222` 已定义，对比度调整属 Token 层职责 |
| AC-1~5/7/9 | ✅ v1-08 已满足 | R4 复核确认 7/9 项已满足 |

**Storybook play 函数**

| 度量 | R1+R3 基线 | R4 实际 | 采集命令 |
| --- | --- | --- | --- |
| Storybook `play:` 函数数 | — | **256** | `grep -rn 'play:' apps/desktop/renderer/src/ --include='*.stories.tsx' \| wc -l` |

### 回补清单调整

#### FileTree 回补（来源：v1-08）

R4 复核发现 v1-08 的 AC-1~AC-5/AC-7/AC-9 已全部满足，回补项从原始 4 项大幅缩减至：

- **AC-8（文件类型颜色编码）**：当前 FileTree 使用 emoji 差异化文件类型（`data-testid="file-type-icon-*"`），无 color-coded icon 方案。待 Owner 决策 emoji 方案是否等价满足，或需实现 color-coded icon。**若 Owner 接受 emoji 方案，此回补项清零。**
- **AC-6（hover/selected 对比度）**：`--color-bg-hover` / `--color-bg-selected` token 已在 `tokens.css` 定义。对比度调整属 v1-01 Token 层职责，非 v1-12 scope。**此项归 v1-01，v1-12 回补清零。**

> **结论**：FileTree 回补从 4 项缩减至 0~1 项（取决于 AC-8 Owner 决策）。

#### SkillManagerDialog 回补（来源：v1-06）

- `SkillManagerDialog.tsx` **624 行**，未拆分。v1-06 将 AI Panel 其他子组件拆至 `components/features/AiDialogs/`，但 SkillManagerDialog 未纳入。
- 回补任务：按职责拆分为 SkillManagerList + SkillManagerDetail + SkillManagerDialog（shell），各 ≤200 行。

#### OutlinePanel 回补（来源：v1-10）

- `OutlinePanel.tsx` **326 行**（超标 26 行）。v1-10 完成了 OutlinePanelContainer 提取（145 行）+ OutlineNodeItem 提取（316 行），但主文件仍超 300 行目标。
- 回补任务：进一步提取 toolbar/filter 逻辑，目标 ≤300 行。

#### DiffView 回补（来源：v1-16）

- `DiffView.tsx` **345 行**，`DiffHeader.tsx` **260 行**。当前 diff 模块有 9 处原生 `<button>`。
- 回补任务：与 Part B button 替换合并处理。

### 分析

Phase 3 完成后对 v1-12 scope 的影响：

1. **FileTree 回补大幅缩减**：原计划 4 项 AC 回补，R4 确认缩减至 0~1 项。这是本次刷新最显著的变化——v1-08 的高质量交付使 v1-12 的 FileTree 回补任务近乎清零。

2. **动效基础改善**：`transition-colors` prod 使用从 20→72 处（↑260%），说明 Phase 3 组件重构已自发添加过渡效果。但这些 transition 仍缺少统一的 duration/easing 规范（工具类未定义），Part A 的核心价值不变：提供 `.transition-default` / `.scroll-shadow-y` 等标准工具类，让散落的 transition 统一到设计稿标准。

3. **原生 HTML 替换无变化**：所有计数与 R1+R3 持平（button 102、input 12、select 6、textarea 5、eslint-disable 159），Part B 工作量不变。

4. **AppShell 解耦无变化**：1,267 行未动，Part C 工作量不变。

5. **总体 scope 评估**：v1-12 scope 因 FileTree 回补缩减而略微缩小，但 Part A/B/C/D 四个核心部分均不受影响。v1-12 仍为 V1 收口阶段的关键 change。
