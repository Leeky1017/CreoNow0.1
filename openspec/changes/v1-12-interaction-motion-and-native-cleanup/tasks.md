# Tasks: V1-12 交互动效铺设与原生 HTML 收口

> 📋 **级联刷新 R1**（2025-07-25）：v1-02 完成后刷新。基线已重采集。

- **GitHub Issue**: 待创建
- **分支**: `task/<N>-interaction-motion-and-native-cleanup`
- **Delta Spec**: `openspec/changes/v1-12-interaction-motion-and-native-cleanup/specs/`

---

## 验收标准

> R1 刷新：AC-8/9/10/11/12 基线数字已根据 v1-02 完成后实测值调整。

| ID    | 标准                                                                                                                     | 验证方式        | R1 状态 |
| ----- | ------------------------------------------------------------------------------------------------------------------------ | --------------- | ------- |
| AC-1  | `main.css` 包含 `.transition-default` utility class，duration 为 `var(--duration-fast)`、easing 为 `var(--ease-default)` | grep main.css   | 待实现  |
| AC-2  | `main.css` 包含 `.transition-slow` utility class，duration 为 `var(--duration-normal)`                                   | grep main.css   | 待实现  |
| AC-3  | `main.css` 包含 `.scroll-shadow-y` utility class，实现顶部/底部渐变遮罩                                                  | grep + 视觉验证 | 待实现  |
| AC-4  | 所有面板列表项 hover 时背景色变化有 smooth transition（非直接跳变）                                                      | 视觉交互验证    | 待实现  |
| AC-5  | 所有面板可滚动容器有 scroll shadow 指示（R1 基线：仅 2 处）                                                              | 视觉验证        | 待实现  |
| AC-6  | 列表项 hover 时 action icons 有 fade-in 过渡（opacity 0→1）                                                              | 视觉交互验证    | 待实现  |
| AC-7  | 面板折叠/展开有 height 过渡动画                                                                                          | 视觉交互验证    | 待实现  |
| AC-8  | Features 层原生 `<button>`（prod）替换率 ≥ 80%（R1 基线：69 处 prod，目标 ≤14 处）                                       | grep 统计       | 待实现  |
| AC-9  | Features 层原生 `<input>` 替换率 ≥ 80%（R1 基线：14 处，目标 ≤3 处）                                                     | grep 统计       | 待实现  |
| AC-10 | Features 层原生 `<select>` 替换率 ≥ 80%（R1 基线：7 处，目标 ≤2 处）                                                     | grep 统计       | 待实现  |
| AC-11 | Features 层原生 `<textarea>` 替换率 ≥ 80%（R1 基线：12 处，目标 ≤3 处）                                                  | grep 统计       | 待实现  |
| AC-12 | `no-native-html-element` eslint-disable 从 R1 基线 121 处降至 ≤25                                                        | grep 统计       | 待实现  |
| AC-13 | 替换过程中 0 处功能回归（所有现有测试通过）                                                                              | CI 全量测试     | 待实现  |
| AC-14 | 所有新增视觉元素使用语义化 Design Token                                                                                  | grep 验证       | 待实现  |
| AC-15 | Storybook 可构建（`pnpm -C apps/desktop storybook:build`）                                                               | CI 命令         | 待实现  |
| AC-16 | TypeScript 类型检查通过（`pnpm typecheck`）                                                                              | CI 命令         | 待实现  |
| AC-17 | lint 无新增违规（`pnpm lint`）                                                                                           | CI 命令         | 待实现  |
| AC-18 | 全量测试通过（`pnpm -C apps/desktop vitest run`）                                                                        | CI 命令         | 待实现  |
| AC-19 | `AppShell.tsx` 从 R1 基线 1,267 行按职责解耦为 5+ 文件，每个文件只承担一个职责                                           | 架构            | 待实现  |
| AC-20 | 布局骨架使用语义化 Design Token（`--space-panel-padding`、`--color-border-subtle`）                                      | 视觉            | 待实现  |
| AC-21 | 全窗口组合 Story（Dashboard + AppShell）以 `layout: 'fullscreen'` 渲染可构建                                             | Storybook       | 待实现  |
| AC-22 | 全窗口组合 Story（Editor + FileTree + RightPanel）以 `layout: 'fullscreen'` 渲染可构建                                   | Storybook       | 待实现  |
| AC-23 | 全窗口组合 Story（AiPanel 展开 + EditorPane）以 `layout: 'fullscreen'` 渲染可构建                                        | Storybook       | 待实现  |

---

## Phase 0: 准备

- [ ] 阅读 `AGENTS.md`
- [ ] 阅读 `design/DESIGN_DECISIONS.md` 动效相关章节
- [ ] 抽样阅读设计稿 CSS transition 定义（`01-dashboard.html`、`14-ai-panel.html`、`18-character-manager.html`）——确认 `0.2-0.3s cubic-bezier(0.2, 0, 0.2, 1)` 标准
- [ ] 统计当前 `eslint-disable` 按规则分布（建立替换前基线）：
  ```bash
  # R1 基线：121 处 no-native-html-element（features/），229 处 eslint-disable 总计（renderer/src/）
  grep -r 'eslint-disable' --include='*.tsx' --include='*.ts' renderer/src/features/ | \
    sed 's/.*-- //' | sort | uniq -c | sort -rn
  ```
- [ ] 统计当前原生 HTML 元素数量（建立替换前基线）：
  ```bash
  # R1 基线：<button> 153（prod 69）、<input> 14、<select> 7、<textarea> 12 = 总计 186
  grep -rn '<button\|<input\|<select\|<textarea' --include='*.tsx' renderer/src/features/ | wc -l
  ```
- [x] 确认 Primitives 层 `<Button>` / `<Button size="icon">` / `<Input>` / `<Select>` / `<Textarea>` 的 API 和 variant 覆盖 **[v1-02 已完成 ✅]**

---

## Phase 1: Red（测试先行）

### Part A: 动效测试

#### Task 1A.1: CSS Utility 存在性测试

**映射验收标准**: AC-1, AC-2, AC-3

- [ ] 测试：`main.css` 包含 `.transition-default` 类定义
- [ ] 测试：`.transition-default` 的 `transition-duration` 引用 `var(--duration-fast)`
- [ ] 测试：`main.css` 包含 `.transition-slow` 类定义
- [ ] 测试：`main.css` 包含 `.scroll-shadow-y` 类定义

**文件**: `apps/desktop/tests/guards/css-utility-completeness.test.ts`（新建）

#### Task 1A.2: 动效应用测试

**映射验收标准**: AC-4, AC-5, AC-6

- [ ] 测试：面板列表项渲染时包含 `transition` 相关 class
- [ ] 测试：可滚动容器包含 `scroll-shadow-y` 或等效 class
- [ ] 测试：列表项 action icons 默认有 `opacity-0` class

**文件**: 各面板测试文件中新增用例

### Part B: 原生 HTML 替换测试

#### Task 1B.1: 替换后行为等价测试

**映射验收标准**: AC-8, AC-9, AC-10, AC-11, AC-13

- [ ] 确认现有测试覆盖所有即将替换的交互点（click、change、focus 等）
- [ ] 如有覆盖盲区，先补充测试再替换

**文件**: 各模块现有测试文件

---

## Phase 2: Green（实现）

### Part A: 动效铺设

#### Task 2A.1: CSS Utility 定义

**映射验收标准**: AC-1, AC-2, AC-3

在 `renderer/src/styles/main.css` 中追加：

- [ ] `.transition-default` 定义：
  ```css
  .transition-default {
    transition-property:
      color, background-color, border-color, opacity, box-shadow, transform;
    transition-duration: var(--duration-fast);
    transition-timing-function: var(--ease-default);
  }
  ```
- [ ] `.transition-slow` 定义：同上但 `transition-duration: var(--duration-normal)`
- [ ] `.scroll-shadow-y` 定义（CSS mask-image 方案）：
  ```css
  .scroll-shadow-y {
    mask-image: linear-gradient(
      to bottom,
      transparent,
      black 24px,
      black calc(100% - 24px),
      transparent
    );
  }
  ```
- [ ] 可选：`.fade-in-on-hover` 定义（子元素在父元素 hover 时 fade-in）

**文件**: `renderer/src/styles/main.css`

#### Task 2A.2: 面板交互过渡应用

**映射验收标准**: AC-4, AC-5, AC-6, AC-7

逐面板添加过渡效果：

- [ ] CharacterPanel：列表项 + dialog 滚动区
- [ ] MemoryPanel：rule cards + 冲突解决面板
- [ ] OutlinePanel：大纲节点 + 折叠动画
- [ ] KnowledgeGraphPanel：entity 列表 + timeline
- [ ] VersionHistoryPanel：历史条目 + hover actions
- [ ] FileTreePanel：树节点 hover + 展开折叠
- [ ] AI Panel 子组件：消息列表 hover 效果
- [ ] Settings：设置项 hover + section 折叠
- [ ] Dashboard：卡片 hover 效果

**文件**: 全 Features 层涉及的 .tsx 文件

#### Task 2A.3: Scroll Shadow 铺设

**映射验收标准**: AC-5

- [ ] 面板主内容区域：CharacterPanel / MemoryPanel / OutlinePanel / KG / VersionHistory
- [ ] Dialog 内容区域：CharacterDetailDialog 等
- [ ] 长列表容器：Outline 树、Character relationships、Memory rules

**文件**: 同上涉及的 .tsx 文件

### Part B: 原生 HTML 替换

#### Task 2B.1: `<button>` → `<Button>` / `<Button size="icon">` 替换

**映射验收标准**: AC-8, AC-12

> R1 基线：69 处 prod native `<button>`。v1-02 新增 `Button size="icon"` variant 为 icon-only 按钮提供直接替换路径。

按模块逐一替换（R1 实测 prod 数量）：

- [ ] AI 模块（24 处——最大替换目标）
- [ ] character 模块（11 处）
- [ ] diff 模块（9 处——含 v1-16 DiffView 回补）
- [ ] projects 模块（7 处）
- [ ] editor 模块（6 处）
- [ ] settings-dialog 模块（2 处）
- [ ] 其余模块（zen-mode 1、rightpanel 1、onboarding 1、kg 1、files 1、quality-gates 5 处——quality-gates 为 guard 测试，评估是否需替换）
- [ ] 每替换一处，移除对应 `eslint-disable-next-line creonow/no-native-html-element`
- [ ] 替换后运行该模块测试确认无回归

**原则**：

- 纯图标按钮 → `<Button size="icon" variant="ghost">`（v1-02 新增 variant）
- 文字按钮 → `<Button variant="ghost">` 或 `<Button variant="pill">`（v1-02 新增 variant）
- 有特殊样式的按钮 → 评估是否可用 `<Button className="...">` 实现

#### Task 2B.2: `<input>` → `<Input>` 替换

**映射验收标准**: AC-9, AC-12

> R1 基线：仅 14 处（v1-02 Select/Radio/ImageUpload 重构已大幅削减）。
> 按模块分布：ai 4、version-history 3、editor 3、projects 2、search 1、commandPalette 1。

- [ ] `<input type="text">` → `<Input>`
- [ ] `<input type="search">` → `<Input type="search">`（如 Primitive 支持）
- [ ] 保留 `<input type="file">`、`<input type="color">`、`<input type="range">` 等无对应 Primitive 的类型——标记为合理 disable
- [ ] 每替换一处，移除对应 eslint-disable

#### Task 2B.3: `<select>` → `<Select>` 替换

**映射验收标准**: AC-10, AC-12

> R1 基线：仅 7 处（v1-02 Select Primitive 重构已大幅削减）。
> 按模块分布：ai 3、settings 1、quality-gates 1、memory 1、export 1。

- [ ] 所有 `<select>` → `<Select>` + `<SelectTrigger>` + `<SelectContent>` + `<SelectItem>`（v1-02 重构的组合模式）
- [ ] 每替换一处，移除对应 eslint-disable

#### Task 2B.4: `<textarea>` → `<Textarea>` 替换

**映射验收标准**: AC-11, AC-12

> R1 基线：12 处。按模块分布：ai 11、version-history 1。
> AI 模块的 textarea 多为自动扩展场景，需逐一评估。

- [ ] 所有通用 `<textarea>` → `<Textarea>`
- [ ] 特殊场景（如 AI 输入框的自动扩展 textarea）评估是否可替换
- [ ] 每替换一处，移除对应 eslint-disable

#### Task 2B.5: 标记合理保留的原生 HTML

**映射验收标准**: AC-12

- [ ] 对所有保留的 `eslint-disable`，补充技术理由注释：
  ```typescript
  // eslint-disable-next-line creonow/no-native-html-element --
  // <input type="file"> 无对应 Primitive，浏览器原生文件对话框不可替代
  ```

### Part C: AppShell 布局骨架解耦

#### Task C.1: AppShell 结构分析与测试基线

- [ ] 阅读 AppShell.tsx 全文（R1 基线：1,267 行），标注六大职责区域（布局/侧栏/主区域/右面板/resize/快捷键）
- [ ] 运行现有 AppShell 相关测试基线：`pnpm -C apps/desktop vitest run AppShell`
- [ ] 记录当前测试覆盖和通过率

#### Task C.2: 提取 useAppShellLayout hook

- [ ] 提取面板可见性状态管理（左/右面板展开/折叠）
- [ ] 提取面板宽度管理 + resize 拖拽逻辑
- [ ] 提取 breakpoint 响应式逻辑
- [ ] hook 文件 ≤ 200 行
- [ ] 编写 hook 单元测试

**文件**: `apps/desktop/renderer/src/components/layout/useAppShellLayout.ts`（新建）

#### Task C.3: 提取 useAppShellKeyboard hook

- [ ] 提取全局快捷键绑定（Cmd/Ctrl+B 切换侧栏、Cmd/Ctrl+\ 切换右面板等）
- [ ] 提取焦点管理逻辑（面板间焦点移动）
- [ ] hook 文件 ≤ 100 行

**文件**: `apps/desktop/renderer/src/components/layout/useAppShellKeyboard.ts`（新建）

#### Task C.4: 提取区域容器组件

- [ ] `AppShellLeftPanel.tsx`：左侧区域容器（Icon Bar 挂载点 + 面板内容区 + resize 手柄），≤ 200 行
- [ ] `AppShellMainArea.tsx`：中央编辑区域（标签页栏 + 编辑器内容区 + 底部状态栏挂载点），≤ 200 行
- [ ] `AppShellRightPanel.tsx`：右侧面板容器（面板头 + 面板内容区 + 动画过渡），≤ 200 行

**文件**: `apps/desktop/renderer/src/components/layout/` 下新建 3 个文件

#### Task C.5: 精简 AppShell 主文件

- [ ] `AppShell.tsx` 仅保留顶层 flex 容器 + 子组件编排 + Provider 包裹
- [ ] 目标 ≤ 250 行
- [ ] 使用 Design Token：`--space-panel-padding`、`--color-border-subtle`、`--shadow-panel`
- [ ] 确认拆分后所有现有测试通过
- [ ] Storybook 可构建

### Part D: 全窗口组合验证（Composition Story）

**映射验收标准**: AC-21, AC-22, AC-23

> 注：Part D 必须在 Part C 完成后执行，依赖拆分后的 AppShell 子组件架构。

#### Task D.1: Dashboard 全窗口组合 Story

- [ ] 创建 `AppShellComposition.stories.tsx`，以 `layout: 'fullscreen'` 渲染
- [ ] 组合 AppShell + DashboardPage，验证全窗口布局 + 侧栏宽度比例 + Panel 切换过渡
- [ ] 确认 Storybook 可构建

#### Task D.2: Editor 三栏组合 Story

- [ ] 创建 `EditorWorkspace.stories.tsx`，以 `layout: 'fullscreen'` 渲染
- [ ] 组合 AppShell + EditorPane + FileTree + RightPanel，验证三栏布局分配 + resize 交互 + 视觉分割线对齐
- [ ] 确认 Storybook 可构建

#### Task D.3: AI Panel 展开组合 Story

- [ ] 创建 `AiPanelExpanded.stories.tsx`，以 `layout: 'fullscreen'` 渲染
- [ ] 组合 AppShell + AiPanel + EditorPane，验证 AI 面板展开收起 + 主区域自适应 + 动效过渡
- [ ] 确认 Storybook 可构建

---

## Phase 3: Verification（验证）

- [ ] 运行 Phase 1 全部测试，确认全绿
- [ ] 运行 `pnpm -C apps/desktop vitest run` 全量测试通过
- [ ] 运行 `pnpm typecheck` 类型检查通过
- [ ] 运行 `pnpm lint` lint 无新增违规
- [ ] 运行 `pnpm -C apps/desktop storybook:build` Storybook 可构建
- [ ] 统计替换后 `no-native-html-element` eslint-disable 总数（R1 基线 121 处，目标 ≤25）
- [ ] 统计替换后原生 HTML 元素数量（R1 基线：button 69 prod / input 14 / select 7 / textarea 12），计算替换率（目标 ≥80%）
- [ ] grep 确认 `.transition-default` / `.scroll-shadow-y` 在各面板中的应用
- [ ] 逐面板视觉验收：hover 过渡流畅、scroll shadow 可见、action icons fade-in 自然
- [ ] 确认替换过程中无功能回归（重点检查 click / change / focus / submit 事件链）

---

## R2 级联刷新记录（2026-03-21）

### 刷新触发

R2 P1 复核 v1-03/04/05 → 级联刷新。v1-12 尚未启动。

### 基线更新

- 原生 `<button>` 基线从提案时 186 降至 R2 实际 **69**（v1-03/06/07 等已替换 117 处）
- AppShell.tsx **1,267 行** 未变
- eslint-disable `no-native-html-element` **121 处** 未变
- 任务工作量总体下降约 40%（主要来自 button 替换量缩减）

### 任务状态

- Phase 0~3 全部 [ ] 未启动
- 无已达成项需勾选（上游完成不直接满足 v1-12 的 AC，仅缩减工作量）

---

## R1+R3 级联刷新记录（2026-03-21）

### 刷新触发

R1+R3 合并级联刷新——v1-01/02（R1）与 v1-06/07（R3）四个源 change 全部 PASS。

### 基线更新

**`features/` 层指标与 R2 持平**：

- 原生 `<button>` **69 处** 未变（分布：ai 24、character 11、diff 9、projects 7、editor 6、quality-gates 5、settings-dialog 2、其余 5）
- 原生 `<input>` **12 处**、`<select>` **6 处**、`<textarea>` **5 处** 均未变
- `no-native-html-element` eslint-disable **121 处** 未变
- AppShell.tsx **1,267 行** 未变
- Button `size="icon"` 使用 **13 处** 维持（v1-02 产出）
- transition-colors 使用 **20 处**（features/ prod），duration-\* 使用 **30 处**

**`components/features/` 层（v1-06 新增范围）**：

- v1-06 提取 AiDialogs（24 处 `<button>`）+ KnowledgeGraph（9 处 `<button>`）= **33 处**原生 button
- `no-native-html-element` eslint-disable **38 处**
- 此路径在 R1/R2 未覆盖，需纳入 v1-12 范围

### AC 基线调整

| AC    | R2 基线                               | R1+R3 基线（含 components/features/）              |
| ----- | ------------------------------------- | -------------------------------------------------- |
| AC-8  | `<button>` 69 处 → ≤14                | `<button>` **102 处**（69+33）→ ≤14                |
| AC-9  | `<input>` 12 处 → ≤3                  | 不变                                               |
| AC-10 | `<select>` 6 处 → ≤2                  | 不变                                               |
| AC-11 | `<textarea>` 5 处 → ≤3                | 不变                                               |
| AC-12 | `no-native-html-element` 121 处 → ≤25 | `no-native-html-element` **159 处**（121+38）→ ≤25 |
| AC-19 | AppShell.tsx 1,267 行 → ≤250          | 不变                                               |

### 任务工作量变化

- **Part B 替换量增加约 48%**：`<button>` 从 69 扩展至 102 处（v1-06 AiDialogs 24 + KnowledgeGraph 9）
- **Part B Task 2B.1 新增子任务**：`components/features/AiDialogs/`（24 处）和 `components/features/KnowledgeGraph/`（9 处）需独立处理
- **Part A/C/D 无变化**：动效铺设、AppShell 拆分、组合 Story 目标不受影响
- v1-07 使 settings-dialog 仅剩 2 处原生 button，替换工作量极小

### 任务状态

- Phase 0~3 全部 [ ] 未启动
- 上游四项依赖全部 PASS：Part A 所需 Design Token 已就绪，Part B 所需 Primitive 变体已完备

---

## R4 级联刷新记录（2026-03-21）

> 📋 **R4 全面刷新**：v1-08（直接上游）R4 复核完成，Phase 3 级联触发。

### 刷新触发

R4 P3 复核 v1-08/v1-09/v1-10 → 全面刷新。v1-08 是 v1-12 的直接上游（FileTree AC 回补来源），R4 复核发现 7/9 AC 已满足，回补任务大幅缩减。

### 上游依赖状态（R4 更新）

| 上游 Change                 | 状态    | R4 说明                                                                               |
| --------------------------- | ------- | ------------------------------------------------------------------------------------- |
| v1-01 Design Token          | ✅ PASS | `--duration-*` / `--ease-*` / `--color-bg-hover` / `--color-bg-selected` token 已就绪 |
| v1-02 Primitive Evolution   | ✅ PASS | Button/Select/Radio/Badge 变体完备，66 处使用                                         |
| v1-06 AI Panel Overhaul     | ✅ PASS | SkillManagerDialog 624 行遗留待回补                                                   |
| v1-07 Settings Polish       | ✅ PASS | settings-dialog 仅剩 2 处原生 button                                                  |
| v1-08 FileTree Precision    | ✅ PASS | **R4 复核：7/9 AC 已满足，回补从 4 项缩减至 0~1 项**                                  |
| v1-09 CommandPalette+Search | ✅ PASS | R4 复核：全部核心 AC 已满足                                                           |
| v1-10 Side Panels           | ✅ PASS | OutlinePanel 326 行（超标 26 行待回补）                                               |

### AC 基线调整（R4）

| AC    | R1+R3 基线                            | R4 实际                                   | 偏差     | 说明                                                                              |
| ----- | ------------------------------------- | ----------------------------------------- | -------- | --------------------------------------------------------------------------------- |
| AC-1  | `.transition-default` 待定义          | **待定义**                                | 0        | main.css 无此类                                                                   |
| AC-2  | `.transition-slow` 待定义             | **待定义**                                | 0        | main.css 无此类                                                                   |
| AC-3  | `.scroll-shadow-y` 待定义             | **待定义**                                | 0        | main.css 无此类                                                                   |
| AC-4  | transition 散落，无统一标准           | **transition-colors prod 72 处**（↑260%） | ⚠️ +260% | Phase 3 组件已自发添加 transition，但缺少统一 duration/easing                     |
| AC-5  | scroll shadow 2 处                    | **2 处**                                  | 0        | 仍需全面铺设                                                                      |
| AC-6  | action icons fade-in 缺失             | **FileTree 已有 `transition-opacity`**    | 部分改善 | FileTreeNodeRow.tsx 已实现 `opacity-0 group-hover:opacity-100 transition-opacity` |
| AC-7  | 折叠动画缺失                          | 待验证                                    | —        | 需逐面板检查                                                                      |
| AC-8  | `<button>` 102 处 → ≤14               | **102 处**                                | 0        | features/ 69 + components/features/ 33，未变                                      |
| AC-9  | `<input>` 12 处 → ≤3                  | **12 处**                                 | 0        | 分布：ai 3、version-history 3、editor 3、projects 2、commandPalette 1             |
| AC-10 | `<select>` 6 处 → ≤2                  | **6 处**                                  | 0        | 分布：ai 3、settings 1、quality-gates 1、memory 1                                 |
| AC-11 | `<textarea>` 5 处 → ≤3                | **5 处**                                  | 0        | 分布：ai 4、version-history 1                                                     |
| AC-12 | `no-native-html-element` 159 处 → ≤25 | **159 处**                                | 0        | features/ 121 + components/features/ 38                                           |
| AC-19 | AppShell.tsx 1,267 行 → ≤250          | **1,267 行**                              | 0        | 未变                                                                              |

### `<button>` 模块分布（R4 确认）

```
# features/ prod（69 处）
grep -rn '<button' apps/desktop/renderer/src/features/ --include='*.tsx' | grep -v '.test.\|.stories.\|.guard.' | sed 's|.../features/||' | cut -d/ -f1 | sort | uniq -c | sort -rn

ai              24
character       11
diff             9
projects         7
editor           6
quality-gates    5
settings-dialog  2
zen-mode         1
rightpanel       1
onboarding       1
kg               1
files            1

# components/features/ prod（33 处）：AiDialogs 24 + KnowledgeGraph 9
```

### 回补清单调整（R4）

#### FileTree 回补（来源：v1-08）—— ⬇️ 大幅缩减

R4 复核发现 v1-08 的 AC-1~AC-5/AC-7/AC-9 已全部满足。回补项从原始 4 项缩减至：

- **AC-8（文件类型颜色编码）**：当前 FileTree 使用 emoji 差异化（`data-testid="file-type-icon-*"`），无 color-coded icon。待 Owner 决策 emoji 方案是否等价满足。若接受，**此项清零**。
- **AC-6（hover/selected 对比度）**：`--color-bg-hover: #1a1a1a` / `--color-bg-selected: #222222` token 已定义于 `tokens.css`。对比度调整归 v1-01 Token 层。**此项归 v1-01，v1-12 不承担。**

> FileTree 回补实际影响：v1-12 的 FileTree 相关工作量从 4 项 AC 缩减至 **0~1 项**。

#### SkillManagerDialog 回补（来源：v1-06）—— 维持

- `SkillManagerDialog.tsx` **624 行**（`wc -l .../features/ai/SkillManagerDialog.tsx`）
- 测试文件 275 行（`SkillManagerDialog.test.tsx`）
- 任务：按职责拆分（List + Detail + Shell），各 ≤200 行

#### OutlinePanel 回补（来源：v1-10）—— 维持

- `OutlinePanel.tsx` **326 行**（超标 26 行）
- 已有提取：OutlinePanelContainer（145 行）、OutlineNodeItem（316 行）、OutlineTree（286 行）
- 任务：进一步提取 toolbar/filter，目标 ≤300 行

#### DiffView 回补（来源：v1-16）—— 维持

- `DiffView.tsx` **345 行**、`DiffHeader.tsx` **260 行**
- diff 模块 9 处原生 `<button>`，与 Part B 替换合并处理

### 动效铺设现状评估（R4 新增）

Phase 3 组件重构已自发添加大量 `transition-colors`（prod 20→72 处），但仍存在两个系统性问题：

1. **无标准工具类**：`.transition-default` / `.transition-slow` / `.scroll-shadow-y` 仍未在 main.css 定义
2. **duration/easing 不统一**：72 处 `transition-colors` 中只有约 30 处配了 `duration-*`，其余依赖 Tailwind v4 的隐式默认值——与设计稿 `0.2-0.3s cubic-bezier(0.2, 0, 0.2, 1)` 标准不一致

Part A 的核心价值不变：定义标准工具类 → 替换散落的 transition → 统一到设计稿标准。

### AC-6 特别说明（R4 新增）

FileTree 中的 action icons fade-in 已部分实现：

```tsx
// FileTreeNodeRow.tsx:208
className =
  "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity shrink-0 w-6 h-6 p-0";
```

v1-08 已为 FileTree 实现了 AC-6 描述的 fade-in 过渡。v1-12 仍需将此模式推广至所有面板。

### 分析

Phase 3 完成后对 v1-12 的综合影响：

1. **FileTree 回补大幅缩减**（scope ↓）：4 项 → 0~1 项，v1-08 高质量交付近乎清零回补需求
2. **动效基础改善但未统一**（scope 不变）：transition 使用 ↑260% 但缺少标准工具类，Part A 核心价值不变
3. **原生 HTML 替换无变化**（scope 不变）：button 102 / input 12 / select 6 / textarea 5 / eslint-disable 159
4. **AppShell 解耦无变化**（scope 不变）：1,267 行
5. **总体 scope 评估**：因 FileTree 回补缩减而略微缩小。Part A/B/C/D 四个核心部分不受影响。

### 任务状态

- Phase 0~3 全部 [ ] 未启动
- 上游七项依赖全部 PASS（R4 新增 v1-08/v1-09/v1-10 三项）
- FileTree 回补任务因 R4 复核结论大幅缩减，待 Owner AC-8 决策后最终确认

---

## R5 级联刷新记录（2026-03-22）

> 📋 **R5 P4 级联刷新**：v1-11 / v1-10 / v1-16 三项 R5 复核全部 PASS，零回归。

### 刷新触发

R5 P4 复核 v1-11（Empty/Loading/Error States）/ v1-10（Side Panels）/ v1-16（Quality/RightPanel）→ 级联刷新。三项上游均 PASS 且零回归。

### 上游复核结论

- **v1-11（Empty/Loading/Error States）**：PASS — EmptyState 241 行, LoadingState 337 行, ErrorState 537 行; 64 tests 全绿; 16 feature 集成; 0 composites 残留
- **v1-10（Side Panels）**：PASS — 169 tests 全绿; PanelHeader 5/5 统一; eslint-disable 30; OutlinePanel 326（⚠️+9%）; CharacterDetailDialog 321（⚠️+7%）; AC-24 5/7 达标
- **v1-16（Quality/RightPanel）**：PASS — QualityGatesPanel 184 行, QualityPanel 238 行, InfoPanel 266 行; Quality 32 + Diff 59 tests 全绿; pixel 残留 42 处; DiffView 7 files 无变化

### 基线更新

**与 R4 的对比（仅标注有变化的项）：**

| 度量                          | R4 基线 | R5 实际  | Delta       | 说明                                      |
| ----------------------------- | ------- | -------- | ----------- | ----------------------------------------- |
| `duration-*`（features/ prod）| 30      | **40**   | **+10** ↑   | v1-10 面板重构主动采纳 Design Token       |
| layout/ 文件数                | 40      | **46**   | **+6**      | v1-10/v1-11 期间新增测试文件，总行数不变  |

**全部持平的项（零变化）：**

- 原生 `<button>` 合计 prod：**102** 处（features/ 69 + components/features/ 33）
- 原生 `<input>`：**12** 处 / `<select>`：**6** 处 / `<textarea>`：**5** 处
- `no-native-html-element` 合计：**159** 处（features/ 121 + components/features/ 38）
- `eslint-disable` 总数（renderer/src/）：**229** 处
- Button `size="icon"`：**13** 处
- AppShell.tsx：**1,267** 行 / layout/ 总行数：**9,353** 行
- CSS 动效工具类（main.css）：**0**（待 Part A 定义）
- scroll shadow：**2** 处（待 Part A 铺设）
- SkillManagerDialog：**624** 行 / OutlinePanel：**326** 行 / DiffView：**345** 行
- Storybook play 函数：**256** 个

### 受影响的 Task 条目

| Task / AC | 变化                | 影响                                           |
| --------- | ------------------- | ---------------------------------------------- |
| Task 2A.2 | duration-* +10      | 积极：上游面板已自发添加 Design Token duration，Part A 统一工具类铺设后替换更顺畅 |
| Task C.1  | layout/ +6 文件     | 中性：新增测试文件需纳入 AppShell 拆分影响评估 |
| AC-4      | transition 趋势向好 | 不变：72 处 transition-colors + 40 处 duration，但仍缺统一工具类 |
| AC-8~12   | 全部持平            | 不变：替换目标不变                             |
| AC-19     | AppShell 1,267 行   | 不变：拆分目标不变                             |

### 回补清单确认（R5 维持 R4）

| 回补项                 | R5 状态     | 说明                                                           |
| ---------------------- | ----------- | -------------------------------------------------------------- |
| SkillManagerDialog 624 | 维持        | 按职责拆分（List + Detail + Shell），各 ≤200 行               |
| OutlinePanel 326       | 维持        | R5 确认 +9% 超标在 <10% 容忍区间，回补优先级不变             |
| DiffView 345           | 维持        | 与 Part B diff 模块 9 处 button 替换合并处理                  |
| FileTree AC-8          | 维持 0~1 项 | 待 Owner emoji 方案决策                                        |

### 新增/调整项

无。Phase 4 三项上游复核全部 PASS 且零回归，未产生新的回流或回补需求。

### 任务状态

- Phase 0~3 全部 [ ] 未启动
- 上游十项依赖全部 PASS（R5 新增 v1-11，R5 确认 v1-10/v1-16）
- scope 与 R4 完全一致，v1-12 已准备就绪

### 结论

R5 级联刷新确认 v1-12 任务清单无变化。上游 `duration-*` 使用增长（+10）是积极信号，但不影响任何 task 的勾选状态或工作量估算。所有 AC 目标、回补清单、Phase 执行顺序均维持 R4 定义。
