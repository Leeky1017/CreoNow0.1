# ISSUE-915
- Issue: #915
- Branch: task/915-fe-editor-tokens
- PR: <fill-after-created>

## Plan
- 新增 selection/caret/paragraph-spacing Token
- main.css ProseMirror 区域应用
- Guard 测试覆盖 5 个 Scenario

## Runs
### 2026-03-02 19:38 Red
- Command: `pnpm -C apps/desktop test:run features/editor/__tests__/editor-selection-token.guard`
- Key output: Tests 5 failed (5)

### 2026-03-02 19:38 Green
- Command: `pnpm -C apps/desktop test:run features/editor/__tests__/editor-selection-token.guard`
- Key output: Tests 5 passed (5)

### 2026-03-02 19:41 全量回归
- Command: `pnpm -C apps/desktop test:run`
- Key output: Test Files 219 passed (219), Tests 1650 passed (1650)
