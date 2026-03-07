# Amp Phase 0 Issue 执行总方案


> "谋定而后动，知止而有得。"——`05-implementation-backlog.md` 解决的是“要做什么”，本文解决的是“如何把这些任务稳定地变成 GitHub Issues、OpenSpec Changes、PR 与审计闭环”，使后续 Agent 不再临阵失措。

---

## 一、文档定位

本文是 `docs/audit/amp/05-implementation-backlog.md` 的执行配套，不重复定义产品问题，而是把 Phase 0 的 24 个任务压缩成一套可重复执行的交付协议。

适用范围：

- `docs/audit/amp/05-implementation-backlog.md` 中全部 `A0-01` 到 `A0-24`
- 已创建或待创建的 GitHub Issues
- `openspec/changes/` 下与 Phase 0 对应的 active changes
- 后续主会话 Agent、执行 subagent、独立审计 Agent 的协作边界

不适用范围：

- Phase 1 及以后任务的详细拆解
- 单个任务的具体实现设计
- GitHub 实际 issue 编号分配结果本身

相关主源：

- `docs/audit/amp/05-implementation-backlog.md`
- `openspec/changes/EXECUTION_ORDER.md`
- `docs/delivery-skill.md`
- `openspec/project.md`

---

## 二、总原则

### 2.1 一句话原则

Phase 0 不允许“想到一个点就临时开一个 issue”；必须先按本文确定载体类型、依赖顺序、执行模板，再创建 issue 与派发 Agent。

### 2.2 四条硬规则

1. **先判载体，再开 issue**：先判断任务属于 OpenSpec Change 还是直接 PR，再决定 issue 的 body 模板。
2. **一项任务一个主 issue**：默认 `A0-xx` 与一个 GitHub Issue 一一对应；只有在 backlog 已明确要求批处理时，才允许在执行上合并到同一 PR。
3. **Issue 先于分支与 worktree**：必须先有 OPEN Issue 编号 `N`，再创建 `task/<N>-<slug>` 与 `.worktrees/issue-<N>-<slug>`。
4. **审计闭环不可省略**：任何 issue 完成后都必须进入 `PRE-AUDIT -> RE-AUDIT -> FINAL-VERDICT` 的评论闭环，不能以“文档任务”或“直接 PR”作为豁免理由。

### 2.3 文档任务的审计特例

纯文档任务仍需进入完整审计闭环，但审计维度与代码任务不同。

| 审计维度 | 代码 PR | 纯文档 PR |
|---------|--------|-----------|
| 类型检查 / 测试 | 必查 | 按主源执行，不因文档类型豁免 |
| 文档事实准确性 | 必查 | 必查 |
| 与 backlog / execution order 一致性 | 必查 | 必查 |
| PRE-AUDIT / RE-AUDIT / FINAL-VERDICT 评论 | 必需 | 必需 |

纯文档 PR 的 `FINAL-VERDICT` 至少要回答三件事：

- 文档引用的路径是否真实存在。
- 文档中的 issue / change / 阶段状态是否与主源一致。

### 2.4 为什么默认一项任务一个主 issue

因为 Phase 0 的风险不在“任务多”，而在“语义混杂”。如果把多个不同问题域塞进同一 issue，后续 Agent 很容易同时修改 UI、i18n、错误基础设施与 spec，结果既破坏 TDD 粒度，也模糊审计边界。

允许合并的是 **PR 批次**，不是 **问题定义**。

---

## 三、载体分类与当前盘点

### 3.1 Phase 0 任务载体矩阵

| ID | 任务 | 载体类型 | 当前状态 | GitHub Issue | 对应 slug | 前端验收 |
|----|------|----------|----------|--------------|-----------|----------|
| A0-01 | 禅模式改为真实可编辑 | OpenSpec Change | 已创建 | #986 | `zen-mode-editable` | 需要 |
| A0-02 | 自动保存失败可见化 | 直接 PR | 已创建 | #992 | `autosave-visible-failure` | 需要 |
| A0-03 | 渲染进程全局错误兜底 | 直接 PR | 已创建 | #993 | `renderer-global-error-fallback` | 可选 |
| A0-04 | 导出能力诚实分级 | OpenSpec Change | 已创建 | #1002 | `export-honest-grading` | 需要 |
| A0-05 | Skill Router 否定语境守卫 | OpenSpec Change | 已创建 | #987 | `skill-router-negation-guard` | 否 |
| A0-06 | 发布事实表 | 直接 PR | 已创建 | #999 | `release-fact-sheet` | 否 |
| A0-07 | Windows 首发边界核查 | 直接 PR | 已创建 | #1000 | `windows-release-boundary-audit` | 否 |
| A0-08 | 备份能力真伪核查 | 决策 issue | 待创建 | 待分配 | `backup-capability-decision` | 否 |
| A0-09 | i18n 存量 key 核查 | 直接 PR | 已创建 | #990 | `i18n-inventory-audit` | 需要 |
| A0-10 | 基础全文搜索入口 | OpenSpec Change | 已创建 | #1003 | `search-mvp` | 需要 |
| A0-11 | 数据安全边界声明 | 直接 PR | 已创建 | #1001 | `data-safety-boundary-statement` | 否 |
| A0-12 | Inline AI 从 0 到 1 新建 | OpenSpec Change | 已创建 | #1004 | `inline-ai-baseline` | 需要 |
| A0-13 | Toast 接入 App | 直接 PR | 已创建 | #981 | `toast-app-integration` | 需要 |
| A0-14 | Settings General 持久化 | 直接 PR | 已创建 | #994 | `settings-general-persistence` | 需要 |
| A0-15 | 占位 UI 收口 | 直接 PR | 已创建 | #995 | `placeholder-ui-closure` | 需要 |
| A0-16 | 编辑器/版本/Slash i18n 核查 | 直接 PR | 已创建 | #991 | `editor-version-slash-i18n` | 需要 |
| A0-17 | Backup 决策：实现或隐藏 | 决策 issue | 已创建 | #996 | `backup-entry-resolution` | 视结论而定 |
| A0-18 | Judge 决策：接入或降级 | 决策 issue | 已创建 | #997 | `judge-capability-resolution` | 视结论而定 |
| A0-19 | Export 纯文本诚实标注 | 直接 PR | 已创建 | #998 | `export-plain-text-labeling` | 需要 |
| A0-20 | 错误消息统一人话化 | 直接 PR | 已创建（双开待归并） | #983（执行主入口）；#982（重复待归并） | `error-message-humanization` | 否 |
| A0-21 | 错误展示组件收口 | 直接 PR | 已创建 | #988 | `error-surface-closure` | 需要 |
| A0-22 | i18n 错误文案修正 | 直接 PR | 已创建 | #989 | `i18n-error-copy-cleanup` | 需要 |
| A0-23 | 文档 5MB 限制实施 | 直接 PR | 已创建 | #984 | `document-size-limit-enforcement` | 否 |
| A0-24 | Skill 输出校验扩展 | 直接 PR | 已创建 | #985 | `skill-output-validation` | 否 |

### 3.2 当前已存在的 active changes

以下 5 个 change 已存在，不得重复创建：

| A0 ID | Change 目录 | Issue 现状 | 说明 |
|------|-------------|------------|------|
| A0-01 | `openspec/changes/a0-01-zen-mode-editable` | Issue #986 | 见 `EXECUTION_ORDER.md` |
| A0-04 | `openspec/changes/a0-04-export-honest-grading` | Issue #1002 | 见 `EXECUTION_ORDER.md` |
| A0-05 | `openspec/changes/a0-05-skill-router-negation-guard` | Issue #987 | 见 `EXECUTION_ORDER.md` |
| A0-10 | `openspec/changes/a0-10-search-mvp` | Issue #1003 | 见 `EXECUTION_ORDER.md` |
| A0-12 | `openspec/changes/a0-12-inline-ai-baseline` | Issue #1004 | 见 `EXECUTION_ORDER.md` |

### 3.3 当前 issue 盘点

截至本文撰写时：

- GitHub 上已有 Phase 0 open issue：24 条
- 覆盖的唯一 A0 任务：23 个
- 仍待创建主 issue：1（A0-08：备份能力真伪核查）
- 需要归并的重复入口：1 组（A0-20 的 #982 / #983）

说明：

- A0-08 与 A0-17 不是重复。A0-08 负责查清事实与约束，A0-17 负责基于事实做产品决策并收口到代码或 UI。
- A0-20 当前以 #983 作为执行主入口；#982 保留历史上下文，但不应继续并行推进实现或审计。

### 3.4 载体判定说明

| ID | 载体判定理由 |
|----|--------------|
| A0-01 | 禅模式从只读展示变为可编辑，直接改变 editor 对外行为，必须走 Change。 |
| A0-02 | 自动保存已是既有承诺，当前问题是失败不可见，属于把行为修回真实承诺，直接 PR。 |
| A0-03 | 补全 renderer 全局错误兜底，不新增用户承诺，属于防御性工程，直接 PR。 |
| A0-04 | 导出能力分级会改变 document-management 的对外描述，必须走 Change。 |
| A0-05 | Skill 路由判定规则变更会改变 skill-system 对外行为，必须走 Change。 |
| A0-06 | 发布事实表是纯文档，不改变代码行为，直接 PR。 |
| A0-07 | Windows 首发边界核查主要是文档与发布事实收口，直接 PR。 |
| A0-08 | 先核查真实能力与文案承诺，当前尚不进入实现，故为决策 issue。 |
| A0-09 | i18n 存量清理是把现有 UI 拉回既定规范，不新增行为，直接 PR。 |
| A0-10 | 新增基础全文搜索入口，属于 0 到 1 能力，必须走 Change。 |
| A0-11 | 数据安全边界声明是诚实披露，不涉及功能增量，直接 PR。 |
| A0-12 | Inline AI 属于 editor 新能力，必须走 Change。 |
| A0-13 | Toast 接入是现有基础设施挂载与场景接线，不改变 spec 行为边界，直接 PR。 |
| A0-14 | Settings 持久化是把现有设置写回 preferences，属于修复，直接 PR。 |
| A0-15 | 占位 UI 收口是隐藏或诚实标注空壳，不新增 spec 行为，直接 PR。 |
| A0-16 | i18n 扩面是存量修复与规范补齐，直接 PR。 |
| A0-17 | Backup 要在 A0-08 事实核查后决定“实现 / 隐藏 / 延后”，当前为决策 issue。 |
| A0-18 | Judge 要在真实能力与成本澄清后决定“接入 / 降级”，当前为决策 issue。 |
| A0-19 | 纯文本诚实标注依赖 A0-04 的行为结论，本身是 UI / 文案收口，直接 PR。 |
| A0-20 | 错误码人话化是错误展示基础设施补齐，不改变业务 spec，直接 PR。 |
| A0-21 | 组件错误展示收口依赖 A0-20 映射表，属于 UI 修复，直接 PR。 |
| A0-22 | i18n 错误文案修正是文案去技术化，直接 PR。 |
| A0-23 | 5MB 限制是把已定义边界落回实现，属于 spec 合规修复，直接 PR。 |
| A0-24 | Skill 输出校验是防御性兜底，不新增用户承诺，直接 PR。 |

---

## 四、Issue 补齐与执行波次

### 4.1 当前状态：创建阶段已基本完成

截至本文更新时间，Phase 0 已不再处于“批量新建 issue”的阶段，而处于“补齐最后一个缺口 + 清理重复入口 + 按依赖推进实现”的阶段。

当前只剩两类 GitHub 治理动作：

1. 为 A0-08 创建唯一的决策 issue；
2. 将 A0-20 的双开入口收束为单一执行主 issue（以 #983 为准）。

### 4.2 剩余补齐 / 归并批次

| 批次 | 动作 | 目的 | 完成后允许的动作 |
|------|------|------|------------------|
| Batch R0 | 创建 A0-08 | 补齐 Backup 事实核查入口 | 开始决策调研、文档核查、方案比较 |
| Batch R1 | 归并 A0-20 的 #982 / #983 | 消除错误消息治理的双入口漂移 | 仅保留单一主 issue 继续实现、审计与 PR 绑定 |
| Batch R2 | 其余已建 issue 按实现波次推进 | 不再新增平行入口 | 按 4.4 的依赖进入实现 |

### 4.3 推进时机规则

- A0-08 未建前，A0-17 可以维持当前决策结论，但若需要回溯事实依据，必须先补 A0-08 作为上游入口。
- A0-20 双开未归并前，执行、审计与 PR body 一律以 #983 为主；#982 只保留历史上下文，不得继续并行推进实现。
- 其余 issue 进入实现前，必须先检查其上游项是否已进入实现或已合并回 `main`。
- 如果依赖项未就绪，必须在 issue 评论或主会话记录中显式记下阻断，不得 silent 延期。

### 4.4 实现波次与阻断关系

| 实现波次 | 可启动项 | 阻断条件 |
|---------|----------|----------|
| Wave 1 | A0-13, A0-20, A0-23, A0-24, A0-08, A0-18 | 无 |
| Wave 2 | A0-02, A0-03, A0-14, A0-15, A0-09 | A0-13 建议先进入实现；A0-02 最好在 Toast 基础上进行 |
| Wave 3 | A0-16, A0-21, A0-22, A0-17 | A0-16 依赖 A0-09；A0-21/A0-22 依赖 A0-20；A0-17 依赖 A0-08 |
| Wave 4 | A0-06, A0-07, A0-11, A0-19 | A0-19 依赖 A0-04 |
| Parallel OpenSpec | A0-01, A0-04, A0-05, A0-10 | 仅 A0-12 需等 A0-01 完成 |

### 4.5 禁止事项

- 禁止在 A0-20 未完成映射表前大面积改 A0-21/A0-22。
- 禁止在 A0-09 未完成存量核查前宣布 i18n 清零。
- 禁止在 A0-08 未完成事实核查前直接对 Backup 做实现承诺。
- 禁止在 A0-20 双开未收口前同时推进 #982 与 #983。
- 禁止为已存在的 A0-01/A0-04/A0-05/A0-10/A0-12 再创建第二个“主 issue”。

---

## 五、Issue 标题、标签与 Body 模板

### 5.1 标题格式

Phase 0 的 GitHub Issue 标题统一使用：

```text
[AMP][Phase 0][A0-xx] <中文任务名>
```

示例：

```text
[AMP][Phase 0][A0-20] 错误消息统一人话化
```

禁止写法：

- `fix bug`
- `Amp task`
- `搜索问题`
- 没有 `A0-xx` 编号的含混标题

### 5.2 建议标签

| 标签 | 用途 |
|------|------|
| `amp` | 标识来源于 Amp 审计 |
| `phase-0` | 标识 Phase 0 |
| `openspec-change` | 用于 A0-01/04/05/10/12 |
| `direct-pr` | 用于直接 PR 项 |
| `decision-needed` | 用于 A0-08/17/18 |
| `frontend` / `backend` / `docs` | 标识主战场 |
| `audit-required` | 标识必须进入独立审计闭环 |

### 5.3 直接 PR 类 issue body 模板

```md
## 背景

本 issue 来自 `docs/audit/amp/05-implementation-backlog.md` 的 `A0-xx`。

## 问题定义

- 用户现象：
- 根因判断：
- 为什么属于直接 PR：该任务不改变模块对外 spec，仅将行为修回既有承诺或补齐防御性工程。

## 范围

- In scope:
- Out of scope:

## 依赖

- 上游 issue / change：
- 阻断条件：

## 交付物

- 代码或文档改动：
- 测试：
- 若涉及前端：`pnpm -C apps/desktop storybook:build` 结果、截图或交互证据：

## 测试清单

下表必须覆盖 backlog 中每一条“验收”描述，不得只写一个笼统测试名。

| 验收标准 | 对应 Test Case | 状态 |
|---------|----------------|------|
| <验收标准 1> | <文件 / 用例名> | [ ] |
| <验收标准 2> | <文件 / 用例名> | [ ] |

## Done 定义

- [ ] 行为符合 `A0-xx` 验收描述
- [ ] 测试先红后绿
- [ ] PR body 包含 `Closes #<N>`
- [ ] 审计评论闭环完成

## 文档更新说明

若本任务修改 `docs/**` 或 `openspec/**`：


## 实施约束

- 不写兼容代码
- 不扩大到无关重构
- 若发现行为已超出 spec，停止并升级到 OpenSpec Change
```

### 5.4 OpenSpec Change 类 issue body 模板

```md
## 背景

本 issue 来自 `docs/audit/amp/05-implementation-backlog.md` 的 `A0-xx`，属于行为变更或新功能，必须走 OpenSpec Change。

## 对应 change

- change slug: `a0-xx-<slug>`
- 目录：`openspec/changes/a0-xx-<slug>/`

## 目标

- 更新 delta spec
- 先写失败测试
- 再实现最小闭环

## 交付物

- [ ] `proposal.md`
- [ ] `specs/<module>/spec.md`
- [ ] `tasks.md`
- [ ] Red -> Green 的测试证据
- [ ] backlog 验收项与测试用例映射表
- [ ] 对应实现 PR

## 依赖

- 上游 change / issue：
- 若依赖未完成，不得进入实现

## 审计要求

- 审计时必须同时检查 change 文档与代码实现

## 文档更新说明

若本任务修改 `docs/**` 或 `openspec/**`：

```

### 5.5 决策类 issue body 模板

```md
## 目标

在进入实现前，把存在歧义的产品承诺收口为单一决策。

## 必答问题

1. 真实现状是什么？
2. 当前 UI / 文案是否超额承诺？
3. v0.1 应选择实现、隐藏、降级还是推迟？
4. 该决策会新增 change，还是落为直接 PR？

## 产出

- [ ] 现状核查结果
- [ ] 方案对比（A / B / C）
- [ ] 最终建议
- [ ] 下游 issue 拆分建议

## 文档更新说明

若本任务导致 `EXECUTION_ORDER.md`、backlog 或本文发生调整：

- [ ] 标明调整原因

## 决策门槛

- 没有证据不得拍板
- 未回答对外承诺边界，不得关闭本 issue
```

---

## 六、Subagent 派工模板

### 6.1 主会话 Agent 的职责

主会话 Agent 负责四件事：

1. 判断任务载体是否正确。
2. 为 issue 创建 worktree 与执行上下文。
3. 给 subagent 下发足够具体、但不过度膨胀的指令。
4. 在 subagent 返回后做合并判断、自审、修文或修码、准备 PR。

### 6.2 直接 PR 类 subagent 指令模板

适用：A0-02、A0-03、A0-06、A0-07、A0-09、A0-11、A0-13、A0-14、A0-15、A0-16、A0-19、A0-20、A0-21、A0-22、A0-23、A0-24。

```text
你现在在 CreoNow 仓库中执行 Phase 0 的单一 issue。只处理一个 A0 任务，不得顺手扩散到其他 backlog。

任务：<A0-xx 标题>
载体：直接 PR
目标：把行为修回 backlog 所定义的真实承诺，不新增 spec 范围外功能。

你必须完成：
1. 阅读 `docs/audit/amp/05-implementation-backlog.md` 中对应 A0 条目。
2. 阅读相关 spec；如果发现任务实际上改变对外行为，立即停止并回报，不要自行扩 scope。
3. 先补失败测试，再写实现，再把测试跑绿；backlog 中每一条“验收”都必须映射到至少一个 test case。
4. 若涉及 UI，可见文本必须走 i18n；不得新增裸字符串。
5. 若涉及前端，必须提供视觉验收证据，至少包括 Storybook 构建结果、截图或交互录屏之一。
6. 若涉及错误消息，必须走统一错误展示链路，不得直接渲染 `error.code` / `error.message`。
8. 最终返回：改动摘要、测试结果、风险点、是否需要主会话 Agent 继续补文档或做审计准备。

前置依赖遇冷时：

1. 先核对表 4.4 的上游依赖是否真的未完成。
2. 若依赖确实阻断，立即停止并向主会话 Agent 报告堵点。
3. 不得自行顺手补做前置任务，除非主会话 Agent 明确授权。

禁止事项：
- 不要修无关问题
- 不要跳过测试
- 不要创建第二个 issue 的实现
- 不要使用兼容代码
```

### 6.3 OpenSpec Change 类 subagent 指令模板

适用：A0-01、A0-04、A0-05、A0-10、A0-12。

```text
你现在在 CreoNow 仓库中执行一个必须走 OpenSpec Change 的 Phase 0 任务。请严格遵循 spec-first 与 test-first。

任务：<A0-xx 标题>
change：`a0-xx-<slug>`
目标：完成 delta spec、失败测试、最小实现闭环。

你必须完成：
1. 阅读 `docs/audit/amp/05-implementation-backlog.md` 对应 A0 条目。
2. 阅读 `openspec/changes/a0-xx-<slug>/proposal.md`、`tasks.md` 与对应 delta spec。
3. 如果实现前发现 spec 缺场景，先补 spec，再动代码。
4. 先写 Red 测试，再写实现，再跑 Green；backlog 验收项必须逐条映射到测试。
5. 若涉及前端，必须补视觉验收证据。
7. 返回时必须给出：spec 变更摘要、测试证据、实现摘要、剩余风险。

前置依赖遇冷时：

1. 先核对 `EXECUTION_ORDER.md` 与表 4.4 的依赖说明。
2. 若上游 change 未完成且当前实现必须消费其结果，立即停止并回报。
3. 不得在未登记依赖调整前绕开上游 change。

禁止事项：
- 不得绕过 change 文档直接改主 spec
- 不得在 spec 未收口时擅自扩 scope
- 不得省略测试证据
```

### 6.4 决策类 subagent 指令模板

适用：A0-08、A0-17、A0-18。

```text
你现在处理的是 Phase 0 决策 issue，不是实现 issue。先求真，再决定是否实现。

任务：<A0-xx 标题>
目标：给出基于仓库事实的单一路径建议。

你必须完成：
1. 查明当前代码、UI、文案是否已经形成对外承诺。
2. 查明承诺是否真实闭环。
3. 给出至少两个可选方案，并说明代价、风险、对 v0.1 的影响。
4. 明确推荐方案，并指出下游应走直接 PR 还是 OpenSpec Change。
6. 返回时附证据路径，禁止空口判断。
```

### 6.5 执行遇冷决策树

若在执行中发现额外问题，按下列顺序处理：

1. **必须停止升级**：前置依赖阻断、spec 与 backlog 矛盾、现有实现与主源冲突。
2. **可继续但必须记录风险**：出现与其他 A0 任务边界相邻的重复逻辑，但不影响当前任务闭环。
3. **禁止继续扩散**：无关重构、顺手修第二个 A0 任务、删除测试换 CI。

### 6.6 何时不要调用 subagent

- 只改 1 个文档且不涉及多处证据整合时，主会话 Agent 直接完成。
- 任务阻断点已经明确，只需要向用户升级时，不需要再调用 subagent。
- 当前 worktree 中已有未收口的大改动，先自审再派工，避免上下文污染。

---

## 七、执行流程：从 issue 到 PR

### 7.1 标准流程

1. 创建或确认 OPEN Issue。
2. 判断其属于直接 PR、OpenSpec Change 还是决策 issue。
3. 从最新 `origin/main` 创建 `task/<N>-<slug>`。
4. 创建 `.worktrees/issue-<N>-<slug>`。
5. 主会话 Agent 按本文模板派发 subagent，或亲自执行。
6. 完成 Red -> Green -> Refactor。
7. 自审变更，确认没有越界。
8. 提交 PR，标题与 body 符合 `docs/delivery-skill.md`。
9. 进入独立审计评论闭环。
10. CI 全绿后启用 auto-merge，并在合并后清理 worktree。

### 7.2 PR body 最小模板（以仓库 PR template 为准）

```md
Skip-Reason: N/A (task branch)
<!-- 若非 task/* 分支，请改为：Skip-Reason: <具体原因> -->

## 主题
- <简要说明本次改动解决的问题>

## 关联 Issue
- Closes #<N>

## 用户影响
- <说明对用户或交付链路的影响>

## 验证证据
- [ ] `git diff --check`
- 其他补充验证：

## 回滚点
- 回滚 commit/分支：
- 回滚后需要恢复的数据或配置：

## 风险
- <说明已知风险或填 无>
```

### 7.3 文档与实现的联动规则

- 若 issue 落点是纯文档，仍需在 PR 中说明其对应的 backlog 条目。
- 若 issue 完成后改变了 `05-implementation-backlog.md` 的状态描述，应同步更新相关文档。
- 若 issue 的结论影响 active change 的先后顺序，应同步更新 `openspec/changes/EXECUTION_ORDER.md`。

---

## 八、验收证据与审计清单

### 8.1 每个 issue 必须回收的证据

| 任务类型 | 最少证据 |
|---------|----------|
| 直接 PR | 测试命令 + 结果、关键文件 diff、风险说明 |
| OpenSpec Change | delta spec 摘要、Red/Green 证据、实现测试结果 |
| 决策 issue | 代码/文档证据路径、方案比较、推荐结论 |

### 8.2 审计 Agent 必查点

1. 是否与 `A0-xx` 原始问题一致，没有偷换问题。
2. 是否符合载体类型：不该走 Change 的没乱开 Change，该走 Change 的没偷走直接 PR。
3. 是否满足 `Test-First`。
4. 是否误改了无关任务。
5. 是否保留了过时承诺或技术错误码。
6. 是否在 PR 评论中给出完整证据命令。

### 8.3 文档任务的特别审计点

- 是否引用了真实存在的文件与路径。
- 是否把未发生的 issue 编号写成既定事实。
- 是否与 `docs/delivery-skill.md`、`openspec/project.md` 冲突。

---

## 九、常见阻断与升级规则

### 9.1 必须立即停止并升级的情况

1. 任务实际改变了 spec，但 issue 被错误归类为直接 PR。
2. 上游 issue 尚未完成，当前任务却必须消费其结果。
3. 仓库现状与 backlog 描述明显矛盾。
4. subagent 想顺手修复第二个 A0 任务。
5. 需要复用已关闭 issue，或试图绕过当前 OPEN Issue 体系继续推进。

### 9.2 可以继续推进但要显式记录风险的情况

1. 文档任务依赖的统计数字未来可能变化。
2. UI 证据暂时只能给 Storybook 构建结果，无法附交互录像。
3. 某项决策仍需 Owner 最终拍板，但技术事实已经查清。

---

## 十、主会话 Agent 的收口动作

当一个 Phase 0 issue 完成时，主会话 Agent 必须做以下收口：

1. 确认 issue 目标是否已完整覆盖。
2. 确认 PR 标题、body、测试、审计入口都符合规则。
3. 如涉及文档或 change 顺序，补更新对应主源文档。
4. 自审一次，优先寻找：
   - 行为回归
   - 越界改动
   - 测试缺口
   - 错误的 issue / change 映射
5. 合并后清理 worktree，并把 backlog 状态向前推进。

> 这份方案的目的，不是让执行者更辛苦，而是让后来者不再重复今天的困惑：哪件事该开 issue，哪件事该建 change，哪件事该先停下来求证。把秩序写下来，后手才不会在烟尘里辨路。
