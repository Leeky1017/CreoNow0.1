# V1 Changes 优化重编策略（审计增强版）

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 把当前 V1 视觉重塑计划重编为一套边界清晰、执行可控、测试有牙齿的 change 组合，先修正文档结构与验收语言，再推进后续实现。

**Architecture:** 本策略不把 V1 当作单一功能，而是当作一个 change 组合治理问题来处理。第一步不是继续加实现，而是先修正 V1 文档编排：把视觉表层改造、结构治理、通用模式、补漏收口分开；把混装 change 拆开；把明显漏掉的用户路径重新归位；把验收标准从“文件存在证明”改成“用户风险被挡住”。

**Tech Stack:** OpenSpec change docs、`docs/plans/` Markdown、Electron renderer、Storybook、Vitest、Design Tokens、Tailwind v4。

---

## 0. 这次增强审计先给结论

上一版文档**方向没有错**，但确实存在你指出的核心问题：**TDD 与测试部分写得过粗，无法直接指导执行。**

本次增强后，这份文档要解决的不只是“V1 的 change 怎么重编”，还要回答四个执行层问题：

1. **现在已有的测试，问题到底在哪里？**
2. **哪些测试是有价值的守门，哪些只是为了交差？**
3. **不同类型的 V1 change，到底应该写哪一层测试？**
4. **怎样把测试写到“多而真”——既守核心链路，又不漏边界问题？**

如果一份策略文档不能把这四个问题讲清楚，那它还只是方向，不是方案。

---

## 1. 当前仓库证据：先按事实落子

以下数据来自 `2026-03-20` 当前仓库实测：

### 1.1 V1 计划层面的证据

- V1 change 目录总数：**17**（`v1-00` ~ `v1-16`）

### 1.2 前端样式与治理债务基线

- `eslint-disable-next-line creonow/no-native-html-element`：**215**
- 全量 `eslint-disable`：**255**
- 非 test/story 的 `text-[...]` arbitrary typography：**1049**
- 非 test/story 的 `rounded-[...]` arbitrary 值：**202**
- 非 test/story 的 `style={{ ... }}`：**83**

### 1.3 测试形态的风险信号

- `toBeTruthy()`：**10**
- `toBeDefined()`：**29**
- snapshot 用法：**1**
- className / class contract 相关断言：**395**
- story / completeness / Storybook existence 类测试命中：**73**

### 1.4 样本文件审读结论

已抽读样本：

- `apps/desktop/renderer/src/components/primitives/Button.v1-02-behavior.test.tsx`
- `apps/desktop/renderer/src/features/__tests__/state-pattern-migration-guard.test.ts`
- `apps/desktop/renderer/src/features/version-history/VersionHistoryContainer.pattern-states.test.tsx`
- `apps/desktop/renderer/src/features/search/__tests__/search-panel-pattern-states.test.tsx`
- `docs/references/testing/*.md` 主源规范

得到的判断是：

- 仓库里**不是完全没有好测试**；有些页面级状态测试已经比较接近正确方向。
- 但 V1 相关测试里，**className 断言过重、story existence 断言偏多、guard 证明与真实行为证明混在一起** 的问题是存在的。
- 现在最需要的，不是喊一句“测试要行为导向”，而是给出一套 **按 change 类型拆开的 TDD 施工法**。

---

## 2. 先把 V1 重编成五条主线

### 主线 A：底座与可复用契约

这一线负责定义后续 change 的共同语言，不负责消化全部遗留债。

包含：

- `v1-01-design-token-completion`
- `v1-02-primitive-visual-evolution`（缩 scope 后）
- `v1-11-empty-loading-error-states`（瘦身后）
- 从 `v1-12` 拆出的 native element 收口工作

**规则：** 这类 change 负责“立标准、建约束、开复用口”，不应偷偷吸收复杂结构重构。

### 主线 B：核心高曝光体验面

这一线直接回答“用户最能感知到什么变好了”。

包含：

- `v1-03-dashboard-visual-rewrite`
- `v1-04-editor-typography-and-layout`
- `v1-06-ai-panel-overhaul`（缩 scope 并收回 AI overlays 后）
- `v1-07-settings-visual-polish`
- `v1-08-file-tree-precision`
- `v1-09-command-palette-and-search`
- `v1-10-side-panels-visual-coherence`

**规则：** 这类 change 只回答用户体验面的问题，不要混入 lint 清扫、巨石拆分、治理审计等次级叙事。

### 主线 C：结构治理与可维护性

这一线不是“看起来更美”，而是“后面改得更稳”。

包含：

- `v1-05-editor-decomposition`
- 从 `v1-02` 拆出的复杂 primitive 拆分工作
- 从 `v1-12` 拆出的 native-element closure
- `v1-13-eslint-disable-audit`

**规则：** 这类 change 的价值口径应是：降低风险、缩小认知负担、提高并行开发能力，而不是伪装成视觉变更。

### 主线 D：动效与全局收边

这一线负责“让东西不只对，而且顺”。

包含：

- 从 `v1-12` 拆出的 interaction motion polish
- `v1-11` 的状态模式尾部收边
- hover / focus / scroll shadow / duration / easing 的系统性补齐

### 主线 E：用户路径补漏与收口

这一线只处理“原编排没覆盖到、但又确实是高频路径”的表层。

包含：

- 重编后的 `v1-14-dialog-and-entry-pages`
- 目前在 `v1-15` 的 AI overlays，但要折回 AI 主路径所有权
- 当前塞在 `v1-16` 中的残余页面与面板

**规则：** 不允许继续使用 `misc` 作为真实范围名。任何残项必须归回具体用户路径或具体治理主线。

---

## 3. 每个 change 的具体优化策略

### `v1-00-visual-overhaul-program`

**结论：保留，但重写成真正的总控文档。**

**怎么改：**

- 把当前“6 waves / 16 child changes”的平铺叙事改成“5 条主线 + 执行顺序”。
- 明确区分三类东西：
  - 用户可见视觉重写
  - 结构治理支撑项
  - 后补的路径收口项
- 用当前仓库实测数据刷新旧基线，禁止继续引用旧数字充当真相。

**原因：** 当前 umbrella 把性质完全不同的 change 当成同类项排布，导致后续边界越来越虚。

### `v1-01-design-token-completion`

**结论：保留，但要改“完成定义”。**

**保留范围：**

- token 家族补完
- 运行时同步
- `@theme` 桥接
- token guard / ratchet

**新增完成要求：**

- 不是“token 定义完了”就算完成
- 必须补一个约束：后续 change 不能继续无门槛新增 raw typography / spacing debt

**不要新增：**

- 在本 change 里一次性清扫所有旧页面 arbitrary 值

### `v1-02-primitive-visual-evolution`

**结论：必须拆。**

**保留在 `v1-02` 的内容：**

- Button：`pill`、`icon`
- Card：`bento`、`compact`
- Tabs：`underline`
- Badge：`pill`
- 上述新增变体的 Story 与行为验证

**移出 `v1-02` 的内容：**

- Radio 拆分
- Select 拆分
- ImageUpload 拆分

**原因：** 当前 `v1-02` 同时混了“视觉原件升级”和“复杂组件内部手术”。前者是复用契约，后者是结构治理，两者验收逻辑完全不同。

### `v1-03-dashboard-visual-rewrite`

**结论：保留。**

**收紧目标：**

- 首屏体验
- hero / card / 空状态编排
- token 驱动的 shell 布局
- 不吸附 unrelated cleanup

### `v1-04-editor-typography-and-layout`

**结论：保留。**

**收紧目标：**

- 正文宽度
- 标题层级
- 行高与阅读节奏
- serif 支持（若样式层已具备）
- 不夹带结构拆分

### `v1-05-editor-decomposition`

**结论：保留，但改类。**

**怎么重写：**

- 明确这是 editor / AI 后续 change 的降风险前置项
- 成功标准是：职责切分更清晰、文件更可控、行为不回退
- 不把“行数减少”包装成主要产品价值

### `v1-06-ai-panel-overhaul`

**结论：瘦身，并把 AI overlays 收回主路径。**

**保留范围：**

- AI 主面板视觉层级
- tabs 入口感知
- Chat / History 分层
- AI 品牌识别与状态表达

**折回范围：**

- 当前 `v1-15` 中的 AI overlays，只要它们属于同一用户旅程，就回归 AI 主线

### `v1-07-settings-visual-polish`

**结论：保留。**

**验收重点：**

- 选择态是否明确
- 反馈是否清楚
- 是否真正回到 token 体系
- UI 自己是否以身作则，不再靠硬编码演示设计系统

### `v1-08-file-tree-precision`

**结论：保留。**

**验收重点：**

- 行密度
- 拖拽指示精度
- rename / selected / hover 状态清晰度
- 高频路径的体感稳定性

### `v1-09-command-palette-and-search`

**结论：保留，小幅收口。**

**定位：**

- overlay 入口体验精修
- 命令发现效率
- 搜索结果可读性

### `v1-10-side-panels-visual-coherence`

**结论：保留，但口径必须缩。**

**好范围：**

- header 节奏统一
- spacing 语言统一
- hover / action affordance 统一
- panel shell 行为统一
- 能复用的 `EmptyState` / `LoadingState` / `ErrorState` 接入统一

**坏范围：**

- 借“统一”之名，把每个 panel 都完整重写一遍

### `v1-11-empty-loading-error-states`

**结论：必须瘦身。**

**保留目标：**

- 覆盖 80% 常见空态
- 覆盖 80% 常见加载态
- 覆盖 80% 常见错误态
- 建立清晰的例外白名单

**去掉野心：**

- 不追求通吃所有场景的 props 宇宙
- 不强行把混合态和引导态塞进一个万能盒子
- 不把所有差异都定义为“未统一”

### `v1-12-interaction-motion-and-native-cleanup`

**结论：立刻拆。**

**拆成 A：motion polish**

- duration / easing
- hover / focus 动画质量
- scroll shadow
- action icon fade-in
- open / close 手感

**拆成 B：native element closure / primitive compliance**

- 收口可替换的原生 `button/input/select/textarea`
- 建立例外清单
- 直接挂钩 lint ratchet 和 disable 下降目标

### `v1-13-eslint-disable-audit`

**结论：保留，但改到治理主线。**

**重写成功定义：**

- 剩余 disable 都有充分技术理由
- “为了过 CI 的 cargo-cult disable” 全部清掉
- 建立 ratchet，数量只能下降不能回涨

### `v1-14-dialog-and-entry-pages`

**结论：重编，不再保留“漏项打包”的原状。**

**按用户路径重归位：**

- `CreateProjectDialog` / `CreateTemplateDialog` → Dashboard / entry path
- `ExportDialog` → Editor terminal workflow
- `OnboardingPage` → first-run / entry experience
- `SettingsGeneral` → Settings ownership

### `v1-15-ai-overlay-components`

**结论：并回 AI 主路径。**

**处理方式：**

- 保留工作内容
- 取消与 `v1-06` 的假分离
- 把 modal / inline confirm / AI error 展示都归回 AI 端到端体验

### `v1-16-quality-rightpanel-and-misc`

**结论：拆散，禁止继续以 `misc` 存活。**

**重新归位：**

- right-panel quality / info → 右面板主线
- diff surfaces → version history / compare journey
- analytics → dashboard / reporting
- zen mode → editor experience
- shortcuts / settings fragments → settings ownership

---

## 4. 重写 V1 验收哲学：从“文件存在”改成“用户风险被挡住”

当前不少 V1 草案，过度依赖这些低价值证明：

- story 导出了
- token 名字出现了
- className 里包含了某段字符串
- grep 出来了一个数

这些东西不是完全没用，但只能作为 **Guard Proof**，不能继续当主证据。

### 新规则：每个 V1 change 必须分三层证据

#### 第一层：Primary Proof（主证据，必须真）

回答的是：

> 用户真的会感知到这个 change 带来的正确结果吗？

例如：

- tab 切换后 active affordance 和内容层级真的变了
- 空 panel 真的出现了预期空态和 CTA
- Dashboard hero/card shell 真的形成了预期空间层级
- FileTree rename/selection/drag 时状态没有互相打架

#### 第二层：Guard Proof（守门证据，廉价但次级）

用于防回退，不用于单独宣称成功。

例如：

- token sync 测试
- 旧 import 被禁止
- story completeness check
- arbitrary 值 / disable / native element 的 ratchet 计数

#### 第三层：Visual Proof（视觉证据）

因为 V1 本质上是视觉计划，这层不能缺。

例如：

- Storybook reviewable states
- before/after 截图
- 高曝光页面的设计对照说明

**硬规则：** 任何 change 都不能只靠第二层证据宣布完成。

---

## 5. TDD 与测试策略深度指南：如何写到“多而真”

这一节是本次增强的重点。

### 5.1 “多而真”到底是什么意思

“多而真”不是“测试数量越多越好”，而是：

- **多**：核心链路、关键状态、主要错误、主要边界、必要 guard、必要视觉证据都覆盖到
- **真**：每个测试都能明确回答“它在挡什么回归”，而不是只证明“文件里有东西”

换句话说：

- **多** 解决“漏测”
- **真** 解决“假测”

两者缺一不可。

### 5.2 当前仓库里已有的测试问题，具体出在哪

#### 问题 1：className 断言过重

当前命中量：**395**。

这不代表 395 个都错，但说明一个倾向：

> 很多测试在验证“样式字符串长什么样”，而不是“用户到底看到/经历了什么”。

典型样本：

- `apps/desktop/renderer/src/components/primitives/Button.v1-02-behavior.test.tsx`

这个文件里有不少测试是类似：

- `className` 包含 `rounded-[var(--radius-full)]`
- `className` 包含某个 hover 背景
- `className` 不包含某个 radius

**问题不在于这些断言完全不能写，**而在于它们当前占比过高，容易把“样式 contract”冒充成“行为证明”。

#### 问题 2：story existence / completeness 证明偏多

当前命中量：**73**。

这类测试能证明：

- story 被导出了
- Storybook 有可看状态

但不能证明：

- 真实页面真的用上了这些能力
- 用户关键路径真的被守住了
- 组件状态切换真的正确

所以它们适合做 **Guard Proof**，不适合作为主证据。

#### 问题 3：Guard 测试与行为测试边界不够清楚

样本：

- `apps/desktop/renderer/src/features/__tests__/state-pattern-migration-guard.test.ts`

这个文件本身**不是坏测试**，反而是一个**合格的 Guard**：

- 它在防旧 imports 回流
- 它有 exclusions 清单
- 它能给出失败文件和行号

但它的角色只能是：

- **证明迁移没有回滚**

它不能替代：

- “实际页面在空/加载/错误状态下真的展示了正确 UI”

#### 问题 4：一些页面级状态测试方向是对的，但仍略偏文本耦合

样本：

- `apps/desktop/renderer/src/features/version-history/VersionHistoryContainer.pattern-states.test.tsx`
- `apps/desktop/renderer/src/features/search/__tests__/search-panel-pattern-states.test.tsx`

这类测试比 className 测试强很多，因为它们验证的是：

- 在不同 store / IPC 状态下
- 页面到底渲染了什么状态组件

这已经接近“真测试”。

但还有两个需要加强的点：

1. 部分断言仍过度依赖具体英文文案
2. 还需要补关键交互和异常分支，而不只是状态存在

#### 问题 5：TDD 的 Red / Green / Refactor 没被写成可执行动作

目前很多 V1 讨论都在喊 TDD，但没有明确区分：

- 什么叫真正的 Red
- 哪些 change 可以接受静态 Red（例如 Guard）
- 哪些 change 必须以页面行为 Red 为准

这会导致执行时很容易退化成：

- 先写实现
- 再补几个字符串断言
- 然后说“已经有测试了”

这不是 TDD，只是补票。

---

## 6. V1 change 类型 × 测试类型：该怎么配

### 6.1 Foundation 类（v1-01 / 收缩后的 v1-02 / 瘦身后的 v1-11）

**主证据：**

- 至少一个真实消费者测试，证明下游组件/页面能用到这个标准，而不是标准只写在文件里

**守门证据：**

- token sync
- 旧 import 禁止
- ratchet 计数
- story completeness

**视觉证据：**

- Storybook state
- 必要时视觉回归

**禁止退化成：**

- 全靠 grep
- 全靠 token 字符串存在

### 6.2 Page Rewrite 类（v1-03 / 04 / 06 / 07 / 08 / 09 / 10）

**主证据：**

- 页面或面板级交互测试
- 验证核心链路 + 空态 + 错误态 + 一条关键边界

**守门证据：**

- 禁止旧实现回流
- 关键设计系统约束 ratchet

**视觉证据：**

- Storybook 或截图对照
- 高曝光页面建议保留 before/after artefact

**禁止退化成：**

- 只测某个 class
- 只测某个 story 存在

### 6.3 Structural Governance 类（v1-05 / v1-13 / 从 v1-12 和 v1-02 拆出的治理项）

**主证据：**

- 行为等价测试
- PASS/FAIL fixture
- 不回退的 contract test

**守门证据：**

- lint / ratchet / discovery consistency / contract parity

**视觉证据：**

- 一般不是主角；除非它直接影响可见交互

**禁止退化成：**

- 只看行数下降
- 只看文件数变化

### 6.4 Motion / Polish 类（从 v1-12 拆出的 motion work）

**主证据：**

- 能从用户感知层面验证的状态切换
- 可测试的 DOM / aria / interaction class 切换

**守门证据：**

- 动效 token 与 duration/easing 接线检查

**视觉证据：**

- Playwright visual regression 或 Storybook 对照优先

**禁止退化成：**

- 纯 jsdom 里模拟所有视觉效果，自欺欺人

---

## 7. 真正可执行的 TDD 写法：按 change 类型给操作模板

### 7.1 Primitive 新变体（以 `v1-02` 为例）

#### 错误写法

先把 Button 改完，再补：

- `className` 包含某个 rounded
- story 名字叫 `Pill`

这只能证明“写过一点代码”，不能证明：

- 默认行为没坏
- 新能力能被真实消费者安全复用
- disabled/loading/keyboard/long text 没翻车

#### 正确 TDD 顺序

**Red 1：写主行为测试**
先写组件层测试，证明一个用户会在意的契约还不存在，例如：

- `pill` 按钮仍然是 button 语义
- `loading` 时不可点击
- `icon` size 不会把 accessible name 弄丢

**Red 2：写消费者层测试**
在一个真实消费场景里写失败测试，例如：

- Dashboard 里的 stat card 能用 `Card variant="compact"` 承接数字 + 标签布局
- AI panel 的 tabs 能用 underline 变体表达 active context

**Green：最小实现**
只实现这两个测试必需的部分，不顺手加别的变体矩阵。

**Refactor：收 style contract**
在必要的 1~2 个位置保留 class contract 测试，例如：

- `size="icon"` 必须是正方形约束
- `variant="pill"` 必须走 full radius

但这类断言必须标明：

> 这是 style contract，不是主要行为证明。

### 7.2 状态标准件迁移（以 `v1-11` / `v1-10` 为例）

#### 错误写法

- 测 `EmptyState.tsx` 本身存在
- 测旧 import 被删掉了
- 宣称“迁移已完成”

#### 正确 TDD 顺序

**Red 1：先写消费者页面测试**
例如对 `VersionHistoryContainer` 或 `SearchPanel`：

- 没有数据时显示空态
- 加载中时显示 loading
- 请求失败时显示 error

**Red 2：再写 guard**

- 禁止 `composites/EmptyState` 回流
- exclusions 必须存在真实理由

**Green：最小迁移**
把真实页面迁过去，先让消费者测试变绿。

**Refactor：提炼共享 pattern**
如果 pattern props 变复杂，先问：

- 这是 80% 共性，还是某个页面的特例？

若是特例，不要污染标准件接口。

### 7.3 Token / Foundation（以 `v1-01` 为例）

#### 错误写法

- 测 token 文件里出现某几个变量名
- `main.css` 里 grep 到映射名
- 宣称 token 完成

#### 正确 TDD 顺序

**Red 1：consumer-level failure**
先找一个真实消费者需要这个 token 的场景，写失败测试或视觉验证点：

- 新 typography utility 在消费者上真正可用
- 旧 debt 不再允许无门槛新增

**Red 2：guard-level failure**
再写：

- design token 与 runtime token 的同步 guard
- `@theme` 桥接 guard
- ratchet：指定类型的 arbitrary 值不能上升

**Green：最小定义 + 最小桥接**
只把当前消费者所需 token 与桥接补齐，不顺手扩一大套无主之物。

**Refactor：注释与命名整理**
这一步可以整理 token 语义、命名、说明，但不能借机膨胀 scope。

### 7.4 Page Rewrite（以 Dashboard / Editor / FileTree 为例）

#### 正确 TDD 顺序

**Red 1：关键链路**

- Dashboard：首屏空态 / hero / project card hierarchy
- Editor：标题 / 正文宽度 / 空文档或加载文档状态
- FileTree：rename / selection / drag affordance

**Red 2：关键错误或空态**
至少补一条：

- 空数据
- 加载中
- 错误

**Red 3：关键边界**
至少补一条：

- 超长文本
- CJK 文案
- keyboard navigation
- stale async result
- disabled or permission edge

**Green：只让当前行为成立**
不要在 page rewrite 里顺手做结构治理。

**Refactor：提炼可复用部分**
如果在 Refactor 阶段发现共性，提回 foundation / pattern 主线，而不是继续让页面自己背着走。

---

## 8. 当前已有测试，应该怎么改写

### 8.1 `Button.v1-02-behavior.test.tsx` 应怎么处理

这个文件现在的问题不是“全错”，而是**主次颠倒**。

**建议重写方式：**

#### 保留为主行为测试的内容

- `loading` 时 disabled 且不可触发点击
- `disabled` 时点击无效
- `icon` 不破坏 button 语义
- 默认 variants / sizes 不回归
- ref 透传、role、accessible name 等基础契约

#### 降级为 style contract 的内容

- `rounded-[var(--radius-full)]`
- 某个 hover class 是否存在
- 某个 radius class 是否不存在
- 某个 token class 是否出现

这些可以留，但必须：

- 数量减少
- 标注为 contract
- 不再冒充主证明

#### 新增的消费者证明

必须补一个真实消费者测试，例如：

- Dashboard 中 pill badge / compact card 真的承担了场景职责
- AI panel 中 underline tabs 真正承担 active context 表达

这样，测试组合才会从“组件自证”变成“组件 + 消费者闭环”。

### 8.2 `state-pattern-migration-guard.test.ts` 应怎么定位

这个文件应明确标注：

> 它是 **Guard Proof**，不是 Primary Proof。

**保留理由：**

- 它能防旧 imports 回流
- exclusions 有明确说明
- 失败信息可定位

**必须搭配：**

- `VersionHistoryContainer.pattern-states.test.tsx` 这类真实消费者测试
- `SearchPanel.pattern-states.test.tsx` 这类状态渲染测试

### 8.3 `VersionHistoryContainer.pattern-states.test.tsx` / `SearchPanel.pattern-states.test.tsx` 应怎么加强

这两类测试已经比较接近正确方向。下一步应增强的是：

1. **减少纯文本耦合**
   - 优先 role / action / semantic anchor
   - 必要时保留关键业务句，而不是所有文案都绑死

2. **补真实交互**
   - 例如 error state 的 retry action 是否可触发
   - empty state CTA 是否真的存在且能工作

3. **补一条边界路**
   - 例如 stale loading / partial data / permission edge

---

## 9. 边界问题怎么覆盖：给 V1 一套统一边界矩阵

“多而真”最容易失手的地方，就是只记得 happy path，不记得边界。

### 9.1 所有 V1 页面/面板至少检查的五个维度

#### 维度 A：状态维度

- idle / ready
- empty
- loading
- error

#### 维度 B：数据维度

- 正常数据
- 空数据
- 超长文本
- CJK / 多语言
- 缺字段 / partial data

#### 维度 C：交互维度

- mouse click
- keyboard
- disabled / readonly
- retry / cancel / dismiss

#### 维度 D：异步维度

- 慢加载
- 失败后恢复
- stale result 不得覆盖新结果
- cleanup / unmount 后不再误更新

#### 维度 E：视觉/布局维度

- overflow
- 滚动提示
- active / hover / selected 区分
- 长内容是否挤坏布局

### 9.2 不是每个 change 都要全量覆盖，但必须显式选轴

每个 V1 change 在测试设计时，必须明确：

- 我的核心链路是哪 1~2 条？
- 我的关键状态是哪 2~3 个？
- 我的主要边界是哪 1~2 个？

不要隐含决定，要写出来。

### 9.3 一个可执行的最小覆盖模板

对于一个普通 V1 page rewrite，最低测试组合应是：

1. **1 条核心链路测试**
2. **1 条空/加载/错误中的关键状态测试**
3. **1 条关键边界测试**
4. **1 条 guard（如果真的需要 guard）**
5. **1 组 Storybook / 视觉证据**

这才叫“多而真”的最低配。

---

## 10. 哪些断言还能写，哪些必须慎写

### 10.1 可以写，但要有明确身份

#### className / token contract 断言

可以写，但仅限：

- 该 class 本身就是对外样式 contract
- 无法通过更高层用户行为稳定表达

例如：

- `size="icon"` 是正方形约束
- `variant="pill"` 是 full radius contract

#### story completeness

可以写，但只能作为：

- 展示面 completeness 的守门

不能作为：

- 行为成功的主证明

#### grep / 静态扫描

可以写，但只适用于：

- 跨文件约束
- ratchet 计数
- import 回流防护
- token sync

### 10.2 必须慎写甚至禁止的情形

#### 禁止：把文本存在当成全部行为

例如：

- 页面上有一句 “Loading...” 就算 loading 做完了

#### 禁止：为 className 而 className

例如：

- 改个实现方式，行为没变，测试全炸

#### 禁止：只测 Story 导出名

例如：

- `Underline` Story 导出了，就当 underline variant 已经可用

#### 禁止：只做组件自证，不做消费者证明

例如：

- Button 自己说自己可以 `pill`
- 但没有一个真实页面证明它在业务场景里真能承接职责

---

## 11. 评审清单：怎么判断一个 V1 测试写得是否到位

评审人要逐条问：

1. 这条测试在挡哪种真实回归？
2. 它属于 Primary、Guard、还是 Visual Proof？身份写清了吗？
3. 如果删掉它，会失去哪一块用户价值护栏？
4. 它是在测行为，还是在测文件外形？
5. 若是 Guard，ESLint 真做不到吗？
6. 若是页面改造，空态 / 错误态 / 一条关键边界至少有一条了吗？
7. 若是组件改造，有消费者层验证吗？
8. 若是结构治理，只看行数了吗，还是验证了行为等价？

只要其中两三条答不上来，这组测试多半还不够真。

---

## 12. 下一轮文档改造：只动 docs，不动 changes 内容本体

> 按本轮要求，先不改 `openspec/changes/*` 内容，只把优化策略、测试方法、执行顺序写清楚。

### Task 1：保留本策略文档为执行总图

**File:**

- `docs/plans/2026-03-20-v1-change-optimization-strategy.md`

**要求：**

- 作为后续所有 V1 文档整改、测试整改、实现排序的总指导
- 不在本轮直接修改 OpenSpec change 文档

### Task 2：单独补一份 V1 测试执行指南（下一轮可建）

**建议新文件：**

- `docs/plans/2026-03-20-v1-testing-playbook.md`

**内容应包括：**

- V1 change 类型 × 测试层级映射
- 真实样本重写示例
- guard / consumer / visual 三层配比模板
- Red / Green / Refactor 操作模板

### Task 3：后续再进 OpenSpec 文档本体

在下一轮真正修改 `openspec/changes/*` 前，先以本策略为唯一判尺：

- 是否混 scope
- 是否用假测试充主证据
- 是否把治理项伪装成视觉项
- 是否存在 `misc` / 补漏打包桶

---

## 13. 这份优化策略本身的验收标准

只有同时满足以下条件，这份策略才算真正被采纳：

1. 它能解释清楚 V1 为什么需要重编，而不是只给一个主观看法。
2. 它明确指出当前测试问题发生在哪里，并给出证据与样本。
3. 它把 V1 的测试写法拆成了按 change 类型可执行的 TDD 方案。
4. 它明确了 Primary / Guard / Visual Proof 的边界。
5. 它把“多而真”的含义落到核心链路、关键状态、关键边界、必要 guard 和视觉证据上。
6. 它没有在本轮越界修改 `openspec/changes/*`。

---

## 14. 默认决策与非目标

### 默认决策

- 编号尽量不动；先在策略层把地图画准
- 优先“缩 scope + 改类”，不优先“无上限增 change 数量”
- 当前仓库实测数据优先于历史 proposal 中的旧数字
- 合理特例允许保留，但必须写入白名单而不是口头默认
- 测试追求“多而真”，不是“少而精”也不是“多而空”

### 非目标

- 本文档不在这一轮直接重写所有 OpenSpec 文件
- 本文档不执行代码改造
- 本文档不因为仓库里“已经有一些实现”就提前宣布 V1 某块已完成
- 本文档不为减少文档改动量而接受一张错误地图

---

## 15. 附录 A：可直接套用的测试模板

这一节不是规范口号，而是给执行者“开工即用”的模板。

### 15.1 Primitive 新变体：主行为 + 消费者 + contract

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./Button";

describe("Button pill", () => {
  it("loading 时不可点击，并保留 button 语义", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <Button variant="pill" loading onClick={onClick}>
        Submit
      </Button>,
    );

    const button = screen.getByRole("button", { name: /submit/i });
    expect(button).toBeDisabled();
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("作为 style contract，pill 保持 full radius", () => {
    render(<Button variant="pill">Submit</Button>);
    expect(screen.getByRole("button")).toHaveClass(
      "rounded-[var(--radius-full)]",
    );
  });
});
```

**配套的消费者测试必须再补一条：**

```tsx
it("Dashboard stat card 可使用 compact card 承接数字+标签布局", () => {
  render(<DashboardStatCard value="128k" label="Words" />);
  expect(screen.getByText("128k")).toBeInTheDocument();
  expect(screen.getByText("Words")).toBeInTheDocument();
  // 这里优先断言用户看到的结构，不优先断言 className
});
```

### 15.2 页面状态迁移：先测消费者，再写 guard

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SearchPanel } from "../SearchPanel";

describe("SearchPanel states", () => {
  it("索引重建时显示 loading state", () => {
    render(<SearchPanel projectId="p1" open={true} />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("无结果时显示 empty state", () => {
    render(<SearchPanel projectId="p1" open={true} />);
    expect(screen.getByTestId("search-empty-state")).toBeInTheDocument();
  });

  it("失败时提供 retry action", () => {
    render(<SearchPanel projectId="p1" open={true} />);
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });
});
```

**guard 只负责防回流：**

```ts
describe("state pattern guard", () => {
  it("features 下不允许重新引入 composites/EmptyState", () => {
    // 静态扫描 + 定位失败文件/行号
  });
});
```

### 15.3 Guard / ratchet：必须 PASS + FAIL fixture 成对出现

```ts
import { describe, expect, it } from "vitest";
import { scanViolations } from "../scanner";

describe("native element guard", () => {
  it("PASS: 使用 Primitive Button 不报错", () => {
    const source = `import { Button } from '@/components/primitives';\nexport function A(){ return <Button>OK</Button>; }`;
    expect(scanViolations(source)).toEqual([]);
  });

  it("FAIL: 重新引入原生 button 报错", () => {
    const source = `export function A(){ return <button>OK</button>; }`;
    expect(scanViolations(source)).toContainEqual(
      expect.objectContaining({ rule: "no-native-html-element" }),
    );
  });
});
```

### 15.4 异步/竞态：必须证明旧结果不会覆盖新结果

```tsx
it("后返回的旧请求不能覆盖新查询结果", async () => {
  const slow = deferred<Result>();
  const fast = deferred<Result>();

  mockSearch("old", slow.promise);
  mockSearch("new", fast.promise);

  triggerSearch("old");
  triggerSearch("new");

  fast.resolve({ items: ["new-result"] });
  await screen.findByText("new-result");

  slow.resolve({ items: ["old-result"] });
  expect(screen.queryByText("old-result")).toBeNull();
});
```

### 15.5 边界模板：长文本 / CJK / 空字段

```tsx
it("超长标题不会挤坏 card 结构", () => {
  render(<ProjectCard title={"超长标题".repeat(20)} description="desc" />);
  expect(screen.getByRole("article")).toBeInTheDocument();
});

it("CJK 文案场景下仍能完成关键交互", async () => {
  const user = userEvent.setup();
  render(<SearchPanel projectId="p1" open={true} />);
  await user.type(screen.getByRole("searchbox"), "角色关系");
  expect(screen.getByRole("searchbox")).toHaveValue("角色关系");
});

it("缺字段数据时进入 graceful error/empty，而不是崩溃", () => {
  render(<VersionHistoryContainer projectId="p1" />);
  expect(screen.getByRole("status")).toBeInTheDocument();
});
```

---

## 16. 附录 B：按 change 类型的本地验证命令

### 16.1 Foundation / Primitive / Pattern 变更

```bash
pnpm -C apps/desktop test:run
pnpm -C apps/desktop storybook:build
pnpm lint
pnpm typecheck
```

### 16.2 Page Rewrite / Panel Rewrite

```bash
pnpm -C apps/desktop test:run
pnpm -C apps/desktop storybook:build
pnpm test:visual
pnpm lint
pnpm typecheck
```

### 16.3 Guard / Governance / Ratchet

```bash
pnpm test:unit
pnpm test:integration
pnpm test:discovery:consistency
pnpm lint
pnpm typecheck
pytest -q scripts/tests
```

### 16.4 通过门槛（最小）

一个 V1 相关变更至少要同时满足：

1. 主行为测试通过
2. 相关 guard 没回退
3. Storybook 可构建
4. lint / typecheck 通过
5. 若改动高曝光 UI，则有视觉证据（`test:visual` 或截图对照）
