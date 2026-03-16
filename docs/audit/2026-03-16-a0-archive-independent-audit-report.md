# A0 系列 archived changes 独立审计报告

> 审计日期：2026-03-16
> 审计角色：独立审计 Agent
> 审计范围：`openspec/changes/archive/a0-01-*` ～ `a0-24-*`
> 审计结论：**REJECT**

> 《韩非子》有言：“循名而责实。”
> 本次审计所问者，不是“这些 change 当年是否做过”，而是“今天回头再看，这些 archive 是否仍能自证其名、承其事实、可供后人复核”。

---

## 索引

- [一、执行摘要](#summary)
- [二、审计方法](#method)
- [三、新增：功能性 / 代码正确性复核](#functional)
- [四、问题分层](#tiering)
- [五、逐项审计结论](#findings)
- [六、按问题类型汇总](#patterns)
- [七、最终 verdict](#verdict)
- [八、具体整改计划](#plan)
- [九、附录：本次重点复核文件](#appendix)

---

<a id="summary"></a>
## 一、执行摘要

本次对 `openspec/changes/archive` 下 **24 个 A0 系列 archived change** 的独立审计，结论并不乐观：

- **24 / 24** 个 change 至少存在 1 项问题
- 问题类型并不完全相同，但高度集中于以下五类：
  1. **归档闭环不完整**：`tasks.md` 中仍保留未勾选的自查表/验收映射表
  2. **canonical spec 未吸收 delta 行为**：实现已落地，但主规范仍失语
  3. **归档引用失效**：归档后仍引用 `openspec/changes/<change>/...` 活跃路径，或引用当前仓库中不存在的文件路径
  4. **决策/事实文档陈旧**：archive 中的结论与当前仓库实现或后续事实表出现漂移
  5. **测试策略或文件索引漂移**：文档里写的测试入口、i18n key、路径、命名空间与当前仓库不再一致

### 总体判断

这批 A0 archive **不能被判定为“都没问题”**。更准确地说：

- 有些 change 的**功能本身已经落地**，但 archive 文档和 canonical spec 没有完成“名实归一”
- 有些 change 的**归档文档本身就没有收口干净**
- 还有一批 change 的**历史证据链已经断裂或陈旧**，不能再被视为可靠的审计依据

---

<a id="method"></a>
## 二、审计方法

本次审计采用“archive 文档 + canonical spec + 当前实现”三线交叉法，重点检查：

1. `proposal.md` / `tasks.md` / delta `spec.md` / `decision.md` 是否自洽
2. `tasks.md` 是否真正达到“可归档”状态
3. archive 中定义的行为是否已经沉淀到 `openspec/specs/*/spec.md`
4. archive 中引用的路径、测试文件、上游 change、i18n 命名空间是否仍然有效
5. 决策类 / 事实类文档是否已被当前实现或后续事实表推翻

### 本次使用的主要命令

```bash
scripts/review-audit.sh L main

rg -n "\[ \]" openspec/changes/archive/a0-*/*.md
rg -n "openspec/changes/a0-" openspec/changes/archive/a0-* -S
rg -n "AppToastProvider|toast|backupInterval|Inline AI|mod\+K|isNegated|getHumanErrorMessage|SKILL_OUTPUT_INVALID" openspec/specs apps/desktop/main/src apps/desktop/renderer/src docs/release -S
python3 - <<'PY'
# 统计 tasks.md 中未闭环项、失效引用、陈旧状态语
PY
```

---

<a id="functional"></a>
## 三、新增：功能性 / 代码正确性复核

为回应“是否真的把功能实现了、实现后是否还有代码层问题”的审计要求，本次在 archive / spec / docs 之外，补做了一轮**功能性与代码正确性复核**。

### 3.1 已执行的运行时 / 测试验证

以下验证命令为本次审计实际执行，且结果已核对：

```bash
# Renderer / UI 侧关键功能测试
pnpm -C apps/desktop exec vitest run \
  renderer/src/features/zen-mode/ZenMode.test.tsx \
  renderer/src/__tests__/autosave-visibility.test.tsx \
  renderer/src/lib/globalErrorHandlers.test.ts \
  renderer/src/features/search/SearchPanel.test.tsx \
  renderer/src/features/search/__tests__/search-panel-navigation.test.tsx \
  renderer/src/features/editor/InlineAi.test.tsx \
  renderer/src/components/providers/AppToastProvider.test.tsx \
  renderer/src/features/placeholder-ui-closure.test.tsx \
  renderer/src/features/settings-dialog/SettingsGeneral.backup.test.tsx \
  renderer/src/features/export/ExportDialog.test.tsx \
  renderer/src/lib/errorMessages.test.ts \
  renderer/src/lib/__tests__/error-surface-closure.guard.test.ts \
  renderer/src/i18n/__tests__/i18n-error-copy-cleanup.guard.test.ts

# Main / service / IPC 侧关键功能测试
pnpm desktop:ensure-native-node-abi
pnpm -C apps/desktop exec vitest run --config tests/unit/main/vitest.node.config.ts \
  main/src/services/export/__tests__/export-pdf.test.ts \
  main/src/services/skills/__tests__/skillRouter.negation.test.ts \
  main/src/ipc/__tests__/file-save-size-limit.test.ts \
  main/src/services/skills/__tests__/skillOutputValidation.test.ts

# judge / search 的 TSX 式验证
pnpm exec tsx apps/desktop/main/src/services/ai/__tests__/judge-pass-state.test.ts && echo JUDGE_PASS_OK
pnpm exec tsx apps/desktop/main/src/services/ai/__tests__/judge-fallback-partial-check.test.ts && echo JUDGE_FALLBACK_OK
pnpm exec tsx apps/desktop/tests/integration/search/fts-query-panel.test.ts && echo SEARCH_FTS_QUERY_OK

# Independent audit agent 强制命令（本地核验）
bash -n scripts/agent_pr_automerge_and_sync.sh && echo BASH_N_OK
pytest -q scripts/tests
test -x scripts/agent_pr_automerge_and_sync.sh && echo EXEC_OK
```

### 3.2 本轮验证结果

- Renderer 关键功能测试：**13 files / 173 tests passed**
- Main 关键功能测试：**4 files / 55 tests passed**
- Judge 规则降级验证：`JUDGE_PASS_OK`、`JUDGE_FALLBACK_OK`
- Search FTS 查询验证：`SEARCH_FTS_QUERY_OK`
- scripts Python 测试：**49 passed**
- shell/执行位检查：`BASH_N_OK`、`EXEC_OK`

#### 环境备注

第一次执行 `export-pdf.test.ts` 时，出现 `better-sqlite3` Node ABI 不匹配，错误表现为：

- `NODE_MODULE_VERSION 143` vs runtime `NODE_MODULE_VERSION 127`
- 导致 PDF 导出测试无法初始化内存数据库

此问题在执行 `pnpm desktop:ensure-native-node-abi` 后已修复；修复后 `export-pdf.test.ts` 通过。
因此本次将其归类为**本地运行环境问题**，而非 A0-04 / A0-19 的产品功能缺陷。

### 3.3 功能实现状态矩阵

| Change | 类型 | 当前功能状态 | 本次代码/测试证据 | 主要实现问题 |
| --- | --- | --- | --- | --- |
| A0-01 | runtime | 已实现 | `ZenMode.tsx`、`ZenMode.test.tsx` | canonical editor spec 与 factsheet 仍写旧口径 |
| A0-02 | runtime | 已实现 | `SaveIndicator.tsx`、`useToastIntegration.ts`、`autosave-visibility.test.tsx` | archive 契约命名与当前实现命名空间漂移 |
| A0-03 | runtime | 已实现 | `globalErrorHandlers.ts`、`main.tsx`、`globalErrorHandlers.test.ts` | 接口/IPC 名称漂移，archive 与 factsheet 过时 |
| A0-04 | runtime | 已实现 | `exportService.ts`、`export-pdf.test.ts` | tasks 自查表未闭环 |
| A0-05 | runtime | 已实现 | `skillRouter.ts`、`skillRouter.negation.test.ts` | canonical spec / factsheet 未同步 |
| A0-06 | doc artifact | 文档存在但内容失真 | `docs/release/v0.1-fact-sheet.md` | 事实表未持续更新，已被后续实现推翻多处结论 |
| A0-07 | doc artifact | 文档存在 | `docs/release/v0.1-windows-boundary.md` | archive 要求未沉淀入 canonical spec |
| A0-08 | decision artifact | 结论部分过时 | `decision.md`、`SettingsDialog.tsx`、`preferences.ts` | “backupInterval 未持久化”已被当前实现推翻 |
| A0-09 | doc artifact | 产物存在 | `i18n-inventory-checklist.md` | archive 输出路径仍指向活跃目录 |
| A0-10 | runtime | 已实现 | `SearchPanel.test.tsx`、`search-panel-navigation.test.tsx`、`fts-query-panel.test.ts` | archive 测试路径 / 证据引用不严谨 |
| A0-11 | doc artifact | 文档存在 | `docs/release/v0.1-data-safety-boundary.md` | proposal 路径失效，canonical spec 未吸收 |
| A0-12 | runtime | 已实现 | `InlineAi.test.tsx`、`EditorPane.tsx`、`InlineAiInput.tsx` / `InlineAiDiffPreview.tsx` | archive 声明的测试/Story 文件缺失，`generating` 与 `loading` 口径漂移 |
| A0-13 | runtime | 已实现 | `App.tsx`、`AppToastProvider.tsx`、`AppToastProvider.test.tsx` | 行为未沉淀进 canonical spec |
| A0-14 | runtime | 已实现 | `SettingsDialog.tsx`、`preferences.ts` | 持久化 key 写错；tasks 含源码扫描式反模式测试 |
| A0-15 | runtime | 已实现 | `placeholder-ui-closure.test.tsx`、`SettingsAccount.tsx`、`ChatHistory.tsx` | i18n namespace / 文件路径 / 占位语漂移 |
| A0-16 | runtime/docs | 已实现 | `slashCommands.ts`、`features/version-history/*` | archive 仍引活跃路径，且大量源码字符串扫描式测试 |
| A0-17 | decision executed | 已执行 | `SettingsGeneral.tsx`、`SettingsGeneral.backup.test.tsx` | 归档任务未闭环，decision / code 注释仍指向 dead path |
| A0-18 | decision executed | 已执行 | `judgeService.ts`、`judgeQualityService.ts`、Judge TSX tests | 决策文档仍写“待 Owner 审批”，自查表未闭环 |
| A0-19 | runtime | 已实现 | `ExportDialog.tsx`、`ExportDialog.test.tsx`、`ExportDialog.stories.tsx` | tasks 自查表未闭环 |
| A0-20 | runtime | 已实现 | `errorMessages.ts`、`errorMessages.test.ts` | 行为未进入 canonical `ipc/spec.md` |
| A0-21 | runtime | 已实现 | `CommandPalette.tsx`、`error-surface-closure.guard.test.ts` | namespace / 测试路径漂移，canonical workbench spec 未吸收 |
| A0-22 | runtime | 已实现 | `i18n-error-copy-cleanup.guard.test.ts`、`QualityPanel.tsx` | 测试路径漂移，canonical workbench spec 未吸收 |
| A0-23 | runtime | 已实现 | `documentCoreService.ts`、`file.ts`、`file-save-size-limit.test.ts` | archive 仍指向旧 `utils/errorMessages.ts` 路径 |
| A0-24 | runtime | 已实现 | `skillExecutor.ts`、`skillOutputValidation.test.ts`、IPC contract | canonical `skill-system/spec.md` 未吸收，archive 路径陈旧 |

### 3.4 功能性层面的总判断

若只问“这些 archived changes 对应的功能，今天在代码里还在不在、能不能跑”：
**大多数运行时功能是存在的，而且关键样例测试本次也确实跑通了。**

但若进一步问“这些 archive 能不能准确描述现状，并作为后续实现 / 审计的可靠基线”：
**答案仍然是否定的。**

这意味着当前 A0 archive 的主要问题，并不是“24 个功能都没做”，而是：

1. **功能做了，但 archive 没写对 / 没写完**
2. **功能做了，但 canonical spec 没跟上**
3. **决策做了，但 decision / factsheet 没更新成当前事实**

---

<a id="tiering"></a>
## 四、问题分层

### 高优先级问题（影响事实正确性 / 主规范可信度）

- A0-01 `zen-mode-editable`
- A0-03 `renderer-global-error-fallback`
- A0-05 `skill-router-negation-guard`
- A0-06 `release-fact-sheet`
- A0-08 `backup-capability-decision`
- A0-12 `inline-ai-baseline`
- A0-17 `backup-entry-resolution`
- A0-20 `error-message-humanization`
- A0-21 `error-surface-closure`
- A0-22 `i18n-error-copy-cleanup`
- A0-24 `skill-output-validation`

### 中优先级问题（归档卫生 / 引用漂移 / 契约漂移）

- A0-02 `autosave-visible-failure`
- A0-07 `windows-release-boundary-audit`
- A0-09 `i18n-inventory-audit`
- A0-13 `toast-app-integration`
- A0-14 `settings-general-persistence`
- A0-15 `placeholder-ui-closure`
- A0-16 `editor-version-slash-i18n`
- A0-18 `judge-capability-resolution`

### 低优先级问题（实现大体正确，但归档收口不完整）

- A0-04 `export-honest-grading`
- A0-10 `search-mvp`
- A0-11 `data-safety-boundary-statement`
- A0-19 `export-plain-text-labeling`
- A0-23 `document-size-limit-enforcement`

---

<a id="findings"></a>
## 五、逐项审计结论

> 说明：以下每项均给出本次审计认定的**核心问题**；并非每项都“功能无效”，但每项都至少存在一项 archive / spec / 引用层面的缺陷，因此总体 verdict 一律记为 `ISSUE`。

### A0-01 `a0-01-zen-mode-editable` — ISSUE

**核心问题**：
- archive delta 已要求禅模式改为真实可编辑，但 canonical `openspec/specs/editor/spec.md` 仍保留“静态段落 + 假光标”旧口径
- `docs/release/v0.1-fact-sheet.md` 仍把禅模式标为“❌ 未实现 / 不可编辑”

**影响**：主规范与事实表均落后于实现，后续读者会误判 Zen Mode 仍是假 UI。

**证据**：
- archive delta：`openspec/changes/archive/a0-01-zen-mode-editable/specs/editor/spec.md`
- 当前实现：`apps/desktop/renderer/src/features/zen-mode/ZenMode.tsx`
- canonical spec：`openspec/specs/editor/spec.md`
- factsheet：`docs/release/v0.1-fact-sheet.md`

### A0-02 `a0-02-autosave-visible-failure` — ISSUE

**核心问题**：
- archive 中约定的是 `autosave.*` 文案/状态契约，但当前实现实际使用 `workbench.saveIndicator.*`、`toast.save.*`、`toast.autosave.*`
- 事实表仍保留“autosave 失败仅 console 输出”的旧结论
- archive 行为没有以当前真实命名回写到 canonical spec

**影响**：archive 契约与当前实现发生漂移，事实表也已过时。

**证据**：
- archive：`openspec/changes/archive/a0-02-autosave-visible-failure/*`
- 当前实现：`apps/desktop/renderer/src/components/layout/SaveIndicator.tsx`、`apps/desktop/renderer/src/hooks/useToastIntegration.ts`
- factsheet：`docs/release/v0.1-fact-sheet.md`

### A0-03 `a0-03-renderer-global-error-fallback` — ISSUE

**核心问题**：
- archive delta / tasks 仍写旧接口：`installGlobalErrorHandlers({ onError })` 与 `log:renderer-error`
- 当前实现已演化为 `installGlobalErrorHandlers({ onLog, onToast })` 与 `app:renderer:logerror`
- canonical `workbench/spec.md` 未吸收该行为，factsheet 也仍写“renderer 缺全局兜底”

**影响**：archive 对当前实现的描述已经失真，主规范与事实表同步失败。

**证据**：
- archive：`openspec/changes/archive/a0-03-renderer-global-error-fallback/*`
- 当前实现：`apps/desktop/renderer/src/lib/globalErrorHandlers.ts`、`apps/desktop/renderer/src/main.tsx`、`apps/desktop/main/src/ipc/rendererLog.ts`
- factsheet：`docs/release/v0.1-fact-sheet.md`

### A0-04 `a0-04-export-honest-grading` — ISSUE

**核心问题**：
- 主实现与 canonical `document-management/spec.md` 大体对齐
- 但 `tasks.md` 的自查/验收映射表仍全部未勾选

**影响**：更偏向归档闭环缺陷，而非当前实现缺陷。

**证据**：
- archive：`openspec/changes/archive/a0-04-export-honest-grading/tasks.md`
- 当前实现：`apps/desktop/main/src/services/export/exportService.ts`
- 当前测试：`apps/desktop/main/src/services/export/__tests__/export-pdf.test.ts`

### A0-05 `a0-05-skill-router-negation-guard` — ISSUE

**核心问题**：
- `isNegated()` 与否定语境守卫已经实现
- 但 canonical `openspec/specs/skill-system/spec.md` 仍停留在旧版关键词路由逻辑
- factsheet 也仍把该能力记为未实现

**影响**：实现、archive、事实表、主规范四者没有对齐。

**证据**：
- archive：`openspec/changes/archive/a0-05-skill-router-negation-guard/specs/skill-system/spec.md`
- 当前实现：`apps/desktop/main/src/services/skills/skillRouter.ts`
- 当前测试：`apps/desktop/main/src/services/skills/__tests__/skillRouter.negation.test.ts`
- factsheet：`docs/release/v0.1-fact-sheet.md`

### A0-06 `a0-06-release-fact-sheet` — ISSUE

**核心问题**：
- A0-06 自己要求事实表是“活文档”，但当前 `docs/release/v0.1-fact-sheet.md` 已包含多条过时结论（如 A0-01、A0-02、A0-05 等）
- `tasks.md` 的验收映射表仍未闭环

**影响**：事实表本身已失去“事实表”的可信度，属于系统性口径失真。

**证据**：
- archive：`openspec/changes/archive/a0-06-release-fact-sheet/*`
- 事实表：`docs/release/v0.1-fact-sheet.md`

### A0-07 `a0-07-windows-release-boundary-audit` — ISSUE

**核心问题**：
- `tasks.md` 验收映射表全部 `[ ]`
- delta 要求没有沉淀进 canonical `workbench/spec.md`

**影响**：发布边界文档虽然存在，但 archive 不足以自证“已验收完成”，主规范也不能独立表达该要求。

**证据**：
- archive：`openspec/changes/archive/a0-07-windows-release-boundary-audit/*`
- 产物：`docs/release/v0.1-windows-boundary.md`
- canonical spec：`openspec/specs/workbench/spec.md`

### A0-08 `a0-08-backup-capability-decision` — ISSUE

**核心问题**：
- proposal/tasks 里写了错误的源码路径（如 `features/settings/`、`renderer/src/locales/`）
- `tasks.md` 验收映射表未闭环
- `decision.md` 中“backupInterval 未持久化”的结论已被当前实现推翻：现在已存在 `PreferenceStore` 读写
- canonical `document-management/spec.md` 未吸收这条治理要求

**影响**：archive 既有路径错误，也有事实过时，容易误导后续决策。

**证据**：
- archive：`openspec/changes/archive/a0-08-backup-capability-decision/*`
- 当前实现：`apps/desktop/renderer/src/features/settings-dialog/SettingsDialog.tsx`、`apps/desktop/renderer/src/lib/preferences.ts`

### A0-09 `a0-09-i18n-inventory-audit` — ISSUE

**核心问题**：
- `tasks.md` 仍把输出文件写成活跃路径：`openspec/changes/a0-09-i18n-inventory-audit/i18n-inventory-checklist.md`
- 当前真实文件已经在 archive 内：`openspec/changes/archive/a0-09-i18n-inventory-audit/i18n-inventory-checklist.md`
- canonical `workbench/spec.md` 未吸收这条审计 requirement

**影响**：archive 引用失真，主规范失语。

**证据**：
- archive：`openspec/changes/archive/a0-09-i18n-inventory-audit/*`
- 实际产物：`openspec/changes/archive/a0-09-i18n-inventory-audit/i18n-inventory-checklist.md`

### A0-10 `a0-10-search-mvp` — ISSUE

**核心问题**：
- proposal 使用 `docs/audit/amp/02-*` 这种不可复核的通配符证据引用
- `tasks.md` 验收映射表未闭环
- tasks 里列出的若干测试路径在当前仓库并不存在

**影响**：搜索功能本体与当前 canonical spec / 实现大体对齐，但 archive 证据链不够可执行、可复盘。

**证据**：
- archive：`openspec/changes/archive/a0-10-search-mvp/*`
- 当前实现：`apps/desktop/renderer/src/config/shortcuts.ts`、`apps/desktop/renderer/src/surfaces/surfaceRegistry.ts`
- canonical spec：`openspec/specs/search-and-retrieval/spec.md`

### A0-11 `a0-11-data-safety-boundary-statement` — ISSUE

**核心问题**：
- proposal 引用了当前不存在的路径：`apps/desktop/main/src/database/`
- `tasks.md` 验收映射表未闭环
- canonical `workbench/spec.md` 未吸收“数据安全边界声明” requirement

**影响**：archive 回溯路径断裂，主规范无法表达该约束。

**证据**：
- archive：`openspec/changes/archive/a0-11-data-safety-boundary-statement/*`
- 产物：`docs/release/v0.1-data-safety-boundary.md`

### A0-12 `a0-12-inline-ai-baseline` — ISSUE

**核心问题**：
- `tasks.md` 勾为已完成的多个测试文件 / Story 文件，在当前树中不存在
- archive 写 `inlineAi.generating`，当前实现使用 `inlineAi.loading`
- `tasks.md` 验收映射表未闭环
- canonical `editor/spec.md` 没有沉淀 Inline AI 基线要求

**影响**：这是 archive 与当前仓库最明显的“证据链断裂”案例之一。

**证据**：
- archive：`openspec/changes/archive/a0-12-inline-ai-baseline/*`
- 当前实现：`apps/desktop/renderer/src/features/editor/EditorPane.tsx`、`InlineAiInput.tsx`、`InlineAiDiffPreview.tsx`、`InlineAi.test.tsx`
- canonical spec：`openspec/specs/editor/spec.md`

### A0-13 `a0-13-toast-app-integration` — ISSUE

**核心问题**：
- `AppToastProvider` 与相关测试/Story 已实际存在
- 但该行为没有沉淀进任何 canonical spec；`openspec/specs/*` 中检索不到 `AppToastProvider` / `useAppToast` / `toast.*` 的正式 requirement

**影响**：实现存在，archive 也存在，但主规范没有吸收，仍然属于“archive-only truth”。

**证据**：
- archive：`openspec/changes/archive/a0-13-toast-app-integration/*`
- 当前实现：`apps/desktop/renderer/src/App.tsx`、`apps/desktop/renderer/src/components/providers/AppToastProvider.tsx`
- 当前测试：`AppToastProvider.test.tsx`、`toast-save-integration.test.tsx` 等
- canonical spec：`openspec/specs/*` 全量检索 `toast` / `AppToastProvider` 无命中

### A0-14 `a0-14-settings-general-persistence` — ISSUE

**核心问题**：
- archive 把默认字体持久化 key 写成 `creonow.settings.defaultTypography`，当前真实 key 是 `creonow.settings.defaultFont`
- tasks 中直接要求“扫描源码是否含 localStorage”，属于仓库 testing 反模式
- `tasks.md` 验收映射表未闭环

**影响**：文档契约错误，测试策略自相矛盾。

**证据**：
- archive：`openspec/changes/archive/a0-14-settings-general-persistence/*`
- 当前实现：`apps/desktop/renderer/src/features/settings-dialog/SettingsDialog.tsx`、`apps/desktop/renderer/src/lib/preferences.ts`
- testing 规范：`docs/references/testing/01-philosophy-and-anti-patterns.md`

### A0-15 `a0-15-placeholder-ui-closure` — ISSUE

**核心问题**：
- tasks 中仍保留“需搜索确认具体文件”等未收口占位语
- archive 使用 `settings.account.comingSoonTooltip`，当前实现/locale 实际是 `settingsDialog.account.comingSoonTooltip`
- tasks 指向的 `ChatHistory` / i18n 测试路径与当前落点不一致
- `tasks.md` 验收映射表未闭环

**影响**：archive 不再是可靠的实现索引。

**证据**：
- archive：`openspec/changes/archive/a0-15-placeholder-ui-closure/*`
- 当前实现：`apps/desktop/renderer/src/features/settings-dialog/SettingsAccount.tsx`、`apps/desktop/renderer/src/features/ai/ChatHistory.tsx`
- 当前测试：`apps/desktop/renderer/src/features/placeholder-ui-closure.test.tsx`

### A0-16 `a0-16-editor-version-slash-i18n` — ISSUE

**核心问题**：
- archive 仍引用活跃路径 `openspec/changes/a0-09-i18n-inventory-audit/`
- tasks 采用大量源码字符串扫描，和 testing 反模式冲突
- proposal 中的版本历史文件路径已经过时

**影响**：归档 breadcrumb 失效，文档与当前仓库目录结构不一致。

**证据**：
- archive：`openspec/changes/archive/a0-16-editor-version-slash-i18n/*`
- 当前实现：`apps/desktop/renderer/src/features/version-history/*`
- testing 规范：`docs/references/testing/01-philosophy-and-anti-patterns.md`

### A0-17 `a0-17-backup-entry-resolution` — ISSUE

**核心问题**：
- 已归档 tasks 仍保留 5 个未勾选的嵌套 DI 检查框
- proposal / tasks / decision 仍引用活跃路径 `openspec/changes/a0-08-backup-capability-decision/...`
- decision 文档仍写“A0-15 未最终关闭 / 策略待定”一类陈旧状态
- 当前实现注释里也残留了失效 archive 指针：`SettingsGeneral.tsx` 仍指向 `openspec/changes/a0-17-backup-entry-resolution/`

**影响**：归档完整性不成立，且 archive 漂移已渗入实现层注释。

**证据**：
- archive：`openspec/changes/archive/a0-17-backup-entry-resolution/*`
- 当前实现：`apps/desktop/renderer/src/features/settings-dialog/SettingsGeneral.tsx`

### A0-18 `a0-18-judge-capability-resolution` — ISSUE

**核心问题**：
- decision 文档仍写“**待 Owner 审批**”
- `tasks.md` 的自查清单 8 项全部未勾选
- 虽然当前实现方向与“基础规则检查”方案对齐，但 archive 自身仍未完成正式收口

**影响**：这不是功能方向错误，而是决策归档状态不合格。

**证据**：
- archive：`openspec/changes/archive/a0-18-judge-capability-resolution/tasks.md`、`decision.md`
- 当前实现：`apps/desktop/main/src/services/judge/judgeService.ts`、`apps/desktop/main/src/services/ai/judgeQualityService.ts`

### A0-19 `a0-19-export-plain-text-labeling` — ISSUE

**核心问题**：
- `tasks.md` 自查清单仍全部未勾选
- canonical spec 与实现大体对齐，但归档文档收口动作不完整

**影响**：属 archive hygiene 问题，不是核心行为缺陷。

**证据**：
- archive：`openspec/changes/archive/a0-19-export-plain-text-labeling/tasks.md`
- 当前实现：`apps/desktop/renderer/src/features/export/ExportDialog.tsx`、`ExportDialog.test.tsx`

### A0-20 `a0-20-error-message-humanization` — ISSUE

**核心问题**：
- `tasks.md` 验收映射表未闭环
- delta spec 定义的“错误码人话化 / `getHumanErrorMessage()` / `error.generic` fallback”没有沉淀进 canonical `ipc/spec.md`

**影响**：实现存在，但主规范看不到这条真实行为约束。

**证据**：
- archive：`openspec/changes/archive/a0-20-error-message-humanization/*`
- 当前实现：`apps/desktop/renderer/src/lib/errorMessages.ts`、`errorMessages.test.ts`
- canonical spec：`openspec/specs/ipc/spec.md`

### A0-21 `a0-21-error-surface-closure` — ISSUE

**核心问题**：
- `tasks.md` 验收映射表未闭环
- archive 中写的测试路径已经失效
- archive 使用旧的 `commandPalette.error.*` namespace，当前实现已变为 `workbench.commandPalette.errors.*`
- 该行为未沉淀进 canonical `workbench/spec.md`

**影响**：archive 失去可复核性，主规范与实现脱钩。

**证据**：
- archive：`openspec/changes/archive/a0-21-error-surface-closure/*`
- 当前实现：`apps/desktop/renderer/src/features/commandPalette/CommandPalette.tsx`、`apps/desktop/renderer/src/lib/__tests__/error-surface-closure.guard.test.ts`
- canonical spec：`openspec/specs/workbench/spec.md`

### A0-22 `a0-22-i18n-error-copy-cleanup` — ISSUE

**核心问题**：
- archive 指向的测试路径已经失效
- proposal 仍引用活跃路径 `openspec/changes/a0-20...`、`a0-21...`
- “错误文案去技术化”行为没有进入 canonical `workbench/spec.md`

**影响**：archive 路径陈旧，canonical spec 失语。

**证据**：
- archive：`openspec/changes/archive/a0-22-i18n-error-copy-cleanup/*`
- 当前实现：`apps/desktop/renderer/src/i18n/__tests__/i18n-error-copy-cleanup.guard.test.ts`、`apps/desktop/renderer/src/features/rightpanel/QualityPanel.tsx`

### A0-23 `a0-23-document-size-limit-enforcement` — ISSUE

**核心问题**：
- `tasks.md` 验收映射表未闭环
- archive 仍引用不存在的前端错误映射路径：`apps/desktop/renderer/src/utils/errorMessages.ts`
- 当前真实文件是 `apps/desktop/renderer/src/lib/errorMessages.ts`

**影响**：主要是 archive 路径陈旧与收口不足，功能边界本身已经落地。

**证据**：
- archive：`openspec/changes/archive/a0-23-document-size-limit-enforcement/*`
- 当前实现：`apps/desktop/main/src/services/documents/documentCoreService.ts`、`apps/desktop/main/src/ipc/file.ts`
- 当前测试：`apps/desktop/main/src/ipc/__tests__/file-save-size-limit.test.ts`

### A0-24 `a0-24-skill-output-validation` — ISSUE

**核心问题**：
- `tasks.md` 验收映射表未闭环
- archive 仍引用不存在的前端错误映射路径：`apps/desktop/renderer/src/utils/errorMessages.ts`
- delta spec 定义的 `SKILL_OUTPUT_INVALID` / `validateSkillRunOutput()` 等行为没有进入 canonical `skill-system/spec.md`

**影响**：主规范看不到已经落地的高频 skill 输出校验规则，属于真正的规范闭环缺失。

**证据**：
- archive：`openspec/changes/archive/a0-24-skill-output-validation/*`
- 当前实现：`apps/desktop/main/src/services/skills/skillExecutor.ts`、`apps/desktop/main/src/services/skills/__tests__/skillOutputValidation.test.ts`
- canonical spec：`openspec/specs/skill-system/spec.md`

---

<a id="patterns"></a>
## 六、按问题类型汇总

### 1. 归档闭环不完整（最普遍）

以下 change 在归档后仍留有未勾选的验收表 / 自查表 / 嵌套 checklist：

- A0-04, A0-06, A0-07, A0-08, A0-10, A0-11, A0-12,
- A0-14, A0-15, A0-17, A0-18, A0-19, A0-20, A0-21, A0-23, A0-24

### 2. canonical spec 未吸收 delta 行为

以下 change 的行为已经存在于实现 / archive，但未进入对应 canonical spec：

- A0-01（editor / Zen Mode 真编辑）
- A0-03（workbench / renderer 全局错误兜底）
- A0-05（skill-system / 否定语境守卫）
- A0-07（workbench / Windows 首发边界）
- A0-08（document-management / backup 决策治理）
- A0-09（workbench / i18n inventory 审计）
- A0-11（workbench / 数据安全边界声明）
- A0-12（editor / Inline AI 基线）
- A0-13（workbench / 全局 toast provider）
- A0-20（ipc / 错误码人话化）
- A0-21（workbench / 错误 surface 收口）
- A0-22（workbench / i18n error copy cleanup）
- A0-24（skill-system / skill output validation）

### 3. 归档引用失效 / 路径漂移

典型案例：

- A0-09：输出文件仍指向活跃 `openspec/changes/...` 路径
- A0-16：仍指向活跃 A0-09 路径，且版本历史目录路径过时
- A0-17：仍引用活跃 A0-08 路径，且实现注释也指向 dead path
- A0-22：proposal 仍引用活跃 A0-20 / A0-21 路径
- A0-23 / A0-24：仍引用已不存在的 `renderer/src/utils/errorMessages.ts`

### 4. 决策 / 事实文档陈旧

- A0-06：事实表未持续更新，已被多个后续实现推翻
- A0-08：备份结论中的部分事实已被 PreferenceStore 持久化实现推翻
- A0-17：decision 仍保留“A0-15 未最终关闭”等过时状态
- A0-18：decision 仍写“待 Owner 审批”，不适合作为已归档决策文档

---

<a id="verdict"></a>
## 七、最终 verdict

### 结论

**`openspec/changes/archive` 中的 A0 系列 changes 并非“都没问题”。**
相反，**24 个 archived A0 change 全部存在至少一项需要修复的问题**。

其中最严重的问题，不是“某几个功能没做”，而是：

1. **archive 不能稳定回溯当前事实**
2. **canonical spec 不能承担唯一真源职责**
3. **归档后仍残留大量待闭环痕迹**

### 审计建议

建议后续单独起一轮 **A0 archive closeout remediation**，至少完成以下三件事：

1. **补 canonical spec**：把已落地行为从 archive delta 正式吸收入 `openspec/specs/*/spec.md`
2. **清 archive 引用**：把所有 `openspec/changes/<change>/...` 死链与漂移路径回写为 archive 真实路径或当前真实实现路径
3. **补归档收口**：统一清理所有 `tasks.md` 中残留的 `[ ]` 自查表 / 验收映射表 / 占位语

---

<a id="plan"></a>
## 八、具体整改计划

> 此处不是泛泛而谈的“建议”，而是可直接排期、拆 issue、起 PR 的整改路线。
> 取法《孙子》：“先为不可胜，以待敌之可胜。” 先补真源，再清死链，再验功能，方可称收口。

### 8.1 总体目标与完成定义

本轮整改的目标不是“重写 A0”，而是让 A0 archive 达到以下状态：

1. **功能事实可被代码与测试证明**
2. **canonical spec 能表达已落地行为**
3. **archive 文档不再引用死链、旧命名或陈旧状态**
4. **`tasks.md` 不再残留 `[ ]` 自查表 / 验收映射表 / 占位语**
5. **factsheet / decision / release 文档与当前实现一致**

### 8.2 建议拆分顺序

建议按 4 个批次推进，而不是 24 个 change 一把梭：

| 批次 | 优先级 | 目标 | 涉及 A0 | 说明 |
| --- | --- | --- | --- | --- |
| Batch 1 | P0 | 修正文档与现实最冲突的“事实错误” | A0-01, A0-03, A0-05, A0-06, A0-08, A0-17, A0-18 | 先止血，避免继续误导后续 Agent |
| Batch 2 | P1 | 将已落地行为沉淀进 canonical spec | A0-01, A0-03, A0-05, A0-07, A0-09, A0-11, A0-12, A0-13, A0-20, A0-21, A0-22, A0-24 | 让主规范重新成为真源 |
| Batch 3 | P1 | 清 archive 死链、路径漂移、未闭环 checklist | A0-04, A0-07~A0-24 | 解决“归档不可复核”问题 |
| Batch 4 | P2 | 全量回归验证与事实表刷新 | A0 全量 | 最后统一复核与发布口径校准 |

### 8.3 Batch 1：事实纠偏（P0）

#### Task 8.3.1：修正事实表中的错误结论

**Files:**
- Modify: `docs/release/v0.1-fact-sheet.md`
- Verify against:
  `apps/desktop/renderer/src/features/zen-mode/ZenMode.tsx`
  `apps/desktop/main/src/services/skills/skillRouter.ts`
  `apps/desktop/renderer/src/hooks/useToastIntegration.ts`
  `apps/desktop/renderer/src/lib/globalErrorHandlers.ts`

**需要修正的典型事实：**
- A0-01：禅模式不应再写成“不可编辑”
- A0-02：autosave 失败不应再写成“仅 console 输出”
- A0-03：renderer 不应再写成“缺全局兜底”
- A0-05：skill negation guard 不应再写成“未实现”

**验证命令：**
```bash
rg -n "禅模式|Autosave|renderer|negation|否定" docs/release/v0.1-fact-sheet.md
rg -n "EditorContent|isNegated|onToast|toast.save|toast.autosave" \
  apps/desktop/renderer/src \
  apps/desktop/main/src
```

#### Task 8.3.2：修正 decision 文档中的过时状态

**Files:**
- Modify: `openspec/changes/archive/a0-08-backup-capability-decision/decision.md`
- Modify: `openspec/changes/archive/a0-17-backup-entry-resolution/decision.md`
- Modify: `openspec/changes/archive/a0-18-judge-capability-resolution/decision.md`

**需要修正的典型事实：**
- A0-08：`backupInterval` 已存在 PreferenceStore 读写，不应继续写成“未持久化”
- A0-17：移除“A0-15 未最终关闭 / 策略待定”之类旧状态
- A0-18：移除“待 Owner 审批”，改为历史结论或执行后状态说明

**验证命令：**
```bash
rg -n "backupInterval|待 Owner 审批|策略待定|未最终关闭" \
  openspec/changes/archive/a0-08-backup-capability-decision/decision.md \
  openspec/changes/archive/a0-17-backup-entry-resolution/decision.md \
  openspec/changes/archive/a0-18-judge-capability-resolution/decision.md

rg -n "creonow\.settings\.backupInterval" \
  apps/desktop/renderer/src/features/settings-dialog/SettingsDialog.tsx \
  apps/desktop/renderer/src/lib/preferences.ts
```

### 8.4 Batch 2：canonical spec 回写（P1）

#### Task 8.4.1：Editor 规范回写

**Files:**
- Modify: `openspec/specs/editor/spec.md`

**需要吸收的 A0 行为：**
- A0-01：Zen Mode 真实可编辑、复用 `editorStore.editor`、移除假光标
- A0-12：Inline AI 基线（`mod+K`、非禅模式触发、loading/diff preview/accept-reject 基本状态机）

**实现依据：**
- `apps/desktop/renderer/src/features/zen-mode/ZenMode.tsx`
- `apps/desktop/renderer/src/features/editor/EditorPane.tsx`
- `apps/desktop/renderer/src/features/editor/InlineAiInput.tsx`
- `apps/desktop/renderer/src/features/editor/InlineAiDiffPreview.tsx`

**验证命令：**
```bash
pnpm -C apps/desktop exec vitest run \
  renderer/src/features/zen-mode/ZenMode.test.tsx \
  renderer/src/features/editor/InlineAi.test.tsx
```

#### Task 8.4.2：Workbench 规范回写

**Files:**
- Modify: `openspec/specs/workbench/spec.md`

**需要吸收的 A0 行为：**
- A0-03：renderer 全局错误兜底
- A0-07：Windows 首发边界文档约束
- A0-09：i18n inventory 审计要求
- A0-11：数据安全边界声明
- A0-13：全局 Toast provider / toast 集成
- A0-21：错误 surface 收口
- A0-22：i18n error copy cleanup

**实现依据：**
- `apps/desktop/renderer/src/lib/globalErrorHandlers.ts`
- `apps/desktop/renderer/src/components/providers/AppToastProvider.tsx`
- `apps/desktop/renderer/src/features/commandPalette/CommandPalette.tsx`
- `apps/desktop/renderer/src/i18n/__tests__/i18n-error-copy-cleanup.guard.test.ts`

**验证命令：**
```bash
pnpm -C apps/desktop exec vitest run \
  renderer/src/lib/globalErrorHandlers.test.ts \
  renderer/src/components/providers/AppToastProvider.test.tsx \
  renderer/src/lib/__tests__/error-surface-closure.guard.test.ts \
  renderer/src/i18n/__tests__/i18n-error-copy-cleanup.guard.test.ts
```

#### Task 8.4.3：Document Management / IPC / Skill System 规范回写

**Files:**
- Modify: `openspec/specs/document-management/spec.md`
- Modify: `openspec/specs/ipc/spec.md`
- Modify: `openspec/specs/skill-system/spec.md`

**需要吸收的 A0 行为：**
- document-management：A0-08（backup 决策边界说明）、A0-23（5MB 限制）、必要时校准 A0-04 / A0-19 的真实导出口径
- ipc：A0-20（错误码人话化）
- skill-system：A0-05（negation guard）、A0-24（skill output validation）

**验证命令：**
```bash
pnpm -C apps/desktop exec vitest run --config tests/unit/main/vitest.node.config.ts \
  main/src/ipc/__tests__/file-save-size-limit.test.ts \
  main/src/services/skills/__tests__/skillRouter.negation.test.ts \
  main/src/services/skills/__tests__/skillOutputValidation.test.ts

pnpm -C apps/desktop exec vitest run renderer/src/lib/errorMessages.test.ts
```

### 8.5 Batch 3：archive 卫生清理（P1）

#### Task 8.5.1：清理所有 dead links 与旧路径

**Files:**
- Modify: `openspec/changes/archive/a0-09-i18n-inventory-audit/tasks.md`
- Modify: `openspec/changes/archive/a0-16-editor-version-slash-i18n/proposal.md`
- Modify: `openspec/changes/archive/a0-17-backup-entry-resolution/{proposal.md,tasks.md,decision.md}`
- Modify: `openspec/changes/archive/a0-22-i18n-error-copy-cleanup/proposal.md`
- Modify: `openspec/changes/archive/a0-23-document-size-limit-enforcement/tasks.md`
- Modify: `openspec/changes/archive/a0-24-skill-output-validation/tasks.md`
- Modify: `apps/desktop/renderer/src/features/settings-dialog/SettingsGeneral.tsx` 注释

**清理规则：**
- 所有 `openspec/changes/<a0-change>/...` 死链改为 archive 真实路径或当前真实实现路径
- 所有已不存在的 `renderer/src/utils/errorMessages.ts` 改为 `renderer/src/lib/errorMessages.ts`
- 所有目录重组后的旧路径（如 `version-control/*`）改为当前 `version-history/*`

**验证命令：**
```bash
rg -n "openspec/changes/a0-|renderer/src/utils/errorMessages\.ts|version-control/VersionHistory|settings\.account\.comingSoonTooltip" \
  openspec/changes/archive/a0-* \
  apps/desktop/renderer/src/features/settings-dialog/SettingsGeneral.tsx
```

#### Task 8.5.2：清理所有未闭环 checklist

**Files:**
- Modify: 24 个 A0 archived change 下仍有 `[ ]` 的 `tasks.md` / `decision.md`

**处理原则：**
- 若项目确已完成：将 checklist / 验收映射补齐为 `[x]`
- 若只是历史自查表：改为文字化“已完成状态说明”，避免伪装未完成
- 若仍有歧义：明确写成“历史记录未闭环，已在本次整改中校准”

**验证命令：**
```bash
rg -n "\[ \]" openspec/changes/archive/a0-*/*.md
```

#### Task 8.5.3：清理占位语与测试反模式文案

**重点 change：**
- A0-14：删除源码扫描式测试要求，改写为行为验证或 guard 说明
- A0-15：删除“需搜索确认...”占位语，替换为当前真实路径
- A0-16：删除源码字符串扫描测试描述，改成 guard / i18n 行为验证描述

**验证命令：**
```bash
rg -n "需搜索确认|source\.includes|扫描源码|裸文案是否消失|t\(\) 是否出现" openspec/changes/archive/a0-14-* openspec/changes/archive/a0-15-* openspec/changes/archive/a0-16-*
```

### 8.6 Batch 4：全量回归与重新发布口径（P2）

#### Task 8.6.1：最小全量验证

**Run:**
```bash
pnpm -C apps/desktop exec vitest run \
  renderer/src/features/zen-mode/ZenMode.test.tsx \
  renderer/src/__tests__/autosave-visibility.test.tsx \
  renderer/src/lib/globalErrorHandlers.test.ts \
  renderer/src/features/search/SearchPanel.test.tsx \
  renderer/src/features/editor/InlineAi.test.tsx \
  renderer/src/components/providers/AppToastProvider.test.tsx \
  renderer/src/features/placeholder-ui-closure.test.tsx \
  renderer/src/features/settings-dialog/SettingsGeneral.backup.test.tsx \
  renderer/src/features/export/ExportDialog.test.tsx \
  renderer/src/lib/errorMessages.test.ts \
  renderer/src/lib/__tests__/error-surface-closure.guard.test.ts \
  renderer/src/i18n/__tests__/i18n-error-copy-cleanup.guard.test.ts

pnpm desktop:ensure-native-node-abi
pnpm -C apps/desktop exec vitest run --config tests/unit/main/vitest.node.config.ts \
  main/src/services/export/__tests__/export-pdf.test.ts \
  main/src/services/skills/__tests__/skillRouter.negation.test.ts \
  main/src/ipc/__tests__/file-save-size-limit.test.ts \
  main/src/services/skills/__tests__/skillOutputValidation.test.ts

pnpm exec tsx apps/desktop/main/src/services/ai/__tests__/judge-pass-state.test.ts
pnpm exec tsx apps/desktop/main/src/services/ai/__tests__/judge-fallback-partial-check.test.ts
pnpm exec tsx apps/desktop/tests/integration/search/fts-query-panel.test.ts

pytest -q scripts/tests
```

#### Task 8.6.2：完成条件

以下条件全部满足，方可宣布 A0 archive remediation 完成：

- `rg -n "\[ \]" openspec/changes/archive/a0-*/*.md` 返回空
- `rg -n "openspec/changes/a0-" openspec/changes/archive/a0-*` 返回空，或仅剩明确说明性的历史引用
- factsheet / decision 中不再存在已知过时结论
- canonical spec 已覆盖本报告列出的关键已落地行为
- 本节列出的最小全量验证命令全部通过

### 8.7 推荐交付方式

为避免一次 PR 过大，建议拆成 4 个 PR：

1. **PR-1：事实纠偏**（factsheet + decision stale state）
2. **PR-2：canonical spec 回写**（editor / workbench / document-management / ipc / skill-system）
3. **PR-3：archive 卫生清理**（dead links / checklist / 占位语 / 路径漂移）
4. **PR-4：回归验证与最终收口**（必要的 guard 更新 + 文档最终对齐）

---

<a id="appendix"></a>
## 九、附录：本次重点复核文件

- `openspec/changes/archive/a0-01-*` ～ `a0-24-*`
- `openspec/specs/editor/spec.md`
- `openspec/specs/workbench/spec.md`
- `openspec/specs/document-management/spec.md`
- `openspec/specs/search-and-retrieval/spec.md`
- `openspec/specs/skill-system/spec.md`
- `openspec/specs/ipc/spec.md`
- `docs/release/v0.1-fact-sheet.md`
- `docs/release/v0.1-windows-boundary.md`
- `docs/release/v0.1-data-safety-boundary.md`
- `apps/desktop/main/src/services/skills/skillRouter.ts`
- `apps/desktop/main/src/services/skills/skillExecutor.ts`
- `apps/desktop/main/src/services/judge/judgeService.ts`
- `apps/desktop/renderer/src/features/zen-mode/ZenMode.tsx`
- `apps/desktop/renderer/src/features/settings-dialog/SettingsDialog.tsx`
- `apps/desktop/renderer/src/features/settings-dialog/SettingsGeneral.tsx`
- `apps/desktop/renderer/src/components/providers/AppToastProvider.tsx`
- `apps/desktop/renderer/src/lib/errorMessages.ts`
