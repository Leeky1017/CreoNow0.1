更新时间：2026-03-02 19:42

## 1. Implementation

- [x] 1.1 新增 `--color-selection` Token（亮/暗两套值）到 `tokens.css`
- [x] 1.2 新增 `--color-caret` Token 到 `tokens.css`
- [x] 1.3 新增 `--text-editor-paragraph-spacing` Token 到 `tokens.css`
- [x] 1.4 `main.css` 新增 ProseMirror 样式规则：
  - [x] 1.4.1 `.ProseMirror ::selection { background: var(--color-selection); }`
  - [x] 1.4.2 `.ProseMirror { caret-color: var(--color-caret); }`
  - [x] 1.4.3 `.ProseMirror p + p { margin-top: var(--text-editor-paragraph-spacing); }`

## 2. Testing

- [x] 2.1 Guard 测试 5 个 Scenario 全通过
- [x] 2.2 全量回归 219 文件 / 1650 测试全绿

## 3. Documentation

- [x] 3.1 RUN_LOG `openspec/_ops/task_runs/ISSUE-915.md` 已记录 Red/Green/全量回归
