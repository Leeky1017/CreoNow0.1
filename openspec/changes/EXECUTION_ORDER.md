# Capability Closure — Active Changes Execution Order

> “举纲而张目，振领而群毛顺。”——先立总纲，再分波次实施，方能使 change、EO、事实表与 GitHub 交付链路同向而行。

## 一、当前真相

- 当前活跃 change 数量：**17**
- 能力收口 umbrella：`a1-capability-closure-program`
- 能力收口 child changes：**15 个**
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
| 1    | `a1-01-chat-history-persistence`                  | #1124        | AI 对话连续性与历史恢复                  |
| 2    | `a1-02-settings-surface-completion`               | #1125        | Settings 内未接通页面与 Account 状态收口 |
| 3    | `a1-03-backup-service-closure`                    | #1126        | 把 backupInterval 从偏好键升级为真实闭环 |
| 4    | `a1-12-provider-preflight-validation`             | #1127        | Provider 配置前置校验与模型有效性提示    |
| 5    | `a1-04-release-observability-and-keyboard-compat` | #1128        | crash reporting + Windows 键盘兼容证据   |
| 6    | `a1-06-version-restore-activation`                | #1129        | 版本恢复真正可用                         |
| 7    | `a1-07-editor-link-and-bubblemenu-closure`        | #1130        | BubbleMenu 链接编辑收口                  |
| 8    | `a1-15-inline-diff-activation`                    | #1131        | InlineDiff 注册、展示与应用闭环          |

### 2.3 Wave 2：再补“能用但不够真”的中层能力

| 顺位 | Change                                          | GitHub Issue | 说明                            |
| ---- | ----------------------------------------------- | ------------ | ------------------------------- |
| 9    | `a1-05-search-completion-and-cjk`               | #1132        | 搜索扩展入口、跨项目与 CJK 质量 |
| 10   | `a1-08-judge-advanced-evaluation`               | #1133        | Judge 高级语义评估              |
| 11   | `a1-09-skill-output-validation-expansion`       | #1134        | Skill 输出校验扩面              |
| 12   | `a1-14-skill-routing-and-discoverability`       | #1135        | Skill 路由发现性与关键词覆盖    |
| 13   | `a1-10-kg-recognition-and-character-navigation` | #1136        | KG 识别升级与角色导航           |
| 14   | `a1-13-kg-scale-and-query-safety`               | #1137        | KG 分页、路径查询安全与规模治理 |

### 2.4 Wave 3：最后补语义底座

| 顺位 | Change                                       | GitHub Issue | 说明                                       |
| ---- | -------------------------------------------- | ------------ | ------------------------------------------ |
| 15   | `a1-11-memory-semantic-and-conflict-upgrade` | #1138        | 负反馈学习、真 embedding、真蒸馏、冲突处理 |

### 2.5 并行保留项

| 顺位 | Change                           | GitHub Issue          | 说明                                                                       |
| ---- | -------------------------------- | --------------------- | -------------------------------------------------------------------------- |
| 16   | `t-mig-test-structure-migration` | 待创建 umbrella issue | 测试结构存量迁移；与 capability closure 并行存在，但优先级低于 Wave 1 收口 |

## 三、依赖关系说明

- `a1-02-settings-surface-completion` 与 `a1-03-backup-service-closure` 强相关：前者负责入口与说明，后者负责真实能力闭环
- `a1-12-provider-preflight-validation` 用于承接 factsheet 中 API Key 长度校验过浅、模型名无前置校验的信任缺口
- `a1-04-release-observability-and-keyboard-compat` 产物会回写 factsheet / release boundary，对后续 child changes 的平台口径有约束作用
- `a1-15-inline-diff-activation` 用于承接当前 Diff 对比能力里“InlineDiff 扩展已写但未注册到编辑器”的剩余收口项
- `a1-08-judge-advanced-evaluation` 依赖 AI provider / fallback 链路保持稳定
- `a1-14-skill-routing-and-discoverability` 与 `a1-09-skill-output-validation-expansion` 同处 skill-system，应共享用户可见文案、路由策略与错误收口口径
- `a1-10-kg-recognition-and-character-navigation` 与 `a1-13-kg-scale-and-query-safety` 在知识图谱层形成“识别/导航”与“规模/安全”两段式收口，应共用查询契约
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
