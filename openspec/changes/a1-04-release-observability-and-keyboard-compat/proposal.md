# 发布可观测性与键盘兼容收口

- **GitHub Issue**: #1128（child issue；umbrella #1122）
- **所属 umbrella**: `a1-capability-closure-program`
- **涉及模块**: workbench
- **前端验收**: 是

---

## Why：为什么必须做

### 1. 用户现象

目前有本地日志，但没有 crash report 上传；Windows 键盘兼容也仍是待评估。

### 2. 根因

发布边界与运行时可观测能力没有形成真正的产品闭环。

### 3. 风险 / 威胁

问题发生后缺少远程证据；平台承诺无法稳定验证。

---

## What：这条 change 要完成什么

1. 引入崩溃报告上传链路（或明确的最小 crashReporter 能力）
2. 补齐 Windows 键盘兼容验证与门禁证据
3. 同步 windows-boundary / factsheet / workbench spec 的平台口径

---

## Non-Goals：不做什么

1. 不在本 change 中处理 Linux 支持
2. 不在本 change 中引入完整 APM 平台全家桶

---

## 依赖与影响

- 依赖 Electron main / renderer global error 链路
- 与 release docs 联动

---

## 当前计划中的主要落点

- `apps/desktop/main/`
- `apps/desktop/renderer/src/lib/`
- `docs/release/`
