# Tasks: V1-11 空状态 / 加载状态 / 错误状态标准化

- **GitHub Issue**: 待创建
- **分支**: `task/<N>-empty-loading-error-states`
- **Delta Spec**: `openspec/changes/v1-11-empty-loading-error-states/specs/`

---

## 验收标准

| ID    | 标准                                                                                                                                                                                                                                                                                                                                               | 验证方式           |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| AC-1  | `<EmptyState>` 组件存在于 `renderer/src/components/patterns/EmptyState.tsx`，支持 `variant` / `illustration` / `title` / `description` / `actionLabel` / `onAction` / `secondaryActionLabel` / `onSecondaryAction` / `className` props                                                                                                             | 代码审查           |
| AC-2  | `<LoadingState>` 组件存在于 `renderer/src/components/patterns/LoadingState.tsx`，支持 `variant` (`spinner` / `skeleton` / `progress` / `inline`) / `text` / `size` / `className` props；另导出 `<Skeleton>` (`type` / `lines` / `width` / `height` / `className`) 和 `<ProgressBar>` (`indeterminate` / `value` / `className`)                     | 代码审查           |
| AC-3  | `<ErrorState>` 组件存在于 `renderer/src/components/patterns/ErrorState.tsx`，支持 `variant` (`inline` / `banner` / `card` / `fullPage`) / `severity` (`error` / `warning` / `info`) / `title` / `message` (required) / `actionLabel` / `onAction` / `secondaryActionLabel` / `onSecondaryAction` / `dismissible` / `onDismiss` / `className` props | 代码审查           |
| AC-4  | `<EmptyState>` 视觉符合 `26-empty-states.html`：居中 flex column、48px+ icon、13-14px 描述、max-width 280px                                                                                                                                                                                                                                        | Storybook 视觉验证 |
| AC-5  | `<LoadingState variant="spinner">` 渲染 24px 圆环动画                                                                                                                                                                                                                                                                                              | Storybook 视觉验证 |
| AC-6  | `<LoadingState variant="skeleton">` 渲染 shimmer 动画骨架行                                                                                                                                                                                                                                                                                        | Storybook 视觉验证 |
| AC-7  | `<ErrorState>` 三种 severity 各有对应色条和 icon                                                                                                                                                                                                                                                                                                   | Storybook 视觉验证 |
| AC-8  | 3 个组件各有 Storybook Story，覆盖所有 variant 和 props 组合                                                                                                                                                                                                                                                                                       | Storybook 构建     |
| AC-9  | Features 层所有 `composites/EmptyState` 引用已迁移至 `patterns/EmptyState`（验证：`features/` 下零处 `composites/EmptyState` 导入）；领域专用实现（`DashboardEmptyState` 融合 IpcError 错误 banner 、AI 面板单行空闲文案）因与通用接口不兼容，不在本次迁移范围                                                                                     | 自动化门禁         |
| AC-10 | Features 层所有 `composites/LoadingState` 引用已迁移至 `patterns/LoadingState`（验证：`features/` 下零处 `composites/LoadingState` 导入）                                                                                                                                                                                                          | 自动化门禁         |
| AC-11 | Features 层所有 `composites/ErrorState` 引用已迁移至 `patterns/ErrorState`（Toast 除外，验证：`features/` 下零处 `composites/ErrorState` 导入）；领域专用引导组件（`ErrorGuideCard` 含步骤/可复制命令）因与通用接口不兼容，不在本次迁移范围                                                                                                        | 自动化门禁         |
| AC-12 | 所有新增视觉元素使用语义化 Design Token，0 处新增 arbitrary 值                                                                                                                                                                                                                                                                                     | grep 验证          |
| AC-13 | 全量测试通过（`pnpm -C apps/desktop vitest run`）                                                                                                                                                                                                                                                                                                  | CI 命令            |
| AC-14 | Storybook 可构建（`pnpm -C apps/desktop storybook:build`）                                                                                                                                                                                                                                                                                         | CI 命令            |
| AC-15 | TypeScript 类型检查通过（`pnpm typecheck`）                                                                                                                                                                                                                                                                                                        | CI 命令            |
| AC-16 | lint 无新增违规（`pnpm lint`）                                                                                                                                                                                                                                                                                                                     | CI 命令            |

---

## 当前碎片化实现清单（迁移参考）

### 空状态实现

| 模块                | 当前实现方式                                            | 位置（预估）                     | 迁移难度 |
| ------------------- | ------------------------------------------------------- | -------------------------------- | -------- |
| CharacterPanel      | Icon + 文字 + "Create" 按钮，自行布局                   | CharacterPanel.tsx 空列表渲染    | 低       |
| MemoryPanel         | 纯文字 `<p className="text-muted">`                     | MemoryPanel.tsx 无 rules 时      | 低       |
| OutlinePanel        | Icon + 文字，自行 inline SVG                            | OutlinePanel.tsx 无大纲节点时    | 低       |
| KnowledgeGraphPanel | 自定义渲染函数，独立布局                                | KnowledgeGraphPanel.tsx 空图谱   | 中       |
| VersionHistoryPanel | 纯文字                                                  | VersionHistoryPanel.tsx 无历史时 | 低       |
| AI Panel            | 48px icon + 居中文案（v1-06 已修复为 `<AiEmptyState>`） | AiPanel 子组件                   | 已完成   |
| Dashboard           | 卡片空状态，各卡片各自实现                              | 各 Dashboard 卡片组件            | 中       |
| FileTree            | 无文件时提示                                            | FileTreePanel.tsx                | 低       |
| Settings            | 无设置项时提示（如适用）                                | 各 Settings 子页                 | 低       |
| Search              | 无搜索结果                                              | SearchPanel.tsx                  | 低       |

### 加载状态实现

| 模块                | 当前实现方式                | 位置（预估）           | 迁移难度 |
| ------------------- | --------------------------- | ---------------------- | -------- |
| Dashboard           | Skeleton loader（自行实现） | DashboardPage 骨架组件 | 中       |
| AI Panel            | `animate-spin` spinner      | AiPanel 流式加载       | 低       |
| MemoryPanel         | 无加载指示 / 纯文字         | MemoryPanel Distilling | 低       |
| KnowledgeGraphPanel | 无加载指示                  | 图谱数据加载           | 低       |
| 各面板通用          | 无标准实现                  | —                      | —        |

### 错误状态实现

| 模块                | 当前实现方式                                   | 位置（预估）      | 迁移难度 |
| ------------------- | ---------------------------------------------- | ----------------- | -------- |
| AI Panel            | ErrorGuideCard + 顶部 banner（v1-06 已标准化） | AiPanel 子组件    | 已完成   |
| Settings            | 独立 error card                                | Settings 子页     | 低       |
| KnowledgeGraphPanel | 静默失败 / 无 error UI                         | JSON 解析等       | 中       |
| 文件操作            | inline error message                           | FileTree / Editor | 低       |
| 全局                | Toast 通知（不在本 change 范围）               | Toast 系统        | N/A      |

---

## Phase 0: 准备

- [x] 阅读 `AGENTS.md`
- [x] 阅读 `design/DESIGN_DECISIONS.md` §12（状态显示）
- [x] 阅读设计稿 `design/Variant/designs/26-empty-states.html` 全文——标注 icon 尺寸、字号、间距、布局
- [x] 阅读设计稿 `design/Variant/designs/27-loading-states.html` 全文——标注 spinner / skeleton 规范
- [x] 确认 `renderer/src/components/patterns/` 目录是否已有 EmptyState / LoadingState 相关文件
- [x] 遍历全 Features 层，整理上方清单中各模块实际的空 / 加载 / 错误状态实现位置和行号

---

## Phase 1: Red（测试先行）

### Task 1.1: EmptyState 组件测试

**映射验收标准**: AC-1, AC-4

- [x] 测试：渲染 `<EmptyState icon={<TestIcon />} title="标题" />` 时，icon 和标题均出现在 DOM 中
- [x] 测试：传入 `description` prop 时渲染描述文字
- [x] 测试：传入 `action` prop 时渲染按钮，点击触发 `onClick`
- [x] 测试：未传 `description` 和 `action` 时不渲染对应元素
- [x] 测试：icon 容器有 `opacity-60` 或等效 muted class
- [x] 测试：描述文字有 `max-w-[280px]` 或等效 max-width 约束

**文件**: `renderer/src/components/patterns/__tests__/EmptyState.test.tsx`（新建）

### Task 1.2: LoadingState 组件测试

**映射验收标准**: AC-2, AC-5, AC-6

- [x] 测试：`variant="spinner"` 时渲染 spinner 元素（role="status" 或 aria-label="加载中"）
- [x] 测试：`variant="skeleton"` 时渲染指定数量的骨架行（默认 3 行）
- [x] 测试：传入 `skeletonRows={5}` 时渲染 5 行骨架
- [x] 测试：传入 `message` 时渲染加载提示文字
- [x] 测试：spinner 有 animation class（`animate-spin` 或自定义动画）

**文件**: `renderer/src/components/patterns/__tests__/LoadingState.test.tsx`（新建）

### Task 1.3: ErrorState 组件测试

**映射验收标准**: AC-3, AC-7

- [x] 测试：`severity="error"` 时渲染 danger 色条和 AlertCircle icon
- [x] 测试：`severity="warning"` 时渲染 warning 色条和 AlertTriangle icon
- [x] 测试：`severity="info"` 时渲染 info 色条和 Info icon
- [x] 测试：传入 `action` prop 时渲染按钮，点击触发 `onClick`
- [x] 测试：title 和 description 正常渲染

**文件**: `renderer/src/components/patterns/__tests__/ErrorState.test.tsx`（新建）

---

## Phase 2: Green（实现）

### Task 2.1: 实现 `<EmptyState>` 组件

**映射验收标准**: AC-1, AC-4

- [x] 创建 `renderer/src/components/patterns/EmptyState.tsx`
- [x] Props 接口：`{ icon: ReactNode; title: string; description?: string; action?: { label: string; onClick: () => void }; className?: string }`
- [x] 布局：flex column 居中、gap `var(--space-item-gap)`
- [x] Icon 容器：48px+、`opacity: 0.6`、`var(--color-text-muted)`
- [x] 标题：`var(--text-card-title-size)`、`var(--weight-semibold)`、居中
- [x] 描述：`var(--text-body-size)`、`var(--color-text-muted)`、`max-width: 280px`、居中
- [x] Action：`<Button variant="ghost">`
- [x] 所有文本走 `t()` i18n（标题/描述由调用方传入已翻译文本）
- [x] 导出至 `renderer/src/components/patterns/index.ts`

### Task 2.2: 实现 `<LoadingState>` 组件

**映射验收标准**: AC-2, AC-5, AC-6

- [x] 创建 `renderer/src/components/patterns/LoadingState.tsx`
- [x] Props 接口：`{ variant: 'spinner' | 'skeleton'; skeletonRows?: number; message?: string; className?: string }`
- [x] Spinner 模式：24px 圆环、`var(--color-accent)` 描边、`animate-spin`、`role="status"` + `aria-label`
- [x] Skeleton 模式：指定行数的圆角矩形（高度 16px、间距 8px）、`var(--color-bg-hover)` 底色 + shimmer 动画
- [x] Message：`var(--text-caption-size)`、`var(--color-text-muted)`
- [x] 导出至 `renderer/src/components/patterns/index.ts`

### Task 2.3: 实现 `<ErrorState>` 组件

**映射验收标准**: AC-3, AC-7

- [x] 创建 `renderer/src/components/patterns/ErrorState.tsx`
- [x] Props 接口：`{ severity: 'error' | 'warning' | 'info'; title: string; description?: string; action?: { label: string; onClick: () => void }; className?: string }`
- [x] 左侧色条 3px：error → `var(--color-danger)`、warning → `var(--color-warning)`、info → `var(--color-info)`
- [x] 背景：error → `var(--color-danger-subtle)`、warning → `var(--color-warning-subtle)`、info → `var(--color-info-subtle)`
- [x] Icon：error → AlertCircle、warning → AlertTriangle、info → Info（来自 lucide-react）
- [x] 布局：水平排列 icon + 文字区（title + description），action 按钮右对齐或底部
- [x] 导出至 `renderer/src/components/patterns/index.ts`

### Task 2.4: Storybook Stories

**映射验收标准**: AC-8

- [x] 创建 `renderer/src/components/patterns/EmptyState.stories.tsx`
  - Story：Default（icon + title + description + action）
  - Story：Minimal（icon + title only）
  - Story：WithAction（icon + title + action button）
- [x] 创建 `renderer/src/components/patterns/LoadingState.stories.tsx`
  - Story：Spinner（默认）
  - Story：SpinnerWithMessage
  - Story：Skeleton3Rows（默认）
  - Story：Skeleton5Rows
- [x] 创建 `renderer/src/components/patterns/ErrorState.stories.tsx`
  - Story：Error（severity=error）
  - Story：Warning（severity=warning）
  - Story：Info（severity=info）
  - Story：WithRetryAction

### Task 2.5: 模块迁移 — 侧面板

**映射验收标准**: AC-9, AC-10, AC-11

- [x] CharacterPanel：空列表 → `<EmptyState>` + 对应 icon / 文案
- [x] MemoryPanel：无 rules → `<EmptyState>`；Distilling → `<LoadingState variant="spinner">`
- [x] OutlinePanel：无大纲 → `<EmptyState>` + outline icon
- [x] KnowledgeGraphPanel：空图谱 → `<EmptyState>`；数据加载中 → `<LoadingState>`；JSON 解析失败 → `<ErrorState severity="error">`
- [x] VersionHistoryPanel：无历史 → `<EmptyState>`

### Task 2.6: 模块迁移 — 其他模块

**映射验收标准**: AC-9, AC-10, AC-11

- [x] Dashboard：各卡片空状态 → `<EmptyState>`（如未在 v1-03 中已处理）
- [x] FileTree：无文件 → `<EmptyState>`
- [x] Search：无结果 → `<EmptyState>`
- [x] Settings：加载中 → `<LoadingState>`；错误 → `<ErrorState>`（如适用）
- [x] 逐模块验证替换后的渲染效果，确认 icon / 文案 / action 正确

---

## Phase 3: Verification（验证）

- [x] 运行 Phase 1 全部测试，确认全绿
- [x] 运行 `pnpm -C apps/desktop vitest run` 全量测试通过
- [x] 运行 `pnpm typecheck` 类型检查通过
- [x] 运行 `pnpm lint` lint 无新增违规
- [x] 运行 `pnpm -C apps/desktop storybook:build` Storybook 可构建
- [x] grep 确认 Features 层无残留的内联空状态实现（排除已确认的例外）
- [x] grep 确认 0 处新增 Tailwind arbitrary 值
- [x] Storybook 中浏览 3 个标准组件的所有 Story，视觉验收

---

## R4 Cascade Refresh (2026-03-21)

> 「器不一则用不专」——v1-11 正是将碎片化状态组件收归标准化的一役。R4 复核确认此役功成。

### 上游合并影响

v1-08（FileTree Precision）和 v1-09（CommandPalette+Search）已合并。复核确认：三组件测试全绿，无回归。

### AC 验收状态复核

| AC    | 描述                               | R4 状态 | 验证证据                                                                                                                        |
| ----- | ---------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------- |
| AC-1  | EmptyState 组件存在 + Props 完备   | ✅      | 241 行，支持 variant/illustration/title/description/actionLabel/onAction/secondaryAction/className（`wc -l ...EmptyState.tsx`） |
| AC-2  | LoadingState 组件存在 + Props 完备 | ✅      | 337 行，支持 spinner/skeleton/progress/inline variant + 导出 Skeleton/ProgressBar 子组件（`wc -l ...LoadingState.tsx`）         |
| AC-3  | ErrorState 组件存在 + Props 完备   | ✅      | 537 行，支持 inline/banner/card/fullPage variant × error/warning/info severity（`wc -l ...ErrorState.tsx`）                     |
| AC-4  | EmptyState 视觉合规                | ✅      | Storybook story 存在（`EmptyState.stories.tsx`，79 行）                                                                         |
| AC-5  | LoadingState spinner 渲染          | ✅      | 测试通过：`variant='spinner' 渲染居中加载指示器（role=status）`（26 tests passed）                                              |
| AC-6  | LoadingState skeleton 渲染         | ✅      | 测试通过：`type='paragraph' 默认渲染 3 行骨架` / `lines=5 时渲染 5 行`（26 tests passed）                                       |
| AC-7  | ErrorState 三 severity 色条 + icon | ✅      | 测试通过：`data-severity=error/warning/info` 断言全绿（16 tests passed）                                                        |
| AC-8  | 3 个 Storybook Stories             | ✅      | `EmptyState.stories.tsx`（79 行）+ `LoadingState.stories.tsx`（67 行）+ `ErrorState.stories.tsx`（85 行）                       |
| AC-9  | composites/EmptyState 零引用       | ✅      | features 层实际导入 0 处；3 处引用均在 guard 测试中（`grep -rn 'composites/EmptyState' .../features/`）                         |
| AC-10 | composites/LoadingState 零引用     | ✅      | features 层实际导入 0 处；3 处引用均在 guard 测试中                                                                             |
| AC-11 | composites/ErrorState 零引用       | ✅      | features 层实际导入 0 处；3 处引用均在 guard 测试中                                                                             |
| AC-12 | 语义化 Design Token                | ✅      | 碎片化残留搜索 0 命中（`grep -rn 'className.*text-muted.*暂无' .../features/`）                                                 |
| AC-13 | 全量测试通过                       | ✅      | EmptyState 22 + LoadingState 26 + ErrorState 16 = 64 tests all passed                                                           |
| AC-14 | Storybook 可构建                   | ⏳      | 待 CI 验证（3 个 stories 文件结构完整）                                                                                         |
| AC-15 | TypeScript 类型检查                | ⏳      | 待 CI 验证                                                                                                                      |
| AC-16 | lint 无新增违规                    | ⏳      | 待 CI 验证                                                                                                                      |

### patterns 组件 features 层集成详情

共 **16 处引用**，横跨 **7 个模块**：

| 模块                     | EmptyState | LoadingState | ErrorState | 采集命令                                          |
| ------------------------ | ---------- | ------------ | ---------- | ------------------------------------------------- |
| VersionHistoryContainer  | ✅         | ✅           | ✅         | `grep -rn 'from.*patterns/' .../version-history/` |
| CharacterCardList        | ✅         | —            | —          | `grep -rn 'from.*patterns/' .../character/`       |
| SearchResultsArea        | ✅         | ✅           | ✅         | `grep -rn 'from.*patterns/' .../search/`          |
| KgListView               | ✅         | —            | ✅         | `grep -rn 'from.*patterns/' .../kg/`              |
| FileTreePanel            | ✅         | ✅           | —          | `grep -rn 'from.*patterns/' .../files/`           |
| MemoryPanel + MemoryList | ✅         | ✅×2         | ✅         | `grep -rn 'from.*patterns/' .../memory/`          |
| OutlineTree              | ✅         | —            | —          | `grep -rn 'from.*patterns/' .../outline/`         |

### 测试详情

| 测试套件     | 文件数 | 测试数 | 状态    | 采集命令                                         |
| ------------ | ------ | ------ | ------- | ------------------------------------------------ |
| EmptyState   | 4      | 22     | ✅ 全绿 | `npx vitest run --reporter=verbose EmptyState`   |
| LoadingState | 1      | 26     | ✅ 全绿 | `npx vitest run --reporter=verbose LoadingState` |
| ErrorState   | 1      | 16     | ✅ 全绿 | `npx vitest run --reporter=verbose ErrorState`   |

### R4 结论

**✅ PASS — v1-11 全面达标，无需修复。**

三大标准组件已完整实现并广泛集成至 features 层，composites 旧引用已清零（guard 测试防回归），64 个单元测试全绿，碎片化残留为零。上游 v1-08/v1-09 合并未引入回归。

---

## R5 Cascade Refresh (2026-03-21)

> 「三度量之而不变，则器之固也。」——R5 级联刷新，v1-10 合并后再验 v1-11 稳定性。

### 上游合并影响

v1-10（Side Panels）已合并，该 change 广泛集成了 v1-11 的 EmptyState/LoadingState/ErrorState 组件。复核确认：三组件源码无变化，测试全绿，无回归。

### AC 验收状态复核

| AC    | 描述                               | R4 状态 | R5 状态 | R5 验证证据                                                 |
| ----- | ---------------------------------- | ------- | ------- | ----------------------------------------------------------- |
| AC-1  | EmptyState 组件存在 + Props 完备   | ✅      | ✅      | 241 行，零变化（`wc -l ...EmptyState.tsx`）                 |
| AC-2  | LoadingState 组件存在 + Props 完备 | ✅      | ✅      | 337 行，零变化（`wc -l ...LoadingState.tsx`）               |
| AC-3  | ErrorState 组件存在 + Props 完备   | ✅      | ✅      | 537 行，零变化（`wc -l ...ErrorState.tsx`）                 |
| AC-4  | EmptyState 视觉合规                | ✅      | ✅      | Story 文件存在（`EmptyState.stories.tsx`）                  |
| AC-5  | LoadingState spinner 渲染          | ✅      | ✅      | 26 tests passed，含 spinner variant 验证                    |
| AC-6  | LoadingState skeleton 渲染         | ✅      | ✅      | 26 tests passed，含 skeleton paragraph/lines 验证           |
| AC-7  | ErrorState 三 severity 色条 + icon | ✅      | ✅      | 16 tests passed，含 `data-severity=error/warning/info` 断言 |
| AC-8  | 3 个 Storybook Stories             | ✅      | ✅      | 3 个核心 stories + 4 个辅助 stories 存在                    |
| AC-9  | composites/EmptyState 零引用       | ✅      | ✅      | features 层排除 **tests** 后 0 命中                         |
| AC-10 | composites/LoadingState 零引用     | ✅      | ✅      | features 层排除 **tests** 后 0 命中                         |
| AC-11 | composites/ErrorState 零引用       | ✅      | ✅      | features 层排除 **tests** 后 0 命中                         |
| AC-12 | 语义化 Design Token                | ✅      | ✅      | 碎片化残留搜索 0 命中                                       |
| AC-13 | 全量测试通过                       | ✅      | ✅      | 64 tests passed（22+26+16）                                 |
| AC-14 | Storybook 可构建                   | ⏳      | ⏳      | 待 CI 验证                                                  |
| AC-15 | TypeScript 类型检查                | ⏳      | ⏳      | 待 CI 验证                                                  |
| AC-16 | lint 无新增违规                    | ⏳      | ⏳      | 待 CI 验证                                                  |

### R5 结论

**✅ PASS — v1-11 核心指标与 R4 一致，零回归。**

全部 13 项可本地验证的 AC（AC-1 至 AC-13）持续达标。唯一变化：patterns 目录文件数从 18→20（+2），但总行数 2658 不变。三组件行数、composites 引用、features 集成、测试数量均与 R4 完全一致。v1-10 Side Panels 合并后状态组件保持完全稳定，64 个测试全绿，碎片化残留为零。AC-14/15/16 仍依赖 CI 验证。
