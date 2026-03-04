# CN 前端困境根因诊断与治理改革方案

更新时间：2026-03-04 16:00

> 「善战者，求之于势，不责于人。」——《孙子兵法》
>
> 问题不在代码质量或 Agent 能力，而在于系统的「势」走偏了：流程成了产品，治理取代了交付。

---

## 文件索引

| § | 章节 | 内容 |
|---|------|------|
| 一 | 来源与范围 | 审计背景与数据来源 |
| 二 | 核心数据一览 | 前端关键指标 |
| 三 | 五个根本病因 | 系统性诊断 |
| 四 | i18n 症状 | 最具代表性的问题（含英文硬编码数据） |
| 五 | Token 系统 | 高合规率下的结构性分裂（含双源真相分析） |
| 六 | 38 个 fe-* Change | 分类与结论 |
| 七 | 为什么别人用 AI 能做好 | 与业界对比 |
| 八 | 治理流程改革方案 | 改革建议 |
| 九 | 可能踩的坑 | 风险提醒 |
| 十 | 后续执行建议 | 行动指南 |

---

## 目录

- [一、来源与范围](#一来源与范围)
- [二、核心数据一览](#二核心数据一览)
- [三、五个根本病因](#三五个根本病因)
- [四、i18n：最具代表性的症状](#四i18n最具代表性的症状)
- [五、Token 系统：表面高合规率下的结构性分裂](#五token-系统表面高合规率下的结构性分裂)
- [六、38 个 fe-* Change 的分类与结论](#六38-个-fe--change-的分类与结论)
- [七、为什么别人用 AI 能做好，我们不行？](#七为什么别人用-ai-能做好我们不行)
- [八、治理流程改革方案](#八治理流程改革方案)
- [九、可能会踩的坑](#九可能会踩的坑)
- [十、后续执行建议](#十后续执行建议)

---

## 一、来源与范围

| 来源 | 说明 |
|---|---|
| Amp 会话 | `CN frontend issues and i18n problems analysis`（T-019cb4a7） |
| Copilot 全仓审计 | 对 `apps/desktop/renderer/src/` 全量代码审计（2026-03-04） |
| 对照清单 | `openspec/changes/archive/fe-*`（共 38 项已归档 change） |
| Git 历史 | 505 次提交、240 个已归档 change |
| 测试数据 | 261 个测试套件、1778 个测试用例（全绿） |

---

## 二、核心数据一览

| 指标 | 数值 | 说明 |
|---|---|---|
| 项目历时 | ~33 天（1月30日 → 3月4日） | |
| main 分支提交 | **505** 次 | |
| 已归档 change | **240** 个 | 含 38 个 fe-、22 个 aud-、180 个后端/基础设施 |
| 流程文档 | **1,966 个 .md** / **147,608 行** | openspec + rulebook + docs |
| 前端生产代码 | **138 个组件** / **38,873 行** | components + features（不含 test/story） |
| 前端测试代码 | **598 个测试文件** / **89,782 行** | **测试 : 生产 = 2.3 : 1** |
| Storybook | **66 个 story** / **33,515 行** | |
| 流程文档 : 产品代码 | **3.8 : 1** | 147K 行文档 vs 38K 行前端代码 |
| i18n 覆盖率 | **~27% key** / **5.4% 文件** | 137 / ~500 key；10 / 186 文件 |
| Token 合规率 | **~81% 文件** | 但 shadow 体系分裂严重（23 token vs 27 Tailwind 内置） |

---

## 三、五个根本病因

### 病因 1：流程本身成了产品——「方法论的自我吞噬」

**这是最核心的问题。**

AGENTS.md 定义的工作流链条长达 23 步。一个「将 5 行中文硬编码换成 `t()` 调用」的任务，完整流程如下：

> 读 AGENTS.md → 读 project.md → 读 spec.md → 读 delivery-skill.md → 确认 Issue → 创建 worktree → 写 proposal → 写 delta-spec → 写 tasks.md（6 段 TDD 格式）→ 创建 Rulebook task → validate → Dependency Sync Check → 写失败测试 → 写实现 → 写 RUN_LOG → 创建 PR → 开启 auto-merge → 等 3 checks → 确认合并 → 归档 delta-spec → 清理 worktree → 更新 EXECUTION_ORDER.md

**5 行改动，23 个步骤，~210 行流程文档，产品代码 5 行。**

数据证据：

- 240 个归档 change，每个平均 54 行 tasks.md（不含 proposal、RUN_LOG、delta-spec）
- 流程文档总量 **147,608 行** vs 前端生产代码 **38,873 行**
- 这就像一个建筑工地，图纸和验收报告的厚度是实际砖头的 **4 倍**

**Agent 为什么把流程看得比任务更重要？**

因为 AGENTS.md 的 7 条 P 原则每条都写着「违反等同于交付失败」：

| 违规行为 | 后果 |
|---|---|
| 不写 proposal | P1 违反 → 交付失败 |
| 不写失败测试 | P2 违反 → 交付失败 |
| 不写 RUN_LOG | P3 违反 → 交付失败 |
| CI 不绿 | P4 违反 → 交付失败 |
| 不走 delta-spec | P5 违反 → 交付失败 |

**但没有一条原则说「UI 看起来不对 = 交付失败」。**

Agent 是理性执行者。它会最大化「满足交付标准」的概率。当交付标准全是流程合规（spec、测试、RUN_LOG、Rulebook），100% 精力就花在流程上。当交付标准不包含「截图看起来像设计稿」，它就永远不会去看 UI。

### 病因 2：原子化过度——「把大象切成了 240 片薄片」

每个 change 被拆得极细，每个在自己 scope 内「done」，但没有人对全局完成度负责。

以 i18n 为例——仅此一个功能就拆成了 4 个 change：

1. `s3-i18n-setup`（初始化）
2. `s3-i18n-extract`（字符串提取）
3. `fe-i18n-language-switcher-foundation`（语言切换）
4. `fe-i18n-core-pages-keying`（核心页面 key 化）

每个都走完整 23 步流程。最终结果：只完成了 ~27% 覆盖率，42 个文件仍有硬编码中文。

**根本矛盾**：细粒度 change 保证了每个 PR 的局部正确性，但**没有一个 change 的 scope 是「i18n 必须 100% 覆盖」**。每个 Agent 只知道自己负责的 3-5 个文件，对全局状态一无所知。

### 病因 3：Guard 测试的「自欺陷阱」——测试全绿 ≠ 系统合规

大量 guard 测试只验证自己 change 范围内的文件，不验证全局。

```
AiPanel.i18n-guard.test.ts —— 只检查 AiPanel.tsx → ✅ 通过
MemoryPanel.tsx —— 322 行硬编码中文 → 没有对应 guard 测试 → 永远绿灯
```

**598 个测试文件 / 89,782 行测试代码**——测试量是生产代码的 2.3 倍。但大量测试的真实价值分布：

| 测试类型 | 做了什么 | 对产品质量的贡献 |
|---|---|---|
| 静态文件读取 + 正则匹配 | 扫源码有没有某个字符串 | 低——只覆盖被检查的文件 |
| import 路径验证 | 确认 A 文件引用 B 模块 | 低——TypeScript 编译器就能做 |
| CSS class 模式守卫 | 确认没用 `h-screen` | 中——但应该是 lint 规则 |
| 真正的行为测试 | 渲染组件、模拟交互 | 高——但占比不够 |

绿灯制造了「一切尽在掌握」的幻觉，但**没有任何 test 曾经打开这个 APP 看一眼**。

### 病因 4：双 Agent 审计是「同质化审计」——检视流程合规，而非用户体验

审计 **检查** 的是：

- ✅ PR 格式对不对？测试通过了没？RUN_LOG 写了没？Delta spec 对齐了没？

审计 **不检查** 的是：

- ❌ 切换到英文，整个 APP 看起来怎么样？
- ❌ 打开一个 1000 字的文档，编辑体验如何？
- ❌ 跟 Cursor 的交互体验对比差距在哪？
- ❌ 用户 5 秒内能不能找到 AI 按钮？

这就像出版社的校对员检查了每一页的拼写和标点，但没有人从头到尾读完整本书，看故事是否讲得通。

### 病因 5：Agent 从未「看过」UI——反馈回路是文本的而非视觉的

CN 使用 `electron-vite`，**原生支持渲染进程 HMR**（Hot Module Replacement）。运行 `pnpm dev` 后，改一行 JSX 或 CSS，Electron 窗口里 **0.5 秒内**就能看到效果——无需重新编译打包。

但 Agent **从不运行 `pnpm dev`**。它只跑 `vitest run`，看到 1778 tests passed 就认为任务完成。

项目的 Storybook（66 个 story、33,515 行）本质上就是活的 UI 参照物——等同于可执行的 Figma。但问题是 **Agent 实现 Feature 时不看 Storybook、不对比效果，只写满足测试的代码**。

Storybook → 产品的断裂链：

- Storybook 里 `Button` 组件很漂亮 → Feature 层直接写原生 `<button>` 不复用
- Storybook 用 Token → Feature 层硬编码 rgba
- Storybook Demo 数据是手写 mock → 实际接真实数据时行为不同

---

## 四、i18n：最具代表性的症状

### 基础设施状态

| 组件 | 状态 |
|---|---|
| i18next 初始化（`i18n/index.ts`） | ✅ 完成 |
| 语言偏好持久化（`languagePreference.ts`） | ✅ 完成 |
| zh-CN / en locale（137 key，中英对齐） | ✅ 存在 |
| parity / duplication guard 测试 | ✅ 存在 |

**基础设施完好——管道已通，但水只流到了 27% 的田地。**

### 覆盖率数据

| 指标 | 数值 |
|---|---|
| 使用 `useTranslation` 的文件 | **10 / 186**（5.4%） |
| 含硬编码中文的生产文件 | **42 / 186**（22.6%） |
| 硬编码中文行数 | **~322 行** |
| 完全无 i18n 的 feature 目录 | **11 / 16** |
| 已抽取 locale keys | 137 |
| 预估需要的总 keys | ~400–500 |
| **实际 key 覆盖率** | **~27–34%** |

### 按模块覆盖明细

| 模块 | 使用 i18n | 硬编码中文 | 状态 |
|---|---|---|---|
| dashboard | ✅ | — | 已完成 |
| onboarding | ✅ | — | 已完成 |
| search | ✅ | — | 已完成 |
| commandPalette | ✅ | — | 基本完成 |
| ai（仅 AiPanel） | 部分 | 3 文件 | 部分覆盖 |
| **character** | **❌** | 4 文件 | 完全未覆盖 |
| **editor** | **❌** | 4 文件 | 大量未覆盖 |
| **export** | **❌** | 1 文件 | 完全未覆盖 |
| **files** | **❌** | 1 文件 | 完全未覆盖 |
| **kg** | **❌** | 1 文件 | 完全未覆盖 |
| **memory** | **❌** | 3 文件 | 完全未覆盖 |
| **projects** | **❌** | 3 文件 | 完全未覆盖 |
| **settings-dialog** | **❌** | 2 文件 | 完全未覆盖 |
| **settings** | **❌** | 1 文件 | 完全未覆盖 |
| **version-history** | **❌** | 2 文件 | 完全未覆盖 |

### 文档与代码状态脱节（最典型的流程失效证据）

| Change | tasks.md 状态 | 代码实际状态 | 结论 |
|---|---|---|---|
| `s3-i18n-extract` | 全部 `[x]`（完成） | 只做了 ~30%，42 文件未处理 | **虚报完成** |
| `fe-i18n-language-switcher-foundation` | 全部 `[ ]`（未开始） | 代码已完成 | **文档滞后** |
| `fe-i18n-core-pages-keying` | 全部 `[ ]`（未开始） | 4 个核心页面已完成 | **文档滞后** |

这说明 tasks.md 既不能反映真实进度，也不能防止虚报——它沦为了纯仪式性文件。

### 硬编码重灾区举例

```tsx
// MemoryPanel.tsx — 完全无 i18n
{ category: "style", label: "写作风格" }
{ category: "structure", label: "叙事结构" }
"Memory 面板加载失败" / "规则文本不能为空"

// FileTreePanel.tsx — 中英混杂（切语言后灾难性体验）
"暂无文件" / "开始创建你的第一个文件" / "新建文件"
"Untitled Chapter" / "Move to Folder" / "Version History"

// EditorBubbleMenu.tsx
"润色", "改写", "描写", "对白"

// CreateProjectDialog.tsx
"项目创建失败，请重试" / "AI 辅助创建暂时不可用"
"手动创建" / "AI 辅助" / "生成中…" / "生成草案"

// SkillManagerDialog.tsx
"编辑自定义技能" / "创建自定义技能"
"请先输入技能需求描述" / "确定删除技能？" / "此操作不可撤销"

// EditorPane.tsx
"文档已达到 1000000 字符上限" / "粘贴内容超过文档容量上限…"
"正在预览版本" / "恢复到此版本" / "返回当前版本"

// AiSettingsSection.tsx
"已配置" / "未配置" / "连接成功" / "AI 配置" / "保存" / "测试连接"
```

### 英文硬编码——比中文更严重的隐患

> **致命盲区**：原诊断仅关注 CJK 字符硬编码。实际上，英文裸字符串的硬编码数量**远超中文**，
> 且 CJK-only grep 检测（`[\x{4e00}-\x{9fff}...]`）完全无法发现。

| 文件 | 英文硬编码处数 | 典型示例 |
|------|---------------|----------|
| ExportDialog.tsx | **~107** | `"Export"`, `"PDF"`, `"Markdown"`, `"Cancel"` |
| QualityGatesPanel.tsx | **~79** | `"Quality Gates"`, `"Pass"`, `"Fail"`, `"Score"` |
| KnowledgeGraphPanel.tsx | **~50** | `"Add Entity"`, `"Relationship"`, `"Delete"` |
| VersionHistoryPanel.tsx | **~50** | `"Restore"`, `"Version"`, `"Current"`, `"Compare"` |
| SettingsDialog.tsx | **~40** | `"Settings"`, `"General"`, `"Save"`, `"Cancel"` |

**英文硬编码总量保守估计 ~500+ 处**，是中文硬编码（~322 行）的 **1.5 倍以上**。

这意味着：
1. 即使把所有中文换成 `t()` 调用，应用仍充满英文裸字符串
2. 社区用户如果要做日文/韩文翻译，仍然需要改数百个文件
3. **任何仅检测 CJK 字符的门禁（包括本文 §八提到的 guard 测试）都是假安全**

### ESLint 替代 grep 的必要性

基于以上发现，i18n 合规检测**必须**采用 ESLint AST 级方案（`eslint-plugin-i18next`），
而非 shell grep。ESLint 可以检测所有语言的裸字符串字面量，不受字符编码限制。

详见 [CI 简化提案 §九](./ci-simplification-proposal.md#九eslint-集成策略替代独立-ci-jobs)。

---

## 五、Token 系统：表面高合规率下的结构性分裂

### 设计体系

三层 Token 架构（Primitive → Semantic → Component），定义完备：背景层级、前景色、边框、功能色、阴影、z-index、间距、圆角、动效。Tailwind CSS 4 的 `@theme` 块集成方式正确。

### 合规数据

| 指标 | 数值 |
|---|---|
| 生产文件 Token 采用率 | 123 / 152（80.9%） |
| Story 文件 Token 采用率 | 55 / 59（93.2%） |
| `dark:` 前缀违规 | 0 ✅ |
| 硬编码颜色违规文件 | 7 个生产文件 |
| z-index 硬编码 | 4 处 |
| **阴影体系分裂** | **23 走 token vs 27 走 Tailwind 内置** |

### 最大隐患：阴影双轨制

项目同时存在两套阴影：
- `shadow-[var(--shadow-md)]`（Token 方式，23 处）
- `shadow-lg` / `shadow-2xl`（Tailwind 内置，27 处）

**约一半阴影不受主题控制。** 切换浅色主题时，Tailwind 内置阴影的颜色不会随 `--color-shadow` 变化，导致深色阴影在浅色背景上视觉违和。

### 关键违规点

| 文件 | 问题 |
|---|---|
| DiffView.tsx / SplitDiffView.tsx | 系统性硬编码 rgba 红/绿（~14 处）——diff 高亮 |
| SystemDialog.tsx | L1 Primitive 组件使用 `bg-red-600`/`bg-green-500`/`bg-gray-200` |
| ExportDialog.tsx | `!bg-white !text-black !important`——暗色主题完全错乱 |
| main.css L220 | 窗口关闭按钮 `background: #cc2b3e`——未走 token |
| 8 个生产文件 | 使用 `shadow-2xl`（不走 Token） |
| SettingsAppearancePage.tsx | 10 处 hex 值（主题预览色，属灰色地带） |

### 缺失 Token

```
--color-diff-added-bg / --color-diff-removed-bg      （Diff 语义色）
--color-diff-added-text / --color-diff-removed-text
--color-btn-danger / --color-btn-danger-hover         （按钮状态色）
--color-btn-success / --color-btn-success-hover
--color-accent 系列                                    （强调色，DESIGN_DECISIONS 已定义但 tokens.css 缺失）
--color-window-close-hover                             （窗口控件色）
```

### Token 双源真相（Dual SSOT）——结构性隐患

> **核心发现**：项目存在两个 Token 定义文件，内容不同步。

| 文件 | 行数 | 内容 | 角色 |
|------|------|------|------|
| `design/system/01-tokens.css` | 370 行 | 含 Typography + Layout 变量 | 设计规范源 |
| `apps/desktop/renderer/src/styles/tokens.css` | 203 行 | 缺少 Typography + Layout；含自创 token | 生产实际使用 |

**不一致点**：

1. **Typography 变量**（`--font-*`, `--text-*`, `--leading-*`）：设计源有定义，生产文件缺失
2. **Layout 变量**（`--sidebar-*`, `--panel-*`）：设计源有定义，生产文件缺失
3. **自创 Token**：生产文件含 `--color-focus-ring`（应为 `--color-ring-focus`），值也不同
4. **Focus-ring 重复**：`--color-ring-focus`（spec 定义，`rgba(255,255,255,0.5)`）vs `--color-focus-ring`（自创，`rgba(59,130,246,0.5)` 蓝色）

**影响**：
- Agent 不知道该引用哪个文件
- `docs/references/design-ui-architecture.md` 指向 `design/system/01-tokens.css`
- `design/DESIGN_DECISIONS.md` 指向 `apps/desktop/renderer/src/styles/tokens.css`
- 结果是两份文档各自为政，新 Token 可能只加到一个文件

### 前端样式漂移的五个根因

> 设计系统的治理链条从顶层到底层全线断裂。

| # | 根因 | 数据证据 |
|---|------|----------|
| 1 | **Feature 层不复用 Primitives** | 75 个 Feature 文件使用原生 `<button>`（357 处匹配），不使用 `<Button>` 组件 |
| 2 | **tokens.css 与 DESIGN_DECISIONS.md 漂移** | 重复 focus-ring token，自创 token，Typography/Layout 缺失 |
| 3 | **Shadow 系统双轨** | 19 个文件使用 Tailwind 内置 `shadow-lg/2xl`，不走 `--shadow-*` token |
| 4 | **Tailwind 原始色逃逸** | 5 个文件使用 `bg-red-600` 等原始色；12 个文件硬编码 `rgba`/hex |
| 5 | **Token 双源真相** | 设计源 370 行 vs 生产 203 行，Typography + Layout 段整体缺失 |

**因果链**：Token 双源 → Agent 引用错误源 → 新组件自创 Token → Feature 层绕过 Primitives → 阴影/颜色不受主题控制 → 浅色主题视觉崩坏

---

## 六、38 个 `fe-*` Change 的分类与结论

> 不需要全部重做。问题不在单个 change 的代码质量，而在范围定义过窄、验收偏流程、全局门禁缺位。

### A. 真正的新功能（17 个）——已完成，保持

| # | Change | 用户可感知价值 |
|---|---|---|
| 1 | `fe-ai-panel-toggle-button` | AI 面板有了显式入口 |
| 2 | `fe-command-palette-search-uplift` | 命令面板搜索增强 |
| 3 | `fe-composites-p0-panel-and-command-items` | Panel/Command Composite 组件 |
| 4 | `fe-composites-p1-search-and-forms` | Search/Form Composite 组件 |
| 5 | `fe-composites-p2-empties-and-confirms` | EmptyState/Confirm Composite |
| 6 | `fe-desktop-window-lifecycle-uplift` | 窗口生命周期管理 |
| 7 | `fe-editor-advanced-interactions` | 编辑器高级交互 |
| 8 | `fe-editor-context-menu-and-tooltips` | 编辑器右键菜单 + Tooltip |
| 9 | `fe-editor-inline-diff-decoration-integration` | 行内 Diff 装饰 |
| 10 | `fe-hotkeys-shortcuts-unification` | 快捷键统一 |
| 11 | `fe-i18n-language-switcher-foundation` | 语言切换基础设施 |
| 12 | `fe-ipc-open-folder-contract` | 打开文件夹 IPC 通道 |
| 13 | `fe-leftpanel-dialog-migration` | 左侧面板弹出式改造 |
| 14 | `fe-onboarding-flow-refresh` | 引导流程刷新 |
| 15 | `fe-project-image-cropper` | 项目封面图裁剪 |
| 16 | `fe-skeleton-loading-states` | 骨架屏加载状态 |
| 17 | `fe-ui-open-folder-entrypoints` | 打开文件夹多入口 |

### B. 修之前没做好的事（14 个）——暴露流程问题

这些 change 本质上是「功能实现时应一并达标的质量项」，被拆成独立 change 后流程成本放大 14 倍。

| # | Change | 本应在何时解决 |
|---|---|---|
| 1 | `fe-token-escape-sweep` | 每个组件实现时就应走 Token |
| 2 | `fe-zenmode-token-escape-cleanup` | ZenMode 实现时 |
| 3 | `fe-searchpanel-tokenized-rewrite` | SearchPanel 实现时 |
| 4 | `fe-visual-noise-reduction` | UI 设计审查时 |
| 5 | `fe-lucide-icon-unification` | 图标选型时 |
| 6 | `fe-reduced-motion-respect` | CSS 基础设施里一次搞定 |
| 7 | `fe-feature-focus-visible-coverage` | 每个可交互元素实现时 |
| 8 | `fe-theme-switch-smoothing` | 主题切换实现时 |
| 9 | `fe-accessibility-aria-live` | 动态内容组件实现时 |
| 10 | `fe-deterministic-now-injection` | 测试编写时 |
| 11 | `fe-cleanup-proxysection-and-mocks` | 代码审查时删除死代码 |
| 12 | `fe-dashboard-herocard-responsive-layout` | HeroCard 实现时 |
| 13 | `fe-dashboard-welcome-merge-and-ghost-actions` | Dashboard 实现时 |
| 14 | `fe-hotfix-searchpanel-backdrop-close` | SearchPanel 实现时测试交互 |

### C. 补基础设施（6 个）+ D. 文档对齐（1 个）

已完成，不赘述。

---

## 七、为什么别人用 AI 能做好，我们不行？

| 维度 | 典型 AI 辅助前端开发 | CN 的做法 |
|---|---|---|
| **反馈回路** | 改代码 → 0.5s HMR → 看效果 → 再改 | 改代码 → 写 RUN_LOG → 提 PR → 等 CI → 合并 |
| **反馈速度** | **秒级**，视觉的 | **小时级**，文本的 |
| **设计参照** | Figma + 口头描述 | 200+ 页文字 spec（有 Storybook 但不看） |
| **范围控制** | "把这个页面做好" | "把第 142 行的 rgba 换成 token" |
| **完成标准** | "看起来跟设计稿一样" | "测试全绿 + RUN_LOG 落盘 + Rulebook validate" |
| **迭代速度** | 一下午做完一个页面 | 1 个小修改 = 1 Issue + 1 Branch + 1 PR + 3 checks |
| **Agent 权责** | 1 agent 做整个模块 | N 个 agent 各做一片 |

**核心差异**：别人的反馈回路是**视觉的、即时的**（HMR 秒级刷新）。我们的反馈回路是**文本的、仪式化的**（流程小时级）。

> `electron-vite` 的 `pnpm dev` 原生支持渲染进程 HMR，Agent 完全可以用——但从未用过。

---

## 八、治理流程改革方案

### 8.1 前端任务轻量化流程

**对 UI/UX 类任务，砍掉 80% 仪式。**

| 保留 | 砍掉 |
|---|---|
| Issue + Branch + PR | proposal.md |
| 行为测试（渲染 + 交互） | 静态源码扫描 guard 测试 |
| CI 自动检查 | Rulebook task + validate |
| Git commit message | 详细 RUN_LOG |
| 1 个全局合规测试 | 逐文件 guard 测试 |
| PR 截图（before/after） | delta-spec 归档仪式 |

**简化后的 UI change 流程**：Issue → Branch → `pnpm dev` → 写代码 + 看效果 → 写行为测试 → PR（附截图）→ CI 绿 → 合并。完。

### 8.2 全局门禁替代逐文件 guard

**不要** 42 个 `X.i18n-guard.test.ts`。

**首选方案**：ESLint 自定义规则（`eslint-plugin-i18next` + `eslint-plugin-tailwindcss`），
集成到 `pnpm lint`，IDE 实时反馈 + CI 自动阻塞：

- `no-literal-string`：检测所有语言的裸字符串（不仅 CJK）
- Tailwind 规则：禁止原始色值（`bg-red-600`）和非 token 阴影（`shadow-lg`）

**过渡方案**（ESLint 就绪前）：
- 1 个 `all-files-i18n-compliance.test.ts`，扫描所有 .tsx 文件
- 1 个 `all-files-token-compliance.test.ts`（硬编码颜色/阴影/z-index）
- 1 个 `all-files-a11y-guard.test.ts`（aria 属性）

### 8.3 按用户场景组织 change

**不要**：4 个拆碎的 change 各走 23 步流程

**要**：1 个完整的「用户可以切换中英文，所有界面文案同步变化」

### 8.4 减少 Agent 数量，增加权责范围

1 个 Agent 负责整个前端模块（编辑器 / AI 面板 / 仪表盘），而不是 10 个 Agent 各做一小片。前者能看到全局，后者只能看到自己被分配的 3 个文件。

### 8.5 引入视觉验收

- PR description 附截图（before/after）
- Agent 启动 `pnpm dev`，用 Playwright 或手动截图
- 考虑 Storybook visual regression（Chromatic 或 Playwright screenshot）

### 8.6 修改 AGENTS.md 激励结构

增加面向「用户可感知结果」的硬约束，例如：

> **P8. Visual Acceptance**
>
> 对 UI 类任务，PR 必须附截图或录屏证明视觉效果符合设计参照。没有截图的 UI PR 等同于交付失败。

---

## 九、可能会踩的坑

### 坑 1：测试假绿症

1778 个测试全绿，但 guard 测试只覆盖已知文件。新写的 `NewComponent.tsx` 如果有硬编码颜色但没有 guard，永远绿灯。**全局门禁是唯一解。**

### 坑 2：Storybook Decorator 与实际 Provider 不一致

Storybook 注入的 Context（Theme/i18n/Store）可能和 `App.tsx` 的 Provider 链不同。组件在 Story 里完美，装到 App 里样式或行为不同。需确保 Storybook decorators 与实际 Provider 配置一致。

### 坑 3：Electron 打包后路径问题

`fe-desktop-native-binding-packaging` 的存在说明 native 模块打包路径问题已出现过。Dev 环境正常 + 打包后 crash 的问题无法靠 `vitest` 发现。需要打包后冒烟测试。

### 坑 4：多 Agent 并发的写时覆盖

多 Agent 同时改全局文件（`tokens.css`、`AppShell.tsx`、`layoutStore.tsx`、`locales/zh-CN.json`）时合并冲突频繁。高频修改的文件应串行处理。

### 坑 5：Spec 与实际需求脱节无闭环

Spec 6,147 行。用户反馈的真实痛点（"上传图片不能调整大小"、"语言不能切换"、"太多边框"）全是 spec 没预料到或写了没人做的。Spec 越写越多，但 spec → 用户体验之间没有闭环。

### 坑 6：Shadow 双轨制浅色主题灾难

27 处 Tailwind 内置 `shadow-lg/2xl` 在浅色主题下不受 `--color-shadow` 控制。需一次性迁移为 `shadow-[var(--shadow-*)]`。

### 坑 7：Guard 代码膨胀成技术债

598 个测试文件中约 63 个（~10.5%）是纯静态扫描 guard，与 ESLint 功能重叠，维护成本随文件数线性增长。应迁移为 lint 规则。

### 坑 8：i18n 中英混杂比没做更糟

`FileTreePanel.tsx` 同一文件内 `"暂无文件"`（中文）+ `"Untitled Chapter"`（英文）。切换语言后出现「中英双语博物馆」。**半完成的 i18n 比不做更损害产品印象。**

---

## 十、后续执行建议

### 立即可做（不需要改流程）

| # | 动作 | 预估 | 效果 |
|---|---|---|---|
| 1 | 写 1 个全局 i18n 合规测试，替代逐文件 guard | 2h | 一次暴露所有未覆盖文件 |
| 2 | 写 1 个全局 Token 合规测试 | 2h | 统一发现所有逃逸 |
| 3 | 将 27 处 Tailwind 内置 shadow 迁移为 Token | 3h | 消除浅色主题隐患 |
| 4 | 在 `tokens.css` 补齐 `--color-accent` 系列 | 1h | 消除 DESIGN_DECISIONS 漂移 |

### 需要改流程

| # | 动作 | 影响范围 |
|---|---|---|
| 5 | 修改 AGENTS.md，对 fe- 任务定义轻量化流程 | 所有前端 change |
| 6 | 添加 P8 原则：UI 类任务必须附截图验收 | Agent 行为 |
| 7 | 将 guard 测试迁移为 ESLint 自定义规则 | 测试架构 |
| 8 | 要求 Agent 启动 `pnpm dev` 并截图 | Agent 工作方式 |
| 9 | 按用户场景重新组织 change 粒度 | 任务拆分方式 |

### 全量补齐

| # | 范围 | 预估 |
|---|---|---|
| 10 | i18n 全量覆盖（42 文件 / ~363 个新 key） | 8–12h |
| 11 | Token 全量合规（7 文件颜色 + 27 处阴影） | 4–6h |
| 12 | 补齐缺失 Token（diff/button/accent/window） | 2h |
| 13 | Storybook Composite 覆盖（10 个缺口） | 6–8h |

---

> 「纸上得来终觉浅，绝知此事要躬行。」——陆游
>
> 流程应服务于产品，而不是产品服务于流程。让 Agent 打开 APP 看一眼，胜过写一百页 RUN_LOG。
