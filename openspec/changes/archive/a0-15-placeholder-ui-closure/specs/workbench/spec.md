# Delta Spec: workbench — 占位 UI 收口

- **Parent Change**: `a0-15-placeholder-ui-closure`
- **Base Spec**: `openspec/specs/workbench/spec.md`
- **GitHub Issue**: #995

---

## 变更摘要

多处 UI 渲染了功能入口但无后端实现的占位组件，**必须**统一处置：要么标注 "Coming Soon" 并 disabled，要么隐藏入口。本变更定义占位 UI 的识别标准、处置策略和处置表。

---

## 变更的 Requirements

### Requirement: 占位 UI 统一处置策略（新增）

系统中所有**已渲染但无后端实现**的占位 UI 组件，**必须**按以下规则之一处置：

#### 策略 A：标注 "Coming Soon" + disabled

适用条件：该功能已列入 v0.2 路线图，保留入口有利于用户了解产品规划。

处置要求：

- 控件**必须**设置 `disabled` 属性，阻止用户交互
- 控件**必须**附加 tooltip 或 badge，文案为 `t('common.comingSoon')`
- tooltip/badge 使用 `--color-fg-muted` Design Token
- **禁止**仅 disabled 而无任何说明——"无解释的 disabled"等于"产品在说谎"

#### 策略 B：隐藏入口

适用条件：该功能尚无路线图排期，或入口的存在会误导用户。

处置要求：

- 组件**必须**不渲染（条件渲染 `false` 或移除 JSX）
- **禁止**使用 CSS `display: none` / `visibility: hidden` 隐藏——DOM 中不应存在不可见的交互节点
- 相关 i18n key 保留不删除（避免后续恢复时缺 key），但标记为 `// placeholder: hidden in v0.1`

### 占位 UI 处置清单

以下组件**必须**按指定策略处置：

| 组件                         | 位置                   | 当前状态                  | 处置策略   | 说明                                                               |
| ---------------------------- | ---------------------- | ------------------------- | ---------- | ------------------------------------------------------------------ |
| Settings Account 按钮        | `SettingsAccount.tsx`  | 全部 disabled，无说明     | **策略 A** | 标注 `t('common.comingSoon')`，tooltip 说明"账户功能开发中"        |
| Search "View More"           | Search 面板            | 渲染链接，无 `onClick`    | **策略 B** | 隐藏——搜索结果展开逻辑未实现，按钮存在会造成困惑                   |
| Search "Search All Projects" | Search 面板            | 渲染链接，无 `onClick`    | **策略 B** | 隐藏——跨项目搜索未实现                                             |
| RightPanel ChatHistory 交互  | RightPanel ChatHistory | 点击回调为 `console.info` | **策略 A** | 保留列表展示，点击操作 disabled + tooltip `t('common.comingSoon')` |
| 版本恢复 Restore 按钮        | 版本历史面板           | 始终 disabled             | **策略 A** | 补充 tooltip `t('common.comingSoon')`，说明"版本恢复开发中"        |

### i18n Key 要求

新增以下 i18n key，`zh-CN.json` 和 `en.json` **必须**同步：

| Key                                  | zh-CN                  | en                                  |
| ------------------------------------ | ---------------------- | ----------------------------------- |
| `common.comingSoon`                  | 即将推出               | Coming Soon                         |
| `common.featureInDevelopment`        | 此功能正在开发中       | This feature is in development      |
| `settingsDialog.account.comingSoonTooltip` | 账户功能正在开发中     | Account features are in development |
| `versionControl.restoreComingSoon`   | 版本恢复功能正在开发中 | Version restore is in development   |

### Design Token 引用

| 用途                             | Token                    |
| -------------------------------- | ------------------------ |
| Coming Soon badge/tooltip 文字色 | `--color-fg-muted`       |
| Coming Soon badge 背景色         | `--color-bg-subtle`      |
| Coming Soon badge 字体           | `--font-family-ui`，11px |

### 约束

- **禁止**在组件中使用裸字符串字面量——所有标注文案通过 `t()` 函数获取
- **禁止**使用 Tailwind 原始色值——Coming Soon 标注的样式通过语义化 Design Token 实现
- **禁止**为占位组件添加任何后端 IPC 调用或 Service 层代码
- 处置策略选择**必须**与本 spec 的处置清单一致——单个组件不得自行决定策略

---

### Scenario: Settings Account 页按钮显示 Coming Soon 标注

- **假设** 用户打开 Settings → Account 页
- **当** 用户查看页面上的操作按钮（如 登录/注册 等）
- **则** 所有按钮处于 disabled 状态
- **并且** 每个 disabled 按钮附有 tooltip，显示 `t('settingsDialog.account.comingSoonTooltip')`（"账户功能正在开发中"）
- **并且** 按钮无 click 响应

### Scenario: Search 面板隐藏无功能链接

- **假设** 用户在 Search 面板中执行搜索
- **当** 搜索结果显示
- **则** 面板中**不渲染** "View More" 链接
- **并且** 面板中**不渲染** "Search All Projects" 链接
- **并且** 搜索结果列表正常展示，不受隐藏影响

### Scenario: ChatHistory 条目点击显示 Coming Soon 提示

- **假设** 用户在 RightPanel 中查看 ChatHistory 列表
- **当** 用户点击某条历史记录
- **则** 不跳转、不展开、不执行任何操作
- **并且** 显示 tooltip `t('common.comingSoon')`（"即将推出"）
- **并且** 控制台不输出 `console.info("TODO")`

### Scenario: 版本恢复 Restore 按钮显示 Coming Soon 提示

- **假设** 用户在版本历史面板中查看某个版本快照
- **当** 用户将鼠标悬停到 Restore 按钮上
- **则** tooltip 显示 `t('versionControl.restoreComingSoon')`（"版本恢复功能正在开发中"）
- **并且** 按钮处于 disabled 状态，不可点击

### Scenario: i18n 切换后 Coming Soon 文案跟随

- **假设** 用户将界面语言切换为英文
- **当** 用户打开 Settings → Account 页
- **则** disabled 按钮的 tooltip 显示 "Account features are in development"
- **并且** 用户切换回中文后 tooltip 显示 "账户功能正在开发中"

---

## 可访问性要求

- disabled 按钮**必须**设置 `aria-disabled="true"`
- tooltip 内容**必须**通过 `aria-describedby` 关联到按钮，供屏幕阅读器读取
- 隐藏的组件（策略 B）**必须**完全从 DOM 中移除，不使用 `aria-hidden`
