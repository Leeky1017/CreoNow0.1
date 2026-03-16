# A0-17 备份入口决策 — 决策文档

> **Issue**: #996
> **首次决策日期**: 2026-03-09
> **2026-03-16 校准说明**: 本文已移除旧的活跃 change 引用与未收口状态词，并按当前仓库状态补充执行后事实。
> **当前状态**: **已执行并归档** —— v0.1 设置页继续隐藏备份入口。
> **最终决策**: **S1 — 隐藏备份入口**（维持不变）

---

## 一、当前输入基线（按 archive 与现实现校准）

### 1. A0-08 的来源路径

本决策消费的上游结论应指向 archive 路径：

- `openspec/changes/archive/a0-08-backup-capability-decision/decision.md`

而非旧的活跃 change 位置。

### 2. 当前代码状态

- `apps/desktop/renderer/src/features/settings-dialog/SettingsGeneral.tsx`
  中的备份入口保持隐藏。
- `apps/desktop/renderer/src/features/settings-dialog/SettingsDialog.tsx`
  会读取/写入 `creonow.settings.backupInterval`。
- `apps/desktop/renderer/src/lib/preferences.ts`
  仍保留 `backupInterval` key 的合法定义。

### 3. A0-15 状态

A0-15 已经是归档议题的一部分，不再存在等待其最终收口后再决定 A0-17 的前置阻塞。
本决策文件不应继续保留任何“仍待上游策略落定”的表述。

---

## 二、为何 S1 仍然成立

A0-17 的问题从来不是“是否保留一个内部偏好键”，而是：

> **是否在 v0.1 UI 中继续把一个没有后端闭环的备份能力呈现给用户。**

当前答案仍然是否定的，原因未变：

1. **没有真实备份服务**：调度、写盘、恢复依然缺位。
2. **UI 诚实优先**：隐藏入口比展示空承诺更符合 Phase 0 / A0 目标。
3. **保留 key 是实现细节，不是产品承诺**：`backupInterval` 的存在只能说明“未来恢复更平滑”，不能说明“当前功能存在”。

因此，A0-17 的最终口径应是：

> **隐藏入口已执行；future-compat 偏好键保留，不构成 reopen。**

---

## 三、与旧版文档相比，哪些内容已过时

以下内容已不应继续保留：

- 对 A0-08 的旧活跃路径引用
- 暗示 A0-15 仍是未收口前置条件的措辞
- 暗示 A0-17 仍处于未决状态的措辞
- 任何暗示 A0-17 仍处于未决状态的措辞

以下内容则应保留为当前事实：

- S1 是最终决策
- v0.1 隐藏备份入口
- `backupInterval` 偏好键仍存在并已持久化
- 备份服务仍未实现

---

## 四、执行后口径

### v0.1 用户可见行为

- 设置页看不到备份入口
- 用户不会再被“上次备份：2 分钟前”之类文案误导
- 系统不会因为保留 `backupInterval` key 而自动提供任何备份能力

### 内部技术状态

- `backupInterval` 作为 future-compat 字段保留
- 若未来恢复备份功能，可在不迁移偏好 key 的前提下重新接线

---

## 五、2026-03-16 复核命令

```bash
rg -n "a0-08-backup-capability-decision|A0-15|future-compat|已执行并归档" \
  openspec/changes/archive/a0-17-backup-entry-resolution/decision.md

rg -n "backupInterval|A0-17" \
  apps/desktop/renderer/src/features/settings-dialog/SettingsGeneral.tsx \
  apps/desktop/renderer/src/features/settings-dialog/SettingsDialog.tsx \
  apps/desktop/renderer/src/lib/preferences.ts
```
