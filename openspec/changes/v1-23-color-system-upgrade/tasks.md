# Tasks: V1-23 Color System Upgrade

- **状态**: 待启动
- **GitHub Issue**: 待创建
- **分支**: `task/<N>-color-system-upgrade`
- **Delta Spec**: `design/system/01-tokens.css`

---

## 验收标准

| ID    | 标准                                                                                    | 验证方式                                                             | 结果 | R10 复核            |
| ----- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ---- | ------------------- |
| AC-1  | `01-tokens.css` 定义 10-step 灰阶变量（`--gray-1` 至 `--gray-10`），暗色/亮色主题各一套 | `grep -c '\-\-gray-' design/system/01-tokens.css` ≥ 20               | ⬜   | ✅ 可操作           |
| AC-2  | 灰阶使用 HSL 格式定义                                                                   | `grep '\-\-gray-' design/system/01-tokens.css \| grep -c 'hsl'` ≥ 20 | ⬜   | ✅ 可操作           |
| AC-3  | 语义 bg token（`--color-bg-base/surface/raised/hover/active/selected`）引用灰阶变量     | `grep 'color-bg-.*var(--gray' design/system/01-tokens.css` ≥ 6       | ⬜   | ✅ 可操作           |
| AC-4  | `--color-error-hover`、`--color-error-active` 在暗色/亮色主题均已定义                   | `grep -c 'color-error-hover\|color-error-active'` = 4                | ⬜   | ✅ 验证命令已补全   |
| AC-5  | `--color-success-hover`、`--color-success-active` 在暗色/亮色主题均已定义               | `grep -c 'color-success-hover\|color-success-active'` = 4            | ⬜   | ✅ 验证命令已补全   |
| AC-6  | `--color-warning-hover`、`--color-warning-active` 在暗色/亮色主题均已定义               | `grep -c 'color-warning-hover\|color-warning-active'` = 4            | ⬜   | ✅ 验证命令已补全   |
| AC-7  | `--color-info-hover`、`--color-info-active` 在暗色/亮色主题均已定义                     | `grep -c 'color-info-hover\|color-info-active'` = 4                  | ⬜   | ✅ 验证命令已补全   |
| AC-8  | `--color-accent-active` 在暗色/亮色主题均已定义                                         | `grep -c 'color-accent-active'` = 2                                  | ⬜   | ✅ 验证命令已补全   |
| AC-9  | `--color-fg-subtle`（暗色主题）与 `--color-bg-base` 对比度 ≥ 4.5:1                      | WCAG 相对亮度公式计算（见 R10 审计意见§验证方法）                    | ⬜   | ✅ 验证方法已细化   |
| AC-10 | 存在 `@media (prefers-contrast: more)` 块                                               | `grep 'prefers-contrast' design/system/01-tokens.css` ≥ 1            | ⬜   | ✅ 可操作           |
| AC-11 | 高对比模式下所有 fg/bg 组合对比度 ≥ 7:1                                                 | WCAG 相对亮度公式计算（见 R10 审计意见§验证方法）                    | ⬜   | ✅ 验证方法已细化   |
| AC-12 | 现有 boundary test 全部通过（零回归）                                                   | `pnpm -C apps/desktop vitest run`                                    | ⬜   | ✅ 已去除硬编码数字 |
| AC-13 | TypeScript 类型检查通过                                                                 | `pnpm typecheck`                                                     | ⬜   | ✅ 可操作           |
| AC-14 | Storybook 可构建                                                                        | `pnpm -C apps/desktop storybook:build`                               | ⬜   | ✅ 可操作           |
| AC-15 | lint 无新增违规                                                                         | `pnpm lint`                                                          | ⬜   | ✅ 可操作           |

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
- **features/ 硬编码色值清理**：69 处硬编码色值（hex 50 + rgba 19，R10 实测）的清理归属后续 change（v1-18 推广或专项清理）

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

---

## R9 级联刷新记录（2026-03-22）

### 触发源

v1-17（字体打包+阴影Token）PR #1222 + v1-18（Arbitrary清理+变体推广）PR #1223 CI 全绿。

### 基线指标变化

| 指标                      | R1 实测值 | R9 实测值         | Delta     | 影响                                                       |
| ------------------------- | --------- | ----------------- | --------- | ---------------------------------------------------------- |
| tokens.css 总行数         | 469       | 469（合并后→472） | ±0（→+3） | v1-17 新增 shadow token，不影响色彩任务                    |
| 色彩 token 数量           | 99        | 99（合并后→101）  | ±0（→+2） | shadow 相关色彩 token，非色彩系统核心                      |
| features/ 硬编码 hex      | 25        | 50                | +25       | 增量来自 v1-14/v1-15 注释和测试；v1-23 Non-Goals 不改 .tsx |
| features/ 硬编码 rgb/rgba | 19        | 19                | ±0        | 不变                                                       |
| 其余指标                  | —         | —                 | ±0        | HSL/灰阶/功能色 hover·active/prefers-contrast 均保持 0     |

### AC 调整

- **AC-12**（原文 "现有 163 个 boundary test 全部通过"）：v1-17 新增 28 条 + v1-18 新增 5 条 guard 测试，合并后测试总数将增加。**建议修订为 "现有 boundary test 全部通过（零回归）"**，不锁定具体数字
- 其余 AC 无需调整

### Task 调整

- **Phase 0 准备**：无需调整。`01-tokens.css` 的色彩 token 结构未变（v1-17 仅追加 shadow 区域）
- **Phase 1 HSL 灰阶**：无需调整。灰阶 token 仍为 0，v1-17 shadow token 不影响灰阶系统
- **Phase 2 功能色补全**：无需调整。功能色 hover/active token 仍为 0
- **Phase 3 对比度修复**：无需调整。`--color-fg-subtle` 值不变
- **Task 2.6（消除组件级硬编码）**：features/ 硬编码 hex 从 25→50，但增量主要是注释和测试中的 hex，而非组件层 hover 硬编码。Task 2.6 的 scope（`--color-btn-danger-hover` 等）不受影响
- **遗留项（features/ 硬编码色值清理）**：44 处硬编码色值已增至约 69 处（hex 50 + rgba 19），后续清理工作量增加

---

## R10 级联刷新记录（2026-03-22）

### 触发源

v1-17（字体打包+阴影Token）PR #1222 + v1-18（Arbitrary清理+变体推广）PR #1223 已合并到 main。

### R10 基线确认（v1-17 / v1-18 合并后实测）

| 指标                      | R9 预测值 | R10 实测值  | 状态        | 说明                                  |
| ------------------------- | --------- | ----------- | ----------- | ------------------------------------- |
| tokens.css 总行数         | 472       | **472**     | ✅ 吻合     | v1-17 shadow token 新增 +3 行已生效   |
| 色彩 token 数量           | 101       | **101**     | ✅ 吻合     | v1-17 shadow 相关色彩 token +2 已生效 |
| HSL 使用量                | 0         | **0**       | ✅ 不变     | 待 v1-23 迁移                         |
| 灰阶 token 数             | 0         | **0**       | ✅ 不变     | 待 v1-23 新建                         |
| 功能色 hover/active token | 0         | **0**       | ✅ 不变     | 待 v1-23 新建                         |
| hover/active 相关行       | 17        | **17**      | ✅ 不变     | 组件级 hover，非功能色系统            |
| `prefers-contrast` 支持   | 0         | **0**       | ✅ 不变     | 待 v1-23 新建                         |
| features/ 硬编码 hex      | 50        | **50**      | ✅ 吻合     | v1-18 清理 arbitrary，未改变 hex 计数 |
| features/ 硬编码 rgb/rgba | 19        | **19**      | ✅ 吻合     | 不变                                  |
| shadow token 档位         | 6         | **6**       | ✅ 吻合     | shadow-xs 至 shadow-2xl 6 档齐全      |
| main.css 行数             | —         | **645**     | 📋 新增采集 | `@theme` 桥接区域完整                 |
| fg-subtle 暗色值          | #666666   | **#666666** | ✅ 不变     | 对比度 3.49:1（低于 4.5:1 阈值）      |
| bg-base 暗色值            | #080808   | **#080808** | ✅ 不变     |                                       |

### R10 复核结论

- **R9 预测全部命中**：tokens.css 行数、色彩 token 数、features/ 硬编码色值等所有指标与 R9 预测一致
- **AC 表已更新**：R10 复核列已填写；AC-4～AC-8 验证命令从「`grep` 计数」补全为完整命令；AC-9/AC-11 验证方式从「对比度计算工具验证」细化为 WCAG 相对亮度公式（见下方审计意见）
- **遗留项已更新**：硬编码色值从"44处"修正为"69处（hex 50 + rgba 19）"
- **Phase / Task 结构无需调整**：v1-17/v1-18 合并后的增量（shadow token）不影响 v1-23 核心 scope

---

## R10 审计意见

> 「工欲善其事，必先利其器。」——《论语·卫灵公》
> 以下审计意见基于 R10 实测数据，供 v1-23 实施前参考。

### 1. HSL 灰阶迁移的技术可行性

**结论：可行，但需注意精度**

hex → HSL 的转换在纯灰色（`hsl(0 0% N%)`）上是精确的，因为 `#080808` = `hsl(0 0% 3.14%)`、`#1a1a1a` = `hsl(0 0% 10.2%)` 等对应关系无歧义。但 v1-23 的目标不是逐值翻译，而是重新设计等感知亮度步进的 10-step 色阶——这意味着灰阶值会发生变化。

**风险**：语义 token（如 `--color-bg-surface`）的实际色值会因灰阶重新设计而改变。proposal 的 Non-Goals 声明"语义 token 值从 hex 替换为 `var(--gray-N)`，外部引用语义 token 不变，零破坏"——但"零破坏"仅指 API 层面（token 名不变），视觉上必然有偏差。

**建议**：Phase 1 的 Task 1.3 已包含 Storybook 截图比对，足以覆盖此风险。无需额外措施。

### 2. 功能色 hover/active lightness ±5%/±10% 策略

**结论：合理，与业界惯例一致**

- Radix Colors 的 step 间距约 4-6% lightness
- Tailwind 的色阶间距（如 red-500 → red-600）约 5-8% lightness
- ±5% hover / ±10% active 的策略在视觉上提供足够的交互反馈，不至于过激

**注意点**：

- 暗色主题应向亮方向调整（lightness +5%/+10%），亮色主题应向暗方向调整（lightness -5%/-10%），proposal 已正确描述此行为
- 当前 `--color-btn-danger-hover` 暗色 = `#dc2626`（error base `#ef4444` 的 lightness 约降低 8%），与 ±5% 策略存在差异——迁移后 hover 色值会略有变化，需在 Task 2.6 验证视觉效果

### 3. 高对比模式在 Electron 中的支持状态

**结论：Electron 40（Chromium 134）完全支持 `prefers-contrast: more`**

- `prefers-contrast` 媒体查询在 Chromium 96+ 正式支持（W3C Media Queries Level 5）
- Electron 40 使用 Chromium 134，远超支持基线
- **macOS**：系统偏好设置 → 辅助功能 → 显示 → 增大对比度 → 触发 `prefers-contrast: more` ✅
- **Windows**：设置 → 辅助功能 → 对比度主题 → 选择高对比主题 → 触发 ✅
- **Linux**：GTK 高对比主题可触发，但不同桌面环境行为不一致 ⚠️

**建议**：Phase 3 的 Task 3.2 应补充一条：验证 Electron 渲染进程中 `prefers-contrast: more` 实际生效（可通过 DevTools → Rendering → Emulate CSS media feature → `prefers-contrast: more` 测试）。

### 4. 44→69 处硬编码色值的消除策略

**结论：v1-23 scope 内不应处理，当前策略合理**

- proposal 的 Non-Goals 明确声明"不修改现有组件代码"，features/ 下的 .tsx 文件不在改动范围
- R10 实测 69 处（hex 50 + rgba 19）中，增量 25 处 hex 主要来自 v1-14/v1-15 新增文件中的注释 issue 编号（`#571`、`#001`）和测试文件中的 accentColor（`#3b82f6`）——并非全部是需要清理的硬编码色值
- Task 2.6 仅消除 `01-tokens.css` 内部的组件级硬编码（`--color-btn-danger-hover` → `var(--color-error-hover)`），scope 正确

### 5. 对比度验证方法（AC-9 / AC-11）

AC-9（4.5:1）和 AC-11（7:1）的验证方式原为"对比度计算工具验证"，现细化如下：

**WCAG 2.x 相对亮度对比度计算**：

```python
def luminance(r, g, b):
    """sRGB → 相对亮度（ITU-R BT.709）"""
    rs, gs, bs = r/255, g/255, b/255
    r_lin = rs/12.92 if rs <= 0.04045 else ((rs+0.055)/1.055)**2.4
    g_lin = gs/12.92 if gs <= 0.04045 else ((gs+0.055)/1.055)**2.4
    b_lin = bs/12.92 if bs <= 0.04045 else ((bs+0.055)/1.055)**2.4
    return 0.2126*r_lin + 0.7152*g_lin + 0.0722*b_lin

def contrast_ratio(c1, c2):
    l1, l2 = luminance(*c1), luminance(*c2)
    return (max(l1,l2) + 0.05) / (min(l1,l2) + 0.05)
```

**R10 实测参考值**：

| 色值对                                               | 对比度 | 达标              |
| ---------------------------------------------------- | ------ | ----------------- |
| `#666666` / `#080808`（当前 fg-subtle/bg-base 暗色） | 3.49:1 | ❌ 低于 4.5:1     |
| `#787878` / `#080808`（达到 4.5:1 的最低灰度）       | 4.54:1 | ✅ AA             |
| `#8a8a8a` / `#080808`（proposal 建议值）             | 5.80:1 | ✅ AA（余量充足） |
| `#999999` / `#080808`（达到 7:1 的最低灰度）         | 7.03:1 | ✅ AAA            |
| `#888888` / `#ffffff`（当前 fg-subtle/bg-base 亮色） | 3.54:1 | ❌ 低于 4.5:1     |

**注意**：proposal 中对比度"约 3.6:1"的表述与实测值 3.49:1 有轻微偏差（目测计算 vs 精确公式），不影响结论。亮色主题的 `--color-fg-subtle`（`#888888`）对比度同样未达 AA 标准，Phase 3 Task 3.1 应同时关注两个主题。

### 6. 综合评估

| 维度         | 评估                                                     |
| ------------ | -------------------------------------------------------- |
| AC 覆盖度    | ✅ 15 条 AC 完整覆盖 proposal 全部要求                   |
| Phase 结构   | ✅ 4 Phase 与 proposal 一致                              |
| Task 粒度    | ✅ 具体到 token 名称 / 文件级别                          |
| 验证可操作性 | ✅ AC-4～AC-8 grep 命令已补全；AC-9/AC-11 已给出计算公式 |
| 基线准确性   | ✅ R10 实测与 R9 预测完全一致                            |
| 技术可行性   | ✅ Electron 40 支持所有所需 CSS 特性                     |
| 风险控制     | ✅ Non-Goals 边界清晰；视觉偏差由 Storybook 截图比对覆盖 |
