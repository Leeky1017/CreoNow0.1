## 1. Specification

更新时间：2026-02-28 19:20

- [ ] 1.1 审阅并确认需求边界：为 Settings → General 新增 Language 下拉框，Onboarding Step 1 提供语言选择。语言选择持久化（localStorage），重启生效 + 尽可能即时切换。不做全量键值化。
- [ ] 1.2 审阅并确认错误路径与边界路径：locale 文件缺失时 fallback 到 `en`；localStorage 损坏时 fallback 到 `zh-CN`。
- [ ] 1.3 审阅并确认验收阈值与不可变契约：语言选择必须持久化；Settings 和 Onboarding 共享同一持久化 key；`i18n/index.ts` 的 `lng` 不再硬编码。
- [ ] 1.4 依赖同步检查（Dependency Sync Check）：N/A

### 1.5 预期实现触点

- `apps/desktop/renderer/src/i18n/index.ts`
  - L27：`lng: "zh-CN"` 硬编码 → 改为从 localStorage 读取（key: `creonow-language`），fallback `"zh-CN"`
- 新增 `apps/desktop/renderer/src/i18n/languagePreference.ts`：
  - `getLanguagePreference(): string`（从 localStorage 读取）
  - `setLanguagePreference(lng: string): void`（写入 localStorage + 调用 `i18n.changeLanguage(lng)`）
- `apps/desktop/renderer/src/features/settings-dialog/SettingsGeneral.tsx`
  - 新增 Language 下拉框（`<select>` 或 Primitive Select），选项：`zh-CN` / `en`
  - onChange 调用 `setLanguagePreference()`
- `apps/desktop/renderer/src/features/onboarding/OnboardingPage.tsx`
  - Step 1 新增语言选择（与 Settings 共享 `setLanguagePreference`）

**为什么是这些触点**：`i18n/index.ts` 是初始化入口，Settings 和 Onboarding 是两个用户可操作的语言切换入口。

## 2. TDD Mapping（先测前提）

- [ ] 2.1 将 delta spec 的每个 Scenario 映射为至少一个测试用例
- [ ] 2.2 为每个测试标注对应 Scenario ID，建立可追踪关系
- [ ] 2.3 设定门禁：未出现 Red（失败测试）不得进入实现

### Scenario → 测试映射

| Scenario ID | 测试文件（计划） | 测试名称（计划） | 断言要点 | Mock/依赖 | 运行命令 |
| ----------- | ---------------- | ---------------- | -------- | --------- | -------- |
| `WB-FE-I18N-BASE-S1` | `apps/desktop/renderer/src/i18n/__tests__/languagePreference.test.ts` | `it('reads language from localStorage')` | mock localStorage 返回 "en"，断言 `getLanguagePreference()` 返回 "en" | `vi.stubGlobal('localStorage')` | `pnpm -C apps/desktop test:run i18n/__tests__/languagePreference` |
| `WB-FE-I18N-BASE-S1b` | 同上 | `it('falls back to zh-CN when localStorage is empty')` | mock localStorage 返回 null，断言返回 "zh-CN" | 同上 | 同上 |
| `WB-FE-I18N-BASE-S1c` | 同上 | `it('persists language to localStorage')` | 调用 `setLanguagePreference("en")`，断言 localStorage.setItem 被调用 | 同上 | 同上 |
| `WB-FE-I18N-BASE-S2` | `apps/desktop/renderer/src/i18n/__tests__/i18n-init.guard.test.ts` | `it('i18n/index.ts does not hardcode lng')` | 读取 i18n/index.ts 源码，断言不含 `lng: "zh-CN"` 硬编码（应引用 languagePreference） | `fs.readFileSync` | `pnpm -C apps/desktop test:run i18n/__tests__/i18n-init.guard` |
| `WB-FE-I18N-BASE-S3` | `apps/desktop/renderer/src/features/settings-dialog/SettingsGeneral.language.test.tsx` | `it('renders language selector and persists choice')` | 渲染 SettingsGeneral，找到语言下拉框，选择 "en"，断言 `setLanguagePreference` 被调用 | mock languagePreference | `pnpm -C apps/desktop test:run features/settings-dialog/SettingsGeneral.language` |

### 可复用测试范本

- i18n 测试：`apps/desktop/renderer/src/i18n/__tests__/`
- Settings 测试：`apps/desktop/renderer/src/features/settings-dialog/`

## 3. Red（先写失败测试）

- [ ] 3.1 `WB-FE-I18N-BASE-S1`：mock localStorage 返回 "en"，调用 `getLanguagePreference()`，断言返回 "en"。
  - 期望红灯原因：`languagePreference.ts` 不存在。
- [ ] 3.2 `WB-FE-I18N-BASE-S1b`：mock localStorage 返回 null，断言 fallback 到 "zh-CN"。
  - 期望红灯原因：同上。
- [ ] 3.3 `WB-FE-I18N-BASE-S1c`：调用 `setLanguagePreference("en")`，断言 localStorage.setItem 被调用。
  - 期望红灯原因：同上。
- [ ] 3.4 `WB-FE-I18N-BASE-S2`：读取 i18n/index.ts 源码，断言不含 `lng: "zh-CN"` 硬编码。
  - 期望红灯原因：当前 L27 硬编码 `lng: "zh-CN"`。
- [ ] 3.5 `WB-FE-I18N-BASE-S3`：渲染 SettingsGeneral，断言存在语言下拉框。
  - 期望红灯原因：当前 SettingsGeneral 无语言选择器。
- 运行：`pnpm -C apps/desktop test:run i18n/__tests__/` / `features/settings-dialog/SettingsGeneral.language`

## 4. Green（最小实现通过）

- [ ] 4.1 新增 `languagePreference.ts`：
  - `getLanguagePreference()`：从 localStorage 读取 `creonow-language`，fallback `"zh-CN"`
  - `setLanguagePreference(lng)`：写入 localStorage + `i18n.changeLanguage(lng)`
  → S1/S1b/S1c 转绿
- [ ] 4.2 `i18n/index.ts` L27：`lng: "zh-CN"` → `lng: getLanguagePreference()` → S2 转绿
- [ ] 4.3 `SettingsGeneral.tsx`：新增 Language 下拉框，onChange 调用 `setLanguagePreference()` → S3 转绿
- [ ] 4.4 `OnboardingPage.tsx`：Step 1 新增语言选择，共享 `setLanguagePreference()`

## 5. Refactor（保持绿灯）

- [ ] 5.1 抽取 `useLanguagePreference()` hook（封装 get/set + 触发 re-render）
- [ ] 5.2 确认 `i18n.changeLanguage()` 触发 React 组件树即时更新（react-i18next 内置支持）

## 6. Evidence

- [ ] 6.1 记录 RUN_LOG：Red 阶段测试失败的输出
- [ ] 6.2 记录 RUN_LOG：Green 阶段全部通过的输出
- [ ] 6.3 记录 RUN_LOG：`pnpm -C apps/desktop test:run` 全量回归无新增失败
- [ ] 6.4 记录 Dependency Sync Check（N/A）
- [ ] 6.5 Main Session Audit（仅在 Apply 阶段需要）
