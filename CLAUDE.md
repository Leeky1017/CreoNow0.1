# CreoNow — Agent 宪法 v2

**CreoNow（CN）** 是一个 AI 驱动的文字创作 IDE，定位为「创作者的 Cursor」。

技术选型已锁定，详见 `docs/references/tech-stack.md`。

所有 AI Agent 在执行任务前，必须先阅读本文件。

# Repository Guidelines

1. 回复尽量使用中文
2. 如果没有显示要求，禁止写兼容代码
3. 沟通方式：要有文化，要有诗意，能引经据典最好。

---

## 一、阅读链

```
1. AGENTS.md                                        ← 本文件（如已读可跳过）
2. openspec/project.md                              ← 项目概述与模块索引
3. openspec/specs/<module>/spec.md                  ← 任务相关模块行为规范
4. design/DESIGN_DECISIONS.md                       ← 设计决策（前端任务必读）
```

---

## 二、核心原则

### P1. Spec-First（规范优先）

收到任务后，第一步阅读 `openspec/specs/<module>/spec.md`。

- 如果 spec 不存在或不完整，通知 Owner 补充后再动手
- 如果开发中发现 spec 遗漏场景，先更新 spec 再实现
- 超出 spec 范围的行为需要 Owner 确认
- 修改模块对外行为 → 必须更新 spec.md
- 修复 bug（行为回归到 spec 定义）→ 不需要更新 spec

### P2. Test-First（测试先行）

先写测试，再写实现。Red → Green → Refactor。

- **写测试前，必须阅读 `docs/references/testing/README.md` 及其子文档**
- Spec 中的 Scenario 必须有对应测试（`spec-test-mapping-gate` CI 自动验证）
- 测试验证行为，不验证实现细节
- 测试必须独立、确定、有意义
- Red phase 必须看到测试因"行为缺失"而失败；Green phase 必须重新运行测试确认通过

**测试类型决策**（详见 `docs/references/testing/02-test-type-decision-guide.md`）：

- 单函数/Store/Hook → 单元测试
- 多模块协作 → 集成测试
- 关键用户路径（启动/编辑/保存/AI/导出/设置） → E2E 测试
- 跨文件/跨层/跨进程约束 → Guard；能用 ESLint 解决的不写 Guard

**五大反模式（必须避免）**（详见 `docs/references/testing/01-philosophy-and-anti-patterns.md`）：

1. 字符串匹配源码检测实现（`source.includes('xxx')`）→ 用行为断言
2. 只验证存在性（`toBeTruthy()`）→ 验证具体值（`toEqual()`）
3. 过度 mock 导致测的是 mock 本身 → 只 mock 边界依赖
4. 仅测 happy path → 必须覆盖 edge + error 路径
5. 无意义测试名称（`test1`、`should work`） → 名称说明前置条件和预期行为

**前端测试查询优先级**：`getByRole` > `getByLabelText` > `getByTestId` >> `getByText`

**本地验证命令**（详见 `docs/references/testing/07-test-command-and-ci-map.md`）：

```bash
pnpm -C apps/desktop vitest run <pattern>   # 单元/集成测试
pnpm typecheck                               # 类型检查
pnpm lint                                    # ESLint
pnpm -C apps/desktop storybook:build         # Storybook（前端）
```

### P3. Gates（门禁全绿）

PR 必须通过所有 required checks；auto-merge 默认关闭，仅可在指定审计 Agent 已发布 `FINAL-VERDICT` 且结论为 `ACCEPT` 后显式开启。

- Required checks：`ci`、`merge-serial`
- GitHub 远程动作前先运行 `python3 scripts/agent_github_delivery.py capabilities`
- CI 不绿不合并，不得「先合并再修」
- 交付完成 = 代码已合并到 `main`
- OPEN Issue 只用于新任务准入；若 PR 已因 `Closes #N` 成功合并并自动关闭 Issue，`scripts/agent_pr_automerge_and_sync.sh` 的 rerun 必须识别为终局成功，不得卡死在 Issue reopen 等待上。

### P4. Deterministic & Isolated（确定性与隔离）

测试不得依赖真实时间、随机数、网络请求。

- 使用 fake timer、固定种子、mock
- LLM 在测试中必须 mock
- 分支从最新 `origin/main` 创建
- `pnpm install --frozen-lockfile`
- **禁止**在控制面 `main` 直接编辑受管文件；必须先通过 `scripts/agent_task_begin.sh <N> <slug>` 或 `scripts/agent_worktree_setup.sh <N> <slug>` 进入 `.worktrees/issue-<N>-<slug>` 后再实施
- repo-managed git hooks（`.githooks/pre-commit` / `.githooks/pre-push`）在执行 `scripts/agent_task_begin.sh`、`scripts/agent_worktree_setup.sh` 或 `scripts/agent_controlplane_sync.sh` 后启用，并阻止控制面根目录提交与直接推送 `main`；仅允许紧急热修通过 `CREONOW_ALLOW_CONTROLPLANE_BYPASS=1` 临时绕过

### P5. Escalate, Don't Improvise（上报，不要即兴发挥）

遇到不确定的情况，停下来通知 Owner。

- Spec 不存在或矛盾 → 停下来
- 任务超出 spec 范围 → 停下来
- 上游依赖不一致 → 停下来

### P-Visual. 视觉验收（前端任务专用）

前端任务必须有视觉验收证据。仅跑 vitest 不算完成。

- 修改组件后，确认 Storybook 可构建（`pnpm -C apps/desktop storybook:build`）
- 涉及样式的修改，确认使用语义化 Design Token（CI 自动检查）
- 新组件必须有 Story

---

## 三、架构

| 架构层  | 路径                     | 运行环境          |
| ------- | ------------------------ | ----------------- |
| 前端    | `apps/desktop/renderer/` | Electron 渲染进程 |
| Preload | `apps/desktop/preload/`  | Electron Preload  |
| 后端    | `apps/desktop/main/`     | Electron 主进程   |
| 共享层  | `packages/shared/`       | 跨进程            |

模块索引详见 `openspec/project.md`。

---

## 四、工作流

详细步骤与命令见 `docs/delivery-skill.md`。

### 接到任务时

1. 阅读本文件（如已读可跳过）
2. 阅读 `openspec/specs/<module>/spec.md`
3. 确认 Issue 号和分支名（`task/<N>-<slug>`）
4. 运行 `scripts/agent_task_begin.sh <N> <slug>`（或至少执行 controlplane sync + worktree setup），进入 `.worktrees/issue-<N>-<slug>` 后再开始实现

### 开发流程

| 阶段     | 完成条件                                                                                                                                      |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **准备** | Issue 已创建；spec 已阅读（如需变更则已更新）；分支已创建                                                                                     |
| **实现** | 按 TDD 循环实现；所有测试通过；前端任务有视觉验收                                                                                             |
| **交付** | PR 已创建（含 `Closes #N`）；auto-merge 默认关闭；仅在指定审计 Agent 已发布 `FINAL-VERDICT` + `ACCEPT` 评论后显式开启；CI 全绿；已合并到 main |

规则冲突时，以 `docs/delivery-skill.md` 为主源。

---

## 五、补充禁令

1. 禁止 `any` 类型——TypeScript strict mode 必须编译通过
2. 禁止在组件中使用 Tailwind 原始色值——必须通过语义化 Design Token（详见 `docs/references/design-ui-architecture.md`）
3. 禁止在 JSX 中使用裸字符串字面量——所有用户可见文本必须走 `t()` / i18n
4. 禁止使用 Tailwind 内置阴影类（`shadow-lg`、`shadow-xl`、`shadow-2xl`）——必须走 `--shadow-*` Design Token
5. 禁止提交 CRLF/LF 噪音型大 diff——无语义改动却整文件替换视为格式风暴，必须阻断
6. 禁止删除/跳过测试来换取 CI 通过
7. 禁止在活跃内容中保留已废止治理体系的引用，并声称"已收口"

---

## 六、独立审计 Agent 强制协议（分层自适应审计）

适用对象：被指派为 reviewer 或执行独立审计的 Agent。
详细审计步骤见 `docs/delivery-skill.md` 第八节（审计协议主源）。

> 「明者因时而变，知者随事而制。」——桓宽《盐铁论》
> 审计不是一成不变的流水线，而是因任务类型、风险等级、影响面而自适应的质量守护。

### 6.0 审计四律

1. **CI 能查的，信任 CI；CI 不能查的，才是审计 Agent 的主战场。** 你的核心价值：语义正确性、spec 对齐、架构合理性、安全性、测试质量。
2. **每条结论必须有证据。没有 diff 引用或命令输出，不要开口。**
3. **问自己：如果这个 PR 合并了，最有可能出什么问题？** 然后去验证那个场景。
4. **代码写了不等于功能生效。** 必须验证：用户操作路径是否连通？Spec Scenario 的预期行为是否真的出现？

### 6.0.1 变更分类（审计第一步）

审计 Agent 在一切检查之前，必须先分析 PR diff，判定三个维度：

- **变更层（WHERE）**：`backend` / `frontend` / `preload` / `shared` / `infra` / `docs`
- **风险等级（RISK）**：`critical` / `high` / `medium` / `low` / `minimal`
- **影响面（SCOPE）**：`cross-module` / `single-module` / `isolated`

各维度的具体判定依据见 `docs/delivery-skill.md` §8.0。

### 6.0.2 审计层级（Tiered Audit Protocol）

| 层级       | 适用条件                                      | 评论模型                  | 入口命令                    |
| ---------- | --------------------------------------------- | ------------------------- | --------------------------- |
| **Tier L** | `risk=low\|minimal` 且 `scope=isolated`       | 单条 FINAL-VERDICT        | `scripts/review-audit.sh L` |
| **Tier S** | `risk=medium` 且 `scope=single-module`        | PRE-AUDIT + FINAL-VERDICT | `scripts/review-audit.sh S` |
| **Tier D** | `risk=critical\|high` 或 `scope=cross-module` | PRE → RE（可多轮）→ FINAL | `scripts/review-audit.sh D` |

层级选择不可降级。

### 6.0.3 审计 Playbook

根据变更层，加载 `docs/references/audit-playbooks/` 下对应文件执行专项检查：

| 变更层                   | Playbook                     |
| ------------------------ | ---------------------------- |
| `backend`                | `backend-service.md`         |
| `frontend`               | `frontend-component.md`      |
| `preload` / IPC          | `ipc-channel.md`             |
| `infra`                  | `ci-infra.md`                |
| `docs`                   | `docs-only.md`               |
| 安全（Tier D 追加）      | `security-electron.md`       |
| 性能（Tier D 追加）      | `performance.md`             |
| 行为变更（Tier S+ 必做） | `functional-verification.md` |

### 6.1 不能做清单（违反任一项 → REJECT）

1. **不能**提交 CRLF/LF 噪音型大 diff
2. **不能**删除/跳过测试来换取 CI 通过
3. **不能**保留过时治理术语并声称"已收口"
4. **不能**只给建议不给结论
5. **不能**无证据下结论
6. **不能**把审计结果只写本地文件不发 PR 评论
7. **不能**在 required checks 未通过时给出可合并结论
8. **不能**用"后续再看"替代当前阻断问题

### 6.1.1 必须做白名单（审计质量底线）

1. **必须**实际读取 PR 变更的每一个文件
2. **必须**运行 `scripts/review-audit.sh <TIER>`
3. **必须**在评论中声明审计层级和变更分类结果
4. **必须**声明实际执行了哪些验证命令（附输出）
5. **必须**加载并执行对应 Playbook 的检查项（标注 ✅/❌/N/A）
6. **必须**验证新增 public 行为是否有对应测试（Tier S/D）
7. **必须**执行功能性验证（Tier S/D，涉及行为变更时）——加载 `functional-verification.md`，验证 Spec Scenario 与实现的行为对照，确认功能真的生效

### 6.2 审计命令（分层执行）

```bash
scripts/review-audit.sh L [<base-ref>]   # Tier L
scripts/review-audit.sh S [<base-ref>]   # Tier S
scripts/review-audit.sh D [<base-ref>]   # Tier D
```

### 6.3 审计交付口径

> "能发现问题、能定位根因、能明确阻断"优先于"写一堆建议"。
> 审计的第一职责是划红线，不是润色方案。

---

## 七、参考文档

| 文档           | 路径                                        | 查阅时机         |
| -------------- | ------------------------------------------- | ---------------- |
| 测试规范主源   | `docs/references/testing/README.md`         | 写测试前         |
| 设计与 UI 架构 | `docs/references/design-ui-architecture.md` | 写前端组件前     |
| 代码标准       | `docs/references/coding-standards.md`       | 写代码前         |
| 异常处理       | `docs/references/exception-handling.md`     | 遇到阻塞/异常时  |
| 技术选型       | `docs/references/tech-stack.md`             | 选型疑问时       |
| 工具链         | `docs/references/toolchain.md`              | 构建/CI/脚本相关 |
| 命名约定       | `docs/references/naming-conventions.md`     | 命名不确定时     |
| 文件组织       | `docs/references/file-structure.md`         | 创建新文件时     |

---

**读完本文件后，请阅读 `openspec/project.md`，然后阅读任务相关模块的 `spec.md` 和 `docs/delivery-skill.md`，再开始工作。**
