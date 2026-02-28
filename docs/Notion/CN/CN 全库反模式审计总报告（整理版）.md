# CN 全库反模式审计总报告（整理版）

> Source: Notion local DB page `f72fce77-931e-4a95-bc40-6e23d07e3cc9`

> 📋

审计时间：2026-02-14 00:40 — 01:10 CST ｜ 审计对象：apps/ 全部源码 ｜ 模式：A1-A7 七个专项子代理并行只读审计

## 汇总统计

| 子代理 | 领域 | 扫描文件 | 问题总数 | Critical | High | Medium | Low |
| --- | --- | --- | --- | --- | --- | --- | --- |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| A1 | 代码膨胀 | 666 | 10 | 0 | 4 | 4 | 2 |
| A2 | 行为偏差 | 694 | 10 | 0 | 4 | 4 | 2 |
| A3 | 质量陷阱 | 664 | 6 | 1 | 2 | 2 | 1 |
| A4 | 安全与规范 | 664 | 5 | 0 | 2 | 1 | 2 |
| A5 | 架构合规 | 661 | 8 | 1 | 3 | 2 | 2 |
| A6 | 健壮性 | 661 | 9 | 0 | 3 | 4 | 2 |
| A7 | 可维护性 | 664 | 1,631 | 223 | 328 | 1,076 | 4 |
| 总计 |  |  | 1,679 | 225 | 346 | 1,093 | 15 |

> A7 包含规则命中型统计（同文件可多命中），实际独立问题项 19 个。

---

## 🔥 Top 10 最紧急问题

| # | 编号 | 问题 | 模块 |
| --- | --- | --- | --- |
| 1 | A3-C-001 | 空内容请求伪造 queued 成功响应 | KG |
| 2 | A5-C-001 | Context 装配与 fetcher 循环依赖闭环 | Context |
| 3 | A4-H-002 | IPC 缺少调用方身份/来源鉴权 | IPC |
| 4 | A4-H-001 | Electron sandbox: false 不安全默认 | IPC |
| 5 | A6-H-003 | KG 面板异步写入不校验结果 | KG |
| 6 | A6-H-001 | 窗口加载 Promise 未兜底 | Workbench |
| 7 | A2-H-001 | context 组装异常被静默吞掉 | Skill |
| 8 | A2-H-002 | metadata 解析失败即清空回写 | KG |
| 9 | A7-C-001 | createDocumentService 超长（1743 行） | Document |
| 10 | A7-C-002 | createAiService 超长（1460 行） | AI Service |

---

## 🗺️ 模块问题热力图

| 模块 | 问题数 | 热度 |
| --- | --- | --- |
| --- | ---: | --- |
| Workbench | 15 | 🔥 高 |
| KG | 12 | 🔥 高 |
| AI Service | 12 | 🔥 高 |
| IPC | 8 | 🟠 中高 |
| Skill | 6 | 🟠 中 |
| Document | 5 | 🟠 中 |
| VC | 4 | 🟡 中低 |
| Context | 2 | 🟡 中低 |
| Search | 2 | 🟡 中低 |
| Memory | 1 | 🟢 低 |

---

## 📅 建议修复 Sprint 排期（3 批次）

### 批次 1（P0，立即）

- 修复错误语义与安全边界：A3-C-001、A5-C-001、A4-H-001、A4-H-002

- 稳定关键异步链路：A6-H-001、A6-H-002、A6-H-003

- 启动核心超大函数拆分设计：A7-C-001 ~ A7-C-006

### 批次 2（P1，高优）

- 收敛 fallback/降级链：A2-H-001 ~ A2-H-004

- 打散 God Object 与循环依赖：A5-H-001 ~ A5-H-003

- 清理硬编码阈值与深层相对路径：A7-H-007 ~ A7-H-012

### 批次 3（P2-P3，治理债务）

- 修复测试可信度问题：A3-M-001、A3-M-002、A3-L-001

- 收敛风格漂移与僵尸路径：A1-M/L、A4-L、A5-L

- 执行可维护性系统治理：A7-M/L + 模式统计项

---

## 📁 专项审计报告

> 📊

扫描文件：666 ｜ 问题总数：10 ｜ Critical 0 · High 4 · Medium 4 · Low 2

## 🟠 高危问题（High）

### A1-H-001 · 设置账户操作入口为僵尸代码

- 文件：SettingsDialog.tsx L195-L203

- 类型：死代码 / 僵尸代码（空实现占位）

- 描述：账户操作回调是空函数体，仅保留 TODO，占位逻辑已进入主路径 UI

- 风险：用户触发关键操作无效果，形成"可点击但无行为"的僵尸入口

- 建议：移出主路径或显式禁用入口；未实现前返回可观测错误状态并记录

- 优先级：P0

### A1-H-002 · Version 类型定义重复链路

- 文件：VersionHistoryContainer.tsx L17-L24

- 类型：重复类型定义

- 描述：VersionListItem 在容器层和 store 层重复定义，结构一致，存在漂移风险

- 风险：任一侧字段变更会出现"编译可过但运行契约不一致"

- 建议：收敛到单一类型源并统一引用

- 优先级：P1

### A1-H-003 · Judge 模型确保流程双实现

- 文件：JudgeSection.tsx L49-L70

- 类型：同一业务流双实现

- 描述：judge:model:ensure 的状态机在两个模块重复实现（busy、防重入、downloading、error 映射）

- 风险：后续修复/增强只改一处，导致 UI 行为不一致

- 建议：抽成共享 hook/服务，统一错误映射与状态迁移

- 优先级：P1

### A1-H-004 · VersionHistory 固定占位字段长期存在

- 文件：VersionHistoryContainer.tsx L154-L161

- 类型：硬编码占位

- 描述：wordChange 固定为 none/0，并带 TODO，字段长期无真实语义

- 风险：下游 UI/分析依赖该字段时会得到系统性错误信息

- 建议：实现真实 diff 或在契约层移除该字段直到可用

- 优先级：P1

---

## 🟡 中危问题（Medium）

### A1-M-001 · 演示参数侵入生产组件

- 文件：AiInlineConfirm.tsx L263-L274

- 描述：simulateDelay/initialState 等演示参数进入正式组件行为路径

- 建议：将 demo 控制下沉到 stories/fixtures，生产组件只保留业务参数

- 优先级：P2

### A1-M-002 · ErrorCard 内置重试成功开关

- 文件：AiErrorCard.tsx L532-L535

- 描述：retryWillSucceed 在生产组件内控制重试结果，属于测试/演示分支外泄

- 建议：改为外部回调结果注入

- 优先级：P2

### A1-M-003 · Barrel 文件注释模板化堆叠

- 文件：AiDialogs/index.ts L1-L41

- 描述：barrel 文件含大段说明与示例，信息密度低

- 建议：barrel 保留最小注释，示例迁移至 Storybook

- 优先级：P2

### A1-M-004 · 一行转发包装函数

- 文件：kgRecognitionRuntime.ts L275-L277

- 描述：service() 仅转发 createKnowledgeGraphService(...)，增加无收益中间层

- 建议：直接注入或缓存 service 实例，去除一次性转发函数

- 优先级：P2

---

## 🔵 低危问题（Low）

### A1-L-001 · 未使用参数占位

- 文件：OutlinePanel.tsx L602-L604

- 描述：onScrollSync 仅以 _onScrollSync 占位并关闭 lint

- 优先级：P3

### A1-L-002 · Deprecated 路径疑似长期双轨

- 文件：QualityGatesPanel.tsx L283-L287

- 描述：标注 @deprecated 的 standalone 容器样式仍在主文件持续维护

- 优先级：P3

---

## 📈 模式统计

| 指标 | 数量 |
| --- | --- |
| --- | ---: |
| 注释密度 ≥30% 的文件 | 39 |
| TODO: 命中 | 4 |
| @deprecated 命中 | 3 |
| 装饰性分隔注释 | 1,047 |
| 生产代码中演示控制参数 | 30 |
| 重复类型命名 | 41 |
| 已确认僵尸参数 | 1 |
| 已确认重复业务链路 | 2 |

> 📊

扫描文件：694 ｜ 问题总数：10 ｜ Critical 0 · High 4 · Medium 4 · Low 2

## 🟠 高危问题（High）

### A2-H-001 · Context 组装异常被静默吞掉

- 文件：skillExecutor.ts L250-L261

- 类型：过度防御性降级

- 描述：上下文组装异常被直接吞掉，仅注释说明 best-effort，无日志、无告警透传

- 风险：真实故障被静默降级为无上下文执行，输出质量漂移且难排查

- 建议：记录结构化 warning（executionId/skillId），并在 diagnostics 标记 context_degraded

- 优先级：P1

### A2-H-002 · metadata 解析失败即清空回写

- 文件：kgToGraph.ts L228-L243

- 类型：过度 fallback 链

- 描述：metadataJson 解析失败后直接 metadata = {} 并回写，实际清空原始数据

- 风险：异常输入下可能覆盖原 metadata，形成隐性数据丢失

- 建议：解析失败时拒绝写入并显式报错/提示，或保留原始值

- 优先级：P1

### A2-H-003 · KG Panel 存在多层清空 fallback 链

- 文件：KnowledgeGraphPanel.tsx L50-L66

- 类型：过度 fallback 链

- 描述：metadata 解析失败返回 {}，后续直接写 timeline，形成多层"清空后再写"

- 风险：异常输入下持续覆盖旧 metadata，导致表面成功但数据漂移

- 建议：统一 metadata 解析策略（失败即 fail-fast + 诊断）

- 优先级：P1

### A2-H-004 · 技能目录读取失败统一返回空数组

- 文件：skillLoader.ts L125-L135

- 类型：过度防御性降级

- 描述：目录读取失败统一回 []，无错误上下文

- 风险：权限/路径错误表现为"没有技能"，形成幽灵故障入口

- 建议：返回带错误码的结果结构，并记录 dirPath + errno

- 优先级：P1

---

## 🟡 中危问题（Medium）

### A2-M-001 · Context fetcher 异常细节被抹平

- 文件：settingsFetcher.ts L82-L87

- 描述：多处 fetcher 异常时统一回空 chunks + warning，不保留底层异常细节

- 建议：warning 中加入可审计错误摘要 ID

- 优先级：P2

### A2-M-002 · runId/executionId 双字段长期并存

- 文件：ai.ts L838

- 描述：executionId ?? runId ?? "" 反映补丁式兼容延续

- 建议：设定迁移窗口，收敛单一字段并输出弃用告警

- 优先级：P2

### A2-M-003 · id/skillId 双轨兼容堆叠

- 文件：skills.ts L129

- 描述：id ?? skillId ?? "" 同类兼容堆叠

- 建议：统一请求 schema，兼容期打点统计旧字段使用率

- 优先级：P2

### A2-M-004 · Ping handler 不可达 catch 分支

- 文件：index.ts L175-L182

- 描述：app:system:ping 内部 try/catch 包裹纯常量返回，catch 分支永不触发

- 建议：删除不可达 catch

- 优先级：P2

---

## 🔵 低危问题（Low）

### A2-L-001 · AppShell JSON 解析失败后静默默认值

- 文件：AppShell.tsx L72-L109

- 描述：文档 JSON 解析失败直接回 Untitled + 空段落，未附带可观测诊断

- 优先级：P3

### A2-L-002 · contextRules 非法输入被吞并为空对象

- 文件：skillService.ts L212-L225

- 描述：contextRules JSON 非法或类型不符均回 {}，语义被吞并

- 优先级：P3

---

## 📈 模式统计

| 模式 | 命中数 |
| --- | --- |
| --- | ---: |
| 过度防御性降级 / 保守回退 | 5 |
| 重构回避 / 只增不改 | 2 |
| 幽灵 Bug / 边界过度处理 | 1 |
| 过度 fallback 链 | 2 |

> 📊

扫描文件：664 ｜ 问题总数：6 ｜ Critical 1 · High 2 · Medium 2 · Low 1

## 🔴 严重问题（Critical）

### A3-C-001 · 空内容时伪造"已排队任务"响应

- 文件：kgRecognitionRuntime.ts L470-L478

- 类型：静默失败 / 伪造输出

- 描述：contentText 为空时直接返回 ok: true + 随机 taskId + status: "queued"，但实际未入队

- 风险：调用方误以为任务存在，后续取消/追踪失败，形成表面成功

- 建议：返回 status: "skipped" 或 ok: false + 结构化原因；禁止生成不可追踪 taskId

- 优先级：P0

---

## 🟠 高危问题（High）

### A3-H-001 · Scheduler 异步错误上下文丢失

- 文件：skillScheduler.ts L260-L278

- 类型：异步错误吞并

- 描述：response 与 completion 分离处理，completion.catch(() => ...) 丢弃错误细节

- 风险：排障信息丢失；响应结果与队列终态出现不一致

- 建议：聚合 response/completion 结果；catch 保留错误上下文并上报

- 优先级：P1

### A3-H-002 · 失败任务被计入 completed

- 文件：kgRecognitionRuntime.ts L424-L437, L645-L660

- 类型：表面正确（失败也计 completed）

- 描述：processTask 失败后 finally 无条件 metrics.completed += 1

- 风险：监控把失败当完成，健康度和容量判断失真

- 建议：拆分 succeeded/failed/completed 计数并对外暴露失败数

- 优先级：P1

---

## 🟡 中危问题（Medium）

### A3-M-001 · 固定 sleep 驱动异步测试

- 文件：recognition-query-failure-degrade.test.ts L46-L48

- 描述：依赖固定 setTimeout(80) 等待异步完成，而非基于事件/条件收敛

- 建议：改为条件等待（事件、状态轮询、waitFor）

- 优先级：P2

### A3-M-002 · Story 测试仅做存在性断言

- 文件：AiPanel.stories.test.ts L6-L10

- 描述：仅断言 story 导出存在，不验证渲染行为、交互或状态

- 建议：增加关键 story 的渲染/交互断言

- 优先级：P2

---

## 🔵 低危问题（Low）

### A3-L-001 · 低信息密度布尔断言

- 文件：recognition-silent-degrade.test.ts L40-L43

- 描述：使用 assert.equal(errorEvents.length > 0, true)，失败诊断弱

- 建议：改为精确断言（数量和关键字段）

- 优先级：P3

---

## 📈 模式统计

| 指标 | 数量 |
| --- | --- |
| --- | ---: |
| 伪造 / 表面成功返回 | 1 |
| 吞错或丢失错误上下文 | 1 |
| 完成统计与失败混算 | 1 |
| 固定 setTimeout 驱动异步测试 | 19 |
| 浅层存在性断言 | 18 |
| 高频 mock 测试位点 | 161（36 个测试文件） |

> 📊

扫描文件：664 ｜ 问题总数：5 ｜ Critical 0 · High 2 · Medium 1 · Low 2

## 🟠 高危问题（High）

### A4-H-001 · Electron Sandbox 默认关闭

- 文件：index.ts L104-L108

- 类型：不安全默认配置

- 描述：主窗口 webPreferences.sandbox 显式为 false

- 风险：渲染层出现 XSS/依赖链污染时，主进程边界保护减弱

- 建议：默认启用 sandbox: true，仅对必要窗口做最小例外并补充回归测试

- 优先级：P0

### A4-H-002 · IPC 调用方身份/来源未鉴权

- 文件：runtime-validation.ts L403-L417

- 类型：权限检查缺失

- 描述：运行时校验覆盖 schema/envelope，但未校验调用方权限；preload 允许全部通道透传

- 风险：渲染层被注入或越权页面出现时，可直接调用高权限 IPC 通道

- 建议：增加统一调用方鉴权（来源白名单、窗口/会话标识、按通道 ACL），默认拒绝

- 优先级：P0

---

## 🟡 中危问题（Medium）

### A4-M-001 · 调试通道在常规路径暴露

- 文件：index.ts L186-L204

- 类型：敏感信息泄露面

- 描述：db:debug:tablenames 常规注册且可被公开 IPC 通道调用

- 风险：泄露数据库结构元信息

- 建议：仅 dev/e2e 注册，或增加显式 debug 权限门禁

- 优先级：P2

---

## 🔵 低危问题（Low）

### A4-L-001 · 错误处理风格混杂

- 文件：documentService.ts L904-L905

- 描述：同一服务混用 throw new Error("NOT_FOUND") 与 ipcError(...) 返回式错误

- 建议：统一为显式 Result/Err 返回

- 优先级：P3

### A4-L-002 · 技术栈文档与依赖清单疑似漂移

- 文件：package.json L44, L46

- 描述：docx、pdfkit 在依赖中存在，但锁定技术栈文档未明确对应项

- 建议：补齐 RFC/批准记录并同步技术栈文档

- 优先级：P3

---

## 📈 模式统计

| 模式 | 命中数 |
| --- | --- |
| --- | ---: |
| 输入/权限校验缺失 | 1 |
| 不安全默认配置 | 1 |
| 信息泄露面 | 1 |
| 错误处理风格混杂 | 1 |
| 未经批准新依赖痕迹（疑似） | 1 |

> 📊

扫描文件：661 ｜ 问题总数：8 ｜ Critical 1 · High 3 · Medium 2 · Low 2

## 🔴 严重问题（Critical）

### A5-C-001 · Context 装配链路循环依赖

- 文件：layerAssemblyService.ts L6-L8

- 类型：循环依赖（核心上下文链路）

- 描述：layerAssemblyService 依赖 fetchers；fetcher 反向依赖 layerAssemblyService 类型，且 retrievedFetcher 依赖 rulesFetcher，形成闭环

- 风险：核心模块耦合闭环，重构易触发连锁修改和初始化顺序风险

- 建议：抽离 ContextLayerFetcher 到独立 types；下沉 formatEntityForContext 到纯工具模块打断环

- 优先级：P0

---

## 🟠 高危问题（High）

### A5-H-001 · 布局层与功能层循环依赖

- 文件：RightPanel.tsx L8 ↔ AiPanel.tsx

- 类型：UI 分层反转

- 描述：RightPanel 引入 AiPanel；AiPanel 再引入 RightPanel 暴露的 hook

- 风险：面板/功能模块难独立测试与替换

- 建议：抽出独立 context/hook 供双方依赖

- 优先级：P1

### A5-H-002 · DocumentService 成为 God Object

- 文件：documentService.ts L300, L655, L863

- 类型：架构退化 / 单体回归

- 描述：同一服务同时承载 diff、branch/settings 持久化、文档 CRUD、版本合并

- 风险：变更面过大，缺陷定位和回归测试成本持续上升

- 建议：按能力拆分为 CRUD、版本、分支、diff 子服务

- 优先级：P1

### A5-H-003 · AI Service 成为 God Object

- 文件：aiService.ts L206, L769, L981

- 类型：架构退化 / 单体回归

- 描述：聚合 token 估算、env 解析、provider 路由、错误映射、运行时调度

- 风险：协议、配置、运行耦合于单点

- 建议：拆成 providerResolver、upstreamAdapter、sessionRuntime、errorMapper

- 优先级：P1

---

## 🟡 中危问题（Medium）

### A5-M-001 · 业务服务直接耦合 IPC 契约

- 文件：documentService.ts L5-L8

- 描述：main 业务 service 直接依赖 ipc-generated 的 IpcError/IpcErrorCode

- 建议：service 层定义领域错误，IPC 层做映射

- 优先级：P2

### A5-M-002 · 跨层深相对路径导入泛化

- 文件：ipcClient.ts L5（命中 77 个非测试文件）

- 描述：跨层共享契约通过 ../../../../../packages/shared/... 直连

- 建议：提供统一 workspace alias（如 @creonow/shared/*）

- 优先级：P2

---

## 🔵 低危问题（Low）

### A5-L-001 · 目录命名风格漂移

- 文件：AppShell.tsx L9, L24

- 描述：同级 features 目录混用 camelCase、kebab-case 与全小写

- 建议：统一目录命名约定并启用 lint 约束

- 优先级：P3

### A5-L-002 · 源码 BOM 头不一致

- 文件：AiPanel.tsx L1（命中 9 个源码文件）

- 描述：检测到 UTF-8 BOM，可能引发首字符解析问题

- 建议：统一 UTF-8 无 BOM 并在格式化器中强制

- 优先级：P3

---

## 📈 模式统计

| 模式 | 命中数 |
| --- | --- |
| --- | ---: |
| 循环依赖 | 2 |
| God Object / 单体回归 | 2 |
| 模块边界 / 分层耦合 | 2 |
| 风格漂移 / 命名一致性 | 2 |

> 📊

扫描文件：661 ｜ 问题总数：9 ｜ Critical 0 · High 3 · Medium 4 · Low 2

## 🟠 高危问题（High）

### A6-H-001 · 窗口加载 Promise 未兜底

- 文件：index.ts L112-L115

- 类型：未处理 rejection

- 描述：BrowserWindow.loadURL/loadFile 返回 Promise 被 void 丢弃

- 风险：加载失败时错误链断裂，可能出现启动黑屏且无可观测日志

- 建议：await 或 .catch(...) 记录错误并触发降级

- 优先级：P0

### A6-H-002 · app.whenReady 初始化链无统一 catch

- 文件：index.ts L339-L378

- 类型：顶层 Promise 链未兜底

- 描述：app.whenReady().then(...) 无 .catch，初始化任一点抛错会成为未处理 rejection

- 风险：主进程启动失败时无统一错误处理，进入不可观测异常状态

- 建议：链尾增加 .catch 并执行 app.quit() 或改 async/try-catch

- 优先级：P1

### A6-H-003 · KG Panel 异步写入缺少结果校验

- 文件：KnowledgeGraphPanel.tsx L219-L367

- 类型：错误传播链不完整 + 并发一致性

- 描述：多处异步调用未检查 ServiceResult.ok；失败后仍更新本地状态。Promise.all 批量更新无补偿

- 风险：后端失败但前端显示成功，UI 与数据源分叉

- 建议：统一检查返回值并中断后续动作；批量更新改 allSettled + 失败汇总

- 优先级：P0

---

## 🟡 中危问题（Medium）

### A6-M-001 · MemoryPanel Promise.all 异常路径未包裹

- 文件：MemoryPanel.tsx L80-L105

- 描述：effect 中 void loadPanelData()，若 invoke 抛异常可能出现未处理 rejection

- 建议：在 loadPanelData 外层加 try/catch 并统一 setStatus("error")

- 优先级：P2

### A6-M-002 · 项目切换竞态覆盖旧数据

- 文件：kgStore.ts L216-L235

- 描述：bootstrapForProject 异步返回后直接 set，未校验当前 projectId 是否仍匹配

- 建议：引入 requestId/epoch，落库前校验 get().projectId === projectId

- 优先级：P2

### A6-M-003 · SearchStore 查询竞态

- 文件：searchStore.ts L75-L113

- 描述：请求发起和结果提交间未校验 query 是否仍最新

- 建议：增加请求戳/AbortController，并在提交前比对 query

- 优先级：P2

### A6-M-004 · SkillScheduler completion catch 吞错

- 文件：skillScheduler.ts L272-L278

- 描述：completion 的 catch 丢弃 error，仅标记 failed

- 建议：catch 中记录错误详情并透传任务上下文

- 优先级：P2

---

## 🔵 低危问题（Low）

### A6-L-001 · Preload IPC listener 生命周期疑似泄露

- 文件：aiStreamBridge.ts L128-L150

- 描述：ipcRenderer.on(...) 注册后未见 off/removeListener 释放路径

- 建议：返回 dispose() 并在生命周期结束时移除监听器

- 优先级：P3

### A6-L-002 · 关闭流程定时器未清理

- 文件：AddRelationshipPopover.tsx L102, L126

- 描述：setTimeout(handleReset, 150) 未统一清理，组件提前卸载可能执行过期回调

- 建议：保存 timer id 并在 cleanup 中 clearTimeout

- 优先级：P3

---

## 📈 模式统计

| 模式 | 命中数 |
| --- | --- |
| --- | ---: |
| 异步操作完整性 | 3 |
| 错误传播链完整性 | 3 |
| 并发安全 | 3 |
| 资源泄露 | 1 |
| 内存泄露模式 | 1 |

> 📊

扫描文件：664 ｜ 问题总数：1,631（规则命中，含同文件多项） ｜ Critical 223 · High 328 · Medium 1,076 · Low 4

> 💡

A7 包含规则命中型统计（同文件可多命中），因此总量显著高于其余代理。下方仅列明 19 项代表性问题，其余为模式统计。

## 🔴 严重问题（Critical）— 超大函数/组件拆分

### A7-C-001 · DocumentService 超长函数（1,743 行）

- 文件：documentService.ts L863

- 复杂度估算：236

- 建议：按快照、分支、合并、容量治理拆分子服务

- 优先级：P0

### A7-C-002 · AiService 超长函数（1,460 行）

- 文件：aiService.ts L981

- 复杂度估算：234

- 建议：拆为 provider 路由、重试/限流、会话预算、技能执行四层

- 优先级：P0

### A7-C-003 · KGService 超长函数（1,378 行）

- 文件：kgService.ts L784

- 复杂度估算：269

- 建议：按 query/write/validation/context-injection 分模块下沉

- 优先级：P0

### A7-C-004 · Context IPC 注册函数过重（953 行）

- 文件：context.ts L138

- 复杂度估算：102

- 建议：IPC 层仅保留校验与路由，业务逻辑迁移 service

- 优先级：P0

### A7-C-005 · FileTreePanel 上帝组件（864 行）

- 文件：FileTreePanel.tsx L280

- 复杂度估算：114

- 建议：拆分节点渲染、拖拽、菜单、筛选状态子组件/Hook

- 优先级：P0

### A7-C-006 · AiPanel 上帝组件（1,254 行）

- 文件：AiPanel.tsx L343

- 复杂度估算：172

- 建议：拆分对话流、候选管理、错误态、技能面板容器

- 优先级：P0

---

## 🟠 高危问题（High）— 硬编码与依赖图

### A7-H-007 · 深层相对路径依赖（main 侧）

- 文件：projectService.ts L10（6 层相对路径）

- 建议：引入 tsconfig paths 别名（如 @shared/*）

- 优先级：P1

### A7-H-008 · 深层相对路径依赖（renderer 侧）

- 文件：aiStore.ts L10（5 层相对路径）

- 建议：renderer/preload/main 统一切换 alias

- 优先级：P1

### A7-H-009 · IPC 载荷上限硬编码

- 文件：ipcGateway.ts L10（10 * 1024 * 1024）

- 建议：迁移到集中配置并支持环境覆盖

- 优先级：P1

### A7-H-010 · AI 关键阈值散落硬编码

- 文件：aiService.ts L132-L139（超时/重试/token 预算）

- 建议：抽出 runtime-governance-config 单一配置源

- 优先级：P1

### A7-H-011 · KG 查询超时硬编码

- 文件：kgService.ts L49（2_000ms）

- 建议：按项目规模/环境分层配置

- 优先级：P1

### A7-H-012 · RAG maxTokens 写死

- 文件：rag.ts L37（1500）

- 建议：统一接入 token budget 配置中心

- 优先级：P1

---

## 🟡 中危问题（Medium）

### A7-M-013 · 主入口 import 扇入偏高

- 文件：index.ts（import 30，registerIpcHandlers 209 行）

- 建议：按域拆分子装配器

- 优先级：P2

### A7-M-014 · AppShell import 扇入偏高

- 文件：AppShell.tsx（import 31）

- 建议：引入 feature facade 减少直接依赖

- 优先级：P2

### A7-M-015 · Integration Test 边界穿透 renderer store

- 文件：project-switch.autosave.test.ts L3

- 建议：通过公共 test harness/公开 API 注入依赖

- 优先级：P2

### A7-M-016 · Integration Test 边界穿透 main service

- 文件：ai-skill-context-integration.test.ts L6-L8

- 建议：优先走 IPC 契约层或 service factory 抽象

- 优先级：P2

---

## 🔵 低危问题（Low）— TODO 未闭环

### A7-L-017 · 账户流程 TODO 未闭环

- 文件：SettingsDialog.tsx L198, L201

- 优先级：P3

### A7-L-018 · Version 词数变化 TODO 未闭环

- 文件：VersionHistoryContainer.tsx L160

- 优先级：P3

### A7-L-019 · Windows 键盘事件 TODO 未闭环

- 文件：command-palette.spec.ts L272

- 优先级：P3

---

## 📈 模式统计（全库）

| 指标 | 数量 |
| --- | --- |
| --- | ---: |
| 超长文件（>400 行） | 108 |
| 超长函数（>60 行） | 571 |
| 高认知复杂度（≥25） | 127 |
| 深层相对路径 import | 818 |
| 高 import 扇入文件（>25） | 3 |
| TODO/FIXME/HACK | 4 |
| 疑似硬编码阈值/预算常量 | 85 |

---

## 📁 修复计划

> 🎯

按风险和治理收益排序，优先执行 P0/P1。预估工作量：S < 0.5d · M ≈ 1d · L ≈ 2-3d · XL ≈ 3-5d

## P0 · 立即修复（12 项）

| # | 编号 | 修复项 | 工作量 |
| --- | --- | --- | --- |
| 1 | A3-C-001 | 修复空内容请求伪造 queued 成功响应 | M |
| 2 | A5-C-001 | 打断 Context 装配链路循环依赖 | L |
| 3 | A4-H-002 | IPC 增加调用方身份与来源 ACL 鉴权 | L |
| 4 | A4-H-001 | 启用 Electron sandbox 安全默认 | M |
| 5 | A6-H-003 | KG 面板异步写入改为结果校验 + allSettled | M |
| 6 | A6-H-001 | 窗口加载 Promise 统一兜底 | S |
| 7 | A7-C-001 | 拆分 createDocumentService（1743 行） | XL |
| 8 | A7-C-002 | 拆分 createAiService（1460 行） | XL |
| 9 | A7-C-003 | 拆分 createKnowledgeGraphService（1378 行） | XL |
| 10 | A7-C-004 | 拆分 registerContextIpcHandlers（953 行） | XL |
| 11 | A7-C-005 | 拆分 FileTreePanel（864 行） | L |
| 12 | A7-C-006 | 拆分 AiPanel（1254 行） | XL |

---

## P1 · 高优先级（20 项）

| # | 编号 | 修复项 | 工作量 |
| --- | --- | --- | --- |
| 1 | A2-H-001 | context 组装异常可观测化 | M |
| 2 | A2-H-002 | metadata 解析失败禁止清空回写 | M |
| 3 | A2-H-003 | KG Panel 解析失败 fail-fast + 诊断 | M |
| 4 | A2-H-004 | skill 目录读取失败结构化错误返回 | S |
| 5 | A3-H-001 | skillScheduler 聚合 response/completion | M |
| 6 | A3-H-002 | KG metrics 拆分 succeeded/failed/completed | S |
| 7 | A5-H-001 | RightPanel/AiPanel 循环依赖拆解 | M |
| 8 | A5-H-002 | DocumentService 按职责拆分（架构层） | XL |
| 9 | A5-H-003 | AIService 按职责拆分（架构层） | XL |
| 10 | A6-H-002 | app.whenReady() 顶层初始化链统一 catch | S |
| 11 | A7-H-007 | 共享契约导入改 alias（main） | M |
| 12 | A7-H-008 | 共享契约导入改 alias（renderer） | M |
| 13 | A7-H-009 | IPC payload 上限集中配置 | S |
| 14 | A7-H-010 | AI 超时/重试/token 预算集中配置 | M |
| 15 | A7-H-011 | KG 查询超时配置化 | S |
| 16 | A7-H-012 | RAG maxTokens 配置化 | S |
| 17 | A1-H-001 | Settings 账户僵尸入口下线/禁用 | S |
| 18 | A1-H-002 | VersionListItem 类型定义收敛 | S |
| 19 | A1-H-003 | judge:model:ensure 共享状态机 | M |
| 20 | A1-H-004 | Version wordChange 真实计算或下线 | M |

---

## P2 · 中优先级（21 项）

| # | 编号 | 修复项 | 工作量 |
| --- | --- | --- | --- |
| 1 | A1-M-001 | 移除生产组件 demo 参数 | S |
| 2 | A1-M-002 | 移除重试成功开关 | S |
| 3 | A1-M-003 | 压缩 barrel 注释 | S |
| 4 | A1-M-004 | 去除一行包装函数 | S |
| 5 | A2-M-001 | Context fetcher warning 增加错误 ID | S |
| 6 | A2-M-002 | executionId/runId 双字段治理 | M |
| 7 | A2-M-003 | id/skillId 双字段治理 | M |
| 8 | A2-M-004 | 删除 ping handler 不可达 catch | S |
| 9 | A3-M-001 | 固定 sleep 改条件等待 | M |
| 10 | A3-M-002 | story 测试增加行为断言 | S |
| 11 | A4-M-001 | debug IPC 通道生产禁用 | S |
| 12 | A5-M-001 | service 领域错误与 IPC 解耦 | M |
| 13 | A5-M-002 | 全库深层相对路径收敛 alias | L |
| 14 | A6-M-001 | MemoryPanel 异常处理闭环 | S |
| 15 | A6-M-002 | kgStore 引入 requestId 防竞态 | M |
| 16 | A6-M-003 | searchStore 引入 abort 防竞态 | M |
| 17 | A6-M-004 | skillScheduler 完整错误传播 | S |
| 18 | A7-M-013 | main 入口 import 扇入治理 | M |
| 19 | A7-M-014 | AppShell 扇入治理 | M |
| 20 | A7-M-015 | integration test 去 renderer 耦合 | M |
| 21 | A7-M-016 | integration test 去 main 耦合 | M |

---

## P3 · Backlog（14 项）

| # | 编号 | 修复项 | 工作量 |
| --- | --- | --- | --- |
| 1 | A1-L-001 | 清理未使用占位参数 | S |
| 2 | A1-L-002 | 下线 deprecated 双轨样式 | S |
| 3 | A2-L-001 | AppShell 默认值降级增加诊断 | S |
| 4 | A2-L-002 | contextRules 非法输入语义分离 | S |
| 5 | A3-L-001 | 测试断言升级精确断言 | S |
| 6 | A4-L-001 | DocumentService 错误风格统一 | M |
| 7 | A4-L-002 | 技术栈文档与依赖清单同步 | S |
| 8 | A5-L-001 | features 命名规范统一 + lint | M |
| 9 | A5-L-002 | BOM 清理强制 UTF-8 无 BOM | S |
| 10 | A6-L-001 | preload IPC listener 生命周期释放 | S |
| 11 | A6-L-002 | popover 定时器清理 | S |
| 12 | A7-L-017 | Settings 账户 TODO 闭环 | S |
| 13 | A7-L-018 | Version word diff TODO 闭环 | S |
| 14 | A7-L-019 | Windows 键盘事件 TODO 闭环 | M |

---

## 备注

- A7 的 1,631 项命中包含模式统计型问题；若进入治理实施，建议先从 P0/P1 对应的架构拆分与配置集中化开始，随后批量清理 P2/P3

- P0 中 6 项超大函数拆分（A7-C-001 ~ A7-C-006）工作量最大，建议拆分为独立 Spec → Change 流程逐个击破

---

## 🚀 接下来怎么做？

### 第一步：本周立即动手（2-3 天）

1. 先修 6 个 S/M 级 P0 快赢项（A3-C-001、A4-H-001、A6-H-001、A6-H-003 等），这些改动小但风险消除效果明显

1. IPC 鉴权设计（A4-H-002）：先出方案草稿，不急写代码

1. 循环依赖打断（A5-C-001）：抽 types 模块，改动面可控

### 第二步：下周启动架构拆分（持续 2-3 周）

1. 为 6 个超大函数各写一份拆分 Spec（A7-C-001 ~ A7-C-006），按你的 Spec → Change 流程逐个落地

1. 建议拆分顺序：DocumentService → AiService → KGService → ContextIPC → AiPanel → FileTreePanel

1. 每完成一个拆分，顺手做对应的 P1 治理（如 alias 收敛、配置集中化）

### 第三步：P1 批量清理（1-2 周）

1. 集中治理 fallback/降级链（A2 全部 High）

1. 统一配置源（A7-H-009 ~ A7-H-012）

1. 收敛双字段兼容（A2-M-002、A2-M-003）

### 第四步：P2/P3 债务治理（按节奏持续）

1. 作为日常开发的附带任务，每个 PR 顺手修 1-2 个 P2/P3 项

1. 不建议单独开 Sprint 清 P2/P3，融入日常节奏更可持续

> 💡

核心原则：先堵安全和语义漏洞（P0 快赢）→ 再拆架构降复杂度（P0 拆分）→ 最后批量治理债务（P1-P3）。不要试图一口气全修，按批次推进，每批有明确的关门条件。

---

## 一、优先级裁定：CN-Code-Audit 先行

结论：CN-Code-Audit 必须先做，但不是串行做完再做 roadmap，而是交织执行。

理由基于三个不可回避的事实：

### 1. 地基有裂缝，不能继续盖楼

audit-roadmap Phase 2-6 要在现有模块上叠加新功能。但这些模块现在的状态是：

| audit-roadmap 要做的事 | 依赖的模块当前的病 |
| --- | --- |
| Phase 2: KG 加 aiContextLevel、别名匹配、context fetcher | KG Panel 异步写入不校验结果 (A6-H-003)、metadata 解析失败清空回写 (A2-H-002/003)、Context 装配循环依赖 (A5-C-001) |
| Phase 3: 写作技能 + Slash Command + Inline Diff | skillScheduler 吞错 (A3-H-001)、skillLoader 静默返回空 (A2-H-004)、AiPanel 1254 行 God Component (A7-C-006) |
| Phase 2-6 所有功能经过 IPC | IPC 无调用方鉴权 (A4-H-002)、sandbox 关闭 (A4-H-001) |
| Phase 2-6 所有功能涉及 aiService/docService/kgService | 三个 God Object 分别 1743/1460/1378 行，任何新功能都会加剧耦合 |

在病人身上做手术，风险指数级增长。

### 2. 结构性问题扼杀并行开发效率

- 3 个 God Object 意味着任何两个并行任务大概率改同一个文件，Git 冲突成为常态

- 818 处深层相对路径 import 意味着任何目录调整都是灾难

- 循环依赖 意味着新功能的架构设计空间被压缩——你想加一个 fetcher，发现它的依赖图是个环

### 3. 安全问题有硬截止线

sandbox: false + IPC 无鉴权 = Electron 应用的基本安全底线缺失。这不是"以后再说"的问题，是"任何面向用户的版本发布之前必须修"的问题。audit-roadmap 做的功能如果要上线，这些安全问题无论如何绕不过去。

---

## 二、执行策略：四阶段交织模型

核心思路：不做"先还完所有债再做功能"的串行模式（那要 100+ 天），而是用 Extract-Then-Extend 策略让债务修复和功能建设共享同一次代码变更。

### 关键原则

1. Same-File Batching：当因任何原因触碰一个文件时，同时修复该文件所有已知问题。杜绝"改两次"。

1. Extract-Then-Extend：不在 God Object 上加功能。先提取相关子服务，再在干净的提取物上加功能。

1. Automated Ratchet：每修一类问题，立即加 lint/CI 规则防止回退。修过的不允许再犯。

1. 依赖驱动排序：每个 Sprint 的产出必须恰好解锁下一个 Sprint 的工作。

---

### Sprint 0：紧急止血（2-3d）

修复数据完整性、安全、崩溃路径问题。全部是手术刀级小改。

| # | 编号 | 修复项 | 量级 | 理由 |
| --- | --- | --- | --- | --- |
| 1 | A3-C-001 | 空内容伪造 queued 响应 → 改 skipped / ok:false | S | 数据完整性谎言：调用方拿到不可追踪的 taskId |
| 2 | A6-H-001 | 窗口加载 Promise 兜底 | S | 启动黑屏无日志 |
| 3 | A6-H-002 | app.whenReady() 链尾加 .catch | S | 主进程启动失败进入僵尸态 |
| 4 | A2-H-002 | metadata 解析失败禁止清空回写 | M | 隐性数据丢失 |
| 5 | A2-H-003 | KG Panel metadata 解析 fail-fast | M | 同上，同模块 |
| 6 | A2-H-004 | skillLoader 目录读取返回结构化错误 | S | "没有技能"的幽灵故障 |
| 7 | A4-H-001 | 启用 sandbox: true + 回归 | M | 安全底线 |
| 8 | A6-H-003 | KG Panel 异步写入 → 校验结果 + allSettled | M | 前后端状态分叉 |

产出：消除所有可导致数据丢失/安全漏洞/启动失败的即时风险。

---

### Sprint 1：架构解锁（5-7d）

打碎结构性瓶颈，为功能开发创造洁净空间。

| # | 编号 | 修复项 | 量级 | 解锁 |
| --- | --- | --- | --- | --- |
| 1 | A5-C-001 | 打断 Context 装配循环依赖 | L | 解锁 Phase 2 全部 context fetcher 工作 |
| 2 | A4-H-002 | IPC 调用方身份 ACL | L | 解锁任何面向用户发布 |
| 3 | A7-H-007/008 | tsconfig paths alias（@shared/*） | M | 一次性消除 818 处深层 import 的根因，后续全量替换可脚本化 |
| 4 | A5-H-001 | RightPanel / AiPanel 循环依赖拆解 | M | 解锁 Phase 3 编辑器 UI 工作 |
| 5 | A7-H-009~012 | 运行时配置中心（timeout/retry/token budget/payload） | M | 解锁 Phase 2 token 预算对齐 |
| 6 | — | 三大 God Object 提取接口设计（仅接口，不实现） | M | 为 Sprint 2 的 Extract-Then-Extend 提供蓝图 |

关于 God Object 的策略调整：

99-修复优先级将 A7-C-001~006（6 个 God Object 拆分）全部列为 P0，总工作量 5×XL + 1×L ≈ 20-25d。如果全部前置做完再做功能，timeline 不可接受。

我的判断：它们是高优先架构债务，不是"立即修复否则出事"的 P0。正确做法是按需渐进提取——

> 当 Phase 2 需要修改 kgService 时，先从 kgService 提取 kgQueryService（Phase 2 需要的那部分），然后在 kgQueryService 上做 Phase 2 功能。kgService 的其余部分暂时保持原样，但它变薄了。每轮迭代，God Object 都在缩小。

这比"一次性拆完"更安全（改动可控、可回归）、更高效（提取和功能共享同一个 PR）。

---

### Sprint 2：交织推进（20-25d）

两条轨道交替推进，按模块对齐，最大化 Same-File Batching。

### 轨道 A：功能建设（audit-roadmap Phase 2 + 3）

| 周 | 功能 | 前置提取 | 同步修的债务 |
| --- | --- | --- | --- |
| W1 | Phase 2: C8 kg-context-level, C9 kg-aliases | 从 kgService 提取 kgEntityWriter | A1-H-002（类型收敛）, A3-H-002（metrics 拆分） |
| W2 | Phase 2: C10 entity-matcher, C11 fetcher-always | 从 layerAssemblyService 提取 fetcher 接口 | A2-H-001（context 组装可观测化） |
| W3 | Phase 2: C12 fetcher-detected, C13 memory-injection | — | A2-M-001（fetcher warning 增强） |
| W4 | Phase 3: C14-C15 writing/conversation skills | 从 skillScheduler 提取 skillRuntime | A3-H-001（scheduler 错误上下文）, A1-H-003（judge 状态机收敛） |
| W5 | Phase 3: C16-C17 write-button + bubble-ai | 从 AiPanel 提取 AiConversationFlow | A1-M-001/002（demo 参数清理） |
| W6 | Phase 3: C18-C21 slash + inline-diff + shortcuts | — | A2-M-002/003（双字段兼容治理） |

### 轨道 B：剩余债务（CN-Code P1/P2 非交叉项）

在轨道 A 的间隙（等 spec 确认、等 PR review 时）处理：

| 批次 | 内容 | 量级 |
| --- | --- | --- |
| B1 | A2-M-004（删 ping 不可达 catch）、A1-M-003（barrel 注释）、A1-M-004（去包装函数） | 3×S = 0.5d |
| B2 | A3-M-001（setTimeout→条件等待，批量 19 处）、A3-M-002（story 行为断言） | M+S = 1.5d |
| B3 | A6-M-001~004（MemoryPanel/kgStore/searchStore/scheduler 健壮性） | 4×M = 2d |
| B4 | A7-M-013~016（import 扇入治理、test 边界穿透） | 4×M = 2d |
| B5 | 深层 import 全量替换（Sprint 1 已设好 alias，此处脚本化批量替换） | L = 1d |

---

### Sprint 3：收尾 + 高级功能（15-20d）

| 内容 | 范围 |
| --- | --- |
| audit-roadmap Phase 4 | 叙事记忆 + 摘要（5 changes, 4d）— 此时 kgService 已大幅瘦身 |
| audit-roadmap Phase 5 | 语义检索（4 changes, 4d）— 独立模块，依赖已就绪 |
| audit-roadmap Phase 6 | 体验完善（6 changes, 5d）— 独立模块 |
| CN-Code P3 Backlog | 14 项，大部分 S/M，可穿插 |
| A7 模式级治理 | 108 个超长文件、571 个超长函数 → lint 规则 + CI ratchet，不人工逐个修 |

---

## 三、跨审计依赖图

```
Sprint 0 (止血)
  ├─ A3-C-001 ──────────────────────────────────┐
  ├─ A6-H-001/002 ──────────────────────────────┤
  ├─ A2-H-002/003 ──────────────────────────┐   │
  ├─ A2-H-004 ─────────────────────────┐    │   │
  ├─ A4-H-001 ─────────────────────┐   │    │   │
  └─ A6-H-003 ─────────────────┐   │   │    │   │
                                │   │   │    │   │
Sprint 1 (架构解锁)            │   │   │    │   │
  ├─ A5-C-001 ──────────┐      │   │   │    │   │
  ├─ A4-H-002 ─────┐    │      │   │   │    │   │
  ├─ Path alias ─┐  │    │      │   │   │    │   │
  ├─ Config center│  │    │      │   │   │    │   │
  └─ God Object  │  │    │      │   │   │    │   │
    interfaces   │  │    │      │   │   │    │   │
                 │  │    │      │   │   │    │   │
Sprint 2 (交织)  ▼  ▼    ▼      ▼   ▼   ▼    ▼   ▼
  ├─ Phase 2 ◄───── Context解锁 + KG修复 + metadata修复
  ├─ Phase 3 ◄───── AiPanel拆解 + Skill修复
  ├─ P1 debt  ◄──── 按模块附着
  └─ P2 debt  ◄──── Same-file batching

Sprint 3 (收尾)
  ├─ Phase 4-6 ◄──── God Objects 已渐进瘦身
  └─ P3 + lint ratchet
```

---

## 四、A7 的 1631 项问题怎么处理

A7 的数字看起来吓人，但它的本质是模式统计，不是 1631 个独立 bug：

| 模式 | 命中数 | 治理策略 |
| --- | --- | --- |
| 超长函数 >60 行 | 571 | 不逐个修。Sprint 2 的 Extract-Then-Extend 自然消解最严重的。剩余的加 ESLint max-lines-per-function warning，设 ratchet（新增不允许超 60 行） |
| 深层相对路径 | 818 | Sprint 1 设好 alias 后，一次脚本替换 |
| 高认知复杂度 ≥25 | 127 | Top 20 在 God Object 拆分中自然消解。其余加 complexity lint warning + ratchet |
| 硬编码阈值 | 85 | Sprint 1 的配置中心解决核心路径上的。其余按触碰时修复 |
| 超长文件 >400 行 | 108 | God Object 拆分 + Extract-Then-Extend 渐进消解 |

关键工具：设置 CI ratchet——记录当前违规数，任何 PR 不允许增加违规数，只允许减少或持平。这样每次提交都在改善，无需专门 Sprint。

---

## 五、时间线对比

| 方案 | 总工期 | 风险 |
| --- | --- | --- |
| A: 先做完 CN-Code 全部，再做 roadmap | ~90-110d | 过长无功能交付，团队士气问题 |
| B: 忽略 CN-Code，继续做 roadmap | ~32.5d | 在腐烂的地基上建楼，返工成本不可预测 |
| C: 四阶段交织（本方案） | ~45-55d | 每个 Sprint 都有可见产出（修复+功能），风险被分段隔离 |

方案 C 比 A+B 串行少 40-50% 工时，核心原因是 Same-File Batching 和 Extract-Then-Extend 消除了双重触碰。

---

## 六、立即可执行的下一步

1. Sprint 0 的 8 个修复项可以现在开始，每个都是 S-M 量级的外科手术，不涉及架构变更

1. 并行启动 Sprint 1 的 God Object 接口设计——只出接口定义文档，不改代码，为后续提取建立蓝图

1. 为 A7 的模式级问题设置 ESLint ratchet CI job——让代码库自动止损

```
# AI Native 审计路线图：36 Changes × 6 Phases

> 基于 `docs/audit/` 七份审计报告，拆解为可执行的 OpenSpec Change 序列。
> 创建时间：2026-02-12 | 更新：2026-02-13（P1 完成，P2 就绪）
> 总实现量：~29d（不含 spec 编写 ~11d）

## 拆分原则

每个 change 必须满足：
1. **≤1d 实现**（含测试）
2. **只改一个模块的 spec**
3. **可独立验证**（有明确的 `pnpm vitest run` 命令）
4. **Scenario 精确到数据结构和边界条件**

## 架构原则

1. **本地文件系统 > 大上下文窗口** — CN 是 Electron 桌面应用，直接访问项目文件夹。不追求大窗口，而是精确注入 + 持久缓存 + 增量索引。
2. **Codex 引用检测 > 向量 RAG** — 写作上下文 80% 是结构化知识，字符串匹配 + KG 查询优先于向量 embedding。
3. **用户主动触发 > AI 自动弹出** — 续写按钮而非 Ghost Text（ACM CHI 论文论证）。
4. **流动角色 > 固定助手** — ghostwriter/muse/editor/actor/painter 按任务切换。
5. **叙事状态 > 通用偏好** — 记忆是角色状态、伏笔揭示、关系变化，不是通用偏好。

---

## Phase 总览

| Phase | 主题 | Changes | 实现量 | Spec | 累计 |
|-------|------|---------|--------|------|------|
| 1 | AI 可用 | 7 | 5.5d | 2d | 7.5d |
| 2 | Codex 上下文 | 6 | 4.5d | 2d | 14d |
| 3 | 写作技能 + 编辑器 | 8 | 6d | 2.5d | 22.5d |
| 4 | 叙事记忆 + 摘要 | 5 | 4d | 1.5d | 28d |
| 5 | 语义检索 | 4 | 4d | 1.5d | 33.5d |
| 6 | 体验完善 | 6 | 5d | 1.5d | 40d |
| **合计** | | **36** | **29d** | **11d** | **~40d** |

---

## Phase 1 — AI 可用（7 changes, 5.5d）✅ 已完成

目标：AI 功能从"不可用"→"基本可用"。用户可在 AI 面板多轮对话，AI 有写作身份。

| # | Change ID | Module | Scope | Est | 状态 |
|---|-----------|--------|-------|-----|------|
| 1 | `p1-identity-template` | ai-service | 身份提示词模板（5 个 XML 区块） | 0.5d | ✅ #468 |
| 2 | `p1-assemble-prompt` | ai-service | combineSystemText → assembleSystemPrompt 分层组装 | 1d | ✅ #477 |
| 3 | `p1-chat-skill` | skill-system | chat 技能 SKILL.md + 基础意图路由 | 0.5d | ✅ #469 |
| 4 | `p1-aistore-messages` | ai-service | aiStore 增加 messages 数组 + add/clear | 0.5d | ✅ #483 |
| 5 | `p1-multiturn-assembly` | ai-service | LLM 多轮消息组装 + token 裁剪 | 1d | ✅ #486 |
| 6 | `p1-apikey-storage` | workbench | API Key safeStorage + IPC 通道 | 1d | ✅ #470 |
| 7 | `p1-ai-settings-ui` | workbench | AI 设置面板 UI（Key/模型/测试/降级） | 1d | ✅ #476 |

**依赖**：C2→C1, C5→C4→C2, C3 独立, C7→C6, C6 独立

**详细 Scenario 见** `docs/plans/phase1-agent-instruction.md`

---

## Phase 2 — Codex 上下文（6 changes, 4.5d）

目标：KG 实体自动注入 AI 上下文——写作场景最关键的上下文来源。

| # | Change ID | Module | Scope | Est |
|---|-----------|--------|-------|-----|
| 8 | `p2-kg-context-level` | knowledge-graph | entity 增加 `aiContextLevel` 字段 + migration + 编辑 UI | 0.5d |
| 9 | `p2-kg-aliases` | knowledge-graph | entity 增加 `aliases: string[]` 字段 + migration + 编辑 UI | 0.5d |
| 10 | `p2-entity-matcher` | knowledge-graph | 实体名/别名匹配引擎（替换 mock recognizer），100 实体×1000 字 <10ms | 1d |
| 11 | `p2-fetcher-always` | context-engine | rules fetcher: 查询 `aiContextLevel="always"` 实体，格式化注入 | 0.5d |
| 12 | `p2-fetcher-detected` | context-engine | retrieved fetcher: 调用匹配引擎，注入 `when_detected` 实体 | 1d |
| 13 | `p2-memory-injection` | memory-system | Memory previewInjection → AI prompt + KG rules → Context | 1d |

**依赖**：C10→C8+C9, C12→C10+C11, C11→C8, C13→Phase1.C2

**详细 Scenario 见** `docs/plans/phase2-agent-instruction.md`

**关键 Scenario 示例**：

C10 `p2-entity-matcher`:
```
GIVEN KG 有实体 {name: "林默", aliases: ["小默"], aiContextLevel: "when_detected"}
AND KG 有实体 {name: "长安城", aliases: ["长安"]}
AND 输入文本 = "小默推开门，走进长安城"
WHEN 调用 matchEntities(text, entities)
THEN 返回 [{entityId: "林默的ID"}, {entityId: "长安城的ID"}]
AND 执行时间 < 10ms
```

C12 `p2-fetcher-detected`:
```
GIVEN 实体 "林默" aiContextLevel="when_detected"
AND 实体 "魔法系统" aiContextLevel="always"
AND 实体 "大纲笔记" aiContextLevel="never"
AND 光标前文本包含 "林默"
WHEN Context Engine 组装 retrieved 层
THEN 包含林默档案（因为 detected）
AND 不包含魔法系统（由 rules 层处理）
AND 不包含大纲笔记（never）
```

---

## Phase 3 — 写作技能 + 编辑器（8 changes, 6d）

目标：核心写作交互——续写按钮、Bubble AI、Slash Command、Inline Diff。

| # | Change ID | Module | Scope | Est |
|---|-----------|--------|-------|-----|
| 14 | `p3-writing-skills` | skill-system | 5 个写作技能 SKILL.md（write/expand/describe/shrink/dialogue） | 0.5d |
| 15 | `p3-conversation-skills` | skill-system | 3 个对话技能 SKILL.md（brainstorm/roleplay/critique） | 0.5d |
| 16 | `p3-write-button` | editor | 续写悬浮按钮组 UI + 技能调用 | 1d |
| 17 | `p3-bubble-ai` | editor | Bubble Menu AI 按钮（润色/改写/描写/对白） | 1d |
| 18 | `p3-slash-framework` | editor | TipTap Slash Command 扩展框架 + 命令面板 UI | 1d |
| 19 | `p3-slash-commands` | editor | 写作命令集注册（/续写 /描写 /对白 /角色 /大纲 /搜索） | 0.5d |
| 20 | `p3-inline-diff` | editor | Inline diff decoration + 接受/拒绝按钮 | 1d |
| 21 | `p3-shortcuts` | editor | 快捷键系统（Ctrl+Enter 续写、Ctrl+Shift+R 润色等） | 0.5d |

**依赖**：C16/C17→C14, C19→C18, C21→C16+C17, C15/C20 独立

---

## Phase 4 — 叙事记忆 + 摘要（5 changes, 4d）

目标：长篇小说支撑——角色状态跟踪、章节摘要、trace 持久化。

| # | Change ID | Module | Scope | Est |
|---|-----------|--------|-------|-----|
| 22 | `p4-kg-last-seen` | knowledge-graph | entity 增加 `last_seen_state` 字段 + migration + UI | 0.5d |
| 23 | `p4-state-extraction` | knowledge-graph | 章节完成时 LLM 提取角色状态变化，更新 KG | 1d |
| 24 | `p4-synopsis-skill` | skill-system | synopsis 技能 SKILL.md（生成 200-300 字章节摘要） | 0.5d |
| 25 | `p4-synopsis-injection` | context-engine | 摘要持久存储 + 续写时注入前几章摘要 | 1d |
| 26 | `p4-trace-persistence` | memory-system | generation_traces + trace_feedback SQLite 持久化 | 1d |

**依赖**：C23→C22, C25→C24, C26 独立

---

## Phase 5 — 语义检索（4 changes, 4d）

目标：Codex 之外的补充检索——非结构化文本语义搜索。

| # | Change ID | Module | Scope | Est |
|---|-----------|--------|-------|-----|
| 27 | `p5-onnx-runtime` | search-and-retrieval | ONNX Runtime 集成 + bge-small-zh 模型加载推理 | 1d |
| 28 | `p5-embedding-service` | search-and-retrieval | embedding 服务三级降级：ONNX → API → hash | 1d |
| 29 | `p5-hybrid-rag` | search-and-retrieval | Semantic + FTS hybrid ranking (RRF) | 1d |
| 30 | `p5-entity-completion` | editor | KG 实体名 ghost text 补全（纯本地匹配） | 1d |

**依赖**：C28→C27, C29→C28, C30→Phase2.C8

---

## Phase 6 — 体验完善（6 changes, 5d）

目标：产品打磨——i18n、搜索、导出、禅模式、模板。

| # | Change ID | Module | Scope | Est |
|---|-----------|--------|-------|-----|
| 31 | `p6-i18n-setup` | workbench | react-i18next 集成 + locale 文件结构 | 0.5d |
| 32 | `p6-i18n-extract` | workbench | 硬编码中文 → locale keys 抽取 | 1d |
| 33 | `p6-search-panel` | workbench | 搜索面板 UI（全文搜索 + 结果 + 跳转） | 1d |
| 34 | `p6-export` | document-management | Markdown/TXT/DOCX 导出 | 1d |
| 35 | `p6-zen-mode` | editor | 禅模式（全屏编辑器，隐藏侧边栏） | 0.5d |
| 36 | `p6-project-templates` | project-management | 项目模板系统（小说/短篇/剧本/自定义） | 1d |

**依赖**：C32→C31, 其余独立

---

## 依赖关系图

```
Phase 1 (AI 可用, 5.5d)
  C1 identity-template ─┐
  C2 assemble-prompt ───┤ (C2←C1)
  C3 chat-skill ────────┤ (独立)
  C4 aistore-messages ──┤ (C4←C2)
  C5 multiturn-assembly ┤ (C5←C4)
  C6 apikey-storage ────┤ (独立)
  C7 ai-settings-ui ────┘ (C7←C6)

Phase 2 (Codex, 4.5d) ← Phase 1
  C8  kg-context-level ──┐
  C9  kg-aliases ─────────┤ (独立)
  C10 entity-matcher ─────┤ (C10←C8+C9)
  C11 fetcher-always ─────┤ (C11←C8)
  C12 fetcher-detected ───┤ (C12←C10+C11)
  C13 memory-injection ───┘ (C13←P1.C2)

Phase 3 (技能+编辑器, 6d) ← Phase 1
  C14 writing-skills ─────┐
  C15 conversation-skills ┤ (独立)
  C16 write-button ────────┤ (C16←C14)
  C17 bubble-ai ───────────┤ (C17←C14)
  C18 slash-framework ─────┤ (独立)
  C19 slash-commands ──────┤ (C19←C18)
  C20 inline-diff ─────────┤ (独立)
  C21 shortcuts ───────────┘ (C21←C16+C17)

Phase 4 (叙事记忆, 4d) ← Phase 1+2
  C22 kg-last-seen ──┐
  C23 state-extract ──┤ (C23←C22)
  C24 synopsis-skill ─┤ (独立)
  C25 synopsis-inject ┤ (C25←C24)
  C26 trace-persist ──┘ (独立)

Phase 5 (语义检索, 4d) ← 独立
  C27 onnx-runtime ──┐
  C28 embedding-svc ──┤ (C28←C27)
  C29 hybrid-rag ─────┤ (C29←C28)
  C30 entity-complete ┘ (C30←P2.C8)

Phase 6 (体验, 5d) ← 独立
  C31 i18n-setup ──┐
  C32 i18n-extract ┤ (C32←C31)
  C33 search-panel ┤
  C34 export ──────┤
  C35 zen-mode ────┤
  C36 templates ───┘
```

**并行机会**：Phase 2 和 Phase 3 无互相依赖，可并行。Phase 5 和 Phase 6 也可并行。

---

## Spec 编写策略

- 所有 change 在现有 `openspec/specs/<module>/spec.md` 基础上增加内容，不新建 spec 文件
- 每个 change 创建 `openspec/changes/<change-id>/proposal.md`（delta spec）+ `tasks.md`（TDD 六段式）
- **每个 Phase 的 spec 在该 Phase 开始前编写**，不一次性写完所有 spec
- 当同一 Phase 内有 2+ 活跃 change 时，必须维护 `openspec/changes/EXECUTION_ORDER.md`
```

> 🎯

来源：基于 docs/audit/ 七份审计报告拆解的功能建设路线图，与 Code-Audit（反模式修复）是两个维度的工作。

总实现量：~29d（不含 spec 编写 ~11d） ｜ Phase 1 已完成 ✅

## 架构原则

1. 本地文件系统 > 大上下文窗口 — Electron 桌面应用直接访问项目文件夹，精确注入 + 持久缓存 + 增量索引

1. Codex 引用检测 > 向量 RAG — 写作上下文 80% 是结构化知识，字符串匹配 + KG 查询优先

1. 用户主动触发 > AI 自动弹出 — 续写按钮而非 Ghost Text

1. 流动角色 > 固定助手 — ghostwriter/muse/editor/actor/painter 按任务切换

1. 叙事状态 > 通用偏好 — 记忆是角色状态、伏笔揭示、关系变化

---

## Phase 总览

| Phase | 主题 | Changes | 实现量 | Spec | 累计 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| 1 | AI 可用 | 7 | 5.5d | 2d | 7.5d | ✅ 已完成 |
| 2 | Codex 上下文 | 6 | 4.5d | 2d | 14d | ⭕ 就绪 |
| 3 | 写作技能 + 编辑器 | 8 | 6d | 2.5d | 22.5d | ⏳ 待定 |
| 4 | 叙事记忆 + 摘要 | 5 | 4d | 1.5d | 28d | ⏳ 待定 |
| 5 | 语义检索 | 4 | 4d | 1.5d | 33.5d | ⏳ 待定 |
| 6 | 体验完善 | 6 | 5d | 1.5d | 40d | ⏳ 待定 |
| 合计 |  | 36 | 29d | 11d | ~40d |  |

---

## Phase 1 — AI 可用（7 changes, 5.5d）✅

目标：AI 功能从“不可用”→“基本可用”。用户可在 AI 面板多轮对话，AI 有写作身份。

| # | Change ID | 模块 | 范围 | 工量 | 状态 |
| --- | --- | --- | --- | --- | --- |
| C1 | p1-identity-template | ai-service | 身份提示词模板（5 个 XML 区块） | 0.5d | ✅ #468 |
| C2 | p1-assemble-prompt | ai-service | 分层组装 systemPrompt | 1d | ✅ #477 |
| C3 | p1-chat-skill | skill-system | chat 技能 + 基础意图路由 | 0.5d | ✅ #469 |
| C4 | p1-aistore-messages | ai-service | aiStore 增加 messages 数组 | 0.5d | ✅ #483 |
| C5 | p1-multiturn-assembly | ai-service | 多轮消息组装 + token 裁剪 | 1d | ✅ #486 |
| C6 | p1-apikey-storage | workbench | API Key safeStorage + IPC | 1d | ✅ #470 |
| C7 | p1-ai-settings-ui | workbench | AI 设置面板 UI | 1d | ✅ #476 |

依赖：C2←C1，C4←C2，C5←C4，C7←C6，C3/C6 独立

---

## Phase 2 — Codex 上下文（6 changes, 4.5d）

目标：KG 实体自动注入 AI 上下文——写作场景最关键的上下文来源。

| # | Change ID | 模块 | 范围 | 工量 |
| --- | --- | --- | --- | --- |
| C8 | p2-kg-context-level | knowledge-graph | entity 增加 aiContextLevel  • migration + UI | 0.5d |
| C9 | p2-kg-aliases | knowledge-graph | entity 增加 aliases: string\[\]  • migration + UI | 0.5d |
| C10 | p2-entity-matcher | knowledge-graph | 实体名/别名匹配引擎（100实体×1000字 <10ms） | 1d |
| C11 | p2-fetcher-always | context-engine | rules fetcher: 查询 always 实体并格式化注入 | 0.5d |
| C12 | p2-fetcher-detected | context-engine | retrieved fetcher: 调用匹配引擎，注入 when_detected 实体 | 1d |
| C13 | p2-memory-injection | memory-system | Memory → AI prompt + KG rules → Context | 1d |

依赖：C10←C8+C9，C11←C8，C12←C10+C11，C13←Phase1.C2

---

## Phase 3 — 写作技能 + 编辑器（8 changes, 6d）

目标：核心写作交互——续写按钮、Bubble AI、Slash Command、Inline Diff。

| # | Change ID | 模块 | 范围 | 工量 |
| --- | --- | --- | --- | --- |
| C14 | p3-writing-skills | skill-system | 5 个写作技能 SKILL.md | 0.5d |
| C15 | p3-conversation-skills | skill-system | 3 个对话技能 SKILL.md | 0.5d |
| C16 | p3-write-button | editor | 续写悬浮按钮组 UI + 技能调用 | 1d |
| C17 | p3-bubble-ai | editor | Bubble Menu AI 按钮（润色/改写/描写/对白） | 1d |
| C18 | p3-slash-framework | editor | TipTap Slash Command 扩展框架 | 1d |
| C19 | p3-slash-commands | editor | 写作命令集注册（/续写 /描写 /对白 等） | 0.5d |
| C20 | p3-inline-diff | editor | Inline diff decoration + 接受/拒绝 | 1d |
| C21 | p3-shortcuts | editor | 快捷键系统（Ctrl+Enter 续写等） | 0.5d |

依赖：C16/C17←C14，C19←C18，C21←C16+C17，C15/C20 独立

并行机会：Phase 2 和 Phase 3 无互相依赖，可并行推进。

---

## Phase 4 — 叙事记忆 + 摘要（5 changes, 4d）

目标：长篇小说支撑——角色状态跟踪、章节摘要、trace 持久化。

| # | Change ID | 模块 | 范围 | 工量 |
| --- | --- | --- | --- | --- |
| C22 | p4-kg-last-seen | knowledge-graph | entity 增加 last_seen_state  • migration + UI | 0.5d |
| C23 | p4-state-extraction | knowledge-graph | 章节完成时 LLM 提取角色状态变化 | 1d |
| C24 | p4-synopsis-skill | skill-system | synopsis 技能（200-300 字章节摘要） | 0.5d |
| C25 | p4-synopsis-injection | context-engine | 摘要持久存储 + 续写时注入前几章摘要 | 1d |
| C26 | p4-trace-persistence | memory-system | generation_traces + trace_feedback SQLite | 1d |

依赖：C23←C22，C25←C24，C26 独立

---

## Phase 5 — 语义检索（4 changes, 4d）

目标：Codex 之外的补充检索——非结构化文本语义搜索。

| # | Change ID | 模块 | 范围 | 工量 |
| --- | --- | --- | --- | --- |
| C27 | p5-onnx-runtime | search | ONNX Runtime + bge-small-zh 模型加载 | 1d |
| C28 | p5-embedding-service | search | embedding 服务三级降级：ONNX → API → hash | 1d |
| C29 | p5-hybrid-rag | search | Semantic + FTS hybrid ranking (RRF) | 1d |
| C30 | p5-entity-completion | editor | KG 实体名 ghost text 补全（纯本地） | 1d |

依赖：C28←C27，C29←C28，C30←Phase2.C8

---

## Phase 6 — 体验完善（6 changes, 5d）

目标：产品打磨——i18n、搜索、导出、禅模式、模板。

| # | Change ID | 模块 | 范围 | 工量 |
| --- | --- | --- | --- | --- |
| C31 | p6-i18n-setup | workbench | react-i18next 集成 + locale 结构 | 0.5d |
| C32 | p6-i18n-extract | workbench | 硬编码中文 → locale keys | 1d |
| C33 | p6-search-panel | workbench | 搜索面板 UI（全文 + 结果 + 跳转） | 1d |
| C34 | p6-export | document | Markdown/TXT/DOCX 导出 | 1d |
| C35 | p6-zen-mode | editor | 禅模式（全屏编辑器） | 0.5d |
| C36 | p6-project-templates | project | 项目模板系统（小说/短篇/剧本） | 1d |

依赖：C32←C31，其余独立。Phase 5 和 Phase 6 可并行。

---

## 跨 Phase 依赖关系

| 下游 Phase | 依赖的上游 | 具体依赖点 |
| --- | --- | --- |
| Phase 2 | Phase 1 | C13 依赖 C2（assemblePrompt） |
| Phase 3 | Phase 1 | C14-C21 依赖 AI 基础可用 |
| Phase 4 | Phase 1 + 2 | C23 依赖 KG 实体字段，C25 依赖 context 注入 |
| Phase 5 | Phase 2 | C30 依赖 C8（kg-context-level） |
| Phase 6 | 无 | 完全独立 |

并行机会：

- Phase 2 和 Phase 3 可并行（无互相依赖）

- Phase 5 和 Phase 6 可并行（无互相依赖）

---

## Spec 编写策略

- 所有 change 在现有 openspec/specs/<module>/spec.md 基础上增加，不新建 spec 文件

- 每个 change 创建 openspec/changes/<change-id>/proposal.md + tasks.md

- 每个 Phase 的 spec 在该 Phase 开始前编写，不一次性写完

- 同一 Phase 内有 2+ 活跃 change 时，必须维护 EXECUTION_ORDER.md
