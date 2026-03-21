# Tasks: V1-17 字体本地打包与视觉回归测试

> 📋 **级联刷新 R1**（2026-03-21）：v1-01 完成后刷新/建档。基线已采集。

- **状态**: 待启动
- **GitHub Issue**: 待创建
- **分支**: `task/<N>-font-bundling-visual-regression`
- **Delta Spec**: 无需（字体资源打包 + shadow token 追加 + CSS 统一 + 基线重建，见 `proposal.md`）
- **上游依赖**: v1-01 ✅ 完成（2026-03-20 验收，R1 复核通过）
- **预估工作量**: v1-02 × 0.4

---

## 验收标准

| ID    | 标准                                                                                  | 验证方式                                                                | 结果 |
| ----- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ---- |
| AC-1  | `find apps/desktop/renderer -name "*.woff2"` 返回 ≥ 12 个文件，总大小 ≤ 500KB         | 命令行检查                                                              | ⬜   |
| AC-2  | `grep -r "@font-face" apps/desktop/renderer/src/styles/fonts.css` 返回 ≥ 12 条声明    | 命令行检查                                                              | ⬜   |
| AC-3  | `fonts.css`、`main.css`、`tokens.css` 三处 `--font-family-*` 声明完全一致             | diff 对比                                                               | ⬜   |
| AC-4  | Storybook 构建通过，字体正确加载（无外部字体请求）                                    | `pnpm -C apps/desktop storybook:build` + 手动检查                       | ⬜   |
| AC-5  | `01-tokens.css` 包含 `--shadow-xs` 和 `--shadow-2xl`                                  | grep 验证                                                               | ⬜   |
| AC-6  | `shadow-[var(--shadow-2xl)]` arbitrary 值残留 = 0                                     | `grep -r "shadow-\[var(--shadow-2xl)\]" apps/desktop/renderer/src/` → 0 | ⬜   |
| AC-7  | `main.css` @theme 块导出 `shadow-xs` / `shadow-2xl`（Tailwind utility 生效）          | `awk '/@theme/,/^\}/' main.css \| grep shadow`                          | ⬜   |
| AC-8  | 视觉基线截图已用打包字体重建（`apps/desktop/tests/visual/__screenshots__/` 全部更新） | git diff 截图文件                                                       | ⬜   |
| AC-9  | 类型检查通过 `pnpm typecheck`                                                         | CI gate                                                                 | ⬜   |
| AC-10 | Electron 离线环境下字体正确渲染（无网络时不 fallback 到系统字体）                     | 手动验证                                                                | ⬜   |

---

## Phase 0: 准备

- [ ] 阅读 `AGENTS.md` 和 `design/DESIGN_DECISIONS.md` §4 Typography 映射表
- [ ] 阅读 `docs/references/design-ui-architecture.md` 字体与阴影相关章节
- [ ] 阅读 `apps/desktop/renderer/src/styles/fonts.css` 全文（当前 251 字节，仅有 `:root` CSS 变量，无 `@font-face`）
- [ ] 阅读 `apps/desktop/renderer/src/styles/main.css` 全文，关注 `@theme` 块中字体/阴影导出现状
- [ ] 阅读 `design/system/01-tokens.css`，关注阴影 token 区段（L168-171：sm/md/lg/xl）
- [ ] 阅读 `apps/desktop/renderer/src/styles/tokens.css`，确认与 `01-tokens.css` 的 shadow 同步关系
- [ ] 阅读 `apps/desktop/tests/visual/playwright.visual.config.ts`，理解现有视觉回归配置（maxDiffPixelRatio: 0.01）
- [ ] 阅读 `apps/desktop/tests/visual/*.visual.spec.ts`（3 个 spec 文件），理解现有 106 个基线截图的覆盖范围
- [ ] 阅读 `docs/references/testing/README.md` 了解测试规范

---

## Phase 1: Red（测试先行）

### Task 1.1: 字体文件存在性测试

**映射验收标准**: AC-1

编写测试验证 `apps/desktop/renderer/src/assets/fonts/` 下 woff2 文件的存在性和大小：

- [ ] 测试：`Inter-Regular.woff2`、`Inter-Medium.woff2`、`Inter-SemiBold.woff2`、`Inter-Light.woff2` 存在
- [ ] 测试：`Lora-Regular.woff2`、`Lora-Medium.woff2`、`Lora-SemiBold.woff2`、`Lora-Bold.woff2` 存在
- [ ] 测试：`Lora-Italic.woff2`、`Lora-MediumItalic.woff2`、`Lora-SemiBoldItalic.woff2`、`Lora-BoldItalic.woff2` 存在
- [ ] 测试：`JetBrainsMono-Regular.woff2`、`JetBrainsMono-Medium.woff2` 存在
- [ ] 测试：所有 woff2 文件总大小 ≤ 500KB

**文件**: `apps/desktop/tests/lint/font-bundling-v1-17.test.ts`

### Task 1.2: @font-face 声明测试

**映射验收标准**: AC-2, AC-3

编写测试验证 `fonts.css` 的 `@font-face` 声明完整且字体声明一致：

- [ ] 测试：`fonts.css` 包含 ≥ 12 条 `@font-face` 声明
- [ ] 测试：每条 `@font-face` 使用 `font-display: swap`
- [ ] 测试：`fonts.css` 的 `--font-family-body` 包含 `Lora`（修复当前缺失）
- [ ] 测试：`fonts.css`、`main.css`、`tokens.css` 三处 `--font-family-ui` 值相同
- [ ] 测试：`fonts.css`、`main.css`、`tokens.css` 三处 `--font-family-body` 值相同
- [ ] 测试：`fonts.css`、`main.css`、`tokens.css` 三处 `--font-family-mono` 值相同

**文件**: `apps/desktop/tests/lint/font-bundling-v1-17.test.ts`（同 Task 1.1）

### Task 1.3: Shadow Token 补全测试

**映射验收标准**: AC-5, AC-7

编写测试验证 shadow token xs/2xl 的定义和 @theme 导出：

- [ ] 测试：`01-tokens.css` 包含 `--shadow-xs`，值格式正确
- [ ] 测试：`01-tokens.css` 包含 `--shadow-2xl`，值格式正确
- [ ] 测试：`tokens.css`（renderer）包含 `--shadow-xs` 和 `--shadow-2xl`（同步）
- [ ] 测试：`main.css` @theme 块导出 `--shadow-xs` 和 `--shadow-2xl`

**文件**: `apps/desktop/tests/lint/font-bundling-v1-17.test.ts`（同 Task 1.1）

### Task 1.4: Shadow Arbitrary 值清理测试

**映射验收标准**: AC-6

- [ ] 测试：`apps/desktop/renderer/src/` 中 `shadow-[var(--shadow-2xl)]` 的匹配数为 0（当前 3 处需替换为 `shadow-2xl`）

**文件**: `apps/desktop/tests/lint/font-bundling-v1-17.test.ts`（同 Task 1.1）

---

## Phase 2: Green（实现）

### Task 2.1: woff2 字体文件放置

在 `apps/desktop/renderer/src/assets/fonts/` 下放置以下字体文件（自 Google Fonts 获取 woff2 子集）：

- [ ] **Inter**：Regular (400) / Medium (500) / SemiBold (600) / Light (300)，latin + latin-ext 子集
- [ ] **Lora**：Regular (400) / Medium (500) / SemiBold (600) / Bold (700) + 对应 Italic variants，latin 子集
- [ ] **JetBrains Mono**：Regular (400) / Medium (500)，latin 子集
- [ ] 验证总大小 ≤ 500KB

**文件**: `apps/desktop/renderer/src/assets/fonts/*.woff2`（新增 12-16 个文件）

### Task 2.2: @font-face 声明与 CSS 统一

在 `apps/desktop/renderer/src/styles/fonts.css` 中重写：

- [ ] 为每个字重编写 `@font-face` 声明，`src: url('../assets/fonts/XXX.woff2') format('woff2')`，使用 `font-display: swap`
- [ ] 统一 `--font-family-body` 为 `"Lora", "Crimson Pro", Georgia, serif`（与 `main.css` 对齐，修复当前 `ui-serif, Georgia, serif` 的错误）
- [ ] 统一 `--font-family-ui` 为 `"Inter", system-ui, sans-serif`
- [ ] 统一 `--font-family-mono` 为 `"JetBrains Mono", "Fira Code", Consolas, monospace`
- [ ] 确认 Vite 正确处理 woff2 资源的 asset hash 和路径（检查构建产物）

**文件**: `apps/desktop/renderer/src/styles/fonts.css`

### Task 2.3: Shadow Token xs/2xl 补全

在 `design/system/01-tokens.css` 中新增（L168 附近，sm 之前 / xl 之后）：

- [ ] `--shadow-xs: 0 1px 1px var(--color-shadow);`——细微阴影，用于 Badge、Chip 等小型元素
- [ ] `--shadow-2xl: 0 24px 48px var(--color-shadow);`——强浮层阴影，用于 Modal / Dialog / Dropdown

**文件**: `design/system/01-tokens.css`

### Task 2.4: Shadow Token @theme 导出

在 `apps/desktop/renderer/src/styles/main.css` 的 `@theme` 块中追加 shadow 导出（当前 @theme 无 shadow 条目）：

- [ ] 追加 `--shadow-xs`、`--shadow-sm`、`--shadow-md`、`--shadow-lg`、`--shadow-xl`、`--shadow-2xl` 的 Tailwind 映射
- [ ] 使 `shadow-xs` / `shadow-sm` / ... / `shadow-2xl` 成为有效 Tailwind utility class

**文件**: `apps/desktop/renderer/src/styles/main.css`

### Task 2.5: Shadow Arbitrary 值替换

将 3 处 `shadow-[var(--shadow-2xl)]` 替换为标准 `shadow-2xl`：

- [ ] `VersionHistoryPanel.stories.tsx` L182
- [ ] `VersionHistoryPanel.stories.tsx` L344
- [ ] `QualityGatesPanel.stories.tsx` L267

**文件**: 3 个 `.stories.tsx` 文件

### Task 2.6: `apps/desktop/renderer/src/styles/tokens.css` 同步

- [ ] 将 `--shadow-xs` 和 `--shadow-2xl` 同步到 `apps/desktop/renderer/src/styles/tokens.css` 的阴影区段

**文件**: `apps/desktop/renderer/src/styles/tokens.css`

### Task 2.7: 视觉基线重建

字体打包后重建全部视觉基线截图：

- [ ] 运行 `pnpm -C apps/desktop storybook:build` 生成最新 Storybook 静态产物
- [ ] 运行 `pnpm -C apps/desktop test:visual:update` 重新生成所有 106+ 个基线截图
- [ ] 抽查 ≥ 5 个基线截图，确认字体已从系统字体变为 Inter/Lora/JetBrains Mono

**文件**: `apps/desktop/tests/visual/__screenshots__/*.png`（全部更新）

---

## Phase 3: Verification（验证）

- [ ] 运行 Phase 1 全部测试（`font-bundling-v1-17.test.ts`），确认全绿
- [ ] 运行 `pnpm -C apps/desktop vitest run` 全量测试通过
- [ ] 运行 `pnpm typecheck` 类型检查通过
- [ ] 运行 `pnpm lint` lint 无新增违规
- [ ] 运行 `pnpm -C apps/desktop storybook:build` Storybook 可构建
- [ ] 运行 `pnpm -C apps/desktop test:visual` 视觉回归测试通过（新基线 vs 新基线，应 0 diff）
- [ ] 确认 `fonts.css` / `main.css` / `tokens.css` 三处 `--font-family-*` 完全一致
- [ ] 确认 `01-tokens.css` shadow 档数从 4 增至 6（sm/md/lg/xl → xs/sm/md/lg/xl/2xl）
- [ ] 确认 `shadow-[var(--shadow-2xl)]` 残留 = 0

---

## 遗留项（归入后续 change）

- `shadow-[var(--shadow-sm/md/lg/xl)]` 54 处 arbitrary 引用 → 归 v1-18 统一替换为标准 Tailwind utility（依赖本 change 的 @theme shadow 导出）
- `shadow-[custom]` 6 处非 token arbitrary → 归 v1-18 评估是否需要新增 token 或保留
- 视觉基线覆盖范围扩展 → 归 v1-20（Storybook Excellence）
- Vite asset hash 路径在 Electron 生产构建中的验证 → 归 E2E 测试

---

## R1 基线采集记录（2026-03-21）

| 指标                         | R1 实测值                               | 采集命令                                                                                       |
| ---------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `.woff2` 文件数              | 0                                       | `find apps/desktop/renderer -name "*.woff2" \| wc -l`                                          |
| `@font-face` 声明数          | 0                                       | `grep -r "@font-face" apps/desktop/renderer/src/ --include="*.css" \| wc -l`                   |
| `fonts.css` body 字体        | `ui-serif, Georgia, serif`（无 Lora）   | `cat apps/desktop/renderer/src/styles/fonts.css`                                               |
| `main.css` body 字体         | `"Lora", "Crimson Pro", Georgia, serif` | `grep font-family main.css`                                                                    |
| 阴影 token 档数              | 4（sm/md/lg/xl）                        | `grep -c '\-\-shadow-' design/system/01-tokens.css`                                            |
| `shadow-[var(--shadow-*)]`   | 54 处                                   | `grep -rn "shadow-\[var(--shadow-" apps/desktop/renderer/src/ \| wc -l`                        |
| `shadow-[var(--shadow-2xl)]` | 3 处                                    | `grep -rn "shadow-\[var(--shadow-2xl)\]" apps/desktop/renderer/src/ \| wc -l`                  |
| `shadow-[custom]` 非 token   | 6 处                                    | `grep -rn "shadow-\[" apps/desktop/renderer/src/ \| grep -v "shadow-\[var(--shadow-" \| wc -l` |
| @theme shadow 导出           | 0                                       | `awk '/@theme/,/^\}/' main.css \| grep shadow` → 空                                            |
| Playwright 视觉 spec 文件    | 3 个                                    | `find apps/desktop/tests/visual -name "*.visual.spec.ts" \| wc -l`                             |
| 视觉基线截图                 | 106 个                                  | `find apps/desktop/tests/visual/__screenshots__ -name "*.png" \| wc -l`                        |
| DOM snapshot 测试            | 6 个                                    | `find apps/desktop/renderer -name "*.snapshot.test.*" \| wc -l`                                |
| v1-01 tokens.css 行数        | 469 行                                  | `wc -l design/system/01-tokens.css`                                                            |

---

## R1 Cascade Refresh 记录（2026-03-21）

### 上游依赖复核

- **v1-01** ✅ 完成（2026-03-20 验收）——tokens.css 469 行，14 档 typography，11 weight/tracking/leading，4 semantic spacing
- **v1-02** ✅ 完成（2026-03-21 验收）——Button 229 行、Card 129 行、Tabs 333 行、Badge 130 行，新变体 130 处使用

### 基线指标变化

- DOM snapshot 测试从 3 个增至 6 个（v1-02 新增），不影响 v1-17 scope
- 其余所有指标与初始建档值一致

### Phase 0 调整

无需调整。上游依赖已全部就绪，Phase 0 准备任务保持不变。
