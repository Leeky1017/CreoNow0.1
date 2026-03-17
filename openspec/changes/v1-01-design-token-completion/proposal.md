# V1-01 Design Token 补完

- **GitHub Issue**: 待创建
- **所属任务簇**: V1（视觉重塑）— Wave 0 地基增强
- **涉及模块**: design-system、renderer/styles
- **前端验收**: 需要（Storybook 构建通过 + token 引用一致性验证）

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

| 数据点                     | 值                                                                    | 来源                                                                |
| -------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------- |
| tokens.css 行数            | 405 行                                                                | `wc -l design/system/01-tokens.css`                                 |
| `text-[Npx]` arbitrary 值  | 704 处                                                                | `grep -r 'text-\[' features/ --include='*.tsx' \| wc -l`            |
| 现有 typography token 档数 | 8 档（page-title/card-title/subtitle/body/editor/caption/label/tree） | `grep 'text-.*-size' tokens.css`                                    |
| 设计稿 48px 大标题         | `01-dashboard.html`                                                   | 设计稿 `.page-title { font-size: 48px }`                            |
| 语义间距 token             | 0 个                                                                  | `grep 'space-panel\|space-section\|space-item' tokens.css` → 无匹配 |
| `@theme` 导出 duration     | 3 个（fast/normal/slow）                                              | `grep 'duration' main.css @theme`                                   |
| tokens.css 定义 duration   | 5 个（instant/fast/normal/slow/slower）                               | `grep 'duration' tokens.css`                                        |
| 设计稿总数                 | 36 个 HTML                                                            | `ls design/Variant/designs/*.html \| wc -l`                         |

---

## What：做什么

### 1. Typography Scale 补完

在 `design/system/01-tokens.css` 中补充设计稿要求但当前缺失的 typography token：

- `--text-display-*`（48px / 300 weight / -0.03em tracking / 1.1 line-height）——页面大标题
- `--text-heading-*`（24px / 600 weight / -0.02em tracking / 1.2 line-height）——此档与现有 `--text-page-title-*` 尺寸重合，需评估是合并还是共存
- `--text-nav-*`（13px / 500 weight / 0 tracking / 1.4 line-height）——导航元素、文件树（与 `--text-tree-*` 统一或建立别名）
- `--text-metadata-*`（12px / 400 weight / 0.02em tracking / 1.4 line-height）——时间戳、字数、标签等元数据
- 独立 weight token：`--weight-light`（300）、`--weight-normal`（400）、`--weight-medium`（500）、`--weight-semibold`（600）
- 独立 tracking token：`--tracking-tight`（-0.03em）、`--tracking-normal`（0）、`--tracking-wide`（0.05em）、`--tracking-wider`（0.1em）
- 独立 leading token：`--leading-tight`（1.1）、`--leading-normal`（1.5）、`--leading-relaxed`（1.8）

### 2. 语义化间距 Token

在 `design/system/01-tokens.css` 中新增组件级语义间距别名：

- `--space-panel-padding: var(--space-4)`（16px，面板内边距）
- `--space-section-gap: var(--space-6)`（24px，区块间距）
- `--space-item-gap: var(--space-2)`（8px，列表项间距）
- `--space-inline-gap: var(--space-1)`（4px，行内元素间距）

### 3. Animation Token 完善

在 `renderer/src/styles/main.css` 的 `@theme` 块中补全未导出的 token：

- `--duration-instant: 50ms`
- `--duration-slower: 500ms`

### 4. `@theme` 统一导出

在 `renderer/src/styles/main.css` 的 `@theme` 块中新增 typography 的 Tailwind 映射，使其可通过 Tailwind utility class 使用。

### 5. `renderer/src/styles/tokens.css` 同步

确认 `renderer/src/styles/tokens.css` 与 `design/system/01-tokens.css` 的同步关系，如为手动复制则同步更新。

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
- **风险**: 新增 token 命名与现有 `--text-page-title-*` 等 token 的命名边界需在 spec 中明确，避免语义重叠
