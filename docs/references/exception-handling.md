# 异常处理

更新时间：2026-03-01 14:10

| 遇到的情况                           | 必须做                                                                                                   | 禁止做                     |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------- | -------------------------- |
| Spec 不存在或不完整                  | 通知 Owner，请求补充 spec                                                                                | 根据猜测直接写代码         |
| 开发中发现 spec 遗漏场景             | 写 delta spec 补充 → 通知 Owner → 等确认                                                                 | 只写测试不更新 spec        |
| 上游依赖产出与当前 change 假设不一致 | 先做 Dependency Sync Check 并记录 → 更新 proposal/spec/tasks（必要时更新 EXECUTION_ORDER）→ 经确认后继续 | 跳过更新直接进入 Red/Green |
| `gh` 命令超时                        | 重试 3 次（间隔 10s），仍失败 → 记录 RUN_LOG → 升级                                                      | 静默忽略                   |
| PR 需要 review                       | 记录 blocker → 通知 reviewer → 等待                                                                      | 静默放弃                   |
| 独立审计缺失或失败                   | 补齐 `openspec/_ops/reviews/ISSUE-<N>.md`，并确保 `Author-Agent != Reviewer-Agent`、`Decision=PASS`、`Reviewed-HEAD-SHA == HEAD^^`（代码审计基线） | 跳过独立审计直接合并       |
| CI 失败                              | 修复 → push → 再次 watch → 写入 RUN_LOG                                                                  | 先合并再修                 |
| Rulebook task 缺失或不合规           | 阻断交付，先修复 Rulebook 再继续（active 必须 validate；archive 必须结构完整）                           | 跳过 Rulebook 直接实现     |
| 非 `task/*` 分支提交 PR              | PR body 必须包含 `Skip-Reason:`                                                                          | 不说明原因直接跳过 RUN_LOG |
| required checks 与交付规则文档不一致 | 阻断交付并升级治理，先完成对齐                                                                           | 继续宣称门禁全绿           |
| 任务超出 spec 范围                   | 先补 spec → 经 Owner 确认后再做                                                                          | 超范围自由发挥             |
| 误用已关闭/历史 Issue                | 立即停止实现 → 新建 OPEN Issue → 从最新 `origin/main` 重建 worktree → 记录 RUN_LOG                       | 继续沿用旧 Issue 开发      |
| RUN_LOG 的 PR 字段为占位符           | 先回填真实 PR 链接再宣称交付完成                                                                         | 带占位符进入合并流程       |
| 活跃 change 全部完成但未归档         | 归档到 `openspec/changes/archive/` 再继续                                                                | 遗留在活跃目录             |
