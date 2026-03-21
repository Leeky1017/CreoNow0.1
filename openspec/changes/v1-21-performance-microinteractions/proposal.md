# V1-21 性能感知与微交互

- **GitHub Issue**: 待创建
- **所属任务簇**: V1（视觉重塑）— Wave 7 质量纵深
- **umbrella**: v1-00-visual-overhaul-program
- **涉及模块**: Features 层（长列表组件）、patterns（LoadingState/Skeleton 扩展）、renderer/styles
- **前端验收**: 需要（性能 benchmark + Skeleton 视觉验收 + 动效视觉验收 + Storybook 构建通过）

---

## Why：为什么必须做

### 1. 用户现象

CreoNow 的功能逻辑和视觉设计在 v1-01 到 v1-16 后已趋近完善，但用户体验的"最后一公里"——感知性能与微交互——仍有明显短板：

**长列表性能**：

当前零虚拟化实现（`grep -r "virtual" renderer/src/ --include="*.tsx"` → 0 匹配）。以下场景存在性能风险：

- **FileTree**：大型项目可能有 1000+ 文件节点，全量 DOM 渲染
- **AI 消息列表**：长对话可能有 500+ 条消息，每条含 Markdown 渲染
- **OutlinePanel**：长文档可能有 200+ 大纲节点
- **SearchResultItems**：全文搜索可能返回 1000+ 结果
- **Version History**：频繁保存的文档可能有 500+ 版本

虽然当前测试数据量下感知正常，但生产数据量下这些列表将产生明显的滚动卡顿和首次渲染延迟。

**Skeleton 覆盖不足**：

Features 层仅有 22 处 Skeleton 引用（`grep "Skeleton\|skeleton" features/ --include="*.tsx" | grep -v test | wc`），v1-11 定义了 `<LoadingState variant="skeleton">`，但实际铺开到各面板的覆盖率不高——多数面板仍使用 spinner 或纯文本 "加载中..."。

**微交互缺失**：

v1-12 铺设了基础 transition 动效（0.2-0.3s hover 过渡），但缺少让界面"活起来"的微交互：

- 列表项完成/删除时无动画（直接消失）
- 切换状态无过渡（如 Dashboard 卡片视图切换、AI 面板 tab 切换的内容区域）
- 数字变化无动画（如 Dashboard 统计数字、字数统计）
- 拖拽操作无视觉反馈（拖拽中的 ghost 元素、目标位置指示器）

### 2. 根因

- **虚拟化成本**：引入虚拟化需要固定行高或动态测量，对 Tailwind 布局有侵入性——开发过程中被归为"优化"推后
- **Skeleton 未铺开**：v1-11 只在 pattern 层定义了标准组件，各 Feature 的迁移在 v1-11 scope 中仅做了部分替换
- **微交互非功能性**：微交互不影响功能正确性，在 TDD 流程中容易被跳过

### 3. 威胁

- **规模化性能崩塌**：用户积累 6 个月的创作数据后，FileTree 1000+ 节点、AI 对话 500+ 消息——此时才发现卡顿，修复成本远高于预防
- **品质感知差距**：微交互是 Notion / Linear / Cursor 等竞品的标志性特征——缺少微交互的界面会被感知为"半成品"
- **加载体验断层**：首次打开项目时各面板同时 loading，如果全是 spinner 旋转而非 skeleton 骨架，用户感知的等待时间会更长

### 4. 证据来源

| 数据点                  | 值                        | 来源                                                                 |
| ----------------------- | ------------------------- | -------------------------------------------------------------------- |
| 虚拟化库引用            | 0                         | `grep -r "virtual" renderer/src/ --include="*.tsx" --include="*.ts"` |
| Skeleton 使用量         | 22 处                     | `grep "Skeleton\|skeleton" features/ --include="*.tsx"`              |
| 最大组件行数            | 624（SkillManagerDialog） | `wc -l`                                                              |
| AI 消息列表行数         | 432                       | `wc -l AiMessageList.tsx`                                            |
| transition/animate 使用 | ~50 处                    | `grep -rc "transition-\|animate-" features/`                         |
| Framer Motion 依赖      | 未安装                    | `package.json` 检查                                                  |

---

## What：做什么

### Phase 1：长列表虚拟化

引入 `@tanstack/react-virtual` 对以下列表实现虚拟滚动：

| 组件                | 预计最大数据量 | 固定行高 | 实现策略                    |
| ------------------- | -------------- | -------- | --------------------------- |
| FileTree            | 1000+ 节点     | 32px     | `useVirtualizer` + 固定行高 |
| AiMessageList       | 500+ 消息      | 可变     | `useVirtualizer` + 动态测量 |
| OutlinePanel        | 200+ 节点      | 32px     | `useVirtualizer` + 固定行高 |
| SearchResultItems   | 1000+ 结果     | ~48px    | `useVirtualizer` + 固定行高 |
| VersionHistory 列表 | 500+ 版本      | ~64px    | `useVirtualizer` + 固定行高 |

技术选型：`@tanstack/react-virtual`——体积小（~3KB gzipped）、无侵入性、支持固定和动态行高。

### Phase 2：Skeleton 全面铺开

将 v1-11 的 `<LoadingState variant="skeleton">` 推广到所有面板的首次加载状态：

| 面板           | 当前加载方式     | 目标                                            |
| -------------- | ---------------- | ----------------------------------------------- |
| FileTree       | spinner          | 3 行 skeleton（icon + text 形状）               |
| OutlinePanel   | 无 / 空白        | 5 行 skeleton（缩进层级形状）                   |
| AI Panel       | spinner          | 消息 bubble skeleton（圆角 + 多行 text）        |
| CharacterPanel | spinner          | 角色卡片 skeleton（avatar + name + desc）       |
| MemoryPanel    | "加载中..." 文本 | 记忆条目 skeleton（icon + title + snippet）     |
| KG Panel       | spinner          | 知识图谱 skeleton（节点 + 连线占位）            |
| VersionHistory | spinner          | 版本卡片 skeleton（badge + time + summary）     |
| Dashboard      | 已有部分         | 补充 stat card skeleton + project card skeleton |

每个 skeleton 形状需匹配该面板的实际布局结构（不是通用矩形）。

### Phase 3：Progressive Loading

实现分步加载策略，减少首屏白屏时间：

- Dashboard：先渲染 hero + nav skeleton → 再加载项目卡片
- Editor：先渲染工具栏 + 空编辑区 → 再加载文档内容
- Side panels：先渲染 panel header → 再加载面板内容

使用 React `Suspense` + lazy import 实现面板级代码分割。

### Phase 4：微交互铺设

**列表动效**：

- 列表项添加/删除：`opacity 0→1` + `translateY -8px→0` / `opacity 1→0` + `height collapse`，使用 CSS `@starting-style` + `transition`（无需 Framer Motion）
- 列表项重排序：`transform` 过渡（拖拽排序场景）

**状态切换动效**：

- Tab 内容切换：`opacity` crossfade（0.15s）
- 折叠/展开：`grid-template-rows: 0fr → 1fr` + `opacity`（CSS-only）
- Toggle 切换：`transform: translateX` + 背景色过渡

**数值动效**：

- Dashboard 统计数字：CountUp 动画（0 → 目标值，0.5s ease-out）
- 字数统计：数值变化时短暂 highlight（0.3s background flash）

**拖拽反馈**：

- 拖拽中的 ghost 元素：`opacity: 0.7` + `scale(1.02)` + `shadow-lg`
- 拖拽目标位置：`border-top: 2px solid var(--color-accent)` 指示器

**实现约束**：

- 优先使用 CSS transition / animation，不引入 Framer Motion
- 所有动效时长 ≤ 0.3s（遵循 `DESIGN_DECISIONS.md` §3.10 动效系统）
- 尊重 `prefers-reduced-motion: reduce`——有此偏好时禁用所有非必要动画

### Phase 5：重渲染优化

- 使用 React DevTools Profiler 识别不必要的重渲染
- 关键优化点：`React.memo` 用于 pure 列表项组件、`useMemo` / `useCallback` 稳定引用
- 目标：Dashboard 页面交互帧率 ≥ 55fps

---

## Non-Goals：不做什么

1. **不做 Web Worker 离线计算**——计算密集任务（如 KG 构建）在 Electron 主进程处理，不在渲染进程优化
2. **不做 SSR / 预渲染**——Electron 应用无 SSR 需求
3. **不引入 Framer Motion**——保持 CSS-only 动效策略，避免增加打包体积
4. **不做全量 bundle 优化**——bundle size 优化是独立的工程任务
5. **不修改现有组件 API**——虚拟化和 Skeleton 作为内部实现细节，不改变组件对外行为

---

## AC：验收标准

| #   | 验收条件                                                                                | 验证方式                                     |
| --- | --------------------------------------------------------------------------------------- | -------------------------------------------- |
| 1   | FileTree / AiMessageList / OutlinePanel / SearchResultItems / VersionHistory 使用虚拟化 | `grep "useVirtualizer" renderer/src/` ≥ 5 处 |
| 2   | `@tanstack/react-virtual` 已安装                                                        | `package.json` 依赖检查                      |
| 3   | 1000 节点 FileTree 滚动帧率 ≥ 55fps                                                     | React DevTools Profiler benchmark            |
| 4   | 500 条 AI 消息滚动帧率 ≥ 55fps                                                          | benchmark                                    |
| 5   | ≥ 8 个面板使用定制 Skeleton 形状（非通用矩形）                                          | 人工检查                                     |
| 6   | Skeleton 使用量 ≥ 60 处（当前 22 处 → 新增 ≥ 38 处）                                    | `grep "Skeleton\|skeleton" features/ \| wc`  |
| 7   | 列表项添加/删除有 enter/exit 动画                                                       | 视觉验收                                     |
| 8   | Tab 切换有 crossfade 动效                                                               | 视觉验收                                     |
| 9   | 所有动效时长 ≤ 0.3s                                                                     | CSS 检查                                     |
| 10  | `prefers-reduced-motion: reduce` 时非必要动画禁用                                       | media query 验证                             |
| 11  | Storybook 构建通过                                                                      | CI gate                                      |
| 12  | 类型检查通过                                                                            | CI gate                                      |

---

## 依赖与影响

- **上游依赖**: v1-11（EmptyState/LoadingState/ErrorState 标准组件）—— Skeleton 推广依赖 v1-11 的 `<LoadingState>` 组件；v1-12（基础 transition 动效）—— 微交互建立在 v1-12 的 transition 基础设施之上
- **被依赖于**: 无直接下游；但虚拟化和 Skeleton 的铺设为后续 feature 开发提供性能基线
- **并行安全**: 虚拟化改造修改组件内部渲染逻辑，不适合与其他修改同一组件的 change 并行
- **风险**:
  - 虚拟化引入固定行高约束——变高行（如 AI 消息的 Markdown 渲染）需要动态测量，实现复杂度高
  - Skeleton 形状需匹配实际布局——布局变更时 Skeleton 也需同步更新
  - CSS `@starting-style` 浏览器兼容性——Electron 使用 Chromium，应无问题，但需确认版本
- **预估工作量**: 约 v1-02 的 **1.2 倍**——虚拟化需要逐组件适配（固定行高简单、变高复杂），Skeleton 定制化需要设计，微交互需要视觉调优。Phase 1 虚拟化约 3d，Phase 2 Skeleton 约 2d，Phase 3 Progressive 约 1d，Phase 4 微交互约 2d，Phase 5 重渲染约 1d

---

## R6 级联刷新记录（2026-03-22）

### 刷新触发

v1-12 已于 2026-03-22 合并（PR #1213）。v1-12 Part A 为 v1-21 补齐了基础动效设施。

### R6 基线重采集

| 度量                      | 原始基线 | R6 实际 | Delta | 说明                                                    |
| ------------------------- | -------- | ------- | ----- | ------------------------------------------------------- |
| transition utility 使用点 | 0        | 11      | +11   | `transition-default` / `transition-slow` 已进入生产文件 |
| scroll-shadow 使用点      | 2        | 14      | +12   | `scroll-shadow-y` 已铺设到主要滚动容器                  |
| prefers-reduced-motion    | 0        | 1       | +1    | 全局降级已实现                                          |
| Virtual scrolling         | 0        | 0       | —     | 仍未实现，依旧是 v1-21 核心任务                         |

### 对 v1-21 scope 的影响

**部分 AC 已提前推进**：

- CSS transition 基础设施已建立（v1-12 Part A）
- scroll-shadow 已全面铺设
- prefers-reduced-motion 已实现

**仍需 v1-21 完成的核心工作**：

- Virtual scrolling（@tanstack/react-virtual）：0 实现 → 5+ 组件
- Skeleton loading states：37→60+（+23 处）
- Suspense + lazy import（panel code splitting）
- 微交互打磨（list enter/exit animation, tab crossfade, numeric countup, drag ghost）
- Render optimization（React.memo, useMemo/useCallback）

### 结论

**PASS** — v1-12 已把“基础动效设施”这层地基夯实，但 v1-21 的虚拟滚动、懒加载与高级微交互仍需独立实施。「根基既固，层台方可续筑。」
