更新时间：2026-03-03 16:00

## 1. Implementation

- [x] 1.1 创建 `inlineDiff.decoration.test.ts` 测试文件（Red 阶段）
  - S1: `createInlineDiffDecorations` 回归基线
  - S2: `InlineDiffExtension` 产生 ProseMirror DecorationSet
  - S3: 清除 diff 数据后 DecorationSet 为空
  - S4: decoration CSS class 包含 `inline-diff-added`/`inline-diff-removed`
- [x] 1.2 重构 `inlineDiff.ts` 为真正 TipTap Extension（Green 阶段）
  - `Extension.create({ addProseMirrorPlugins() })` + `DecorationSet`
  - 插入行 class: `inline-diff-added`
  - 删除行 class: `inline-diff-removed` + line-through
- [x] 1.3 新增 CSS 样式到 `main.css`
- [x] 1.4 更新 `InlineDiffExtensionContract` 类型兼容
- [x] 1.5 Refactor：抽取 `diffToDecorationSet()` 纯函数

## 2. Testing

- [x] 2.1 `pnpm -C apps/desktop test:run features/editor/__tests__/inlineDiff.decoration` 全绿
- [x] 2.2 `pnpm -C apps/desktop test:run` 全量回归无新增失败
- [x] 2.3 `pnpm typecheck` 无错误

## 3. Documentation

- [x] 3.1 更新 `openspec/_ops/task_runs/ISSUE-935.md` RUN_LOG
- [x] 3.2 勾选 `openspec/changes/fe-editor-inline-diff-decoration-integration/tasks.md`
