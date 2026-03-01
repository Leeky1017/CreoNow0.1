更新时间：2026-03-01 19:40

## 1. Governance

- [x] 1.1 绑定 OPEN Issue `#815` 与任务分支 `task/815-fe-cleanup-proxysection-and-mocks`
- [x] 1.2 完成 Spec/Change 阅读链与边界确认（仅清理，不新增功能）
- [x] 1.3 建立 Rulebook task 目录并纳入 preflight 校验

## 2. Implementation & Tests

- [x] 2.1 删除 `ProxySection` 死代码并清理引用
- [x] 2.2 移除 `SearchPanel` 生产路径 mock 数据（迁移至 story）
- [x] 2.3 清理 `ChatHistory` 硬编码历史并改为空状态
- [x] 2.4 修复 `RightPanel` 历史选择 no-op 占位交互
- [x] 2.5 新增 guard 测试（dead code / mock / ghost interaction）

## 3. Evidence & Delivery

- [x] 3.1 RUN_LOG 已落盘：`openspec/_ops/task_runs/ISSUE-815.md`
- [x] 3.2 独立审计记录已落盘：`openspec/_ops/reviews/ISSUE-815.md`
- [x] 3.3 fresh verification 通过（typecheck + 目标测试）
- [x] 3.4 三个 required checks 全绿并合并到 `main`
