# V1-01 Design Token 补完

- **状态**: ✅ 已合并到 main
- **完成评级**: ⭐⭐⭐⭐（四星——token 体系超额达成，26 pixel 残留按计划归 v1-18）
- **所属任务簇**: V1（视觉重塑）— Wave 0 地基增强
- **涉及模块**: design-system、renderer/styles
- **前端验收**: 已通过（Storybook 构建通过 + 19 个测试套件全绿）

---

## Why：为什么必须做

### 1. 用户现象

Design Token 文件 `design/system/01-tokens.css`（405 行）覆盖了颜色、间距、圆角、阴影、动效五大类——看似粮草充足。然而用「盘点」视角逐稿核对 36 个设计稿 HTML 后，发现上层 Features 代码中 704 处 `text-[Npx]` arbitrary 值在绕过 token 体系直接硬写字号——"粮仓满而灶台空，炊者自烧柴。"

具体缺口：

- **Typography scale 残缺**：tokens.css 中有 `--text-page-title-*`（24px）、`--text-card-title-*`（16px）、`--text-subtitle-*`（14px）、`--text-body-*`（13px）、`--text-editor-*`（16px）、`--text-caption-*`（12px）、`--text-label-*`（10px）、`--text-tree-*`（13px）共 8 档。但设计稿使用的 48px 页面大标题（`01-dashboard.html`）、24-28px 卡片标题（`03-dashboard-sidebar-full.html`）、12-13px 导航/元数据（`05-file-tree.html`）等关键尺寸无对应 token——开发者只能用 `text-[48px]` 等 arbitrary 值
- **语义化间距缺失**：`--space-*` 提供了 0-80px 的数值阶梯（13 档），但组件级语义间距如面板内边距、区块间隙、列表项间距没有语义别名——开发者在 `--space-4` 和 `p-4` 之间随意选择，间距语义不清
- **Animation token 未完全映射到 `@theme`**：tokens.css 中定义了 `--ease-default`、`--ease-in`、`--ease-out`、`--ease-in-out` 四条曲线和 5 个 duration（instant/fast/normal/slow/slower），但 `main.css` 的 `@theme` 块只导出了 `--ease-default`、`--duration-fast/normal/slow` 三档——`--duration-instant`（50ms）和 `--duration-slower`（500ms）未进入 Tailwind 体系

### 2. 根因

Token 体系的建设分两阶段推进：第一阶段聚焦颜色→间距→圆角→阴影→动效，已完成；第二阶段 Typography scale 在 `DESIGN_DECISIONS.md` §4 中有映射表，但未落地为 CSS 变量和 Tailwind `@theme` 扩展。

### 3. 威胁

- **一致性失控**：Features 层 704 处 `text-[Npx]` arbitrary 值意味着修改任一字号要全局搜索替换，无法通过单一 token 调整
- **主题切换障碍**：浅色主题需要切换 token 值来适配，但 typography 若不走 token 通道，切换浅色主题时将出现大面积遗漏
- **Wave 1-4 基石缺失**：后续 v1-03（Dashboard）、v1-04（编辑器排版）、v1-06（AI 面板）都依赖 typography token——地基不补完，上层每个 change 都要自行硬编码

### 4. 证据来源

| 数据点                             | 完成前     | 完成后                                                | 状态                  | 采集命令                                                                                |
| ---------------------------------- | ---------- | ----------------------------------------------------- | --------------------- | --------------------------------------------------------------------------------------- |
| tokens.css 行数                    | 405 行     | 469 行（+64）                                         | ✅ 已达成             | `wc -l design/system/01-tokens.css`                                                     |
| `text-[Npx]` arbitrary 值          | 704 处     | 667 处（↓5%）                                         | 📋 Non-Goal，归 v1-18 | `grep -rn 'text-\[' apps/desktop/renderer/src/ --include='*.tsx' \| wc -l`              |
| typography token 档数              | 8 档       | 14 档（原计划 12，超额 +2：status/mono）              | ✅ 超额达成           | `grep -c '\-\-text-.*-size' design/system/01-tokens.css`                                |
| 独立 weight/tracking/leading token | 0 个       | 11 个（weight 4 + tracking 4 + leading 3）            | ✅ 已达成             | `grep -cE '\-\-(weight\|tracking\|leading)-' design/system/01-tokens.css`               |
| 语义间距 token                     | 0 个       | 4 个（panel-padding/section-gap/item-gap/inline-gap） | ✅ 已达成             | `grep -cE '\-\-space-(panel\|section\|item\|inline)' design/system/01-tokens.css`       |
| @theme duration                    | 3 个       | 5 个（含 instant 50ms、slower 500ms）                 | ✅ 已达成             | `awk '/@theme/,/^\}/' apps/desktop/renderer/src/styles/main.css \| grep -c 'duration'`  |
| @theme typography 映射             | 0 组       | 14×4=56 条属性映射                                    | ✅ 已达成             | `awk '/@theme/,/^\}/' apps/desktop/renderer/src/styles/main.css \| grep -c '\-\-text-'` |
| renderer tokens.css                | —          | 381 行（与 design tokens 同步，非 @import）           | ✅ 已同步             | `wc -l apps/desktop/renderer/src/styles/tokens.css`                                     |
| 测试覆盖                           | 0 套件     | 19 个测试套件                                         | ✅ 已达成             | `pnpm -C apps/desktop vitest run design-token-v1-01-boundary 2>&1 \| grep 'Tests'`      |
| 设计稿总数                         | 36 个 HTML | 36 个 HTML（不变）                                    | —                     | `ls design/Variant/designs/*.html \| wc -l`                                             |

---

## What：做什么

### 1. Typography Scale 补完 [✅ 已完成]

在 `design/system/01-tokens.css` 中补充设计稿要求但当前缺失的 typography token：

- `--text-display-*`（48px / 300 weight / -0.03em tracking / 1.1 line-height）——页面大标题 [✅ 已完成]
- `--text-heading-*`（24px / 600 weight / -0.02em tracking / 1.2 line-height）——此档与现有 `--text-page-title-*` 尺寸重合，需评估是合并还是共存 [✅ 已完成]
- `--text-nav-*`（13px / 500 weight / 0 tracking / 1.4 line-height）——导航元素、文件树（与 `--text-tree-*` 统一或建立别名） [✅ 已完成]
- `--text-metadata-*`（12px / 400 weight / 0.02em tracking / 1.4 line-height）——时间戳、字数、标签等元数据 [✅ 已完成]
- 独立 weight token：`--weight-light`（300）、`--weight-normal`（400）、`--weight-medium`（500）、`--weight-semibold`（600） [✅ 4 个已完成]
- 独立 tracking token：`--tracking-tight`（-0.03em）、`--tracking-normal`（0）、`--tracking-wide`（0.05em）、`--tracking-wider`（0.1em） [✅ 4 个已完成]
- 独立 leading token：`--leading-tight`（1.1）、`--leading-normal`（1.5）、`--leading-relaxed`（1.8） [✅ 3 个已完成]

> 实际交付超出原计划：typography 档数从计划的 12 档增至 14 档（额外增加了 status 和 mono 两档）。

### 2. 语义化间距 Token [✅ 已完成]

在 `design/system/01-tokens.css` 中新增组件级语义间距别名：

- `--space-panel-padding: var(--space-4)`（16px，面板内边距） [✅ 已完成]
- `--space-section-gap: var(--space-6)`（24px，区块间距） [✅ 已完成]
- `--space-item-gap: var(--space-2)`（8px，列表项间距） [✅ 已完成]
- `--space-inline-gap: var(--space-1)`（4px，行内元素间距） [✅ 已完成]

### 3. Animation Token 完善 [✅ 已完成]

在 `renderer/src/styles/main.css` 的 `@theme` 块中补全未导出的 token：

- `--duration-instant: 50ms` [✅ 已完成]
- `--duration-slower: 500ms` [✅ 已完成]

### 4. `@theme` 统一导出 [✅ 已完成]

在 `renderer/src/styles/main.css` 的 `@theme` 块中新增 typography 的 Tailwind 映射（14 组 × 4 属性 = 56 条），使其可通过 Tailwind utility class 使用。

### 5. `renderer/src/styles/tokens.css` 同步 [✅ 已完成]

`renderer/src/styles/tokens.css`（381 行）已与 `design/system/01-tokens.css` 同步。两者为手动同步关系（非 @import），已确认一致。

---

## Non-Goals：不做什么

1. **不做 arbitrary 值替换**——本 change 只补 token 定义，不大面积替换 Features 层代码中的 `text-[Npx]`；替换工作在 Wave 1-4 各 child change 中按模块逐步进行
2. **不修改 Primitives 组件代码**——Primitives 的 token 引用更新归 v1-02
3. **不引入新的 CSS 方法论**——继续使用 CSS custom properties + Tailwind v4 `@theme`，不引入 CSS-in-JS 或 styled-components
4. **不做浅色主题的完整调优**——只为新增 token 定义浅色主题值，不调整现有浅色主题的视觉细节
5. **不修改 DESIGN_DECISIONS.md**——设计决策文档由 Owner 维护，本 change 只在 token 层落地其 §4 的 typography 映射

---

## 依赖与影响

- **上游依赖**: 无——token 定义是最底层工作，不依赖其他 change
- **被依赖于**: v1-02（Primitive 组件进化）——v1-02 的新变体样式需要引用本 change 定义的 token；v1-03 至 v1-12 的所有视觉对齐工作均依赖本 change 提供的 typography token
- **并行安全**: 本 change 只新增 token 定义（追加 CSS 变量），不修改现有 token 值，不会与其他 change 产生合并冲突
- **风险**: 新增 token 命名与现有 `--text-page-title-*` 等 token 的命名边界需在 spec 中明确，避免语义重叠（✅ 已在 spec 中解决）

### 已知遗留

v1-01 的 Non-Goals 明确不做 Features 层 arbitrary 值替换。合并后仍有 **26 处 pixel 硬编码**残留，分布在 v1-01/v1-07/v1-16 共性区域，统一归入 **v1-18** 清理。

> "善作者不必善成，善始者不必善终。"——v1-01 筑基已毕，收尾归 v1-18 执扫。

---

## 完成总结

- **完成时间**: 2026-03-20
- **评级**: ⭐⭐⭐⭐
- **主要成果**:
  - tokens.css 从 405 行扩展至 469 行（+64 行），typography 从 8 档扩展至 14 档（超额达成）
  - 新增独立 weight（4）、tracking（4）、leading（3）token 共 11 个
  - 新增语义间距 token 4 个（panel-padding / section-gap / item-gap / inline-gap）
  - @theme duration 从 3 档补全至 5 档（含 instant 50ms 和 slower 500ms）
  - @theme typography 映射 14 组 × 4 属性 = 56 条，全部可通过 Tailwind utility 使用
  - renderer tokens.css（381 行）已同步
  - 测试文件 `design-token-v1-01-boundary.test.ts` 覆盖 19 个测试套件
- **遗留项**: 26 处 pixel 残留 → v1-18（Design Token 大扫除）
