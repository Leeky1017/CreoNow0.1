# Active Changes Execution Order

> "举纲而张目，振领而群毛顺。"——先立总纲，再分波次实施，方能使 change、EO、事实表与 GitHub 交付链路同向而行。

## 一、当前真相

- 当前活跃 change 数量：**34**
- 能力收口 umbrella：`a1-capability-closure-program`（15 个 child changes）
- 视觉重塑 umbrella：`v1-00-visual-overhaul-program`（16 个 child changes）
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

---

## 三、V1 视觉重塑（Visual Overhaul）

> "底座精良，上层失序。" 能力收口（A1）解决的是"能用不能用"，视觉重塑（V1）解决的是"好看不好看"。

### 3.0 总控层

| 顺位 | Change | GitHub Issue | 说明 |
| --- | --- | --- | --- |
| 0 | `v1-00-visual-overhaul-program` | 待创建 | 视觉重塑总控；建立 child changes 与波次排程 |

### 3.1 Wave 0：地基增强（无用户可见变化）

| 顺位 | Change | GitHub Issue | 说明 |
| --- | --- | --- | --- |
| 1 | `v1-01-design-token-completion` | 待创建 | Typography scale、spacing 精细化、animation token |
| 2 | `v1-02-primitive-visual-evolution` | 待创建 | Button pill/ghost、Card bento、Tabs underline、Badge pill + Radio/Select/ImageUpload 解耦重构 |

### 3.2 Wave 1：P0 页面重塑

| 顺位 | Change | GitHub Issue | 说明 |
| --- | --- | --- | --- |
| 3 | `v1-03-dashboard-visual-rewrite` | 待创建 | DashboardPage shell 重写，对齐设计稿 |
| 4 | `v1-04-editor-typography-and-layout` | 待创建 | 编辑器 760px 居中、Lora serif、标题 48px/300 |
| 5 | `v1-05-editor-decomposition` | 待创建 | EditorPane 1,550→300 行组件解体 |

### 3.3 Wave 2：AI 面板 + 设置

| 顺位 | Change | GitHub Issue | 说明 |
| --- | --- | --- | --- |
| 6 | `v1-06-ai-panel-overhaul` | 待创建 | AiPanel 2,100→≤300 行 + accent 视觉标识 + Tab UI |
| 7 | `v1-07-settings-visual-polish` | 待创建 | Settings 外观页主题/色板/字体选择器 |

### 3.4 Wave 3：布局精度

| 顺位 | Change | GitHub Issue | 说明 |
| --- | --- | --- | --- |
| 8 | `v1-08-file-tree-precision` | 待创建 | 48px icon bar、32px 行高、拖拽手柄 |
| 9 | `v1-09-command-palette-and-search` | 待创建 | 分组分隔线、快捷键 pill、filter pills |

### 3.5 Wave 4：侧面板 + 收口

| 顺位 | Change | GitHub Issue | 说明 |
| --- | --- | --- | --- |
| 10 | `v1-11-empty-loading-error-states` | 待创建 | 空/加载/错误三状态标准组件 |
| 11 | `v1-10-side-panels-visual-coherence` | 待创建 | Character/Memory/Outline/KG/VersionHistory |
| 12 | `v1-12-interaction-motion-and-native-cleanup` | 待创建 | 过渡动效 + 200+ 原生 HTML 替换 + AppShell 1,260→≤250 解耦 |
| 13 | `v1-13-eslint-disable-audit` | 待创建 | eslint-disable 176→≤20 审计清扫 |

### 3.6 Wave 5：全覆盖收口（100% 用户路径覆盖）

| 顺位 | Change | GitHub Issue | 说明 |
| --- | --- | --- | --- |
| 14 | `v1-14-dialog-and-entry-pages` | 待创建 | ExportDialog/CreateProjectDialog/OnboardingPage 破坏性重构 + SettingsGeneral 对齐 |
| 15 | `v1-15-ai-overlay-components` | 待创建 | AiDiffModal/AiErrorCard/SystemDialog/AiInlineConfirm 解耦 + v1-06 视觉统一 |
| 16 | `v1-16-quality-rightpanel-and-misc` | 待创建 | Quality 面板 + Diff 模块 + Analytics/ZenMode/Shortcuts/Settings 子组件全覆盖 |

### 3.7 V1 依赖关系

- v1-01 → v1-02（primitive 使用新 token）
- v1-02 → v1-03 ~ v1-09（页面重写使用新 primitive 变体）
- v1-02 → v1-14（对话框使用重构后的 Radio/Select/ImageUpload）
- v1-11 → v1-10（面板统一使用标准状态组件）
- v1-06 → v1-15（AI Overlay 必须在 AiPanel 视觉定稿后实施）
- v1-10 → v1-16（Quality/Diff 使用 PanelHeader 组件）
- v1-12 → v1-13（前者替换大部分原生 HTML，后者审计剩余 eslint-disable）
- v1-13 → v1-14/15/16（Wave 5 在 Wave 4 收口后实施）
- A1（能力收口）Wave 1 → V1 Wave 1（避免同时修改同一模块）

### 3.8 V1 与 A1 的交叉协调

V1 覆盖 `renderer/src/features/` 和 `renderer/src/components/` 下的全部 JSX/CSS 层，不碰 Store、IPC、Service。Wave 5（v1-14/15/16）确保用户可触达的 100% 前端路径都经过视觉/结构重构。A1 主要修改后端能力闭环。两者可并行推进，但对同一 feature 模块（如 `ai/`、`search/`）的 change 应串行合并以避免冲突。

---

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
