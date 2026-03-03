## 1. Specification

更新时间：2026-02-28 19:20

- [ ] 1.1 审阅并确认需求边界：核心页面（Dashboard/Onboarding/SearchPanel/AiPanel）硬编码字符串全部迁移为 `t()` i18n key。修复日期/相对时间本地化（不硬编码 `en-US`）。不做全仓库 60+ 文件的 i18n。
- [ ] 1.2 审阅并确认错误路径与边界路径：缺失 key 时 fallback 到 key 本身（i18next 默认行为）；日期格式随 `i18n.language` 切换。
- [ ] 1.3 审阅并确认验收阈值与不可变契约：核心页面不得残留硬编码可见字符串（中文或英文）；日期格式不得硬编码 locale。
- [ ] 1.4 依赖同步检查（Dependency Sync Check）：`fe-i18n-language-switcher-foundation`（语言切换基础必须先就绪）

### 1.5 预期实现触点

- `apps/desktop/renderer/src/features/dashboard/DashboardPage.tsx`：
  - 已有 22 处 `t()` 但仍有硬编码字符串（按钮文案、提示文案等）
  - L308-329：`formatRelativeTime`/`formatDate` 硬编码 `"en-US"` → 改为使用 `i18n.language`
- `apps/desktop/renderer/src/features/search/SearchPanel.tsx`：
  - 13 处 `t()` 但大量中文硬编码（"搜索"、"暂无结果" 等）→ 全部键值化
- `apps/desktop/renderer/src/features/ai/AiPanel.tsx`：
  - 41 处 `t()` 已较好，核查残余硬编码
- `apps/desktop/renderer/src/features/onboarding/OnboardingPage.tsx`：
  - 核查并键值化所有可见字符串
- `apps/desktop/renderer/src/i18n/locales/zh-CN.json` + `en.json`：
  - 补齐新增 key 的中英文翻译
- 新增/修改 `apps/desktop/renderer/src/lib/dateFormat.ts`（可选）：
  - 统一日期格式化工具，接受 locale 参数，默认从 `i18n.language` 获取

**为什么是这些触点**：Dashboard/Search/AI/Onboarding 是用户最常见的四个核心页面，日期格式化是跨页面共性问题。

## 2. TDD Mapping（先测前提）

- [ ] 2.1 将 delta spec 的每个 Scenario 映射为至少一个测试用例
- [ ] 2.2 为每个测试标注对应 Scenario ID，建立可追踪关系
- [ ] 2.3 设定门禁：未出现 Red（失败测试）不得进入实现

### Scenario → 测试映射

| Scenario ID | 测试文件（计划） | 测试名称（计划） | 断言要点 | Mock/依赖 | 运行命令 |
| ----------- | ---------------- | ---------------- | -------- | --------- | -------- |
| `WB-FE-I18N-CORE-S1` | `apps/desktop/renderer/src/features/dashboard/Dashboard.i18n-guard.test.ts` | `it('DashboardPage has no hardcoded visible strings')` | 读取源码，断言无中文/英文硬编码字符串（排除 import/className/key） | `fs.readFileSync` | `pnpm -C apps/desktop test:run features/dashboard/Dashboard.i18n-guard` |
| `WB-FE-I18N-CORE-S2` | `apps/desktop/renderer/src/features/search/SearchPanel.i18n-guard.test.ts` | `it('SearchPanel has no hardcoded visible strings')` | 同上 | `fs.readFileSync` | `pnpm -C apps/desktop test:run features/search/SearchPanel.i18n-guard` |
| `WB-FE-I18N-CORE-S3` | `apps/desktop/renderer/src/features/ai/AiPanel.i18n-guard.test.ts` | `it('AiPanel has no hardcoded visible strings')` | 同上 | `fs.readFileSync` | `pnpm -C apps/desktop test:run features/ai/AiPanel.i18n-guard` |
| `WB-FE-I18N-CORE-S4` | `apps/desktop/renderer/src/features/__tests__/date-format-locale.guard.test.ts` | `it('date formatting does not hardcode en-US')` | 扫描 features/**/*.tsx，断言不含 `"en-US"` 在日期格式化上下文 | `fs`/`glob` | `pnpm -C apps/desktop test:run features/__tests__/date-format-locale.guard` |

### 可复用测试范本

- CommandPalette i18n 范本：`apps/desktop/renderer/src/features/commandPalette/CommandPalette.tsx`（已全量 i18n）

## 3. Red（先写失败测试）

- [ ] 3.1 `WB-FE-I18N-CORE-S1`：读取 DashboardPage.tsx 源码，断言无硬编码可见字符串。
  - 期望红灯原因：仍有硬编码中文/英文字符串。
- [ ] 3.2 `WB-FE-I18N-CORE-S2`：读取 SearchPanel.tsx 源码，断言无硬编码可见字符串。
  - 期望红灯原因：大量中文硬编码。
- [ ] 3.3 `WB-FE-I18N-CORE-S3`：读取 AiPanel.tsx 源码，断言无硬编码可见字符串。
  - 期望红灯原因：可能有残余硬编码。
- [ ] 3.4 `WB-FE-I18N-CORE-S4`：扫描 features/**/*.tsx，断言日期格式化不含 `"en-US"` 硬编码。
  - 期望红灯原因：DashboardPage L329 硬编码 `"en-US"`。
- 运行：`pnpm -C apps/desktop test:run Dashboard.i18n-guard` / `SearchPanel.i18n-guard` / `AiPanel.i18n-guard` / `date-format-locale.guard`

## 4. Green（最小实现通过）

- [ ] 4.1 DashboardPage：残余硬编码字符串 → `t()` key，补齐 locale JSON → S1 转绿
- [ ] 4.2 DashboardPage L308-329：`formatRelativeTime`/`formatDate` 改为接受 locale 参数（从 `i18n.language` 获取） → S4 转绿
- [ ] 4.3 SearchPanel：硬编码中文 → `t()` key，补齐 locale JSON → S2 转绿
- [ ] 4.4 AiPanel：核查并修复残余硬编码 → S3 转绿
- [ ] 4.5 OnboardingPage：键值化所有可见字符串
- [ ] 4.6 `locales/zh-CN.json` + `en.json`：补齐所有新增 key

## 5. Refactor（保持绿灯）

- [ ] 5.1 抽取统一 `dateFormat.ts` 工具（接受 locale，默认 `i18n.language`），替换各处散装日期格式化
- [ ] 5.2 收敛 key 命名规则（`<module>.<component>.<element>` 格式）

## 6. Evidence

- [ ] 6.1 记录 RUN_LOG：Red 阶段 guard 测试失败的输出
- [ ] 6.2 记录 RUN_LOG：Green 阶段全部通过的输出
- [ ] 6.3 记录 RUN_LOG：`pnpm -C apps/desktop test:run` 全量回归无新增失败
- [ ] 6.4 记录 Dependency Sync Check：确认 `fe-i18n-language-switcher-foundation` 状态
- [ ] 6.5 Main Session Audit（仅在 Apply 阶段需要）
