# Agent 控制面重构与案发链路复盘


> “善治者，先定法度，而后责成于人。”
>
> 本文不是追究某个 Agent “为什么不听话”，而是回答三个更本质的问题：
> 1. 为什么 CN 仓库会在“规范齐全、测试全绿、流程完整”的表象下，持续长出 AI 常犯错误；
> 2. 这些问题中，哪些已经被 Amp 报告命中，哪些属于后续审计补出的增量证据；
> 3. 如何把“写在文档里的规矩”，重写成 Agent 无法绕过的控制面与硬闸门。

---

## 一、本文回答什么

本文把两件事合成一份执行文件：

1. **Agent 约束系统重构清单**：把规矩从“文档要求”编译成“仓库门禁、接口包装、审计证据与 fail-closed 规则”。
2. **案发链路图与还原现场**：根据现有代码、Amp 报告、治理脚本与仓库规范，逆推此前开发过程中的真实工作流，解释问题为何会系统性复现。

一句话总纲：

> **CN 的主要矛盾，不是 Agent 不努力，而是控制面没有把“正确做法”变成唯一可走的路。**

---

## 二、先判案：这些问题，Amp 早就报过了吗？

### 2.1 结论

**大部分根因，Amp 已经看到了。**

**大部分细颗粒度现场证据，是本轮补齐的。**

**少数治理漂移，是 Amp 之后继续长出来的新问题。**

换言之：

- Amp 更像 **病理报告**；
- 本轮仓库审计更像 **尸检报告**；
- 两者并不冲突，而是上下游关系。

### 2.2 映射表：Amp 已命中的问题族

| 问题族 | Amp 是否已覆盖 | 证据文件 | 本轮补充了什么 |
|---|---|---|---|
| i18n 裸字符串成片存在 | 是 | `07-ui-ux-design-audit.md`、`11-frontend-static-code-audit.md`、`amp-cn-frontend-issues-and-i18n-problems-analysis.md` | 补到文件级、行级与当前快照现场 |
| Feature 层绕过 Primitive 组件 | 是 | `11-frontend-static-code-audit.md`、`amp-cn-frontend-issues-and-i18n-problems-analysis.md` | 补到具体模块与原生控件分布 |
| Token / shadow / hex 值逃逸 | 是 | `07-ui-ux-design-audit.md`、`11-frontend-static-code-audit.md`、`amp-cn-frontend-issues-and-i18n-problems-analysis.md` | 补到当前 story / settings / diff 等文件现场 |
| 版本历史模块不完整 | 是 | `07-ui-ux-design-audit.md`、`05-implementation-backlog.md` | 补到 spec 对照、TODO 未兑现、当前 UI 文案现场 |
| Agent 只看测试，不看 UI / Storybook | 是 | `amp-cn-frontend-issues-and-i18n-problems-analysis.md` | 补成控制面设计问题 |
| 测试数量多但浅，guard 测试膨胀 | 是 | `03-engineering-and-architecture-roadmap.md` | 补到当前 `readFileSync + regex` 的具体样本 |
| IPC 运行时校验未全覆盖 | 是 | `08-backend-module-health-audit.md`、`03-engineering-and-architecture-roadmap.md` | 补到当前 handler 级别的证据与 schema-first 设计方向 |

### 2.3 本轮新增或显著补强的治理漂移

| 问题 | 是否属于增量 | 说明 |
|---|---|---|
| `docs/delivery-skill.md` 的审计命令漏掉 `scripts/tests/*.test.ts` | 是 | 文档要求跑 `pytest -q scripts/tests`，但真实 TS 脚本测试走 `pnpm test:integration` |
| `ipc-testability-mapping-gate.ts` 是 fail-open | 是 | 缺文件直接 `ok: true`，制造假绿灯 |
| `toolchain.md` 的 required checks 说法与主源不一致 | 是 | 文档间口径打架 |

### 2.4 所以该如何看 Amp

**不要把 Amp 当“过期报告”，也不要把它当“已经做完的 backlog”。**

应该把它视为三层资产：

1. **分类学**：它已经把问题按产品、前端、后端、错误体验、架构债分类好了；
2. **病因学**：它已指出“流程重于产品、文本反馈替代视觉反馈、测试浅而多”等根因；
3. **方向盘**：它给了 backlog 和路线图，但还没全部变成可执行硬闸门。

因此，后续工作不该再重写一份新的“大诊断”，而应做三件事：

- 用 Amp 作为问题 taxonomy；
- 用当前仓库快照补 file-level proof；
- 把 Amp 的建议翻译成 **fail-closed control plane**。

---

## 三、还原案发现场：此前开发过程大概率是怎么运转的

下面不是文学想象，而是根据代码、规范、Amp 审计和仓库结构做出的**高置信逆推**。

### 3.1 第一现场：任务被切得过细，Agent 只看到自己的 3 个文件

Amp 已经指出：

- 一个很小的改动，会走一条很长的流程链；
- i18n 这类全局任务，被拆成多个局部 change；
- 每个 Agent 只看见自己负责的小范围文件，而不是整个用户场景。

于是实际现场大概率是：

1. 任务被拆为 Issue / change / 子任务；
2. 每个 Agent 只被要求完成局部 scope；
3. “我的文件绿了”被等同于“这个问题好了”；
4. 没有人对模块级全貌负责。

**结果**：

- 局部 PR 看上去都合理；
- 全局体验却仍是残片；
- i18n、token、story、a11y 这种跨模块约束永远完成不到 100%。

### 3.2 第二现场：Agent 优化的是“别违规”，不是“把产品做对”

`AGENTS.md`、OpenSpec、delivery 规则把很多事情定义成“违反即失败”：

- 不走 spec-first
- 不走 test-first
- CI 不绿
- GitHub 交付流程不规范

但没有同等强度的规则说：

- **UI 不对、语言没收口、Story 缺失、交互只做了一半 = 失败**

于是理性 Agent 的最优策略就变成：

1. 先满足流程要求；
2. 再满足 lint / typecheck / tests；
3. 最后才轮到视觉、语义、体验；
4. 如果体验问题不会阻断合并，那它就自然被推迟。

**这不是道德失败，而是目标函数设计失误。**

### 3.3 第三现场：开发过程里几乎没有“看见真实产品”这一步

Amp 已点出：Agent 常见路径是“跑 vitest，不跑 dev，不看 Storybook，不对比视觉效果”。

结合当前仓库现状，可以合理还原出一条典型链路：

1. Agent 改 JSX / TS / service；
2. 运行测试；
3. 看见 CI 绿；
4. 不跑 `pnpm dev`；
5. 不切换 `zh-CN/en`；
6. 不验证 `dark/light`；
7. 不看 Storybook 中同类 surface；
8. 提交 PR。

于是就会出现今天这些“看起来做了，其实没真正做完”的问题：

- 半翻译；
- primitive 被绕开；
- token 逃逸；
- tooltip 被当作 a11y；
- placeholder 逻辑被当作最终逻辑。

### 3.4 第四现场：后端服务采用“顺手补一条”的追加式生长

主进程 service 层的大文件与 SQL 直写，不像一次性设计，而像长期追加：

1. 先写 service；
2. 某个需求来了，顺手补一条 SQL；
3. 下一个需求再补一条；
4. 再遇到一个边缘场景，再补几条；
5. 最终 service 同时扮演 orchestration、DAO、业务规则、错误映射四种角色。

**根因不是不会分层，而是没有硬门禁止 service 长成“百宝箱”。**

### 3.5 第五现场：治理系统察觉问题后，先补“文书”和“脚本”，但没全部补成硬闸门

这一步尤其关键。仓库已经出现大量：

- audit 文档
- reform plan
- backlog
- guard test
- mapping gate

这说明团队并非毫无自觉，而是**已经开始自救**。

但问题在于，很多自救措施仍停留在：

- 文档层；
- 建议层；
- 局部 guard 层；
- 允许 skipped / fallback 的脚本层。

于是局面就变成：

> **大家都知道哪里会出事，但系统仍允许它继续出事。**

---

## 四、案发链路图：问题是如何从任务入口一路传染到主分支的

下面这张图，是我建议之后持续复用的“仓库病理总图”。

```text
用户需求 / Owner 任务
    ↓
任务被拆得过细（按文件 / 按局部 change）
    ↓
Agent 只看到局部 scope，不对整个用户场景负责
    ↓
Agent 优化目标 = 流程合规 + 测试通过 + CI 变绿
    ↓
不跑 pnpm dev / 不看 Storybook / 不做双语言双主题视觉验收
    ↓
局部 guard 测试通过，但全局体验仍残缺
    ↓
审计主要检查“流程是否完整”，而不是“产品是否真正确”
    ↓
PR 合并
    ↓
残余问题进入 main
    ↓
后续 Agent 在残余基础上继续追加，形成同类问题再生产
```

### 4.1 这条链上每一环的典型症状

| 链路环节 | 典型症状 |
|---|---|
| 任务拆分 | i18n、token、story 这类全局任务被切碎 |
| Agent 局部视野 | 只修自己被点名的 3 个文件 |
| 优化错误目标 | “不违规”优先于“用户体验正确” |
| 缺视觉反馈 | 不跑 dev、不看 Storybook、不看截图 |
| 测试错位 | guard 检查局部字面量，不测完整行为 |
| 审计错位 | 看流程证据，不看最终 surface |
| 合并后再生产 | 新代码继续复制旧模式 |

### 4.2 如果继续这样下去，会发生什么

1. **问题不会线性减少，而会以新形式复现**；
2. 你修完一批 i18n，native control / a11y / story 缺口还会再长；
3. 你修完 service SQL，下一位 Agent 仍会在另一个 service 顺手写 `.prepare(`；
4. 最终仓库会陷入“修不完，但每轮都能交付一些文书正确的 PR”的循环。

这正是要重写控制面的原因。

---

## 五、Agent 约束系统重构清单：不要再靠“自觉”，而要靠“门”

### 5.1 总原则

> **规则要尽量从“文字约束”迁移为“机器可执行约束”。更严格地说：凡当前已经被证明会高频复发、且在仓库中大量出现的问题，必须有对应门禁；未门禁化，不得宣称该问题已治理完成。**

换成工程语言就是：

- 能 lint 的，不写成长文；
- 能 codegen 的，不手写双端同步；
- 能 fail-closed 的，不允许 skipped；
- 能 wrapper 的，不允许裸 API；
- 能 snapshot / screenshot 的，不允许只交文本通过证据。

---

### 5.2 L0：任务入口控制（Task Intake Control Plane）

#### 必须改掉的旧方式

- 按文件切任务；
- 按局部 change 切任务；
- 让多个 Agent 分别修同一用户场景的不同碎片；
- Definition of Done 只写“测试通过 / PR 合并”。

#### 新的入口规则

每个任务在进入实现前，必须先确定以下 6 项：

1. **用户场景名**：一句用户语言描述，而不是技术片段。
2. **唯一 owner**：一个 Agent 对整个场景最终完整度负责。
3. **验收 surface**：受影响的 UI 面、主进程边界、测试入口。
4. **Definition of Done**：必须同时包含行为、视觉、错误路径、文档一致性。
5. **禁区声明**：哪些文件不得顺手扩写，哪些文件是串行关键文件。
6. **验证命令**：写清“哪几条命令 + 哪几张图”才算完成。

#### 强制模板

```markdown
Task Name: 用户可以在中英文切换后，完整使用版本历史面板

Owner: 1 个 Agent
Scope:
- VersionHistoryContainer
- VersionHistoryPanel
- i18n locales
- related Storybook surface

DoD:
- 所有可见文案走 t()
- wordChange 正确显示
- zh-CN / en 截图齐全
- dark / light 截图齐全
- storybook:build 通过
- 相关 lint / test 通过
```

---

### 5.3 L1：接口包装控制（Wrapper-First APIs）

这层的目标很简单：**不要允许 Agent 直接碰危险原语。**

#### A. IPC

**禁止**：
- 裸 `ipcMain.handle(...)`
- 裸手搓 payload `typeof` 校验当作标准做法

**必须**：
- 统一走 `schema-first` 包装
- `schema -> runtime validator -> TS type` 一体化

**强制落地方向**：

```ts
validatedIpc.handle({
  channel: "project:create",
  request: ProjectCreateRequestSchema,
  response: ProjectCreateResponseSchema,
  handler: async (input) => { ... }
});
```

**控制面要求**：
- 新增通道不允许直接接入 `ipcMain.handle`
- Push 通道也必须入 schema
- handler 与 preload bridge 不再各自维护“半份契约”

#### B. 数据库

**禁止**：
- `services/**` 内出现 `.prepare(`

**必须**：
- SQL 只能存在于 `dao/` 或 `repositories/`
- service 层只编排业务，不直接持有 SQL 文本

**控制面要求**：
- 若必须访问 DB，先建 DAO 层再写 service 调用
- PR 中出现 service 新增 `.prepare(`，直接阻断

#### C. 前端控件

**禁止**：
- `features/**` 使用原生 `<button>/<input>/<select>/<textarea>`

**必须**：
- `<Button>` / `<Input>` / `<Select>` / `<Textarea>` / `<Radio>` 等 primitive

#### D. 文案

**禁止**：
- 用户可见字符串裸写在 `features/**`
- tooltip / placeholder / title / empty state / loading text 裸写

**必须**：
- 统一走 `t()`
- 错误码先映射为人话，再交给 i18n

---

### 5.4 L2：静态门禁（Lint / AST Gates）

下表不是“可选优化”，而是**当前高频复发问题必须落地的第一批铁门**。只要这些门还没建好，就不得宣称对应问题已经被治理；仓库也仍会继续靠人工碰运气发现问题。

| Gate ID | 规则 | 作用域 | 触发即失败 |
|---|---|---|---|
| G-FE-01 | `no-literal-string` | `renderer/src/features/**` | 任意用户可见裸字符串 |
| G-FE-02 | `no-native-controls-in-features` | `renderer/src/features/**` | 原生 button/input/select/textarea |
| G-FE-03 | `icon-button-requires-aria-label` | `renderer/src/**` | 纯图标按钮无 accessible name |
| G-FE-04 | `no-raw-tailwind-token-escape` | `renderer/src/**` | raw color / `shadow-lg` / `shadow-2xl` |
| G-FE-05 | `required-story-for-surface` | spec 指定 surface + reusable components | 缺 story |
| G-BE-01 | `no-direct-sql-in-services` | `main/src/services/**` | `.prepare(` |
| G-BE-02 | `no-bare-ipc-handler` | `main/src/ipc/**` | 裸 `ipcMain.handle(` |
| G-BE-03 | `file-size-threshold` | touched production files | 新增/修改文件超阈值 |
| G-GOV-01 | `skipped-gate-is-failure` | `scripts/**` / CI | gate 输出 skipped |
| G-GOV-02 | `policy-doc-vs-script-drift` | docs + scripts + workflows | 主源口径不一致 |

#### 设计原则

1. **门禁对应问题族，而不是对应一时情绪**：凡已被证实高频复发的问题族，必须有 gate，不得停留在 review 提醒。
2. **先拦新增，不先清存量**：先做增量门禁，防止问题继续生；但门禁落地前，不得宣称问题已收口。
3. **存量清理独立推进**：通过 backlog / issue / 批次修复处理；存量未清不影响先建门。
4. **任何 skipped = fail**：不能再用“门存在但默认放行”的假绿灯。
5. **规则命名要可读**：失败信息要告诉人“怎么修”，而不是只说“违规”。

---

### 5.5 L3：视觉验收控制（Visual Acceptance Control Plane）

前端问题之所以长期漏出，一个核心原因是：**交付证据几乎全是文本证据。**

#### 新规：任何前端任务的完成声明，必须附带四类证据；缺一项即不得给出“完成”结论

1. `pnpm -C apps/desktop storybook:build`
2. 受影响 surface 的 **before / after 截图**
3. **zh-CN / en** 双语言截图
4. **dark / light** 双主题截图

可选增强：

- 用 Playwright 跑最短用户流并截图；
- 用 Storybook visual regression / screenshot diff 做长期门禁。

#### 审计口径也必须改

**旧口径**：
- 有没有 PR
- 有没有 comment
- checks 绿不绿

**新口径**：
- 这个 surface 我看过图吗？
- 双语言看过吗？
- 双主题看过吗？
- spec 场景逐条验证了吗？
- 这个 PR 有没有新增同类坏味道？

---

### 5.6 L4：治理脚本可靠性控制（Governance Reliability Control Plane）

这层是防止“规则自己失真”。

#### 必须立刻修的四类治理缺口

1. **审计命令与真实测试入口对齐**
   - 文档不能再写一个会漏掉 TS tests 的命令。

2. **fail-open gate 全部改为 fail-closed**
   - 缺文件、缺配置、缺 schema，不是“跳过”，而是“阻断”。

3. **主源一致性自动比对**
   - `toolchain.md`、`project.md`、`delivery-skill.md`、workflow 不得互相打架。

4. **脚本行为必须被真实验证**
   - 不只测纯函数；要测“脚本入口在真实仓库快照下如何表现”。

#### 一条铁律

> **任何会产生“假绿灯”的治理脚本，优先级都应高于普通产品 bug。**

因为它伤的是整个仓库的判断能力。

---

## 六、审计系统重构：不要只审流程，要审产品

### 6.1 审计结论的结构必须变化

以后审计评论必须固定包含三栏：

1. **流程合规**：Issue / branch / PR / required checks / metadata
2. **产品正确**：spec 场景、视觉证据、语言完整性、错误路径
3. **控制面增量**：有没有新坏味道需要编进 lint / CI / wrapper

### 6.2 审计人必须回答的 5 个问题

1. 这次变更覆盖了哪个用户场景？
2. 我看过它真实长什么样吗？
3. 我验证过错误路径吗？
4. 这次有没有引入新的“可自动检测坏味道”？
5. 如果下一个 Agent复制这种写法，仓库会不会继续烂？

如果第 5 个问题答案是“会”，那这次审计就还没结束。

---

## 七、把“规定了但 Agent 还想怎么干就怎么干”变成不可能

这是整份文档的核心目标。

### 7.1 不要再试图用更长的 AGENTS.md 去驯化 Agent

文档当然重要，但文档的上限是“说明正确之道”；
控制面的职责则是“让错误之道走不通”。

所以系统应遵守这个顺序：

```text
口头约束 < 文档约束 < Code Review 约束 < Lint/CI 约束 < API/Wrapper 约束
```

真正可靠的约束，必须尽量落到最后两层。

### 7.2 Agent 的行为会自动追逐可量化目标

如果你量化的是：
- tests pass
- lint pass
- PR metadata 完整

那 Agent 就会自然优化这些东西。

如果你量化的是：
- 双语言截图齐全
- raw string gate 过不了
- feature 层原生 button 过不了
- service 里写 SQL 过不了

那 Agent 的写法自然会变。

**不要责怪执行者追逐指标；要先检查指标是否配得上产品目标。**

---

## 八、实施路线：先止血，再改制，后清债

### 8.1 第一阶段：先堵新增（1-3 天）

目标：**今天之后不再继续长同类新问题。**

- 上 `no-literal-string`
- 上 `no-native-controls-in-features`
- 上 `no-raw-tailwind-token-escape`
- 上 `skipped-gate-is-failure`
- 审计口径增加截图要求

### 8.2 第二阶段：重写高风险边界（3-7 天）

目标：**把最容易被 Agent 重复写坏的边界包起来。**

- 建 schema-first IPC wrapper
- 禁裸 `ipcMain.handle`
- DAO / repository 边界建立
- 禁 `services/**` 里直接 `.prepare(`

### 8.3 第三阶段：按用户场景清债（1-3 周）

目标：**不要再按“行号修复”清债，而按用户链路复原产品。**

优先顺序如下（不是建议，而是执行顺位）：

1. 版本历史全链路
2. AI 面板主链路
3. Create Project / onboarding 首次体验
4. CommandPalette / Error UX
5. Storybook surface 补齐

### 8.4 第四阶段：把控制面变成长期基础设施（持续）

- schema diff / breaking change gate
- visual regression
- multi-locale snapshot
- story inventory against spec surfaces
- touched-file complexity / size budget

---

## 九、给 Owner 的强制执行口径

### 9.1 以后派任务，不要再说：

- “把这个文件里的英文都改了”
- “把这里换成 token”
- “这个 TODO 先补一下”

### 9.2 应该改成：

- “用户切到英文后，版本历史模块完整可用，不露英文、不露技术词、不露 TODO”
- “用户创建项目时，整个表单从 label 到错误提示都符合语义与双语言要求”
- “一个新 IPC 通道从 schema 到 preload 到 handler 到 tests 都走统一模板”

### 9.3 以后验收不要只问：

- 测试过了吗？
- lint 过了吗？

### 9.4 还要问：

- 图呢？
- zh/en 呢？
- light/dark 呢？
- 错误路径呢？
- 这次有没有顺手建立一条新硬闸门，防止下次再犯？

---

## 十、最终判词

CN 当前的问题，不是“AI 写得不行”，而是：

> **AI 被放进了一个“流程正确比产品正确更容易被证明”的系统里。**

在这种系统中，Agent 会自然变成：

- 规矩执行者，
- 文书完成者，
- 局部修补者，

而不是：

- 场景 owner，
- 体验守门人，
- 架构边界维护者。

所以真正的对策不是“再要求 Agent 自觉一点”，而是：

> **把规范写成门，把门装到路上，把路修成只有正确做法能通行。**

当控制面改对以后，Agent 不必更聪明，也会做得更规范；
当控制面仍旧宽松，再强的模型，也只是在更高效地复制同一种失真。

---

## 附录 A：必须立即转成 Issue / PR 的控制面任务

| ID | 任务 | 类型 |
|---|---|---|
| CP-01 | `features/**` 禁 native controls | lint / AST rule |
| CP-02 | 用户可见裸字符串全局门禁 | lint / AST rule |
| CP-03 | raw color / built-in shadow 全局门禁 | lint rule |
| CP-04 | icon-only button 必须有 accessible name | lint / a11y rule |
| CP-05 | spec 指定 surface / reusable component 缺 Story 直接失败 | inventory gate |
| CP-06 | `services/**` 禁 `.prepare(` | lint / grep gate |
| CP-07 | IPC schema-first wrapper 落地 | infra refactor |
| CP-08 | 禁裸 `ipcMain.handle` | lint rule |
| CP-09 | skipped gate 视为失败 | governance fix |
| CP-10 | policy-doc-vs-script drift check | governance gate |
| CP-11 | 前端 PR 强制双语言双主题截图 | review policy |
| CP-12 | Storybook / Playwright 视觉验收进入完成定义 | review + CI |

## 附录 B：本文与 Amp 现有文件的关系

- 与 `07-ui-ux-design-audit.md` 的关系：它看见的是**用户可见断点**；本文负责把这些断点改写成控制面。
- 与 `11-frontend-static-code-audit.md` 的关系：它量化的是**代码层问题规模**；本文负责把这些量化问题转成 lint / gate / wrapper。
- 与 `03-engineering-and-architecture-roadmap.md` 的关系：它提出 schema-first / test strategy 方向；本文负责把方向翻译成执行控制面。
- 与 `05-implementation-backlog.md` 的关系：它定义“做什么”；本文定义“以后如何不再反复做同类修复”。
