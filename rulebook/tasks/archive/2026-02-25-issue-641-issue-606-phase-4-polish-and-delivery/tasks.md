# issue-641-issue-606-phase-4-polish-and-delivery

更新时间：2026-02-25 09:41

## 1. Specification

- [x] 1.1 校验 Issue `#641` OPEN 状态并记录证据（若网络受限则记录 blocker）
- [x] 1.2 创建 Rulebook task：`issue-641-issue-606-phase-4-polish-and-delivery`
- [x] 1.3 初始化 RUN_LOG：`openspec/_ops/task_runs/ISSUE-641.md`
- [x] 1.4 阅读并确认 change 范围：`openspec/changes/archive/issue-606-phase-4-polish-and-delivery/{proposal.md,tasks.md}`
- [x] 1.5 评估并同步 `openspec/changes/EXECUTION_ORDER.md`（如存在状态漂移）
- [x] 1.6 记录依赖同步检查（Dependency Sync Check）输入与初始结论

## 2. TDD Mapping（先测前提）

- [x] 2.1 引用 Scenario->测试映射来源：`openspec/changes/archive/issue-606-phase-4-polish-and-delivery/tasks.md`
- [x] 2.2 建立治理场景 -> 校验命令映射（Issue freshness / Rulebook validate / doc timestamp gate）
- [x] 2.3 设定门禁：未出现 Red（失败测试）不得进入实现

### Scenario -> 校验映射

| Scenario ID | 校验命令 / 证据来源                                                      | 通过标准                            |
| ----------- | ------------------------------------------------------------------------ | ----------------------------------- |
| GOV-641-S1  | `gh issue view 641 --json ...`                                           | Issue 为 `OPEN`；失败需落盘 blocker |
| GOV-641-S2  | `rulebook task validate issue-641-issue-606-phase-4-polish-and-delivery` | validate 通过                       |
| GOV-641-S3  | `python3 scripts/check_doc_timestamps.py --files ...`                    | 受管 markdown 时间戳校验通过        |
| GOV-641-S4  | `openspec/changes/EXECUTION_ORDER.md` diff                               | 进度快照与主干事实一致              |

## 3. Red（先写失败测试）

- [x] 3.1 记录 Issue freshness 查询 Red：`gh issue view 641` 因网络不可达失败
- [x] 3.2 若后续发现 execution-order/门禁漂移，补充对应失败证据

## 4. Green（最小实现通过）

- [x] 4.1 回填 Rulebook + RUN_LOG 治理脚手架
- [x] 4.2 同步 `EXECUTION_ORDER.md` 进度快照陈旧状态
- [x] 4.3 完成 Rulebook validate + 文档时间戳校验
- [x] 4.4 网络恢复后补齐 Issue OPEN 与 PR 链接真值

## 5. Refactor（保持绿灯）

- [x] 5.1 收敛 #641 文档措辞与 `issue-606-phase-4-polish-and-delivery` change 描述
- [x] 5.2 汇总 Main Session Audit 签字输入（由主会话签字提交完成）

## 6. Evidence

- [x] 6.1 记录 `rulebook task create` / `rulebook task validate` 输出到 RUN_LOG
- [x] 6.2 记录 `check_doc_timestamps.py` 输出到 RUN_LOG
- [x] 6.3 记录 `gh issue view 641` 网络阻塞证据到 RUN_LOG
- [x] 6.4 PR 创建后回填 ISSUE-641 RUN_LOG 的真实 PR URL（禁止占位符）
- [x] 6.5 required checks 全绿 + auto-merge + main 收口证据
