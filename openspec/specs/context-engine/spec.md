# Context Engine Specification


## Purpose

分层上下文管理（Rules / Settings / Retrieved / Immediate），Token 预算分配与裁剪，Stable prefix hash 支持 prompt caching。

### Scope

| Layer   | Path                                                     |
| ------- | -------------------------------------------------------- |
| Backend | `main/src/services/context/`                             |
| IPC     | `main/src/ipc/context.ts`, `main/src/ipc/constraints.ts` |

## Requirements

### Requirement: 四层上下文架构

系统**必须**实现四层上下文架构，每层有独立的数据来源、优先级和 token 预算。

```
┌───────────────────────────────────────────────────┐
│                   AI Prompt                        │
│                                                    │
│  ┌─────────────┐  最高优先级，不可裁剪              │
│  │ Rules 层     │  创作规则、知识图谱设定            │
│  └─────────────┘                                   │
│  ┌─────────────┐  高优先级，用户偏好                │
│  │ Settings 层  │  语义记忆规则、叙述人称、风格设定   │
│  └─────────────┘                                   │
│  ┌─────────────┐  中优先级，可裁剪                  │
│  │ Retrieved 层 │  RAG 召回片段、情景记忆参考        │
│  └─────────────┘                                   │
│  ┌─────────────┐  最低优先级（但必须包含）           │
│  │ Immediate 层 │  当前章节上下文、工作记忆          │
│  └─────────────┘                                   │
└───────────────────────────────────────────────────┘
```

各层定义：

| 层级      | 数据来源                               | 优先级 | 可裁剪   | 典型内容                         |
| --------- | -------------------------------------- | ------ | -------- | -------------------------------- |
| Rules     | 项目设定、知识图谱、用户显式创作规则   | 最高   | 否       | 叙述人称、角色设定、世界观约束   |
| Settings  | 语义记忆（自动学习的偏好）、项目配置   | 高     | 部分     | 写作风格偏好、场景偏好、词汇偏好 |
| Retrieved | RAG 召回片段、情景记忆案例             | 中     | 是       | 前文相关段落、历史交互参考       |
| Immediate | 当前章节内容、光标位置前后文、工作记忆 | 必须   | 尾部裁剪 | 当前编辑的即时上下文             |

组装顺序：Rules → Settings → Retrieved → Immediate。当总 token 超出预算时，按优先级**从低到高**裁剪。

#### Scenario: 四层上下文正常组装

- **假设** 用户在第十章触发续写，项目有完整的知识图谱和语义记忆
- **当** Context Engine 组装 AI 上下文
- **则** Rules 层注入：叙述人称「第一人称」、角色「林远」设定
- **并且** Settings 层注入：语义记忆规则「动作场景偏好短句」
- **并且** Retrieved 层注入：RAG 召回的前文相关段落
- **并且** Immediate 层注入：当前章节光标前 2000 tokens 内容
- **并且** 四层按顺序拼接为完整 prompt

#### Scenario: 新项目——Rules 和 Settings 为空

- **假设** 用户刚创建项目，未设定任何创作规则，也没有语义记忆
- **当** Context Engine 组装 AI 上下文
- **则** Rules 层为空（仅有基础 system prompt）
- **并且** Settings 层为空
- **并且** Retrieved 层为空（无历史内容可召回）
- **并且** Immediate 层包含当前编辑的内容
- **并且** AI 以通用模式生成，功能正常

---

### Requirement: Token 预算管理

系统**必须**实现严格的 Token 预算管理，确保组装后的 prompt 不超过模型的上下文窗口限制。

预算分配策略：

| 层级      | 默认预算比例 | 最小保障    | 裁剪策略                       |
| --------- | ------------ | ----------- | ------------------------------ |
| Rules     | 15%          | 500 tokens  | 不裁剪（超出时报警）           |
| Settings  | 10%          | 200 tokens  | 按 confidence 降序保留         |
| Retrieved | 25%          | 0 tokens    | 按相似度得分降序截断           |
| Immediate | 50%          | 2000 tokens | 尾部裁剪（保留光标前最近内容） |

总预算 = 模型上下文窗口 - system prompt tokens - 输出预留 tokens。

预算计算流程：

1. 计算各层实际 token 数
2. 若总量 ≤ 预算，不裁剪
3. 若总量 > 预算，按优先级从低到高依次裁剪：Retrieved → Settings → Immediate（尾部）
4. Rules 层**不可裁剪**——若 Rules 单独超出总预算 15%，记录警告日志

Token 计算**必须**使用与目标 LLM 一致的 tokenizer（如 tiktoken）。

预算管理的 IPC 通道：

| IPC 通道                | 通信模式         | 方向            | 用途             |
| ----------------------- | ---------------- | --------------- | ---------------- |
| `context:budget:get`    | Request-Response | Renderer → Main | 获取当前预算分配 |
| `context:budget:update` | Request-Response | Renderer → Main | 更新预算配置     |

#### Scenario: Token 预算内——不裁剪

- **假设** 模型上下文窗口 8K tokens，总预算 6K tokens
- **当** 四层内容总计 5500 tokens
- **则** 所有内容完整注入，不执行裁剪

#### Scenario: Token 超出预算——裁剪 Retrieved 层

- **假设** 总预算 6K tokens，当前四层总计 7500 tokens（Retrieved 占 2500）
- **当** Context Engine 执行裁剪
- **则** 先裁剪 Retrieved 层：按相似度得分降序，移除低分 chunk 直到总量 ≤ 6K
- **并且** Rules、Settings、Immediate 层保持完整

#### Scenario: 极端场景——Rules 层单独超出预算

- **假设** 项目知识图谱包含 100 个角色实体，Rules 层 token 数达到 2000（超出 15% 预算线）
- **当** Context Engine 检测到 Rules 层超标
- **则** 记录警告日志 `CONTEXT_RULES_OVERBUDGET`
- **并且** Rules 层仅注入与当前编辑内容最相关的实体（按语义相关度筛选）
- **并且** 其他层正常裁剪

---

### Requirement: Stable Prefix Hash（prompt caching 支持）

系统**必须**通过 Stable Prefix Hash 机制支持 LLM 的 prompt caching，减少重复计算成本。

Stable Prefix 定义：prompt 中**不随每次请求变化**的前缀部分，通常包括 Rules 层和 Settings 层。

实现策略：

1. 每次组装 prompt 时，计算 Rules + Settings 层内容的 SHA-256 hash
2. 若 hash 与上次请求相同，标记 `stablePrefixUnchanged: true`
3. AI Service 层根据此标记决定是否启用 prompt caching（如 Anthropic 的 cache_control）

hash 计算**必须**确定性——相同输入**必须**产生相同 hash，不受时间戳等变量影响。

#### Scenario: 连续续写——Stable Prefix 命中缓存

- **假设** 用户连续触发 3 次续写，期间 Rules 和 Settings 层未变化
- **当** 第 2 次和第 3 次请求组装 prompt
- **则** Stable Prefix hash 与前次相同
- **并且** AI Service 标记 `stablePrefixUnchanged: true`，启用 prompt caching
- **并且** 仅 Retrieved + Immediate 层的变化部分需要重新计算

#### Scenario: Settings 变更导致缓存失效

- **假设** 用户在记忆面板中确认了一条新的语义记忆规则
- **当** 下次续写请求组装 prompt
- **则** Settings 层内容变化，Stable Prefix hash 改变
- **并且** prompt caching 失效，全量重新计算

---

### Requirement: projectScopedCache 必须实现 singleflight 去重

`projectScopedCache.ts` 的 `getOrComputeString()` 在 cache miss 时调用 `compute()`。并发请求同一 key **必须**通过 Promise-based singleflight 模式去重，确保同一 key 仅触发一次计算。

#### Scenario: AUD-C1-S6 同 key 并发请求仅触发一次计算

- **假设** 缓存中不存在 key K1，`compute(K1)` 耗时 100ms
- **当** 3 个并发的 `getOrComputeString(K1)` 同时到达
- **则** `compute(K1)` 仅被调用 1 次
- **并且** 3 个调用者均获得相同的计算结果

#### Scenario: AUD-C1-S7 不同 key 的并发请求互不阻塞

- **假设** 缓存中不存在 key K1 和 K2
- **当** `getOrComputeString(K1)` 和 `getOrComputeString(K2)` 并发执行
- **则** `compute(K1)` 和 `compute(K2)` 各自独立执行，互不阻塞
- **并且** 两个结果分别正确缓存

#### Scenario: AUD-C1-S8 singleflight 中 compute 失败不缓存错误

- **假设** 缓存中不存在 key K1，`compute(K1)` 将抛出异常
- **当** 2 个并发的 `getOrComputeString(K1)` 同时到达
- **则** 两个调用者均收到异常
- **并且** 失败结果不被缓存，后续请求可重新触发计算

---

### Requirement: Constraints（创作约束）

系统**必须**支持用户定义显式创作约束（Constraints），约束注入 Rules 层，具有最高优先级。

约束类型：

| 约束类型   | 示例                                         | 来源                |
| ---------- | -------------------------------------------- | ------------------- |
| 叙述约束   | 「严格第一人称叙述，不出现主角不在场的场景」 | 项目设定            |
| 角色约束   | 「林远性格冷静，不会大声喊叫」               | 知识图谱            |
| 世界观约束 | 「本世界没有魔法，所有能力基于科技」         | 用户显式设定        |
| 风格约束   | 「避免使用感叹号和省略号」                   | 语义记忆 / 用户手动 |
| 情节约束   | 「主角在第五章之前不知道真相」               | 用户显式设定        |

约束管理通过以下 IPC 通道完成：

| IPC 通道             | 通信模式         | 方向            | 用途         |
| -------------------- | ---------------- | --------------- | ------------ |
| `constraints:list`   | Request-Response | Renderer → Main | 列出当前约束 |
| `constraints:create` | Request-Response | Renderer → Main | 创建约束     |
| `constraints:update` | Request-Response | Renderer → Main | 更新约束     |
| `constraints:delete` | Request-Response | Renderer → Main | 删除约束     |

约束在 Rules 层中的注入格式：

```
[创作约束 - 不可违反]
1. 严格第一人称叙述
2. 林远性格冷静，不会大声喊叫
3. 本世界没有魔法
```

#### Scenario: 用户添加创作约束

- **假设** 用户打开项目设置的「创作约束」区域
- **当** 用户添加约束「主角在第五章之前不知道真相」
- **则** 系统通过 `constraints:create` 持久化
- **并且** 后续所有 AI 生成的 prompt 中 Rules 层包含此约束

#### Scenario: AI 生成违反约束时的处理

- **假设** Rules 层包含约束「严格第一人称叙述」
- **当** AI 生成内容中出现第三人称叙述
- **则** Judge 模块（AI Service）检测到约束违反
- **并且** 系统自动重新生成或在 AI 面板中标注违规提示

#### Scenario: 约束过多导致 Rules 层膨胀

- **假设** 用户添加了 30 条约束，加上知识图谱设定，Rules 层达到 3000 tokens
- **当** Context Engine 组装 prompt
- **则** 系统记录警告 `CONTEXT_RULES_OVERBUDGET`
- **并且** 按约束优先级（用户显式 > 知识图谱自动）裁剪低优先级约束
- **并且** 被裁剪的约束记录到日志

---

### Requirement: 上下文组装 API

Context Engine**必须**提供统一的上下文组装 API，供 AI Service 调用。

API 签名：

```typescript
interface ContextAssembleRequest {
  projectId: string;
  documentId: string;
  cursorPosition: number;
  skillId: string;
  additionalInput?: string; // 用户的额外指令
}

interface ContextAssembleResult {
  prompt: string; // 组装后的完整 prompt
  tokenCount: number; // 实际 token 数
  stablePrefixHash: string; // Stable Prefix hash
  stablePrefixUnchanged: boolean;
  layers: {
    rules: { tokens: number; truncated: boolean };
    settings: { tokens: number; truncated: boolean };
    retrieved: { tokens: number; truncated: boolean; chunks: number };
    immediate: { tokens: number; truncated: boolean };
  };
  warnings: string[]; // 裁剪警告等
}
```

组装过程的 IPC 通道：

| IPC 通道           | 通信模式         | 方向            | 用途           |
| ------------------ | ---------------- | --------------- | -------------- |
| `context:assemble` | Request-Response | Renderer → Main | 组装上下文     |
| `context:inspect`  | Request-Response | Renderer → Main | 检查上下文详情 |

`context:inspect` 用于调试——返回各层的详细内容和 token 分布，不注入 prompt。

#### Scenario: AI 技能调用时组装上下文

- **假设** 用户在第七章触发续写技能
- **当** AI Service 调用 `context:assemble`
- **则** Context Engine 按层级组装 prompt
- **并且** 返回 `ContextAssembleResult`，包含各层 token 分布
- **并且** AI Service 使用组装后的 prompt 调用 LLM

#### Scenario: 上下文组装中某层数据源不可用

- **假设** 知识图谱服务暂时不可用
- **当** Context Engine 尝试组装 Rules 层中的 KG 数据
- **则** KG 部分跳过，Rules 层仅包含用户显式约束
- **并且** `warnings` 数组中记录 `"KG_UNAVAILABLE: 知识图谱数据未注入"`
- **并且** 组装继续，不中断

---

### Requirement: 项目解绑必须清理 Context Engine 的 project-scoped cache/watcher

Context Engine 中与项目绑定的资源（project-scoped cache、watcher/订阅等）**必须**在项目切换的 unbind 阶段完成释放，避免跨项目污染、句柄泄漏或残留事件流。

- unbind 完成后，不得继续接收或处理来自旧项目的事件。
- 清理行为必须可被自动化测试验证。

#### Scenario: BE-SLA-S4 项目解绑时清理 project-scoped cache/watcher

- **假设** 项目 A 运行期间创建了 project-scoped 缓存与文件 watcher/订阅
- **当** 项目 A 被切换离开并执行 unbind
- **则** 缓存与 watcher/订阅 被释放/清空
- **并且** 不再继续接收来自项目 A 的事件或占用文件句柄

---

### Requirement: 模块级可验收标准（适用于本模块全部 Requirement）

- 量化阈值：
  - `context:assemble` p95 < 250ms
  - token 预算计算 p95 < 80ms
  - `context:inspect` p95 < 180ms
- 边界与类型安全：
  - `TypeScript strict` + zod
  - 上下文层数据必须携带 `source` 和 `tokenCount`
- 失败处理策略：
  - 某层不可用时降级继续组装并返回 `warnings`
  - 预算计算失败时回退默认预算并返回 `CONTEXT_BUDGET_FALLBACK`
  - 所有异常必须显式错误码
- Owner 决策边界：
  - 四层优先级、不可裁剪策略、预算默认比例由 Owner 固定
  - Agent 不可更改层优先级顺序

#### Scenario: 组装性能与预算一致性达标

- **假设** 同时执行 500 次 `context:assemble`
- **当** 包含 Rules/Settings/Retrieved/Immediate 四层
- **则** p95 小于 250ms
- **并且** 结果 tokenCount 不超过目标预算

#### Scenario: 预算计算器异常自动回退

- **假设** tokenizer 组件返回异常
- **当** 组装上下文
- **则** 系统回退到默认 budget profile
- **并且** `warnings` 包含 `CONTEXT_BUDGET_FALLBACK`

---

### Requirement: 异常与边界覆盖矩阵

| 类别         | 最低覆盖要求                             |
| ------------ | ---------------------------------------- |
| 网络/IO 失败 | 检索层读取失败、记忆层读取失败           |
| 数据异常     | 层数据格式非法、token 统计为负值         |
| 并发冲突     | 并发组装同文档不同光标、并发更新预算配置 |
| 容量溢出     | 单层 token 爆炸、总预算溢出              |
| 权限/安全    | 跨项目上下文注入、未授权 inspect         |

#### Scenario: 并发更新预算配置的版本校验

- **假设** 两个请求同时更新预算比例
- **当** 后到请求提交旧版本号
- **则** 返回 `CONTEXT_BUDGET_CONFLICT`
- **并且** 不覆盖先到请求配置

#### Scenario: 跨项目上下文注入被阻断

- **假设** 请求携带 `projectId=A` 但 Retrieved 数据来自 `projectId=B`
- **当** 组装执行
- **则** 系统拒绝注入并返回 `CONTEXT_SCOPE_VIOLATION`
- **并且** 记录安全日志

---

### Non-Functional Requirements

**Performance**

- `context:assemble`：p50 < 120ms，p95 < 250ms，p99 < 500ms
- 预算计算：p50 < 30ms，p95 < 80ms，p99 < 150ms
- hash 计算：p95 < 20ms

**Capacity**

- 单次组装最大 token 输入：64k
- Retrieved chunk 上限：200
- Rules 约束条目上限：500

**Security & Privacy**

- 上下文日志默认只记录摘要与 hash，不记录全文
- `context:inspect` 仅限调试模式与授权用户
- 所有层输入必须按 `projectId` 隔离

**Concurrency**

- 同文档并发组装最大 4
- 预算配置更新需乐观锁版本号
- 超限请求返回 `CONTEXT_BACKPRESSURE`

#### Scenario: 超大上下文输入保护

- **假设** 输入 token 预估为 90k
- **当** 触发组装
- **则** 系统返回 `CONTEXT_INPUT_TOO_LARGE`
- **并且** 提示用户缩小检索范围

#### Scenario: 并发组装背压

- **假设** 同时有 20 个组装请求
- **当** 超过并发上限 4
- **则** 后续请求排队或返回 `CONTEXT_BACKPRESSURE`
- **并且** 已运行请求不超时
