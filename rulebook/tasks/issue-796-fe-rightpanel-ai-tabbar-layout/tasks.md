更新时间：2026-03-01 10:21

## 1. Implementation
- [x] 1.1 对齐 change 目标与实现边界：RightPanel 承接 AI 动作区，AiPanel 取消内部 header
- [x] 1.2 完成入口迁移：History/NewChat 从 AiPanel header 迁移到 RightPanel tab bar（仅 AI tab 显示）
- [x] 1.3 完成 candidateCount UI 治理：移除主界面循环按钮，保留 `creonow.ai.candidateCount` 持久化与运行参数

## 2. Testing
- [x] 2.1 已记录 Red 证据：`RightPanel.ai-tabbar-actions` 与 `AiPanel.layout` 定向测试失败（见 RUN_LOG）
- [x] 2.2 已记录 Green 证据：上述两条定向测试复跑通过（见 RUN_LOG）
- [x] 2.3 全量回归（`pnpm -C apps/desktop test:run`）已执行并通过（`190 files / 1556 tests`，见 RUN_LOG）

## 3. Delivery
- [ ] 3.1 PR 未创建（本次仅做文档治理补齐，不提交）
- [ ] 3.2 required checks（`ci` / `openspec-log-guard` / `merge-serial`）未触发
- [ ] 3.3 main 同步与 auto-merge 收口待后续正式提交流程
