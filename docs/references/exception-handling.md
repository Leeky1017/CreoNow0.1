# 异常处理


| 遇到的情况                           | 必须做                                                                                                   | 禁止做                     |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------- | -------------------------- |
| Spec 不存在或不完整                  | 通知 Owner，请求补充 spec                                                                                | 根据猜测直接写代码         |
| 开发中发现 spec 遗漏场景             | 写 delta spec 补充 → 通知 Owner → 等确认                                                                 | 只写测试不更新 spec        |
| 上游依赖产出与当前 change 假设不一致 | 先做 Dependency Sync Check 并记录 → 更新 proposal/spec/tasks（必要时更新 EXECUTION_ORDER）→ 经确认后继续 | 跳过更新直接进入 Red/Green |
| `gh` 命令超时                        | 重试 3 次（间隔 10s），仍失败 → 记录到 PR comment → 升级                                                 | 静默忽略                   |
| PR 需要 review                       | 记录 blocker → 通知 reviewer → 等待                                                                      | 静默放弃                   |
| CI 失败                              | 修复 → push → 再次 watch → 记录到 PR comment                                                             | 先合并再修                 |
| 非 `task/*` 分支提交 PR              | PR body 必须包含 `Skip-Reason:`                                                                          | 不说明原因直接跳过         |
| required checks 与交付规则文档不一致 | 阻断交付并升级治理，先完成对齐                                                                           | 继续宣称门禁全绿           |
| 任务超出 spec 范围                   | 先补 spec → 经 Owner 确认后再做                                                                          | 超范围自由发挥             |
| 误用已关闭/历史 Issue                | 立即停止实现 → 新建 OPEN Issue → 从最新 `origin/main` 重建 worktree                                      | 继续沿用旧 Issue 开发      |
| 审计发现 BLOCKER                     | 在 PR 评论中标注 🔴，等作者修复后复审                                                                     | 跳过问题直接 PASS          |
| 审计复审仍不通过                     | 通知 Owner 升级                                                                                          | 反复循环超过 3 轮不升级    |
