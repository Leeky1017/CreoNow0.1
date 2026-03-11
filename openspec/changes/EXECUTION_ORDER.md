# Phase 0 — Active Changes Execution Order

> "工欲善其事，必先利其器。"——先建门禁、再做止血、最后收口。

适用范围：`openspec/changes/` 下所有 `g0-*`（门禁）与 `a0-*`（止血）活跃 change。

---

## 一、执行策略

- 当前活跃 change 数量：**31**（24 止血 + 6 个 Wave 0.5 change + 1 个 T-MIG umbrella change；Wave 0 门禁 6 个已完成）
- 执行模式：按**实现波次（Wave）**推进，同波次内可并行，跨波次依赖必须串行
- **Wave 0 先行原则**：门禁基础设施必须在止血任务之前就位——"治病前先把体检仪器装好"
- **Wave 0.5 补丁原则**：独立审计发现的制度漏洞必须在止血实施前补齐——"磨刀不误砍柴工"
- 规则：新 change 启动前，需先检查本文件中的前置依赖是否已合并到 `main`

---

## 二、28 类高频问题全覆盖矩阵

AMP 审计在 5 轮独立审查中识别出 28 类高频问题。以下矩阵说明每类问题的门禁类型与覆盖来源。

### 三层执行模型

28 类问题按"阻断力度"分为三层。核心原则：**没有任何一类问题只靠"人记得检查"来兜底。**

| 层级 | 阻断机制 | 能力 | 覆盖数量 |
|------|---------|------|---------|
| **Tier 1: CI 自动阻断** | ESLint rule / Guard gate → CI job → PR 不绿不合并 | 新违规直接红灯，零人工干预 | 18 类 |
| **Tier 2: CI 半自动 + 审计交叉验证** | spec-test-mapping-gate 检查测试存在性 + 审计 Agent 验证测试质量 | 门禁保证"测试存在"，审计保证"测试有效" | 6 类 |
| **Tier 3: 协议强制 + 审计必查** | PR template 必填项 + 审计 Agent 必须验证并附证据 + REJECT 权 | 审计 Agent 缺项 = 自动 REJECT，不依赖人记得 | 4 类 |

> **关键设计**：Tier 2 和 Tier 3 不是"建议检查"，而是通过**审计 Agent 协议硬绑定**实现的——审计 Agent 的 PRE-AUDIT 必须逐条验证这些项目，缺一条 = REJECT。这让"人工检查"变成了"Agent 强制检查"。

### Tier 1: CI 自动阻断（18 类）

#### 已有门禁（4 类，无需 Wave 0 新建）

| # | 问题 | 现有门禁 | 阻断方式 |
|---|------|---------|---------|
| 1 | i18n 裸字符串 109+ | `i18next/no-literal-string: error` | ESLint error → CI 红灯 |
| 3 | Raw Tailwind Token 逃逸 | `creonow/no-raw-tailwind-tokens: error` | ESLint error → CI 红灯 |
| 5 | void-promise 静默失败 | `no-restricted-syntax`（裸 void async IIFE） | ESLint error → CI 红灯 |
| 10 | StatusBar 硬编码 locale | 被 #1 覆盖 | ESLint error → CI 红灯 |

#### 需新建自动化门禁（14 类 → G0-01~G0-04）

| # | 问题 | 门禁类型 | 覆盖 Change | 级别 |
|---|------|---------|------------|------|
| 2 | 原生 HTML 绕过设计系统 94+ | ESLint `creonow/no-native-html-element` | G0-01 | warn → error |
| 4 | 错误码裸露给用户 15+ | ESLint `creonow/no-raw-error-code-in-ui` | G0-01 | warn → error |
| 6 | 文档大小无限制 | Guard `resource-size-gate` | G0-04 | baseline ratchet |
| 7 | Skill 输出无校验 | Guard `cross-module-contract-gate` 扩展 | G0-02 | baseline ratchet |
| 8 | 渲染进程无错误兜底 | Guard `error-boundary-coverage-gate` | G0-03 | baseline ratchet |
| 9 | IPC Handler 无 Schema 验证 | Guard `ipc-handler-validation-gate` | G0-02 | baseline ratchet |
| 11 | Settings 固定尺寸溢出 | ESLint `creonow/no-hardcoded-dimension` | G0-03 | warn → error |
| 12 | Storybook 硬编码色值 | ESLint override scope 扩展 | G0-01 | warn |
| 13 | Tailwind 内置阴影类 | ESLint `creonow/no-raw-tailwind-tokens` 扩展 | G0-01 | error |
| 14 | Service 桩方法/假实现 | Guard `service-stub-detector-gate` | G0-02 | baseline ratchet |
| 19 | API Key 仅检查非空 | Guard `cross-module-contract-gate` 扩展 | G0-02 | baseline ratchet |
| 20 | ARIA-live 覆盖不足 | Guard `architecture-health-gate` | G0-03 | baseline ratchet |
| 26 | Provider 嵌套层过深 13 层 | Guard `architecture-health-gate` | G0-03 | threshold alert |
| 28 | Service 类/文件膨胀 | Guard `architecture-health-gate` | G0-03 | baseline ratchet |

### Tier 2: CI 半自动 + 审计交叉验证（6 类 → G0-05）

这 6 类问题的共性：**问题的"存在性"可以自动检测（有没有测试），但"有效性"需要审计验证（测试是不是真的有意义）**。

| # | 问题 | 自动检测层 | 审计验证层 | 覆盖 Change |
|---|------|-----------|-----------|------------|
| 15 | 假 UI 无否定测试 | `spec-test-mapping-gate`：标记为 `placeholder` 的组件必须有 `should NOT` 测试 | 审计 Agent 验证否定测试的断言是否真正覆盖"不能做的事" | G0-05 |
| 16 | Export 虚假声称 | `spec-test-mapping-gate`：能力声明 Scenario 必须有对应测试 | 审计 Agent 验证测试是否真正调用了导出函数并检查输出 | G0-05 |
| 17 | CJK 搜索质量弱 | `spec-test-mapping-gate`：search 模块必须有 CJK 测试 Scenario | 审计 Agent 验证 CJK 测试用例的覆盖深度（多音字、分词边界） | G0-05 |
| 18 | Memory 忽略拒绝信号 | `spec-test-mapping-gate`：拒绝路径 Scenario 必须有测试 | 审计 Agent 验证拒绝信号测试是否覆盖了全部入口点 | G0-05 |
| 22 | Spec→Test 映射缺失 | `spec-test-mapping-gate`：所有 Scenario 必须有测试标识 | N/A（门禁本身解决） | G0-05 |
| 23 | Guard 测试浅层化 | `spec-test-mapping-gate`：Guard 测试必须包含 PASS + FAIL fixture | 审计 Agent 验证 FAIL fixture 是否覆盖了关键违规模式 | G0-05 |

**执行机制**：
1. `spec-test-mapping-gate` 在 CI 中运行，检查 Scenario 到测试的映射完整性 → 缺映射 = CI 红灯
2. 审计 Agent 在 PRE-AUDIT 中必须验证 Tier 2 相关测试的质量 → 测试质量不达标 = REJECT
3. `docs/references/testing/` 中的反模式清单作为审计 Agent 判断"测试质量"的依据

### Tier 3: 协议强制 + 审计必查（4 类 → G0-06）

这 4 类问题**本质上不可自动化**——需要视觉判断、架构评审或方法论改进。但"不可自动化"不等于"不可强制"：通过把检查项硬编码到审计协议中，审计 Agent 缺任何一项 = REJECT。

| # | 问题 | 强制机制 | 验证方式 | 覆盖 Change |
|---|------|---------|---------|------------|
| 21 | 字体系统未加载 | PR template 必填 + 审计必查 | 审计 Agent 运行 Storybook，截图中英文混排页面，验证无方块字/fallback 异常。若无 UI 改动标注"N/A — 无 UI 变更" | G0-06 |
| 24 | 审计只看流程不看产品 | 审计协议升级 | PRE-AUDIT 必须包含至少 1 条"以用户身份操作应用"的验证步骤；纯 diff review 不计入 | G0-06 |
| 25 | 品牌/情绪设计无标准 | PR template 必填 + Design Token 门禁兜底 | 涉及 UI 的 PR 必须声明"新增样式是否使用 Design Token"；审计 Agent 交叉验证 Token 使用率 | G0-06 |
| 27 | 全局速率限制缺失 | 架构 RFC + CI gate 已就位 → A1 实现后升级 Tier 1 | Phase 0 已产出 RFC（`openspec/specs/ai-service/rate-limiting-rfc.md`）+ `gate:ai-rate-limit` 已接入 CI；A1 阶段实施限流中间件后升级为 Tier 1 | G0-06 |

**执行机制**：
1. `.github/pull_request_template.md` 包含 Tier 3 检查项，PR 作者必须填写（未填 = 审计 Agent 直接 REJECT）
2. 审计 Agent PRE-AUDIT 的"不能做清单"（AGENTS.md §6.1）扩展：增加"未验证 Tier 3 检查项即 REJECT"
3. FINAL-VERDICT 必须逐条回应 Tier 3 项目的验证结论
4. #27 是唯一有“阶段升级路径”的 Tier 3 问题——RFC 已完成且 `gate:ai-rate-limit` 已接入 CI；A1 实施限流中间件后升为 Tier 1

---

## 二·五、Gate 开发公共约定

> 所有 G0 系列 gate（G0-01~G0-05）的实现必须遵循以下约定，确保 gate 之间行为一致、可预测。

### Baseline 机制

| 项目 | 约定 |
|------|------|
| 存储位置 | `openspec/guards/<gate-name>-baseline.json` |
| 格式 | JSON，至少包含 `{ "count": N, "updatedAt": "ISO-8601" }` |
| 更新命令 | `pnpm gate:<gate-name> --update-baseline` |
| 首次生成 | gate 实现完成后立即生成初始 baseline 并提交 |
| Ratchet 规则 | 当前违规数 ≤ baseline 数 → PASS；当前 > baseline → FAIL + 列出新增违规 |

### 输出格式

```
[<GATE_NAME>] PASS  violations: M (baseline: N)
[<GATE_NAME>] FAIL  violations: M (baseline: N)  +K new:
  - file:line — description
```

### CI 集成

| 项目 | 约定 |
|------|------|
| pnpm 命令 | `gate:<gate-name>` 统一前缀 |
| CI job 名 | `gate-<gate-name>`（与 pnpm 命令同名） |
| 触发条件 | 默认 `if code_changed`；需要 build 产物的 gate（如 bundle-budget）额外加 build 依赖 |
| meta-job | 纳入 `ci` meta-job 的 `needs` 列表 |
| 初始模式 | 默认 required；需要观察期的 gate 可设 `continue-on-error: true`（必须在 tasks.md 中声明） |

### 测试约定

- 每个 gate 的测试必须包含 **≥1 PASS fixture + ≥1 FAIL fixture**
- 测试文件位置：`scripts/tests/<gate-name>.test.ts`
- ESLint 规则测试：`scripts/eslint-rules/__tests__/<rule-name>.test.cjs`
- 详见 `docs/references/testing/06-guard-and-lint-policy.md`

---

## 三、任务簇总览

| 任务簇 | 目标 | 包含任务 |
|--------|------|----------|
| **W0-GATE** 门禁基础设施 | 建门禁阻断 28 类高频问题的增量回流 | G0-01~G0-06 |
| **W0.5-GATE** 审计补丁 — 制度门禁补齐 | 补齐 Wave 0 遗漏的制度门禁与视觉回归 | G0.5-01~G0.5-06 |
| **T-MIG** 测试结构存量迁移 | 用 1 个 umbrella change 管理 7 个 TODO 子批次：286 个测试文件迁移 + 18 处浅断言 + ~160 处 getByText 降率 | T-MIG（含 7 个子批次） |
| **P0-1** 真实编辑与 AI 入口收口 | 让"可写作、可调用 AI"从承诺变成真实能力 | A0-01, A0-12 |
| **P0-2** 失败可见与错误人话化 | 让失败不再静默，让错误不再说黑话 | A0-13, A0-20, A0-21, A0-22, A0-02, A0-03 |
| **P0-3** 能力诚实分级与假功能处置 | 把"界面里看起来有"与"系统里实际上有"重新对齐 | A0-04, A0-06, A0-08, A0-15, A0-17, A0-18, A0-19 |
| **P0-4** 发布边界与数据诚实 | 澄清 Windows 首发与数据安全边界 | A0-07, A0-11 |
| **P0-5** 文案与 i18n 存量止血 | 清掉首发前最伤信任的语言露底问题 | A0-09, A0-16 |
| **P0-6** 基础输入输出防线 | 保证搜索、保存与 Skill 输出的最小可信边界 | A0-05, A0-10, A0-14, A0-23, A0-24 |

---

## 四、全部 Change 索引

### Wave 0: 门禁基础设施（G0-01 ~ G0-06）— 已完成

| ID | slug | GitHub Issue | 任务簇 | 载体类型 | 覆盖 Pattern |
|----|------|-------------|--------|----------|-------------|
| G0-01 | `g0-01-frontend-eslint-gates` | #1030 | W0-GATE | OpenSpec Change | #2, #4, #12, #13 |
| G0-02 | `g0-02-backend-ipc-service-gates` | #1031 | W0-GATE | OpenSpec Change | #7, #9, #14, #19 |
| G0-03 | `g0-03-frontend-architecture-gates` | #1032 | W0-GATE | OpenSpec Change | #8, #11, #20, #26, #28 |
| G0-04 | `g0-04-resource-size-gates` | #1033 | W0-GATE | OpenSpec Change | #6 |
| G0-05 | `g0-05-spec-test-mapping-gate` | #1024 | W0-GATE | OpenSpec Change | #15~18, #22, #23 |
| G0-06 | `g0-06-non-automatable-audit-protocol` | #1034 | W0-GATE | 直接 PR | #21, #24, #25, #27 |

### Wave 0.5: 审计补丁 — 制度门禁与视觉回归（G0.5-01 ~ G0.5-06）

| ID | slug | GitHub Issue | 任务簇 | 载体类型 | 来源 |
|----|------|-------------|--------|----------|------|
| G0.5-01 | `g05-01-require-describe-in-tests` | 待创建（change 已建） | W0.5-GATE | OpenSpec Change | GAP-8: 测试结构规范无自动化拦截 |
| G0.5-02 | `g05-02-backend-coverage-threshold` | 待创建（change 已建） | W0.5-GATE | OpenSpec Change | GAP-2: Backend coverage 阈值未设置 |
| G0.5-03 | `g05-03-format-check-ci` | 待创建（change 已建） | W0.5-GATE | OpenSpec Change | GAP-3: `format:check` 未接入 CI |
| G0.5-04 | `g05-04-review-audit-script` | 待创建（change 已建） | W0.5-GATE | OpenSpec Change | GAP-6: 审计一键脚本未落地 |
| G0.5-05 | `g05-05-e2e-path-mapping` | 待创建（change 已建） | W0.5-GATE | OpenSpec Change | GAP-7: E2E 关键路径映射不透明 |
| G0.5-06 | `g05-06-visual-regression-testing` | 待创建（change 已建） | W0.5-GATE | OpenSpec Change | 视觉回归测试基础设施为零 |

### 存量迁移 TODO 总控（T-MIG umbrella，含 7 个子批次）— 与 A0/A1 并行推进

| ID | slug | GitHub Issue | 任务簇 | 管理方式 | 范围 |
|----|------|-------------|--------|----------|------|
| T-MIG | `t-mig-test-structure-migration` | 待创建（umbrella） | T-MIG | 1 个 umbrella change + 7 个待拆分子 Issue | `describe/it` 迁移、浅断言替换、`getByText` 降率 |

### Wave 1-5: 止血实现（A0-01 ~ A0-24）

| ID | slug | GitHub Issue | 任务簇 | 载体类型 | 前端验收 |
|----|------|-------------|--------|----------|----------|
| A0-01 | `a0-01-zen-mode-editable` | #986 | P0-1 | OpenSpec Change | 需要 |
| A0-02 | `a0-02-autosave-visible-failure` | #992 | P0-2 | 直接 PR | 需要 |
| A0-03 | `a0-03-renderer-global-error-fallback` | #993 | P0-2 | 直接 PR | 可选 |
| A0-04 | `a0-04-export-honest-grading` | #1002 | P0-3 | OpenSpec Change | 需要 |
| A0-05 | `a0-05-skill-router-negation-guard` | #987 | P0-6 | OpenSpec Change | 否 |
| A0-06 | `a0-06-release-fact-sheet` | #999 | P0-3 | 直接 PR | 否 |
| A0-07 | `a0-07-windows-release-boundary-audit` | #1000 | P0-4 | 直接 PR | 否 |
| A0-08 | `a0-08-backup-capability-decision` | #1035 | P0-3 | 决策 issue | 否 |
| A0-09 | `a0-09-i18n-inventory-audit` | #990 | P0-5 | 直接 PR | 需要 |
| A0-10 | `a0-10-search-mvp` | #1003 | P0-6 | OpenSpec Change | 需要 |
| A0-11 | `a0-11-data-safety-boundary-statement` | #1001 | P0-4 | 直接 PR | 否 |
| A0-12 | `a0-12-inline-ai-baseline` | #1004 | P0-1 | OpenSpec Change | 需要 |
| A0-13 | `a0-13-toast-app-integration` | #981 | P0-2 | 直接 PR | 需要 |
| A0-14 | `a0-14-settings-general-persistence` | #994 | P0-6 | 直接 PR | 需要 |
| A0-15 | `a0-15-placeholder-ui-closure` | #995 | P0-3 | 直接 PR | 需要 |
| A0-16 | `a0-16-editor-version-slash-i18n` | #991 | P0-5 | 直接 PR | 需要 |
| A0-17 | `a0-17-backup-entry-resolution` | #996 | P0-3 | 决策 issue | 视结论 |
| A0-18 | `a0-18-judge-capability-resolution` | #997 | P0-3 | 决策 issue | 视结论 |
| A0-19 | `a0-19-export-plain-text-labeling` | #998 | P0-3 | 直接 PR | 需要 |
| A0-20 | `a0-20-error-message-humanization` | #983 | P0-2 | 直接 PR | 否 |
| A0-21 | `a0-21-error-surface-closure` | #988 | P0-2 | 直接 PR | 需要 |
| A0-22 | `a0-22-i18n-error-copy-cleanup` | #989 | P0-2 | 直接 PR | 需要 |
| A0-23 | `a0-23-document-size-limit-enforcement` | #984 | P0-6 | 直接 PR | 否 |
| A0-24 | `a0-24-skill-output-validation` | #985 | P0-6 | 直接 PR | 否 |

---

## 五、GitHub Issue 全量追踪

### 已映射到 Change 的 Issue（30 个）

| Issue | 对应 Change | 状态 |
|-------|-----------|------|
| #1030 | G0-01 | 已完成（PR #1037） |
| #1031 | G0-02 | 已完成（PR #1037） |
| #1032 | G0-03 | 已完成（PR #1037） |
| #1033 | G0-04 | 已完成（PR #1037） |
| #1024 | G0-05 | 已完成（PR #1037） |
| #1034 | G0-06 | 已完成（PR #1037） |
| #1035 | A0-08 | 活跃 |
| #986 | A0-01 | 活跃 |
| #992 | A0-02 | 活跃 |
| #993 | A0-03 | 活跃 |
| #1002 | A0-04 | 活跃 |
| #987 | A0-05 | 活跃 |
| #999 | A0-06 | 活跃 |
| #1000 | A0-07 | 活跃 |
| #990 | A0-09 | 活跃 |
| #1003 | A0-10 | 活跃 |
| #1001 | A0-11 | 活跃 |
| #1004 | A0-12 | 活跃 |
| #981 | A0-13 | 活跃 |
| #994 | A0-14 | 活跃 |
| #995 | A0-15 | 活跃 |
| #991 | A0-16 | 活跃 |
| #996 | A0-17 | 活跃 |
| #997 | A0-18 | 活跃 |
| #998 | A0-19 | 活跃 |
| #983 | A0-20 | 活跃 |
| #988 | A0-21 | 活跃 |
| #989 | A0-22 | 活跃 |
| #984 | A0-23 | 活跃 |
| #985 | A0-24 | 活跃 |

### Wave 0.5 Issue（待拆分，6 个；change 目录已建）

| 对应 Change | 任务 | 状态 |
|-------------|------|------|
| G0.5-01 | ESLint `require-describe-in-tests` | change 已建，Issue 待创建 |
| G0.5-02 | 后端 coverage threshold | change 已建，Issue 待创建 |
| G0.5-03 | `format:check` 接入 CI | change 已建，Issue 待创建 |
| G0.5-04 | 审计一键脚本 `review-audit.sh` | change 已建，Issue 待创建 |
| G0.5-05 | E2E 关键路径映射表 | change 已建，Issue 待创建 |
| G0.5-06 | 前端视觉回归测试基础设施 | change 已建，Issue 待创建 |

### 存量迁移 TODO 总控与子 Issue（1 个 umbrella + 7 个待拆分子 Issue）

| 对应 Change | 类型 | 状态 |
|-------------|------|------|
| T-MIG | umbrella change / umbrella issue | change 已建，Issue 待创建 |

### T-MIG 子 Issue（待创建，7 个）

| 子批次 | 优先级 | 任务 | 状态 |
|--------|--------|------|------|
| T-MIG-01 | P0 | scripts/tests 门禁测试迁移 | 待创建 |
| T-MIG-02 | P1 | tests/unit 脚本式 main 迁移 | 待创建 |
| T-MIG-03 | P2 | tests/unit 裸块迁移 | 待创建 |
| T-MIG-04 | P3 | main/src 无 describe 迁移 | 待创建 |
| T-MIG-05 | P4 | tests/integration 迁移 | 待创建 |
| T-MIG-06 | P2 | 浅断言替换 | 待创建 |
| T-MIG-07 | P3 | getByText 占比降低 | 待创建 |

### 无 Change 但仍活跃的 Issue（15 个，#982 已关闭）

| Issue | 标题 | 处置建议 |
|-------|------|---------|
| #982 | A0-20 旧版（重复） | **已关闭** —— #983 是正式版本 |
| #1007 | backend: project/session boundary hardening | Wave 1+ 后端加固，可被 G0-02 gate 检测到 |
| #1008 | backend: preload ipcGateway & runtime validation | Wave 1+ 后端加固，可被 G0-02 gate 检测到 |
| #1009 | backend: shared redaction hardening | Wave 1+ 后端加固 |
| #1010 | backend: CI/discovery/toolchain hardening | Wave 1+ 工具链加固 |
| #810 | fe-visual-noise-reduction | 可被 G0-01/G0-03 门禁覆盖 |
| #735 | recentItems 容错与 OutlinePanel 重构分离 | 历史整合 issue，阻塞直到 Phase 0 结束 |
| #737 | tokenBudget 边界修复路径整合 | 历史整合 issue |
| #738 | command palette recentItems 容错修复路径 | 历史整合 issue |
| #739 | projectAccessGuard 增量改动收敛 | 历史整合 issue |
| #740 | Editor 异常闭环补丁整合 | 历史整合 issue |
| #741 | RAG/Embedding 守卫重叠改动整合 | 历史整合 issue |
| #742 | 主进程复杂度/函数拆分回炉 | 历史整合 issue |
| #743 | 渲染层复杂度重构回炉 | 历史整合 issue |
| #744 | 测试与 lint 清理类改动回炉 | 历史整合 issue |
| #745 | runtime-validation 混合改动拆分重提 | 历史整合 issue |
| #746 | IPC ACL/file payload guard/saveQueue 收敛 | 历史整合 issue |

---

## 六、依赖拓扑图

```text
              ┌─────────────────────────────────────────────────────┐
              │               Wave 0 — 门禁基础设施（已完成）        │
              │  G0-01  G0-02  G0-03  G0-04  G0-05  G0-06          │
              └────────────────────┬────────────────────────────────┘
                                   │
                                   ▼
              ┌─────────────────────────────────────────────────────┐
              │          Wave 0.5 — 审计补丁（制度门禁 + 视觉回归）  │
              │  G0.5-01  G0.5-02  G0.5-03  G0.5-04  G0.5-05      │
              │  G0.5-06（全部无上游依赖，可并行推进）                │
              └────────────────────┬────────────────────────────────┘
                                   │ Wave 0.5 完成后启动止血
                                   ▼
              ┌─────────────────────────────────────────────────────┐
              │            Wave 1 — 无上游依赖（可立即启动）          │
              │  A0-13  A0-20  A0-23  A0-24  A0-08  A0-18          │
              └─────┬─────┬────────────────────────┬────────────────┘
                    │     │                        │
                    ▼     ▼                        ▼
        ┌─────────────────────────┐     ┌─────────────────────┐
        │       Wave 2            │     │   Wave 2 并行        │
        │ A0-02（受益于A0-13）     │     │ A0-03  A0-14        │
        │ A0-09  A0-15            │     │ A0-05  A0-10        │
        └────────┬────────────────┘     └─────────────────────┘
                 │
                 ▼
        ┌─────────────────────────┐
        │       Wave 3            │
        │ A0-16（依赖 A0-09）     │
        │ A0-21（依赖 A0-20）     │
        │ A0-22（依赖 A0-20）     │
        │ A0-17（依赖 A0-08）     │
        └─────────────────────────┘
                 │
                 ▼
        ┌─────────────────────────┐
        │       Wave 4            │
        │ A0-06  A0-07  A0-11    │
        │ A0-19（依赖 A0-04）     │
        └─────────────────────────┘

        ┌───────────────────────────────────────────┐
        │   Parallel OpenSpec（可与 Wave 1-4         │
        │   并行推进 spec 与测试，但代码合并           │
        │   需等上游就绪）                            │
        │ A0-01                                     │
        │ A0-04                                     │
        │ A0-12（依赖 A0-01 完成后启动实现）          │
        └───────────────────────────────────────────┘

        ┌───────────────────────────────────────────┐
        │   Parallel T-MIG（1 个 umbrella change，    │
        │   与 Wave 1-4 并行推进；前置条件 G0.5-01）  │
        │ 子批次：01(P0) → 02(P1) → 03/06(P2) →     │
        │        04/07(P3) → 05(P4)                  │
        │ 每批完成后收紧 ESLint override              │
        └───────────────────────────────────────────┘
```

---

## 七、实现波次详解

### Wave 0（门禁基础设施，最先启动）

| ID | Issue | 任务 | 说明 |
|----|-------|------|------|
| G0-01 | #1030 | 前端 ESLint 门禁扩展 | 2 个新 ESLint 规则 + 阴影类扩展 + Storybook 覆盖 |
| G0-02 | #1031 | 后端 IPC 与服务健壮性门禁 | 2 个新 Guard 脚本 + contract-gate 扩展 |
| G0-03 | #1032 | 前端架构守护门禁 | 1 个 ESLint 规则 + 2 个 Guard |
| G0-04 | #1033 | 资源大小与性能预算门禁 | 2 个 Guard（资源大小 + Bundle 预算） |
| G0-05 | #1024 | Spec-Test 映射门禁 | 1 个 Guard + 测试质量约定 |
| G0-06 | #1034 | 非自动化问题审计协议 | PR template + 审计协议 + 字体 checklist + 速率限制 RFC + `gate:ai-rate-limit` CI 接入 |

**Wave 0 完成标志**：所有新 gate 通过 CI，baseline 已生成，门禁可以阻断增量退化。

### Wave 0.5（审计补丁 — 制度门禁与视觉回归，Wave 0 完成后启动）

> 独立审计发现 Wave 0 虽已建成门禁基础设施，但存在制度层面的漏洞：规范有要求但无机器守门、后端 coverage 门禁不咬人、格式检查未接入 CI、审计工具未脚本化、E2E 映射不透明、视觉回归测试为零。
>
> 详见 `docs/references/testing-excellence-roadmap.md`。

| ID | Issue | 任务 | 说明 | 来源 |
|----|-------|------|------|------|
| G0.5-01 | 待创建（change 已建） | ESLint `require-describe-in-tests` | 测试结构规范自动拦截，存量目录临时 `warn` 豁免 | GAP-8 |
| G0.5-02 | 待创建（change 已建） | 后端 coverage threshold | `vitest.config.core.ts` 添加 `thresholds`，CI 阻断 | GAP-2 |
| G0.5-03 | 待创建（change 已建） | `format:check` 接入 CI | `ci.yml` lint job 新增 step | GAP-3 |
| G0.5-04 | 待创建（change 已建） | 审计一键脚本 `review-audit.sh` | 封装 AGENTS.md §6.4 全部命令 | GAP-6 |
| G0.5-05 | 待创建（change 已建） | E2E 关键路径映射表 | `05-e2e-testing-patterns.md` 新增映射章节 + 空洞评估 | GAP-7 |
| G0.5-06 | 待创建（change 已建） | 前端视觉回归测试基础设施 | Playwright + Storybook 截图对比，Dark/Light 双主题，CI 集成 | 审计发现 |

**Wave 0.5 完成标志**：
1. 新 PR 中无 `describe()` 的测试文件被 ESLint 自动拦截
2. 后端 coverage 下降时 CI 失败
3. 格式不一致时 CI 失败
4. 审计 Agent 可一键执行全部必跑命令
5. 7 条关键路径 ↔ E2E 映射表完整
6. 原语 + 布局 + 核心功能组件有 dark/light 双主题视觉 baseline 截图，样式变更时 CI 失败

### 存量迁移 TODO（以 T-MIG umbrella change 管理 7 个子批次）

> `t-mig-test-structure-migration` 作为 umbrella change 管理以下 7 个子批次。
> 这些迁移任务在 Wave 0.5 完成后启动，可与 A0 止血工作并行推进。
> 前置条件：G0.5-01 ESLint 规则已就位。
> 每批迁移完成后，从 ESLint override 中移除该目录，棘轮只紧不松。

| ID | 优先级 | 范围 | 文件数 | 依赖 |
|----|--------|------|--------|------|
| T-MIG-01 | P0 | `scripts/tests/` 门禁测试 → describe/it | 13 | G0.5-01 |
| T-MIG-02 | P1 | `tests/unit/` async function main → describe/it | 13 | G0.5-01 |
| T-MIG-03 | P2 | `tests/unit/` 裸块 → describe/it | 21 | G0.5-01 |
| T-MIG-04 | P3 | `main/src/` 无 describe → describe/it | 152 | G0.5-01 |
| T-MIG-05 | P4 | `tests/integration/` → describe/it | 87 | G0.5-01 |
| T-MIG-06 | P2 | toBeTruthy/toBeDefined → 具体断言 | 18 处 | 无 |
| T-MIG-07 | P3 | getByText 占比降到 <25% | ~160 处 | 无 |

### Wave 1（无上游依赖，Wave 0.5 后可立即启动）

| ID | Issue | 任务 | 说明 |
|----|-------|------|------|
| A0-13 | #981 | Toast 接入 App | P0-2 基础设施，后续所有 Toast 消费者依赖 |
| A0-20 | #983 | 错误消息统一人话化 | P0-2 映射表，A0-21/A0-22 的硬前置 |
| A0-23 | #984 | 文档 5MB 限制实施 | 独立后端防线 |
| A0-24 | #985 | Skill 输出校验扩展 | 独立后端防线 |
| A0-08 | #1035 | 备份能力真伪核查 | 决策 issue，事实收集可先行 |
| A0-18 | #997 | Judge 决策：接入或降级 | 决策 issue，独立推进 |

### Wave 2（依赖 Wave 1 部分完成）

| ID | Issue | 任务 | 阻断条件 |
|----|-------|------|----------|
| A0-02 | #992 | 自动保存失败可见化 | 受益于 A0-13（Toast），建议 A0-13 先合并 |
| A0-03 | #993 | 渲染进程全局错误兜底 | 无强依赖，但受益于 A0-13 |
| A0-14 | #994 | Settings General 持久化 | 无强依赖 |
| A0-15 | #995 | 占位 UI 收口 | 无强依赖 |
| A0-09 | #990 | i18n 存量 key 核查 | 无强依赖 |
| A0-05 | #987 | Skill Router 否定语境守卫 | 无强依赖 |
| A0-10 | #1003 | 基础全文搜索入口 | 无强依赖 |

### Wave 3（依赖 Wave 1-2 核心完成）

| ID | Issue | 任务 | 阻断条件 |
|----|-------|------|----------|
| A0-16 | #991 | 编辑器/版本/Slash i18n | 依赖 A0-09 核查清单 |
| A0-21 | #988 | 错误展示组件收口 | 依赖 A0-20 映射表 |
| A0-22 | #989 | i18n 错误文案修正 | 依赖 A0-20 映射表 |
| A0-17 | #996 | Backup 决策 | 依赖 A0-08 事实核查 |

### Wave 4（依赖 Wave 1-3 主线完成）

| ID | Issue | 任务 | 阻断条件 |
|----|-------|------|----------|
| A0-06 | #999 | 发布事实表 | 建议等主要能力收口后再编写 |
| A0-07 | #1000 | Windows 首发边界核查 | 独立核查，但建议等主线稳定 |
| A0-11 | #1001 | 数据安全边界声明 | 独立声明 |
| A0-19 | #998 | Export 纯文本诚实标注 | 依赖 A0-04 分级结论 |

### Parallel OpenSpec（可与 Wave 1-4 并行推进 spec 编写与测试）

| ID | Issue | 任务 | 阻断条件 |
|----|-------|------|----------|
| A0-01 | #986 | 禅模式改为真实可编辑 | 无上游依赖，可立即进入实现 |
| A0-04 | #1002 | 导出能力诚实分级 | 无上游依赖 |
| A0-12 | #1004 | Inline AI 从 0 到 1 | 依赖 A0-01 完成后才能启动实现 |

---

## 八、串行关键路径

| 前置任务 | 后续任务 | 必须串行的原因 |
|----------|----------|----------------|
| **Wave 0 全部** | **Wave 0.5 全部** | 制度补丁建立在 Wave 0 基础设施之上 |
| **Wave 0.5 全部** | **Wave 1 全部** | 没有制度门禁兜底，止血后的增量会重新引入同类问题 |
| **G0.5-01** | **T-MIG-01~05** | ESLint 规则未就位时迁移成果无法被机器锁住 |
| A0-01 | A0-12 | 没有真实编辑现场，Inline AI 只能建在幻觉之上 |
| A0-04 | A0-19 | 纯文本诚实标注必须以导出分级结论为依据 |
| A0-08 | A0-17 | Backup 的产品决策必须建立在真实能力核查之上 |
| A0-09 | A0-16 | 先清存量核查，再做编辑器与版本相关补漏 |
| A0-20 | A0-21 | 没有统一映射表，组件收口会反复返工 |
| A0-20 | A0-22 | 没有统一映射表，i18n 修文案缺乏依据 |
| A0-13 | A0-02 | Toast 基础设施未就绪，保存失败无通知通道 |

---

## 九、跨阶段禁穿透规则

以下动作在 Phase 0 未收口前**禁止**启动：

| 禁止动作 | 原因 |
|----------|------|
| Dashboard / Onboarding 大改 | 会把体验优化建立在假能力与错误失语之上 |
| AiPanel / aiService 结构性大拆分 | 会让首发止血失焦 |
| A0-20 未完成前全面推进错误界面视觉重构 | 没有人话映射表，重构只会重复暴露技术码 |
| A0-09 未完成前宣布 i18n 门禁已建立 | 存量未清，增量门禁无意义 |
| KG / Memory 大显化 | 主路径都没顺，护城河可见化只会增加理解负担 |

---

## 十、控制面任务簇登记

以下 CP 任务簇与 Phase 0 并行推进，作为**托底线**防止同类问题再生：

| 控制面任务簇 | 启动时机 | 目标 | 对应 Wave 0 Change |
|-------------|----------|------|-------------------|
| CP-1 增量坏味道阻断 | Wave 0 | 裸字符串、Primitive 绕过、raw token 逃逸门禁 | G0-01 |
| CP-2 视觉验收控制 | Wave 0 | Storybook 构建、PR 截图要求、双语言双主题验收 | G0-06 |
| CP-3 后端契约守护 | Wave 0 | IPC 验证、服务假实现检测 | G0-02 |
| CP-4 架构健康监控 | Wave 0 | ErrorBoundary、Provider 嵌套、文件膨胀检测 | G0-03 |
| CP-5 审计系统改制 | Wave 0 | 审计从流程校对升级为产品 + 控制面双验尸 | G0-06 |

---

## 十一、完成标志

Phase 0 完成的标志不是"所有 PR 已合并"，而是：

1. **门禁全就位**——28 类高频问题的增量全部有自动化或协议覆盖
2. **制度门禁自洽**——测试结构规范有 ESLint 自动拦截、后端 coverage 有阈值、格式检查接入 CI
3. **视觉回归基础设施就位**——前端组件有 dark/light 双主题 baseline 截图，样式变更 CI 自动对比
4. 假能力已实现或隐藏——用户不会再把半成品误判为完整能力
5. 错误体验已人话化——用户看不到技术码
6. 发布边界已诚实——"可打包"不再被误读为"可首发"
7. 基本输入输出防线已建立——搜索可用、保存可靠、Skill 输出有校验
8. i18n 核心路径不露底——中英文切换下主要功能不再裸露硬编码文案

---

## 十二、更新记录

| 日期 | 变更 |
|------|------|
| 2025-07-14 | 全量重建：从 6 个 change 扩展为 24 个 A0 change，重写依赖拓扑与波次编排 |
| 2025-07-14 | 增加 Wave 0 门禁基础设施（6 个 G0 change）；新增 28-Pattern 全覆盖矩阵；新增 GitHub Issue 全量追踪；波次编号调整（原 Wave 1-4 不变，前插 Wave 0） |
| 2026-03-08 | 28-Pattern 矩阵升级为三层执行模型（Tier 1/2/3）；波次表补充 Issue 编号列；Issue 全量追踪从 25 个扩展到 30 个；#982 已关闭标注 |
| 2026-03-08 | G0 系列补强：新增 §二·五 Gate 开发公共约定；G0-02 补充 cross-module-contract-gate 扩展任务（Pattern #7/#19）；G0-03 细化 ARIA-live 检测策略与 baseline 路径；G0-04 对齐报告模式/阻断模式转换机制；G0-05 新增 Tier 2 语义维度支持（S-T2-01~05）；G0-06 强化协议文档交付标准；全部 G0 tasks.md 增加三层执行模型归属声明 |
| 2026-03-09 | Wave 0 收口：G0-01~G0-06 全部标记已完成（PR #1037）；cross-module-contract-gate 扩展 skill-output-validation 和 api-key-format-validation 两个维度；活跃数量从 30 降至 24；同步 scripts/README.md、toolchain.md、coding-standards.md、07-test-command-and-ci-map.md |
| 2026-03-10 | Wave 0 独立审计补丁（#1066）：修正 Issue 计数 31→30；修正 rate-limit gate 描述（已存在于 CI）；PR template `Fixes`→`Closes`；新增 Wave 0.5 层（G0.5-01~G0.5-06）覆盖 GAP-2/3/6/7/8 + 视觉回归测试；新增 T-MIG 存量迁移 TODO 总控（umbrella change 下辖 7 个子批次，286 个测试文件 + 18 处浅断言 + ~160 处 getByText）；更新依赖拓扑图、串行路径、完成标志 |
| 2026-03-11 | 对齐仓库真实状态：G0.5-01~06 全部补齐 `proposal.md` 与 delta spec，EO 中的 Wave 0.5 状态从“仅任务设想”改为“change 已建、Issue 待拆分”；T-MIG 从伪装成 7 个独立 change 调整为 1 个 umbrella change + 7 个子批次 |
