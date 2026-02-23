# ISSUE-627

## Links

- Issue: #627
- Issue URL: https://github.com/Leeky1017/CreoNow/issues/627
- Branch: `task/627-scoped-lifecycle-and-abort`
- PR: https://github.com/Leeky1017/CreoNow/pull/628

## Scope

- Rulebook task: `rulebook/tasks/issue-627-scoped-lifecycle-and-abort/**`
- RUN_LOG: `openspec/_ops/task_runs/ISSUE-627.md`
- Change tracking: `openspec/changes/issue-617-scoped-lifecycle-and-abort/**`
- Execution order sync: `openspec/changes/EXECUTION_ORDER.md`（当 PR 修改任一 active change 内容或 rename change 目录时，需同步更新）

## Goal

- 为 GitHub Issue #627 交付 `openspec/changes/issue-617-scoped-lifecycle-and-abort/` 的治理与规格前置工作：识别跨模块 spec 缺口/重叠点，确保 Rulebook task 可验证，并为后续 PR 门禁收口准备 RUN_LOG。

## Status

- CURRENT: Rulebook task 已通过 validate；已补齐 change 跨模块 delta spec 覆盖（ipc/skill-system/context-engine）并修复 Dependency Sync Check 口径不一致；PR `#628` 已创建并回填真实 PR URL；auto-merge 已开启（merge method: MERGE，待 required checks 全绿自动合并）。

## Next Actions

- [ ] 确认是否需要 rename change 目录 `issue-617-scoped-lifecycle-and-abort` -> `issue-627-scoped-lifecycle-and-abort`（仅在门禁/治理必须时执行）
- [x] 若 PR 触及 active change 内容或 rename，必须同步更新 `openspec/changes/EXECUTION_ORDER.md`（含更新时间）
- [x] PR 创建后回填 RUN_LOG 的 PR URL（禁止占位符）
- [x] 开启 auto-merge 并跟踪 required checks：`ci` / `openspec-log-guard` / `merge-serial`
- [ ] 最终收口前补齐 Main Session Audit（并以“签字提交仅改 RUN_LOG”的方式满足 `openspec-log-guard`）

## Plan

- [x] 审阅 change 文档并输出 spec gaps/contradictions（重点：BE-SLA-S2/S3/S4）
- [x] 创建并 validate Rulebook task（active path）
- [x] 补齐跨模块 delta specs（ipc/skill-system/context-engine）或显式 de-scope
- [x] 修复 Dependency Sync Check 一致性（proposal/tasks/EXECUTION_ORDER 口径）
- [x] 更新 proposal Owner 审阅为可执行状态说明（待 Owner 确认）
- [x] 建立 PR（#628）并回填 RUN_LOG PR URL
- [x] 开启 auto-merge（merge method: MERGE）
- [ ] 完成 required checks 全绿并自动合并收口

## Runs

### 2026-02-23 Spec Review (ScopedLifecycle + Abort)

- Command:
  - `sed -n '1,200p' openspec/changes/issue-617-scoped-lifecycle-and-abort/proposal.md`
  - `sed -n '1,260p' openspec/changes/issue-617-scoped-lifecycle-and-abort/tasks.md`
  - `sed -n '1,260p' openspec/changes/issue-617-scoped-lifecycle-and-abort/specs/project-management/spec.md`
  - `sed -n '1,260p' openspec/specs/ipc/spec.md`
  - `sed -n '1,340p' openspec/specs/skill-system/spec.md`
  - `sed -n '1,260p' openspec/specs/context-engine/spec.md`
- Key output:
  - 形成 “Spec gaps / contradictions” 清单（见下方 Findings）

### 2026-02-23 Rulebook Task Scaffold + Validate

- Command:
  - `rulebook task validate issue-627-scoped-lifecycle-and-abort`
  - `python3 scripts/check_doc_timestamps.py --files rulebook/tasks/issue-627-scoped-lifecycle-and-abort/proposal.md rulebook/tasks/issue-627-scoped-lifecycle-and-abort/tasks.md`
- Key output:
  - validate: `✅ Task issue-627-scoped-lifecycle-and-abort is valid`
  - warning: `No spec files found (specs/*/spec.md)`
  - timestamp gate: `OK: validated timestamps for 2 governed markdown file(s)`

### 2026-02-23 Fix audit blockers (delta specs + Dependency Sync Check)

- Change:
  - add delta specs:
    - `openspec/changes/issue-617-scoped-lifecycle-and-abort/specs/ipc/spec.md`
    - `openspec/changes/issue-617-scoped-lifecycle-and-abort/specs/skill-system/spec.md`
    - `openspec/changes/issue-617-scoped-lifecycle-and-abort/specs/context-engine/spec.md`
  - refactor delta spec ownership:
    - BE-SLA-S1 保留在 `specs/project-management/spec.md`
    - BE-SLA-S2/S3/S4 分别落到 `ipc/skill-system/context-engine` 模块 delta spec
  - update governance consistency:
    - `openspec/changes/issue-617-scoped-lifecycle-and-abort/proposal.md` Dependency Sync Check：`PENDING` -> `PASS`；补齐 inputs；Owner 审阅增加明确待确认项；显式 de-scope BoundedMap
    - `openspec/changes/issue-617-scoped-lifecycle-and-abort/tasks.md` 1.4：无上游依赖也需记录 `PASS`（与 `openspec/changes/EXECUTION_ORDER.md` 口径一致）

### 2026-02-23 Sync EXECUTION_ORDER + Push + Create PR (#628)

- Command:
  - `git commit -m "docs: sync EXECUTION_ORDER after doc patch (#627)" ...`
  - `git push -u origin task/627-scoped-lifecycle-and-abort`
  - `gh pr create --title "Docs: unblock scoped lifecycle + abort governance (#627)" ...`
- Key output:
  - commit: `daecb460`
  - push: `* [new branch] task/627-scoped-lifecycle-and-abort -> task/627-scoped-lifecycle-and-abort`
  - PR: https://github.com/Leeky1017/CreoNow/pull/628

### 2026-02-23 Enable auto-merge (PR #628)

- Command:
  - `gh pr merge 628 --auto --merge`
  - `gh pr view 628 --json mergeStateStatus,autoMergeRequest`
- Key output:
  - autoMergeRequest: `enabledAt=2026-02-23T15:46:21Z`, `mergeMethod=MERGE`
  - mergeStateStatus: `BLOCKED`（waiting required checks）

## Findings: Spec gaps / contradictions

### 1) BE-SLA-S2（IPC timeout -> AbortSignal 中止底层执行）

- Gap: `openspec/specs/ipc/spec.md` 目前仅定义超时返回 `IPC_TIMEOUT`，并描述“主进程中正在执行的操作被标记为需要清理”，但未定义“超时必须中止底层执行”的可测试语义（AbortSignal/等价机制）。
- Resolution: 已补齐 `ipc` 模块 delta spec：`openspec/changes/issue-617-scoped-lifecycle-and-abort/specs/ipc/spec.md`（Scenario: BE-SLA-S2）。

### 2) BE-SLA-S3（会话并发槽位在 timeout/abort 下可回收）

- Potential overlap: `openspec/changes/issue-617-skill-runtime-hardening/specs/skill-system/spec.md` 已新增 BE-SRH-S3（completion 丢失时槽位回收）与 BE-SRH-S4（取消优先）——与本 change 的 BE-SLA-S3 在目标与测试映射上高度重叠。
- Action: 需要 Owner/Integrator 明确：BE-SLA-S3 是否应移出本 change、改为依赖/引用 `issue-617-skill-runtime-hardening` 的契约；或保留但在 spec 中声明边界与不重复实现的责任划分。

### 3) BE-SLA-S4（unbind 时清理 project-scoped cache/watcher）

- Gap: `openspec/specs/context-engine/spec.md` 存在缓存与 `projectId` 隔离规则，但未定义“项目切换 unbind 必须释放/关闭 watcher 与 project-scoped cache”的生命周期闭环契约。
- Resolution: 已补齐 `context-engine` 模块 delta spec：`openspec/changes/issue-617-scoped-lifecycle-and-abort/specs/context-engine/spec.md`（Scenario: BE-SLA-S4）。

### 4) Proposal/Tasks 内部一致性问题（Dependency Sync Check）

- Contradiction: `openspec/changes/issue-617-scoped-lifecycle-and-abort/proposal.md` 声明“上游依赖：无”，但 “依赖同步检查（Dependency Sync Check）” 结论为 `PENDING`；`tasks.md` 又写 “本 change：N/A”。
- Resolution: 已将 proposal 的结论更新为 `PASS`，并将 tasks 1.4 口径更新为“无上游依赖也需记录 PASS”（与 `openspec/changes/EXECUTION_ORDER.md` 规则一致）。

### 5) Proposal 提到的 BoundedMap 治理资产未落到 delta spec

- Gap: proposal “对无界 Map 引入可替换抽象（如 BoundedMap LRU/TTL）” 未体现在当前 project-management delta spec 的 Requirement/Scenario 中，也未在 tasks 映射中出现。
- Resolution: 已在 proposal 中显式 de-scope BoundedMap（并同步移除 tasks 1.1 中的 BoundedMap 范围描述）。

## Dependency Sync Check

- Inputs reviewed:
  - `openspec/changes/issue-617-scoped-lifecycle-and-abort/proposal.md`
  - `openspec/changes/issue-617-scoped-lifecycle-and-abort/tasks.md`
  - `openspec/changes/issue-617-scoped-lifecycle-and-abort/specs/project-management/spec.md`
  - `openspec/changes/issue-617-scoped-lifecycle-and-abort/specs/ipc/spec.md`
  - `openspec/changes/issue-617-scoped-lifecycle-and-abort/specs/skill-system/spec.md`
  - `openspec/changes/issue-617-scoped-lifecycle-and-abort/specs/context-engine/spec.md`
  - `openspec/specs/project-management/spec.md`
  - `openspec/specs/ipc/spec.md`
  - `openspec/specs/skill-system/spec.md`
  - `openspec/specs/context-engine/spec.md`
  - `openspec/changes/issue-617-skill-runtime-hardening/specs/skill-system/spec.md`
  - `openspec/changes/EXECUTION_ORDER.md`
- Result: `PASS`（已补齐跨模块 delta spec 覆盖，并将 tasks/proposal 口径统一）
