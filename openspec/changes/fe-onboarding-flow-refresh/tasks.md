## 1. Specification

更新时间：2026-02-28 19:20

- [ ] 1.1 审阅并确认需求边界：将 Onboarding 从单页展示改为分步引导流——Step 1 语言选择、Step 2 AI 配置引导（可跳过）、Step 3 Open Folder（打开工作区）。不做 Dashboard 深度改造。
- [ ] 1.2 审阅并确认错误路径与边界路径：Step 2 跳过 → 后续 AiPanel 引导卡片兜底；Step 3 用户取消 → 停留在 Step 3；全部完成 → 调用 `onComplete` 进入主界面。
- [ ] 1.3 审阅并确认验收阈值与不可变契约：Step 1/3 必须存在；Step 3 打开文件夹后必须进入工作区；步骤可前进/后退。
- [ ] 1.4 依赖同步检查（Dependency Sync Check）：
  - [ ] `fe-ui-open-folder-entrypoints` 已合并（Step 3 需要 open-folder action）— **STOP if pending**
  - [ ] `fe-i18n-language-switcher-foundation` 已合并（Step 1 需要语言切换能力）— **STOP if pending**（或 Step 1 仅落盘选择不即时切换）

### 1.5 预期实现触点

- `apps/desktop/renderer/src/features/onboarding/OnboardingPage.tsx`：
  - L194：`OnboardingPage` 当前为单页展示 → 改为分步 wizard（Step 1/2/3）
  - L123-125：`OnboardingPageProps` → 可能需要扩展（如 `onLanguageSelect`）
  - L96-121：`features` 数组 → 可能移除或重构为 step 配置
- `apps/desktop/renderer/src/features/onboarding/`：
  - 可能新增：`OnboardingStep1Language.tsx`、`OnboardingStep2AiConfig.tsx`、`OnboardingStep3OpenFolder.tsx`（或内联在 OnboardingPage 中）

**为什么是这些触点**：OnboardingPage 是唯一的引导入口，需要从单页改为分步 wizard。

## 2. TDD Mapping（先测前提）

- [ ] 2.1 将 delta spec 的每个 Scenario 映射为至少一个测试用例
- [ ] 2.2 为每个测试标注对应 Scenario ID，建立可追踪关系
- [ ] 2.3 设定门禁：未出现 Red（失败测试）不得进入实现

### Scenario → 测试映射

| Scenario ID | 测试文件（计划） | 测试名称（计划） | 断言要点 | Mock/依赖 | 运行命令 |
| ----------- | ---------------- | ---------------- | -------- | --------- | -------- |
| `PM-FE-ONB-S1` | `apps/desktop/renderer/src/features/onboarding/Onboarding.language.test.tsx` | `it('renders language selection in step 1')` | Step 1 渲染语言选择器（zh-CN/en） | mock i18n | `pnpm -C apps/desktop test:run features/onboarding/Onboarding.language` |
| `PM-FE-ONB-S1b` | 同上 | `it('persists language selection')` | 选择语言后断言 localStorage/i18n 持久化 | mock i18n + localStorage | 同上 |
| `PM-FE-ONB-S2` | `apps/desktop/renderer/src/features/onboarding/Onboarding.ai-config.test.tsx` | `it('renders AI config step with skip option')` | Step 2 渲染 AI 配置引导 + "跳过" 按钮 | mock settings store | `pnpm -C apps/desktop test:run features/onboarding/Onboarding.ai-config` |
| `PM-FE-ONB-S2b` | 同上 | `it('skip advances to step 3')` | 点击跳过，断言进入 Step 3 | mock settings store | 同上 |
| `PM-FE-ONB-S3` | `apps/desktop/renderer/src/features/onboarding/Onboarding.open-folder.test.tsx` | `it('renders open folder button in step 3')` | Step 3 渲染 "Open Folder" 按钮 | mock IPC invoke | `pnpm -C apps/desktop test:run features/onboarding/Onboarding.open-folder` |
| `PM-FE-ONB-S3b` | 同上 | `it('calls onComplete after folder selected')` | 选择文件夹后断言 `onComplete` 被调用 | mock IPC invoke | 同上 |

### 可复用测试范本

- Onboarding 测试：`apps/desktop/renderer/src/features/onboarding/OnboardingPage.test.tsx`

## 3. Red（先写失败测试）

- [ ] 3.1 `PM-FE-ONB-S1/S1b`：渲染 OnboardingPage，断言 Step 1 有语言选择器且选择后持久化。
  - 期望红灯原因：当前 OnboardingPage 是单页展示，无分步逻辑，无语言选择。
- [ ] 3.2 `PM-FE-ONB-S2/S2b`：断言 Step 2 有 AI 配置引导和跳过按钮，跳过后进入 Step 3。
  - 期望红灯原因：当前无 Step 2。
- [ ] 3.3 `PM-FE-ONB-S3/S3b`：断言 Step 3 有 "Open Folder" 按钮，选择文件夹后调用 onComplete。
  - 期望红灯原因：当前无 Step 3，无 open folder 入口。
- 运行：`pnpm -C apps/desktop test:run features/onboarding/Onboarding.language` / `Onboarding.ai-config` / `Onboarding.open-folder`

## 4. Green（最小实现通过）

- [ ] 4.1 `OnboardingPage.tsx`：引入 step state（`useState<1|2|3>(1)`），根据 step 渲染不同内容 → 分步框架就绪
- [ ] 4.2 Step 1：语言选择器（zh-CN/en），选择后 `i18n.changeLanguage()` + localStorage 持久化 → S1/S1b 转绿
- [ ] 4.3 Step 2：AI 配置引导 + "跳过" 按钮，跳过 → `setStep(3)` → S2/S2b 转绿
- [ ] 4.4 Step 3："Open Folder" 按钮，调用 `openFolderAction`，成功后 `onComplete()` → S3/S3b 转绿

## 5. Refactor（保持绿灯）

- [ ] 5.1 抽取 step 配置为数据结构（`steps: Array<{ component, canSkip }>`），避免散写 if/switch
- [ ] 5.2 添加步骤指示器（dots/progress bar）
- [ ] 5.3 确认步骤可前进/后退（Back 按钮）

## 6. Evidence

- [ ] 6.1 记录 RUN_LOG：Red 阶段测试失败的输出
- [ ] 6.2 记录 RUN_LOG：Green 阶段全部通过的输出
- [ ] 6.3 记录 RUN_LOG：`pnpm -C apps/desktop test:run` 全量回归无新增失败
- [ ] 6.4 记录 Dependency Sync Check：`fe-ui-open-folder-entrypoints` + `fe-i18n-language-switcher-foundation` 合并状态
- [ ] 6.5 Main Session Audit（仅在 Apply 阶段需要）
