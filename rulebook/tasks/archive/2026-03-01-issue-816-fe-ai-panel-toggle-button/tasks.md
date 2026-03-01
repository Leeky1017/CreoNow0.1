更新时间：2026-03-01 19:40

## 1. Governance

- [x] 1.1 绑定 OPEN Issue `#816` 与任务分支 `task/816-fe-ai-panel-toggle-button`
- [x] 1.2 完成 Spec/Change 阅读链与边界确认（新增入口，不扩展 AI 内部能力）
- [x] 1.3 建立 Rulebook task 目录并纳入 preflight 校验

## 2. Implementation & Tests

- [x] 2.1 `AppShell` 新增 AI toggle 按钮（tooltip + min 24px 触达）
- [x] 2.2 实现三路 toggle 语义（collapsed/open-ai/open-other）
- [x] 2.3 统一按钮/快捷键/命令面板逻辑到单路径
- [x] 2.4 新增并通过 `AppShell.ai-toggle.test.tsx` 行为测试（6 条）
- [x] 2.5 回归 `AppShell.test.tsx` 与 typecheck 通过

## 3. Evidence & Delivery

- [x] 3.1 RUN_LOG 已落盘：`openspec/_ops/task_runs/ISSUE-816.md`
- [x] 3.2 独立审计记录已落盘：`openspec/_ops/reviews/ISSUE-816.md`
- [x] 3.3 fresh verification 通过（typecheck + 目标测试）
- [x] 3.4 三个 required checks 全绿并合并到 `main`
