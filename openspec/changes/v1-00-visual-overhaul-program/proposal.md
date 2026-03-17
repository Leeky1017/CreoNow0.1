# V1-00 前端视觉全面重塑计划

- **GitHub Issue**: 待创建（umbrella）
- **所属任务簇**: V1（视觉重塑）
- **涉及模块**: 全前端 Features 层
- **前端验收**: 每个 child change 必须有视觉验收

---

## Why：为什么必须做

### 1. 用户现象

用户打开 CreoNow，看到的是一个零件尚可、整体却失序的工具——仿佛一间藏品精良的博物馆，灯光却装成了仓库。Design Token 备齐了 405 行 CSS 变量，DESIGN_DECISIONS.md 写满了 2,179 行规范，Storybook 有 19 个 Story，ESLint 门禁把 4 条视觉规则提升到了 error——「粮草齐备，兵甲亦利，唯独战阵散乱」。

具体表现：

- **AiPanel.tsx 2,500 行巨石组件**：混合了标签页切换、消息渲染、输入区、Proposal 预览、Model/Mode/Skill 选择器，任何修改都需要理解全貌
- **EditorPane.tsx 1,550 行**：融合了 inline AI、entity completion、slash command、autosave 等无关逻辑
- **FileTreePanel.tsx 1,320 行**：icon bar 宽度未锁定 48px、行高未对齐 32px、拖拽缺少圆形手柄
- **200+ 处原生 HTML 元素**绕过设计系统（`<button>`、`<input>`、`<select>`），外加 176 条 `eslint-disable` 注释掩盖
- **51 处硬编码颜色值**（`#ffffff`、`#3b82f6`、`#22c55e` 等）在 Settings 页直接出现
- **173 处 inline style 对象**散布生产代码
- **AI 面板缺失视觉标识**（设计稿定义 2px accent 左边框，代码里没有）
- **编辑器正文无 max-width 约束**（设计稿定义 760px 居中，实际撑满容器）
- **空状态 / 加载状态 / 错误状态**各面板实现方式不一致，视觉语言碎片化

### 2. 根因

「底座精良，上层失序。」

Primitives 层（15,080 行）质量优秀，Design Token 覆盖完整，ESLint 规则已全部提升到 error。但 Features 层（28,481 行，73 个 .tsx 文件）在开发过程中跳过了设计稿逐页对齐，导致：

- **组件巨石化**：业务逻辑与视觉渲染耦合在同一文件中
- **设计语言绕过**：开发者直接使用原生 HTML + Tailwind arbitrary 值，而非组合 Primitives
- **交互细节缺失**：设计稿定义的 0.2-0.3s cubic-bezier 过渡、hover 状态、scroll shadow 等在代码中普遍缺失
- **视觉一致性碎片化**：空状态有 5 种不同实现，加载状态 3 种，错误状态 4 种

### 3. 威胁

- **产品信任**：用户在 AI 面板看到空荡荡的 emptyHint 文本，在 Dashboard 看到与设计稿完全不同的卡片布局——"如果这款创作工具连自己的界面都没打磨好，我怎么放心用它打磨我的作品？"
- **维护成本**：2,500 行的 AiPanel 任何 bug 修复都可能引发 side effect；1,550 行的 EditorPane 重构风险极高
- **能力表达**：CreoNow 的后端能力（AI Skill routing、KG recognition、memory semantic）已相当成熟，但前端无法忠实表达这些能力——"酒香巷深，客不知其味"

### 4. 证据来源

| 数据点              | 值                   | 来源                                           |
| ------------------- | -------------------- | ---------------------------------------------- |
| Features 层总行数   | 28,481 行 / 73 文件  | `wc -l` 统计                                   |
| eslint-disable 注释 | 176 处               | `grep -r eslint-disable features/`             |
| 原生 HTML 元素      | 200+ 处              | `grep -r '<button\|<input\|<select' features/` |
| 硬编码颜色值        | 51 处                | `grep -rP '#[0-9a-f]{3,6}' features/`          |
| inline style 对象   | 173 处               | `grep -r 'style={{' features/`                 |
| 最大文件            | AiPanel.tsx 2,500 行 | `wc -l`                                        |
| 设计稿页数          | 35                   | `ls design/Variant/designs/`                   |
| Design Token 覆盖   | 405 行 CSS 变量      | `wc -l design/system/01-tokens.css`            |
| DESIGN_DECISIONS.md | 2,179 行             | `wc -l`                                        |

---

## What：做什么

本 umbrella 作为视觉重塑总控，统一调度 16 个 child changes 分 6 个 Wave 逐步落地，确保用户可触达的 100% 前端路径均经过视觉/结构重构。

### Wave 0：地基增强（无用户可见变化，纯底层完善）

| Change | 名称               | 目标                                                                                                |
| ------ | ------------------ | --------------------------------------------------------------------------------------------------- |
| v1-01  | Design Token 补完  | 补全 typography scale、spacing 精细化、animation token                                              |
| v1-02  | Primitive 组件进化 | Button pill/ghost、Card bento/stat、Tabs 底线指示器、Badge 增强 + Radio/Select/ImageUpload 解耦重构 |

### Wave 1：P0 页面重塑（用户打开 App 最先看到的两个场景）

| Change | 名称               | 目标                                                               |
| ------ | ------------------ | ------------------------------------------------------------------ |
| v1-03  | Dashboard 视觉重写 | DashboardPage shell 重写，对齐设计稿 bento grid / sidebar-full     |
| v1-04  | 编辑器排版与布局   | 正文 760px 居中、Lora serif 选项、标题 48px/300/-0.03em            |
| v1-05  | 编辑器组件拆分     | EditorPane.tsx 1,550→300 行：提取 inline AI、entity、slash command |

### Wave 2：AI 面板 + 设置

| Change | 名称              | 目标                                                          |
| ------ | ----------------- | ------------------------------------------------------------- |
| v1-06  | AI 面板大整修     | AiPanel.tsx 2,100→≤300 行 + accent 视觉标识 + Tab UI + 空状态 |
| v1-07  | Settings 视觉精修 | 外观页主题/字体/色板选择器、分节标题、toggle 动效             |

### Wave 3：布局精度

| Change | 名称                         | 目标                                                      |
| ------ | ---------------------------- | --------------------------------------------------------- |
| v1-08  | FileTree 像素级对齐          | 48px icon bar、32px 行高、拖拽圆形手柄、rename focus 边框 |
| v1-09  | CommandPalette + Search 视觉 | 分组分隔线、快捷键标签、filter pills、search highlighting |

### Wave 4：侧面板 + 收口

| Change | 名称                    | 目标                                                                                         |
| ------ | ----------------------- | -------------------------------------------------------------------------------------------- |
| v1-10  | 侧面板视觉统一          | Character/Memory/Outline/KG/VersionHistory 统一面板语言                                      |
| v1-11  | 空/加载/错误状态统一    | 设计稿 26/27 标准化，全局状态组件收口                                                        |
| v1-12  | 交互动效与原生元素收口  | 0.2-0.3s 过渡、hover 状态、scroll shadow + 200+ native→primitives + AppShell 1,260→≤250 解耦 |
| v1-13  | eslint-disable 审计清扫 | 逐条审查 176 个 eslint-disable，确认合理或替换为 Primitive                                   |

### Wave 5：全覆盖收口（100% 用户路径覆盖）

| Change | 名称                      | 目标                                                                              |
| ------ | ------------------------- | --------------------------------------------------------------------------------- |
| v1-14  | 对话框与入口页视觉补完    | ExportDialog/CreateProjectDialog/OnboardingPage 破坏性重构 + SettingsGeneral 对齐 |
| v1-15  | AI Overlay 组件视觉统一   | AiDiffModal/AiErrorCard/SystemDialog/AiInlineConfirm 解耦 + v1-06 视觉统一        |
| v1-16  | Quality/Diff/杂项页面补完 | Quality 面板 + Diff 模块 + Analytics/ZenMode/Shortcuts/Settings 子组件全覆盖      |

---

## Non-Goals：不做什么

1. **不改后端**——本轮涉及 `renderer/src/features/` 和 `renderer/src/components/` 下的 JSX/CSS 层
2. **不改 Store 逻辑**——Zustand store（4,741 行）保持不变，仅调整组件对 store 的消费方式
3. **不改 IPC/Preload 合同**——前后端通信协议不变
4. **不改 Primitives 核心实现**——只扩展变体、不修改现有 API
5. **不引入新依赖**——不增加 CSS-in-JS、不换 UI 库、不加动效库
6. **不修改设计稿**——以 `design/Variant/designs/` 35 个 HTML 为准，代码向设计对齐
7. **不改测试基础设施**——测试框架、mock 策略不变

---

## 依赖与影响

- **上游依赖**: `a1-capability-closure-program`（能力收口）的 Wave 1 完成后再启动视觉重塑，避免对正在收口的功能模块造成冲突
- **内部依赖**: Wave 0（token + primitive）必须先于 Wave 1-4 落地；Wave 内各 change 可并行
- **被依赖于**: 后续浅色主题实现——视觉重塑统一暗色主题后，浅色主题只需切换 token 值
- **风险**: Features 层巨石组件拆分如果测试不到位，可能引入 regression——每个 child change 必须按 TDD 落地

---

## 验收标准（总控级）

1. Features 层所有 `.tsx` 文件中 `eslint-disable` 注释从 176 降至 ≤20（仅保留真正合理的例外）
2. 原生 HTML 元素从 200+ 降至 ≤10
3. 硬编码颜色值从 51 降至 0
4. inline style 对象从 173 降至 ≤30（Storybook 中允许）
5. AiPanel.tsx 从 2,500 行降至 ≤500 行（其余提取为子组件）
6. EditorPane.tsx 从 1,550 行降至 ≤400 行
7. 所有面板的空/加载/错误状态使用统一组件
8. Storybook 可构建且所有 Story 通过
9. 全量 2,000+ 测试通过
10. lint ratchet 不新增违规
