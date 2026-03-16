# A0-08 备份能力真伪核查 — 决策文档

> **Issue**: #1035
> **首次决策日期**: 2026-03-12
> **2026-03-16 校准说明**: 本文已按当前仓库状态回写，替换掉“偏好值不保存”“只有空壳 UI”这类已被后续代码推翻的旧表述。
> **当前结论**: v0.1 的备份能力仍然**未实现**；但 `backupInterval` 已是一个会写入 PreferenceStore 的 future-compat 偏好值，而不是“关闭对话框即丢失”的纯本地 state。
> **最终决策**: **继续维持 S1——隐藏备份入口，不把未兑现的能力展示给用户。**

---

## 一、当前仓库事实（以 2026-03-16 为准）

### 1. UI 入口状态

- `apps/desktop/renderer/src/features/settings-dialog/SettingsGeneral.tsx`
  中，备份 interval 选项数组和对应表单块都已被注释隐藏。
- 当前 v0.1 设置页**不再展示**备份入口，因此不会继续向用户暗示“系统正在自动备份”。

### 2. `backupInterval` 的真实状态

- `apps/desktop/renderer/src/features/settings-dialog/SettingsDialog.tsx`
  的 `readGeneralSettings()` / `writeGeneralSettings()` 已分别读取并写入
  `creonow.settings.backupInterval`。
- `apps/desktop/renderer/src/lib/preferences.ts`
  与 `apps/desktop/renderer/src/lib/preferences.settings.test.ts`
  说明该 key 已纳入 PreferenceStore 管理与回归测试。

**校准结论**：
旧版决策文档中“`backupInterval` 只存在于局部对话框状态”的判断，**已不再成立**。

### 3. 后端能力仍然不存在

以下结论在当前仓库中仍然成立：

- 无 BackupService
- 无 backup IPC handler / preload bridge
- 无定时调度器
- 无写盘逻辑
- 无恢复入口
- `openspec/specs/document-management/spec.md` 中仍无备份行为定义

也就是说，当前仓库的真实状态是：

> **偏好值存在且可持久化，但备份能力本身没有闭环实现。**

这是一种“为未来恢复保留键位”的状态，而不是一个可对用户宣传的功能。

---

## 二、为什么原推荐方案仍不变

### 方案 S1：隐藏备份入口

**仍然是正确决策。** 原因如下：

1. **能力没有闭环**：即便 `backupInterval` 已持久化，也没有任何调度、写盘、恢复链路去消费它。
2. **v0.1 应以能力诚实为先**：用户界面不应展示一个无法兑现的数据安全承诺。
3. **保留 future-compat key 不等于功能上线**：PreferenceStore 中保留 `backupInterval`，只是为后续版本恢复入口提供平滑路径，不改变 v0.1 的能力分级。
4. **风险最低**：隐藏入口是纯减法；相比“继续暴露假能力”或“临时拼接不完整 MVP”，都更符合 P0 / A0 的治理目标。

---

## 三、需要从旧文档中删除的陈旧口径

以下说法已被当前仓库推翻，不应继续出现在归档决策中：

- “`backupInterval` 没有被持久化，值只停留在对话框本地状态中”
- “备份功能是 100% 零实现 UI 壳，因此连设置值都不会保存”
- “必须通过删除 `backupInterval` 字段与 locale key 才能完成 S1”

当前更准确的表述应为：

> `backupInterval` 作为 future-compat 偏好值已保留并持久化；但 v0.1 仍无真实备份服务，因此备份入口继续保持隐藏。

---

## 四、归档后的当前口径

### 能力分级

- **备份功能**：❌ 未实现
- **备份入口**：v0.1 已隐藏
- **`backupInterval`**：已持久化，但仅为 future-compat 保留项

### 对后续版本的启示

如果未来重新引入备份能力，至少需要同时补齐：

1. canonical spec
2. IPC / preload / service 链路
3. 定时调度与写盘策略
4. 恢复入口
5. 与事实表 / 数据安全边界文档一致的发布口径

在这些条件完成前，`backupInterval` 不应被解释为“备份已上线”。

---

## 五、2026-03-16 复核命令

```bash
rg -n "backupInterval|creonow\.settings\.backupInterval" \
  apps/desktop/renderer/src/features/settings-dialog/SettingsDialog.tsx \
  apps/desktop/renderer/src/lib/preferences.ts \
  apps/desktop/renderer/src/lib/preferences.settings.test.ts

rg -n "backup" \
  apps/desktop/main/src/services \
  apps/desktop/main/src/ipc \
  apps/desktop/preload/src

rg -n "backup|备份|restore|恢复" openspec/specs/document-management/spec.md
```
