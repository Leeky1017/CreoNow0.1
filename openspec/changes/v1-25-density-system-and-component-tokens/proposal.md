# V1-25 Density System & Component Tokens

> 📋 **级联刷新 R1**（2026-03-21）：v1-01 完成后建档。基线已采集。v1-24 仍待完成。

- **状态**: 📋 已建档（待实施，blocked by v1-24）
- **所属任务簇**: V1（视觉重塑）— Phase 9 密度系统
- **涉及模块**: design-system / primitives / DensityProvider
- **前端验收**: 需要（Storybook Story + 视觉验收截图）
- **预估工作量**: 0.6× v1-02
- **依赖**:
  - v1-01（Design Token）✅ 已完成
  - v1-24（Component Library Expansion）⏳ 待完成（Phase 9）
  - v1-19（a11y 约束影响密度设计）⏳ 待完成
  - v1-23（色彩系统影响 component token）⏳ 待完成

---

## Why：为什么必须做

### 1. 用户现象

v1-01 建立了两层 token 体系：全局 token（`--space-*`、`--radius-*`）→ 语义 token（`--space-panel-padding`、`--space-section-gap`）。然而，组件层缺少独立的 token 层——按钮的 padding、输入框的高度、卡片的内边距全部直接引用全局或语义 token，无法按密度模式统一切换。

创作 IDE 天然需要双密度环境：

- **面板区（sidebar / file-tree / AI panel）** → compact 密度：信息密集，单项占用空间小，用户需要在有限空间内快速浏览和操作
- **编辑区（editor / writing area）** → comfortable 密度：写作主战场，留白充裕，呼吸感强，减少视觉疲劳

当前所有区域使用同一套 spacing，导致：

- 侧边栏 list item 的 padding（`--space-2` = 8px）对于密集文件树仍然偏大
- 编辑器工具栏按钮与面板按钮使用相同尺寸，无法区分主次区域
- 切换"紧凑模式"需要逐一修改组件 prop，而非全局预设切换

### 2. 根因

v1-01 设计 token 体系时，有意保持两层结构（global + semantic）的简洁性，将 component-level token 和密度系统作为后续扩展点。具体差距：

| 层级                   | 当前状态                                | 需要                                          |
| ---------------------- | --------------------------------------- | --------------------------------------------- |
| Global tokens          | ✅ 13 级 spacing + 7 级 radius          | 不变                                          |
| Semantic tokens        | ✅ 4 个语义别名                         | 不变                                          |
| **Component tokens**   | ❌ 不存在（0 个 `--button-*` 类 token） | 每个 primitive 的 padding/height/radius/gap   |
| **Density presets**    | ❌ 不存在                               | compact / comfortable 两套 component token 值 |
| **DensityProvider**    | ❌ 不存在                               | React Context + CSS data-attribute 切换密度   |
| **Zone-aware density** | ❌ 不存在                               | 面板区 auto-compact / 编辑区 auto-comfortable |

### 3. 威胁

- **一致性崩塌**：若各 Feature 组件自行实现紧凑模式（`className={isCompact ? 'p-1' : 'p-2'}`），将产生不可维护的密度变体散落
- **主题交叉**：密度切换与暗/浅色主题正交——若不统一管理，组合爆炸（2 密度 × 2 主题 = 4 套样式需独立维护）
- **a11y 风险**：compact 密度不可无底线收缩——触控目标最小 44px（WCAG 2.5.5）、文字不可小于 12px，这些约束需要在密度系统中内建

### 4. 证据来源

| 数据点                     | 实测值（2026-03-21）                        | 采集命令                                                                                      |
| -------------------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Spacing token 数量         | 16 个（13 numeric + 3 semantic + 空行噪声） | `grep -c '\-\-space-' design/system/01-tokens.css`                                            |
| Component-level token 数量 | 0 个                                        | `grep -c '\-\-button-\|\-\-input-\|\-\-card-\|\-\-badge-' design/system/01-tokens.css`        |
| Token 层数（:root 块）     | 15 个 :root 块                              | `grep -c ':root\|@media.*prefers' design/system/01-tokens.css`                                |
| Primitives 中的间距引用    | 314 处                                      | `grep -rn 'padding\|gap\|space-' .../primitives/ --include='*.tsx' \| wc -l`                  |
| DensityProvider            | 不存在                                      | `find apps/desktop/renderer/src/ -name "*Density*" -o -name "*density*"`                      |
| Primitive 组件文件数       | 29 个 .tsx（不含 stories/test）             | `ls apps/desktop/renderer/src/components/primitives/*.tsx \| grep -v stories \| grep -v test` |
| Radius token 档位          | 7 个（none/sm/md/lg/xl/2xl/full）           | `grep -c '\-\-radius-' design/system/01-tokens.css`                                           |

---

## What：做什么

### 1. Component Token Layer（组件级 token 层）

在 `design/system/01-tokens.css` 的 `:root` 中新增 component-level token 层，位于 semantic token 之后：

```css
/* ── Component Tokens ── */
/* Button */
--button-padding-x: var(--space-4);
--button-padding-y: var(--space-2);
--button-height-sm: 32px;
--button-height-md: 40px;
--button-height-lg: 48px;
--button-radius: var(--radius-md);
--button-gap: var(--space-2);

/* Input */
--input-height: 40px;
--input-padding-x: var(--space-3);
--input-radius: var(--radius-sm);
--input-border-width: 1px;

/* Card */
--card-padding: var(--space-4);
--card-radius: var(--radius-xl);
--card-gap: var(--space-3);

/* Badge */
--badge-padding-x: var(--space-2);
--badge-padding-y: var(--space-1);
--badge-radius: var(--radius-sm);

/* ListItem */
--listitem-padding-x: var(--space-3);
--listitem-padding-y: var(--space-2);
--listitem-radius: var(--radius-sm);
--listitem-gap: var(--space-2);

/* Dialog */
--dialog-padding: var(--space-6);
--dialog-radius: var(--radius-lg);

/* Tabs */
--tab-padding-x: var(--space-4);
--tab-padding-y: var(--space-2);
--tab-gap: var(--space-1);
```

**原则**：component token 引用 global/semantic token，不硬编码像素值。当 global token 变更时，component token 自动跟随。

### 2. Density Presets（密度预设）

通过 `data-density` attribute 覆盖 component token 值：

```css
/* ── Compact Density ── */
[data-density="compact"] {
  --button-padding-x: var(--space-3);
  --button-padding-y: var(--space-1);
  --button-height-sm: 28px;
  --button-height-md: 32px;
  --button-height-lg: 40px;
  --button-gap: var(--space-1);

  --input-height: 32px;
  --input-padding-x: var(--space-2);

  --card-padding: var(--space-3);
  --card-gap: var(--space-2);

  --listitem-padding-x: var(--space-2);
  --listitem-padding-y: var(--space-1);
  --listitem-gap: var(--space-1);

  --tab-padding-x: var(--space-3);
  --tab-padding-y: var(--space-1);
  --tab-gap: var(--space-0);
}

/* comfortable = default，无需额外覆盖 */
```

**约束**：compact 密度下，所有可交互元素高度 ≥ 28px（确保触控目标可用性），文字尺寸不缩小。

### 3. DensityProvider（React Context）

```tsx
// apps/desktop/renderer/src/providers/DensityProvider.tsx
type Density = "compact" | "comfortable";

interface DensityProviderProps {
  density: Density;
  children: React.ReactNode;
}

// 在渲染的 DOM 容器上设置 data-density attribute
// 子组件通过 CSS 自动获得对应密度的 component token 值
// 提供 useDensity() hook 用于需要条件逻辑的场景
```

### 4. Zone-Aware Density（区域自动密度）

在布局层（Layout / PanelGroup）中嵌套 DensityProvider：

- Sidebar / FileTree / AI Panel → `<DensityProvider density="compact">`
- Editor / Writing Area → `<DensityProvider density="comfortable">`

此部分依赖 v1-24 新增组件的实际布局结构，**暂不实施**，仅在 spec 中预留接口。

### 5. Primitive Migration（组件迁移）

将现有 Primitives 的硬编码 spacing 替换为 component token 引用：

- `Button.tsx`：padding → `var(--button-padding-x)` / `var(--button-padding-y)`
- `Input.tsx`：height → `var(--input-height)`
- `Card.tsx`：padding → `var(--card-padding)`
- `ListItem.tsx`：padding → `var(--listitem-padding-x)` / `var(--listitem-padding-y)`
- 其余 Primitives 按同一模式迁移

**注意**：v1-24 新增的组件（Table / Separator / Alert / SegmentedControl / Progress）在 v1-24 完成后再添加对应 component token，不在本变更中预定义。

---

## Non-Goals（不做什么）

1. **不重新设计 token 架构**——在 v1-01 的 global → semantic 基础上叠加 component 层，不改变已有层级
2. **不改变组件 API**——DensityProvider 通过 CSS custom property 生效，组件不需要新增 `density` prop
3. **不实现第三套密度**——仅 compact / comfortable 两档，不做 spacious 或 ultra-compact
4. **不缩小文字**——密度系统只调整间距和尺寸，不影响 `--font-size-*` 系列 token
5. **不为 v1-24 新组件预定义 token**——等 v1-24 完成后再追加，避免空占位

---

## 验收标准

| ID    | 标准                                                                                          | 验证方式                                                                                                                          |
| ----- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| AC-1  | `01-tokens.css` 新增 component token 层，覆盖 Button/Input/Card/Badge/ListItem/Dialog/Tabs    | `grep -c '\-\-button-\|\-\-input-\|\-\-card-\|\-\-badge-\|\-\-listitem-\|\-\-dialog-\|\-\-tab-' design/system/01-tokens.css` ≥ 20 |
| AC-2  | `[data-density="compact"]` 块存在且覆盖核心 component token                                   | `grep -c 'data-density.*compact' design/system/01-tokens.css` ≥ 1                                                                 |
| AC-3  | compact 密度下所有可交互元素高度 ≥ 28px                                                       | 审查 compact preset 中 `--*-height-*` 值                                                                                          |
| AC-4  | DensityProvider 组件存在，导出 `useDensity` hook                                              | `find apps/desktop/renderer/src/ -name "DensityProvider*"` 返回结果                                                               |
| AC-5  | DensityProvider 在容器 DOM 上设置 `data-density` attribute                                    | 单元测试断言 `data-density` attribute                                                                                             |
| AC-6  | 在 `<DensityProvider density="compact">` 下渲染的 Button padding 使用 compact token 值        | 单元测试 / Storybook visual 验证                                                                                                  |
| AC-7  | 现有 Primitives（Button/Input/Card/ListItem）的 hardcoded spacing 替换为 component token 引用 | `grep -rn 'var(--button-\|var(--input-\|var(--card-\|var(--listitem-' .../primitives/ --include='*.tsx'` ≥ 10                     |
| AC-8  | 不传 DensityProvider 时，组件行为与当前完全一致（comfortable 为默认值）                       | 回归测试全绿                                                                                                                      |
| AC-9  | TypeScript 类型检查通过                                                                       | `pnpm typecheck`                                                                                                                  |
| AC-10 | 全量测试通过                                                                                  | `pnpm -C apps/desktop vitest run`                                                                                                 |
| AC-11 | Storybook 可构建                                                                              | `pnpm -C apps/desktop storybook:build`                                                                                            |
| AC-12 | DensityProvider 有 Storybook Story，展示 compact vs comfortable 对比                          | Story 文件存在 + storybook:build 通过                                                                                             |

---

## 架构图

```
┌──────────────────────────────────────────────────────────┐
│ Token Architecture (after v1-25)                         │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Layer 1: Global Tokens (v1-01)                          │
│  ├── --space-0 ~ --space-20                              │
│  ├── --radius-none ~ --radius-full                       │
│  └── --color-*, --font-*, --duration-*                   │
│          │                                               │
│          ▼                                               │
│  Layer 2: Semantic Tokens (v1-01)                        │
│  ├── --space-panel-padding: var(--space-4)               │
│  ├── --space-section-gap: var(--space-6)                 │
│  └── --space-item-gap: var(--space-2)                    │
│          │                                               │
│          ▼                                               │
│  Layer 3: Component Tokens (v1-25 NEW)                   │
│  ├── --button-padding-x: var(--space-4)                  │
│  ├── --input-height: 40px                                │
│  ├── --card-padding: var(--space-4)                      │
│  └── --listitem-padding-y: var(--space-2)                │
│          │                                               │
│          ▼                                               │
│  Density Override: [data-density="compact"]              │
│  ├── --button-padding-x: var(--space-3)  ← overridden   │
│  ├── --input-height: 32px                ← overridden   │
│  └── --listitem-padding-y: var(--space-1) ← overridden  │
│                                                          │
├──────────────────────────────────────────────────────────┤
│ React Tree                                               │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  <App>                                                   │
│    <ThemeProvider>               ← data-theme            │
│      <Layout>                                            │
│        <DensityProvider density="compact">  ← sidebar    │
│          <FileTree />                                    │
│          <AIPanel />                                     │
│        </DensityProvider>                                │
│        <DensityProvider density="comfortable"> ← editor  │
│          <EditorArea />                                  │
│        </DensityProvider>                                │
│      </Layout>                                           │
│    </ThemeProvider>                                       │
│  </App>                                                  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 风险与缓解

| 风险                                | 缓解策略                                                  |
| ----------------------------------- | --------------------------------------------------------- |
| v1-24 新组件缺少 component token    | 本变更只覆盖已有 Primitives；v1-24 完成后追加新组件 token |
| compact 密度破坏 a11y 触控目标      | 设定 28px 最小高度硬约束，测试验证                        |
| 大量 Primitives 迁移引入回归        | TDD 先行，每个组件迁移前后跑回归测试                      |
| DensityProvider 嵌套导致意外覆盖    | 最内层 DensityProvider 生效（CSS specificity 自然保证）   |
| 性能：大量 CSS custom property 级联 | component token 总量 < 40 个，级联性能可忽略              |

---

## R1 Cascade Refresh (2026-03-21)

### 上游依赖状态

| 依赖  | 状态                                      |
| ----- | ----------------------------------------- |
| v1-01 | ✅ 完成（2026-03-20 验收，R1 复核通过）   |
| v1-02 | ✅ 完成（2026-03-21 验收，⭐⭐⭐⭐⭐）    |
| v1-24 | ⏳ 待启动（Phase 9 组件库扩展）           |
| v1-23 | ⏳ 待启动（色彩系统影响 component token） |
| v1-19 | ⏳ 待启动（a11y 约束影响密度设计）        |

### 基线指标复核

所有指标 R1 复核完成，与初始建档一致：

| 指标                     | R1 建档值 | R1 复核值 | 趋势 | 说明                               |
| ------------------------ | --------- | --------- | ---- | ---------------------------------- |
| Component-level token 数 | 0         | 0         | →    | 待本 change 新建 ≥ 20              |
| `data-density` 使用数    | 0         | 0         | →    | 待本 change 新建                   |
| DensityProvider          | 不存在    | 不存在    | →    | 待本 change 新建                   |
| Spacing token 数         | 16        | 16        | →    | 13 numeric + 3 semantic            |
| Radius token 档位        | 8         | 8         | →    |                                    |
| Primitives spacing 引用  | 314 处    | 314 处    | →    | 待本 change 迁移为 component token |
| `:root` / `@media` 块数  | 15        | 15        | →    |                                    |
| Primitive 组件文件数     | 29        | 29        | →    | v1-24 完成后将增至 ≥ 35            |

### Scope 变更

无需调整。v1-25 仍 blocked by v1-24（组件库扩展），需等待新组件建立后再添加对应 component token。v1-02 完成确认了现有 Primitives 的 spacing 模式，为后续迁移提供了稳定基线。
