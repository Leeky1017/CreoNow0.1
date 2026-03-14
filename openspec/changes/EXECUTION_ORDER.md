# Phase 0 — Archived Changes Execution Order

> "事了拂衣去，深藏功与名。"——Phase 0 的门禁、止血与审计补丁已全部并入 `main`，现仅保留存量迁移总控继续推进。

## 一、当前真相

- 当前活跃 change 数量：**1**
- 当前唯一活跃 change：`t-mig-test-structure-migration`
- Phase 0 实施 change：**24 个 A0 + 6 个 G0.5** 已全部合并并归档到 `openspec/changes/archive/`
- Wave 0 门禁基础设施（G0-01 ~ G0-06）此前已归档；本文件不再把已完成 Phase 0 change 记作活跃执行项

## 二、当前唯一执行顺序

| 顺位 | Change                           | GitHub Issue          | 说明                                                             |
| ---- | -------------------------------- | --------------------- | ---------------------------------------------------------------- |
| 1    | `t-mig-test-structure-migration` | 待创建 umbrella issue | 存量测试结构迁移总控；Phase 0 完成后继续作为唯一活跃 change 推进 |

## 三、Phase 0 归档台账

### 3.1 Wave 0.5 审计补丁（本次一并归档）

| Change                              | Issue | PR    | 结果           |
| ----------------------------------- | ----- | ----- | -------------- |
| `g05-01-require-describe-in-tests`  | #1072 | #1078 | 已合并，已归档 |
| `g05-02-backend-coverage-threshold` | #1073 | #1079 | 已合并，已归档 |
| `g05-03-format-check-ci`            | #1074 | #1080 | 已合并，已归档 |
| `g05-04-review-audit-script`        | #1075 | #1081 | 已合并，已归档 |
| `g05-05-e2e-path-mapping`           | #1076 | #1082 | 已合并，已归档 |
| `g05-06-visual-regression-testing`  | #1077 | #1083 | 已合并，已归档 |

### 3.2 A0 止血实现（24/24 全部完成）

| Change                                  | Issue | PR    | 结果           |
| --------------------------------------- | ----- | ----- | -------------- |
| `a0-01-zen-mode-editable`               | #986  | #1111 | 已合并，已归档 |
| `a0-02-autosave-visible-failure`        | #992  | #1106 | 已合并，已归档 |
| `a0-03-renderer-global-error-fallback`  | #993  | #1102 | 已合并，已归档 |
| `a0-04-export-honest-grading`           | #1002 | #1048 | 已合并，已归档 |
| `a0-05-skill-router-negation-guard`     | #987  | #1100 | 已合并，已归档 |
| `a0-06-release-fact-sheet`              | #999  | #1097 | 已合并，已归档 |
| `a0-07-windows-release-boundary-audit`  | #1000 | #1098 | 已合并，已归档 |
| `a0-08-backup-capability-decision`      | #1035 | #1095 | 已合并，已归档 |
| `a0-09-i18n-inventory-audit`            | #990  | #1101 | 已合并，已归档 |
| `a0-10-search-mvp`                      | #1003 | #1103 | 已合并，已归档 |
| `a0-11-data-safety-boundary-statement`  | #1001 | #1099 | 已合并，已归档 |
| `a0-12-inline-ai-baseline`              | #1004 | #1113 | 已合并，已归档 |
| `a0-13-toast-app-integration`           | #981  | #1092 | 已合并，已归档 |
| `a0-14-settings-general-persistence`    | #994  | #1104 | 已合并，已归档 |
| `a0-15-placeholder-ui-closure`          | #995  | #1105 | 已合并，已归档 |
| `a0-16-editor-version-slash-i18n`       | #991  | #1109 | 已合并，已归档 |
| `a0-17-backup-entry-resolution`         | #996  | #1110 | 已合并，已归档 |
| `a0-18-judge-capability-resolution`     | #997  | #1096 | 已合并，已归档 |
| `a0-19-export-plain-text-labeling`      | #998  | #1112 | 已合并，已归档 |
| `a0-20-error-message-humanization`      | #983  | #1093 | 已合并，已归档 |
| `a0-21-error-surface-closure`           | #988  | #1107 | 已合并，已归档 |
| `a0-22-i18n-error-copy-cleanup`         | #989  | #1108 | 已合并，已归档 |
| `a0-23-document-size-limit-enforcement` | #984  | #1065 | 已合并，已归档 |
| `a0-24-skill-output-validation`         | #985  | #1094 | 已合并，已归档 |

## 四、依赖关系的终局说明

- `A0-20 -> A0-21 / A0-22`：已按顺序落地并归档
- `A0-01 -> A0-12`：已先合并禅模式真实编辑，再合并 Inline AI
- `A0-08 -> A0-17`：已先完成事实核查，再完成入口决策
- `A0-04 -> A0-19`：已先校正导出能力分级，再落地纯文本诚实标注
- `A0-15` 与后续 placeholder / i18n / error-surface 基线漂移：已在串行合并过程中吸收并统一收口

## 五、控制面说明

- `openspec/changes/` 根目录现在只保留：
  - `archive/`
  - `t-mig-test-structure-migration/`
- 若后续继续推进测试结构迁移，必须以 `t-mig-test-structure-migration` 作为唯一活跃 change 继续拆分与交付
- 若后续新增 Phase 1 / Phase 2 change，需新建独立 change，不得复活已归档的 Phase 0 目录
