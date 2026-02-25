# Workbench Specification Delta

更新时间：2026-02-22 12:10

## Change: issue-606-phase-4-polish-and-delivery

### Requirement: Phase 4 视觉审计闭环 [ADDED]

Workbench 在 Phase 4 必须将视觉问题处理为可追踪闭环，形成“审计项 -> 整改动作 -> 复测结论”三段式记录，禁止以口头状态作为验收依据。

- 审计输入必须同时覆盖内部视觉审计与参考对标结论（Notion、Cursor、Linear、iA Writer、Obsidian）。
- 每条审计项必须绑定唯一 ID、责任人、截止时间、复测状态（`PASS`/`FAIL`/`WAIVED`）与证据链接。
- 复测状态不是 `PASS` 时，不得声明 Phase 4 视觉验收完成。

#### Scenario: 视觉审计项形成完整闭环并通过验收 [ADDED]

- **假设** Workbench 审计清单中的每条问题都已绑定整改动作和复测记录
- **当** Owner 对 Phase 4 视觉验收进行核对
- **则** 系统可追溯展示每条审计项的“问题-整改-复测”链路
- **并且** 所有项状态均为 `PASS` 或存在明确 `WAIVED` 批准记录

#### Scenario: 存在未闭环审计项时阻断阶段验收 [ADDED]

- **假设** 仍有审计项缺少整改动作或复测结论
- **当** 发起 Phase 4 验收
- **则** 验收流程返回阻断结论
- **并且** 必须补齐缺失项后才能继续

### Requirement: 基线截图库与视觉回归对比 [ADDED]

Workbench 必须维护 Phase 4 截图基线库，并通过“重构前 baseline + 重构后 after + 差异阈值”完成视觉回归核对。

- 基线目录必须按日期分层，且至少覆盖：Dashboard、编辑器（边栏展开/收起）、Zen Mode、AI 面板（空/流式/完成）、KG 面板（空/有节点）、Command Palette、设置弹窗。
- 基线截图必须覆盖亮色与暗色主题。
- 视觉差异阈值超标时必须回到整改阶段，不得直接进入最终验收。

#### Scenario: 必选界面截图基线齐备 [ADDED]

- **假设** 执行 Phase 4 基线采集
- **当** 审阅截图目录
- **则** 每个必选界面和状态都存在对应 baseline 与 after 截图
- **并且** 亮色与暗色主题都已覆盖

#### Scenario: 视觉差异超阈值触发回归阻断 [ADDED]

- **假设** 自动化视觉对比结果显示某页面差异超过阈值
- **当** 运行视觉回归门禁
- **则** 当前变更被判定为未通过
- **并且** 必须修复后重新生成截图并复测

### Requirement: 参考对标与最终 benchmark 验收 [ADDED]

Workbench 最终收口必须完成参考对标 benchmark，确保交互与视觉质量达到 Phase 4 目标线。

- 关键交互目标：命令面板弹出响应 <100ms；主要工作区操作响应目标 <100ms。
- 布局稳定性目标：侧栏与面板切换时，主编辑区不得被异常压缩（保持主内容区最小宽度契约）。
- 输出必须包含 benchmark 报告与结论（`PASS`/`FAIL`），并关联到 Phase 4 交付证据。

#### Scenario: benchmark 全部达标后允许收口 [ADDED]

- **假设** 已执行命令面板响应、布局稳定性与关键交互 benchmark
- **当** 所有指标均达到 Phase 4 目标线
- **则** 该阶段可进入最终收口流程
- **并且** benchmark 报告被纳入交付证据

#### Scenario: 任一 benchmark 未达标时进入下一轮精磨 [ADDED]

- **假设** benchmark 中至少一项未达标
- **当** 触发阶段性验收
- **则** 阶段状态标记为未完成
- **并且** 团队必须回到审计整改循环继续精磨
