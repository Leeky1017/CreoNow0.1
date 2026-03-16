# Capability Closure — Active Changes Execution Order

> “举纲而张目，振领而群毛顺。”——先立总纲，再分波次实施，方能使 change、EO、事实表与 GitHub 交付链路同向而行。

## 一、当前真相

- 当前活跃 change 数量：**13**
- 能力收口 umbrella：`a1-capability-closure-program`
- 能力收口 child changes：**11 个**
- 既有活跃 change：`t-mig-test-structure-migration`
- Phase 0 的 A0 / G0 / G0.5 仍保持已归档状态，不在本文件中复活

## 二、执行顺序（总览）

### 2.1 总控层

| 顺位 | Change                          | GitHub Issue | 说明                                                |
| ---- | ------------------------------- | ------------ | --------------------------------------------------- |
| 0    | `a1-capability-closure-program` | #1122        | 本轮能力收口总控；负责建立 child changes 与 EO 排程 |

### 2.2 Wave 1：先补用户可见入口与可信度

| 顺位 | Change                                            | GitHub Issue | 说明                                     |
| ---- | ------------------------------------------------- | ------------ | ---------------------------------------- |
| 1    | `a1-01-chat-history-persistence`                  | 待创建       | AI 对话连续性与历史恢复                  |
| 2    | `a1-02-settings-surface-completion`               | 待创建       | Settings 内未接通页面与 Account 状态收口 |
| 3    | `a1-03-backup-service-closure`                    | 待创建       | 把 backupInterval 从偏好键升级为真实闭环 |
| 4    | `a1-04-release-observability-and-keyboard-compat` | 待创建       | crash reporting + Windows 键盘兼容证据   |
| 5    | `a1-06-version-restore-activation`                | 待创建       | 版本恢复真正可用                         |
| 6    | `a1-07-editor-link-and-bubblemenu-closure`        | 待创建       | BubbleMenu 链接编辑收口                  |

### 2.3 Wave 2：再补“能用但不够真”的中层能力

| 顺位 | Change                                          | GitHub Issue | 说明                            |
| ---- | ----------------------------------------------- | ------------ | ------------------------------- |
| 7    | `a1-05-search-completion-and-cjk`               | 待创建       | 搜索扩展入口、跨项目与 CJK 质量 |
| 8    | `a1-08-judge-advanced-evaluation`               | 待创建       | Judge 高级语义评估              |
| 9    | `a1-09-skill-output-validation-expansion`       | 待创建       | Skill 输出校验扩面              |
| 10   | `a1-10-kg-recognition-and-character-navigation` | 待创建       | KG 识别升级与角色导航           |

### 2.4 Wave 3：最后补语义底座

| 顺位 | Change                                       | GitHub Issue | 说明                                       |
| ---- | -------------------------------------------- | ------------ | ------------------------------------------ |
| 11   | `a1-11-memory-semantic-and-conflict-upgrade` | 待创建       | 负反馈学习、真 embedding、真蒸馏、冲突处理 |

### 2.5 并行保留项

| 顺位 | Change                           | GitHub Issue          | 说明                                                                       |
| ---- | -------------------------------- | --------------------- | -------------------------------------------------------------------------- |
| 12   | `t-mig-test-structure-migration` | 待创建 umbrella issue | 测试结构存量迁移；与 capability closure 并行存在，但优先级低于 Wave 1 收口 |

## 三、依赖关系说明

- `a1-02-settings-surface-completion` 与 `a1-03-backup-service-closure` 强相关：前者负责入口与说明，后者负责真实能力闭环
- `a1-04-release-observability-and-keyboard-compat` 产物会回写 factsheet / release boundary，对后续 child changes 的平台口径有约束作用
- `a1-08-judge-advanced-evaluation` 依赖 AI provider / fallback 链路保持稳定
- `a1-10-kg-recognition-and-character-navigation` 与 `a1-05-search-completion-and-cjk` 在导航与检索层面存在耦合，应共享命名与跳转契约
- `a1-11-memory-semantic-and-conflict-upgrade` 放在最后，是为了避免在上层入口尚未稳定时过早更换语义底座

## 四、当前 PR 的职责边界

本轮 PR **只做文档立项**：

- 建立 umbrella + child changes
- 为每个 change 写 proposal / tasks / 最小 delta spec
- 同步 EO

**不直接进入工程实现**。后续每个 child change 必须：

1. 创建独立 Issue
2. 从最新 `origin/main` 建立 task worktree
3. 按 spec-first + TDD 落地
4. 经独立审计 ACCEPT 后合并
