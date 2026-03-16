# 设置界面能力收口

- **GitHub Issue**: 待创建（child issue；umbrella #1122）
- **所属 umbrella**: `a1-capability-closure-program`
- **涉及模块**: workbench
- **前端验收**: 是

---

## Why：为什么必须做

### 1. 用户现象

设置页里已有组件或按钮，但用户要么点不动，要么根本找不到入口。

### 2. 根因

Settings 导航、占位页文案和后端能力边界没有统一编排。

### 3. 风险 / 威胁

设置系统显得零散，用户会把“未接入”和“已损坏”混为一谈。

---

## What：这条 change 要完成什么

1. 决定并落地 Account 页的 v1 处置：真正实现，或以更诚实的 disabled / hide 策略重写
2. 把 SettingsExport 与 ShortcutsPanel 接入 Settings / Help 的真实导航入口
3. 收敛通用设置的未来能力边界文案，让 settings 与 factsheet 口径一致

---

## Non-Goals：不做什么

1. 不在本 change 中实现完整账号系统后端
2. 不重做整个 Settings 信息架构

---

## 依赖与影响

- 依赖 workbench / project-management 的现有导航契约
- 与备份 / 导出 / 快捷键相关 child changes 协调

---

## 当前计划中的主要落点

- `apps/desktop/renderer/src/features/settings-dialog/`
- `apps/desktop/renderer/src/features/shortcuts/`
- `apps/desktop/renderer/src/components/layout/`
