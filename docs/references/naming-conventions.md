# 命名约定

更新时间：2026-03-04 16:00

## Git 实体

| 实体     | 格式                                   | 示例                               |
| -------- | -------------------------------------- | ---------------------------------- |
| Issue    | GitHub Issue，自动分配编号 `N`         | `#42`                              |
| Branch   | `task/<N>-<slug>`                      | `task/42-memory-decay`             |
| Commit   | `<type>: <summary> (#<N>)`             | `feat: add memory decay (#42)`     |
| PR title | `<summary> (#<N>)`                     | `Add memory decay (#42)`           |
| PR body  | 必须包含 `Closes #<N>`                 | `Closes #42`                       |
| Worktree | `.worktrees/issue-<N>-<slug>`          | `.worktrees/issue-42-memory-decay` |

Commit type 可选值：`feat` / `fix` / `refactor` / `test` / `docs` / `chore` / `ci`

## 代码命名

| 类别       | 风格            | 示例                     |
| ---------- | --------------- | ------------------------ |
| 文件名     | kebab-case      | `context-engine.ts`      |
| 类名       | PascalCase      | `ContextEngine`          |
| 函数名     | camelCase       | `buildContext`           |
| 常量       | UPPER_SNAKE     | `MAX_TOKEN_BUDGET`       |
| 类型/接口  | PascalCase      | `ContextLayer`           |
| IPC 通道   | `domain:action` | `editor:save-document`   |
| 测试文件   | `*.test.ts`     | `context-engine.test.ts` |
| Story 文件 | `*.stories.tsx` | `Button.stories.tsx`     |

## 测试命名

- 测试套件：`describe('<ModuleName>')`
- 测试用例：`it('should <期望行为> when <前置条件>')`
- 测试结构：严格 AAA（Arrange-Act-Assert），段间空行分隔

## OpenSpec 命名

| 实体            | 格式                                               |
| --------------- | -------------------------------------------------- |
| 模块 spec       | `openspec/specs/<module>/spec.md`                  |
| Change 目录     | `openspec/changes/<change-name>/`                  |
| Delta spec      | `openspec/changes/<change>/specs/<module>/spec.md` |
| Proposal        | `openspec/changes/<change>/proposal.md`            |
| Tasks           | `openspec/changes/<change>/tasks.md`               |
| Execution Order | `openspec/changes/EXECUTION_ORDER.md`              |
