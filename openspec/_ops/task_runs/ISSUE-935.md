# ISSUE-935 RUN_LOG

- Issue: #935
- Branch: task/935-fe-editor-inline-diff
- PR: https://github.com/Leeky1017/CreoNow/pull/938
- Change: fe-editor-inline-diff-decoration-integration

## Plan

1. 编写 5 个 TDD 测试（S1 纯函数基线 + S2 DecorationSet + S3 清除 + S4 CSS class）
2. 重构 `inlineDiff.ts` 从空壳对象 → 真正 TipTap Extension
3. 实现 `diffToDecorationSet()` 纯函数
4. 添加 CSS 样式（`.inline-diff-added` / `.inline-diff-removed`）
5. 确保向后兼容 `InlineDiffControls`
6. 全量回归 + TypeScript 检查

## Dependency Sync Check

- `fe-leftpanel-dialog-migration`：已归档完成（PR #808）。无漂移。

## Runs

### Run 1 — Red 阶段

```
$ pnpm -C apps/desktop test:run features/editor/__tests__/inlineDiff.decoration

 ✓ VC-FE-DIFF-S1: createInlineDiffDecorations returns decoration data (2)
 ❯ VC-FE-DIFF-S2: InlineDiffExtension produces ProseMirror DecorationSet when diff data is provided (1)
     × produces decorations when diff data is injected via storage
       TypeError: Cannot set properties of undefined (setting 'diffs')
 ❯ VC-FE-DIFF-S3: InlineDiffExtension clears decorations when diff data is removed (1)
     × has empty DecorationSet after clearing diff data
       TypeError: Cannot set properties of undefined (setting 'diffs')
 ❯ VC-FE-DIFF-S4: decoration uses semantic token classes for insert/delete (1)
     × decorations include inline-diff-added and inline-diff-removed classes
       TypeError: Cannot set properties of undefined (setting 'diffs')

 Test Files  1 failed (1)
      Tests  3 failed | 2 passed (5)
```

红灯原因：InlineDiffExtension 是空壳对象，无 TipTap storage/plugin。

### Run 2 — Green 阶段

```
$ pnpm -C apps/desktop test:run features/editor/__tests__/inlineDiff.decoration

 ✓ VC-FE-DIFF-S1 (2) ✓
 ✓ VC-FE-DIFF-S2 (1) ✓
 ✓ VC-FE-DIFF-S3 (1) ✓
 ✓ VC-FE-DIFF-S4 (1) ✓

 Test Files  1 passed (1)
      Tests  5 passed (5)
```

### Run 3 — 全量回归

```
$ pnpm -C apps/desktop test:run

 Test Files  236 passed (236)
      Tests  1716 passed (1716)
   Duration  44.10s
```

### Run 4 — Typecheck

```
$ pnpm typecheck
> tsc --noEmit
（无错误，正常退出）
```

### Run 5 — 向后兼容检查

```
$ pnpm -C apps/desktop test:run InlineDiffControls

 ✓ InlineDiffControls (3)
   ✓ S2-ID-1 ✓
   ✓ S2-ID-2 ✓
   ✓ S2-ID-3 ✓

 Test Files  1 passed (1)
      Tests  3 passed (3)
```

## Main Session Audit

- Audit-Owner: main-session
- Reviewed-HEAD-SHA: 3bd7d1245e2694dfb999f080f55d4c733734340e
- Spec-Compliance: PASS
- Code-Quality: PASS
- Fresh-Verification: PASS
- Blocking-Issues: 0
- Decision: ACCEPT

### 审查摘要

1. Diff 审查：`InlineDiffExtension` 从空壳对象正确重构为 `Extension.create()` + `addProseMirrorPlugins()`
2. `diffToDecorationSet()` 纯函数正确构建 `DecorationSet`
3. CSS 样式使用语义化 token（`--color-success-subtle`, `--color-error-subtle`）
4. 向后完全兼容：`createInlineDiffDecorations` / `resolveInlineDiffText` 保留
5. 测试回归 236/236 文件、1716/1716 test 全绿
6. TypeScript 0 errors
7. `@tiptap/pm` 依赖正确添加到 `package.json`
