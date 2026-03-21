# V1-11 空状态 / 加载状态 / 错误状态标准化

- **GitHub Issue**: 待创建
- **所属任务簇**: V1（视觉重塑）— Wave 4 面板 + 收口
- **umbrella**: v1-00-visual-overhaul-program
- **涉及模块**: patterns（新建）、全 Features 层（迁移）
- **前端验收**: 需要（标准组件 Storybook Story + 全模块迁移验证 + Storybook 构建通过）

---

## Why：为什么必须做

### 1. 用户现象

全应用的空状态、加载状态、错误状态实现碎片化——用户在不同面板遇到相同的"无数据"情境，却看到截然不同的视觉表达。正如一座建筑中，每间房间的"请勿打扰"牌设计各异——「器不一则用不专，用不专则心不安。」

**空状态碎片化（至少 5 种实现）**：

- 纯文字型：`<p className="text-muted">暂无内容</p>`（MemoryPanel）
- Icon + 文字型：自行内联 SVG + 文字（OutlinePanel）
- Icon + 文字 + 按钮型：三元素垂直布局但每处间距不同（CharacterPanel）
- 自定义布局型：KnowledgeGraphPanel 有独立的 empty state 渲染函数
- 无处理型：部分列表空时直接渲染空 `<div>`

**加载状态碎片化（3 种实现）**：

- Spinner 型：`<div className="animate-spin" />`（各面板各自实现）
- Skeleton 型：仅 Dashboard 有骨架屏，其余面板无
- 文字型：`"加载中..."` 纯文本（部分功能模块）

**错误状态碎片化（4 种实现）**：

- 红色 Banner 型：顶部固定红色条（AI 面板）
- Card 型：带 icon 的错误卡片（Settings）
- Toast 型：右下角弹出（全局）
- Inline 型：在内容区直接渲染错误消息（各面板零散实现）

### 2. 根因

缺少标准化的状态组件。设计稿 `26-empty-states.html` 和 `27-loading-states.html` 明确定义了统一规范——居中 flex column、48px+ icon（opacity 0.6）、13-14px 描述文字、max-width 约束——但开发过程中各模块自行实现，无人将设计稿规范落地为可复用组件。

### 3. 威胁

- **品牌一致性**：5 种空状态 × 3 种加载状态 × 4 种错误状态 = 视觉语言无从建立
- **维护成本**：修改空状态设计需在 10+ 处逐一修改，遗漏概率高
- **v1-10 阻塞**：侧面板视觉统一（v1-10）依赖标准状态组件，否则 5 个面板继续各写各的空状态

### 4. 证据来源

| 数据点              | 值                                  | 来源                                      |
| ------------------- | ----------------------------------- | ----------------------------------------- |
| 空状态实现方式      | ≥5 种                               | grep 各面板空状态渲染代码                 |
| 加载状态实现方式    | ≥3 种                               | grep `animate-spin`、skeleton、加载中     |
| 错误状态实现方式    | ≥4 种                               | grep error banner / card / toast / inline |
| 设计稿空状态规范    | `26-empty-states.html`              | 48px icon + 居中 + max-width              |
| 设计稿加载状态规范  | `27-loading-states.html`            | skeleton loader + spinner 标准            |
| DESIGN_DECISIONS.md | §12 状态显示                        | 设计决策文档                              |
| patterns 目录       | `renderer/src/components/patterns/` | 已有 patterns 目录可放置                  |

---

## What：做什么

### 1. 建立 `<EmptyState>` 标准组件

在 `renderer/src/components/patterns/` 下实现：

```
Props:
- icon: ReactNode（48px+，opacity 0.6，居中）
- title: string（16px semibold，居中）
- description?: string（13-14px muted，居中，max-width 280px）
- action?: { label: string; onClick: () => void }（主按钮，居中）
```

视觉规范（来源 `26-empty-states.html`）：

- Flex column 居中布局
- Icon：48px+、`opacity: 0.6`、`var(--color-text-muted)`
- 标题：`var(--text-card-title-size)`、`var(--weight-semibold)`
- 描述：`var(--text-body-size)`、`var(--color-text-muted)`、`max-width: 280px`
- Action 按钮：`<Button variant="ghost">` 或 `<Button variant="outline">`
- 各元素间距：`var(--space-item-gap)`

### 2. 建立 `<LoadingState>` 标准组件

```
Props:
- variant: 'spinner' | 'skeleton'
- skeletonRows?: number（skeleton 模式下的行数，默认 3）
- message?: string（可选的加载提示文字）
```

视觉规范（来源 `27-loading-states.html`）：

- Spinner：24px 圆环动画、`var(--color-accent)` 描边、居中
- Skeleton：圆角矩形 + shimmer 动画、`var(--color-bg-hover)` 底色
- Message：`var(--text-caption-size)`、`var(--color-text-muted)`

### 3. 建立 `<ErrorState>` 标准组件

```
Props:
- severity: 'error' | 'warning' | 'info'
- title: string
- description?: string
- action?: { label: string; onClick: () => void }（如"重试"）
```

视觉规范：

- 左侧 3px 色条：error → `var(--color-danger)`、warning → `var(--color-warning)`、info → `var(--color-info)`
- 背景：对应 subtle 色（`var(--color-danger-subtle)` 等）
- Icon：对应等级 icon（AlertCircle / AlertTriangle / Info）
- 布局：icon + title + description 水平排列，action 按钮右对齐

### 4. 逐模块迁移

将全 Features 层的碎片化状态渲染替换为标准组件。

### 5. Storybook Story

为 3 个标准组件各建 Story，覆盖所有 variant 和 props 组合。

---

## Non-Goals：不做什么

1. **不修改全局 Toast 系统**——Toast 是独立的通知通道，不在本 change 收口范围
2. **不新增状态业务逻辑**——只替换渲染层，不改变何时触发空 / 加载 / 错误状态的判断逻辑
3. **不做 Skeleton 的逐组件定制**——提供通用 skeleton 行模式，各面板如需定制化 skeleton 形状（如卡片骨架），留待后续
4. **不修改 error boundary 机制**——React Error Boundary 的全局捕获不在本 change 范围

---

## 依赖与影响

- **上游依赖**: v1-01（Design Token）—— 依赖 typography / 间距 token；v1-02（Primitives）—— 依赖 Button / Card / Badge 组件
- **被依赖于**: v1-10（侧面板统一）—— v1-10 的空状态替换依赖本 change 提供的 `<EmptyState>` 组件
- **执行顺序**: 本 change 应先于 v1-10 完成
- **并行安全**: 标准组件建设（Phase 1-2）独立进行；模块迁移（Phase 3）可与其他面板修改并行，但需注意 merge conflict
- **风险**: 迁移过程中需确保每个替换点的 props 映射正确（现有各处的 icon / 文案不同，需逐一确认）

---

## R4 Cascade Refresh (2025-07-22)

> 「器已定型，量其成效。」——R4 级联刷新，复核 v1-11 全局状态组件标准化落地。

### 上游依赖状态

| 上游 Change | 状态 | 说明 |
| --- | --- | --- |
| v1-08 FileTree Precision | ✅ PASS | R4 复核确认，已合并 |
| v1-09 CommandPalette+Search | ✅ PASS | R4 复核确认，已合并 |

### 基线指标更新

| 指标 | 预期值 | 实测值 | 采集命令 |
| --- | --- | --- | --- |
| EmptyState.tsx 存在 | ✅ | ✅ 241 行 | `wc -l apps/desktop/renderer/src/components/patterns/EmptyState.tsx` |
| LoadingState.tsx 存在 | ✅ | ✅ 337 行 | `wc -l apps/desktop/renderer/src/components/patterns/LoadingState.tsx` |
| ErrorState.tsx 存在 | ✅ | ✅ 537 行 | `wc -l apps/desktop/renderer/src/components/patterns/ErrorState.tsx` |
| patterns 目录总行数 | — | 2658 行（18 文件） | `find ... \| xargs wc -l` |
| composites/EmptyState features 导入 | 0 | 0（仅 guard 测试引用） | `grep -rn 'composites/EmptyState' apps/desktop/renderer/src/features/` |
| composites/LoadingState features 导入 | 0 | 0（仅 guard 测试引用） | `grep -rn 'composites/LoadingState' apps/desktop/renderer/src/features/` |
| composites/ErrorState features 导入 | 0 | 0（仅 guard 测试引用） | `grep -rn 'composites/ErrorState' apps/desktop/renderer/src/features/` |
| patterns 组件 features 引用数 | >0 | 16 处（7 个文件） | `grep -rn 'from.*patterns/EmptyState\|...' apps/desktop/renderer/src/features/` |
| Storybook stories | 3 | 3（EmptyState/LoadingState/ErrorState.stories.tsx） | `find ... -name '*.stories.tsx'` |
| EmptyState 测试 | 全绿 | ✅ 4 files, 22 tests passed | `npx vitest run --reporter=verbose EmptyState` |
| LoadingState 测试 | 全绿 | ✅ 1 file, 26 tests passed | `npx vitest run --reporter=verbose LoadingState` |
| ErrorState 测试 | 全绿 | ✅ 1 file, 16 tests passed | `npx vitest run --reporter=verbose ErrorState` |
| 碎片化残留（text-muted 暂无/No） | 0 | 0 | `grep -rn 'className.*text-muted.*暂无\|...' apps/desktop/renderer/src/features/` |

### 分析

**结论：v1-11 已完全落地，无需修复。**

1. **三组件完备**：EmptyState（241 行）、LoadingState（337 行）、ErrorState（537 行）均已实现，API 远超原 proposal 设想——EmptyState 支持 variant 预设（files/search/characters/project）、LoadingState 扩展了 Skeleton/ProgressBar 子组件、ErrorState 支持 4 种 variant（inline/banner/card/fullPage）
2. **composites 引用清零**：AC-9/AC-10/AC-11 全部达标——features 层无一处实际导入 composites/*State，仅 guard 测试中以字符串匹配方式引用（这是防回归断言，不是实际导入）
3. **features 层广泛集成**：16 处引用横跨 7 个模块——VersionHistory、Character、Search、KG、FileTree、Memory、Outline 均已迁移至 patterns 组件
4. **测试健壮**：64 个测试全绿（EmptyState 22 + LoadingState 26 + ErrorState 16），覆盖所有 variant、props 组合、交互行为
5. **碎片化残留为零**：`text-muted.*暂无` 模式搜索无命中，旧式内联空状态已清理完毕
6. **上游 v1-08/v1-09 合并未引入回归**：三组件测试稳定通过，无冲突
