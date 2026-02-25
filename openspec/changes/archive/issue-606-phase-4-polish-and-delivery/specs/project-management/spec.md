# Project Management Specification Delta

更新时间：2026-02-22 12:22

## Change: issue-606-phase-4-polish-and-delivery

### Requirement: 设计交付物与 ADR 台账管理 [ADDED]

Phase 4 必须在 Project Management 范围内建立可追溯交付物台账，并以 ADR 记录关键设计决策，避免“口头约定”与重复决策。

- Phase 4 最低交付物集合：视觉审计报告、截图基线库、benchmark 报告、ADR 目录、CI 门禁配置说明、i18n 策略记录。
- 每项交付物必须包含状态（`draft`/`reviewing`/`accepted`）、最后更新时间、责任人。
- 涉及架构或交互取舍的变更必须绑定 ADR 编号与状态（`Proposed`/`Accepted`/`Deprecated`/`Superseded`）。

#### Scenario: 关键决策以 ADR 落盘并关联交付物 [ADDED]

- **假设** Phase 4 中出现新的设计或工程取舍
- **当** 变更进入审阅流程
- **则** 对应 ADR 已创建并与交付物台账互链
- **并且** 审阅人可追溯“背景-决策-备选方案-后果”

#### Scenario: 缺失 ADR 或交付物台账信息时阻断审阅 [ADDED]

- **假设** 某项变更缺少 ADR 编号或交付物状态信息
- **当** 执行阶段审阅
- **则** 系统返回阻断结果
- **并且** 要求补齐记录后再继续

### Requirement: 分支策略工程化落地 [ADDED]

Phase 4 分支策略必须在“治理分支”与“前端执行分支”之间建立一致规则。

- 治理层交付分支必须使用 `task/<N>-<slug>`，满足 OpenSpec/Rulebook/GitHub 门禁要求。
- 前端执行层允许短命分支：`feat/`、`refactor/`、`fix/`、`style/`、`cleanup/`、`experiment/`。
- 执行分支生命周期默认不超过 5 天；`experiment/` 可延长但不得直接进入 `main`。
- 执行分支最终需合并回治理分支并通过统一 PR 门禁后方可进入 `main`。

#### Scenario: 短命执行分支按策略合并回治理分支 [ADDED]

- **假设** 开发者从 `task/<N>-<slug>` 派生 `style/<topic>` 分支进行视觉微调
- **当** 修改完成并发起合并
- **则** 分支在生命周期约束内回合并到治理分支
- **并且** 后续仅通过治理分支 PR 进入 `main`

#### Scenario: experiment 分支未晋升时不得进入主干交付 [ADDED]

- **假设** 某项试验保留在 `experiment/<topic>` 分支
- **当** 未完成晋升评审就尝试进入主干交付
- **则** 流程被阻断
- **并且** 必须先完成晋升决策与风险评估

### Requirement: CI/CD 门禁策略与质量阈值 [ADDED]

Phase 4 必须落地统一 CI/CD 门禁，确保视觉与工程质量约束可自动执行。

- PR 门禁必须包含并通过：`ci`、`openspec-log-guard`、`merge-serial`。
- CI 阶段至少覆盖：Lint、Type Check、Unit Test、Build；`E2E Smoke` 在主干合并路径中作为阻断项。
- 自定义质量门禁需覆盖：硬编码颜色、硬编码 z-index、`transition-all`、越权视口样式、绕过 service 直接 IPC、i18n 字符串硬编码。

#### Scenario: required checks 全绿并启用 auto-merge [ADDED]

- **假设** PR 已完成所有阶段检查
- **当** `ci`、`openspec-log-guard`、`merge-serial` 均为绿色
- **则** PR 可进入 auto-merge 队列
- **并且** 未经全绿不得手动合并

#### Scenario: 任一质量门禁失败时阻断交付 [ADDED]

- **假设** CI 发现硬编码颜色或 i18n 字符串硬编码等违规项
- **当** 运行质量门禁
- **则** 当前交付状态为失败
- **并且** 需修复后重新执行全量检查

### Requirement: i18n/l10n 渐进交付策略 [ADDED]

Phase 4 必须建立“中文优先、架构先行、渐进翻译”的 i18n 交付策略，避免后期大规模返工。

- 新增 UI 文案必须走 i18n key，不得新增裸字符串常量到界面组件。
- 语言资源至少维护 `zh-CN` 主语言结构，并预留 `en-US` 扩展位。
- 日期、数字、相对时间格式必须通过 `Intl` API 管理，不得手写格式模板。
- i18n lint 规则在 Phase 4 即作为阻断项，违规不得进入合并路径。

#### Scenario: 新增 UI 文案按 i18n 规范交付 [ADDED]

- **假设** 开发者新增一个设置页文案
- **当** 提交变更
- **则** 文案通过 i18n key 引用并写入语言资源文件
- **并且** 日期/数字展示通过 `Intl` API 输出

#### Scenario: 文案未提取或格式化违规触发门禁阻断 [ADDED]

- **假设** 新增 UI 文案直接写在组件中或日期格式硬编码
- **当** 执行 i18n 规则检查
- **则** 流程直接失败并阻断当前交付
- **并且** 必须完成整改后重新执行门禁检查
