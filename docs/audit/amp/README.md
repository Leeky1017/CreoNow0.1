# Amp 路线图专题索引

更新时间：2026-03-06 22:55

> "善弈者谋势，不善弈者谋子。"——这组文档不是零散建议的堆砌，而是把 Amp 两个长 thread 的判断、证据、路线图与后续行动，收束成一套可以持续执行的北极星文件。

---

## 文件索引

| § | 章节 | 内容 |
|---|------|------|
| 一 | 来源线程 | 本专题整理所依据的 Amp threads |
| 二 | 采集说明 | `amp threads continue` / `amp threads markdown` 的处理方式 |
| 三 | 阅读顺序 | 建议阅读路径 |
| 四 | 文档清单 | 各文件分工 |
| 五 | 总体判断 | 本轮综合整理后的核心结论 |
| 六 | GitHub 执行入口 | 4 条母 Issue 与 Amp 路线图的映射关系 |
| 七 | 维护约定 | 后续如何持续更新本专题 |

---

## 一、来源线程

| 来源 | Thread ID | 角色 |
|------|-----------|------|
| `CreoNow AI Native IDE shortcomings analysis` | `T-019cbe1a-9ad6-744a-a6e3-f3c50a2d843a` | 第一轮总诊断：工程、前端、后端、产品定位与优先级总览 |
| `CreoNow v0.1 code review and UX improvements` | `T-019cbe6f-4ccd-71ae-b356-dfa05c86b450` | 第二轮深化：发布必修项、隐藏风险、Magic Moment、工程债与 V Next 方向 |

---

## 二、采集说明

1. 已按要求在终端执行 `amp threads continue T-019cbe1a-9ad6-744a-a6e3-f3c50a2d843a` 与 `amp threads continue T-019cbe6f-4ccd-71ae-b356-dfa05c86b450`。
2. 两次 `continue` 均遭遇 Amp 网络超时，无法稳定通过远端继续线程。
3. 随后改用本地缓存与 `amp threads markdown` 导出完整对话历史，再对两份 thread 进行人工归并、去重、重排和增强撰写。
4. 因此，本专题既保留了 Amp 原始判断的骨架，也加入了更适合 CreoNow 后续开发治理的结构化整理，不是原样照抄。

---

## 三、阅读顺序

1. 先读 `01-master-roadmap.md`，建立整体判断、阶段目标和发布边界。
2. 再读 `02-product-and-experience-roadmap.md`，明确 v0.1 到底先修什么体验问题、先交付什么惊艳时刻。
3. 接着读 `03-engineering-and-architecture-roadmap.md`，理解哪些风险是用户暂时看不见、但一上线就会炸的。
4. 然后读 `04-moats-and-v-next.md`，决定哪些能力属于 CN 的真正护城河，应该如何被用户看见。
5. 接着读 `07-ui-ux-design-audit.md`，掌握用户肉眼可见的每一处视觉/交互断点。
6. 再读 `08-backend-module-health-audit.md`，逐模块掌握后端功能性健全程度与边缘场景缺口。
7. 再读 `09-error-ux-audit.md`，了解错误消息对用户体验的全面伤害及修复方案。
8. 最后以 `05-implementation-backlog.md` 作为执行面板，把路线图压成阶段、任务、依赖与验收。

---

## 四、文档清单

| 文件 | 作用 | 适合谁读 |
|------|------|----------|
| `docs/audit/amp/01-master-roadmap.md` | 总路线图、阶段划分、发布边界、依赖关系 | Owner、主导 Agent |
| `docs/audit/amp/02-product-and-experience-roadmap.md` | 首次体验、写作流、AI 交互、发现性、功能缺口 | 产品、前端、设计 |
| `docs/audit/amp/03-engineering-and-architecture-roadmap.md` | 隐性风险、架构债、性能、IPC 契约体系、数据安全、测试策略（含 SSOT 引用） | 前后端、审计 Agent |
| `docs/audit/amp/04-moats-and-v-next.md` | 护城河显化、差异化能力、V Next 增长方向 | 产品、Founder |
| `docs/audit/amp/05-implementation-backlog.md` | v0.1 完全体 backlog：分阶段任务表（含 i18n/搜索/数据安全/Inline AI 新建）、依赖、验收 | 执行 Agent、项目管理 |
| `docs/audit/amp/07-ui-ux-design-audit.md` | 前端视觉/交互设计完整度审查：假 UI 清单、i18n 遗漏、交互断线、组件级体感判断 | 前端、设计、产品 |
| `docs/audit/amp/08-backend-module-health-audit.md` | 后端 20+ 模块逐一健康度审查：功能现状、边缘缺口、代码证据、时序分级 | 后端、审计 Agent |
| `docs/audit/amp/09-error-ux-audit.md` | 错误体验审查：15+ 处错误码暴露、基础设施分析、全量错误码人话映射表、修复方案 | 前端、产品、全栈 |
| `docs/audit/amp/06-windows-release-readiness.md` | Win 首发就绪度、WSL 本地运行依赖、签名/更新/备份/崩溃可观测性、数据安全与本地存储评估 | Founder、发布负责人、桌面端 Agent |

---

## 五、总体判断（v0.1 完全体定位）

本专题经过三轮审查——Amp 原始诊断 + 代码级交叉验证 + 后端深度边缘场景审查——已升级为 **v0.1 完全体路线图**，不再仅是方向性建议，而是覆盖了发布前必须处理的**全量问题域**。

> **核心原则**：所有问题都必须解决，区别仅在先做还是后做。不存在"🟡 中风险、不阻塞 v0.1"这种说法。要么不做，要么做好。

### 核心判断

- CreoNow 的问题不在底层能力贫弱，而在于**强内核没有被转译成强体验**。Context Engine、Knowledge Graph、Memory、Skill System 都已经很强，但用户能直接感到的魔法时刻还不够密。
- v0.1 的首要任务不是继续加概念，而是**让核心承诺不说谎**。不能编辑的禅模式、**尚未实现的 Inline AI**（`Cmd/Ctrl+K` 当前无绑定）、导出能力的“半成品承诺”、静默失败的自动保存，都比新功能更优先。
- 当前最值钱的不是“再多一个功能点”，而是把写作主路径从“工具可用”提升到“创作流顺手”。这要求把 AI **从 0 到 1 做出** Inline AI 快捷路径，把 KG/Memory 从后端深处搬到用户眼前。
- 工程层面最危险的不是看得见的 TypeScript 报错，而是**AI 代码常见的防御性工程缺失**：静默丢数据、错误只进控制台、不完整导出、脆弱关键词路由、乐观而失真的 token 估算（`Buffer.byteLength / 4`，中文可低估 30-50%）。
- 如果 CN 以 Windows 为首发主平台，还需要补一条此前未单独成文的主线：**Windows 首发就绪度**。它涉及签名、升级、原生模块打包、Windows 键盘稳定性、崩溃可观测性以及“备份”等对外承诺是否真实。

### 本轮新增的完全体补丁

| 维度 | 补进了什么 | 对应文件 |
|------|-----------|----------|
| Inline AI 实现现状 | 勘误为“从 0 到 1 新建”，非改造 | 01, 02, 05 |
| token 估算机制 | 勘误 `Buffer.byteLength / 4` 具体行为与中文偏差 | 03 |
| `estimatePayloadSize` 位置 | 勘误为 `ipcGateway.ts` | 03 |
| IPC 契约体系 | 补 schema-first + CI 门禁方向 | 03, 05 |
| 数据安全 | 补本地存储安全评估与分级建议 | 03, 05, 06 |
| 搜索 / RAG | 补全文搜索 MVP + 语义搜索演进 | 01, 02, 04, 05 |
| i18n 覆盖率 | 补存量核查 + 增量门禁 | 01, 02, 05 |
| 版本控制覆盖度 | 补多文档/跨项目级别尚未闭环的说明 | 01, 04 |
| 测试 SSOT | 引用仓库已建成的测试规范主源 | 03 |
| UI/UX 设计完整度 | 代码级审查：假 UI 清单、i18n 遗漏、交互断线、组件体感 | 07（新增） |
| 后端模块健康度 | 20+ 模块逐一审查：边缘场景、未实现 spec、代码证据 | 08（新增） |
| 错误体验 | 15+ 处错误码暴露用户、全量人话映射表、统一错误展示层方案 | 09（新增） |

### 执行总线

`先修真实承诺（Phase 0 含 Inline AI 新建 + i18n 核查 + 搜索 MVP + 数据安全声明 + 错误消息人话化 + 后端假功能收口）-> 再做 Magic Moment -> 再拆工程债 -> 最后放大护城河`。

---

## 六、GitHub 执行入口（2026-03-06 重构）

为避免 OpenClaw / Asuka / Checa 历史 issue 在 GitHub 中碎片化悬挂，本专题已把相关后端治理问题收束为 4 条 **母 Issue**。

它们的作用不是替代 Amp 文档，而是把 Amp 已识别的工程风险，转译成 GitHub 上可以持续推进、持续验收、持续归档的执行容器。

| 母 Issue | 主题 | 吸收的历史问题簇 | 对应 Amp 文档 / 任务锚点 |
|---|---|---|---|
| [#1007](https://github.com/Leeky1017/CreoNow/issues/1007) | `project/session boundary hardening` | `file/search/context/embedding/rag/constraints` 的跨项目越权、`inspect` 可信角色、`about:blank` ACL | `01-master-roadmap.md` 的首发可信度问题；`03-engineering-and-architecture-roadmap.md` 的 IPC / 安全边界；`05-implementation-backlog.md` 的跨阶段后端治理容器 |
| [#1008](https://github.com/Leeky1017/CreoNow/issues/1008) | `preload ipcGateway + runtime validation hardening` | structured-clone 语义、`toJSON` / getter 副作用、payload 估算、timeout / abort、运行时枚举校验 | `03-engineering-and-architecture-roadmap.md` 的 payload / 契约风险；`05-implementation-backlog.md` 的 `A2-05`、`A2-06S`、`A2-20` |
| [#1009](https://github.com/Leeky1017/CreoNow/issues/1009) | `shared redaction hardening` | GitHub token、AWS key/secret、Unix/WSL/temp path、路径边界误匹配 | `01-master-roadmap.md` 的发布可信度；`03-engineering-and-architecture-roadmap.md` 的信息脱敏；与 `A1-18/A1-20` 相邻但不等同 |
| [#1010](https://github.com/Leeky1017/CreoNow/issues/1010) | `CI / discovery / toolchain hardening` | `tsx` 受限环境、`scripts/tests/*.py` / shared tests discovery、readonly contract check、benchmark 标签真实性 | `03-engineering-and-architecture-roadmap.md` 的 `test-discovery-consistency` / schema-first gate；`05-implementation-backlog.md` 的工程门禁线 |

### 为什么要这样映射

- **Amp 文档**回答的是：为什么这条线重要、它在 v0.1 / v0.2 的全局路线里处于什么位置。
- **GitHub 母 Issue**回答的是：这条线在执行面如何排队、如何验收、如何把旧审计证据单点归档。

因此：

- 旧 tagged issue 关闭，不代表风险消失；
- 它只意味着“碎片化入口被撤销，主脉被保留”。

截至本次重构后，GitHub 上与本专题对应的 open 执行入口，应以这 4 条母 Issue 为准。

---

## 七、维护约定

- 本专题是后续 CN 开发的重点指引之一；凡是采纳其中路线、验收标准、里程碑，必须同步更新时间戳。
- 若未来新增第三轮或第四轮 Amp 诊断，建议先更新 `01-master-roadmap.md` 的总判断，再按需要增补专题文件，而不是直接散写新长文。
- 若某条建议被明确放弃，应在对应文件中标注“已弃用/延后”的原因，避免下一位 Agent 再次把同一问题当成未决事项。
- 若执行过程中发现与 OpenSpec 或现有审计文档冲突，以“是否改善真实用户体验、是否降低发布风险”为第一判据，再回写治理文档。
