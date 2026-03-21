# Tasks: V1-23 Color System Upgrade

- **状态**: 待启动
- **GitHub Issue**: 待创建
- **分支**: `task/<N>-color-system-upgrade`
- **Delta Spec**: `design/system/01-tokens.css`

---

## 验收标准

| ID    | 标准                                                                                    | 验证方式                                                             | 结果 | R1 复核 |
| ----- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ---- | ------- |
| AC-1  | `01-tokens.css` 定义 10-step 灰阶变量（`--gray-1` 至 `--gray-10`），暗色/亮色主题各一套 | `grep -c '\-\-gray-' design/system/01-tokens.css` ≥ 20               | ⬜   |         |
| AC-2  | 灰阶使用 HSL 格式定义                                                                   | `grep '\-\-gray-' design/system/01-tokens.css \| grep -c 'hsl'` ≥ 20 | ⬜   |         |
| AC-3  | 语义 bg token（`--color-bg-base/surface/raised/hover/active/selected`）引用灰阶变量     | `grep 'color-bg-.*var(--gray' design/system/01-tokens.css` ≥ 6       | ⬜   |         |
| AC-4  | `--color-error-hover`、`--color-error-active` 在暗色/亮色主题均已定义                   | `grep` 计数 = 4                                                      | ⬜   |         |
| AC-5  | `--color-success-hover`、`--color-success-active` 在暗色/亮色主题均已定义               | `grep` 计数 = 4                                                      | ⬜   |         |
| AC-6  | `--color-warning-hover`、`--color-warning-active` 在暗色/亮色主题均已定义               | `grep` 计数 = 4                                                      | ⬜   |         |
| AC-7  | `--color-info-hover`、`--color-info-active` 在暗色/亮色主题均已定义                     | `grep` 计数 = 4                                                      | ⬜   |         |
| AC-8  | `--color-accent-active` 在暗色/亮色主题均已定义                                         | `grep` 计数 = 2                                                      | ⬜   |         |
| AC-9  | `--color-fg-subtle`（暗色主题）与 `--color-bg-base` 对比度 ≥ 4.5:1                      | 对比度计算工具验证                                                   | ⬜   |         |
| AC-10 | 存在 `@media (prefers-contrast: more)` 块                                               | `grep 'prefers-contrast'` ≥ 1                                        | ⬜   |         |
| AC-11 | 高对比模式下所有 fg/bg 组合对比度 ≥ 7:1                                                 | 对比度计算工具验证                                                   | ⬜   |         |
| AC-12 | 现有 boundary test 全部通过（零回归）                                                   | `pnpm -C apps/desktop vitest run`                                    | ⬜   |         |
| AC-13 | TypeScript 类型检查通过                                                                 | `pnpm typecheck`                                                     | ⬜   |         |
| AC-14 | Storybook 可构建                                                                        | `pnpm -C apps/desktop storybook:build`                               | ⬜   |         |
| AC-15 | lint 无新增违规                                                                         | `pnpm lint`                                                          | ⬜   |         |

---

## Phase 0: 准备

- [ ] 阅读 `AGENTS.md` 和 `design/DESIGN_DECISIONS.md`
- [ ] 阅读 `design/system/01-tokens.css` 全文，理解当前色彩 token 结构
- [ ] 阅读 `docs/references/design-ui-architecture.md`，理解 Design Token → Tailwind 桥接机制
- [ ] 研究 Radix Colors 灰阶体系，确定 10-step HSL 色阶的亮度分布策略
- [ ] 验证当前对比度数据：`--color-fg-subtle`（`#666666`）/ `--color-bg-base`（`#080808`）实际对比度
- [ ] 确认 `@media (prefers-contrast: more)` 在 Electron 渲染进程中的支持情况
- [ ] 阅读 `docs/references/testing/README.md` 了解测试规范

---

## Phase 1: HSL 灰阶系统（AC-1, AC-2, AC-3）

### Task 1.1: 定义 10-step 灰阶变量

- [ ] 在 `:root`（暗色主题）定义 `--gray-1` 至 `--gray-10`，使用 HSL 格式
- [ ] 在 `:root[data-theme="light"]` 定义对应的亮色灰阶
- [ ] 灰阶步进遵循等感知亮度原则（参考 Radix Gray scale）
- [ ] 验证：`grep -c '\-\-gray-' design/system/01-tokens.css` ≥ 20

### Task 1.2: 语义 token 引用灰阶

- [ ] `--color-bg-base` 引用 `var(--gray-1)`
- [ ] `--color-bg-surface` 引用 `var(--gray-2)`
- [ ] `--color-bg-raised` 引用 `var(--gray-3)`
- [ ] `--color-bg-hover` 引用 `var(--gray-4)`
- [ ] `--color-bg-active` 引用 `var(--gray-5)`
- [ ] `--color-bg-selected` 引用 `var(--gray-6)`
- [ ] `--color-fg-*` 系列根据灰阶对应关系引用
- [ ] `--color-border-*` 系列根据灰阶对应关系引用
- [ ] 验证：视觉差异最小化（Storybook 截图比对）

### Task 1.3: 灰阶回归验证

- [ ] 运行全量测试：`pnpm -C apps/desktop vitest run`
- [ ] 构建 Storybook：`pnpm -C apps/desktop storybook:build`
- [ ] 视觉比对：hex → HSL 迁移后组件视觉无明显偏差

---

## Phase 2: 功能色状态补全（AC-4 ~ AC-8）

### Task 2.1: Error 色 hover/active

- [ ] 暗色主题：定义 `--color-error-hover`（基础色 lightness +5%）、`--color-error-active`（lightness +10%）
- [ ] 亮色主题：定义 `--color-error-hover`（lightness -5%）、`--color-error-active`（lightness -10%）
- [ ] 验证：`grep -c 'color-error-hover\|color-error-active' design/system/01-tokens.css` = 4

### Task 2.2: Success 色 hover/active

- [ ] 暗色主题：定义 `--color-success-hover`、`--color-success-active`
- [ ] 亮色主题：定义 `--color-success-hover`、`--color-success-active`
- [ ] 验证：grep 计数 = 4

### Task 2.3: Warning 色 hover/active

- [ ] 暗色主题：定义 `--color-warning-hover`、`--color-warning-active`
- [ ] 亮色主题：定义 `--color-warning-hover`、`--color-warning-active`
- [ ] 验证：grep 计数 = 4

### Task 2.4: Info 色 hover/active

- [ ] 暗色主题：定义 `--color-info-hover`、`--color-info-active`
- [ ] 亮色主题：定义 `--color-info-hover`、`--color-info-active`
- [ ] 验证：grep 计数 = 4

### Task 2.5: Accent active 态

- [ ] 暗色主题：定义 `--color-accent-active`
- [ ] 亮色主题：定义 `--color-accent-active`
- [ ] 验证：`grep -c 'color-accent-active' design/system/01-tokens.css` = 2

### Task 2.6: 消除组件级硬编码

- [ ] 将 `--color-btn-danger-hover: #dc2626` 替换为 `var(--color-error-hover)`
- [ ] 将 `--color-btn-success-hover: #16a34a` 替换为 `var(--color-success-hover)`
- [ ] 验证组件视觉效果不变

---

## Phase 3: 对比度修复与高对比模式（AC-9 ~ AC-11）

### Task 3.1: 对比度修复

- [ ] 调整暗色主题 `--color-fg-subtle` 使其与 `--color-bg-base` 对比度 ≥ 4.5:1
- [ ] 验证亮色主题 `--color-fg-muted`、`--color-fg-subtle` 对比度合规
- [ ] 验证所有语义 fg/bg 组合达标

### Task 3.2: 高对比模式

- [ ] 新增 `@media (prefers-contrast: more)` 块
- [ ] 高对比模式下 fg 色提升亮度/降低亮度，确保对比度 ≥ 7:1
- [ ] 高对比模式下边框可见性增强
- [ ] 验证：`grep 'prefers-contrast' design/system/01-tokens.css` ≥ 1

### Task 3.3: 最终验证

- [ ] 全量测试通过：`pnpm -C apps/desktop vitest run`（AC-12）
- [ ] TypeScript 检查通过：`pnpm typecheck`（AC-13）
- [ ] Storybook 构建通过：`pnpm -C apps/desktop storybook:build`（AC-14）
- [ ] lint 无新增违规：`pnpm lint`（AC-15）

---

## 遗留项

- **功能色 5-step 色阶**（可选增强）：若时间允许，为 error/success/warning/info/accent 各生成 `--{color}-100` 至 `--{color}-500` 色阶。若不实施，作为后续 change 候选
- **组件层功能色 hover 迁移**：`--color-btn-danger-hover` 等组件级 token 引用统一后，组件 `.tsx` 文件中的直接引用需在后续 change 中迁移
- **features/ 硬编码色值清理**：44 处硬编码色值的清理归属后续 change（v1-18 推广或专项清理）

---

## R1 Cascade Refresh 记录（2026-03-21）

### 上游依赖复核

- **v1-01** ✅ 完成（2026-03-20 验收）——tokens.css 469 行，99 个色彩 token，HSL 0 处
- **v1-02** ✅ 完成（2026-03-21 验收）——组件层重构完成，未触及 `01-tokens.css` 色彩定义

### 基线指标验证

| 指标                      | 实测值 | 采集命令                                                                                        |
| ------------------------- | ------ | ----------------------------------------------------------------------------------------------- |
| 色彩 token 数量           | 99     | `grep -cE '\-\-color-' design/system/01-tokens.css`                                             |
| 灰阶 token                | 0      | `grep -cE '\-\-gray-' design/system/01-tokens.css`                                              |
| 功能色 hover/active token | 0      | `grep -cE '\-\-(error\|success\|warning\|info)-(hover\|active)' design/system/01-tokens.css`    |
| features/ 硬编码 hex      | 25     | `grep -rn '#[0-9a-fA-F]\{3,8\}' apps/desktop/renderer/src/features/ --include='*.tsx' \| wc -l` |
| features/ 硬编码 rgb/rgba | 19     | `grep -rnE 'rgb\(\|rgba\(' apps/desktop/renderer/src/features/ --include='*.tsx' \| wc -l`      |
| HSL 使用量                | 0      | `grep -c 'hsl' design/system/01-tokens.css`                                                     |
| `prefers-contrast` 支持   | 0      | `grep -c 'prefers-contrast' design/system/01-tokens.css`                                        |
| tokens.css 总行数         | 469    | `wc -l design/system/01-tokens.css`                                                             |

所有指标与初始建档一致，无变化。

### Phase 0 调整

无需调整。上游依赖已全部就绪，Phase 0 准备任务保持不变。
