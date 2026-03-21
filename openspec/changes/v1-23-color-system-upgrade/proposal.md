# V1-23 Color System Upgrade

> 📋 **级联刷新 R1**（2026-03-21）：v1-01 完成后建档。基线已采集。

- **状态**: 待启动
- **GitHub Issue**: 待创建
- **所属任务簇**: V1（视觉重塑）— Wave 0 地基增强
- **涉及模块**: design/system（色彩 Token 层）
- **前端验收**: 需要（Token 变更后 Storybook 构建 + 对比度验证）

---

## Why：为什么必须做

### 1. 用户现象

v1-01 建立了完整的 Design Token 体系（469 行，99 个色彩 token），但色彩系统仍为「手工调色」阶段：

- **无系统色阶**：所有颜色使用原始 hex（`#080808`、`#0f0f0f`、`#141414`…）或 rgba，缺少类似 Radix Colors 的 10-step 色阶体系。当需要「比 `--color-bg-surface` 稍亮一点」时，只能凭经验手写 hex 值——"无尺之测，虽巧不中。"
- **功能色状态缺失**：`--color-error`（`#ef4444`）、`--color-success`（`#22c55e`）、`--color-warning`（`#f59e0b`）、`--color-info`（`#3b82f6`）四个功能色仅有基础色和 subtle 态，缺少 hover / active 状态 token。组件层只能在 `--color-btn-danger-hover` 等处零散硬编码（`#dc2626`），无法系统复用
- **无高对比模式**：暗色主题下 `--color-fg-subtle`（`#666666`）与 `--color-bg-base`（`#080808`）的对比度约 3.6:1，未达 WCAG AA 标准（4.5:1）。无 `prefers-contrast: more` 媒体查询支持
- **硬编码色值泄漏**：features/ 目录存在 25 处硬编码 hex 和 19 处硬编码 rgb/rgba，说明现有 token 覆盖不足

### 2. 根因

v1-01 以「定义语义 token + 统一引用入口」为目标，色值本身沿用设计稿原始值。这些原始值缺乏数学推导关系——灰阶 7 级（`#080808` → `#222222`）之间的亮度步进不均匀，功能色仅取 Tailwind 默认色板单点值，无系统性派生。

| 问题域      | 当前状态                                 | 缺口                                     |
| ----------- | ---------------------------------------- | ---------------------------------------- |
| 灰阶体系    | 7 级手工 hex，步进不均匀                 | 需 10-step HSL 色阶，等感知亮度步进      |
| 功能色状态  | 仅 base + subtle（4 色 × 2 = 8 token）   | 需 hover + active（4 色 × 4 = 16 token） |
| Accent 状态 | base + hover + muted + subtle（4 token） | 需 active 态                             |
| 对比度      | fg-subtle/bg-base ≈ 3.6:1                | 需 ≥ 4.5:1（WCAG AA）                    |
| 高对比模式  | 不存在                                   | 需 `prefers-contrast: more` 支持         |
| 色值格式    | hex + rgba，无 HSL                       | HSL 便于程序化派生（调亮度 / 饱和度）    |
| 硬编码色值  | features/ 44 处                          | token 覆盖不足的症状                     |

### 3. 威胁

- **设计一致性崩溃**：无系统色阶时，每个新组件的"稍微亮/暗一点"都靠人工猜测 hex，长期积累将导致灰阶混乱
- **交互态缺失**：功能色按钮（danger/success）的 hover/active 效果只能在组件层硬编码，主题切换时无法联动
- **无障碍合规风险**：当前对比度不达标的 token 在后续 v1-19（无障碍审计）中必然暴露，提前修复比事后返工成本低
- **主题扩展受阻**：未来添加新主题（如高对比）时，需从零定义所有色值；HSL 色阶体系可大幅降低新主题的定义成本

### 4. 证据来源（基线采集 2026-03-21）

| 数据点                        | 实测值                                 | 采集命令                                                                                        |
| ----------------------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------- |
| tokens.css 总行数             | 469 行                                 | `wc -l design/system/01-tokens.css`                                                             |
| 色彩 token 数量               | 99 个                                  | `grep -c '\-\-color-' design/system/01-tokens.css`                                              |
| HSL 使用量                    | 0                                      | `grep -c 'hsl' design/system/01-tokens.css`                                                     |
| hover/active 相关行           | 17 行                                  | `grep -c 'hover\|active' design/system/01-tokens.css`                                           |
| 功能色 hover token            | 仅 btn-danger-hover、btn-success-hover | `grep 'hover' design/system/01-tokens.css`                                                      |
| 功能色 active token           | 0                                      | `grep 'active' design/system/01-tokens.css`（仅 bg-active，非功能色 active）                    |
| fg-subtle 对比度（暗色）      | #666666 / #080808 ≈ 3.6:1              | 目测计算                                                                                        |
| features/ 硬编码 hex          | 25 处                                  | `grep -rn '#[0-9a-fA-F]\{3,8\}' apps/desktop/renderer/src/features/ --include='*.tsx' \| wc -l` |
| features/ 硬编码 rgb/rgba/hsl | 19 处                                  | `grep -rn 'rgb\|rgba\|hsl' apps/desktop/renderer/src/features/ --include='*.tsx' \| wc -l`      |
| Light theme                   | 存在（`:root[data-theme="light"]`）    | `grep 'data-theme.*light' design/system/01-tokens.css`                                          |
| 高对比模式                    | 不存在                                 | `grep 'prefers-contrast' design/system/01-tokens.css`                                           |

---

## What：做什么

### 1. HSL 10-step 灰阶系统

将暗色/亮色主题的灰阶从手工 hex 迁移为 HSL 色阶体系（类 Radix Colors gray scale）：

- 定义 10-step 灰阶：`--gray-1` 至 `--gray-10`，使用 HSL 格式，等感知亮度步进
- 暗色主题：从近黑（`hsl(0 0% 3%)`）到中灰（`hsl(0 0% 45%)`）
- 亮色主题：从纯白（`hsl(0 0% 100%)`）到中灰（`hsl(0 0% 45%)`）
- 语义 token（`--color-bg-base`、`--color-bg-surface` 等）引用灰阶变量而非直接写 hex
- **迁移策略**：语义 token 值从 hex 替换为 `var(--gray-N)`，外部引用语义 token 不变，零破坏

### 2. 功能色 hover/active 状态补全

为 error / success / warning / info 四个功能色系统补全交互状态 token：

| 功能色  | 现有 token                 | 新增 token                                        |
| ------- | -------------------------- | ------------------------------------------------- |
| error   | base, subtle               | `--color-error-hover`, `--color-error-active`     |
| success | base, subtle               | `--color-success-hover`, `--color-success-active` |
| warning | base, subtle               | `--color-warning-hover`, `--color-warning-active` |
| info    | base, subtle               | `--color-info-hover`, `--color-info-active`       |
| accent  | base, hover, muted, subtle | `--color-accent-active`                           |

- hover 态：基础色 lightness ±5%（HSL 调整）
- active 态：基础色 lightness ±10%（HSL 调整）
- 暗色/亮色主题各自定义
- 消除 `--color-btn-danger-hover` 等组件级硬编码，统一引用功能色 hover token

### 3. 对比度修复

- `--color-fg-subtle`（暗色）从 `#666666` 调整至 ≥ 4.5:1 对比度（约 `#8a8a8a` 或等效 HSL）
- `--color-fg-muted`（亮色）验证并确保 ≥ 4.5:1
- 所有语义前景色 / 背景色组合验证 WCAG AA 合规

### 4. 高对比模式

- 新增 `@media (prefers-contrast: more)` 块
- 在高对比模式下提升前景色亮度 / 降低背景色亮度，确保所有文字对比度 ≥ 7:1（WCAG AAA）
- 边框可见性增强：`--color-border-default` 提升对比度

### 5. 功能色 HSL 色阶（可选增强）

若时间允许，为 error / success / warning / info / accent 各生成 5-step HSL 色阶：

- `--{color}-100`（最浅/subtle）至 `--{color}-500`（最深/base）
- 语义 token 引用色阶变量

---

## Non-Goals：不做什么

1. **不修改现有组件代码**——只修改 `design/system/01-tokens.css` 中的 token 定义和值，不修改 `.tsx` 组件文件（功能色 hover token 统一后，组件层的消费迁移由后续 change 处理）
2. **不做完整 WCAG 审计**——对比度修复仅覆盖 token 层面已知问题（fg-subtle/fg-muted），完整无障碍审计在 v1-19
3. **不修改 Tailwind 配置**——`main.css` 中的 `@theme` 桥接在 token 值更新后自动生效
4. **不引入运行时色彩计算**——所有色阶在 CSS 中静态定义，不引入 JS 色彩库
5. **不修改 Node 知识图谱配色**——`--color-node-*` 系列 token 保持不变（属 KG 模块管辖）

---

## 依赖与影响

- **上游依赖**: v1-01（Design Token 补完）——✅ 已合并。本 change 在 v1-01 建立的 token 架构上扩展色阶系统
- **下游影响**:
  - v1-25（Density Token）：密度 token 可能引用色彩 token，需确保命名兼容
  - v1-19（无障碍审计）：本 change 的对比度修复为 v1-19 提前解决部分问题
  - v1-02（Primitives）：组件层通过语义 token 引用色彩，token 值更新后组件视觉自动跟进
- **并行安全**: 本 change 只修改 `design/system/01-tokens.css`，不修改组件文件，合并冲突风险低
- **风险**:
  - 灰阶从 hex 迁移到 HSL 引用后，视觉上可能有细微偏差——需通过 Storybook 截图比对验证
  - 高对比模式是新增能力，不影响默认主题行为
- **预估工作量**: 0.8× v1-02

---

## R1 Cascade Refresh (2026-03-21)

### 上游依赖状态

| 依赖  | 状态                                    |
| ----- | --------------------------------------- |
| v1-01 | ✅ 完成（2026-03-20 验收，R1 复核通过） |
| v1-02 | ✅ 完成（2026-03-21 验收，⭐⭐⭐⭐⭐）  |

### 基线指标复核

所有指标 R1 复核完成，与初始建档一致：

| 指标                          | R1 建档值 | R1 复核值 | 趋势 | 说明                   |
| ----------------------------- | --------- | --------- | ---- | ---------------------- |
| 色彩 token 数量               | 99        | 99        | →    | v1-02 未新增色彩 token |
| HSL 使用量                    | 0         | 0         | →    | 待本 change 迁移       |
| 灰阶 token 数                 | 0         | 0         | →    | 待本 change 新建       |
| 功能色 hover/active token     | 0         | 0         | →    | 待本 change 新建       |
| hover/active 相关行           | 17        | 17        | →    | 组件级 hover，非功能色 |
| `prefers-contrast` 支持       | 0         | 0         | →    | 待本 change 新建       |
| features/ 硬编码 hex          | 25 处     | 25 处     | →    | token 覆盖不足的症状   |
| features/ 硬编码 rgb/rgba/hsl | 19 处     | 19 处     | →    | 同上                   |
| tokens.css 总行数             | 469       | 469       | →    |                        |

### Scope 变更

无需调整。v1-02 完成带来的变化集中在组件层（primitives .tsx），未触及 `01-tokens.css` 的色彩定义，v1-23 的 scope 保持不变。

---

## 验收标准

| ID    | 标准                                                                                    | 验证方式                                                                       |
| ----- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| AC-1  | `01-tokens.css` 定义 10-step 灰阶变量（`--gray-1` 至 `--gray-10`），暗色/亮色主题各一套 | `grep -c '\-\-gray-' design/system/01-tokens.css` ≥ 20                         |
| AC-2  | 灰阶使用 HSL 格式定义                                                                   | `grep '\-\-gray-' design/system/01-tokens.css \| grep -c 'hsl'` ≥ 20           |
| AC-3  | 语义 bg token（`--color-bg-base/surface/raised/hover/active/selected`）引用灰阶变量     | `grep 'color-bg-.*var(--gray' design/system/01-tokens.css` ≥ 6                 |
| AC-4  | `--color-error-hover`、`--color-error-active` 在暗色/亮色主题均已定义                   | `grep 'color-error-hover\|color-error-active' design/system/01-tokens.css` = 4 |
| AC-5  | `--color-success-hover`、`--color-success-active` 在暗色/亮色主题均已定义               | 同上模式，success                                                              |
| AC-6  | `--color-warning-hover`、`--color-warning-active` 在暗色/亮色主题均已定义               | 同上模式，warning                                                              |
| AC-7  | `--color-info-hover`、`--color-info-active` 在暗色/亮色主题均已定义                     | 同上模式，info                                                                 |
| AC-8  | `--color-accent-active` 在暗色/亮色主题均已定义                                         | `grep 'color-accent-active' design/system/01-tokens.css` = 2                   |
| AC-9  | `--color-fg-subtle`（暗色主题）与 `--color-bg-base` 对比度 ≥ 4.5:1                      | 对比度计算工具验证                                                             |
| AC-10 | 存在 `@media (prefers-contrast: more)` 块                                               | `grep 'prefers-contrast' design/system/01-tokens.css` ≥ 1                      |
| AC-11 | 高对比模式下所有 fg/bg 组合对比度 ≥ 7:1                                                 | 对比度计算工具验证                                                             |
| AC-12 | 现有 163 个 boundary test 全部通过（零回归）                                            | `pnpm -C apps/desktop vitest run`                                              |
| AC-13 | TypeScript 类型检查通过                                                                 | `pnpm typecheck`                                                               |
| AC-14 | Storybook 可构建                                                                        | `pnpm -C apps/desktop storybook:build`                                         |
| AC-15 | lint 无新增违规                                                                         | `pnpm lint`                                                                    |
