# CI 简化提案

更新时间：2026-03-04

> "善战者，无智名，无勇功。"——好的 CI 不是门禁越多越好，而是每道门禁都守住了真正的质量底线。

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
| `i18n-completeness` | 扫描 `renderer/src/` 中的硬编码中日韩字符 | renderer 文件变更 | **是** |
| `token-compliance` | 扫描非语义化 Tailwind 色值 | renderer 文件变更 | **是** |

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

对比改前：14 jobs → 13 jobs（-1 doc-timestamp-gate，+2 前端质量）
实际阻塞合并的 check：从 3 个 → 2 个
dependency-audit：移到 weekly cron，不计入 PR 流程

---

## 五、新增 Job 实现方案

### 5.1 i18n-completeness

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
      - name: Check hardcoded CJK strings
        run: |
          # 扫描 renderer/src 中的 .tsx/.ts 文件（排除测试和 stories）
          # 查找包含 CJK 字符的字符串字面量
          VIOLATIONS=$(find apps/desktop/renderer/src \
            -name '*.tsx' -o -name '*.ts' | \
            grep -v '\.test\.' | grep -v '\.spec\.' | grep -v '\.stories\.' | \
            xargs grep -Pn '[\x{4e00}-\x{9fff}\x{3040}-\x{309f}\x{30a0}-\x{30ff}]' \
            --include='*.tsx' --include='*.ts' \
            2>/dev/null || true)
          
          if [ -n "$VIOLATIONS" ]; then
            echo "❌ Found hardcoded CJK strings in production files:"
            echo "$VIOLATIONS"
            echo ""
            echo "Please use i18n (useTranslation / t()) instead."
            exit 1
          fi
          echo "✅ No hardcoded CJK strings found."
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

## 八、实施清单

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
