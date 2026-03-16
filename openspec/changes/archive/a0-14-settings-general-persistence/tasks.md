# Tasks: A0-14 Settings General 持久化

- **GitHub Issue**: #994
- **分支**: `task/994-settings-general-persistence`
- **Delta Spec**: `specs/workbench/spec.md`

---

## 所属任务簇

P0-6: 基础输入输出防线

## 前置依赖

- 无

---

## 验收标准

| ID   | 标准                                                                           | 对应 Scenario                  |
| ---- | ------------------------------------------------------------------------------ | ------------------------------ |
| AC-1 | `PreferenceKey` 联合类型包含 `creonow.settings.focusMode` 等 8 个新 key        | 全部 Scenario                  |
| AC-2 | `isCreonowKey()` 识别 `creonow.settings.*` 前缀                                | 全部 Scenario                  |
| AC-3 | 设置对话框打开时从 `PreferenceStore` 读取 General 偏好，无持久化值时回退默认值 | 首次启动时使用默认值           |
| AC-4 | 用户修改 General 设置项后值同步写入 `PreferenceStore`                          | 修改设置后即时持久化           |
| AC-5 | 关闭对话框再打开，设置值保持用户上次修改                                       | 设置对话框打开时加载持久化偏好 |
| AC-6 | 语言切换通过 `PreferenceStore` 持久化，应用重启后保留                          | 语言切换持久化                 |
| AC-7 | 持久化值损坏时回退默认值，不崩溃                                               | 持久化值损坏时回退默认值       |
| AC-8 | `SettingsDialog.tsx` / `SettingsGeneral.tsx` 中无直接 `localStorage` 调用      | 约束                           |

---

## Phase 1: Red（测试先行）

### Task 1.1: PreferenceKey 扩展单元测试

**映射验收标准**: AC-1, AC-2

在 `preferences.test.ts` 中新增测试用例：

- [x] 测试：`isCreonowKey("creonow.settings.focusMode")` 返回 `true`
- [x] 测试：`isCreonowKey("creonow.settings.typewriterScroll")` 返回 `true`
- [x] 测试：`isCreonowKey("creonow.settings.language")` 返回 `true`
- [x] 测试：`isCreonowKey("creonow.settings.unknown")` 返回 `true`（前缀匹配）
- [x] 测试：`createPreferenceStore(storage).set("creonow.settings.focusMode", false)` 后 `get("creonow.settings.focusMode")` 返回 `false`

**文件**: `apps/desktop/renderer/src/lib/preferences.settings.test.ts`（修改）

### Task 1.2: General Settings 持久化读取测试

**映射验收标准**: AC-3, AC-5

编写 `SettingsDialog` 集成测试：

- [x] 测试：`PreferenceStore` 中无 `creonow.settings.*` key 时，打开 General 页，所有设置项显示 `defaultGeneralSettings` 的值（Focus Mode = on, 打字机滚动 = off, 智能标点 = on, 本地自动保存 = on, 备份间隔 = "5min", 默认字体 = "inter", 界面缩放 = 100）
- [x] 测试：`PreferenceStore` 中预设 `creonow.settings.focusMode = false`、`creonow.settings.backupInterval = "1hour"` 时，打开 General 页，Focus Mode 为关闭、备份间隔为 "Every hour"

**文件**: `apps/desktop/renderer/src/features/settings-dialog/SettingsDialog.persistence.test.tsx`（新建）

### Task 1.3: General Settings 持久化写入测试

**映射验收标准**: AC-4

- [x] 测试：打开 General 页，切换智能标点开关 → `PreferenceStore.get("creonow.settings.smartPunctuation")` 返回切换后的值
- [x] 测试：打开 General 页，修改备份间隔 → `PreferenceStore.get("creonow.settings.backupInterval")` 返回新值
- [x] 测试：打开 General 页，调整界面缩放 → `PreferenceStore.get("creonow.settings.interfaceScale")` 返回新值

**文件**: `apps/desktop/renderer/src/features/settings-dialog/SettingsDialog.persistence.test.tsx`

### Task 1.4: 语言持久化统一测试

**映射验收标准**: AC-6

- [x] 测试：在 General 页切换语言为 "en" → `PreferenceStore.get("creonow.settings.language")` 返回 `"en"`
- [x] 测试：`PreferenceStore` 中预设 `creonow.settings.language = "en"` → 设置对话框读取后语言下拉框显示 "English"

**文件**: `apps/desktop/renderer/src/features/settings-dialog/SettingsDialog.persistence.test.tsx`

### Task 1.5: 损坏值容错测试

**映射验收标准**: AC-7

- [x] 测试：在 storage 中写入非法 JSON 字符串到 `creonow.settings.interfaceScale` key → 打开 General 页，界面缩放显示 100%（默认值）
- [x] 测试：在 storage 中写入非法值后打开 General 页，不抛出未捕获异常

**文件**: `apps/desktop/renderer/src/features/settings-dialog/SettingsDialog.persistence.test.tsx`

### Task 1.6: 无直接 localStorage 调用约束说明

**映射验收标准**: AC-8

- [x] 测试：验证 SettingsDialog / SettingsGeneral 通过 PreferenceStore API 读写设置值，不在组件层直接调用 localStorage

**文件**: `apps/desktop/renderer/src/features/settings-dialog/SettingsDialog.persistence.test.tsx`

---

## Phase 2: Green（实现）

### Task 2.1: 扩展 PreferenceKey 类型和守卫函数

- [x] 在 `PreferenceKey` 联合类型中新增 `creonow.settings.${string}` 系列（含 `focusMode`、`typewriterScroll`、`smartPunctuation`、`localAutoSave`、`backupInterval`、`defaultFont`、`interfaceScale`、`language`）
- [x] 扩展 `isCreonowKey()` 守卫，增加 `key.startsWith("creonow.settings.")` 分支

**文件**: `renderer/src/lib/preferences.ts`（修改）

### Task 2.2: 创建 General Settings 持久化读写辅助函数

- [x] 创建 `loadGeneralSettings(store: PreferenceStore): GeneralSettings` 函数——逐项从 store 读取，缺失 key 回退默认值
- [x] 创建 `saveGeneralSettings(store: PreferenceStore, settings: GeneralSettings): void` 函数——逐项写入 store
- [x] 创建 `saveGeneralSetting(store: PreferenceStore, key: keyof GeneralSettings, value: GeneralSettings[keyof GeneralSettings]): void` 函数——单项增量写入

**文件**: `renderer/src/features/settings-dialog/settingsGeneralPersistence.ts`（新建）

### Task 2.3: 修改 SettingsDialog 初始化链路

- [x] `SettingsDialog` 中将 `React.useState<GeneralSettings>(defaultGeneralSettings)` 替换为 `React.useState<GeneralSettings>(() => loadGeneralSettings(preferenceStore))`
- [x] `setGeneralSettings` 回调包装为同时更新 state 和写入 `PreferenceStore` 的联合操作

**文件**: `renderer/src/features/settings-dialog/SettingsDialog.tsx`（修改）

### Task 2.4: 语言持久化收口

- [x] 修改 `SettingsGeneral.tsx` 中 `handleLanguageChange` 使语言变更通过 `PreferenceStore` 写入
- [x] 修改 `getLanguagePreference()` 使其从 `PreferenceStore` 读取，标记原始裸 localStorage 路径为 `@deprecated` 或移除

**文件**: `renderer/src/features/settings-dialog/SettingsGeneral.tsx`（修改），`renderer/src/i18n/languagePreference.ts`（修改）

---

## Phase 3: Refactor（清理）

- [x] 确认 `SettingsDialog.tsx` 和 `SettingsGeneral.tsx` 中无直接 `localStorage` 调用
- [x] 确认 `preferences.test.ts` 中新增用例覆盖 `creonow.settings.*` key
- [x] 确认无多余文件/导入
- [x] Storybook 构建验证：`pnpm -C apps/desktop storybook:build` 通过

---

## 验收标准 → 测试映射

| 验收标准                 | 对应测试文件                                                                             | 测试用例名                                            | 状态 |
| ------------------------ | ---------------------------------------------------------------------------------------- | ----------------------------------------------------- | ---- |
| AC-1 PreferenceKey 扩展  | `apps/desktop/renderer/src/lib/preferences.settings.test.ts`                             | `isCreonowKey recognizes creonow.settings.* keys`     | [x]  |
| AC-2 isCreonowKey 守卫   | `apps/desktop/renderer/src/lib/preferences.settings.test.ts`                             | `isCreonowKey recognizes creonow.settings.* prefix`   | [x]  |
| AC-3 首次启动默认值      | `apps/desktop/renderer/src/features/settings-dialog/SettingsDialog.persistence.test.tsx` | `shows default values when no preferences exist`      | [x]  |
| AC-4 修改即时持久化      | `apps/desktop/renderer/src/features/settings-dialog/SettingsDialog.persistence.test.tsx` | `persists setting change to PreferenceStore`          | [x]  |
| AC-5 恢复持久化偏好      | `apps/desktop/renderer/src/features/settings-dialog/SettingsDialog.persistence.test.tsx` | `loads persisted values on dialog open`               | [x]  |
| AC-6 语言持久化统一      | `apps/desktop/renderer/src/features/settings-dialog/SettingsDialog.persistence.test.tsx` | `persists language change via PreferenceStore`        | [x]  |
| AC-7 损坏值容错          | `apps/desktop/renderer/src/features/settings-dialog/SettingsDialog.persistence.test.tsx` | `falls back to default on corrupted value`            | [x]  |
| AC-8 无直接 localStorage | `apps/desktop/renderer/src/features/settings-dialog/SettingsDialog.persistence.test.tsx` | `settings files persist through PreferenceStore only` | [x]  |

---

## Done 定义

- [x] 所有 Scenario 有对应测试且通过
- [x] PR body 包含 `Closes #994`
- [x] 审计评论闭环完成（PRE-AUDIT → RE-AUDIT → FINAL-VERDICT）
- [x] 前端：Storybook 构建通过，Settings General 页在 Storybook 中可交互验证

---

## TDD 规范引用

> 本 Change 的所有测试必须遵循 `docs/references/testing/` 中的规范。开始写测试前，先阅读以下文档。

**必读文档**：

- 测试哲学与反模式：`docs/references/testing/01-philosophy-and-anti-patterns.md`
- 测试类型决策树：`docs/references/testing/02-test-type-decision-guide.md`
- 前端测试模式：`docs/references/testing/03-frontend-testing-patterns.md`
- 命令与 CI 映射：`docs/references/testing/07-test-command-and-ci-map.md`

**本地验证命令**：

```bash
pnpm -C apps/desktop vitest run <test-file-pattern>   # 单元/集成测试
pnpm typecheck                                         # 类型检查
pnpm lint                                              # ESLint
pnpm -C apps/desktop storybook:build                   # Storybook 视觉验收
```

**五大反模式（Red Line）**：

1. ❌ 字符串匹配源码检测实现 → 用行为断言
2. ❌ 只验证存在性（`toBeTruthy`）→ 验证具体值（`toEqual`）
3. ❌ 过度 mock 导致测的是 mock 本身 → 只 mock 边界依赖
4. ❌ 仅测 happy path → 必须覆盖 edge + error 路径
5. ❌ 无意义测试名称 → 名称必须说明前置条件和预期行为
