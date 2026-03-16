# A1 能力收口总控计划

- **GitHub Issue**: #1122
- **涉及模块**: cross-module
- **前端验收**: 是（取决于 child change）

---

## Why：为什么要起这把总伞

当前 `docs/release/v0.1-fact-sheet.md` 中，仍有一组能力明确处于 **❌ 未实现 / 占位** 或 **⚠️ 受限未完全实现** 的状态。它们分散在 AI 面板、设置系统、备份、搜索、版本历史、知识图谱、记忆系统与发布可观测性边界中。

这些问题有两个共同特征：

1. **不能再直接用零散 PR 各自偷渡**——否则 EO、factsheet、OpenSpec 与 GitHub 审计链路会再次漂移。
2. **也不适合压成一个 mega change**——否则后续 TDD、Issue、PR、独立审计都会失焦。

因此，本 umbrella change 的职责不是直接实现所有能力，而是先把“这批能力补完工程”组织成一套**可执行、可审计、可串并行调度**的 change 体系。

---

## What：本 umbrella 做什么

1. 为当前明确未实现与受限未完全实现的能力建立 **11 个子 change**
2. 为每个子 change 提供最小可执行文档：
   - `proposal.md`
   - `tasks.md`
   - 至少 1 份 delta spec
3. 更新 `openspec/changes/EXECUTION_ORDER.md`，把这些 change 纳入统一执行顺序
4. 明确三层推进波次：
   - Wave 1：先补用户可见入口与可信度
   - Wave 2：再补 Search / Judge / KG 这类“能用但不够真”的能力
   - Wave 3：最后补 Memory 的语义底座与冲突处理

---

## 子 change 清单

| 顺位 | Change                                            | 核心目标                                 |
| ---- | ------------------------------------------------- | ---------------------------------------- |
| 1    | `a1-01-chat-history-persistence`                  | AI 聊天历史持久化                        |
| 2    | `a1-02-settings-surface-completion`               | Settings 内未接通页面与 Account 状态收口 |
| 3    | `a1-03-backup-service-closure`                    | 应用级备份真实闭环                       |
| 4    | `a1-04-release-observability-and-keyboard-compat` | 崩溃报告上传与 Windows 键盘兼容          |
| 5    | `a1-05-search-completion-and-cjk`                 | 搜索 UI 补完与 CJK 质量提升              |
| 6    | `a1-06-version-restore-activation`                | 版本恢复能力接通                         |
| 7    | `a1-07-editor-link-and-bubblemenu-closure`        | 编辑器链接/BubbleMenu 收口               |
| 8    | `a1-08-judge-advanced-evaluation`                 | Judge 高级语义评估闭环                   |
| 9    | `a1-09-skill-output-validation-expansion`         | Skill 输出校验从局部扩到矩阵             |
| 10   | `a1-10-kg-recognition-and-character-navigation`   | KG 识别升级与角色导航                    |
| 11   | `a1-11-memory-semantic-and-conflict-upgrade`      | Memory 语义底座与冲突处理                |

---

## Non-Goals：本 umbrella 不做什么

1. **不在本 PR 内直接落工程实现**
2. 不绕开 OpenSpec / GitHub 流程去“先修后补文档”
3. 不把 11 个能力硬塞成一个超大 PR
4. 不修改 Linux 平台支持范围（不在本轮规划内）

---

## 依赖与影响

- **当前活跃 change**：`t-mig-test-structure-migration`
- **本 umbrella 的关系**：与 T-MIG 并行存在，但 EO 中优先级另行声明
- **下游影响**：后续所有 capability closure implementation PR 都应从本 umbrella 子 change 派生
