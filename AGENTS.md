# CreoNow — Agent 宪法

**CreoNow（CN）** 是一个 AI 驱动的文字创作 IDE，定位为「创作者的 Cursor」。

技术选型已锁定，详见 `docs/references/tech-stack.md`。如需变更，必须先提交 RFC 并获得 Owner 批准。

所有 AI Agent 在执行任何任务之前，必须先阅读本文件。违反本文件中的原则，等同于交付失败。

# Repository Guidelines
1. 回复尽量使用中文
2. 如果没有显示要求，禁止写兼容代码
3. 沟通方式：要有文化，要有诗意，能引经据典最好。

## 索引

| §   | 章节       | 内容                                      |
| --- | ---------- | ----------------------------------------- |
| 一  | 阅读链     | 必读顺序、文档路径速查                    |
| 二  | 核心原则   | 7 条不可违反的原则（P1–P7）               |
| 三  | 架构       | 四层架构 + 12 模块 Spec 路径              |
| 四  | 三体系协作 | OpenSpec / Rulebook / GitHub 的职责与关系 |
| 五  | 工作流程   | 接任务、开发阶段（骨架 + 指针）           |
| 六  | 补充禁令   | 从原则可推导但容易被忽视的显式提醒        |
| 七  | 参考文档   | 按需查阅的外部化参考文件索引              |

---

## 一、阅读链与文档导航

### 阅读链（按顺序）

```
1. AGENTS.md                                        ← 本文件（如已读可跳过）
2. openspec/project.md                              ← 项目概述与模块索引
3. openspec/specs/<module>/spec.md                  ← 任务相关模块行为规范
4. docs/delivery-skill.md                           ← 交付规则主源
5. openspec/changes/<current>/                      ← 如有进行中的变更
```

### 文档速查

| #   | 文档                  | 路径                                              |
| --- | --------------------- | ------------------------------------------------- |
| 1   | Agent 宪法（本文件）  | `AGENTS.md`                                       |
| 2   | 项目概述              | `openspec/project.md`                             |
| 3   | 模块行为规范          | `openspec/specs/<module>/spec.md`                 |
| 4   | 交付规则主源（SKILL） | `docs/delivery-skill.md`                          |
| 5   | 设计规范              | `design/DESIGN_DECISIONS.md`                      |
| 6   | 跨模块集成规范        | `openspec/specs/cross-module-integration-spec.md` |

按需查阅的参考文档见 §七。

---

## 二、核心原则

以下 7 条原则是你执行一切任务的基础。每条原则都是硬约束，违反任何一条等同于交付失败。

### P1. Spec-First（规范优先）

**你不得在没有 spec 的情况下写任何实现代码。**

Spec 是你和 Owner 之间的合同。Owner 定义「系统应该做什么」，你负责实现「系统怎么做到」。没有合同就没有施工。

1. 收到任务后，第一步永远是阅读 `openspec/specs/<module>/spec.md`
2. 如果 spec 不存在或不完整，你必须通知 Owner 补充，然后等确认，然后才能动手
3. 如果开发中发现 spec 遗漏的场景，你必须先补 delta spec 并通知 Owner，等确认后再实现
4. 任何超出当前 spec 范围的行为，都需要 Owner 确认

✅ 收到任务 → 读 spec → 发现 spec 不存在 → 通知 Owner → 等确认 → 开始 TDD

✅ 开发中发现边界情况 spec 没覆盖 → 补 delta spec → 通知 Owner → 等确认 → 再写测试

❌ 收到任务 → spec 不存在 → 根据自己的理解直接写代码

❌ 开发中发现新场景 → 只写测试不更新 spec

### P2. Test-First（测试先行）

**你不得在没有失败测试的情况下写任何实现代码。**

严格遵循 Red → Green → Refactor 循环：先写一个描述期望行为的测试，运行确认它失败（Red），然后写最少量的代码让它通过（Green），然后在绿灯保护下重构（Refactor）。

1. Spec 中的每个 Scenario 必须被翻译为至少一个测试用例，零遗漏
2. 测试必须验证行为，不得验证实现细节
3. 测试必须独立、确定、有意义

✅ 写一个测试 → 运行确认失败 → 写最少实现 → 运行确认通过 → 重构

❌ 先写完整个模块的实现 → 事后补测试

❌ 写一个 `expect(true).toBe(true)` 来提高覆盖率

### P3. Evidence（证据落盘）

**你做的每一件事都必须有可追溯的记录。没有记录等于没有发生。**

1. 每个任务必须有 RUN_LOG（`openspec/_ops/task_runs/ISSUE-<N>.md`）
2. 关键命令的输入和输出必须记录在 RUN_LOG 的 Runs 段
3. CI 失败和修复过程必须记录
4. 遇到阻塞必须记录并通知，不得静默放弃
5. PR 链接必须回填真实值，不得留占位符

✅ CI 失败 → 修复 → push → 记录失败原因和修复过程到 RUN_LOG

✅ 遇到 blocker → 记录到 RUN_LOG → 通知 Owner → 等待

❌ CI 失败 → 修好了 → 不记录

❌ 遇到 blocker → 静默放弃整个任务

❌ RUN_LOG 的 PR 字段写 `TBD` 就宣称交付完成

### P4. Gates（门禁全绿才能通过）

**PR 必须通过所有 required checks 且使用 auto-merge。没有例外。**

1. 三个 required checks：`ci`、`openspec-log-guard`、`merge-serial`
2. 所有 PR 必须启用 auto-merge，禁止手动合并
3. CI 不绿就不合并，不得「先合并再修」
4. 交付规则文档与 GitHub branch protection 的 required checks 必须一致，不一致时阻断并升级
5. 交付完成的标志是代码已合并到 `main`，不是在 `task/*` 分支上提交了代码

✅ PR 创建 → 开启 auto-merge → watch checks → 全绿 → 自动合并 → 确认 main 包含提交

❌ CI 红了 → 先手动合并 → 之后再修

❌ task 分支上测试通过 → 宣称交付完成（但还没合并到 main）

### P5. Change Protocol（变更协议）

**主 spec 代表系统的当前真实状态。你不得直接修改主 spec。所有变更必须走 Proposal → Apply → Archive 流程。**

1. Delta Spec 中使用 `[ADDED]`/`[MODIFIED]`/`[REMOVED]` 标记
2. 每个 change 的 `tasks.md` 必须按固定 TDD 章节顺序撰写（Specification → TDD Mapping → Red → Green → Refactor → Evidence）
3. TDD Mapping 未建立、Red 失败证据未记录时，禁止进入实现
4. PR 合并后才能将 delta spec 归档到主 spec
5. 当存在 ≥2 个活跃 change 时，必须维护 `EXECUTION_ORDER.md`（含执行模式、顺序、依赖、更新时间）
6. 活跃 change 变更时，必须同步更新 `EXECUTION_ORDER.md`
7. 若 change 存在上游依赖，进入 Red 前必须完成 Dependency Sync Check 并落盘
8. 若依赖漂移，必须先更新 change 文档再继续

✅ 需要改行为 → 写 proposal → 写 delta spec → Owner 确认 → TDD 实现 → PR 合并 → 归档到主 spec

❌ 直接打开 `openspec/specs/memory-system/spec.md` 改了一行

### P6. Deterministic & Isolated（确定性与隔离）

**你的所有操作必须是确定性的、可复现的、与外部环境隔离的。**

这条原则覆盖两个维度：

**测试确定性**：测试不得依赖真实时间、随机数、网络请求。使用 fake timer、固定种子、mock。集成测试和 E2E 中 LLM 必须 mock，不得消耗真实 API 额度。

**环境隔离**：每个任务在独立的 worktree 中工作。分支必须从最新的 `origin/main` 创建。`pnpm install` 必须使用 `--frozen-lockfile`。

✅ 测试中需要当前时间 → 注入 fake timer → 控制返回值

✅ 开始新任务 → `git fetch origin` → 从 `origin/main` 创建 worktree

❌ 测试直接调用 `Date.now()`（今天通过明天失败）

❌ 不同步 main 就直接创建分支（基于过期代码开发）

❌ `pnpm install` 不带 `--frozen-lockfile`（可能引入未锁定的依赖变化）

### P7. Escalate, Don't Improvise（上报，不要即兴发挥）

**当你遇到任何不确定的情况，你必须停下来、记录、通知 Owner。你不得根据自己的猜测继续执行。**

这是所有原则的兜底原则。当你不确定 P1–P6 在当前情况下应该怎么应用时，执行 P7。

1. Spec 不存在或矛盾 → 停下来，通知 Owner
2. 任务超出 spec 范围 → 停下来，通知 Owner
3. 上游依赖与你的假设不一致 → 停下来，做 Dependency Sync Check，通知 Owner
4. 发现用了已关闭的 Issue → 立即停止，新建 OPEN Issue，从最新 main 重建 worktree
5. Rulebook task 不存在或验证失败 → 阻断交付，先修复

✅ 发现两个 Scenario 互相矛盾 → 停止开发 → 通知 Owner → 等待澄清

✅ 发现 Issue 已经 Closed → 立即停止 → 新建 Issue → 重建环境

❌ Spec 有矛盾 → 自己选一个理解继续写

❌ 误用了已关闭 Issue → 继续在上面开发

---

## 三、架构

| 架构层         | 路径                     | 运行环境          | 包含内容                                                       |
| -------------- | ------------------------ | ----------------- | -------------------------------------------------------------- |
| 前端（渲染层） | `apps/desktop/renderer/` | Electron 渲染进程 | React 组件、TipTap 编辑器、Zustand store、UI 交互              |
| Preload        | `apps/desktop/preload/`  | Electron Preload  | contextBridge，安全暴露 IPC API                                |
| 后端（业务层） | `apps/desktop/main/`     | Electron 主进程   | 上下文引擎、知识图谱、记忆系统、技能系统、SQLite DAO、LLM 调用 |
| 共享层         | `packages/shared/`       | 跨进程            | IPC 类型定义、共享常量                                         |

### 核心引擎（后端为主）

| 模块               | 职责                                    | Spec 路径                                     |
| ------------------ | --------------------------------------- | --------------------------------------------- |
| Context Engine     | 分层上下文管理、Token 预算、Constraints | `openspec/specs/context-engine/spec.md`       |
| Knowledge Graph    | 实体与关系管理、语义检索、角色管理系统  | `openspec/specs/knowledge-graph/spec.md`      |
| Memory System      | 写作偏好学习、记忆存储与衰减            | `openspec/specs/memory-system/spec.md`        |
| Skill System       | AI 技能抽象、三级作用域、技能执行       | `openspec/specs/skill-system/spec.md`         |
| AI Service         | LLM 代理调用、流式响应、AI 面板、Judge  | `openspec/specs/ai-service/spec.md`           |
| Search & Retrieval | 全文检索、RAG、向量嵌入、语义搜索       | `openspec/specs/search-and-retrieval/spec.md` |

### 用户界面（前端为主）

| 模块          | 职责                                   | Spec 路径                                    |
| ------------- | -------------------------------------- | -------------------------------------------- |
| Editor        | TipTap 编辑器、大纲、Diff 对比、禅模式 | `openspec/specs/editor/spec.md`              |
| Workbench     | UI 外壳、布局、Surface、命令面板、设置 | `openspec/specs/workbench/spec.md`           |
| Document Mgmt | 文档 CRUD、文件树、导出                | `openspec/specs/document-management/spec.md` |
| Project Mgmt  | 项目生命周期、仪表盘、模板、引导       | `openspec/specs/project-management/spec.md`  |

### 基础设施

| 模块            | 职责                               | Spec 路径                                |
| --------------- | ---------------------------------- | ---------------------------------------- |
| IPC             | 前后端通信契约、契约自动生成与校验 | `openspec/specs/ipc/spec.md`             |
| Version Control | 快照、AI 修改标记、Diff、版本恢复  | `openspec/specs/version-control/spec.md` |

目录结构与文件组织详见 `docs/references/file-structure.md`。

---

## 四、三体系协作

```
OpenSpec（做什么）       Rulebook（怎么做）       GitHub（怎么验收）
openspec/               rulebook/tasks/          .github/workflows/
```

1. **OpenSpec**：定义行为和约束（spec.md、proposal.md、delta spec）。你实现前必须阅读。
2. **Rulebook**：记录任务拆解、执行步骤与验证证据。交付前必须可验证。
3. **GitHub**：以 Issue、Branch、PR、required checks、auto-merge 作为验收门禁。

规则冲突时，以 `docs/delivery-skill.md` 为主源；本文件与外部 SKILL 必须保持一致。

---

## 五、工作流程

详细步骤与命令见 `docs/delivery-skill.md`。命名约定见 `docs/references/naming-conventions.md`。异常处理见 `docs/references/exception-handling.md`。

### 接到任务时

1. 阅读本文件 ← 如已读可跳过
2. 阅读 `openspec/project.md` ← 项目概述
3. 阅读 `openspec/specs/<module>/spec.md` ← 任务相关模块行为规范
4. 阅读 `docs/delivery-skill.md` ← 交付规则
5. 阅读 `openspec/changes/<current>/` ← 如有进行中的变更
6. 确认 Issue 号（N）和 SLUG；Issue 必须为当前 OPEN 状态
7. 从最新 `origin/main` 创建 worktree 和 `task/<N>-<slug>` 分支

### 开发流程

| 阶段          | 完成条件                                                                                            |
| ------------- | --------------------------------------------------------------------------------------------------- |
| 1. 任务准入   | Issue 已创建或认领，N 和 SLUG 已确定                                                                |
| 2. 规格制定   | spec 已编写或更新；Rulebook task 已创建并通过 validate；若有上游依赖则 Dependency Sync Check 已完成 |
| 3. 环境隔离   | 控制面 `origin/main` 已同步，Worktree 已创建，工作目录已切换                                        |
| 4. 实现与测试 | 按 TDD 循环实现；所有测试通过；RUN_LOG 已记录                                                       |
| 5. 提交与合并 | PR 已创建；auto-merge 已开启；三个 checks 全绿；PR 已确认合并                                       |
| 6. 收口与归档 | 控制面 `main` 已包含任务提交；worktree 已清理；Rulebook task 已归档（允许同 PR 自归档）             |

---

## 六、补充禁令

以下规则可从核心原则推导，但因历史上反复出现，显式列出作为提醒：

1. 禁止 `any` 类型——TypeScript strict mode 下必须编译通过（推导自 P6）
2. 禁止在组件中直接使用 Tailwind 原始色值——必须通过语义化 Design Token（详见 `docs/references/design-ui-architecture.md`）
3. 禁止仅为归档当前任务的 Rulebook task 递归创建 closeout issue（推导自 P5）

---

## 七、参考文档

以下文档按需查阅，不必在首次阅读时全部读完：

| 文档           | 路径                                        | 查阅时机              |
| -------------- | ------------------------------------------- | --------------------- |
| 测试要求       | `docs/references/testing-guide.md`          | 写测试前              |
| 设计与 UI 架构 | `docs/references/design-ui-architecture.md` | 写前端组件前          |
| 代码原则       | `docs/references/coding-standards.md`       | 写代码前              |
| 异常处理       | `docs/references/exception-handling.md`     | 遇到阻塞/异常时       |
| 技术选型       | `docs/references/tech-stack.md`             | 选型疑问时            |
| 工具链         | `docs/references/toolchain.md`              | 构建/CI/脚本相关      |
| 命名约定       | `docs/references/naming-conventions.md`     | 命名不确定时          |
| 文件组织       | `docs/references/file-structure.md`         | 创建新文件/目录时     |
| 交付规则映射   | `docs/delivery-rule-mapping.md`             | 审计规则-门禁一致性时 |
| 产品概述       | `docs/PRODUCT_OVERVIEW.md`                  | 需要产品上下文时      |
| Owner 意图定义 | `docs/OpenSpec Owner 意图定义书.md`         | 需要模块行为意图时    |

---

**读完本文件后，请阅读 `openspec/project.md`，然后阅读任务相关模块的 `spec.md` 和 `docs/delivery-skill.md`，再开始工作。**
