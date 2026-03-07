# CreoNow 实施任务总表

更新时间：2026-03-06 22:55

> "凡事预则立，不预则废。"——路线图解决的是方向感，实施总表解决的是执行时不走神、不失序、不把重要事情做成碎片。

---

## 文件索引

| § | 章节 | 内容 |
|---|------|------|
| 一 | 使用方式 | 这份 backlog 如何配合主路线图使用 |
| 二 | 阶段 0 | 发布前先止血、先收口的事项 |
| 三 | 阶段 1 | v0.1 主体验升级事项 |
| 四 | 阶段 2 | 工程治理与体验放大并行事项 |
| 五 | 阶段 3 | 护城河深化与 V Next 预研 |
| 六 | 依赖矩阵 | 各任务的前后顺序 |
| 七 | 验收节奏 | 每一阶段的 Done 定义 |

---

## 一、使用方式

### 1.1 这不是“想到什么做什么”的清单

本文件的作用是把 Amp threads 的建议压缩成：

- 阶段
- 任务
- 依赖
- 交付物
- 验收标准

### 1.2 使用规则

1. 每次只允许一个主阶段处于 `in progress`，避免主题漂移。
2. 若出现新机会，先判断它属于哪个阶段，再决定是否插入，不允许直接打断阶段主线。
3. 若某任务只是让文档更漂亮、而不提升用户体验或降低发布风险，优先级自动下降一级。

### 1.3 GitHub 执行入口（母 Issue）

为避免历史 tagged issue 在 GitHub 中碎片化并列，本实施总表约定以下 4 条母 Issue 作为后端治理的执行容器：

| 母 Issue | 作用 | 对应 backlog 锚点 | 说明 |
|---|---|---|---|
| [#1007](https://github.com/Leeky1017/CreoNow/issues/1007) | project/session/source ACL 边界治理 | 横跨 A0 可信度收口与 A2 工程安全硬化 | 不压成单个 A0 任务，因为同时覆盖 `file/search/context/rag/embedding/constraints` |
| [#1008](https://github.com/Leeky1017/CreoNow/issues/1008) | preload `ipcGateway`、payload 估算、runtime validation、timeout/abort | `A2-05`、`A2-06S`、`A2-20` | 是这些任务在 GitHub 上的汇聚执行入口 |
| [#1009](https://github.com/Leeky1017/CreoNow/issues/1009) | shared redaction 规则库补真 | 与 `A1-18/A1-20` 相邻，但独立存在 | 处理的是 shared rule hardening，不是 UI 展示脱敏 |
| [#1010](https://github.com/Leeky1017/CreoNow/issues/1010) | CI / discovery / toolchain 可信度 | `test-discovery-consistency`、schema-first / contract gate、受限环境脚本入口 | 门禁若不可信，其余任务的“已验证”都不可信 |

### 1.4 使用约定

- 若某个旧审计问题已被母 Issue 吸收，则旧 issue 关闭仅表示**入口归并**，不表示问题天然解决。
- 在执行时，优先引用母 Issue，再回溯其来源 issue 里的证据。
- 若未来新增同主题后端审计问题，应优先判断是并入 #1007 ~ #1010，还是新开第五条母线；原则上不要再恢复碎片化 tagged queue。


---

## 二、阶段 0：发布前先止血

目标：先让 v0.1 的核心承诺不失真。

| ID | 任务 | 主要落点 | 依赖 | 交付物 | 验收 |
|----|------|----------|------|--------|------|
| A0-01 | 禅模式改为真实可编辑 | `ZenMode.tsx`、`AppShell.tsx`、`EditorPane.tsx` | 无 | 可编辑禅模式实现 + 测试 | 禅模式可输入、保存、退出后内容不丢 |
| A0-02 | 自动保存失败可见化 | `useAutosave.ts`、`editorStore.tsx`、状态栏/Toast | 无 | 错误提示、重试入口、状态反馈 | 失败时用户可见，重试可触发 |
| A0-03 | 渲染进程全局错误兜底 | `main.tsx`、前端日志服务 | A0-02 建议并行 | `unhandledrejection` / `error` 监听与日志上报 | 未处理异常不会完全静默 |
| A0-04 | 导出能力诚实分级 | `ExportDialog.tsx`、`exportService.ts`、设置页文案 | 无 | Markdown-first 策略或 Beta 标记 | 用户不会因 PDF/DOCX 误解真实能力 |
| A0-05 | Skill Router 否定语境守卫 | `skillRouter.ts` 及其测试 | 无 | 规则增强 + 覆盖测试 | “不要续写”这类输入不再明显误触 |
| A0-06 | 发布事实表 | 文档与 UI 文案 | A0-04 | v0.1 对外能力边界说明 | 所有对外宣称与真实实现一致 |
| A0-07 | Windows 首发边界核查 | `electron-builder.json`、发布文档、回归清单 | 无 | Win 首发说明：签名/更新/备份/已知限制 | 可打包不再被误当成可完整首发 |
| A0-08 | 备份能力真伪核查 | 设置页、存储链路、产品文案 | 无 | 确认 backup 是否真实闭环；若否则降级文案/入口 | 不再出现“界面有功能、系统没闭环” |
| A0-09 | i18n 存量 key 核查 | renderer 全局 + 各 feature 组件 | 无 | 消灭未走 `t()` 的裸字符串硬编码 | 中英文切换后无英文残留 |
| A0-10 | 基础全文搜索入口 | renderer 搜索组件 + 主进程文件索引 | 无 | 跨文档关键词搜索 MVP | 用户能搜到自己写过的内容 |
| A0-11 | 数据安全边界声明 | 发布事实表、产品文案 | A0-06 | 诚实说明“创作内容明文存储于本地” | 用户知道数据保护边界 |
| A0-12 | Inline AI 从 0 到 1 新建 | `EditorPane.tsx`、BubbleMenu、shortcuts、AI store | A0-01 | `Cmd/Ctrl+K` 输入层 + inline diff 预览 | 选中到应用不超过 4 步 |
| A0-13 | Toast 接入 App | `App.tsx`、`useToast` | 无 | 挂载 `ToastProvider` + `ToastViewport`，关键场景接入 | 保存/导出/AI/错误有即时反馈 |
| A0-14 | Settings General 持久化 | `SettingsGeneral.tsx`、preferences store | 无 | state 写入 preferences，重启保留 | 设置修改不再刷新即丢 |
| A0-15 | 占位 UI 收口 | ChatHistory、Search 占位按钮、Settings Account | 无 | 隐藏或标注 Coming Soon，不展示空壳 | 不再出现“点了没反应” |
| A0-16 | 编辑器/版本/Slash i18n 核查 | EditorPane、VersionHistory、slashCommands | A0-09 | 全量硬编码文案走 `t()` | 中英文切换无裸字符串 |
| A0-17 | Backup 决策：实现或隐藏 | Settings UI、后端调度/写盘/恢复 | 无 | 实现最小闭环，或隐藏 `backupInterval` 入口 | 不再出现"界面有功能、后端无实现" |
| A0-18 | Judge 决策：接入远程 LLM 或降级纯规则 | `judgeService.ts`、`judgeQualityService.ts`、QualityPanel 文案 | 无 | `ensure()` 不再永远失败，或明确标注"基础规则检查" | 质量检查入口与实际能力一致 |
| A0-19 | Export 纯文本诚实标注 | `ExportDialog.tsx`、`exportService.ts` | A0-04 联动 | PDF/DOCX 标注"仅纯文本"或降级为 Beta | 用户不会以为导出了完整排版 |
| A0-20 | 错误消息统一人话化 | `errorMessages.ts` | 无 | 扩展 `USER_FACING_MESSAGE_BY_CODE` 覆盖全部错误码，fallback 改为通用文案 | 用户永远不会看到 `DB_ERROR`、`AI_RATE_LIMITED` 等技术码 |
| A0-21 | 错误展示组件收口 | 12+ 个组件（ExportDialog、QualityPanel、InfoPanel 等） | A0-20 | 所有 `{error.code}` / `{error.message}` 替换为 `getUserFacingErrorMessage()` | 无技术术语暴露 |
| A0-22 | i18n 错误文案修正 + CommandPalette 脱硬编码 | `zh-CN.json`、`en.json`、`CommandPalette.tsx` | A0-20 | 删除 `NO_PROJECT:` 等前缀，`ACTION_FAILED` 走 i18n | 错误文案无技术码残留 |
| A0-23 | 文档 5MB 限制实施 | `documentCoreService.ts` save | 无 | save 增加 `contentJson` 大小校验，超限返回 `DOCUMENT_SIZE_LIMIT_EXCEEDED` | spec 要求的文档大小限制生效 |
| A0-24 | Skill 输出校验扩展 | `skillExecutor.ts` | 无 | 非 synopsis 技能增加基础输出校验（长度异常、空输出、明显乱码检测） | LLM 垃圾输出不再直接写入编辑器 |

### 2.1 阶段 0 的执行原则

- 不追求大重构，先解决“产品在说谎”的问题。
- 任何会让用户感觉“这个功能是假的”的点，都优先于新功能。
- 如果 Win 是首发主平台，必须把“可打包”和“可首发”区分开来。

---

## 三、阶段 1：v0.1 主体验升级

目标：把写作主路径做顺，把 Magic Moment 做出来。

| ID | 任务 | 主要落点 | 依赖 | 交付物 | 验收 |
|----|------|----------|------|--------|------|
| A1-01 | Inline AI 体验优化 | `EditorPane.tsx`、BubbleMenu、AI store、`applySelection.ts` | A0-12 完成基础实现后 | 简洁模式、上下文感知、历史回看 | Inline AI 日常可用且不打断心流 |
| A1-02 | Dashboard Hero 改为作品预览 | `DashboardPage.tsx` | 无 | 文本预览、最近进度、继续写作入口 | Hero 不再以占位图为主 |
| A1-03 | 模板画廊与空状态重写 | Dashboard / 新建项目入口 | A1-02 可并行 | 起步模板与空状态文案 | 新用户能快速开始写作 |
| A1-04 | Onboarding 互动式 AI 演示 | `OnboardingPage.tsx`、相关 skill | A1-01 部分依赖 | 30 秒内可触发一次 AI 体验 | 新用户不读说明也能感到 AI 能力 |
| A1-05 | KG / `@` / 快捷键发现性增强 | `EditorToolbar`、`EntityCompletionPanel`、Shortcuts UI、IconBar | 无 | 提示、tooltip、首次引导 | 用户知道这些能力存在 |
| A1-06 | AI 面板简洁模式 | `AiPanel.tsx` | A1-01 可并行 | 简洁模式 / 高级模式分层 | 高频任务不被复杂面板打断 |
| A1-07 | 项目切换的“回到创作”过渡 | Dashboard -> Editor 过渡区域 | A1-02 | 最近片段、待续章节、摘要信息 | 切入编辑不再生硬 |
| A1-08 | i18n 增量覆盖门禁 | CI / ESLint plugin | A0-09 | 新增组件自动检查 `t()` 使用 | 不再积累新的裸字符串 |
| A1-09 | BubbleMenu 链接编辑弹窗 | `EditorBubbleMenu.tsx` | 无 | URL 输入 + 确认，替代固定 URL | 用户能设置自定义链接 |
| A1-10 | 快捷键面板入口 | Settings 或帮助菜单 | 无 | 接入 `ShortcutsPanel` | 用户能查看完整快捷键 |
| A1-11 | 字体加载统一 | `fonts.css` 或 `@font-face` | 无 | 加载设计指定字体或更新规范为系统字体 | 跨平台字体表现一致 |
| A1-12 | Character 章节跳转接通 | `CharacterPanelContainer.tsx` | 无 | 传入 `onNavigateToChapter` | 角色出场章节可点击跳转 |
| A1-13 | InlineDiff 扩展启用 | `EditorPane.tsx` | A0-12 | 在 `useEditor` extensions 中注册 | 行内 diff 装饰可用 |
| A1-14 | Skill Router 否定语境守卫 + 无路由 skill 发现性 | `skillRouter.ts` | A0-05 | 否定表达不误触、6 个无关键词 skill 可被发现 | "不要续写"不触发续写 |
| A1-15 | Memory reject/partial 纳入学习权重 | `preferenceLearning.ts` | 无 | `ignored: true` 改为负反馈权重参与学习 | 反复拒绝某风格后推荐频率下降 |
| A1-16 | 文档并发保存乐观锁 | `documentCoreService.ts` | 无 | save 增加 `content_hash` CAS 比较 | 并发写入不再静默覆盖 |
| A1-17 | `window.confirm` 替换为应用对话框 | `MemoryPanel.tsx`、`EditorPane.tsx` | A0-13（Toast 基础设施） | 3 处 `window.confirm` 改为应用内确认组件 | 确认弹窗与应用主题一致 |
| A1-18 | ErrorBoundary / RegionFallback 脱敏 | `ErrorBoundary.tsx`、`RegionFallback.tsx` | A0-20 | details 折叠为可展开区、RegionFallback 不展示原始 message | 用户不看到 stack trace |
| A1-19 | CommandPalette 错误文案人话化 | `CommandPalette.tsx` | A0-22 | `ACTION_FAILED` / `NO_PROJECT` 全部走 i18n + 人话 | 命令面板报错不暴露技术前缀 |
| A1-20 | AiErrorCard service_error 脱敏 | `AiErrorCard.tsx` | A0-20 | `errorCode` 在 `service_error` 时不再展示技术码 | AI 错误卡片对用户友好 |
| A1-21 | KG queryPath 循环检测 | `kgCoreService.ts` | 无 | BFS 增加 maxDepth 或显式环检测 | 有环图不产生异常长路径 |
| A1-22 | CJK 搜索优化 | `ftsService.ts`、FTS5 migration | 无 | 指定 CJK-friendly tokenizer（如 `trigram` 或预分词方案） | 中文搜索"张三"不需精确匹配 |

### 3.1 阶段 1 的成功标志

- 用户第一次使用时，不会只觉得“功能很多”，而会觉得“这个工具正在接住我的写作动作”。
- 至少出现 1 个无需解释就能理解的 Magic Moment。

---

## 四、阶段 2：工程治理与体验放大并行

目标：一手修中层结构，一手让护城河开始显化。

### 4.1 工程治理任务

| ID | 任务 | 主要落点 | 依赖 | 交付物 | 验收 |
|----|------|----------|------|--------|------|
| A2-01 | `AiPanel.tsx` 首轮拆分 | AI renderer | A1-06 | hook + 子组件结构 | 核心职责边界清晰 |
| A2-02 | `aiService.ts` 拆 provider/stream/retry 层 | AI main service | A0-05 | Strategy 化基础骨架 | 新 provider 接入成本下降 |
| A2-03 | `AppProviders` 收口 | `App.tsx` | 无 | 单一 providers 组合层 | Provider 嵌套显著收敛 |
| A2-04 | 前端日志服务上线 | renderer lib + main logging | A0-03 | `logger.ts` + IPC 桥接 | 关键错误不再散落 `console.*` |
| A2-05 | IPC payload 估算优化 | `ipcGateway.ts` | 无 | 高风险 channel 精准化 / 其余近似化 | 长文档保存主线程压力下降 |
| A2-06 | editor 生命周期审计 | `editorStore.tsx`、`EditorPane.tsx` | A0-01 | 明确清理与释放策略 | 避免 editor 对象残留 |
| A2-06W | Windows 键盘专项回归 | Windows E2E、命令面板、快捷键链路 | A0-07 | 修复/确认 Windows 专属输入时序问题 | Win 平台快捷键与命令面板不再留有跳过项 |
| A2-06S | IPC schema-first 契约体系 | IPC handler + preload bridge + shared types | A2-05 | Zod/io-ts schema 单一真相源 + CI breaking-change 检测 | 新增 channel 不再需要手动同步两端类型 |
| A2-06D | 数据安全评估与加密方案 | KG 存储、Memory 向量库、项目文件 | A0-11 | 评估 SQLCipher / 加密 FS 可行性 | 至少 KG 和 Memory 存储做加密 |

### 4.2 AI 精度与系统质量任务

| ID | 任务 | 主要落点 | 依赖 | 交付物 | 验收 |
|----|------|----------|------|--------|------|
| A2-07 | 中文 token 估算校正 | `tokenBudget.ts`、Context/AI tests | 无 | 更稳妥的预算估算 | 长中文上下文更少触发意外截断 |
| A2-08 | 偏好学习纳入 `reject/partial` | `preferenceLearning.ts`、memory service | 无 | 负反馈学习策略 | “越用越懂你”不再只靠正反馈 |
| A2-09 | AI 流与撤销链补压测 | AI stream + editor undo | A1-01 | 针对 chunk/undo/cancel 的场景测试 | AI 改写不会污染 undo 语义 |
| A2-10 | 导出能力逐步补真 | export main/renderer | A0-04 | 若保留 PDF/DOCX，则补格式/图片 | 导出功能与文案重新对齐 |
| A2-10W | 崩溃可观测性补真 | renderer telemetry、fatal 上报、发布日志链路 | A0-03、A0-07 | 能定位用户侧崩溃的最小闭环 | 首发后不再只能靠用户口述复现 |

### 4.3 护城河显化任务

| ID | 任务 | 主要落点 | 依赖 | 交付物 | 验收 |
|----|------|----------|------|--------|------|
| A2-11 | 角色卡片自动浮现 | KG + editor | A1-05 | 名称命中后的轻浮层 | 用户明显感到 KG 参与写作 |
| A2-12 | KG 入口前置 | AppShell / Sidebar / Dashboard | A1-02 | 更显性的图谱入口 | KG 不再被埋在深层面板 |
| A2-13 | Memory/Context 轻解释 | AI 输出区域或高级信息区 | A2-08 | “本次参考了什么”的人话提示 | 用户理解 AI 并非盲写 |
| A2-14 | 语义搜索 / RAG 前置 | 搜索组件 + 向量索引 + KG | A0-10、A2-08 | 用户可基于语义检索旧内容 | “搜索我的创作”不再只是关键词匹配 |
| A2-15 | Token 源文件同步机制 | `design/system/01-tokens.css` ↔ `tokens.css` | 无 | 建立单一真相源与同步流程 | 设计侧与实现不再漂移 |
| A2-16 | EmptyState 组件统一 | `patterns/EmptyState` + `composites/EmptyState` | 无 | 合并为单一组件 | 减少维护成本与体验不一致 |
| A2-17 | AI 状态栏指示 | `StatusBar.tsx` | 无 | 长时间 AI 任务在状态栏显示状态 | 用户知道 AI 在工作 |
| A2-18 | KG 实体识别接入 LLM | `kgRecognitionRuntime.ts` | A1-21 | mock 正则替换为 LLM 抽取客户端 | 实体识别具备生产质量 |
| A2-19 | Memory 向量升级真实 embedding | `userMemoryVec.ts` | 无 | FNV1a32 替换为 LLM embedding（如 OpenAI Embedding API） | 语义召回不再依赖精确措辞 |
| A2-20 | IPC 运行时校验全覆盖 + Push 通道纳入契约 | IPC handler、preload、shared types | A2-06S | 全部通道有 runtime validation，Push 有 schema | IPC 契约无盲区 |
| A2-21 | Telemetry / crash reporting 最小闭环 | renderer + main telemetry | A2-04 | Sentry 或等价 crashReporter + 匿名遥测 | 发布后能定位用户侧崩溃 |
| A2-22 | AI 流式 failover | `aiService.ts` | A2-02 | 流式模式下主 provider 失败切换 backup | 流式不再是 failover 盲区 |
| A2-23 | 崩溃后草稿恢复机制 | `documentCoreService.ts`、renderer autosave | A1-16 | 崩溃时未保存内容可恢复 | 崩溃不再丢字 |
| A2-24 | AI 限流按 provider 区分 | `aiService.ts` | A2-02 | 每个 provider 独立限流窗口 | 多 provider 不互相阻塞 |
| A2-25 | Memory 蒸馏接入真实 LLM | `episodicMemoryService.ts` | A2-19 | `defaultDistillLlm` 替换为 LLM 语义分析 | 偏好蒸馏从规则引擎升级为语义理解 |

---

## 五、阶段 3：护城河深化与 V Next 预研

目标：不急于首发，但要在路线图上明确立项，不被短期需求冲掉。

| ID | 方向 | 主要内容 | 前置依赖 | 预期价值 |
|----|------|----------|----------|----------|
| A3-01 | 世界观一致性检查 | 角色/关系/设定冲突检测 | A2-11、A2-12 | 形成写作工具独特壁垒 |
| A3-02 | AI 审计轨迹 | AI 修改来源、范围、原因可追踪 | A2-04、版本系统 | 面向出版/编辑场景的专业能力 |
| A3-03 | 多章节 Binder 模型 | 长篇章节组织、拖拽重排 | 阶段 1 稳定后 | 向 Scrivener 级别靠近 |
| A3-04 | 写作习惯分析 | 创作时段、产能、AI 贡献 | 埋点与 analytics | 提升留存与自我反馈 |
| A3-05 | Skill 社区化 | 技能分享、包化、市场雏形 | A2-02、A2-04 | 形成生态增量 |
| A3-06 | 氛围感知上下文层 | 情绪/氛围驱动的写作风格调节 | A2-07、A2-08 | 把 Context Engine 推向更有产品感的方向 |
| A3-07 | Auto-update 与升级回退 | 发布通道、更新提示、失败回退 | A0-07 | Windows 持续分发闭环 | 从“能发包”升级到“能持续交付” |

---

## 六、依赖矩阵

### 6.1 关键依赖关系

| 先做 | 后做 | 原因 |
|------|------|------|
| A0-01 禅模式真实编辑 | A1-01 Inline AI | 必须先稳住真实编辑现场 |
| A0-02 自动保存可见化 | A1-07 创作过渡体验 | 否则体验增强建立在不稳的保存链上 |
| A0-03 渲染进程兜底 | A2-04 前端日志服务完善 | 先补全局口，再做日志体系化 |
| A0-04 导出能力分级 | A2-10 导出能力补真 | 先诚实，后补齐 |
| A1-05 发现性增强 | A2-11 角色卡片浮现 | 用户先知道能力，再被能力惊艳 |
| A2-03 AppProviders | A2-06 editor 生命周期审计 | 先收结构，再清边界 |
| A2-08 负反馈学习 | A2-13 Memory/Context 解释层 | 解释之前必须先确保学习逻辑可信 |
| A0-09 i18n 核查 | A1-08 i18n 增量门禁 | 先清存量，再堵增量 |
| A0-10 基础搜索 | A2-14 语义搜索 | 先有关键词，再上语义 |
| A0-11 数据安全声明 | A2-06D 加密方案 | 先诚实，后加密 |
| A0-12 Inline AI 基础 | A1-01 Inline AI 优化 | 先 0→1 实现，再优化体验 |
| A0-13 Toast 接入 | A0-14/15/16 全部场景 | Toast 是即时反馈基础设施 |
| A0-16 i18n 核查 | A1-08 增量门禁 | 先清存量硬编码，再堵增量 |
| A0-20 错误消息人话化 | A0-21 组件收口 | 先有映射表，再改组件 |
| A0-20 错误消息人话化 | A1-18 ErrorBoundary 脱敏 | 先有通用兜底，再做边界脱敏 |
| A0-20 错误消息人话化 | A1-20 AiErrorCard 脱敏 | 同上 |
| A0-22 i18n 错误文案修正 | A1-19 CommandPalette 人话化 | 先修 i18n 基础，再改组件 |
| A1-16 乐观锁 | A2-23 崩溃恢复 | 先防并发覆盖，再防崩溃丢字 |
| A2-02 aiService 拆分 | A2-22 流式 failover | 先拆结构，再加能力 |
| A2-02 aiService 拆分 | A2-24 per-provider 限流 | 同上 |
| A2-19 Memory 向量升级 | A2-25 蒸馏接入 LLM | 先有真实 embedding，再做语义蒸馏 |

### 6.2 可并行项

- A1-02 Dashboard 预览
- A1-03 模板画廊
- A1-05 发现性增强
- A2-05 IPC 估算优化
- A2-07 token 估算校正
- A0-09 i18n 核查（与 A0-01~A0-08 并行）
- A0-10 基础搜索（与 A0-01~A0-08 并行）
- A0-13 Toast 接入（与所有 A0 并行）
- A0-14 Settings 持久化（与所有 A0 并行）
- A0-15 占位 UI 收口（与所有 A0 并行）
- A0-17 Backup 决策（与所有 A0 并行）
- A0-18 Judge 决策（与所有 A0 并行）
- A0-20/21/22 错误消息三件套（与 A0-01~A0-16 并行）
- A0-23 文档 5MB 限制（与所有 A0 并行）
- A0-24 Skill 输出校验（与所有 A0 并行）

---

## 七、验收节奏

### 7.1 阶段 0 Done 定义

- 禅模式、自动保存、异常兜底、导出能力、Skill Router 五件事都有明确结果。
- Inline AI 基础实现完成（`Cmd/Ctrl+K` 可用）。
- i18n 存量裸字符串清零。
- 基础全文搜索入口可用。
- 数据安全边界已诚实声明。
- 备份能力真伪已核实并处理（A0-17）。
- Judge 能力与文案一致（A0-18）。
- Toast 系统接入，关键场景有即时反馈。
- 所有占位 UI 已收口（隐藏或标注 Coming Soon）。
- 版本历史、Slash 命令、编辑器硬编码文案全部走 i18n。
- Settings General 设置可持久化。
- 用户永远不会看到技术错误码（A0-20/21/22）。
- 文档大小有上限保护（A0-23）。
- Skill 输出有基础校验（A0-24）。
- v0.1 不再存在明显“说得比做到多”的入口。

### 7.2 阶段 1 Done 定义

- AI 修改主路径显著缩短。
- 首次体验与 Dashboard 完成重塑。
- 至少 1 个 Magic Moment 可以稳定演示。
- Memory 负反馈参与学习（A1-15）。
- 文档并发保存安全（A1-16）。
- 所有确认弹窗为应用内组件（A1-17）。
- 异常边界不泄露技术细节（A1-18/19/20）。
- 中文搜索体验可用（A1-22）。

### 7.3 阶段 2 Done 定义

- AI / AppShell / Provider / 日志等中层结构开始稳定收口。
- KG / Memory / Context 至少有一部分价值变成用户看得见的体验。
- IPC 契约全覆盖、Telemetry 最小闭环上线。
- 崩溃恢复机制到位。

### 7.4 阶段 3 Done 定义

- CN 不再只是“AI 辅助写作工具”，而开始出现明显的专业护城河轮廓。

---

> 这份 backlog 最重要的，不是把任务排满，而是帮 CN 守住一条秩序：先修真实承诺，再做惊艳体验；先建连续写作流，再放大后端护城河。只要顺序不乱，后面的每一步都会比现在更像一个真正属于创作者的 IDE。
