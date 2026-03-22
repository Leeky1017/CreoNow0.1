# Tasks: V1-21 性能感知与微交互

- **状态**: 待启动
- **GitHub Issue**: 待创建
- **分支**: `task/<N>-performance-microinteractions`
- **Delta Spec**: `renderer/src/`（虚拟化 + Skeleton + 微交互 + 重渲染优化）
- **上游依赖**: v1-11（LoadingState/Skeleton 标准组件）、v1-12（基础 transition 动效）

---

## 验收标准

| ID    | 标准                                                                                    | 验证方式                                                                 | 结果 | R10 基线                                             |
| ----- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ---- | ---------------------------------------------------- |
| AC-01 | FileTree / AiMessageList / OutlinePanel / SearchResultItems / VersionHistory 使用虚拟化 | `grep "useVirtualizer" renderer/src/` ≥ 5 处                             | 🔲   | 0 处                                                 |
| AC-02 | `@tanstack/react-virtual` 已安装                                                        | `package.json` 依赖检查                                                  | 🔲   | 未安装                                               |
| AC-03 | 1000 节点 FileTree 滚动帧率 ≥ 55fps                                                     | React DevTools Profiler                                                  | 🔲   | N/A（无虚拟化）                                      |
| AC-04 | 500 条 AI 消息滚动帧率 ≥ 55fps                                                          | React DevTools Profiler                                                  | 🔲   | N/A（无虚拟化）                                      |
| AC-05 | ≥ 8 个面板使用定制 Skeleton 形状（非通用矩形）                                          | 人工检查                                                                 | 🔲   | 2 个（Dashboard, Character）                         |
| AC-06 | Skeleton 使用量 ≥ 60 处                                                                 | `grep "Skeleton\|skeleton" src/ --include="*.tsx" \| grep -v test \| wc` | 🔲   | 55 处（全 src/）；22 处（features/）                 |
| AC-07 | 列表项添加/删除有 enter/exit 动画                                                       | 视觉验收                                                                 | 🔲   | 0（无 enter/exit 动效）                              |
| AC-08 | Tab 切换有 crossfade 动效                                                               | 视觉验收                                                                 | 🔲   | 0（无 crossfade）                                    |
| AC-09 | 所有动效时长 ≤ 0.3s                                                                     | CSS 检查 + guard test                                                    | 🔲   | 现有动效均 ≤ 0.3s                                    |
| AC-10 | `prefers-reduced-motion: reduce` 时非必要动画禁用                                       | media query 验证 + guard test                                            | 🔲   | 5 处 CSS 声明 + guard test + `reducedMotion.ts` 工具 |
| AC-11 | Storybook 构建通过                                                                      | `pnpm -C apps/desktop storybook:build`                                   | 🔲   | —                                                    |
| AC-12 | 类型检查通过                                                                            | `pnpm typecheck`                                                         | 🔲   | —                                                    |

---

## Phase 0: 准备

### T0-1: 安装 `@tanstack/react-virtual`

- **文件**: `apps/desktop/package.json`, `pnpm-lock.yaml`
- **动作**: `pnpm -C apps/desktop add @tanstack/react-virtual`
- **验证**: `grep '@tanstack/react-virtual' apps/desktop/package.json` 输出版本号
- **AC**: AC-02

### T0-2: 创建虚拟化 hook 封装

- **文件**: `apps/desktop/renderer/src/hooks/useVirtualList.ts`（新建）
- **动作**: 封装 `useVirtualizer`，统一 `overscan`、`scrollPaddingStart` 等默认参数，支持固定行高与动态测量两种模式
- **测试**: `apps/desktop/renderer/src/hooks/useVirtualList.test.ts`（新建）
- **验证**: 单元测试通过

### T0-3: 创建虚拟化 Storybook story

- **文件**: `apps/desktop/renderer/src/hooks/useVirtualList.stories.tsx`（新建）
- **动作**: 固定行高 1000 项 + 动态行高 500 项 两个 story
- **验证**: Storybook 构建通过

---

## Phase 1: 虚拟滚动（5 个组件）

### T1-1: FileTreePanel 虚拟化

- **文件**: `apps/desktop/renderer/src/features/files/FileTreePanel.tsx`（126 行）
- **文件**: `apps/desktop/renderer/src/features/files/FileTreeNodeRow.tsx`
- **策略**: 固定行高 32px + `useVirtualizer`；树结构扁平化为列表后虚拟化
- **测试**: 现有测试（drag-drop、keyboard-nav、context-menu）不应破坏；新增 ≥100 节点滚动渲染测试
- **风险**: 树节点展开/折叠需重算虚拟化列表长度
- **AC**: AC-01, AC-03

### T1-2: AiMessageList 虚拟化

- **文件**: `apps/desktop/renderer/src/features/ai/AiMessageList.tsx`（431 行）
- **策略**: **动态行高** + `useVirtualizer` + `measureElement`；AI 消息含 Markdown 渲染，高度不可预知
- **测试**: 新增 ≥100 条消息滚动测试；验证 scroll-to-bottom（新消息自动滚动到底部）行为不受影响
- **风险**: 动态测量复杂度高；Markdown 内容异步渲染后高度变化需触发重测量
- **AC**: AC-01, AC-04

### T1-3: OutlinePanel 虚拟化

- **文件**: `apps/desktop/renderer/src/features/outline/OutlinePanel.tsx`（326 行）
- **策略**: 固定行高 32px + `useVirtualizer`
- **测试**: 新增 ≥200 大纲节点渲染测试
- **AC**: AC-01

### T1-4: SearchResultItems 虚拟化

- **文件**: `apps/desktop/renderer/src/features/search/SearchResultItems.tsx`（246 行）
- **策略**: 固定行高 ~48px + `useVirtualizer`
- **测试**: 新增 ≥500 搜索结果渲染测试
- **AC**: AC-01

### T1-5: VersionHistoryPanel 虚拟化

- **文件**: `apps/desktop/renderer/src/features/version-history/VersionHistoryPanel.tsx`（187 行）
- **策略**: 固定行高 ~64px + `useVirtualizer`
- **测试**: 新增 ≥200 版本条目渲染测试
- **AC**: AC-01

---

## Phase 2: Skeleton 铺设

> 当前仅 Dashboard 和 Character 有定制 Skeleton 文件。其余 6 个面板需新建。

### T2-1: FileTree Skeleton

- **文件**: `apps/desktop/renderer/src/features/files/FileTreePanelSkeleton.tsx`（新建）
- **形状**: 3 行 skeleton（icon 圆形 + text 条形），模拟树节点缩进层级
- **集成**: 在 `FileTreePanel.tsx` 的 loading 状态使用
- **测试**: `FileTreePanel.skeleton.test.tsx`（新建）
- **AC**: AC-05, AC-06

### T2-2: OutlinePanel Skeleton

- **文件**: `apps/desktop/renderer/src/features/outline/OutlinePanelSkeleton.tsx`（新建）
- **形状**: 5 行 skeleton，模拟大纲条目的缩进层级（H1/H2/H3）
- **集成**: 在 `OutlinePanelContainer.tsx` 的 loading 状态使用
- **测试**: `OutlinePanel.skeleton.test.tsx`（新建）
- **AC**: AC-05, AC-06

### T2-3: AI Panel Skeleton

- **文件**: `apps/desktop/renderer/src/features/ai/AiPanelSkeleton.tsx`（新建）
- **形状**: 消息 bubble skeleton（圆角容器 + 多行 text + avatar 圆形）
- **集成**: 在 `AiPanel.tsx` 的 loading 状态使用
- **测试**: `AiPanel.skeleton.test.tsx`（新建）
- **AC**: AC-05, AC-06

### T2-4: MemoryPanel Skeleton

- **文件**: `apps/desktop/renderer/src/features/memory/MemoryPanelSkeleton.tsx`（新建）
- **形状**: 记忆条目 skeleton（icon + title + snippet 三行）
- **集成**: 在 `MemoryPanel.tsx`（155 行）的 loading 状态使用
- **测试**: `MemoryPanel.skeleton.test.tsx`（新建）
- **AC**: AC-05, AC-06

### T2-5: KnowledgeGraph Panel Skeleton

- **文件**: `apps/desktop/renderer/src/features/kg/KgPanelSkeleton.tsx`（新建）
- **形状**: 知识图谱 skeleton（节点圆形 + 连线占位 + 列表行）
- **集成**: 在 `KnowledgeGraphPanel.tsx`（147 行）的 loading 状态使用
- **测试**: `KgPanel.skeleton.test.tsx`（新建）
- **AC**: AC-05, AC-06

### T2-6: VersionHistory Skeleton

- **文件**: `apps/desktop/renderer/src/features/version-history/VersionHistoryPanelSkeleton.tsx`（新建）
- **形状**: 版本卡片 skeleton（badge + time + summary 三行）
- **集成**: 在 `VersionHistoryPanel.tsx`（187 行）的 loading 状态使用
- **测试**: `VersionHistoryPanel.skeleton.test.tsx`（新建）
- **AC**: AC-05, AC-06

### T2-7: SearchPanel Skeleton

- **文件**: `apps/desktop/renderer/src/features/search/SearchPanelSkeleton.tsx`（新建）
- **形状**: 搜索结果 skeleton（file path 短条 + match 长条 × 3）
- **集成**: 在 `SearchPanel.tsx`（295 行）的搜索中状态使用
- **测试**: `SearchPanel.skeleton.test.tsx`（新建）
- **AC**: AC-05, AC-06

### T2-8: Dashboard Skeleton 补全

- **文件**: `apps/desktop/renderer/src/features/dashboard/DashboardSkeleton.tsx`（现 26 行）
- **动作**: 补充 stat card skeleton + project card skeleton（当前仅有基础骨架）
- **测试**: 更新 `Dashboard.skeleton.test.tsx`
- **AC**: AC-05, AC-06

---

## Phase 3: 渐进式加载（Suspense + lazy）

### T3-1: 面板级代码分割

- **文件**: `apps/desktop/renderer/src/components/layout/AppShellLeftPanel.tsx`（37 行）
- **文件**: `apps/desktop/renderer/src/components/layout/AppShellRightPanel.tsx`（31 行）
- **文件**: `apps/desktop/renderer/src/components/layout/PanelOrchestrator.tsx`（154 行）
- **动作**: 将各面板组件改为 `React.lazy()` 导入，外包 `<Suspense fallback={<XxxSkeleton />}>`
- **涉及 lazy 化的面板**:
  - `features/files/FileTreePanel.tsx`
  - `features/outline/OutlinePanel.tsx`
  - `features/ai/AiPanel.tsx`
  - `features/memory/MemoryPanel.tsx`
  - `features/kg/KnowledgeGraphPanel.tsx`
  - `features/search/SearchPanel.tsx`
  - `features/version-history/VersionHistoryPanel.tsx`
  - `features/character/CharacterPanel.tsx`
- **测试**: 验证各面板仍能正常渲染；Suspense fallback 展示正确的 Skeleton
- **AC**: AC-06

### T3-2: Dashboard 分步加载

- **文件**: `apps/desktop/renderer/src/features/dashboard/DashboardPage.tsx`
- **文件**: `apps/desktop/renderer/src/features/dashboard/DashboardInternals.tsx`
- **动作**: 先渲染 hero + nav + stat skeleton → 再 lazy 加载项目卡片列表
- **测试**: 验证首屏不出现白屏
- **AC**: AC-06

---

## Phase 4: 微交互动效

> 所有动效使用 CSS transition / animation，不引入 Framer Motion。
> 所有动效时长 ≤ 0.3s。
> 均需尊重 `prefers-reduced-motion`（当前已有全局 `reducedMotion.ts` 工具 + CSS 降级）。

### T4-1: 列表项 enter/exit 动画

- **文件**: `apps/desktop/renderer/src/styles/main.css`（645 行，新增动效 class）
- **文件**: `apps/desktop/renderer/src/components/primitives/ListItem.tsx`（149 行）
- **动作**:
  - 添加 `list-item-enter`：`opacity 0→1` + `translateY -8px→0`（0.2s ease-out）
  - 添加 `list-item-exit`：`opacity 1→0` + `height collapse`（0.15s ease-in）
  - 使用 CSS `@starting-style`（Chromium 117+ 支持，Electron 版本需确认）
- **测试**: guard test 验证 CSS class 存在且时长 ≤ 0.3s
- **AC**: AC-07, AC-09

### T4-2: Tab 内容切换 crossfade

- **文件**: `apps/desktop/renderer/src/features/ai/AiPanelTabBar.tsx`（50 行）
- **文件**: `apps/desktop/renderer/src/features/ai/AiPanel.tsx`（283 行）
- **文件**: `apps/desktop/renderer/src/styles/main.css`
- **动作**: Tab 内容区切换时 `opacity` crossfade（0.15s ease）
- **测试**: 视觉验收 + guard test
- **AC**: AC-08, AC-09

### T4-3: 折叠/展开动效

- **文件**: `apps/desktop/renderer/src/styles/main.css`
- **适用组件**: FileTree 节点展开、OutlinePanel 层级折叠、RightPanel sections
- **动作**: `grid-template-rows: 0fr → 1fr` + `opacity` 过渡（CSS-only，0.2s）
- **测试**: guard test 验证动效时长
- **AC**: AC-09

### T4-4: 数值动效（CountUp）

- **文件**: `apps/desktop/renderer/src/features/dashboard/DashboardInternals.tsx`
- **文件**: `apps/desktop/renderer/src/hooks/useCountUp.ts`（新建）
- **动作**:
  - Dashboard 统计数字：0 → 目标值 CountUp 动画（0.3s ease-out，requestAnimationFrame）
  - 字数统计变化时短暂 highlight（0.3s background flash）
- **测试**: `useCountUp.test.ts`（新建）；使用 fake timer 验证
- **AC**: AC-09

### T4-5: 拖拽视觉反馈

- **文件**: `apps/desktop/renderer/src/features/files/FileTreePanel.tsx`（126 行）
- **文件**: `apps/desktop/renderer/src/styles/main.css`
- **动作**:
  - 拖拽中 ghost 元素：`opacity: 0.7` + `scale(1.02)` + shadow token
  - 拖拽目标位置：`border-top: 2px solid var(--color-accent)` 指示器
- **测试**: 更新 `FileTreePanel.drag-drop.test.tsx`
- **AC**: AC-09

### T4-6: prefers-reduced-motion 增量验证

- **文件**: `apps/desktop/renderer/src/styles/__tests__/reduced-motion-global.guard.test.ts`
- **动作**: 确认新增的所有动效 class 都在 `prefers-reduced-motion: reduce` 时被 `duration: 0ms` 覆盖
- **验证**: guard test 自动检查
- **AC**: AC-10

---

## Phase 5: 重渲染优化

### T5-1: 列表项组件 React.memo

- **文件**: `apps/desktop/renderer/src/features/files/FileTreeNodeRow.tsx`
- **文件**: `apps/desktop/renderer/src/features/ai/AiMessageList.tsx`（内部 message item）
- **文件**: `apps/desktop/renderer/src/features/outline/OutlinePanel.tsx`（内部 outline item）
- **文件**: `apps/desktop/renderer/src/features/search/SearchResultItems.tsx`（内部 result item）
- **文件**: `apps/desktop/renderer/src/features/version-history/VersionHistoryPanel.tsx`（内部 version item）
- **文件**: `apps/desktop/renderer/src/features/memory/MemoryList.tsx`（82 行）
- **动作**: 对 pure 列表项组件包裹 `React.memo`；确保 props 引用稳定
- **测试**: 现有测试不应破坏
- **AC**: AC-03, AC-04

### T5-2: useMemo / useCallback 稳定引用

- **文件**: 同 T5-1 涉及文件
- **动作**: 用 React DevTools Profiler 识别不必要重渲染热点，对 callback props 使用 `useCallback`，对计算结果使用 `useMemo`
- **注意**: 当前 useMemo/useCallback 已有 437 处使用，本任务只新增**有明确 profiler 证据**的优化点，不做盲目 memo
- **AC**: AC-03, AC-04

### T5-3: 帧率 benchmark 验证

- **动作**: 使用 React DevTools Profiler 对以下场景进行 benchmark：
  - 1000 节点 FileTree 快速滚动
  - 500 条 AI 消息快速滚动
  - Dashboard 交互
- **验证**: 帧率 ≥ 55fps
- **AC**: AC-03, AC-04

---

## Phase 6: 集成验证

### T6-1: 全量测试 + lint + typecheck

- **命令**: `pnpm typecheck && pnpm lint && pnpm -C apps/desktop vitest run`
- **AC**: AC-11, AC-12

### T6-2: Storybook 构建

- **命令**: `pnpm -C apps/desktop storybook:build`
- **AC**: AC-11

### T6-3: 视觉验收

- **动作**: 逐一确认 8 个面板的 Skeleton 形状、列表 enter/exit 动画、Tab crossfade、数值 CountUp、拖拽反馈
- **AC**: AC-05, AC-07, AC-08

---

## R10 基线采集（2026-03-22）

| 指标                                              | R10 值                       | 说明                                                                  |
| ------------------------------------------------- | ---------------------------- | --------------------------------------------------------------------- |
| `useVirtualizer` / `@tanstack/react-virtual` 使用 | 0                            | 零虚拟化                                                              |
| `@tanstack/react-virtual` 安装                    | 否                           | `package.json` 无此依赖                                               |
| Skeleton 使用量（`features/` excl test/story）    | 22 处                        | 仅 Dashboard + Character 有定制 Skeleton                              |
| Skeleton 使用量（全 `src/` excl test/story）      | 55 处                        | 含 `components/` 层 Skeleton 组件定义                                 |
| 已有定制 Skeleton 文件                            | 2 个                         | `DashboardSkeleton.tsx`（26行）、`CharacterPanelSkeleton.tsx`（23行） |
| `React.lazy` / `Suspense` 使用                    | 0                            | 无代码分割                                                            |
| `React.memo` 使用                                 | 0                            | 无 memo 化列表项                                                      |
| `useMemo` / `useCallback` 使用                    | 437 处                       | 已有较多使用                                                          |
| CSS transition/animation/@keyframes（`.css`）     | 51 行                        | `main.css` 645 行                                                     |
| motion/animate 使用（`.tsx`/`.ts`）               | 118 处                       | 含 Tailwind class 引用                                                |
| `prefers-reduced-motion` 声明                     | 5 处 CSS + guard test + 工具 | 全局降级已实现                                                        |
| `@starting-style` 使用                            | 0                            | 未采用                                                                |
| Framer Motion 安装                                | 否                           | 策略：CSS-only                                                        |
| **关键组件行数**                                  |                              |                                                                       |
| FileTreePanel.tsx                                 | 126 行                       | 固定行高虚拟化                                                        |
| AiMessageList.tsx                                 | 431 行                       | 动态行高虚拟化（最复杂）                                              |
| OutlinePanel.tsx                                  | 326 行                       | 固定行高虚拟化                                                        |
| SearchResultItems.tsx                             | 246 行                       | 固定行高虚拟化                                                        |
| VersionHistoryPanel.tsx                           | 187 行                       | 固定行高虚拟化                                                        |
| MemoryList.tsx                                    | 82 行                        | memo 优化候选                                                         |
| KgListView.tsx                                    | 219 行                       | memo 优化候选                                                         |

---

## 审计意见

### ⚠️ O-1: 5 个组件虚拟化——OutlinePanel 和 VersionHistory 必要性存疑

**现象**: Proposal 要求对 5 个列表全部虚拟化，但 OutlinePanel（预计最大 200 节点）和 VersionHistory（预计最大 500 版本）的实际数据量可能不足以触发性能瓶颈。200 个 32px 行高 DOM 节点 = 6400px，现代浏览器渲染无压力。

**建议**: 优先实现 FileTree（1000+）、AiMessageList（500+, 动态行高）、SearchResultItems（1000+）三个高优组件。OutlinePanel 和 VersionHistory 可设置阈值（如 >100 项时才启用虚拟化），避免简单场景增加不必要的复杂度。

**风险等级**: Low（过度工程化风险，非阻断）

### ⚠️ O-2: ≥55fps 滚动性能目标——CI 不可自动验证

**现象**: AC-03 和 AC-04 要求 ≥55fps 滚动帧率，但此指标只能通过 React DevTools Profiler 手动测量，无法纳入 CI 自动验证。

**建议**:

1. 帧率验证作为**人工验收步骤**记录在 PR checklist，不作为 CI gate
2. 考虑用 `performance.now()` 写 benchmark 测试脚本，记录渲染时间上限（如 1000 项 FileTree 初始渲染 < 100ms），可纳入 CI
3. 长期可考虑 Playwright + Chrome DevTools Protocol 自动化 fps 检测

**风险等级**: Medium（验收标准不可自动化）

### ✅ O-3: Skeleton ≥60 使用量目标——合理

**现象**: 当前全 `src/` 已有 55 处 Skeleton 引用（含组件定义）。Phase 2 新建 6 个面板 Skeleton + 补全 Dashboard = 预计新增 30-40 处引用，达到 85-95 处，超额完成。

**结论**: 目标合理，可达成。

### ⚠️ O-4: 微交互——`@starting-style` 兼容性需确认

**现象**: T4-1 计划使用 CSS `@starting-style` 实现列表项 enter 动画。此特性 Chromium 117+ 支持。需确认项目 Electron 版本对应的 Chromium 版本。

**建议**: 实施前确认 `apps/desktop/package.json` 中 Electron 版本 → 对应 Chromium 版本 ≥ 117。若不满足，回退到 `animation` + `@keyframes` 方案。

**风险等级**: Low（有可靠回退方案）

### ✅ O-5: `prefers-reduced-motion` 支持——已完善，无需提前

**现象**: Proposal 建议在 Phase 4 处理 reduced-motion。但 R10 基线显示全局 reduced-motion 降级已在 v1-12 完成：

- `main.css` 有 4 处 `@media (prefers-reduced-motion: reduce)` 声明
- `tokens.css` 有 1 处 duration token 归零
- `reducedMotion.ts` 提供 JS 查询工具
- guard test 自动验证覆盖

**结论**: 只需在 T4-6 中确认新增动效 class 被现有全局降级覆盖即可，无需额外工作。

### ⚠️ O-6: Phase 3 Suspense/lazy 代码分割——需评估 Electron 场景收益

**现象**: Electron 应用的代码都在本地，lazy import 的主要收益是减少初始 JS 解析时间，而非网络下载时间。对于 Electron 场景，收益可能不如 Web 应用显著。

**建议**: 实施后用 DevTools Performance 面板对比首屏 Time to Interactive 的实际差异。若改善不显著（< 50ms），可降级为 nice-to-have。

**风险等级**: Low（不会造成负面影响，但投入产出比可能不高）

### 📋 O-7: 任务依赖关系建议

```
Phase 0 (T0-1 ~ T0-3)
  └→ Phase 1 (T1-1 ~ T1-5)  ← 虚拟化 hook 就绪后方可开始
Phase 2 (T2-1 ~ T2-8)         ← 可与 Phase 1 并行
  └→ Phase 3 (T3-1 ~ T3-2)  ← Skeleton 就绪后 Suspense fallback 才有意义
Phase 4 (T4-1 ~ T4-6)         ← 可与 Phase 1/2/3 并行
Phase 5 (T5-1 ~ T5-3)         ← 依赖 Phase 1 虚拟化完成
Phase 6 (T6-1 ~ T6-3)         ← 全部完成后集成验证
```
