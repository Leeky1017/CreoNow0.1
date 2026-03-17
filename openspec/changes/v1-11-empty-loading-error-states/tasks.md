# Tasks: V1-11 空状态 / 加载状态 / 错误状态标准化

- **GitHub Issue**: 待创建
- **分支**: `task/<N>-empty-loading-error-states`
- **Delta Spec**: `openspec/changes/v1-11-empty-loading-error-states/specs/`

---

## 验收标准

| ID    | 标准                                                                                                                                                                   | 验证方式           |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| AC-1  | `<EmptyState>` 组件存在于 `renderer/src/components/patterns/EmptyState.tsx`，支持 `icon` / `title` / `description` / `action` props                                    | 代码审查           |
| AC-2  | `<LoadingState>` 组件存在于 `renderer/src/components/patterns/LoadingState.tsx`，支持 `variant` (`spinner` / `skeleton`) / `skeletonRows` / `message` props            | 代码审查           |
| AC-3  | `<ErrorState>` 组件存在于 `renderer/src/components/patterns/ErrorState.tsx`，支持 `severity` (`error` / `warning` / `info`) / `title` / `description` / `action` props | 代码审查           |
| AC-4  | `<EmptyState>` 视觉符合 `26-empty-states.html`：居中 flex column、48px+ icon、13-14px 描述、max-width 280px                                                            | Storybook 视觉验证 |
| AC-5  | `<LoadingState variant="spinner">` 渲染 24px 圆环动画                                                                                                                  | Storybook 视觉验证 |
| AC-6  | `<LoadingState variant="skeleton">` 渲染 shimmer 动画骨架行                                                                                                            | Storybook 视觉验证 |
| AC-7  | `<ErrorState>` 三种 severity 各有对应色条和 icon                                                                                                                       | Storybook 视觉验证 |
| AC-8  | 3 个组件各有 Storybook Story，覆盖所有 variant 和 props 组合                                                                                                           | Storybook 构建     |
| AC-9  | 全 Features 层原有碎片化空状态已替换为 `<EmptyState>`                                                                                                                  | grep 验证          |
| AC-10 | 全 Features 层原有碎片化加载状态已替换为 `<LoadingState>`                                                                                                              | grep 验证          |
| AC-11 | 全 Features 层原有碎片化错误状态已替换为 `<ErrorState>`（Toast 除外）                                                                                                  | grep 验证          |
| AC-12 | 所有新增视觉元素使用语义化 Design Token，0 处新增 arbitrary 值                                                                                                         | grep 验证          |
| AC-13 | 全量测试通过（`pnpm -C apps/desktop vitest run`）                                                                                                                      | CI 命令            |
| AC-14 | Storybook 可构建（`pnpm -C apps/desktop storybook:build`）                                                                                                             | CI 命令            |
| AC-15 | TypeScript 类型检查通过（`pnpm typecheck`）                                                                                                                            | CI 命令            |
| AC-16 | lint 无新增违规（`pnpm lint`）                                                                                                                                         | CI 命令            |

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

- [ ] 阅读 `AGENTS.md`
- [ ] 阅读 `design/DESIGN_DECISIONS.md` §12（状态显示）
- [ ] 阅读设计稿 `design/Variant/designs/26-empty-states.html` 全文——标注 icon 尺寸、字号、间距、布局
- [ ] 阅读设计稿 `design/Variant/designs/27-loading-states.html` 全文——标注 spinner / skeleton 规范
- [ ] 确认 `renderer/src/components/patterns/` 目录是否已有 EmptyState / LoadingState 相关文件
- [ ] 遍历全 Features 层，整理上方清单中各模块实际的空 / 加载 / 错误状态实现位置和行号

---

## Phase 1: Red（测试先行）

### Task 1.1: EmptyState 组件测试

**映射验收标准**: AC-1, AC-4

- [ ] 测试：渲染 `<EmptyState icon={<TestIcon />} title="标题" />` 时，icon 和标题均出现在 DOM 中
- [ ] 测试：传入 `description` prop 时渲染描述文字
- [ ] 测试：传入 `action` prop 时渲染按钮，点击触发 `onClick`
- [ ] 测试：未传 `description` 和 `action` 时不渲染对应元素
- [ ] 测试：icon 容器有 `opacity-60` 或等效 muted class
- [ ] 测试：描述文字有 `max-w-[280px]` 或等效 max-width 约束

**文件**: `renderer/src/components/patterns/__tests__/EmptyState.test.tsx`（新建）

### Task 1.2: LoadingState 组件测试

**映射验收标准**: AC-2, AC-5, AC-6

- [ ] 测试：`variant="spinner"` 时渲染 spinner 元素（role="status" 或 aria-label="加载中"）
- [ ] 测试：`variant="skeleton"` 时渲染指定数量的骨架行（默认 3 行）
- [ ] 测试：传入 `skeletonRows={5}` 时渲染 5 行骨架
- [ ] 测试：传入 `message` 时渲染加载提示文字
- [ ] 测试：spinner 有 animation class（`animate-spin` 或自定义动画）

**文件**: `renderer/src/components/patterns/__tests__/LoadingState.test.tsx`（新建）

### Task 1.3: ErrorState 组件测试

**映射验收标准**: AC-3, AC-7

- [ ] 测试：`severity="error"` 时渲染 danger 色条和 AlertCircle icon
- [ ] 测试：`severity="warning"` 时渲染 warning 色条和 AlertTriangle icon
- [ ] 测试：`severity="info"` 时渲染 info 色条和 Info icon
- [ ] 测试：传入 `action` prop 时渲染按钮，点击触发 `onClick`
- [ ] 测试：title 和 description 正常渲染

**文件**: `renderer/src/components/patterns/__tests__/ErrorState.test.tsx`（新建）

---

## Phase 2: Green（实现）

### Task 2.1: 实现 `<EmptyState>` 组件

**映射验收标准**: AC-1, AC-4

- [ ] 创建 `renderer/src/components/patterns/EmptyState.tsx`
- [ ] Props 接口：`{ icon: ReactNode; title: string; description?: string; action?: { label: string; onClick: () => void }; className?: string }`
- [ ] 布局：flex column 居中、gap `var(--space-item-gap)`
- [ ] Icon 容器：48px+、`opacity: 0.6`、`var(--color-text-muted)`
- [ ] 标题：`var(--text-card-title-size)`、`var(--weight-semibold)`、居中
- [ ] 描述：`var(--text-body-size)`、`var(--color-text-muted)`、`max-width: 280px`、居中
- [ ] Action：`<Button variant="ghost">`
- [ ] 所有文本走 `t()` i18n（标题/描述由调用方传入已翻译文本）
- [ ] 导出至 `renderer/src/components/patterns/index.ts`

### Task 2.2: 实现 `<LoadingState>` 组件

**映射验收标准**: AC-2, AC-5, AC-6

- [ ] 创建 `renderer/src/components/patterns/LoadingState.tsx`
- [ ] Props 接口：`{ variant: 'spinner' | 'skeleton'; skeletonRows?: number; message?: string; className?: string }`
- [ ] Spinner 模式：24px 圆环、`var(--color-accent)` 描边、`animate-spin`、`role="status"` + `aria-label`
- [ ] Skeleton 模式：指定行数的圆角矩形（高度 16px、间距 8px）、`var(--color-bg-hover)` 底色 + shimmer 动画
- [ ] Message：`var(--text-caption-size)`、`var(--color-text-muted)`
- [ ] 导出至 `renderer/src/components/patterns/index.ts`

### Task 2.3: 实现 `<ErrorState>` 组件

**映射验收标准**: AC-3, AC-7

- [ ] 创建 `renderer/src/components/patterns/ErrorState.tsx`
- [ ] Props 接口：`{ severity: 'error' | 'warning' | 'info'; title: string; description?: string; action?: { label: string; onClick: () => void }; className?: string }`
- [ ] 左侧色条 3px：error → `var(--color-danger)`、warning → `var(--color-warning)`、info → `var(--color-info)`
- [ ] 背景：error → `var(--color-danger-subtle)`、warning → `var(--color-warning-subtle)`、info → `var(--color-info-subtle)`
- [ ] Icon：error → AlertCircle、warning → AlertTriangle、info → Info（来自 lucide-react）
- [ ] 布局：水平排列 icon + 文字区（title + description），action 按钮右对齐或底部
- [ ] 导出至 `renderer/src/components/patterns/index.ts`

### Task 2.4: Storybook Stories

**映射验收标准**: AC-8

- [ ] 创建 `renderer/src/components/patterns/EmptyState.stories.tsx`
  - Story：Default（icon + title + description + action）
  - Story：Minimal（icon + title only）
  - Story：WithAction（icon + title + action button）
- [ ] 创建 `renderer/src/components/patterns/LoadingState.stories.tsx`
  - Story：Spinner（默认）
  - Story：SpinnerWithMessage
  - Story：Skeleton3Rows（默认）
  - Story：Skeleton5Rows
- [ ] 创建 `renderer/src/components/patterns/ErrorState.stories.tsx`
  - Story：Error（severity=error）
  - Story：Warning（severity=warning）
  - Story：Info（severity=info）
  - Story：WithRetryAction

### Task 2.5: 模块迁移 — 侧面板

**映射验收标准**: AC-9, AC-10, AC-11

- [ ] CharacterPanel：空列表 → `<EmptyState>` + 对应 icon / 文案
- [ ] MemoryPanel：无 rules → `<EmptyState>`；Distilling → `<LoadingState variant="spinner">`
- [ ] OutlinePanel：无大纲 → `<EmptyState>` + outline icon
- [ ] KnowledgeGraphPanel：空图谱 → `<EmptyState>`；数据加载中 → `<LoadingState>`；JSON 解析失败 → `<ErrorState severity="error">`
- [ ] VersionHistoryPanel：无历史 → `<EmptyState>`

### Task 2.6: 模块迁移 — 其他模块

**映射验收标准**: AC-9, AC-10, AC-11

- [ ] Dashboard：各卡片空状态 → `<EmptyState>`（如未在 v1-03 中已处理）
- [ ] FileTree：无文件 → `<EmptyState>`
- [ ] Search：无结果 → `<EmptyState>`
- [ ] Settings：加载中 → `<LoadingState>`；错误 → `<ErrorState>`（如适用）
- [ ] 逐模块验证替换后的渲染效果，确认 icon / 文案 / action 正确

---

## Phase 3: Verification（验证）

- [ ] 运行 Phase 1 全部测试，确认全绿
- [ ] 运行 `pnpm -C apps/desktop vitest run` 全量测试通过
- [ ] 运行 `pnpm typecheck` 类型检查通过
- [ ] 运行 `pnpm lint` lint 无新增违规
- [ ] 运行 `pnpm -C apps/desktop storybook:build` Storybook 可构建
- [ ] grep 确认 Features 层无残留的内联空状态实现（排除已确认的例外）
- [ ] grep 确认 0 处新增 Tailwind arbitrary 值
- [ ] Storybook 中浏览 3 个标准组件的所有 Story，视觉验收
