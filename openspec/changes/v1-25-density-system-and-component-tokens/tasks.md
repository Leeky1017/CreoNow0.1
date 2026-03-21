# Tasks: V1-25 Density System & Component Tokens

> 📋 **级联刷新 R1**（2026-03-21）：v1-01 完成后建档。基线已采集。v1-24 仍待完成。

- **状态**: ⏸️ 待启动（blocked by v1-24）
- **GitHub Issue**: 待创建
- **分支**: `task/<N>-density-system-and-component-tokens`
- **Delta Spec**: `design/system/01-tokens.css`（component token 层）、`DensityProvider.tsx`

---

## 验收标准

| ID    | 标准                                                                                             | 验证方式                                                                               | 结果 |
| ----- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- | ---- |
| AC-1  | `01-tokens.css` 新增 component token 层，覆盖 Button/Input/Card/Badge/ListItem/Dialog/Tabs       | `grep -c '\-\-button-\|\-\-input-\|\-\-card-\|\-\-badge-\|\-\-listitem-\|\-\-dialog-\|\-\-tab-' design/system/01-tokens.css` ≥ 20 | ⬜ |
| AC-2  | `[data-density="compact"]` 块存在且覆盖核心 component token                                      | `grep -c 'data-density.*compact' design/system/01-tokens.css` ≥ 1                      | ⬜ |
| AC-3  | compact 密度下所有可交互元素高度 ≥ 28px                                                           | 审查 compact preset 中 `--*-height-*` 值                                                | ⬜ |
| AC-4  | DensityProvider 组件存在，导出 `useDensity` hook                                                  | `find apps/desktop/renderer/src/ -name "DensityProvider*"` 返回结果                     | ⬜ |
| AC-5  | DensityProvider 在容器 DOM 上设置 `data-density` attribute                                        | 单元测试断言 `data-density` attribute                                                   | ⬜ |
| AC-6  | 在 `<DensityProvider density="compact">` 下渲染的 Button padding 使用 compact token 值             | 单元测试 / Storybook visual 验证                                                        | ⬜ |
| AC-7  | 现有 Primitives（Button/Input/Card/ListItem）的 hardcoded spacing 替换为 component token 引用      | `grep -rn 'var(--button-\|var(--input-\|var(--card-\|var(--listitem-' .../primitives/ --include='*.tsx'` ≥ 10 | ⬜ |
| AC-8  | 不传 DensityProvider 时，组件行为与当前完全一致（comfortable 为默认值）                             | 回归测试全绿                                                                            | ⬜ |
| AC-9  | TypeScript 类型检查通过                                                                           | `pnpm typecheck`                                                                        | ⬜ |
| AC-10 | 全量测试通过                                                                                      | `pnpm -C apps/desktop vitest run`                                                       | ⬜ |
| AC-11 | Storybook 可构建                                                                                  | `pnpm -C apps/desktop storybook:build`                                                  | ⬜ |
| AC-12 | DensityProvider 有 Storybook Story，展示 compact vs comfortable 对比                               | Story 文件存在 + storybook:build 通过                                                   | ⬜ |

---

## Phase 0: 准备

- [ ] 阅读 `AGENTS.md` 和 `design/DESIGN_DECISIONS.md`
- [ ] 阅读 `design/system/01-tokens.css` 全文，理解三层 token 架构（global → semantic → component）
- [ ] 阅读 `docs/references/design-ui-architecture.md`，确认 Design Token 使用规范
- [ ] 阅读 `docs/references/testing/README.md`，了解测试规范
- [ ] 阅读现有 Primitives 的 spacing 实现：Button / Input / Card / ListItem / Badge / Dialog / Tabs
- [ ] 确认 v1-24 完成状态（v1-24 新增组件不在本变更范围内）
- [ ] 确认 v1-19（a11y）和 v1-23（色彩系统）对密度系统的约束

---

## Phase 1: Red（测试先行）

### Task 1.1: Component Token 存在性测试

**映射验收标准**: AC-1

- [ ] Guard 测试：`01-tokens.css` 中存在 `--button-padding-x`、`--button-padding-y`、`--button-height-sm/md/lg`、`--button-radius`、`--button-gap`
- [ ] Guard 测试：`01-tokens.css` 中存在 `--input-height`、`--input-padding-x`、`--input-radius`
- [ ] Guard 测试：`01-tokens.css` 中存在 `--card-padding`、`--card-radius`、`--card-gap`
- [ ] Guard 测试：`01-tokens.css` 中存在 `--listitem-padding-x`、`--listitem-padding-y`、`--listitem-radius`、`--listitem-gap`
- [ ] Guard 测试：`01-tokens.css` 中存在 `--badge-padding-x`、`--badge-padding-y`、`--badge-radius`
- [ ] Guard 测试：`01-tokens.css` 中存在 `--dialog-padding`、`--dialog-radius`
- [ ] Guard 测试：`01-tokens.css` 中存在 `--tab-padding-x`、`--tab-padding-y`、`--tab-gap`

### Task 1.2: Density Preset 测试

**映射验收标准**: AC-2, AC-3

- [ ] Guard 测试：`01-tokens.css` 中存在 `[data-density="compact"]` 块
- [ ] Guard 测试：compact 块中覆盖了 `--button-*`、`--input-*`、`--card-*`、`--listitem-*`、`--tab-*`
- [ ] Guard 测试：compact 密度下 `--button-height-sm` ≥ 28px、`--input-height` ≥ 28px

### Task 1.3: DensityProvider 测试

**映射验收标准**: AC-4, AC-5, AC-6, AC-8

- [ ] 测试：`<DensityProvider density="compact">` 渲染的容器 DOM 上存在 `data-density="compact"` attribute
- [ ] 测试：`<DensityProvider density="comfortable">` 渲染的容器 DOM 上存在 `data-density="comfortable"` attribute
- [ ] 测试：`useDensity()` 在 Provider 内返回当前密度值
- [ ] 测试：`useDensity()` 在 Provider 外返回默认值 `"comfortable"`
- [ ] 测试：嵌套 DensityProvider 时，内层覆盖外层
- [ ] 测试：DensityProvider 不引入额外 DOM 层级（使用 data-attribute 方式）

**文件**: `renderer/src/providers/DensityProvider.test.tsx`

### Task 1.4: Primitive 迁移回归测试

**映射验收标准**: AC-7, AC-8

- [ ] 测试：Button 的 padding class 引用 component token（`var(--button-padding-x)`）
- [ ] 测试：Input 的 height 引用 component token（`var(--input-height)`）
- [ ] 测试：Card 的 padding 引用 component token（`var(--card-padding)`）
- [ ] 测试：ListItem 的 padding 引用 component token（`var(--listitem-padding-x)`）
- [ ] 测试：不使用 DensityProvider 时，所有组件视觉行为与迁移前一致（回归）

**文件**: 各 Primitive 的现有 `.test.tsx`（追加）

---

## Phase 2: Green（实现）

### Task 2.1: Component Token Layer 定义

**映射验收标准**: AC-1

- [ ] 在 `design/system/01-tokens.css` 的 `:root` 块中新增 component token 层（位于 semantic token 之后）
- [ ] 按 Button / Input / Card / Badge / ListItem / Dialog / Tabs 分组定义 component token
- [ ] 所有 component token 引用 global/semantic token 而非硬编码像素值（少数例外：height 值因无对应 global token 可直接定义像素值）

### Task 2.2: Compact Density Preset

**映射验收标准**: AC-2, AC-3

- [ ] 在 `01-tokens.css` 中新增 `[data-density="compact"]` 块
- [ ] 覆盖核心 component token：button、input、card、listitem、tab
- [ ] 确保所有可交互元素最小高度 ≥ 28px
- [ ] comfortable 为默认值（`:root` 中的 component token 即 comfortable 值），无需额外 `[data-density="comfortable"]` 块

### Task 2.3: DensityProvider 实现

**映射验收标准**: AC-4, AC-5

- [ ] 创建 `apps/desktop/renderer/src/providers/DensityProvider.tsx`
- [ ] 导出 `DensityProvider` 组件和 `useDensity` hook
- [ ] DensityProvider 使用 `<div data-density={density}>` 包裹子节点
- [ ] 导出 `Density` type（`'compact' | 'comfortable'`）

### Task 2.4: Primitive 迁移（Button / Input / Card / ListItem）

**映射验收标准**: AC-6, AC-7, AC-8

- [ ] Button.tsx：`padding` 引用 `var(--button-padding-x)` / `var(--button-padding-y)`，height 引用 `var(--button-height-*)` 
- [ ] Input.tsx：`height` 引用 `var(--input-height)`，`padding` 引用 `var(--input-padding-x)`
- [ ] Card.tsx：`padding` 引用 `var(--card-padding)`
- [ ] ListItem.tsx：`padding` 引用 `var(--listitem-padding-x)` / `var(--listitem-padding-y)`
- [ ] 确认迁移后不传 DensityProvider 时，渲染结果与迁移前一致

### Task 2.5: Storybook Story

**映射验收标准**: AC-12

- [ ] 创建 `DensityProvider.stories.tsx`，展示 compact vs comfortable 对比
- [ ] Story 包含：Button / Input / Card / ListItem 在两种密度下的并排对比
- [ ] `pnpm -C apps/desktop storybook:build` 通过

---

## Phase 3: 验证

- [ ] `pnpm -C apps/desktop vitest run` 全量通过（AC-10）
- [ ] `pnpm typecheck` 通过（AC-9）
- [ ] `pnpm lint` 无新增违规
- [ ] `pnpm -C apps/desktop storybook:build` 通过（AC-11）
- [ ] 手动检查：不使用 DensityProvider 时，所有页面视觉不变（回归验证）

---

## 遗留项

1. **v1-24 新组件的 component token**：Table / Separator / Alert / SegmentedControl / Progress 的 component token 需在 v1-24 完成后追加
2. **Zone-aware density**：Layout 层自动为 sidebar 设置 compact、editor 设置 comfortable 的集成，待 v1-24 布局结构确定后实施
3. **用户可配置密度**：Settings 面板中添加密度偏好选项（compact/comfortable/auto），属于 v1-07（Settings Visual Polish）的下游需求
4. **v1-19 a11y 约束对接**：a11y 审计确认 compact 密度触控目标符合 WCAG 2.5.5，待 v1-19 完成后验证
5. **v1-23 色彩系统对接**：确认 component token 中的色彩引用与 v1-23 色彩系统一致，待 v1-23 完成后验证
