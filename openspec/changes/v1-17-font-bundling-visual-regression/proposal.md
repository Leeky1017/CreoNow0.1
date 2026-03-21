# V1-17 字体本地打包与视觉回归测试

- **GitHub Issue**: 待创建
- **所属任务簇**: V1（视觉重塑）— Wave 6 品质保障
- **umbrella**: v1-00-visual-overhaul-program
- **涉及模块**: renderer/styles、design-system、CI
- **前端验收**: 需要（字体离线渲染验证 + 视觉回归 CI 通过 + Storybook 构建通过）

---

## Why：为什么必须做

### 1. 用户现象

CreoNow 的字体系统声明了三族字体——`Inter`（UI）、`Lora`（正文排版）、`JetBrains Mono`（代码）——却未在应用中打包任何 `.woff2` 文件。当前 `fonts.css` 和 `main.css` 的 `font-family` 回退链依赖系统字体（`system-ui`、`ui-serif`、`ui-monospace`），但 `fonts.css` 中 `--font-family-body` 甚至丢失了 `Lora` 声明，直接回退到 `ui-serif, Georgia, serif`。

结果：用户在未安装 Inter/Lora/JetBrains Mono 的系统上，看到的字体完全取决于操作系统——Windows 用 Segoe UI + Georgia + Consolas，macOS 用 SF Pro + Iowan + Menlo，Linux 用 DejaVu Sans。设计稿精心调配的 tracking / weight / line-height 映射表全部失效——「琴弦已定，琴身却是借来的。」

同时，经过 v1-01 至 v1-16 的大规模视觉重塑，全应用仅有 3 个 Storybook snapshot 测试（kg、editor、workbench），无像素级视觉回归对比。任何后续修改都可能在不知不觉中打破已对齐的设计——「千日之功，一朝无栏。」

### 2. 根因

- **字体未打包**：`find apps/desktop/renderer -name "*.woff2"` 返回空——零字体文件。`@font-face` 声明为 0 处。Electron 桌面应用无法假设用户系统安装了设计指定字体
- **fonts.css 与 main.css 不一致**：`fonts.css` 的 `--font-family-body` 为 `ui-serif, Georgia, serif`（无 Lora），但 `main.css` 声明 `"Lora", "Crimson Pro", Georgia, serif`——两个文件定义冲突
- **shadow token 缺口**：`01-tokens.css` 定义了 `sm/md/lg/xl` 四档阴影，但设计稿中有更精细的 `xs`（细微阴影）和 `2xl`（弹窗浮层）需求。代码中已有 `shadow-[var(--shadow-2xl)]` 的 arbitrary 引用（3 处），说明需求存在但 token 未定义
- **视觉回归空白**：无 Playwright screenshot comparison CI，仅有 DOM snapshot 测试（不捕获视觉渲染）

### 3. 威胁

- **跨平台一致性崩塌**：Electron 应用的核心承诺是「一次开发，处处一致」，但字体未打包使得 Windows / macOS / Linux 三端呈现完全不同的排版效果
- **设计系统空转**：v1-04 定义的 48px/300/-0.03em 标题在 Inter 上渲染精准，但在 Segoe UI 上 tracking 表现不同，font-weight 300 映射到不同的物理字形
- **已有成果无防护**：v1-01 到 v1-16 投入了大量视觉对齐工作，但缺少回归防线，后续任意 change 都可能静默破坏
- **阴影层级不完整**：弹窗（modal/dialog）需要更强的 `2xl` 阴影来建立 elevation 层级，轻量装饰需要 `xs` 阴影

### 4. 证据来源

| 数据点                    | 值                                      | 来源                                                   |
| ------------------------- | --------------------------------------- | ------------------------------------------------------ |
| `.woff2` 文件数           | 0                                       | `find renderer -name "*.woff2"` → 空                   |
| `@font-face` 声明数       | 0                                       | `grep -r "@font-face" renderer/src/ --include="*.css"` |
| `fonts.css` body 字体     | `ui-serif, Georgia, serif`（无 Lora）   | `renderer/src/styles/fonts.css`                        |
| `main.css` body 字体      | `"Lora", "Crimson Pro", Georgia, serif` | `renderer/src/styles/main.css`                         |
| 阴影 token 档数           | 4（sm/md/lg/xl）                        | `grep shadow design/system/01-tokens.css`              |
| `shadow-2xl` arbitrary 用 | 3 处                                    | `grep -r "shadow-2xl" renderer/src/`                   |
| 视觉回归测试              | 0（仅 3 个 DOM snapshot）               | `find renderer -name "*snapshot*"`                     |
| 设计稿指定字体            | Inter / Lora / JetBrains Mono           | `DESIGN_DECISIONS.md` §4.1                             |

---

## What：做什么

### 1. 字体 woff2 本地打包

在 `apps/desktop/renderer/src/assets/fonts/` 下放置以下字体文件（自 Google Fonts 获取 woff2 子集）：

- **Inter**：Regular (400) / Medium (500) / SemiBold (600) / Light (300)，latin + latin-ext 子集
- **Lora**：Regular (400) / Medium (500) / SemiBold (600) / Bold (700) + Italic variants，latin 子集
- **JetBrains Mono**：Regular (400) / Medium (500)，latin 子集

预计 12-16 个 `.woff2` 文件，总大小 ≤ 500KB。

### 2. `@font-face` 声明与 CSS 统一

在 `renderer/src/styles/fonts.css` 中：

- 为每个字重编写 `@font-face` 声明，使用 `font-display: swap`
- 统一 `--font-family-body` 为 `"Lora", "Crimson Pro", Georgia, serif`（与 `main.css` 对齐）
- 消除 `fonts.css` / `main.css` / `tokens.css` 三处字体声明的冲突
- 确认构建管线（Vite）正确处理 woff2 资源的 asset hash 和路径

### 3. 阴影 token xs/2xl 补全

在 `design/system/01-tokens.css` 中新增：

- `--shadow-xs: 0 1px 1px var(--color-shadow)`——细微阴影，用于 Badge、Chip 等小型元素
- `--shadow-2xl: 0 24px 48px var(--color-shadow)`——强浮层阴影，用于 Modal / Dialog / Dropdown

在 `renderer/src/styles/main.css` 的 `@theme` 块中导出，使 `shadow-xs` / `shadow-2xl` 成为有效 Tailwind utility。

替换现有 3 处 `shadow-[var(--shadow-2xl)]` arbitrary 值为标准 `shadow-2xl`。

### 4. 视觉回归测试 CI

建立 Playwright screenshot comparison 基础设施：

- 在 `apps/desktop/renderer/` 下新建 `e2e/visual/` 目录
- 配置 Playwright 以 Storybook 为目标，对关键 Story 截图
- 初始基准页面（≥ 5 个关键页面）：Dashboard、Editor、AI Panel、FileTree、Settings
- CI workflow 在 PR 时运行 screenshot diff，阈值 0.1%
- 基线图存储在 `e2e/visual/baselines/`，随代码版本管理

### 5. `renderer/src/styles/tokens.css` 同步

确保 `tokens.css` 与 `01-tokens.css` 的 shadow 新增保持同步。

---

## Non-Goals：不做什么

1. **不做字体子集精细优化**——初期使用 Google Fonts 预构建子集（latin + latin-ext），不手动运行 pyftsubset 裁剪
2. **不做中文字体打包**——中文排版依赖系统字体（Noto Sans CJK / PingFang / Microsoft YaHei），打包体积过大（5-10MB per weight）
3. **不做全量 Story 截图**——初期覆盖 5 个关键页面，后续在 v1-20 中扩展
4. **不修改现有组件代码**——本 change 仅处理字体资源、CSS 声明、shadow token、CI 管线
5. **不做浅色主题阴影微调**——浅色主题的阴影颜色 `--color-shadow: rgba(0,0,0,0.1)` 已定义，新增 token 自动继承

---

## AC：验收标准

| #   | 验收条件                                                                  | 验证方式                                          |
| --- | ------------------------------------------------------------------------- | ------------------------------------------------- |
| 1   | `find renderer -name "*.woff2"` 返回 ≥ 12 个文件，总大小 ≤ 500KB          | 命令行检查                                        |
| 2   | `grep -r "@font-face" renderer/src/styles/fonts.css` 返回 ≥ 12 条声明     | 命令行检查                                        |
| 3   | `fonts.css`、`main.css`、`tokens.css` 三处 `--font-family-*` 声明完全一致 | diff 对比                                         |
| 4   | Storybook 构建通过，字体正确加载（DevTools Network 无外部字体请求）       | `pnpm -C apps/desktop storybook:build` + 手动检查 |
| 5   | `01-tokens.css` 包含 `--shadow-xs` 和 `--shadow-2xl`                      | grep 验证                                         |
| 6   | `shadow-[var(--shadow-2xl)]` arbitrary 值残留 = 0                         | `grep -r "shadow-\[" renderer/src/` → 0 匹配      |
| 7   | `e2e/visual/baselines/` 包含 ≥ 5 个基线截图                               | 文件计数                                          |
| 8   | CI workflow 在 PR 时自动运行 screenshot diff                              | GitHub Actions 验证                               |
| 9   | 类型检查通过 `pnpm typecheck`                                             | CI gate                                           |
| 10  | Electron 离线环境下字体正确渲染（无网络时不 fallback 到系统字体）         | 手动验证                                          |

---

## 依赖与影响

- **上游依赖**: v1-01（Design Token 补完）—— shadow token 扩展需在 token 体系中定义
- **被依赖于**: v1-18（arbitrary 值清理）—— shadow arbitrary 的收口依赖本 change 定义 xs/2xl token；v1-20（Storybook Excellence）—— 视觉回归基础设施为 v1-20 的全量 Story 截图提供基础
- **并行安全**: 字体文件新增、shadow token 追加、CI workflow 新增——均为追加操作，不修改现有代码，合并冲突风险极低
- **风险**: woff2 文件增加 Electron 打包体积（≤ 500KB，可接受）；Playwright 基线需要固定渲染环境（CI 使用固定 Docker 镜像）
- **预估工作量**: 约 v1-02 的 **0.4 倍**——字体打包 + CSS 统一为机械性工作，shadow token 补全简单，视觉回归 CI 搭建需要 Playwright 配置但无业务逻辑
