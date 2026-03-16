# 应用级备份闭环

- **GitHub Issue**: #1126（child issue；umbrella #1122）
- **所属 umbrella**: `a1-capability-closure-program`
- **涉及模块**: document-management
- **前端验收**: 是

---

## Why：为什么必须做

### 1. 用户现象

现在只有 backupInterval 键，没有调度器、写盘、恢复入口。

### 2. 根因

备份被停留在配置层，没有进入 service / IPC / restore UX 闭环。

### 3. 风险 / 威胁

一旦对外宣传“有备份”，就会形成数据安全级别的误导。

---

## What：这条 change 要完成什么

1. 定义备份写盘格式、目录策略、保留策略与错误处理
2. 实现调度器、手动备份、恢复入口与最小恢复流程
3. 把 settings / factsheet / data-safety-boundary / windows-boundary 全部同步到真实能力

---

## Non-Goals：不做什么

1. 不在本 change 中实现云备份
2. 不在本 change 中实现跨设备同步

---

## 依赖与影响

- 依赖 document-management / ipc / workbench 协作
- 与 crash reporting / release boundary 文档联动

---

## 当前计划中的主要落点

- `apps/desktop/main/src/services/documents/`
- `apps/desktop/main/src/ipc/`
- `apps/desktop/renderer/src/features/settings-dialog/`
