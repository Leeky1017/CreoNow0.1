# Delta Spec: workbench — Settings General 持久化

- **Parent Change**: `a0-14-settings-general-persistence`
- **Base Spec**: `openspec/specs/workbench/spec.md`
- **GitHub Issue**: #994

---

## 变更摘要

Settings → General 页的全部用户偏好（语言、写作体验、数据存储、编辑器默认值）**必须**通过 `PreferenceStore` 持久化到 localStorage，应用重启后恢复用户上次的选择。

---

## 变更的 Requirements

### Requirement: Settings General 偏好持久化（新增）

系统**必须**将 Settings → General 页的全部用户偏好写入 `PreferenceStore`，并在设置对话框打开时从 `PreferenceStore` 恢复。

### PreferenceKey 扩展

`PreferenceKey` 联合类型**必须**新增以下 key：

| Key                                 | 类型      | 默认值    | 说明         |
| ----------------------------------- | --------- | --------- | ------------ |
| `creonow.settings.focusMode`        | `boolean` | `true`    | 专注模式     |
| `creonow.settings.typewriterScroll` | `boolean` | `false`   | 打字机滚动   |
| `creonow.settings.smartPunctuation` | `boolean` | `true`    | 智能标点     |
| `creonow.settings.localAutoSave`    | `boolean` | `true`    | 本地自动保存 |
| `creonow.settings.backupInterval`   | `string`  | `"5min"`  | 备份间隔     |
| `creonow.settings.defaultFont`      | `string`  | `"inter"` | 默认字体     |
| `creonow.settings.interfaceScale`   | `number`  | `100`     | 界面缩放     |
| `creonow.settings.language`         | `string`  | `"zh-CN"` | 界面语言     |

`isCreonowKey()` 守卫函数**必须**扩展以识别 `creonow.settings.*` 前缀。

### 读取规则

- 设置对话框打开时，**必须**从 `PreferenceStore` 逐项读取每个 General 设置值
- 若某项 key 在 `PreferenceStore` 中不存在（首次启动或被清除），**必须**回退到 `defaultGeneralSettings` 中的对应默认值
- 若某项 key 的值解析失败（JSON parse 异常），**必须**回退到对应默认值，不得抛出异常或展示错误

### 写入规则

- 用户修改任一 General 设置项时，**必须**在 `onSettingsChange` 回调中将变更值同步写入 `PreferenceStore`
- 写入**必须**是同步的（`PreferenceStore.set()` 本身是同步操作），确保 UI 反馈与持久化之间不出现竞争
- 写入失败（如 localStorage 满）时，**必须**静默降级（console.error），不阻断用户交互，不弹出 Toast

### 语言持久化统一

- 界面语言切换**必须**通过 `PreferenceStore` 持久化到 `creonow.settings.language`
- 应用启动时读取语言偏好的逻辑**必须**从 `PreferenceStore` 读取，不再依赖独立的 `languagePreference.ts` 裸写 localStorage
- 语言切换后**必须**同时调用 `i18n.changeLanguage()` 和 `PreferenceStore.set("creonow.settings.language", value)`
- `getLanguagePreference()` 和 `setLanguagePreference()` **必须**适配为 `PreferenceStore` 的代理调用，或标记为 `@deprecated` 并在调用点迁移

### 约束

- **禁止**在 `SettingsGeneral.tsx` 或 `SettingsDialog.tsx` 中直接调用 `localStorage`——一切持久化通过 `PreferenceStore` 接口
- **禁止**引入新的 Zustand store 管理 General settings——使用现有 `PreferenceStore`（与 layout 持久化体系一致）
- **禁止**在写入链路中做网络请求——偏好持久化纯本地
- Settings General 中的 `showAiMarks` 已通过 `versionPreferencesStore` 独立持久化，本变更**不修改**其持久化通道

---

### Scenario: 设置对话框打开时加载持久化偏好

- **假设** 用户之前将 Focus Mode 关闭、打字机滚动开启、备份间隔改为 "1hour"，并关闭了设置对话框
- **当** 用户再次打开 Settings → General 页
- **则** Focus Mode 开关显示为关闭状态
- **并且** 打字机滚动开关显示为开启状态
- **并且** 备份间隔下拉框显示 "Every hour"
- **并且** 其余未修改的设置项显示为默认值

### Scenario: 首次启动时使用默认值

- **假设** 用户首次启动应用，`PreferenceStore` 中无任何 `creonow.settings.*` key
- **当** 用户打开 Settings → General 页
- **则** Focus Mode 为开启（默认 `true`）
- **并且** 打字机滚动为关闭（默认 `false`）
- **并且** 智能标点为开启（默认 `true`）
- **并且** 本地自动保存为开启（默认 `true`）
- **并且** 备份间隔为 "Every 5 minutes"（默认 `"5min"`）
- **并且** 默认字体为 "Inter (Sans-Serif)"（默认 `"inter"`）
- **并且** 界面缩放为 100%（默认 `100`）

### Scenario: 修改设置后即时持久化

- **假设** 设置对话框已打开，General 页可见
- **当** 用户将智能标点从开启切换为关闭
- **则** `PreferenceStore` 中 `creonow.settings.smartPunctuation` 的值立即更新为 `false`
- **并且** UI 上智能标点开关立即反映为关闭状态
- **并且** 用户关闭对话框后重新打开，智能标点仍为关闭

### Scenario: 语言切换持久化

- **假设** 当前界面语言为中文（`zh-CN`）
- **当** 用户在 General 页将语言切换为 English
- **则** `PreferenceStore` 中 `creonow.settings.language` 更新为 `"en"`
- **并且** 界面立即切换为英文
- **并且** 应用重启后界面仍为英文

### Scenario: 持久化值损坏时回退默认值

- **假设** `PreferenceStore` 中 `creonow.settings.interfaceScale` 的值因外部干扰变为非法 JSON（如手动在 DevTools 中将 localStorage 值改为损坏字符串）
- **当** 用户打开 Settings → General 页
- **则** 界面缩放显示为 100%（默认值）
- **并且** 控制台输出 `PreferenceStore.get failed to parse value` 错误日志
- **并且** 对话框正常渲染，不出现白屏或崩溃

---

## i18n 要求

本变更不新增用户可见文案——Settings General 页的所有 label、description 已通过 `t()` 函数国际化。语言切换功能的 i18n key 已存在（`settingsDialog.general.zhCN`、`settings.general.displayLanguage` 等）。

---

## 可访问性要求

本变更不引入新的 UI 元素，不改变现有 Toggle / Select / Slider 的可访问性行为。所有交互控件的 `aria-label`、键盘导航、屏幕阅读器支持保持不变。
