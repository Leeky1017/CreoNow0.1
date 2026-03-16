# Delta Spec: workbench — 发布可观测性与键盘兼容收口

## 新增 Requirement: 发布可观测性与键盘兼容收口

系统**必须**补齐当前处于未实现或受限状态的 `发布可观测性与键盘兼容收口` 能力，使其从 factsheet 中的占位 / 受限项转化为可验证、可审计、可交付的真实产品能力。

### 本 change 的目标

- 引入崩溃报告上传链路（或明确的最小 crashReporter 能力）
- 补齐 Windows 键盘兼容验证与门禁证据
- 同步 windows-boundary / factsheet / workbench spec 的平台口径

### Scenarios

#### Scenario: 崩溃上报

- GIVEN 主进程或渲染进程发生未捕获异常；WHEN 上报链路可用；THEN 系统记录并上传最小 crash report

#### Scenario: Windows 键盘验证

- GIVEN Windows 构建环境；WHEN 运行关键键盘路径验证；THEN 快捷键与导航结果符合 spec

### Non-Goals

- 不在本 change 中处理 Linux 支持
- 不在本 change 中引入完整 APM 平台全家桶
