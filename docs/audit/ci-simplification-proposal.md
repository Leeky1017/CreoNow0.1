# CI 简化提案

更新时间：2026-03-04 16:00

> "善战者，无智名，无勇功。"——好的 CI 不是门禁越多越好，而是每道门禁都守住了真正的质量底线。

---

## 文件索引

| § | 章节 | 内容 |
|---|------|------|
| 一 | 现状分析 | CI jobs 清单与问题 |
| 二 | 改革方案 | 删除/保留/新增判决 |
| 三 | Required Checks | 改革后的必选 checks |
| 四 | ci.yml 结构 | 改革后的 YAML 框架 |
| 五 | 新增 Job 实现 | i18n + token lint YAML |
| 六 | dependency-audit | 改为 Weekly Cron |
| 七 | 治理脚本处理 | 需移除/修改的脚本 |
| 八 | coverage-gate 拆分 | 后端覆盖率门禁建议 |
| 九 | ESLint 集成策略 | 替代独立 CI jobs |
| 十 | 实施清单 | 执行步骤 |

---

## 一、现状分析

### 当前 CI 架构

`.github/workflows/ci.yml`：14 个 jobs + 1 个 gate job
`.github/workflows/openspec-log-guard.yml`：治理文档校验
`.github/workflows/merge-serial.yml`：串行合并

**Required checks**：`ci`、`openspec-log-guard`、`merge-serial`

### 14 个 CI jobs 分类

| 类别 | Job | 耗时 | 保护什么 |
|------|-----|------|----------|
| **代码质量** | `lint-and-typecheck` | 6min | 类型安全、代码风格 |
| **代码质量** | `unit-test-core` | 8min | 后端逻辑正确性 |
| **代码质量** | `unit-test-renderer` | 8min | 前端逻辑正确性 |
| **代码质量** | `integration-test` | 5min | 跨模块集成 |
| **代码质量** | `coverage-gate` | 8min | 覆盖率底线 |
| **构建验证** | `storybook-build` | 5min | 组件可渲染 |
| **构建验证** | `windows-e2e` | 20min | 端到端功能 |
| **构建验证** | `windows-build` | 15min | 可打包（仅 push 到 main） |
| **契约守护** | `ipc-acceptance` | 5min | IPC 契约一致性 |
| **契约守护** | `contract-check` | 5min | IPC 契约生成 |
| **契约守护** | `cross-module-check` | 5min | 跨模块依赖对齐 |
| **治理门禁** | `doc-timestamp-gate` | 2min | 文档时间戳 |
| **治理门禁** | `test-discovery-consistency` | 5min | 测试文件被发现 |
| **安全审计** | `dependency-audit` | 6min | 依赖漏洞 |
| **变更检测** | `changes` | 2min | 决定哪些 job 需要运行 |

### openspec-log-guard（独立 workflow）

检查内容：
1. RUN_LOG 存在且格式正确
2. tasks.md 所有复选框已勾选
3. Main Session Audit 存在且字段齐全
4. Independent Review 存在且通过
5. 非 task 分支需要 Skip-Reason

---

## 二、改革方案

### 2.1 移除的 jobs/workflows

| 目标 | 理由 | 行动 |
|------|------|------|
| `openspec-log-guard` workflow | 整个 workflow 服务于已废止的治理文档体系 | **删除整个 workflow** |
| `doc-timestamp-gate` job | 文档时间戳对代码质量零贡献 | **从 ci.yml 中删除** |
| `test-discovery-consistency` job | 有价值但不应阻塞合并 | **改为 `continue-on-error: true`** |
| `dependency-audit` job | 有价值但不应阻塞每个 PR | **改为 weekly cron schedule** |

### 2.2 按需运行的 jobs

以下 jobs 有价值，但不需要在每个 PR 上运行：

| Job | 现状 | 改为 |
|-----|------|------|
| `ipc-acceptance` | 每个代码变更都运行 | 仅当 `packages/shared/` 或 IPC 相关文件变更时运行 |
| `contract-check` | 每个代码变更都运行 | 仅当 `packages/shared/` 或 IPC 相关文件变更时运行 |
| `cross-module-check` | 每个代码变更都运行 | 仅当跨模块边界文件变更时运行 |

### 2.3 新增的 jobs

| Job | 作用 | 触发条件 | 阻塞合并 |
|-----|------|----------|----------|
| `i18n-completeness` | 扫描 `renderer/src/` 中的硬编码字符串（CJK + 英文裸文本） | renderer 文件变更 | **是** |
| `token-compliance` | 扫描非语义化 Tailwind 色值 | renderer 文件变更 | **是** |

> **推荐方案变更**：`i18n-completeness` 和 `token-compliance` 均建议以 ESLint 自定义规则实现，
> 集成到现有 `lint-and-typecheck` job，**不再作为独立 CI job**。
> 这样既利用 AST 级精准检测，又不增加 CI job 数量。

### 2.4 不变的 jobs

| Job | 理由 |
|-----|------|
| `changes` | 变更检测是基础设施 |
| `lint-and-typecheck` | 类型安全核心保障 |
| `unit-test-core` | 后端质量核心保障 |
| `unit-test-renderer` | 前端质量核心保障 |
| `integration-test` | 集成正确性保障 |
| `coverage-gate` | 覆盖率底线保障 |
| `storybook-build` | 前端可渲染保障 |
| `windows-e2e` | 端到端保障 |
| `windows-build` | 可打包保障 |
| `merge-serial` workflow | 串行合并防冲突 |

---

## 三、改革后的 Required Checks

| 改前 | 改后 |
|------|------|
| `ci` ✅ | `ci` ✅ |
| `openspec-log-guard` ✅ | **删除** ❌ |
| `merge-serial` ✅ | `merge-serial` ✅ |

GitHub Branch Protection 设置需要同步更新，移除 `openspec-log-guard`。

---

## 四、改革后的 ci.yml 结构

```
ci.yml
├── changes (变更检测)
├── lint-and-typecheck (代码质量)
├── unit-test-core (后端测试)
├── unit-test-renderer (前端测试)
├── integration-test (集成测试)
├── coverage-gate (覆盖率)
├── i18n-completeness (新增 - 前端)
├── token-compliance (新增 - 前端)
├── storybook-build (构建验证)
├── windows-e2e (端到端)
├── windows-build (打包 - 仅 push)
├── ipc-acceptance (按需 - IPC 变更时)
├── contract-check (按需 - IPC 变更时)
├── cross-module-check (按需 - 跨模块变更时)
├── test-discovery-consistency (不阻塞 - continue-on-error)
└── ci (gate)
```

对比改前：14 jobs → 14 jobs（-2 doc-timestamp-gate/dependency-audit，+2 前端质量 i18n/token）
实际阻塞合并的 check：从 3 个 → 2 个
dependency-audit：移到 weekly cron，不计入 PR 流程

---

## 五、新增 Job 实现方案

### 5.1 i18n-completeness

> **重要修正**：原方案使用 shell `grep` 仅扫描 CJK 字符（`[\x{4e00}-\x{9fff}...]`），这存在致命缺陷——
> 将中文硬编码改为英文硬编码即可绕过检测（实际上英文硬编码的问题同样严重，甚至更多）。
>
> **正确方案**：使用 ESLint AST 级检测（`eslint-plugin-i18next`），集成到现有 `lint-and-typecheck` job，
> **无需新增独立 CI job**。ESLint 可以检测所有语言的裸字符串字面量，而非仅限 CJK。

#### 方案 A（推荐）：ESLint 规则集成

```bash
# 安装
pnpm add -D eslint-plugin-i18next

# .eslintrc 或 eslint.config.js 中配置
# rules:
#   "i18next/no-literal-string": ["warn", {
#     "ignore": ["^[A-Z_]+$", "^\\d+$"],
#     "ignoreCallee": ["console.*", "logger.*"],
#     "ignoreAttribute": ["data-testid", "className", "key", "id", "name", "type"]
#   }]
```

优势：
- AST 级别解析，不会被字符编码绕过
- 区分 JSX 文本、属性值、变量赋值等上下文
- 集成到已有 `pnpm lint`，无额外 CI 成本
- 可渐进采用（先 `warn` 后 `error`）

#### 方案 B（过渡期补充）：增强版 Shell 扫描

如需在 ESLint 规则就绪前先行守护，可用以下增强版脚本（同时检测中文和英文裸字符串），
但这只是临时方案，长期应迁移到 ESLint。

```yaml
  i18n-completeness:
    runs-on: ubuntu-latest
    needs: changes
    if: needs.changes.outputs.desktop_changed == 'true'
    timeout-minutes: 3
    steps:
      - uses: actions/checkout@v4
        with:
          persist-credentials: false
      - name: Check hardcoded strings (CJK + bare English)
        run: |
          # 扫描 renderer/src 中的 .tsx/.ts 文件（排除测试和 stories）
          # 检测 CJK 字符串 + JSX 中的英文裸文本
          FILES=$(find apps/desktop/renderer/src \
            -name '*.tsx' -o -name '*.ts' | \
            grep -v '\.test\.' | grep -v '\.spec\.' | grep -v '\.stories\.')

          # 1. CJK 硬编码
          CJK_VIOLATIONS=$(echo "$FILES" | \
            xargs grep -Pn '[\x{4e00}-\x{9fff}\x{3040}-\x{309f}\x{30a0}-\x{30ff}]' \
            2>/dev/null || true)

          # 2. JSX 中的英文裸文本（简化检测，会有误报）
          # 仅作为信号，不作为 CI 阻塞
          
          if [ -n "$CJK_VIOLATIONS" ]; then
            echo "❌ Found hardcoded CJK strings in production files:"
            echo "$CJK_VIOLATIONS"
            echo ""
            echo "Please use i18n (useTranslation / t()) instead."
            exit 1
          fi
          echo "✅ No hardcoded CJK strings found."
          echo ""
          echo "⚠️  Note: This check only catches CJK characters."
          echo "    English hardcoded strings require ESLint (eslint-plugin-i18next)."
```

### 5.2 token-compliance

```yaml
  token-compliance:
    runs-on: ubuntu-latest
    needs: changes
    if: needs.changes.outputs.desktop_changed == 'true'
    timeout-minutes: 3
    steps:
      - uses: actions/checkout@v4
        with:
          persist-credentials: false
      - name: Check raw Tailwind color usage
        run: |
          # 扫描 .tsx 文件中的 Tailwind 原始色值
          # 允许: bg-surface, text-on-surface 等语义化 token
          # 禁止: bg-blue-500, text-gray-300 等原始色值
          RAW_COLORS=$(find apps/desktop/renderer/src \
            -name '*.tsx' | \
            grep -v '\.test\.' | grep -v '\.spec\.' | grep -v '\.stories\.' | \
            xargs grep -Pn \
            '(bg|text|border|ring|shadow|outline|fill|stroke)-(red|blue|green|yellow|purple|pink|indigo|violet|cyan|teal|emerald|lime|amber|orange|fuchsia|rose|sky|slate|gray|zinc|neutral|stone|warm)-\d' \
            2>/dev/null || true)
          
          if [ -n "$RAW_COLORS" ]; then
            echo "❌ Found raw Tailwind color values in production files:"
            echo "$RAW_COLORS"
            echo ""
            echo "Please use semantic Design Tokens instead."
            echo "See: design/DESIGN_DECISIONS.md"
            exit 1
          fi
          echo "✅ No raw Tailwind color values found."
```

---

## 六、dependency-audit 改为 Weekly Cron

```yaml
# .github/workflows/dependency-audit.yml (新文件)
name: Dependency Audit (Weekly)
on:
  schedule:
    - cron: '0 9 * * 1'  # 每周一 09:00 UTC
  workflow_dispatch:

jobs:
  audit:
    runs-on: ubuntu-latest
    timeout-minutes: 6
    steps:
      - uses: actions/checkout@v4
      - uses: ./.github/actions/setup-node-pnpm
      - name: Supply chain audit (high+)
        run: pnpm audit --audit-level high
```

---

## 七、需要移除/修改的治理脚本

| 脚本 | 作用 | 行动 |
|------|------|------|
| `scripts/check_doc_timestamps.py` | doc-timestamp-gate 使用 | **可保留但不在 CI 中调用** |
| `scripts/validate_main_session_audit_ci.py` | openspec-log-guard 使用 | **可删除** |
| `scripts/validate_independent_review_ci.py` | openspec-log-guard 使用 | **可删除** |
| `scripts/agent_pr_preflight.py` | PR 预检（含 RUN_LOG 检查） | **简化**：移除 RUN_LOG/Rulebook 检查 |
| `scripts/independent_review_record.sh` | 生成 review .md 文件 | **可删除** |
| `scripts/main_audit_resign.sh` | Main Session Audit 重签 | **可删除** |

保留不变的脚本：
- `scripts/agent_worktree_setup.sh` — worktree 仍然有用
- `scripts/agent_worktree_cleanup.sh` — 清理仍然有用
- `scripts/agent_pr_automerge_and_sync.sh` — auto-merge 仍然有用
- `scripts/contract-generate.ts` — IPC 契约生成
- `scripts/cross-module-contract-gate.ts` — 跨模块检查
- `scripts/lint-ratchet.ts` — lint 预算
- `scripts/run-discovered-tests.ts` — 测试发现
- `scripts/wsl_storybook_url.sh` — Storybook URL

---

## 八、coverage-gate 拆分建议

当前 `coverage-gate` job 仅执行 `pnpm test:coverage:desktop`（覆盖前端），后端覆盖率未纳入 CI 门禁。

建议拆分为：

| Job | 命令 | 覆盖范围 |
|-----|------|----------|
| `coverage-gate-renderer` | `pnpm test:coverage:renderer` | 前端（renderer/） |
| `coverage-gate-core` | `pnpm test:coverage:core` | 后端（main/） |

或作为同一个 job 的两个 step：

```yaml
  coverage-gate:
    steps:
      - name: Frontend coverage
        run: pnpm test:coverage:renderer
      - name: Backend coverage
        run: pnpm test:coverage:core
```

后端有 4 个模块零测试（search/fts、stats、judge、shared/concurrency），拆分后可精准暴露盲区。

---

## 九、ESLint 集成策略（替代独立 CI jobs）

i18n 和 token 合规检查均建议以 ESLint 规则实现，集成到已有的 `lint-and-typecheck` job：

| 检查项 | ESLint 方案 | 备注 |
|--------|------------|------|
| i18n 硬编码 | `eslint-plugin-i18next` (`no-literal-string`) | AST 级，所有语言 |
| Token 逃逸 | 自定义 ESLint 规则或 `eslint-plugin-tailwindcss` | 检测 `bg-red-600` 等原始色值 |
| shadow 双轨 | Token 合规规则同时覆盖 | 检测 `shadow-lg` 等非 token 阴影 |

这样的好处：
1. **零新增 CI jobs**——lint-and-typecheck 已有，直接扩展规则
2. **AST 精准度**——不会被字符编码绕过
3. **IDE 实时反馈**——开发时即刻看到违规，无需等 CI
4. **渐进采用**——先 `warn` 不阻塞，稳定后升级为 `error`

---

## 十、实施清单

1. [ ] 删除 `.github/workflows/openspec-log-guard.yml`
2. [ ] 从 ci.yml 中移除 `doc-timestamp-gate` job
3. [ ] 从 ci.yml 中移除 `dependency-audit` job
4. [ ] 创建 `.github/workflows/dependency-audit.yml`（weekly cron）
5. [ ] 在 ci.yml 中将 `test-discovery-consistency` 改为 `continue-on-error: true`
6. [ ] 在 ci.yml changes job 中增加 `ipc_changed` 输出
7. [ ] 对 `ipc-acceptance`、`contract-check`、`cross-module-check` 增加 ipc_changed 条件
8. [ ] 在 ci.yml 中新增 `i18n-completeness` job
9. [ ] 在 ci.yml 中新增 `token-compliance` job
10. [ ] 更新 ci gate job 的 needs 列表
11. [ ] 在 GitHub Branch Protection 中移除 `openspec-log-guard` required check
12. [ ] 简化 `scripts/agent_pr_preflight.py`（移除 RUN_LOG/Rulebook 检查）

---

> "工欲善其事，必先利其器。"——CI 是我们的器，但器多则钝。
