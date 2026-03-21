# V1-06 AI 面板大整修

- **GitHub Issue**: 待创建
- **所属任务簇**: V1（视觉重塑）— Wave 2 AI + 设置
- **umbrella**: v1-00-visual-overhaul-program
- **涉及模块**: ai
- **前端验收**: 需要（组件拆分行为等价 + 视觉对齐设计稿 + Storybook 构建通过）

---

## Why：为什么必须做

### 1. 用户现象

AiPanel.tsx 以 2,100 行之躯，雄踞全仓之巅——「一室之内，百工杂陈，虽器不残，匠必相碍。」标签页切换、消息流渲染、输入区域（textarea、emoji、文件上传）、Proposal 预览（accept / reject / undo）、Model / Mode / Skill 选择器、错误处理、流式输出状态管理、候选卡片展示、使用量统计——九大职责同室而居，任何一处改动都需要理解全貌，bug 修复如同在万卷书楼中抽换一页。

与此同时，AI 面板作为创作者与 AI 协作的核心界面，其视觉表达与 `14-ai-panel.html` 设计稿之间存在系统性偏差：

- **Tab 界面缺失**：设计稿定义 "Chat / History" 双标签页，当前无 tab 切换 UI，聊天与历史的入口全靠隐式逻辑
- **AI 消息品牌视觉标识缺失**：设计稿定义 AI 回复消息左侧 2px accent 边框，当前使用 `bg-[var(--color-bg-selected)]` 无差异化——AI 说的话与系统消息视觉等重，缺乏视觉区分
- **空状态形同虚设**：设计稿有 48px 旋转 sunburst 图标 + 居中引导文案，当前只有纯文本 `emptyHint`——"空谷无回音，不如置一鹤鸣"
- **代码块无 monospace**：设计稿使用 JetBrains Mono 渲染代码，当前 `text-[13px]` 无 font-family override——代码混入正文字体，可读性退化
- **Model / Mode / Skill 选择器交互暗示不足**：设计稿有清晰的下拉菜单交互指示（chevron icon + hover 高亮），当前嵌入输入区无交互暗示——用户不知道那是可以点击的
- **流式输出缺少动效**：设计稿定义打字机效果 + 脉冲光标（`32-ai-streaming-states.html`），当前文字直接渲染——AI 的思考过程失去了"正在书写"的生动感
- **ErrorGuideCard 无严重等级区分**：设计稿通过左边框颜色区分 red（error）/ yellow（warning）/ blue（info），当前统一样式——"轻重不分，则急事缓听"
- **使用量统计信息过密**：token 和 cost 挤在单行，信息密度过高，设计稿有分行展示 + 小字注释的布局

### 2. 根因

「积微成著，月不知其盈也。」

AiPanel 的巨石化是功能增量叠加的自然结果：聊天核心 → 加入历史 → 加入 Proposal → 加入选择器 → 加入流式输出 → 加入错误处理 → 加入使用量统计。每次增量合理，累积后失控。这些功能模块之间的数据依赖是松散的（共享 store state + AI stream），完全可以通过子组件 + custom hooks 拆分。

视觉偏差的根因则是开发过程中跳过了设计稿逐页对齐——`14-ai-panel.html` 和 `32-ai-streaming-states.html` 定义了精细的视觉规范（视觉标识、打字机动效、等级化错误提示），但代码实现只取了功能骨架，未取视觉血肉。

### 3. 威胁

- **产品信任**：AI 面板是用户与 AI 协作的主界面，空状态只有纯文本、AI 回复没有品牌标识、错误消息不分轻重——"若连对话窗口都显得敷衍，用户凭什么相信 AI 的能力？"
- **维护成本**：2,100 行的 AiPanel 任何 bug 修复都有 side effect 风险；10+ 个测试文件（14 个 test 文件）都围绕这一个巨石组件展开，定位问题时认知负荷极高
- **能力表达**：CreoNow 的后端 AI 能力（Skill routing、streaming、model selection）已经成熟，但前端无法忠实表达这些能力——选择器不可点击、流式输出无动效、错误提示无等级——"藏锋于鞘，利刃何光？"
- **并行开发阻塞**：两个 Agent / 开发者无法同时修改 AiPanel 的不同功能——merge conflict 几乎必然

### 4. 证据来源

| 数据点              | 值                                                                   | 来源                          |
| ------------------- | -------------------------------------------------------------------- | ----------------------------- |
| AiPanel.tsx 行数    | 2,100 行                                                             | `wc -l`                       |
| Features 层排名     | 第 1 大                                                              | `wc -l` 排序                  |
| AI 模块测试文件     | 14 个                                                                | `ls features/ai/*.test.*`     |
| AI 模块辅助文件     | ChatHistory.tsx、ModePicker.tsx、ModelPicker.tsx、SkillPicker.tsx 等 | 目录列表                      |
| Tab UI 设计稿       | Chat / History 双标签页                                              | `14-ai-panel.html`            |
| accent 视觉标识     | AI 消息左侧 2px accent 边框                                          | `14-ai-panel.html`            |
| 空状态设计稿        | 48px sunburst icon + 居中引导文案                                    | `14-ai-panel.html`            |
| 代码块字体          | JetBrains Mono                                                       | `14-ai-panel.html`            |
| 流式输出动效        | 打字机效果 + 脉冲光标                                                | `32-ai-streaming-states.html` |
| 错误等级区分        | red / yellow / blue 左边框                                           | `33-ai-dialogs.html`          |
| DESIGN_DECISIONS.md | §22 AI 面板规范                                                      | 设计文档                      |

---

## What：做什么

### 1. 组件拆分——AiPanel 按职责边界解耦为独立子组件

AiPanel.tsx（2,100 行）将消息流、输入区、Tab 切换、Proposal 预览、空状态、统计展示六大独立职责糊在一个文件中，任何单点修改都需要理解全部 2,100 行上下文。按「一个组件只做一件事」的原则破坏性拆分：

- **`AiPanel.tsx`**（≤300 行）— 面板框架 + Tab 切换逻辑 + 子组件编排
- **`AiPanelTabBar.tsx`** — Chat / History 标签页切换 UI
- **`AiMessageList.tsx`** — 消息流渲染（用户消息 + AI 消息 + 系统消息），含 accent 视觉标识
- **`AiInputArea.tsx`** — 输入区（textarea + emoji + 文件上传 + Model / Mode / Skill 选择器）
- **`AiProposalView.tsx`** — Proposal 预览（accept / reject / undo + inline diff）
- **`AiEmptyState.tsx`** — 空状态（sunburst icon + 引导文案）
- **`AiUsageStats.tsx`** — Token / cost 统计展示

### 2. Tab 界面实现

对齐 `14-ai-panel.html` 设计稿，实现 Chat / History 双标签页 UI，使用 Tabs primitive（v1-02 提供底线指示器）。

### 3. AI 消息 accent 视觉标识

AI 回复消息增加左侧 2px accent 边框，使用 `--color-accent`（复用现有 `--color-accent` token）。

### 4. 空状态视觉升级

实现设计稿定义的 48px 旋转 sunburst 图标 + 居中引导文案 + 渐入动画，替换当前纯文本 `emptyHint`。

### 5. 代码块 monospace 字体

AI 回复中的代码块增加 `font-family: var(--font-mono)`（JetBrains Mono / 等宽回退），确保代码可读性。

### 6. 选择器交互增强

Model / Mode / Skill 选择器增加 chevron icon + hover 高亮 + 下拉菜单视觉指示，使「可交互」状态明确。

### 7. 流式输出动效

实现打字机效果（逐字渲染 + 可配置速率）+ 脉冲光标（`@keyframes` 闪烁），对齐 `32-ai-streaming-states.html`。使用 `--duration-normal`（200ms）和 `--ease-default` token。

### 8. ErrorGuideCard 等级化

错误提示卡片增加左边框颜色区分：`--color-danger`（red / error）、`--color-warning`（yellow / warning）、`--color-info`（blue / info），使严重等级一目了然。

### 9. 使用量统计布局优化

Token 和 cost 分行展示，增加小字注释说明，降低信息密度。

### 10. 关联文件职责解耦

AI 模块中其他超过 300 行的文件存在职责混合问题，在本 change 中一并按职责边界拆分：

#### SkillManagerDialog.tsx（624 行）——列表与详情职责分离

- **`SkillList.tsx`** — 技能列表：搜索过滤 + 分类展示 + 启用/禁用 toggle（单一职责：列表浏览）
- **`SkillDetailPanel.tsx`** — 技能详情：描述 + 配置项 + 测试面板（单一职责：详情编辑）
- **`SkillManagerDialog.tsx`** — 对话框框架 + 列表/详情组合（单一职责：组合层）

#### SkillPicker.tsx（346 行）——选项渲染与列表逻辑分离

- 提取 `SkillPickerItem.tsx` — 单技能选项渲染（单一职责：选项 UI）
- `SkillPicker.tsx` 仅保留列表逻辑与组合编排

---

## Non-Goals：不做什么

1. **不改 AI Store 接口**——Zustand store 的 API 不变
2. **不改 AI 后端交互协议**——streaming、model selection 的 IPC 接口不变
3. **不改 ChatHistory.tsx / ModePicker.tsx / ModelPicker.tsx / SkillPicker.tsx 现有逻辑**——这些已拆分的辅助文件保持不变
4. **不新增 AI 功能**——不加新 skill、不加新 model provider、不改对话逻辑
5. **不改 InlineAiInput（编辑器内嵌 AI）**——编辑器内嵌 AI 交互由 v1-05 管辖
6. **不引入新的动效库**——动画使用 CSS `@keyframes` + Design Token，不加 framer-motion 等
7. **不改 `useAiStream.ts` hook 逻辑**——流式输出的数据层不变，仅改渲染层动效

---

## 依赖与影响

- **上游依赖**: v1-01（Design Token 补完）提供 animation token；v1-02（Primitive 进化）提供 Tabs 底线指示器、Badge 增强
- **下游影响**: v1-11（空/加载/错误状态统一）将复用 `AiEmptyState.tsx` 的模式；v1-12（交互动效收口）将复用流式输出动效的 CSS keyframes
- **风险控制**: AiPanel 拆分是本 change 最大风险点——2,100 行代码中存在大量隐式状态共享。策略：先写行为等价回归测试（Phase 1），确保拆分前后 14 个测试文件全部通过；拆分以「提取子组件 → 验证通过 → 提取下一个」的逐步方式进行，不做"大爆炸"重构

---

## R2 级联刷新记录（2026-03-21）

### 刷新触发

R2 P1 复核 v1-03/04/05 → 级联刷新下游。v1-06 已于之前合并到 main，此次为 R2 基线重采集。

### 实现后基线（R2 重采集）

| 组件 / 文件               | 目标      | 实际      | 状态 |
| ------------------------- | --------- | --------- | ---- |
| AiPanel.tsx               | ≤300 行   | 281 行    | ✅   |
| AiPanelTabBar.tsx         | 独立存在  | 50 行     | ✅   |
| AiMessageList.tsx         | ≤300 行   | 432 行    | ⚠️   |
| AiInputArea.tsx           | ≤300 行   | 293 行    | ✅   |
| AiProposalView.tsx        | 独立存在  | 68 行     | ✅   |
| AiEmptyState.tsx          | 独立存在  | 25 行     | ✅   |
| AiUsageStats.tsx          | 独立存在  | 55 行     | ✅   |
| AI 模块 prod 总行数       | —         | 4,179 行  | —    |
| 测试文件数                | ≥14       | 27        | ✅   |

### 偏差记录

- **AiMessageList.tsx 超出 300 行上限**（432 行）：消息流渲染逻辑复杂，包含用户/AI/系统三类消息格式化。可在后续迭代中进一步拆分。Non-blocking。
- **SkillManagerDialog.tsx 624 行**：仍为巨石组件，已登记到 v1-12 处理清单。

### 残余技术债

| 类型               | 数量 | 归属 |
| ------------------ | ---- | ---- |
| Arbitrary values   | ~88  | v1-18 |
| eslint-disable     | 45   | v1-13 |
| Native HTML 元素   | 104  | v1-12 |

### 结论

v1-06 核心 AC（组件拆分 + Tab UI + 视觉对齐）已达成。AiMessageList 超限为已知偏差，不影响交付。
