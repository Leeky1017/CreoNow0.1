# Tasks: V1-25 Density System & Component Tokens

> ⚠️ 本 change 已拆分为 micro-changes: v1-25a, v1-25b, v1-25c, v1-25d。以下为历史记录。

> 📋 **级联刷新 R10**（2026-03-22）：v1-19~v1-23 tasks.md 补建后级联刷新。v1-17/v1-18 已合并。v1-24 仍待完成。
> 📋 **级联刷新 R1**（2026-03-21）：v1-01 完成后建档。基线已采集。v1-24 仍待完成。

- **状态**: ⏸️ 待启动（blocked by v1-24）
- **GitHub Issue**: 待创建
- **分支**: `task/<N>-density-system-and-component-tokens`
- **Delta Spec**: `design/system/01-tokens.css`（component token 层）、`DensityProvider.tsx`

---

## 验收标准

| ID    | 标准                                                                                             | 验证方式                                                                                                                                      | 结果 |
| ----- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| AC-1  | `01-tokens.css` 新增 component token 层，覆盖 Button/Input/Card/Badge/ListItem/Dialog/Tabs/Toast | `grep -cE '\-\-(button\|input\|card\|badge\|listitem\|dialog\|tab\|toast)-' design/system/01-tokens.css` ≥ 22                                 | ⬜   |
| AC-2  | `[data-density="compact"]` 块存在且覆盖核心 component token                                      | `grep -c 'data-density.*compact' design/system/01-tokens.css` ≥ 1                                                                             | ⬜   |
| AC-3  | compact 密度下所有可交互元素高度 ≥ 28px                                                          | 审查 compact preset 中 `--*-height-*` 值                                                                                                      | ⬜   |
| AC-4  | DensityProvider 组件存在，导出 `useDensity` hook                                                 | `find apps/desktop/renderer/src/ -name "DensityProvider*"` 返回结果                                                                           | ⬜   |
| AC-5  | DensityProvider 在容器 DOM 上设置 `data-density` attribute                                       | 单元测试断言 `data-density` attribute                                                                                                         | ⬜   |
| AC-6  | 在 `<DensityProvider density="compact">` 下渲染的 Button padding 使用 compact token 值           | 单元测试 / Storybook visual 验证                                                                                                              | ⬜   |
| AC-7  | 现有 Primitives（Button/Input/Card/ListItem）的 hardcoded spacing 替换为 component token 引用    | `grep -rn 'var(--button-\|var(--input-\|var(--card-\|var(--listitem-' apps/desktop/renderer/src/components/primitives --include='*.tsx'` ≥ 10 | ⬜   |
| AC-8  | 不传 DensityProvider 时，组件行为与当前完全一致（comfortable 为默认值）                          | 回归测试全绿                                                                                                                                  | ⬜   |
| AC-9  | TypeScript 类型检查通过                                                                          | `pnpm typecheck`                                                                                                                              | ⬜   |
| AC-10 | 全量测试通过                                                                                     | `pnpm -C apps/desktop vitest run`                                                                                                             | ⬜   |
| AC-11 | Storybook 可构建                                                                                 | `pnpm -C apps/desktop storybook:build`                                                                                                        | ⬜   |
| AC-12 | DensityProvider 有 Storybook Story，展示 compact vs comfortable 对比                             | Story 文件存在 + storybook:build 通过                                                                                                         | ⬜   |

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
- [ ] Guard 测试：`01-tokens.css` 中存在 `--toast-padding`、`--toast-radius`、`--toast-shadow`（R10 新增：v1-21 Toast 系统需对应 token）

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
- [ ] 按 Button / Input / Card / Badge / ListItem / Dialog / Tabs / Toast 分组定义 component token
- [ ] 为 Card / Dialog 追加 shadow 映射 token（`--card-shadow: var(--shadow-sm)`、`--dialog-shadow: var(--shadow-lg)`），利用 v1-17 扩展后的 6 档 shadow
- [ ] 为 Toast 定义 component token：`--toast-padding`、`--toast-radius`、`--toast-shadow`（R10 新增：对齐 v1-21 Toast 系统）
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

### Task 2.4: Primitive 迁移（Button / Input / Card / ListItem / Toast）

**映射验收标准**: AC-6, AC-7, AC-8

- [ ] Button.tsx：`padding` 引用 `var(--button-padding-x)` / `var(--button-padding-y)`，height 引用 `var(--button-height-*)`
- [ ] Input.tsx：`height` 引用 `var(--input-height)`，`padding` 引用 `var(--input-padding-x)`
- [ ] Card.tsx：`padding` 引用 `var(--card-padding)`，shadow 引用 `var(--card-shadow)`
- [ ] ListItem.tsx：`padding` 引用 `var(--listitem-padding-x)` / `var(--listitem-padding-y)`；收编现有 `compact` prop 样式到 DensityProvider + component token 机制
- [ ] Toast.tsx：`padding` 引用 `var(--toast-padding)`，`radius` 引用 `var(--toast-radius)`（R10 新增）
- [ ] 清理 ListItem / Card 现有的 `compact` prop/variant 硬编码样式，统一走 `[data-density="compact"]` 覆盖（R10 识别：55 处 compact/comfortable 引用需收编）
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
3. **用户可配置密度**：Settings 面板中添加密度偏好选项（compact/comfortable/auto），属于 v1-07（Settings Visual Polish）/ v1-22（设置页面）的下游需求
4. **v1-19 a11y 约束对接**：a11y 审计确认 compact 密度触控目标符合 WCAG 2.5.5，待 v1-19 完成后验证
5. **v1-23 色彩系统对接**：确认 component token 中的色彩引用与 v1-23 色彩系统一致，待 v1-23 完成后验证
6. **compact prop 废弃路径**（R10 新增）：ListItem.compact / Card compact variant 迁移到 DensityProvider 后，原 prop 需标记 deprecated 并设定移除时间线

---

## R1 Cascade Refresh 记录（2026-03-21）

### 上游依赖复核

- **v1-01** ✅ 完成（2026-03-20 验收）——13 级 spacing + 7 级 radius + 4 semantic spacing 已就位
- **v1-02** ✅ 完成（2026-03-21 验收）——29 个 Primitives、314 处 spacing 引用，为 component token 迁移提供稳定基线
- **v1-24** ⏳ 待启动——本 change 仍 blocked by v1-24（新组件需先建立才能定义 component token）
- **v1-23** ⏳ 待启动——色彩系统升级对 component token 的色彩引用有影响
- **v1-19** ⏳ 待启动——a11y 约束对 compact 密度最小尺寸有约束

### 基线指标验证

| 指标                     | 实测值 | 采集命令                                                                                                                                                  |
| ------------------------ | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Component-level token 数 | 0      | `grep -cE '\-\-(button\|input\|card\|badge\|listitem\|dialog\|tab)-' design/system/01-tokens.css`                                                         |
| `data-density` 使用数    | 0      | `grep -rc 'data-density' apps/desktop/renderer/src/ --include='*.tsx'`                                                                                    |
| DensityProvider          | 不存在 | `find apps/desktop/renderer/src/ -name "*Density*"` → 空                                                                                                  |
| Spacing token 数         | 16     | `grep -c '\-\-space-' design/system/01-tokens.css`                                                                                                        |
| Radius token 档位        | 8      | `grep -c '\-\-radius-' design/system/01-tokens.css`                                                                                                       |
| Primitives spacing 引用  | 314    | `grep -rn 'padding\|gap\|space-' apps/desktop/renderer/src/components/primitives --include='*.tsx' \| wc -l`                                              |
| Primitive 组件文件数     | 29     | `find apps/desktop/renderer/src/components/primitives -maxdepth 1 -name '*.tsx' ! -name '*.test.*' ! -name '*.stories.*' ! -name '*.behavior.*' \| wc -l` |

所有指标与初始建档一致，无变化。

### Phase 0 调整

无需调整。v1-25 仍处于 blocked 状态（依赖 v1-24），Phase 0 准备任务保持不变。解除阻塞后需重新评估 v1-24 新增组件的 component token 范围。

---

## R10 Cascade Refresh 记录（2026-03-22）

> v1-19~v1-23 tasks.md 补建完成 + v1-17/v1-18 已合并后级联刷新。

### 上游依赖复核

- **v1-01** ✅ 完成——不变
- **v1-02** ✅ 完成——不变
- **v1-17** ✅ 已合并（PR#1222）——shadow token 4→6 档，新增 `--shadow-xs`、`--shadow-2xl`
- **v1-18** ✅ 已合并（PR#1223）——arbitrary 值清理，Primitive 组件数 29→30
- **v1-24** ⏳ 待启动——仍为主阻塞项
- **v1-23** ⏳ 待启动——tasks.md 已建档（R10 P8）
- **v1-19** ⏳ 待启动——tasks.md 已建档（R10 P8）

### 基线指标验证

| 指标                     | R1 值  | R10 值 | Delta | 采集命令                                                                                          |
| ------------------------ | ------ | ------ | ----- | ------------------------------------------------------------------------------------------------- |
| 01-tokens.css 总行数     | —      | 472    | —     | `wc -l design/system/01-tokens.css`                                                               |
| Component-level token 数 | 0      | 0      | →     | `grep -cE '\-\-(button\|input\|card\|badge\|listitem\|dialog\|tab)-' design/system/01-tokens.css` |
| `data-density` 使用数    | 0      | 0      | →     | `grep -rn 'data-density' apps/desktop/renderer/src/ --include='*.tsx' --include='*.css' \| wc -l` |
| DensityProvider          | 不存在 | 不存在 | →     | `find apps/desktop/renderer/src -name "*Density*"` → 空                                           |
| compact/comfortable 引用 | —      | 55 处  | —     | ListItem.compact prop、Card compact variant 已存在                                                |
| Spacing token 数         | 16     | 16     | →     | `grep -c '\-\-space-' design/system/01-tokens.css`                                                |
| Radius token 档位        | 8      | 8      | →     | `grep -c '\-\-radius-' design/system/01-tokens.css`                                               |
| Shadow token 档位        | 4      | 6      | +2    | v1-17 新增 `--shadow-xs`、`--shadow-2xl`                                                          |
| `:root` / `@media` 块数  | 15     | 15     | →     | `grep -cE ':root\|@media.*prefers' design/system/01-tokens.css`                                   |
| Primitives spacing 引用  | 314    | 314    | →     | 待迁移为 component token                                                                          |
| Primitive 组件文件数     | 29     | 30     | +1    | v1-18 后微调                                                                                      |
| main.css 组件级样式      | —      | 6      | —     | `grep -cE 'btn-\|input-\|card-\|badge-' apps/desktop/renderer/src/styles/main.css`                |

### R10 任务调整摘要

1. **AC-1 扩展**: 覆盖范围增加 Toast 组件 token（对齐 v1-21 Toast 系统），阈值 20→22
2. **Task 1.1 新增**: Toast component token 存在性 guard 测试
3. **Task 2.1 新增**: Card/Dialog shadow 映射 token + Toast component token 定义
4. **Task 2.4 扩展**: 增加 Toast 迁移 + ListItem/Card compact prop 收编到 DensityProvider
5. **遗留项 3 更新**: 关联 v1-22（设置页面）
6. **遗留项 6 新增**: compact prop 废弃路径规划
