# A0-14 Settings General 持久化

- **GitHub Issue**: #994
- **所属任务簇**: P0-6（基础输入输出防线）
- **涉及模块**: workbench
- **前端验收**: 需要

---

## Why：为什么必须做

### 1. 用户现象

用户打开 Settings → General 页，调整语言、写作体验（Focus Mode、打字机滚动、智能标点）、数据存储（自动保存、备份间隔）、编辑器默认值（默认字体、界面缩放）等选项后，关闭设置对话框再重新打开，或刷新应用窗口，所有改动全部丢失，恢复为硬编码的默认值。用户每次重启都得重新设置一遍——设置页变成了"一次性表演"。

### 2. 根因

`SettingsDialog.tsx` 中 `generalSettings` 通过 `React.useState(defaultGeneralSettings)` 管理，是纯组件本地 state。对话框关闭后 state 销毁，重新打开时从 `defaultGeneralSettings` 常量重新初始化。整条链路没有任何位置将用户选择写入 `PreferenceStore`（`renderer/src/lib/preferences.ts`），也没有从 `PreferenceStore` 读取初始值的逻辑。

具体而言：

- `SettingsDialog.tsx` L167-168：`const [generalSettings, setGeneralSettings] = React.useState<GeneralSettings>(defaultGeneralSettings)` —— 硬编码初始值
- `SettingsGeneral.tsx`：`onSettingsChange` 回调只更新父组件 state，不触发持久化
- `preferences.ts`：`PreferenceKey` 联合类型中无 `creonow.settings.*` 系列 key，settings 域从未被纳入持久化体系

### 3. v0.1 威胁

- **信任崩塌**：设置页是用户"个性化自己工具"的核心入口。改了不保存等于"设置页是假的"，与 `07` §二 U0-02 定义的"产品在说谎"级别问题一致
- **连锁失效**：写作体验偏好（Focus Mode、打字机滚动等）若不持久化，对应的运行时行为切换也无法可靠生效——用户打开 Focus Mode 然后重启，Focus Mode 消失
- **语言设置断裂**：语言切换目前通过独立的 `languagePreference` 工具持久化（localStorage 裸写），但与 preferences store 体系割裂，存在两套持久化通道不一致的风险

### 4. 证据来源

| 文档                                      | 章节                  | 内容                                                                                                                 |
| ----------------------------------------- | --------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `docs/audit/amp/07-ui-ux-design-audit.md` | §二 假/占位 UI 清单   | 设置页标注"⚠️ 部分"，备注"General 不持久化"                                                                          |
| `docs/audit/amp/07-ui-ux-design-audit.md` | §七 v0.1 必修清单 7.1 | U0-02："Settings General 不持久化 → 将 state 写入 preferences store，确保设置重启后保留"，分级为"不修就是产品在说谎" |
| `docs/audit/amp/01-master-roadmap.md`     | Phase 0 验收矩阵      | 设置持久化作为基础输入输出防线的一环                                                                                 |

---

## What：做什么

1. **扩展 PreferenceKey 类型**：在 `preferences.ts` 的 `PreferenceKey` 联合类型中新增 `creonow.settings.general.*` 系列 key，覆盖 `GeneralSettings` 的全部 7 个字段
2. **Settings 初始化从 PreferenceStore 读取**：`SettingsDialog` 打开时，从 `PreferenceStore` 读取每个 General 设置项的持久化值；若无持久化值，回退到 `defaultGeneralSettings` 中的默认值
3. **Settings 变更即时写入 PreferenceStore**：用户在 General 页修改任一设置项时，`onSettingsChange` 回调在更新 state 的同时，将新值同步写入 `PreferenceStore`
4. **语言持久化统一收口**：将当前 `languagePreference.ts` 中独立的 `getLanguagePreference()` / `setLanguagePreference()` 收口到 `PreferenceStore` 体系，消除双通道不一致

---

## Scope

- **主规范**: `openspec/specs/workbench/spec.md`
- **涉及源码**:
  - `renderer/src/lib/preferences.ts` — 扩展 `PreferenceKey` 类型
  - `renderer/src/features/settings-dialog/SettingsDialog.tsx` — 初始化与写入链路
  - `renderer/src/features/settings-dialog/SettingsGeneral.tsx` — 语言持久化收口
  - `renderer/src/i18n/languagePreference.ts` — 迁移或适配
- **所属任务簇**: P0-6（基础输入输出防线）
- **前置依赖**: 无
- **下游影响**: Settings General 持久化就绪后，后续涉及写作体验偏好的运行时行为（如 Focus Mode 真实启用/禁用）可基于持久化值可靠驱动

---

## Non-Goals：不做什么

1. **不实现 Settings 跨设备同步**——v0.1 所有偏好仅本地 localStorage 持久化，不涉及云端同步或账户关联
2. **不实现 Settings General 中各项偏好的运行时行为**——本变更只解决"改了能存住"，不负责"存住后 Focus Mode / 打字机滚动 / 智能标点在编辑器中真实生效"；运行时行为是后续任务
3. **不修改 Settings Appearance / AI / Judge / Account 等其他 tab 的持久化**——本变更仅覆盖 General tab
4. **不重构 PreferenceStore 的底层实现**——现有 localStorage 方案满足需求，不迁移到 IndexedDB 或 Electron store
5. **不实现"恢复默认设置"按钮**——虽然有价值，但不在本变更范围内

---

## 依赖与影响

- **无上游依赖**：可独立实施
- **被依赖于**：后续任何需要读取 General 偏好值的功能（如 Focus Mode 真实启用、打字机滚动行为）
