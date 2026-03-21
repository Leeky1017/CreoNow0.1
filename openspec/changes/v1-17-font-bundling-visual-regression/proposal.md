# V1-17 字体本地打包与视觉回归测试

> 📋 **级联刷新 R1**（2026-03-21）：v1-01 完成后刷新/建档。基线已采集。

- **GitHub Issue**: 待创建
- **所属任务簇**: V1（视觉重塑）— Wave 6 品质保障
- **umbrella**: v1-00-visual-overhaul-program
- **涉及模块**: renderer/styles、design-system、CI
- **前端验收**: 需要（字体离线渲染验证 + 视觉回归 CI 通过 + Storybook 构建通过）
- **上游依赖 v1-01**: ✅ 完成（2026-03-20 验收，R1 复核通过）

---

## Why：为什么必须做

### 1. 用户现象

CreoNow 的字体系统声明了三族字体——`Inter`（UI）、`Lora`（正文排版）、`JetBrains Mono`（代码）——却未在应用中打包任何 `.woff2` 文件。当前 `fonts.css` 和 `main.css` 的 `font-family` 回退链依赖系统字体（`system-ui`、`ui-serif`、`ui-monospace`），但 `fonts.css` 中 `--font-family-body` 甚至丢失了 `Lora` 声明，直接回退到 `ui-serif, Georgia, serif`。

结果：用户在未安装 Inter/Lora/JetBrains Mono 的系统上，看到的字体完全取决于操作系统——Windows 用 Segoe UI + Georgia + Consolas，macOS 用 SF Pro + Iowan + Menlo，Linux 用 DejaVu Sans。设计稿精心调配的 tracking / weight / line-height 映射表全部失效——「琴弦已定，琴身却是借来的。」

字体未打包的另一维度影响：v1-01 完成的 56 条 typography @theme 映射（14 档 × 4 属性）全部基于 Inter/Lora/JetBrains Mono 的 glyph metrics 校准。系统字体的不同 metrics 使得 tracking/leading/weight 映射表"名存实亡"——token 定义精确，但渲染字体错误。

同时，视觉回归基础设施虽已初步建立（3 个 Playwright spec 文件、106 个基线截图），但字体未打包意味着所有基线截图的字体渲染取决于 CI 环境的系统字体——**基线本身不可信**。字体打包后需重建基线。

### 2. 根因

- **字体未打包**：`find apps/desktop/renderer -name "*.woff2"` 返回空——零字体文件。`@font-face` 声明为 0 处。Electron 桌面应用无法假设用户系统安装了设计指定字体
- **fonts.css 与 main.css 不一致**：`fonts.css` 的 `--font-family-body` 为 `ui-serif, Georgia, serif`（无 Lora），但 `main.css` 声明 `"Lora", "Crimson Pro", Georgia, serif`——两个文件定义冲突
- **shadow token 缺口**：`01-tokens.css` 定义了 `sm/md/lg/xl` 四档阴影，但设计稿中有更精细的 `xs`（细微阴影）和 `2xl`（弹窗浮层）需求。代码中已有 `shadow-[var(--shadow-2xl)]` 的 arbitrary 引用（3 处），说明需求存在但 token 未定义
- **视觉基线不可信**：Playwright 视觉回归基础设施已建立（3 个 spec 文件、106 个基线截图），但因字体未打包，基线截图使用的是 CI 环境系统字体，字体打包后需重新生成基线

### 3. 威胁

- **跨平台一致性崩塌**：Electron 应用的核心承诺是「一次开发，处处一致」，但字体未打包使得 Windows / macOS / Linux 三端呈现完全不同的排版效果
- **设计系统空转**：v1-04 定义的 48px/300/-0.03em 标题在 Inter 上渲染精准，但在 Segoe UI 上 tracking 表现不同，font-weight 300 映射到不同的物理字形
- **视觉基线需重建**：字体打包后所有 106 个基线截图的字体渲染将发生变化，需重建可信基线
- **阴影层级不完整**：弹窗（modal/dialog）需要更强的 `2xl` 阴影来建立 elevation 层级，轻量装饰需要 `xs` 阴影

### 4. 证据来源（R1 基线采集 2026-03-21）

| 数据点                       | 值                                      | 来源                                                                     |
| ---------------------------- | --------------------------------------- | ------------------------------------------------------------------------ |
| `.woff2` 文件数              | 0                                       | `find apps/desktop/renderer -name "*.woff2"` → 空                        |
| `@font-face` 声明数          | 0                                       | `grep -r "@font-face" apps/desktop/renderer/src/ --include="*.css"`      |
| `fonts.css` body 字体        | `ui-serif, Georgia, serif`（无 Lora）   | `apps/desktop/renderer/src/styles/fonts.css`                             |
| `main.css` body 字体         | `"Lora", "Crimson Pro", Georgia, serif` | `apps/desktop/renderer/src/styles/main.css` @theme 块                    |
| 阴影 token 档数              | 4（sm/md/lg/xl）                        | `grep -c '\-\-shadow-' design/system/01-tokens.css` → 4                  |
| `shadow-[var(--shadow-*)]`   | 54 处（token 引用）                     | `grep -rn "shadow-\[var(--shadow-" apps/desktop/renderer/src/` → 54      |
| `shadow-[var(--shadow-2xl)]` | 3 处                                    | VersionHistoryPanel.stories ×2, QualityGatesPanel.stories ×1             |
| `shadow-[custom]` 非 token   | 6 处                                    | CharacterCard, SearchPanel, DiffHeader ×2, VersionPane, Slider           |
| `shadow-[]` 总计             | 60 处                                   | `grep -rc "shadow-\[" apps/desktop/renderer/src/ --include="*.tsx"` 汇总 |
| Playwright 视觉 spec 文件    | 3 个                                    | `apps/desktop/tests/visual/*.visual.spec.ts`                             |
| 视觉基线截图                 | 106 个                                  | `apps/desktop/tests/visual/__screenshots__/*.png`                        |
| DOM snapshot 测试            | 6 个                                    | `find apps/desktop/renderer -name "*.snapshot.test.*" \| wc -l`          |
| v1-01 token 体系             | ✅ 完成                                 | 469 行 tokens.css，14 档 typography，11 weight/tracking/leading          |
| 设计稿指定字体               | Inter / Lora / JetBrains Mono           | `DESIGN_DECISIONS.md` §4.1                                               |
| @theme shadow 导出           | 0（shadow 未进 @theme）                 | `awk '/@theme/,/^\}/' main.css \| grep shadow` → 空                      |

---

## What：做什么

### 1. 字体 woff2 本地打包

在 `apps/desktop/renderer/src/assets/fonts/` 下放置以下字体文件（自 Google Fonts 获取 woff2 子集）：

- **Inter**：Regular (400) / Medium (500) / SemiBold (600) / Light (300)，latin + latin-ext 子集
- **Lora**：Regular (400) / Medium (500) / SemiBold (600) / Bold (700) + Italic variants，latin 子集
- **JetBrains Mono**：Regular (400) / Medium (500)，latin 子集

预计 12-16 个 `.woff2` 文件，总大小 ≤ 500KB。

### 2. `@font-face` 声明与 CSS 统一

在 `apps/desktop/renderer/src/styles/fonts.css` 中：

- 为每个字重编写 `@font-face` 声明，使用 `font-display: swap`
- 统一 `--font-family-body` 为 `"Lora", "Crimson Pro", Georgia, serif`（与 `main.css` 对齐）
- 消除 `fonts.css` / `main.css` / `tokens.css` 三处字体声明的冲突
- 确认构建管线（Vite）正确处理 woff2 资源的 asset hash 和路径

### 3. 阴影 token xs/2xl 补全

在 `design/system/01-tokens.css` 中新增：

- `--shadow-xs: 0 1px 1px var(--color-shadow)`——细微阴影，用于 Badge、Chip 等小型元素
- `--shadow-2xl: 0 24px 48px var(--color-shadow)`——强浮层阴影，用于 Modal / Dialog / Dropdown

在 `apps/desktop/renderer/src/styles/main.css` 的 `@theme` 块中导出，使 `shadow-xs` / `shadow-2xl` 成为有效 Tailwind utility。

替换现有 3 处 `shadow-[var(--shadow-2xl)]` arbitrary 值为标准 `shadow-2xl`。

### 4. 视觉回归基线重建

字体打包后，现有 Playwright 视觉回归基础设施（`apps/desktop/tests/visual/`）的 106 个基线截图需重建：

- 现有 3 个 spec 文件（`layout.visual.spec.ts`、`primitives.visual.spec.ts`、`features.visual.spec.ts`）和 Playwright 配置（`playwright.visual.config.ts`）可直接复用
- 字体打包后运行 `pnpm -C apps/desktop test:visual:update` 重新生成所有基线截图
- 确认新基线中字体渲染使用的是打包的 Inter/Lora/JetBrains Mono（而非系统字体）
- CI 阈值维持 `maxDiffPixelRatio: 0.01`（1%），无需调整

### 5. `apps/desktop/renderer/src/styles/tokens.css` 同步

确保 `tokens.css` 与 `01-tokens.css` 的 shadow 新增保持同步。

---

## Non-Goals：不做什么

1. **不做字体子集精细优化**——初期使用 Google Fonts 预构建子集（latin + latin-ext），不手动运行 pyftsubset 裁剪
2. **不做中文字体打包**——中文排版依赖系统字体（Noto Sans CJK / PingFang / Microsoft YaHei），打包体积过大（5-10MB per weight）
3. **不新建视觉回归基础设施**——Playwright 视觉回归 CI 已存在（3 个 spec、106 个基线），仅需字体打包后重建基线
4. **不修改现有组件代码**——本 change 仅处理字体资源、CSS 声明、shadow token、基线重建
5. **不做浅色主题阴影微调**——浅色主题的阴影颜色 `--color-shadow: rgba(0,0,0,0.1)` 已定义，新增 token 自动继承

---

## AC：验收标准

| #   | 验收条件                                                                              | 验证方式                                                                     |
| --- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 1   | `find apps/desktop/renderer -name "*.woff2"` 返回 ≥ 12 个文件，总大小 ≤ 500KB         | 命令行检查                                                                   |
| 2   | `grep -r "@font-face" apps/desktop/renderer/src/styles/fonts.css` 返回 ≥ 12 条声明    | 命令行检查                                                                   |
| 3   | `fonts.css`、`main.css`、`tokens.css` 三处 `--font-family-*` 声明完全一致             | diff 对比                                                                    |
| 4   | Storybook 构建通过，字体正确加载（DevTools Network 无外部字体请求）                   | `pnpm -C apps/desktop storybook:build` + 手动检查                            |
| 5   | `01-tokens.css` 包含 `--shadow-xs` 和 `--shadow-2xl`                                  | grep 验证                                                                    |
| 6   | `shadow-[var(--shadow-2xl)]` arbitrary 值残留 = 0                                     | `grep -r "shadow-\[var(--shadow-2xl)\]" apps/desktop/renderer/src/` → 0 匹配 |
| 7   | `main.css` @theme 块导出 `shadow-xs` / `shadow-2xl`（Tailwind utility 生效）          | `awk '/@theme/,/^\}/' main.css \| grep shadow`                               |
| 8   | 视觉基线截图已用打包字体重建（`apps/desktop/tests/visual/__screenshots__/` 全部更新） | git diff 截图文件                                                            |
| 9   | 类型检查通过 `pnpm typecheck`                                                         | CI gate                                                                      |
| 10  | Electron 离线环境下字体正确渲染（无网络时不 fallback 到系统字体）                     | 手动验证                                                                     |

---

## 依赖与影响

- **上游依赖**: v1-01（Design Token 补完）—— ✅ 已完成（2026-03-20）。shadow token 体系（sm/md/lg/xl）已定义，v1-17 在此基础上扩展 xs/2xl
- **被依赖于**: v1-18（arbitrary 值清理）—— shadow arbitrary 的收口依赖本 change 定义 xs/2xl token（当前 3 处 `shadow-[var(--shadow-2xl)]`）；v1-20（Storybook Excellence）—— 字体打包后的可信视觉基线为 v1-20 提供基础
- **并行安全**: 字体文件新增、shadow token 追加、@theme shadow 导出、基线重建——均为追加操作，不修改现有组件代码，合并冲突风险极低
- **风险**: woff2 文件增加 Electron 打包体积（≤ 500KB，可接受）；基线重建后 git 历史增加约 106 个 PNG 变更
- **预估工作量**: 约 v1-02 的 **0.4 倍**——字体打包 + CSS 统一为机械性工作，shadow token 补全简单，基线重建为命令执行

---

## R1 Cascade Refresh (2026-03-21)

### 上游依赖状态

| 依赖  | 状态                                    |
| ----- | --------------------------------------- |
| v1-01 | ✅ 完成（2026-03-20 验收，R1 复核通过） |
| v1-02 | ✅ 完成（2026-03-21 验收，⭐⭐⭐⭐⭐）  |

### 基线指标复核

所有指标 R1 复核完成，与初始建档一致（差异已标注）：

| 指标                         | R1 建档值 | R1 复核值 | 趋势 | 说明                     |
| ---------------------------- | --------- | --------- | ---- | ------------------------ |
| `.woff2` 文件数              | 0         | 0         | →    | 待实施                   |
| `@font-face` 声明数          | 0         | 0         | →    | 待实施                   |
| `fonts.css` body 字体        | 无 Lora   | 无 Lora   | →    | 待修复                   |
| 阴影 token 档数              | 4         | 4         | →    | xs/2xl 待新增            |
| `shadow-[var(--shadow-*)]`   | 54 处     | 54 处     | →    | 归 v1-18 统一替换        |
| `shadow-[var(--shadow-2xl)]` | 3 处      | 3 处      | →    | 本 change 替换           |
| `shadow-[custom]` 非 token   | 6 处      | 6 处      | →    | 归 v1-18 评估            |
| Playwright 视觉 spec         | 3 个      | 3 个      | →    |                          |
| 视觉基线截图                 | 106 个    | 106 个    | →    | 字体打包后需重建         |
| DOM snapshot 测试            | 3 个      | 6 个      | ↑ +3 | v1-02 新增 snapshot 测试 |

### Scope 变更

无需调整。v1-02 完成后新增的 DOM snapshot 测试不影响本 change 的范围——字体打包后基线重建将覆盖新增的 snapshot。
