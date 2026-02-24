# ISSUE-638

更新时间：2026-02-24 12:55

## Links

- Issue: #638
- Issue URL: https://github.com/Leeky1017/CreoNow/issues/638
- Branch: `task/638-embedding-rag-offload`
- PR: N/A（gov baseline 阶段，待主会话创建）

## Scope

- Rulebook task: `rulebook/tasks/issue-638-embedding-rag-offload/**`
- Target change: `openspec/changes/issue-617-embedding-rag-offload/**`
- RUN_LOG: `openspec/_ops/task_runs/ISSUE-638.md`
- Required checks: `ci`, `openspec-log-guard`, `merge-serial`

## Plan

- [x] 将 Rulebook task 文档占位内容替换为 issue-617 对齐的治理内容
- [x] 执行并记录 Rulebook validate
- [x] 执行并记录 Dependency Sync Check（含归档依赖核对）
- [x] 执行并记录受管 markdown 时间戳门禁
- [ ] 主会话后续实现/提测/PR/auto-merge 收口

## Runs

### 2026-02-24 BE-EMR-S1/S2 Red（file autosave runtime contract）

- Command:
  - `node --import tsx apps/desktop/main/src/ipc/__tests__/file-autosave-embedding-runtime.contract.test.ts`
- Exit code: `1`
- Key output:
  - `SyntaxError: The requested module '../file' does not provide an export named 'createSemanticAutosaveEmbeddingRuntime'`

### 2026-02-24 BE-EMR-S1/S2 Green（runtime wiring + contracts）

- Command:
  - `node --import tsx apps/desktop/main/src/ipc/__tests__/file-autosave-embedding-runtime.contract.test.ts`
  - `node --import tsx apps/desktop/main/src/services/embedding/__tests__/embedding-queue.debounce.contract.test.ts`
  - `node --import tsx apps/desktop/main/src/services/embedding/__tests__/embedding-offload.compute.contract.test.ts`
- Exit code:
  - all `0`
- Key output:
  - `[OK] node --import tsx apps/desktop/main/src/ipc/__tests__/file-autosave-embedding-runtime.contract.test.ts`
  - `[OK] node --import tsx apps/desktop/main/src/services/embedding/__tests__/embedding-queue.debounce.contract.test.ts`
  - `[OK] node --import tsx apps/desktop/main/src/services/embedding/__tests__/embedding-offload.compute.contract.test.ts`

### 2026-02-24 BE-EMR-S3/S4 Red（contract tests）

- Command:
  - `node --import tsx/esm apps/desktop/main/src/services/rag/__tests__/rag-offload.compute.contract.test.ts`
  - `node --import tsx/esm apps/desktop/main/src/services/embedding/__tests__/semantic-chunk-index.lru-ttl.contract.test.ts`
- Exit code:
  - `rag-offload.compute.contract`: `1`
  - `semantic-chunk-index.lru-ttl.contract`: `1`
- Key output:
  - `Error [ERR_MODULE_NOT_FOUND]: Cannot find module .../rag/ragComputeOffload`
  - `Error [ERR_MODULE_NOT_FOUND]: Cannot find module .../embedding/semanticChunkIndexCache`

### 2026-02-24 BE-EMR-S3/S4 Green（contract + related）

- Command:
  - `node --import tsx/esm apps/desktop/main/src/services/rag/__tests__/rag-offload.compute.contract.test.ts`
  - `node --import tsx/esm apps/desktop/main/src/services/embedding/__tests__/semantic-chunk-index.lru-ttl.contract.test.ts`
  - `node --import tsx/esm apps/desktop/main/src/services/embedding/__tests__/embedding-queue.debounce.contract.test.ts`
  - `node --import tsx/esm apps/desktop/main/src/services/embedding/__tests__/embedding-offload.compute.contract.test.ts`
  - `node --import tsx/esm apps/desktop/main/src/services/embedding/__tests__/onnx-runtime.init.test.ts`
  - `node --import tsx/esm apps/desktop/main/src/services/rag/__tests__/hybrid-rag.merge.test.ts`
  - `node --import tsx/esm apps/desktop/main/src/services/rag/__tests__/hybrid-rag.explain.test.ts`
  - `node --import tsx/esm apps/desktop/main/src/services/rag/__tests__/hybrid-rag.truncate.test.ts`
- Exit code:
  - all `0`
- Key output:
  - `PASS apps/desktop/main/src/services/embedding/__tests__/embedding-queue.debounce.contract.test.ts`
  - `PASS apps/desktop/main/src/services/embedding/__tests__/embedding-offload.compute.contract.test.ts`
  - `PASS apps/desktop/main/src/services/embedding/__tests__/onnx-runtime.init.test.ts`
  - `PASS apps/desktop/main/src/services/rag/__tests__/hybrid-rag.merge.test.ts`
  - `PASS apps/desktop/main/src/services/rag/__tests__/hybrid-rag.explain.test.ts`
  - `PASS apps/desktop/main/src/services/rag/__tests__/hybrid-rag.truncate.test.ts`

### 2026-02-24 Rulebook validate

- Command:
  - `rulebook task validate issue-638-embedding-rag-offload`
- Exit code: `0`
- Key output:
  - `✅ Task issue-638-embedding-rag-offload is valid`
  - `⚠️  Warnings:`
  - `  - No spec files found (specs/*/spec.md)`

### 2026-02-24 Dependency evidence collection

- Command:
  - `find openspec/changes/archive -maxdepth 1 -type d -name 'issue-617-*' | sort`
  - `grep -Rsn "BackgroundTaskRunner\|createUtilityProcessFoundation\|DbExecutionRole" openspec/changes/archive/issue-617-utilityprocess-foundation | head -n 20`
  - `grep -Rsn "BE-SLA-S2\|BE-SLA-S3\|BE-SLA-S4\|AbortSignal\|project-scoped cache\|timeout" openspec/changes/archive/issue-617-scoped-lifecycle-and-abort | head -n 40`
  - `grep -n "BE-SLA-S2\|AbortSignal\|timeout" openspec/specs/ipc/spec.md | head -n 20`
  - `grep -n "BE-SLA-S3\|timeout/abort\|槽位" openspec/specs/skill-system/spec.md | head -n 20`
  - `grep -n "BE-SLA-S4\|project-scoped cache\|解绑" openspec/specs/context-engine/spec.md | head -n 20`
- Exit code: `0`
- Key output:
  - `openspec/changes/archive/issue-617-scoped-lifecycle-and-abort`
  - `openspec/changes/archive/issue-617-utilityprocess-foundation`
  - `Scenario: BE-SLA-S2 IPC timeout 通过 AbortSignal 中止底层执行 [ADDED]`
  - `Scenario: BE-SLA-S3 会话并发槽位在 timeout/abort 下可回收 [ADDED]`
  - `Scenario: BE-SLA-S4 项目解绑时清理 project-scoped cache/watcher [ADDED]`
  - `155:### Requirement: IPC timeout 必须中止底层 handler 执行（无幽灵执行）`
  - `278:### Requirement: 会话级并发槽位必须在 timeout/abort/异常路径可回收`
  - `272:### Requirement: 项目解绑必须清理 Context Engine 的 project-scoped cache/watcher`

### 2026-02-24 Doc timestamp gate

- Command:
  - `python3 scripts/check_doc_timestamps.py --files rulebook/tasks/issue-638-embedding-rag-offload/proposal.md rulebook/tasks/issue-638-embedding-rag-offload/tasks.md openspec/changes/issue-617-embedding-rag-offload/tasks.md openspec/_ops/task_runs/ISSUE-638.md`
- Exit code: `0`
- Key output:
  - `OK: validated timestamps for 3 governed markdown file(s)`

### 2026-02-24 Working tree check

- Command:
  - `git status --short`
- Exit code: `0`
- Key output:
  - ` M openspec/changes/issue-617-embedding-rag-offload/tasks.md`
  - `?? openspec/_ops/task_runs/ISSUE-638.md`
  - `?? rulebook/tasks/issue-638-embedding-rag-offload/`

### 2026-02-24 Integration verification matrix（integrate-mate）

- Command:
  - `pnpm typecheck`
  - `pnpm lint`
  - `node --import tsx/esm apps/desktop/main/src/services/embedding/__tests__/embedding-queue.debounce.contract.test.ts`
  - `node --import tsx/esm apps/desktop/main/src/services/embedding/__tests__/embedding-offload.compute.contract.test.ts`
  - `node --import tsx/esm scripts/contract-generate.ts && git diff --exit-code packages/shared/types/ipc-generated.ts`
  - `node --import tsx/esm scripts/cross-module-contract-gate.ts`
- Exit code:
  - `typecheck`: `0`
  - `lint`: `0`（仅遗留 warning，无新增 error）
  - `embedding-queue.debounce.contract`: `0`
  - `embedding-offload.compute.contract`: `0`
  - `contract-generate + diff`: `0`
  - `cross-module-contract-gate`: `0`
- Key output:
  - `tsc --noEmit` completed without errors.
  - `eslint . --ext .ts,.tsx` returned `0` with existing repo warnings.
  - `[CROSS_MODULE_GATE] PASS`

### 2026-02-24 Preflight / remote-delivery blockers

- Command:
  - `./scripts/agent_pr_preflight.sh`
  - `gh issue view 638 --json number,state,title,url`
  - `git push origin task/638-embedding-rag-offload`
- Exit code:
  - `preflight`: `1`
  - `gh issue view`: `1`
  - `git push`: `128`
- Key output:
  - `PRE-FLIGHT FAILED: [RUN_LOG] PR field must be a real URL ... N/A（gov baseline 阶段，待主会话创建）`
  - `error connecting to api.github.com`
  - `fatal: unable to access 'https://github.com/Leeky1017/CreoNow.git/': Could not resolve host: github.com`
- Blocker conclusion:
  - 当前可完成本地验证；远程交付链路（push / PR / auto-merge / checks polling / main sync）受网络解析失败阻断。

### 2026-02-24 BE-EMR-S3 Red（production rag IPC compute runtime）

- Command:
  - `node --import tsx apps/desktop/main/src/ipc/__tests__/rag-retrieve-runtime.contract.test.ts`
- Exit code: `1`
- Key output:
  - `AssertionError [ERR_ASSERTION]: rag retrieve semantic search must run inside compute runner`
  - `false !== true`

### 2026-02-24 BE-EMR-S3 Green（production rag IPC compute runtime）

- Command:
  - `node --import tsx apps/desktop/main/src/ipc/__tests__/rag-retrieve-runtime.contract.test.ts`
  - `node --import tsx apps/desktop/main/src/services/rag/__tests__/rag-offload.compute.contract.test.ts`
- Exit code:
  - `rag-retrieve-runtime.contract`: `0`
  - `rag-offload.compute.contract`: `0`
- Key output:
  - `[OK] node --import tsx apps/desktop/main/src/ipc/__tests__/rag-retrieve-runtime.contract.test.ts`
  - `[OK] node --import tsx apps/desktop/main/src/services/rag/__tests__/rag-offload.compute.contract.test.ts`
- Notes:
  - `registerRagIpcHandlers` 在提供 `computeRunner` 时通过 `computeRunner.run(...)` 执行 `rag:context:retrieve` 检索路径。
  - `apps/desktop/main/src/index.ts` 已为 `registerRagIpcHandlers` 注入 `utilityProcessFoundation.compute`。

## Dependency Sync Check

- 检查时间：2026-02-24 11:29
- 上游依赖（归档）：
  - `openspec/changes/archive/issue-617-utilityprocess-foundation`
  - `openspec/changes/archive/issue-617-scoped-lifecycle-and-abort`
- 核对输入：
  - `openspec/changes/archive/issue-617-utilityprocess-foundation/proposal.md`
  - `openspec/changes/archive/issue-617-utilityprocess-foundation/tasks.md`
  - `openspec/changes/archive/issue-617-utilityprocess-foundation/specs/ipc/spec.md`
  - `openspec/changes/archive/issue-617-scoped-lifecycle-and-abort/proposal.md`
  - `openspec/changes/archive/issue-617-scoped-lifecycle-and-abort/tasks.md`
  - `openspec/changes/archive/issue-617-scoped-lifecycle-and-abort/specs/ipc/spec.md`
  - `openspec/changes/archive/issue-617-scoped-lifecycle-and-abort/specs/skill-system/spec.md`
  - `openspec/changes/archive/issue-617-scoped-lifecycle-and-abort/specs/context-engine/spec.md`
  - `openspec/specs/ipc/spec.md`
  - `openspec/specs/skill-system/spec.md`
  - `openspec/specs/context-engine/spec.md`
- 核对项：
  - timeout -> abort（BE-SLA-S2）语义已在主 spec 保持一致。
  - 会话并发槽位回收（BE-SLA-S3）语义已在主 spec 保持一致。
  - project-scoped cache/watcher 清理（BE-SLA-S4）语义已在主 spec 保持一致。
- 结论：`PASS（NO_DRIFT）`
- 后续动作：已将结论同步写入 `openspec/changes/issue-617-embedding-rag-offload/tasks.md` 第 1.4 节；继续按 BE-EMR-S1~S4 进入 TDD。

## Main Session Audit

- Audit-Owner: main-session
- Reviewed-HEAD-SHA: PENDING
- Spec-Compliance: PENDING
- Code-Quality: PENDING
- Fresh-Verification: PENDING
- Blocking-Issues: PENDING
- Decision: PENDING
