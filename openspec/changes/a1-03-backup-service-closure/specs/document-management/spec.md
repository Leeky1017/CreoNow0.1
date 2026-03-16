# Delta Spec: document-management — 应用级备份闭环

## 新增 Requirement: 应用级备份闭环

系统**必须**补齐当前处于未实现或受限状态的 `应用级备份闭环` 能力，使其从 factsheet 中的占位 / 受限项转化为可验证、可审计、可交付的真实产品能力。

### 本 change 的目标

- 定义备份写盘格式、目录策略、保留策略与错误处理
- 实现调度器、手动备份、恢复入口与最小恢复流程
- 把 settings / factsheet / data-safety-boundary / windows-boundary 全部同步到真实能力

### Scenarios

#### Scenario: 定时备份

- GIVEN 用户启用备份间隔；WHEN 调度窗口达到阈值；THEN 系统生成新的本地备份快照并记录最近备份时间

#### Scenario: 恢复备份

- GIVEN 存在可恢复备份；WHEN 用户在设置或恢复入口选择恢复；THEN 系统完成恢复并给出成功/失败反馈

### Non-Goals

- 不在本 change 中实现云备份
- 不在本 change 中实现跨设备同步
