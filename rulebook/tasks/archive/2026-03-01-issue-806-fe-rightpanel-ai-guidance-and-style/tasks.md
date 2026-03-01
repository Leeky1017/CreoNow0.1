更新时间：2026-03-01 16:45

## 1. Governance

- [x] 1.1 确认交付 Issue 使用 OPEN 的 `#806`
- [x] 1.2 完成阅读链与依赖同步检查（`fe-rightpanel-ai-tabbar-layout` 已归档，PR #801）
- [x] 1.3 完成 Rulebook task validate（`pnpm rulebook task validate issue-806-fe-rightpanel-ai-guidance-and-style`）

## 2. Implementation & Tests

- [x] 2.1 `DB_ERROR` 分流到引导卡并展示 remediation 命令
- [x] 2.2 `AI_NOT_CONFIGURED` 分流到 `Settings -> AI` 引导，`UPSTREAM_ERROR` 保持通用错误卡
- [x] 2.3 `OpenSettingsContext` 扩展目标 tab，RightPanel/AppShell 打通定向打开能力
- [x] 2.4 移除 `AiPanel` 内联 `<style>`，动画迁移到 `main.css` 并支持 reduced motion
- [x] 2.5 新增 `AiPanel.error-guide.test.tsx` 与 `AiPanel.styles.guard.test.ts`
- [x] 2.6 更新 `workbench.stories.snapshot` 并完成全量测试回归

## 3. Evidence & Delivery

- [x] 3.1 更新 `openspec/changes/fe-rightpanel-ai-guidance-and-style/tasks.md`
- [x] 3.2 新建并填写 `openspec/_ops/task_runs/ISSUE-806.md`
- [x] 3.3 创建 PR 并回填 RUN_LOG 的真实 PR 链接（https://github.com/Leeky1017/CreoNow/pull/809）
- [x] 3.4 独立审计 PASS（`openspec/_ops/reviews/ISSUE-806.md`）后再进入合并链路
