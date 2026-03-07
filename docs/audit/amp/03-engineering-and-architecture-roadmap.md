# CreoNow 工程与架构路线图


> "千里之堤，溃于蚁穴。"——AI 代码最危险的地方，往往不是大错，而是那些用户暂时看不见、上线后却会反复扎手的小洞：静默失败、错误不出声、半成品导出、看似聪明实则脆弱的路由与预算估算。

---

## 文件索引

| § | 章节 | 内容 |
|---|------|------|
| 一 | 底盘强项 | 当前工程体系里已经做对的部分 |
| 二 | 隐性风险总表 | 两个 Amp thread 共同识别的高风险问题 |
| 三 | 架构债主清单 | God Object、Provider、DI、日志等中层问题 |
| 四 | 性能与可靠性 | 自动保存、IPC、长文档、并发、IPC 契约体系、数据安全 |
| 五 | 测试体系重估 | 哪些测试有价值，哪些只是看起来很多；SSOT 与已落地基础设施 |
| 六 | 分阶段治理建议 | 先止血，再重构，再放大能力 |

---

## 一、底盘强项

Amp 的批评很锋利，但也一再确认：CN 并不是工程烂摊子，而是**骨架强、末梢脆**。

### 1.1 已经做对的部分

| 方向 | 当前优势 | 为什么要保护 |
|------|----------|--------------|
| IPC 契约 | typed contract + runtime validation | Electron 项目里少见的扎实底盘 |
| 安全模型 | `contextIsolation`、`sandbox`、`safeStorage` | 不应为了迭代速度破坏 |
| AI 并发治理 | Skill Scheduler 有每会话串行与全局限流 | 后续扩展 AI 交互的可靠基础 |
| Context Engine | 分层装配、预算裁剪、SLO 思维 | 是 CN 的专业度来源 |
| 版本快照与冲突处理 | 自动保存 + 版本回滚 + merge 机制 | 是“创作者的 Git”雏形 |

### 1.2 工程判断

因此，后续治理原则不是“推倒重来”，而是：

1. 保留契约、安全、调度与版本化底盘。
2. 对 AI 代码最脆的“最后一公里”补防御性工程。
3. 把真正拖慢开发与伤害体验的中层结构拆开。

---

## 二、隐性风险总表

这一节是本文件最重要的部分。它们很多不是编译错误，不是 CI 红灯，但会直接伤害上线质量。

> 本节不再使用“🔴 / 🟡 / 🟢”去暗示“有些问题不阻塞”。所有问题都必须做完，区别只在于：先做、再做、后做。

| 问题 | 现象 | 时序 | 处理方向 |
|------|------|------|----------|
| 自动保存收尾使用 `void save(...)` | 切文档/切项目时可能静默失败 | 先做 | 必须让失败可见，加入重试与状态反馈 |
| 渲染进程没有全局 `unhandledrejection/onerror` | async 异常可能只出现在控制台 | 先做 | 增加 renderer 全局错误兜底与日志上报 |
| PDF/DOCX 导出不忠实 | 丢格式、丢图片、路径不透明 | 先做 | v0.1 先诚实降级或明确 Beta |
| 错误消息直接暴露技术内部 | 用户会看到 `DB_ERROR`、`AI_RATE_LIMITED`、`MODEL_NOT_READY` 等技术词语 | 先做 | 建立统一错误展示层，所有用户可见错误都先转译成人话 |
| 文档保存无 5MB 上限 | 超大文档会被直接写入，系统边界与 spec 不一致 | 先做 | 在 `save` 链路实施大小校验与明确提示 |
| Skill 输出几乎无校验 | LLM 异常输出可直接污染正文 | 先做 | 为高频 skill 增加基础 output validation |
| Skill Router 只做关键词 `includes` | 否定语境会误触发技能 | 先做 | 加 negation guard / intent disambiguation |
| 文档并发保存无乐观锁 | 多来源同时保存时后写覆盖先写 | 再做 | 增加 `content_hash` 或版本号 CAS 比较 |
| 偏好学习只认 `accept` | 系统只学喜欢，不学反感 | 再做 | 把 `reject/partial` 纳入权重模型 |
| Editor 实例持有在 store 中 | 若清理不当会泄露 DOM/ProseMirror 状态 | 再做 | 明确 editor 生命周期与清空策略 |
| token 估算使用 `Buffer.byteLength / 4` 粗算（`tokenBudget.ts` L17-19） | 中文字符普遍 3-4 字节/字，实际 token 数可被低估 30-50%；当前无语言识别或校正系数 | 后做 | 引入 tiktoken 计数或对中文场景加保守系数（建议 ×0.6-0.7） |
| `estimatePayloadSize`（位于 `ipcGateway.ts`）全量递归遍历 payload | 长文档自动保存时对主进程产生额外 JSON 序列化压力 | 后做 | 缓存、近似估算或对大文档保存路径绕开泛化型递归 |
| Entity Completion 使用原生全局监听 | 会随状态变化频繁重绑 | 后做 | 迁入统一 hotkey 系统 |
| 无应用级 auto-update 机制 | 桌面版本更新链路缺位 | 后做 | 进入 v0.2+ 计划，但不能失去记账与说明 |

### 2.1 哪些属于首波先做

- 自动保存失败可见化
- 渲染进程全局异常兜底
- 导出能力诚实分级
- 错误消息统一人话化
- 文档保存 5MB 上限
- Skill Router 明显误触修复
- Skill 输出基础校验

### 2.2 哪些属于随后收口

- 中文 token 估算校正
- 偏好学习加入负反馈
- 文档并发保存乐观锁
- IPC payload 估算优化
- editor 实例与扩展生命周期审计

---

## 三、架构债主清单

### 3.1 God Object 问题已进入“继续膨胀就会拖死开发”的阶段

Amp 反复点名的几个文件：

| 文件 | 症状 | 建议拆分方向 |
|------|------|--------------|
| `aiService.ts` | 网络、SSE、provider、重试、取消、限流混在一起 | `SSEReader` / `ProviderStrategy` / `RetryPolicy` / `RunOrchestrator` |
| `AiPanel.tsx` | 输入、输出、diff、error、history、judge 全绑在一个组件里 | `useAiPanel` + 输入区 / 结果区 / 错误区 / 高级区 |
| `AppShell.tsx` | 布局、对话框、导航、禅模式、版本比较等过度汇聚 | `AppShell` 只保布局，弹层/编排交给 orchestration 层 |
| `layerAssemblyService.ts` | 层组装、预算、裁剪、fetcher 汇合过于庞大 | 抽出 budget profile、fetcher orchestration、degradation policy |

### 3.2 Provider 嵌套说明了“组织方式”已经开始反噬

`App.tsx` 的 11 层 Provider 不是立刻会炸的 bug，但它会带来三个长期问题：

1. 新 store 引入成本持续上升。
2. store 之间的依赖关系被藏在树里，而不是明写在架构边界中。
3. 高频状态变化更容易引发不必要的 re-render 与调试困难。

推荐方向：

- 第一阶段先抽 `AppProviders`，把视觉噪音与接线复杂度收口。
- 第二阶段再评估哪些 store 可以切到更轻的注入方式，避免每次都新增 Provider。

### 3.3 缺少统一前端日志服务

Amp 发现大量 `console.error/warn` 分散在 renderer。

风险不在“难看”，而在于：

- 错误没有统一等级与上下文。
- 无法和主进程日志、trace、runId 关联。
- 用户环境里发生的前端故障难以诊断。

建议最小实现：

1. 新建 `renderer/src/lib/logger.ts`。
2. 约定 `info/warn/error` 结构与上下文字段。
3. 关键错误经 IPC 上报主进程日志系统。

### 3.4 轻量 DI 不应再拖

Amp 在第一条 thread 中已指出：主进程 service 数量增多后，手工在 `index.ts` 里拼装所有依赖，会越来越吃力。

不一定要上完整容器框架，但至少应做到：

- 明确 service factory 边界。
- 让依赖图在一个集中位置可追踪。
- 为后续多 provider / 多 backend / 多 AI service 扩展留好位置。

---

## 四、性能与可靠性

### 4.1 自动保存与文档一致性

已有优点：

- `editorSaveQueue` 做了手动保存优先于自动保存。
- 主进程有版本快照与冲突处理。

当前不足：

- 用户几乎不知道自动保存失败了什么。
- 清理阶段的 fire-and-forget 保存不够可观测。

结论：

- 这条链路不是“完全不行”，而是“还没达到写作工具应有的可信度”。

### 4.2 长文档性能

Amp 对长文档的判断非常重要：

- 100 万字符上限是系统级上限，不等于体验上限。
- TipTap 无虚拟化意味着 DOM 与编辑响应会先于硬上限开始退化。
- 粘贴分块、outline debounce、autosave debounce 都是好事，但不意味着长篇场景已经安全。

因此：

1. v0.1 要对“可承载的舒适文档规模”保持诚实。
2. v0.2 应引入更明确的长文档性能基线与 profiling。

### 4.3 IPC 预估开销

`estimatePayloadSize` 的问题不在它“错误”，而在它“太勤快”。

对长文档场景而言：

- 预估一次
- 序列化一次
- 反序列化一次

这意味着同一份大 payload 被多次完整处理。后续应考虑：

- 仅对大 payload channel 做严格预估
- 对已知结构做近似估算
- 对大文档保存路径绕开泛化型递归估算

### 4.4 AI 并发与队列

这一块反而是 CN 的亮点：

- 单会话串行
- 全局并发上限
- cancel / timeout 立即释放资源
- queue 状态可经 IPC 往 UI 传递

真正的问题不是没有机制，而是**UI 是否把排队状态表达得足够清楚**。

### 4.5 应用更新能力缺失

Amp 明确指出目前没有真正的 Electron auto-update。

这不属于首波先做项，但要尽早记账：

- 首发可以靠安装包分发。
- 一旦进入持续迭代，就需要更新通知、版本迁移、失败回滚策略。

### 4.6 IPC 契约体系：已有骨架，缺自动化闭环

当前优势：

- typed contract + runtime validation 已覆盖核心 channel。
- `document-ipc-contract.test.ts` 有手写契约断言。

当前不足：

- 契约定义散落在 handler 与 preload bridge 两侧，缺少**单一真相源**（schema-first）。
- 新增 channel 时，仍依赖开发者手动同步两端类型，无自动生成或 CI 级别的 schema diff 检测。
- `estimatePayloadSize` 仅做体积估算，未与契约 schema 绑定，难以区分"大 payload"与"非法 payload"。

推荐方向：

1. 引入 Zod / io-ts schema 作为单一真相源，从 schema 同时派生 TypeScript 类型与 runtime validator。
2. 增加 CI 级别的 schema 变更检测（类似 API breaking-change guard）。
3. 在测试指南（`docs/references/testing-guide.md`）中补充 IPC 契约测试样板。

### 4.7 数据安全与本地存储

CN 作为桌面端写作工具，用户创作内容全部存储在本地。当前缺少对**静态数据安全**的系统评估。

已有保护：

- `safeStorage` 用于敏感凭证（API Key 等）。
- `contextIsolation` + `sandbox` 阻断了 renderer 直接访问文件系统。

当前盲区：

| 维度 | 现状 | 风险 |
|------|------|------|
| 项目文件 | 明文 JSON/Markdown 存储 | 其他进程/恶意软件可直接读取创作内容 |
| 向量数据库 | 本地嵌入文件，无加密 | 同上 |
| 备份文件 | 路径和格式未知（功能尚未闭环） | 若后续补齐备份，也需要考虑加密 |
| 临时文件 | `.vite-temp` 等编辑器临时缓存 | 清理策略不明确，可能残留敏感内容 |

推荐分级：

- **v0.1**：在发布事实表中诚实说明"创作内容以明文形式存储在本地文件系统"，不做虚假安全承诺。
- **v0.2**：评估 SQLCipher / 加密 FS 层的可行性，至少对 KG 和 Memory 存储做加密。
- **长期**：提供用户可选的"工作区加密"选项，类似 1Password vault 模型。

### 4.8 错误体验与信息脱敏

当前最不优雅、也最伤信任的地方，不是“报错”本身，而是**报错说的不是人话**。

已经确认的问题：

- renderer 至少 15 处直接展示 `error.code` 或 `error.message`。
- `errorMessages.ts` 仅覆盖 6 个错误码，未覆盖时会直接透传后端原始 message。
- `ErrorBoundary` 与 `RegionFallback` 会把 `error.name`、`error.message` 甚至 component stack 暴露给普通用户。

这会带来三个问题：

1. 用户被迫理解内部实现名词，如 `DB_ERROR`、`AI_RATE_LIMITED`、`MODEL_NOT_READY`。
2. 后端设计细节通过错误文案反向泄露到前台。
3. 用户不知道“发生了什么”与“接下来该怎么办”，只知道“系统在说我听不懂的话”。

推荐方向：

1. 建立统一的 `getUserFacingErrorMessage()` 入口，所有用户可见错误必须先走转译。
2. 将未命中的 fallback 改为通用文案，而不是直接透传原始 `error.message`。
3. `ErrorBoundary` 默认只给用户展示摘要，把技术详情折叠到可展开区域。

---

## 五、测试体系重估

Amp 对测试的批评，不是“测试不多”，而是“测试很多，但有一部分价值不高”。

> **注**：仓库已建立测试规范主源（SSOT），位于 `docs/references/testing-guide.md`，覆盖理念、决策树、前后端模式、E2E、Guard/Lint、CI 映射与迁移手册。以下仅保留 Amp 原始诊断与路线图层面的战略判断，具体写法规范以 SSOT 为准。

### 5.1 当前问题

| 问题 | 表现 |
|------|------|
| 测试数量多但浅 | 大量是 existence / render / raw string guard |
| 过度 mock | store 间真实协作未被充分覆盖 |
| 守卫型测试膨胀 | 很多本应由 lint 或静态规则承担 |
| 关键用户流仍不足 | 写作、AI、导出、失败恢复等链路比存在性更重要 |

### 5.2 应保留与加强的测试

- 真正的行为测试
- Windows E2E
- 编辑器与 AI 协作链路测试
- 版本恢复与冲突处理测试
- 自动保存失败与重试的用户可见性测试

### 5.3 应逐步迁移的测试

- 纯字符串扫描型 guard
- 过度碎片化的存在性测试
- 与 lint / static contract 重叠的检查

### 5.4 测试策略的正确方向

从：

> “确认代码里有这个东西”

转向：

> “确认用户真的能顺利完成这个动作，且失败时知道发生了什么”

### 5.5 已落地的测试治理基础设施

| 设施 | 位置 | 作用 |
|------|------|------|
| 测试 SSOT | `docs/references/testing-guide.md` | 测试写法规范主源 |
| `test-discovery-consistency` | CI 阻断门禁 | 确保所有测试文件被 vitest 发现 |
| `format-check` | CI 阻断门禁 | Prettier 格式统一 |
| IPC 契约测试样板 | `document-ipc-contract.test.ts` | 已迁移为 describe/it 结构 |

后续还应补充：

- Spec ↔ 测试映射审计（确保每个 spec scenario 都有对应测试）。
- 覆盖率门禁从“仅报告”升级为“增量阻断”。
- IPC schema-first 契约自动生成与 breaking-change 检测。

---

## 六、分阶段治理建议

### 6.1 先止血

- 自动保存失败可见化
- renderer 全局异常兜底
- 导出能力诚实分级
- Skill Router 否定语境处理
- 发布事实表中诚实说明本地存储安全边界

### 6.2 再整理结构

- `AppProviders`
- `AiPanel.tsx` 首拆
- `aiService.ts` provider/stream/retry 抽层
- 统一前端日志

### 6.3 再做精度提升

- token 估算更贴近中文（tiktoken 或校正系数）
- 偏好学习负反馈机制
- IPC payload 估算优化
- IPC schema-first 契约自动生成与 breaking-change 门禁
- editor lifecycle / extension lifecycle 审计
- KG / Memory 存储加密评估

### 6.4 最后放大优势

- 把 KG / Memory / Context Engine 与 UX 深度绑定
- 用可见的体验，而不是文档描述，来证明这些系统的价值

---

> 工程层的关键词不是“更复杂”，而是“更诚实、更稳、更易演化”。AI 写出来的代码可以很快抵达“功能完成”，但要进入“可发布、可维护、可信赖”的层次，必须补上那些不会自动长出来的东西：防御性工程、错误显性化、真实用户流测试，以及能承托未来扩展的结构边界。
