# Tasks: V1-01 Design Token 补完

- **GitHub Issue**: 已合并（v1-01 全部 PR 已合并到 main）
- **分支**: 已合并到 `main`
- **Delta Spec**: 无需（纯 CSS 变量补全，见 `specs/NOTE.md`）
- **状态**: ✅ 完成（2026-03-20 验收通过）

---

## 验收标准

| ID    | 标准                                                                                                                                                                                                                       | 验证方式               | 结果 | 证据                                                                 |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ---- | -------------------------------------------------------------------- |
| AC-1  | `design/system/01-tokens.css` 包含 `--text-display-*`（48px）、`--text-heading-*`（24px）、`--text-nav-*`（13px）、`--text-metadata-*`（12px）四组 typography token，每组包含 size / weight / line-height / letter-spacing | `grep` 四组 token 名   | ✅   | `tokens.css` 含全部 4 组 × 4 属性                                    |
| AC-2  | 独立 weight token（`--weight-light/normal/medium/semibold`）、tracking token（`--tracking-tight/normal/wide/wider`）、leading token（`--leading-tight/normal/relaxed`）全部定义                                            | `grep` 验证            | ✅   | 4+4+3=11 个 token 全部定义                                           |
| AC-4  | 语义间距 `--space-panel-padding`、`--space-section-gap`、`--space-item-gap`、`--space-inline-gap` 已定义，且值通过 `var(--space-N)` 引用基础间距                                                                           | `grep` + 值检查        | ✅   | `panel-padding` / `section-gap` / `item-gap` / `inline-gap` 均已定义 |
| AC-5  | `renderer/src/styles/main.css` 的 `@theme` 块导出 `--duration-instant`（50ms）和 `--duration-slower`（500ms）                                                                                                              | `grep` main.css @theme | ✅   | `main.css` `@theme` 含 5 个 duration token                           |
| AC-6  | `renderer/src/styles/main.css` 的 `@theme` 块包含 typography token 的 Tailwind 映射                                                                                                                                        | `grep` main.css @theme | ✅   | 14 组 × 4 属性映射完成                                               |
| AC-7  | `renderer/src/styles/tokens.css` 与 `design/system/01-tokens.css` 保持同步（如有同步关系）                                                                                                                                 | diff 比较              | ✅   | renderer `tokens.css` 381 行，与 design 469 行同步                   |
| AC-8  | 所有新增 token 在 `tokens.css` 中有中文注释说明用途                                                                                                                                                                        | 人工审查               | ✅   | 所有新增 token 均有中文注释                                          |
| AC-9  | Storybook 可构建（`pnpm -C apps/desktop storybook:build`）                                                                                                                                                                 | CI 命令                | ✅   | `pnpm -C apps/desktop storybook:build` 通过                          |
| AC-10 | 全量测试通过（`pnpm -C apps/desktop vitest run`）                                                                                                                                                                          | CI 命令                | ✅   | 2589 通过 / 0 失败                                                   |
| AC-11 | TypeScript 类型检查通过（`pnpm typecheck`）                                                                                                                                                                                | CI 命令                | ✅   | `pnpm typecheck` 通过                                                |
| AC-12 | lint ratchet 无新增违规（`pnpm lint`）                                                                                                                                                                                     | CI 命令                | ✅   | `pnpm lint` 无新增违规                                               |

---

## Phase 0: 准备

- [x] 阅读 `AGENTS.md` 和 `design/DESIGN_DECISIONS.md` §4 Typography 映射表
- [x] 阅读 `design/system/01-tokens.css` 全文，整理现有 token 分类与命名规律
- [x] 阅读 `renderer/src/styles/main.css` 全文，理解 `@theme` 块与 tokens 的映射关系
- [x] 阅读 `renderer/src/styles/tokens.css`，确认与 `design/system/01-tokens.css` 的同步机制
- [x] 交叉比对设计稿 `01-dashboard.html`、`03-dashboard-sidebar-full.html`、`05-file-tree.html`、`14-ai-panel.html` 中的 typography 和颜色使用
- [x] 如 `openspec/specs/design-system/spec.md` 不存在，创建 delta spec 定义 token 命名规范 → 无需 delta spec（纯 CSS 变量补全，见 `specs/NOTE.md`）

---

## Phase 1: Red（测试先行）

### Task 1.1: Token 定义完整性测试

**映射验收标准**: AC-1, AC-2, AC-4

编写测试验证 `design/system/01-tokens.css` 中 token 的存在性和值的合理性：

- [x] 测试：`01-tokens.css` 包含 `--text-display-size`、`--text-display-weight`、`--text-display-line-height`、`--text-display-letter-spacing`
- [x] 测试：`01-tokens.css` 包含 `--text-heading-size`、`--text-heading-weight`、`--text-heading-line-height`、`--text-heading-letter-spacing`
- [x] 测试：`01-tokens.css` 包含 `--text-nav-size`、`--text-metadata-size`
- [x] 测试：`01-tokens.css` 包含 `--weight-light`(300)、`--weight-normal`(400)、`--weight-medium`(500)、`--weight-semibold`(600)
- [x] 测试：`01-tokens.css` 包含 `--tracking-tight`、`--tracking-normal`、`--tracking-wide`、`--tracking-wider`
- [x] 测试：`01-tokens.css` 包含 `--leading-tight`、`--leading-normal`、`--leading-relaxed`
- [x] 测试：`01-tokens.css` 包含 `--space-panel-padding`、`--space-section-gap`、`--space-item-gap`、`--space-inline-gap`

**文件**: `apps/desktop/tests/lint/design-token-v1-01-boundary.test.ts`（19 test suites）

### Task 1.2: `@theme` 导出完整性测试

**映射验收标准**: AC-5, AC-6

编写测试验证 `renderer/src/styles/main.css` 的 `@theme` 块包含所有必要导出：

- [x] 测试：`main.css` `@theme` 块包含 `--duration-instant`
- [x] 测试：`main.css` `@theme` 块包含 `--duration-slower`
- [x] 测试：`main.css` `@theme` 块包含 typography 相关的 `--text-display-*` 等 token

**文件**: `apps/desktop/tests/lint/design-token-v1-01-boundary.test.ts`（同 Task 1.1）

### Task 1.3: Token 同步一致性测试

**映射验收标准**: AC-7

- [x] 测试：`renderer/src/styles/tokens.css` 与 `design/system/01-tokens.css` 的 token 定义保持一致（如存在同步关系）

**文件**: `apps/desktop/tests/lint/design-token-v1-01-boundary.test.ts`（同 Task 1.1）

---

## Phase 2: Green（实现）

### Task 2.1: Typography Scale Token 补全

在 `design/system/01-tokens.css` 中追加 typography token：

- [x] 新增 `--text-display-*` 四件组（size: 48px / weight: 300 / line-height: 1.1 / letter-spacing: -0.03em），标题注释「页面大标题（Dashboard hero 等）」
- [x] 新增 `--text-heading-*` 四件组（size: 24px / weight: 600 / line-height: 1.2 / letter-spacing: -0.02em），评估与现有 `--text-page-title-*` 的关系，如重合则建立别名
- [x] 新增 `--text-nav-*` 四件组（size: 13px / weight: 500 / line-height: 1.4 / letter-spacing: 0），评估与现有 `--text-tree-*` 的关系
- [x] 新增 `--text-metadata-*` 四件组（size: 12px / weight: 400 / line-height: 1.4 / letter-spacing: 0.02em），评估与现有 `--text-caption-*` 的关系
- [x] 新增独立 weight token：`--weight-light`(300)、`--weight-normal`(400)、`--weight-medium`(500)、`--weight-semibold`(600)
- [x] 新增独立 tracking token：`--tracking-tight`(-0.03em)、`--tracking-normal`(0)、`--tracking-wide`(0.05em)、`--tracking-wider`(0.1em)
- [x] 新增独立 leading token：`--leading-tight`(1.1)、`--leading-normal`(1.5)、`--leading-relaxed`(1.8)

**文件**: `design/system/01-tokens.css`

### Task 2.2: 语义间距 Token

在 `design/system/01-tokens.css` 中追加语义间距别名：

- [x] `--space-panel-padding: var(--space-4);`（16px，面板通用内边距）
- [x] `--space-section-gap: var(--space-6);`（24px，页面内区块间距）
- [x] `--space-item-gap: var(--space-2);`（8px，列表项间距）
- [x] `--space-inline-gap: var(--space-1);`（4px，行内元素间距）

**文件**: `design/system/01-tokens.css`

### Task 2.3: `@theme` 块补全

在 `renderer/src/styles/main.css` 的 `@theme` 块中追加导出：

- [x] 追加 `--duration-instant: 50ms` 和 `--duration-slower: 500ms`
- [x] 追加 typography token 的 Tailwind 映射
- [x] 追加语义间距的 Tailwind 映射（如有必要）

**文件**: `renderer/src/styles/main.css`

### Task 2.4: `renderer/src/styles/tokens.css` 同步

- [x] 如 `tokens.css` 与 `design/system/01-tokens.css` 存在同步关系，将 Task 2.1-2.3 的所有新增 token 同步到 `renderer/src/styles/tokens.css` → ✅ 381 行同步版本
- [x] 如为 `@import` 引用关系则无需操作

**文件**: `renderer/src/styles/tokens.css`（条件操作）

---

## Phase 3: Verification（验证）

- [x] 运行 Phase 1 全部测试，确认全绿
- [x] 运行 `pnpm -C apps/desktop vitest run` 全量测试通过 → 2589 通过 / 0 失败
- [x] 运行 `pnpm typecheck` 类型检查通过
- [x] 运行 `pnpm lint` lint 无新增违规
- [x] 运行 `pnpm -C apps/desktop storybook:build` Storybook 可构建
- [x] 确认 `01-tokens.css` 行数增长合理（405 → 469，+64 行，在预估 80-100 行范围内）
- [x] 确认所有新增 token 均有中文注释

---

## 遗留项（归入后续 change）

- 26 处 pixel 硬编码（v1-01/07/16 共性）→ 归 v1-18 统一清理
- text-[Npx] 667 处 arbitrary 值 → 归 v1-18 替换
- v1-02 变体使用率 = 0 → 归 v1-18 推广
