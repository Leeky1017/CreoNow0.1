# V1-00 前端视觉全面重塑计划

- **所属任务簇**: V1（视觉重塑）
- **涉及模块**: 全前端 Features 层 + Primitives 扩展 + 设计系统基础设施
- **前端验收**: 每个 child change 必须有视觉验收
- **当前进度**: 14/27 已完成（v1-01~v1-11, v1-14~v1-16）

---

## Why：为什么必须做

### 1. 用户现象

用户打开 CreoNow，看到的是一个零件尚可、整体却失序的工具——仿佛一间藏品精良的博物馆，灯光却装成了仓库。Design Token 备齐了 405 行 CSS 变量，DESIGN_DECISIONS.md 写满了 2,179 行规范，Storybook 有 19 个 Story，ESLint 门禁把 4 条视觉规则提升到了 error——「粮草齐备，兵甲亦利，唯独战阵散乱」。

初始具体表现（立项时基线）：

- **AiPanel.tsx 2,500 行巨石组件**：混合了标签页切换、消息渲染、输入区、Proposal 预览、Model/Mode/Skill 选择器，任何修改都需要理解全貌
- **EditorPane.tsx 1,550 行**：融合了 inline AI、entity completion、slash command、autosave 等无关逻辑
- **FileTreePanel.tsx 1,320 行**：icon bar 宽度未锁定 48px、行高未对齐 32px、拖拽缺少圆形手柄
- **200+ 处原生 HTML 元素**绕过设计系统（`<button>`、`<input>`、`<select>`），外加 176 条 `eslint-disable` 注释掩盖
- **51 处硬编码颜色值**（`#ffffff`、`#3b82f6`、`#22c55e` 等）在 Settings 页直接出现
- **173 处 inline style 对象**散布 features/ 目录
- **AI 面板缺失视觉标识**（设计稿定义 2px accent 左边框，代码里没有）
- **编辑器正文无 max-width 约束**（设计稿定义 760px 居中，实际撑满容器）
- **空状态 / 加载状态 / 错误状态**各面板实现方式不一致，视觉语言碎片化

> **14 个 child change 完成后的当前现象（2026-03-21 实测）**：v1-14 / v1-15 已并入本分支，入口页与 AI overlay 的巨石组件进一步拆解；AiPanel 281 行、EditorPane 232 行维持达标，但 AppShell 1,267 行和 SkillManagerDialog 624 行仍是技术债头部；原生 HTML 维持 153 处，hardcoded hex 维持 25 处，inline style 为 897 处，`text-[Npx]` arbitrary 在当前分支实测为 1000 处，v1-02 新变体在 features 层使用率仍为 0。

### 2. 根因

「底座精良，上层失序。」

Primitives 层质量优秀，Design Token 覆盖完整，ESLint 规则已全部提升到 error。但 Features 层（立项时 28,481 行 / 73 文件，当前含 Stories 已增至 55,432 行）在开发过程中跳过了设计稿逐页对齐，导致：

- **组件巨石化**：业务逻辑与视觉渲染耦合在同一文件中（AiPanel、EditorPane 已解决，AppShell 1,267 行 / SkillManagerDialog 624 行仍在）
- **设计语言绕过**：开发者直接使用原生 HTML + Tailwind arbitrary 值，而非组合 Primitives（153 处原生 button、1000 处 text-[Npx]、9 处 arbitrary spacing 残留）
- **交互细节缺失**：设计稿定义的 0.2-0.3s cubic-bezier 过渡、hover 状态、scroll shadow 等在代码中普遍缺失
- **视觉一致性碎片化**：空状态有 5 种不同实现，加载状态 3 种，错误状态 4 种（v1-11 已将 53 处集成为统一组件）
- **变体产能闲置**：v1-02 精心构建的 pill/bento/compact/underline/bordered 变体，Features 层使用率为 0

### 3. 威胁

- **产品信任**：用户在 AI 面板看到空荡荡的 emptyHint 文本，在 Dashboard 看到与设计稿完全不同的卡片布局——"如果这款创作工具连自己的界面都没打磨好，我怎么放心用它打磨我的作品？"
- **维护成本**：2,500 行的 AiPanel 任何 bug 修复都可能引发 side effect；1,550 行的 EditorPane 重构风险极高
- **能力表达**：CreoNow 的后端能力（AI Skill routing、KG recognition、memory semantic）已相当成熟，但前端无法忠实表达这些能力——"酒香巷深，客不知其味"

### 4. 证据来源

> 基线数据采集于 2026-03-20，以下每个数据点均附实测命令。

| 数据点                 | 立项基线值          | 当前实测值              | 变化       | 采集命令                                                                         |
| ---------------------- | ------------------- | ----------------------- | ---------- | -------------------------------------------------------------------------------- |
| Features 层总行数      | 28,481 行 / 73 文件 | 55,432 行（含 stories） | scope 扩大 | `find renderer/src/features -name '*.tsx' \| xargs wc -l`                        |
| eslint-disable 注释    | 176 处              | 146 处                  | ↓17%       | `grep -r 'eslint-disable' renderer/src/features/ \| wc -l`                       |
| no-native-html disable | —                   | 121 处                  | 新增度量   | `grep -r 'no-native-html' renderer/src/features/ \| wc -l`                       |
| 原生 button 元素       | 200+                | 153 处                  | ↓23%       | `grep -rP '<button' renderer/src/features/ \| wc -l`                             |
| text-[Npx] arbitrary   | 704 处              | 1000 处                 | ↑42%       | `grep -rP 'text-\[' renderer/src/ \| wc -l`                                      |
| arbitrary spacing      | —                   | 9 处                    | 新增度量   | `grep -rP '[pm][xytblr]?-\[\d+px\]' renderer/src/ \| wc -l`                      |
| hardcoded hex 色值     | 51 处               | 25 处                   | ↓51%       | `grep -rP '#[0-9a-fA-F]{3,8}' renderer/src/features/ --include='*.tsx' \| wc -l` |
| inline style 对象      | 173 处（features/） | 897 处（src/）          | scope 扩大 | `grep -r 'style={{' renderer/src/ \| wc -l`                                      |
| AiPanel.tsx            | 2,500 行            | 281 行                  | ✅ ↓89%    | `wc -l renderer/src/features/ai/AiPanel.tsx`                                     |
| EditorPane.tsx         | 1,550 行            | 232 行                  | ✅ ↓85%    | `wc -l renderer/src/features/editor/EditorPane.tsx`                              |
| AppShell.tsx           | —                   | 1,267 行                | 待 v1-12   | `wc -l renderer/src/components/layout/AppShell.tsx`                              |
| SkillManagerDialog     | —                   | 624 行                  | 待 v1-12   | `wc -l renderer/src/features/ai/SkillManagerDialog.tsx`                          |
| tokens.css             | 405 行              | 469 行                  | ✅ v1-01   | `wc -l design/system/01-tokens.css`                                              |
| DESIGN_DECISIONS.md    | 2,179 行            | 2,179 行                | 不变       | `wc -l design/DESIGN_DECISIONS.md`                                               |
| 设计稿                 | 35 HTML             | 36 HTML                 | +1         | `ls design/Variant/designs/ \| wc -l`                                            |
| Storybook Stories      | 19                  | 83                      | ✅ ↑337%   | `find renderer/src -name '*.stories.tsx' \| wc -l`                               |
| Play functions         | —                   | 256                     | 新增度量   | `grep -r 'play:' renderer/src/ --include='*.stories.tsx' \| wc -l`               |
| v1-02 变体使用率       | —                   | 0                       | 待 v1-18   | `grep -rP 'variant="(pill\|bento\|compact)"' renderer/src/features/ \| wc -l`    |

---

## What：做什么

本 umbrella 作为视觉重塑总控，统一调度 27 个 child changes 分 10 个 Phase 逐步落地，确保用户可触达的 100% 前端路径均经过视觉/结构重构。「千里之行，始于足下」——Phase 0~4 筑基塑形，Phase 5~6 全覆盖收口，Phase 7~9 登峰造极。

> **当前进度：14/27 已完成**（v1-01~v1-11, v1-14~v1-16）

### 已完成 Changes 评估总览

| Change | 名称                | 评级       | 关键成果                                                       |
| ------ | ------------------- | ---------- | -------------------------------------------------------------- |
| v1-01  | Design Token 补完   | ⭐⭐⭐⭐   | 三层体系建立，26 处 pixel 残留归 v1-18                         |
| v1-02  | Primitive 组件进化  | ⭐⭐⭐⭐⭐ | 7/7 AC 全满，标杆交付                                          |
| v1-03  | Dashboard 视觉重写  | ⭐⭐⭐⭐   | 929→268 行                                                     |
| v1-04  | 编辑器排版与布局    | ⭐⭐⭐⭐   | 760px/48px/CJK 全部达标                                        |
| v1-05  | 编辑器组件拆分      | ⭐⭐⭐⭐⭐ | 1550→232 行，标杆交付                                          |
| v1-06  | AI 面板大整修       | ⭐⭐⭐     | 2100→281 行，但 SkillManagerDialog 624 行遗留                  |
| v1-07  | Settings 视觉精修   | ⭐⭐⭐⭐   | hardcoded hex 清零                                             |
| v1-08  | FileTree 像素级对齐 | ⭐⭐⭐     | 1320→126 行，但 4/8 AC 未满                                    |
| v1-09  | CmdPalette + Search | ⭐⭐⭐⭐   | 双组件达标                                                     |
| v1-10  | 侧面板视觉统一      | ⭐⭐⭐⭐   | PanelHeader 7 处统一                                           |
| v1-11  | 空/加载/错误状态    | ⭐⭐⭐⭐⭐ | 53 处集成，标杆交付                                            |
| v1-14  | 对话框与入口页补完  | ⭐⭐⭐⭐   | Export / Project / Onboarding / SettingsGeneral 入口重构已落地 |
| v1-15  | AI Overlay 组件统一 | ⭐⭐⭐⭐   | AiDiff / AiError / SystemDialog / InlineConfirm 已解耦         |
| v1-16  | Quality/Misc 补完   | ⭐⭐⭐     | pixel 残留 + DiffView 超标（提前完成）                         |

### Phase 0：地基增强（✅ 已合并——无用户可见变化，纯底层完善）

| Change | 名称               | 状态      | 目标                                                                                                |
| ------ | ------------------ | --------- | --------------------------------------------------------------------------------------------------- |
| v1-01  | Design Token 补完  | ✅ 已合并 | 补全 typography scale、spacing 精细化、animation token                                              |
| v1-02  | Primitive 组件进化 | ✅ 已合并 | Button pill/ghost、Card bento/stat、Tabs 底线指示器、Badge 增强 + Radio/Select/ImageUpload 解耦重构 |

### Phase 1：P0 页面重塑（✅ 已合并——用户打开 App 最先看到的两个场景）

| Change | 名称               | 状态      | 目标                                                               |
| ------ | ------------------ | --------- | ------------------------------------------------------------------ |
| v1-03  | Dashboard 视觉重写 | ✅ 已合并 | DashboardPage shell 重写，对齐设计稿 bento grid / sidebar-full     |
| v1-04  | 编辑器排版与布局   | ✅ 已合并 | 正文 760px 居中、Lora serif 选项、标题 48px/300/-0.03em            |
| v1-05  | 编辑器组件拆分     | ✅ 已合并 | EditorPane.tsx 1,550→232 行：提取 inline AI、entity、slash command |

### Phase 2：AI 面板 + 设置（✅ 已合并）

| Change | 名称              | 状态      | 目标                                                         |
| ------ | ----------------- | --------- | ------------------------------------------------------------ |
| v1-06  | AI 面板大整修     | ✅ 已合并 | AiPanel.tsx 2,100→281 行 + accent 视觉标识 + Tab UI + 空状态 |
| v1-07  | Settings 视觉精修 | ✅ 已合并 | 外观页主题/字体/色板选择器、分节标题、toggle 动效            |

### Phase 3：布局精度（✅ 已合并）

| Change | 名称                         | 状态      | 目标                                                      |
| ------ | ---------------------------- | --------- | --------------------------------------------------------- |
| v1-08  | FileTree 像素级对齐          | ✅ 已合并 | 48px icon bar、32px 行高、拖拽圆形手柄、rename focus 边框 |
| v1-09  | CommandPalette + Search 视觉 | ✅ 已合并 | 分组分隔线、快捷键标签、filter pills、search highlighting |

### Phase 4：侧面板 + 状态收口（✅ 已合并）

| Change | 名称                 | 状态      | 目标                                                    |
| ------ | -------------------- | --------- | ------------------------------------------------------- |
| v1-10  | 侧面板视觉统一       | ✅ 已合并 | Character/Memory/Outline/KG/VersionHistory 统一面板语言 |
| v1-11  | 空/加载/错误状态统一 | ✅ 已合并 | 设计稿 26/27 标准化，全局状态组件收口，53 处集成        |

### Phase 5：全覆盖收口（❌ 待实施——100% 用户路径覆盖）

| Change | 名称                    | 状态      | 目标                                                                                        |
| ------ | ----------------------- | --------- | ------------------------------------------------------------------------------------------- |
| v1-12  | 交互动效与原生元素收口  | ❌ 待实施 | 0.2-0.3s 过渡、hover 状态、scroll shadow + 153 native→primitives + AppShell 1,267→≤250 解耦 |
| v1-13  | eslint-disable 审计清扫 | ❌ 待实施 | 逐条审查 144 个 eslint-disable，确认合理或替换为 Primitive                                  |
| v1-14  | 对话框与入口页视觉补完  | ✅ 已完成 | ExportDialog/CreateProjectDialog/OnboardingPage/SettingsGeneral 已完成拆分与 token 对齐     |
| v1-15  | AI Overlay 组件视觉统一 | ✅ 已完成 | AiDiffModal/AiErrorCard/SystemDialog/AiInlineConfirm 解耦 + v1-06 视觉统一                  |

### Phase 6：杂项补完（✅ v1-16 已提前合并）

| Change | 名称                      | 状态      | 目标                                                                         |
| ------ | ------------------------- | --------- | ---------------------------------------------------------------------------- |
| v1-16  | Quality/Diff/杂项页面补完 | ✅ 已合并 | Quality 面板 + Diff 模块 + Analytics/ZenMode/Shortcuts/Settings 子组件全覆盖 |

### Phase 7：精度打磨（📝 proposal 已建立——tasks/specs/issue 待补）

| Change | 名称                       | 状态               | 目标                                                        |
| ------ | -------------------------- | ------------------ | ----------------------------------------------------------- |
| v1-17  | 字体本地打包与视觉回归测试 | 📝 proposal 已建立 | woff2 字体打包 + shadow token 补全 + Playwright 视觉回归 CI |
| v1-18  | Arbitrary 值收口与变体推广 | 📝 proposal 已建立 | 1000 处 text-[] 降至 ≤20 + v1-02 变体使用率从 0 推广至 ≥15  |

### Phase 8：卓越化（📝 proposal 已建立——无障碍/Storybook/微交互/品牌；v1-23 仍待创建）

| Change | 名称                 | 状态               | 目标                                                                     |
| ------ | -------------------- | ------------------ | ------------------------------------------------------------------------ |
| v1-19  | 无障碍达标与键盘导航 | 📝 proposal 已建立 | WCAG 2.1 AA + 键盘导航 100% + axe-core CI + 高对比模式                   |
| v1-20  | Storybook 卓越化     | 📝 proposal 已建立 | 22 目录 100% Story 覆盖 + play function ≥290 + 用法文档 + 双主题装饰器   |
| v1-21  | 性能感知与微交互     | 📝 proposal 已建立 | @tanstack/virtual 长列表 + Skeleton ≥60 处 + CSS 微交互动画 + 55fps 帧率 |
| v1-22  | 品牌标识与视觉精修   | 📝 proposal 已建立 | 品牌渐变 token + ≥6 SVG 插图 + Onboarding 动效 + accent 色阶 50-900      |
| v1-23  | 色彩系统升级         | 📋 待创建          | HSL 色阶生成（类 Radix 10-step）+ 功能色 hover/active 补全 + 高对比模式  |

### Phase 9：极致打磨（📋 待创建——组件扩展/密度/虚拟化/图标）

| Change | 名称                 | 状态      | 目标                                                                            |
| ------ | -------------------- | --------- | ------------------------------------------------------------------------------- |
| v1-24  | 组件库扩展           | 📋 待创建 | Table/Separator/Alert/SegmentedControl/Progress + Input slot + compound pattern |
| v1-25  | 密度系统与组件 Token | 📋 待创建 | DensityProvider (compact/comfortable) + component-level token 层                |
| v1-26  | 虚拟化与感知性能     | 📋 待创建 | @tanstack/virtual 深度集成 + CSS containment + optimistic UI + code splitting   |
| v1-27  | 图标系统与品牌资产   | 📋 待创建 | Icon wrapper + size token 映射 + stroke-width 统一 + 品牌自定义图标             |

---

## Non-Goals：不做什么

1. **不改后端**——本轮涉及 `renderer/src/features/` 和 `renderer/src/components/` 下的 JSX/CSS 层
2. **不改 Store 逻辑**——Zustand store 保持不变，仅调整组件对 store 的消费方式
3. **不改 IPC/Preload 合同**——前后端通信协议不变
4. **不改 Primitives 核心 API**——只扩展变体（v1-02, v1-24）、不修改现有 API
5. **不引入 CSS-in-JS / UI 库 / 动效库**——v1-21 微交互限 CSS-only，v1-26 虚拟化仅引入 @tanstack/virtual
6. **不修改设计稿**——以 `design/Variant/designs/` 36 个 HTML 为准，代码向设计对齐
7. **不改测试基础设施**——测试框架、mock 策略不变

---

## 依赖与影响

### 上游依赖

- `a1-capability-closure-program`（能力收口）的核心 Wave 完成后再启动后续视觉重塑，避免对正在收口的功能模块造成冲突
- Phase 0~4 已在能力收口完成后落地

### 内部依赖链

```
Phase 0 (v1-01, v1-02) ← 所有后续 Phase 的基础
  │
Phase 1-4 (v1-03~v1-11) ← 已全部合并
  │
Phase 5 (v1-12~v1-15) ← 依赖 v1-02 Primitive 作为替换目标
  │                       v1-13 依赖 v1-12 先完成原生替换
  │
Phase 6 (v1-16) ← 已提前合并
  │
Phase 7 (v1-17, v1-18) ← v1-17 依赖 v1-01 Token；v1-18 依赖 v1-12 原生收口 + v1-02 变体
  │
Phase 8 (v1-19~v1-23) ← 5 项可并行；v1-20 依赖 v1-14/v1-15 完成
  │
Phase 9 (v1-24~v1-27) ← v1-24 依赖 v1-02；v1-25 依赖 v1-01+v1-24
                         v1-26 依赖 v1-21；v1-27 依赖 v1-22
```

### 被依赖于

- **浅色主题实现**：视觉重塑统一暗色主题后，浅色主题只需切换 token 值
- **v1-25 密度系统**：为未来 compact/comfortable 双模式奠基，影响所有面板组件的 token 消费方式

### 风险

- **巨石组件拆分回归**：AppShell 1,267 行、SkillManagerDialog 624 行的拆分（v1-12）如果测试不到位，可能引入 regression——每个 child change 必须按 TDD 落地
- **Arbitrary 值批量替换**：v1-18 涉及 667+ 处 text-[] 替换，需逐文件验证视觉效果不变
- **@tanstack/virtual 引入**（v1-26）：唯一新增运行时依赖，需严格控制 bundle size 影响

---

## 验收标准（总控级）

> 「不积跬步，无以至千里。」——荀子《劝学》
> 以下每条标准附当前实测值与责任 change，最终验收以 27/27 合并后的全量数据为准。

| #   | 标准                      | 目标         | 当前实测（2026-03-20） | 状态                | 责任 Change         |
| --- | ------------------------- | ------------ | ---------------------- | ------------------- | ------------------- |
| 1   | eslint-disable 注释数     | ≤20          | 146 处                 | [进行中] ↓17%       | v1-12, v1-13        |
| 2   | 原生 HTML 元素数          | ≤10          | 153 处                 | [进行中] ↓23%       | v1-12               |
| 3   | hardcoded hex 色值        | 0            | 25 处                  | [进行中] ↓51%       | v1-12, v1-18        |
| 4   | inline style 对象（src/） | ≤30          | 897 处                 | [进行中] scope 扩大 | v1-12, v1-14, v1-15 |
| 5   | AiPanel.tsx 行数          | ≤500         | 281 行                 | [已达成] ✅ ↓89%    | v1-06               |
| 6   | EditorPane.tsx 行数       | ≤400         | 232 行                 | [已达成] ✅ ↓85%    | v1-05               |
| 7   | AppShell.tsx 行数         | ≤250         | 1,267 行               | [待完成]            | v1-12               |
| 8   | SkillManagerDialog 行数   | ≤300         | 624 行                 | [待完成]            | v1-12               |
| 9   | text-[] arbitrary 值      | ≤20          | 1000 处                | [待完成] ↑42%       | v1-18               |
| 10  | v1-02 变体使用率          | ≥15          | 0 处                   | [待完成]            | v1-18               |
| 11  | 空/加载/错误状态统一      | 全局统一组件 | 53 处集成              | [已达成] ✅         | v1-11               |
| 12  | Storybook Stories         | ≥100         | 83                     | [进行中] ↑337%      | v1-20               |
| 13  | Play functions            | ≥290         | 256                    | [进行中]            | v1-20               |
| 14  | Storybook 可构建          | ✅           | ✅                     | [已达成] ✅         | —                   |
| 15  | 全量测试通过              | 0 失败       | 2,589 通过 / 0 失败    | [已达成] ✅         | —                   |
| 16  | lint ratchet 不新增违规   | 不新增       | —                      | [进行中]            | 每个 change         |
| 17  | axe-core 无障碍零违规     | 0 violations | —                      | [待完成]            | v1-19               |
| 18  | 交互帧率                  | ≥55fps       | —                      | [待完成]            | v1-21               |
| 19  | tokens.css 行数           | ≥500         | 469 行                 | [进行中] ✅ v1-01   | v1-23, v1-25        |
| 20  | 27/27 child changes 合并  | 全部合并     | 14/27                  | [进行中]            | —                   |
