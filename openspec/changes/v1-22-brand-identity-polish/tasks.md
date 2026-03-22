# Tasks: V1-22 品牌标识与视觉精修

- **状态**: 待启动
- **GitHub Issue**: 待创建
- **分支**: `task/<N>-brand-identity-polish`
- **Delta Spec**: `design/system/01-tokens.css`、`renderer/src/assets/`、`renderer/src/components/patterns/EmptyState.tsx`、`renderer/src/components/patterns/LoadingState.tsx`、`renderer/src/features/onboarding/OnboardingSteps.tsx`

---

## 验收标准

| ID  | 标准                                                                          | 验证方式                 | 结果 | R10 基线                                                |
| --- | ----------------------------------------------------------------------------- | ------------------------ | ---- | ------------------------------------------------------- |
| AC1 | `01-tokens.css` 包含 ≥ 3 个 `--gradient-*` token（暗/亮双主题）              | `grep -c 'gradient' design/system/01-tokens.css` | 待验 | 0 个 gradient token                                     |
| AC2 | `renderer/src/assets/illustrations/` 目录存在且包含 ≥ 6 个 SVG 文件（或占位） | `find renderer/src/assets/illustrations -name "*.svg" \| wc -l` | 待验 | 目录不存在，SVG/PNG 资源数 = 0                          |
| AC3 | `<EmptyState>` patterns 版本使用品牌插画替换 DefaultIllustration              | 代码检查 + Story 视觉验收 | 待验 | patterns/EmptyState.tsx 已有 `illustration` prop + DefaultIllustration（Lucide 通用 icon） |
| AC4 | OnboardingSteps 有步骤切换 slide+fade 动画 + 品牌渐变背景                     | 视觉验收 + Storybook     | 待验 | 仅 transition-colors，无 keyframe 动画，196 行          |
| AC5 | `01-tokens.css` 包含 `--color-accent-50` 到 `--color-accent-900` 色阶        | `grep -c 'accent-[0-9]' design/system/01-tokens.css` | 待验 | 8 个 accent token（base/hover/muted/subtle × 2 themes） |
| AC6 | Loading 动画已替换为品牌化版本（LoadingState variant="spinner"）               | 视觉验收 + Story         | 待验 | 通用 Spinner（animate-spin SVG circle），173 处引用      |
| AC7 | 所有新增动效 CSS-only（无新 JS 动画库依赖）                                   | `git diff package.json` 无新增动画库 | 待验 | 无动画库依赖                                            |
| AC8 | Storybook 构建通过                                                            | `pnpm -C apps/desktop storybook:build` | 待验 | CI gate                                                 |
| AC9 | 暗/亮双主题下品牌元素均正常渲染                                               | Storybook 双主题 Story 验证 | 待验 | 双主题 token 体系已建立（01-tokens.css 472 行）          |

---

## Phase 0: 准备

### T0-1: 阅读 spec 与依赖确认

- 阅读 `openspec/project.md`、`design/DESIGN_DECISIONS.md`
- 确认上游依赖状态：v1-01（token 体系 ✅）、v1-11（EmptyState ✅）、v1-17（字体打包 ✅ 已合并）、v1-21（Skeleton shimmer）
- 确认 `design/system/01-tokens.css` 当前结构（472 行，222 个自定义属性）
- 确认 `apps/desktop/renderer/src/components/patterns/EmptyState.tsx`（242 行）已有 `illustration` prop

### T0-2: 创建分支与工作区

- 运行 `scripts/agent_task_begin.sh <N> brand-identity-polish`
- 确认进入 `.worktrees/issue-<N>-brand-identity-polish`
- `pnpm install --frozen-lockfile`

---

## Phase 1: 品牌渐变系统

> 「五色令人目盲」——渐变贵精不贵多，四枚足矣。

### T1-1: 定义渐变 token（暗色主题）

- **文件**: `design/system/01-tokens.css`
- **位置**: `:root[data-theme="dark"]` 块末尾（约 line 95 之后）
- **新增 token**:
  ```css
  --gradient-brand: linear-gradient(135deg, var(--color-accent) 0%, #7c3aed 100%);
  --gradient-surface: linear-gradient(180deg, var(--color-bg-surface) 0%, var(--color-bg-base) 100%);
  --gradient-hero: radial-gradient(ellipse at top, rgba(var(--color-accent-rgb), 0.15) 0%, transparent 60%);
  --gradient-shimmer: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.05) 50%, transparent 100%);
  ```
- **前置**: 需确认 `--color-accent-rgb` 是否已定义；若无则需在同块新增 `--color-accent-rgb: 255, 255, 255;`
- **AC**: AC1

### T1-2: 定义渐变 token（亮色主题）

- **文件**: `design/system/01-tokens.css`
- **位置**: `:root[data-theme="light"]` 块末尾（约 line 155 之后）
- **新增 token**: 与 T1-1 对应的亮色主题值
  ```css
  --gradient-brand: linear-gradient(135deg, var(--color-accent) 0%, #6d28d9 100%);
  --gradient-surface: linear-gradient(180deg, var(--color-bg-surface) 0%, var(--color-bg-base) 100%);
  --gradient-hero: radial-gradient(ellipse at top, rgba(var(--color-accent-rgb), 0.10) 0%, transparent 60%);
  --gradient-shimmer: linear-gradient(90deg, transparent 0%, rgba(0, 0, 0, 0.03) 50%, transparent 100%);
  ```
- **前置**: 亮色主题 `--color-accent-rgb: 26, 26, 26;`
- **AC**: AC1, AC9

### T1-3: 渐变 Storybook Story

- **文件**: `apps/desktop/renderer/src/components/primitives/Gradient.stories.tsx`（新建）
- **内容**: 展示所有 4 个渐变 token 在暗/亮主题下的效果
- **AC**: AC8

### T1-4: 渐变 token 单元测试

- **文件**: `apps/desktop/renderer/src/__tests__/tokens/gradient-tokens.test.ts`（新建）
- **验证**: 渐变 token 在 CSS 中正确定义（grep 或 CSS 变量解析）
- **AC**: AC1

---

## Phase 2: 空状态插画系统

> Proposal 明确："插画由设计师提供，本 change 建立框架 + 占位图。"

### T2-1: 创建 illustrations 目录与 SVG 占位图

- **目录**: `apps/desktop/renderer/src/assets/illustrations/`（新建）
- **文件清单**（6 个占位 SVG）:
  - `empty-project.svg` — 空项目列表（简约线稿 + accent 色点缀）
  - `empty-search.svg` — 搜索无结果
  - `empty-ai.svg` — AI 对话起始
  - `empty-outline.svg` — 空大纲
  - `empty-memory.svg` — 空记忆库
  - `empty-character.svg` — 空角色列表
- **约束**: 每个 SVG ≤ 5KB、使用 `currentColor` + CSS 变量实现主题适配、线性插画风格
- **⚠️ 审计门禁**: 占位 SVG 为工程骨架，最终品牌插画需设计师输出替换。tasks.md 应标注后续设计师交接节点
- **AC**: AC2

### T2-2: 创建插画导出索引

- **文件**: `apps/desktop/renderer/src/assets/illustrations/index.ts`（新建）
- **内容**: 统一导出所有插画组件（React SVG 组件或 URL import）
- **AC**: AC2

### T2-3: 升级 EmptyState patterns 版 DefaultIllustration

- **文件**: `apps/desktop/renderer/src/components/patterns/EmptyState.tsx`
- **变更**: 修改 `DefaultIllustration()` 组件（lines 83-156），将各 variant 的 Lucide icon 替换为对应品牌插画 import
  - `variant="project"` → `import EmptyProject from '@/assets/illustrations/empty-project.svg'`
  - `variant="search"` → `import EmptySearch from '@/assets/illustrations/empty-search.svg'`
  - `variant="characters"` → `import EmptyCharacter from '@/assets/illustrations/empty-character.svg'`
  - 其余 variant 类推
- **非破坏性**: `illustration` prop 仍优先于 DefaultIllustration
- **AC**: AC3

### T2-4: EmptyState 插画 Storybook Story 更新

- **文件**: `apps/desktop/renderer/src/components/patterns/EmptyState.stories.tsx`
- **变更**: 更新现有 Story（Project / Files / Search / Characters / Generic）以展示品牌插画效果
- **新增**: `WithCustomIllustration` Story 展示自定义插画 prop
- **AC**: AC3, AC8, AC9

### T2-5: EmptyState 插画集成测试

- **文件**: `apps/desktop/renderer/src/components/patterns/__tests__/EmptyState.test.tsx`
- **验证**:
  - 当 `variant` 指定时，DefaultIllustration 渲染对应品牌 SVG
  - 当 `illustration` prop 传入时，优先使用自定义插画
  - 所有 variant 正确渲染（无 crash）
- **AC**: AC3

---

## Phase 3: Onboarding 品牌化

> 依赖分析：OnboardingSteps.tsx（196 行）为独立 3 步向导，不直接依赖 v1-14。
> 但需确认 OnboardingPage（父组件）的步骤切换逻辑以确定动画挂载点。

### T3-1: 步骤切换动画 CSS

- **文件**: `apps/desktop/renderer/src/features/onboarding/onboarding.css`（新建）
- **内容**:
  ```css
  @keyframes step-slide-in { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes step-slide-out { from { opacity: 1; transform: translateX(0); } to { opacity: 0; transform: translateX(-20px); } }
  @keyframes confetti-burst { /* 完成庆祝 keyframes */ }
  ```
- **约束**: CSS-only，使用 `--duration-normal` / `--easing-smooth` design token
- **AC**: AC4, AC7

### T3-2: 品牌渐变背景 + 光点装饰

- **文件**: `apps/desktop/renderer/src/features/onboarding/OnboardingSteps.tsx`
- **变更**:
  - 根容器添加 `background: var(--gradient-hero)` 叠加
  - 新增 CSS-only 光点装饰元素（pseudo-element 实现，利用 `--gradient-brand` 低透明度）
  - 引入 `onboarding.css`
- **依赖**: T1-1（`--gradient-hero` / `--gradient-brand` token）
- **AC**: AC4, AC9

### T3-3: 完成庆祝动画

- **文件**: `apps/desktop/renderer/src/features/onboarding/OnboardingSteps.tsx`
- **变更**: 最后一步（OpenFolderStep）完成后触发 CSS confetti / checkmark 动画
- **实现**: CSS `@keyframes` + `animation-play-state` 控制，不引入 JS 动画库
- **AC**: AC4, AC7

### T3-4: OnboardingPage Story 更新

- **文件**: `apps/desktop/renderer/src/features/onboarding/OnboardingPage.stories.tsx`
- **变更**: 更新现有 Default / DarkTheme Story，确保动画在 Storybook 中可预览
- **新增**: `StepTransition` Story 展示步骤切换动画
- **AC**: AC4, AC8, AC9

### T3-5: Onboarding 动画测试

- **文件**: `apps/desktop/renderer/src/features/onboarding/__tests__/OnboardingSteps.test.tsx`（新建或扩展）
- **验证**:
  - 步骤切换时正确应用动画 CSS class
  - 完成步骤后庆祝动画元素出现
  - 动画不依赖 JS 定时器（CSS-only 验证）
- **AC**: AC4

---

## Phase 4: 品牌色延伸色板

> **⚠️ Owner 审批门禁**: Proposal 明确"色阶的具体值不应由 Agent 随意生成，需 Owner 确认"。
> 本 Phase 分两步：先定义结构骨架（色阶 key），再由 Owner 填入具体色值。

### T4-1: 定义 accent 色阶结构（暗色主题）

- **文件**: `design/system/01-tokens.css`
- **位置**: `:root[data-theme="dark"]` 块，`--color-accent-subtle` 之后
- **新增 token**:
  ```css
  /* 品牌色阶 — 具体值需 Owner 确认 */
  --color-accent-50: ;   /* 最浅 */
  --color-accent-100: ;
  --color-accent-200: ;
  --color-accent-300: ;
  --color-accent-400: ;
  --color-accent-500: var(--color-accent);  /* 主色，与 accent 同值 */
  --color-accent-600: ;
  --color-accent-700: ;
  --color-accent-800: ;
  --color-accent-900: ;  /* 最深 */
  ```
- **⚠️ 阻断**: 具体 hex/rgba 值须 Owner 或设计师提供后填入，Agent 不得自行生成色值
- **AC**: AC5

### T4-2: 定义 accent 色阶结构（亮色主题）

- **文件**: `design/system/01-tokens.css`
- **位置**: `:root[data-theme="light"]` 块对应位置
- **新增**: 亮色主题色阶（同 T4-1 结构）
- **⚠️ 阻断**: 同 T4-1，色值须 Owner 确认
- **AC**: AC5, AC9

### T4-3: 色板 Storybook Story

- **文件**: `apps/desktop/renderer/src/components/primitives/ColorPalette.stories.tsx`（新建）
- **内容**: 展示 `accent-50` 到 `accent-900` 色阶在暗/亮主题下的色板卡片
- **作用**: 作为 Owner 色值审批的视觉参考
- **AC**: AC5, AC8, AC9

### T4-4: 色阶 token 测试

- **文件**: `apps/desktop/renderer/src/__tests__/tokens/accent-palette.test.ts`（新建）
- **验证**: `--color-accent-50` 到 `--color-accent-900` 在 CSS 中正确定义
- **AC**: AC5

---

## Phase 5: 品牌化 Loading

> 影响范围：当前 173 处 `LoadingState|spinner|Spinner` 引用。
> 策略：仅修改 Spinner primitive 的视觉表现（SVG + CSS animation），不改变 API，确保所有引用无感升级。

### T5-1: 设计品牌化 Spinner SVG

- **文件**: `apps/desktop/renderer/src/components/primitives/Spinner.tsx`
- **变更**: 替换现有 SVG circle 动画为品牌化版本
  - 方案 A: 品牌首字母 "C" 笔画描绘动画（`stroke-dasharray` + `stroke-dashoffset`）
  - 方案 B: 笔尖 icon 旋转 + 脉冲（`rotate` + `scale` keyframes）
  - **⚠️ 审计建议**: 推荐方案 A，与「文字创作 IDE」定位吻合
- **约束**: CSS animation only，保持 5 种尺寸（xs/sm/md/lg/xl）兼容
- **非破坏性**: SpinnerProps 接口不变，所有 173 处引用无需修改
- **AC**: AC6, AC7

### T5-2: 品牌化 Spinner CSS 动画

- **文件**: `apps/desktop/renderer/src/styles/main.css` 或 Spinner 内联 `<style>`
- **新增**:
  ```css
  @keyframes brand-spin { /* 品牌 Spinner keyframes */ }
  @keyframes brand-pulse { /* 脉冲辅助动画 */ }
  ```
- **替换**: 移除 `animate-spin`（Tailwind 内置），使用自定义 `brand-spin`
- **AC**: AC6, AC7

### T5-3: LoadingState 集成验证

- **文件**: `apps/desktop/renderer/src/components/patterns/LoadingState.tsx`
- **变更**: 确认 `variant="spinner"` 正确渲染品牌化 Spinner（无需改代码，因 Spinner primitive 已升级）
- **验证**: LoadingState 各 variant 无回归
- **AC**: AC6

### T5-4: Spinner / LoadingState Story 更新

- **文件**: `apps/desktop/renderer/src/components/primitives/Spinner.stories.tsx`
- **变更**: 更新现有 Story，确保品牌化 Spinner 在所有尺寸 + 颜色变体下正常展示
- **文件**: `apps/desktop/renderer/src/components/patterns/LoadingState.stories.tsx`
- **变更**: 确认 SpinnerDefault Story 展示品牌化效果
- **AC**: AC6, AC8, AC9

### T5-5: Spinner 回归测试

- **文件**: `apps/desktop/renderer/src/components/primitives/__tests__/Spinner.test.tsx`（新建或扩展）
- **验证**:
  - 所有 5 种尺寸正确渲染（xs/sm/md/lg/xl）
  - `label` prop 正确设置 `aria-label`
  - SVG 元素存在且包含品牌化 animation class
  - 无 JS 动画库依赖
- **AC**: AC6, AC7

---

## 任务依赖图

```
Phase 0 (准备)
  └─→ Phase 1 (渐变 token)
       ├─→ Phase 2 (插画系统)     ← 独立于 Phase 1，但 Story 可用渐变背景
       ├─→ Phase 3 (Onboarding)   ← 依赖 T1-1 的 gradient token
       └─→ Phase 5 (Loading)      ← 独立于渐变，但可用 accent 色阶
  └─→ Phase 4 (色板)              ← 独立于 Phase 1，但存在 Owner 审批阻断
       └─→ ⚠️ Owner 色值审批门禁
```

**并行策略**: Phase 1 完成后，Phase 2 / Phase 3 / Phase 5 可并行推进。Phase 4 因 Owner 审批门禁可能阻断，建议尽早提交色阶结构供审批。

---

## R10 基线采集（2025-07-23）

| 指标                         | R9 预测值     | R10 实测值 | Delta     | 说明                                                                      |
| ---------------------------- | ------------- | ---------- | --------- | ------------------------------------------------------------------------- |
| SVG/PNG 资源数               | 0             | 0          | ±0        | v1-22 核心任务：需新增 ≥ 6 个 SVG                                         |
| gradient CSS（styles/）      | 1             | 1          | ±0        | main.css 仅 1 处 mask-gradient（scroll-shadow），非色彩渐变                |
| gradient CSS（design/）      | 0             | 0          | ±0        | 01-tokens.css 无 gradient token，v1-22 Phase 1 将新增 4 个                 |
| illustrations 目录           | 不存在        | 不存在     | ±0        | v1-22 Phase 2 将创建                                                       |
| EmptyState illustration 引用 | 18            | 18         | ±0        | patterns/EmptyState.tsx 已有 illustration prop + DefaultIllustration       |
| EmptyState 总引用            | —             | 107        | —         | 107 处引用，品牌插画替换 DefaultIllustration 将惠及所有引用                 |
| accent color token           | 8             | 8          | ±0        | base/hover/muted/subtle × 2 themes；v1-22 Phase 4 将扩展 50-900 色阶      |
| woff2 字体文件               | 0→14          | 14         | +14 ✅    | v1-17 已合并，品牌字体基础设施就绪                                          |
| @font-face 声明              | 0→14          | 14         | +14 ✅    | v1-17 已合并，fonts.css 已扩展至 3159 字节                                  |
| shadow token 档位            | 4→6           | 6          | +2 ✅     | v1-17 新增 shadow-xs + shadow-2xl，品牌化 Loading 可用更细腻阴影            |
| OnboardingSteps 行数         | —             | 196        | —         | 3 步向导，仅 transition-colors 过渡，无 keyframe 动画                       |
| Loading/Spinner 引用         | —             | 173        | —         | 替换 Spinner 影响面广，需确保非破坏性升级                                    |

---

## 审计意见

### 1. Phase 2 SVG 占位图策略

**评估**: 合理但需补充交接机制。

Proposal 明确"插画由设计师提供，本 change 建立框架 + 占位图"——这是正确的工程分工。占位 SVG 应满足：
- 使用 `currentColor` + CSS 变量实现主题适配（不硬编码颜色）
- 线性插画风格，≤ 5KB/个
- 视觉上可用但非最终品牌资产

**建议**: T2-1 应额外产出一份 `illustrations/README.md`，说明设计师交接规范（尺寸、色板约束、SVG 优化要求），确保后续替换时品牌一致性。

### 2. Phase 4 Owner 审批门禁

**评估**: 必须标注，已在 T4-1/T4-2 中设置阻断门禁。

Proposal 原文："色阶的具体值不应由 Agent 随意生成，需 Owner 确认"——这是明确的 P5（Escalate, Don't Improvise）场景。Agent 可定义色阶 key 结构，但 hex/rgba 具体值必须由 Owner 或设计师提供。

**风险**: 若 Owner 审批延迟，Phase 4 将阻断。建议在 Phase 1 完成后立即提交色阶结构供审批，与 Phase 2/3/5 并行等待。

### 3. Phase 3 与 v1-14 依赖关系

**评估**: 无直接依赖。

OnboardingSteps.tsx 为独立 3 步向导组件，使用标准 primitive（Button/Heading/Text）和 Lucide icon。父组件 OnboardingPage 管理步骤状态。v1-14 若涉及 Onboarding 流程重构，可能改变步骤内容或数量，但 v1-22 的品牌化动效是叠加层，不修改业务逻辑。

**建议**: 若 v1-14 尚未合并，Phase 3 应在 v1-14 合并后基于最新 OnboardingSteps 实施，避免 merge conflict。实施前运行 `git log --oneline apps/desktop/renderer/src/features/onboarding/` 确认无并行改动。

### 4. Phase 5 品牌化 Loading 影响范围

**评估**: 影响面广但风险可控。

173 处引用中，实际入口仅两个组件：
- `Spinner.tsx`（primitive，88 行）—— 被 LoadingState 和各 feature 直接引用
- `LoadingState.tsx`（pattern，338 行）—— 对外暴露 4 个 variant

策略正确：仅修改 Spinner 内部 SVG + CSS，保持 `SpinnerProps` 接口不变（`size` / `label`），实现"无感升级"。但需注意：
- 品牌化 Spinner 在 `xs`（12px）尺寸下可能因 SVG 复杂度失真——应在最小尺寸下测试辨识度
- `text-current`（继承父色）机制须保留，品牌化 SVG 不可硬编码颜色
- `animate-spin` 替换为自定义 keyframes 时，需确认所有引用场景的视觉效果（inline、fullscreen、button 内等）

### 5. CSS-only 动效约束

**评估**: 合理，无需 JS 动画库。

所有 Phase 涉及的动效均可 CSS-only 实现：
- Phase 1 渐变：纯 CSS custom property
- Phase 3 步骤切换 slide+fade：`@keyframes` + `animation`
- Phase 3 光点装饰：`::before` / `::after` pseudo-element + `@keyframes`
- Phase 3 confetti 庆祝：CSS `@keyframes` particle 动画（≤ 10 个 pseudo-element）
- Phase 5 Spinner：`stroke-dasharray` / `stroke-dashoffset` + `@keyframes`

**边界场景**: 若 Phase 3 confetti 效果需 > 10 个粒子，CSS pseudo-element 数量有限（每元素仅 `::before` + `::after`），可能需要额外空 `<span>` 作为动画载体。这不违反"CSS-only"约束（不引入 JS 动画库），但应在 T3-3 中明确实现方案。

### 6. 测试方案与视觉验收量化

**评估**: 品牌视觉验收天然难以自动化量化，建议分层策略。

- **可自动化验证**:
  - Token 存在性：`grep` 验证 `--gradient-*` / `--color-accent-50..900` 定义
  - SVG 文件存在与大小：`find` + `wc` + `stat`
  - 组件 prop 接口：单元测试验证 `illustration` prop 渲染
  - 无新 JS 依赖：`git diff package.json`
  - Storybook 构建：CI gate
- **需人工/视觉验收**:
  - 渐变视觉效果是否"品牌化"——依赖 Storybook Story 截图 + Owner 主观判断
  - Spinner 品牌辨识度——尤其 xs/sm 尺寸下
  - Onboarding 动画流畅度——需实际交互验收
  - 暗/亮主题一致性——需 Storybook 双主题对比

**建议**: v1-17 已建立视觉回归 CI（106 张截图），v1-22 应新增品牌元素的截图基线，纳入回归检测。
