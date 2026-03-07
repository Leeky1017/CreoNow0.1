# AGENTS.md 改革提案


> "删繁就简三秋树，领异标新二月花。"

本文件提出 AGENTS.md 的改革方案，将其从 306 行 / 7 原则 / 三体系协作 精简为 ~150 行 / 5 原则 / 双体系协作。

---

## 文件索引

| § | 章节 | 内容 |
|---|------|------|
| 一 | 改革对照 | 新旧 AGENTS.md 对照表 |
| 二 | 改革后草案 | 完整的新 AGENTS.md 文本 |
| 三 | 关键改动说明 | 各原则变更理由 |
| 四 | 风险评估 | 改革风险与缓解 |

---

## 一、改革对照

### 原则变化对照

| 原编号 | 原名称 | 改革后 | 理由 |
|--------|--------|--------|------|
| P1 | Spec-First | **保留**，微调 | 核心。但移除 "delta spec 通知 Owner 等确认" 的阻塞语义 |
| P2 | Test-First | **保留**，放宽 | 核心。但不再要求记录 Red 证据文档 |
| P3 | Evidence（证据落盘） | **废止** | RUN_LOG 已废止；CI 日志和 PR 记录就是证据 |
| P4 | Gates（门禁全绿） | **保留**，简化 | required checks 从 3 减到 2（只保留 `ci` + `merge-serial`） |
| P5 | Change Protocol | **大幅简化** | 仅对涉及 spec 变更的任务要求 proposal；移除 EXECUTION_ORDER |
| P6 | Deterministic & Isolated | **保留** | 核心。测试确定性和环境隔离不可妥协 |
| P7 | Escalate, Don't Improvise | **保留** | 核心。但不再要求 "记录到 RUN_LOG" |
| 新增 | **P-Visual（视觉验收）** | **新增** | 前端任务必须有视觉验收证据 |

### 体系变化

| 改前 | 改后 |
|------|------|
| 三体系：OpenSpec + Rulebook + GitHub | **双体系：OpenSpec + GitHub** |
| Rulebook 记录任务拆解和执行证据 | **废止 Rulebook**；PR description 承担 |
| RUN_LOG 必须存在 | **废止 RUN_LOG**；CI 和 PR 就是记录 |
| Main Session Audit 签字 | **废止**；CI 通过 = 验收 |
| Independent Review .md | **废止文件生成**；review 意见直接写 PR comment |

### 工作流简化

| 改前（6 阶段） | 改后（3 阶段） |
|----------------|----------------|
| 1. 任务准入（Issue） | **1. 准备** |
| 2. 规格制定（spec + Rulebook） | ↑ 合并到准备 |
| 3. 环境隔离（worktree） | ↑ 合并到准备 |
| 4. 实现与测试 | **2. 实现** |
| 5. 提交与合并 | **3. 交付** |
| 6. 收口与归档 | ↑ 合并到交付 |

---

## 二、改革后的 AGENTS.md 草案

以下是完整的新版 AGENTS.md 内容建议：

---

```markdown
# CreoNow — Agent 宪法 v2

**CreoNow（CN）** 是一个 AI 驱动的文字创作 IDE，定位为「创作者的 Cursor」。

技术选型已锁定，详见 `docs/references/tech-stack.md`。

所有 AI Agent 在执行任务前，必须先阅读本文件。

---

## 一、阅读链

1. `AGENTS.md`（本文件）
2. `openspec/project.md`（项目概述与模块索引）
3. `openspec/specs/<module>/spec.md`（任务相关模块行为规范）
4. `design/DESIGN_DECISIONS.md`（设计决策，前端任务必读）

---

## 二、核心原则

### P1. Spec-First（规范优先）

收到任务后，第一步阅读 `openspec/specs/<module>/spec.md`。
- 如果 spec 不存在或不完整，通知 Owner 补充后再动手
- 如果开发中发现 spec 遗漏场景，先更新 spec 再实现
- 超出 spec 范围的行为需要 Owner 确认

### P2. Test-First（测试先行）

先写测试，再写实现。Red → Green → Refactor。
- Spec 中的 Scenario 必须有对应测试
- 测试验证行为，不验证实现细节
- 测试必须独立、确定、有意义

### P3. Gates（门禁全绿）

PR 必须通过所有 required checks 且使用 auto-merge。
- Required checks：`ci`、`merge-serial`
- CI 不绿不合并，不得"先合并再修"
- 交付完成 = 代码已合并到 `main`

### P4. Deterministic & Isolated（确定性与隔离）

测试不得依赖真实时间、随机数、网络请求。
- 使用 fake timer、固定种子、mock
- LLM 在测试中必须 mock
- 分支从最新 `origin/main` 创建
- `pnpm install --frozen-lockfile`

### P5. Escalate, Don't Improvise（上报，不要即兴发挥）

遇到不确定的情况，停下来通知 Owner。
- Spec 不存在或矛盾 → 停下来
- 任务超出 spec 范围 → 停下来
- 上游依赖不一致 → 停下来

### P-Visual. 视觉验收（前端任务专用）

前端任务必须有视觉验收证据。仅跑 vitest 不算完成。
- 修改组件后，确认 Storybook 可构建（`pnpm storybook:build`）
- 涉及 i18n 的修改，确认无硬编码中文（CI 自动检查）
- 涉及样式的修改，确认使用语义化 Design Token（CI 自动检查）
- 新组件必须有 Story

---

## 三、架构

| 架构层 | 路径 | 运行环境 |
|--------|------|----------|
| 前端 | `apps/desktop/renderer/` | Electron 渲染进程 |
| Preload | `apps/desktop/preload/` | Electron Preload |
| 后端 | `apps/desktop/main/` | Electron 主进程 |
| 共享层 | `packages/shared/` | 跨进程 |

模块索引详见 `openspec/project.md`。

---

## 四、工作流

### 接到任务时

1. 阅读本文件（如已读可跳过）
2. 阅读 `openspec/specs/<module>/spec.md`
3. 确认 Issue 号和分支名（`task/<N>-<slug>`）
4. 从最新 `origin/main` 创建分支

### 开发流程

| 阶段 | 完成条件 |
|------|----------|
| **准备** | Issue 已创建；spec 已阅读（如需变更则已更新）；分支已创建 |
| **实现** | 按 TDD 循环实现；所有测试通过；前端任务有视觉验收 |
| **交付** | PR 已创建（含 `Closes #N`）；auto-merge 已开启；CI 全绿；已合并到 main |

### 何时需要更新 spec

- 修改模块对外行为 → 必须更新 spec.md
- 修改内部实现但对外行为不变 → 不需要
- 修复 bug（行为回归到 spec 定义）→ 不需要
- 新增功能 → 先写/更新 spec

---

## 五、补充禁令

1. 禁止 `any` 类型——TypeScript strict mode 必须编译通过
2. 禁止在组件中使用 Tailwind 原始色值——必须通过语义化 Design Token
3. 禁止硬编码中文/日文/韩文字符串——必须使用 i18n

---

## 六、参考文档

| 文档 | 路径 | 查阅时机 |
|------|------|----------|
| 测试指南 | `docs/references/testing-guide.md` | 写测试前 |
| 设计与 UI 架构 | `docs/references/design-ui-architecture.md` | 写前端组件前 |
| 代码标准 | `docs/references/coding-standards.md` | 写代码前 |
| 技术选型 | `docs/references/tech-stack.md` | 选型疑问时 |
| 命名约定 | `docs/references/naming-conventions.md` | 命名不确定时 |
| 文件组织 | `docs/references/file-structure.md` | 创建新文件时 |
```

---

## 三、关键改动说明

### 3.1 为什么废止 P3 Evidence

P3 要求"每个任务必须有 RUN_LOG"、"关键命令输入输出必须记录"。这导致 Agent 花大量时间维护 374 个 RUN_LOG 文件。

但这些 RUN_LOG 几乎不被任何人回看。真正的证据是：
- **CI 日志**：所有测试和构建结果都有 GitHub Actions 记录
- **PR diff**：所有代码变更都有 git 记录
- **PR 会话**：所有讨论都在 PR comment 中

### 3.2 为什么合并 P5 Change Protocol

原 P5 定义了复杂的变更管理流程：proposal → delta spec → Apply → Archive → EXECUTION_ORDER.md。对于大型功能这是合理的，但对于绝大多数日常任务来说过度。

改革后将 spec 更新嵌入 P1（Spec-First），并在"何时需要更新 spec"中给出清晰判断标准。

### 3.3 为什么新增 P-Visual

这是本次改革最重要的新增。现有 7 条原则中，没有任何一条要求 Agent "看"界面。这导致：
- 42 个文件硬编码中文
- 按钮没有 accent 色
- i18n 覆盖率仅 5.4%

P-Visual 要求前端任务必须有视觉验收，并由 CI 自动检查 i18n 和 token 完整性。

### 3.4 从 306 行到 ~150 行

| 部分 | 原行数 | 新行数 | 变化 |
|------|--------|--------|------|
| 阅读链 | 40 | 10 | 移除速查表冗余 |
| 核心原则 | 120 | 60 | 7→6 原则，简化说明 |
| 架构 | 50 | 15 | 移除模块列表（在 project.md 中） |
| 三/双体系 | 20 | 0 | 移除（GitHub 是工具不是体系） |
| 工作流 | 40 | 25 | 6 阶段→3 阶段 |
| 补充禁令 | 10 | 8 | 微调 |
| 参考文档 | 26 | 15 | 精简 |
| **合计** | **306** | **~133** | **-56%** |

---

## 四、风险评估

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| Agent 在无 spec 时随意编码 | 低 | 高 | P1 不变，spec.md 仍是硬约束 |
| 后端质量下降 | 低 | 高 | P2/P3/P4 不变，CI 检查不变 |
| 前端视觉质量未改善 | 中 | 高 | P-Visual + 新 CI lint 是主防线 |
| 历史可追溯性降低 | 低 | 低 | git history + CI logs + PR 永久保存 |
| Agent 不上报就自行决定 | 中 | 中 | P5 Escalate 不变 |

---

> "文章合为时而著，歌诗合为事而作。"——流程亦然。
