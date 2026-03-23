# v1-14a: 补齐 + 对话框交互遗留

> 属于 v1-14-\*（父 change），详细设计见父 change 的 proposal.md。

## 语境

v1-14 主体（AC-1～AC-16）已合并（PR #1198）。AC-17（模板自动选中）与 AC-18（导出取消链路）被标记为后续约束，记录于 Issue #1199。

## 当前状态

- `grep -rn 'autoSelect\|justCreated\|onTemplateCreated' SRC/features/projects/` → 0 hits
- `grep -rn 'abort' SRC/features/export/` → 0 hits（仅有前端 `onCancel` 回调，无真实中止链路）

## 目标状态

- AC-17：`CreateProjectDialog` 新建模板成功后自动选中 → grep `autoSelect\|onTemplateCreated` → ≥1 hit
- AC-18：`ExportDialog` 导出进度态 Cancel 触发真实 abort → grep `abort` → ≥1 hit（含 IPC / main 侧）

## 不做什么

- 不修改已完成的 AC-1～AC-16 相关代码
- 不重构已拆分的文件结构

## 完成验证

1. `grep -rn 'autoSelect\|onTemplateCreated' SRC/features/projects/` → ≥1
2. `grep -rn 'abort' SRC/features/export/` → ≥1（非 stories）
3. `pnpm typecheck` → 0 errors
4. `pnpm -C apps/desktop exec vitest run export project` → all pass
